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
  Settings,
  UserCog,
  User,
  X,
} from 'lucide-react'
import { cn } from '../../lib/utils'
import { useAuth } from '../../hooks/useAuth'

interface SidebarProps {
  isOpen: boolean
  onClose: () => void
}

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const { t, i18n } = useTranslation()
  const { isAdmin } = useAuth()
  const isRTL = i18n.language === 'ar' || document.documentElement.dir === 'rtl'

  // Navigation items available to all authenticated users
  const navItems = [
    { path: '/', icon: LayoutDashboard, label: t('nav.dashboard') },
    { path: '/clients', icon: Users, label: t('nav.clients') },
    { path: '/dresses', icon: Sparkles, label: t('nav.dresses') },
    { path: '/clothing', icon: ShoppingBag, label: t('nav.clothing') },
    { path: '/bookings', icon: CalendarDays, label: t('nav.bookings') },
    { path: '/sales', icon: Receipt, label: t('nav.sales') },
    { path: '/calendar', icon: Calendar, label: t('nav.calendar') },
  ]

  // Admin-only navigation items
  const adminNavItems = [
    { path: '/reports', icon: BarChart3, label: t('nav.reports') },
    { path: '/users', icon: UserCog, label: t('nav.users') },
    { path: '/settings', icon: Settings, label: t('nav.settings') },
  ]

  // Profile link for all users
  const profileItem = { path: '/profile', icon: User, label: t('nav.profile') }

  return (
    <aside
      className={cn(
        'fixed top-0 z-50 h-full w-64 bg-surface transform transition-transform duration-300 ease-in-out',
        isRTL ? 'right-0 border-l border-border' : 'left-0 border-r border-border',
        'lg:translate-x-0',
        isOpen 
          ? 'translate-x-0' 
          : isRTL 
            ? 'translate-x-full' 
            : '-translate-x-full'
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
      <nav className="p-4 space-y-1 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 180px)' }}>
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

        {/* Admin-only section */}
        {isAdmin && (
          <>
            <div className="pt-4 pb-2">
              <p className="px-4 text-xs font-medium text-text-muted uppercase tracking-wider">
                {t('nav.administration')}
              </p>
            </div>
            {adminNavItems.map((item) => (
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
          </>
        )}

        {/* Profile section for all users */}
        <div className="pt-4 pb-2">
          <p className="px-4 text-xs font-medium text-text-muted uppercase tracking-wider">
            {t('nav.account')}
          </p>
        </div>
        <NavLink
          to={profileItem.path}
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
          <profileItem.icon className="w-5 h-5" />
          <span>{profileItem.label}</span>
        </NavLink>
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

