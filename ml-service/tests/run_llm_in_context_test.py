import pandas as pd
from tqdm import tqdm
import sys
import os
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
from scripts.llm_in_context_classifier import LLMInContextClassifier
from sklearn.metrics import accuracy_score, confusion_matrix, classification_report

def main():
    """
    Runs a comprehensive test of the LLMInContextClassifier on the 100-sample
    held-out test set.
    """
    print("🚀 Running comprehensive test for LLM In-Context Classifier...")
    print("=" * 70)

    # 1. Initialize the classifier
    # This will automatically build the vector store on the first run.
    print("STEP 1: Initializing classifier and vector store (this may take time on first run)...")
    try:
        classifier = LLMInContextClassifier()
    except Exception as e:
        print(f"FATAL: Failed to initialize classifier: {e}")
        print("Please check your OpenAI API key and data file paths.")
        return
    print("✅ Classifier initialized.")

    # 2. Load the 100 unseen test examples
    print("\nSTEP 2: Loading 100 unseen test examples from test_100_random.csv...")
    test_df = pd.read_csv('data/test_100_random.csv')
    test_cases = test_df.to_dict('records')
    actual_labels = [row['koi_pdisposition'] for row in test_cases]
    print(f"✅ Loaded {len(test_cases)} test cases.")

    # 3. Run predictions on all test cases
    print("\nSTEP 3: Running predictions... (This will take several minutes)")
    predictions = []
    # Using tqdm for a progress bar as this is a slow process
    for case in tqdm(test_cases, desc="Classifying"):
        # We use a smaller K for faster, more focused context
        prediction = classifier.classify(case, k=25) 
        predictions.append(prediction)
    print("✅ All predictions completed.")
    
    # Filter out any error responses before calculating metrics
    valid_indices = [i for i, p in enumerate(predictions) if p != "ERROR"]
    valid_predictions = [predictions[i] for i in valid_indices]
    valid_actuals = [actual_labels[i] for i in valid_indices]
    error_count = len(predictions) - len(valid_predictions)

    # 4. Analyze and report results
    print("\nSTEP 4: Analyzing and reporting results...")
    print("=" * 70)
    
    if not valid_predictions:
        print("❌ No valid predictions were made. Cannot calculate accuracy.")
        print(f"Number of API errors: {error_count}")
        return

    accuracy = accuracy_score(valid_actuals, valid_predictions)
    
    print(f"🎯 OVERALL ACCURACY: {accuracy:.2%} ({len(valid_predictions)} valid predictions)")
    if error_count > 0:
        print(f"⚠️  Encountered {error_count} API/parsing errors during the run.")
    print("-" * 70)

    print("📊 DETAILED BREAKDOWN BY CLASS:")
    report = classification_report(valid_actuals, valid_predictions)
    print(report)
    
    print("📋 CONFUSION MATRIX:")
    cm = confusion_matrix(valid_actuals, valid_predictions, labels=['FALSE POSITIVE', 'CANDIDATE'])
    print("                    Predicted")
    print("                    FP    CAND")
    print(f"Actual FP        {cm[0,0]:4d}    {cm[0,1]:4d}")
    print(f"Actual CAND      {cm[1,0]:4d}    {cm[1,1]:4d}")
    print("=" * 70)

if __name__ == "__main__":
    main()
