"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { ChevronRight } from "lucide-react"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
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
import {
  sidebarFooterItems,
  sidebarMenuGroups,
} from "@/components/app-sidebar.config"
import { cn } from "@/lib/utils"

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
  const visibleMenuGroups = sidebarMenuGroups

  const activeParentMap = useMemo(() => {
    return visibleMenuGroups.reduce<Record<string, boolean>>((result, group) => {
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
  }, [pathname, visibleMenuGroups])

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
        {visibleMenuGroups.map((group) => (
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

      <SidebarFooter>
        <SidebarMenu>
          {sidebarFooterItems.map((item) => {
            const isActive = isRouteActive(pathname, item.url, item.exact)

            return (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton asChild isActive={isActive} tooltip={item.title}>
                  <Link href={item.url}>
                    <item.icon />
                    <span>{item.title}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            )
          })}
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}
