import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { User, Mail, Shield, Key, Save, Eye, EyeOff } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'

export default function Profile() {
  const { t } = useTranslation()
  const { user, changePassword } = useAuth()
  
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  })

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess(false)

    // Validate passwords match
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setError(t('profile.passwordsDoNotMatch'))
      return
    }

    // Validate password length
    if (passwordData.newPassword.length < 6) {
      setError(t('profile.passwordTooShort'))
      return
    }

    setSaving(true)

    try {
      await changePassword(passwordData.currentPassword, passwordData.newPassword)
      setSuccess(true)
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' })
      setTimeout(() => setSuccess(false), 5000)
    } catch (err: any) {
      setError(err.response?.data?.detail || t('common.error'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-heading font-semibold text-text-primary">
          {t('profile.title')}
        </h1>
        <p className="text-text-secondary mt-1">{t('profile.subtitle')}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* User Info Card */}
        <div className="bg-surface rounded-xl p-6 border border-border">
          <h2 className="text-lg font-semibold text-text-primary mb-6 flex items-center gap-2">
            <User className="w-5 h-5 text-primary" />
            {t('profile.accountInfo')}
          </h2>

          <div className="space-y-4">
            <div className="flex items-center gap-4 p-4 rounded-lg bg-secondary/30">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                {user?.role === 'admin' ? (
                  <Shield className="w-8 h-8 text-primary" />
                ) : (
                  <User className="w-8 h-8 text-primary" />
                )}
              </div>
              <div>
                <h3 className="text-xl font-semibold text-text-primary">{user?.name}</h3>
                <span className={`badge mt-1 ${user?.role === 'admin' ? 'badge-primary' : 'badge-info'}`}>
                  {t(`users.roles.${user?.role}`)}
                </span>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-3 p-3 rounded-lg border border-border">
                <Mail className="w-5 h-5 text-text-muted" />
                <div>
                  <p className="text-xs text-text-muted">{t('profile.email')}</p>
                  <p className="text-text-primary font-medium">{user?.email}</p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 rounded-lg border border-border">
                <Shield className="w-5 h-5 text-text-muted" />
                <div>
                  <p className="text-xs text-text-muted">{t('profile.role')}</p>
                  <p className="text-text-primary font-medium">
                    {t(`users.roles.${user?.role}`)}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Change Password Card */}
        <div className="bg-surface rounded-xl p-6 border border-border">
          <h2 className="text-lg font-semibold text-text-primary mb-6 flex items-center gap-2">
            <Key className="w-5 h-5 text-primary" />
            {t('profile.changePassword')}
          </h2>

          {success && (
            <div className="mb-4 p-3 rounded-lg bg-success/10 border border-success/20 text-success text-sm">
              {t('profile.passwordChanged')}
            </div>
          )}

          {error && (
            <div className="mb-4 p-3 rounded-lg bg-error/10 border border-error/20 text-error text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handlePasswordChange} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">
                {t('profile.currentPassword')}
              </label>
              <div className="relative">
                <input
                  type={showCurrentPassword ? 'text' : 'password'}
                  value={passwordData.currentPassword}
                  onChange={(e) =>
                    setPasswordData({ ...passwordData, currentPassword: e.target.value })
                  }
                  className="input-field pr-12"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-text-muted hover:text-text-primary transition-colors"
                >
                  {showCurrentPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">
                {t('profile.newPassword')}
              </label>
              <div className="relative">
                <input
                  type={showNewPassword ? 'text' : 'password'}
                  value={passwordData.newPassword}
                  onChange={(e) =>
                    setPasswordData({ ...passwordData, newPassword: e.target.value })
                  }
                  className="input-field pr-12"
                  required
                  minLength={6}
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-text-muted hover:text-text-primary transition-colors"
                >
                  {showNewPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">
                {t('profile.confirmPassword')}
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={passwordData.confirmPassword}
                  onChange={(e) =>
                    setPasswordData({ ...passwordData, confirmPassword: e.target.value })
                  }
                  className="input-field pr-12"
                  required
                  minLength={6}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-text-muted hover:text-text-primary transition-colors"
                >
                  {showConfirmPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={saving}
              className="w-full btn-primary flex items-center justify-center gap-2"
            >
              <Save className="w-4 h-4" />
              {saving ? t('common.loading') : t('profile.updatePassword')}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}

