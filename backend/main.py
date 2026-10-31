import base64
import io
import os
import secrets
import sqlite3
import time
import traceback
import uuid

import cv2
import numpy as np
import torch
import torch.nn as nn
import torch.nn.functional as F
from fastapi import FastAPI, File, Header, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse
from PIL import Image, ImageDraw, ImageFont
from pydantic import BaseModel
from torchvision import models, transforms



MODEL_PATH = "pneumonia_3class_mobilenetv2.pt"
IMG_SIZE = 160
DEVICE = torch.device("cuda" if torch.cuda.is_available() else "cpu")
MEAN = [0.485, 0.456, 0.406]
STD = [0.229, 0.224, 0.225]
CLASS_NAMES = ["BACTERIA", "NORMAL", "VIRUS"]
NUM_CLASSES = 3

FRONTEND_KEY = {"BACTERIA": "bacteria", "NORMAL": "normal", "VIRUS": "virus"}

PATIENT_EXPLANATION = {
    "BACTERIA": "Bacterial pneumonia often shows denser, patchy white areas on X-ray.",
    "VIRUS": "Viral pneumonia often shows hazier, more spread-out patterns on X-ray.",
    "NORMAL": "No unusual patterns found — the lungs appear clear.",
}


def build_model():
    model = models.mobilenet_v2(weights=None)
    model.classifier = nn.Sequential(
        nn.Dropout(0.3),
        nn.Linear(model.last_channel, 128),
        nn.ReLU(),
        nn.Dropout(0.2),
        nn.Linear(128, NUM_CLASSES),
    )
    return model


_model = None


def get_model():
    global _model
    if _model is None:
        m = build_model()
        state_dict = torch.load(MODEL_PATH, map_location=DEVICE)
        m.load_state_dict(state_dict)
        m.eval()
        _model = m.to(DEVICE)
    return _model

ENSEMBLE_NAMES = ["efficientnet_b0", "densenet121", "mobilenet_v2"]
ENSEMBLE_IMG_SIZE = 224
CONF_THRESHOLD = 0.6     


def _build_ensemble_member(name):
    if name == "efficientnet_b0":
        m = models.efficientnet_b0(weights=None)
        m.classifier = nn.Sequential(nn.Dropout(0.3), nn.Linear(m.classifier[1].in_features, NUM_CLASSES))
    elif name == "densenet121":
        m = models.densenet121(weights=None)
        m.classifier = nn.Sequential(nn.Dropout(0.3), nn.Linear(m.classifier.in_features, NUM_CLASSES))
    else:
        m = models.mobilenet_v2(weights=None)
        m.classifier = nn.Sequential(nn.Dropout(0.3), nn.Linear(m.last_channel, NUM_CLASSES))
    return m


_ensemble = None
_ensemble_checked = False


def get_ensemble():
    """Returns {name: model} when all ensemble files exist, else None."""
    global _ensemble, _ensemble_checked
    if _ensemble_checked:
        return _ensemble
    _ensemble_checked = True
    files = {n: f"ens_{n}.pt" for n in ENSEMBLE_NAMES}
    if not all(os.path.exists(p) for p in files.values()):
        print("Ensemble files not found -> using the single model.")
        return None
    loaded = {}
    for n, p in files.items():
        m = _build_ensemble_member(n)
        m.load_state_dict(torch.load(p, map_location=DEVICE))
        m.eval()
        loaded[n] = m.to(DEVICE)
    _ensemble = loaded
    print("Ensemble loaded:", list(loaded))
    return _ensemble


def ensemble_preprocess(pil_img):
    img = pil_img.convert("L").convert("RGB").resize((ENSEMBLE_IMG_SIZE, ENSEMBLE_IMG_SIZE))
    orig_img = np.array(img) / 255.0
    tf = transforms.Compose([transforms.ToTensor(), transforms.Normalize(MEAN, STD)])
    return tf(img).unsqueeze(0).to(DEVICE), orig_img


def ensemble_probs(ens, tensor):
    ps = []
    with torch.no_grad():
        for m in ens.values():
            p = F.softmax(m(tensor), 1) + F.softmax(m(torch.flip(tensor, dims=[3])), 1)
            ps.append(p / 2)
    return torch.stack(ps).mean(0)[0].cpu().numpy()


def preprocess_pil_image(pil_img: Image.Image):
    img_resized = pil_img.convert("RGB").resize((IMG_SIZE, IMG_SIZE))
    orig_img = np.array(img_resized) / 255.0
    transform = transforms.Compose(
        [transforms.ToTensor(), transforms.Normalize(MEAN, STD)]
    )
    tensor = transform(img_resized).unsqueeze(0).to(DEVICE)
    return tensor, orig_img


def gradcam(model, img_tensor, orig_img, target_class):
    activations, gradients = {}, {}
    last_conv_layer = model.features[-1]

    def fh(module, inp, out):
        activations["v"] = out

    def bh(module, gin, gout):
        gradients["v"] = gout[0]

    h1 = last_conv_layer.register_forward_hook(fh)
    h2 = last_conv_layer.register_full_backward_hook(bh)

    img_tensor = img_tensor.clone().requires_grad_(True)
    output = model(img_tensor)
    model.zero_grad()
    output[0, target_class].backward()
    h1.remove()
    h2.remove()

    grads = gradients["v"][0]
    acts = activations["v"][0]
    pooled = grads.mean(dim=(1, 2))
    for i in range(acts.shape[0]):
        acts[i, :, :] *= pooled[i]

    heatmap = acts.mean(dim=0).detach().cpu().numpy()
    heatmap = np.maximum(heatmap, 0)
    heatmap = heatmap / (heatmap.max() + 1e-8)
    heatmap_resized = cv2.resize(heatmap, (orig_img.shape[1], orig_img.shape[0]))
    heatmap_colored = np.uint8(255 * heatmap_resized)
    heatmap_colored = cv2.applyColorMap(heatmap_colored, cv2.COLORMAP_JET)
    heatmap_colored = cv2.cvtColor(heatmap_colored, cv2.COLOR_BGR2RGB) / 255.0
    overlay = heatmap_colored * 0.4 + orig_img * 0.6
    return heatmap_resized, overlay


def saliency_map(model, img_tensor, target_class, orig_img):
    img_tensor = img_tensor.clone().detach().requires_grad_(True)
    output = model(img_tensor)
    model.zero_grad()
    output[0, target_class].backward()
    sal = img_tensor.grad.abs().max(dim=1)[0][0].cpu().numpy()

    sal = cv2.GaussianBlur(sal, (15, 15), 0)
    sal = (sal - sal.min()) / (sal.max() - sal.min() + 1e-8)

    sal_resized = cv2.resize(sal, (orig_img.shape[1], orig_img.shape[0]))
    sal_colored = cv2.applyColorMap(np.uint8(255 * sal_resized), cv2.COLORMAP_HOT)
    sal_colored = cv2.cvtColor(sal_colored, cv2.COLOR_BGR2RGB) / 255.0
    overlay = sal_colored * 0.5 + orig_img * 0.5
    return overlay


_LIME_LIB = None  


def _lime_library_ok():
    """The official `lime` + scikit-image need a few compiled files. On some Windows
    laptops (Smart App Control) those files are blocked, so we check once and fall
    back to our own LIME implementation below."""
    global _LIME_LIB
    if _LIME_LIB is None:
        try:
            from lime import lime_image  
            from skimage.segmentation import mark_boundaries 
            _LIME_LIB = True
        except Exception as e:
            print(f"Official LIME library unavailable ({e!r}) -> using built-in LIME.", flush=True)
            _LIME_LIB = False
    return _LIME_LIB


def lime_explanation_builtin(model, orig_img, num_samples=150, n_segments=36, seed=0):
    """LIME without lime/scikit-image (only numpy + OpenCV + torch).
    Same idea as LIME: split the image into superpixels, hide random groups of them,
    see how the model's confidence changes, fit a small weighted linear model and
    outline the superpixels that push the prediction up the most."""
    rng = np.random.RandomState(seed)
    img = np.clip(orig_img * 255, 0, 255).astype("uint8")
    H, W = img.shape[:2]

    
    gray = cv2.cvtColor(img, cv2.COLOR_RGB2GRAY).astype(np.float32) / 255.0
    yy, xx = np.mgrid[0:H, 0:W].astype(np.float32)
    feats = np.stack([xx / W * 3.0, yy / H * 3.0, gray * 0.6], axis=-1).reshape(-1, 3).astype(np.float32)
    cv2.setRNGSeed(seed)
    _, labels, _ = cv2.kmeans(feats, n_segments, None,
                              (cv2.TERM_CRITERIA_EPS + cv2.TERM_CRITERIA_MAX_ITER, 15, 0.5),
                              2, cv2.KMEANS_PP_CENTERS)
    segments = labels.reshape(H, W)

    
    Z = rng.randint(0, 2, size=(num_samples, n_segments)).astype(np.float32)
    Z[0, :] = 1.0

    tf = transforms.Compose([transforms.ToTensor(), transforms.Normalize(MEAN, STD)])

    def predict(batch_imgs):
        x = torch.stack([tf(Image.fromarray(b)) for b in batch_imgs]).to(DEVICE)
        with torch.no_grad():
            return F.softmax(model(x), dim=1).cpu().numpy()

    probs = []
    for i in range(0, num_samples, 50):
        batch = []
        for z in Z[i:i + 50]:
            pert = img.copy()
            pert[~z.astype(bool)[segments]] = 0          
            batch.append(pert)
        probs.append(predict(batch))
    probs = np.concatenate(probs, 0)
    target = int(probs[0].argmax())
    y = probs[:, target].astype(np.float64)

   
    dist = 1.0 - (Z.sum(1) / np.sqrt(Z.sum(1) * n_segments + 1e-9))
    w = np.sqrt(np.exp(-(dist ** 2) / 0.25 ** 2))
    Xc = Z - np.average(Z, axis=0, weights=w)
    yc = y - np.average(y, weights=w)
    A = Xc.T @ (Xc * w[:, None]) + 1.0 * np.eye(n_segments)
    coef = np.linalg.solve(A, Xc.T @ (yc * w))

    
    top = [i for i in np.argsort(coef)[::-1][:5] if coef[i] > 0]
    mask = np.isin(segments, top).astype("uint8")
    out = img.astype(np.float32) / 255.0
    edge = cv2.morphologyEx(mask, cv2.MORPH_GRADIENT, np.ones((3, 3), np.uint8)) > 0
    out[edge] = (1.0, 1.0, 0.0)
    return out


def lime_explanation(model, orig_img, num_samples=150):
    if not _lime_library_ok():
        return lime_explanation_builtin(model, orig_img, num_samples)

    from lime import lime_image
    from skimage.segmentation import mark_boundaries

    explainer = lime_image.LimeImageExplainer()
    transform_norm = transforms.Compose(
        [transforms.ToTensor(), transforms.Normalize(MEAN, STD)]
    )

    def predict_fn(images):
        batch = torch.stack(
            [transform_norm(Image.fromarray(img.astype("uint8"))) for img in images]
        )
        batch = batch.to(DEVICE)
        with torch.no_grad():
            logits = model(batch)
            probs = F.softmax(logits, dim=1).cpu().numpy()
        return probs

    explanation = explainer.explain_instance(
        (orig_img * 255).astype("uint8"),
        predict_fn,
        top_labels=1,
        hide_color=0,
        num_samples=num_samples,
    )
    temp, mask = explanation.get_image_and_mask(
        explanation.top_labels[0],
        positive_only=True,
        num_features=5,
        hide_rest=False,
    )
    return mark_boundaries(temp / 255.0, mask)


def describe_region(heatmap):
    h, w = heatmap.shape
    ys, xs = np.mgrid[0:h, 0:w]
    total = heatmap.sum() + 1e-8
    cy = (ys * heatmap).sum() / total
    cx = (xs * heatmap).sum() / total
    vertical = "upper" if cy < h * 0.45 else ("lower" if cy > h * 0.55 else "middle")
    horizontal = "left" if cx < w * 0.45 else ("right" if cx > w * 0.55 else "central")
    if vertical == "middle" and horizontal == "central":
        return "Model has focused primarily on the central lung field."
    return f"Model has focused primarily on the {vertical}-{horizontal} lung field."


def _load_font(size, bold=False):
    candidates = (
        ["arialbd.ttf", "Arial Bold.ttf", "DejaVuSans-Bold.ttf"]
        if bold
        else ["arial.ttf", "Arial.ttf", "DejaVuSans.ttf"]
    )
    for name in candidates:
        try:
            return ImageFont.truetype(name, size)
        except Exception:
            continue
    return ImageFont.load_default()


def saliency_heat(model, img_tensor, target_class):
    """Normalised (0-1) pixel-gradient importance map, same size as the input."""
    img_tensor = img_tensor.clone().detach().requires_grad_(True)
    output = model(img_tensor)
    model.zero_grad()
    output[0, target_class].backward()
    sal = img_tensor.grad.abs().max(dim=1)[0][0].cpu().numpy()
    sal = cv2.GaussianBlur(sal, (3, 3), 0)        
    hi = np.percentile(sal, 99.5)
    return np.clip(sal / (hi + 1e-8), 0, 1)


PANEL_SIZE = 400


def _base_panel(orig_img, size=PANEL_SIZE):
    base = cv2.resize(orig_img.astype(np.float32), (size, size), interpolation=cv2.INTER_CUBIC)
    return np.clip(base, 0, 1)


def gradcam_panel(orig_img, heat, size=PANEL_SIZE):
    """Smooth full-image Grad-CAM heatmap blended over the X-ray."""
    base = _base_panel(orig_img, size)
    h = cv2.resize(heat.astype(np.float32), (size, size), interpolation=cv2.INTER_CUBIC)
    h = cv2.GaussianBlur(h, (0, 0), sigmaX=size * 0.015)
    h = np.clip((h - h.min()) / (h.max() - h.min() + 1e-8), 0, 1)
    colour = cv2.applyColorMap(np.uint8(255 * h), cv2.COLORMAP_JET)
    colour = cv2.cvtColor(colour, cv2.COLOR_BGR2RGB).astype(np.float32) / 255.0
    return np.clip(colour * 0.45 + base * 0.55, 0, 1)


def saliency_panel(orig_img, sal, size=PANEL_SIZE):
    """Pixel-level saliency: dark red field with bright dots where pixels matter most."""
    base = _base_panel(orig_img, size)
    s = cv2.resize(sal.astype(np.float32), (size, size), interpolation=cv2.INTER_LINEAR)
    s = np.clip(s, 0, 1) ** 1.6
    colour = cv2.applyColorMap(np.uint8(255 * s), cv2.COLORMAP_HOT)
    colour = cv2.cvtColor(colour, cv2.COLOR_BGR2RGB).astype(np.float32) / 255.0
    colour[..., 0] = np.maximum(colour[..., 0], 0.35)  
    return np.clip(colour * 0.6 + base * 0.4, 0, 1)


def side_by_side(orig_img, right_panel, right_title, size=PANEL_SIZE):
    """Report-style figure: [Original Image | <method>] with small titles, no other text."""
    left = _base_panel(orig_img, size)
    gap, header, margin = 16, 38, 12
    W = margin * 2 + size * 2 + gap
    H = header + size + margin
    canvas = Image.new("RGB", (W, H), (255, 255, 255))
    draw = ImageDraw.Draw(canvas)
    font = _load_font(17, bold=True)
    for x0, title, panel in ((margin, "Original Image", left),
                             (margin + size + gap, right_title, right_panel)):
        tile = Image.fromarray(np.uint8(np.clip(panel, 0, 1) * 255))
        canvas.paste(tile, (x0, header))
        tw = draw.textlength(title, font=font)
        draw.text((x0 + (size - tw) / 2, 9), title, fill=(30, 40, 50), font=font)
    return np.array(canvas) / 255.0


def annotate_image(overlay_float, lines):
    img_uint8 = np.clip(overlay_float * 255, 0, 255).astype(np.uint8)
    pil_img = Image.fromarray(img_uint8).convert("RGB")

    target_w = 480
    pil_img = pil_img.resize((target_w, target_w), Image.LANCZOS)
    w, h = pil_img.size

    line_height = 26
    pad = 12
    max_chars = max(20, int(w / 8.5))

   
    wrapped = []
    for text, bold in lines:
        words = text.split()
        buf = ""
        for word in words:
            trial = (buf + " " + word).strip()
            if len(trial) > max_chars:
                wrapped.append((buf, bold))
                buf = word
            else:
                buf = trial
        if buf:
            wrapped.append((buf, bold))

    band_height = pad * 2 + line_height * len(wrapped)
    canvas = Image.new("RGB", (w, h + band_height), (17, 24, 30))
    canvas.paste(pil_img, (0, 0))
    draw = ImageDraw.Draw(canvas)

    y = h + pad
    for text, bold in wrapped:
        font = _load_font(17 if bold else 15, bold=bold)
        color = (255, 255, 255) if bold else (200, 210, 215)
        draw.text((12, y), text, fill=color, font=font)
        y += line_height

    return np.array(canvas) / 255.0


def build_caption_lines(pred_label, confidence, region_text):
    return [
        (f"AI Result: {pred_label.title()} ({confidence*100:.0f}% confidence)", True),
        (PATIENT_EXPLANATION.get(pred_label, ""), False),
        (region_text, False),
        ("Bright red/yellow = where the AI focused most; dark blue = ignored.", False),
    ]


def array_to_base64_png(arr: np.ndarray) -> str:
    img_uint8 = np.clip(arr * 255, 0, 255).astype(np.uint8)
    pil_img = Image.fromarray(img_uint8)
    buf = io.BytesIO()
    pil_img.save(buf, format="PNG")
    b64 = base64.b64encode(buf.getvalue()).decode("utf-8")
    return f"data:image/png;base64,{b64}"


DB_PATH = "respitrust.db"
HISTORY_IMAGES_DIR = "history_images"
OTP_TTL_SECONDS = 5 * 60 

os.makedirs(HISTORY_IMAGES_DIR, exist_ok=True)


def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def init_db():
    conn = get_db()
    conn.executescript(
        """
        CREATE TABLE IF NOT EXISTS otp_codes (
            phone TEXT PRIMARY KEY,
            code TEXT NOT NULL,
            expires_at REAL NOT NULL
        );

        CREATE TABLE IF NOT EXISTS sessions (
            token TEXT PRIMARY KEY,
            phone TEXT NOT NULL,
            created_at REAL NOT NULL
        );

        CREATE TABLE IF NOT EXISTS history (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            phone TEXT NOT NULL,
            prediction_key TEXT NOT NULL,
            confidence REAL NOT NULL,
            region_text TEXT,
            image_path TEXT NOT NULL,
            created_at REAL NOT NULL
        );
        """
    )
    conn.commit()
    conn.close()


init_db()


def get_phone_from_token(authorization):
    """Returns the phone number for a valid 'Bearer <token>' header, or None."""
    if not authorization or not authorization.startswith("Bearer "):
        return None
    token = authorization.split(" ", 1)[1].strip()
    conn = get_db()
    row = conn.execute("SELECT phone FROM sessions WHERE token = ?", (token,)).fetchone()
    conn.close()
    return row["phone"] if row else None


class RequestOtpBody(BaseModel):
    phone: str


class VerifyOtpBody(BaseModel):
    phone: str
    code: str




MIN_SIDE = 128
MAX_COLOR_SATURATION = 0.15       
MAX_COLORFUL_PIXEL_FRACTION = 0.08
MIN_INTENSITY_STD = 25            
MAX_NEAR_WHITE_FRACTION = 0.45    
_gate = None
_gate_checked = False


def get_gate():
    global _gate, _gate_checked
    if _gate_checked:
        return _gate
    _gate_checked = True
    if os.path.exists("xray_gate.npz"):
        z = np.load("xray_gate.npz")
        _gate = (z["mu"].astype(np.float64), z["P"].astype(np.float64), float(z["thr"]))
        print("X-ray gate loaded, threshold", _gate[2])
    else:
        print("xray_gate.npz not found -> only the basic image checks are used.")
    return _gate


def learned_xray_check(ens, tensor):
    """True if the image looks like a chest X-ray (or no gate available)."""
    g = get_gate()
    if g is None or not ens or "efficientnet_b0" not in ens:
        return True
    mu, P, thr = g
    m = ens["efficientnet_b0"]
    with torch.no_grad():
        f = m.avgpool(m.features(tensor)).flatten(1)[0].cpu().numpy().astype(np.float64)
    d = f - mu
    dist = float(np.sqrt(d @ P @ d))
    print(f"gate distance {dist:.1f} (limit {thr:.1f})")
    return dist <= thr


MAX_NEAR_BLACK_FRACTION = 0.85
MIN_ASPECT, MAX_ASPECT = 0.5, 2.0

REJECTION_MESSAGES = {
    "too_small": "This image is too small to be a usable X-ray. Please upload the original chest X-ray file (at least 128 x 128 pixels).",
    "bad_aspect": "This image has an unusual shape for a chest X-ray. Please upload the full, uncropped frontal chest X-ray.",
    "colour_image": "This looks like a colour photograph, not a chest X-ray. RespiTrust can only analyse grayscale chest X-ray images.",
    "flat_image": "This image does not appear to contain a chest X-ray (it looks blank or almost uniform). Please upload a frontal chest X-ray.",
    "document_like": "This looks like a document or screenshot, not a chest X-ray. Please upload a frontal chest X-ray image.",
    "not_xray_learned": "This image does not look like a frontal chest X-ray, so RespiTrust cannot analyse it. Please upload a chest X-ray image only.",
    "unreadable": "This image could not be checked. Please upload a standard JPG or PNG chest X-ray.",
}


def validate_chest_xray(pil_img):
    """Returns (ok, reason_code, stats). reason_code is a key of REJECTION_MESSAGES."""
    try:
        rgb = pil_img.convert("RGB")
        w, h = rgb.size
        stats = {"width": w, "height": h}

        if min(w, h) < MIN_SIDE:
            return False, "too_small", stats
        aspect = w / h
        stats["aspect"] = round(aspect, 2)
        if aspect < MIN_ASPECT or aspect > MAX_ASPECT:
            return False, "bad_aspect", stats

        small = rgb.resize((256, 256))
        hsv = np.asarray(small.convert("HSV")).astype(np.float32) / 255.0
        sat, val = hsv[..., 1], hsv[..., 2]
        stats["mean_saturation"] = round(float(sat.mean()), 3)
        stats["colorful_fraction"] = round(float(((sat > 0.25) & (val > 0.15)).mean()), 3)
        if (stats["mean_saturation"] > MAX_COLOR_SATURATION
                or stats["colorful_fraction"] > MAX_COLORFUL_PIXEL_FRACTION):
            return False, "colour_image", stats

        gray = np.asarray(small.convert("L")).astype(np.float32)
        stats["std"] = round(float(gray.std()), 1)
        stats["near_white"] = round(float((gray > 245).mean()), 3)
        stats["near_black"] = round(float((gray < 10).mean()), 3)
        if stats["std"] < MIN_INTENSITY_STD:
            return False, "flat_image", stats
        if stats["near_white"] > MAX_NEAR_WHITE_FRACTION:
            return False, "document_like", stats
        if stats["near_black"] > MAX_NEAR_BLACK_FRACTION:
            return False, "flat_image", stats
 
        hist = np.bincount(gray.astype(np.int32).ravel(), minlength=256) / gray.size
        mode_frac = float(max(hist[i:i + 7].sum() for i in range(10, 240)))
        edge_frac = float((np.abs(np.diff(gray, axis=1)) > 40).mean())
        stats.update({"mode_frac": round(mode_frac, 3), "sharp_edges": round(edge_frac, 4)})
        if mode_frac > 0.35 or (edge_frac > 0.004 and mode_frac > 0.2):
            return False, "document_like", stats

        
        g = np.asarray(small.convert("L").resize((128, 128))).astype(np.float32)
        g = (g - g.mean()) / (g.std() + 1e-6)
        sym = float((g * g[:, ::-1]).mean())                      
        lungs = np.concatenate([g[32:90, 18:50].ravel(), g[32:90, 78:110].ravel()]).mean()
        centre = g[32:90, 56:72].mean()                          
        top, bottom = g[:20].mean(), g[-20:].mean()
        stats.update({"symmetry": round(sym, 2), "centre_minus_lungs": round(float(centre - lungs), 2)})
        fails = 0
        if sym < 0.30: fails += 1
        if centre - lungs < 0.10: fails += 1
        if abs(top - bottom) < 0.02 and sym < 0.5: fails += 1
        if sym < 0.10 or fails >= 2:
            return False, "not_xray_learned", stats
        return True, "ok", stats
    except Exception as e:
        print("VALIDATION ERROR:", repr(e))
        return False, "unreadable", {}




app = FastAPI(title="RespiTrust API", version="2.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)



def tlog(tag, msg=""):
    print(f"[{time.strftime('%H:%M:%S')}] {tag:<9} {msg}", flush=True)


@app.middleware("http")
async def log_requests(request, call_next):
    t0 = time.time()
    path = request.url.path
    try:
        response = await call_next(request)
    except Exception:
        tlog("ERROR", f"{request.method} {path} crashed")
        traceback.print_exc()
        raise
    if path != "/api/client-log":
        tlog("API", f"{request.method} {path} -> {response.status_code} ({time.time() - t0:.1f}s)")
    return response


class ClientLogBody(BaseModel):
    event: str = ""
    detail: str = ""


@app.post("/api/client-log")
def client_log(body: ClientLogBody):
    """The browser sends what the user does / any browser error here."""
    tlog("BROWSER", f"{body.event[:40]:<14} {body.detail[:300]}")
    return {"ok": True}


@app.get("/api/health")
def health():
    return {"status": "ok", "device": str(DEVICE), "ensemble": bool(get_ensemble())}




@app.post("/api/auth/request-otp")
def request_otp(body: RequestOtpBody):
    phone = "".join(ch for ch in body.phone if ch.isdigit())
    if len(phone) != 10:
        raise HTTPException(status_code=400, detail="Enter a valid 10-digit mobile number.")

    code = f"{secrets.randbelow(1000000):06d}"
    expires_at = time.time() + OTP_TTL_SECONDS

    conn = get_db()
    conn.execute(
        "INSERT INTO otp_codes (phone, code, expires_at) VALUES (?, ?, ?) "
        "ON CONFLICT(phone) DO UPDATE SET code=excluded.code, expires_at=excluded.expires_at",
        (phone, code, expires_at),
    )
    conn.commit()
    conn.close()


    tlog("LOGIN", f"OTP requested for ***{phone[-4:]} (demo OTP {code})")
    return {"message": "OTP generated (demo mode).", "demo_otp": code}


@app.post("/api/auth/verify-otp")
def verify_otp(body: VerifyOtpBody):
    phone = "".join(ch for ch in body.phone if ch.isdigit())
    code = body.code.strip()

    conn = get_db()
    row = conn.execute("SELECT * FROM otp_codes WHERE phone = ?", (phone,)).fetchone()

    if not row:
        conn.close()
        raise HTTPException(status_code=400, detail="Request a new OTP first.")
    if time.time() > row["expires_at"]:
        conn.close()
        raise HTTPException(status_code=400, detail="OTP has expired. Please request a new one.")
    if row["code"] != code:
        conn.close()
        raise HTTPException(status_code=400, detail="Incorrect or expired OTP.")

    token = secrets.token_hex(24)
    conn.execute(
        "INSERT INTO sessions (token, phone, created_at) VALUES (?, ?, ?)",
        (token, phone, time.time()),
    )
    conn.execute("DELETE FROM otp_codes WHERE phone = ?", (phone,))
    conn.commit()
    conn.close()

    tlog("LOGIN", f"***{phone[-4:]} logged in")
    return {"token": token, "phone": phone}


@app.post("/api/auth/logout")
def logout(authorization: str = Header(default=None)):
    if authorization and authorization.startswith("Bearer "):
        token = authorization.split(" ", 1)[1].strip()
        conn = get_db()
        conn.execute("DELETE FROM sessions WHERE token = ?", (token,))
        conn.commit()
        conn.close()
    return {"message": "Logged out."}





@app.post("/predict")
@app.post("/api/predict")
async def predict(file: UploadFile = File(...), authorization: str = Header(default=None)):
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="Please upload an image file (JPG/PNG).")

    start = time.time()
    raw = await file.read()
    try:
        pil_img = Image.open(io.BytesIO(raw))
        pil_img.load()
    except Exception:
        raise HTTPException(status_code=400, detail="Could not read the uploaded image.")

   
    ok, reason, stats = validate_chest_xray(pil_img)
    if not ok:
        tlog("REJECTED", f"{reason}: {stats}")
        raise HTTPException(
            status_code=422,
            detail={
                "code": "not_chest_xray",
                "reason": reason,
                "message": REJECTION_MESSAGES.get(reason, REJECTION_MESSAGES["unreadable"]),
            },
        )

    ens = get_ensemble()
    if ens:
        img_tensor, orig_img = ensemble_preprocess(pil_img)
        if not learned_xray_check(ens, img_tensor):
            raise HTTPException(status_code=422, detail={
                "code": "not_chest_xray", "reason": "not_xray_learned",
                "message": REJECTION_MESSAGES["not_xray_learned"]})
        probs = ensemble_probs(ens, img_tensor)
        # explanation model must expose features[-1] as its last conv block
        model = ens.get("efficientnet_b0") or ens["mobilenet_v2"]
    else:
        model = get_model()
        img_tensor, orig_img = preprocess_pil_image(pil_img)
        with torch.no_grad():
            logits = model(img_tensor)
            probs = F.softmax(logits, dim=1)[0].cpu().numpy()
    pred_class = int(probs.argmax())
    pred_label = CLASS_NAMES[pred_class]
    confidence = float(probs[pred_class])

    heatmap, _ = gradcam(model, img_tensor.clone(), orig_img, pred_class)
    sal_heat = saliency_heat(model, img_tensor.clone(), pred_class)
    region_text = describe_region(heatmap)

    gradcam_annotated = side_by_side(orig_img, gradcam_panel(orig_img, heatmap), "Grad-CAM Heatmap")
    sal_annotated = side_by_side(orig_img, saliency_panel(orig_img, sal_heat), "Saliency Map")

    try:
        lime_img = lime_explanation(model, orig_img)
        lime_panel = cv2.resize(np.clip(lime_img, 0, 1).astype(np.float32),
                                (PANEL_SIZE, PANEL_SIZE), interpolation=cv2.INTER_CUBIC)
        lime_b64 = array_to_base64_png(side_by_side(orig_img, lime_panel, "LIME Regions"))
    except Exception as e:
        tlog("LIME", f"FAILED: {e!r}")
        traceback.print_exc()
        lime_b64 = None

    
    phone = get_phone_from_token(authorization)
    saved_to_history = False
    if phone:
        image_filename = f"{uuid.uuid4().hex}.png"
        image_path = os.path.join(HISTORY_IMAGES_DIR, image_filename)
        Image.fromarray(np.uint8(orig_img * 255)).save(image_path)

        conn = get_db()
        conn.execute(
            "INSERT INTO history (phone, prediction_key, confidence, region_text, image_path, created_at) "
            "VALUES (?, ?, ?, ?, ?, ?)",
            (phone, FRONTEND_KEY[pred_label], confidence, region_text, image_path, time.time()),
        )
        conn.commit()
        conn.close()
        saved_to_history = True

    response = {
        "prediction": pred_label,
        "prediction_key": FRONTEND_KEY[pred_label],
        "confidence": confidence,
        "probabilities": {
            "bacteria": float(probs[0]),
            "normal": float(probs[1]),
            "virus": float(probs[2]),
        },
        "region_text": region_text,
        "low_confidence_warning": confidence < CONF_THRESHOLD,
        "model_info": "ensemble-3" if ens else "single",
        "saved_to_history": saved_to_history,
        "explainability": {
            "gradcam": array_to_base64_png(gradcam_annotated),
            "saliency": array_to_base64_png(sal_annotated),
            "lime": lime_b64,
        },
        "processing_time_sec": round(time.time() - start, 2),
    }
    tlog("RESULT", f"{pred_label} {confidence*100:.0f}% | model={response['model_info']} | "
                   f"region='{region_text}' | lime={'ok' if lime_b64 else 'MISSING'} | "
                   f"saved_to_history={saved_to_history} | {response['processing_time_sec']}s")
    return JSONResponse(content=response)





def compute_trend(entries_oldest_first):
    """
    Simple, explainable heuristic (not a medical claim) comparing the two
    most recent scans to flag whether things look like they're improving.
    """
    if len(entries_oldest_first) < 2:
        return {
            "headline": "Not enough history yet",
            "detail": "Analyze a couple more X-rays to start seeing a trend.",
            "trend": "",
        }

    latest = entries_oldest_first[-1]["prediction_key"]
    previous = entries_oldest_first[-2]["prediction_key"]

    if latest == "normal" and previous != "normal":
        return {
            "headline": "Looking better",
            "detail": "The most recent scan came back Normal after a previous pneumonia result.",
            "trend": "improving",
        }
    if latest != "normal" and previous == "normal":
        return {
            "headline": "Needs attention",
            "detail": "The most recent scan flagged pneumonia after a previous Normal result.",
            "trend": "worsening",
        }
    if latest == previous:
        return {
            "headline": "Stable",
            "detail": f"The last two scans both came back {latest.title()}.",
            "trend": "stable",
        }
    return {
        "headline": "Result changed",
        "detail": f"The prediction changed from {previous.title()} to {latest.title()}.",
        "trend": "stable",
    }


@app.get("/api/history")
def get_history(authorization: str = Header(default=None)):
    phone = get_phone_from_token(authorization)
    if not phone:
        raise HTTPException(status_code=401, detail="Not logged in.")

    conn = get_db()
    rows = conn.execute(
        "SELECT * FROM history WHERE phone = ? ORDER BY created_at ASC", (phone,)
    ).fetchall()
    conn.close()

    entries_oldest_first = [
        {
            "id": r["id"],
            "prediction_key": r["prediction_key"],
            "confidence": r["confidence"],
            "region_text": r["region_text"],
            "created_at": r["created_at"],
            "image_url": f"/api/history/image/{r['id']}",
        }
        for r in rows
    ]
    trend = compute_trend(entries_oldest_first)

    return {
        "trend": trend,
        "entries": list(reversed(entries_oldest_first)),  # newest first for display
    }


@app.get("/api/history/image/{entry_id}")
def get_history_image(entry_id: int, token: str = None):
    if not token:
        raise HTTPException(status_code=401, detail="Missing token.")
    conn = get_db()
    session_row = conn.execute("SELECT phone FROM sessions WHERE token = ?", (token,)).fetchone()
    if not session_row:
        conn.close()
        raise HTTPException(status_code=401, detail="Invalid session.")

    row = conn.execute(
        "SELECT * FROM history WHERE id = ? AND phone = ?", (entry_id, session_row["phone"])
    ).fetchone()
    conn.close()

    if not row or not os.path.exists(row["image_path"]):
        raise HTTPException(status_code=404, detail="Image not found.")
    return FileResponse(row["image_path"], media_type="image/png")


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
