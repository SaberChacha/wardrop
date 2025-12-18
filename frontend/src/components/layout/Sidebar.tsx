import { NavLink } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  LayoutDashboard,
  Users,
  Sparkles,
  ShoppingBag,
  CalendarDays,
  Receipt,
  BarChart3,
  Calendar,
  X,
} from 'lucide-react'
import { cn } from '../../lib/utils'

interface SidebarProps {
  isOpen: boolean
  onClose: () => void
}

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const { t } = useTranslation()

  const navItems = [
    { path: '/', icon: LayoutDashboard, label: t('nav.dashboard') },
    { path: '/clients', icon: Users, label: t('nav.clients') },
    { path: '/dresses', icon: Sparkles, label: t('nav.dresses') },
    { path: '/clothing', icon: ShoppingBag, label: t('nav.clothing') },
    { path: '/bookings', icon: CalendarDays, label: t('nav.bookings') },
    { path: '/sales', icon: Receipt, label: t('nav.sales') },
    { path: '/calendar', icon: Calendar, label: t('nav.calendar') },
    { path: '/reports', icon: BarChart3, label: t('nav.reports') },
  ]

  return (
    <aside
      className={cn(
        'fixed top-0 left-0 z-50 h-full w-64 bg-surface border-r border-border transform transition-transform duration-300 ease-in-out',
        'lg:translate-x-0',
        isOpen ? 'translate-x-0' : '-translate-x-full'
      )}
    >
      {/* Logo */}
      <div className="flex items-center justify-between h-16 px-6 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-primary-dark flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-heading font-semibold text-primary">
              {t('app.name')}
            </h1>
          </div>
        </div>
        
        <button
          onClick={onClose}
          className="lg:hidden p-2 rounded-lg hover:bg-surface-hover transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Navigation */}
      <nav className="p-4 space-y-1">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            onClick={onClose}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all',
                isActive
                  ? 'bg-primary text-white shadow-md shadow-primary/20'
                  : 'text-text-secondary hover:bg-surface-hover hover:text-primary'
              )
            }
          >
            <item.icon className="w-5 h-5" />
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      {/* Footer decoration */}
      <div className="absolute bottom-0 left-0 right-0 p-6">
        <div className="p-4 rounded-xl bg-gradient-to-br from-secondary to-primary-light/20 border border-border-light">
          <p className="text-xs text-text-secondary text-center">
            {t('app.tagline')}
          </p>
        </div>
      </div>
    </aside>
  )
}

