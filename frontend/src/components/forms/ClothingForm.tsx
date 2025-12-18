import { useState, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useDropzone } from 'react-dropzone'
import { Upload, X } from 'lucide-react'
import { clothingAPI } from '../../services/api'

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
    sale_price: item?.sale_price || '',
    stock_quantity: item?.stock_quantity || 1,
    description: item?.description || '',
  })
  
  const [images, setImages] = useState<File[]>([])
  const [previews, setPreviews] = useState<string[]>([])

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

  const createMutation = useMutation({
    mutationFn: async (data: FormData) => clothingAPI.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clothing'] })
      onSuccess()
    },
  })

  const updateMutation = useMutation({
    mutationFn: async (data: any) => clothingAPI.update(item.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clothing'] })
      onSuccess()
    },
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (item) {
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

  const isLoading = createMutation.isPending || updateMutation.isPending

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

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
            step="100"
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

      {/* Image Upload */}
      {!item && (
        <div>
          <label className="block text-sm font-medium text-text-primary mb-2">
            {t('dresses.images')}
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
      )}

      {(createMutation.isError || updateMutation.isError) && (
        <p className="text-error text-sm">Une erreur est survenue</p>
      )}

      <div className="flex justify-end gap-3 pt-4">
        <button type="submit" disabled={isLoading} className="btn-primary">
          {isLoading ? t('common.loading') : t('common.save')}
        </button>
      </div>
    </form>
  )
}

