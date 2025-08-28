
import sqlite3
import json
import datetime as dt
from typing import List, Dict, Any

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
}


def _conn(db_path: str):
    return sqlite3.connect(db_path, check_same_thread=False)


def init_db(db_path: str):
    con = _conn(db_path)
    cur = con.cursor()
    for ddl in SCHEMA.values():
        cur.execute(ddl)
    con.commit(); con.close()


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
