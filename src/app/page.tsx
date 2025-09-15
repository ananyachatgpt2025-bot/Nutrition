'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Brain, Users, FileText, TestTube, Utensils, Shield, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { supabase } from '@/lib/supabase'
import { simpleHash } from '@/lib/utils'

interface Session {
  child_id: string
  child_name: string
  created_at: string
}

export default function HomePage() {
  const router = useRouter()
  const [childName, setChildName] = useState('')
  const [childDob, setChildDob] = useState('')
  const [consultant, setConsultant] = useState('')
  const [existingSessions, setExistingSessions] = useState<Session[]>([])
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    loadExistingSessions()
  }, [])

  const loadExistingSessions = async () => {
    try {
      const { data, error } = await supabase
        .from('children')
        .select('child_id, child_name, created_at')
        .order('created_at', { ascending: false })
        .limit(5)

      if (error) throw error
      setExistingSessions(data || [])
    } catch (error) {
      console.error('Error loading sessions:', error)
    }
  }

  const createNewSession = async () => {
    if (!childName.trim()) return

    setIsLoading(true)
    try {
      const sessionId = simpleHash(`${childName}|${childDob}|${consultant}|${new Date().toISOString()}`)
      
      const { error } = await supabase
        .from('children')
        .upsert({
          child_id: sessionId,
          child_name: childName.trim(),
          dob: childDob || new Date().toISOString().split('T')[0],
          consultant: consultant.trim() || 'Unknown',
          created_at: new Date().toISOString()
        })

      if (error) throw error

      router.push(`/consultation/${sessionId}`)
    } catch (error) {
      console.error('Error creating session:', error)
      alert('Failed to create session. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const loadExistingSession = (sessionId: string) => {
    router.push(`/consultation/${sessionId}`)
  }

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-[#0E7C86] rounded-lg">
              <Brain className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Neuro-Nutrition Consultant</h1>
              <p className="text-sm text-slate-600">Professional paediatric nutrition consultation platform</p>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid lg:grid-cols-2 gap-12 items-start">
          {/* Left Column - Features */}
          <div className="space-y-8">
            <div>
              <h2 className="text-3xl font-bold text-slate-900 mb-4">
                Evidence-based nutrition care for children with developmental needs
              </h2>
              <p className="text-lg text-slate-600 mb-6">
                Streamlined workflow for paediatric nutrition consultations with neuro-affirmative approach, 
                designed for British healthcare standards and Indian cultural context.
              </p>
            </div>

            <div className="grid gap-4">
              {[
                {
                  icon: FileText,
                  title: "Psychometric Analysis",
                  description: "Upload and analyse assessment reports with AI-powered insights"
                },
                {
                  icon: Users,
                  title: "Parent Consultation",
                  description: "Generate targeted questions and collect structured responses"
                },
                {
                  icon: TestTube,
                  title: "Evidence-based Testing",
                  description: "Recommend blood tests from approved clinical guidelines"
                },
                {
                  icon: Utensils,
                  title: "Nutrition Planning",
                  description: "Create culturally appropriate diet and supplement plans"
                },
                {
                  icon: Shield,
                  title: "Clinical Safety",
                  description: "Built-in safeguards and clinician review requirements"
                }
              ].map((feature, index) => (
                <div key={index} className="flex items-start space-x-4 p-4 rounded-lg hover:bg-white/50 transition-colors">
                  <div className="p-2 bg-[#0E7C86]/10 rounded-lg">
                    <feature.icon className="h-5 w-5 text-[#0E7C86]" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900">{feature.title}</h3>
                    <p className="text-sm text-slate-600">{feature.description}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
              <p className="text-sm text-amber-800">
                <strong>Clinical Note:</strong> This platform provides decision support only. 
                All recommendations require clinician review before implementation.
              </p>
            </div>
          </div>

          {/* Right Column - Session Management */}
          <div className="space-y-6">
            {/* New Session */}
            <Card>
              <CardHeader>
                <CardTitle className="text-xl">Start New Consultation</CardTitle>
                <CardDescription>
                  Create a new session for a child consultation
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Child's Name *
                  </label>
                  <Input
                    placeholder="e.g., Aadhya Sharma"
                    value={childName}
                    onChange={(e) => setChildName(e.target.value)}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Date of Birth
                  </label>
                  <Input
                    type="date"
                    value={childDob}
                    onChange={(e) => setChildDob(e.target.value)}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Consultant Name
                  </label>
                  <Input
                    placeholder="Your name"
                    value={consultant}
                    onChange={(e) => setConsultant(e.target.value)}
                  />
                </div>
                
                <Button 
                  onClick={createNewSession}
                  disabled={!childName.trim() || isLoading}
                  className="w-full"
                >
                  {isLoading ? 'Creating Session...' : 'Start Consultation'}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </CardContent>
            </Card>

            {/* Existing Sessions */}
            {existingSessions.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-xl">Recent Sessions</CardTitle>
                  <CardDescription>
                    Continue with an existing consultation
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {existingSessions.map((session) => (
                      <div
                        key={session.child_id}
                        className="flex items-center justify-between p-3 border border-slate-200 rounded-lg hover:bg-slate-50 cursor-pointer transition-colors"
                        onClick={() => loadExistingSession(session.child_id)}
                      >
                        <div>
                          <p className="font-medium text-slate-900">{session.child_name}</p>
                          <p className="text-sm text-slate-500">
                            {new Date(session.created_at).toLocaleDateString('en-GB')}
                          </p>
                        </div>
                        <ArrowRight className="h-4 w-4 text-slate-400" />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}