#!/bin/bash

# Install Python dependencies
echo "📦 Installing Python dependencies..."
pip install -r ml-service/requirements.txt

# Generate vector store if it doesn't exist
echo "🔍 Checking for vector store..."
if [ ! -f "ml-service/data/default_vector_store.pkl" ]; then
    echo "🧠 Generating vector store from dataset (this may take a few minutes)..."
    cd ml-service
    python -c "
from scripts.llm_in_context_classifier import LLMInContextClassifier
import os
print('Initializing classifier to generate vector store...')
classifier = LLMInContextClassifier()
print('✅ Vector store generated successfully!')
"
    cd ..
else
    echo "✅ Vector store already exists"
fi

# Start Flask backend in the background
echo "🚀 Starting Flask ML service on port 5001..."
cd ml-service
export FLASK_DEBUG=0
export PORT=5001
python app.py &
FLASK_PID=$!
cd ..

# Give Flask a moment to start
sleep 5

# Start Next.js frontend on Railway's PORT
echo "🌐 Starting Next.js frontend on port ${PORT}..."
export NEXT_PUBLIC_ML_SERVICE_URL=http://localhost:5001
npm run start

# If Next.js exits, kill Flask too
kill $FLASK_PID

