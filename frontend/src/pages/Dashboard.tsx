import { useTranslation } from 'react-i18next'
import { useQuery } from '@tanstack/react-query'
import {
  Users,
  Sparkles,
  ShoppingBag,
  CalendarDays,
  TrendingUp,
  Clock,
  AlertTriangle,
  DollarSign,
} from 'lucide-react'
import { reportsAPI } from '../services/api'
import { formatCurrency } from '../lib/utils'

export default function Dashboard() {
  const { t } = useTranslation()

  const { data: stats, isLoading } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: reportsAPI.getDashboard,
  })

  const statCards = [
    {
      title: t('dashboard.totalClients'),
      value: stats?.total_clients || 0,
      icon: Users,
      color: 'bg-info/10 text-info',
    },
    {
      title: t('dashboard.totalDresses'),
      value: stats?.total_dresses || 0,
      icon: Sparkles,
      color: 'bg-primary/10 text-primary',
    },
    {
      title: t('dashboard.totalClothing'),
      value: stats?.total_clothing || 0,
      icon: ShoppingBag,
      color: 'bg-accent/10 text-accent',
    },
    {
      title: t('dashboard.activeBookings'),
      value: stats?.active_bookings || 0,
      icon: CalendarDays,
      color: 'bg-success/10 text-success',
    },
  ]

  const revenueCards = [
    {
      title: t('dashboard.rentalRevenue'),
      value: formatCurrency(stats?.monthly_rental_revenue || 0),
      icon: TrendingUp,
      color: 'text-success',
    },
    {
      title: t('dashboard.salesRevenue'),
      value: formatCurrency(stats?.monthly_sales_revenue || 0),
      icon: DollarSign,
      color: 'text-info',
    },
  ]

  const alertCards = [
    {
      title: t('dashboard.pendingDeposits'),
      value: formatCurrency(stats?.pending_deposits || 0),
      icon: Clock,
      color: 'bg-warning/10 text-warning',
    },
    {
      title: t('dashboard.lowStock'),
      value: stats?.low_stock_count || 0,
      icon: AlertTriangle,
      color: 'bg-error/10 text-error',
    },
    {
      title: t('dashboard.upcomingReturns'),
      value: stats?.upcoming_returns || 0,
      icon: CalendarDays,
      color: 'bg-info/10 text-info',
    },
  ]

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-heading font-semibold text-text-primary">
          {t('dashboard.title')}
        </h1>
        <p className="text-text-secondary mt-1">
          {t('app.tagline')}
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card) => (
          <div
            key={card.title}
            className="bg-surface rounded-xl p-6 border border-border card-hover"
          >
            <div className="flex items-center gap-4">
              <div className={`p-3 rounded-xl ${card.color}`}>
                <card.icon className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm text-text-secondary">{card.title}</p>
                <p className="text-2xl font-semibold text-text-primary">{card.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Revenue Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Monthly Revenue Card */}
        <div className="lg:col-span-2 bg-gradient-to-br from-primary to-primary-dark rounded-xl p-6 text-white">
          <h3 className="text-lg font-medium opacity-90 mb-4">
            {t('dashboard.monthlyRevenue')}
          </h3>
          <p className="text-4xl font-heading font-bold mb-6">
            {formatCurrency(stats?.monthly_total_revenue || 0)}
          </p>
          
          <div className="grid grid-cols-2 gap-4">
            {revenueCards.map((card) => (
              <div key={card.title} className="bg-white/10 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <card.icon className="w-4 h-4 opacity-80" />
                  <span className="text-sm opacity-80">{card.title}</span>
                </div>
                <p className="text-xl font-semibold">{card.value}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Alerts */}
        <div className="bg-surface rounded-xl p-6 border border-border">
          <h3 className="text-lg font-semibold text-text-primary mb-4">
            Alertes
          </h3>
          <div className="space-y-4">
            {alertCards.map((card) => (
              <div
                key={card.title}
                className="flex items-center gap-3 p-3 rounded-lg bg-background"
              >
                <div className={`p-2 rounded-lg ${card.color}`}>
                  <card.icon className="w-4 h-4" />
                </div>
                <div className="flex-1">
                  <p className="text-sm text-text-secondary">{card.title}</p>
                  <p className="font-semibold text-text-primary">{card.value}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

