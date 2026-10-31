import torch
import torch.nn as nn
from torchvision import models
from importlib import import_module
data_prep = import_module("01_data_prep")
DEVICE = torch.device("cuda" if torch.cuda.is_available() else "cpu")
MODEL_SAVE_PATH = "pneumonia_3class_mobilenetv2.pt"
NUM_CLASSES = 3
def build_model():
    model = models.mobilenet_v2(weights=models.MobileNet_V2_Weights.IMAGENET1K_V1)
    for param in model.features.parameters():
        param.requires_grad = False
    model.classifier = nn.Sequential(
        nn.Dropout(0.3),
        nn.Linear(model.last_channel, 128),
        nn.ReLU(),
        nn.Dropout(0.2),
        nn.Linear(128, NUM_CLASSES),
    )
    return model.to(DEVICE)
def run_epoch(model, loader, criterion, optimizer=None):
    is_train = optimizer is not None
    model.train() if is_train else model.eval()
    total_loss, correct, total = 0.0, 0, 0
    with torch.set_grad_enabled(is_train):
        for images, labels in loader:
            images = images.to(DEVICE)
            labels = labels.to(DEVICE)
            outputs = model(images)
            loss = criterion(outputs, labels)
            if is_train:
                optimizer.zero_grad()
                loss.backward()
                optimizer.step()
            total_loss += loss.item() * images.size(0)
            preds = outputs.argmax(dim=1)
            correct += (preds == labels).sum().item()
            total += images.size(0)
    return total_loss / total, correct / total
def train():
    train_loader, val_loader, test_loader, class_map = data_prep.get_data_loaders()
    model = build_model()
    criterion = nn.CrossEntropyLoss()
    best_val_acc = 0.0
    patience, patience_counter = 7, 0
    print("---- Phase 1: Training top layers (base frozen) ----")
    optimizer = torch.optim.Adam(model.classifier.parameters(), lr=1e-3)
    for epoch in range(8):
        train_loss, train_acc = run_epoch(model, train_loader, criterion, optimizer)
        val_loss, val_acc = run_epoch(model, val_loader, criterion)
        print(f"Epoch {epoch+1}/8 - train_loss: {train_loss:.4f} train_acc: {train_acc:.4f} "
              f"val_loss: {val_loss:.4f} val_acc: {val_acc:.4f}")
        if val_acc > best_val_acc:
            best_val_acc = val_acc
            patience_counter = 0
            torch.save(model.state_dict(), MODEL_SAVE_PATH)
        else:
            patience_counter += 1
            if patience_counter >= patience:
                print("Early stopping (Phase 1).")
                break
    print("---- Phase 2: Fine-tuning full model ----")
    for param in model.features.parameters():
        param.requires_grad = True
    optimizer = torch.optim.Adam(model.parameters(), lr=1e-5)
    patience_counter = 0
    for epoch in range(5):
        train_loss, train_acc = run_epoch(model, train_loader, criterion, optimizer)
        val_loss, val_acc = run_epoch(model, val_loader, criterion)
        print(f"Epoch {epoch+1}/5 - train_loss: {train_loss:.4f} train_acc: {train_acc:.4f} "
              f"val_loss: {val_loss:.4f} val_acc: {val_acc:.4f}")
        if val_acc > best_val_acc:
            best_val_acc = val_acc
            patience_counter = 0
            torch.save(model.state_dict(), MODEL_SAVE_PATH)
        else:
            patience_counter += 1
            if patience_counter >= patience:
                print("Early stopping (Phase 2).")
                break

    print(f"Model saved to {MODEL_SAVE_PATH}")
    print(f"Class mapping: {class_map}")
    return model
if __name__ == "__main__":
    train()