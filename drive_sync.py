
"""
Optional Drive ingestion + gold-case retrieval.
This stub keeps the app import-safe even without Google/FAISS/OpenAI embeddings installed.
In production, replace with a full implementation that builds a FAISS index from Drive.
"""

def ensure_gold_cases_index(force: bool=False) -> bool:
    # No-op: return True so the app proceeds quietly when GDRIVE_FOLDER_ID is set.
    return True

def retrieve_similar_gold_cases(query: str, top_k: int=3) -> str:
    # No-op: return an empty banner. Replace with real retrieval when ready.
    return ""
