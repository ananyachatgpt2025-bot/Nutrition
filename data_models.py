import sqlite3
import json
import datetime as dt
from typing import List, Dict, Any, Optional

SCHEMA = {
  "children": """
    CREATE TABLE IF NOT EXISTS children (
      child_id TEXT PRIMARY KEY,
      child_name TEXT,
      dob TEXT,
      consultant TEXT,
      created_at TEXT
    );
  """,
  "artifacts": """
    CREATE TABLE IF NOT EXISTS artifacts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      child_id TEXT,
      kind TEXT,
      filename TEXT,
      content TEXT,
      created_at TEXT
    );
  """,
  "questions": """
    CREATE TABLE IF NOT EXISTS questions (
      child_id TEXT PRIMARY KEY,
      payload TEXT,
      created_at TEXT
    );
  """,
  "answers": """
    CREATE TABLE IF NOT EXISTS answers (
      child_id TEXT PRIMARY KEY,
      payload TEXT,
      created_at TEXT
    );
  """,
  "recommendations": """
    CREATE TABLE IF NOT EXISTS recommendations (
      child_id TEXT PRIMARY KEY,
      payload TEXT,
      created_at TEXT
    );
  """,
  "plans": """
    CREATE TABLE IF NOT EXISTS plans (
      child_id TEXT PRIMARY KEY,
      payload TEXT,
      created_at TEXT
    );
  """,
  # --- Knowledge Bank ---
  "kb_docs": """
    CREATE TABLE IF NOT EXISTS kb_docs (
      doc_id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT,
      content TEXT,
      created_at TEXT
    );
  """,
  "kb_chunks": """
    CREATE TABLE IF NOT EXISTS kb_chunks (
      doc_id INTEGER,
      chunk_index INTEGER,
      text TEXT,
      embedding TEXT,             -- JSON list of floats (or NULL if not embedded yet)
      created_at TEXT,
      PRIMARY KEY (doc_id, chunk_index)
    );
  """,
}

def _conn(db_path: str):
    return sqlite3.connect(db_path, check_same_thread=False)

def init_db(db_path: str):
    con = _conn(db_path); cur = con.cursor()
    for ddl in SCHEMA.values():
        cur.execute(ddl)
    con.commit(); con.close()

# -------- sessions --------
def upsert_child(db_path: str, child_id: str, name: str, dob: str, consultant: str):
    con = _conn(db_path); cur = con.cursor()
    now = dt.datetime.utcnow().isoformat()
    cur.execute("INSERT OR REPLACE INTO children(child_id, child_name, dob, consultant, created_at) VALUES (?,?,?,?,?)",
                (child_id, name, dob, consultant, now))
    con.commit(); con.close()

def list_children(db_path: str) -> List[Dict[str,Any]]:
    con = _conn(db_path); cur = con.cursor()
    rows = cur.execute("SELECT child_id, child_name, created_at FROM children ORDER BY created_at DESC").fetchall()
    con.close()
    return [{"child_id": r[0], "child_name": r[1], "created_at": r[2]} for r in rows]

def get_child(db_path: str, child_id: str):
    con = _conn(db_path); cur = con.cursor()
    row = cur.execute("SELECT child_id, child_name, dob, consultant, created_at FROM children WHERE child_id=?", (child_id,)).fetchone()
    con.close()
    if not row: return None
    return {"child_id": row[0], "child_name": row[1], "dob": row[2], "consultant": row[3], "created_at": row[4]}

# -------- artifacts --------
def save_artifact(db_path: str, child_id: str, kind: str=None, filename: str=None, content: str=None, fetch_only: bool=False):
    con = _conn(db_path); cur = con.cursor()
    if fetch_only:
        rows = cur.execute("SELECT kind, filename, content FROM artifacts WHERE child_id=? ORDER BY created_at ASC", (child_id,)).fetchall()
        con.close()
        return [{"kind": r[0], "filename": r[1], "content": r[2]} for r in rows]
    now = dt.datetime.utcnow().isoformat()
    cur.execute("INSERT INTO artifacts(child_id, kind, filename, content, created_at) VALUES (?,?,?,?,?)",
                (child_id, kind, filename, content, now))
    con.commit(); con.close()

# -------- QA / answers / plans --------
def save_questions(db_path, child_id, questions: List[str]):
    con = _conn(db_path); cur = con.cursor()
    now = dt.datetime.utcnow().isoformat()
    payload = json.dumps({"questions": questions})
    cur.execute("INSERT OR REPLACE INTO questions(child_id, payload, created_at) VALUES (?,?,?)", (child_id, payload, now))
    con.commit(); con.close()

def get_questions(db_path, child_id):
    con = _conn(db_path); cur = con.cursor()
    row = cur.execute("SELECT payload FROM questions WHERE child_id=?", (child_id,)).fetchone()
    con.close()
    if not row: return None
    return json.loads(row[0]).get("questions", [])

def save_answers(db_path, child_id, payload: Dict[str,Any]):
    con = _conn(db_path); cur = con.cursor()
    now = dt.datetime.utcnow().isoformat()
    cur.execute("INSERT OR REPLACE INTO answers(child_id, payload, created_at) VALUES (?,?,?)", (child_id, json.dumps(payload), now))
    con.commit(); con.close()

def get_answers(db_path, child_id):
    con = _conn(db_path); cur = con.cursor()
    row = cur.execute("SELECT payload FROM answers WHERE child_id=?", (child_id,)).fetchone()
    con.close()
    if not row: return None
    return json.loads(row[0])

def save_recommendations(db_path, child_id, payload: Dict[str,Any]):
    con = _conn(db_path); cur = con.cursor()
    now = dt.datetime.utcnow().isoformat()
    cur.execute("INSERT OR REPLACE INTO recommendations(child_id, payload, created_at) VALUES (?,?,?)", (child_id, json.dumps(payload), now))
    con.commit(); con.close()

def get_recommendations(db_path, child_id):
    con = _conn(db_path); cur = con.cursor()
    row = cur.execute("SELECT payload FROM recommendations WHERE child_id=?", (child_id,)).fetchone()
    con.close()
    if not row: return None
    return json.loads(row[0])

def save_plan(db_path, child_id, payload: Dict[str,Any]):
    con = _conn(db_path); cur = con.cursor()
    now = dt.datetime.utcnow().isoformat()
    cur.execute("INSERT OR REPLACE INTO plans(child_id, payload, created_at) VALUES (?,?,?)", (child_id, json.dumps(payload), now))
    con.commit(); con.close()

def get_plan(db_path, child_id):
    con = _conn(db_path); cur = con.cursor()
    row = cur.execute("SELECT payload FROM plans WHERE child_id=?", (child_id,)).fetchone()
    con.close()
    if not row: return None
    return json.loads(row[0])

# -------- Knowledge Bank helpers --------
def kb_add_doc(db_path: str, title: str, content: str) -> int:
    con = _conn(db_path); cur = con.cursor()
    now = dt.datetime.utcnow().isoformat()
    cur.execute("INSERT INTO kb_docs(title, content, created_at) VALUES (?,?,?)", (title, content, now))
    doc_id = cur.lastrowid
    con.commit(); con.close()
    return doc_id

def kb_add_chunk(db_path: str, doc_id: int, chunk_index: int, text: str, embedding: Optional[list] = None):
    con = _conn(db_path); cur = con.cursor()
    now = dt.datetime.utcnow().isoformat()
    emb_json = json.dumps(embedding) if embedding is not None else None
    cur.execute("INSERT OR REPLACE INTO kb_chunks(doc_id, chunk_index, text, embedding, created_at) VALUES (?,?,?,?,?)",
                (doc_id, chunk_index, text, emb_json, now))
    con.commit(); con.close()

def kb_list_docs(db_path: str) -> List[Dict[str,Any]]:
    con = _conn(db_path); cur = con.cursor()
    rows = cur.execute("SELECT doc_id, title, created_at FROM kb_docs ORDER BY created_at DESC").fetchall()
    con.close()
    return [{"doc_id": r[0], "title": r[1], "created_at": r[2]} for r in rows]

def kb_list_chunks(db_path: str, with_embeddings: bool = False) -> List[Dict[str,Any]]:
    con = _conn(db_path); cur = con.cursor()
    rows = cur.execute("SELECT doc_id, chunk_index, text, embedding FROM kb_chunks").fetchall()
    con.close()
    out = []
    for r in rows:
        out.append({
            "doc_id": r[0], "chunk_index": r[1], "text": r[2],
            "embedding": (json.loads(r[3]) if (with_embeddings and r[3]) else None)
        })
    return out

def kb_save_chunk_embedding(db_path: str, doc_id: int, chunk_index: int, embedding: list):
    con = _conn(db_path); cur = con.cursor()
    emb_json = json.dumps(embedding)
    cur.execute("UPDATE kb_chunks SET embedding=? WHERE doc_id=? AND chunk_index=?",
                (emb_json, doc_id, chunk_index))
    con.commit(); con.close()

def kb_clear(db_path: str):
    con = _conn(db_path); cur = con.cursor()
    cur.execute("DELETE FROM kb_chunks"); cur.execute("DELETE FROM kb_docs")
    con.commit(); con.close()
