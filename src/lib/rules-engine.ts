import { APPROVED_TESTS, SYMPTOM_MAP, BASELINE_TESTS } from './approved-tests'

export function recommendTestsViaRules(context: string, answers: string): {
  approved: string[]
  ruleBased: string[]
} {
  const text = ((context || "") + "\n" + (answers || "")).toLowerCase()
  const picked = new Set(BASELINE_TESTS)
  
  for (const [symptom, tests] of Object.entries(SYMPTOM_MAP)) {
    if (text.includes(symptom)) {
      tests.forEach(test => picked.add(test))
    }
  }
  
  // Ensure only approved tests
  const approvedSet = new Set(APPROVED_TESTS)
  const filteredPicked = Array.from(picked).filter(test => approvedSet.has(test))
  
  return {
    approved: APPROVED_TESTS.sort(),
    ruleBased: filteredPicked.sort()
  }
}