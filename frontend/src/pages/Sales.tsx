import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Trash2 } from 'lucide-react'
import { salesAPI } from '../services/api'
import { formatCurrency, formatDate } from '../lib/utils'
import Modal from '../components/ui/Modal'
import SaleForm from '../components/forms/SaleForm'
import ConfirmDialog from '../components/ui/ConfirmDialog'
import Pagination from '../components/ui/Pagination'
import SortDropdown from '../components/ui/SortDropdown'

export default function Sales() {
  const { t, i18n } = useTranslation()
  const queryClient = useQueryClient()
  
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingSale, setEditingSale] = useState<any>(null)
  const [deletingSale, setDeletingSale] = useState<any>(null)
  const [selectedSale, setSelectedSale] = useState<any>(null)
  const [dateFilters, setDateFilters] = useState({ startDate: '', endDate: '' })

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(25)
  
  // Sorting state
  const [sortBy, setSortBy] = useState('sale_date')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')

  const sortOptions = [
    { value: 'sale_date', label: t('sort.saleDate', { defaultValue: 'Sale Date' }) },
    { value: 'total_price', label: t('sort.total', { defaultValue: 'Total' }) },
    { value: 'created_at', label: t('sort.dateAdded', { defaultValue: 'Date Added' }) },
  ]

  const { data, isLoading } = useQuery({
    queryKey: ['sales', dateFilters, currentPage, pageSize, sortBy, sortOrder],
    queryFn: () => salesAPI.getAll({
      skip: (currentPage - 1) * pageSize,
      limit: pageSize,
      start_date: dateFilters.startDate || undefined,
      end_date: dateFilters.endDate || undefined,
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
    mutationFn: (id: number) => salesAPI.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sales'] })
      queryClient.invalidateQueries({ queryKey: ['clothing'] })
      setDeletingSale(null)
    },
  })

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setEditingSale(null)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-3xl font-heading font-semibold text-text-primary">
          {t('sales.title')}
        </h1>
        <button
          onClick={() => setIsModalOpen(true)}
          className="btn-primary flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          {t('sales.addSale')}
        </button>
      </div>

      {/* Filters and Sort */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="flex items-center gap-2">
          <input
            type="date"
            value={dateFilters.startDate}
            onChange={(e) => { setDateFilters({ ...dateFilters, startDate: e.target.value }); setCurrentPage(1); }}
            className="input-field w-auto"
            placeholder={t('common.from')}
          />
          <span className="text-text-muted">-</span>
          <input
            type="date"
            value={dateFilters.endDate}
            onChange={(e) => { setDateFilters({ ...dateFilters, endDate: e.target.value }); setCurrentPage(1); }}
            className="input-field w-auto"
            placeholder={t('common.to')}
          />
          {(dateFilters.startDate || dateFilters.endDate) && (
            <button
              onClick={() => { setDateFilters({ startDate: '', endDate: '' }); setCurrentPage(1); }}
              className="text-sm text-text-muted hover:text-error transition-colors"
            >
              {t('common.clear')}
            </button>
          )}
        </div>

        <div className="flex-1"></div>

        <SortDropdown
          options={sortOptions}
          sortBy={sortBy}
          sortOrder={sortOrder}
          onSortChange={handleSortChange}
        />
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent"></div>
        </div>
      ) : data?.sales?.length === 0 ? (
        <div className="text-center py-12 text-text-secondary">
          {t('sales.noSales')}
        </div>
      ) : (
        <>
        <div className="table-container">
          <table className="w-full">
            <thead>
              <tr className="table-header">
                <th className="px-4 py-3 text-left">{t('sales.client')}</th>
                <th className="px-4 py-3 text-left">{t('sales.item')}</th>
                <th className="px-4 py-3 text-left">{t('sales.quantity')}</th>
                <th className="px-4 py-3 text-left">{t('sales.unitPrice')}</th>
                <th className="px-4 py-3 text-left">{t('sales.totalPrice')}</th>
                <th className="px-4 py-3 text-left">{t('sales.saleDate')}</th>
              </tr>
            </thead>
            <tbody>
              {data?.sales?.map((sale: any) => (
                <tr 
                  key={sale.id} 
                  className="table-row cursor-pointer hover:bg-primary/5"
                  onDoubleClick={() => setSelectedSale(sale)}
                >
                  <td className="px-4 py-3 font-medium text-text-primary">
                    {sale.client?.full_name}
                  </td>
                  <td className="px-4 py-3 text-text-secondary">
                    {sale.clothing?.name}
                  </td>
                  <td className="px-4 py-3 text-text-secondary">
                    {sale.quantity}
                  </td>
                  <td className="px-4 py-3 text-text-secondary">
                    {formatCurrency(sale.unit_price)}
                  </td>
                  <td className="px-4 py-3 font-medium text-primary">
                    {formatCurrency(sale.total_price)}
                  </td>
                  <td className="px-4 py-3 text-text-secondary">
                    {formatDate(sale.sale_date, i18n.language)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
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

      {/* Sale Form Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title={editingSale ? t('sales.editSale') : t('sales.addSale')}
        size="lg"
      >
        <SaleForm
          sale={editingSale}
          onSuccess={handleCloseModal}
        />
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={!!deletingSale}
        onClose={() => setDeletingSale(null)}
        onConfirm={() => deleteMutation.mutate(deletingSale.id)}
        title={t('common.confirmDelete')}
        message={`${deletingSale?.client?.full_name} - ${deletingSale?.clothing?.name}`}
        loading={deleteMutation.isPending}
      />

      {/* Sale Detail Modal */}
      <Modal
        isOpen={!!selectedSale}
        onClose={() => setSelectedSale(null)}
        title={t('sales.editSale')}
        size="lg"
      >
        <div className="relative">
          <SaleForm
            sale={selectedSale}
            onSuccess={() => setSelectedSale(null)}
          />
          <div className="mt-4 pt-4 border-t border-border flex justify-between">
            <button
              onClick={() => { setDeletingSale(selectedSale); setSelectedSale(null); }}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-error text-white hover:bg-error/90 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              {t('common.delete')}
            </button>
            <button
              onClick={() => setSelectedSale(null)}
              className="btn-secondary"
            >
              {t('common.close')}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

