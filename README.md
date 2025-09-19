# NASA Exoplanet Detective (Kepler KOI Classifier)

A student-friendly, production-ready demo that predicts whether a Kepler signal is an exoplanet CANDIDATE or a FALSE POSITIVE. It ships with:
- A physics-only model (no vetting flags) trained on NASA KOI data
- A beautiful educational web UI with witty, accurate explanations
- Honest evaluation on a held‑out test set
- Paste-ready test cases (answered vs heldout)

This project is perfect for hackathons, teaching, and rapid prototyping.

---

## 1) Quickstart

Prerequisites:
- Python 3.12 (recommended)
- macOS/Linux (Windows WSL works)
- **OpenAI API Key** (required for LLM features)

### Step 1: Get OpenAI API Key
1. Go to https://platform.openai.com/api-keys
2. Sign up/login to OpenAI
3. Click "Create new secret key"
4. Copy the key (starts with `sk-proj-...`)
5. **IMPORTANT:** You'll need to add payment method to your OpenAI account (costs ~$0.01-0.05 per prediction)

### Step 2: Setup Environment
```bash
git clone <your-repo-url>
cd exoplanet_app
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt

# Copy environment template and add your API key
cp .env.example .env
# Edit .env file and replace 'your_openai_api_key_here' with your actual key
```

### Step 3: Run the App
```bash
# Train models (if needed)
python3 scripts/train_model_no_flags.py
# Start the web app
python3 app.py
```
Open: `http://localhost:5002`

### Troubleshooting Setup
- **"OPENAI_API_KEY environment variable is required"**: Make sure you created `.env` file with your API key
- **Port busy**: Change PORT in `.env` file or use `PORT=5003 python3 app.py`
- **OpenAI API errors**: Check your API key and account has billing enabled

---

## 2) Project Structure

```
exoplanet_app/
  app.py                     # Flask API + web app
  templates/index.html       # Beautiful educational UI
  data_loader.py             # Quick CSV sanity load
  train_model.py             # (legacy) with vetting flags (high, but "cheaty")
  train_model_no_flags.py    # Physics-only training (honest baseline)
  evaluate_model.py          # Comprehensive evaluation script
  improve_model.py           # Feature eng., boosting, tuning experiments
  koi_data.csv               # NASA Kepler KOI table (commented header)
  heldout_test_rows.csv      # 20% split rows (never seen during training)
  answered_test_data.csv     # Examples from training set
  heldout_test_data.csv      # Examples from test set
  model.pkl / scaler.pkl     # Legacy model (with flags)
  model_no_flags.pkl         # Physics-only model
  scaler_no_flags.pkl        # Scaler for physics-only model
  requirements.txt           # Python deps
  README.md                  # This file
```

---

## 3) Data: What it is and how we load it

- `koi_data.csv` is the NASA Kepler Objects of Interest table.
- It begins with many `#` comment lines (metadata). Load with:
  - `pd.read_csv('koi_data.csv', comment='#')`
- Key columns used by the physics-only model:
  - `koi_period` (days)
  - `koi_duration` (hours)
  - `koi_depth` (ppm)
  - `koi_prad` (Earth radii)
  - `koi_impact` (0 center … 1 grazing)
  - `koi_teq` (K)
- Target label used: `koi_pdisposition ∈ {CANDIDATE, FALSE POSITIVE}`

Vetting flags you may see (NOT used by the honest model):
- `koi_fpflag_nt` (not transit-like)
- `koi_fpflag_ss` (stellar eclipse)

> We purposely avoided these flags in the honest model, because they encode post‑vetting information (too close to an answer key).

---

## 4) Training the model

Physics-only baseline (honest):
```bash
source .venv/bin/activate
python3 train_model_no_flags.py
```
Outputs:
- `model_no_flags.pkl` and `scaler_no_flags.pkl`
- Typical metrics on held-out set (20%):
  - Accuracy ≈ 84.2%
  - AUC-ROC ≈ 0.917

Legacy (with vetting flags — higher, but not fair in production):
```bash
python3 train_model.py
# Accuracy ≈ 93.5%, AUC ≈ 0.97 (inflated by vetting flags)
```

---

## 5) Evaluating thoroughly

Run the full evaluation suite:
```bash
python3 evaluate_model.py
```
This prints:
- Test accuracy, precision/recall/F1
- AUC-ROC
- Confusion matrix
- Cross‑validation scores
- Feature importance
- Sample predictions on known positives/negatives

Expected honest scores: ~84.2% accuracy, AUC ~0.917.

---

## 6) Running the web app

```bash
source .venv/bin/activate
python3 app.py
# App: http://localhost:5001
```
If 5001 is busy:
```bash
pkill -f "python.*app.py" && python3 app.py
```

### UI Highlights
- 6 inputs only: `koi_period`, `koi_duration`, `koi_depth`, `koi_prad`, `koi_impact`, `koi_teq`
- Educational blurbs for each input
- Prediction + confidence
- Dynamic, witty explanations for both CANDIDATE and FALSE POSITIVE cases

---

## 7) API usage (curl)

POST JSON to `/predict` with the 6 fields:
```bash
curl -sS -X POST http://127.0.0.1:5001/predict \
  -H 'Content-Type: application/json' \
  -d '{
    "koi_period": 1.538180949,
    "koi_duration": 1.2635,
    "koi_depth": 841.0,
    "koi_prad": 1.0,
    "koi_impact": 0.932,
    "koi_teq": 602
  }'
```
Response:
```json
{"prediction":"CANDIDATE","confidence":0.87}
```

---

## 8) Paste‑ready test cases

The file `heldout_test_data.csv` contains 10 cases never seen during training.
Here are 5 quick ones (copy into the UI or use the API):

CANDIDATE (expected):
- K01702.01 — period `1.538180949`, duration `1.2635`, depth `841.0`, prad `1.0`, impact `0.932`, teq `602`
- K05577.01 — period `495.51899`, duration `3.592`, depth `297.6`, prad `2.94`, impact `0.6052`, teq `305`
- K07708.01 — period `6.70242786`, duration `1.221`, depth `65.3`, prad `1.82`, impact `0.369`, teq `1367`

FALSE POSITIVE (expected):
- K03172.02 — period `6.5588346`, duration `3.034`, depth `41.2`, prad `0.7`, impact `0.7173`, teq `973`  
  (Note: our honest model sometimes misclassifies this one. Great teaching case.)
- K06139.01 — period `0.905677864`, duration `2.2432`, depth `3670.4`, prad `325.51`, impact `1.321`, teq `3989`

Also see:
- `answered_test_data.csv` (from training set; expect higher confidence)
- `heldout_test_rows.csv` (complete 20% split rows with labels)

---

## 9) Known limitations (honest report)

- Physics‑only features (6 inputs) → honest, but less accurate than using vetting flags.
- We classify summarized KOI entries, not raw light curves.
- Edge cases (grazing, blended stars, ultra‑shallow depths) can fool the model.
- Confidence is not calibrated to probability (consider calibration if needed).

---

## 10) Improving accuracy

Try these, in order of ROI:
1. Feature engineering (see `improve_model.py`):
   - `depth_per_radius_squared`, `period_duration_ratio`, interactions, outlier flags
2. Better algorithms:
   - Gradient Boosting / XGBoost / LightGBM
3. Hyperparameter tuning:
   - Grid/Random/Bayesian search for RF/GBM
4. Data curation:
   - Remove outliers; stratify by `koi_kepmag`, `koi_steff`, period bins
5. Calibration:
   - Reliability curves/Brier score to align confidence with reality
6. Ensembling:
   - Stack multiple models for robustness

Stretch goal:
- Move upstream: analyze raw light curves (e.g., BLS period search), extract your own period/duration/depth, then classify.

---

## 11) Troubleshooting

- CSV parse error ("Expected 1 fields…"):
  - Load with `comment='#'` (already handled in scripts).
- Port already in use (5001):
  - `pkill -f "python.*app.py" && python3 app.py`
- Module not found:
  - `source .venv/bin/activate && pip install -r requirements.txt`
- App loads but predictions fail:
  - Ensure `model_no_flags.pkl` and `scaler_no_flags.pkl` exist (retrain if missing).

---

## 12) FAQ

- Why not use `koi_fpflag_*`?
  - They’re post‑vetting hints; great for scoreboards, bad for honest deployment.
- Why does the model occasionally miss shallow, grazing cases?
  - Correlations ≠ physics. Add engineered features that check geometry consistency.
- Can this work for TESS?
  - Yes, if you map TESS columns to the 6 inputs (or retrain on TESS tables).
- Can we use LLMs?
  - Yes. LLMs can reason about physics, explain decisions, and even help sanity‑check edge cases.

---

## 13) Roadmap (48‑hour Hackathon‑friendly)

Day 1:
- Baseline physics‑only model + honest evaluation
- Ship polished UI with educational copy
- Generate answered vs heldout test sets

Day 2:
- Add engineered features and try Gradient Boosting
- Create a calibration chart and subgroup metrics (magnitude, temperature, period bins)
- Stretch: simple light‑curve pipeline (BLS → features → classifier)

Deliverables:
- Demo URL/screenshots
- README (this file) with results and caveats
- Reproducible scripts and versions

---

## 14) License

Educational/demo use. Cite NASA Exoplanet Archive for the KOI data. NASA logos/marks may have separate restrictions.
