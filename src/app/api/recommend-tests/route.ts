export const dynamic = "force-dynamic"

import { NextResponse } from "next/server"
import OpenAI from "openai"
import { supabase } from "@/lib/supabase"
import * as pdfParse from "pdf-parse"
import mammoth from "mammoth"

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

    // Fetch the latest uploaded answer file or notes
    const { data: answers, error } = await supabase
      .from("answers")
      .select("*")
      .eq("session_id", sessionId)
      .order("uploaded_at", { ascending: false })
      .limit(1)

    if (error || !answers || answers.length === 0) {
      return NextResponse.json(
        { error: "No answers found for this session" },
        { status: 404 }
      )
    }

    const answer = answers[0]
    let answerText = ""

    // If user pasted notes directly
    if (answer.notes) {
      answerText = answer.notes
    }

    // If a file was uploaded, fetch and extract text
    if (!answerText && answer.file_url) {
      const { data: fileData, error: fileError } = await supabase.storage
        .from("answers")
        .download(answer.file_name)

      if (!fileError && fileData) {
        const buffer = await fileData.arrayBuffer()
        const uint8Array = new Uint8Array(buffer)

        if (answer.file_name.endsWith(".pdf")) {
          const pdf = await pdfParse(Buffer.from(uint8Array))
          answerText = pdf.text
        } else if (answer.file_name.endsWith(".docx")) {
          const result = await mammoth.extractRawText({ buffer: Buffer.from(uint8Array) })
          answerText = result.value
        } else if (answer.file_name.endsWith(".txt")) {
          answerText = Buffer.from(uint8Array).toString("utf-8")
        }
      }
    }

    if (!answerText) {
      return NextResponse.json(
        { error: "Could not extract text from answers" },
        { status: 500 }
      )
    }

    // Use OpenAI to recommend tests
    const prompt = `
You are a paediatric nutrition consultant.
You are reviewing consultation answers from parents about their child's health, diet, and medical history.

Extract the clinically relevant details and recommend appropriate **blood tests** that should be ordered, 
based on gold-standard paediatric nutrition practice.

Be specific and only suggest tests that are necessary. 
Provide reasoning for each test briefly.

Here are the consultation notes/answers:
${answerText}
    `

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
    })

    const tests =
      completion.choices[0].message?.content?.trim() || "No tests generated."

    return NextResponse.json({ tests })
  } catch (err: any) {
    console.error("Error recommending tests:", err)
    return NextResponse.json(
      { error: "Failed to recommend tests" },
      { status: 500 }
    )
  }
}
