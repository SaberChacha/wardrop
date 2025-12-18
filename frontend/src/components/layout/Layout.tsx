import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import Sidebar from './Sidebar'
import Header from './Header'
import { useSettings } from '../../contexts/SettingsContext'

interface LayoutProps {
  children: React.ReactNode
}

export default function Layout({ children }: LayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { i18n } = useTranslation()
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

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main content */}
      <div className={isRTL ? 'lg:pr-64' : 'lg:pl-64'}>
        <Header onMenuClick={() => setSidebarOpen(true)} />
        
        <main className="p-4 md:p-6 lg:p-8">
          <div className="animate-fade-in">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}

