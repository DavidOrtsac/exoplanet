# ==============================================================================
# FINAL VALIDATION TEST SCRIPT
#
# Methodology:
# 1.  Strict Data Isolation: Performs the canonical 80/20 train/test split
#     on the full, cleaned multi-mission dataset. The test ONLY uses the
#     20% held-out data.
# 2.  Reproducible Sampling: From the held-out test set, it selects:
#     - 100 random Kepler samples
#     - 100 random TESS samples
#     - All 64 available K2 samples
#     A fixed random_state ensures the exact same 264 planets are
#     chosen every time.
# 3.  No Data Leakage: The pre-trained LLM classifier's knowledge base
#     (vector store) was built ONLY from the 80% training data. The model
#     has never seen these 264 test samples.
# 4.  Transparent Reporting: The script calculates and displays accuracy
#     for each mission individually and provides a combined final score.
#
# ==============================================================================

import pandas as pd
from sklearn.model_selection import train_test_split
from dotenv import load_dotenv
import time
import sys

# Ensure scripts can be found
sys.path.append('scripts')

print("="*80)
print("🚀 INITIATING FINAL VALIDATION TEST FOR NASA SPACE APPS 🚀")
print("="*80)

# --- Step 1: Load Environment and Classifier ---
print("\n[1/5] Loading environment and initializing LLM Classifier...")
load_dotenv()
try:
    from scripts.llm_in_context_classifier_fixed import LLMInContextClassifierFixed
    llm = LLMInContextClassifierFixed()
    print("✅ LLM Classifier initialized successfully.")
except Exception as e:
    print(f"❌ CRITICAL ERROR: Could not initialize LLM Classifier: {e}")
    exit(1)


# --- Step 2: Strict Data Isolation ---
print("\n[2/5] Performing canonical 80/20 split to isolate held-out test data...")
df = pd.read_csv('data/dataset.csv')
df_clean = df.dropna(subset=['disposition', 'period', 'duration', 'depth', 'prad', 'teq'])

X = df_clean.drop('disposition', axis=1)
y = df_clean['disposition']

X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42, stratify=y
)

# The test will ONLY use df_test from this point forward.
df_test = df_clean.loc[X_test.index].copy()
df_test['actual_label'] = y_test.values
print(f"✅ Held-out test set isolated: {len(df_test)} samples.")


# --- Step 3: Reproducible Sampling ---
print("\n[3/5] Selecting the 264-sample definitive test cohort...")
kepler_test = df_test[df_test['type'] == 'kepler']
tess_test = df_test[df_test['type'] == 'tess']
k2_test = df_test[df_test['type'] == 'k2']

# Use random_state for reproducibility
kepler_sample = kepler_test.sample(n=100, random_state=42)
tess_sample = tess_test.sample(n=100, random_state=42)
k2_sample = k2_test.sample(n=64, random_state=42) # Use all available

final_test_cohort = pd.concat([kepler_sample, tess_sample, k2_sample])
print("✅ Test cohort selected:")
print(f"  - 100 Kepler samples")
print(f"  - 100 TESS samples")
print(f"  - 64 K2 samples (all available)")


# --- Step 4: Prediction and Verification ---
print("\n[4/5] Running predictions on the 264 unseen exoplanets...")
print("(This will take a few minutes and use OpenAI API credits)")

results = []
start_time = time.time()

for index, row in final_test_cohort.iterrows():
    query = {
        'period': row['period'],
        'duration': row['duration'],
        'depth': row['depth'],
        'prad': row['prad'],
        'teq': row['teq']
    }
    actual_label_int = row['actual_label']
    actual_label_str = "CANDIDATE" if actual_label_int == 1 else "FALSE POSITIVE"

    prediction = llm.classify(query, k=25)

    is_correct = (prediction == actual_label_str)
    status = "✅" if is_correct else "❌"

    results.append({
        'mission': row['type'],
        'name': row['name'],
        'actual': actual_label_str,
        'predicted': prediction,
        'correct': is_correct
    })

    print(f"  {status} {row['name']:<20} | Mission: {row['type']:<7} | Actual: {actual_label_str:<15} | Predicted: {prediction:<15}")

elapsed_time = time.time() - start_time
print(f"\n✅ Predictions complete. Total time: {elapsed_time:.2f} seconds.")


# --- Step 5: Transparent Reporting ---
print("\n[5/5] Generating Final Accuracy Report...")
print("="*80)
results_df = pd.DataFrame(results)

# Overall Accuracy
total_correct = results_df['correct'].sum()
total_tested = len(results_df)
overall_accuracy = (total_correct / total_tested) * 100

print(f"\n🎯 OVERALL ACCURACY: {total_correct}/{total_tested} = {overall_accuracy:.2f}% 🎯")
print("="*80)

# Per-Mission Accuracy
print("\n📊 ACCURACY BREAKDOWN BY MISSION:")
for mission_name in ['kepler', 'tess', 'k2']:
    mission_df = results_df[results_df['mission'] == mission_name]
    mission_correct = mission_df['correct'].sum()
    mission_total = len(mission_df)
    mission_accuracy = (mission_correct / mission_total) * 100
    print(f"  - {mission_name.upper():<7}: {mission_correct}/{mission_total} correct\t({mission_accuracy:.2f}%)")

print("\n\n" + "="*80)
print("🔬 FINAL VALIDATION TEST COMPLETE 🔬")
print("="*80)
