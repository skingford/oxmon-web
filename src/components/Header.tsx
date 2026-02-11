'use client'

import React, { useMemo } from 'react'
import { usePathname } from 'next/navigation'
import { useI18n } from '@/contexts/I18nContext'

const ROUTE_TITLE_MAP: Record<string, { title: string; subtitle: string }> = {
  dashboard: {
    title: 'Dashboard Overview',
    subtitle: "Here's what's happening with your infrastructure today.",
  },
  agents: {
    title: 'Agent Management',
    subtitle: 'Manage and monitor your infrastructure agents.',
  },
  certificates: {
    title: 'Certificate Management',
    subtitle: 'Track trust posture and credential lifecycle.',
  },
  alerts: {
    title: 'Alert Center',
    subtitle: 'Review incident signals and remediation status.',
  },
  logs: {
    title: 'Audit Logs',
    subtitle: 'Inspect events, drift traces, and access records.',
  },
  infrastructure: {
    title: 'Infrastructure Topology',
    subtitle: 'Observe distributed nodes and network relationships.',
  },
  settings: {
    title: 'Workspace Settings',
    subtitle: 'Manage identity, access, and notification policies.',
  },
  tools: {
    title: 'Configuration Tools',
    subtitle: 'Generate and validate runtime configuration safely.',
  },
  help: {
    title: 'Help Center',
    subtitle: 'Browse references and guided operator workflows.',
  },
  'oxmon-ssl-certificate-status': {
    title: 'Certificate Monitoring',
    subtitle: 'Track certificate status, risk level, and trust issuer health across domains.',
  },
  'domain-management-tab': {
    title: 'SSL Certificates',
    subtitle: 'Manage and monitor your SSL domains.',
  },
  'certificate-detail-view-example-com': {
    title: 'example.com',
    subtitle: 'SSL/TLS Certificate details and verification status.',
  },
}

const Header: React.FC = () => {
  const pathname = usePathname()
  const { tr } = useI18n()

  const routeMeta = useMemo(() => {
    const segments = pathname?.split('/').filter(Boolean) ?? []
    const view = segments[1] ?? 'dashboard'
    return ROUTE_TITLE_MAP[view] ?? ROUTE_TITLE_MAP.dashboard
  }, [pathname])

  if (
    pathname?.includes('/agents')
    || pathname?.includes('/oxmon-ssl-certificate-status')
    || pathname?.includes('/domain-management-tab')
    || pathname?.includes('/certificate-detail-view-example-com')
  ) {
    return null
  }

  return (
    <header className="flex-none bg-[#f5f7f8] px-8 py-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-[#1D1D1F]">{tr(routeMeta.title)}</h2>
          <p className="mt-1 text-sm text-[#86868b]">{tr(routeMeta.subtitle)}</p>
        </div>

        <div className="hidden items-center gap-3 md:flex">
          <button
            type="button"
            className="flex h-10 w-10 items-center justify-center rounded-lg border border-transparent text-[#86868b] transition-all hover:border-gray-200 hover:bg-white hover:text-[#1D1D1F] hover:shadow-sm"
            aria-label={tr('Refresh')}
          >
            <span className="material-symbols-outlined">refresh</span>
          </button>
        </div>
      </div>
    </header>
  )
}

export default Header
