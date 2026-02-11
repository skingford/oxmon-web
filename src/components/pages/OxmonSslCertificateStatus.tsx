'use client'

import { useMemo, useState, type FormEvent } from 'react'
import { useAppUiContext } from '@/contexts/AppContext'
import { t, type Locale } from '@/lib/i18n'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Label } from '@/components/ui/label'
import {
  CheckCircle2,
  CircleHelp,
  CircleX,
  Download,
  Ellipsis,
  Hash,
  Languages,
  Link2,
  ListFilter,
  Lock,
  RefreshCw,
  Search,
  TriangleAlert,
  X,
} from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

type DomainStatus = 'Valid' | 'Expiring' | 'Expired'

type CertificateRow = {
  id: string
  domain: string
  envLabel: string
  status: DomainStatus
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

type AddDomainForm = {
  domain: string
  port: string
  remark: string
}

const INITIAL_CERTIFICATE_ROWS: CertificateRow[] = [
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

const DEFAULT_ADD_DOMAIN_FORM: AddDomainForm = {
  domain: '',
  port: '443',
  remark: '',
}

function getStatusBadge(status: DomainStatus) {
  if (status === 'Valid') {
    return {
      wrap: 'text-green-600 bg-green-50 border border-green-100',
    }
  }

  if (status === 'Expiring') {
    return {
      wrap: 'text-orange-600 bg-orange-50 border border-orange-100',
    }
  }

  return {
    wrap: 'text-red-600 bg-red-50 border border-red-100',
  }
}

function renderStatusIcon(status: DomainStatus, className: string) {
  if (status === 'Valid') {
    return <CheckCircle2 className={className} />
  }

  if (status === 'Expiring') {
    return <TriangleAlert className={className} />
  }

  return <CircleX className={className} />
}

function getStatusLabel(locale: Locale, status: DomainStatus): string {
  if (status === 'Valid') {
    return t(locale, 'domains.stats.valid')
  }

  if (status === 'Expiring') {
    return t(locale, 'domains.stats.expiringSoon')
  }

  return t(locale, 'domains.stats.expired')
}

function buildDomainRow(form: AddDomainForm, locale: Locale): CertificateRow {
  const normalizedDomain = form.domain.trim().toLowerCase()
  const port = Number(form.port)
  const remark = form.remark.trim()

  return {
    id: `row-custom-${Date.now()}`,
    domain: normalizedDomain,
    envLabel: remark || t(locale, 'domains.row.portLabel', { port }),
    status: 'Valid',
    issuerShort: 'OX',
    issuerShortClass: 'bg-blue-100 text-blue-600',
    issuerName: t(locale, 'domains.row.defaultIssuer'),
    remainingLabel: t(locale, 'domains.row.defaultRemaining'),
    remainingClass: 'text-green-600',
    progressClass: 'bg-green-500',
    progressWidth: '100%',
    lastCheck: t(locale, 'domains.row.justNow'),
  }
}

type OxmonSslDomainStatusProps = {
  locale?: 'en' | 'zh'
}

export default function OxmonSsldomainstatus({
  locale = 'en',
}: OxmonSslDomainStatusProps) {
  const { showToast } = useAppUiContext()

  const [rows, setRows] = useState<CertificateRow[]>(INITIAL_CERTIFICATE_ROWS)
  const [searchTerm, setSearchTerm] = useState('')
  const [isAddDomainOpen, setIsAddDomainOpen] = useState(false)
  const [addDomainForm, setAddDomainForm] = useState<AddDomainForm>(
    DEFAULT_ADD_DOMAIN_FORM,
  )

  const filteredRows = useMemo(() => {
    const keyword = searchTerm.trim().toLowerCase()

    if (!keyword) {
      return rows
    }

    return rows.filter(
      (row) =>
        row.domain.toLowerCase().includes(keyword) ||
        row.envLabel.toLowerCase().includes(keyword) ||
        row.issuerName.toLowerCase().includes(keyword),
    )
  }, [rows, searchTerm])

  const stats = useMemo(() => {
    const total = rows.length
    const valid = rows.filter((row) => row.status === 'Valid').length
    const expiring = rows.filter((row) => row.status === 'Expiring').length
    const expired = rows.filter((row) => row.status === 'Expired').length

    return { total, valid, expiring, expired }
  }, [rows])

  const closeAddDomainModal = () => {
    setIsAddDomainOpen(false)
    setAddDomainForm(DEFAULT_ADD_DOMAIN_FORM)
  }

  const handleCreateDomain = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const normalizedDomain = addDomainForm.domain.trim().toLowerCase()

    if (!normalizedDomain) {
      showToast(t(locale, 'domains.toast.domainRequired'), 'error')
      return
    }

    const portNumber = Number(addDomainForm.port)

    if (!Number.isInteger(portNumber) || portNumber < 1 || portNumber > 65535) {
      showToast(t(locale, 'domains.toast.invalidPort'), 'error')
      return
    }

    const domainExists = rows.some(
      (row) => row.domain.toLowerCase() === normalizedDomain,
    )

    if (domainExists) {
      showToast(
        t(locale, 'domains.toast.domainExists', { domain: normalizedDomain }),
        'error',
      )
      return
    }

    setRows((prev) => [
      buildDomainRow(
        {
          domain: normalizedDomain,
          port: String(portNumber),
          remark: addDomainForm.remark,
        },
        locale,
      ),
      ...prev,
    ])

    closeAddDomainModal()
    showToast(
      t(locale, 'domains.toast.domainAdded', { domain: normalizedDomain }),
      'success',
    )
  }

  return (
    <>
      <div className="flex min-w-0 flex-col pb-6">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-col gap-1">
            <h2 className="text-2xl font-bold leading-tight tracking-tight text-[#12161b] md:text-3xl">
              {t(locale, 'domains.page.title')}
            </h2>
            <p className="text-sm font-normal leading-normal text-[#60758a] md:text-base">
              {t(locale, 'domains.page.subtitle')}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Button
              type="button"
              className="flex h-9 w-9 items-center justify-center rounded-full border border-[#e5e5e5] bg-white text-slate-600 shadow-sm transition-all hover:bg-slate-50"
              aria-label={t(locale, 'domains.action.help')}
            >
              <CircleHelp className="text-[20px]" />
            </Button>
            <Button
              type="button"
              onClick={() => setIsAddDomainOpen(true)}
              className="flex h-9 items-center gap-2 rounded-lg bg-[#0073e6] px-4 text-sm font-medium text-white shadow-sm shadow-[#0073e6]/20 transition-all hover:bg-[#0073e6]/90"
            >
              <Link2 className="text-[18px]" />
              <span>{t(locale, 'domains.action.addDomain')}</span>
            </Button>
          </div>
        </div>

        <div className="flex flex-col gap-6">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
            <div className="flex flex-col gap-1 rounded-xl border border-[#e5e5e5]/60 bg-white p-4 shadow-[0_1px_3px_0_rgba(0,0,0,0.05),0_1px_2px_0_rgba(0,0,0,0.03)]">
              <span className="text-xs font-medium uppercase tracking-wider text-slate-500">
                {t(locale, 'domains.stats.total')}
              </span>
              <div className="flex items-end justify-between">
                <span className="text-2xl font-bold text-slate-900">
                  {stats.total}
                </span>
                <Languages className="text-[28px] text-slate-300" />
              </div>
            </div>
            <div className="flex flex-col gap-1 rounded-xl border border-[#e5e5e5]/60 bg-white p-4 shadow-[0_1px_3px_0_rgba(0,0,0,0.05),0_1px_2px_0_rgba(0,0,0,0.03)]">
              <span className="text-xs font-medium uppercase tracking-wider text-slate-500">
                {t(locale, 'domains.stats.valid')}
              </span>
              <div className="flex items-end justify-between">
                <span className="text-2xl font-bold text-green-600">
                  {stats.valid}
                </span>
                <CheckCircle2 className="text-[28px] text-green-100" />
              </div>
            </div>
            <div className="flex flex-col gap-1 rounded-xl border border-[#e5e5e5]/60 bg-white p-4 shadow-[0_1px_3px_0_rgba(0,0,0,0.05),0_1px_2px_0_rgba(0,0,0,0.03)]">
              <span className="text-xs font-medium uppercase tracking-wider text-slate-500">
                {t(locale, 'domains.stats.expiringSoon')}
              </span>
              <div className="flex items-end justify-between">
                <span className="text-2xl font-bold text-orange-500">
                  {stats.expiring}
                </span>
                <TriangleAlert className="text-[28px] text-orange-100" />
              </div>
            </div>
            <div className="flex flex-col gap-1 rounded-xl border border-[#e5e5e5]/60 bg-white p-4 shadow-[0_1px_3px_0_rgba(0,0,0,0.05),0_1px_2px_0_rgba(0,0,0,0.03)]">
              <span className="text-xs font-medium uppercase tracking-wider text-slate-500">
                {t(locale, 'domains.stats.expired')}
              </span>
              <div className="flex items-end justify-between">
                <span className="text-2xl font-bold text-red-600">
                  {stats.expired}
                </span>
                <CircleX className="text-[28px] text-red-100" />
              </div>
            </div>
          </div>

          <div className="flex flex-col overflow-hidden rounded-xl border border-[#e5e5e5]/60 bg-white shadow-[0_1px_3px_0_rgba(0,0,0,0.05),0_1px_2px_0_rgba(0,0,0,0.03)]">
            <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-4">
              <div className="flex min-w-[280px] flex-1 items-center gap-3">
                <div className="group relative max-w-md flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[20px] text-slate-400 transition-colors group-focus-within:text-[#0073e6]" />
                  <Input
                    type="text"
                    value={searchTerm}
                    onChange={(event) => setSearchTerm(event.target.value)}
                    placeholder={t(locale, 'domains.search.placeholder')}
                    className="w-full rounded-lg border border-transparent bg-slate-50 py-2 pl-10 pr-4 text-sm text-slate-800 outline-none transition-all placeholder:text-slate-400 focus:border-[#0073e6]/50 focus:bg-white focus:ring-2 focus:ring-[#0073e6]/10"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  className="flex items-center gap-2 rounded-lg border border-[#e5e5e5] bg-white px-3 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
                >
                  <ListFilter className="text-[18px] text-slate-500" />
                  <span>{t(locale, 'domains.action.filter')}</span>
                </Button>
                <div className="mx-1 h-8 w-px bg-[#e5e5e5]" />
                <Button
                  type="button"
                  className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-50 hover:text-[#0073e6]"
                  title={t(locale, 'domains.action.refresh')}
                >
                  <RefreshCw className="text-[20px]" />
                </Button>
                <Button
                  type="button"
                  className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-50 hover:text-[#0073e6]"
                  title={t(locale, 'domains.action.export')}
                >
                  <Download className="text-[20px]" />
                </Button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <Table className="w-full border-collapse text-left">
                <TableHeader>
                  <TableRow className="border-y border-[#e5e5e5]/60 bg-slate-50/50">
                    <TableHead className="w-1/3 px-6 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
                      {t(locale, 'domains.table.domainName')}
                    </TableHead>
                    <TableHead className="w-32 px-6 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
                      {t(locale, 'domains.table.status')}
                    </TableHead>
                    <TableHead className="px-6 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
                      {t(locale, 'domains.table.issuer')}
                    </TableHead>
                    <TableHead className="px-6 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
                      {t(locale, 'domains.table.remainingDays')}
                    </TableHead>
                    <TableHead className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">
                      {t(locale, 'domains.table.lastCheck')}
                    </TableHead>
                    <TableHead className="w-16 px-6 py-3" />
                  </TableRow>
                </TableHeader>

                <TableBody className="divide-y divide-[#e5e5e5]/60">
                  {filteredRows.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={6}
                        className="px-6 py-16 text-center text-sm text-slate-500"
                      >
                        {t(locale, 'domains.table.empty')}
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredRows.map((row) => {
                      const statusBadge = getStatusBadge(row.status)

                      return (
                        <TableRow
                          key={row.id}
                          className={`group transition-colors hover:bg-slate-50 ${row.highlighted ? 'bg-red-50/30' : ''}`}
                        >
                          <TableCell className="px-6 py-4">
                            <div className="flex flex-col">
                              <span className="font-mono text-sm font-medium text-slate-900">
                                {row.domain}
                              </span>
                              <div className="flex items-center gap-1">
                                {renderStatusIcon(
                                  row.status,
                                  `text-xs ${row.status === 'Expired' ? 'font-medium text-red-500' : 'text-slate-400'}`,
                                )}
                                <span className="text-xs text-slate-400">
                                  {row.envLabel}
                                </span>
                              </div>
                            </div>
                          </TableCell>

                          <TableCell className="px-6 py-4">
                            <div
                              className={`flex w-fit items-center gap-1.5 rounded-full px-2.5 py-1 ${statusBadge.wrap}`}
                            >
                              {renderStatusIcon(row.status, 'text-[16px]')}
                              <span className="text-xs font-medium">
                                {getStatusLabel(locale, row.status)}
                              </span>
                            </div>
                          </TableCell>

                          <TableCell className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <div
                                className={`flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-bold ${row.issuerShortClass}`}
                              >
                                {row.issuerShort}
                              </div>
                              <span className="text-sm text-slate-600">
                                {row.issuerName}
                              </span>
                            </div>
                          </TableCell>

                          <TableCell className="px-6 py-4">
                            <span
                              className={`text-sm font-semibold ${row.remainingClass}`}
                            >
                              {row.remainingLabel}
                            </span>
                            <div className="mt-1 h-1.5 w-24 overflow-hidden rounded-full bg-slate-100">
                              <div
                                className={`h-full rounded-full ${row.progressClass} ${row.status === 'Expired' ? 'animate-pulse' : ''}`}
                                style={{ width: row.progressWidth }}
                              />
                            </div>
                          </TableCell>

                          <TableCell className="px-6 py-4 text-right">
                            <span className="text-sm text-slate-500">
                              {row.lastCheck}
                            </span>
                          </TableCell>

                          <TableCell className="px-6 py-4 text-center">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon-sm"
                                  className="text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
                                >
                                  <Ellipsis className="text-[20px]" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent
                                align="end"
                                className="min-w-36"
                              >
                                <DropdownMenuItem>
                                  {t(locale, 'domains.action.export')}
                                </DropdownMenuItem>
                                <DropdownMenuItem>
                                  {locale === 'zh' ? '立即扫描' : 'Scan now'}
                                </DropdownMenuItem>
                                <DropdownMenuItem className="text-red-600 focus:text-red-600">
                                  {locale === 'zh'
                                    ? '移除域名'
                                    : 'Remove domain'}
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      )
                    })
                  )}
                </TableBody>
              </Table>
            </div>

            <div className="flex items-center justify-between border-t border-[#e5e5e5]/60 bg-slate-50/50 p-4">
              <span className="text-xs text-slate-500">
                {t(locale, 'domains.table.pagination', {
                  count: filteredRows.length,
                  total: rows.length,
                })}
              </span>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  disabled
                  className="rounded-md border border-[#e5e5e5] bg-white px-3 py-1.5 text-xs font-medium text-slate-500 opacity-50 transition-colors"
                >
                  {t(locale, 'domains.table.previous')}
                </Button>
                <Button
                  type="button"
                  className="rounded-md border border-[#e5e5e5] bg-white px-3 py-1.5 text-xs font-medium text-slate-500 transition-colors hover:bg-slate-50 hover:text-slate-700"
                >
                  {t(locale, 'domains.table.next')}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Dialog
        open={isAddDomainOpen}
        onOpenChange={(open) =>
          open ? setIsAddDomainOpen(true) : closeAddDomainModal()
        }
      >
        <DialogContent
          className="max-w-[520px] overflow-hidden rounded-xl p-0"
          showCloseButton={false}
        >
          <DialogHeader className="px-8 pb-4 pt-8">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#0b73da]/10 text-[#0b73da]">
                <Link2 className="text-2xl" />
              </div>
              <div>
                <DialogTitle className="text-xl font-bold leading-tight text-gray-900">
                  {t(locale, 'domains.modal.title')}
                </DialogTitle>
                <DialogDescription className="mt-1 text-sm text-gray-500">
                  {t(locale, 'domains.modal.subtitle')}
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <form onSubmit={handleCreateDomain}>
            <div className="flex flex-col gap-5 px-8 py-2">
              <div className="flex flex-col gap-1.5">
                <Label
                  htmlFor="new-domain"
                  className="flex items-center gap-1 text-sm font-semibold text-gray-900"
                >
                  <span>{t(locale, 'domains.modal.domain')}</span>
                  <span
                    className="text-xs text-red-500"
                    title={t(locale, 'domains.modal.required')}
                  >
                    *
                  </span>
                </Label>
                <div className="group relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 transition-colors group-focus-within:text-[#0b73da]">
                    <Languages className="text-[20px]" />
                  </span>
                  <Input
                    id="new-domain"
                    autoFocus
                    required
                    type="text"
                    value={addDomainForm.domain}
                    onChange={(event) => {
                      const value = event.target.value
                      setAddDomainForm((prev) => ({ ...prev, domain: value }))
                    }}
                    placeholder={t(locale, 'domains.modal.domainPlaceholder')}
                    className="w-full rounded-lg border border-gray-200 bg-white py-3 pl-10 pr-4 text-sm text-gray-900 shadow-sm transition-all placeholder:text-gray-400 focus:border-[#0b73da] focus:outline-none focus:ring-1 focus:ring-[#0b73da]"
                  />
                </div>
                <p className="text-xs text-gray-500">
                  {t(locale, 'domains.modal.domainHint')}
                </p>
              </div>

              <div className="flex gap-5">
                <div className="flex flex-1 flex-col gap-1.5">
                  <Label
                    htmlFor="new-domain-port"
                    className="text-sm font-semibold text-gray-900"
                  >
                    {t(locale, 'domains.modal.port')}
                  </Label>
                  <div className="group relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 transition-colors group-focus-within:text-[#0b73da]">
                      <Hash className="text-[20px]" />
                    </span>
                    <Input
                      id="new-domain-port"
                      type="number"
                      min={1}
                      max={65535}
                      value={addDomainForm.port}
                      onChange={(event) => {
                        const value = event.target.value
                        setAddDomainForm((prev) => ({ ...prev, port: value }))
                      }}
                      className="w-full rounded-lg border border-gray-200 bg-white py-3 pl-10 pr-4 text-sm text-gray-900 shadow-sm transition-all placeholder:text-gray-400 focus:border-[#0b73da] focus:outline-none focus:ring-1 focus:ring-[#0b73da]"
                    />
                  </div>
                </div>

                <div className="flex w-1/3 flex-col gap-1.5">
                  <Label className="text-sm font-semibold text-gray-900">
                    {t(locale, 'domains.modal.protocol')}
                  </Label>
                  <div className="flex w-full cursor-not-allowed items-center justify-between rounded-lg border border-gray-100 bg-gray-50 px-4 py-3 text-sm text-gray-500">
                    <span>HTTPS</span>
                    <Lock className="text-[16px]" />
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <Label
                  htmlFor="new-domain-remark"
                  className="flex items-center justify-between text-sm font-semibold text-gray-900"
                >
                  <span>{t(locale, 'domains.modal.remark')}</span>
                  <span className="text-xs font-normal text-gray-400">
                    {t(locale, 'domains.modal.optional')}
                  </span>
                </Label>
                <Textarea
                  id="new-domain-remark"
                  rows={2}
                  value={addDomainForm.remark}
                  onChange={(event) => {
                    const value = event.target.value
                    setAddDomainForm((prev) => ({ ...prev, remark: value }))
                  }}
                  placeholder={t(locale, 'domains.modal.remarkPlaceholder')}
                  className="w-full resize-none rounded-lg border border-gray-200 bg-white p-3 text-sm text-gray-900 shadow-sm transition-all placeholder:text-gray-400 focus:border-[#0b73da] focus:outline-none focus:ring-1 focus:ring-[#0b73da]"
                />
              </div>
            </div>

            <DialogFooter className="mt-2 flex items-center justify-end gap-3 border-t border-gray-100 bg-gray-50/50 px-8 py-6 sm:flex-row sm:justify-end">
              <Button
                type="button"
                onClick={closeAddDomainModal}
                variant="ghost"
                className="h-10 rounded-lg px-5 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-900"
              >
                {t(locale, 'domains.modal.cancel')}
              </Button>
              <Button
                type="submit"
                className="h-10 rounded-lg bg-[#0b73da] px-6 text-sm font-semibold text-white shadow-md shadow-[#0b73da]/20 transition-all hover:bg-[#0b73da]/90"
              >
                {t(locale, 'domains.modal.submit')}
              </Button>
            </DialogFooter>
          </form>

          <Button
            type="button"
            aria-label={t(locale, 'domains.modal.closeButton')}
            onClick={closeAddDomainModal}
            variant="ghost"
            size="icon"
            className="absolute right-4 top-4 rounded-full p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
          >
            <X className="text-[20px]" />
          </Button>
        </DialogContent>
      </Dialog>
    </>
  )
}
