"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"

export default function HomePage() {
  const router = useRouter()
  const [childName, setChildName] = useState("")
  const [dob, setDob] = useState("")
  const [consultant, setConsultant] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleCreateSession() {
    try {
      setLoading(true)
      setError(null)

      if (!childName || !dob || !consultant) {
        throw new Error("Please fill in all fields")
      }

      // Generate session ID
      const sessionId = crypto.randomUUID()

      // Insert into Supabase
      const { error: insertError } = await supabase.from("children").insert([
        {
          child_id: sessionId,
          child_name: childName,
          dob: dob,
          consultant: consultant,
        },
      ])

      if (insertError) throw insertError

      // Navigate to the consultation page
      router.push(`/consultation/${sessionId}`)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-3xl mx-auto p-8 space-y-8">
      <div>
        <h1 className="text-2xl font-bold mb-2">
          Neuro-Nutrition Consultant
        </h1>
        <p className="text-gray-600">
          Professional paediatric nutrition consultation platform.
        </p>
      </div>

      <div className="p-6 border rounded bg-white shadow">
        <h2 className="text-lg font-semibold mb-4">Start New Consultation</h2>

        <div className="space-y-4">
          <input
            type="text"
            placeholder="Child's Name"
            value={childName}
            onChange={(e) => setChildName(e.target.value)}
            className="w-full border rounded p-2"
          />

          <input
            type="date"
            placeholder="Date of Birth"
            value={dob}
            onChange={(e) => setDob(e.target.value)}
            className="w-full border rounded p-2"
          />

          <input
            type="text"
            placeholder="Consultant Name"
            value={consultant}
            onChange={(e) => setConsultant(e.target.value)}
            className="w-full border rounded p-2"
          />

          <button
            onClick={handleCreateSession}
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? "Creating Session..." : "Create Session"}
          </button>

          {error && <p className="text-red-500">{error}</p>}
        </div>
      </div>
    </div>
  )
}
