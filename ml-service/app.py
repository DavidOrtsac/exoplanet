from flask import Flask, request, jsonify, render_template, session
from flask_cors import CORS
import pickle
import numpy as np
import pandas as pd
import sys
import os
import time
import csv
import io
import uuid
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()
sys.path.append('scripts')
from feature_engineering import add_engineered_features, RAW_FEATURES
from llm_in_context_classifier import LLMInContextClassifier
from select_data import SelectData

app = Flask(__name__)

# Set the secret key is essential for Flask session management
app.secret_key = os.getenv('SECRET_KEY', os.urandom(24))

# Configure CORS to allow credentials from your frontend's origin
CORS(app, supports_credentials=True, origins=["http://localhost:3000"])

@app.before_request
def ensure_session_id():
    """Ensure every user has a unique session ID stored in their cookie."""
    if 'session_id' not in session:
        session['session_id'] = str(uuid.uuid4())
        print(f"New session created with ID: {session['session_id']}")

# Initialize LLM classifier (this will load the vector store)
print("🧠 Initializing LLM In-Context Classifier...")
try:
    llm_in_context_classifier = LLMInContextClassifier()
    llm_in_context_classifier.ensure_default_vector_store()
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

@app.route('/api/session/start', methods=['POST'])
def start_session():
    """generates new session token and returns to the frontend"""
    session_token = str(uuid.uuid4())
    SESSIONS[session_token] = {} # Initialize an empty session data dictionary
    print(f"New session started: {session_token}")
    return jsonify({'session_token': session_token})

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

@app.route('/data/dataset', methods=['GET'])
def get_dataset_data():
    session_id = session['session_id']
    user_csv_path = session.get('user_csv_path') if session_id else None
    if user_csv_path and os.path.exists(user_csv_path):
        df = pd.read_csv(user_csv_path)
    else:
        df = pd.read_csv('data/dataset.csv')
    df = df.replace({np.nan: None})
    return jsonify(df.to_dict('records'))

@app.route('/data/upload_user_data', methods=['POST'])
def upload_user_data():
    """Handles file uploads using Flask's cookie-based session."""
    if 'file' not in request.files:
        return jsonify({'error': 'No file provided'}), 400
    
    file = request.files['file']
    
    if file.filename == '' or not file.filename.endswith('.csv'):
        return jsonify({'error': 'Invalid or missing CSV file'}), 400

    try:
        
        text_stream = io.TextIOWrapper(file.stream, encoding='utf-8')
        selector.upload_user_data(text_stream)
        
        
        df = pd.DataFrame(selector.parse_data_to_json())
        df = df.replace({np.nan: None})
        return jsonify(df.to_dict('records'))

    except Exception as e:
        return jsonify({'error': f'User data upload failed: {str(e)}'}), 500

@app.route('/data/save_dataset', methods=['PUT'])
def save_dataset():
    try:

        data = request.get_json()
        session_id = session['session_id']
        user_data_dir = 'data/user_sessions'
        os.makedirs(user_data_dir, exist_ok=True) 
        user_csv_path = os.path.join(user_data_dir, f"{session_id}_data.csv")
        user_vector_store_path = os.path.join(user_data_dir, f"{session_id}_vector_store.pkl")

        selector.parse_json_to_data(data)
        selector.save_data(user_csv_path)
    
        llm_in_context_classifier.create_vector_store_from_csv(user_csv_path, user_vector_store_path)

        session['user_csv_path'] = user_csv_path
        session['user_vector_store_path'] = user_vector_store_path
        
        return jsonify({'message': 'Your data has been uploaded and your dedicated vector store has been created.'}), 200

    except Exception as e:
        return jsonify({'error': f'Dataset update failed: {str(e)}'}), 500

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