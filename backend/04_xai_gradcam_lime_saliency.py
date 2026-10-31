import argparse
import numpy as np
import cv2
import torch
import torch.nn.functional as F
import matplotlib.pyplot as plt
from PIL import Image
from torchvision import transforms
from importlib import import_module
train_module = import_module("02_train_model")
MODEL_PATH = "pneumonia_3class_mobilenetv2.pt"
IMG_SIZE = 160
DEVICE = torch.device("cuda" if torch.cuda.is_available() else "cpu")
MEAN = [0.485, 0.456, 0.406]
STD = [0.229, 0.224, 0.225]
CLASS_NAMES = ["BACTERIA", "NORMAL", "VIRUS"]
def preprocess_image(img_path):
    img = Image.open(img_path).convert("RGB").resize((IMG_SIZE, IMG_SIZE))
    orig_img = np.array(img) / 255.0
    transform = transforms.Compose([transforms.ToTensor(), transforms.Normalize(MEAN, STD)])
    tensor = transform(img).unsqueeze(0).to(DEVICE)
    return tensor, orig_img
def load_trained_model():
    model = train_module.build_model()
    model.load_state_dict(torch.load(MODEL_PATH, map_location=DEVICE))
    model.eval()
    return model
def run_gradcam(model, img_tensor, orig_img, target_class=None):
    activations, gradients = {}, {}
    last_conv_layer = model.features[-1]
    def forward_hook(module, input, output):
        activations["value"] = output
    def backward_hook(module, grad_input, grad_output):
        gradients["value"] = grad_output[0]
    h1 = last_conv_layer.register_forward_hook(forward_hook)
    h2 = last_conv_layer.register_full_backward_hook(backward_hook)
    img_tensor.requires_grad_(True)
    output = model(img_tensor)
    if target_class is None:
        target_class = output.argmax(dim=1).item()
    model.zero_grad()
    output[0, target_class].backward()
    h1.remove(); h2.remove()
    grads = gradients["value"][0]
    acts = activations["value"][0]
    pooled_grads = grads.mean(dim=(1, 2))
    for i in range(acts.shape[0]):
        acts[i, :, :] *= pooled_grads[i]
    heatmap = acts.mean(dim=0).detach().cpu().numpy()
    heatmap = np.maximum(heatmap, 0)
    heatmap = heatmap / (heatmap.max() + 1e-8)
    heatmap_resized = cv2.resize(heatmap, (orig_img.shape[1], orig_img.shape[0]))
    heatmap_colored = np.uint8(255 * heatmap_resized)
    heatmap_colored = cv2.applyColorMap(heatmap_colored, cv2.COLORMAP_JET)
    heatmap_colored = cv2.cvtColor(heatmap_colored, cv2.COLOR_BGR2RGB) / 255.0
    overlay = heatmap_colored * 0.4 + orig_img * 0.6
    return heatmap_resized, overlay, target_class
def run_saliency(model, img_tensor, target_class):
    img_tensor = img_tensor.clone().detach().requires_grad_(True)
    output = model(img_tensor)
    model.zero_grad()
    output[0, target_class].backward()
    saliency = img_tensor.grad.abs().max(dim=1)[0][0].cpu().numpy()
    saliency = (saliency - saliency.min()) / (saliency.max() - saliency.min() + 1e-8)
    return saliency
def run_lime(model, orig_img):
    from lime import lime_image
    from skimage.segmentation import mark_boundaries
    explainer = lime_image.LimeImageExplainer()
    transform_norm = transforms.Compose([transforms.ToTensor(), transforms.Normalize(MEAN, STD)])
    def predict_fn(images):
        batch = torch.stack([transform_norm(Image.fromarray(img.astype("uint8"))) for img in images])
        batch = batch.to(DEVICE)
        with torch.no_grad():
            logits = model(batch)
            probs = F.softmax(logits, dim=1).cpu().numpy()
        return probs
    explanation = explainer.explain_instance(
        (orig_img * 255).astype("uint8"),
        predict_fn, top_labels=1, hide_color=0, num_samples=500,
    )
    temp, mask = explanation.get_image_and_mask(
        explanation.top_labels[0], positive_only=True, num_features=5, hide_rest=False,
    )
    return mark_boundaries(temp / 255.0, mask)
def main(image_path):
    model = load_trained_model()
    img_tensor, orig_img = preprocess_image(image_path)
    with torch.no_grad():
        logits = model(img_tensor)
        probs = F.softmax(logits, dim=1)[0].cpu().numpy()
    pred_class = int(probs.argmax())
    pred_label = CLASS_NAMES[pred_class]
    print(f"Prediction: {pred_label} (confidence: {probs[pred_class]:.4f})")
    print(f"All probabilities: BACTERIA={probs[0]:.3f}, NORMAL={probs[1]:.3f}, VIRUS={probs[2]:.3f}")
    _, gradcam_overlay, _ = run_gradcam(model, img_tensor.clone(), orig_img, pred_class)
    saliency_map = run_saliency(model, img_tensor.clone(), pred_class)
    print("Running LIME (thoda time lagega)...")
    lime_img = run_lime(model, orig_img)
    fig, axes = plt.subplots(1, 4, figsize=(20, 5))
    axes[0].imshow(orig_img); axes[0].set_title(f"Original\nPred: {pred_label} ({probs[pred_class]:.2f})")
    axes[1].imshow(gradcam_overlay); axes[1].set_title("Grad-CAM")
    axes[2].imshow(saliency_map, cmap="hot"); axes[2].set_title("Saliency Map")
    axes[3].imshow(lime_img); axes[3].set_title("LIME")
    for ax in axes:
        ax.axis("off")
    plt.tight_layout()
    plt.savefig("xai_explanations_3class.png", dpi=150)
    plt.show()
if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--image", type=str, required=True)
    args = parser.parse_args()
    main(args.image)