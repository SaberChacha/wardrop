import { useState, useRef, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Menu, LogOut, Globe, ChevronDown, Check } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import { useSettings } from '../../contexts/SettingsContext'
import { cn } from '../../lib/utils'

interface HeaderProps {
  onMenuClick: () => void
}

const languages = [
  { code: 'ar', name: 'العربية', flag: '🇸🇦' },
  { code: 'fr', name: 'Français', flag: '🇫🇷' },
]

export default function Header({ onMenuClick }: HeaderProps) {
  const { t, i18n } = useTranslation()
  const { user, logout } = useAuth()
  const { updateSettings } = useSettings()
  const [isLangDropdownOpen, setIsLangDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const currentLanguage = languages.find(lang => lang.code === i18n.language) || languages[0]

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsLangDropdownOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const changeLanguage = async (langCode: string) => {
    i18n.changeLanguage(langCode)
    setIsLangDropdownOpen(false)
    try {
      await updateSettings({ language: langCode })
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
          {/* Language dropdown */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setIsLangDropdownOpen(!isLangDropdownOpen)}
              className={cn(
                "flex items-center gap-2 px-3 py-2 rounded-lg transition-colors",
                isLangDropdownOpen 
                  ? "bg-primary/10 text-primary" 
                  : "hover:bg-surface-hover text-text-secondary hover:text-text-primary"
              )}
            >
              <Globe className="w-4 h-4" />
              <span className="text-sm font-medium hidden sm:inline">
                {currentLanguage.name}
              </span>
              <ChevronDown className={cn(
                "w-4 h-4 transition-transform duration-200",
                isLangDropdownOpen && "rotate-180"
              )} />
            </button>

            {/* Dropdown menu */}
            {isLangDropdownOpen && (
              <div className={cn(
                "absolute top-full mt-2 w-48 bg-surface rounded-xl shadow-lg border border-border py-1 z-50",
                "animate-fade-in",
                i18n.language === 'ar' ? "left-0" : "right-0"
              )}>
                {languages.map((lang) => (
                  <button
                    key={lang.code}
                    onClick={() => changeLanguage(lang.code)}
                    className={cn(
                      "w-full flex items-center justify-between px-4 py-2.5 text-sm transition-colors",
                      i18n.language === lang.code
                        ? "bg-primary/10 text-primary font-medium"
                        : "text-text-secondary hover:bg-surface-hover hover:text-text-primary"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-lg">{lang.flag}</span>
                      <span>{lang.name}</span>
                    </div>
                    {i18n.language === lang.code && (
                      <Check className="w-4 h-4 text-primary" />
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

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

