import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from dotenv import load_dotenv
import time

# Load environment variables (for OpenAI API key)
load_dotenv()

from scripts.llm_in_context_classifier_fixed import LLMInContextClassifierFixed

print("=" * 70)
print("🧪 TESTING LLM CLASSIFIER ON ALL THREE MISSIONS")
print("=" * 70)

# Load the unified dataset
print("\n📊 Loading dataset...")
df = pd.read_csv('data/dataset.csv')
print(f"Total samples: {len(df)}")

# Show breakdown by mission
print("\n🚀 Mission breakdown:")
mission_counts = df['type'].value_counts()
for mission, count in mission_counts.items():
    print(f"  - {mission.upper()}: {count} samples")

# Clean data
df_clean = df.dropna(subset=['period', 'duration', 'depth', 'prad', 'teq', 'disposition'])
print(f"\nAfter removing missing values: {len(df_clean)} samples")

# Split into train/test (same split as LLM was trained on)
features = ['period', 'duration', 'depth', 'prad', 'teq']
X = df_clean[features].fillna(df_clean[features].median())
y = df_clean['disposition'].astype(int)

print("\n📦 Splitting data (80% train / 20% test)...")
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42, stratify=y
)

# Get mission info for test set
test_indices = X_test.index
df_test = df_clean.loc[test_indices].copy()
df_test['actual_label'] = y_test.values

print(f"Test set size: {len(df_test)} samples")

# Show test set breakdown by mission
print("\n🧪 Test set breakdown by mission:")
test_mission_counts = df_test['type'].value_counts()
for mission, count in test_mission_counts.items():
    print(f"  - {mission.upper()}: {count} samples")

# Initialize LLM classifier
print("\n🧠 Initializing LLM classifier...")
try:
    llm = LLMInContextClassifierFixed()
    print("✅ LLM classifier ready!")
except Exception as e:
    print(f"❌ Failed to initialize LLM: {e}")
    exit(1)

# Test on each mission separately
print("\n" + "=" * 70)
print("🎯 TESTING ACCURACY BY MISSION")
print("=" * 70)

overall_results = []

for mission_type in ['kepler', 'tess', 'k2']:
    print(f"\n{'='*70}")
    print(f"Testing {mission_type.upper()} mission...")
    print(f"{'='*70}")
    
    # Filter test set for this mission
    mission_test = df_test[df_test['type'] == mission_type]
    
    if len(mission_test) == 0:
        print(f"⚠️  No {mission_type.upper()} samples in test set, skipping...")
        continue
    
    print(f"Test samples: {len(mission_test)}")
    
    # Count actual labels
    actual_candidates = (mission_test['actual_label'] == 1).sum()
    actual_fps = (mission_test['actual_label'] == 0).sum()
    print(f"  - Actual CANDIDATEs: {actual_candidates}")
    print(f"  - Actual FALSE POSITIVEs: {actual_fps}")
    
    # Test a subset (to save API costs)
    sample_size = min(20, len(mission_test))
    mission_sample = mission_test.sample(n=sample_size, random_state=42)
    
    print(f"\n🧪 Testing on {sample_size} random samples (to save API costs)...")
    
    correct = 0
    predictions = []
    
    for idx, row in mission_sample.iterrows():
        # Debug: Print row keys to see what's available
        # print(f"Row keys: {row.keys().tolist()}")
        
        try:
            query = {
                'period': float(row['period']) if pd.notna(row['period']) else 0,
                'duration': float(row['duration']) if pd.notna(row['duration']) else 0,
                'depth': float(row['depth']) if pd.notna(row['depth']) else 0,
                'prad': float(row['prad']) if pd.notna(row['prad']) else 0,
                'teq': float(row['teq']) if pd.notna(row['teq']) else 0
            }
        except Exception as e:
            print(f"  ⚠️  Error creating query for {row.get('name', 'unknown')}: {e}")
            continue
        
        actual_label = row['actual_label']
        actual_str = "CANDIDATE" if actual_label == 1 else "FALSE POSITIVE"
        
        try:
            prediction = llm.classify(query, k=25)
            pred_correct = (
                (prediction == "CANDIDATE" and actual_label == 1) or
                (prediction == "FALSE POSITIVE" and actual_label == 0)
            )
            
            if pred_correct:
                correct += 1
                status = "✅"
            else:
                status = "❌"
            
            predictions.append({
                'name': row['name'],
                'actual': actual_str,
                'predicted': prediction,
                'correct': pred_correct
            })
            
            print(f"  {status} {row['name'][:20]:20s} | Actual: {actual_str:15s} | Predicted: {prediction:15s}")
            
        except Exception as e:
            print(f"  ⚠️  Error on {row['name']}: {e}")
            continue
    
    accuracy = (correct / sample_size) * 100 if sample_size > 0 else 0
    print(f"\n📊 {mission_type.upper()} Accuracy: {correct}/{sample_size} = {accuracy:.1f}%")
    
    overall_results.append({
        'mission': mission_type.upper(),
        'tested': sample_size,
        'correct': correct,
        'accuracy': accuracy
    })

# Print overall summary
print("\n" + "=" * 70)
print("📊 OVERALL SUMMARY")
print("=" * 70)

for result in overall_results:
    print(f"{result['mission']:8s} | Tested: {result['tested']:3d} | Correct: {result['correct']:3d} | Accuracy: {result['accuracy']:5.1f}%")

# Calculate combined accuracy
total_tested = sum(r['tested'] for r in overall_results)
total_correct = sum(r['correct'] for r in overall_results)
combined_accuracy = (total_correct / total_tested * 100) if total_tested > 0 else 0

print(f"\n🎯 COMBINED ACCURACY: {total_correct}/{total_tested} = {combined_accuracy:.1f}%")

print("\n" + "=" * 70)
print("✅ Testing complete!")
print("=" * 70)
