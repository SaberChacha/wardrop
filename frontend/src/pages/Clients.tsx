import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Search, Trash2, Phone, MessageCircle } from 'lucide-react'
import { clientsAPI } from '../services/api'
import { formatDate } from '../lib/utils'
import Modal from '../components/ui/Modal'
import ClientForm from '../components/forms/ClientForm'
import ConfirmDialog from '../components/ui/ConfirmDialog'
import Pagination from '../components/ui/Pagination'
import SortDropdown from '../components/ui/SortDropdown'

export default function Clients() {
  const { t, i18n } = useTranslation()
  const queryClient = useQueryClient()
  
  const [search, setSearch] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingClient, setEditingClient] = useState<any>(null)
  const [deletingClient, setDeletingClient] = useState<any>(null)
  const [selectedClient, setSelectedClient] = useState<any>(null)

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(25)
  
  // Sorting state
  const [sortBy, setSortBy] = useState('created_at')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')

  const sortOptions = [
    { value: 'created_at', label: t('sort.dateAdded', { defaultValue: 'Date Added' }) },
    { value: 'full_name', label: t('sort.name', { defaultValue: 'Name' }) },
  ]

  const { data, isLoading } = useQuery({
    queryKey: ['clients', search, currentPage, pageSize, sortBy, sortOrder],
    queryFn: () => clientsAPI.getAll({
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
    mutationFn: (id: number) => clientsAPI.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] })
      setDeletingClient(null)
    },
  })

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setEditingClient(null)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-3xl font-heading font-semibold text-text-primary">
          {t('clients.title')}
        </h1>
        <button
          onClick={() => setIsModalOpen(true)}
          className="btn-primary flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          {t('clients.addClient')}
        </button>
      </div>

      {/* Search and Sort */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted" />
          <input
            type="text"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
            placeholder={t('clients.searchPlaceholder')}
            className="input-field pl-10"
          />
        </div>
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
      ) : data?.clients?.length === 0 ? (
        <div className="text-center py-12 text-text-secondary">
          {t('clients.noClients')}
        </div>
      ) : (
        <>
        <div className="table-container">
          <table className="w-full">
            <thead>
              <tr className="table-header">
                <th className="px-4 py-3 text-left">{t('clients.fullName')}</th>
                <th className="px-4 py-3 text-left">{t('clients.phone')}</th>
                <th className="px-4 py-3 text-left">{t('clients.whatsapp')}</th>
                <th className="px-4 py-3 text-left hidden md:table-cell">{t('clients.address')}</th>
              </tr>
            </thead>
            <tbody>
              {data?.clients?.map((client: any) => (
                <tr 
                  key={client.id} 
                  className="table-row cursor-pointer hover:bg-primary/5"
                  onDoubleClick={() => setSelectedClient(client)}
                >
                  <td className="px-4 py-3">
                    <div>
                      <p className="font-medium text-text-primary">{client.full_name}</p>
                      <p className="text-xs text-text-muted">
                        {formatDate(client.created_at, i18n.language)}
                      </p>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    {client.phone && (
                      <a 
                        href={`tel:${client.phone}`} 
                        className="flex items-center gap-1 text-text-secondary hover:text-primary"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Phone className="w-4 h-4" />
                        {client.phone}
                      </a>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {client.whatsapp && (
                      <a
                        href={`https://wa.me/${client.whatsapp.replace(/[^0-9]/g, '')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-success hover:text-success/80"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <MessageCircle className="w-4 h-4" />
                        {client.whatsapp}
                      </a>
                    )}
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell text-text-secondary">
                    {client.address || '-'}
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

      {/* Client Form Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title={editingClient ? t('clients.editClient') : t('clients.addClient')}
      >
        <ClientForm
          client={editingClient}
          onSuccess={handleCloseModal}
        />
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={!!deletingClient}
        onClose={() => setDeletingClient(null)}
        onConfirm={() => deleteMutation.mutate(deletingClient.id)}
        title={t('common.confirmDelete')}
        message={`${deletingClient?.full_name}`}
        loading={deleteMutation.isPending}
      />

      {/* Client Detail Modal */}
      <Modal
        isOpen={!!selectedClient}
        onClose={() => setSelectedClient(null)}
        title={t('clients.editClient')}
      >
        <div className="relative">
          <ClientForm
            client={selectedClient}
            onSuccess={() => setSelectedClient(null)}
          />
          <div className="mt-4 pt-4 border-t border-border flex justify-between">
            <button
              onClick={() => { setDeletingClient(selectedClient); setSelectedClient(null); }}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-error text-white hover:bg-error/90 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              {t('common.delete')}
            </button>
            <button
              onClick={() => setSelectedClient(null)}
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

