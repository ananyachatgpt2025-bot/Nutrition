import os, json
from typing import List, Tuple
import numpy as np

from openai import OpenAI
from utils import parse_document_text
from data_models import (
    kb_add_doc, kb_add_chunk, kb_list_docs, kb_list_chunks, kb_save_chunk_embedding
)

def _get_secret(name: str, default: str = "") -> str:
    try:
        import streamlit as st
        return st.secrets.get(name, os.getenv(name, default))
    except Exception:
        return os.getenv(name, default)

OPENAI_API_KEY = _get_secret("OPENAI_API_KEY", "")
EMBED_MODEL = os.getenv("EMBED_MODEL", "text-embedding-3-large")
client = OpenAI(api_key=OPENAI_API_KEY) if OPENAI_API_KEY else None

# ---------- chunking ----------
def _chunks(text: str, size: int = 1200, overlap: int = 200) -> List[str]:
    if not text:
        return []
    text = text.strip()
    out, i = [], 0
    step = max(1, size - overlap)
    while i < len(text):
        out.append(text[i:i+size])
        i += step
    return out

# ---------- embeddings ----------
def _embed_texts(texts: List[str]) -> np.ndarray:
    if not client:
        raise RuntimeError("OpenAI key missing")
    inputs = [(t or "")[:6000] for t in texts]
    resp = client.embeddings.create(model=EMBED_MODEL, input=inputs)
    vecs = np.array([d.embedding for d in resp.data], dtype=np.float32)
    norms = np.linalg.norm(vecs, axis=1, keepdims=True) + 1e-8
    return vecs / norms

# ---------- public helpers ----------
def kb_add_uploads(db_path: str, uploads) -> Tuple[int, int]:
    """Parse uploads -> docs + unembedded chunks in DB. Returns (#docs, #chunks)."""
    docs, chunks = 0, 0
    for up in uploads:
        text = parse_document_text(up)
        if not text.strip():
            continue
        doc_id = kb_add_doc(db_path, title=up.name, content="")
        for idx, ch in enumerate(_chunks(text)):
            kb_add_chunk(db_path, doc_id, idx, ch, embedding=None)
            chunks += 1
        docs += 1
    return docs, chunks

def kb_build_index(db_path: str, batch: int = 64) -> Tuple[int, int]:
    """Embed any chunks missing embeddings. Returns (embedded, remaining)."""
    rows = kb_list_chunks(db_path, with_embeddings=True)
    to_embed = [(r["doc_id"], r["chunk_index"], r["text"]) for r in rows if r["embedding"] is None]
    total, done = len(to_embed), 0
    for s in range(0, total, batch):
        batch_rows = to_embed[s:s+batch]
        if not batch_rows:
            break
        vecs = _embed_texts([r[2] for r in batch_rows])
        for (doc_id, idx, _), v in zip(batch_rows, vecs):
            kb_save_chunk_embedding(db_path, doc_id, idx, v.tolist())
            done += 1
    return done, (total - done)

def kb_retrieve(db_path: str, query: str, top_k: int = 3) -> str:
    """Return top-k KB snippets for prompt context."""
    rows = kb_list_chunks(db_path, with_embeddings=True)
    embs = [r["embedding"] for r in rows if r["embedding"] is not None]
    if not embs:
        return ""
    X = np.array(embs, dtype=np.float32)
    X = X / (np.linalg.norm(X, axis=1, keepdims=True) + 1e-8)
    q = _embed_texts([query or ""])[0]
    scores = X @ q
    emb_rows = [r for r in rows if r["embedding"] is not None]
    idxs = np.argsort(-scores)[:top_k]
    parts = []
    for i in idxs:
        r = emb_rows[int(i)]
        parts.append(r["text"].strip()[:800])
    return "\n\n".join(parts)

def kb_list(db_path: str):
    return kb_list_docs(db_path)
