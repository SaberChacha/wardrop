import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useQuery } from '@tanstack/react-query'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts'
import { Download, FileSpreadsheet, Upload } from 'lucide-react'
import { reportsAPI, exportAPI } from '../services/api'
import { useRef } from 'react'
import { formatCurrency, downloadFile } from '../lib/utils'

const COLORS = ['#B76E79', '#D4AF37', '#6366F1', '#10B981', '#F59E0B']

export default function Reports() {
  const { t } = useTranslation()
  const [period, setPeriod] = useState('monthly')
  const [dateRange, setDateRange] = useState({
    start: new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0],
  })
  const [importType, setImportType] = useState<string | null>(null)
  const [importing, setImporting] = useState(false)
  const [importResult, setImportResult] = useState<{ success: boolean; message: string } | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const { data: earnings, isLoading: earningsLoading } = useQuery({
    queryKey: ['earnings', dateRange, period],
    queryFn: () => reportsAPI.getEarnings({
      start_date: dateRange.start,
      end_date: dateRange.end,
      period,
    }),
  })

  const { data: topDresses } = useQuery({
    queryKey: ['top-dresses', dateRange],
    queryFn: () => reportsAPI.getTopDresses({
      start_date: dateRange.start,
      end_date: dateRange.end,
      limit: 5,
    }),
  })

  const { data: topClients } = useQuery({
    queryKey: ['top-clients', dateRange],
    queryFn: () => reportsAPI.getTopClients({
      start_date: dateRange.start,
      end_date: dateRange.end,
      limit: 5,
    }),
  })

  const handleExport = async (type: string) => {
    try {
      let blob
      let filename
      
      switch (type) {
        case 'clients':
          blob = await exportAPI.exportClients()
          filename = 'clients.xlsx'
          break
        case 'dresses':
          blob = await exportAPI.exportDresses()
          filename = 'dresses.xlsx'
          break
        case 'clothing':
          blob = await exportAPI.exportClothing()
          filename = 'clothing.xlsx'
          break
        case 'bookings':
          blob = await exportAPI.exportBookings({ start_date: dateRange.start, end_date: dateRange.end })
          filename = 'bookings.xlsx'
          break
        case 'sales':
          blob = await exportAPI.exportSales({ start_date: dateRange.start, end_date: dateRange.end })
          filename = 'sales.xlsx'
          break
        case 'commercial':
          blob = await exportAPI.exportCommercialReport({ start_date: dateRange.start, end_date: dateRange.end })
          filename = `commercial_report_${new Date().toISOString().split('T')[0]}.xlsx`
          break
        default:
          return
      }
      
      downloadFile(blob, filename)
    } catch (error) {
      console.error('Export failed:', error)
    }
  }

  const handleImportClick = (type: string) => {
    setImportType(type)
    setImportResult(null)
    fileInputRef.current?.click()
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !importType) return

    setImporting(true)
    setImportResult(null)

    try {
      let result
      switch (importType) {
        case 'clients':
          result = await exportAPI.importClients(file)
          break
        case 'dresses':
          result = await exportAPI.importDresses(file)
          break
        case 'clothing':
          result = await exportAPI.importClothing(file)
          break
        default:
          return
      }
      
      setImportResult({
        success: true,
        message: `✅ ${t('export.importSuccess')}: ${result.imported} ${importType} importés${result.errors?.length > 0 ? ` (${result.errors.length} erreurs)` : ''}`
      })
    } catch (error: any) {
      setImportResult({
        success: false,
        message: `❌ ${t('export.importFailed')}: ${error.response?.data?.detail || error.message}`
      })
    } finally {
      setImporting(false)
      setImportType(null)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const revenueData = [
    { name: t('dashboard.rentalRevenue'), value: earnings?.total_rentals || 0 },
    { name: t('dashboard.salesRevenue'), value: earnings?.total_sales || 0 },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-3xl font-heading font-semibold text-text-primary">
          {t('reports.title')}
        </h1>
        
        <div className="flex flex-wrap gap-3">
          <input
            type="date"
            value={dateRange.start}
            onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
            className="input-field w-auto"
          />
          <input
            type="date"
            value={dateRange.end}
            onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
            className="input-field w-auto"
          />
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            className="select-field w-auto"
          >
            <option value="daily">{t('reports.daily')}</option>
            <option value="weekly">{t('reports.weekly')}</option>
            <option value="monthly">{t('reports.monthly')}</option>
            <option value="yearly">{t('reports.yearly')}</option>
          </select>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-primary to-primary-dark rounded-xl p-6 text-white">
          <p className="text-sm opacity-80">{t('reports.totalRevenue')}</p>
          <p className="text-3xl font-heading font-bold mt-2">
            {formatCurrency(earnings?.total_revenue || 0)}
          </p>
        </div>
        <div className="bg-gradient-to-br from-success to-emerald-600 rounded-xl p-6 text-white">
          <p className="text-sm opacity-80">{t('reports.totalProfit')}</p>
          <p className="text-3xl font-heading font-bold mt-2">
            {formatCurrency(earnings?.total_profit || 0)}
          </p>
        </div>
        <div className="bg-surface rounded-xl p-6 border border-border">
          <p className="text-sm text-text-muted">{t('reports.totalRentals')}</p>
          <p className="text-3xl font-heading font-bold text-primary mt-2">
            {formatCurrency(earnings?.total_rentals || 0)}
          </p>
        </div>
        <div className="bg-surface rounded-xl p-6 border border-border">
          <p className="text-sm text-text-muted">{t('reports.totalSales')}</p>
          <p className="text-3xl font-heading font-bold text-accent mt-2">
            {formatCurrency(earnings?.total_sales || 0)}
          </p>
          <p className="text-xs text-text-muted mt-1">
            {t('reports.profit')}: {formatCurrency(earnings?.total_sales_profit || 0)}
          </p>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Over Time */}
        <div className="bg-surface rounded-xl p-6 border border-border">
          <h3 className="text-lg font-semibold text-text-primary mb-4">
            {t('reports.earnings')}
          </h3>
          {earningsLoading ? (
            <div className="h-64 flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-4 border-primary border-t-transparent"></div>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={earnings?.earnings_by_period || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E8D5D8" />
                <XAxis dataKey="period" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#FFFFFF',
                    border: '1px solid #E8D5D8',
                    borderRadius: '8px',
                  }}
                  formatter={(value) => formatCurrency(Number(value))}
                />
                <Bar dataKey="rentals" name={t('dashboard.rentalRevenue')} fill="#B76E79" radius={[4, 4, 0, 0]} />
                <Bar dataKey="sales" name={t('dashboard.salesRevenue')} fill="#D4AF37" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Revenue Breakdown */}
        <div className="bg-surface rounded-xl p-6 border border-border">
          <h3 className="text-lg font-semibold text-text-primary mb-4">
            {t('reports.revenueBreakdown')}
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={revenueData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={5}
                dataKey="value"
                label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
              >
                {revenueData.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => formatCurrency(Number(value))} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Top Lists */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Dresses */}
        <div className="bg-surface rounded-xl p-6 border border-border">
          <h3 className="text-lg font-semibold text-text-primary mb-4">
            {t('reports.topDresses')}
          </h3>
          <div className="space-y-3">
            {topDresses?.dresses?.map((dress: any, index: number) => (
              <div key={dress.dress_id} className="flex items-center gap-4">
                <span className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-semibold text-sm">
                  {index + 1}
                </span>
                <div className="flex-1">
                  <p className="font-medium text-text-primary">{dress.dress_name}</p>
                  <p className="text-sm text-text-muted">
                    {dress.rental_count} {t('nav.bookings').toLowerCase()}
                  </p>
                </div>
                <span className="font-semibold text-primary">
                  {formatCurrency(dress.total_revenue)}
                </span>
              </div>
            ))}
            {(!topDresses?.dresses || topDresses.dresses.length === 0) && (
              <p className="text-center text-text-muted py-4">{t('common.noData')}</p>
            )}
          </div>
        </div>

        {/* Top Clients */}
        <div className="bg-surface rounded-xl p-6 border border-border">
          <h3 className="text-lg font-semibold text-text-primary mb-4">
            {t('reports.topClients')}
          </h3>
          <div className="space-y-3">
            {topClients?.clients?.map((client: any, index: number) => (
              <div key={client.client_id} className="flex items-center gap-4">
                <span className="w-8 h-8 rounded-full bg-accent/10 text-accent flex items-center justify-center font-semibold text-sm">
                  {index + 1}
                </span>
                <div className="flex-1">
                  <p className="font-medium text-text-primary">{client.client_name}</p>
                  <p className="text-sm text-text-muted">
                    {client.booking_count} réservations • {client.sale_count} achats
                  </p>
                </div>
                <span className="font-semibold text-accent">
                  {formatCurrency(client.total_spent)}
                </span>
              </div>
            ))}
            {(!topClients?.clients || topClients.clients.length === 0) && (
              <p className="text-center text-text-muted py-4">{t('common.noData')}</p>
            )}
          </div>
        </div>
      </div>

      {/* Hidden file input for imports */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept=".xlsx,.xls"
        className="hidden"
      />

      {/* Import Result Alert */}
      {importResult && (
        <div className={`rounded-xl p-4 ${importResult.success ? 'bg-green-50 border border-green-200 text-green-800' : 'bg-red-50 border border-red-200 text-red-800'}`}>
          {importResult.message}
          <button 
            onClick={() => setImportResult(null)}
            className="float-right text-lg font-bold hover:opacity-70"
          >
            ×
          </button>
        </div>
      )}

      {/* Export Section */}
      <div className="bg-surface rounded-xl p-6 border border-border">
        <h3 className="text-lg font-semibold text-text-primary mb-4 flex items-center gap-2">
          <Download className="w-5 h-5" />
          {t('export.export')}
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <button
            onClick={() => handleExport('clients')}
            className="btn-outline flex items-center justify-center gap-2"
          >
            <Download className="w-4 h-4" />
            {t('nav.clients')}
          </button>
          <button
            onClick={() => handleExport('dresses')}
            className="btn-outline flex items-center justify-center gap-2"
          >
            <Download className="w-4 h-4" />
            {t('nav.dresses')}
          </button>
          <button
            onClick={() => handleExport('clothing')}
            className="btn-outline flex items-center justify-center gap-2"
          >
            <Download className="w-4 h-4" />
            {t('nav.clothing')}
          </button>
          <button
            onClick={() => handleExport('bookings')}
            className="btn-outline flex items-center justify-center gap-2"
          >
            <Download className="w-4 h-4" />
            {t('nav.bookings')}
          </button>
          <button
            onClick={() => handleExport('sales')}
            className="btn-outline flex items-center justify-center gap-2"
          >
            <Download className="w-4 h-4" />
            {t('nav.sales')}
          </button>
          <button
            onClick={() => handleExport('commercial')}
            className="btn-primary flex items-center justify-center gap-2"
          >
            <Download className="w-4 h-4" />
            {t('export.exportCommercialReport')}
          </button>
        </div>
      </div>

      {/* Import Section */}
      <div className="bg-surface rounded-xl p-6 border border-border">
        <h3 className="text-lg font-semibold text-text-primary mb-4 flex items-center gap-2">
          <Upload className="w-5 h-5" />
          {t('export.import')}
        </h3>
        <p className="text-sm text-text-muted mb-4">
          {t('export.importDescription') || 'Importez des données depuis un fichier Excel (.xlsx). Téléchargez d\'abord un modèle via l\'export pour voir le format attendu.'}
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <button
            onClick={() => handleImportClick('clients')}
            disabled={importing}
            className="btn-outline flex items-center justify-center gap-2 border-dashed"
          >
            <Upload className="w-4 h-4" />
            {importing && importType === 'clients' ? '...' : t('nav.clients')}
          </button>
          <button
            onClick={() => handleImportClick('dresses')}
            disabled={importing}
            className="btn-outline flex items-center justify-center gap-2 border-dashed"
          >
            <Upload className="w-4 h-4" />
            {importing && importType === 'dresses' ? '...' : t('nav.dresses')}
          </button>
          <button
            onClick={() => handleImportClick('clothing')}
            disabled={importing}
            className="btn-outline flex items-center justify-center gap-2 border-dashed"
          >
            <Upload className="w-4 h-4" />
            {importing && importType === 'clothing' ? '...' : t('nav.clothing')}
          </button>
        </div>
      </div>
    </div>
  )
}

