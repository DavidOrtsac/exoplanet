import pandas as pd
import numpy as np
import os
import pickle
from openai import OpenAI
from sklearn.neighbors import NearestNeighbors
from tqdm import tqdm

# --- Configuration ---
import os
API_KEY = os.getenv('OPENAI_API_KEY')
if not API_KEY:
    raise ValueError("OPENAI_API_KEY environment variable is required. Please set it in your .env file or environment.")

CLIENT = OpenAI(api_key=API_KEY)
EMBEDDING_MODEL = "text-embedding-3-small"
CLASSIFIER_MODEL = "gpt-4o-mini" # Using a powerful, real, and cost-effective model.
VECTOR_STORE_PATH = "data/training_vector_store.pkl"

class LLMInContextClassifier:
    """
    Implements the 'Balanced Pragmatist' strategy by creating a searchable vector
    store of the training data and using it to perform dynamic few-shot classification.
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
                print(f"DEBUG: Invalid text found at index {i}. Content: '{text}'. Skipping.")
                # We can't send empty or non-string data. We'll use a zero vector as a placeholder.
                # A better long-term solution would be to handle this during data cleaning.
                continue
            clean_texts.append(text)

        if not clean_texts:
            print("DEBUG: No valid texts to embed.")
            return []

        # Log a sample of the data being sent
        print(f"DEBUG: Sending {len(clean_texts)} valid text samples to OpenAI. First sample: '{clean_texts[0]}'")

        # Batch the requests to respect API limits
        batch_size = 500
        embeddings = []
        for i in tqdm(range(0, len(clean_texts), batch_size), desc="Embedding Batches"):
            batch = clean_texts[i:i+batch_size]
            response = CLIENT.embeddings.create(input=batch, model=EMBEDDING_MODEL)
            embeddings.extend([item.embedding for item in response.data])
        
        return embeddings

    def _load_or_create_vector_store(self):
        """Loads the vector store from cache or creates it if it doesn't exist."""
        if os.path.exists(VECTOR_STORE_PATH):
            print("INFO: Loading cached vector store...")
            with open(VECTOR_STORE_PATH, 'rb') as f:
                data = pickle.load(f)
                self.vector_store = data['vector_store']
                self.original_data = data['original_data']
            print("INFO: Vector store loaded successfully.")
            return

        print("INFO: No cached vector store found. Creating a new one...")
        print("INFO: Loading koi_data.csv...")
        df = pd.read_csv('data/dataset.csv', comment='#')
        df_clean = df.dropna(subset=['period', 'duration', 'depth', 'prad', 'teq'])

        self.original_data = df_clean.to_dict('records')

        print(f"INFO: Creating text representations for {len(df_clean)} samples...")
        texts_to_embed = [self._format_row_for_embedding(row) for row in self.original_data]

        print("INFO: Generating embeddings... (This may take a few minutes)")
        embeddings = self._get_embeddings(texts_to_embed)

        print("INFO: Building NearestNeighbors index...")
        self.vector_store = NearestNeighbors(n_neighbors=10, algorithm='ball_tree')
        self.vector_store.fit(embeddings)

        print(f"INFO: Saving vector store to {VECTOR_STORE_PATH}...")
        with open(VECTOR_STORE_PATH, 'wb') as f:
            pickle.dump({
                'vector_store': self.vector_store,
                'original_data': self.original_data,
            }, f)
        print("INFO: Vector store created and saved.")

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
                temperature=0.0, # Max determinism
                max_tokens=5,
            )
            prediction = response.choices[0].message.content.strip().upper()
            if prediction in ["CANDIDATE", "FALSE POSITIVE"]:
                return prediction
            else:
                # Fallback if the model doesn't respond as expected
                return "ERROR"
        except Exception as e:
            print(f"ERROR: API call failed - {e}")
            return "ERROR"

if __name__ == '__main__':
    # This block allows for testing the classifier setup.
    print("Initializing classifier and building vector store (if needed)...")
    classifier = LLMInContextClassifier()
    print("\nClassifier is ready.")
    
    # Example test on a single row from the heldout data
    print("\n--- Performing a single test classification ---")
    heldout_df = pd.read_csv('data/heldout_test_data.csv')
    test_case = heldout_df.iloc[0].to_dict()
    
    print(f"Query: {classifier._format_row_for_embedding(test_case)}")
    print(f"Actual Label: {test_case['label']}")
    
    predicted_label = classifier.classify(test_case, k=20)
    print(f"Predicted Label: {predicted_label}")
