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

    // Fetch knowledge bank file from Supabase storage
    let knowledgeText = ""
    const { data: fileData } = await supabase.storage
      .from("knowledge-bank")
      .download("knowledge_bank.txt")

    if (fileData) {
      knowledgeText = await fileData.text()
    }

    // Fetch child/session details
    const { data: child } = await supabase
      .from("children")
      .select("*")
      .eq("child_id", sessionId)
      .single()

    // Build the prompt (clean)
    const prompt = `
You are a professional nutrition consultant. Use the following knowledge base of gold-standard cases and past consultations to guide your question generation.

Knowledge Base:
${knowledgeText || "No knowledge base available."}

Child details:
Name: ${child?.child_name || "Unknown"}
DOB: ${child?.dob || "Unknown"}
Consultant: ${child?.consultant || "Unknown"}

Generate as many detailed consultation questions as are clinically necessary for this child, based on their age, dietary needs, and context. Do not limit the number of questions. Avoid filler text, only return the questions as a numbered or bulleted list.
`

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
    })

    const questionsText =
      completion.choices[0].message?.content?.trim() || ""
    const questions = questionsText
      .split("\n")
      .map((q) => q.replace(/^\d+[\).\s-]?\s*/, "").trim()) // clean numbers/bullets
      .filter((q) => q.length > 0)

    return NextResponse.json({ questions })
  } catch (err: any) {
    console.error("Error generating questions:", err)
    return NextResponse.json(
      { error: "Failed to generate questions" },
      { status: 500 }
    )
  }
}
