import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Search, Edit, Trash2, AlertTriangle, CheckSquare, Square, XCircle } from 'lucide-react'
import { clothingAPI } from '../services/api'
import { formatCurrency, cn } from '../lib/utils'
import Modal from '../components/ui/Modal'
import ClothingForm from '../components/forms/ClothingForm'
import ConfirmDialog from '../components/ui/ConfirmDialog'
import ImageSlideshow from '../components/ui/ImageSlideshow'
import Pagination from '../components/ui/Pagination'
import SortDropdown from '../components/ui/SortDropdown'

export default function Clothing() {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  
  const [search, setSearch] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<any>(null)
  const [deletingItem, setDeletingItem] = useState<any>(null)

  // Bulk selection state
  const [selectedItems, setSelectedItems] = useState<Set<number>>(new Set())
  const [isBulkDeleteOpen, setIsBulkDeleteOpen] = useState(false)

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(12)
  
  // Sorting state
  const [sortBy, setSortBy] = useState('created_at')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')

  const sortOptions = [
    { value: 'created_at', label: t('sort.dateAdded', { defaultValue: 'Date Added' }) },
    { value: 'name', label: t('sort.name', { defaultValue: 'Name' }) },
    { value: 'sale_price', label: t('sort.price', { defaultValue: 'Price' }) },
  ]

  const { data, isLoading } = useQuery({
    queryKey: ['clothing', search, currentPage, pageSize, sortBy, sortOrder],
    queryFn: () => clothingAPI.getAll({
      skip: (currentPage - 1) * pageSize,
      limit: pageSize,
      search: search || undefined,
      sort_by: sortBy,
      sort_order: sortOrder,
    }),
  })

  const totalPages = Math.ceil((data?.total || 0) / pageSize)

  const handlePageChange = (page: number) => setCurrentPage(page)
  const handlePageSizeChange = (size: number) => { setPageSize(size); setCurrentPage(1); }
  const handleSortChange = (newSortBy: string, newSortOrder: 'asc' | 'desc') => {
    setSortBy(newSortBy); setSortOrder(newSortOrder); setCurrentPage(1);
  }

  const deleteMutation = useMutation({
    mutationFn: (id: number) => clothingAPI.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clothing'] })
      setDeletingItem(null)
    },
  })

  const bulkDeleteMutation = useMutation({
    mutationFn: async (ids: number[]) => {
      await Promise.all(ids.map(id => clothingAPI.delete(id)))
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clothing'] })
      setSelectedItems(new Set())
      setIsBulkDeleteOpen(false)
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

  const toggleSelection = (id: number, e: React.MouseEvent) => {
    e.stopPropagation()
    const newSelected = new Set(selectedItems)
    if (newSelected.has(id)) {
      newSelected.delete(id)
    } else {
      newSelected.add(id)
    }
    setSelectedItems(newSelected)
  }

  const toggleSelectAll = () => {
    if (selectedItems.size === data?.items?.length) {
      setSelectedItems(new Set())
    } else {
      setSelectedItems(new Set(data?.items?.map((item: any) => item.id) || []))
    }
  }

  const clearSelection = () => {
    setSelectedItems(new Set())
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
        <div className="flex items-center gap-2">
          {selectedItems.size > 0 && (
            <>
              <span className="text-sm text-text-secondary">
                {selectedItems.size} {t('common.selected', { defaultValue: 'selected' })}
              </span>
              <button
                onClick={clearSelection}
                className="p-2 rounded-lg hover:bg-surface-hover text-text-secondary"
                title={t('common.cancel')}
              >
                <XCircle className="w-5 h-5" />
              </button>
              <button
                onClick={() => setIsBulkDeleteOpen(true)}
                className="btn-primary bg-error hover:bg-error/90 flex items-center gap-2"
              >
                <Trash2 className="w-5 h-5" />
                {t('common.delete')} ({selectedItems.size})
              </button>
            </>
          )}
          <button
            onClick={() => setIsModalOpen(true)}
            className="btn-primary flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            {t('clothing.addItem')}
          </button>
        </div>
      </div>

      {/* Search and Sort */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted" />
          <input
            type="text"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
            placeholder={t('common.search')}
            className="input-field pl-10"
          />
        </div>
        <div className="flex items-center gap-2">
          {data?.items?.length > 0 && (
            <button
              onClick={toggleSelectAll}
              className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-surface-hover text-text-secondary text-sm"
            >
              {selectedItems.size === data?.items?.length ? (
                <CheckSquare className="w-4 h-4 text-primary" />
              ) : (
                <Square className="w-4 h-4" />
              )}
              {t('common.all', { defaultValue: 'All' })}
            </button>
          )}
          <SortDropdown
            options={sortOptions}
            sortBy={sortBy}
            sortOrder={sortOrder}
            onSortChange={handleSortChange}
          />
        </div>
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
        <>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {data?.items?.map((item: any) => {
            const stockStatus = getStockStatus(item.stock_quantity)
            return (
              <div
                key={item.id}
                className={cn(
                  "bg-surface rounded-xl border overflow-hidden card-hover group relative",
                  selectedItems.has(item.id) ? "border-primary ring-2 ring-primary/20" : "border-border"
                )}
              >
                {/* Selection Checkbox */}
                <button
                  onClick={(e) => toggleSelection(item.id, e)}
                  className="absolute top-3 left-3 z-40 p-1 rounded bg-white/90 shadow-sm hover:bg-white transition-colors"
                >
                  {selectedItems.has(item.id) ? (
                    <CheckSquare className="w-5 h-5 text-primary" />
                  ) : (
                    <Square className="w-5 h-5 text-gray-400" />
                  )}
                </button>

                {/* Image Slideshow */}
                <div className="relative">
                  <ImageSlideshow
                    images={item.images || []}
                    alt={item.name}
                    aspectRatio="square"
                    fallbackEmoji="👔"
                  />

                  {/* Stock badge */}
                  <div className="absolute top-3 right-3 z-10">
                    <span className={cn('badge', stockStatus.class)}>
                      {stockStatus.label}
                    </span>
                  </div>

                  {/* Low stock warning */}
                  {item.stock_quantity > 0 && item.stock_quantity < 3 && (
                    <div className="absolute top-12 left-3 z-10">
                      <AlertTriangle className="w-5 h-5 text-warning" />
                    </div>
                  )}

                  {/* Actions overlay */}
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 z-20">
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
        
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={data?.total || 0}
          pageSize={pageSize}
          onPageChange={handlePageChange}
          onPageSizeChange={handlePageSizeChange}
        />
        </>
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

      {/* Bulk Delete Confirmation */}
      <ConfirmDialog
        isOpen={isBulkDeleteOpen}
        onClose={() => setIsBulkDeleteOpen(false)}
        onConfirm={() => bulkDeleteMutation.mutate(Array.from(selectedItems))}
        title={t('common.confirmDelete')}
        message={`${selectedItems.size} ${t('clothing.title', { defaultValue: 'items' })}`}
        loading={bulkDeleteMutation.isPending}
      />
    </div>
  )
}

