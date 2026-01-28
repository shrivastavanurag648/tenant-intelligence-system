import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useNavigate } from 'react-router-dom'
import { Upload, X, AlertCircle, CheckCircle, Camera } from 'lucide-react'
import { ComplaintSubmissionSchema } from '../../../shared/src/schemas'
import { ComplaintSubmission, IssueCategory, ClassificationResult } from '../../../shared/src/types'
import { submitComplaint } from '../services/api'

type FormData = {
  buildingAddress: string
  description: string
  category?: IssueCategory
  landlordName?: string
  landlordContact?: string
}

export function SubmitComplaintPage() {
  const navigate = useNavigate()
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [submitSuccess, setSubmitSuccess] = useState(false)
  const [aiSuggestion, setAiSuggestion] = useState<ClassificationResult | null>(null)
  const [showLandlordInfo, setShowLandlordInfo] = useState(false)

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isValid }
  } = useForm<FormData>({
    resolver: zodResolver(ComplaintSubmissionSchema.omit({ landlordInfo: true }).extend({
      landlordName: ComplaintSubmissionSchema.shape.landlordInfo.optional().transform(info => info?.name),
      landlordContact: ComplaintSubmissionSchema.shape.landlordInfo.optional().transform(info => info?.contactInfo)
    })),
    mode: 'onChange'
  })

  const watchedDescription = watch('description', '')
  const watchedCategory = watch('category')

  // Handle image upload
  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      setSubmitError('Only JPEG, PNG, and WebP images are allowed')
      return
    }

    // Validate file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      setSubmitError('Image must be smaller than 5MB')
      return
    }

    setImageFile(file)
    setSubmitError(null)

    // Create preview
    const reader = new FileReader()
    reader.onload = (e) => {
      setImagePreview(e.target?.result as string)
    }
    reader.readAsDataURL(file)
  }

  // Remove image
  const removeImage = () => {
    setImageFile(null)
    setImagePreview(null)
  }

  // Simulate AI classification (in real implementation, this would call the API)
  const simulateAIClassification = (description: string) => {
    if (description.length < 20) return

    const keywords = {
      [IssueCategory.SAFETY]: ['unsafe', 'dangerous', 'broken stairs', 'fire', 'security', 'lock', 'violence', 'threat'],
      [IssueCategory.MAINTENANCE]: ['repair', 'broken', 'fix', 'maintenance', 'door', 'window', 'roof', 'wall'],
      [IssueCategory.SANITATION]: ['dirty', 'clean', 'garbage', 'pest', 'mold', 'smell', 'hygiene', 'bathroom'],
      [IssueCategory.UTILITIES]: ['water', 'electricity', 'heating', 'cooling', 'power', 'gas', 'internet', 'cable']
    }

    let bestMatch = IssueCategory.MAINTENANCE
    let bestScore = 0

    Object.entries(keywords).forEach(([category, words]) => {
      const score = words.reduce((acc, word) => {
        return acc + (description.toLowerCase().includes(word) ? 1 : 0)
      }, 0)
      
      if (score > bestScore) {
        bestScore = score
        bestMatch = category as IssueCategory
      }
    })

    const confidence = Math.min(0.9, Math.max(0.3, bestScore * 0.2 + 0.3))
    
    setAiSuggestion({
      category: bestMatch,
      confidence,
      suggestedCategories: Object.values(IssueCategory).filter(cat => cat !== bestMatch).slice(0, 2)
    })

    // Auto-select if confidence is high
    if (confidence > 0.7 && !watchedCategory) {
      setValue('category', bestMatch)
    }
  }

  // Handle description change for AI suggestions
  const handleDescriptionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const description = e.target.value
    if (description.length > 20) {
      setTimeout(() => simulateAIClassification(description), 500)
    }
  }

  // Handle form submission
  const onSubmit = async (data: FormData) => {
    setIsSubmitting(true)
    setSubmitError(null)

    try {
      const submission: ComplaintSubmission = {
        buildingAddress: data.buildingAddress,
        description: data.description,
        category: data.category,
        imageFile: imageFile || undefined,
        landlordInfo: (data.landlordName || data.landlordContact) ? {
          name: data.landlordName || '',
          contactInfo: data.landlordContact
        } : undefined
      }

      const response = await submitComplaint(submission)
      
      setSubmitSuccess(true)
      
      // Redirect to complaint detail page after 2 seconds
      setTimeout(() => {
        navigate(`/complaints/${response.id}`)
      }, 2000)

    } catch (error) {
      console.error('Submission error:', error)
      setSubmitError(error instanceof Error ? error.message : 'Failed to submit complaint')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (submitSuccess) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="card text-center">
          <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Complaint Submitted Successfully!</h2>
          <p className="text-gray-600 mb-4">
            Your complaint has been recorded and will be reviewed. You'll be redirected to the complaint details shortly.
          </p>
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600 mx-auto"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Submit a Complaint</h1>
      
      {/* Privacy Notice */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <h3 className="text-sm font-medium text-blue-900 mb-1">Anonymous Submission</h3>
        <p className="text-sm text-blue-800">
          No personal information is required. We only collect building address, complaint details, and optional photos.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Building Address */}
        <div className="card">
          <label htmlFor="buildingAddress" className="block text-sm font-medium text-gray-700 mb-2">
            Building Address *
          </label>
          <input
            {...register('buildingAddress')}
            type="text"
            id="buildingAddress"
            placeholder="Enter the full building address"
            className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
              errors.buildingAddress ? 'border-red-300' : 'border-gray-300'
            }`}
          />
          {errors.buildingAddress && (
            <p className="mt-1 text-sm text-red-600 flex items-center">
              <AlertCircle className="h-4 w-4 mr-1" />
              {errors.buildingAddress.message}
            </p>
          )}
        </div>

        {/* Complaint Description */}
        <div className="card">
          <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
            Complaint Description *
          </label>
          <textarea
            {...register('description')}
            id="description"
            rows={6}
            placeholder="Describe the issue in detail. Include when it started, how it affects you, and any relevant details..."
            className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
              errors.description ? 'border-red-300' : 'border-gray-300'
            }`}
            onChange={handleDescriptionChange}
          />
          <div className="mt-1 flex justify-between items-center">
            <div>
              {errors.description && (
                <p className="text-sm text-red-600 flex items-center">
                  <AlertCircle className="h-4 w-4 mr-1" />
                  {errors.description.message}
                </p>
              )}
            </div>
            <span className="text-sm text-gray-500">{watchedDescription.length} characters</span>
          </div>
        </div>

        {/* AI Category Suggestion */}
        {aiSuggestion && (
          <div className="card bg-blue-50 border-blue-200">
            <h3 className="text-sm font-medium text-blue-900 mb-2">AI Category Suggestion</h3>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-blue-800">
                Suggested: <strong>{aiSuggestion.category}</strong>
              </span>
              <span className="text-xs text-blue-600">
                {Math.round(aiSuggestion.confidence * 100)}% confidence
              </span>
            </div>
            {aiSuggestion.confidence < 0.7 && (
              <p className="text-xs text-blue-700">
                Low confidence - please verify the category below
              </p>
            )}
          </div>
        )}

        {/* Category Selection */}
        <div className="card">
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Issue Category {aiSuggestion && aiSuggestion.confidence < 0.7 && '*'}
          </label>
          <div className="grid grid-cols-2 gap-3">
            {Object.values(IssueCategory).map((category) => (
              <label
                key={category}
                className={`relative flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50 ${
                  watchedCategory === category
                    ? 'border-primary-500 bg-primary-50'
                    : 'border-gray-300'
                }`}
              >
                <input
                  {...register('category')}
                  type="radio"
                  value={category}
                  className="sr-only"
                />
                <div className="flex-1">
                  <span className="block text-sm font-medium text-gray-900">
                    {category}
                  </span>
                </div>
                {watchedCategory === category && (
                  <CheckCircle className="h-5 w-5 text-primary-600" />
                )}
              </label>
            ))}
          </div>
          {errors.category && (
            <p className="mt-2 text-sm text-red-600 flex items-center">
              <AlertCircle className="h-4 w-4 mr-1" />
              {errors.category.message}
            </p>
          )}
        </div>

        {/* Image Upload */}
        <div className="card">
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Photo Evidence (Optional)
          </label>
          
          {!imagePreview ? (
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleImageUpload}
                className="hidden"
                id="image-upload"
              />
              <label htmlFor="image-upload" className="cursor-pointer">
                <Camera className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-sm text-gray-600 mb-2">
                  Click to upload an image or drag and drop
                </p>
                <p className="text-xs text-gray-500">
                  JPEG, PNG, or WebP up to 5MB
                </p>
              </label>
            </div>
          ) : (
            <div className="relative">
              <img
                src={imagePreview}
                alt="Preview"
                className="w-full h-48 object-cover rounded-lg"
              />
              <button
                type="button"
                onClick={removeImage}
                className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>

        {/* Optional Landlord Information */}
        <div className="card">
          <div className="flex items-center justify-between mb-3">
            <label className="block text-sm font-medium text-gray-700">
              Landlord Information (Optional)
            </label>
            <button
              type="button"
              onClick={() => setShowLandlordInfo(!showLandlordInfo)}
              className="text-sm text-primary-600 hover:text-primary-700"
            >
              {showLandlordInfo ? 'Hide' : 'Add'} landlord info
            </button>
          </div>
          
          {showLandlordInfo && (
            <div className="space-y-4">
              <div>
                <label htmlFor="landlordName" className="block text-sm font-medium text-gray-700 mb-1">
                  Landlord Name
                </label>
                <input
                  {...register('landlordName')}
                  type="text"
                  id="landlordName"
                  placeholder="Enter landlord or property manager name"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
              <div>
                <label htmlFor="landlordContact" className="block text-sm font-medium text-gray-700 mb-1">
                  Contact Information
                </label>
                <input
                  {...register('landlordContact')}
                  type="text"
                  id="landlordContact"
                  placeholder="Phone number, email, or address"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
            </div>
          )}
        </div>

        {/* Error Display */}
        {submitError && (
          <div className="card bg-red-50 border-red-200">
            <div className="flex items-center">
              <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
              <p className="text-sm text-red-700">{submitError}</p>
            </div>
          </div>
        )}

        {/* Submit Button */}
        <div className="card">
          <button
            type="submit"
            disabled={!isValid || isSubmitting}
            className={`w-full flex items-center justify-center px-4 py-3 border border-transparent rounded-md shadow-sm text-sm font-medium text-white transition-colors ${
              isValid && !isSubmitting
                ? 'bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500'
                : 'bg-gray-400 cursor-not-allowed'
            }`}
          >
            {isSubmitting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Submitting...
              </>
            ) : (
              <>
                <Upload className="h-4 w-4 mr-2" />
                Submit Complaint
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  )
}