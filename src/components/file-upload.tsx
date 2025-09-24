"use client"

import { useState } from "react"
import { supabase } from "@/lib/supabase"

interface FileUploadProps {
  sessionId: string
}

export default function FileUpload({ sessionId }: FileUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [fileUrl, setFileUrl] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  async function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    try {
      const file = event.target.files?.[0]
      if (!file) return
      setUploading(true)
      setErrorMessage(null)

      // Upload to Supabase Storage → bucket "reports"
      const { data, error } = await supabase.storage
        .from("reports")
        .upload(`${sessionId}/${file.name}`, file, {
          cacheControl: "3600",
          upsert: true,
        })

      if (error) throw error

      // Get a public URL so we can reference the uploaded file later
      const { data: publicData } = supabase.storage
        .from("reports")
        .getPublicUrl(`${sessionId}/${file.name}`)

      setFileUrl(publicData.publicUrl)
    } catch (err: any) {
      console.error("U
