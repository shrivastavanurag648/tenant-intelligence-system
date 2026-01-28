import { useState } from 'react'
import { X, ChevronRight, Search, Eye, Building2, Users } from 'lucide-react'

interface DemoGuideProps {
  onClose: () => void
}

export function DemoGuide({ onClose }: DemoGuideProps) {
  const [currentStep, setCurrentStep] = useState(0)

  const demoSteps = [
    {
      title: 'Welcome to the Demo!',
      description: 'This system contains realistic demo data showing landlord patterns and community verification.',
      icon: Users,
      actions: [
        'Explore 25 realistic complaints across NYC',
        'See patterns of repeat-offender landlords',
        'View community verification through upvotes and evidence'
      ]
    },
    {
      title: 'Find Problem Landlords',
      description: 'Search for "Slumlord Properties" to see a repeat offender with 0% resolution rate.',
      icon: Search,
      actions: [
        'Go to View Complaints',
        'Search for "Slumlord Properties"',
        'Notice 6 complaints with no resolutions'
      ]
    },
    {
      title: 'Explore Safety Issues',
      description: 'Filter by "Safety" category to see concentrated problems in Queens Village.',
      icon: Eye,
      actions: [
        'Use the Category filter',
        'Select "Safety" issues',
        'See geographic clustering of fire safety violations'
      ]
    },
    {
      title: 'View Building Profiles',
      description: 'Click on building addresses to see aggregated complaint data and trends.',
      icon: Building2,
      actions: [
        'Click any building address link',
        'View complaint statistics by category',
        'See landlord response patterns'
      ]
    }
  ]

  const currentStepData = demoSteps[currentStep]
  const isLastStep = currentStep === demoSteps.length - 1

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-md w-full p-6 animate-slide-up">
        <div className="flex justify-between items-start mb-4">
          <h2 className="text-xl font-semibold text-gray-900">Demo Guide</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mb-6">
          <div className="flex items-center mb-3">
            <currentStepData.icon className="h-8 w-8 text-primary-600 mr-3" />
            <h3 className="text-lg font-medium text-gray-900">
              {currentStepData.title}
            </h3>
          </div>
          
          <p className="text-gray-600 mb-4">
            {currentStepData.description}
          </p>

          <ul className="space-y-2">
            {currentStepData.actions.map((action, index) => (
              <li key={index} className="flex items-start">
                <ChevronRight className="h-4 w-4 text-primary-600 mt-0.5 mr-2 flex-shrink-0" />
                <span className="text-sm text-gray-700">{action}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="flex justify-between items-center">
          <div className="flex space-x-1">
            {demoSteps.map((_, index) => (
              <div
                key={index}
                className={`w-2 h-2 rounded-full ${
                  index === currentStep ? 'bg-primary-600' : 'bg-gray-300'
                }`}
              />
            ))}
          </div>

          <div className="flex space-x-2">
            {currentStep > 0 && (
              <button
                onClick={() => setCurrentStep(currentStep - 1)}
                className="btn-secondary text-sm"
              >
                Previous
              </button>
            )}
            
            {isLastStep ? (
              <button
                onClick={onClose}
                className="btn-primary text-sm"
              >
                Start Exploring
              </button>
            ) : (
              <button
                onClick={() => setCurrentStep(currentStep + 1)}
                className="btn-primary text-sm"
              >
                Next
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}