import { useState, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import interactionPlugin from '@fullcalendar/interaction'
import { Edit2, Trash2 } from 'lucide-react'
import { bookingsAPI, productsAPI } from '../services/api'
import Modal from '../components/ui/Modal'
import ImageSlideshow from '../components/ui/ImageSlideshow'
import ConfirmDialog from '../components/ui/ConfirmDialog'
import BookingForm from '../components/forms/BookingForm'
import Autocomplete from '../components/ui/Autocomplete'
import { formatDate } from '../lib/utils'

export default function Calendar() {
  const { t, i18n } = useTranslation()
  const queryClient = useQueryClient()
  const [selectedProduct, setSelectedProduct] = useState<number | null>(null)
  const [selectedBooking, setSelectedBooking] = useState<any>(null)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false)
  const [bookingToEdit, setBookingToEdit] = useState<any>(null)
  const [dateRange, setDateRange] = useState({
    start: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    end: new Date(new Date().getFullYear(), new Date().getMonth() + 2, 0).toISOString().split('T')[0],
  })

  // Get rental products for the filter
  const { data: products } = useQuery({
    queryKey: ['products-rent-calendar'],
    queryFn: () => productsAPI.getAll({ type: 'rent', limit: 500 }),
  })

  const { data: bookings, isLoading } = useQuery({
    queryKey: ['calendar-bookings', dateRange.start, dateRange.end, selectedProduct],
    queryFn: () => bookingsAPI.getCalendar(
      dateRange.start,
      dateRange.end,
      selectedProduct || undefined
    ),
  })

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (id: number) => bookingsAPI.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['calendar-bookings'] })
      queryClient.invalidateQueries({ queryKey: ['bookings'] })
      setIsDeleteConfirmOpen(false)
      setSelectedBooking(null)
    },
  })

  const events = useMemo(() => {
    if (!bookings) return []
    return bookings.map((booking: any) => ({
      id: booking.id.toString(),
      title: booking.title,
      start: booking.start,
      end: booking.end,
      backgroundColor: booking.color,
      borderColor: booking.color,
      extendedProps: {
        status: booking.status,
        clientName: booking.client_name,
        productName: booking.product_name || booking.dress_name,
      },
    }))
  }, [bookings])

  const handleEventClick = (info: any) => {
    const booking = bookings?.find((b: any) => b.id.toString() === info.event.id)
    if (booking) {
      setSelectedBooking(booking)
    }
  }

  const handleEditClick = async () => {
    if (selectedBooking) {
      // Fetch full booking details for editing
      const fullBooking = await bookingsAPI.getById(selectedBooking.id)
      setBookingToEdit(fullBooking)
      setSelectedBooking(null)
      setIsEditModalOpen(true)
    }
  }

  const handleDeleteClick = () => {
    setIsDeleteConfirmOpen(true)
  }

  const handleEditSuccess = () => {
    setIsEditModalOpen(false)
    setBookingToEdit(null)
    queryClient.invalidateQueries({ queryKey: ['calendar-bookings'] })
    queryClient.invalidateQueries({ queryKey: ['bookings'] })
  }

  const handleDatesSet = (dateInfo: any) => {
    setDateRange({
      start: dateInfo.startStr,
      end: dateInfo.endStr,
    })
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-3xl font-heading font-semibold text-text-primary">
          {t('calendar.title')}
        </h1>
        
        <div className="w-full sm:w-auto sm:min-w-[250px]">
          <Autocomplete
            options={products?.products || []}
            value={selectedProduct}
            onChange={(value) => setSelectedProduct(value as number | null)}
            displayField="name"
            placeholder={t('calendar.allProducts')}
          />
        </div>
      </div>

      {/* Calendar */}
      <div className="bg-surface rounded-xl border border-border p-4">
        {isLoading ? (
          <div className="flex items-center justify-center h-96">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent"></div>
          </div>
        ) : (
          <FullCalendar
            plugins={[dayGridPlugin, interactionPlugin]}
            initialView="dayGridMonth"
            events={events}
            eventClick={handleEventClick}
            datesSet={handleDatesSet}
            locale={i18n.language}
            direction={i18n.language === 'ar' ? 'rtl' : 'ltr'}
            headerToolbar={{
              left: 'prev,next today',
              center: 'title',
              right: 'dayGridMonth,dayGridWeek',
            }}
            height="auto"
            eventDisplay="block"
            eventTimeFormat={{
              hour: '2-digit',
              minute: '2-digit',
              meridiem: false,
            }}
          />
        )}
      </div>

      {/* Booking Details Modal */}
      <Modal
        isOpen={!!selectedBooking}
        onClose={() => setSelectedBooking(null)}
        title={t('common.details')}
      >
        {selectedBooking && (
          <div className="space-y-4">
            {/* Product/Dress Images - prefer product images, fall back to dress images */}
            <div className="w-full max-w-xs mx-auto rounded-lg overflow-hidden">
              <ImageSlideshow
                images={
                  (selectedBooking.product_images?.length > 0 
                    ? selectedBooking.product_images 
                    : selectedBooking.dress_images) || []
                }
                alt={selectedBooking.product_name || selectedBooking.dress_name}
                aspectRatio="square"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-text-muted">{t('bookings.client')}</p>
                <p className="font-medium">{selectedBooking.client_name}</p>
              </div>
              <div>
                <p className="text-sm text-text-muted">{t('bookings.product')}</p>
                <p className="font-medium">{selectedBooking.product_name || selectedBooking.dress_name}</p>
              </div>
              <div>
                <p className="text-sm text-text-muted">{t('bookings.startDate')}</p>
                <p className="font-medium">{formatDate(selectedBooking.start, i18n.language)}</p>
              </div>
              <div>
                <p className="text-sm text-text-muted">{t('bookings.endDate')}</p>
                <p className="font-medium">{formatDate(selectedBooking.end, i18n.language)}</p>
              </div>
              <div>
                <p className="text-sm text-text-muted">{t('bookings.bookingStatus')}</p>
                <p className="font-medium">{t(`bookings.bookingStatuses.${selectedBooking.status}`)}</p>
              </div>
            </div>
            
            <div className="pt-4 flex justify-between">
              <div className="flex gap-2">
                <button
                  onClick={handleEditClick}
                  className="btn-secondary flex items-center gap-2"
                >
                  <Edit2 className="w-4 h-4" />
                  {t('common.edit')}
                </button>
                <button
                  onClick={handleDeleteClick}
                  className="btn-secondary text-error hover:bg-error/10 flex items-center gap-2"
                >
                  <Trash2 className="w-4 h-4" />
                  {t('common.delete')}
                </button>
              </div>
              <button
                onClick={() => setSelectedBooking(null)}
                className="btn-secondary"
              >
                {t('common.close')}
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Edit Booking Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false)
          setBookingToEdit(null)
        }}
        title={t('bookings.editBooking')}
        size="lg"
      >
        {bookingToEdit && (
          <BookingForm
            booking={bookingToEdit}
            onSuccess={handleEditSuccess}
          />
        )}
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={isDeleteConfirmOpen}
        onClose={() => setIsDeleteConfirmOpen(false)}
        onConfirm={() => selectedBooking && deleteMutation.mutate(selectedBooking.id)}
        title={t('common.confirmDelete')}
        message={t('bookings.confirmDeleteBooking')}
        loading={deleteMutation.isPending}
      />
    </div>
  )
}

