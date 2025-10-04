# 🚨 CRITICAL: Model Data Source Analysis

## The Problem

YOUR TWO MODELS ARE USING DIFFERENT DATASETS!

---

## 🌲 RandomForest Model

**File:** `scripts/train_model_no_flags.py`
**Line 14:** `df = pd.read_csv('./data/koi_data.csv', comment='#')`

### What it's using:
- ❌ **KEPLER ONLY** (9,564 exoplanets)
- ❌ NOT using TESS data
- ❌ NOT using K2 data

### Training data:
```
Only Kepler: 9,564 samples
```

---

## 🧠 LLM Classifier

**File:** `scripts/llm_in_context_classifier_fixed.py`
**Line 77:** `df = pd.read_csv('data/dataset.csv', comment='#')`

### What it's using:
- ✅ **ALL THREE MISSIONS** (17,589 exoplanets)
- ✅ Kepler (9,564)
- ✅ TESS (7,703)
- ✅ K2 (322)

### Training data:
```
Multi-mission: 17,589 samples (+83.8% more than RandomForest!)
```

---

## ⚠️ Why This Is a Problem

1. **Unfair Comparison:** LLM has 83% MORE training data than RandomForest
2. **Wasted Data:** TESS and K2 data exists but RandomForest isn't using it
3. **Incomplete Testing:** You can't claim "multi-mission" if only ONE model uses it

---

## 🔧 The Fix

You need to retrain RandomForest on the combined dataset!

### Option 1: Quick Fix (Update training script)
Change line 14 in `train_model_no_flags.py`:
```python
# OLD (Kepler only):
df = pd.read_csv('./data/koi_data.csv', comment='#')

# NEW (All three missions):
df = pd.read_csv('./data/dataset.csv')
```

But wait! There's a problem...

### ⚠️ Column Name Mismatch

**Kepler format:**
- `koi_pdisposition` (CANDIDATE / FALSE POSITIVE)
- `koi_period`, `koi_duration`, etc.

**Unified format:**
- `disposition` (0 or 1)
- `period`, `duration`, etc. (no "koi_" prefix)

**You need to update the training script to handle the new format!**

---

## 📋 What Needs to Change

### In `train_model_no_flags.py`:

1. Change data source:
```python
df = pd.read_csv('./data/dataset.csv')
```

2. Update column names:
```python
# OLD:
df_clean = df[df['koi_pdisposition'].isin(['CANDIDATE', 'FALSE POSITIVE'])]
y = (df_clean['koi_pdisposition'] == 'CANDIDATE').astype(int)

# NEW:
df_clean = df.dropna(subset=['disposition'])
y = df['disposition'].astype(int)  # Already 0 or 1
```

3. Update feature names:
```python
# OLD:
features = ['koi_period', 'koi_duration', 'koi_depth', 'koi_prad', 'koi_impact', 'koi_teq']

# NEW:
features = ['period', 'duration', 'depth', 'prad', 'teq']
# Note: 'impact' is missing from dataset.csv!
```

---

## 🚨 BIGGER PROBLEM: Missing 'impact' parameter!

Looking at `dataset.csv` header:
```
type,id,name,disposition,period,duration,depth,prad,teq
```

**Missing:** `impact` (the impact parameter)!

This means:
- The unified dataset has ONLY 5 features
- RandomForest currently uses 6 features (including `koi_impact`)
- You need to either:
  1. Add 'impact' to dataset.csv, OR
  2. Retrain RandomForest without 'impact'

---

## 💡 Recommended Solution

### Option A: Train on 5 features (no impact)
- Matches what LLM uses
- Both models use same features
- Fair comparison

### Option B: Add impact to dataset.csv
- Keep all 6 features
- More accurate models
- Need to update `select_data.py` to include impact

---

## 🎯 Bottom Line

**Current State:**
- RandomForest: Trained on 9,564 Kepler samples (6 features)
- LLM: Trained on 17,589 multi-mission samples (5 features)
- **They're not comparable!**

**What You Need:**
1. Decide: 5 features or 6 features?
2. Retrain RandomForest on `dataset.csv` with chosen features
3. Update `app.py` if feature count changes
4. Re-evaluate both models on same test set

**Until you do this, you're NOT actually using the multi-mission data for RandomForest!** 🚨
