'use client'

import { useCallback, useEffect, useState } from 'react'
import { I18nProvider } from '@/contexts/I18nContext'
import { AppProvider } from '@/contexts/AppContext'
import Sidebar from '@/components/global/Sidebar'
import Header from '@/components/global/Header'

function DashboardShellInner({ children }: { children: React.ReactNode }) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  const handleCloseSidebar = useCallback(() => {
    setIsMobileMenuOpen(false)
  }, [])

  useEffect(() => {
    const handleToggle = () => setIsMobileMenuOpen((prev) => !prev)
    window.addEventListener('toggle-mobile-menu', handleToggle)
    return () => window.removeEventListener('toggle-mobile-menu', handleToggle)
  }, [])

  return (
    <div className="flex h-screen w-full overflow-hidden bg-[#f5f7f8] text-[#1D1D1F] font-sans selection:bg-[#0071E3]/10">
      <Sidebar
        isOpen={isMobileMenuOpen}
        onClose={handleCloseSidebar}
      />
      <main className="flex-1 flex flex-col h-full overflow-hidden relative">
        <Header />
        <div className="flex-1 overflow-y-auto px-8 pb-8 custom-scrollbar">
          <div className="mx-auto h-full max-w-[1200px]">
            {children}
          </div>
        </div>
      </main>
    </div>
  )
}

export default function DashboardShell({ children }: { children: React.ReactNode }) {
  return (
    <I18nProvider>
      <AppProvider>
        <DashboardShellInner>{children}</DashboardShellInner>
      </AppProvider>
    </I18nProvider>
  )
}
