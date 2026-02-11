'use client'

import { I18nProvider } from '@/contexts/I18nContext'
import { AppProvider } from '@/contexts/AppContext'
import Sidebar from '@/components/global/Sidebar'
import Header from '@/components/global/Header'
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar'

function DashboardShellInner({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <div className="flex h-screen w-full overflow-hidden bg-[#f5f7f8] text-[#1D1D1F] font-sans selection:bg-[#0071E3]/10">
        <Sidebar />
        <SidebarInset className="h-full overflow-hidden bg-[#f5f7f8]">
          <div className="relative flex h-full flex-1 flex-col overflow-hidden">
            <Header />
            <div className="custom-scrollbar flex-1 overflow-y-auto px-8 pb-8">
              <div className="mx-auto h-full max-w-[1200px]">
                {children}
              </div>
            </div>
          </div>
        </SidebarInset>
      </div>
    </SidebarProvider>
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
