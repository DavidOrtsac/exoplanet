from flask import Flask, request, jsonify, render_template
import pickle
import numpy as np
import pandas as pd
import sys
sys.path.append('scripts')
from feature_engineering import add_engineered_features, RAW_FEATURES

app = Flask(__name__)

with open('models/model_no_flags.pkl', 'rb') as f:
    model = pickle.load(f)
with open('models/scaler_no_flags.pkl', 'rb') as f:
    scaler = pickle.load(f)

@app.route('/')
def home():
    return render_template('index.html')

@app.route('/predict', methods=['POST'])
def predict():
    data = request.get_json()
    fields = ['koi_period', 'koi_duration', 'koi_depth', 'koi_prad',
              'koi_impact', 'koi_teq']
    # Build a single-row DataFrame for raw features
    raw_values = {f: float(data[f]) for f in fields}
    raw_df = pd.DataFrame([raw_values], columns=RAW_FEATURES)
    # Add engineered features (same as training)
    features_df = add_engineered_features(raw_df, include_raw=True)
    # Scale and predict
    features_scaled = scaler.transform(features_df.values)
    prediction = model.predict(features_scaled)[0]
    proba = model.predict_proba(features_scaled)[0]
    # Probability of class 1 (CANDIDATE)
    classes = list(getattr(model, 'classes_', [0, 1]))
    cand_idx = classes.index(1) if 1 in classes else int(np.argmax(proba))
    cand_conf = float(proba[cand_idx])
    return jsonify({
        'prediction': 'CANDIDATE' if int(prediction) == 1 else 'FALSE POSITIVE',
        'confidence': cand_conf
    })

if __name__ == '__main__':
    app.run(debug=True, port=5001)
