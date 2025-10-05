#!/bin/bash
set -e

echo "🚀 Starting deployment..."

# Generate vector store if it doesn't exist
if [ ! -f "ml-service/data/default_vector_store.pkl" ]; then
    echo "🧠 Generating vector store (this may take 2-3 minutes)..."
    python3 -c "import sys; sys.path.append('ml-service/scripts'); from llm_in_context_classifier import LLMInContextClassifier; print('Initializing classifier...'); LLMInContextClassifier()"
    echo "✅ Vector store generated!"
else
    echo "✅ Vector store already exists."
fi

# Start Flask backend with Gunicorn
echo "🚀 Starting Flask ML service with Gunicorn on port 5001..."
cd ml-service
gunicorn --bind 0.0.0.0:5001 --workers 2 --timeout 120 app:app > /tmp/flask.log 2>&1 &
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
        echo "❌ Flask failed to start within 60s. Logs:"
        cat /tmp/flask.log
        exit 1
    fi
    sleep 1
done

# Start Next.js frontend
echo "🌐 Starting Next.js frontend on port ${PORT}..."
export NEXT_PUBLIC_ML_SERVICE_URL=http://localhost:5001
trap "kill $FLASK_PID" EXIT
npm run start

