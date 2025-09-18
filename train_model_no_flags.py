import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import classification_report, accuracy_score, roc_auc_score
import pickle

print("TRAINING MODEL WITHOUT VETTING FLAGS")
print("=" * 50)

# Load data
df = pd.read_csv('koi_data.csv', comment='#')

# Select features WITHOUT the vetting flags
features = ['koi_period', 'koi_duration', 'koi_depth', 'koi_prad', 
           'koi_impact', 'koi_teq']  # Removed koi_fpflag_nt and koi_fpflag_ss

print(f"Using {len(features)} features (no vetting flags):")
for f in features:
    print(f"  - {f}")
print()

# Clean data
df_clean = df[df['koi_pdisposition'].isin(['CANDIDATE', 'FALSE POSITIVE'])]
X = df_clean[features].fillna(df_clean[features].median())
y = (df_clean['koi_pdisposition'] == 'CANDIDATE').astype(int)

print(f"Dataset: {len(X)} samples")
print(f"Candidates: {sum(y)} ({sum(y)/len(y)*100:.1f}%)")
print(f"False Positives: {len(y)-sum(y)} ({(len(y)-sum(y))/len(y)*100:.1f}%)")
print()

# Split and train (same random state for fair comparison)
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42, stratify=y)
scaler = StandardScaler()
X_train_scaled = scaler.fit_transform(X_train)
X_test_scaled = scaler.transform(X_test)

model = RandomForestClassifier(n_estimators=100, random_state=42)
model.fit(X_train_scaled, y_train)

# Test
y_pred = model.predict(X_test_scaled)
y_pred_proba = model.predict_proba(X_test_scaled)[:, 1]

accuracy = accuracy_score(y_test, y_pred)
auc_score = roc_auc_score(y_test, y_pred_proba)

print("RESULTS:")
print(f"Accuracy: {accuracy:.4f} ({accuracy*100:.1f}%)")
print(f"AUC-ROC: {auc_score:.4f}")
print()

print("Classification Report:")
target_names = ['FALSE POSITIVE', 'CANDIDATE']
print(classification_report(y_test, y_pred, target_names=target_names))

# Feature importance
print("Feature Importance (without flags):")
importances = model.feature_importances_
for i, (feature, importance) in enumerate(zip(features, importances), 1):
    print(f"  {i}. {feature}: {importance:.4f}")
print()

# Save the new model
with open('model_no_flags.pkl', 'wb') as f:
    pickle.dump(model, f)
with open('scaler_no_flags.pkl', 'wb') as f:
    pickle.dump(scaler, f)

print("Saved model_no_flags.pkl and scaler_no_flags.pkl")
print()
print("COMPARISON SUMMARY:")
print("With flags:    93.5% accuracy (cheating)")
print(f"Without flags: {accuracy*100:.1f}% accuracy (honest)")
print(f"Accuracy drop: {(0.935 - accuracy)*100:.1f} percentage points")
