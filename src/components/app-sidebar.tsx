"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  Activity,
  Bell,
  ChevronRight,
  Inbox,
  LayoutDashboard,
  List,
  Server,
  Settings,
  Shield,
  User,
} from "lucide-react"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar"
import { cn } from "@/lib/utils"

type MenuItem = {
  title: string
  url: string
  icon: React.ComponentType<{ className?: string }>
  exact?: boolean
  children?: Array<{
    title: string
    url: string
    exact?: boolean
  }>
}

type MenuGroup = {
  label: string
  items: MenuItem[]
}

const menuGroups: MenuGroup[] = [
  {
    label: "Overview",
    items: [
      {
        title: "Dashboard",
        url: "/",
        icon: LayoutDashboard,
        exact: true,
      },
      {
        title: "Metrics",
        url: "/metrics",
        icon: Activity,
      },
    ],
  },
  {
    label: "Monitoring",
    items: [
      {
        title: "Agents",
        url: "/agents",
        icon: Server,
      },
      {
        title: "Whitelist",
        url: "/whitelist",
        icon: Shield,
        exact: true,
      },
      {
        title: "Alerts",
        url: "/alerts",
        icon: Bell,
        children: [
          { title: "Active", url: "/alerts", exact: true },
          { title: "History", url: "/alerts/history", exact: true },
          { title: "Rules", url: "/alerts/rules", exact: true },
        ],
      },
      {
        title: "Certificates",
        url: "/certificates",
        icon: List,
        children: [
          { title: "Overview", url: "/certificates", exact: true },
          { title: "Domains", url: "/certificates/domains", exact: true },
          { title: "Status", url: "/certificates/status", exact: true },
        ],
      },
      {
        title: "Notifications",
        url: "/notifications",
        icon: Inbox,
        children: [
          { title: "Channels", url: "/notifications", exact: true },
          { title: "Silence Windows", url: "/notifications/silence", exact: true },
        ],
      },
    ],
  },
  {
    label: "Administration",
    items: [
      {
        title: "System",
        url: "/system",
        icon: Settings,
        exact: true,
      },
      {
        title: "Profile",
        url: "/profile",
        icon: User,
        exact: true,
      },
    ],
  },
]

function isRouteActive(pathname: string, itemUrl: string, exact = false) {
  if (exact) {
    return pathname === itemUrl
  }

  if (itemUrl === "/") {
    return pathname === "/"
  }

  return pathname === itemUrl || pathname.startsWith(`${itemUrl}/`)
}

export function AppSidebar() {
  const pathname = usePathname()

  const activeParentMap = useMemo(() => {
    return menuGroups.reduce<Record<string, boolean>>((result, group) => {
      group.items.forEach((item) => {
        if (!item.children || item.children.length === 0) {
          return
        }

        const childActive = item.children.some((child) =>
          isRouteActive(pathname, child.url, child.exact)
        )

        const itemActive = isRouteActive(pathname, item.url, item.exact) || childActive
        result[item.url] = itemActive
      })

      return result
    }, {})
  }, [pathname])

  const [expandedParents, setExpandedParents] = useState<Record<string, boolean>>(activeParentMap)

  useEffect(() => {
    setExpandedParents((previous) => {
      const next = { ...previous }
      let changed = false

      Object.entries(activeParentMap).forEach(([key, isActive]) => {
        if (isActive && !next[key]) {
          next[key] = true
          changed = true
        }
      })

      return changed ? next : previous
    })
  }, [activeParentMap])

  return (
    <Sidebar>
      <SidebarContent>
        {menuGroups.map((group) => (
          <SidebarGroup key={group.label}>
            <SidebarGroupLabel>{group.label}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map((item) => {
                  const hasChildren = Boolean(item.children && item.children.length > 0)
                  const childActive = hasChildren
                    ? item.children!.some((child) => isRouteActive(pathname, child.url, child.exact))
                    : false
                  const itemActive = isRouteActive(pathname, item.url, item.exact) || childActive
                  const isOpen = hasChildren ? (expandedParents[item.url] ?? childActive) : false

                  return (
                    <SidebarMenuItem key={item.title}>
                      {hasChildren ? (
                        <Collapsible
                          open={isOpen}
                          onOpenChange={(open) =>
                            setExpandedParents((previous) => ({
                              ...previous,
                              [item.url]: open,
                            }))
                          }
                        >
                          <CollapsibleTrigger asChild>
                            <SidebarMenuButton isActive={itemActive} tooltip={item.title}>
                              <item.icon />
                              <span>{item.title}</span>
                              <ChevronRight
                                className={cn(
                                  "ml-auto size-3.5 opacity-60 transition-transform",
                                  isOpen && "rotate-90"
                                )}
                              />
                            </SidebarMenuButton>
                          </CollapsibleTrigger>

                          <CollapsibleContent>
                            <SidebarMenuSub>
                              {item.children!.map((child) => {
                                const subActive = isRouteActive(pathname, child.url, child.exact)

                                return (
                                  <SidebarMenuSubItem key={child.url}>
                                    <SidebarMenuSubButton asChild isActive={subActive}>
                                      <Link href={child.url}>
                                        <span>{child.title}</span>
                                      </Link>
                                    </SidebarMenuSubButton>
                                  </SidebarMenuSubItem>
                                )
                              })}
                            </SidebarMenuSub>
                          </CollapsibleContent>
                        </Collapsible>
                      ) : (
                        <SidebarMenuButton asChild isActive={itemActive} tooltip={item.title}>
                          <Link href={item.url}>
                            <item.icon />
                            <span>{item.title}</span>
                          </Link>
                        </SidebarMenuButton>
                      )}
                    </SidebarMenuItem>
                  )
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>
    </Sidebar>
  )
}
