export const APPROVED_TESTS = [
  "CBC",
  "Serum Ferritin",
  "Iron Panel",
  "Vitamin D 25‑OH",
  "Vitamin B12",
  "Folate",
  "TSH",
  "Zinc",
  "Magnesium",
  "CMP/LFT",
  "CRP",
  "HbA1c",
  "Lipid Profile",
  "tTG‑IgA (Coeliac)",
  "Total IgA",
  "Lead (Blood)"
]

export const SYMPTOM_MAP: Record<string, string[]> = {
  "constipation": ["Serum Ferritin", "Zinc", "Magnesium"],
  "diarrhoea": ["Electrolytes", "CRP"],
  "pica": ["Serum Ferritin", "CBC", "Lead (Blood)"],
  "sleep": ["Vitamin D 25‑OH", "Ferritin"],
  "hyperactivity": ["Ferritin", "Vitamin D 25‑OH", "TSH"],
  "poor appetite": ["CBC", "Iron Panel", "Zinc"],
  "overweight": ["HbA1c", "Lipid Profile"],
  "underweight": ["CBC", "CMP/LFT", "TSH"],
  "gi": ["tTG‑IgA (Coeliac)", "Total IgA"],
}

export const BASELINE_TESTS = [
  "CBC", "Serum Ferritin", "Vitamin D 25‑OH", "Vitamin B12", "Folate",
  "Iron Panel", "TSH", "Zinc", "Magnesium", "CMP/LFT"
]

export const OPTIONAL_TESTS = [
  "CRP", "HbA1c", "Lipid Profile", "tTG‑IgA (Coeliac)", "Total IgA", "Lead (Blood)"
]