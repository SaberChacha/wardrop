import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Search, Edit, Trash2, Phone, MessageCircle } from 'lucide-react'
import { clientsAPI } from '../services/api'
import { formatDate } from '../lib/utils'
import Modal from '../components/ui/Modal'
import ClientForm from '../components/forms/ClientForm'
import ConfirmDialog from '../components/ui/ConfirmDialog'

export default function Clients() {
  const { t, i18n } = useTranslation()
  const queryClient = useQueryClient()
  
  const [search, setSearch] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingClient, setEditingClient] = useState<any>(null)
  const [deletingClient, setDeletingClient] = useState<any>(null)

  const { data, isLoading } = useQuery({
    queryKey: ['clients', search],
    queryFn: () => clientsAPI.getAll({ search: search || undefined }),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: number) => clientsAPI.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] })
      setDeletingClient(null)
    },
  })

  const handleEdit = (client: any) => {
    setEditingClient(client)
    setIsModalOpen(true)
  }

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

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t('clients.searchPlaceholder')}
          className="input-field pl-10"
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
        <div className="table-container">
          <table className="w-full">
            <thead>
              <tr className="table-header">
                <th className="px-4 py-3 text-left">{t('clients.fullName')}</th>
                <th className="px-4 py-3 text-left">{t('clients.phone')}</th>
                <th className="px-4 py-3 text-left">{t('clients.whatsapp')}</th>
                <th className="px-4 py-3 text-left hidden md:table-cell">{t('clients.address')}</th>
                <th className="px-4 py-3 text-right">{t('common.actions')}</th>
              </tr>
            </thead>
            <tbody>
              {data?.clients?.map((client: any) => (
                <tr key={client.id} className="table-row">
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
                      <a href={`tel:${client.phone}`} className="flex items-center gap-1 text-text-secondary hover:text-primary">
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
                      >
                        <MessageCircle className="w-4 h-4" />
                        {client.whatsapp}
                      </a>
                    )}
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell text-text-secondary">
                    {client.address || '-'}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => handleEdit(client)}
                        className="p-2 rounded-lg text-text-secondary hover:bg-primary/10 hover:text-primary transition-colors"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setDeletingClient(client)}
                        className="p-2 rounded-lg text-text-secondary hover:bg-error/10 hover:text-error transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
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
    </div>
  )
}

