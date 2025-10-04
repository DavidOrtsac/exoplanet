# In ml-service/scripts/llm_in_context_classifier.py

import pandas as pd
import numpy as np
import os
import pickle
from openai import OpenAI
from sklearn.neighbors import NearestNeighbors
from sklearn.model_selection import train_test_split
from tqdm import tqdm

# --- Configuration ---
API_KEY = os.getenv('OPENAI_API_KEY')
if not API_KEY:
    raise ValueError("OPENAI_API_KEY is required.")

CLIENT = OpenAI(api_key=API_KEY)
EMBEDDING_MODEL = "text-embedding-3-small"
CLASSIFIER_MODEL = "gpt-4o-mini"
DEFAULT_VECTOR_STORE_PATH = "data/default_vector_store.pkl"
BASE_DATASET_PATH = 'data/dataset.csv'

class LLMInContextClassifier:
    """
    A classifier that can create and use on-demand, session-specific vector stores.
    """
    def __init__(self):
        # The classifier no longer loads anything on initialization.
        # It's now a collection of tools.
        pass

    def _format_row_for_embedding(self, row):
        return (
            f"period={row['period']:.2f}, "
            f"duration={row['duration']:.3f}, "
            f"depth={row['depth']:.1f}, "
            f"radius={row['prad']:.2f}, "
            f"temp={row['teq']:.0f}"
        )

    def _get_embeddings(self, texts):
        # Batch the requests to respect API limits
        batch_size = 500
        embeddings = []
        for i in tqdm(range(0, len(texts), batch_size), desc="Embedding Batches"):
            batch = [str(t) for t in texts[i:i+batch_size]] # Ensure string conversion
            response = CLIENT.embeddings.create(input=batch, model=EMBEDDING_MODEL)
            embeddings.extend([item.embedding for item in response.data])
        return embeddings

    def create_vector_store_from_csv(self, csv_path, output_pkl_path):
        """
        Reads a CSV, generates embeddings, builds a vector store, and saves it to a file.
        This is the core function for creating user-specific stores.
        """
        print(f"INFO: Creating vector store from '{csv_path}'...")
        df = pd.read_csv(csv_path, comment='#')
        df_clean = df.dropna(subset=['period', 'duration', 'depth', 'prad', 'teq'])
        
        # We use ALL data from the provided CSV for the vector store
        original_data = df_clean.to_dict('records')
        
        texts_to_embed = [self._format_row_for_embedding(row) for row in original_data]

        if not texts_to_embed:
            print("WARNING: No data to embed. Vector store will be empty.")
            embeddings = []
        else:
            embeddings = self._get_embeddings(texts_to_embed)

        print("INFO: Building NearestNeighbors index...")
        vector_store_index = NearestNeighbors(n_neighbors=25, algorithm='ball_tree')
        if embeddings:
            vector_store_index.fit(embeddings)

        print(f"INFO: Saving vector store to '{output_pkl_path}'...")
        with open(output_pkl_path, 'wb') as f:
            pickle.dump({
                'vector_store_index': vector_store_index,
                'original_data': original_data,
            }, f)
        print("INFO: Vector store created and saved.")

    def ensure_default_vector_store(self):
        """
        Checks if the default vector store exists, and creates it if not.
        This should be called once when the application starts.
        """
        if not os.path.exists(DEFAULT_VECTOR_STORE_PATH):
            print("INFO: Default vector store not found. Creating one from base dataset...")
            self.create_vector_store_from_csv(BASE_DATASET_PATH, DEFAULT_VECTOR_STORE_PATH)
        else:
            print("INFO: Default vector store already exists.")
            
    def _load_vector_store(self, pkl_path):
        """Loads a specific vector store from a .pkl file."""
        if not os.path.exists(pkl_path):
            return None, None
        with open(pkl_path, 'rb') as f:
            data = pickle.load(f)
            return data['vector_store_index'], data['original_data']

    def _find_similar_examples(self, query_row, vector_store_index, original_data, k=25):
        # ... (this method remains mostly the same, but receives the index and data)
        query_text = self._format_row_for_embedding(query_row)
        query_embedding = self._get_embeddings([query_text])[0]
        
        # Check if the vector store is empty
        if not hasattr(vector_store_index, 'kneighbors') or len(original_data) == 0:
            return []
            
        distances, indices = vector_store_index.kneighbors([query_embedding], n_neighbors=min(k, len(original_data)))
        return [original_data[i] for i in indices[0]]

    def _build_prompt(self, query_row, similar_examples):
        # ... (this method remains the same)
        system_prompt = (
            "You are an expert exoplanet classifier..." # (shortened for brevity)
        )
        user_prompt = "--- SIMILAR EXAMPLES ---\n"
        for example in similar_examples:
            example_text = self._format_row_for_embedding(example)
            label = "CANDIDATE" if example.get('disposition') == 1 else "FALSE POSITIVE"
            user_prompt += f"- {example_text} -> {label}\n"
        
        user_prompt += "\n--- QUERY ---\n"
        query_text = self._format_row_for_embedding(query_row)
        user_prompt += f"Based on the examples above, classify this query: {query_text} -> ?"
        return system_prompt, user_prompt

    def classify(self, query_row, vector_store_path=None):
        """
        Classifies a query using a specific vector store, or the default one if none is provided.
        """
        # Determine which vector store to use
        path_to_load = vector_store_path if vector_store_path and os.path.exists(vector_store_path) else DEFAULT_VECTOR_STORE_PATH
        
        print(f"INFO: Loading vector store for prediction: {path_to_load}")
        vector_store_index, original_data = self._load_vector_store(path_to_load)

        if vector_store_index is None:
            return "ERROR: Vector store not found."

        similar_examples = self._find_similar_examples(query_row, vector_store_index, original_data)
        system_prompt, user_prompt = self._build_prompt(query_row, similar_examples)

        try:
            # ... (API call logic remains the same)
            response = CLIENT.chat.completions.create(
                model=CLASSIFIER_MODEL,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt}
                ],
                temperature=0.0,
                max_tokens=5,
            )
            prediction = response.choices[0].message.content.strip().upper()
            return prediction if prediction in ["CANDIDATE", "FALSE POSITIVE"] else "ERROR"
        except Exception as e:
            print(f"ERROR: API call failed - {e}")
            return "ERROR"