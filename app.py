import os
import io
import base64
import json
import datetime as dt
from typing import List, Dict, Any

import streamlit as st
from dotenv import load_dotenv

from data_models import (
    init_db, upsert_child, list_children, get_child, save_artifact,
    save_questions, get_questions, save_answers, get_answers,
    save_recommendations, get_recommendations, save_plan, get_plan
)

from utils import parse_document_text, simple_hash, pdf_from_markdown
from prompts import build_question_prompt, build_test_prompt, build_plan_prompt
from rules_engine import recommend_tests_via_rules
from drive_sync import ensure_gold_cases_index, retrieve_similar_gold_cases

# --- LLM (OpenAI) ---
from openai import OpenAI

def _get_secret(name: str, default: str = "") -> str:
    """Prefer Streamlit secrets; fall back to env vars."""
    try:
        return st.secrets.get(name, os.getenv(name, default))
    except Exception:
        return os.getenv(name, default)

load_dotenv()
OPENAI_API_KEY = _get_secret("OPENAI_API_KEY", "")
client = OpenAI(api_key=OPENAI_API_KEY) if OPENAI_API_KEY else None

st.set_page_config(page_title="Neuro-Nutrition Consultant", page_icon="🧠", layout="wide")

PRIMARY = "#101112"  # Minimal, dark text
ACCENT = "#0E7C86"   # Calm teal

st.markdown(
    f"""
    <style>
      .block-container {{ padding-top: 1.5rem; }}
      .stApp {{ background: #FFFFFF; }}
      h1, h2, h3, h4 {{ color: {PRIMARY}; font-family: -apple-system,BlinkMacSystemFont,Segoe UI,Helvetica,Arial; }}
      .stButton>button {{ border-radius: 12px; padding: 0.5rem 1rem; border: 1px solid #eaeaea; }}
      .stTextInput>div>div>input {{ border-radius: 10px !important; }}
    </style>
    """,
    unsafe_allow_html=True,
)

# --- Initialisation ---
DB_PATH = _get_secret("DB_PATH", "neuro_nutrition.db")
GDRIVE_FOLDER_ID = _get_secret("GDRIVE_FOLDER_ID", "")

init_db(DB_PATH)

st.title("Neuro-Nutrition Consultant (Prototype)")
st.caption("British English • Neuro-affirmative • Designed for Indian context • Minimal clicks, clear output")

# --- Sidebar: Session / Child Management ---
st.sidebar.header("Consultation Sessions")
child_name = st.sidebar.text_input("Child name")
child_dob = st.sidebar.date_input("Date of birth")
consultant = st.sidebar.text_input("Consultant name", value="")

col_a, col_b = st.sidebar.columns(2)
with col_a:
    if st.button("Create / Update Session", use_container_width=True):
        if not child_name:
            st.sidebar.error("Please enter the child's name.")
        else:
            child_id = simple_hash(f"{child_name}|{child_dob}|{consultant}|{dt.datetime.utcnow().isoformat()}")
            upsert_child(DB_PATH, child_id, child_name, child_dob.isoformat(), consultant)
            st.session_state["child_id"] = child_id
            st.sidebar.success(f"Session ready for {child_name}.")
with col_b:
    sessions = list_children(DB_PATH)
    if sessions:
        labels = [f"{s['child_name']} · {s['created_at'][:10]}" for s in sessions]
        idx = st.selectbox(
            "Existing sessions",
            options=list(range(len(sessions))),
            format_func=lambda i: labels[i],
            index=0
        )
        if st.button("Load session", use_container_width=True):
            st.session_state["child_id"] = sessions[idx]["child_id"]
            st.sidebar.success("Loaded.")
    else:
        st.caption("No previous sessions yet.")

if "child_id" not in st.session_state:
    st.info("Create or load a session from the sidebar to begin.")
    st.stop()

child = get_child(DB_PATH, st.session_state["child_id"]) or {}
st.subheader(f"Session: {child.get('child_name','')} — {child.get('child_id','')[:8]}")

# --- Section 1: Upload Psychometric Report(s) ---
st.markdown("### 1) Upload psychometric assessment report(s)")
psy_files = st.file_uploader("Upload PDF/DOCX (multiple allowed)", type=["pdf","docx"], accept_multiple_files=True)
if psy_files:
    for f in psy_files:
        text = parse_document_text(f)
        save_artifact(DB_PATH, st.session_state["child_id"], kind="psychometric", filename=f.name, content=text)
    st.success("Psychometric reports ingested.")

# --- Section 2: Generate 10–15 Parent Questions ---
st.markdown("### 2) Consultant questions for parents (10–15)")
existing_qs = get_questions(DB_PATH, st.session_state["child_id"]) or []
if not existing_qs and st.button("Generate questions"):
    if not client:
        st.error("OpenAI key missing. Add OPENAI_API_KEY in Streamlit Secrets.")
    else:
        artifacts = save_artifact(DB_PATH, st.session_state["child_id"], kind=None, fetch_only=True)
        psych_texts = [a["content"] for a in artifacts if a["kind"] == "psychometric"]
        context = "\n\n".join(psych_texts[-3:])[:15000]

        gold_context = ""
        if GDRIVE_FOLDER_ID:
            ensure_gold_cases_index()
            gold_context = retrieve_similar_gold_cases(query=context, top_k=3)

        prompt = build_question_prompt(context=context, gold_context=gold_context)
        try:
            resp = client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[
                    {"role": "system", "content": "You are a neuro-affirmative paediatric nutrition consultant."},
                    {"role": "user", "content": prompt},
                ],
                temperature=0.2,
            )
            text = resp.choices[0].message.content
            questions = [q.strip("- • ") for q in text.strip().split("\n") if q.strip()][:15]
            save_questions(DB_PATH, st.session_state["child_id"], questions)
            existing_qs = questions
        except Exception as e:
            st.error("OpenAI authentication failed. Check your OPENAI_API_KEY in Secrets (use a fresh key, keep quotes).")
            st.caption(f"Technical note: {type(e).__name__}")

if existing_qs:
    st.write("Please share these with parents and paste answers below during the consult:")
    for i, q in enumerate(existing_qs, 1):
        st.markdown(f"**{i}. {q}**")

# --- Section 3: Record Parent Answers ---
st.markdown("### 3) Paste parent answers (keep concise)")
prev_ans = get_answers(DB_PATH, st.session_state["child_id"]) or {}
answers = st.text_area("Answers (numbered 1–15)", value=prev_ans.get("raw", ""), height=200)
if st.button("Save answers"):
    save_answers(DB_PATH, st.session_state["child_id"], {"raw": answers})
    st.success("Answers saved.")

# --- Section 4: Blood Test Recommendations ---
st.markdown("### 4) Blood test recommendations (evidence-bound)")
recs = get_recommendations(DB_PATH, st.session_state["child_id"]) or {}
if st.button("Recommend tests"):
    artifacts = save_artifact(DB_PATH, st.session_state["child_id"], kind=None, fetch_only=True)
    psych_texts = [a["content"] for a in artifacts if a["kind"] == "psychometric"]
    context = "\n\n".join(psych_texts[-3:])[:8000]
    rule_based = recommend_tests_via_rules(context=context, answers=answers)

    prompt = build_test_prompt(context=context, answers=answers, rule_tests=rule_based)
    if not client:
        st.error("OpenAI key missing.")
    else:
        try:
            resp = client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[
                    {"role": "system", "content": "You are a careful paediatric nutrition consultant. Only recommend from the approved list."},
                    {"role": "user", "content": prompt},
                ],
                temperature=0.1,
            )
            text = resp.choices[0].message.content
            save_recommendations(DB_PATH, st.session_state["child_id"], {"tests_markdown": text, "rules": rule_based})
            recs = {"tests_markdown": text, "rules": rule_based}
        except Exception as e:
            st.error("OpenAI authentication failed. Check your OPENAI_API_KEY in Secrets.")
            st.caption(f"Technical note: {type(e).__name__}")

if recs:
    st.markdown(recs.get("tests_markdown", ""))

# --- Section 5: Upload Blood Report(s) ---
st.markdown("### 5) Upload laboratory report(s)")
lab_files = st.file_uploader("Upload PDF (multiple allowed)", type=["pdf"], accept_multiple_files=True, key="lab")
if lab_files:
    for f in lab_files:
        text = parse_document_text(f)
        save_artifact(DB_PATH, st.session_state["child_id"], kind="lab_report", filename=f.name, content=text)
    st.success("Laboratory reports captured.")

# --- Section 6: Generate Diet & Supplement Plan ---
st.markdown("### 6) Diet & supplementation plan (for clinician review)")
plan = get_plan(DB_PATH, st.session_state["child_id"]) or {}
if st.button("Generate plan PDF"):
    artifacts = save_artifact(DB_PATH, st.session_state["child_id"], kind=None, fetch_only=True)
    psych_texts = [a["content"] for a in artifacts if a["kind"] == "psychometric"]
    lab_texts = [a["content"] for a in artifacts if a["kind"] == "lab_report"]

    context = "\n\n".join(psych_texts[-3:])[:8000]
    labs = "\n\n".join(lab_texts[-4:])[:10000]

    tests_md = (recs or {}).get("tests_markdown", "")
    prompt = build_plan_prompt(context=context, answers=answers, labs=labs, tests_markdown=tests_md)

    if not client:
        st.error("OpenAI key missing.")
    else:
        try:
            resp = client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[
                    {"role": "system", "content": "You write concise, British English, neuro-affirmative care plans for Indian families."},
                    {"role": "user", "content": prompt},
                ],
                temperature=0.2,
            )
            plan_md = resp.choices[0].message.content
            pdf_bytes = pdf_from_markdown(plan_md, title=f"Nutrition Plan — {child.get('child_name','Child')}")
            save_plan(DB_PATH, st.session_state["child_id"], {"markdown": plan_md})
            st.download_button("Download Plan PDF", data=pdf_bytes, file_name="nutrition_plan.pdf", mime="application/pdf")
            st.markdown("Preview:")
            st.markdown(plan_md)
        except Exception as e:
            st.error("OpenAI authentication failed. Check your OPENAI_API_KEY in Secrets.")
            st.caption(f"Technical note: {type(e).__name__}")

st.divider()
st.caption("This prototype supports clinical decision-support for professionals. It does not replace medical advice.")
