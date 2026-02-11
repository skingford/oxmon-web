'use client'

import { useEffect, useMemo, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import type { Agent } from '@/lib/types'
import { useI18n } from '@/contexts/I18nContext'

interface AgentsProps {
  agents: Agent[]
  onAddAgent: (agent: Agent) => void
  onDeleteAgent: (id: string) => void
  onUpdateStatus: (id: string) => void
  onShowToast: (message: string, type: 'success' | 'error' | 'info') => void
  initialInjection?: { agent: Agent; command: string } | null
  clearInjection?: () => void
}

interface AgentListRow {
  id: string
  status: Agent['status']
  ip: string
  version: string
  lastReported: string
}

const FALLBACK_ROWS: AgentListRow[] = [
  { id: 'ox-agent-001', status: 'Online', ip: '192.168.1.10', version: 'v1.2.4', lastReported: '2 mins ago' },
  { id: 'ox-agent-002', status: 'Offline', ip: '192.168.1.12', version: 'v1.2.4', lastReported: '4 hours ago' },
  { id: 'ox-agent-003', status: 'Online', ip: '10.0.0.5', version: 'v1.2.5', lastReported: 'Just now' },
  { id: 'ox-agent-004', status: 'Online', ip: '10.0.0.8', version: 'v1.2.3', lastReported: '5 mins ago' },
  { id: 'ox-agent-005', status: 'Maintenance', ip: '192.168.1.15', version: 'v1.2.4', lastReported: '1 day ago' },
]

function statusBadge(status: Agent['status']) {
  if (status === 'Online') {
    return {
      wrap: 'bg-green-100 text-green-700 border border-green-200',
      dot: 'bg-green-500',
    }
  }

  if (status === 'Maintenance') {
    return {
      wrap: 'bg-amber-100 text-amber-700 border border-amber-200',
      dot: 'bg-amber-500',
    }
  }

  return {
    wrap: 'bg-gray-100 text-gray-700 border border-gray-200',
    dot: 'bg-gray-400',
  }
}

export default function Agents({
  agents,
  onAddAgent,
  onDeleteAgent,
  onUpdateStatus,
  onShowToast,
  initialInjection,
  clearInjection,
}: AgentsProps) {
  const { tr } = useI18n()
  const router = useRouter()
  const params = useParams<{ locale?: string }>()
  const [searchTerm, setSearchTerm] = useState('')
  const [activeTab, setActiveTab] = useState<'list' | 'whitelist'>('list')
  const [selectedIds, setSelectedIds] = useState<string[]>([])

  const locale = params?.locale === 'zh' || params?.locale === 'en' ? params.locale : 'en'

  useEffect(() => {
    if (!initialInjection) return

    setSearchTerm(initialInjection.agent.id)
    onShowToast(`${tr('Initiating smart session for')} ${initialInjection.agent.id}...`, 'info')
    clearInjection?.()
  }, [clearInjection, initialInjection, onShowToast, tr])

  const rows = useMemo<AgentListRow[]>(() => {
    if (agents.length === 0) return FALLBACK_ROWS

    return agents
      .slice()
      .sort((a, b) => a.id.localeCompare(b.id))
      .map((agent) => ({
        id: agent.id,
        status: agent.status,
        ip: agent.ip,
        version: agent.version,
        lastReported: agent.lastReported,
      }))
  }, [agents])

  const filteredRows = useMemo(() => {
    const keyword = searchTerm.trim().toLowerCase()
    if (!keyword) return rows

    return rows.filter((row) => {
      return (
        row.id.toLowerCase().includes(keyword)
        || row.ip.toLowerCase().includes(keyword)
        || row.status.toLowerCase().includes(keyword)
      )
    })
  }, [rows, searchTerm])

  const visibleRows = filteredRows.slice(0, 5)
  const allVisibleSelected = visibleRows.length > 0 && visibleRows.every((row) => selectedIds.includes(row.id))
  const totalResults = 42

  const setRowSelection = (id: string, checked: boolean) => {
    setSelectedIds((prev) => {
      if (checked) {
        if (prev.includes(id)) return prev
        return [...prev, id]
      }

      return prev.filter((selectedId) => selectedId !== id)
    })
  }

  const setAllVisibleSelection = (checked: boolean) => {
    if (!checked) {
      setSelectedIds((prev) => prev.filter((id) => !visibleRows.some((row) => row.id === id)))
      return
    }

    setSelectedIds((prev) => {
      const next = new Set(prev)
      visibleRows.forEach((row) => next.add(row.id))
      return Array.from(next)
    })
  }

  const handleAddAgent = () => {
    const nextIndex = rows.length + 1
    const nextId = `ox-agent-${String(nextIndex).padStart(3, '0')}`

    onAddAgent({
      id: nextId,
      name: nextId,
      status: 'Online',
      ip: `10.0.1.${nextIndex}`,
      version: 'v1.2.6',
      lastReported: 'Just now',
    })

    onShowToast(`Node ${nextId} deployed.`, 'success')
  }

  return (
    <div className="flex flex-col gap-6 pt-6 animate-fade-in">
      <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-[#1D1D1F]">{tr('Agent Management')}</h2>
          <p className="mt-1 text-sm text-[#86868b]">{tr('Manage and monitor your infrastructure agents.')}</p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            className="flex h-10 w-10 items-center justify-center rounded-lg border border-transparent text-[#86868b] transition-all hover:border-gray-200 hover:bg-white hover:text-[#1D1D1F] hover:shadow-sm"
            aria-label={tr('Refresh')}
          >
            <span className="material-symbols-outlined">refresh</span>
          </button>
          <button
            type="button"
            onClick={handleAddAgent}
            className="flex items-center gap-2 rounded-lg bg-[#0073e6] px-4 py-2.5 text-sm font-medium text-white shadow-sm shadow-[#0073e6]/20 transition-all hover:bg-[#005bb5] active:scale-95"
          >
            <span className="material-symbols-outlined text-[18px]">add</span>
            <span>{tr('New Agent')}</span>
          </button>
        </div>
      </header>

      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div className="inline-flex rounded-lg bg-gray-200/50 p-1">
          <button
            type="button"
            onClick={() => setActiveTab('list')}
            className={`rounded-md px-4 py-1.5 text-sm font-medium transition-all ${
              activeTab === 'list' ? 'bg-white text-[#1D1D1F] shadow-sm' : 'text-[#86868b] hover:text-[#1D1D1F]'
            }`}
          >
            {tr('Agent List')}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('whitelist')}
            className={`rounded-md px-4 py-1.5 text-sm font-medium transition-all ${
              activeTab === 'whitelist' ? 'bg-white text-[#1D1D1F] shadow-sm' : 'text-[#86868b] hover:text-[#1D1D1F]'
            }`}
          >
            {tr('Whitelist')}
          </button>
        </div>

        <div className="group relative w-full sm:w-80">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
            <span className="material-symbols-outlined text-gray-400 transition-colors group-focus-within:text-[#0073e6]">search</span>
          </div>
          <input
            type="text"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder={tr('Search by ID, IP, or tag...')}
            className="block w-full rounded-lg border border-gray-200 bg-white py-2 pl-10 pr-3 text-sm leading-5 text-[#1D1D1F] placeholder-gray-400 outline-none transition-all focus:border-[#0073e6] focus:ring-2 focus:ring-[#0073e6]/50"
          />
        </div>
      </div>

      {activeTab === 'whitelist' ? (
        <section className="rounded-xl border border-gray-100 bg-white p-10 text-center shadow-[0_4px_24px_rgba(0,0,0,0.04)]">
          <h3 className="text-lg font-semibold text-[#1D1D1F]">{tr('Whitelist')}</h3>
          <p className="mt-2 text-sm text-[#86868b]">{tr('No matching assets identified.')}</p>
        </section>
      ) : (
        <>
          <section className="overflow-hidden rounded-xl border border-gray-100 bg-white shadow-[0_4px_24px_rgba(0,0,0,0.04)]">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-100">
                <thead>
                  <tr className="bg-gray-50/50">
                    <th scope="col" className="w-12 px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-[#86868b]">
                      <input
                        type="checkbox"
                        checked={allVisibleSelected}
                        onChange={(event) => setAllVisibleSelection(event.target.checked)}
                        className="rounded border-gray-300 bg-white text-[#0073e6] focus:ring-[#0073e6]/50"
                      />
                    </th>
                    <th scope="col" className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-[#86868b]">
                      <div className="group inline-flex cursor-pointer items-center gap-1 hover:text-[#0073e6]">
                        {tr('Agent ID')}
                        <span className="material-symbols-outlined text-[16px] opacity-0 transition-opacity group-hover:opacity-100">arrow_drop_down</span>
                      </div>
                    </th>
                    <th scope="col" className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-[#86868b]">{tr('Status')}</th>
                    <th scope="col" className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-[#86868b]">{tr('IP Address')}</th>
                    <th scope="col" className="hidden px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-[#86868b] md:table-cell">{tr('Version')}</th>
                    <th scope="col" className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-[#86868b]">{tr('Last Reported')}</th>
                    <th scope="col" className="relative px-6 py-4">
                      <span className="sr-only">{tr('Actions')}</span>
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-gray-100 bg-white">
                  {visibleRows.map((row) => {
                    const badge = statusBadge(row.status)
                    const checked = selectedIds.includes(row.id)

                    return (
                      <tr key={row.id} className="group transition-colors hover:bg-gray-50/80">
                        <td className="whitespace-nowrap px-6 py-4">
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={(event) => setRowSelection(row.id, event.target.checked)}
                            className="rounded border-gray-300 bg-white text-[#0073e6] focus:ring-[#0073e6]/50"
                          />
                        </td>

                        <td className="whitespace-nowrap px-6 py-4">
                          <button
                            type="button"
                            onClick={() => router.push(`/${locale}/agents/${encodeURIComponent(row.id)}`)}
                            className="flex items-center gap-2 text-sm font-medium text-[#0073e6] transition-colors hover:text-[#005bb5]"
                          >
                            {row.id}
                            <span className="material-symbols-outlined text-[14px] opacity-0 transition-opacity group-hover:opacity-100">open_in_new</span>
                          </button>
                        </td>

                        <td className="whitespace-nowrap px-6 py-4">
                          <button
                            type="button"
                            onClick={() => onUpdateStatus(row.id)}
                            className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium ${badge.wrap}`}
                          >
                            <span className={`h-1.5 w-1.5 rounded-full ${badge.dot}`} />
                            {tr(row.status)}
                          </button>
                        </td>

                        <td className="whitespace-nowrap px-6 py-4 font-mono text-sm text-[#1D1D1F]">{row.ip}</td>
                        <td className="hidden whitespace-nowrap px-6 py-4 text-sm text-[#86868b] md:table-cell">{row.version}</td>
                        <td className="whitespace-nowrap px-6 py-4 text-sm text-[#86868b]">{tr(row.lastReported)}</td>

                        <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-medium">
                          <button
                            type="button"
                            onClick={() => onDeleteAgent(row.id)}
                            className="rounded-md p-1 text-gray-400 transition-colors hover:bg-gray-100 hover:text-[#1D1D1F]"
                            aria-label={`${tr('Actions')} ${row.id}`}
                          >
                            <span className="material-symbols-outlined">more_horiz</span>
                          </button>
                        </td>
                      </tr>
                    )
                  })}

                  {visibleRows.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-10 text-center text-sm font-medium text-[#86868b]">
                        {tr('No matching assets identified.')}
                      </td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>

            <div className="border-t border-gray-100 bg-gray-50/30 px-6 py-4">
              <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
                <p className="text-sm text-[#86868b]">
                  {tr('Showing')} <span className="font-medium text-[#1D1D1F]">1</span> {tr('to')} <span className="font-medium text-[#1D1D1F]">{visibleRows.length}</span> {tr('of')} <span className="font-medium text-[#1D1D1F]">{totalResults}</span> {tr('results')}
                </p>

                <nav className="relative z-0 inline-flex -space-x-px rounded-md shadow-sm" aria-label={tr('Pagination')}>
                  <button type="button" className="relative inline-flex items-center rounded-l-md border border-gray-200 bg-white px-2 py-2 text-sm font-medium text-gray-500 hover:bg-gray-50">
                    <span className="sr-only">{tr('Previous')}</span>
                    <span className="material-symbols-outlined">chevron_left</span>
                  </button>
                  <button type="button" className="relative z-10 inline-flex items-center border border-[#0073e6] bg-[#0073e6]/10 px-4 py-2 text-sm font-medium text-[#0073e6]">1</button>
                  <button type="button" className="relative inline-flex items-center border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-500 hover:bg-gray-50">2</button>
                  <button type="button" className="relative hidden items-center border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-500 hover:bg-gray-50 md:inline-flex">3</button>
                  <span className="relative inline-flex items-center border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700">...</span>
                  <button type="button" className="relative hidden items-center border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-500 hover:bg-gray-50 md:inline-flex">8</button>
                  <button type="button" className="relative inline-flex items-center rounded-r-md border border-gray-200 bg-white px-2 py-2 text-sm font-medium text-gray-500 hover:bg-gray-50">
                    <span className="sr-only">{tr('Next')}</span>
                    <span className="material-symbols-outlined">chevron_right</span>
                  </button>
                </nav>
              </div>

              <div className="flex w-full justify-between sm:hidden">
                <button type="button" className="relative inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
                  {tr('Previous')}
                </button>
                <button type="button" className="relative inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
                  {tr('Next')}
                </button>
              </div>
            </div>
          </section>

          <section className="grid grid-cols-1 gap-6 md:grid-cols-3">
            <article className="flex items-start gap-4 rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
              <div className="rounded-lg bg-green-50 p-2 text-green-600">
                <span className="material-symbols-outlined">check_circle</span>
              </div>
              <div>
                <p className="text-sm font-medium text-[#86868b]">{tr('System Status')}</p>
                <p className="mt-1 text-xl font-bold text-[#1D1D1F]">98% Online</p>
                <p className="mt-1 flex items-center gap-1 text-xs text-green-600">
                  <span className="material-symbols-outlined text-[14px]">trending_up</span>
                  +2.4% {tr('this week')}
                </p>
              </div>
            </article>

            <article className="flex items-start gap-4 rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
              <div className="rounded-lg bg-blue-50 p-2 text-blue-600">
                <span className="material-symbols-outlined">update</span>
              </div>
              <div>
                <p className="text-sm font-medium text-[#86868b]">{tr('Pending Updates')}</p>
                <p className="mt-1 text-xl font-bold text-[#1D1D1F]">12 {tr('Agents')}</p>
                <p className="mt-1 text-xs text-[#86868b]">{tr('Scheduled for 02:00 AM')}</p>
              </div>
            </article>

            <article className="flex items-start gap-4 rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
              <div className="rounded-lg bg-red-50 p-2 text-red-600">
                <span className="material-symbols-outlined">warning</span>
              </div>
              <div>
                <p className="text-sm font-medium text-[#86868b]">{tr('Critical Alerts')}</p>
                <p className="mt-1 text-xl font-bold text-[#1D1D1F]">3 {tr('Issues')}</p>
                <button type="button" className="mt-1 text-xs text-red-600 transition-colors hover:underline">{tr('View details')}</button>
              </div>
            </article>
          </section>
        </>
      )}
    </div>
  )
}
