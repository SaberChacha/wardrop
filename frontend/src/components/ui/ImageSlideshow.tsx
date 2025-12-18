import { useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '../../lib/utils'

interface ImageSlideshowProps {
  images: { id: number; image_path: string; is_primary?: boolean }[]
  alt: string
  aspectRatio?: 'square' | '3/4'
  fallbackEmoji?: string
  className?: string
}

export default function ImageSlideshow({ 
  images, 
  alt, 
  aspectRatio = '3/4',
  fallbackEmoji = '👗',
  className 
}: ImageSlideshowProps) {
  const [currentIndex, setCurrentIndex] = useState(0)

  const hasMultipleImages = images && images.length > 1

  const goToPrevious = (e: React.MouseEvent) => {
    e.stopPropagation()
    setCurrentIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1))
  }

  const goToNext = (e: React.MouseEvent) => {
    e.stopPropagation()
    setCurrentIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1))
  }

  const goToIndex = (index: number, e: React.MouseEvent) => {
    e.stopPropagation()
    setCurrentIndex(index)
  }

  if (!images || images.length === 0) {
    return (
      <div className={cn(
        'w-full flex items-center justify-center bg-secondary/30 text-text-muted',
        aspectRatio === 'square' ? 'aspect-square' : 'aspect-[3/4]',
        className
      )}>
        <span className="text-4xl">{fallbackEmoji}</span>
      </div>
    )
  }

  return (
    <div className={cn(
      'relative w-full overflow-hidden group',
      aspectRatio === 'square' ? 'aspect-square' : 'aspect-[3/4]',
      className
    )}>
      {/* Current Image */}
      <img
        src={images[currentIndex]?.image_path}
        alt={alt}
        className="w-full h-full object-cover transition-opacity duration-300"
      />

      {/* Navigation Arrows - Only show if multiple images */}
      {hasMultipleImages && (
        <>
          {/* Previous Button */}
          <button
            onClick={goToPrevious}
            className="absolute left-2 top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-white/90 text-gray-800 shadow-md opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          {/* Next Button */}
          <button
            onClick={goToNext}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-white/90 text-gray-800 shadow-md opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white"
          >
            <ChevronRight className="w-4 h-4" />
          </button>

          {/* Dot Indicators */}
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5">
            {images.map((_, index) => (
              <button
                key={index}
                onClick={(e) => goToIndex(index, e)}
                className={cn(
                  'w-2 h-2 rounded-full transition-all',
                  index === currentIndex 
                    ? 'bg-white w-4' 
                    : 'bg-white/60 hover:bg-white/80'
                )}
              />
            ))}
          </div>
        </>
      )}

      {/* Image Counter */}
      {hasMultipleImages && (
        <div className="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-black/50 text-white text-xs">
          {currentIndex + 1}/{images.length}
        </div>
      )}
    </div>
  )
}

