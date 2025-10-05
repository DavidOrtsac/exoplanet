#!/bin/bash
set -e

# Activate Python virtual environment
source /opt/venv/bin/activate

echo "🚀 Starting deployment..."
echo "📍 Current directory: $(pwd)"
echo "📍 Python: $(which python3)"

# Check and fix vector store
echo "🔍 Checking vector store..."
python3 -c "
import sys
import os
sys.path.append('ml-service')
sys.path.append('ml-service/scripts')

# Check if vector store exists and is valid
vector_store_path = 'ml-service/data/default_vector_store.pkl'
if os.path.exists(vector_store_path):
    with open(vector_store_path, 'rb') as f:
        first_bytes = f.read(10)
        if first_bytes.startswith(b'version'):
            print('⚠️ Vector store is a Git LFS pointer file!')
            print('🧠 Will regenerate on first use (takes 2-3 minutes once)...')
        else:
            print('✅ Vector store exists and appears valid.')
else:
    print('⚠️ Vector store not found. Will generate on first use.')
"

# Start Flask backend with Gunicorn
echo "🚀 Starting Flask ML service with Gunicorn on port 5001..."
cd ml-service
gunicorn --bind 0.0.0.0:5001 --workers 2 --timeout 300 --log-level info --access-logfile '-' --error-logfile '-' --pythonpath . app:app &
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
