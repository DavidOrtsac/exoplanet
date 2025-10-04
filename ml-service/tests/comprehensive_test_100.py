#!/usr/bin/env python3
"""
COMPREHENSIVE 100-EXAMPLE TEST FOR EXOPLANET CLASSIFIER
=======================================================

This script performs a rigorous test of our Random Forest model on 100 held-out examples
that were never seen during training. It provides detailed analysis of:
1. Data verification (100 examples confirmed)
2. Answer key analysis (ground truth distribution)
3. Model predictions with confidence scores
4. Detailed accuracy breakdown by class
5. Confusion matrix and performance metrics
"""

import pandas as pd
import numpy as np
import pickle
from sklearn.metrics import accuracy_score, confusion_matrix, classification_report
import sys; sys.path.append('../scripts'); from feature_engineering import add_engineered_features
import sys
import os

def load_model_and_scaler():
    """Load the trained model and scaler"""
    try:
        with open('model_no_flags../models/.pkl', 'rb') as f:
            model = pickle.load(f)
        with open('scaler_no_flags../models/.pkl', 'rb') as f:
            scaler = pickle.load(f)
        print("✅ Successfully loaded model_no_flags.pkl and scaler_no_flags.pkl")
        return model, scaler
    except FileNotFoundError as e:
        print(f"❌ Error loading model files: {e}")
        print("Please ensure model_no_flags.pkl and scaler_no_flags.pkl exist")
        sys.exit(1)

def load_test_data():
    """Load and verify the held-out test data"""
    print("STEP 1: LOADING AND VERIFYING TEST DATA")
    print("=" * 50)
    
    # Use the 100-random sample we created
    test_file = '../data/test_100_random.csv'
    if not os.path.exists(test_file):
        print(f"❌ {test_file} not found")
        print("📁 Creating 100 random samples from heldout_test_rows.csv...")
        try:
            full_heldout = pd.read_csv('heldout_test_rows.csv')
            # Sample 100 random rows
            test_df = full_heldout.sample(n=100, random_state=123)
            # Save for future use
            test_df.to_csv(test_file, index=False)
            print(f"✅ Created {test_file} with 100 random samples")
        except Exception as e:
            print(f"❌ Error creating test set: {e}")
            sys.exit(1)
    
    # Load the test data
    try:
        df = pd.read_csv(test_file)
        print(f"✅ Loaded test data from {test_file}")
    except Exception as e:
        print(f"❌ Error loading test data: {e}")
        sys.exit(1)
    
    return df, test_file

def verify_test_data(df):
    """Verify we have exactly 100 examples and analyze the answer keys"""
    print("\nSTEP 2: VERIFYING TEST DATA")
    print("=" * 30)
    
    # Check number of examples
    n_examples = len(df)
    print(f"📊 Number of test examples: {n_examples}")
    
    if n_examples < 100:
        print(f"⚠️  Warning: Only {n_examples} examples available (expected 100)")
    elif n_examples > 100:
        print(f"📝 Using first 100 examples from {n_examples} available")
        df = df.head(100)
    else:
        print("✅ Exactly 100 examples confirmed")
    
    # Check for required columns
    required_features = ['koi_period', 'koi_duration', 'koi_depth', 'koi_prad', 'koi_impact', 'koi_teq']
    
    # Determine label column
    label_col = None
    possible_label_cols = ['koi_pdisposition', 'label', 'disposition']
    for col in possible_label_cols:
        if col in df.columns:
            label_col = col
            break
    
    if label_col is None:
        print("❌ No label column found. Expected one of:", possible_label_cols)
        sys.exit(1)
    
    print(f"✅ Found label column: {label_col}")
    
    # Check for missing features
    missing_features = [f for f in required_features if f not in df.columns]
    if missing_features:
        print(f"❌ Missing required features: {missing_features}")
        sys.exit(1)
    
    print("✅ All required features present")
    
    return df.head(100), label_col

def analyze_answer_keys(df, label_col):
    """Analyze the ground truth labels"""
    print("\nSTEP 3: ANALYZING ANSWER KEYS (GROUND TRUTH)")
    print("=" * 45)
    
    # Get unique labels
    labels = df[label_col].value_counts()
    print("📋 Ground Truth Distribution:")
    
    n_candidates = 0
    n_false_positives = 0
    
    for label, count in labels.items():
        print(f"   {label}: {count} examples")
        
        # Normalize label names
        if label.upper() in ['CANDIDATE', 'CONFIRMED']:
            n_candidates += count
        elif label.upper() in ['FALSE POSITIVE', 'FALSE_POSITIVE', 'FP']:
            n_false_positives += count
    
    print(f"\n🎯 OBJECTIVE COUNTS:")
    print(f"   CANDIDATES: {n_candidates}")
    print(f"   FALSE POSITIVES: {n_false_positives}")
    print(f"   TOTAL: {n_candidates + n_false_positives}")
    
    if n_candidates + n_false_positives != len(df):
        print("⚠️  Warning: Some labels may not be standard CANDIDATE/FALSE POSITIVE")
    
    return n_candidates, n_false_positives

def run_predictions(model, scaler, df, label_col):
    """Run model predictions on all test examples"""
    print("\nSTEP 4: RUNNING MODEL PREDICTIONS")
    print("=" * 35)
    
    raw_features = ['koi_period', 'koi_duration', 'koi_depth', 'koi_prad', 'koi_impact', 'koi_teq']
    
    # Prepare raw features and impute like training
    X_raw = df[raw_features].copy()
    print("🔧 Handling missing values (median on raw features)...")
    X_raw = X_raw.fillna(X_raw.median(numeric_only=True))
    
    # Add engineered features in the same way as training
    X_all = add_engineered_features(X_raw, include_raw=True)
    
    # Scale features
    print("⚖️  Scaling features...")
    X_test_scaled = scaler.transform(X_all.values)
    
    # Make predictions
    print("🤖 Making predictions...")
    predictions = model.predict(X_test_scaled)
    probabilities = model.predict_proba(X_test_scaled)
    
    # Convert predictions to labels
    pred_labels = ['CANDIDATE' if p == 1 else 'FALSE POSITIVE' for p in predictions]
    confidences = [max(prob) for prob in probabilities]
    
    # Create results dataframe
    results_df = df.copy()
    results_df['predicted_label'] = pred_labels
    results_df['confidence'] = confidences
    results_df['predicted_class'] = predictions
    
    # Normalize actual labels for comparison
    actual_labels_normalized = []
    for label in df[label_col]:
        if label.upper() in ['CANDIDATE', 'CONFIRMED']:
            actual_labels_normalized.append('CANDIDATE')
        elif label.upper() in ['FALSE POSITIVE', 'FALSE_POSITIVE', 'FP']:
            actual_labels_normalized.append('FALSE POSITIVE')
        else:
            actual_labels_normalized.append(label)  # Keep as-is if unknown
    
    results_df['actual_label_normalized'] = actual_labels_normalized
    
    print("✅ Predictions completed")
    
    return results_df, pred_labels, actual_labels_normalized, confidences

def analyze_results(results_df, pred_labels, actual_labels, confidences):
    """Analyze prediction results in detail"""
    print("\nSTEP 5: DETAILED RESULTS ANALYSIS")
    print("=" * 35)
    
    # Overall accuracy
    accuracy = accuracy_score(actual_labels, pred_labels)
    print(f"🎯 OVERALL ACCURACY: {accuracy:.1%} ({accuracy*100:.1f}%)")
    print()
    
    # Detailed breakdown by class
    print("📊 DETAILED BREAKDOWN BY CLASS:")
    print("-" * 40)
    
    # Count correct/incorrect for each class
    candidates_correct = 0
    candidates_incorrect = 0
    fp_correct = 0
    fp_incorrect = 0
    
    for actual, predicted in zip(actual_labels, pred_labels):
        if actual == 'CANDIDATE':
            if predicted == 'CANDIDATE':
                candidates_correct += 1
            else:
                candidates_incorrect += 1
        elif actual == 'FALSE POSITIVE':
            if predicted == 'FALSE POSITIVE':
                fp_correct += 1
            else:
                fp_incorrect += 1
    
    total_candidates = candidates_correct + candidates_incorrect
    total_fp = fp_correct + fp_incorrect
    
    print(f"CANDIDATES:")
    print(f"   ✅ Correctly identified: {candidates_correct}/{total_candidates}")
    print(f"   ❌ Incorrectly identified: {candidates_incorrect}/{total_candidates}")
    if total_candidates > 0:
        cand_accuracy = candidates_correct / total_candidates
        print(f"   📈 Candidate accuracy: {cand_accuracy:.1%}")
    
    print(f"\nFALSE POSITIVES:")
    print(f"   ✅ Correctly identified: {fp_correct}/{total_fp}")
    print(f"   ❌ Incorrectly identified: {fp_incorrect}/{total_fp}")
    if total_fp > 0:
        fp_accuracy = fp_correct / total_fp
        print(f"   📈 False Positive accuracy: {fp_accuracy:.1%}")
    
    # Confusion Matrix
    print(f"\n📋 CONFUSION MATRIX:")
    print("-" * 25)
    cm = confusion_matrix(actual_labels, pred_labels, labels=['FALSE POSITIVE', 'CANDIDATE'])
    print(f"                    Predicted")
    print(f"                    FP    CAND")
    print(f"Actual FP        {cm[0,0]:4d}    {cm[0,1]:4d}")
    print(f"Actual CAND      {cm[1,0]:4d}    {cm[1,1]:4d}")
    
    # Classification Report
    print(f"\n📈 CLASSIFICATION REPORT:")
    print("-" * 30)
    print(classification_report(actual_labels, pred_labels))
    
    # Confidence Analysis
    print(f"🔍 CONFIDENCE ANALYSIS:")
    print("-" * 25)
    avg_confidence = np.mean(confidences)
    print(f"Average confidence: {avg_confidence:.1%}")
    
    # Confidence distribution
    high_conf_threshold = 0.8
    medium_conf_threshold = 0.6
    
    high_conf_mask = np.array(confidences) >= high_conf_threshold
    medium_conf_mask = (np.array(confidences) >= medium_conf_threshold) & (np.array(confidences) < high_conf_threshold)
    low_conf_mask = np.array(confidences) < medium_conf_threshold
    
    print(f"High confidence (≥80%): {np.sum(high_conf_mask)} predictions")
    print(f"Medium confidence (60-80%): {np.sum(medium_conf_mask)} predictions")
    print(f"Low confidence (<60%): {np.sum(low_conf_mask)} predictions")
    
    if np.sum(high_conf_mask) > 0:
        high_conf_accuracy = accuracy_score(
            np.array(actual_labels)[high_conf_mask],
            np.array(pred_labels)[high_conf_mask]
        )
        print(f"High confidence accuracy: {high_conf_accuracy:.1%}")
    
    if np.sum(medium_conf_mask) > 0:
        medium_conf_accuracy = accuracy_score(
            np.array(actual_labels)[medium_conf_mask],
            np.array(pred_labels)[medium_conf_mask]
        )
        print(f"Medium confidence accuracy: {medium_conf_accuracy:.1%}")
    
    return {
        'overall_accuracy': accuracy,
        'candidates_correct': candidates_correct,
        'candidates_incorrect': candidates_incorrect,
        'fp_correct': fp_correct,
        'fp_incorrect': fp_incorrect,
        'avg_confidence': avg_confidence,
        'total_candidates': total_candidates,
        'total_fp': total_fp
    }

def save_detailed_results(results_df):
    """Save detailed results to CSV"""
    output_file = 'test_100_detailed_results.csv'
    results_df.to_csv(output_file, index=False)
    print(f"\n💾 Detailed results saved to: {output_file}")

def main():
    """Main test execution"""
    print("🚀 COMPREHENSIVE 100-EXAMPLE EXOPLANET CLASSIFIER TEST")
    print("=" * 65)
    print("This test runs our Random Forest model on 100 held-out examples")
    print("that were NEVER seen during training.\n")
    
    # Load model
    model, scaler = load_model_and_scaler()
    
    # Load test data
    df, test_file = load_test_data()
    
    # Verify data
    df, label_col = verify_test_data(df)
    
    # Analyze answer keys
    n_candidates, n_false_positives = analyze_answer_keys(df, label_col)
    
    # Run predictions
    results_df, pred_labels, actual_labels, confidences = run_predictions(model, scaler, df, label_col)
    
    # Analyze results
    metrics = analyze_results(results_df, pred_labels, actual_labels, confidences)
    
    # Save results
    save_detailed_results(results_df)
    
    # Final summary
    print("\n" + "=" * 65)
    print("🏁 FINAL TEST SUMMARY")
    print("=" * 65)
    print(f"✅ Test completed on 100 held-out examples")
    print(f"📊 Ground truth: {n_candidates} candidates, {n_false_positives} false positives")
    print(f"🎯 Overall accuracy: {metrics['overall_accuracy']:.1%}")
    print(f"🟢 Candidates correctly identified: {metrics['candidates_correct']}/{metrics['total_candidates']}")
    print(f"🔴 Candidates incorrectly identified: {metrics['candidates_incorrect']}/{metrics['total_candidates']}")
    print(f"🟢 False positives correctly identified: {metrics['fp_correct']}/{metrics['total_fp']}")
    print(f"🔴 False positives incorrectly identified: {metrics['fp_incorrect']}/{metrics['total_fp']}")
    print(f"📈 Average confidence: {metrics['avg_confidence']:.1%}")
    print("=" * 65)

if __name__ == "__main__":
    main()
