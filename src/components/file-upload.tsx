"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"

interface FileRecord {
  id: string
  file_name: string
  file_url: string
  uploaded_at: string
}

export default function FileUpload({ sessionId }: { sessionId: string }) {
  const [uploading, setUploading] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [uploadedFiles, setUploadedFiles] = useState<FileRecord[]>([])

  // ✅ Fetch existing files when component mounts
  useEffect(() => {
    const fetchFiles = async () => {
      const { data, error } = await supabase
        .from("reports")
        .select("*")
        .eq("session_id", sessionId)
        .order("uploaded_at", { ascending: false })

      if (error) {
        console.error("Fetch error:", error.message)
        setErrorMessage("Failed to fetch uploaded reports.")
      } else {
        setUploadedFiles(data || [])
      }
    }

    fetchFiles()
  }, [sessionId])

  // ✅ Handle file upload
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setErrorMessage(null)
      setUploading(true)

      if (!event.target.files || event.target.files.length === 0) {
        throw new Error("No file selected")
      }

      const file = event.target.files[0]
      const filePath = `${sessionId}/${Date.now()}-${file.name}`

      // Upload to Supabase storage bucket: "reports"
      const { error: uploadError } = await supabase.storage
        .from("reports")
        .upload(filePath, file)

      if (uploadError) throw uploadError

      const publicUrl = supabase.storage
        .from("reports")
        .getPublicUrl(filePath).data.publicUrl

      // Insert metadata into reports table
      const { data, error: insertError } = await supabase
        .from("reports")
        .insert([
          {
            session_id: sessionId,  // ✅ required field
            file_name: file.name,
            file_url: publicUrl,
          },
        ])
        .select()
        .single()

      if (insertError) throw insertError

      // Update local state
      if (data) {
        setUploadedFiles((prev) => [data, ...prev])
      }
    } catch (error: any) {
      console.error("Upload error:", error.message)
      setErrorMessage(error.message)
    } finally {
      setUploading(false)
    }
  }

  return (
    <div>
      <label className="block font-medium mb-2">Upload Reports</label>
      <input type="file" onChange={handleFileUpload} disabled={uploading} />

      {errorMessage && <p className="text-red-500 mt-2">{errorMessage}</p>}

      <h3 className="mt-6 font-semibold">Uploaded Reports</h3>
      {uploadedFiles.length === 0 ? (
        <p className="text-gray-500">No reports uploaded yet.</p>
      ) : (
        <ul className="mt-2 list-disc pl-5 space-y-1">
          {uploadedFiles.map((f) => (
            <li key={f.id}>
              <a
                href={f.file_url}
                target="_blank"
                rel="noreferrer"
                className="text-blue-600 underline"
              >
                {f.file_name}
              </a>{" "}
              <span className="text-gray-400 text-sm">
                ({new Date(f.uploaded_at).toLocaleString()})
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
