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
# Get the directory of the current script to build robust paths
_SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
_ML_SERVICE_DIR = os.path.dirname(_SCRIPT_DIR)

API_KEY = os.getenv('OPENAI_API_KEY')
if not API_KEY:
    raise ValueError("OPENAI_API_KEY is required.")

CLIENT = OpenAI(api_key=API_KEY)
EMBEDDING_MODEL = "text-embedding-3-small"
CLASSIFIER_MODEL = "gpt-4o-mini"
DEFAULT_VECTOR_STORE_PATH = os.path.join(_ML_SERVICE_DIR, "data/default_vector_store.pkl")
BASE_DATASET_PATH = os.path.join(_ML_SERVICE_DIR, 'data/dataset.csv')

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

    # even tho this function is not used anymore, im still keeping it
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
        
        # Check if this is a Git LFS pointer file (text file starting with "version")
        try:
            with open(pkl_path, 'rb') as f:
                first_bytes = f.read(100)
                if first_bytes.startswith(b'version https://git-lfs.github.com'):
                    print(f"WARNING: {pkl_path} is a Git LFS pointer file, not the actual pickle!")
                    print("Using default vector store instead.")
                    # Don't regenerate - just use the default if it exists
                    if pkl_path != DEFAULT_VECTOR_STORE_PATH and os.path.exists(DEFAULT_VECTOR_STORE_PATH):
                        return self._load_vector_store(DEFAULT_VECTOR_STORE_PATH)
                    return None, None
        except Exception as e:
            pass  # Silently continue to try loading
        
        try:
            with open(pkl_path, 'rb') as f:
                data = pickle.load(f)
                return data['vector_store_index'], data['original_data']
        except Exception as e:
            print(f"ERROR loading vector store from {pkl_path}: {e}")
            return None, None

    def _find_similar_examples(self, query_row, vector_store_index, original_data, k=25, exclude_ids=None):
        """Finds the k most similar examples from a given vector store, excluding specified IDs."""
        query_text = self._format_row_for_embedding(query_row)
        query_embedding = self._get_embeddings([query_text])[0]

        if not original_data or not hasattr(vector_store_index, 'kneighbors'):
            print("WARNING: Vector store is empty or invalid. Cannot find similar examples.")
            return []

        # Request more neighbors to account for potential filtering
        n_to_request = min(len(original_data), k * 3)
        
        if n_to_request == 0:
            return []

        distances, indices = vector_store_index.kneighbors([query_embedding], n_neighbors=n_to_request)

        filtered_examples = []
        for i in indices[0]:
            if i >= len(original_data):
                continue
            example = original_data[i]
            
            # Skip if this example is in the excluded set
            if exclude_ids and example.get('id') in exclude_ids:
                continue
                
            filtered_examples.append(example)
            if len(filtered_examples) >= k:
                break
        
        return filtered_examples

    def _build_prompt(self, query_row, similar_examples):
        """Builds the dynamic few-shot prompt for the LLM."""
        system_prompt = (
            "You are an expert exoplanet classifier. Your task is to classify a new "
            "exoplanet candidate as either 'CANDIDATE' or 'FALSE POSITIVE' based on its "
            "physical parameters and a set of similar, already classified examples. "
            "Analyze the provided examples to understand the patterns, then make a final "
            "decision on the query. Respond with only the single word 'CANDIDATE' or 'FALSE POSITIVE'."
        )

        user_prompt = "--- SIMILAR EXAMPLES ---\n"
        for example in similar_examples:
            example_text = self._format_row_for_embedding(example)
            label = "FALSE POSITIVE" if example['disposition'] == 0 else "CANDIDATE"
            user_prompt += f"- {example_text} -> {label}\n"
        
        user_prompt += "\n--- QUERY ---\n"
        query_text = self._format_row_for_embedding(query_row)
        user_prompt += f"Based on the examples above, classify this query: {query_text} -> ?"

        return system_prompt, user_prompt

    def classify(self, query_row, vector_store_path=None, exclude_ids=None, k=25, return_examples=False):
        """
        Classifies a single row using a dynamically loaded vector store.

        Args:
            query_row: Dictionary with the features of the item to classify.
            vector_store_path (str, optional): Path to a specific .pkl vector store. 
                                               If None, uses the default store.
            exclude_ids (list, optional): A list of 'id' values to exclude from the
                                          similar examples search.
            k (int): Number of similar examples to retrieve.
            return_examples (bool): If True, returns the examples used in the prompt.
        
        Returns:
            The prediction string, or a tuple (prediction, similar_examples).
        """
        # Determine which vector store to use
        path_to_load = vector_store_path if (vector_store_path and os.path.exists(vector_store_path)) else DEFAULT_VECTOR_STORE_PATH

        print(f"INFO: Loading vector store from {path_to_load}")
        
        # Load the necessary data from the chosen file
        vector_store_index, original_data = self._load_vector_store(path_to_load)

        if not original_data:
            print(f"ERROR: No original_data found in vector store at {path_to_load}")
            if return_examples:
                return "ERROR", []
            return "ERROR"

        # Find examples, passing in all necessary data
        similar_examples = self._find_similar_examples(
            query_row, 
            vector_store_index, 
            original_data, 
            k=k, 
            exclude_ids=exclude_ids
        )
        
        system_prompt, user_prompt = self._build_prompt(query_row, similar_examples)

        try:
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

            if prediction not in ["CANDIDATE", "FALSE POSITIVE"]:
                print(f"WARNING: Unexpected response from LLM: '{prediction}'")
                prediction = "ERROR"
            
            if return_examples:
                return prediction, similar_examples
            return prediction
            
        except Exception as e:
            print(f"ERROR: API call failed - {e}")
            if return_examples:
                return "ERROR", []
            return "ERROR"
