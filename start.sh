#!/bin/bash
set -e

# Activate Python virtual environment
source /opt/venv/bin/activate

echo "🚀 Starting deployment..."
echo "📍 Current directory: $(pwd)"
echo "📍 Python: $(which python3)"
echo "📍 PYTHONPATH: $PYTHONPATH"

# Set the Python path
export PYTHONPATH=$(pwd)/ml-service:$(pwd)/ml-service/scripts:$PYTHONPATH

# Generate vector store if it doesn't exist
if [ ! -f "ml-service/data/default_vector_store.pkl" ]; then
    echo "🧠 Generating vector store (this may take 2-3 minutes)..."
    cd ml-service
    python3 << 'PYEOF'
import sys
sys.path.insert(0, 'scripts')
from llm_in_context_classifier import LLMInContextClassifier
print('Initializing classifier...')
classifier = LLMInContextClassifier()
print('✅ Vector store generated successfully!')
PYEOF
    cd ..
    echo "✅ Vector store generation complete!"
else
    echo "✅ Vector store already exists."
fi

# Start Flask backend with Gunicorn
echo "🚀 Starting Flask ML service with Gunicorn on port 5001..."
cd ml-service
export PYTHONPATH=$(pwd):$(pwd)/scripts:$PYTHONPATH
gunicorn --bind 0.0.0.0:5001 --workers 2 --timeout 120 --log-level info --access-logfile '-' --error-logfile '-' app:app &
FLASK_PID=$!
echo "Flask PID: $FLASK_PID"
cd ..

# Wait for Flask to be ready
echo "⏳ Waiting for Flask to start..."
for i in {1..60}; do
    if ! kill -0 $FLASK_PID 2>/dev/null; then
        echo "❌ Flask process died!"
        exit 1
    fi
    
    if wget -q --spider http://localhost:5001/health 2>/dev/null || curl -sf http://localhost:5001/health > /dev/null 2>&1; then
        echo "✅ Flask is ready!"
        break
    fi
    
    if [ $i -eq 60 ]; then
        echo "❌ Flask failed to respond within 60s."
        exit 1
    fi
    sleep 1
done

# Start Next.js frontend
echo "🌐 Starting Next.js frontend on port ${PORT}..."
trap "kill $FLASK_PID" EXIT
npm run start
