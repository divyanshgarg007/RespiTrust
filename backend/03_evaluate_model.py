import torch
import matplotlib.pyplot as plt
import seaborn as sns
from sklearn.metrics import accuracy_score, confusion_matrix, classification_report
from importlib import import_module
data_prep = import_module("01_data_prep")
train_module = import_module("02_train_model")
MODEL_PATH = "pneumonia_3class_mobilenetv2.pt"
DEVICE = torch.device("cuda" if torch.cuda.is_available() else "cpu")
CLASS_NAMES = ["BACTERIA", "NORMAL", "VIRUS"]
def evaluate():
    _, _, test_loader, class_map = data_prep.get_data_loaders()
    print("Class mapping:", class_map)
    model = train_module.build_model()
    model.load_state_dict(torch.load(MODEL_PATH, map_location=DEVICE))
    model.eval()
    all_preds, all_labels = [], []
    with torch.no_grad():
        for images, labels in test_loader:
            images = images.to(DEVICE)
            outputs = model(images)
            preds = outputs.argmax(dim=1).cpu().numpy()
            all_preds.extend(preds.tolist())
            all_labels.extend(labels.numpy().tolist())
    acc = accuracy_score(all_labels, all_preds)
    print(f"Overall Accuracy: {acc*100:.2f}%")
    print(classification_report(all_labels, all_preds, target_names=CLASS_NAMES))
    cm = confusion_matrix(all_labels, all_preds)
    plt.figure(figsize=(7, 6))
    sns.heatmap(cm, annot=True, fmt="d", cmap="Blues",
                xticklabels=CLASS_NAMES, yticklabels=CLASS_NAMES)
    plt.xlabel("Predicted")
    plt.ylabel("Actual")
    plt.title("Confusion Matrix - 3-Class MobileNetV2 (PyTorch)")
    plt.tight_layout()
    plt.savefig("confusion_matrix_3class.png", dpi=150)
    plt.show()
    return acc, cm
if __name__ == "__main__":
    evaluate()