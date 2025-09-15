import { Progress } from "@/components/ui/progress"
import { CheckCircle, Circle } from "lucide-react"

interface WorkflowProgressProps {
  currentStep: number
  steps: string[]
}

export function WorkflowProgress({ currentStep, steps }: WorkflowProgressProps) {
  const progress = ((currentStep - 1) / (steps.length - 1)) * 100

  return (
    <div className="w-full max-w-4xl mx-auto mb-8">
      <div className="flex items-center justify-between mb-4">
        {steps.map((step, index) => {
          const stepNumber = index + 1
          const isCompleted = stepNumber < currentStep
          const isCurrent = stepNumber === currentStep
          
          return (
            <div key={index} className="flex flex-col items-center">
              <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 mb-2 ${
                isCompleted 
                  ? 'bg-[#0E7C86] border-[#0E7C86] text-white' 
                  : isCurrent 
                    ? 'border-[#0E7C86] text-[#0E7C86] bg-white' 
                    : 'border-slate-300 text-slate-400 bg-white'
              }`}>
                {isCompleted ? (
                  <CheckCircle className="w-6 h-6" />
                ) : (
                  <span className="text-sm font-medium">{stepNumber}</span>
                )}
              </div>
              <span className={`text-xs text-center max-w-20 ${
                isCurrent ? 'text-[#0E7C86] font-medium' : 'text-slate-500'
              }`}>
                {step}
              </span>
            </div>
          )
        })}
      </div>
      <Progress value={progress} className="h-2" />
    </div>
  )
}