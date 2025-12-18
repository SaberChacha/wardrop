import { useState, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useDropzone } from 'react-dropzone'
import { Upload, X, Trash2 } from 'lucide-react'
import { dressesAPI } from '../../services/api'

const API_URL = import.meta.env.VITE_API_URL || ''

interface DressFormProps {
  dress?: any
  onSuccess: () => void
}

const CATEGORIES = ['wedding', 'evening', 'engagement', 'traditional', 'other']
const SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL', '34', '36', '38', '40', '42', '44', '46']

export default function DressForm({ dress, onSuccess }: DressFormProps) {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  
  const [formData, setFormData] = useState({
    name: dress?.name || '',
    category: dress?.category || 'wedding',
    size: dress?.size || 'M',
    color: dress?.color || '',
    rental_price: dress?.rental_price || '',
    deposit_amount: dress?.deposit_amount || '',
    description: dress?.description || '',
    status: dress?.status || 'available',
  })
  
  const [images, setImages] = useState<File[]>([])
  const [previews, setPreviews] = useState<string[]>([])
  const [existingImages, setExistingImages] = useState<any[]>(dress?.images || [])
  const [deletingImageId, setDeletingImageId] = useState<number | null>(null)

  const onDrop = useCallback((acceptedFiles: File[]) => {
    setImages((prev) => [...prev, ...acceptedFiles])
    const newPreviews = acceptedFiles.map((file) => URL.createObjectURL(file))
    setPreviews((prev) => [...prev, ...newPreviews])
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': ['.jpeg', '.jpg', '.png', '.webp'] },
    maxFiles: 5,
  })

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index))
    setPreviews((prev) => prev.filter((_, i) => i !== index))
  }

  const deleteExistingImageMutation = useMutation({
    mutationFn: async (imageId: number) => {
      setDeletingImageId(imageId)
      return dressesAPI.deleteImage(dress.id, imageId)
    },
    onSuccess: (_, imageId) => {
      setExistingImages((prev) => prev.filter((img) => img.id !== imageId))
      queryClient.invalidateQueries({ queryKey: ['dresses'] })
    },
    onSettled: () => {
      setDeletingImageId(null)
    },
  })

  const uploadImagesMutation = useMutation({
    mutationFn: async (formData: FormData) => dressesAPI.uploadImages(dress.id, formData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dresses'] })
    },
  })

  const createMutation = useMutation({
    mutationFn: async (data: FormData) => dressesAPI.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dresses'] })
      onSuccess()
    },
  })

  const updateMutation = useMutation({
    mutationFn: async (data: any) => dressesAPI.update(dress.id, data),
    onSuccess: async () => {
      // Upload new images if any
      if (images.length > 0) {
        const imageFormData = new FormData()
        images.forEach((image) => imageFormData.append('images', image))
        await uploadImagesMutation.mutateAsync(imageFormData)
      }
      queryClient.invalidateQueries({ queryKey: ['dresses'] })
      onSuccess()
    },
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (dress) {
      updateMutation.mutate(formData)
    } else {
      const data = new FormData()
      Object.entries(formData).forEach(([key, value]) => {
        if (value !== '') data.append(key, value.toString())
      })
      images.forEach((image) => data.append('images', image))
      createMutation.mutate(data)
    }
  }

  const isLoading = createMutation.isPending || updateMutation.isPending || uploadImagesMutation.isPending

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-text-primary mb-2">
          {t('dresses.name')} *
        </label>
        <input
          type="text"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          className="input-field"
          required
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-text-primary mb-2">
            {t('dresses.category')} *
          </label>
          <select
            value={formData.category}
            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
            className="select-field"
            required
          >
            {CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {t(`dresses.categories.${cat}`)}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-text-primary mb-2">
            {t('dresses.size')} *
          </label>
          <select
            value={formData.size}
            onChange={(e) => setFormData({ ...formData, size: e.target.value })}
            className="select-field"
            required
          >
            {SIZES.map((size) => (
              <option key={size} value={size}>{size}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-text-primary mb-2">
            {t('dresses.color')} *
          </label>
          <input
            type="text"
            value={formData.color}
            onChange={(e) => setFormData({ ...formData, color: e.target.value })}
            className="input-field"
            placeholder="Blanc, Rose..."
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-text-primary mb-2">
            {t('dresses.rentalPrice')} (DZD) *
          </label>
          <input
            type="number"
            value={formData.rental_price}
            onChange={(e) => setFormData({ ...formData, rental_price: e.target.value })}
            className="input-field"
            min="0"
            step="100"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-text-primary mb-2">
            {t('dresses.depositAmount')} (DZD) *
          </label>
          <input
            type="number"
            value={formData.deposit_amount}
            onChange={(e) => setFormData({ ...formData, deposit_amount: e.target.value })}
            className="input-field"
            min="0"
            step="100"
            required
          />
        </div>
      </div>

      {dress && (
        <div>
          <label className="block text-sm font-medium text-text-primary mb-2">
            {t('dresses.status')}
          </label>
          <select
            value={formData.status}
            onChange={(e) => setFormData({ ...formData, status: e.target.value })}
            className="select-field"
          >
            <option value="available">{t('dresses.available')}</option>
            <option value="rented">{t('dresses.rented')}</option>
            <option value="maintenance">{t('dresses.maintenance')}</option>
          </select>
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-text-primary mb-2">
          {t('dresses.description')}
        </label>
        <textarea
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          className="input-field min-h-[80px] resize-none"
          rows={2}
        />
      </div>

      {/* Existing Images (only in edit mode) */}
      {dress && existingImages.length > 0 && (
        <div>
          <label className="block text-sm font-medium text-text-primary mb-2">
            {t('dresses.images')}
          </label>
          <div className="flex flex-wrap gap-3">
            {existingImages.map((image) => (
              <div key={image.id} className="relative group">
                <img
                  src={`${API_URL}${image.image_path}`}
                  alt=""
                  className="w-24 h-24 object-cover rounded-lg border border-border"
                />
                <button
                  type="button"
                  onClick={() => deleteExistingImageMutation.mutate(image.id)}
                  disabled={deletingImageId === image.id}
                  className="absolute -top-2 -right-2 p-1.5 bg-error text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-50"
                >
                  {deletingImageId === image.id ? (
                    <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <Trash2 className="w-3 h-3" />
                  )}
                </button>
                {image.is_primary && (
                  <span className="absolute bottom-1 left-1 px-1.5 py-0.5 bg-primary text-white text-xs rounded">
                    Primary
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Image Upload */}
      <div>
        <label className="block text-sm font-medium text-text-primary mb-2">
          {dress ? t('dresses.uploadImages') : t('dresses.images')}
        </label>
        
        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors ${
            isDragActive ? 'border-primary bg-primary/5' : 'border-border hover:border-primary'
          }`}
        >
          <input {...getInputProps()} />
          <Upload className="w-8 h-8 mx-auto text-text-muted mb-2" />
          <p className="text-sm text-text-secondary">
            {t('dresses.uploadImages')}
          </p>
        </div>

        {previews.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-4">
            {previews.map((preview, index) => (
              <div key={index} className="relative group">
                <img
                  src={preview}
                  alt={`Preview ${index + 1}`}
                  className="w-20 h-20 object-cover rounded-lg"
                />
                <button
                  type="button"
                  onClick={() => removeImage(index)}
                  className="absolute -top-2 -right-2 p-1 bg-error text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {(createMutation.isError || updateMutation.isError) && (
        <p className="text-error text-sm">{t('common.error')}</p>
      )}

      <div className="flex justify-end gap-3 pt-4">
        <button type="submit" disabled={isLoading} className="btn-primary">
          {isLoading ? t('common.loading') : t('common.save')}
        </button>
      </div>
    </form>
  )
}
