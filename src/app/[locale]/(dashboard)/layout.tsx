'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { AppProvider, useAppContext } from '@/contexts/AppContext'
import { I18nProvider } from '@/contexts/I18nContext'
import Sidebar from '@/components/Sidebar'
import Header from '@/components/Header'
import Toast from '@/components/Toast'
import LiveAssistant from '@/components/LiveAssistant'
import { buildLocalePath, type Locale } from '@/lib/locale'

function DashboardLayoutInner({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const params = useParams<{ locale: Locale }>()
  const locale = params?.locale ?? 'en'
  const {
    isAuthenticated,
    setIsAuthenticated,
    toasts,
    removeToast,
    agents,
    alerts,
    certificates,
    handleUpdateAgentStatus,
    handleAcknowledgeAlert,
    showToast
  } = useAppContext()

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isAssistantOpen, setIsAssistantOpen] = useState(false)

  useEffect(() => {
    const handleToggle = () => setIsMobileMenuOpen(prev => !prev)
    window.addEventListener('toggle-mobile-menu', handleToggle)
    return () => window.removeEventListener('toggle-mobile-menu', handleToggle)
  }, [])

  const stats = {
    criticalAlerts: alerts.filter(a => a.severity === 'Critical').length,
    offlineAgents: agents.filter(a => a.status === 'Offline').length
  }

  return (
    <div className="flex h-screen w-full bg-[#FBFBFD] overflow-hidden text-[#1D1D1F] font-sans selection:bg-[#0071E3]/10">
      <Sidebar
        onLogout={() => {
          setIsAuthenticated(false)
          showToast('Session terminated.', 'info')
          router.push(buildLocalePath(locale, '/login'))
        }}
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
        onOpenAssistant={() => setIsAssistantOpen(true)}
        stats={stats}
      />
      <main className="flex-1 flex flex-col h-full overflow-hidden relative">
        <Header />
        <div className="flex-1 overflow-y-auto p-10 custom-scrollbar bg-gradient-to-b from-white to-[#FBFBFD]">
          <div className="max-w-7xl mx-auto h-full">
            {children}
          </div>
        </div>
      </main>
      <LiveAssistant
        isOpen={isAssistantOpen}
        onClose={() => setIsAssistantOpen(false)}
        agents={agents}
        alerts={alerts}
        certificates={certificates}
        onUpdateAgentStatus={handleUpdateAgentStatus}
        onAcknowledgeAlert={handleAcknowledgeAlert}
      />
      <Toast toasts={toasts} onRemove={removeToast} />
    </div>
  )
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <I18nProvider>
      <AppProvider>
        <DashboardLayoutInner>{children}</DashboardLayoutInner>
      </AppProvider>
    </I18nProvider>
  )
}
