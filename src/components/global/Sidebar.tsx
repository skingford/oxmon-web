'use client'

import { memo, useCallback, useMemo } from 'react'
import Link from 'next/link'
import {
  Activity,
  BarChart3,
  Bell,
  ChevronUp,
  LayoutDashboard,
  Server,
  Settings,
  ShieldCheck,
  type LucideIcon,
} from 'lucide-react'
import { usePathname } from 'next/navigation'
import { useI18n } from '@/contexts/I18nContext'
import { stripLocalePrefix } from '@/lib/locale'
import { cn } from '@/lib/utils'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Sidebar as SidebarRoot,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  useSidebar,
} from '@/components/ui/sidebar'

interface NavItem {
  key: string
  icon: LucideIcon
  label: string
  href: string
  badge?: number
  children?: {
    key: string
    label: string
    href: string
  }[]
}

function isRouteActive(currentPath: string, href: string): boolean {
  const targetPath = stripLocalePrefix(href)
  if (targetPath === '/') {
    return currentPath === '/'
  }

  return currentPath === targetPath || currentPath.startsWith(`${targetPath}/`)
}

const Sidebar = memo(() => {
  const pathname = usePathname()
  const { locale, tr } = useI18n()
  const { isMobile, setOpenMobile } = useSidebar()

  const currentPath = useMemo(() => {
    const fallbackPath = `/${locale}/dashboard`
    return stripLocalePrefix(pathname ?? fallbackPath)
  }, [locale, pathname])

  const handleNavigate = useCallback(() => {
    if (isMobile) {
      setOpenMobile(false)
    }
  }, [isMobile, setOpenMobile])

  const navItems = useMemo<NavItem[]>(() => [
    { key: 'dashboard', icon: LayoutDashboard, label: tr('Dashboard'), href: `/${locale}/dashboard` },
    { key: 'agents', icon: Server, label: tr('Agents'), href: `/${locale}/agents` },
    { key: 'metrics', icon: BarChart3, label: tr('Metrics'), href: `/${locale}/metrics` },
    {
      key: 'domains',
      icon: ShieldCheck,
      label: tr('Domains'),
      href: `/${locale}/domains`,
      children: [
        {
          key: 'monitoring',
          label: locale === 'zh' ? '监控' : 'Monitoring',
          href: `/${locale}/domains`,
        },
        {
          key: 'settings',
          label: locale === 'zh' ? '通知设置' : 'Settings',
          href: `/${locale}/domains/settings`,
        },
      ],
    },
    { key: 'alerts', icon: Bell, label: tr('Alerts'), href: `/${locale}/alerts` },
    { key: 'settings', icon: Settings, label: tr('Settings'), href: `/${locale}/settings` },
  ], [locale, tr])

  const isDomainsSettingsRoute = currentPath === '/domains/settings' || currentPath.startsWith('/domains/settings/')

  return (
    <SidebarRoot collapsible="icon" className="border-r border-gray-200 bg-white text-[#1D1D1F]">
      <SidebarHeader className="border-b border-gray-100 p-3 group-data-[collapsible=icon]:p-2">
        <Link
          href={`/${locale}/dashboard`}
          onClick={handleNavigate}
          className="flex items-center gap-3 rounded-lg px-1.5 py-1.5 transition-colors hover:bg-[#f7f9fc] group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-[#0073e6] to-blue-400 text-white shadow-lg shadow-blue-500/20">
            <Activity className="size-6" />
          </div>
          <div className="group-data-[collapsible=icon]:hidden">
            <h1 className="text-lg font-semibold tracking-tight text-[#1D1D1F]">Oxmon</h1>
            <p className="text-xs font-medium text-[#86868b]">Admin Console</p>
          </div>
        </Link>
      </SidebarHeader>

      <SidebarContent className="px-2 py-3">
        <SidebarMenu>
          {navItems.map((item) => {
            const ItemIcon = item.icon
            const itemActive = isRouteActive(currentPath, item.href)

            return (
              <SidebarMenuItem key={item.key}>
                <SidebarMenuButton
                  asChild
                  isActive={itemActive}
                  tooltip={item.label}
                  className="text-[#6e6e73] hover:bg-[#f2f7ff] hover:text-[#1D1D1F] data-[active=true]:bg-[#0073e6]/12 data-[active=true]:text-[#0073e6] data-[active=true]:shadow-[inset_0_0_0_1px_rgba(0,115,230,0.18)] group-data-[collapsible=icon]:justify-center"
                >
                  <Link href={item.href} onClick={handleNavigate}>
                    <ItemIcon className={cn('size-4 transition-colors', itemActive ? 'text-[#0073e6]' : 'text-[#86868b]')} />
                    <span className={cn('text-sm group-data-[collapsible=icon]:hidden', itemActive ? 'font-semibold' : 'font-medium')}>
                      {item.label}
                    </span>
                  </Link>
                </SidebarMenuButton>

                {item.badge
                  ? (
                      <SidebarMenuBadge className="rounded-full bg-red-500 px-1.5 text-[10px] font-bold text-white">
                        {item.badge}
                      </SidebarMenuBadge>
                    )
                  : null}

                {item.children?.length && itemActive
                  ? (
                      <SidebarMenuSub>
                        {item.children.map((child) => {
                          const childActive = child.key === 'monitoring'
                            ? itemActive && !isDomainsSettingsRoute
                            : isDomainsSettingsRoute

                          return (
                            <SidebarMenuSubItem key={`${item.key}-${child.key}`}>
                              <SidebarMenuSubButton
                                asChild
                                isActive={childActive}
                                size="sm"
                                className="text-xs font-medium text-[#86868b] hover:bg-[#f7f9fc] hover:text-[#1D1D1F] data-[active=true]:bg-[#0073e6]/10 data-[active=true]:font-semibold data-[active=true]:text-[#0073e6]"
                              >
                                <Link href={child.href} onClick={handleNavigate}>
                                  <span className={cn('h-1.5 w-1.5 rounded-full', childActive ? 'bg-[#0073e6]' : 'bg-[#c7c7cc]')} />
                                  <span>{child.label}</span>
                                </Link>
                              </SidebarMenuSubButton>
                            </SidebarMenuSubItem>
                          )
                        })}
                      </SidebarMenuSub>
                    )
                  : null}
              </SidebarMenuItem>
            )
          })}
        </SidebarMenu>
      </SidebarContent>

      <SidebarFooter className="border-t border-gray-100 p-2">
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton size="lg" className="h-auto rounded-lg px-2 py-2 hover:bg-[#f7f9fc] group-data-[collapsible=icon]:size-9 group-data-[collapsible=icon]:p-0">
                  <div className="h-8 w-8 overflow-hidden rounded-full bg-gray-200">
                    <img
                      src="https://lh3.googleusercontent.com/aida-public/AB6AXuC5F8Dcs3wNWThcZRGAAjFlfnNfVWcMZTTV-v1F_jJ9s0DzxgtaOXhtG4xLBsy5U0zt-_we9BWVW5sAnvPCybjOwe3XNbCK080yggg_knFw0RvUYBEKRFyiEgBYcwxe8SVj2fL3qn6Mpy94ivvgYsOeQVyUYLxAaNOmc3XPSMQQVSgZrm5fogWTnOgfKqva373uAWuxoKd9GVFcO0rwp-9kOGDRSvVD3qP3uBREoaPnL-iIYeAI-l_ZQ0MQmIKcJ2AxD6Jvxck_wGM"
                      alt="User Profile Avatar"
                      className="h-full w-full object-cover"
                      loading="lazy"
                      decoding="async"
                    />
                  </div>
                  <div className="min-w-0 flex-1 text-left group-data-[collapsible=icon]:hidden">
                    <p className="truncate text-sm font-medium text-[#1D1D1F]">Alex Morgan</p>
                    <p className="truncate text-xs text-[#86868b]">SysAdmin</p>
                  </div>
                  <ChevronUp className="ml-auto size-4 text-[#86868b] group-data-[collapsible=icon]:hidden" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent side="top" align="end" className="min-w-44">
                <DropdownMenuItem>{locale === 'zh' ? '个人资料' : 'Profile'}</DropdownMenuItem>
                <DropdownMenuItem>{tr('Settings')}</DropdownMenuItem>
                <DropdownMenuItem>{locale === 'zh' ? '退出登录' : 'Logout'}</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>

      <SidebarRail />
    </SidebarRoot>
  )
})

Sidebar.displayName = 'Sidebar'

export default Sidebar
