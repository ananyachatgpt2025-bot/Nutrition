export const dynamic = "force-dynamic"

import { NextResponse } from "next/server"
import OpenAI from "openai"
import { supabase } from "@/lib/supabase"

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const sessionId = searchParams.get("sessionId")

    if (!sessionId) {
      return NextResponse.json({ error: "Missing sessionId" }, { status: 400 })
    }

    // Fetch answers from Supabase
    const { data: answers, error: answersError } = await supabase
      .from("answers")
      .select("*")
      .eq("session_id", sessionId)
      .order("uploaded_at", { ascending: false })

    if (answersError) throw answersError

    let combinedNotes = ""
    if (answers?.length) {
      for (const ans of answers) {
        if (ans.notes) {
          combinedNotes += `\n\nText Notes:\n${ans.notes}`
        } else if (ans.file_url) {
          combinedNotes += `\n\nUploaded file: ${ans.file_url}`
        }
      }
    }

    // Build prompt
    const prompt = `
You are a paediatric nutrition consultant.
Based on the consultation answers and meeting notes below, identify **all clinically relevant blood tests** 
that should be recommended for nutritional and developmental assessment.

Answers/Notes:
${combinedNotes}

Return the recommendations as a clear bullet-point list of tests with short explanations.
`

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
    })

    const text = completion.choices[0].message?.content?.trim() || ""
    return NextResponse.json({ recommendations: text })
  } catch (err: any) {
    console.error("Error recommending tests:", err)
    return NextResponse.json(
      { error: "Failed to recommend tests" },
      { status: 500 }
    )
  }
}
