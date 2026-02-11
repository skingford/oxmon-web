'use client'

import { useCallback, useDeferredValue, useEffect, useMemo, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import type { Agent } from '@/lib/types'
import { createHexToken } from '@/lib/id'
import { useI18n } from '@/contexts/I18nContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Label } from '@/components/ui/label'
import { CheckCircle2, ChevronDown, Copy, Ellipsis, ExternalLink, KeyRound, Lock, Plus, RefreshCw, Search, Server, Trash2, TrendingUp, TriangleAlert, X } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Checkbox } from '@/components/ui/checkbox'

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
  const deferredSearchTerm = useDeferredValue(searchTerm)
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
  const [pendingDeleteAgentId, setPendingDeleteAgentId] = useState<string | null>(null)

  const locale = useMemo(() => (
    params?.locale === 'zh' || params?.locale === 'en' ? params.locale : 'en'
  ), [params?.locale])

  useEffect(() => {
    if (!initialInjection) return

    setSearchTerm(initialInjection.agent.id)
    onShowToast(`${tr('Initiating smart session for')} ${initialInjection.agent.id}...`, 'info')
    clearInjection?.()
  }, [clearInjection, initialInjection, onShowToast, tr])

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
    const keyword = deferredSearchTerm.trim().toLowerCase()
    if (!keyword) return rows

    return rows.filter((row) => {
      return (
        row.id.toLowerCase().includes(keyword)
        || row.ip.toLowerCase().includes(keyword)
        || row.status.toLowerCase().includes(keyword)
      )
    })
  }, [deferredSearchTerm, rows])

  const visibleRows = useMemo(() => filteredRows.slice(0, 5), [filteredRows])
  const selectedIdSet = useMemo(() => new Set(selectedIds), [selectedIds])
  const visibleRowIdSet = useMemo(() => new Set(visibleRows.map((row) => row.id)), [visibleRows])
  const existingRowIdSet = useMemo(() => new Set(rows.map((row) => row.id.toLowerCase())), [rows])
  const allVisibleSelected = useMemo(() => (
    visibleRows.length > 0 && visibleRows.every((row) => selectedIdSet.has(row.id))
  ), [selectedIdSet, visibleRows])
  const totalResults = 42

  const setRowSelection = useCallback((id: string, checked: boolean) => {
    setSelectedIds((prev) => {
      if (checked) {
        if (prev.includes(id)) return prev
        return [...prev, id]
      }

      return prev.filter((selectedId) => selectedId !== id)
    })
  }, [])

  const setAllVisibleSelection = useCallback((checked: boolean) => {
    if (!checked) {
      setSelectedIds((prev) => prev.filter((id) => !visibleRowIdSet.has(id)))
      return
    }

    setSelectedIds((prev) => {
      const next = new Set(prev)
      visibleRows.forEach((row) => next.add(row.id))
      return Array.from(next)
    })
  }, [visibleRowIdSet, visibleRows])

  const closeAddAgentModal = useCallback(() => {
    setIsAddAgentModalOpen(false)
    setNewAgentId('')
    setNewAgentDescription('')
    setAddAgentError(null)
  }, [])

  const handleOpenAddAgentModal = useCallback(() => {
    setIsAddAgentModalOpen(true)
    setAddAgentError(null)
  }, [])

  const openTokenModal = useCallback((agentId: string) => {
    setGeneratedToken(createAgentAccessToken())
    setGeneratedTokenAgentId(agentId)
    setIsTokenModalOpen(true)
    setIsTokenCopied(false)
    setIsRegenerateConfirmOpen(false)
  }, [])

  const closeTokenModal = useCallback(() => {
    setIsTokenModalOpen(false)
    setIsTokenCopied(false)
    setIsRegenerateConfirmOpen(false)
  }, [])

  const handleOpenRegenerateConfirm = useCallback(() => {
    setIsRegenerateConfirmOpen(true)
  }, [])

  const handleConfirmRegenerateToken = useCallback(() => {
    setGeneratedToken(createAgentAccessToken())
    setIsTokenCopied(false)
    setIsRegenerateConfirmOpen(false)
    onShowToast('Security key rotated.', 'success')
  }, [onShowToast])

  const handleRequestDeleteAgent = useCallback((agentId: string) => {
    setPendingDeleteAgentId(agentId)
  }, [])

  const handleConfirmDeleteAgent = useCallback(() => {
    if (!pendingDeleteAgentId) return

    onDeleteAgent(pendingDeleteAgentId)
    setSelectedIds((prev) => prev.filter((id) => id !== pendingDeleteAgentId))
    setPendingDeleteAgentId(null)
    onShowToast(`${pendingDeleteAgentId} removed.`, 'info')
  }, [onDeleteAgent, onShowToast, pendingDeleteAgentId, tr])

  const handleCopyGeneratedToken = useCallback(async () => {
    if (!generatedToken) return

    try {
      await navigator.clipboard.writeText(generatedToken)
      setIsTokenCopied(true)
      onShowToast(tr('Key copied.'), 'info')
    } catch {
      onShowToast(tr('Export failed.'), 'error')
    }
  }, [generatedToken, onShowToast, tr])

  const handleAddAgent = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const normalizedId = newAgentId.trim()
    const normalizedDescription = newAgentDescription.trim()

    if (!normalizedId) {
      setAddAgentError(t('agents.modal.error.required'))
      return
    }

    const idExists = existingRowIdSet.has(normalizedId.toLowerCase())
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
          <Button
            type="button"
            className="flex h-10 w-10 items-center justify-center rounded-lg border border-transparent text-[#86868b] transition-all hover:border-gray-200 hover:bg-white hover:text-[#1D1D1F] hover:shadow-sm"
            aria-label={tr('Refresh')}
          >
            <RefreshCw />
          </Button>
          <Button
            type="button"
            onClick={handleOpenAddAgentModal}
            className="flex items-center gap-2 rounded-lg bg-[#0073e6] px-4 py-2.5 text-sm font-medium text-white shadow-sm shadow-[#0073e6]/20 transition-all hover:bg-[#005bb5] active:scale-95"
          >
            <Plus className="text-[18px]" />
            <span>{tr('New Agent')}</span>
          </Button>
        </div>
      </header>

      <Tabs
        value={activeTab}
        onValueChange={(value) => setActiveTab(value as 'list' | 'whitelist')}
        className="gap-6"
      >
        <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
          <TabsList className="inline-flex h-auto rounded-lg bg-gray-200/50 p-1">
            <TabsTrigger
              value="list"
              className="rounded-md px-4 py-1.5 text-sm font-medium text-[#86868b] transition-all data-[state=active]:bg-white data-[state=active]:text-[#1D1D1F] data-[state=active]:shadow-sm"
            >
              {tr('Agent List')}
            </TabsTrigger>
            <TabsTrigger
              value="whitelist"
              className="rounded-md px-4 py-1.5 text-sm font-medium text-[#86868b] transition-all data-[state=active]:bg-white data-[state=active]:text-[#1D1D1F] data-[state=active]:shadow-sm"
            >
              {tr('Whitelist')}
            </TabsTrigger>
          </TabsList>

          <div className="group relative w-full sm:w-80">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
              <Search className="text-gray-400 transition-colors group-focus-within:text-[#0073e6]" />
            </div>
            <Input
              type="text"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder={tr('Search by ID, IP, or tag...')}
              className="block w-full rounded-lg border border-gray-200 bg-white py-2 pl-10 pr-3 text-sm leading-5 text-[#1D1D1F] placeholder-gray-400 outline-none transition-all focus:border-[#0073e6] focus:ring-2 focus:ring-[#0073e6]/50"
            />
          </div>
        </div>

        <TabsContent value="whitelist" className="mt-0">
          <section className="rounded-xl border border-gray-100 bg-white p-10 text-center shadow-[0_4px_24px_rgba(0,0,0,0.04)]">
            <h3 className="text-lg font-semibold text-[#1D1D1F]">{tr('Whitelist')}</h3>
            <p className="mt-2 text-sm text-[#86868b]">{tr('No matching assets identified.')}</p>
          </section>
        </TabsContent>

        <TabsContent value="list" className="mt-0">
          <section className="overflow-hidden rounded-xl border border-gray-100 bg-white shadow-[0_4px_24px_rgba(0,0,0,0.04)]">
            <div className="overflow-x-auto">
              <Table className="min-w-full divide-y divide-gray-100">
                <TableHeader>
                  <TableRow className="bg-gray-50/50">
                    <TableHead scope="col" className="w-12 px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-[#86868b]">
                      <Checkbox
                        checked={allVisibleSelected}
                        onCheckedChange={(checked) => setAllVisibleSelection(checked === true)}
                        className="border-gray-300 data-[state=checked]:bg-[#0073e6] data-[state=checked]:border-[#0073e6]"
                        aria-label="Select all visible agents"
                      />
                    </TableHead>
                    <TableHead scope="col" className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-[#86868b]">
                      <div className="group inline-flex cursor-pointer items-center gap-1 hover:text-[#0073e6]">
                        {tr('Agent ID')}
                        <ChevronDown className="text-[16px] opacity-0 transition-opacity group-hover:opacity-100" />
                      </div>
                    </TableHead>
                    <TableHead scope="col" className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-[#86868b]">{tr('Status')}</TableHead>
                    <TableHead scope="col" className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-[#86868b]">{tr('IP Address')}</TableHead>
                    <TableHead scope="col" className="hidden px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-[#86868b] md:table-cell">{tr('Version')}</TableHead>
                    <TableHead scope="col" className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-[#86868b]">{tr('Last Reported')}</TableHead>
                    <TableHead scope="col" className="relative px-6 py-4">
                      <span className="sr-only">{tr('Actions')}</span>
                    </TableHead>
                  </TableRow>
                </TableHeader>

                <TableBody className="divide-y divide-gray-100 bg-white">
                  {visibleRows.map((row) => {
                    const badge = statusBadge(row.status)
                    const checked = selectedIdSet.has(row.id)

                    return (
                      <TableRow key={row.id} className="group transition-colors hover:bg-gray-50/80">
                        <TableCell className="whitespace-nowrap px-6 py-4">
                          <Checkbox
                            checked={checked}
                            onCheckedChange={(nextChecked) => setRowSelection(row.id, nextChecked === true)}
                            className="border-gray-300 data-[state=checked]:bg-[#0073e6] data-[state=checked]:border-[#0073e6]"
                            aria-label={`Select ${row.id}`}
                          />
                        </TableCell>

                        <TableCell className="whitespace-nowrap px-6 py-4">
                          <Button
                            type="button"
                            onClick={() => router.push(`/${locale}/agents/${encodeURIComponent(row.id)}`)}
                            className="flex items-center gap-2 text-sm font-medium text-[#0073e6] transition-colors hover:text-[#005bb5]"
                          >
                            {row.id}
                            <ExternalLink className="text-[14px] opacity-0 transition-opacity group-hover:opacity-100" />
                          </Button>
                        </TableCell>

                        <TableCell className="whitespace-nowrap px-6 py-4">
                          <Button
                            type="button"
                            onClick={() => onUpdateStatus(row.id)}
                            className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium ${badge.wrap}`}
                          >
                            <span className={`h-1.5 w-1.5 rounded-full ${badge.dot}`} />
                            {tr(row.status)}
                          </Button>
                        </TableCell>

                        <TableCell className="whitespace-nowrap px-6 py-4 font-mono text-sm text-[#1D1D1F]">{row.ip}</TableCell>
                        <TableCell className="hidden whitespace-nowrap px-6 py-4 text-sm text-[#86868b] md:table-cell">{row.version}</TableCell>
                        <TableCell className="whitespace-nowrap px-6 py-4 text-sm text-[#86868b]">{tr(row.lastReported)}</TableCell>

                        <TableCell className="whitespace-nowrap px-6 py-4 text-right text-sm font-medium">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="rounded-md p-1 text-gray-400 transition-colors hover:bg-gray-100 hover:text-[#1D1D1F]"
                                aria-label={`${tr('Actions')} ${row.id}`}
                              >
                                <Ellipsis />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-44">
                              <DropdownMenuItem onClick={() => router.push(`/${locale}/agents/${encodeURIComponent(row.id)}`)}>
                                <ExternalLink className="text-[16px]" />
                                <span>{tr('Open details')}</span>
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => openTokenModal(row.id)}>
                                <KeyRound className="text-[16px]" />
                                <span>{t('agents.table.generateToken')}</span>
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                className="text-red-600 focus:text-red-700"
                                onSelect={(event) => {
                                  event.preventDefault()
                                  handleRequestDeleteAgent(row.id)
                                }}
                              >
                                <Trash2 className="text-[16px]" />
                                <span>{tr('Delete agent')}</span>
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    )
                  })}

                  {visibleRows.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="px-6 py-10 text-center text-sm font-medium text-[#86868b]">
                        {tr('No matching assets identified.')}
                      </TableCell>
                    </TableRow>
                  ) : null}
                </TableBody>
              </Table>
            </div>

            <div className="border-t border-gray-100 bg-gray-50/30 px-6 py-4">
              <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
                <p className="text-sm text-[#86868b]">
                  {tr('Showing')} <span className="font-medium text-[#1D1D1F]">1</span> {tr('to')} <span className="font-medium text-[#1D1D1F]">{visibleRows.length}</span> {tr('of')} <span className="font-medium text-[#1D1D1F]">{totalResults}</span> {tr('results')}
                </p>

                <Pagination className="mx-0 w-auto justify-start" aria-label={tr('Pagination')}>
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious type="button" onClick={(event) => event.preventDefault()}>
                        {tr('Previous')}
                      </PaginationPrevious>
                    </PaginationItem>
                    <PaginationItem>
                      <PaginationLink type="button" isActive onClick={(event) => event.preventDefault()}>
                        1
                      </PaginationLink>
                    </PaginationItem>
                    <PaginationItem>
                      <PaginationLink type="button" onClick={(event) => event.preventDefault()}>
                        2
                      </PaginationLink>
                    </PaginationItem>
                    <PaginationItem className="hidden md:list-item">
                      <PaginationLink type="button" onClick={(event) => event.preventDefault()}>
                        3
                      </PaginationLink>
                    </PaginationItem>
                    <PaginationItem>
                      <PaginationEllipsis />
                    </PaginationItem>
                    <PaginationItem className="hidden md:list-item">
                      <PaginationLink type="button" onClick={(event) => event.preventDefault()}>
                        8
                      </PaginationLink>
                    </PaginationItem>
                    <PaginationItem>
                      <PaginationNext type="button" onClick={(event) => event.preventDefault()}>
                        {tr('Next')}
                      </PaginationNext>
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              </div>

              <div className="flex w-full justify-between sm:hidden">
                <Button type="button" className="relative inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
                  {tr('Previous')}
                </Button>
                <Button type="button" className="relative inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
                  {tr('Next')}
                </Button>
              </div>
            </div>
          </section>

          <section className="grid grid-cols-1 gap-6 md:grid-cols-3">
            <article className="flex items-start gap-4 rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
              <div className="rounded-lg bg-green-50 p-2 text-green-600">
                <CheckCircle2 />
              </div>
              <div>
                <p className="text-sm font-medium text-[#86868b]">{tr('System Status')}</p>
                <p className="mt-1 text-xl font-bold text-[#1D1D1F]">98% Online</p>
                <p className="mt-1 flex items-center gap-1 text-xs text-green-600">
                  <TrendingUp className="text-[14px]" />
                  +2.4% {tr('this week')}
                </p>
              </div>
            </article>

            <article className="flex items-start gap-4 rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
              <div className="rounded-lg bg-blue-50 p-2 text-blue-600">
                <RefreshCw />
              </div>
              <div>
                <p className="text-sm font-medium text-[#86868b]">{tr('Pending Updates')}</p>
                <p className="mt-1 text-xl font-bold text-[#1D1D1F]">12 {tr('Agents')}</p>
                <p className="mt-1 text-xs text-[#86868b]">{tr('Scheduled for 02:00 AM')}</p>
              </div>
            </article>

            <article className="flex items-start gap-4 rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
              <div className="rounded-lg bg-red-50 p-2 text-red-600">
                <TriangleAlert />
              </div>
              <div>
                <p className="text-sm font-medium text-[#86868b]">{tr('Critical Alerts')}</p>
                <p className="mt-1 text-xl font-bold text-[#1D1D1F]">3 {tr('Issues')}</p>
                <Button type="button" className="mt-1 text-xs text-red-600 transition-colors hover:underline">{tr('View details')}</Button>
              </div>
            </article>
          </section>
        </TabsContent>
      </Tabs>

      <Dialog open={isAddAgentModalOpen} onOpenChange={(open) => (open ? setIsAddAgentModalOpen(true) : closeAddAgentModal())}>
        <DialogContent className="max-w-[520px] overflow-hidden p-0" showCloseButton={false}>
          <DialogHeader className="border-b border-gray-100 px-6 py-5">
            <div className="flex items-center justify-between">
              <DialogTitle className="text-xl font-bold tracking-tight text-[#111418]">{t('agents.modal.title')}</DialogTitle>
              <Button
                type="button"
                onClick={closeAddAgentModal}
                variant="ghost"
                size="icon"
                className="text-gray-400 transition-colors hover:text-gray-500"
                aria-label={t('agents.modal.close')}
              >
                <X className="text-2xl" />
              </Button>
            </div>
          </DialogHeader>

          <form onSubmit={handleAddAgent}>
            <div className="flex flex-col gap-5 px-6 py-6">
              <div className="space-y-2">
                <Label htmlFor="agent-id" className="block text-sm font-semibold leading-6 text-[#111418]">
                  {t('agents.modal.agentId')} <span className="text-xs align-top text-red-500">*</span>
                </Label>

                <div className="relative rounded-md shadow-sm">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                    <Server className="text-[20px] text-gray-400" />
                  </div>
                  <Input
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
                <Label htmlFor="agent-description" className="block text-sm font-semibold leading-6 text-[#111418]">
                  {t('agents.modal.description')} <span className="ml-1 text-xs font-normal text-gray-400">({t('agents.modal.optional')})</span>
                </Label>

                <div className="relative rounded-md shadow-sm">
                  <Textarea
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

            <DialogFooter className="border-t border-gray-100 bg-gray-50 px-6 py-4 sm:flex-row-reverse sm:justify-start">
              <Button
                type="submit"
                className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-[#0b73da] px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-blue-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0b73da] sm:w-auto"
              >
                <Plus className="text-[18px]" />
                <span>{t('agents.modal.addButton')}</span>
              </Button>

              <Button
                type="button"
                onClick={closeAddAgentModal}
                variant="outline"
                className="inline-flex w-full justify-center rounded-md border-[#0b73da]/30 bg-white px-5 py-2.5 text-sm font-semibold text-[#0b73da] hover:bg-gray-50 sm:w-auto"
              >
                {t('agents.modal.cancelButton')}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={isTokenModalOpen} onOpenChange={(open) => (open ? setIsTokenModalOpen(true) : closeTokenModal())}>
        <DialogContent className="max-w-lg overflow-hidden p-0" showCloseButton={false}>
          <DialogHeader className="bg-white px-4 pb-4 pt-5 sm:p-6 sm:pb-4">
            <div className="sm:flex sm:items-start">
              <div className="mx-auto flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-green-100 sm:mx-0 sm:h-10 sm:w-10">
                <CheckCircle2 className="text-2xl text-green-600" />
              </div>

              <div className="mt-3 w-full text-center sm:ml-4 sm:mt-0 sm:text-left">
                <DialogTitle className="text-xl font-semibold leading-6 text-slate-900">{t('agents.tokenModal.title')}</DialogTitle>
                <DialogDescription className="mt-2 space-y-2 text-sm text-slate-500">
                  <p>{t('agents.tokenModal.subtitle')}</p>
                  <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700">
                    {t('agents.tokenModal.agentTag', { id: generatedTokenAgentId })}
                  </span>
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="px-4 py-2 sm:px-6">
            <div className="mb-5 rounded-lg border border-yellow-200 bg-[#FFF8E1] p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <TriangleAlert aria-hidden="true" className="text-xl text-orange-500" />
                </div>

                <div className="ml-3">
                  <h3 className="text-sm font-medium text-orange-800">{t('agents.tokenModal.warningTitle')}</h3>
                  <div className="mt-1 text-sm text-orange-700">
                    <p>{t('agents.tokenModal.warningDescription')}</p>
                  </div>
                </div>
              </div>
            </div>

            <Label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-slate-500" htmlFor="token-display">
              {t('agents.tokenModal.tokenLabel')}
            </Label>

            <div className="relative mb-6 flex items-center">
              <div className="flex w-full items-center rounded-lg border border-transparent bg-[#F5F5F7] pr-2 transition-colors duration-200 focus-within:bg-white focus-within:ring-2 focus-within:ring-[#0b73da]">
                <div className="flex-1 overflow-x-auto py-3 pl-4 [scrollbar-width:thin]">
                  <code id="token-display" className="whitespace-nowrap font-mono text-sm text-slate-700 select-all">{generatedToken}</code>
                </div>

                <div className="mx-2 h-8 w-px bg-slate-200" />

                <Button
                  type="button"
                  onClick={handleCopyGeneratedToken}
                  aria-label={t('agents.tokenModal.copyAria')}
                  className="group relative flex flex-col items-center justify-center rounded-md p-2 transition-colors hover:bg-slate-200 focus:outline-none focus:ring-2 focus:ring-[#0b73da] focus:ring-offset-2"
                >
                  <Copy className="text-[20px] text-[#0b73da] transition-transform group-hover:scale-110" />
                  <span className="pointer-events-none absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap rounded bg-slate-800 px-2 py-1 text-xs text-white opacity-0 transition-opacity group-hover:opacity-100">
                    {isTokenCopied ? t('agents.tokenModal.copied') : t('agents.tokenModal.copy')}
                  </span>
                </Button>
              </div>
            </div>
          </div>

          <DialogFooter className="border-t border-slate-100 bg-slate-50 px-4 py-4 sm:flex-row-reverse sm:items-center sm:px-6">
            <Button
              type="button"
              onClick={closeTokenModal}
              className="inline-flex w-full justify-center rounded-lg bg-[#0b73da] px-3 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-[#0b73da]/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0b73da] sm:ml-3 sm:w-auto"
            >
              {t('agents.tokenModal.closeButton')}
            </Button>

            <Button
              type="button"
              onClick={handleOpenRegenerateConfirm}
              variant="outline"
              className="mt-3 inline-flex w-full justify-center rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition-colors hover:bg-slate-50 sm:mt-0 sm:w-auto"
            >
              {t('agents.tokenModal.regenerateButton')}
            </Button>

            <div className="mt-3 flex items-center sm:mr-auto sm:mt-0">
              <Lock className="mr-1 text-sm text-slate-400" />
              <span className="text-xs text-slate-500">{t('agents.tokenModal.authenticated')}</span>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={isRegenerateConfirmOpen} onOpenChange={setIsRegenerateConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-2xl font-bold tracking-tight text-gray-900">{t('agents.regenerateConfirm.title')}</AlertDialogTitle>
            <AlertDialogDescription className="text-[15px] leading-relaxed text-gray-600">{t('agents.regenerateConfirm.description')}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="sm:flex-row sm:justify-end">
            <AlertDialogCancel>{t('agents.regenerateConfirm.cancelButton')}</AlertDialogCancel>
            <AlertDialogAction className="bg-[#0b73da] hover:bg-blue-600" onClick={handleConfirmRegenerateToken}>
              {t('agents.regenerateConfirm.confirmButton')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={pendingDeleteAgentId !== null} onOpenChange={(open) => { if (!open) setPendingDeleteAgentId(null) }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{tr('Delete agent')}</AlertDialogTitle>
            <AlertDialogDescription>
              {pendingDeleteAgentId
                ? `Are you sure you want to delete ${pendingDeleteAgentId}? This action cannot be undone.`
                : 'This action cannot be undone.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{tr('Cancel')}</AlertDialogCancel>
            <AlertDialogAction className="bg-red-600 hover:bg-red-700" onClick={handleConfirmDeleteAgent}>
              {tr('Delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
