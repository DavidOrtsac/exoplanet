
# i clearly ai-d some of this because i got tired. but basically celery is like jobs in rails
import os
import sys

sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))

from celery import Celery
from dotenv import load_dotenv
from tqdm import tqdm
from sklearn.neighbors import NearestNeighbors
import pickle
from openai import OpenAI
import pandas as pd

load_dotenv()

from scripts.llm_in_context_classifier import LLMInContextClassifier, CLIENT, EMBEDDING_MODEL

CELERY_BROKER_URL = os.getenv('CELERY_BROKER_URL', 'redis://localhost:6379/0')
CELERY_RESULT_BACKEND = os.getenv('CELERY_RESULT_BACKEND', 'redis://localhost:6379/0')

celery_app = Celery(
    'ml-service',
    broker=CELERY_BROKER_URL,
    backend=CELERY_RESULT_BACKEND,
    include=['ml-service.celery_worker']
)

celery_app.conf.update(
    task_track_started=True,
    broker_connection_retry_on_startup=True
)

def _get_embeddings_with_progress(task_instance, texts):
    batch_size = 500
    embeddings = []
    total_batches = (len(texts) + batch_size - 1) // batch_size
    for i, j in enumerate(range(0, len(texts), batch_size)):
        batch = [str(t) for t in texts[j:j+batch_size]]
        response = CLIENT.embeddings.create(input=batch, model=EMBEDDING_MODEL)
        embeddings.extend([item.embedding for item in response.data])
        
        task_instance.update_state(
            state='PROGRESS',
            meta={'current': int(((i + 1) / total_batches) * 100)}
        )
    return embeddings

@celery_app.task(name='create_vector_store_task', bind=True)
def create_vector_store_task(self, csv_path, output_pkl_path):
    try:
        self.update_state(state='PROGRESS', meta={'current': 0})
        
        df = pd.read_csv(csv_path, comment='#')
        df_clean = df.dropna(subset=['period', 'duration', 'depth', 'prad', 'teq'])
        
        original_data = df_clean.to_dict('records')
        formatter = LLMInContextClassifier()
        texts_to_embed = [formatter._format_row_for_embedding(row) for row in original_data]

        if not texts_to_embed:
            return {'status': 'Success', 'message': 'No data to process.'}

        embeddings = _get_embeddings_with_progress(self, texts_to_embed)

        self.update_state(state='PROGRESS', meta={'current': 98})
        vector_store_index = NearestNeighbors(n_neighbors=25, algorithm='ball_tree')
        if embeddings:
            vector_store_index.fit(embeddings)

        self.update_state(state='PROGRESS', meta={'current': 99})
        with open(output_pkl_path, 'wb') as f:
            pickle.dump({'vector_store_index': vector_store_index, 'original_data': original_data}, f)
    
        return {'status': 'Success', 'output_path': output_pkl_path}
        
    except Exception as e:
        print(f"Task failed for '{csv_path}'. Error: {e}")
        self.update_state(state='FAILURE', meta={'exc_type': type(e).__name__, 'exc_message': str(e)})
        return {'status': 'Failure', 'error': str(e)}