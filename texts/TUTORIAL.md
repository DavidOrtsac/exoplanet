# 🌟 NASA Exoplanet Detective - Complete User Guide

## Quick Start (5 minutes)

### 1. Setup Environment
```bash
# Make sure you're in the project directory
cd /Users/davidcastro/exoplanet_app

# Activate virtual environment (if you have one)
source .venv/bin/activate  # or create one: python3 -m venv .venv

# Install dependencies
pip install -r requirements.txt
```

### 2. Configure API Key (for LLM features)
```bash
# Create .env file if it doesn't exist
echo "OPENAI_API_KEY=your_key_here" > .env
echo "PORT=5001" >> .env

# Replace 'your_key_here' with your actual OpenAI API key
# Get one at: https://platform.openai.com/api-keys
```

### 3. Start the Web App
```bash
python3 app.py
```

Open your browser to: **http://localhost:5001**

---

## Using the Web Interface

### Input Fields (6 physical parameters):

1. **🌍 Orbital Period (days)** - How long one orbit takes
   - Example: `9.49` (like Earth's ~365 days)

2. **⏱️ Transit Duration (hours)** - How long the planet blocks its star
   - Example: `2.96` hours

3. **📉 Transit Depth (ppm)** - How much the star dims
   - Example: `615.8` (parts per million)

4. **🪐 Planet Radius (Earth radii)** - Size relative to Earth
   - Example: `2.26` (super-Earth size)

5. **🎯 Impact Parameter** - How centered the transit is
   - Example: `0.146` (0 = dead center, 1 = grazing edge)

6. **🌡️ Equilibrium Temperature (K)** - Planet's temperature
   - Example: `793` Kelvin (hot!)

### Prediction Buttons:

- **🌲 RandomForest Only** - Fast, instant prediction (~0.001s)
- **🧠 LLM Only** - AI reasoning with GPT-4o-mini (~1.5s, costs ~$0.01)
- **⚔️ Compare Both!** - See both predictions side-by-side

---

## Test Cases (Copy & Paste Ready)

### Known CANDIDATE ✅ (should predict as exoplanet):
```
Period: 1.538180949
Duration: 1.2635
Depth: 841.0
Radius: 1.0
Impact: 0.932
Temperature: 602
```
**This is K01702.01 - a confirmed exoplanet candidate**

### Known FALSE POSITIVE ❌ (should predict as NOT exoplanet):
```
Period: 0.905677864
Duration: 2.2432
Depth: 3670.4
Radius: 325.51
Impact: 1.321
Temperature: 3989
```
**This is K06139.01 - a confirmed false positive (huge radius = stellar eclipse)**

### Edge Case (tricky!):
```
Period: 6.5588346
Duration: 3.034
Depth: 41.2
Radius: 0.7
Impact: 0.7173
Temperature: 973
```
**K03172.02 - Models might disagree on this one!**

---

## API Testing (for developers)

### 1. Test RandomForest:
```bash
curl -X POST http://localhost:5001/predict/randomforest \
  -H "Content-Type: application/json" \
  -d '{
    "koi_period": 1.538180949,
    "koi_duration": 1.2635,
    "koi_depth": 841.0,
    "koi_prad": 1.0,
    "koi_impact": 0.932,
    "koi_teq": 602
  }'
```

### 2. Test LLM (requires API key):
```bash
curl -X POST http://localhost:5001/predict/llm \
  -H "Content-Type: application/json" \
  -d '{
    "koi_period": 1.538180949,
    "koi_duration": 1.2635,
    "koi_depth": 841.0,
    "koi_prad": 1.0,
    "koi_impact": 0.932,
    "koi_teq": 602
  }'
```

### 3. Compare Both:
```bash
curl -X POST http://localhost:5001/predict/both \
  -H "Content-Type: application/json" \
  -d '{
    "koi_period": 1.538180949,
    "koi_duration": 1.2635,
    "koi_depth": 841.0,
    "koi_prad": 1.0,
    "koi_impact": 0.932,
    "koi_teq": 602
  }'
```

---

## Understanding Results

### RandomForest Output:
```json
{
  "model": "RandomForest",
  "prediction": "CANDIDATE",
  "confidence": 0.87,
  "features_used": 11,
  "processing_time": "Instant"
}
```

### LLM Output:
```json
{
  "model": "LLM In-Context",
  "prediction": "CANDIDATE",
  "confidence": 0.95,
  "similar_examples_used": 25,
  "processing_time": "1.5s"
}
```

### Comparison Output:
```json
{
  "randomforest": { ... },
  "llm": { ... },
  "comparison": {
    "agreement": true  // true = models agree, false = disagree
  }
}
```

---

## Multi-Mission Dataset Info

Your app now uses data from **THREE NASA missions**:

| Mission | Count | Years Active | Survey Area |
|---------|-------|--------------|-------------|
| Kepler  | 9,564 | 2009-2013 | Single field (Cygnus) |
| TESS    | 7,703 | 2018-present | Nearly full sky |
| K2      | 322   | 2014-2018 | Multiple fields |
| **Total** | **17,589** | | |

**Note:** There are 61 duplicate entries (all within K2 data). No cross-mission duplicates!

---

## Troubleshooting

### "LLM not available" error:
- Check `.env` file has valid `OPENAI_API_KEY`
- Verify API key has billing enabled at OpenAI
- Try running with RandomForest only

### Port already in use:
```bash
pkill -f "python.*app.py"
python3 app.py
```

### Missing models:
```bash
python3 scripts/train_model_no_flags.py
```

---

## What Makes This Special for NASA Space Apps

1. ✅ **Multi-mission dataset** (Kepler + TESS + K2) - Most teams use just one!
2. ✅ **Dual-model comparison** - Shows ML vs AI approaches
3. ✅ **Production-ready web interface** - Beautiful, educational, functional
4. ✅ **Honest evaluation** - No data leakage, proper train/test split
5. ✅ **Real-time predictions** - Interactive and engaging

This is a **graduate-level project** ready for judging! 🏆
