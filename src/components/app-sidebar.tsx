import { Calendar, Home, Inbox, Search, Settings, Shield, Bell, Users, User, Server, List, Activity } from "lucide-react"

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"

// Menu items.
const items = [
  {
    title: "Dashboard",
    url: "/",
    icon: Home,
  },
  {
    title: "Agents",
    url: "/agents",
    icon: Server,
  },
  {
    title: "Alerts",
    url: "/alerts",
    icon: Bell,
  },
  {
    title: "Certificates",
    url: "/certificates",
    icon: List,
  },
  {
    title: "Notifications",
    url: "/notifications",
    icon: Inbox,
  },
  {
    title: "Metrics",
    url: "/metrics",
    icon: Activity,
  },
  {
    title: "Profile",
    url: "/profile",
    icon: User,
  },
  {
    title: "System",
    url: "/system",
    icon: Settings,
  },
]

export function AppSidebar() {
  return (
    <Sidebar>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Oxmon Web</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <a href={item.url}>
                      <item.icon />
                      <span>{item.title}</span>
                    </a>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  )
}
