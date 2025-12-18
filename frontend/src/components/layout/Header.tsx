import { useTranslation } from 'react-i18next'
import { Menu, LogOut, Globe } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import { useSettings } from '../../contexts/SettingsContext'

interface HeaderProps {
  onMenuClick: () => void
}

export default function Header({ onMenuClick }: HeaderProps) {
  const { t, i18n } = useTranslation()
  const { user, logout } = useAuth()
  const { updateSettings } = useSettings()

  const toggleLanguage = async () => {
    const newLang = i18n.language === 'fr' ? 'ar' : 'fr'
    i18n.changeLanguage(newLang)
    try {
      await updateSettings({ language: newLang })
    } catch (error) {
      console.error('Failed to save language preference:', error)
    }
  }

  return (
    <header className="sticky top-0 z-30 h-16 bg-surface/80 backdrop-blur-md border-b border-border">
      <div className="flex items-center justify-between h-full px-4 md:px-6">
        {/* Mobile menu button */}
        <button
          onClick={onMenuClick}
          className="lg:hidden p-2 rounded-lg hover:bg-surface-hover transition-colors"
        >
          <Menu className="w-6 h-6" />
        </button>

        {/* Spacer */}
        <div className="hidden lg:block" />

        {/* Right side */}
        <div className="flex items-center gap-3">
          {/* Language toggle */}
          <button
            onClick={toggleLanguage}
            className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-surface-hover transition-colors"
          >
            <Globe className="w-4 h-4" />
            <span className="text-sm font-medium">
              {i18n.language === 'fr' ? 'العربية' : 'Français'}
            </span>
          </button>

          {/* User menu */}
          <div className="flex items-center gap-3 ltr:pl-3 ltr:border-l rtl:pr-3 rtl:border-r border-border">
            <div className="ltr:text-right rtl:text-left">
              <p className="text-sm font-medium text-text-primary">
                {user?.name}
              </p>
              <p className="text-xs text-text-muted">{user?.email}</p>
            </div>
            
            <button
              onClick={logout}
              className="p-2 rounded-lg text-text-secondary hover:bg-error/10 hover:text-error transition-colors"
              title={t('auth.logout')}
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </header>
  )
}

