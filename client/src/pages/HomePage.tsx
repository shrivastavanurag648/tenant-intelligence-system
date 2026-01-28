import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Plus, FileText, Building2, Users, Info } from 'lucide-react'
import { DemoGuide } from '../components/DemoGuide'

export function HomePage() {
  const [showDemoGuide, setShowDemoGuide] = useState(false)

  return (
    <div className="space-y-8">
      {/* Demo Banner */}
      <div className="bg-primary-50 border border-primary-200 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Info className="h-5 w-5 text-primary-600 mr-2" />
            <span className="text-primary-800 font-medium">
              Demo Mode: Explore realistic tenant complaint data
            </span>
          </div>
          <button
            onClick={() => setShowDemoGuide(true)}
            className="text-primary-600 hover:text-primary-700 text-sm font-medium"
          >
            View Demo Guide
          </button>
        </div>
      </div>
      {/* Hero Section */}
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900 sm:text-5xl">
          Tenant Intelligence System
        </h1>
        <p className="mt-4 text-xl text-gray-600 max-w-3xl mx-auto">
          Submit anonymous complaints, verify community issues, and access building profiles 
          to make informed housing decisions.
        </p>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-12">
        <Link
          to="/submit"
          className="card hover:shadow-md transition-shadow group"
        >
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Plus className="h-8 w-8 text-primary-600 group-hover:text-primary-700" />
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-medium text-gray-900">Submit a Complaint</h3>
              <p className="text-gray-600">
                Report housing issues anonymously with text and photos
              </p>
            </div>
          </div>
        </Link>

        <Link
          to="/complaints"
          className="card hover:shadow-md transition-shadow group"
        >
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <FileText className="h-8 w-8 text-primary-600 group-hover:text-primary-700" />
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-medium text-gray-900">View Complaints</h3>
              <p className="text-gray-600">
                Browse and verify community-reported issues
              </p>
            </div>
          </div>
        </Link>
      </div>

      {/* Features */}
      <div className="mt-16">
        <h2 className="text-2xl font-bold text-gray-900 text-center mb-8">
          How It Works
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="text-center">
            <div className="flex justify-center mb-4">
              <Plus className="h-12 w-12 text-primary-600" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Submit Anonymously</h3>
            <p className="text-gray-600">
              Report housing issues without revealing your identity. Include photos and detailed descriptions.
            </p>
          </div>

          <div className="text-center">
            <div className="flex justify-center mb-4">
              <Users className="h-12 w-12 text-primary-600" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Community Verification</h3>
            <p className="text-gray-600">
              Other tenants can upvote and add supporting evidence to strengthen complaint patterns.
            </p>
          </div>

          <div className="text-center">
            <div className="flex justify-center mb-4">
              <Building2 className="h-12 w-12 text-primary-600" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Building Profiles</h3>
            <p className="text-gray-600">
              View aggregated complaint data and trends to make informed housing decisions.
            </p>
          </div>
        </div>
      </div>

      {/* Privacy Notice */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mt-12">
        <h3 className="text-lg font-medium text-blue-900 mb-2">Privacy & Anonymity</h3>
        <p className="text-blue-800">
          We collect only the information necessary to track and resolve housing issues: 
          building address, complaint description, and optional photos. No personal information 
          or registration is required.
        </p>
      </div>

      {/* Demo Guide Modal */}
      {showDemoGuide && (
        <DemoGuide onClose={() => setShowDemoGuide(false)} />
      )}
    </div>
  )
}