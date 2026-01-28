import { Check } from 'lucide-react'

interface Step {
  id: string
  title: string
  description?: string
}

interface ProgressIndicatorProps {
  steps: Step[]
  currentStep: number
  className?: string
}

export function ProgressIndicator({ steps, currentStep, className = '' }: ProgressIndicatorProps) {
  return (
    <div className={`${className}`}>
      <div className="flex items-center justify-between">
        {steps.map((step, index) => {
          const stepNumber = index + 1
          const isCompleted = stepNumber < currentStep
          const isCurrent = stepNumber === currentStep
          const isUpcoming = stepNumber > currentStep

          return (
            <div key={step.id} className="flex items-center flex-1">
              {/* Step Circle */}
              <div className="flex items-center">
                <div
                  className={`
                    flex items-center justify-center w-8 h-8 rounded-full border-2 text-sm font-medium
                    ${isCompleted 
                      ? 'bg-primary-600 border-primary-600 text-white' 
                      : isCurrent 
                        ? 'bg-white border-primary-600 text-primary-600' 
                        : 'bg-white border-gray-300 text-gray-500'
                    }
                  `}
                >
                  {isCompleted ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    stepNumber
                  )}
                </div>
                
                {/* Step Label */}
                <div className="ml-3 min-w-0 flex-1">
                  <p
                    className={`
                      text-sm font-medium
                      ${isCurrent ? 'text-primary-600' : isCompleted ? 'text-gray-900' : 'text-gray-500'}
                    `}
                  >
                    {step.title}
                  </p>
                  {step.description && (
                    <p className="text-xs text-gray-500 mt-1">
                      {step.description}
                    </p>
                  )}
                </div>
              </div>

              {/* Connector Line */}
              {index < steps.length - 1 && (
                <div
                  className={`
                    flex-1 h-0.5 mx-4
                    ${isCompleted ? 'bg-primary-600' : 'bg-gray-300'}
                  `}
                />
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

interface SimpleProgressBarProps {
  progress: number // 0-100
  label?: string
  showPercentage?: boolean
  className?: string
}

export function SimpleProgressBar({ 
  progress, 
  label, 
  showPercentage = true, 
  className = '' 
}: SimpleProgressBarProps) {
  const clampedProgress = Math.max(0, Math.min(100, progress))

  return (
    <div className={className}>
      {(label || showPercentage) && (
        <div className="flex justify-between items-center mb-2">
          {label && (
            <span className="text-sm font-medium text-gray-700">{label}</span>
          )}
          {showPercentage && (
            <span className="text-sm text-gray-500">{Math.round(clampedProgress)}%</span>
          )}
        </div>
      )}
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div
          className="bg-primary-600 h-2 rounded-full transition-all duration-300 ease-out"
          style={{ width: `${clampedProgress}%` }}
        />
      </div>
    </div>
  )
}