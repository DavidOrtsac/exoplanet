import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import classification_report, accuracy_score

df = pd.read_csv('koi_data.csv', comment='#')
print(f"Dataset shape: {df.shape}")
print(df['koi_pdisposition'].value_counts())
print(df.head())
