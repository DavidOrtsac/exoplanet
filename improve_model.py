import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import classification_report, accuracy_score, roc_auc_score
from sklearn.model_selection import GridSearchCV
import pickle

print("IMPROVING MODEL ACCURACY - MULTIPLE APPROACHES")
print("=" * 60)

# Load data
df = pd.read_csv('koi_data.csv', comment='#')
features = ['koi_period', 'koi_duration', 'koi_depth', 'koi_prad', 
           'koi_impact', 'koi_teq']

df_clean = df[df['koi_pdisposition'].isin(['CANDIDATE', 'FALSE POSITIVE'])]
X = df_clean[features].fillna(df_clean[features].median())
y = (df_clean['koi_pdisposition'] == 'CANDIDATE').astype(int)

X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42, stratify=y)
scaler = StandardScaler()
X_train_scaled = scaler.fit_transform(X_train)
X_test_scaled = scaler.transform(X_test)

print(f"Baseline (current model): 84.2% accuracy")
print()

# APPROACH 1: Feature Engineering
print("APPROACH 1: FEATURE ENGINEERING")
print("-" * 40)

def create_engineered_features(df):
    """Create physics-based derived features"""
    df_eng = df.copy()
    
    # Transit geometry consistency checks
    df_eng['depth_per_radius_squared'] = df_eng['koi_depth'] / (df_eng['koi_prad'] ** 2)
    df_eng['period_duration_ratio'] = df_eng['koi_period'] / df_eng['koi_duration'] * 24  # Convert to days
    df_eng['impact_depth_interaction'] = df_eng['koi_impact'] * df_eng['koi_depth']
    
    # Temperature vs period relationship (physics check)
    df_eng['temp_period_ratio'] = df_eng['koi_teq'] / (df_eng['koi_period'] ** 0.5)
    
    # Outlier flags
    df_eng['extreme_depth'] = (df_eng['koi_depth'] > 10000).astype(int)
    df_eng['extreme_radius'] = (df_eng['koi_prad'] > 15).astype(int)
    df_eng['very_short_period'] = (df_eng['koi_period'] < 1).astype(int)
    
    return df_eng

X_eng = create_engineered_features(X)
X_train_eng, X_test_eng, _, _ = train_test_split(X_eng, y, test_size=0.2, random_state=42, stratify=y)
X_train_eng_scaled = scaler.fit_transform(X_train_eng)
X_test_eng_scaled = scaler.transform(X_test_eng)

model_eng = RandomForestClassifier(n_estimators=100, random_state=42)
model_eng.fit(X_train_eng_scaled, y_train)
y_pred_eng = model_eng.predict(X_test_eng_scaled)
acc_eng = accuracy_score(y_test, y_pred_eng)

print(f"With engineered features: {acc_eng:.4f} ({acc_eng*100:.1f}%)")
print(f"Improvement: +{(acc_eng-0.842)*100:.1f} percentage points")
print()

# APPROACH 2: Better Algorithm
print("APPROACH 2: GRADIENT BOOSTING (BETTER ALGORITHM)")
print("-" * 50)

model_gb = GradientBoostingClassifier(n_estimators=100, random_state=42)
model_gb.fit(X_train_scaled, y_train)
y_pred_gb = model_gb.predict(X_test_scaled)
acc_gb = accuracy_score(y_test, y_pred_gb)

print(f"Gradient Boosting: {acc_gb:.4f} ({acc_gb*100:.1f}%)")
print(f"Improvement: +{(acc_gb-0.842)*100:.1f} percentage points")
print()

# APPROACH 3: Hyperparameter Tuning
print("APPROACH 3: HYPERPARAMETER TUNING")
print("-" * 40)

param_grid = {
    'n_estimators': [100, 200],
    'max_depth': [10, 20, None],
    'min_samples_split': [2, 5],
    'min_samples_leaf': [1, 2]
}

print("Tuning Random Forest hyperparameters...")
rf_grid = GridSearchCV(RandomForestClassifier(random_state=42), param_grid, 
                      cv=3, scoring='accuracy', n_jobs=-1)
rf_grid.fit(X_train_scaled, y_train)

y_pred_tuned = rf_grid.predict(X_test_scaled)
acc_tuned = accuracy_score(y_test, y_pred_tuned)

print(f"Tuned Random Forest: {acc_tuned:.4f} ({acc_tuned*100:.1f}%)")
print(f"Best params: {rf_grid.best_params_}")
print(f"Improvement: +{(acc_tuned-0.842)*100:.1f} percentage points")
print()

# APPROACH 4: Combined Best Approach
print("APPROACH 4: COMBINING BEST TECHNIQUES")
print("-" * 42)

# Use engineered features + best algorithm
best_model = GradientBoostingClassifier(n_estimators=200, max_depth=10, random_state=42)
best_model.fit(X_train_eng_scaled, y_train)
y_pred_best = best_model.predict(X_test_eng_scaled)
acc_best = accuracy_score(y_test, y_pred_best)
auc_best = roc_auc_score(y_test, best_model.predict_proba(X_test_eng_scaled)[:, 1])

print(f"Combined approach: {acc_best:.4f} ({acc_best*100:.1f}%)")
print(f"AUC-ROC: {auc_best:.4f}")
print(f"Total improvement: +{(acc_best-0.842)*100:.1f} percentage points")
print()

# Save the best model
with open('model_improved.pkl', 'wb') as f:
    pickle.dump(best_model, f)
with open('scaler_improved.pkl', 'wb') as f:
    pickle.dump(scaler, f)

print("SUMMARY OF IMPROVEMENTS:")
print("-" * 30)
print(f"Original model:        84.2%")
print(f"+ Feature engineering: {acc_eng*100:.1f}% (+{(acc_eng-0.842)*100:.1f}pp)")
print(f"+ Better algorithm:    {acc_gb*100:.1f}% (+{(acc_gb-0.842)*100:.1f}pp)")
print(f"+ Hyperparameter tune: {acc_tuned*100:.1f}% (+{(acc_tuned-0.842)*100:.1f}pp)")
print(f"+ Combined best:       {acc_best*100:.1f}% (+{(acc_best-0.842)*100:.1f}pp)")
print()

# Feature importance for the best model
print("TOP FEATURES IN IMPROVED MODEL:")
feature_names = list(X_eng.columns)
importances = best_model.feature_importances_
feature_importance = list(zip(feature_names, importances))
feature_importance.sort(key=lambda x: x[1], reverse=True)

for i, (feature, importance) in enumerate(feature_importance[:10], 1):
    print(f"  {i:2d}. {feature:<25}: {importance:.4f}")
print()

print("NEXT STEPS TO IMPROVE FURTHER:")
print("-" * 35)
print("1. Ensemble methods (combine multiple models)")
print("2. Neural networks (deep learning)")
print("3. More domain-specific features")
print("4. Better data preprocessing")
print("5. Outlier detection and removal")
print("6. Class balancing techniques")
print("7. Cross-validation for more robust evaluation")
