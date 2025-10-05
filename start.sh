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
import requests
from tqdm import tqdm

sys.path.append('ml-service')
sys.path.append('ml-service/scripts')

# This is the direct download link to the LFS file in your repo.
LFS_URL = 'https://github.com/DavidOrtsac/exoplanet/raw/main/ml-service/data/default_vector_store.pkl'
VECTOR_STORE_PATH = 'ml-service/data/default_vector_store.pkl'
FILE_SIZE = 216 * 1024 * 1024 # ~216 MB

def download_file(url, path):
    print(f'⬇️ Downloading vector store from {url}...')
    try:
        with requests.get(url, stream=True) as r:
            r.raise_for_status()
            total_size = int(r.headers.get('content-length', 0))
            block_size = 8192
            with open(path, 'wb') as f, tqdm(
                total=total_size, unit='iB', unit_scale=True, desc='Downloading'
            ) as bar:
                for chunk in r.iter_content(chunk_size=block_size):
                    f.write(chunk)
                    bar.update(len(chunk))
        print(f'✅ Download complete: {path}')
        return True
    except Exception as e:
        print(f'❌ Download failed: {e}')
        return False

# Check if vector store exists and is valid
if os.path.exists(VECTOR_STORE_PATH):
    # Check if it's a pointer file by its small size
    if os.path.getsize(VECTOR_STORE_PATH) < 1024:
        print('⚠️ Vector store is a Git LFS pointer file! Deleting and re-downloading...')
        os.remove(VECTOR_STORE_PATH)
        download_file(LFS_URL, VECTOR_STORE_PATH)
    else:
        print('✅ Vector store exists and is valid.')
else:
    print('⚠️ Vector store not found. Downloading now...')
    download_file(LFS_URL, VECTOR_STORE_PATH)
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
