#!/usr/bin/env python3
"""
Fast clustering + centroid matching via numpy.

Input JSON:
  {
    "embeddings": [[...], ...],          # N articles to process
    "article_ids": [id1, id2, ...],      # matching N article IDs
    "centroids": {"event_id": [...], ...}, # existing event centroids (optional)
    "threshold": 0.82
  }

Output JSON:
  {
    "matched": {"article_idx": event_id, ...},  # articles matched to existing events
    "labels":  [0, 0, 1, -1, 2, ...],           # cluster labels for UNMATCHED articles (-1 = matched)
    "num_clusters": N
  }
"""

import json
import sys
import argparse
import numpy as np


def normalize(v: np.ndarray) -> np.ndarray:
    norms = np.linalg.norm(v, axis=-1, keepdims=True)
    norms[norms == 0] = 1.0
    return v / norms


def match_to_centroids(
    embeddings: np.ndarray,        # (N, D) normalized
    centroid_ids: list,            # [event_id, ...]
    centroid_matrix: np.ndarray,   # (M, D) normalized
    threshold: float,
) -> dict:
    """
    Returns {article_index: event_id} for articles that match an existing centroid.
    """
    if len(centroid_ids) == 0:
        return {}

    # (N, M) similarity matrix — very fast with BLAS
    sim = embeddings @ centroid_matrix.T

    best_sim = sim.max(axis=1)        # (N,)
    best_idx = sim.argmax(axis=1)     # (N,)

    matched = {}
    for i in range(len(embeddings)):
        if best_sim[i] >= threshold:
            matched[i] = centroid_ids[best_idx[i]]

    return matched


def cluster_greedy(embeddings: np.ndarray, threshold: float) -> list:
    """
    Greedy single-linkage clustering. Returns label per article.
    embeddings: (N, D) normalized
    """
    n = len(embeddings)
    if n == 0:
        return []

    # Full similarity matrix in one BLAS call
    sim = embeddings @ embeddings.T  # (N, N)

    labels = [-1] * n
    used = np.zeros(n, dtype=bool)
    cluster_id = 0

    for i in range(n):
        if used[i]:
            continue
        labels[i] = cluster_id
        used[i] = True
        similar = np.where((sim[i] >= threshold) & np.logical_not(used))[0]
        for j in similar:
            labels[j] = cluster_id
            used[j] = True
        cluster_id += 1

    return labels


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--input',  help='Input JSON file path')
    parser.add_argument('--output', help='Output JSON file path')
    args = parser.parse_args()

    try:
        if args.input:
            with open(args.input, 'r', encoding='utf-8') as f:
                data = json.load(f)
        else:
            data = json.load(sys.stdin)

        raw_embeddings = data.get('embeddings', [])
        threshold      = float(data.get('threshold', 0.82))
        centroids_dict = data.get('centroids', {})  # {"event_id": [float, ...]}

        if not raw_embeddings:
            result = json.dumps({'matched': {}, 'labels': [], 'num_clusters': 0})
            _write(result, args.output)
            return

        # Normalize article embeddings
        emb_matrix = normalize(np.array(raw_embeddings, dtype='float32'))  # (N, D)
        N = len(emb_matrix)

        matched = {}  # {article_index: event_id}

        # --- Phase 1: match to existing centroids ---
        if centroids_dict:
            centroid_ids = [int(k) for k in centroids_dict.keys()]
            centroid_vecs = normalize(np.array(list(centroids_dict.values()), dtype='float32'))
            matched = match_to_centroids(emb_matrix, centroid_ids, centroid_vecs, threshold)

        # --- Phase 2: cluster remaining articles ---
        remaining_indices = [i for i in range(N) if i not in matched]

        labels_full = [-1] * N  # -1 = matched to existing event

        if remaining_indices:
            rem_emb = emb_matrix[remaining_indices]  # (R, D)
            rem_labels = cluster_greedy(rem_emb, threshold)
            for pos, orig_idx in enumerate(remaining_indices):
                labels_full[orig_idx] = rem_labels[pos]

        num_clusters = max((l for l in labels_full if l >= 0), default=-1) + 1

        result = json.dumps({
            'matched':      {str(k): v for k, v in matched.items()},
            'labels':       labels_full,
            'num_clusters': num_clusters,
        })
        _write(result, args.output)

    except Exception as e:
        error = json.dumps({'error': str(e), 'matched': {}, 'labels': [], 'num_clusters': 0})
        _write(error, args.output)
        sys.exit(1)


def _write(content: str, path):
    if path:
        with open(path, 'w', encoding='utf-8') as f:
            f.write(content)
    else:
        print(content)


if __name__ == '__main__':
    main()
