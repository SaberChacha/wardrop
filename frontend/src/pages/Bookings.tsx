import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Edit, Trash2, Calendar } from 'lucide-react'
import { bookingsAPI } from '../services/api'
import { formatCurrency, formatDate, getStatusColor } from '../lib/utils'
import Modal from '../components/ui/Modal'
import BookingForm from '../components/forms/BookingForm'
import ConfirmDialog from '../components/ui/ConfirmDialog'
import Pagination from '../components/ui/Pagination'
import SortDropdown from '../components/ui/SortDropdown'

export default function Bookings() {
  const { t, i18n } = useTranslation()
  const queryClient = useQueryClient()
  
  const [filters, setFilters] = useState({ status: '', deposit_status: '' })
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingBooking, setEditingBooking] = useState<any>(null)
  const [deletingBooking, setDeletingBooking] = useState<any>(null)

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(25)
  
  // Sorting state
  const [sortBy, setSortBy] = useState('start_date')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')

  const sortOptions = [
    { value: 'start_date', label: t('sort.startDate', { defaultValue: 'Start Date' }) },
    { value: 'rental_price', label: t('sort.price', { defaultValue: 'Price' }) },
    { value: 'created_at', label: t('sort.dateAdded', { defaultValue: 'Date Added' }) },
  ]

  const { data, isLoading } = useQuery({
    queryKey: ['bookings', filters, currentPage, pageSize, sortBy, sortOrder],
    queryFn: () => bookingsAPI.getAll({
      skip: (currentPage - 1) * pageSize,
      limit: pageSize,
      status: filters.status || undefined,
      deposit_status: filters.deposit_status || undefined,
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
    mutationFn: (id: number) => bookingsAPI.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] })
      setDeletingBooking(null)
    },
  })

  const handleEdit = (booking: any) => {
    setEditingBooking(booking)
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setEditingBooking(null)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-3xl font-heading font-semibold text-text-primary">
          {t('bookings.title')}
        </h1>
        <button
          onClick={() => setIsModalOpen(true)}
          className="btn-primary flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          {t('bookings.addBooking')}
        </button>
      </div>

      {/* Filters and Sort */}
      <div className="flex flex-wrap gap-3">
        <select
          value={filters.status}
          onChange={(e) => { setFilters({ ...filters, status: e.target.value }); setCurrentPage(1); }}
          className="select-field w-auto"
        >
          <option value="">{t('bookings.bookingStatus')}</option>
          <option value="confirmed">{t('bookings.bookingStatuses.confirmed')}</option>
          <option value="in_progress">{t('bookings.bookingStatuses.in_progress')}</option>
          <option value="completed">{t('bookings.bookingStatuses.completed')}</option>
          <option value="cancelled">{t('bookings.bookingStatuses.cancelled')}</option>
        </select>
        
        <select
          value={filters.deposit_status}
          onChange={(e) => { setFilters({ ...filters, deposit_status: e.target.value }); setCurrentPage(1); }}
          className="select-field w-auto"
        >
          <option value="">{t('bookings.depositStatus')}</option>
          <option value="pending">{t('bookings.depositStatuses.pending')}</option>
          <option value="paid">{t('bookings.depositStatuses.paid')}</option>
          <option value="returned">{t('bookings.depositStatuses.returned')}</option>
          <option value="forfeited">{t('bookings.depositStatuses.forfeited')}</option>
        </select>

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
      ) : data?.bookings?.length === 0 ? (
        <div className="text-center py-12 text-text-secondary">
          {t('bookings.noBookings')}
        </div>
      ) : (
        <>
        <div className="table-container">
          <table className="w-full">
            <thead>
              <tr className="table-header">
                <th className="px-4 py-3 text-left">{t('bookings.client')}</th>
                <th className="px-4 py-3 text-left">{t('bookings.dress')}</th>
                <th className="px-4 py-3 text-left">{t('bookings.startDate')}</th>
                <th className="px-4 py-3 text-left">{t('bookings.endDate')}</th>
                <th className="px-4 py-3 text-left">{t('bookings.rentalPrice')}</th>
                <th className="px-4 py-3 text-left">{t('bookings.depositStatus')}</th>
                <th className="px-4 py-3 text-left">{t('bookings.bookingStatus')}</th>
                <th className="px-4 py-3 text-right">{t('common.actions')}</th>
              </tr>
            </thead>
            <tbody>
              {data?.bookings?.map((booking: any) => (
                <tr key={booking.id} className="table-row">
                  <td className="px-4 py-3 font-medium text-text-primary">
                    {booking.client?.full_name}
                  </td>
                  <td className="px-4 py-3 text-text-secondary">
                    {booking.dress?.name}
                  </td>
                  <td className="px-4 py-3 text-text-secondary">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      {formatDate(booking.start_date, i18n.language)}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-text-secondary">
                    {formatDate(booking.end_date, i18n.language)}
                  </td>
                  <td className="px-4 py-3 font-medium text-primary">
                    {formatCurrency(booking.rental_price)}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`badge ${getStatusColor(booking.deposit_status)}`}>
                      {t(`bookings.depositStatuses.${booking.deposit_status}`)}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`badge ${getStatusColor(booking.booking_status)}`}>
                      {t(`bookings.bookingStatuses.${booking.booking_status}`)}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => handleEdit(booking)}
                        className="p-2 rounded-lg text-text-secondary hover:bg-primary/10 hover:text-primary transition-colors"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setDeletingBooking(booking)}
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

      {/* Booking Form Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title={editingBooking ? t('bookings.editBooking') : t('bookings.addBooking')}
        size="lg"
      >
        <BookingForm
          booking={editingBooking}
          onSuccess={handleCloseModal}
        />
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={!!deletingBooking}
        onClose={() => setDeletingBooking(null)}
        onConfirm={() => deleteMutation.mutate(deletingBooking.id)}
        title={t('common.confirmDelete')}
        message={`${deletingBooking?.client?.full_name} - ${deletingBooking?.dress?.name}`}
        loading={deleteMutation.isPending}
      />
    </div>
  )
}

