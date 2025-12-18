import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Search, Edit, Trash2, AlertTriangle } from 'lucide-react'
import { clothingAPI } from '../services/api'
import { formatCurrency, cn } from '../lib/utils'
import Modal from '../components/ui/Modal'
import ClothingForm from '../components/forms/ClothingForm'
import ConfirmDialog from '../components/ui/ConfirmDialog'

export default function Clothing() {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  
  const [search, setSearch] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<any>(null)
  const [deletingItem, setDeletingItem] = useState<any>(null)

  const { data, isLoading } = useQuery({
    queryKey: ['clothing', search],
    queryFn: () => clothingAPI.getAll({ search: search || undefined }),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: number) => clothingAPI.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clothing'] })
      setDeletingItem(null)
    },
  })

  const handleEdit = (item: any) => {
    setEditingItem(item)
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setEditingItem(null)
  }

  const getStockStatus = (qty: number) => {
    if (qty === 0) return { label: t('clothing.outOfStock'), class: 'badge-error' }
    if (qty < 3) return { label: t('clothing.lowStock'), class: 'badge-warning' }
    return { label: t('clothing.inStock'), class: 'badge-success' }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-3xl font-heading font-semibold text-text-primary">
          {t('clothing.title')}
        </h1>
        <button
          onClick={() => setIsModalOpen(true)}
          className="btn-primary flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          {t('clothing.addItem')}
        </button>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t('common.search')}
          className="input-field pl-10"
        />
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent"></div>
        </div>
      ) : data?.items?.length === 0 ? (
        <div className="text-center py-12 text-text-secondary">
          {t('clothing.noItems')}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {data?.items?.map((item: any) => {
            const stockStatus = getStockStatus(item.stock_quantity)
            return (
              <div
                key={item.id}
                className="bg-surface rounded-xl border border-border overflow-hidden card-hover group"
              >
                {/* Image */}
                <div className="aspect-square relative bg-secondary/30">
                  {item.images?.[0] ? (
                    <img
                      src={item.images[0].image_path}
                      alt={item.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-text-muted">
                      <span className="text-4xl">👔</span>
                    </div>
                  )}

                  {/* Stock badge */}
                  <div className="absolute top-3 right-3">
                    <span className={cn('badge', stockStatus.class)}>
                      {stockStatus.label}
                    </span>
                  </div>

                  {/* Low stock warning */}
                  {item.stock_quantity > 0 && item.stock_quantity < 3 && (
                    <div className="absolute top-3 left-3">
                      <AlertTriangle className="w-5 h-5 text-warning" />
                    </div>
                  )}

                  {/* Actions overlay */}
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <button
                      onClick={() => handleEdit(item)}
                      className="p-3 rounded-full bg-white text-primary hover:bg-primary hover:text-white transition-colors"
                    >
                      <Edit className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => setDeletingItem(item)}
                      className="p-3 rounded-full bg-white text-error hover:bg-error hover:text-white transition-colors"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                {/* Info */}
                <div className="p-4">
                  <h3 className="font-semibold text-text-primary truncate">{item.name}</h3>
                  <p className="text-sm text-text-secondary">
                    {item.category} • {item.size} • {item.color}
                  </p>
                  <div className="mt-3 flex items-center justify-between">
                    <span className="text-lg font-semibold text-primary">
                      {formatCurrency(item.sale_price)}
                    </span>
                    <span className="text-sm text-text-muted">
                      Stock: {item.stock_quantity}
                    </span>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Clothing Form Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title={editingItem ? t('clothing.editItem') : t('clothing.addItem')}
        size="lg"
      >
        <ClothingForm
          item={editingItem}
          onSuccess={handleCloseModal}
        />
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={!!deletingItem}
        onClose={() => setDeletingItem(null)}
        onConfirm={() => deleteMutation.mutate(deletingItem.id)}
        title={t('common.confirmDelete')}
        message={`${deletingItem?.name}`}
        loading={deleteMutation.isPending}
      />
    </div>
  )
}

