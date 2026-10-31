import os
import pandas as pd
import matplotlib.pyplot as plt
import torch
from importlib import import_module
xai = import_module("04_xai_gradcam_lime_saliency")
MODEL_PATH = "pneumonia_mobilenetv2.pt"
CLINICAL_CASES_DIR = "clinical_cases"
GROUND_TRUTH_CSV = "ground_truth.csv"
OUTPUT_DIR = "clinical_validation_results"
def run_clinical_validation():
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    model = xai.load_trained_model()
    gt_df = pd.read_csv(GROUND_TRUTH_CSV)
    results = []
    for _, row in gt_df.iterrows():
        filename = row["filename"]
        ground_truth = row["ground_truth"].strip().upper()
        img_path = os.path.join(CLINICAL_CASES_DIR, filename)
        if not os.path.exists(img_path):
            print(f"WARNING: {img_path} not found, skipping.")
            continue
        img_tensor, orig_img = xai.preprocess_image(img_path)
        with torch.no_grad():
            pred_prob = model(img_tensor).item()
        pred_label = "PNEUMONIA" if pred_prob > 0.5 else "NORMAL"
        match = "YES" if pred_label == ground_truth else "NO"
        _, overlay = xai.run_gradcam(model, img_tensor.clone(), orig_img)
        fig, axes = plt.subplots(1, 2, figsize=(10, 5))
        axes[0].imshow(orig_img)
        axes[0].set_title(f"Original\nGround Truth (Dr.): {ground_truth}")
        axes[1].imshow(overlay)
        axes[1].set_title(f"Grad-CAM\nModel Pred: {pred_label} ({pred_prob:.2f})")
        for ax in axes:
            ax.axis("off")
        plt.tight_layout()
        save_path = os.path.join(OUTPUT_DIR, f"gradcam_{filename}")
        plt.savefig(save_path, dpi=150)
        plt.close(fig)
        results.append({
            "filename": filename, "ground_truth_doctor": ground_truth,
            "model_prediction": pred_label, "confidence": round(float(pred_prob), 4),
            "match": match, "gradcam_image": save_path,
            "doctor_feedback_gradcam_relevant": ""
        })
    result_df = pd.DataFrame(results)
    result_csv_path = os.path.join(OUTPUT_DIR, "clinical_validation_summary.csv")
    result_df.to_csv(result_csv_path, index=False)
    print(f"Done! {len(results)} cases processed.")
    accuracy_on_clinical = (result_df["match"] == "YES").mean() * 100
    print(f"Model accuracy on real clinical cases: {accuracy_on_clinical:.2f}%")
    return result_df
if __name__ == "__main__":
    run_clinical_validation()