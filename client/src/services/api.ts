/**
 * API service functions for the Tenant Intelligence System frontend
 */

import axios, { AxiosError } from 'axios'
import { 
  ComplaintSubmission, 
  ComplaintResponse, 
  Complaint, 
  Evidence,
  BuildingProfile,
  LandlordProfile,
  ApiResponse,
  PaginatedResponse,
  ComplaintFilters,
  ClassificationResult,
  StatusUpdate,
  StatusHistory
} from '../../../shared/src/types'

// Create axios instance with base configuration
const api = axios.create({
  baseURL: '/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
})

// Request interceptor for logging
api.interceptors.request.use(
  (config) => {
    console.log(`API Request: ${config.method?.toUpperCase()} ${config.url}`)
    return config
  },
  (error) => {
    console.error('API Request Error:', error)
    return Promise.reject(error)
  }
)

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => {
    return response
  },
  async (error) => {
    console.error('API Response Error:', error)
    
    // Handle common error cases
    if (error.response?.status === 401) {
      // Handle unauthorized access
      console.warn('Unauthorized access')
    } else if (error.response?.status === 404) {
      // Handle not found
      console.warn('Resource not found')
    } else if (error.response?.status >= 500) {
      // Handle server errors
      console.error('Server error occurred')
    } else if (error.code === 'NETWORK_ERROR' || !error.response) {
      // Handle network errors
      console.error('Network error - API may be unavailable')
    }
    
    return Promise.reject(error)
  }
)

/**
 * Handle API errors consistently
 */
function handleApiError(error: unknown, defaultMessage: string): never {
  if (error instanceof AxiosError) {
    if (error.code === 'NETWORK_ERROR' || !error.response) {
      throw new Error('Network error - please check your connection')
    }
    if (error.response?.data?.message) {
      throw new Error(error.response.data.message)
    }
    if (error.response?.status === 404) {
      throw new Error('Resource not found')
    }
    if (error.response?.status >= 500) {
      throw new Error('Server error - please try again later')
    }
  }
  throw new Error(defaultMessage)
}

/**
 * Submit a new complaint with optional image
 */
export async function submitComplaint(submission: ComplaintSubmission): Promise<ComplaintResponse> {
  try {
    const formData = new FormData()
    
    // Add complaint data as JSON string
    const complaintData = {
      buildingAddress: submission.buildingAddress,
      description: submission.description,
      category: submission.category,
      landlordInfo: submission.landlordInfo
    }
    
    formData.append('complaint', JSON.stringify(complaintData))
    
    // Add image file if present
    if (submission.imageFile) {
      formData.append('image', submission.imageFile)
    }
    
    const response = await api.post<ApiResponse<ComplaintResponse>>('/complaints', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })
    
    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.message || 'Failed to submit complaint')
    }
    
    return response.data.data
  } catch (error) {
    handleApiError(error, 'Failed to submit complaint')
  }
}

/**
 * Get complaints with optional filtering
 */
export async function getComplaints(filters?: ComplaintFilters): Promise<PaginatedResponse<Complaint>> {
  try {
    const params = new URLSearchParams()
    
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          if (value instanceof Date) {
            params.append(key, value.toISOString())
          } else {
            params.append(key, String(value))
          }
        }
      })
    }
    
    const response = await api.get<ApiResponse<PaginatedResponse<Complaint>>>(`/complaints?${params}`)
    
    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.message || 'Failed to fetch complaints')
    }
    
    return response.data.data
  } catch (error) {
    handleApiError(error, 'Failed to fetch complaints')
  }
}

/**
 * Get a specific complaint by ID
 */
export async function getComplaint(id: string): Promise<Complaint> {
  try {
    const response = await api.get<ApiResponse<Complaint>>(`/complaints/${id}`)
    
    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.message || 'Failed to fetch complaint')
    }
    
    return response.data.data
  } catch (error) {
    handleApiError(error, 'Failed to fetch complaint')
  }
}

/**
 * Add an upvote to a complaint
 */
export async function upvoteComplaint(complaintId: string): Promise<Complaint> {
  try {
    const response = await api.post<ApiResponse<Complaint>>(`/complaints/${complaintId}/upvote`)
    
    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.message || 'Failed to upvote complaint')
    }
    
    return response.data.data
  } catch (error) {
    handleApiError(error, 'Failed to upvote complaint')
  }
}

/**
 * Remove an upvote from a complaint
 */
export async function removeUpvote(complaintId: string): Promise<Complaint> {
  try {
    const response = await api.delete<ApiResponse<Complaint>>(`/complaints/${complaintId}/upvote`)
    
    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.message || 'Failed to remove upvote')
    }
    
    return response.data.data
  } catch (error) {
    handleApiError(error, 'Failed to remove upvote')
  }
}

/**
 * Check if current session has upvoted a complaint
 */
export async function getUpvoteStatus(complaintId: string): Promise<boolean> {
  try {
    const response = await api.get<ApiResponse<{ hasUpvoted: boolean }>>(`/complaints/${complaintId}/upvote-status`)
    
    if (!response.data.success || !response.data.data) {
      return false
    }
    
    return response.data.data.hasUpvoted
  } catch (error) {
    console.warn('Failed to check upvote status:', error)
    return false
  }
}

/**
 * Update complaint category (manual override)
 */
export async function updateComplaintCategory(complaintId: string, category: string): Promise<Complaint> {
  try {
    const response = await api.put<ApiResponse<Complaint>>(`/complaints/${complaintId}/category`, {
      category
    })
    
    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.message || 'Failed to update category')
    }
    
    return response.data.data
  } catch (error) {
    handleApiError(error, 'Failed to update category')
  }
}

/**
 * Get AI classification result for a complaint
 */
export async function getClassificationResult(complaintId: string): Promise<ClassificationResult | null> {
  try {
    const response = await api.get<ApiResponse<ClassificationResult>>(`/complaints/${complaintId}/classification`)
    
    if (!response.data.success || !response.data.data) {
      return null
    }
    
    return response.data.data
  } catch (error) {
    console.warn('Failed to fetch classification result:', error)
    return null
  }
}

/**
 * Update complaint status
 */
export async function updateComplaintStatus(statusUpdate: StatusUpdate): Promise<Complaint> {
  try {
    const response = await api.put<ApiResponse<Complaint>>(`/complaints/${statusUpdate.complaintId}/status`, {
      newStatus: statusUpdate.newStatus,
      notes: statusUpdate.notes
    })
    
    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.message || 'Failed to update status')
    }
    
    return response.data.data
  } catch (error) {
    handleApiError(error, 'Failed to update status')
  }
}

/**
 * Get status history for a complaint
 */
export async function getStatusHistory(complaintId: string): Promise<StatusHistory[]> {
  try {
    const response = await api.get<ApiResponse<StatusHistory[]>>(`/complaints/${complaintId}/status-history`)
    
    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.message || 'Failed to fetch status history')
    }
    
    return response.data.data
  } catch (error) {
    handleApiError(error, 'Failed to fetch status history')
  }
}

/**
 * Submit evidence for a complaint
 */
export async function submitEvidence(complaintId: string, description: string, imageFile?: File): Promise<Evidence> {
  try {
    const formData = new FormData()
    
    formData.append('description', description)
    
    if (imageFile) {
      formData.append('image', imageFile)
    }
    
    const response = await api.post<ApiResponse<Evidence>>(`/evidence/${complaintId}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })
    
    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.message || 'Failed to submit evidence')
    }
    
    return response.data.data
  } catch (error) {
    handleApiError(error, 'Failed to submit evidence')
  }
}

/**
 * Get evidence for a complaint
 */
export async function getEvidence(complaintId: string): Promise<Evidence[]> {
  try {
    const response = await api.get<ApiResponse<Evidence[]>>(`/evidence/${complaintId}`)
    
    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.message || 'Failed to fetch evidence')
    }
    
    return response.data.data
  } catch (error) {
    handleApiError(error, 'Failed to fetch evidence')
  }
}

/**
 * Get building profile by address
 */
export async function getBuildingProfile(address: string): Promise<BuildingProfile> {
  try {
    const encodedAddress = encodeURIComponent(address)
    const response = await api.get<ApiResponse<BuildingProfile>>(`/profiles/buildings/${encodedAddress}`)
    
    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.message || 'Failed to fetch building profile')
    }
    
    return response.data.data
  } catch (error) {
    handleApiError(error, 'Failed to fetch building profile')
  }
}

/**
 * Get landlord profile by ID
 */
export async function getLandlordProfile(landlordId: string): Promise<LandlordProfile> {
  try {
    const response = await api.get<ApiResponse<LandlordProfile>>(`/profiles/landlords/${landlordId}`)
    
    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.message || 'Failed to fetch landlord profile')
    }
    
    return response.data.data
  } catch (error) {
    handleApiError(error, 'Failed to fetch landlord profile')
  }
}

/**
 * Get image URL for display
 */
export function getImageUrl(imageUrl: string): string {
  if (imageUrl.startsWith('http')) {
    return imageUrl
  }
  
  // Handle relative URLs from the server
  const baseURL = api.defaults.baseURL || '/api'
  return `${baseURL}${imageUrl}`
}

/**
 * Check API connection health
 */
export async function checkApiHealth(): Promise<{ status: string; timestamp: string }> {
  try {
    const response = await api.get('/health')
    return response.data
  } catch (error) {
    throw new Error('API connection failed')
  }
}

/**
 * Get API information
 */
export async function getApiInfo(): Promise<{ message: string; version: string; endpoints: Record<string, string> }> {
  try {
    const response = await api.get('/')
    return response.data
  } catch (error) {
    throw new Error('Failed to get API information')
  }
}

/**
 * Format date for display
 */
export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

/**
 * Format relative time (e.g., "2 hours ago")
 */
export function formatRelativeTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  const now = new Date()
  const diffMs = now.getTime() - d.getTime()
  const diffMins = Math.floor(diffMs / (1000 * 60))
  const diffHours = Math.floor(diffMins / 60)
  const diffDays = Math.floor(diffHours / 24)
  
  if (diffMins < 1) return 'Just now'
  if (diffMins < 60) return `${diffMins} minute${diffMins === 1 ? '' : 's'} ago`
  if (diffHours < 24) return `${diffHours} hour${diffHours === 1 ? '' : 's'} ago`
  if (diffDays < 7) return `${diffDays} day${diffDays === 1 ? '' : 's'} ago`
  
  return formatDate(d)
}