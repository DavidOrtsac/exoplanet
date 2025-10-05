#!/bin/bash
set -e

# Activate Python virtual environment
source /opt/venv/bin/activate

echo "🚀 Starting deployment..."
echo "📍 Current directory: $(pwd)"
echo "📍 Python: $(which python3)"

# Generate vector store if it doesn't exist
if [ ! -f "ml-service/data/default_vector_store.pkl" ]; then
    echo "🧠 Generating vector store (this may take 2-3 minutes)..."
    echo "🔎 Python site info before generating vector store:"
    python3 - <<'PY'
import sys, site, numpy as np
print('sys.prefix=', sys.prefix)
print('sys.path=')
for p in sys.path: print(' -', p)
print('numpy version:', np.__version__)
print('numpy file:', getattr(np, '__file__', 'N/A'))
PY
    # Run from root to avoid numpy import issues, script now uses absolute paths
    python3 -c "import sys; sys.path.append('ml-service'); sys.path.append('ml-service/scripts'); from llm_in_context_classifier import LLMInContextClassifier; print('Initializing classifier...'); classifier = LLMInContextClassifier(); classifier.ensure_default_vector_store(); print('✅ Vector store generated!')"
    echo "✅ Vector store generation complete!"
else
    echo "✅ Vector store already exists."
fi

# Start Flask backend with Gunicorn
echo "🚀 Starting Flask ML service with Gunicorn on port 5001..."
cd ml-service
gunicorn --bind 0.0.0.0:5001 --workers 2 --timeout 120 --log-level info --access-logfile '-' --error-logfile '-' --pythonpath . app:app &
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
    
    if wget -q --spider http://127.0.0.1:5001/health 2>/dev/null || curl -sf http://127.0.0.1:5001/health > /dev/null 2>&1; then
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
