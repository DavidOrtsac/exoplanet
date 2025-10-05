#!/bin/bash
set -e  # Exit on any error

echo "🚀 Starting deployment..."

# Generate vector store if it doesn't exist
echo "🔍 Checking for vector store..."
if [ ! -f "ml-service/data/default_vector_store.pkl" ]; then
    echo "🧠 Generating vector store from dataset (this may take 2-3 minutes)..."
    cd ml-service
    python3 -c "
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
export FLASK_ENV=production
python3 app.py > /tmp/flask.log 2>&1 &
FLASK_PID=$!
cd ..

# Wait for Flask to be ready
echo "⏳ Waiting for Flask to start..."
for i in {1..30}; do
    if curl -s http://localhost:5001/health > /dev/null 2>&1; then
        echo "✅ Flask is ready!"
        break
    fi
    if [ $i -eq 30 ]; then
        echo "❌ Flask failed to start. Logs:"
        cat /tmp/flask.log
        exit 1
    fi
    sleep 1
done

# Start Next.js frontend on Railway's PORT
echo "🌐 Starting Next.js frontend on port ${PORT}..."
export NEXT_PUBLIC_ML_SERVICE_URL=http://localhost:5001

# Trap to ensure Flask is killed if Next.js exits
trap "kill $FLASK_PID" EXIT

npm run start

