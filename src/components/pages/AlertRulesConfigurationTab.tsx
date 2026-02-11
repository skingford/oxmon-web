'use client'

import { useEffect, useState } from 'react'
import { AlertHistoryLogPanel } from '@/components/features/AlertHistoryLog'

type RuleSeverity = 'Critical' | 'Warning' | 'Info'

type AlertRule = {
  name: string
  hint: string
  type: string
  metric: string
  agentMatch: string
  severity: RuleSeverity
  enabled: boolean
}

type AlertViewTab = 'rules' | 'history'

type AlertRulesConfigurationTabProps = {
  initialTab?: AlertViewTab
}

const ALERT_RULE_ROWS: AlertRule[] = [
  {
    name: 'High CPU Load',
    hint: '> 90% for 5m',
    type: 'Threshold',
    metric: 'cpu.usage_idle',
    agentMatch: 'prod-db-*',
    severity: 'Critical',
    enabled: true,
  },
  {
    name: 'Disk Space Low',
    hint: 'Free space < 10%',
    type: 'Prediction',
    metric: 'disk.free',
    agentMatch: '*-web-*',
    severity: 'Warning',
    enabled: true,
  },
  {
    name: 'Agent Offline',
    hint: 'No ping > 2m',
    type: 'Availability',
    metric: 'agent.ping',
    agentMatch: '*',
    severity: 'Info',
    enabled: false,
  },
  {
    name: 'Memory Spike',
    hint: 'Sudden increase > 20%',
    type: 'Rate of Change',
    metric: 'mem.used',
    agentMatch: 'cache-*',
    severity: 'Warning',
    enabled: true,
  },
  {
    name: 'Network Latency',
    hint: '> 300ms',
    type: 'Threshold',
    metric: 'net.latency',
    agentMatch: 'lb-*',
    severity: 'Critical',
    enabled: true,
  },
]

function getSeverityBadgeClass(severity: RuleSeverity): string {
  if (severity === 'Critical') {
    return 'border border-red-100 bg-red-50 text-red-600'
  }

  if (severity === 'Warning') {
    return 'border border-amber-100 bg-amber-50 text-amber-600'
  }

  return 'border border-blue-100 bg-blue-50 text-blue-600'
}

function getSeverityDotClass(severity: RuleSeverity): string {
  if (severity === 'Critical') {
    return 'bg-red-500'
  }

  if (severity === 'Warning') {
    return 'bg-amber-500'
  }

  return 'bg-blue-500'
}

function ToggleSwitch({ checked, id }: { checked: boolean; id: string }) {
  return (
    <div className="inline-block h-7 w-[3.25rem]">
      <input
        type="checkbox"
        id={id}
        readOnly
        checked={checked}
        className="peer sr-only"
      />
      <label
        htmlFor={id}
        className="relative block h-6 w-10 cursor-pointer rounded-full bg-[#E5E5EA] transition-colors peer-checked:bg-[#34C759]"
      >
        <span className="absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow-[0_1px_3px_rgba(0,0,0,0.15)] transition-transform peer-checked:translate-x-4" />
      </label>
    </div>
  )
}

function AlertRulesTable() {
  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-4 py-1">
        <div className="relative max-w-md min-w-[280px] flex-1">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[#6E6E73]">search</span>
          <input
            type="text"
            placeholder="Search rules..."
            className="w-full rounded-lg border border-[#D2D2D7] bg-white py-2.5 pl-10 pr-4 text-sm text-[#1D1D1F] placeholder:text-[#6E6E73] shadow-sm transition-shadow focus:border-[#0071E3] focus:outline-none focus:ring-2 focus:ring-[#0071E3]/50"
          />
        </div>

        <div className="flex gap-3">
          <button
            type="button"
            className="flex items-center gap-2 rounded-lg border border-[#D2D2D7] bg-white px-4 py-2.5 text-sm font-medium text-[#1D1D1F] shadow-sm transition-colors hover:bg-gray-50"
          >
            <span className="material-symbols-outlined text-[18px] text-[#6E6E73]">filter_list</span>
            <span>Severity</span>
            <span className="material-symbols-outlined text-[18px] text-[#6E6E73]">expand_more</span>
          </button>

          <button
            type="button"
            className="flex items-center gap-2 rounded-lg border border-[#D2D2D7] bg-white px-4 py-2.5 text-sm font-medium text-[#1D1D1F] shadow-sm transition-colors hover:bg-gray-50"
          >
            <span className="material-symbols-outlined text-[18px] text-[#6E6E73]">category</span>
            <span>Type</span>
            <span className="material-symbols-outlined text-[18px] text-[#6E6E73]">expand_more</span>
          </button>
        </div>
      </div>

      <section className="overflow-hidden rounded-xl border border-transparent bg-white shadow-[0_2px_12px_rgba(0,0,0,0.08)]">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px]">
            <thead className="border-b border-[#E5E5EA] bg-gray-50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-[#6E6E73]">Rule Name</th>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-[#6E6E73]">Type</th>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-[#6E6E73]">Metric</th>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-[#6E6E73]">
                  <span className="inline-block leading-[1.15]">Agent<br />Match</span>
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-[#6E6E73]">Severity</th>
                <th className="px-6 py-4 text-center text-xs font-semibold uppercase tracking-wider text-[#6E6E73]">Status</th>
                <th className="px-6 py-4 text-right text-xs font-semibold uppercase tracking-wider text-[#6E6E73]">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-[#E5E5EA]">
              {ALERT_RULE_ROWS.map((rule, index) => (
                <tr key={`${rule.name}-${index}`} className="group transition-colors hover:bg-gray-50">
                  <td className="whitespace-nowrap px-6 py-4">
                    <div className="flex flex-col">
                      <span className="text-sm font-semibold text-[#1D1D1F]">{rule.name}</span>
                      <span className="mt-0.5 hidden text-xs text-[#6E6E73] transition-all group-hover:block">{rule.hint}</span>
                    </div>
                  </td>

                  <td className="whitespace-nowrap px-6 py-4">
                    <span className="inline-flex items-center rounded-md border border-gray-200 bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-700">
                      {rule.type}
                    </span>
                  </td>

                  <td className="whitespace-nowrap px-6 py-4">
                    <code className="rounded border border-gray-200 bg-gray-50 px-2 py-1 font-mono text-xs text-gray-600">{rule.metric}</code>
                  </td>

                  <td className="whitespace-nowrap px-6 py-4">
                    <code className="font-mono text-xs text-[#0071E3]">{rule.agentMatch}</code>
                  </td>

                  <td className="whitespace-nowrap px-6 py-4">
                    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${getSeverityBadgeClass(rule.severity)}`}>
                      <span className={`h-1.5 w-1.5 rounded-full ${getSeverityDotClass(rule.severity)}`} />
                      {rule.severity}
                    </span>
                  </td>

                  <td className="whitespace-nowrap px-6 py-4 text-center">
                    <ToggleSwitch checked={rule.enabled} id={`rule-toggle-${index}`} />
                  </td>

                  <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-medium">
                    <button
                      type="button"
                      className="rounded-md p-1 text-[#6E6E73] transition-colors hover:bg-gray-100 hover:text-[#0071E3]"
                    >
                      <span className="material-symbols-outlined text-[20px]">more_vert</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between border-t border-[#E5E5EA] bg-white px-6 py-4">
          <span className="text-sm text-[#6E6E73]">
            Showing <span className="font-medium text-[#1D1D1F]">1</span> to <span className="font-medium text-[#1D1D1F]">5</span> of{' '}
            <span className="font-medium text-[#1D1D1F]">12</span> results
          </span>

          <div className="flex gap-2">
            <button
              type="button"
              disabled
              className="cursor-not-allowed rounded-lg border border-[#E5E5EA] bg-gray-50 px-3 py-1.5 text-sm font-medium text-gray-400"
            >
              Previous
            </button>

            <button
              type="button"
              className="rounded-lg border border-[#E5E5EA] px-3 py-1.5 text-sm font-medium text-[#1D1D1F] transition-colors hover:bg-gray-50"
            >
              Next
            </button>
          </div>
        </div>
      </section>
    </>
  )
}

export default function AlertRulesConfigurationTab({
  initialTab = 'rules',
}: AlertRulesConfigurationTabProps) {
  const [activeTab, setActiveTab] = useState<AlertViewTab>(initialTab)

  useEffect(() => {
    setActiveTab(initialTab)
  }, [initialTab])

  const isHistoryTab = activeTab === 'history'

  return (
    <div className="flex flex-col gap-6 pt-6 animate-fade-in">
      <header className="flex flex-col items-start justify-between gap-4 lg:flex-row lg:items-end">
        <div>
          <div className="mb-2 inline-flex items-center gap-2 text-sm text-[#6E6E73]">
            <span className="material-symbols-outlined text-[18px]">{isHistoryTab ? 'history' : 'notifications'}</span>
            <span className="font-medium text-[#1D1D1F]">Alerts</span>
          </div>
          <h2 className="text-3xl font-bold tracking-tight text-[#1D1D1F] md:text-4xl">
            {isHistoryTab ? 'Alert History' : 'Alert Rules'}
          </h2>
          <p className="mt-1 max-w-2xl text-base text-[#6E6E73]">
            {isHistoryTab
              ? 'Monitor infrastructure health and review historical alert logs.'
              : 'Configure threshold and anomaly detection rules for your infrastructure.'}
          </p>
        </div>

        {isHistoryTab ? (
          <button
            type="button"
            className="flex items-center gap-2 rounded-lg border border-[#e5e7eb] bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm transition-colors hover:bg-slate-50"
          >
            <span className="material-symbols-outlined text-[20px]">download</span>
            Export CSV
          </button>
        ) : (
          <button
            type="button"
            className="group flex h-10 items-center justify-center gap-2 rounded-lg bg-[#0071E3] px-5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-blue-600 active:scale-95"
          >
            <span className="material-symbols-outlined text-[20px]">add</span>
            <span>Create Rule</span>
          </button>
        )}
      </header>

      <div className="border-b border-[#E5E5EA]">
        <div className="flex gap-1 overflow-x-auto whitespace-nowrap [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
          <button
            type="button"
            onClick={() => setActiveTab('rules')}
            className={`border-b-2 px-4 py-3 text-sm font-medium transition-colors ${
              activeTab === 'rules'
                ? 'border-[#0071E3] text-[#0071E3]'
                : 'border-transparent text-[#6E6E73] hover:text-[#1D1D1F]'
            }`}
          >
            Alert Rules
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('history')}
            className={`border-b-2 px-4 py-3 text-sm font-medium transition-colors ${
              activeTab === 'history'
                ? 'border-[#0071E3] text-[#0071E3]'
                : 'border-transparent text-[#6E6E73] hover:text-[#1D1D1F]'
            }`}
          >
            Alert History
          </button>

          <button
            type="button"
            className="cursor-not-allowed border-b-2 border-transparent px-4 py-3 text-sm font-medium text-[#9a9aa1]"
          >
            Notification Channels
          </button>

          <button
            type="button"
            className="cursor-not-allowed border-b-2 border-transparent px-4 py-3 text-sm font-medium text-[#9a9aa1]"
          >
            Silencing
          </button>
        </div>
      </div>

      {isHistoryTab ? <AlertHistoryLogPanel /> : <AlertRulesTable />}
    </div>
  )
}
