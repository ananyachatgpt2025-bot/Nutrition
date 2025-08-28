
# Neuro‑Nutrition Consultant (Prototype)

Minimal Streamlit app that:
- Ingests psychometric PDFs/DOCX
- Generates 10–15 parent questions (British English, neuro‑affirmative)
- Records answers
- Recommends blood tests (restricted to approved list; rule‑assisted + LLM)
- Ingests lab PDFs
- Generates a concise diet & supplement plan and exports a PDF
- Keeps separate sessions per child (SQLite)
- (NEW) Connects Google Drive to build a **gold-cases index** with FAISS and retrieve similar cases

## Run
1. `python -m venv .venv && source .venv/bin/activate` (or Windows)
2. `pip install -r requirements.txt`
3. Copy `.env.example` → `.env` and set:
   - `OPENAI_API_KEY=...`
   - `GDRIVE_FOLDER_ID=...` (your cases folder, optional)
   - Optionally: `GDRIVE_USE_OAUTH=1` for local OAuth, or default Service Account auth
4. (Drive retrieval optional) If you later add a full `drive_sync.py`, build the gold-cases index once, then run:
   - `streamlit run app.py`

## Clinical Notes
- Decision-support only. Keep supplementation behind clinician review.
- All blood tests must exist in `approved_tests.yaml` to be recommended.
