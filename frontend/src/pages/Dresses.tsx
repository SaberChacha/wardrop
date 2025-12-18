import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Search, Edit, Trash2, Filter } from 'lucide-react'
import { dressesAPI } from '../services/api'
import { formatCurrency, getStatusColor } from '../lib/utils'
import Modal from '../components/ui/Modal'
import DressForm from '../components/forms/DressForm'
import ConfirmDialog from '../components/ui/ConfirmDialog'

const CATEGORIES = ['wedding', 'evening', 'engagement', 'traditional', 'other']
const STATUSES = ['available', 'rented', 'maintenance']

export default function Dresses() {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  
  const [search, setSearch] = useState('')
  const [filters, setFilters] = useState({ status: '', category: '' })
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingDress, setEditingDress] = useState<any>(null)
  const [deletingDress, setDeletingDress] = useState<any>(null)

  const { data, isLoading } = useQuery({
    queryKey: ['dresses', search, filters],
    queryFn: () => dressesAPI.getAll({
      search: search || undefined,
      status: filters.status || undefined,
      category: filters.category || undefined,
    }),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: number) => dressesAPI.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dresses'] })
      setDeletingDress(null)
    },
  })

  const handleEdit = (dress: any) => {
    setEditingDress(dress)
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setEditingDress(null)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-3xl font-heading font-semibold text-text-primary">
          {t('dresses.title')}
        </h1>
        <button
          onClick={() => setIsModalOpen(true)}
          className="btn-primary flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          {t('dresses.addDress')}
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t('common.search')}
            className="input-field pl-10"
          />
        </div>
        
        <div className="flex gap-2">
          <select
            value={filters.status}
            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
            className="select-field w-auto"
          >
            <option value="">{t('dresses.status')}</option>
            {STATUSES.map((status) => (
              <option key={status} value={status}>
                {t(`dresses.${status}`)}
              </option>
            ))}
          </select>
          
          <select
            value={filters.category}
            onChange={(e) => setFilters({ ...filters, category: e.target.value })}
            className="select-field w-auto"
          >
            <option value="">{t('dresses.category')}</option>
            {CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {t(`dresses.categories.${cat}`)}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent"></div>
        </div>
      ) : data?.dresses?.length === 0 ? (
        <div className="text-center py-12 text-text-secondary">
          {t('dresses.noDresses')}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {data?.dresses?.map((dress: any) => (
            <div
              key={dress.id}
              className="bg-surface rounded-xl border border-border overflow-hidden card-hover group"
            >
              {/* Image */}
              <div className="aspect-[3/4] relative bg-secondary/30">
                {dress.images?.[0] ? (
                  <img
                    src={dress.images[0].image_path}
                    alt={dress.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-text-muted">
                    <span className="text-4xl">👗</span>
                  </div>
                )}
                
                {/* Status badge */}
                <div className="absolute top-3 right-3">
                  <span className={`badge ${getStatusColor(dress.status)}`}>
                    {t(`dresses.${dress.status}`)}
                  </span>
                </div>

                {/* Actions overlay */}
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  <button
                    onClick={() => handleEdit(dress)}
                    className="p-3 rounded-full bg-white text-primary hover:bg-primary hover:text-white transition-colors"
                  >
                    <Edit className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => setDeletingDress(dress)}
                    className="p-3 rounded-full bg-white text-error hover:bg-error hover:text-white transition-colors"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Info */}
              <div className="p-4">
                <h3 className="font-semibold text-text-primary truncate">{dress.name}</h3>
                <p className="text-sm text-text-secondary">
                  {t(`dresses.categories.${dress.category}`)} • {dress.size} • {dress.color}
                </p>
                <div className="mt-3 flex items-center justify-between">
                  <span className="text-lg font-semibold text-primary">
                    {formatCurrency(dress.rental_price)}
                  </span>
                  <span className="text-sm text-text-muted">
                    {t('dresses.depositAmount')}: {formatCurrency(dress.deposit_amount)}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Dress Form Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title={editingDress ? t('dresses.editDress') : t('dresses.addDress')}
        size="lg"
      >
        <DressForm
          dress={editingDress}
          onSuccess={handleCloseModal}
        />
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={!!deletingDress}
        onClose={() => setDeletingDress(null)}
        onConfirm={() => deleteMutation.mutate(deletingDress.id)}
        title={t('common.confirmDelete')}
        message={`${deletingDress?.name}`}
        loading={deleteMutation.isPending}
      />
    </div>
  )
}

