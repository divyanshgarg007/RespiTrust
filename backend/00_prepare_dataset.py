import os
import shutil
import random
import pandas as pd
random.seed(42)
INPUT_ROOT = "/kaggle/input"
OUTPUT_DIR = "/kaggle/working/chest_xray_3class"
NIH_NORMAL_LIMIT = 3000
INCLUDE_LUNG_OPACITY_AS_BACTERIA = False
SPLITS = ["train", "val", "test"]
CLASSES = ["BACTERIA", "NORMAL", "VIRUS"]
for split in SPLITS:
    for cls in CLASSES:
        os.makedirs(os.path.join(OUTPUT_DIR, split, cls), exist_ok=True)
def find_all_files(root_dir, ext):
    found = []
    for dirpath, _, filenames in os.walk(root_dir):
        for fname in filenames:
            if fname.lower().endswith(ext):
                found.append(os.path.join(dirpath, fname))
    return found
def split_list(items, train_ratio=0.8, val_ratio=0.1):
    items = list(items)
    random.shuffle(items)
    n = len(items)
    n_train = int(n * train_ratio)
    n_val = int(n * val_ratio)
    return items[:n_train], items[n_train:n_train + n_val], items[n_train + n_val:]
def copy_files(file_paths, dest_split, dest_class):
    for src_path in file_paths:
        fname = os.path.basename(src_path)
        dest = os.path.join(OUTPUT_DIR, dest_split, dest_class, fname)
        if os.path.exists(dest):
            dest = os.path.join(OUTPUT_DIR, dest_split, dest_class, f"{os.path.basename(os.path.dirname(src_path))}_{fname}")
        try:
            shutil.copy(src_path, dest)
        except Exception as e:
            print("Skip:", src_path, e)
print("Scanning /kaggle/input (thoda time lagega)...")
all_images = find_all_files(INPUT_ROOT, (".jpeg", ".jpg", ".png"))
print(f"Total images found anywhere in /kaggle/input: {len(all_images)}")
bacteria_pool, virus_pool, normal_pool = set(), set(), set()
for f in all_images:
    fname_lower = os.path.basename(f).lower()
    if "bacteria" in fname_lower:
        bacteria_pool.add(f)
    elif "virus" in fname_lower:
        virus_pool.add(f)
for f in all_images:
    parent = os.path.basename(os.path.dirname(f)).upper()
    if parent == "NORMAL":
        normal_pool.add(f)
for f in all_images:
    path_lower = f.lower()
    if "viral pneumonia" in path_lower or "viral_pneumonia" in path_lower:
        virus_pool.add(f)
    elif "/normal/" in path_lower or "\\normal\\" in path_lower:
        normal_pool.add(f)
    elif INCLUDE_LUNG_OPACITY_AS_BACTERIA and ("lung_opacity" in path_lower or "lung opacity" in path_lower):
        bacteria_pool.add(f)
bacteria_pool -= virus_pool
print(f"Pool sizes -> BACTERIA: {len(bacteria_pool)}, VIRUS: {len(virus_pool)}, NORMAL (before NIH): {len(normal_pool)}")
for pool, cls in [(bacteria_pool, "BACTERIA"), (virus_pool, "VIRUS"), (normal_pool, "NORMAL")]:
    tr, va, te = split_list(pool)
    copy_files(tr, "train", cls)
    copy_files(va, "val", cls)
    copy_files(te, "test", cls)
if NIH_NORMAL_LIMIT > 0:
    all_csvs = find_all_files(INPUT_ROOT, (".csv",))
    nih_csv = next((c for c in all_csvs if "Data_Entry" in c), None)
    if nih_csv:
        print("Using NIH CSV:", nih_csv)
        df = pd.read_csv(nih_csv)
        normal_df = df[df["Finding Labels"] == "No Finding"]
        normal_filenames = set(normal_df["Image Index"].tolist())
        nih_root = os.path.dirname(nih_csv)
        all_png = find_all_files(nih_root, (".png",))
        nih_normal_paths = [p for p in all_png if os.path.basename(p) in normal_filenames]
        random.shuffle(nih_normal_paths)
        nih_normal_paths = nih_normal_paths[:NIH_NORMAL_LIMIT]
        print(f"Adding {len(nih_normal_paths)} extra NORMAL images from NIH dataset")
        tr, va, te = split_list(nih_normal_paths)
        copy_files(tr, "train", "NORMAL")
        copy_files(va, "val", "NORMAL")
        copy_files(te, "test", "NORMAL")
    else:
        print("NOTE: NIH CSV nahi mila, skip kar rahe hain (optional source hai).")
print("\n===== FINAL DATASET COUNTS =====")
for split in SPLITS:
    for cls in CLASSES:
        n = len(os.listdir(os.path.join(OUTPUT_DIR, split, cls)))
        print(f"{split}/{cls}: {n}")
print("\nDone! Dataset ready at:", OUTPUT_DIR)