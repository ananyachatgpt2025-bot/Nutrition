"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { supabase } from "@/lib/supabase"
import FileUpload from "@/components/file-upload"

export default function ConsultationPage() {
  const params = useParams<{ sessionId: string }>()
  const [activeStep, setActiveStep] = useState<string>("Child Details")
  const [childData, setChildData] = useState<any>(null)

  // Fetch child/session data if needed
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

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-8">
      {/* Step navigation */}
      <div className="flex gap-4">
        {["Child Details", "Reports", "Tests", "Plan"].map((step) => (
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
      <div className="p-4 border rounded bg-white">
        {activeStep === "Child Details" && (
          <div>
            <h2 className="text-lg font-semibold mb-4">Child Details</h2>
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
              <p className="text-gray-500">Loading...</p>
            )}
          </div>
        )}

        {activeStep === "Reports" && (
          <div>
            <h2 className="text-lg font-semibold mb-4">Upload Reports</h2>
            <FileUpload sessionId={params.sessionId} />
          </div>
        )}

        {activeStep === "Tests" && (
          <div>
            <h2 className="text-lg font-semibold mb-4">Tests</h2>
            <p className="text-gray-500">
              Tests functionality will be implemented here.
            </p>
          </div>
        )}

        {activeStep === "Plan" && (
          <div>
            <h2 className="text-lg font-semibold mb-4">Plan</h2>
            <p className="text-gray-500">
              Plan generation will be implemented here.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
