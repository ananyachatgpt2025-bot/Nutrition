import os, io, base64, datetime as dt
from types import SimpleNamespace

from dash import Dash, html, dcc, Input, Output, State, ctx
import dash_bootstrap_components as dbc

from dotenv import load_dotenv
from openai import OpenAI

from data_models import (
    init_db, upsert_child, list_children, get_child,
    save_artifact, save_questions, get_questions,
    save_answers, get_answers, save_recommendations,
    get_recommendations, save_plan, get_plan
)
from rules_engine import recommend_tests_via_rules
from prompts import build_question_prompt, build_test_prompt, build_plan_prompt
from utils import parse_document_text, simple_hash, pdf_from_markdown

load_dotenv()
DB_PATH = os.getenv("DB_PATH", "neuro_nutrition.db")
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "")
client = OpenAI(api_key=OPENAI_API_KEY) if OPENAI_API_KEY else None

init_db(DB_PATH)

app = Dash(__name__, external_stylesheets=[dbc.themes.BOOTSTRAP])
server = app.server

def _decode_upload(contents: str, filename: str) -> str:
    """Dash uploads deliver base64 strings. Convert to text via our parser."""
    content_type, content_string = contents.split(',', 1)
    data = base64.b64decode(content_string)
    mem = SimpleNamespace(name=filename, read=lambda: data)
    return parse_document_text(mem)

def _session_banner(child_id: str) -> str:
    c = get_child(DB_PATH, child_id) or {}
    return f"Session: {c.get('child_name','')} — {child_id[:8]}" if child_id else "No session"

app.layout = dbc.Container([
    html.H2("Neuro-Nutrition Consultant (Prototype)"),
    html.Div("British English • Neuro-affirmative • Designed for Indian context"),
    dcc.Store(id="child-id"),

    # Session Row
    dbc.Row([
        dbc.Col([
            dbc.Label("Child name"),
            dbc.Input(id="child-name", placeholder="e.g., Aadhya"),
            dbc.Label("Date of birth"),
            dcc.DatePickerSingle(id="child-dob"),
            dbc.Label("Consultant name"),
            dbc.Input(id="consultant"),
            html.Br(),
            dbc.Button("Create / Update Session", id="btn-create", color="primary"),
            html.Hr(),
            dbc.Label("Existing sessions"),
            dcc.Dropdown(id="existing-sessions", options=[], placeholder="Select a session"),
            dbc.Button("Load session", id="btn-load", className="mt-2"),
            html.Div(id="session-status", className="mt-2", style={"color":"#0a7"}),
        ], width=3),

        dbc.Col([
            html.H4(id="session-banner", className="mb-3"),

            # 1) Upload psychometrics
            html.H5("1) Upload psychometric assessment report(s)"),
            dcc.Upload(
                id="psy-upload", children=html.Div(["Drag & drop or ", html.A("browse files")]),
                multiple=True, accept=".pdf,.docx", style={"border":"1px dashed #999", "padding":"12px"}
            ),
            html.Div(id="psy-status", className="mt-2"),

            # 2) Generate questions
            html.H5("2) Consultant questions for parents (10–15)"),
            dbc.Button("Generate questions", id="btn-questions", color="secondary", className="mb-2"),
            dcc.Markdown(id="questions-md"),

            # 3) Answers
            html.H5("3) Paste parent answers (keep concise)"),
            dcc.Textarea(id="answers", style={"width":"100%","height":"160px"}),
            dbc.Button("Save answers", id="btn-save-answers", className="mt-2"),
            html.Div(id="answers-status", className="mt-2", style={"color":"#0a7"}),

            # 4) Recommend tests
            html.H5("4) Blood test recommendations (evidence-bound)"),
            dbc.Button("Recommend tests", id="btn-tests", color="secondary", className="mb-2"),
            dcc.Markdown(id="tests-md"),

            # 5) Upload labs
            html.H5("5) Upload laboratory report(s)"),
            dcc.Upload(
                id="lab-upload", children=html.Div(["Drag & drop or ", html.A("browse files")]),
                multiple=True, accept=".pdf", style={"border":"1px dashed #999", "padding":"12px"}
            ),
            html.Div(id="lab-status", className="mt-2"),

            # 6) Plan
            html.H5("6) Diet & supplementation plan (for clinician review)"),
            dbc.Button("Generate plan PDF", id="btn-plan", color="danger", className="mb-2"),
            dcc.Download(id="download-plan"),
            dcc.Markdown(id="plan-preview"),
        ], width=9)
    ])
], fluid=True)

# ------- callbacks ---------

@app.callback(
    Output("child-id","data"), Output("session-status","children"),
    Input("btn-create","n_clicks"),
    State("child-name","value"), State("child-dob","date"), State("consultant","value"),
    prevent_initial_call=True
)
def create_session(n, name, dob, consultant):
    if not name:
        return dash.no_update, "Please enter the child's name."
    child_id = simple_hash(f"{name}|{dob}|{consultant}|{dt.datetime.utcnow().isoformat()}")
    upsert_child(DB_PATH, child_id, name, (dob or dt.date.today().isoformat()), consultant or "")
    return child_id, f"Session ready for {name}."

@app.callback(
    Output("existing-sessions","options"),
    Input("child-id","data")
)
def list_sessions(_):
    sess = list_children(DB_PATH)
    return [{"label": f"{s['child_name']} · {s['created_at'][:10]}", "value": s["child_id"]} for s in sess]

@app.callback(
    Output("child-id","data"),
    Output("session-status","children"),
    Input("btn-load","n_clicks"), State("existing-sessions","value"),
    prevent_initial_call=True
)
def load_session(n, child_id):
    if not child_id: return dash.no_update, "Select a session first."
    return child_id, "Loaded."

@app.callback(
    Output("session-banner","children"),
    Input("child-id","data")
)
def show_banner(child_id):
    return _session_banner(child_id or "")

# -- uploads: psychometric
@app.callback(
    Output("psy-status","children"),
    Input("psy-upload","contents"), State("psy-upload","filename"), State("child-id","data"),
    prevent_initial_call=True
)
def ingest_psychometric(contents_list, names, child_id):
    if not child_id: return "Create/load a session first."
    if not contents_list: return dash.no_update
    for contents, name in zip(contents_list, names):
        text = _decode_upload(contents, name)
        save_artifact(DB_PATH, child_id, kind="psychometric", filename=name, content=text)
    return "Psychometric reports ingested."

# -- questions
@app.callback(
    Output("questions-md","children"),
    Input("btn-questions","n_clicks"), State("child-id","data"),
    prevent_initial_call=True
)
def gen_questions(n, child_id):
    if not child_id: return "Create/load a session first."
    if not client:   return "OpenAI key missing on server."
    artifacts = save_artifact(DB_PATH, child_id, kind=None, fetch_only=True)
    psych = [a["content"] for a in artifacts if a["kind"]=="psychometric"]
    context = "\n\n".join(psych[-3:])[:15000]
    prompt = build_question_prompt(context=context, gold_context="")
    resp = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[{"role":"system","content":"You are a neuro-affirmative paediatric nutrition consultant."},
                  {"role":"user","content":prompt}],
        temperature=0.2,
    )
    text = resp.choices[0].message.content
    questions = [q.strip("- • ") for q in text.strip().split("\n") if q.strip()][:15]
    save_questions(DB_PATH, child_id, questions)
    return "\n".join([f"**{i}. {q}**" for i,q in enumerate(questions,1)])

# -- save answers
@app.callback(
    Output("answers-status","children"),
    Input("btn-save-answers","n_clicks"), State("answers","value"), State("child-id","data"),
    prevent_initial_call=True
)
def save_ans(n, ans, child_id):
    if not child_id: return "Create/load a session first."
    save_answers(DB_PATH, child_id, {"raw": ans or ""})
    return "Answers saved."

# -- recommend tests
@app.callback(
    Output("tests-md","children"),
    Input("btn-tests","n_clicks"), State("child-id","data"), State("answers","value"),
    prevent_initial_call=True
)
def recommend_tests(n, child_id, answers):
    if not child_id: return "Create/load a session first."
    if not client:   return "OpenAI key missing on server."
    artifacts = save_artifact(DB_PATH, child_id, kind=None, fetch_only=True)
    psych_texts = [a["content"] for a in artifacts if a["kind"]=="psychometric"]
    context = "\n\n".join(psych_texts[-3:])[:8000]
    rule_based = recommend_tests_via_rules(context=context, answers=answers or "")
    prompt = build_test_prompt(context=context, answers=answers or "", rule_tests=rule_based)
    resp = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[{"role":"system","content":"You are a careful paediatric nutrition consultant. Only recommend from the approved list."},
                  {"role":"user","content":prompt}],
        temperature=0.1,
    )
    text = resp.choices[0].message.content
    save_recommendations(DB_PATH, child_id, {"tests_markdown": text, "rules": rule_based})
    return text

# -- uploads: labs
@app.callback(
    Output("lab-status","children"),
    Input("lab-upload","contents"), State("lab-upload","filename"), State("child-id","data"),
    prevent_initial_call=True
)
def ingest_labs(contents_list, names, child_id):
    if not child_id: return "Create/load a session first."
    if not contents_list: return dash.no_update
    for contents, name in zip(contents_list, names):
        text = _decode_upload(contents, name)
        save_artifact(DB_PATH, child_id, kind="lab_report", filename=name, content=text)
    return "Laboratory reports captured."

# -- plan
@app.callback(
    Output("download-plan","data"),
    Output("plan-preview","children"),
    Input("btn-plan","n_clicks"), State("child-id","data"), State("answers","value"),
    prevent_initial_call=True
)
def gen_plan(n, child_id, answers):
    if not child_id:
        return dash.no_update, "Create/load a session first."
    if not client:
        return dash.no_update, "OpenAI key missing on server."
    artifacts = save_artifact(DB_PATH, child_id, kind=None, fetch_only=True)
    psych_texts = [a["content"] for a in artifacts if a["kind"]=="psychometric"]
    lab_texts   = [a["content"] for a in artifacts if a["kind"]=="lab_report"]
    context = "\n\n".join(psych_texts[-3:])[:8000]
    labs    = "\n\n".join(lab_texts[-4:])[:10000]
    recs = get_recommendations(DB_PATH, child_id) or {}
    tests_md = recs.get("tests_markdown", "")
    prompt = build_plan_prompt(context=context, answers=answers or "", labs=labs, tests_markdown=tests_md)
    resp = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[{"role":"system","content":"You write concise, British English, neuro-affirmative care plans for Indian families."},
                  {"role":"user","content":prompt}],
        temperature=0.2,
    )
    plan_md = resp.choices[0].message.content
    save_plan(DB_PATH, child_id, {"markdown": plan_md})

    # PDF download with fallback to Markdown
    try:
        pdf = pdf_from_markdown(plan_md, title=f"Nutrition Plan — {get_child(DB_PATH, child_id).get('child_name','Child')}")
        def _writer(b):
            b.write(pdf)
        return dcc.send_bytes(_writer, "nutrition_plan.pdf"), plan_md
    except Exception:
        return dcc.send_string(plan_md, "nutrition_plan.md"), plan_md

if __name__ == "__main__":
    app.run_server(host="0.0.0.0", port=int(os.getenv("PORT", 8050)), debug=False)
