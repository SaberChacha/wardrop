import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Users as UsersIcon, Plus, Edit2, Trash2, Key, Shield, User } from 'lucide-react'
import { usersAPI } from '../services/api'
import Modal from '../components/ui/Modal'
import ConfirmDialog from '../components/ui/ConfirmDialog'

interface UserData {
  id: number
  email: string
  name: string
  role: 'admin' | 'staff'
  created_at: string
}

export default function Users() {
  const { t } = useTranslation()
  const [users, setUsers] = useState<UserData[]>([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState<UserData | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const [formData, setFormData] = useState({
    email: '',
    name: '',
    password: '',
    role: 'staff' as 'admin' | 'staff',
  })

  const [newPassword, setNewPassword] = useState('')

  useEffect(() => {
    loadUsers()
  }, [])

  const loadUsers = async () => {
    try {
      setLoading(true)
      const data = await usersAPI.getAll()
      setUsers(data)
    } catch (err) {
      console.error('Failed to load users:', err)
    } finally {
      setLoading(false)
    }
  }

  const openCreateModal = () => {
    setSelectedUser(null)
    setFormData({ email: '', name: '', password: '', role: 'staff' })
    setError('')
    setIsModalOpen(true)
  }

  const openEditModal = (user: UserData) => {
    setSelectedUser(user)
    setFormData({ email: user.email, name: user.name, password: '', role: user.role })
    setError('')
    setIsModalOpen(true)
  }

  const openPasswordModal = (user: UserData) => {
    setSelectedUser(user)
    setNewPassword('')
    setError('')
    setIsPasswordModalOpen(true)
  }

  const openDeleteDialog = (user: UserData) => {
    setSelectedUser(user)
    setIsDeleteDialogOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSaving(true)

    try {
      if (selectedUser) {
        // Update existing user
        await usersAPI.update(selectedUser.id, {
          email: formData.email,
          name: formData.name,
          role: formData.role,
        })
      } else {
        // Create new user
        if (!formData.password) {
          setError(t('users.passwordRequired'))
          setSaving(false)
          return
        }
        await usersAPI.create({
          email: formData.email,
          name: formData.name,
          password: formData.password,
          role: formData.role,
        })
      }
      setIsModalOpen(false)
      loadUsers()
    } catch (err: any) {
      setError(err.response?.data?.detail || t('common.error'))
    } finally {
      setSaving(false)
    }
  }

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedUser || !newPassword) return

    setError('')
    setSaving(true)

    try {
      await usersAPI.resetPassword(selectedUser.id, newPassword)
      setIsPasswordModalOpen(false)
    } catch (err: any) {
      setError(err.response?.data?.detail || t('common.error'))
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!selectedUser) return

    try {
      await usersAPI.delete(selectedUser.id)
      setIsDeleteDialogOpen(false)
      loadUsers()
    } catch (err: any) {
      alert(err.response?.data?.detail || t('common.error'))
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-heading font-semibold text-text-primary">
            {t('users.title')}
          </h1>
          <p className="text-text-secondary mt-1">{t('users.subtitle')}</p>
        </div>
        <button onClick={openCreateModal} className="btn-primary flex items-center gap-2">
          <Plus className="w-5 h-5" />
          {t('users.addUser')}
        </button>
      </div>

      {/* Users Table */}
      <div className="bg-surface rounded-xl border border-border overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-4 border-primary border-t-transparent"></div>
          </div>
        ) : users.length === 0 ? (
          <div className="text-center py-12 text-text-secondary">
            {t('users.noUsers')}
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-secondary/50">
              <tr>
                <th className="px-6 py-4 text-sm font-medium text-text-primary text-start">
                  {t('users.name')}
                </th>
                <th className="px-6 py-4 text-sm font-medium text-text-primary text-start">
                  {t('users.email')}
                </th>
                <th className="px-6 py-4 text-sm font-medium text-text-primary text-start">
                  {t('users.role')}
                </th>
                <th className="px-6 py-4 text-sm font-medium text-text-primary text-start">
                  {t('users.createdAt')}
                </th>
                <th className="px-6 py-4 text-sm font-medium text-text-primary text-end">
                  {t('common.actions')}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-surface-hover transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                        {user.role === 'admin' ? (
                          <Shield className="w-5 h-5 text-primary" />
                        ) : (
                          <User className="w-5 h-5 text-text-secondary" />
                        )}
                      </div>
                      <span className="font-medium text-text-primary">{user.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-text-secondary">{user.email}</td>
                  <td className="px-6 py-4">
                    <span
                      className={`badge ${
                        user.role === 'admin' ? 'badge-primary' : 'badge-info'
                      }`}
                    >
                      {t(`users.roles.${user.role}`)}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-text-secondary">
                    {new Date(user.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => openPasswordModal(user)}
                        className="p-2 rounded-lg hover:bg-warning/10 text-text-secondary hover:text-warning transition-colors"
                        title={t('users.resetPassword')}
                      >
                        <Key className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => openEditModal(user)}
                        className="p-2 rounded-lg hover:bg-primary/10 text-text-secondary hover:text-primary transition-colors"
                        title={t('common.edit')}
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => openDeleteDialog(user)}
                        className="p-2 rounded-lg hover:bg-error/10 text-text-secondary hover:text-error transition-colors"
                        title={t('common.delete')}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Create/Edit User Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={selectedUser ? t('users.editUser') : t('users.addUser')}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 rounded-lg bg-error/10 border border-error/20 text-error text-sm">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">
              {t('users.name')}
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="input-field"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">
              {t('users.email')}
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="input-field"
              required
            />
          </div>

          {!selectedUser && (
            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">
                {t('users.password')}
              </label>
              <input
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="input-field"
                required={!selectedUser}
                minLength={6}
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">
              {t('users.role')}
            </label>
            <select
              value={formData.role}
              onChange={(e) =>
                setFormData({ ...formData, role: e.target.value as 'admin' | 'staff' })
              }
              className="select-field"
            >
              <option value="staff">{t('users.roles.staff')}</option>
              <option value="admin">{t('users.roles.admin')}</option>
            </select>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="flex-1 btn-outline"
            >
              {t('common.cancel')}
            </button>
            <button type="submit" disabled={saving} className="flex-1 btn-primary">
              {saving ? t('common.loading') : t('common.save')}
            </button>
          </div>
        </form>
      </Modal>

      {/* Reset Password Modal */}
      <Modal
        isOpen={isPasswordModalOpen}
        onClose={() => setIsPasswordModalOpen(false)}
        title={t('users.resetPassword')}
      >
        <form onSubmit={handlePasswordReset} className="space-y-4">
          {error && (
            <div className="p-3 rounded-lg bg-error/10 border border-error/20 text-error text-sm">
              {error}
            </div>
          )}

          <p className="text-text-secondary">
            {t('users.resetPasswordFor', { name: selectedUser?.name })}
          </p>

          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">
              {t('users.newPassword')}
            </label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="input-field"
              required
              minLength={6}
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={() => setIsPasswordModalOpen(false)}
              className="flex-1 btn-outline"
            >
              {t('common.cancel')}
            </button>
            <button type="submit" disabled={saving} className="flex-1 btn-primary">
              {saving ? t('common.loading') : t('users.resetPassword')}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        onConfirm={handleDelete}
        title={t('users.deleteUser')}
        message={t('users.deleteUserConfirm', { name: selectedUser?.name })}
        confirmText={t('common.delete')}
        cancelText={t('common.cancel')}
        variant="danger"
      />
    </div>
  )
}

