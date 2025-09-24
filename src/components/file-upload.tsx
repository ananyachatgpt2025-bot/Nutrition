"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"

interface FileUploadProps {
  sessionId: string
}

interface Report {
  id: string
  file_name: string
  file_url: string
  uploaded_at: string
}

export default function FileUpload({ sessionId }: FileUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [reports, setReports] = useState<Report[]>([])

  // Fetch existing reports for this session
  useEffect(() => {
    async function fetchReports() {
      const { data, error } = await supabase
        .from("reports")
        .select("*")
        .eq("session_id", sessionId)
        .order("uploaded_at", { ascending: false })

      if (!error && data) {
        setReports(data as Report[])
      }
    }
    fetchReports()
  }, [sessionId])

  async function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    try {
      const file = event.target.files?.[0]
      if (!file) return
      setUploading(true)
      setErrorMessage(null)

      // Upload to Supabase Storage (bucket "reports")
      const { error: uploadError } = await supabase.storage
        .from("reports")
        .upload(`${sessionId}/${file.name}`, file, {
          cacheControl: "3600",
          upsert: true,
        })

      if (uploadError) throw uploadError

      // Get public URL
      const { data: publicData } = supabase.storage
        .from("reports")
        .getPublicUrl(`${sessionId}/${file.name}`)

      const publicUrl = publicData.publicUrl

      // Save metadata into DB
      const { data, error: insertError } = await supabase
        .from("reports")
        .insert([
          {
            session_id: sessionId,
            file_name: file.name,
            file_url: publicUrl,
          },
        ])
        .select()

      if (insertError) throw insertError

      // Update UI
      if (data) {
        setReports((prev) => [data[0] as Report, ...prev])
      }
    } catch (err: any) {
      console.error("Upload failed:", err)
      setErrorMessage(err.message || "Upload failed")
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="flex flex-col gap-6 w-full">
      {/* Upload box */}
      <div className="flex flex-col items-center gap-4 border p-6 rounded-lg bg-gray-50">
        <input
          type="file"
          accept=".pdf,.doc,.docx"
          onChange={handleFileChange}
          disabled={uploading}
          className="block w-full text-sm text-gray-900 border border-gray-300 rounded-lg cursor-pointer bg-white focus:outline-none"
        />
        {uploading && <p className="text-blue-600">Uploading...</p>}
        {errorMessage && <p className="text-red-600">{errorMessage}</p>}
      </div>

      {/* Uploaded reports list */}
      <div>
        <h3 className="font-semibold mb-2">Uploaded Reports</h3>
        {reports.length === 0 ? (
          <p className="text-gray-500">No reports uploaded yet.</p>
        ) : (
          <ul className="list-disc pl-6 space-y-2">
            {reports.map((report) => (
              <li key={report.id}>
                <a
                  href={report.file_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 underline"
                >
                  {report.file_name}
                </a>{" "}
                <span className="text-sm text-gray-500">
                  ({new Date(report.uploaded_at).toLocaleString()})
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
