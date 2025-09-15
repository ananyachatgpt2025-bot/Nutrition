import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import { buildPlanPrompt } from '@/lib/prompts'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export async function POST(request: NextRequest) {
  try {
    const { context, answers, labs, testsMarkdown } = await request.json()

    if (!context) {
      return NextResponse.json(
        { error: 'Context is required' },
        { status: 400 }
      )
    }

    const prompt = buildPlanPrompt(
      context,
      answers || '',
      labs || '',
      testsMarkdown || ''
    )

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You write concise, British English, neuro-affirmative care plans for Indian families.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.2,
    })

    const planMarkdown = response.choices[0].message.content || ''

    return NextResponse.json({ planMarkdown })
  } catch (error) {
    console.error('Error generating plan:', error)
    return NextResponse.json(
      { error: 'Failed to generate plan' },
      { status: 500 }
    )
  }
}