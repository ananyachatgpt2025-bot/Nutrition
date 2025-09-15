import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import { buildQuestionPrompt } from '@/lib/prompts'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export async function POST(request: NextRequest) {
  try {
    const { context, goldContext = '' } = await request.json()

    if (!context) {
      return NextResponse.json(
        { error: 'Context is required' },
        { status: 400 }
      )
    }

    const prompt = buildQuestionPrompt(context, goldContext)

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are a neuro-affirmative paediatric nutrition consultant.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.2,
    })

    const text = response.choices[0].message.content || ''
    const questions = text
      .split('\n')
      .map(q => q.trim().replace(/^[\d\.\-\•\*\s]+/, ''))
      .filter(q => q.length > 0)
      .slice(0, 15)

    return NextResponse.json({ questions })
  } catch (error) {
    console.error('Error generating questions:', error)
    return NextResponse.json(
      { error: 'Failed to generate questions' },
      { status: 500 }
    )
  }
}