import pandas as pd
import numpy as np
import os
import pickle
from openai import OpenAI
from sklearn.neighbors import NearestNeighbors
from sklearn.model_selection import train_test_split
from tqdm import tqdm

# --- Configuration ---
import os
API_KEY = os.getenv('OPENAI_API_KEY')
if not API_KEY:
    raise ValueError("OPENAI_API_KEY environment variable is required. Please set it in your .env file or environment.")

CLIENT = OpenAI(api_key=API_KEY)
EMBEDDING_MODEL = "text-embedding-3-small"
CLASSIFIER_MODEL = "gpt-4o-mini"
VECTOR_STORE_PATH = "data/training_vector_store_FIXED.pkl"

class LLMInContextClassifier:
    """
    FIXED VERSION: Only uses training data (80%) for vector store.
    Test data (20%) is completely isolated.
    """
    def __init__(self):
        self.vector_store = None
        self.original_data = None
        self._load_or_create_vector_store()

    def _format_row_for_embedding(self, row):
        """Creates a compact, descriptive string from a data row."""
        return (
            f"period={row['period']:.2f}, "
            f"duration={row['duration']:.3f}, "
            f"depth={row['depth']:.1f}, "
            f"radius={row['prad']:.2f}, "
            f"temp={row['teq']:.0f}"
        )

    def _get_embeddings(self, texts):
        """Gets embeddings from OpenAI API."""
        # Robustly clean and validate the input texts
        clean_texts = []
        for i, text in enumerate(texts):
            if not isinstance(text, str) or not text.strip():
                continue
            clean_texts.append(text)

        if not clean_texts:
            return []

        # Batch the requests to respect API limits
        batch_size = 500
        embeddings = []
        for i in tqdm(range(0, len(clean_texts), batch_size), desc="Embedding Batches"):
            batch = clean_texts[i:i+batch_size]
            response = CLIENT.embeddings.create(input=batch, model=EMBEDDING_MODEL)
            embeddings.extend([item.embedding for item in response.data])
        
        return embeddings

    def _load_or_create_vector_store(self):
        """FIXED: Only uses TRAINING data for vector store."""
        if os.path.exists(VECTOR_STORE_PATH):
            print("INFO: Loading cached FIXED vector store...")
            with open(VECTOR_STORE_PATH, 'rb') as f:
                data = pickle.load(f)
                self.vector_store = data['vector_store']
                self.original_data = data['original_data']
            print("INFO: FIXED vector store loaded successfully.")
            return

        self.initialize_vector_store()

    def _find_similar_examples(self, query_row, k=50):
        """Finds the k most similar examples from the vector store."""
        query_text = self._format_row_for_embedding(query_row)
        query_embedding = self._get_embeddings([query_text])[0]
        
        distances, indices = self.vector_store.kneighbors([query_embedding], n_neighbors=k)
        
        # Return the original data for the nearest neighbors
        return [self.original_data[i] for i in indices[0]]

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

    def classify(self, query_row, k=50):
        """
        Classifies a single, unseen data row using the in-context learning strategy.
        """
        similar_examples = self._find_similar_examples(query_row, k=k)
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
            if prediction in ["CANDIDATE", "FALSE POSITIVE"]:
                return prediction
            else:
                return "ERROR"
        except Exception as e:
            print(f"ERROR: API call failed - {e}")
            return "ERROR"

    def initialize_vector_store(self):
        """Updates vector store with current dataset without reinitializing everything"""
        print("INFO: Updating vector store...")
        
        # Load current dataset
        df = pd.read_csv('data/dataset.csv', comment='#')
        df_clean = df.dropna(subset=['period', 'duration', 'depth', 'prad', 'teq'])
        
        # Use same train/test split logic
        features = ['period', 'duration', 'depth', 'prad', 'teq']
        X = df_clean[features].fillna(df_clean[features].median())
        y = (df_clean['disposition'] == 'CANDIDATE').astype(int)
        
        X_train, _, y_train, _ = train_test_split(
            X, y, test_size=0.2, random_state=42, stratify=y
        )
        
        # Update only training data
        train_indices = X_train.index
        df_training_only = df_clean.loc[train_indices]
        self.original_data = df_training_only.to_dict('records')
        
        # Get new embeddings and update vector store
        texts_to_embed = [self._format_row_for_embedding(row) for row in self.original_data]
        embeddings = self._get_embeddings(texts_to_embed)
        self.vector_store.fit(embeddings)

        with open(VECTOR_STORE_PATH, 'wb') as f:
            pickle.dump({
                'vector_store': self.vector_store,
                'original_data': self.original_data,
            }, f)
        print("INFO: FIXED vector store created and saved.")

if __name__ == '__main__':
    print("Testing FIXED classifier (no data leakage)...")
    classifier = LLMInContextClassifierFixed()
    print("\nFIXED classifier is ready.")
