'use client'

import { memo } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { useI18n } from '@/contexts/I18nContext'

interface SidebarProps {
  isOpen: boolean
  onClose: () => void
}

interface NavItem {
  key: string
  icon: string
  label: string
  href: string
  badge?: number
  children?: {
    key: string
    label: string
    href: string
  }[]
}

const Sidebar = memo<SidebarProps>(({ isOpen, onClose }) => {
  const pathname = usePathname()
  const router = useRouter()
  const { tr } = useI18n()

  const segments = pathname?.split('/').filter(Boolean) ?? []
  const locale = segments[0] === 'zh' || segments[0] === 'en' ? segments[0] : 'en'
  const currentView = segments[1] ?? 'dashboard'
  const currentSubView = segments[2] ?? ''

  const navItems: NavItem[] = [
    { key: 'dashboard', icon: 'dashboard', label: tr('Dashboard'), href: `/${locale}/dashboard` },
    { key: 'agents', icon: 'dns', label: tr('Agents'), href: `/${locale}/agents` },
    {
      key: 'certificates',
      icon: 'verified_user',
      label: tr('Certificates'),
      href: `/${locale}/certificates`,
      children: [
        {
          key: 'monitoring',
          label: locale === 'zh' ? '监控' : 'Monitoring',
          href: `/${locale}/certificates`,
        },
        {
          key: 'settings',
          label: locale === 'zh' ? '通知设置' : 'Settings',
          href: `/${locale}/certificates/settings`,
        },
      ],
    },
    { key: 'alerts', icon: 'notifications', label: tr('Alerts'), href: `/${locale}/alerts` },
    { key: 'settings', icon: 'settings', label: tr('Settings'), href: `/${locale}/settings` },
  ]

  return (
    <>
      <div
        className={`fixed inset-0 bg-black/40 z-20 lg:hidden transition-opacity duration-300 ${
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
      />

      <aside
        className={`fixed lg:static inset-y-0 left-0 z-30 w-64 bg-white border-r border-gray-200 flex flex-col h-full shrink-0 transition-transform duration-300 ${
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="p-6 flex items-center gap-3 justify-between lg:justify-start">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-[#0073e6] to-blue-400 flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
              <span className="material-symbols-outlined filled text-2xl">monitoring</span>
            </div>
            <div>
              <h1 className="text-lg font-semibold tracking-tight text-[#1D1D1F]">Oxmon</h1>
              <p className="text-xs font-medium text-[#86868b]">Admin Console</p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="lg:hidden text-slate-500 p-1 hover:bg-slate-100 rounded-lg"
            aria-label="Close sidebar"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <nav className="flex-1 px-4 py-4 flex flex-col gap-1 overflow-y-auto">
          {navItems.map((item) => {
            const isItemActive = currentView === item.key

            return (
              <div key={item.key} className="flex flex-col gap-1">
                <button
                  type="button"
                  onClick={() => {
                    router.push(item.href)
                    onClose()
                  }}
                  className={`group flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors duration-200 ${
                    isItemActive
                      ? 'bg-[#0073e6]/10 text-[#0073e6]'
                      : 'text-[#86868b] hover:bg-gray-50 hover:text-[#1D1D1F]'
                  }`}
                >
                  <span className={`material-symbols-outlined text-[20px] ${isItemActive ? 'filled' : 'group-hover:text-[#0073e6] transition-colors'}`}>{item.icon}</span>
                  <span className={`text-sm ${isItemActive ? 'font-semibold' : 'font-medium'}`}>{item.label}</span>
                  {item.badge ? <span className="ml-auto rounded-full bg-red-500 px-1.5 py-0.5 text-[10px] font-bold text-white">{item.badge}</span> : null}
                </button>

                {isItemActive && item.children?.length
                  ? (
                    <div className="ml-8 flex flex-col gap-1 pb-1">
                      {item.children.map((child) => {
                        const isChildActive = currentView === item.key
                          && (
                            (child.key === 'monitoring' && currentSubView !== 'settings')
                            || (child.key !== 'monitoring' && currentSubView === child.key)
                          )

                        return (
                          <button
                            key={`${item.key}-${child.key}`}
                            type="button"
                            onClick={() => {
                              router.push(child.href)
                              onClose()
                            }}
                            className={`flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-xs transition-colors duration-200 ${
                              isChildActive
                                ? 'bg-[#0073e6]/10 font-semibold text-[#0073e6]'
                                : 'font-medium text-[#86868b] hover:bg-gray-50 hover:text-[#1D1D1F]'
                            }`}
                          >
                            <span className={`h-1.5 w-1.5 rounded-full ${isChildActive ? 'bg-[#0073e6]' : 'bg-[#c7c7cc]'}`} />
                            <span>{child.label}</span>
                          </button>
                        )
                      })}
                    </div>
                    )
                  : null}
              </div>
            )
          })}
        </nav>

        <div className="border-t border-gray-100 p-4">
          <button type="button" className="flex w-full items-center gap-3 rounded-lg p-2 text-left transition-colors hover:bg-gray-50">
            <div className="h-8 w-8 rounded-full bg-gray-200 overflow-hidden shrink-0">
              <img
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuC5F8Dcs3wNWThcZRGAAjFlfnNfVWcMZTTV-v1F_jJ9s0DzxgtaOXhtG4xLBsy5U0zt-_we9BWVW5sAnvPCybjOwe3XNbCK080yggg_knFw0RvUYBEKRFyiEgBYcwxe8SVj2fL3qn6Mpy94ivvgYsOeQVyUYLxAaNOmc3XPSMQQVSgZrm5fogWTnOgfKqva373uAWuxoKd9GVFcO0rwp-9kOGDRSvVD3qP3uBREoaPnL-iIYeAI-l_ZQ0MQmIKcJ2AxD6Jvxck_wGM"
                alt="User Profile Avatar"
                className="h-full w-full object-cover"
              />
            </div>
            <div className="flex flex-col min-w-0">
              <p className="truncate text-sm font-medium text-[#1D1D1F]">Alex Morgan</p>
              <p className="truncate text-xs text-[#86868b]">SysAdmin</p>
            </div>
            <span className="material-symbols-outlined ml-auto text-[#86868b]">more_vert</span>
          </button>
        </div>
      </aside>
    </>
  )
})

Sidebar.displayName = 'Sidebar'

export default Sidebar
