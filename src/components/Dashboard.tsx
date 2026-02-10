'use client'

import type { Alert, Agent, Certificate } from '@/lib/types'
import { useI18n } from '@/contexts/I18nContext'

interface DashboardProps {
  onChangeView: (view: string) => void
  agents: Agent[]
  certificates: Certificate[]
  alerts: Alert[]
  aiSummary: string
  isAiLoading: boolean
  onGenerateAiSummary: () => void
  onGenerateFullReport: () => void
  predictiveData: string | null
  onRunPredictiveScan: () => void
}

const ALERT_SEVERITY_ORDER: Record<Alert['severity'], number> = {
  Critical: 0,
  Warning: 1,
  Info: 2,
  Resolved: 3,
}

function getSeverityClass(severity: Alert['severity']) {
  if (severity === 'Critical') {
    return 'bg-red-50 text-red-700 border border-red-100'
  }

  if (severity === 'Warning') {
    return 'bg-orange-50 text-orange-700 border border-orange-100'
  }

  if (severity === 'Info') {
    return 'bg-blue-50 text-blue-700 border border-blue-100'
  }

  return 'bg-slate-100 text-slate-600 border border-slate-200'
}

export default function Dashboard({ onChangeView, agents, alerts }: DashboardProps) {
  const { tr } = useI18n()

  const totalAgents = agents.length
  const onlineAgents = agents.filter((agent) => agent.status === 'Online').length
  const onlineRate = totalAgents > 0 ? Math.round((onlineAgents / totalAgents) * 100) : 0

  const visibleAlerts = alerts
    .slice()
    .sort((a, b) => ALERT_SEVERITY_ORDER[a.severity] - ALERT_SEVERITY_ORDER[b.severity])
    .slice(0, 3)

  return (
    <div className="space-y-8 pb-8 animate-fade-in">
      <section>
        <h3 className="text-2xl font-bold text-slate-900 mb-1">{tr('Welcome back, Administrator')}</h3>
        <p className="text-slate-500">{tr("Here's what's happening with your infrastructure today.")}</p>
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <article className="h-40 bg-white rounded-xl p-6 border border-[#E5E5EA] shadow-card flex flex-col justify-between">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-slate-500">{tr('Agent Online Rate')}</p>
              <h4 className="mt-2 text-3xl font-bold text-slate-900">
                {onlineAgents}/{totalAgents}{' '}
                <span className="text-lg font-medium text-slate-400">({onlineRate}%)</span>
              </h4>
            </div>
            <div className="p-2 rounded-lg bg-blue-50 text-[#0073e6]">
              <span className="material-symbols-outlined">cloud_done</span>
            </div>
          </div>
          <div className="w-full">
            <div className="flex items-center justify-between mb-1.5 text-xs font-medium text-slate-500">
              <span>{tr('Progress')}</span>
              <span>{onlineRate}%</span>
            </div>
            <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
              <div className="h-2 rounded-full bg-[#0073e6]" style={{ width: `${onlineRate}%` }} />
            </div>
          </div>
        </article>

        <article className="h-40 bg-white rounded-xl p-6 border border-[#E5E5EA] shadow-card flex flex-col justify-between">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-slate-500">{tr('Service Version')}</p>
              <h4 className="mt-2 text-3xl font-bold text-slate-900">v0.1.0</h4>
            </div>
            <div className="p-2 rounded-lg bg-purple-50 text-purple-600">
              <span className="material-symbols-outlined">deployed_code</span>
            </div>
          </div>
          <div className="mt-4 flex items-center gap-2 text-sm text-green-600">
            <span className="material-symbols-outlined text-[16px]">check_circle</span>
            <span>{tr('Up to date')}</span>
          </div>
        </article>

        <article className="h-40 bg-white rounded-xl p-6 border border-[#E5E5EA] shadow-card flex flex-col justify-between">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-slate-500">{tr('System Uptime')}</p>
              <h4 className="mt-2 text-3xl font-bold text-slate-900">3 {tr('Days')}</h4>
            </div>
            <div className="p-2 rounded-lg bg-green-50 text-green-600">
              <span className="material-symbols-outlined">timer</span>
            </div>
          </div>
          <div className="mt-4 text-sm text-slate-500">{tr('Since last maintenance')}</div>
        </article>
      </section>

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-slate-900">{tr('Recent Alerts')}</h3>
          <button
            type="button"
            onClick={() => onChangeView('alerts')}
            className="text-sm font-medium text-[#0073e6] hover:text-blue-700 transition-colors"
          >
            {tr('View all alerts')}
          </button>
        </div>

        <div className="bg-white rounded-xl border border-[#E5E5EA] shadow-card overflow-hidden">
          <div className="grid grid-cols-12 gap-4 px-6 py-3 bg-slate-50 border-b border-[#E5E5EA] text-xs font-semibold uppercase tracking-wider text-slate-500">
            <div className="col-span-2 md:col-span-1">{tr('Severity')}</div>
            <div className="col-span-4 md:col-span-2">{tr('Source')}</div>
            <div className="col-span-6 md:col-span-7">{tr('Message')}</div>
            <div className="hidden md:block col-span-2 text-right">{tr('Time')}</div>
          </div>

          <div className="divide-y divide-[#E5E5EA]">
            {visibleAlerts.map((alert) => (
              <button
                key={alert.id}
                type="button"
                onClick={() => onChangeView('alerts')}
                className="w-full grid grid-cols-12 gap-4 px-6 py-4 items-center text-left hover:bg-slate-50 transition-colors"
              >
                <div className="col-span-2 md:col-span-1">
                  <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold ${getSeverityClass(alert.severity)}`}>
                    {tr(alert.severity)}
                  </span>
                </div>
                <div className="col-span-4 md:col-span-2 font-medium text-slate-900 truncate">{alert.source}</div>
                <div className="col-span-6 md:col-span-7 text-sm text-slate-600 truncate">{alert.message}</div>
                <div className="hidden md:block col-span-2 text-right text-xs text-slate-400 font-medium">{alert.time}</div>
              </button>
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
