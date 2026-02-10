import Link from 'next/link'

type AgentDetailedMetricsWeb01PageProps = {
  locale: 'en' | 'zh'
}

const CPU_BARS = ['40%', '35%', '50%', '60%', '55%', '45%', '48%', '52%', '65%', '58%', '50%', '45%'] as const

const RECENT_ACTIVITY = [
  {
    id: 'activity-1',
    icon: 'system_update',
    iconWrap: 'bg-blue-100 text-blue-600',
    title: 'System Update Completed',
    description: 'Kernel patch applied successfully.',
    time: '2 hrs ago',
  },
  {
    id: 'activity-2',
    icon: 'warning',
    iconWrap: 'bg-amber-100 text-amber-600',
    title: 'High Memory Usage Alert',
    description: 'Memory usage peaked at 85%.',
    time: '5 hrs ago',
  },
  {
    id: 'activity-3',
    icon: 'check_circle',
    iconWrap: 'bg-emerald-100 text-emerald-600',
    title: 'Backup Successful',
    description: 'Daily snapshot created.',
    time: '1 day ago',
  },
] as const

export default function AgentDetailedMetricsWeb01Page({ locale }: AgentDetailedMetricsWeb01PageProps) {
  return (
    <div className="flex min-h-screen flex-col bg-[#f5f7f8] font-sans text-slate-900 antialiased">
      <header className="sticky top-0 z-10 w-full border-b border-[#e5e7eb] bg-white">
        <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between px-6">
          <div className="flex items-center gap-2">
            <div className="rounded-lg bg-[#0073e6]/10 p-1.5">
              <span className="material-symbols-outlined text-2xl text-[#0073e6]">monitoring</span>
            </div>
            <span className="text-lg font-semibold tracking-tight">Oxmon</span>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-200 text-sm font-medium text-slate-600">JD</div>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-7xl flex-grow px-6 py-8">
        <div className="mb-6">
          <Link
            href={`/${locale}/agents`}
            className="group inline-flex items-center text-sm font-medium text-slate-500 transition-colors hover:text-[#0073e6]"
          >
            <span className="material-symbols-outlined mr-1 text-[20px] transition-transform group-hover:-translate-x-0.5">chevron_left</span>
            Back to Agent List
          </Link>
        </div>

        <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div>
            <div className="mb-1 flex items-center gap-3">
              <h1 className="text-3xl font-bold tracking-tight text-slate-900">Agent: web-01</h1>
              <span className="inline-flex items-center rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-medium text-emerald-800">
                <span className="mr-1.5 h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />
                Active
              </span>
            </div>
            <p className="max-w-2xl text-sm text-slate-500">
              Detailed infrastructure metrics and health status for production web server.
            </p>
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              className="inline-flex items-center justify-center rounded-lg border border-[#e5e7eb] bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition-all hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-[#0073e6] focus:ring-offset-2"
            >
              <span className="material-symbols-outlined mr-2 text-[18px]">refresh</span>
              Refresh
            </button>
            <button
              type="button"
              className="inline-flex items-center justify-center rounded-lg border border-transparent bg-[#0073e6] px-4 py-2 text-sm font-medium text-white shadow-sm transition-all hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-[#0073e6] focus:ring-offset-2"
            >
              <span className="material-symbols-outlined mr-2 text-[18px]">settings</span>
              Configure
            </button>
          </div>
        </div>

        <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-2">
          <section className="rounded-xl border border-[#e5e7eb] bg-white p-6 shadow-[0_2px_8px_rgba(0,0,0,0.04)] transition-shadow duration-200 hover:shadow-[0_1px_3px_rgba(0,0,0,0.05),0_1px_2px_rgba(0,0,0,0.1)]">
            <div className="mb-4 flex items-start justify-between">
              <div className="flex items-center gap-2">
                <div className="rounded-lg bg-blue-50 p-2">
                  <span className="material-symbols-outlined text-blue-600">memory</span>
                </div>
                <h3 className="text-sm font-medium text-slate-500">CPU Usage</h3>
              </div>
              <span className="material-symbols-outlined text-xl text-slate-400">more_horiz</span>
            </div>

            <div className="mb-4 flex items-baseline gap-2">
              <span className="text-[32px] font-bold leading-none text-slate-900">45.2%</span>
              <span className="inline-flex items-center rounded bg-emerald-50 px-1.5 py-0.5 text-sm font-medium text-emerald-600">
                <span className="material-symbols-outlined mr-0.5 text-[14px]">trending_down</span>
                2.1%
              </span>
            </div>

            <div className="flex h-12 w-full items-end gap-1">
              {CPU_BARS.map((height, index) => (
                <div
                  key={`cpu-bar-${index}`}
                  className={`w-1/12 rounded-sm ${index === CPU_BARS.length - 1 ? 'bg-[#0073e6]' : 'bg-blue-100'}`}
                  style={{ height }}
                />
              ))}
            </div>
          </section>

          <section className="rounded-xl border border-[#e5e7eb] bg-white p-6 shadow-[0_2px_8px_rgba(0,0,0,0.04)] transition-shadow duration-200 hover:shadow-[0_1px_3px_rgba(0,0,0,0.05),0_1px_2px_rgba(0,0,0,0.1)]">
            <div className="mb-4 flex items-start justify-between">
              <div className="flex items-center gap-2">
                <div className="rounded-lg bg-purple-50 p-2">
                  <span className="material-symbols-outlined text-purple-600">sd_card</span>
                </div>
                <h3 className="text-sm font-medium text-slate-500">Memory Usage</h3>
              </div>
              <span className="material-symbols-outlined text-xl text-slate-400">more_horiz</span>
            </div>

            <div className="mb-4 flex items-baseline gap-2">
              <span className="text-[32px] font-bold leading-none text-slate-900">72.8%</span>
              <span className="inline-flex items-center rounded bg-amber-50 px-1.5 py-0.5 text-sm font-medium text-amber-600">
                <span className="material-symbols-outlined mr-0.5 text-[14px]">trending_up</span>
                5.4%
              </span>
            </div>

            <div className="mb-2 h-2.5 w-full overflow-hidden rounded-full bg-slate-100">
              <div className="h-2.5 rounded-full bg-purple-500" style={{ width: '72.8%' }} />
            </div>
            <div className="flex justify-between text-xs text-slate-400">
              <span>Used: 11.6 GB</span>
              <span>Total: 16 GB</span>
            </div>
          </section>

          <section className="rounded-xl border border-[#e5e7eb] bg-white p-6 shadow-[0_2px_8px_rgba(0,0,0,0.04)] transition-shadow duration-200 hover:shadow-[0_1px_3px_rgba(0,0,0,0.05),0_1px_2px_rgba(0,0,0,0.1)]">
            <div className="mb-4 flex items-start justify-between">
              <div className="flex items-center gap-2">
                <div className="rounded-lg bg-indigo-50 p-2">
                  <span className="material-symbols-outlined text-indigo-600">database</span>
                </div>
                <h3 className="text-sm font-medium text-slate-500">Disk Usage</h3>
              </div>
              <span className="material-symbols-outlined text-xl text-slate-400">more_horiz</span>
            </div>

            <div className="mb-4 flex items-baseline gap-2">
              <span className="text-[32px] font-bold leading-none text-slate-900">58.3%</span>
              <span className="text-sm font-medium text-slate-500">/ 500GB</span>
            </div>

            <div className="mt-2 grid grid-cols-2 gap-4">
              <div>
                <p className="mb-1 text-xs text-slate-500">Root (/)</p>
                <div className="h-1.5 w-full rounded-full bg-slate-100">
                  <div className="h-1.5 rounded-full bg-indigo-500" style={{ width: '58.3%' }} />
                </div>
              </div>
              <div>
                <p className="mb-1 text-xs text-slate-500">Data (/mnt/data)</p>
                <div className="h-1.5 w-full rounded-full bg-slate-100">
                  <div className="h-1.5 rounded-full bg-indigo-400" style={{ width: '32%' }} />
                </div>
              </div>
            </div>
          </section>

          <section className="rounded-xl border border-[#e5e7eb] bg-white p-6 shadow-[0_2px_8px_rgba(0,0,0,0.04)] transition-shadow duration-200 hover:shadow-[0_1px_3px_rgba(0,0,0,0.05),0_1px_2px_rgba(0,0,0,0.1)]">
            <div className="mb-4 flex items-start justify-between">
              <div className="flex items-center gap-2">
                <div className="rounded-lg bg-orange-50 p-2">
                  <span className="material-symbols-outlined text-orange-600">speed</span>
                </div>
                <h3 className="text-sm font-medium text-slate-500">Load Average</h3>
              </div>
              <span className="material-symbols-outlined text-xl text-slate-400">more_horiz</span>
            </div>

            <div className="mb-4 flex items-baseline gap-2">
              <span className="text-[32px] font-bold leading-none text-slate-900">1.24</span>
              <span className="inline-flex items-center rounded bg-emerald-50 px-1.5 py-0.5 text-sm font-medium text-emerald-600">Healthy</span>
            </div>

            <div className="mt-4 grid grid-cols-3 gap-2 divide-x divide-slate-100">
              <div className="flex flex-col pr-2">
                <span className="text-xs font-medium uppercase tracking-wide text-slate-400">1 min</span>
                <span className="text-lg font-semibold text-slate-700">1.24</span>
              </div>
              <div className="flex flex-col px-2">
                <span className="text-xs font-medium uppercase tracking-wide text-slate-400">5 min</span>
                <span className="text-lg font-semibold text-slate-700">1.10</span>
              </div>
              <div className="flex flex-col pl-2">
                <span className="text-xs font-medium uppercase tracking-wide text-slate-400">15 min</span>
                <span className="text-lg font-semibold text-slate-700">0.95</span>
              </div>
            </div>
          </section>
        </div>

        <section className="overflow-hidden rounded-xl border border-[#e5e7eb] bg-white shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
          <div className="flex items-center justify-between border-b border-[#e5e7eb] px-6 py-5">
            <h2 className="text-lg font-semibold text-slate-900">Recent Activity</h2>
            <button type="button" className="text-sm font-medium text-[#0073e6] transition-colors hover:text-blue-600">
              View All
            </button>
          </div>

          <div className="divide-y divide-[#e5e7eb]">
            {RECENT_ACTIVITY.map((activity) => (
              <div key={activity.id} className="flex items-center gap-4 px-6 py-4 transition-colors hover:bg-slate-50">
                <div className={`flex h-8 w-8 items-center justify-center rounded-full ${activity.iconWrap}`}>
                  <span className="material-symbols-outlined text-sm">{activity.icon}</span>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-slate-900">{activity.title}</p>
                  <p className="text-xs text-slate-500">{activity.description}</p>
                </div>
                <div className="whitespace-nowrap text-xs text-slate-400">{activity.time}</div>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  )
}
