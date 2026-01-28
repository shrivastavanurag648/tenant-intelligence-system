import React, { useState } from 'react'
import { X, ChevronLeft, ChevronRight, ZoomIn, ZoomOut, RotateCw, Download } from 'lucide-react'
import { getImageUrl } from '../services/api'

interface ImageGalleryProps {
  images: Array<{
    url: string
    alt?: string
    caption?: string
  }>
  className?: string
}

interface ImageModalProps {
  images: Array<{
    url: string
    alt?: string
    caption?: string
  }>
  currentIndex: number
  isOpen: boolean
  onClose: () => void
  onNavigate: (index: number) => void
}

function ImageModal({ images, currentIndex, isOpen, onClose, onNavigate }: ImageModalProps) {
  const [zoom, setZoom] = useState(1)
  const [rotation, setRotation] = useState(0)
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })

  if (!isOpen || images.length === 0) return null

  const currentImage = images[currentIndex]

  const handlePrevious = () => {
    const newIndex = currentIndex > 0 ? currentIndex - 1 : images.length - 1
    onNavigate(newIndex)
    resetTransform()
  }

  const handleNext = () => {
    const newIndex = currentIndex < images.length - 1 ? currentIndex + 1 : 0
    onNavigate(newIndex)
    resetTransform()
  }

  const handleZoomIn = () => {
    setZoom(prev => Math.min(prev * 1.5, 5))
  }

  const handleZoomOut = () => {
    setZoom(prev => Math.max(prev / 1.5, 0.5))
  }

  const handleRotate = () => {
    setRotation(prev => (prev + 90) % 360)
  }

  const resetTransform = () => {
    setZoom(1)
    setRotation(0)
    setPosition({ x: 0, y: 0 })
  }

  const handleMouseDown = (e: React.MouseEvent) => {
    if (zoom > 1) {
      setIsDragging(true)
      setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y })
    }
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging && zoom > 1) {
      setPosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      })
    }
  }

  const handleMouseUp = () => {
    setIsDragging(false)
  }

  const handleDownload = () => {
    const link = document.createElement('a')
    link.href = getImageUrl(currentImage.url)
    link.download = `image-${currentIndex + 1}.jpg`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const handleKeyDown = (e: KeyboardEvent) => {
    switch (e.key) {
      case 'Escape':
        onClose()
        break
      case 'ArrowLeft':
        handlePrevious()
        break
      case 'ArrowRight':
        handleNext()
        break
      case '+':
      case '=':
        handleZoomIn()
        break
      case '-':
        handleZoomOut()
        break
      case 'r':
      case 'R':
        handleRotate()
        break
    }
  }

  React.useEffect(() => {
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [currentIndex])

  React.useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-90 flex items-center justify-center">
      {/* Header Controls */}
      <div className="absolute top-4 left-4 right-4 flex items-center justify-between z-10">
        <div className="flex items-center space-x-2 text-white">
          <span className="text-sm">
            {currentIndex + 1} of {images.length}
          </span>
          {currentImage.caption && (
            <span className="text-sm opacity-75">- {currentImage.caption}</span>
          )}
        </div>
        
        <div className="flex items-center space-x-2">
          <button
            onClick={handleZoomOut}
            className="p-2 text-white hover:bg-white hover:bg-opacity-20 rounded-full transition-colors"
            title="Zoom Out (-)"
          >
            <ZoomOut className="h-5 w-5" />
          </button>
          
          <span className="text-white text-sm min-w-[4rem] text-center">
            {Math.round(zoom * 100)}%
          </span>
          
          <button
            onClick={handleZoomIn}
            className="p-2 text-white hover:bg-white hover:bg-opacity-20 rounded-full transition-colors"
            title="Zoom In (+)"
          >
            <ZoomIn className="h-5 w-5" />
          </button>
          
          <button
            onClick={handleRotate}
            className="p-2 text-white hover:bg-white hover:bg-opacity-20 rounded-full transition-colors"
            title="Rotate (R)"
          >
            <RotateCw className="h-5 w-5" />
          </button>
          
          <button
            onClick={handleDownload}
            className="p-2 text-white hover:bg-white hover:bg-opacity-20 rounded-full transition-colors"
            title="Download"
          >
            <Download className="h-5 w-5" />
          </button>
          
          <button
            onClick={onClose}
            className="p-2 text-white hover:bg-white hover:bg-opacity-20 rounded-full transition-colors"
            title="Close (Esc)"
          >
            <X className="h-6 w-6" />
          </button>
        </div>
      </div>

      {/* Navigation Arrows */}
      {images.length > 1 && (
        <>
          <button
            onClick={handlePrevious}
            className="absolute left-4 top-1/2 transform -translate-y-1/2 p-3 text-white hover:bg-white hover:bg-opacity-20 rounded-full transition-colors z-10"
            title="Previous (←)"
          >
            <ChevronLeft className="h-8 w-8" />
          </button>
          
          <button
            onClick={handleNext}
            className="absolute right-4 top-1/2 transform -translate-y-1/2 p-3 text-white hover:bg-white hover:bg-opacity-20 rounded-full transition-colors z-10"
            title="Next (→)"
          >
            <ChevronRight className="h-8 w-8" />
          </button>
        </>
      )}

      {/* Main Image */}
      <div 
        className="flex items-center justify-center w-full h-full p-16"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        style={{ cursor: zoom > 1 ? (isDragging ? 'grabbing' : 'grab') : 'default' }}
      >
        <img
          src={getImageUrl(currentImage.url)}
          alt={currentImage.alt || `Image ${currentIndex + 1}`}
          className="max-w-full max-h-full object-contain transition-transform duration-200"
          style={{
            transform: `scale(${zoom}) rotate(${rotation}deg) translate(${position.x / zoom}px, ${position.y / zoom}px)`,
            transformOrigin: 'center center'
          }}
          draggable={false}
          onError={(e) => {
            const target = e.target as HTMLImageElement
            target.src = '/placeholder-image.svg' // Fallback image
          }}
        />
      </div>

      {/* Thumbnail Strip */}
      {images.length > 1 && (
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2 bg-black bg-opacity-50 rounded-lg p-2">
          {images.map((image, index) => (
            <button
              key={index}
              onClick={() => {
                onNavigate(index)
                resetTransform()
              }}
              className={`w-16 h-16 rounded overflow-hidden border-2 transition-colors ${
                index === currentIndex ? 'border-white' : 'border-transparent hover:border-gray-300'
              }`}
            >
              <img
                src={getImageUrl(image.url)}
                alt={image.alt || `Thumbnail ${index + 1}`}
                className="w-full h-full object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

export function ImageGallery({ images, className = '' }: ImageGalleryProps) {
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [isModalOpen, setIsModalOpen] = useState(false)

  if (images.length === 0) {
    return (
      <div className={`text-center text-gray-500 py-8 ${className}`}>
        <div className="text-4xl mb-2">📷</div>
        <p>No images available</p>
      </div>
    )
  }

  const openModal = (index: number) => {
    setSelectedIndex(index)
    setIsModalOpen(true)
  }

  const closeModal = () => {
    setIsModalOpen(false)
  }

  if (images.length === 1) {
    // Single image display
    return (
      <div className={className}>
        <div 
          className="relative group cursor-pointer"
          onClick={() => openModal(0)}
        >
          <img
            src={getImageUrl(images[0].url)}
            alt={images[0].alt || 'Image'}
            className="w-full h-auto rounded-lg shadow-sm hover:shadow-md transition-shadow"
            onError={(e) => {
              const target = e.target as HTMLImageElement
              target.src = '/placeholder-image.svg'
            }}
          />
          <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-200 rounded-lg flex items-center justify-center">
            <ZoomIn className="h-8 w-8 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
          {images[0].caption && (
            <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white p-2 rounded-b-lg">
              <p className="text-sm">{images[0].caption}</p>
            </div>
          )}
        </div>
        
        <ImageModal
          images={images}
          currentIndex={selectedIndex}
          isOpen={isModalOpen}
          onClose={closeModal}
          onNavigate={setSelectedIndex}
        />
      </div>
    )
  }

  // Multiple images grid
  return (
    <div className={className}>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {images.map((image, index) => (
          <div
            key={index}
            className="relative group cursor-pointer aspect-square"
            onClick={() => openModal(index)}
          >
            <img
              src={getImageUrl(image.url)}
              alt={image.alt || `Image ${index + 1}`}
              className="w-full h-full object-cover rounded-lg shadow-sm hover:shadow-md transition-shadow"
              onError={(e) => {
                const target = e.target as HTMLImageElement
                target.src = '/placeholder-image.svg'
              }}
            />
            <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-200 rounded-lg flex items-center justify-center">
              <ZoomIn className="h-6 w-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
            {image.caption && (
              <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white p-1 rounded-b-lg">
                <p className="text-xs truncate">{image.caption}</p>
              </div>
            )}
          </div>
        ))}
      </div>
      
      <ImageModal
        images={images}
        currentIndex={selectedIndex}
        isOpen={isModalOpen}
        onClose={closeModal}
        onNavigate={setSelectedIndex}
      />
    </div>
  )
}

export default ImageGallery