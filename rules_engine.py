
import yaml
import re
from typing import Dict

with open("approved_tests.yaml", "r", encoding="utf-8") as f:
    APPROVED = yaml.safe_load(f)

# Very simple keyword mapping; expand over time.
SYMPTOM_MAP = {
    "constipation": ["Serum Ferritin", "Zinc", "Magnesium"],
    "diarrhoea": ["Electrolytes", "CRP"],
    "pica": ["Serum Ferritin", "CBC", "Lead (Blood)"] ,
    "sleep": ["Vitamin D 25‑OH", "Ferritin"],
    "hyperactivity": ["Ferritin", "Vitamin D 25‑OH", "TSH"],
    "poor appetite": ["CBC", "Iron Panel", "Zinc"],
    "overweight": ["HbA1c", "Lipid Profile"],
    "underweight": ["CBC", "CMP/LFT", "TSH"],
    "gi": ["tTG‑IgA (Coeliac)", "Total IgA"],
}

BASELINE = [
    "CBC", "Serum Ferritin", "Vitamin D 25‑OH", "Vitamin B12", "Folate",
    "Iron Panel", "TSH", "Zinc", "Magnesium", "CMP/LFT"
]

OPTIONAL = ["CRP", "HbA1c", "Lipid Profile", "tTG‑IgA (Coeliac)", "Total IgA", "Lead (Blood)"]


def recommend_tests_via_rules(context: str, answers: str) -> str:
    text = (context or "") + "\\n" + (answers or "")
    text_l = text.lower()
    picked = set(BASELINE)
    for k, tests in SYMPTOM_MAP.items():
        if k in text_l:
            for t in tests:
                picked.add(t)
    # Ensure approved only
    approved_flat = set(APPROVED.get("tests", []))
    picked = [t for t in picked if t in approved_flat]
    # Return as YAML to feed to the LLM prompt
    return yaml.safe_dump({"approved": sorted(list(approved_flat)), "rule_based": sorted(picked)}, sort_keys=False, allow_unicode=True)
