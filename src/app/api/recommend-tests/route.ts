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
    const { data: fileData, error: fileError } = await supabase.storage
      .from("knowledge-bank")
      .download("knowledge_bank.txt")

    let knowledgeText = ""
    if (!fileError && fileData) {
      knowledgeText = await fileData.text()
    }

    // Fetch child/session details
    const { data: child, error: childError } = await supabase
      .from("children")
      .select("*")
      .eq("child_id", sessionId)
      .single()

    if (childError) {
      console.error("Child fetch error:", childError.message)
    }

    // Build the prompt
    const prompt = `
You are a professional paediatric nutrition consultant. 
Use the following knowledge base of gold-standard cases and past consultations to recommend evidence-based laboratory tests:

Knowledge Base:
${knowledgeText}

Child details:
Name: ${child?.child_name || "Unknown"}
DOB: ${child?.dob || "Unknown"}
Consultant: ${child?.consultant || "Unknown"}

Please recommend:
- Blood tests relevant for paediatric nutrition care
- Any additional screenings needed for developmental concerns
- Clear reasoning for each test
    `

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
    })

    const tests =
      completion.choices[0].message?.content?.trim() ||
      "No test recommendations generated."

    return NextResponse.json({ tests })
  } catch (err: any) {
    console.error("Error recommending tests:", err)
    return NextResponse.json(
      { error: "Failed to recommend tests" },
      { status: 500 }
    )
  }
}
