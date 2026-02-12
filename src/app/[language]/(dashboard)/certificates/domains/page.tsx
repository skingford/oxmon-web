"use client"

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { ApiRequestError, api, getApiErrorMessage } from "@/lib/api"
import { CertCheckResult, CertDomain } from "@/types/api"
import { useAppTranslations } from "@/hooks/use-app-translations"
import { useRequestState } from "@/hooks/use-request-state"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Switch } from "@/components/ui/switch"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Textarea } from "@/components/ui/textarea"
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  History,
  Loader2,
  Plus,
  RefreshCw,
  ShieldCheck,
  Trash2,
} from "lucide-react"
import { toast } from "sonner"

const PAGE_LIMIT = 20
const AUTO_CREATE_ADVANCED_STORAGE_KEY = "certificates:auto-create-advanced:v1"

function formatDateTime(value: string | null, locale: "zh" | "en") {
  if (!value) {
    return "-"
  }

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return "-"
  }

  return date.toLocaleString(locale === "zh" ? "zh-CN" : "en-US", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  })
}

function parseOptionalNonNegativeInt(value: string) {
  if (!value.trim()) {
    return null
  }

  const numberValue = Number(value)

  if (!Number.isFinite(numberValue) || numberValue < 0) {
    return undefined
  }

  return Math.floor(numberValue)
}

function getDomainStatusMeta(
  enabled: boolean,
  t: (path: any, values?: Record<string, string | number>) => string
) {
  if (enabled) {
    return {
      className: "border-emerald-500/30 bg-emerald-500/10 text-emerald-600",
      label: t("certificates.domains.statusEnabled"),
    }
  }

  return {
    className: "border-muted bg-muted text-muted-foreground",
    label: t("certificates.domains.statusDisabled"),
  }
}

export default function DomainsPage() {
  const { t, locale } = useAppTranslations("pages")
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const domainParamValue = searchParams.get("domain") || ""
  const statusParamValue = searchParams.get("status") || "all"
  const autoCheckParamValue = searchParams.get("autoCheck")
  const rawOffset = Number(searchParams.get("offset") || "0")
  const initialOffset = Number.isFinite(rawOffset) && rawOffset > 0 ? Math.floor(rawOffset) : 0

  const [domainKeyword, setDomainKeyword] = useState(domainParamValue)
  const [statusFilter, setStatusFilter] = useState(statusParamValue === "enabled" || statusParamValue === "disabled" ? statusParamValue : "all")
  const [offset, setOffset] = useState(initialOffset)
  const [currentPageCount, setCurrentPageCount] = useState(0)

  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [batchDialogOpen, setBatchDialogOpen] = useState(false)
  const [deleteDialogDomain, setDeleteDialogDomain] = useState<CertDomain | null>(null)
  const [historyDialogOpen, setHistoryDialogOpen] = useState(false)

  const [creating, setCreating] = useState(false)
  const [batchCreating, setBatchCreating] = useState(false)
  const [checkingAll, setCheckingAll] = useState(false)
  const [checkingId, setCheckingId] = useState<string | null>(null)
  const [updatingId, setUpdatingId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const [newDomain, setNewDomain] = useState("")
  const [newPort, setNewPort] = useState("")
  const [newCheckInterval, setNewCheckInterval] = useState("")
  const [newNote, setNewNote] = useState("")
  const [batchDomains, setBatchDomains] = useState("")

  const [historyLoading, setHistoryLoading] = useState(false)
  const [historyDomain, setHistoryDomain] = useState<CertDomain | null>(null)
  const [historyItems, setHistoryItems] = useState<CertCheckResult[]>([])
  const [autoCheckHandled, setAutoCheckHandled] = useState(false)
  const [autoCreateDomain, setAutoCreateDomain] = useState<string | null>(null)
  const [autoCreatePort, setAutoCreatePort] = useState("")
  const [autoCreateCheckInterval, setAutoCreateCheckInterval] = useState("")
  const [autoCreateNote, setAutoCreateNote] = useState("")
  const [autoCreateAdvancedOpen, setAutoCreateAdvancedOpen] = useState(false)
  const [clearAdvancedDialogOpen, setClearAdvancedDialogOpen] = useState(false)
  const [autoCreating, setAutoCreating] = useState(false)

  const autoCreateHasAdvancedDraft = Boolean(
    autoCreatePort.trim() || autoCreateCheckInterval.trim() || autoCreateNote.trim()
  )

  const {
    data: domains,
    loading,
    refreshing,
    execute,
  } = useRequestState<CertDomain[]>([])

  const resetAutoCreateDraft = (preserveAdvanced = true) => {
    setAutoCreateDomain(null)

    if (!preserveAdvanced) {
      setAutoCreatePort("")
      setAutoCreateCheckInterval("")
      setAutoCreateNote("")
    }

    setAutoCreateAdvancedOpen(false)
    setClearAdvancedDialogOpen(false)
  }

  const clearAutoCreateAdvancedDraft = () => {
    setAutoCreatePort("")
    setAutoCreateCheckInterval("")
    setAutoCreateNote("")
    setAutoCreateAdvancedOpen(false)
    setClearAdvancedDialogOpen(false)
    toast.success(t("certificates.domains.toastAutoCreateAdvancedResetSuccess"))
  }

  const getStatusAwareMessage = (
    error: unknown,
    fallback: string,
    statusMessages?: Partial<Record<number, string>>
  ) => {
    if (error instanceof ApiRequestError && statusMessages?.[error.status]) {
      return statusMessages[error.status] as string
    }

    return getApiErrorMessage(error, fallback)
  }

  const fetchDomains = useCallback(
    async (silent = false) => {
      await execute(
        () => api.listDomains({
          limit: PAGE_LIMIT,
          offset,
          domain__contains: domainKeyword.trim() || undefined,
          enabled__eq: statusFilter === "all" ? undefined : statusFilter === "enabled",
        }),
        {
          silent,
          onSuccess: (data) => {
            setCurrentPageCount(data.length)
          },
          onError: (error) => {
            toast.error(getApiErrorMessage(error, t("certificates.domains.toastFetchError")))
          },
        }
      )
    },
    [domainKeyword, execute, offset, statusFilter, t]
  )

  useEffect(() => {
    fetchDomains()
  }, [fetchDomains])

  useEffect(() => {
    if (typeof window === "undefined") {
      return
    }

    try {
      const raw = window.sessionStorage.getItem(AUTO_CREATE_ADVANCED_STORAGE_KEY)

      if (!raw) {
        return
      }

      const parsed = JSON.parse(raw) as {
        port?: unknown
        checkInterval?: unknown
        note?: unknown
      }

      if (typeof parsed.port === "string") {
        setAutoCreatePort(parsed.port)
      }

      if (typeof parsed.checkInterval === "string") {
        setAutoCreateCheckInterval(parsed.checkInterval)
      }

      if (typeof parsed.note === "string") {
        setAutoCreateNote(parsed.note)
      }
    } catch {
      window.sessionStorage.removeItem(AUTO_CREATE_ADVANCED_STORAGE_KEY)
    }
  }, [])

  useEffect(() => {
    if (typeof window === "undefined") {
      return
    }

    if (!autoCreateHasAdvancedDraft) {
      window.sessionStorage.removeItem(AUTO_CREATE_ADVANCED_STORAGE_KEY)
      return
    }

    window.sessionStorage.setItem(
      AUTO_CREATE_ADVANCED_STORAGE_KEY,
      JSON.stringify({
        port: autoCreatePort,
        checkInterval: autoCreateCheckInterval,
        note: autoCreateNote,
      })
    )
  }, [autoCreateCheckInterval, autoCreateHasAdvancedDraft, autoCreateNote, autoCreatePort])

  useEffect(() => {
    if (autoCheckParamValue === "1") {
      setAutoCheckHandled(false)
    }
  }, [autoCheckParamValue, domainParamValue])

  useEffect(() => {
    if (!autoCreateDomain) {
      return
    }

    if (autoCreateHasAdvancedDraft) {
      setAutoCreateAdvancedOpen(true)
    }
  }, [autoCreateDomain, autoCreateHasAdvancedDraft])

  useEffect(() => {
    if (autoCheckHandled || autoCheckParamValue !== "1" || loading) {
      return
    }

    const matchedDomain = domainParamValue.trim().toLowerCase()

    if (!matchedDomain) {
      setAutoCheckHandled(true)
      return
    }

    const target = domains.find((item) => item.domain.toLowerCase() === matchedDomain)

    if (!target) {
      setAutoCheckHandled(true)
      setAutoCreateDomain(domainParamValue.trim())
      setAutoCreateAdvancedOpen(false)
      return
    }

    setAutoCheckHandled(true)
    void handleCheckDomain(target)
  }, [
    autoCheckHandled,
    autoCheckParamValue,
    loading,
    domains,
    domainParamValue,
    t,
  ])

  useEffect(() => {
    const nextDomain = searchParams.get("domain") || ""
    const nextStatusRaw = searchParams.get("status") || "all"
    const nextStatus = nextStatusRaw === "enabled" || nextStatusRaw === "disabled"
      ? nextStatusRaw
      : "all"
    const nextRawOffset = Number(searchParams.get("offset") || "0")
    const nextOffset = Number.isFinite(nextRawOffset) && nextRawOffset > 0
      ? Math.floor(nextRawOffset)
      : 0

    setDomainKeyword((previous) => (previous === nextDomain ? previous : nextDomain))
    setStatusFilter((previous) => (previous === nextStatus ? previous : nextStatus))
    setOffset((previous) => (previous === nextOffset ? previous : nextOffset))
  }, [searchParams])

  useEffect(() => {
    const nextParams = new URLSearchParams(searchParams.toString())

    if (domainKeyword.trim()) {
      nextParams.set("domain", domainKeyword)
    } else {
      nextParams.delete("domain")
    }

    if (statusFilter !== "all") {
      nextParams.set("status", statusFilter)
    } else {
      nextParams.delete("status")
    }

    if (offset > 0) {
      nextParams.set("offset", String(offset))
    } else {
      nextParams.delete("offset")
    }

    const nextQuery = nextParams.toString()
    const currentQuery = searchParams.toString()

    if (nextQuery === currentQuery) {
      return
    }

    router.replace(nextQuery ? `${pathname}?${nextQuery}` : pathname, {
      scroll: false,
    })
  }, [domainKeyword, offset, pathname, router, searchParams, statusFilter])

  const pageNumber = Math.floor(offset / PAGE_LIMIT) + 1
  const canGoPrev = offset > 0
  const canGoNext = currentPageCount >= PAGE_LIMIT

  const handleDomainKeywordChange = (value: string) => {
    setDomainKeyword(value)
    setOffset((previous) => (previous === 0 ? previous : 0))
  }

  const handleStatusFilterChange = (value: "all" | "enabled" | "disabled") => {
    setStatusFilter(value)
    setOffset((previous) => (previous === 0 ? previous : 0))
  }

  const handleResetFilters = () => {
    setDomainKeyword("")
    setStatusFilter("all")
    setOffset(0)
  }

  const handleCreateDomain = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const domain = newDomain.trim()

    if (!domain) {
      toast.error(t("certificates.domains.toastDomainRequired"))
      return
    }

    const port = parseOptionalNonNegativeInt(newPort)
    const checkInterval = parseOptionalNonNegativeInt(newCheckInterval)

    if (port === undefined || checkInterval === undefined) {
      setAutoCreateAdvancedOpen(true)
      toast.error(t("certificates.domains.toastInvalidNumber"))
      return
    }

    setCreating(true)

    try {
      await api.createDomain({
        domain,
        port,
        check_interval_secs: checkInterval,
        note: newNote.trim() ? newNote.trim() : null,
      })

      toast.success(t("certificates.domains.toastCreateSuccess"))
      setCreateDialogOpen(false)
      setNewDomain("")
      setNewPort("")
      setNewCheckInterval("")
      setNewNote("")
      await fetchDomains(true)
    } catch (error) {
      toast.error(
        getStatusAwareMessage(error, t("certificates.domains.toastCreateError"), {
          409: t("certificates.domains.toastCreateConflict"),
        })
      )
    } finally {
      setCreating(false)
    }
  }

  const handleBatchCreate = async () => {
    const parsedDomains = batchDomains
      .split(/[\n,]+/)
      .map((value) => value.trim())
      .filter(Boolean)

    if (parsedDomains.length === 0) {
      toast.error(t("certificates.domains.toastBatchEmpty"))
      return
    }

    setBatchCreating(true)

    try {
      await api.createDomainsBatch({
        domains: parsedDomains.map((domain) => ({ domain })),
      })

      toast.success(t("certificates.domains.toastBatchSuccess", { count: parsedDomains.length }))
      setBatchDomains("")
      setBatchDialogOpen(false)
      await fetchDomains(true)
    } catch (error) {
      toast.error(
        getStatusAwareMessage(error, t("certificates.domains.toastBatchError"), {
          409: t("certificates.domains.toastCreateConflict"),
        })
      )
    } finally {
      setBatchCreating(false)
    }
  }

  const handleToggleEnabled = async (domain: CertDomain, enabled: boolean) => {
    setUpdatingId(domain.id)

    try {
      await api.updateDomain(domain.id, { enabled })
      toast.success(enabled
        ? t("certificates.domains.toastEnableSuccess")
        : t("certificates.domains.toastDisableSuccess"))
      await fetchDomains(true)
    } catch (error) {
      toast.error(getApiErrorMessage(error, t("certificates.domains.toastUpdateError")))
    } finally {
      setUpdatingId(null)
    }
  }

  const handleCheckDomain = async (domain: CertDomain) => {
    setCheckingId(domain.id)

    try {
      const result = await api.checkSingleDomain(domain.id)

      if (result.is_valid && result.chain_valid) {
        toast.success(t("certificates.domains.toastCheckSuccess"))
      } else {
        toast.error(
          t("certificates.domains.toastCheckFailed", {
            reason: result.error || t("certificates.domains.errorUnknown"),
          })
        )
      }

      await fetchDomains(true)
    } catch (error) {
      toast.error(getApiErrorMessage(error, t("certificates.domains.toastCheckError")))
    } finally {
      setCheckingId(null)
    }
  }

  const handleCheckAllDomains = async () => {
    setCheckingAll(true)

    try {
      const results = await api.checkAllDomains()
      const failedCount = results.filter((item) => !(item.is_valid && item.chain_valid)).length

      if (failedCount > 0) {
        toast.warning(t("certificates.domains.toastCheckAllPartial", {
          failed: failedCount,
          total: results.length,
        }))
      } else {
        toast.success(t("certificates.domains.toastCheckAllSuccess"))
      }

      await fetchDomains(true)
    } catch (error) {
      toast.error(getApiErrorMessage(error, t("certificates.domains.toastCheckAllError")))
    } finally {
      setCheckingAll(false)
    }
  }

  const handleAutoCreateAndCheck = async () => {
    if (!autoCreateDomain) {
      return
    }

    const domain = autoCreateDomain.trim()

    if (!domain) {
      resetAutoCreateDraft()
      return
    }

    const port = parseOptionalNonNegativeInt(autoCreatePort)
    const checkInterval = parseOptionalNonNegativeInt(autoCreateCheckInterval)

    if (port === undefined || checkInterval === undefined) {
      setAutoCreateAdvancedOpen(true)
      toast.error(t("certificates.domains.toastInvalidNumber"))
      return
    }

    setAutoCreating(true)

    try {
      const created = await api.createDomain({
        domain,
        port,
        check_interval_secs: checkInterval,
        note: autoCreateNote.trim() ? autoCreateNote.trim() : null,
      })
      toast.success(t("certificates.domains.toastAutoCreateSuccess", { domain: created.domain }))
      resetAutoCreateDraft()
      await handleCheckDomain(created)
    } catch (error) {
      if (error instanceof ApiRequestError && error.status === 409) {
        try {
          const maybeExisting = await api.listDomains({
            limit: PAGE_LIMIT,
            offset: 0,
            domain__contains: domain,
          })

          const existing = maybeExisting.find((item) => item.domain.toLowerCase() === domain.toLowerCase())

          if (existing) {
            toast.success(t("certificates.domains.toastAutoCreateConflict", { domain }))
            resetAutoCreateDraft()
            await handleCheckDomain(existing)
            return
          }
        } catch {
          // ignore fallback query error and continue to generic error handling
        }
      }

      toast.error(
        getStatusAwareMessage(error, t("certificates.domains.toastAutoCreateError"), {
          409: t("certificates.domains.toastCreateConflict"),
        })
      )
    } finally {
      setAutoCreating(false)
    }
  }

  const openHistoryDialog = async (domain: CertDomain) => {
    setHistoryDomain(domain)
    setHistoryDialogOpen(true)
    setHistoryLoading(true)

    try {
      const result = await api.getCertCheckHistory(domain.id, {
        limit: 50,
        offset: 0,
      })

      setHistoryItems(result)
    } catch (error) {
      toast.error(getApiErrorMessage(error, t("certificates.domains.toastHistoryError")))
      setHistoryItems([])
    } finally {
      setHistoryLoading(false)
    }
  }

  const handleDeleteDomain = async () => {
    if (!deleteDialogDomain) {
      return
    }

    const target = deleteDialogDomain
    setDeletingId(target.id)

    try {
      await api.deleteDomain(target.id)
      toast.success(t("certificates.domains.toastDeleteSuccess"))
      setDeleteDialogDomain(null)

      if (currentPageCount === 1 && offset > 0) {
        setOffset((previous) => Math.max(0, previous - PAGE_LIMIT))
      } else {
        await fetchDomains(true)
      }
    } catch (error) {
      toast.error(
        getStatusAwareMessage(error, t("certificates.domains.toastDeleteError"), {
          404: t("certificates.domains.toastDeleteNotFound"),
        })
      )
    } finally {
      setDeletingId(null)
    }
  }

  const stats = useMemo(() => {
    return domains.reduce(
      (result, domain) => {
        if (domain.enabled) {
          result.enabled += 1
        } else {
          result.disabled += 1
        }

        return result
      },
      {
        total: domains.length,
        enabled: 0,
        disabled: 0,
      }
    )
  }, [domains])

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{t("certificates.domains.title")}</h1>
          <p className="text-sm text-muted-foreground">{t("certificates.domains.description")}</p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={handleCheckAllDomains}
            disabled={checkingAll}
          >
            {checkingAll ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ShieldCheck className="mr-2 h-4 w-4" />}
            {t("certificates.domains.checkAllButton")}
          </Button>

          <Button
            variant="outline"
            onClick={() => fetchDomains(true)}
            disabled={loading || refreshing}
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
            {t("certificates.domains.refreshButton")}
          </Button>

          <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                {t("certificates.domains.addButton")}
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{t("certificates.domains.addDialogTitle")}</DialogTitle>
                <DialogDescription>{t("certificates.domains.addDialogDescription")}</DialogDescription>
              </DialogHeader>

              <form onSubmit={handleCreateDomain} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="domain-name">{t("certificates.domains.fieldDomain")}</Label>
                  <Input
                    id="domain-name"
                    value={newDomain}
                    onChange={(event) => setNewDomain(event.target.value)}
                    placeholder={t("certificates.domains.fieldDomainPlaceholder")}
                    required
                  />
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="domain-port">{t("certificates.domains.fieldPort")}</Label>
                    <Input
                      id="domain-port"
                      value={newPort}
                      onChange={(event) => setNewPort(event.target.value)}
                      placeholder={t("certificates.domains.fieldPortPlaceholder")}
                      inputMode="numeric"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="domain-interval">{t("certificates.domains.fieldInterval")}</Label>
                    <Input
                      id="domain-interval"
                      value={newCheckInterval}
                      onChange={(event) => setNewCheckInterval(event.target.value)}
                      placeholder={t("certificates.domains.fieldIntervalPlaceholder")}
                      inputMode="numeric"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="domain-note">{t("certificates.domains.fieldNote")}</Label>
                  <Input
                    id="domain-note"
                    value={newNote}
                    onChange={(event) => setNewNote(event.target.value)}
                    placeholder={t("certificates.domains.fieldNotePlaceholder")}
                  />
                </div>

                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setCreateDialogOpen(false)}>
                    {t("certificates.domains.cancelButton")}
                  </Button>
                  <Button type="submit" disabled={creating}>
                    {creating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                    {creating ? t("certificates.domains.addSubmitting") : t("certificates.domains.addSubmit")}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>

          <Dialog open={batchDialogOpen} onOpenChange={setBatchDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">{t("certificates.domains.batchButton")}</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{t("certificates.domains.batchDialogTitle")}</DialogTitle>
                <DialogDescription>{t("certificates.domains.batchDialogDescription")}</DialogDescription>
              </DialogHeader>

              <div className="space-y-2">
                <Label htmlFor="batch-domains">{t("certificates.domains.batchFieldLabel")}</Label>
                <Textarea
                  id="batch-domains"
                  value={batchDomains}
                  onChange={(event) => setBatchDomains(event.target.value)}
                  placeholder={t("certificates.domains.batchPlaceholder")}
                  rows={8}
                />
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setBatchDialogOpen(false)}>
                  {t("certificates.domains.cancelButton")}
                </Button>
                <Button type="button" onClick={handleBatchCreate} disabled={batchCreating}>
                  {batchCreating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  {t("certificates.domains.batchSubmit")}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>{t("certificates.domains.statTotal")}</CardDescription>
            <CardTitle className="text-3xl">{stats.total}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>{t("certificates.domains.statEnabled")}</CardDescription>
            <CardTitle className="text-3xl text-emerald-600">{stats.enabled}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>{t("certificates.domains.statDisabled")}</CardDescription>
            <CardTitle className="text-3xl text-muted-foreground">{stats.disabled}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t("certificates.domains.filtersTitle")}</CardTitle>
          <CardDescription>{t("certificates.domains.filtersDescription")}</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-2">
          <Input
            value={domainKeyword}
            onChange={(event) => handleDomainKeywordChange(event.target.value)}
            placeholder={t("certificates.domains.filterDomainPlaceholder")}
          />
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant={statusFilter === "all" ? "default" : "outline"}
              onClick={() => handleStatusFilterChange("all")}
            >
              {t("certificates.domains.filterStatusAll")}
            </Button>
            <Button
              type="button"
              variant={statusFilter === "enabled" ? "default" : "outline"}
              onClick={() => handleStatusFilterChange("enabled")}
            >
              {t("certificates.domains.filterStatusEnabled")}
            </Button>
            <Button
              type="button"
              variant={statusFilter === "disabled" ? "default" : "outline"}
              onClick={() => handleStatusFilterChange("disabled")}
            >
              {t("certificates.domains.filterStatusDisabled")}
            </Button>
            <Button type="button" variant="outline" onClick={handleResetFilters}>
              {t("certificates.domains.clearFilters")}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("certificates.domains.tableTitle")}</CardTitle>
          <CardDescription>{t("certificates.domains.tableDescription", { limit: PAGE_LIMIT })}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-hidden rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("certificates.domains.tableColDomain")}</TableHead>
                  <TableHead>{t("certificates.domains.tableColPort")}</TableHead>
                  <TableHead>{t("certificates.domains.tableColStatus")}</TableHead>
                  <TableHead>{t("certificates.domains.tableColInterval")}</TableHead>
                  <TableHead>{t("certificates.domains.tableColLastChecked")}</TableHead>
                  <TableHead>{t("certificates.domains.tableColNote")}</TableHead>
                  <TableHead className="text-right">{t("certificates.domains.tableColActions")}</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="h-40 text-center text-muted-foreground">
                      <Loader2 className="mx-auto mb-2 h-5 w-5 animate-spin" />
                      {t("certificates.domains.tableLoading")}
                    </TableCell>
                  </TableRow>
                ) : domains.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="h-32 text-center text-muted-foreground">
                      <div className="space-y-2">
                        <p>{t("certificates.domains.tableEmpty")}</p>
                        <p className="text-xs text-muted-foreground/80">
                          {t("certificates.domains.tableEmptyHint")}
                        </p>
                        <Button type="button" size="sm" onClick={() => setCreateDialogOpen(true)}>
                          <Plus className="mr-2 h-4 w-4" />
                          {t("certificates.domains.addButton")}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  domains.map((domain) => {
                    const statusMeta = getDomainStatusMeta(domain.enabled, t)
                    const checking = checkingId === domain.id
                    const updating = updatingId === domain.id
                    const deleting = deletingId === domain.id

                    return (
                      <TableRow key={domain.id} className="hover:bg-muted/40">
                        <TableCell className="font-medium">{domain.domain}</TableCell>
                        <TableCell className="text-muted-foreground">{domain.port}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Badge className={statusMeta.className}>{statusMeta.label}</Badge>
                            <Switch
                              checked={domain.enabled}
                              disabled={updating}
                              onCheckedChange={(checked) => handleToggleEnabled(domain, checked)}
                            />
                          </div>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {domain.check_interval_secs
                            ? t("certificates.domains.intervalSeconds", { seconds: domain.check_interval_secs })
                            : t("certificates.domains.intervalDefault")}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {formatDateTime(domain.last_checked_at, locale)}
                        </TableCell>
                        <TableCell className="max-w-[220px] truncate text-muted-foreground" title={domain.note || ""}>
                          {domain.note || t("certificates.domains.noteEmpty")}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              disabled={checking}
                              onClick={() => handleCheckDomain(domain)}
                            >
                              {checking ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ShieldCheck className="mr-2 h-4 w-4" />}
                              {t("certificates.domains.actionCheck")}
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => openHistoryDialog(domain)}
                              title={t("certificates.domains.actionHistory")}
                            >
                              <History className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="destructive"
                              size="icon"
                              onClick={() => setDeleteDialogDomain(domain)}
                              disabled={deleting}
                              title={t("certificates.domains.actionDelete")}
                            >
                              {deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  })
                )}
              </TableBody>
            </Table>
          </div>

          <div className="mt-4 flex items-center justify-end gap-2">
            <span className="mr-2 text-xs text-muted-foreground">
              {t("certificates.domains.paginationPage", { page: pageNumber })}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={!canGoPrev || loading}
              onClick={() => setOffset((previous) => Math.max(0, previous - PAGE_LIMIT))}
            >
              <ChevronLeft className="mr-1 h-4 w-4" />
              {t("certificates.domains.paginationPrev")}
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={!canGoNext || loading}
              onClick={() => setOffset((previous) => previous + PAGE_LIMIT)}
            >
              {t("certificates.domains.paginationNext")}
              <ChevronRight className="ml-1 h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      <Dialog open={Boolean(deleteDialogDomain)} onOpenChange={(open) => !open && setDeleteDialogDomain(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("certificates.domains.deleteDialogTitle")}</DialogTitle>
            <DialogDescription>
              {t("certificates.domains.deleteDialogDescription", {
                domain: deleteDialogDomain?.domain || "-",
              })}
            </DialogDescription>
          </DialogHeader>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setDeleteDialogDomain(null)}>
              {t("certificates.domains.cancelButton")}
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={handleDeleteDomain}
              disabled={Boolean(deletingId)}
            >
              {Boolean(deletingId) ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              {t("certificates.domains.actionDelete")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(autoCreateDomain)} onOpenChange={(open) => !open && resetAutoCreateDraft()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("certificates.domains.autoCreateDialogTitle")}</DialogTitle>
            <DialogDescription>
              {t("certificates.domains.autoCreateDialogDescription", {
                domain: autoCreateDomain || "-",
              })}
            </DialogDescription>
          </DialogHeader>

          <Collapsible open={autoCreateAdvancedOpen} onOpenChange={setAutoCreateAdvancedOpen}>
            <CollapsibleTrigger asChild>
              <Button type="button" variant="outline" className="w-full justify-between" disabled={autoCreating}>
                {t("certificates.domains.autoCreateAdvancedToggle")}
                <ChevronDown className={`h-4 w-4 transition-transform ${autoCreateAdvancedOpen ? "rotate-180" : ""}`} />
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-3 pt-3">
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs text-muted-foreground">
                  {t("certificates.domains.autoCreateAdvancedHint")}
                </p>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setClearAdvancedDialogOpen(true)}
                  disabled={autoCreating || !autoCreateHasAdvancedDraft}
                >
                  {t("certificates.domains.autoCreateAdvancedReset")}
                </Button>
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="auto-create-port">{t("certificates.domains.fieldPort")}</Label>
                  <Input
                    id="auto-create-port"
                    value={autoCreatePort}
                    onChange={(event) => setAutoCreatePort(event.target.value)}
                    placeholder={t("certificates.domains.fieldPortPlaceholder")}
                    inputMode="numeric"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="auto-create-interval">{t("certificates.domains.fieldInterval")}</Label>
                  <Input
                    id="auto-create-interval"
                    value={autoCreateCheckInterval}
                    onChange={(event) => setAutoCreateCheckInterval(event.target.value)}
                    placeholder={t("certificates.domains.fieldIntervalPlaceholder")}
                    inputMode="numeric"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="auto-create-note">{t("certificates.domains.fieldNote")}</Label>
                <Input
                  id="auto-create-note"
                  value={autoCreateNote}
                  onChange={(event) => setAutoCreateNote(event.target.value)}
                  placeholder={t("certificates.domains.fieldNotePlaceholder")}
                />
              </div>
            </CollapsibleContent>
          </Collapsible>

          <AlertDialog open={clearAdvancedDialogOpen} onOpenChange={setClearAdvancedDialogOpen}>
            <AlertDialogContent size="sm">
              <AlertDialogHeader>
                <AlertDialogTitle>{t("certificates.domains.autoCreateAdvancedResetDialogTitle")}</AlertDialogTitle>
                <AlertDialogDescription>
                  {t("certificates.domains.autoCreateAdvancedResetDialogDescription")}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>{t("certificates.domains.cancelButton")}</AlertDialogCancel>
                <AlertDialogAction variant="destructive" onClick={clearAutoCreateAdvancedDraft}>
                  {t("certificates.domains.autoCreateAdvancedResetDialogConfirm")}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => resetAutoCreateDraft()}
              disabled={autoCreating}
            >
              {t("certificates.domains.cancelButton")}
            </Button>
            <Button type="button" onClick={handleAutoCreateAndCheck} disabled={autoCreating}>
              {autoCreating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              {autoCreating
                ? t("certificates.domains.autoCreateSubmitting")
                : t("certificates.domains.autoCreateSubmit")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={historyDialogOpen}
        onOpenChange={(open) => {
          setHistoryDialogOpen(open)

          if (!open) {
            setHistoryDomain(null)
            setHistoryItems([])
          }
        }}
      >
        <DialogContent className="max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {t("certificates.domains.historyDialogTitle", {
                domain: historyDomain?.domain || "-",
              })}
            </DialogTitle>
            <DialogDescription>{t("certificates.domains.historyDialogDescription")}</DialogDescription>
          </DialogHeader>

          {historyLoading ? (
            <div className="py-8 text-center text-muted-foreground">
              <Loader2 className="mx-auto mb-2 h-5 w-5 animate-spin" />
              {t("certificates.domains.historyLoading")}
            </div>
          ) : historyItems.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground">
              {t("certificates.domains.historyEmpty")}
            </div>
          ) : (
            <div className="space-y-3">
              {historyItems.map((item) => (
                <div key={item.id} className="rounded-md border p-3">
                  <div className="flex items-center justify-between gap-3">
                    <Badge
                      className={item.is_valid && item.chain_valid
                        ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-600"
                        : "border-red-500/30 bg-red-500/10 text-red-600"}
                    >
                      {item.is_valid && item.chain_valid
                        ? t("certificates.domains.historyStatusValid")
                        : t("certificates.domains.historyStatusInvalid")}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {formatDateTime(item.checked_at, locale)}
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {item.error || t("certificates.domains.historyNoError")}
                  </p>
                </div>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
