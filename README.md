# RespiTrust

**Explainable AI-Based Multi-class Chest X-Ray Diagnostics System**
Team Fourmula Coders, ABES Institute of Technology, Ghaziabad (SEVA FIRST Innovation Challenge 2026, Category II).

RespiTrust is an AI screening aid for pneumonia. A user uploads a chest X-ray, an ensemble of three neural networks classifies it as **Normal / Bacterial / Viral pneumonia**, heat-maps show where the AI looked, and a doctor reviews the case. The app works in **Hindi and English**, with voice and a talking robot helper.

> **Screening aid only.** RespiTrust does not replace a doctor and has no clinical approval. Not tested on real patients yet.

## Features
- 3-model ensemble: EfficientNet-B0, DenseNet121, MobileNetV2 (average of softmax, flip test-time augmentation)
- Confidence gate: below 0.6 the app says "unsure"
- Explainability: Grad-CAM, Saliency map, LIME
- Patient, Doctor and Admin portals (case chat, doctor review, audit log)
- Hindi / English interface, voice input/output, talking robot, chatbot
- Test history and trend

## Test results (lab test, not a clinical trial)
| Model | Accuracy on 701 held-out images |
|---|---|
| EfficientNet-B0 | 94.72% |
| DenseNet121 | 94.01% |
| MobileNetV2 | 94.58% |
| **Ensemble of 3** | **95.15%** (667/701, 95% CI 93.3 to 96.5) |

Known weakness: bacterial vs viral pneumonia are the most confused pair.

## Tech stack
Python, FastAPI, PyTorch, OpenCV, SQLite, plain HTML/CSS/JavaScript.

## How to run
1. **Model files:** the trained weights (`ens_*.pt`) are not in this repository because they are large. Place them in the `backend` folder (ask the team for the download link).
2. **Backend** (from the `backend` folder; it takes about 40 seconds to start):
   ```
   pip install fastapi uvicorn torch torchvision opencv-python numpy pillow
   python -m uvicorn main_portals:app --host 0.0.0.0 --port 8000
   ```
3. **Frontend** (from the `frontend` folder):
   ```
   python -m http.server 5500
   ```
4. Open `http://localhost:5500`.

## Demo logins (demo only)
These are demo credentials. **Change them before any real use.**
- Admin: `admin@respitrust.com` / `Admin@12345`
- Create a doctor from the `backend` folder: `python create_doctor.py "Dr. Name" doctor@example.com "StrongPassword"`

## Privacy
The database (`respitrust.db`) and uploaded X-ray images are not stored in this repository. Use real patient X-rays only with written consent.

## Team
Fourmula Coders: Divyansh Garg (team leader) and team. ABES Institute of Technology, Ghaziabad.
