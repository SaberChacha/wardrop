import { useState, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useQuery } from '@tanstack/react-query'
import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import interactionPlugin from '@fullcalendar/interaction'
import { bookingsAPI, dressesAPI } from '../services/api'
import Modal from '../components/ui/Modal'
import { formatCurrency, formatDate } from '../lib/utils'

export default function Calendar() {
  const { t, i18n } = useTranslation()
  const [selectedDress, setSelectedDress] = useState<number | null>(null)
  const [selectedBooking, setSelectedBooking] = useState<any>(null)
  const [dateRange, setDateRange] = useState({
    start: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    end: new Date(new Date().getFullYear(), new Date().getMonth() + 2, 0).toISOString().split('T')[0],
  })

  const { data: dresses } = useQuery({
    queryKey: ['dresses-list'],
    queryFn: () => dressesAPI.getAll({ limit: 100 }),
  })

  const { data: bookings, isLoading } = useQuery({
    queryKey: ['calendar-bookings', dateRange.start, dateRange.end, selectedDress],
    queryFn: () => bookingsAPI.getCalendar(
      dateRange.start,
      dateRange.end,
      selectedDress || undefined
    ),
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
        dressName: booking.dress_name,
      },
    }))
  }, [bookings])

  const handleEventClick = (info: any) => {
    const booking = bookings?.find((b: any) => b.id.toString() === info.event.id)
    if (booking) {
      setSelectedBooking(booking)
    }
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
        
        <select
          value={selectedDress || ''}
          onChange={(e) => setSelectedDress(e.target.value ? Number(e.target.value) : null)}
          className="select-field w-auto min-w-[200px]"
        >
          <option value="">{t('calendar.allDresses')}</option>
          {dresses?.dresses?.map((dress: any) => (
            <option key={dress.id} value={dress.id}>
              {dress.name}
            </option>
          ))}
        </select>
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
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-text-muted">{t('bookings.client')}</p>
                <p className="font-medium">{selectedBooking.client_name}</p>
              </div>
              <div>
                <p className="text-sm text-text-muted">{t('bookings.dress')}</p>
                <p className="font-medium">{selectedBooking.dress_name}</p>
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
            
            <div className="pt-4 flex justify-end">
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
    </div>
  )
}

