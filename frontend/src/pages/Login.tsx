import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Sparkles, Eye, EyeOff, Globe, ChevronDown, Check } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import { useSettings } from '../contexts/SettingsContext'
import { cn } from '../lib/utils'

const API_URL = import.meta.env.VITE_API_URL || ''

const languages = [
  { code: 'ar', name: 'العربية', flag: '🇸🇦' },
  { code: 'fr', name: 'Français', flag: '🇫🇷' },
]

export default function Login() {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const { login, isAuthenticated } = useAuth()
  const { settings, updateSettings } = useSettings()
  
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [isLangDropdownOpen, setIsLangDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  })

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

  // Redirect if already authenticated
  if (isAuthenticated) {
    navigate('/', { replace: true })
    return null
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      await login(formData.email, formData.password)
      navigate('/', { replace: true })
    } catch (err: any) {
      setError(err.response?.data?.detail || t('common.error'))
    } finally {
      setLoading(false)
    }
  }

  const brandName = settings?.brand_name || 'Wardrop'

  return (
    <div className="min-h-screen flex relative">
      {/* Language dropdown - top right */}
      <div className="absolute top-4 ltr:right-4 rtl:left-4 z-50" ref={dropdownRef}>
        <button
          onClick={() => setIsLangDropdownOpen(!isLangDropdownOpen)}
          className={cn(
            "flex items-center gap-2 px-3 py-2 rounded-lg transition-colors bg-white/90 backdrop-blur-sm shadow-sm border border-border",
            isLangDropdownOpen 
              ? "bg-primary/10 text-primary" 
              : "hover:bg-surface-hover text-text-secondary hover:text-text-primary"
          )}
        >
          <Globe className="w-4 h-4" />
          <span className="text-sm font-medium">
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

      {/* Left side - Decorative */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-primary via-primary-dark to-primary-light relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-20 w-64 h-64 rounded-full bg-white blur-3xl" />
          <div className="absolute bottom-20 right-20 w-96 h-96 rounded-full bg-white blur-3xl" />
        </div>
        
        <div className="relative z-10 flex flex-col items-center justify-center w-full p-12 text-white">
          {settings?.logo_path ? (
            <img 
              src={`${API_URL}${settings.logo_path}`} 
              alt={brandName}
              className="w-24 h-24 rounded-2xl object-contain mb-8 bg-white/20 backdrop-blur p-2"
            />
          ) : (
            <div className="w-24 h-24 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center mb-8">
              <Sparkles className="w-12 h-12" />
            </div>
          )}
          <h1 className="text-5xl font-heading font-bold mb-4">{brandName}</h1>
          <p className="text-xl text-white/80 text-center max-w-md">
            {t('app.tagline')}
          </p>
          
          {/* Decorative elements */}
          <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-black/10 to-transparent" />
        </div>
      </div>

      {/* Right side - Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-background">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center justify-center gap-3 mb-8">
            {settings?.logo_path ? (
              <img 
                src={`${API_URL}${settings.logo_path}`} 
                alt={brandName}
                className="w-12 h-12 rounded-xl object-contain"
              />
            ) : (
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-primary-dark flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
            )}
            <h1 className="text-3xl font-heading font-bold text-primary">{brandName}</h1>
          </div>

          <div className="text-center mb-8">
            <h2 className="text-3xl font-heading font-semibold text-text-primary mb-2">
              {t('auth.welcomeBack')}
            </h2>
            <p className="text-text-secondary">
              {t('auth.loginSubtitle')}
            </p>
          </div>

          {error && (
            <div className="mb-6 p-4 rounded-xl bg-error/10 border border-error/20 text-error text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">
                {t('auth.email')}
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="input-field"
                placeholder="email@example.com"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">
                {t('auth.password')}
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="input-field ltr:pr-12 rtl:pl-12"
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute ltr:right-3 rtl:left-3 top-1/2 -translate-y-1/2 p-1 text-text-muted hover:text-text-primary transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full btn-primary py-3 text-base font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  {t('common.loading')}
                </span>
              ) : (
                t('auth.login')
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
