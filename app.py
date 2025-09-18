from flask import Flask, request, jsonify, render_template
import pickle
import numpy as np

app = Flask(__name__)

with open('model_no_flags.pkl', 'rb') as f:
    model = pickle.load(f)
with open('scaler_no_flags.pkl', 'rb') as f:
    scaler = pickle.load(f)

@app.route('/')
def home():
    return render_template('index.html')

@app.route('/predict', methods=['POST'])
def predict():
    data = request.get_json()
    fields = ['koi_period', 'koi_duration', 'koi_depth', 'koi_prad',
              'koi_impact', 'koi_teq']
    features = [float(data[f]) for f in fields]
    features_scaled = scaler.transform([features])
    prediction = model.predict(features_scaled)[0]
    probability = model.predict_proba(features_scaled)[0]
    return jsonify({
        'prediction': 'CANDIDATE' if int(prediction) == 1 else 'FALSE POSITIVE',
        'confidence': float(max(probability))
    })

if __name__ == '__main__':
    app.run(debug=True, port=5001)
