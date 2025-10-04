#!/usr/bin/env python3
import os
import sys
import json
import time
import pickle
import argparse
import pandas as pd
import numpy as np
from sklearn.metrics import accuracy_score, confusion_matrix, classification_report

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
sys.path.append(os.path.join(ROOT, 'scripts'))

from feature_engineering import add_engineered_features, RAW_FEATURES
from llm_in_context_classifier_fixed import LLMInContextClassifierFixed


def normalize_label(v: str) -> str:
    u = str(v).upper()
    if u in ['CANDIDATE', 'CONFIRMED']:
        return 'CANDIDATE'
    if u in ['FALSE POSITIVE', 'FALSE_POSITIVE', 'FP']:
        return 'FALSE POSITIVE'
    return u


def load_models():
    with open(os.path.join(ROOT, 'models', 'model_no_flags.pkl'), 'rb') as f:
        rf_model = pickle.load(f)
    with open(os.path.join(ROOT, 'models', 'scaler_no_flags.pkl'), 'rb') as f:
        rf_scaler = pickle.load(f)
    llm_classifier = LLMInContextClassifierFixed()
    return rf_model, rf_scaler, llm_classifier


def rf_predict(model, scaler, row: pd.Series):
    raw_values = {f: row[f] for f in RAW_FEATURES}
    raw_df = pd.DataFrame([raw_values], columns=RAW_FEATURES)
    feats = add_engineered_features(raw_df, include_raw=True)
    Xs = scaler.transform(feats.values)
    pred = model.predict(Xs)[0]
    proba = model.predict_proba(Xs)[0]
    classes = list(getattr(model, 'classes_', [0, 1]))
    cand_idx = classes.index(1) if 1 in classes else int(np.argmax(proba))
    conf = float(proba[cand_idx])
    label = 'CANDIDATE' if int(pred) == 1 else 'FALSE POSITIVE'
    return label, conf


def nearest_neighbors(llm: LLMInContextClassifierFixed, row: pd.Series, k: int = 10):
    # Build query embedding
    query_text = llm._format_row_for_embedding(row)
    q_emb = llm._get_embeddings([query_text])[0]
    distances, indices = llm.vector_store.kneighbors([q_emb], n_neighbors=k)
    out = []
    for d, idx in zip(distances[0], indices[0]):
        ex = llm.original_data[idx]
        out.append({
            'koi_period': ex.get('koi_period'),
            'koi_duration': ex.get('koi_duration'),
            'koi_depth': ex.get('koi_depth'),
            'koi_prad': ex.get('koi_prad'),
            'koi_impact': ex.get('koi_impact'),
            'koi_teq': ex.get('koi_teq'),
            'label': ex.get('koi_pdisposition'),
            'distance': float(d),
        })
    return out


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--csv', type=str, default=os.path.join(ROOT, 'data', 'test_50_random.csv'))
    parser.add_argument('--n', type=int, default=50)
    parser.add_argument('--seed', type=int, default=123)
    args = parser.parse_args()

    print(f"\n=== RF vs LLM Diagnostics on {args.n} Held-Out Examples ===")
    rf_model, rf_scaler, llm = load_models()

    df_full = pd.read_csv(args.csv)
    if len(df_full) >= args.n:
        df = df_full.sample(n=args.n, random_state=args.seed).reset_index(drop=True)
    else:
        df = df_full.copy().reset_index(drop=True)

    # Determine label column
    label_col = 'koi_pdisposition' if 'koi_pdisposition' in df.columns else (
        'label' if 'label' in df.columns else None
    )
    if label_col is None:
        raise RuntimeError('No ground-truth label column found in test_50_random.csv')

    rows = []
    rf_preds = []
    llm_preds = []
    actuals = []

    timings = {
        'rf_total_s': 0.0,
        'llm_total_s': 0.0,
    }

    for i, row in df.iterrows():
        actual = normalize_label(row[label_col])
        actuals.append(actual)

        # RF prediction
        t0 = time.time()
        rf_label, rf_conf = rf_predict(rf_model, rf_scaler, row)
        timings['rf_total_s'] += (time.time() - t0)
        rf_preds.append(rf_label)

        # LLM prediction
        t0 = time.time()
        llm_label = llm.classify({
            'koi_period': float(row['koi_period']),
            'koi_duration': float(row['koi_duration']),
            'koi_depth': float(row['koi_depth']),
            'koi_prad': float(row['koi_prad']),
            'koi_impact': float(row['koi_impact']),
            'koi_teq': float(row['koi_teq']),
        }, k=25)
        timings['llm_total_s'] += (time.time() - t0)
        llm_preds.append(llm_label)

        # For speed, only compute neighbor context if LLM is wrong
        nn = []
        if llm_label in ['CANDIDATE', 'FALSE POSITIVE'] and llm_label != actual:
            nn = nearest_neighbors(llm, row, k=5)

        rows.append({
            'idx': int(i),
            'kepoi_name': row.get('kepoi_name', ''),
            'actual': actual,
            'rf_pred': rf_label,
            'rf_confidence': rf_conf,
            'llm_pred': llm_label,
            'koi_period': row['koi_period'],
            'koi_duration': row['koi_duration'],
            'koi_depth': row['koi_depth'],
            'koi_prad': row['koi_prad'],
            'koi_impact': row['koi_impact'],
            'koi_teq': row['koi_teq'],
            'nn_top5': json.dumps(nn),
        })

    # Metrics
    rf_acc = accuracy_score(actuals, rf_preds)
    llm_valid_indices = [i for i, p in enumerate(llm_preds) if p in ['CANDIDATE', 'FALSE POSITIVE']]
    llm_acc = accuracy_score([actuals[i] for i in llm_valid_indices], [llm_preds[i] for i in llm_valid_indices]) if llm_valid_indices else 0.0

    print(f"RF accuracy:  {rf_acc:.1%}")
    print(f"LLM accuracy: {llm_acc:.1%} (valid {len(llm_valid_indices)}/{len(llm_preds)})")
    print(f"Avg RF time:  {timings['rf_total_s'] / len(df) * 1000:.1f} ms")
    print(f"Avg LLM time: {timings['llm_total_s'] / len(df):.2f} s")

    # Save CSV
    out_dir = os.path.join(ROOT, 'results')
    os.makedirs(out_dir, exist_ok=True)
    out_csv = os.path.join(out_dir, f'diagnostics_{args.n}.csv')
    pd.DataFrame(rows).to_csv(out_csv, index=False)
    print(f"Saved per-case results to: {out_csv}")

    # List all LLM mistakes with specifics
    print("\n=== LLM Mistakes (if any) ===")
    mistakes = []
    for r in rows:
        if r['llm_pred'] in ['CANDIDATE', 'FALSE POSITIVE'] and r['llm_pred'] != r['actual']:
            mistakes.append(r)
    if not mistakes:
        print("No LLM mistakes on these 50 examples.")
    else:
        for r in mistakes:
            nn = json.loads(r['nn_top5'])
            nn_summary = ', '.join([f"{n['label']} (d={n['distance']:.3f})" for n in nn])
            print(f"- idx={r['idx']} kepoi={r['kepoi_name']} actual={r['actual']} llm_pred={r['llm_pred']} | RF={r['rf_pred']} ({r['rf_confidence']:.2f}) | NN: {nn_summary}")


if __name__ == '__main__':
    main()


