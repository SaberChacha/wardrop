import { useState, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { useDropzone } from 'react-dropzone'
import { Upload, Trash2, Save, Globe, Building2, Coins, Image } from 'lucide-react'
import { useSettings } from '../contexts/SettingsContext'

const API_URL = import.meta.env.VITE_API_URL || ''

export default function Settings() {
  const { t, i18n } = useTranslation()
  const { settings, updateSettings, uploadLogo, deleteLogo } = useSettings()
  
  const [formData, setFormData] = useState({
    language: settings?.language || 'fr',
    brand_name: settings?.brand_name || 'Wardrop',
    currency: settings?.currency || 'DZD',
  })
  const [saving, setSaving] = useState(false)
  const [uploadingLogo, setUploadingLogo] = useState(false)
  const [success, setSuccess] = useState(false)

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      setUploadingLogo(true)
      try {
        await uploadLogo(acceptedFiles[0])
        setSuccess(true)
        setTimeout(() => setSuccess(false), 3000)
      } catch (error) {
        console.error('Failed to upload logo:', error)
      } finally {
        setUploadingLogo(false)
      }
    }
  }, [uploadLogo])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': ['.jpeg', '.jpg', '.png', '.webp'] },
    maxFiles: 1,
  })

  const handleDeleteLogo = async () => {
    try {
      await deleteLogo()
      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    } catch (error) {
      console.error('Failed to delete logo:', error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      await updateSettings(formData)
      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    } catch (error) {
      console.error('Failed to save settings:', error)
    } finally {
      setSaving(false)
    }
  }

  const handleLanguageChange = (lang: string) => {
    setFormData({ ...formData, language: lang })
    i18n.changeLanguage(lang)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-heading font-semibold text-text-primary">
          {t('nav.settings')}
        </h1>
        <p className="text-text-secondary mt-1">
          {t('settings.subtitle')}
        </p>
      </div>

      {success && (
        <div className="p-4 rounded-xl bg-success/10 border border-success/20 text-success">
          {t('common.success')}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* General Settings */}
        <div className="bg-surface rounded-xl p-6 border border-border">
          <h2 className="text-lg font-semibold text-text-primary mb-6 flex items-center gap-2">
            <Building2 className="w-5 h-5 text-primary" />
            {t('settings.general')}
          </h2>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Brand Name */}
            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">
                {t('settings.brandName')}
              </label>
              <input
                type="text"
                value={formData.brand_name}
                onChange={(e) => setFormData({ ...formData, brand_name: e.target.value })}
                className="input-field"
                placeholder="Wardrop"
              />
            </div>

            {/* Language */}
            <div>
              <label className="block text-sm font-medium text-text-primary mb-2 flex items-center gap-2">
                <Globe className="w-4 h-4" />
                {t('settings.language')}
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => handleLanguageChange('fr')}
                  className={`p-3 rounded-xl border-2 transition-all ${
                    formData.language === 'fr'
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-border hover:border-primary/50'
                  }`}
                >
                  <span className="text-lg">🇫🇷</span>
                  <p className="text-sm font-medium mt-1">Français</p>
                </button>
                <button
                  type="button"
                  onClick={() => handleLanguageChange('ar')}
                  className={`p-3 rounded-xl border-2 transition-all ${
                    formData.language === 'ar'
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-border hover:border-primary/50'
                  }`}
                >
                  <span className="text-lg">🇸🇦</span>
                  <p className="text-sm font-medium mt-1">العربية</p>
                </button>
              </div>
            </div>

            {/* Currency */}
            <div>
              <label className="block text-sm font-medium text-text-primary mb-2 flex items-center gap-2">
                <Coins className="w-4 h-4" />
                {t('settings.currency')}
              </label>
              <select
                value={formData.currency}
                onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                className="select-field"
              >
                <option value="DZD">DZD - Dinar Algérien</option>
                <option value="EUR">EUR - Euro</option>
                <option value="USD">USD - Dollar</option>
                <option value="MAD">MAD - Dirham Marocain</option>
                <option value="TND">TND - Dinar Tunisien</option>
              </select>
            </div>

            <button
              type="submit"
              disabled={saving}
              className="w-full btn-primary flex items-center justify-center gap-2"
            >
              <Save className="w-4 h-4" />
              {saving ? t('common.loading') : t('common.save')}
            </button>
          </form>
        </div>

        {/* Logo Upload */}
        <div className="bg-surface rounded-xl p-6 border border-border">
          <h2 className="text-lg font-semibold text-text-primary mb-6 flex items-center gap-2">
            <Image className="w-5 h-5 text-primary" />
            {t('settings.logo')}
          </h2>

          {/* Current Logo Preview */}
          {settings?.logo_path && (
            <div className="mb-6">
              <p className="text-sm text-text-secondary mb-3">{t('settings.currentLogo')}</p>
              <div className="relative inline-block">
                <img
                  src={`${API_URL}${settings.logo_path}`}
                  alt="Brand Logo"
                  className="max-w-[200px] max-h-[100px] object-contain rounded-lg border border-border"
                />
                <button
                  onClick={handleDeleteLogo}
                  className="absolute -top-2 -right-2 p-1.5 bg-error text-white rounded-full hover:bg-error/80 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* Upload Area */}
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${
              isDragActive ? 'border-primary bg-primary/5' : 'border-border hover:border-primary'
            }`}
          >
            <input {...getInputProps()} />
            {uploadingLogo ? (
              <div className="flex flex-col items-center">
                <div className="animate-spin rounded-full h-8 w-8 border-4 border-primary border-t-transparent mb-3" />
                <p className="text-sm text-text-secondary">{t('common.loading')}</p>
              </div>
            ) : (
              <>
                <Upload className="w-10 h-10 mx-auto text-text-muted mb-3" />
                <p className="text-sm text-text-secondary mb-1">
                  {t('settings.uploadLogo')}
                </p>
                <p className="text-xs text-text-muted">
                  PNG, JPG, WEBP (max 2MB)
                </p>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

