import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Sparkles, Eye, EyeOff } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import { useSettings } from '../contexts/SettingsContext'

const API_URL = import.meta.env.VITE_API_URL || ''

export default function Login() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { login, isAuthenticated } = useAuth()
  const { settings } = useSettings()
  
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  })

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
    <div className="min-h-screen flex">
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
