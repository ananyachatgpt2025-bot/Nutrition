import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import { buildTestPrompt } from '@/lib/prompts'
import { recommendTestsViaRules } from '@/lib/rules-engine'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export async function POST(request: NextRequest) {
  try {
    const { context, answers } = await request.json()

    if (!context) {
      return NextResponse.json(
        { error: 'Context is required' },
        { status: 400 }
      )
    }

    // Get rule-based recommendations
    const ruleBasedTests = recommendTestsViaRules(context, answers || '')
    const ruleTestsYaml = `approved: ${JSON.stringify(ruleBasedTests.approved)}\nrule_based: ${JSON.stringify(ruleBasedTests.ruleBased)}`

    const prompt = buildTestPrompt(context, answers || '', ruleTestsYaml)

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are a careful paediatric nutrition consultant. Only recommend from the approved list.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.1,
    })

    const testsMarkdown = response.choices[0].message.content || ''

    return NextResponse.json({ 
      testsMarkdown,
      ruleBasedTests: ruleBasedTests.ruleBased
    })
  } catch (error) {
    console.error('Error recommending tests:', error)
    return NextResponse.json(
      { error: 'Failed to recommend tests' },
      { status: 500 }
    )
  }
}