import { useState, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useDropzone } from 'react-dropzone'
import { Upload, X, Trash2 } from 'lucide-react'
import { clothingAPI } from '../../services/api'

// No API_URL needed for uploads - they're served at /uploads/ directly

interface ClothingFormProps {
  item?: any
  onSuccess: () => void
}

const SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL', '34', '36', '38', '40', '42', '44', '46']

export default function ClothingForm({ item, onSuccess }: ClothingFormProps) {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  
  const [formData, setFormData] = useState({
    name: item?.name || '',
    category: item?.category || '',
    size: item?.size || 'M',
    color: item?.color || '',
    purchase_price: item?.purchase_price || '',
    sale_price: item?.sale_price || '',
    stock_quantity: item?.stock_quantity || 1,
    description: item?.description || '',
  })
  
  const [images, setImages] = useState<File[]>([])
  const [previews, setPreviews] = useState<string[]>([])
  const [existingImages, setExistingImages] = useState<any[]>(item?.images || [])
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
      return clothingAPI.deleteImage(item.id, imageId)
    },
    onSuccess: (_, imageId) => {
      setExistingImages((prev) => prev.filter((img) => img.id !== imageId))
      queryClient.invalidateQueries({ queryKey: ['clothing'] })
    },
    onSettled: () => {
      setDeletingImageId(null)
    },
  })

  const uploadImagesMutation = useMutation({
    mutationFn: async (formData: FormData) => clothingAPI.uploadImages(item.id, formData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clothing'] })
    },
  })

  const createMutation = useMutation({
    mutationFn: async (data: FormData) => clothingAPI.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clothing'] })
      onSuccess()
    },
  })

  const updateMutation = useMutation({
    mutationFn: async (data: any) => clothingAPI.update(item.id, data),
    onSuccess: async () => {
      // Upload new images if any
      if (images.length > 0) {
        const imageFormData = new FormData()
        images.forEach((image) => imageFormData.append('images', image))
        await uploadImagesMutation.mutateAsync(imageFormData)
      }
      queryClient.invalidateQueries({ queryKey: ['clothing'] })
      onSuccess()
    },
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (item) {
      // Clean up the data - convert empty strings to null for optional fields
      const cleanData = {
        ...formData,
        purchase_price: formData.purchase_price === '' ? null : Number(formData.purchase_price),
        sale_price: Number(formData.sale_price),
        stock_quantity: Number(formData.stock_quantity),
        description: formData.description || null,
      }
      updateMutation.mutate(cleanData)
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
          {t('clothing.name')} *
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
            {t('clothing.category')} *
          </label>
          <input
            type="text"
            value={formData.category}
            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
            className="input-field"
            placeholder="Robe, Accessoires..."
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-text-primary mb-2">
            {t('clothing.size')} *
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
            {t('clothing.color')} *
          </label>
          <input
            type="text"
            value={formData.color}
            onChange={(e) => setFormData({ ...formData, color: e.target.value })}
            className="input-field"
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-text-primary mb-2">
            {t('clothing.purchasePrice')} (DZD)
          </label>
          <input
            type="number"
            value={formData.purchase_price}
            onChange={(e) => setFormData({ ...formData, purchase_price: e.target.value })}
            className="input-field"
            min="0"
            step="any"
            placeholder={t('clothing.purchasePricePlaceholder')}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-text-primary mb-2">
            {t('clothing.salePrice')} (DZD) *
          </label>
          <input
            type="number"
            value={formData.sale_price}
            onChange={(e) => setFormData({ ...formData, sale_price: e.target.value })}
            className="input-field"
            min="0"
            step="any"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-text-primary mb-2">
            {t('clothing.stockQuantity')} *
          </label>
          <input
            type="number"
            value={formData.stock_quantity}
            onChange={(e) => setFormData({ ...formData, stock_quantity: parseInt(e.target.value) })}
            className="input-field"
            min="0"
            required
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-text-primary mb-2">
          {t('clothing.description')}
        </label>
        <textarea
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          className="input-field min-h-[80px] resize-none"
          rows={2}
        />
      </div>

      {/* Existing Images (only in edit mode) */}
      {item && existingImages.length > 0 && (
        <div>
          <label className="block text-sm font-medium text-text-primary mb-2">
            {t('dresses.images')}
          </label>
          <div className="flex flex-wrap gap-3">
            {existingImages.map((image) => (
              <div key={image.id} className="relative group">
                <img
                  src={image.image_path}
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
          {item ? t('dresses.uploadImages') : t('dresses.images')}
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
