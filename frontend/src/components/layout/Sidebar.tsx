import { useState, useEffect } from 'react'
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
  X,
} from 'lucide-react'
import { cn } from '../../lib/utils'
import { useSettings } from '../../contexts/SettingsContext'

// No API_URL needed for uploads - they're served at /uploads/ directly

interface SidebarProps {
  isOpen: boolean
  onClose: () => void
}

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const { t, i18n } = useTranslation()
  const { settings } = useSettings()
  
  // Check both i18n language and document direction for RTL
  const getIsRTL = () => i18n.language === 'ar' || document.documentElement.dir === 'rtl'
  const [isRTL, setIsRTL] = useState(getIsRTL())

  useEffect(() => {
    const handleLanguageChange = (lang: string) => {
      setIsRTL(lang === 'ar')
    }
    
    // Also update when settings language changes
    setIsRTL(getIsRTL())
    
    i18n.on('languageChanged', handleLanguageChange)
    return () => {
      i18n.off('languageChanged', handleLanguageChange)
    }
  }, [i18n, settings?.language])

  const navItems = [
    { path: '/', icon: LayoutDashboard, label: t('nav.dashboard') },
    { path: '/clients', icon: Users, label: t('nav.clients') },
    { path: '/dresses', icon: Sparkles, label: t('nav.dresses') },
    { path: '/clothing', icon: ShoppingBag, label: t('nav.clothing') },
    { path: '/bookings', icon: CalendarDays, label: t('nav.bookings') },
    { path: '/sales', icon: Receipt, label: t('nav.sales') },
    { path: '/calendar', icon: Calendar, label: t('nav.calendar') },
    { path: '/reports', icon: BarChart3, label: t('nav.reports') },
    { path: '/settings', icon: Settings, label: t('nav.settings') },
  ]

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
          {settings?.logo_path ? (
            <img 
              src={settings.logo_path} 
              alt={settings.brand_name || 'Logo'}
              className="w-10 h-10 rounded-xl object-contain"
            />
          ) : (
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-primary-dark flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
          )}
          <div>
            <h1 className="text-xl font-heading font-semibold text-primary">
              {settings?.brand_name || t('app.name')}
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

