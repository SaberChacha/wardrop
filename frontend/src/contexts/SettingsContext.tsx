import { createContext, useContext, useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { settingsAPI } from '../services/api'

interface Settings {
  id: number
  language: string
  brand_name: string
  logo_path: string | null
  currency: string
}

interface SettingsContextType {
  settings: Settings | null
  isLoading: boolean
  updateSettings: (data: Partial<Settings>) => Promise<void>
  uploadLogo: (file: File) => Promise<void>
  deleteLogo: () => Promise<void>
  refreshSettings: () => Promise<void>
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined)

export function SettingsProvider({ children }: { children: ReactNode }) {
  const { i18n } = useTranslation()
  const [settings, setSettings] = useState<Settings | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const fetchSettings = async () => {
    try {
      const token = localStorage.getItem('token')
      let data
      if (token) {
        data = await settingsAPI.get()
      } else {
        // Use public endpoint when not authenticated
        data = await settingsAPI.getPublic()
      }
      setSettings(data)
      
      // Sync language with i18n
      if (data.language && data.language !== i18n.language) {
        i18n.changeLanguage(data.language)
      }
    } catch (error) {
      console.error('Failed to fetch settings:', error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchSettings()
  }, [])

  const updateSettings = async (data: Partial<Settings>) => {
    try {
      const updated = await settingsAPI.update(data)
      setSettings(updated)
      
      // Sync language if changed
      if (data.language) {
        i18n.changeLanguage(data.language)
      }
    } catch (error) {
      console.error('Failed to update settings:', error)
      throw error
    }
  }

  const uploadLogo = async (file: File) => {
    try {
      const updated = await settingsAPI.uploadLogo(file)
      setSettings(updated)
    } catch (error) {
      console.error('Failed to upload logo:', error)
      throw error
    }
  }

  const deleteLogo = async () => {
    try {
      const updated = await settingsAPI.deleteLogo()
      setSettings(updated)
    } catch (error) {
      console.error('Failed to delete logo:', error)
      throw error
    }
  }

  const refreshSettings = async () => {
    await fetchSettings()
  }

  return (
    <SettingsContext.Provider
      value={{
        settings,
        isLoading,
        updateSettings,
        uploadLogo,
        deleteLogo,
        refreshSettings,
      }}
    >
      {children}
    </SettingsContext.Provider>
  )
}

export function useSettings() {
  const context = useContext(SettingsContext)
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider')
  }
  return context
}

