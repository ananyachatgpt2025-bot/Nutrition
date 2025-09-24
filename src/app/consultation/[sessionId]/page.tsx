"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { supabase } from "@/lib/supabase"
import FileUpload from "@/components/file-upload"

export default function ConsultationPage() {
  const params = useParams<{ sessionId: string }>()
  const [activeStep, setActiveStep] = useState<string>("Session")
  const [childData, setChildData] = useState<any>(null)
  const [generatedQuestions, setGeneratedQuestions] = useState<string[]>([])
  const [loadingQuestions, setLoadingQuestions] = useState(false)

  // Fetch child/session data
  useEffect(() => {
    async function fetchChild() {
      const { data, error } = await supabase
        .from("children")
        .select("*")
        .eq("child_id", params.sessionId)
        .single()

      if (!error) {
        setChildData(data)
      }
    }
    fetchChild()
  }, [params.sessionId])

  const steps = [
    "Session",
    "Reports",
    "Questions",
    "Answers",
    "Tests",
    "Labs",
    "Plan",
  ]

  async function handleGenerateQuestions() {
    try {
      setLoadingQuestions(true)
      const res = await fetch(`/api/generate-questions?sessionId=${params.sessionId}`)
      if (!res.ok) throw new Error("Failed to generate questions")
      const data = await res.json()
      setGeneratedQuestions(data.questions || [])
    } catch (err) {
      console.error(err)
    } finally {
      setLoadingQuestions(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      {/* Step navigation */}
      <div className="flex gap-2 flex-wrap">
        {steps.map((step) => (
          <button
            key={step}
            className={`px-4 py-2 rounded ${
              activeStep === step ? "bg-blue-600 text-white" : "bg-gray-200"
            }`}
            onClick={() => setActiveStep(step)}
          >
            {step}
          </button>
        ))}
      </div>

      {/* Step content */}
      <div className="p-6 border rounded bg-white shadow">
        {activeStep === "Session" && (
          <div>
            <h2 className="text-lg font-semibold mb-4">Session Details</h2>
            {childData ? (
              <ul className="space-y-2">
                <li>
                  <strong>Name:</strong> {childData.child_name}
                </li>
                <li>
                  <strong>DOB:</strong>{" "}
                  {new Date(childData.dob).toLocaleDateString()}
                </li>
                <li>
                  <strong>Consultant:</strong> {childData.consultant}
                </li>
              </ul>
            ) : (
              <p className="text-gray-500">Loading session info...</p>
            )}
          </div>
        )}

        {activeStep === "Reports" && (
          <div>
            <h2 className="text-lg font-semibold mb-4">Upload Reports</h2>
            <FileUpload sessionId={params.sessionId} />
          </div>
        )}

        {activeStep === "Questions" && (
          <div>
            <h2 className="text-lg font-semibold mb-4">Generated Questions</h2>
            <button
              onClick={handleGenerateQuestions}
              disabled={loadingQuestions}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
            >
              {loadingQuestions ? "Generating..." : "Generate Questions"}
            </button>

            <div className="mt-4 space-y-2">
              {generatedQuestions?.length > 0 ? (
                <ul className="list-disc pl-6 space-y-2">
                  {generatedQuestions.map((q: string, idx: number) => (
                    <li key={idx}>{q}</li>
                  ))}
                </ul>
              ) : (
                <p className="text-gray-500">No questions yet. Click the button above.</p>
              )}
            </div>
          </div>
        )}

        {activeStep === "Answers" && (
          <div>
            <h2 className="text-lg font-semibold mb-4">Answers</h2>
            <p className="text-gray-500">
              Answer input and storage will appear here.
            </p>
          </div>
        )}

        {activeStep === "Tests" && (
          <div>
            <h2 className="text-lg font-semibold mb-4">Tests</h2>
            <p className="text-gray-500">
              Test recommendations will be shown here.
            </p>
          </div>
        )}

        {activeStep === "Labs" && (
          <div>
            <h2 className="text-lg font-semibold mb-4">Labs</h2>
            <p className="text-gray-500">
              Lab integrations will be implemented here.
            </p>
          </div>
        )}

        {activeStep === "Plan" && (
          <div>
            <h2 className="text-lg font-semibold mb-4">Plan</h2>
            <p className="text-gray-500">
              Nutrition plan generation will be shown here.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
