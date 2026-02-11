'use client'

import { useEffect, useMemo, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import type { Agent } from '@/lib/types'
import { createHexToken } from '@/lib/id'
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

function createAgentAccessToken(): string {
  return `ox_ag_${createHexToken(72)}`
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
  const { tr, t } = useI18n()
  const router = useRouter()
  const params = useParams<{ locale?: string }>()
  const [searchTerm, setSearchTerm] = useState('')
  const [activeTab, setActiveTab] = useState<'list' | 'whitelist'>('list')
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [isAddAgentModalOpen, setIsAddAgentModalOpen] = useState(false)
  const [newAgentId, setNewAgentId] = useState('')
  const [newAgentDescription, setNewAgentDescription] = useState('')
  const [addAgentError, setAddAgentError] = useState<string | null>(null)
  const [isTokenModalOpen, setIsTokenModalOpen] = useState(false)
  const [generatedToken, setGeneratedToken] = useState('')
  const [generatedTokenAgentId, setGeneratedTokenAgentId] = useState('')
  const [isTokenCopied, setIsTokenCopied] = useState(false)
  const [isRegenerateConfirmOpen, setIsRegenerateConfirmOpen] = useState(false)

  const locale = params?.locale === 'zh' || params?.locale === 'en' ? params.locale : 'en'

  useEffect(() => {
    if (!initialInjection) return

    setSearchTerm(initialInjection.agent.id)
    onShowToast(`${tr('Initiating smart session for')} ${initialInjection.agent.id}...`, 'info')
    clearInjection?.()
  }, [clearInjection, initialInjection, onShowToast, tr])

  useEffect(() => {
    if (!isAddAgentModalOpen) return

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return
      setIsAddAgentModalOpen(false)
      setNewAgentId('')
      setNewAgentDescription('')
      setAddAgentError(null)
    }

    window.addEventListener('keydown', handleEscape)
    return () => window.removeEventListener('keydown', handleEscape)
  }, [isAddAgentModalOpen])

  useEffect(() => {
    if (!isTokenModalOpen) return

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return
      closeTokenModal()
    }

    window.addEventListener('keydown', handleEscape)
    return () => window.removeEventListener('keydown', handleEscape)
  }, [isTokenModalOpen])

  useEffect(() => {
    if (!isRegenerateConfirmOpen) return

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return
      setIsRegenerateConfirmOpen(false)
    }

    window.addEventListener('keydown', handleEscape)
    return () => window.removeEventListener('keydown', handleEscape)
  }, [isRegenerateConfirmOpen])

  useEffect(() => {
    if (!isTokenCopied) return

    const timeoutId = window.setTimeout(() => {
      setIsTokenCopied(false)
    }, 1600)

    return () => window.clearTimeout(timeoutId)
  }, [isTokenCopied])

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

  const closeAddAgentModal = () => {
    setIsAddAgentModalOpen(false)
    setNewAgentId('')
    setNewAgentDescription('')
    setAddAgentError(null)
  }

  const handleOpenAddAgentModal = () => {
    setIsAddAgentModalOpen(true)
    setAddAgentError(null)
  }

  const openTokenModal = (agentId: string) => {
    setGeneratedToken(createAgentAccessToken())
    setGeneratedTokenAgentId(agentId)
    setIsTokenModalOpen(true)
    setIsTokenCopied(false)
    setIsRegenerateConfirmOpen(false)
  }

  const closeTokenModal = () => {
    setIsTokenModalOpen(false)
    setIsTokenCopied(false)
    setIsRegenerateConfirmOpen(false)
  }

  const handleOpenRegenerateConfirm = () => {
    setIsRegenerateConfirmOpen(true)
  }

  const handleConfirmRegenerateToken = () => {
    setGeneratedToken(createAgentAccessToken())
    setIsTokenCopied(false)
    setIsRegenerateConfirmOpen(false)
    onShowToast('Security key rotated.', 'success')
  }

  const handleCopyGeneratedToken = async () => {
    if (!generatedToken) return

    try {
      await navigator.clipboard.writeText(generatedToken)
      setIsTokenCopied(true)
      onShowToast(tr('Key copied.'), 'info')
    } catch {
      onShowToast(tr('Export failed.'), 'error')
    }
  }

  const handleAddAgent = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const normalizedId = newAgentId.trim()
    const normalizedDescription = newAgentDescription.trim()

    if (!normalizedId) {
      setAddAgentError(t('agents.modal.error.required'))
      return
    }

    const idExists = rows.some((row) => row.id.toLowerCase() === normalizedId.toLowerCase())
    if (idExists) {
      setAddAgentError(t('agents.modal.error.duplicate'))
      return
    }

    const nextIndex = rows.length + 1

    onAddAgent({
      id: normalizedId,
      name: normalizedDescription || normalizedId,
      status: 'Online',
      ip: `10.0.1.${nextIndex}`,
      version: 'v1.2.6',
      lastReported: 'Just now',
    })

    setActiveTab('list')
    setSearchTerm(normalizedId)
    onShowToast(`Node ${normalizedId} deployed.`, 'success')
    closeAddAgentModal()
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
            onClick={handleOpenAddAgentModal}
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
                          <div className="flex items-center justify-end gap-1">
                            <button
                              type="button"
                              onClick={() => openTokenModal(row.id)}
                              className="rounded-md p-1 text-gray-400 transition-colors hover:bg-gray-100 hover:text-[#1D1D1F]"
                              aria-label={`${t('agents.table.generateToken')} ${row.id}`}
                            >
                              <span className="material-symbols-outlined">key</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => onDeleteAgent(row.id)}
                              className="rounded-md p-1 text-gray-400 transition-colors hover:bg-gray-100 hover:text-[#1D1D1F]"
                              aria-label={`${tr('Actions')} ${row.id}`}
                            >
                              <span className="material-symbols-outlined">more_horiz</span>
                            </button>
                          </div>
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

      {isAddAgentModalOpen ? (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 sm:p-6" role="dialog" aria-modal="true">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity"
            onClick={closeAddAgentModal}
          />

          <div className="relative flex w-full max-w-[520px] transform flex-col overflow-hidden rounded-lg bg-white shadow-2xl ring-1 ring-black/5">
            <div className="flex items-center justify-between border-b border-gray-100 px-6 py-5">
              <h2 className="text-xl font-bold tracking-tight text-[#111418]">{t('agents.modal.title')}</h2>
              <button
                type="button"
                onClick={closeAddAgentModal}
                className="text-gray-400 transition-colors hover:text-gray-500 focus:outline-none"
                aria-label={t('agents.modal.close')}
              >
                <span className="material-symbols-outlined text-2xl">close</span>
              </button>
            </div>

            <form onSubmit={handleAddAgent}>
              <div className="flex flex-col gap-5 px-6 py-6">
                <div className="space-y-2">
                  <label htmlFor="agent-id" className="block text-sm font-semibold leading-6 text-[#111418]">
                    {t('agents.modal.agentId')} <span className="text-xs align-top text-red-500">*</span>
                  </label>

                  <div className="relative rounded-md shadow-sm">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                      <span className="material-symbols-outlined text-[20px] text-gray-400">dns</span>
                    </div>
                    <input
                      id="agent-id"
                      name="agent-id"
                      type="text"
                      autoFocus
                      value={newAgentId}
                      onChange={(event) => {
                        setNewAgentId(event.target.value)
                        if (addAgentError) setAddAgentError(null)
                      }}
                      placeholder={t('agents.modal.agentIdPlaceholder')}
                      className="block w-full rounded-md border-0 py-3 pl-10 text-[#111418] shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 transition-shadow focus:ring-2 focus:ring-inset focus:ring-[#0b73da] sm:text-sm sm:leading-6"
                    />
                  </div>

                  {addAgentError ? <p className="mt-1 text-xs text-red-500">{addAgentError}</p> : null}
                  <p className="mt-1 text-xs text-gray-500">{t('agents.modal.agentIdHint')}</p>
                </div>

                <div className="space-y-2">
                  <label htmlFor="agent-description" className="block text-sm font-semibold leading-6 text-[#111418]">
                    {t('agents.modal.description')} <span className="ml-1 text-xs font-normal text-gray-400">({t('agents.modal.optional')})</span>
                  </label>

                  <div className="relative rounded-md shadow-sm">
                    <textarea
                      id="agent-description"
                      name="agent-description"
                      rows={4}
                      value={newAgentDescription}
                      onChange={(event) => setNewAgentDescription(event.target.value)}
                      placeholder={t('agents.modal.descriptionPlaceholder')}
                      className="block w-full resize-none rounded-md border-0 px-3 py-3 text-[#111418] shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 transition-shadow focus:ring-2 focus:ring-inset focus:ring-[#0b73da] sm:text-sm sm:leading-6"
                    />
                  </div>
                </div>
              </div>

              <div className="flex flex-row-reverse gap-3 border-t border-gray-100 bg-gray-50 px-6 py-4">
                <button
                  type="submit"
                  className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-[#0b73da] px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-blue-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0b73da] sm:w-auto"
                >
                  <span className="material-symbols-outlined text-[18px]">add</span>
                  <span>{t('agents.modal.addButton')}</span>
                </button>

                <button
                  type="button"
                  onClick={closeAddAgentModal}
                  className="inline-flex w-full justify-center rounded-md bg-white px-5 py-2.5 text-sm font-semibold text-[#0b73da] shadow-sm ring-1 ring-inset ring-[#0b73da]/30 transition-colors hover:bg-gray-50 sm:w-auto"
                >
                  {t('agents.modal.cancelButton')}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      {isTokenModalOpen ? (
        <div className="fixed inset-0 z-[130] flex items-center justify-center p-4" role="dialog" aria-modal="true">
          <div className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm transition-opacity" onClick={closeTokenModal} />

          <div className="relative w-full max-w-lg transform overflow-hidden rounded-xl bg-white shadow-2xl transition-all sm:my-8">
            <div className="bg-white px-4 pb-4 pt-5 sm:p-6 sm:pb-4">
              <div className="sm:flex sm:items-start">
                <div className="mx-auto flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-green-100 sm:mx-0 sm:h-10 sm:w-10">
                  <span className="material-symbols-outlined text-2xl text-green-600">check_circle</span>
                </div>

                <div className="mt-3 w-full text-center sm:ml-4 sm:mt-0 sm:text-left">
                  <h3 className="text-xl font-semibold leading-6 text-slate-900">{t('agents.tokenModal.title')}</h3>
                  <div className="mt-2 space-y-2">
                    <p className="text-sm text-slate-500">{t('agents.tokenModal.subtitle')}</p>
                    <p className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700">
                      {t('agents.tokenModal.agentTag', { id: generatedTokenAgentId })}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="px-4 py-2 sm:px-6">
              <div className="mb-5 rounded-lg border border-yellow-200 bg-[#FFF8E1] p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <span aria-hidden="true" className="material-symbols-outlined text-xl text-orange-500">warning</span>
                  </div>

                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-orange-800">{t('agents.tokenModal.warningTitle')}</h3>
                    <div className="mt-1 text-sm text-orange-700">
                      <p>{t('agents.tokenModal.warningDescription')}</p>
                    </div>
                  </div>
                </div>
              </div>

              <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-slate-500" htmlFor="token-display">
                {t('agents.tokenModal.tokenLabel')}
              </label>

              <div className="relative mb-6 flex items-center">
                <div className="flex w-full items-center rounded-lg border border-transparent bg-[#F5F5F7] pr-2 transition-colors duration-200 focus-within:bg-white focus-within:ring-2 focus-within:ring-[#0b73da]">
                  <div className="flex-1 overflow-x-auto py-3 pl-4 [scrollbar-width:thin]">
                    <code id="token-display" className="whitespace-nowrap font-mono text-sm text-slate-700 select-all">{generatedToken}</code>
                  </div>

                  <div className="mx-2 h-8 w-px bg-slate-200" />

                  <button
                    type="button"
                    onClick={handleCopyGeneratedToken}
                    aria-label={t('agents.tokenModal.copyAria')}
                    className="group relative flex flex-col items-center justify-center rounded-md p-2 transition-colors hover:bg-slate-200 focus:outline-none focus:ring-2 focus:ring-[#0b73da] focus:ring-offset-2"
                  >
                    <span className="material-symbols-outlined text-[20px] text-[#0b73da] transition-transform group-hover:scale-110">content_copy</span>
                    <span className="pointer-events-none absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap rounded bg-slate-800 px-2 py-1 text-xs text-white opacity-0 transition-opacity group-hover:opacity-100">
                      {isTokenCopied ? t('agents.tokenModal.copied') : t('agents.tokenModal.copy')}
                    </span>
                  </button>
                </div>
              </div>
            </div>

            <div className="border-t border-slate-100 bg-slate-50 px-4 py-4 sm:flex sm:flex-row-reverse sm:px-6">
              <button
                type="button"
                onClick={closeTokenModal}
                className="inline-flex w-full justify-center rounded-lg bg-[#0b73da] px-3 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-[#0b73da]/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0b73da] sm:ml-3 sm:w-auto"
              >
                {t('agents.tokenModal.closeButton')}
              </button>

              <button
                type="button"
                onClick={handleOpenRegenerateConfirm}
                className="mt-3 inline-flex w-full justify-center rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition-colors hover:bg-slate-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-300 sm:mt-0 sm:w-auto"
              >
                {t('agents.tokenModal.regenerateButton')}
              </button>

              <div className="mt-3 flex items-center sm:mr-auto sm:mt-0">
                <span className="material-symbols-outlined mr-1 text-sm text-slate-400">lock</span>
                <span className="text-xs text-slate-500">{t('agents.tokenModal.authenticated')}</span>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {isRegenerateConfirmOpen ? (
        <div className="fixed inset-0 z-[140] flex items-center justify-center bg-black/40 p-4 backdrop-blur-[8px]" role="dialog" aria-modal="true">
          <div
            className="absolute inset-0"
            onClick={() => setIsRegenerateConfirmOpen(false)}
          />

          <div className="relative w-full max-w-[480px] transform overflow-hidden rounded-lg border border-gray-100/10 bg-white shadow-2xl transition-all">
            <div className="pointer-events-none absolute top-0 left-0 h-64 w-64 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#0b73da]/5 blur-3xl" />
            <div className="pointer-events-none absolute right-0 bottom-0 h-64 w-64 translate-x-1/3 translate-y-1/3 rounded-full bg-purple-500/5 blur-3xl" />

            <div className="relative flex flex-col items-center p-8 text-center">
              <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-full bg-[#0b73da]/10">
                <span className="material-symbols-outlined text-[32px] text-[#0b73da]">sync_lock</span>
              </div>

              <h2 className="mb-3 text-2xl font-bold tracking-tight text-gray-900">{t('agents.regenerateConfirm.title')}</h2>
              <p className="mb-8 text-[15px] leading-relaxed text-gray-600">{t('agents.regenerateConfirm.description')}</p>

              <div className="flex w-full flex-col-reverse justify-center gap-3 sm:flex-row">
                <button
                  type="button"
                  onClick={() => setIsRegenerateConfirmOpen(false)}
                  className="h-11 min-w-[120px] flex-1 rounded-lg border border-gray-200 bg-white px-6 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-200"
                >
                  {t('agents.regenerateConfirm.cancelButton')}
                </button>

                <button
                  type="button"
                  onClick={handleConfirmRegenerateToken}
                  className="h-11 min-w-[120px] flex-1 rounded-lg bg-[#0b73da] px-6 text-sm font-semibold text-white shadow-md transition-all hover:bg-blue-600 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-[#0b73da]/50"
                >
                  {t('agents.regenerateConfirm.confirmButton')}
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}
