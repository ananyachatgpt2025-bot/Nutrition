'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { ArrowLeft, Brain } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { WorkflowProgress } from '@/components/workflow-progress'
import { supabase } from '@/lib/supabase'
import { formatDateTime } from '@/lib/utils'

interface Child {
  child_id: string
  child_name: string
  dob: string
  consultant: string
  created_at: string
}

const WORKFLOW_STEPS = [
  'Session',
  'Reports',
  'Questions',
  'Answers',
  'Tests',
  'Labs',
  'Plan'
]

export default function ConsultationPage() {
  const params = useParams()
  const sessionId = params.sessionId as string
  const [child, setChild] = useState<Child | null>(null)
  const [currentStep, setCurrentStep] = useState(1)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (sessionId) {
      loadSession()
    }
  }, [sessionId])

  const loadSession = async () => {
    try {
      const { data, error } = await supabase
        .from('children')
        .select('*')
        .eq('child_id', sessionId)
        .single()

      if (error) throw error
      setChild(data)
    } catch (error) {
      console.error('Error loading session:', error)
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0E7C86] mx-auto mb-4"></div>
          <p className="text-slate-600">Loading consultation session...</p>
        </div>
      </div>
    )
  }

  if (!child) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle className="text-red-600">Session Not Found</CardTitle>
            <CardDescription>
              The consultation session could not be found.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/">
              <Button variant="outline" className="w-full">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Return to Home
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link href="/">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to Home
                </Button>
              </Link>
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-[#0E7C86] rounded-lg">
                  <Brain className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-slate-900">
                    Consultation: {child.child_name}
                  </h1>
                  <p className="text-sm text-slate-600">
                    Session ID: {child.child_id.substring(0, 8)} • 
                    Created: {formatDateTime(child.created_at)} • 
                    Consultant: {child.consultant}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Progress Indicator */}
        <WorkflowProgress currentStep={currentStep} steps={WORKFLOW_STEPS} />

        {/* Main Content */}
        <div className="max-w-4xl mx-auto">
          {currentStep === 1 && (
            <Card>
              <CardHeader>
                <CardTitle>Session Overview</CardTitle>
                <CardDescription>
                  Review session details and begin the consultation workflow
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="font-semibold text-slate-900 mb-2">Child Information</h3>
                    <div className="space-y-2 text-sm">
                      <p><span className="font-medium">Name:</span> {child.child_name}</p>
                      <p><span className="font-medium">Date of Birth:</span> {child.dob}</p>
                      <p><span className="font-medium">Age:</span> {
                        Math.floor((new Date().getTime() - new Date(child.dob).getTime()) / (1000 * 60 * 60 * 24 * 365.25))
                      } years</p>
                    </div>
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900 mb-2">Session Details</h3>
                    <div className="space-y-2 text-sm">
                      <p><span className="font-medium">Consultant:</span> {child.consultant}</p>
                      <p><span className="font-medium">Created:</span> {formatDateTime(child.created_at)}</p>
                      <p><span className="font-medium">Session ID:</span> {child.child_id.substring(0, 16)}...</p>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <h4 className="font-semibold text-blue-900 mb-2">Consultation Workflow</h4>
                  <ol className="text-sm text-blue-800 space-y-1">
                    <li>1. Upload psychometric assessment reports</li>
                    <li>2. Generate and review parent consultation questions</li>
                    <li>3. Record parent responses during consultation</li>
                    <li>4. Receive evidence-based blood test recommendations</li>
                    <li>5. Upload laboratory reports when available</li>
                    <li>6. Generate comprehensive nutrition plan</li>
                    <li>7. Export final recommendations as PDF</li>
                  </ol>
                </div>

                <div className="flex justify-end">
                  <Button onClick={() => setCurrentStep(2)}>
                    Begin Consultation
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {currentStep === 2 && (
            <Card>
              <CardHeader>
                <CardTitle>Upload Psychometric Reports</CardTitle>
                <CardDescription>
                  Upload assessment reports (PDF/DOCX) to begin the consultation process
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12">
                  <p className="text-slate-500 mb-4">File upload functionality will be implemented here</p>
                  <div className="flex space-x-4 justify-center">
                    <Button variant="outline" onClick={() => setCurrentStep(1)}>
                      Previous
                    </Button>
                    <Button onClick={() => setCurrentStep(3)}>
                      Continue to Questions
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Additional steps will be implemented in subsequent iterations */}
          {currentStep > 2 && (
            <Card>
              <CardHeader>
                <CardTitle>Step {currentStep}: {WORKFLOW_STEPS[currentStep - 1]}</CardTitle>
                <CardDescription>
                  This step is under development
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12">
                  <p className="text-slate-500 mb-4">
                    Step {currentStep} ({WORKFLOW_STEPS[currentStep - 1]}) will be implemented in the next iteration
                  </p>
                  <div className="flex space-x-4 justify-center">
                    <Button variant="outline" onClick={() => setCurrentStep(Math.max(1, currentStep - 1))}>
                      Previous
                    </Button>
                    {currentStep < WORKFLOW_STEPS.length && (
                      <Button onClick={() => setCurrentStep(currentStep + 1)}>
                        Next Step
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}