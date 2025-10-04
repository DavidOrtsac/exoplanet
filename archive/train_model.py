import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import classification_report, accuracy_score
import pickle

# Load data
df = pd.read_csv('../data/koi_data.csv', comment='#')

# Select features
features = ['koi_period', 'koi_duration', 'koi_depth', 'koi_prad', 
           'koi_impact', 'koi_teq', 'koi_fpflag_nt', 'koi_fpflag_ss']

# Clean data
df_clean = df[df['koi_pdisposition'].isin(['CANDIDATE', 'FALSE POSITIVE'])]
X = df_clean[features].fillna(df_clean[features].median())
y = (df_clean['koi_pdisposition'] == 'CANDIDATE').astype(int)

# Split and train
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42, stratify=y)
scaler = StandardScaler()
X_train_scaled = scaler.fit_transform(X_train)
X_test_scaled = scaler.transform(X_test)

model = RandomForestClassifier(n_estimators=100, random_state=42)
model.fit(X_train_scaled, y_train)

# Test
y_pred = model.predict(X_test_scaled)
print(f"Accuracy: {accuracy_score(y_test, y_pred):.3f}")

# Save
with open('models/model.pkl', 'wb') as f:
    pickle.dump(model, f)
with open('models/scaler.pkl', 'wb') as f:
    pickle.dump(scaler, f)
