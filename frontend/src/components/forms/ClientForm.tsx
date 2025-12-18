import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { clientsAPI } from '../../services/api'

interface ClientFormProps {
  client?: any
  onSuccess: () => void
}

export default function ClientForm({ client, onSuccess }: ClientFormProps) {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  
  const [formData, setFormData] = useState({
    full_name: client?.full_name || '',
    phone: client?.phone || '',
    whatsapp: client?.whatsapp || '',
    address: client?.address || '',
    notes: client?.notes || '',
  })

  const mutation = useMutation({
    mutationFn: (data: any) =>
      client ? clientsAPI.update(client.id, data) : clientsAPI.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] })
      onSuccess()
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    mutation.mutate(formData)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-text-primary mb-2">
          {t('clients.fullName')} *
        </label>
        <input
          type="text"
          value={formData.full_name}
          onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
          className="input-field"
          required
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-text-primary mb-2">
            {t('clients.phone')}
          </label>
          <input
            type="tel"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            className="input-field"
            placeholder="+213..."
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-text-primary mb-2">
            {t('clients.whatsapp')}
          </label>
          <input
            type="tel"
            value={formData.whatsapp}
            onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })}
            className="input-field"
            placeholder="+213..."
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-text-primary mb-2">
          {t('clients.address')}
        </label>
        <input
          type="text"
          value={formData.address}
          onChange={(e) => setFormData({ ...formData, address: e.target.value })}
          className="input-field"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-text-primary mb-2">
          {t('clients.notes')}
        </label>
        <textarea
          value={formData.notes}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          className="input-field min-h-[100px] resize-none"
          rows={3}
        />
      </div>

      {mutation.isError && (
        <p className="text-error text-sm">
          {(mutation.error as any)?.response?.data?.detail || 'Une erreur est survenue'}
        </p>
      )}

      <div className="flex justify-end gap-3 pt-4">
        <button
          type="submit"
          disabled={mutation.isPending}
          className="btn-primary"
        >
          {mutation.isPending ? t('common.loading') : t('common.save')}
        </button>
      </div>
    </form>
  )
}

