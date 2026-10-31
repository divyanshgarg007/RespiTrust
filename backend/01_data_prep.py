import torch
from torchvision import datasets, transforms
from torch.utils.data import DataLoader
IMG_SIZE = 160
BATCH_SIZE = 16
DATASET_DIR = "chest_xray_3class"
TRAIN_DIR = f"{DATASET_DIR}/train"
VAL_DIR = f"{DATASET_DIR}/val"
TEST_DIR = f"{DATASET_DIR}/test"
MEAN = [0.485, 0.456, 0.406]
STD = [0.229, 0.224, 0.225]
def get_data_loaders():
    train_transform = transforms.Compose([
        transforms.Resize((IMG_SIZE, IMG_SIZE)),
        transforms.RandomRotation(15),
        transforms.RandomResizedCrop(IMG_SIZE, scale=(0.85, 1.0)),
        transforms.RandomHorizontalFlip(),
        transforms.ToTensor(),
        transforms.Normalize(MEAN, STD),
    ])
    eval_transform = transforms.Compose([
        transforms.Resize((IMG_SIZE, IMG_SIZE)),
        transforms.ToTensor(),
        transforms.Normalize(MEAN, STD),
    ])
    train_dataset = datasets.ImageFolder(TRAIN_DIR, transform=train_transform)
    val_dataset = datasets.ImageFolder(VAL_DIR, transform=eval_transform)
    test_dataset = datasets.ImageFolder(TEST_DIR, transform=eval_transform)
    train_loader = DataLoader(train_dataset, batch_size=BATCH_SIZE, shuffle=True)
    val_loader = DataLoader(val_dataset, batch_size=BATCH_SIZE, shuffle=False)
    test_loader = DataLoader(test_dataset, batch_size=BATCH_SIZE, shuffle=False)
    print("Class mapping:", train_dataset.class_to_idx)
    return train_loader, val_loader, test_loader, train_dataset.class_to_idx
if __name__ == "__main__":
    train_loader, val_loader, test_loader, class_map = get_data_loaders()
    print(f"Train samples: {len(train_loader.dataset)}")
    print(f"Validation samples: {len(val_loader.dataset)}")
    print(f"Test samples: {len(test_loader.dataset)}")