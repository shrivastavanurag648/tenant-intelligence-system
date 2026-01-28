import React, { useState } from 'react'
import { ZoomIn, AlertCircle } from 'lucide-react'
import { getImageUrl } from '../services/api'

interface ImageViewerProps {
  src: string
  alt?: string
  caption?: string
  className?: string
  maxWidth?: string
  maxHeight?: string
  showCaption?: boolean
  clickToEnlarge?: boolean
}

export function ImageViewer({ 
  src, 
  alt = 'Image', 
  caption,
  className = '',
  maxWidth = '100%',
  maxHeight = '400px',
  showCaption = true,
  clickToEnlarge = true
}: ImageViewerProps) {
  const [isLoading, setIsLoading] = useState(true)
  const [hasError, setHasError] = useState(false)
  const [isEnlarged, setIsEnlarged] = useState(false)

  const handleImageLoad = () => {
    setIsLoading(false)
    setHasError(false)
  }

  const handleImageError = () => {
    setIsLoading(false)
    setHasError(true)
  }

  const handleClick = () => {
    if (clickToEnlarge && !hasError) {
      setIsEnlarged(true)
    }
  }

  const closeEnlarged = () => {
    setIsEnlarged(false)
  }

  if (hasError) {
    return (
      <div className={`flex items-center justify-center bg-gray-100 rounded-lg p-8 ${className}`}>
        <div className="text-center text-gray-500">
          <AlertCircle className="h-12 w-12 mx-auto mb-2" />
          <p className="text-sm">Failed to load image</p>
          {caption && showCaption && (
            <p className="text-xs mt-1 text-gray-400">{caption}</p>
          )}
        </div>
      </div>
    )
  }

  return (
    <>
      <div className={`relative ${className}`}>
        {isLoading && (
          <div 
            className="flex items-center justify-center bg-gray-100 rounded-lg animate-pulse"
            style={{ maxWidth, maxHeight, minHeight: '200px' }}
          >
            <div className="text-gray-400">Loading...</div>
          </div>
        )}
        
        <div 
          className={`relative group ${clickToEnlarge ? 'cursor-pointer' : ''} ${isLoading ? 'hidden' : ''}`}
          onClick={handleClick}
        >
          <img
            src={getImageUrl(src)}
            alt={alt}
            className="w-full h-auto rounded-lg shadow-sm hover:shadow-md transition-shadow object-contain"
            style={{ maxWidth, maxHeight }}
            onLoad={handleImageLoad}
            onError={handleImageError}
          />
          
          {clickToEnlarge && (
            <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-200 rounded-lg flex items-center justify-center">
              <ZoomIn className="h-8 w-8 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          )}
          
          {caption && showCaption && (
            <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white p-2 rounded-b-lg">
              <p className="text-sm">{caption}</p>
            </div>
          )}
        </div>
      </div>

      {/* Enlarged Modal */}
      {isEnlarged && (
        <div 
          className="fixed inset-0 z-50 bg-black bg-opacity-90 flex items-center justify-center p-4"
          onClick={closeEnlarged}
        >
          <div className="relative max-w-full max-h-full">
            <img
              src={getImageUrl(src)}
              alt={alt}
              className="max-w-full max-h-full object-contain"
            />
            {caption && (
              <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-75 text-white p-4">
                <p className="text-center">{caption}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  )
}

export default ImageViewer