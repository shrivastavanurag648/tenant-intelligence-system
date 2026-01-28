import React, { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { LandlordProfile, IssueCategory, ComplaintStatus } from '../../../shared/src/types'
import { getLandlordProfile, formatDate } from '../services/api'

interface ChartData {
  label: string
  value: number
  color: string
}

interface TrendPoint {
  period: string
  complaints: number
  resolved: number
  resolutionRate: number
}

function PieChart({ data, title }: { data: ChartData[], title: string }) {
  const total = data.reduce((sum, item) => sum + item.value, 0)
  
  if (total === 0) {
    return (
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-semibold mb-4">{title}</h3>
        <p className="text-gray-500">No data available</p>
      </div>
    )
  }

  let cumulativePercentage = 0

  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <h3 className="text-lg font-semibold mb-4">{title}</h3>
      <div className="flex items-center space-x-6">
        <div className="relative w-32 h-32">
          <svg className="w-32 h-32 transform -rotate-90" viewBox="0 0 100 100">
            {data.map((item, index) => {
              const percentage = (item.value / total) * 100
              const strokeDasharray = `${percentage} ${100 - percentage}`
              const strokeDashoffset = -cumulativePercentage
              cumulativePercentage += percentage
              
              return (
                <circle
                  key={index}
                  cx="50"
                  cy="50"
                  r="40"
                  fill="transparent"
                  stroke={item.color}
                  strokeWidth="8"
                  strokeDasharray={strokeDasharray}
                  strokeDashoffset={strokeDashoffset}
                  className="transition-all duration-300"
                />
              )
            })}
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-2xl font-bold text-gray-700">{total}</span>
          </div>
        </div>
        <div className="flex-1">
          {data.map((item, index) => (
            <div key={index} className="flex items-center justify-between mb-2">
              <div className="flex items-center">
                <div 
                  className="w-3 h-3 rounded-full mr-2" 
                  style={{ backgroundColor: item.color }}
                />
                <span className="text-sm text-gray-600">{item.label}</span>
              </div>
              <span className="text-sm font-medium">{item.value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function TrendChart({ data, title }: { data: TrendPoint[], title: string }) {
  const maxComplaints = Math.max(...data.map(point => point.complaints))
  const maxResolutionRate = Math.max(...data.map(point => point.resolutionRate))
  
  if (data.length === 0) {
    return (
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-semibold mb-4">{title}</h3>
        <p className="text-gray-500">No trend data available</p>
      </div>
    )
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <h3 className="text-lg font-semibold mb-4">{title}</h3>
      <div className="space-y-4">
        {data.map((point, index) => (
          <div key={index} className="border-b border-gray-100 pb-3 last:border-b-0">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-gray-700">{point.period}</span>
              <div className="flex space-x-4 text-sm">
                <span className="text-blue-600">{point.complaints} complaints</span>
                <span className="text-green-600">{point.resolved} resolved</span>
                <span className="text-purple-600">{point.resolutionRate.toFixed(1)}% rate</span>
              </div>
            </div>
            <div className="flex space-x-2">
              <div className="flex-1">
                <div className="bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${maxComplaints > 0 ? (point.complaints / maxComplaints) * 100 : 0}%` }}
                  />
                </div>
              </div>
              <div className="flex-1">
                <div className="bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-purple-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${point.resolutionRate}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export function LandlordProfilePage() {
  const { landlordId } = useParams<{ landlordId: string }>()
  const [profile, setProfile] = useState<LandlordProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function loadProfile() {
      if (!landlordId) {
        setError('Landlord ID is required')
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        setError(null)
        const profileData = await getLandlordProfile(landlordId)
        setProfile(profileData)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load landlord profile')
      } finally {
        setLoading(false)
      }
    }

    loadProfile()
  }, [landlordId])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <h2 className="text-lg font-semibold text-red-800 mb-2">Error Loading Profile</h2>
          <p className="text-red-600">{error}</p>
          <Link to="/" className="inline-block mt-4 text-blue-600 hover:text-blue-800">
            ← Back to Home
          </Link>
        </div>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <h2 className="text-lg font-semibold text-gray-800 mb-2">Profile Not Found</h2>
          <p className="text-gray-600">No profile data available for this landlord.</p>
          <Link to="/" className="inline-block mt-4 text-blue-600 hover:text-blue-800">
            ← Back to Home
          </Link>
        </div>
      </div>
    )
  }

  // Prepare chart data
  const categoryData: ChartData[] = Object.entries(profile.complaintsByCategory).map(([category, count]) => ({
    label: category,
    value: count,
    color: getCategoryColor(category as IssueCategory)
  }))

  // Generate mock trend data (in a real app, this would come from the API)
  const trendData: TrendPoint[] = [
    { period: 'Last 30 days', complaints: Math.floor(profile.totalComplaints * 0.3), resolved: Math.floor(profile.totalComplaints * 0.25), resolutionRate: profile.responseRate * 0.8 },
    { period: 'Last 60 days', complaints: Math.floor(profile.totalComplaints * 0.6), resolved: Math.floor(profile.totalComplaints * 0.5), resolutionRate: profile.responseRate * 0.9 },
    { period: 'Last 90 days', complaints: profile.totalComplaints, resolved: Math.floor(profile.totalComplaints * profile.responseRate / 100), resolutionRate: profile.responseRate }
  ]

  const resolvedComplaints = Math.floor(profile.totalComplaints * profile.responseRate / 100)
  const pendingComplaints = profile.totalComplaints - resolvedComplaints

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* Header */}
      <div className="mb-8">
        <Link to="/" className="text-blue-600 hover:text-blue-800 mb-4 inline-block">
          ← Back to Home
        </Link>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Landlord Profile</h1>
        <p className="text-xl text-gray-600">{profile.name}</p>
        <p className="text-sm text-gray-500 mt-1">ID: {profile.id}</p>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide">Properties</h3>
          <p className="text-3xl font-bold text-gray-900 mt-2">{profile.properties.length}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide">Total Complaints</h3>
          <p className="text-3xl font-bold text-gray-900 mt-2">{profile.totalComplaints}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide">Response Rate</h3>
          <p className="text-3xl font-bold text-blue-600 mt-2">{profile.responseRate.toFixed(1)}%</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide">Avg Resolution</h3>
          <p className="text-3xl font-bold text-green-600 mt-2">
            {profile.averageResolutionTime > 0 ? `${Math.round(profile.averageResolutionTime)}d` : 'N/A'}
          </p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide">Pending</h3>
          <p className="text-3xl font-bold text-orange-600 mt-2">{pendingComplaints}</p>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        <PieChart data={categoryData} title="Complaints by Category" />
        <TrendChart data={trendData} title="Resolution Trends" />
      </div>

      {/* Performance Metrics */}
      <div className="bg-white p-6 rounded-lg shadow mb-8">
        <h3 className="text-lg font-semibold mb-6">Performance Analysis</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="text-3xl font-bold text-green-600 mb-2">{resolvedComplaints}</div>
            <div className="text-sm text-gray-500">Resolved Complaints</div>
            <div className="mt-2">
              <div className="bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-green-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${profile.responseRate}%` }}
                />
              </div>
            </div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-orange-600 mb-2">{pendingComplaints}</div>
            <div className="text-sm text-gray-500">Pending Complaints</div>
            <div className="mt-2">
              <div className="bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-orange-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${100 - profile.responseRate}%` }}
                />
              </div>
            </div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-blue-600 mb-2">
              {profile.averageResolutionTime > 0 ? Math.round(profile.averageResolutionTime) : 0}
            </div>
            <div className="text-sm text-gray-500">Avg Days to Resolve</div>
            <div className="mt-2">
              <div className="bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${Math.min(profile.averageResolutionTime / 30 * 100, 100)}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Properties List */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold">Managed Properties</h3>
        </div>
        <div className="divide-y divide-gray-200">
          {profile.properties.length === 0 ? (
            <div className="p-6 text-center text-gray-500">
              No properties found
            </div>
          ) : (
            profile.properties.map((property, index) => (
              <div key={index} className="p-6 hover:bg-gray-50">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-lg font-medium text-gray-900">{property}</h4>
                    <p className="text-sm text-gray-500">Property #{index + 1}</p>
                  </div>
                  <Link 
                    to={`/building/${encodeURIComponent(property)}`}
                    className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                  >
                    View Building Profile →
                  </Link>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Comparison Section */}
      <div className="mt-8 bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-semibold mb-4">Performance Comparison</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-3">Response Rate vs Industry Average</h4>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>This Landlord</span>
                <span className="font-medium">{profile.responseRate.toFixed(1)}%</span>
              </div>
              <div className="bg-gray-200 rounded-full h-3">
                <div 
                  className="bg-blue-500 h-3 rounded-full transition-all duration-300"
                  style={{ width: `${profile.responseRate}%` }}
                />
              </div>
              <div className="flex justify-between text-sm text-gray-500">
                <span>Industry Average</span>
                <span>65.0%</span>
              </div>
              <div className="bg-gray-200 rounded-full h-3">
                <div className="bg-gray-400 h-3 rounded-full w-[65%]" />
              </div>
            </div>
          </div>
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-3">Resolution Time vs Industry Average</h4>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>This Landlord</span>
                <span className="font-medium">{Math.round(profile.averageResolutionTime)} days</span>
              </div>
              <div className="bg-gray-200 rounded-full h-3">
                <div 
                  className="bg-green-500 h-3 rounded-full transition-all duration-300"
                  style={{ width: `${Math.min(profile.averageResolutionTime / 30 * 100, 100)}%` }}
                />
              </div>
              <div className="flex justify-between text-sm text-gray-500">
                <span>Industry Average</span>
                <span>14 days</span>
              </div>
              <div className="bg-gray-200 rounded-full h-3">
                <div className="bg-gray-400 h-3 rounded-full w-[47%]" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// Helper functions for styling
function getCategoryColor(category: IssueCategory): string {
  switch (category) {
    case IssueCategory.SAFETY: return '#ef4444'
    case IssueCategory.MAINTENANCE: return '#f59e0b'
    case IssueCategory.SANITATION: return '#10b981'
    case IssueCategory.UTILITIES: return '#3b82f6'
    default: return '#6b7280'
  }
}