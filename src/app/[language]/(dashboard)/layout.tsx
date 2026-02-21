import { AppHeader } from "@/components/app-header"
import { AppSidebar } from "@/components/app-sidebar"
import { SidebarProvider } from "@/components/ui/sidebar"
import { GlobalConfigProvider } from "@/contexts/global-config-context"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <SidebarProvider className="overflow-x-hidden">
      <GlobalConfigProvider>
        <AppSidebar />
        <main className="flex min-h-svh min-w-0 w-full flex-col overflow-x-hidden">
          <AppHeader />
          <div className="flex-1 min-w-0 overflow-x-hidden">{children}</div>
        </main>
      </GlobalConfigProvider>
    </SidebarProvider>
  )
}
