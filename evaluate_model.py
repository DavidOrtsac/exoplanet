import pandas as pd
import numpy as np
import pickle
from sklearn.metrics import classification_report, confusion_matrix, accuracy_score, roc_auc_score, roc_curve
from sklearn.model_selection import cross_val_score, train_test_split
# import matplotlib.pyplot as plt
# import seaborn as sns

def load_model_and_data():
    """Load the trained model, scaler, and dataset"""
    # Load model and scaler
    with open('model.pkl', 'rb') as f:
        model = pickle.load(f)
    with open('scaler.pkl', 'rb') as f:
        scaler = pickle.load(f)
    
    # Load and prepare data (same preprocessing as training)
    df = pd.read_csv('koi_data.csv', comment='#')
    features = ['koi_period', 'koi_duration', 'koi_depth', 'koi_prad', 
               'koi_impact', 'koi_teq', 'koi_fpflag_nt', 'koi_fpflag_ss']
    
    # Clean data
    df_clean = df[df['koi_pdisposition'].isin(['CANDIDATE', 'FALSE POSITIVE'])]
    X = df_clean[features].fillna(df_clean[features].median())
    y = (df_clean['koi_pdisposition'] == 'CANDIDATE').astype(int)
    
    return model, scaler, X, y, df_clean, features

def evaluate_on_test_set(model, scaler, X, y):
    """Evaluate model on a proper test set (data it hasn't seen during training)"""
    print("=== HOLDOUT TEST SET EVALUATION ===")
    
    # Create the same train/test split as used during training
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )
    
    # Scale the test data
    X_test_scaled = scaler.transform(X_test)
    
    # Make predictions
    y_pred = model.predict(X_test_scaled)
    y_pred_proba = model.predict_proba(X_test_scaled)[:, 1]
    
    # Calculate metrics
    accuracy = accuracy_score(y_test, y_pred)
    auc_score = roc_auc_score(y_test, y_pred_proba)
    
    print(f"Test Set Size: {len(y_test)} samples")
    print(f"Accuracy: {accuracy:.4f} ({accuracy*100:.1f}%)")
    print(f"AUC-ROC Score: {auc_score:.4f}")
    print()
    
    # Detailed classification report
    print("Classification Report:")
    target_names = ['FALSE POSITIVE', 'CANDIDATE']
    print(classification_report(y_test, y_pred, target_names=target_names))
    
    # Confusion Matrix
    print("Confusion Matrix:")
    cm = confusion_matrix(y_test, y_pred)
    print(f"                  Predicted")
    print(f"                  FP    CAND")
    print(f"Actual FP      {cm[0,0]:4d}  {cm[0,1]:4d}")
    print(f"Actual CAND    {cm[1,0]:4d}  {cm[1,1]:4d}")
    print()
    
    return y_test, y_pred, y_pred_proba, X_test

def cross_validation_evaluation(model, scaler, X, y):
    """Perform cross-validation for more robust evaluation"""
    print("=== CROSS-VALIDATION EVALUATION ===")
    
    # Scale all data
    X_scaled = scaler.fit_transform(X)
    
    # 5-fold cross-validation
    cv_scores = cross_val_score(model, X_scaled, y, cv=5, scoring='accuracy')
    cv_auc_scores = cross_val_score(model, X_scaled, y, cv=5, scoring='roc_auc')
    
    print(f"5-Fold Cross-Validation Results:")
    print(f"Accuracy: {cv_scores.mean():.4f} ± {cv_scores.std():.4f}")
    print(f"AUC-ROC:  {cv_auc_scores.mean():.4f} ± {cv_auc_scores.std():.4f}")
    print(f"Individual fold accuracies: {cv_scores}")
    print()

def test_individual_examples(model, scaler, df_clean, features):
    """Test the model on specific known examples"""
    print("=== INDIVIDUAL EXAMPLE TESTING ===")
    
    # Get some confirmed candidates and false positives
    candidates = df_clean[df_clean['koi_pdisposition'] == 'CANDIDATE'].head(5)
    false_positives = df_clean[df_clean['koi_pdisposition'] == 'FALSE POSITIVE'].head(5)
    
    print("Testing on known CANDIDATES:")
    for idx, row in candidates.iterrows():
        features_values = row[features].fillna(df_clean[features].median())
        features_scaled = scaler.transform([features_values])
        prediction = model.predict(features_scaled)[0]
        probability = model.predict_proba(features_scaled)[0]
        
        result = 'CANDIDATE' if prediction == 1 else 'FALSE POSITIVE'
        confidence = max(probability) * 100
        
        koi_name = row.get('kepoi_name', 'Unknown')
        print(f"  {koi_name}: Predicted {result} (confidence: {confidence:.1f}%)")
    
    print("\nTesting on known FALSE POSITIVES:")
    for idx, row in false_positives.iterrows():
        features_values = row[features].fillna(df_clean[features].median())
        features_scaled = scaler.transform([features_values])
        prediction = model.predict(features_scaled)[0]
        probability = model.predict_proba(features_scaled)[0]
        
        result = 'CANDIDATE' if prediction == 1 else 'FALSE POSITIVE'
        confidence = max(probability) * 100
        
        koi_name = row.get('kepoi_name', 'Unknown')
        print(f"  {koi_name}: Predicted {result} (confidence: {confidence:.1f}%)")
    print()

def analyze_feature_importance(model, features):
    """Show which features are most important for predictions"""
    print("=== FEATURE IMPORTANCE ANALYSIS ===")
    
    if hasattr(model, 'feature_importances_'):
        importances = model.feature_importances_
        feature_importance = list(zip(features, importances))
        feature_importance.sort(key=lambda x: x[1], reverse=True)
        
        print("Feature importance ranking:")
        for i, (feature, importance) in enumerate(feature_importance, 1):
            print(f"  {i}. {feature}: {importance:.4f}")
        print()

def main():
    """Run comprehensive model evaluation"""
    print("NASA EXOPLANET DETECTION MODEL - COMPREHENSIVE EVALUATION")
    print("=" * 60)
    
    # Load everything
    model, scaler, X, y, df_clean, features = load_model_and_data()
    
    print(f"Dataset Overview:")
    print(f"  Total samples: {len(X)}")
    print(f"  Candidates: {sum(y)} ({sum(y)/len(y)*100:.1f}%)")
    print(f"  False Positives: {len(y)-sum(y)} ({(len(y)-sum(y))/len(y)*100:.1f}%)")
    print(f"  Features used: {len(features)}")
    print()
    
    # 1. Test on holdout data (most important!)
    y_test, y_pred, y_pred_proba, X_test = evaluate_on_test_set(model, scaler, X, y)
    
    # 2. Cross-validation for robustness
    cross_validation_evaluation(model, scaler, X, y)
    
    # 3. Test individual examples
    test_individual_examples(model, scaler, df_clean, features)
    
    # 4. Feature importance
    analyze_feature_importance(model, features)
    
    print("=== EVALUATION SUMMARY ===")
    print("✅ The model has been thoroughly evaluated using:")
    print("   1. Holdout test set (20% of data never seen during training)")
    print("   2. 5-fold cross-validation for robustness")
    print("   3. Individual example testing on known cases")
    print("   4. Feature importance analysis")
    print()
    print("💡 Key things to look for:")
    print("   - Test accuracy should be close to training accuracy")
    print("   - Cross-validation scores should be consistent")
    print("   - Model should correctly classify most known examples")
    print("   - No single feature should dominate (avoid overfitting)")

if __name__ == "__main__":
    main()
