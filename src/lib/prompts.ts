const SYSTEM_BRITISH = "British English. Neuro‑affirmative. Avoid pathologising language. Be concise and clear."

export function buildQuestionPrompt(context: string, goldContext: string = ""): string {
  return `
${SYSTEM_BRITISH}
You are preparing for a paediatric nutrition consultation for a child with developmental needs (including autism/ADHD). 
Given the psychometric summary (and, if helpful, similar gold‑standard cases), generate 10–15 clarifying questions for parents. 
Keep questions specific, non‑judgemental, and easy to answer. Focus on:
- Current diet & feeding patterns (textures, preferences, routines)
- GI symptoms (constipation/diarrhoea, reflux, bloating)
- Sleep, energy, attention regulation
- Growth concerns (height/weight trajectory, appetite changes)
- Micronutrient risk factors (iron, B12, vitamin D, folate, zinc, magnesium)
- Medication/supplement history (include ADHD meds)
- Cultural/Indian food context & feasibility

Psychometric summary:

${context}

Similar gold‑standard excerpts:

${goldContext}

Output: a numbered list (10–15) in British English.
`
}

export function buildTestPrompt(context: string, answers: string, ruleTests: string): string {
  return `
${SYSTEM_BRITISH}
Recommend blood/biochemical tests strictly from the approved list below. Use the parent answers and psychometric context. 
Group tests by priority:
- Tier 1: Baseline for most children
- Tier 2: Based on symptoms/risks
- Tier 3: Consider if flagged by history or prior labs

Approved list (do not invent new tests):
${ruleTests}

Psychometric summary:
${context}

Parent answers:
${answers}

Output: Markdown with bullet lists, each test with a one‑line rationale in plain language.
`
}

export function buildPlanPrompt(context: string, answers: string, labs: string, testsMarkdown: string): string {
  return `
${SYSTEM_BRITISH}
Create a concise care plan for a child in India. Use culturally relevant foods. Keep it practical for families. 
Sections required:
1) Snapshot (what we know in one paragraph)
2) Food plan (typical Indian staples; textures, routines; 1‑week sample)
3) Micronutrient focus (iron, vitamin D, B12, folate, zinc, magnesium): foods + simple swaps
4) Supplement plan (only if indicated by labs/history). Specify dose ranges by weight band, timing with meals, and safety notes. Avoid brand names.
5) Sleep & GI hygiene (simple habits)
6) Follow‑up markers (what to monitor; when to repeat labs)
7) Plain‑English parent handover (bullet points)

Psychometric summary:
${context}

Parent answers:
${answers}

Key lab excerpts (raw OCR allowed):
${labs}

Tests requested earlier:
${testsMarkdown}

Constraints:
- British English; neuro‑affirmative; non‑judgemental.
- Short sentences. No medical jargon unless explained in brackets.
- Include a clear safety disclaimer: the plan supports clinical decision‑making and should be reviewed by the child's clinician.
`
}