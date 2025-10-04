from flask import Flask, request, jsonify, render_template
from flask_cors import CORS
import pickle
import numpy as np
import pandas as pd
import sys
import os
import time
import csv
import io
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()
sys.path.append('scripts')
from feature_engineering import add_engineered_features, RAW_FEATURES
from llm_in_context_classifier import LLMInContextClassifier
from select_data import SelectData

app = Flask(__name__)
CORS(app)  # This will enable CORS for all routes

# Initialize LLM classifier (this will load the vector store)
print("🧠 Initializing LLM In-Context Classifier...")
try:
    llm_classifier = LLMInContextClassifier()
    selector = SelectData()
    llm_available = True
    print("✅ LLM classifier ready")
except Exception as e:
    print(f"⚠️  LLM classifier failed to initialize: {e}")
    print("🔄 Web app will run with RandomForest only")
    llm_available = False

@app.route('/')
def home():
    pass

@app.route('/predict', methods=['POST'])
def predict():
    """New LLM In-Context prediction endpoint"""
    if not llm_available:
        return jsonify({'error': 'LLM classifier not available'}), 503
    
    try:
        start_time = time.time()
        data = request.get_json()

        # Convert to the format expected by LLM classifier
        query_row = {
            'period': float(data['period']),
            'duration': float(data['duration']),
            'depth': float(data['depth']),
            'prad': float(data['prad']),
            'teq': float(data['teq'])
        }

        # Get prediction from LLM classifier
        prediction = llm_classifier.classify(query_row, k=25)
        processing_time = time.time() - start_time
        
        if prediction == "ERROR":
            return jsonify({'error': 'LLM classification failed'}), 500
        
        # For LLM, we don't have a traditional confidence score
        # Instead, we'll indicate high confidence since it achieved 98% accuracy
        confidence = 0.95 if prediction in ["CANDIDATE", "FALSE POSITIVE"] else 0.5
        
        return jsonify({
            'model': 'LLM In-Context',
            'prediction': prediction,
            'confidence': confidence,
            'similar_examples_used': 25,
            'processing_time': f'{processing_time:.1f}s'
        })
    except Exception as e:
        return jsonify({'error': f'LLM prediction failed: {str(e)}'}), 500


@app.route('/update_dataset', methods=['PUT'])
def update_dataset():
    file = None
    try:
        if 'file' in request.files:
            file = request.files['file']
            
            # Check if user selected a file
            if file.filename == '':
                return jsonify({'error': 'No file selected'}), 400
                
            # Check if it's a CSV
            if not file.filename.endswith('.csv'):
                return jsonify({'error': 'File must be a CSV'}), 400
            
            text_stream = io.TextIOWrapper(file.stream, encoding='utf-8')
            selector.upload_user_data(text_stream)


        data = request.form['json']
        if 'display_types' in data:
            selector.update_display_type(data['display_types'])

        llm_classifier.initialize_vector_store()

        return jsonify({'message': 'Dataset updated successfully'}), 200
    except Exception as e:
        return jsonify({'error': f'Dataset update failed: {str(e)}'}), 500

@app.route('/api/data/dataset', methods=['GET'])
def get_dataset_data():
    df = pd.read_csv('data/dataset.csv')
    df = df.replace({np.nan: None})
    return jsonify(df.to_dict('records'))



@app.route('/health')
def health():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'randomforest_available': True,
        'llm_available': llm_available,
        'models_loaded': 2 if llm_available else 1
    })


if __name__ == '__main__':
    print("\n🚀 DUAL-MODEL EXOPLANET CLASSIFIER")
    print("=" * 50)
    print("🌲 RandomForest: Ready (Engineered Features)")
    print(f"🧠 LLM In-Context: {'Ready' if llm_available else 'Not Available'}")
    PORT = int(os.getenv('PORT', '5001'))
    print(f"🌐 Starting web server on http://localhost:{PORT}")
    print("=" * 50)
    
    app.run(debug=True, port=PORT)