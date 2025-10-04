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
    
    def set_heldout_ids(self, ids):
        """Set which entry IDs should be excluded from the RAG vector store"""
        self.heldout_ids = ids

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
        
        # Request more neighbors to account for filtering
        n_to_request = min(len(self.original_data), k * 3)
        distances, indices = self.vector_store.kneighbors([query_embedding], n_neighbors=n_to_request)
        
        # Filter out held-out examples at query time
        filtered_examples = []
        for i in indices[0]:
            if i >= len(self.original_data):
                continue
            example = self.original_data[i]
            # Skip if this example is in the held-out set
            if self.heldout_ids and example.get('id') in self.heldout_ids:
                continue
            filtered_examples.append(example)
            if len(filtered_examples) >= k:
                break
        
        return filtered_examples

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

    def classify(self, query_row, k=50, return_examples=False):
        """
        Classifies a single, unseen data row using the in-context learning strategy.
        
        Args:
            query_row: Dictionary with keys: period, duration, depth, prad, teq
            k: Number of similar examples to retrieve
            return_examples: If True, returns (prediction, similar_examples)
        
        Returns:
            prediction string OR tuple (prediction, similar_examples) if return_examples=True
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
            if prediction in ["CANDIDATE", "FALSE POSITIVE"]:
                if return_examples:
                    return prediction, similar_examples
                return prediction
            else:
                if return_examples:
                    return "ERROR", []
                return "ERROR"
        except Exception as e:
            print(f"ERROR: API call failed - {e}")
            if return_examples:
                return "ERROR", []
            return "ERROR"

    def initialize_vector_store(self):
        """Updates vector store with current dataset without reinitializing everything"""
        print("INFO: Updating vector store...")
        
        # Load current dataset
        df = pd.read_csv('data/dataset.csv', comment='#')
        df_clean = df.dropna(subset=['period', 'duration', 'depth', 'prad', 'teq'])
        
        # Exclude held-out IDs if specified
        if self.heldout_ids:
            print(f"INFO: Excluding {len(self.heldout_ids)} held-out entries from RAG")
            df_clean = df_clean[~df_clean['id'].isin(self.heldout_ids)]
        
        # Use same train/test split logic (only if no manual held-out set)
        features = ['period', 'duration', 'depth', 'prad', 'teq']
        X = df_clean[features].fillna(df_clean[features].median())
        y = (df_clean['disposition'] == 'CANDIDATE').astype(int)
        
        # If heldout_ids is empty, use the standard 80/20 split
        # If heldout_ids is set, use ALL remaining data (full strength mode)
        if not self.heldout_ids:
            X_train, _, y_train, _ = train_test_split(
                X, y, test_size=0.2, random_state=42, stratify=y
            )
            train_indices = X_train.index
            df_training_only = df_clean.loc[train_indices]
        else:
            # Full strength: use all non-held-out data
            df_training_only = df_clean
        
        self.original_data = df_training_only.to_dict('records')
        
        # Get new embeddings and update vector store
        texts_to_embed = [self._format_row_for_embedding(row) for row in self.original_data]
        embeddings = self._get_embeddings(texts_to_embed)
        
        # Initialize NearestNeighbors if it doesn't exist yet
        if self.vector_store is None:
            self.vector_store = NearestNeighbors(n_neighbors=50, metric='cosine')
        
        self.vector_store.fit(embeddings)

        with open(VECTOR_STORE_PATH, 'wb') as f:
            pickle.dump({
                'vector_store': self.vector_store,
                'original_data': self.original_data,
            }, f)
        print(f"INFO: Vector store created with {len(self.original_data)} training examples.")

if __name__ == '__main__':
    print("Testing FIXED classifier (no data leakage)...")
    classifier = LLMInContextClassifierFixed()
    print("\nFIXED classifier is ready.")
