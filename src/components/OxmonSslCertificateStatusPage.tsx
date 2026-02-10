import Link from 'next/link'

type OxmonSslCertificateStatusPageProps = {
  locale: 'en' | 'zh'
}

type CertificateStatus = 'Valid' | 'Expiring' | 'Expired'

type CertificateRow = {
  id: string
  domain: string
  envLabel: string
  status: CertificateStatus
  issuerShort: string
  issuerShortClass: string
  issuerName: string
  remainingLabel: string
  remainingClass: string
  progressClass: string
  progressWidth: string
  lastCheck: string
  highlighted?: boolean
}

const CERTIFICATE_ROWS: CertificateRow[] = [
  {
    id: 'row-api',
    domain: 'api.oxmon.com',
    envLabel: 'Production API',
    status: 'Valid',
    issuerShort: 'LE',
    issuerShortClass: 'bg-blue-100 text-blue-600',
    issuerName: "Let's Encrypt R3",
    remainingLabel: '89 Days',
    remainingClass: 'text-green-600',
    progressClass: 'bg-green-500',
    progressWidth: '90%',
    lastCheck: '2 mins ago',
  },
  {
    id: 'row-app',
    domain: 'app.oxmon.io',
    envLabel: 'Main Dashboard',
    status: 'Expiring',
    issuerShort: 'DC',
    issuerShortClass: 'bg-indigo-100 text-indigo-600',
    issuerName: 'DigiCert Global',
    remainingLabel: '14 Days',
    remainingClass: 'text-orange-500',
    progressClass: 'bg-orange-400',
    progressWidth: '20%',
    lastCheck: '1 hour ago',
  },
  {
    id: 'row-dev',
    domain: 'dev.oxmon.internal',
    envLabel: 'Internal Staging',
    status: 'Expired',
    issuerShort: 'SS',
    issuerShortClass: 'bg-slate-200 text-slate-600',
    issuerName: 'Self-Signed',
    remainingLabel: '-2 Days',
    remainingClass: 'text-red-600',
    progressClass: 'bg-red-500',
    progressWidth: '100%',
    lastCheck: '5 mins ago',
    highlighted: true,
  },
  {
    id: 'row-auth',
    domain: 'auth.oxmon.com',
    envLabel: 'Authentication Svc',
    status: 'Valid',
    issuerShort: 'GTS',
    issuerShortClass: 'bg-purple-100 text-purple-600',
    issuerName: 'Google Trust Services',
    remainingLabel: '58 Days',
    remainingClass: 'text-green-600',
    progressClass: 'bg-green-500',
    progressWidth: '60%',
    lastCheck: '10 mins ago',
  },
  {
    id: 'row-mail',
    domain: 'mail.oxmon.io',
    envLabel: 'Mail Server',
    status: 'Expiring',
    issuerShort: 'LE',
    issuerShortClass: 'bg-blue-100 text-blue-600',
    issuerName: "Let's Encrypt R3",
    remainingLabel: '22 Days',
    remainingClass: 'text-orange-500',
    progressClass: 'bg-orange-400',
    progressWidth: '30%',
    lastCheck: '45 mins ago',
  },
]

function getStatusBadge(status: CertificateStatus) {
  if (status === 'Valid') {
    return {
      wrap: 'text-green-600 bg-green-50 border border-green-100',
      icon: 'check_circle',
      iconClass: 'filled',
    }
  }

  if (status === 'Expiring') {
    return {
      wrap: 'text-orange-600 bg-orange-50 border border-orange-100',
      icon: 'warning',
      iconClass: '',
    }
  }

  return {
    wrap: 'text-red-600 bg-red-50 border border-red-100',
    icon: 'error',
    iconClass: '',
  }
}

export default function OxmonSslCertificateStatusPage({ locale }: OxmonSslCertificateStatusPageProps) {
  return (
    <div className="flex h-screen w-full overflow-hidden bg-[#f5f7f8] font-display text-[#1c1c1e] antialiased">
      <aside className="z-20 flex h-full w-64 flex-shrink-0 flex-col border-r border-[#e5e5e5] bg-white">
        <div className="flex h-16 items-center gap-3 border-b border-[#e5e5e5]/50 px-6">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#0073e6] text-white">
            <span className="material-symbols-outlined text-[20px]">monitoring</span>
          </div>
          <div className="flex flex-col">
            <h1 className="text-sm font-semibold leading-none text-slate-900">Oxmon Admin</h1>
            <p className="mt-1 text-xs text-slate-500">Infrastructure</p>
          </div>
        </div>

        <div className="hide-scrollbar flex flex-1 flex-col gap-1 overflow-y-auto p-3">
          <nav className="space-y-1">
            <Link
              href={`/${locale}/dashboard`}
              className="group flex items-center gap-3 rounded-lg px-3 py-2 text-slate-600 transition-colors hover:bg-slate-50"
            >
              <span className="material-symbols-outlined text-slate-400 transition-colors group-hover:text-[#0073e6]">dashboard</span>
              <span className="text-sm font-medium">Dashboard</span>
            </Link>

            <Link
              href={`/${locale}/infrastructure`}
              className="group flex items-center gap-3 rounded-lg px-3 py-2 text-slate-600 transition-colors hover:bg-slate-50"
            >
              <span className="material-symbols-outlined text-slate-400 transition-colors group-hover:text-[#0073e6]">dns</span>
              <span className="text-sm font-medium">Infrastructure</span>
            </Link>

            <div className="my-2 px-3">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-400">Security</p>
              <button
                type="button"
                className="flex w-full items-center gap-3 rounded-lg bg-[#0073e6]/10 px-3 py-2 text-[#0073e6] transition-colors"
              >
                <span className="material-symbols-outlined filled text-[#0073e6]">verified_user</span>
                <span className="text-sm font-medium">Certificates</span>
              </button>
              <button
                type="button"
                className="group mt-1 flex w-full items-center gap-3 rounded-lg px-3 py-2 text-slate-600 transition-colors hover:bg-slate-50"
              >
                <span className="material-symbols-outlined text-slate-400 transition-colors group-hover:text-[#0073e6]">lock</span>
                <span className="text-sm font-medium">Access Control</span>
              </button>
            </div>

            <Link
              href={`/${locale}/alerts`}
              className="group flex items-center gap-3 rounded-lg px-3 py-2 text-slate-600 transition-colors hover:bg-slate-50"
            >
              <span className="material-symbols-outlined text-slate-400 transition-colors group-hover:text-[#0073e6]">notifications</span>
              <span className="text-sm font-medium">Alerts</span>
              <span className="ml-auto flex h-5 w-5 items-center justify-center rounded-full bg-red-100 text-[10px] font-bold text-red-600">3</span>
            </Link>

            <Link
              href={`/${locale}/settings`}
              className="group flex items-center gap-3 rounded-lg px-3 py-2 text-slate-600 transition-colors hover:bg-slate-50"
            >
              <span className="material-symbols-outlined text-slate-400 transition-colors group-hover:text-[#0073e6]">settings</span>
              <span className="text-sm font-medium">Settings</span>
            </Link>
          </nav>
        </div>

        <div className="border-t border-[#e5e5e5]/50 p-4">
          <div className="flex items-center gap-3 rounded-xl bg-slate-50 p-3">
            <img
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuC5F8Dcs3wNWThcZRGAAjFlfnNfVWcMZTTV-v1F_jJ9s0DzxgtaOXhtG4xLBsy5U0zt-_we9BWVW5sAnvPCybjOwe3XNbCK080yggg_knFw0RvUYBEKRFyiEgBYcwxe8SVj2fL3qn6Mpy94ivvgYsOeQVyUYLxAaNOmc3XPSMQQVSgZrm5fogWTnOgfKqva373uAWuxoKd9GVFcO0rwp-9kOGDRSvVD3qP3uBREoaPnL-iIYeAI-l_ZQ0MQmIKcJ2AxD6Jvxck_wGM"
              alt="Administrator"
              className="h-8 w-8 rounded-full object-cover"
            />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-slate-900">Administrator</p>
              <p className="truncate text-xs text-slate-500">admin@oxmon.com</p>
            </div>
          </div>
        </div>
      </aside>

      <main className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <header className="apple-blur sticky top-0 z-10 flex h-16 items-center justify-between border-b border-[#e5e5e5]/60 px-8">
          <div className="flex flex-col justify-center">
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <span>Home</span>
              <span className="material-symbols-outlined text-[10px]">chevron_right</span>
              <span>Infrastructure</span>
              <span className="material-symbols-outlined text-[10px]">chevron_right</span>
              <span className="font-medium text-slate-800">Certificates</span>
            </div>
            <h1 className="mt-0.5 text-[34px] font-semibold leading-none text-slate-900">Certificate Monitoring</h1>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              className="flex h-9 w-9 items-center justify-center rounded-full border border-[#e5e5e5] bg-white text-slate-600 shadow-sm transition-all hover:bg-slate-50"
            >
              <span className="material-symbols-outlined text-[20px]">help</span>
            </button>
            <button
              type="button"
              className="flex h-9 items-center gap-2 rounded-lg bg-[#0073e6] px-4 text-sm font-medium text-white shadow-sm shadow-[#0073e6]/20 transition-all hover:bg-[#0073e6]/90"
            >
              <span className="material-symbols-outlined text-[18px]">add</span>
              <span>Add Certificate</span>
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-8">
          <div className="mx-auto flex max-w-[1200px] flex-col gap-6">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
              <div className="flex flex-col gap-1 rounded-xl border border-[#e5e5e5]/60 bg-white p-4 shadow-[0_1px_3px_0_rgba(0,0,0,0.05),0_1px_2px_0_rgba(0,0,0,0.03)]">
                <span className="text-xs font-medium uppercase tracking-wider text-slate-500">Total Certs</span>
                <div className="flex items-end justify-between">
                  <span className="text-2xl font-bold text-slate-900">124</span>
                  <span className="material-symbols-outlined text-[28px] text-slate-300">folder_managed</span>
                </div>
              </div>
              <div className="flex flex-col gap-1 rounded-xl border border-[#e5e5e5]/60 bg-white p-4 shadow-[0_1px_3px_0_rgba(0,0,0,0.05),0_1px_2px_0_rgba(0,0,0,0.03)]">
                <span className="text-xs font-medium uppercase tracking-wider text-slate-500">Valid</span>
                <div className="flex items-end justify-between">
                  <span className="text-2xl font-bold text-green-600">118</span>
                  <span className="material-symbols-outlined text-[28px] text-green-100">check_circle</span>
                </div>
              </div>
              <div className="flex flex-col gap-1 rounded-xl border border-[#e5e5e5]/60 bg-white p-4 shadow-[0_1px_3px_0_rgba(0,0,0,0.05),0_1px_2px_0_rgba(0,0,0,0.03)]">
                <span className="text-xs font-medium uppercase tracking-wider text-slate-500">Expiring Soon</span>
                <div className="flex items-end justify-between">
                  <span className="text-2xl font-bold text-orange-500">4</span>
                  <span className="material-symbols-outlined text-[28px] text-orange-100">warning</span>
                </div>
              </div>
              <div className="flex flex-col gap-1 rounded-xl border border-[#e5e5e5]/60 bg-white p-4 shadow-[0_1px_3px_0_rgba(0,0,0,0.05),0_1px_2px_0_rgba(0,0,0,0.03)]">
                <span className="text-xs font-medium uppercase tracking-wider text-slate-500">Expired</span>
                <div className="flex items-end justify-between">
                  <span className="text-2xl font-bold text-red-600">2</span>
                  <span className="material-symbols-outlined text-[28px] text-red-100">error</span>
                </div>
              </div>
            </div>

            <div className="flex flex-col overflow-hidden rounded-xl border border-[#e5e5e5]/60 bg-white shadow-[0_1px_3px_0_rgba(0,0,0,0.05),0_1px_2px_0_rgba(0,0,0,0.03)]">
              <div className="flex border-b border-[#e5e5e5]/60">
                <button type="button" className="border-b-2 border-transparent px-6 py-4 text-sm font-medium text-slate-500 transition-colors hover:text-slate-700">
                  Domain Management
                </button>
                <button type="button" className="border-b-2 border-[#0073e6] bg-[#0073e6]/5 px-6 py-4 text-sm font-bold text-[#0073e6] transition-colors">
                  Certificate Status
                </button>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-4">
                <div className="flex min-w-[280px] flex-1 items-center gap-3">
                  <div className="group relative max-w-md flex-1">
                    <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[20px] text-slate-400 transition-colors group-focus-within:text-[#0073e6]">search</span>
                    <input
                      type="text"
                      placeholder="Search domains or issuers..."
                      className="w-full rounded-lg border border-transparent bg-slate-50 py-2 pl-10 pr-4 text-sm text-slate-800 outline-none transition-all placeholder:text-slate-400 focus:border-[#0073e6]/50 focus:bg-white focus:ring-2 focus:ring-[#0073e6]/10"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    className="flex items-center gap-2 rounded-lg border border-[#e5e5e5] bg-white px-3 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
                  >
                    <span className="material-symbols-outlined text-[18px] text-slate-500">filter_list</span>
                    <span>Filter</span>
                  </button>
                  <div className="mx-1 h-8 w-px bg-[#e5e5e5]" />
                  <button type="button" className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-50 hover:text-[#0073e6]" title="Refresh">
                    <span className="material-symbols-outlined text-[20px]">refresh</span>
                  </button>
                  <button type="button" className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-50 hover:text-[#0073e6]" title="Export">
                    <span className="material-symbols-outlined text-[20px]">download</span>
                  </button>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-left">
                  <thead>
                    <tr className="border-y border-[#e5e5e5]/60 bg-slate-50/50">
                      <th className="w-1/3 px-6 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">Domain Name</th>
                      <th className="w-32 px-6 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">Status</th>
                      <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">Issuer</th>
                      <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">Remaining Days</th>
                      <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">Last Check</th>
                      <th className="w-16 px-6 py-3" />
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-[#e5e5e5]/60">
                    {CERTIFICATE_ROWS.map((row) => {
                      const statusBadge = getStatusBadge(row.status)

                      return (
                        <tr
                          key={row.id}
                          className={`group transition-colors hover:bg-slate-50 ${row.highlighted ? 'bg-red-50/30' : ''}`}
                        >
                          <td className="px-6 py-4">
                            <div className="flex flex-col">
                              <span className="font-mono text-sm font-medium text-slate-900">{row.domain}</span>
                              <span className={`text-xs ${row.status === 'Expired' ? 'font-medium text-red-500' : 'text-slate-400'}`}>{row.envLabel}</span>
                            </div>
                          </td>

                          <td className="px-6 py-4">
                            <div className={`flex w-fit items-center gap-1.5 rounded-full px-2.5 py-1 ${statusBadge.wrap}`}>
                              <span className={`material-symbols-outlined text-[16px] ${statusBadge.iconClass}`}>{statusBadge.icon}</span>
                              <span className="text-xs font-medium">{row.status}</span>
                            </div>
                          </td>

                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <div className={`flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-bold ${row.issuerShortClass}`}>{row.issuerShort}</div>
                              <span className="text-sm text-slate-600">{row.issuerName}</span>
                            </div>
                          </td>

                          <td className="px-6 py-4">
                            <span className={`text-sm font-semibold ${row.remainingClass}`}>{row.remainingLabel}</span>
                            <div className="mt-1 h-1.5 w-24 overflow-hidden rounded-full bg-slate-100">
                              <div className={`h-full rounded-full ${row.progressClass} ${row.status === 'Expired' ? 'animate-pulse' : ''}`} style={{ width: row.progressWidth }} />
                            </div>
                          </td>

                          <td className="px-6 py-4 text-right">
                            <span className="text-sm text-slate-500">{row.lastCheck}</span>
                          </td>

                          <td className="px-6 py-4 text-center">
                            <button type="button" className="rounded-md p-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600">
                              <span className="material-symbols-outlined text-[20px]">more_horiz</span>
                            </button>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>

              <div className="flex items-center justify-between border-t border-[#e5e5e5]/60 bg-slate-50/50 p-4">
                <span className="text-xs text-slate-500">Showing 1-5 of 124 results</span>
                <div className="flex items-center gap-2">
                  <button type="button" disabled className="rounded-md border border-[#e5e5e5] bg-white px-3 py-1.5 text-xs font-medium text-slate-500 opacity-50 transition-colors">
                    Previous
                  </button>
                  <button type="button" className="rounded-md border border-[#e5e5e5] bg-white px-3 py-1.5 text-xs font-medium text-slate-500 transition-colors hover:bg-slate-50 hover:text-slate-700">
                    Next
                  </button>
                </div>
              </div>
            </div>

            <div className="h-20" />
          </div>
        </div>
      </main>
    </div>
  )
}
