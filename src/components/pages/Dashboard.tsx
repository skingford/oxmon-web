'use client'

import { useI18n } from '@/contexts/I18nContext'

interface DashboardStatCard {
  id: string
  title: string
  value: string
  icon: string
  iconWrapClass: string
  valueSuffix?: string
  detail?: string
  footerType: 'progress' | 'badge' | 'text'
  footerLabel?: string
  footerValue?: string
  progressWidth?: string
  footerIcon?: string
  footerText?: string
  footerClassName?: string
}

const STATIC_ALERTS = [
  {
    id: 'critical-web-01',
    severity: 'Critical',
    source: 'web-01',
    message: 'High CPU usage detected (92%) - Exceeds threshold > 90%',
    time: '2 mins ago',
  },
  {
    id: 'warning-db-01',
    severity: 'Warning',
    source: 'db-01',
    message: 'Memory usage is high (78%) - Monitoring required',
    time: '15 mins ago',
  },
  {
    id: 'info-web-02',
    severity: 'Info',
    source: 'web-02',
    message: 'Scheduled disk cleanup completed successfully',
    time: '1 hr ago',
  },
] as const

const DASHBOARD_STATS: DashboardStatCard[] = [
  {
    id: 'online-rate',
    title: 'Agent Online Rate',
    value: '3/5',
    detail: '(60%)',
    icon: 'cloud_done',
    iconWrapClass: 'bg-blue-50 text-[#0073e6]',
    footerType: 'progress' as const,
    footerLabel: 'Progress',
    footerValue: '60%',
    progressWidth: '60%',
  },
  {
    id: 'service-version',
    title: 'Service Version',
    value: 'v0.1.0',
    icon: 'deployed_code',
    iconWrapClass: 'bg-purple-50 text-purple-600',
    footerType: 'badge' as const,
    footerIcon: 'check_circle',
    footerText: 'Up to date',
    footerClassName: 'text-green-600',
  },
  {
    id: 'system-uptime',
    title: 'System Uptime',
    value: '3',
    valueSuffix: 'Days',
    icon: 'timer',
    iconWrapClass: 'bg-green-50 text-green-600',
    footerType: 'text' as const,
    footerText: 'Since last maintenance',
  },
] as const

function getSeverityClass(severity: string) {
  if (severity === 'Critical') {
    return 'bg-red-50 text-red-700 border border-red-100'
  }

  if (severity === 'Warning') {
    return 'bg-orange-50 text-orange-700 border border-orange-100'
  }

  return 'bg-blue-50 text-blue-700 border border-blue-100'
}

export default function Dashboard() {
  const { tr } = useI18n()

  return (
    <div className="space-y-8 pb-8 animate-fade-in">
      <section>
        <h3 className="text-2xl font-bold text-slate-900 mb-1">{tr('Welcome back, Administrator')}</h3>
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {DASHBOARD_STATS.map((stat) => (
          <article key={stat.id} className="h-40 bg-white rounded-xl p-6 border border-[#E5E5EA] shadow-card flex flex-col justify-between">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-slate-500">{tr(stat.title)}</p>
                <h4 className="mt-2 text-3xl font-bold text-slate-900">
                  {stat.value}
                  {stat.valueSuffix ? ` ${tr(stat.valueSuffix)}` : null}
                  {stat.detail ? <span className="text-lg font-medium text-slate-400"> {stat.detail}</span> : null}
                </h4>
              </div>
              <div className={`p-2 rounded-lg ${stat.iconWrapClass}`}>
                <span className="material-symbols-outlined">{stat.icon}</span>
              </div>
            </div>

            {stat.footerType === 'progress' ? (
              <div className="w-full">
                <div className="flex items-center justify-between mb-1.5 text-xs font-medium text-slate-500">
                  <span>{tr(stat.footerLabel)}</span>
                  <span>{stat.footerValue}</span>
                </div>
                <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                  <div className="h-2 rounded-full bg-[#0073e6]" style={{ width: stat.progressWidth }} />
                </div>
              </div>
            ) : null}

            {stat.footerType === 'badge' ? (
              <div className={`mt-4 flex items-center gap-2 text-sm ${stat.footerClassName}`}>
                <span className="material-symbols-outlined text-[16px]">{stat.footerIcon}</span>
                <span>{tr(stat.footerText)}</span>
              </div>
            ) : null}

            {stat.footerType === 'text' ? (
              <div className="mt-4 text-sm text-slate-500">{tr(stat.footerText)}</div>
            ) : null}
          </article>
        ))}
      </section>

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-slate-900">{tr('Recent Alerts')}</h3>
          <span className="text-sm font-medium text-[#0073e6]">{tr('View all alerts')}</span>
        </div>

        <div className="bg-white rounded-xl border border-[#E5E5EA] shadow-card overflow-hidden">
          <div className="grid grid-cols-12 gap-4 px-6 py-3 bg-slate-50 border-b border-[#E5E5EA] text-xs font-semibold uppercase tracking-wider text-slate-500">
            <div className="col-span-2 md:col-span-1">{tr('Severity')}</div>
            <div className="col-span-4 md:col-span-2">{tr('Source')}</div>
            <div className="col-span-6 md:col-span-7">{tr('Message')}</div>
            <div className="hidden md:block col-span-2 text-right">{tr('Time')}</div>
          </div>

          <div className="divide-y divide-[#E5E5EA]">
            {STATIC_ALERTS.map((alert) => (
              <div
                key={alert.id}
                className="w-full grid grid-cols-12 gap-4 px-6 py-4 items-center text-left"
              >
                <div className="col-span-2 md:col-span-1">
                  <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold ${getSeverityClass(alert.severity)}`}>
                    {tr(alert.severity)}
                  </span>
                </div>
                <div className="col-span-4 md:col-span-2 font-medium text-slate-900 truncate">{alert.source}</div>
                <div className="col-span-6 md:col-span-7 text-sm text-slate-600 truncate">{tr(alert.message)}</div>
                <div className="hidden md:block col-span-2 text-right text-xs text-slate-400 font-medium">{tr(alert.time)}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <footer className="pt-6 mt-8 border-t border-[#E5E5EA] text-center text-xs text-slate-400">
        <p>© 2023 Oxmon Inc. Infrastructure Monitoring Dashboard.</p>
      </footer>
    </div>
  )
}
