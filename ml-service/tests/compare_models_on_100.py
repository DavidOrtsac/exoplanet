import pandas as pd
import numpy as np
import pickle
from sklearn.metrics import accuracy_score, classification_report, confusion_matrix
import sys; sys.path.append('../scripts'); from feature_engineering import add_engineered_features

RAW_FEATURES = ['koi_period','koi_duration','koi_depth','koi_prad','koi_impact','koi_teq']


def load_models():
    with open('model_raw../models/.pkl','rb') as f:
        model_raw = pickle.load(f)
    with open('scaler_raw../models/.pkl','rb') as f:
        scaler_raw = pickle.load(f)
    with open('model_no_flags../models/.pkl','rb') as f:
        model_eng = pickle.load(f)
    with open('scaler_no_flags../models/.pkl','rb') as f:
        scaler_eng = pickle.load(f)
    return model_raw, scaler_raw, model_eng, scaler_eng


def load_test_100():
    df = pd.read_csv('../data/test_100_random.csv')
    if 'koi_pdisposition' in df.columns:
        labels = df['koi_pdisposition']
    elif 'label' in df.columns:
        labels = df['label']
    else:
        raise ValueError('No label column found in test_100_random.csv')
    return df, labels


def normalize_labels(series: pd.Series) -> list:
    out = []
    for v in series:
        v_up = str(v).upper()
        if v_up in ['CANDIDATE','CONFIRMED']:
            out.append('CANDIDATE')
        elif v_up in ['FALSE POSITIVE','FALSE_POSITIVE','FP']:
            out.append('FALSE POSITIVE')
        else:
            out.append(v)
    return out


def evaluate_raw(model, scaler, df, actual_labels):
    X = df[RAW_FEATURES].copy()
    X = X.fillna(X.median(numeric_only=True))
    Xs = scaler.transform(X)
    preds = model.predict(Xs)
    pred_labels = ['CANDIDATE' if p==1 else 'FALSE POSITIVE' for p in preds]
    acc = accuracy_score(actual_labels, pred_labels)
    cm = confusion_matrix(actual_labels, pred_labels, labels=['FALSE POSITIVE','CANDIDATE'])
    return acc, cm


def evaluate_engineered(model, scaler, df, actual_labels):
    X_raw = df[RAW_FEATURES].copy().fillna(df[RAW_FEATURES].median(numeric_only=True))
    X = add_engineered_features(X_raw, include_raw=True)
    Xs = scaler.transform(X.values)
    preds = model.predict(Xs)
    pred_labels = ['CANDIDATE' if p==1 else 'FALSE POSITIVE' for p in preds]
    acc = accuracy_score(actual_labels, pred_labels)
    cm = confusion_matrix(actual_labels, pred_labels, labels=['FALSE POSITIVE','CANDIDATE'])
    return acc, cm


def main():
    print('=== Comparing RAW vs ENGINEERED models on test_100_random.csv ===')
    model_raw, scaler_raw, model_eng, scaler_eng = load_models()
    df, labels = load_test_100()
    actual = normalize_labels(labels)

    # Evaluate RAW
    acc_raw, cm_raw = evaluate_raw(model_raw, scaler_raw, df, actual)
    # Evaluate ENGINEERED
    acc_eng, cm_eng = evaluate_engineered(model_eng, scaler_eng, df, actual)

    print('\nGround truth counts:')
    print(f"  CANDIDATE: {actual.count('CANDIDATE')}  FALSE POSITIVE: {actual.count('FALSE POSITIVE')}")

    print('\nRAW model results:')
    print(f'  Accuracy: {acc_raw*100:.1f}%')
    print('  Confusion matrix (rows=actual FP,CAND | cols=pred FP,CAND):')
    print(cm_raw)

    print('\nENGINEERED model results:')
    print(f'  Accuracy: {acc_eng*100:.1f}%')
    print('  Confusion matrix (rows=actual FP,CAND | cols=pred FP,CAND):')
    print(cm_eng)

    diff = (acc_eng - acc_raw) * 100
    print(f"\nΔ Accuracy (engineered - raw): {diff:+.1f} percentage points")

if __name__ == '__main__':
    main()
