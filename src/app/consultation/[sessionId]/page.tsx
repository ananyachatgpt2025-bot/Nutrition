"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { supabase } from "@/lib/supabase"
import FileUpload from "@/components/file-upload"

export default function ConsultationPage() {
  const params = useParams<{ sessionId: string }>()
  const [activeStep, setActiveStep] = useState<string>("Session")
  const [childData, setChildData] = useState<any>(null)

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
                  <strong>Consultant:</strong> {ch
