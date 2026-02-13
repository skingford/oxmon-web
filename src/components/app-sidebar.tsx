"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { ChevronRight } from "lucide-react"
import { withLocalePrefix } from "@/components/app-locale"
import { isRouteActive } from "@/components/app-navigation"
import {
  filterSidebarGroupsByApiPaths,
  filterSidebarItemsByApiPaths,
  getSidebarFooterItems,
  getSidebarMenuGroups,
} from "@/components/app-sidebar.config"
import { useAppLocale } from "@/hooks/use-app-locale"
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
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar"
import { cn } from "@/lib/utils"

type AppSidebarProps = {
  supportedApiPaths?: Set<string>
}

export function AppSidebar({ supportedApiPaths }: AppSidebarProps) {
  const pathname = usePathname()
  const locale = useAppLocale()

  const sidebarMenuGroups = useMemo(() => {
    const groups = getSidebarMenuGroups(locale)
    return filterSidebarGroupsByApiPaths(groups, supportedApiPaths)
  }, [locale, supportedApiPaths])

  const sidebarFooterItems = useMemo(() => {
    const items = getSidebarFooterItems(locale)
    return filterSidebarItemsByApiPaths(items, supportedApiPaths)
  }, [locale, supportedApiPaths])

  const activeParentMap = useMemo(() => {
    return sidebarMenuGroups.reduce<Record<string, boolean>>((result, group) => {
      group.items.forEach((item) => {
        const children = item.children ?? []

        if (children.length === 0) {
          return
        }

        const childActive = children.some((child) =>
          isRouteActive(pathname, child.url, child.exact)
        )

        const itemActive = isRouteActive(pathname, item.url, item.exact) || childActive
        result[item.url] = itemActive
      })

      return result
    }, {})
  }, [pathname, sidebarMenuGroups])

  const [expandedParents, setExpandedParents] = useState<Record<string, boolean>>(activeParentMap)
  const activeMenuButtonClass =
    "bg-primary/12 text-primary ring-1 ring-primary/25 shadow-xs hover:bg-primary/15 hover:text-primary"
  const activeSubMenuButtonClass =
    "bg-primary/10 text-primary ring-1 ring-primary/20 hover:bg-primary/15 hover:text-primary"

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
        {sidebarMenuGroups.map((group) => (
          <SidebarGroup key={group.label}>
            <SidebarGroupLabel>{group.label}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map((item) => {
                  const children = item.children ?? []
                  const hasChildren = children.length > 0
                  const itemSelfActive = isRouteActive(pathname, item.url, item.exact)
                  const childActive = hasChildren
                    ? children.some((child) => isRouteActive(pathname, child.url, child.exact))
                    : false
                  const itemActive = itemSelfActive || childActive
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
                            <SidebarMenuButton
                              isActive={false}
                              tooltip={item.title}
                              className={undefined}
                            >
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
                              {children.map((child) => {
                                const subActive = isRouteActive(pathname, child.url, child.exact)

                                return (
                                  <SidebarMenuSubItem key={child.url}>
                                    <SidebarMenuSubButton
                                      asChild
                                      isActive={subActive}
                                      className={subActive ? activeSubMenuButtonClass : undefined}
                                    >
                                      <Link href={withLocalePrefix(child.url, locale)}>
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
                        <SidebarMenuButton
                          asChild
                          isActive={itemActive}
                          tooltip={item.title}
                          className={itemActive ? activeMenuButtonClass : undefined}
                        >
                          <Link href={withLocalePrefix(item.url, locale)}>
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
                <SidebarMenuButton
                  asChild
                  isActive={isActive}
                  tooltip={item.title}
                  className={isActive ? activeMenuButtonClass : undefined}
                >
                  <Link href={withLocalePrefix(item.url, locale)}>
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
