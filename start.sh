#!/bin/bash
set -e

echo "🚀 Starting deployment..."

# Set the Python path
export PYTHONPATH=$PYTHONPATH:$(pwd)/ml-service/scripts

# Generate vector store if it doesn't exist
if [ ! -f "ml-service/data/default_vector_store.pkl" ]; then
    echo "🧠 Generating vector store (this may take 2-3 minutes)..."
    python3 -c "from llm_in_context_classifier import LLMInContextClassifier; print('Initializing classifier...'); LLMInContextClassifier()"
    echo "✅ Vector store generated!"
else
    echo "✅ Vector store already exists."
fi

# Start Flask backend with Gunicorn
echo "🚀 Starting Flask ML service with Gunicorn on port 5001..."
cd ml-service
gunicorn --bind 0.0.0.0:5001 --workers 2 --timeout 120 --access-logfile '-' --error-logfile '-' app:app &
FLASK_PID=$!
cd ..

# Wait for Flask to be ready
echo "⏳ Waiting for Flask to start..."
for i in {1..60}; do
    if curl -s http://localhost:5001/health > /dev/null; then
        echo "✅ Flask is ready!"
        break
    fi
    if [ $i -eq 60 ]; then
        echo "❌ Flask failed to start within 60s. See build logs."
        exit 1
    fi
    sleep 1
done

# Start Next.js frontend
echo "🌐 Starting Next.js frontend on port ${PORT}..."
trap "kill $FLASK_PID" EXIT
npm run start

