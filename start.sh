#!/bin/bash
set -e

# Activate Python virtual environment
source /opt/venv/bin/activate

echo "🚀 Starting deployment..."
echo "📍 Current directory: $(pwd)"
echo "📍 Python: $(which python3)"

# Check and fix vector store
echo "🔍 Checking vector store..."
VECTOR_STORE="ml-service/data/default_vector_store.pkl"

if [ -f "$VECTOR_STORE" ]; then
    SIZE=$(stat -f%z "$VECTOR_STORE" 2>/dev/null || stat -c%s "$VECTOR_STORE" 2>/dev/null)
    if [ "$SIZE" -lt 1024 ]; then
        echo "⚠️ Vector store is a Git LFS pointer file! Downloading actual file..."
        rm "$VECTOR_STORE"
        curl -L -o "$VECTOR_STORE" "https://media.githubusercontent.com/media/DavidOrtsac/exoplanet/main/ml-service/data/default_vector_store.pkl"
        echo "✅ Vector store downloaded."
    else
        echo "✅ Vector store exists and is valid."
    fi
else
    echo "⚠️ Vector store not found. Downloading now..."
    curl -L -o "$VECTOR_STORE" "https://media.githubusercontent.com/media/DavidOrtsac/exoplanet/main/ml-service/data/default_vector_store.pkl"
    echo "✅ Vector store downloaded."
fi

# Start Flask backend with Gunicorn
echo "🚀 Starting Flask ML service with Gunicorn on port 5001..."
cd ml-service
# One worker: each extra worker duplicates the whole pandas/sklearn/openai stack in RAM,
# and every worker must share SECRET_KEY or session cookies fail across them.
# Cap glibc arenas: each gunicorn thread would otherwise get its own and hold freed memory
export MALLOC_ARENA_MAX=2
gunicorn --bind 0.0.0.0:5001 --workers 1 --threads 4 --max-requests 200 --max-requests-jitter 50 --timeout 300 --log-level info --access-logfile '-' --error-logfile '-' --pythonpath . app:app &
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
