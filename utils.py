
import hashlib
import tempfile, os
import docx2txt
from PyPDF2 import PdfReader
from fpdf import FPDF



def simple_hash(s: str) -> str:
    return hashlib.sha256(s.encode("utf-8")).hexdigest()


def parse_document_text(uploaded_file) -> str:
    name = uploaded_file.name.lower()
    if name.endswith(".docx"):
        # docx2txt needs a file path; write the upload to a temp file
        with tempfile.NamedTemporaryFile(suffix=".docx", delete=False) as tmp:
            tmp.write(uploaded_file.getbuffer())
            tmp.flush()
            tmp_path = tmp.name
        try:
            return docx2txt.process(tmp_path) or ""
        finally:
            try:
                os.unlink(tmp_path)
            except Exception:
                pass
    elif name.endswith(".pdf"):
        reader = PdfReader(uploaded_file)
        parts = []
        for page in reader.pages:
            parts.append(page.extract_text() or "")
        return "\n".join(parts)
    else:
        return uploaded_file.read().decode("utf-8", errors="ignore")



class PDF(FPDF):
    def header(self):
        self.set_font("Helvetica", "B", 12)
        self.cell(0, 10, self.title, ln=1, align="C")
        self.ln(2)


def pdf_from_markdown(md: str, title: str="Document") -> bytes:
    # extremely simple: render as text paragraphs (for prototype)
    pdf = PDF()
    pdf.set_title(title)
    pdf.add_page()
    pdf.set_auto_page_break(auto=True, margin=15)
    pdf.set_font("Helvetica", size=11)
    for line in md.split("\n"):
        if line.strip().startswith("#"):
            pdf.set_font("Helvetica", "B", 12)
            pdf.multi_cell(0, 6, line.lstrip("# "))
            pdf.set_font("Helvetica", size=11)
        else:
            pdf.multi_cell(0, 6, line)
    return bytes(pdf.output(dest='S').encode('latin-1'))
