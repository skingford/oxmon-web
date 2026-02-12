import { AppHeader } from "@/components/app-header"
import { AppSidebar } from "@/components/app-sidebar"
import { SidebarProvider } from "@/components/ui/sidebar"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <SidebarProvider>
      <AppSidebar />
      <main className="flex min-h-svh w-full flex-col">
        <AppHeader />
        <div className="flex-1">{children}</div>
      </main>
    </SidebarProvider>
  )
}
