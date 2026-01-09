import { useState, useCallback, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useDropzone } from 'react-dropzone'
import { Upload, X, Trash2 } from 'lucide-react'
import { productsAPI, categoriesAPI, sizesAPI } from '../../services/api'

interface ProductFormProps {
  product?: any
  defaultType: 'rent' | 'sale'
  onSuccess: () => void
}

export default function ProductForm({ product, defaultType, onSuccess }: ProductFormProps) {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  
  const [formData, setFormData] = useState({
    name: product?.name || '',
    type: product?.type || defaultType,
    category_name: product?.category?.name || '',
    size_name: product?.size?.name || '',
    color: product?.color || '',
    description: product?.description || '',
    status: product?.status || 'available',
    // Rental fields
    rental_price: product?.rental_price || '',
    deposit_amount: product?.deposit_amount || '',
    // Sale fields
    purchase_price: product?.purchase_price || '',
    sale_price: product?.sale_price || '',
    stock_quantity: product?.stock_quantity ?? '',
  })
  
  const [images, setImages] = useState<File[]>([])
  const [previews, setPreviews] = useState<string[]>([])
  const [existingImages, setExistingImages] = useState<any[]>(product?.images || [])
  const [deletingImageId, setDeletingImageId] = useState<number | null>(null)

  const isForSale = formData.type === 'sale'

  // Fetch categories for autocomplete
  const { data: categories } = useQuery({
    queryKey: ['categories', isForSale],
    queryFn: () => categoriesAPI.getAll({ is_for_sale: isForSale }),
  })

  // Fetch sizes for autocomplete
  const { data: sizes } = useQuery({
    queryKey: ['sizes', isForSale],
    queryFn: () => sizesAPI.getAll({ is_for_sale: isForSale }),
  })

  // Update default type when it changes
  useEffect(() => {
    if (!product) {
      setFormData((prev) => ({ ...prev, type: defaultType }))
    }
  }, [defaultType, product])

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
      return productsAPI.deleteImage(product.id, imageId)
    },
    onSuccess: (_, imageId) => {
      setExistingImages((prev) => prev.filter((img) => img.id !== imageId))
      queryClient.invalidateQueries({ queryKey: ['products'] })
    },
    onSettled: () => {
      setDeletingImageId(null)
    },
  })

  const uploadImagesMutation = useMutation({
    mutationFn: async (data: FormData) => productsAPI.uploadImages(product.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] })
    },
  })

  const createMutation = useMutation({
    mutationFn: async (data: FormData) => productsAPI.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] })
      onSuccess()
    },
  })

  const updateMutation = useMutation({
    mutationFn: async (data: FormData) => productsAPI.update(product.id, data),
    onSuccess: async () => {
      // Upload new images if any
      if (images.length > 0) {
        const imageFormData = new FormData()
        images.forEach((image) => imageFormData.append('images', image))
        await uploadImagesMutation.mutateAsync(imageFormData)
      }
      queryClient.invalidateQueries({ queryKey: ['products'] })
      onSuccess()
    },
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    const data = new FormData()
    data.append('name', formData.name)
    data.append('type', formData.type)
    if (formData.category_name) data.append('category_name', formData.category_name)
    if (formData.size_name) data.append('size_name', formData.size_name)
    if (formData.color) data.append('color', formData.color)
    if (formData.description) data.append('description', formData.description)
    if (product) data.append('status', formData.status)
    
    if (formData.type === 'rent') {
      if (formData.rental_price) data.append('rental_price', formData.rental_price.toString())
      if (formData.deposit_amount) data.append('deposit_amount', formData.deposit_amount.toString())
    } else {
      if (formData.purchase_price) data.append('purchase_price', formData.purchase_price.toString())
      if (formData.sale_price) data.append('sale_price', formData.sale_price.toString())
      if (formData.stock_quantity !== '') data.append('stock_quantity', formData.stock_quantity.toString())
    }
    
    if (!product) {
      images.forEach((image) => data.append('images', image))
      createMutation.mutate(data)
    } else {
      updateMutation.mutate(data)
    }
  }

  const isLoading = createMutation.isPending || updateMutation.isPending || uploadImagesMutation.isPending

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Product Type (only for new products) */}
      {!product && (
        <div>
          <label className="block text-sm font-medium text-text-primary mb-2">
            {t('products.type')} *
          </label>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setFormData({ ...formData, type: 'rent', category_name: '', size_name: '' })}
              className={`flex-1 p-3 rounded-xl border-2 transition-all ${
                formData.type === 'rent'
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'border-border hover:border-primary/50'
              }`}
            >
              <p className="text-sm font-medium">{t('products.typeRent')}</p>
            </button>
            <button
              type="button"
              onClick={() => setFormData({ ...formData, type: 'sale', category_name: '', size_name: '' })}
              className={`flex-1 p-3 rounded-xl border-2 transition-all ${
                formData.type === 'sale'
                  ? 'border-info bg-info/10 text-info'
                  : 'border-border hover:border-info/50'
              }`}
            >
              <p className="text-sm font-medium">{t('products.typeSale')}</p>
            </button>
          </div>
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-text-primary mb-2">
          {t('products.name')} *
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
            {t('products.category')}
          </label>
          <input
            type="text"
            list="categories-list"
            value={formData.category_name}
            onChange={(e) => setFormData({ ...formData, category_name: e.target.value })}
            className="input-field"
            placeholder={t('products.categoryPlaceholder')}
          />
          <datalist id="categories-list">
            {categories?.map((cat: any) => (
              <option key={cat.id} value={cat.name} />
            ))}
          </datalist>
        </div>
        <div>
          <label className="block text-sm font-medium text-text-primary mb-2">
            {t('products.size')}
          </label>
          <input
            type="text"
            list="sizes-list"
            value={formData.size_name}
            onChange={(e) => setFormData({ ...formData, size_name: e.target.value })}
            className="input-field"
            placeholder={t('products.sizePlaceholder')}
          />
          <datalist id="sizes-list">
            {sizes?.map((size: any) => (
              <option key={size.id} value={size.name} />
            ))}
          </datalist>
        </div>
        <div>
          <label className="block text-sm font-medium text-text-primary mb-2">
            {t('products.color')}
          </label>
          <input
            type="text"
            value={formData.color}
            onChange={(e) => setFormData({ ...formData, color: e.target.value })}
            className="input-field"
            placeholder="Blanc, Rose..."
          />
        </div>
      </div>

      {/* Type-specific fields */}
      {formData.type === 'rent' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">
              {t('products.rentalPrice')} (DZD) *
            </label>
            <input
              type="number"
              value={formData.rental_price}
              onChange={(e) => setFormData({ ...formData, rental_price: e.target.value })}
              className="input-field"
              min="0"
              step="any"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">
              {t('products.depositAmount')} (DZD) *
            </label>
            <input
              type="number"
              value={formData.deposit_amount}
              onChange={(e) => setFormData({ ...formData, deposit_amount: e.target.value })}
              className="input-field"
              min="0"
              step="any"
              required
            />
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">
              {t('products.purchasePrice')} (DZD)
            </label>
            <input
              type="number"
              value={formData.purchase_price}
              onChange={(e) => setFormData({ ...formData, purchase_price: e.target.value })}
              className="input-field"
              min="0"
              step="any"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">
              {t('products.salePrice')} (DZD) *
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
              {t('products.stockQuantity')} *
            </label>
            <input
              type="number"
              value={formData.stock_quantity}
              onChange={(e) => setFormData({ ...formData, stock_quantity: e.target.value })}
              className="input-field"
              min="0"
              required
            />
          </div>
        </div>
      )}

      {product && (
        <div>
          <label className="block text-sm font-medium text-text-primary mb-2">
            {t('products.status')}
          </label>
          <select
            value={formData.status}
            onChange={(e) => setFormData({ ...formData, status: e.target.value })}
            className="select-field"
          >
            <option value="available">{t('products.statuses.available')}</option>
            <option value="rented">{t('products.statuses.rented')}</option>
            <option value="maintenance">{t('products.statuses.maintenance')}</option>
            <option value="sold_out">{t('products.statuses.sold_out')}</option>
          </select>
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-text-primary mb-2">
          {t('products.description')}
        </label>
        <textarea
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          className="input-field min-h-[80px] resize-none"
          rows={2}
        />
      </div>

      {/* Existing Images (only in edit mode) */}
      {product && existingImages.length > 0 && (
        <div>
          <label className="block text-sm font-medium text-text-primary mb-2">
            {t('products.images')}
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
          {product ? t('products.uploadImages') : t('products.images')}
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
            {t('products.uploadImages')}
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

