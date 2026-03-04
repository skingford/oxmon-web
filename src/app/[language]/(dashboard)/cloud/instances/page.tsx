"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { Loader2, RefreshCw, Sparkles } from "lucide-react"
import { CloudInstancesFiltersCard } from "@/components/pages/cloud/cloud-instances-filters-card"
import { CloudInstancesStatsCards } from "@/components/pages/cloud/cloud-instances-stats-cards"
import { CloudInstancesTableCard } from "@/components/pages/cloud/cloud-instances-table-card"
import {
  normalizeCloudInstanceStatus,
  uniqueSortedWithLocale,
  type CloudInstanceStatusKey,
} from "@/components/pages/cloud/cloud-instance-list-utils"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { PaginationControls } from "@/components/ui/pagination-controls"
import { useAppTranslations } from "@/hooks/use-app-translations"
import { useClientPagination } from "@/hooks/use-client-pagination"
import { useRequestState } from "@/hooks/use-request-state"
import { useServerOffsetPagination } from "@/hooks/use-server-offset-pagination"
import { api } from "@/lib/api"
import {
  buildFallbackCloudProviderOptions,
  normalizeCloudProvider,
  normalizeCloudProviderDictionaryItems,
  type CloudProviderOption,
} from "@/lib/cloud-provider"
import { toast, toastApiError, toastStatusError } from "@/lib/toast"
import type { CloudAICheckJobResponse, CloudInstanceQueryParams, CloudInstanceResponse, DictionaryItem } from "@/types/api"

type CloudInstancesState = {
  instances: CloudInstanceResponse[]
  total: number
}

const PAGE_SIZE_OPTIONS = [10, 20, 50] as const
const CLOUD_INSTANCE_STATUS_DICT_TYPE = "cloud_instance_status"
const CLOUD_PROVIDER_DICT_TYPE = "cloud_provider"
const AI_CHECK_JOBS_LIMIT = 8
const AI_CHECK_JOBS_PAGE_SIZE_OPTIONS = [3, 5, 10] as const
const AI_CHECK_POLL_INTERVAL_OPTIONS = [5, 15, 30] as const

type CloudInstanceStatusDictionaryOption = {
  value: string
  label: string
  sortOrder: number
}

function normalizeStatusFilterValue(value: string | null | undefined) {
  return (value || "").trim().toLowerCase()
}

function normalizeAICheckJobStatus(value: string | null | undefined) {
  const normalized = (value || "").trim().toLowerCase()

  if (normalized === "running" || normalized === "succeeded" || normalized === "failed") {
    return normalized
  }

  return "unknown"
}

function formatDateTime(value: string | null | undefined, locale: "zh" | "en") {
  if (!value) {
    return "-"
  }

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return value
  }

  return date.toLocaleString(locale === "zh" ? "zh-CN" : "en-US", {
    hour12: false,
  })
}

function resolveStatusText(status: CloudInstanceStatusKey, t: ReturnType<typeof useAppTranslations>["t"]) {
  if (status === "running") {
    return t("cloud.instances.statusRunning")
  }
  if (status === "stopped") {
    return t("cloud.instances.statusStopped")
  }
  if (status === "pending") {
    return t("cloud.instances.statusPending")
  }
  if (status === "error") {
    return t("cloud.instances.statusError")
  }
  return t("cloud.instances.statusUnknown")
}

function resolveAICheckJobStatusText(
  status: string,
  t: ReturnType<typeof useAppTranslations>["t"]
) {
  const normalized = normalizeAICheckJobStatus(status)

  if (normalized === "running") {
    return t("cloud.instances.aiCheckJobStatusRunning")
  }

  if (normalized === "succeeded") {
    return t("cloud.instances.aiCheckJobStatusSucceeded")
  }

  if (normalized === "failed") {
    return t("cloud.instances.aiCheckJobStatusFailed")
  }

  return t("cloud.instances.statusUnknown")
}

function resolveAICheckJobStatusVariant(
  status: string
): "warning" | "success" | "destructive" | "secondary" {
  const normalized = normalizeAICheckJobStatus(status)

  if (normalized === "running") {
    return "warning"
  }

  if (normalized === "succeeded") {
    return "success"
  }

  if (normalized === "failed") {
    return "destructive"
  }

  return "secondary"
}

function resolveAICheckJobTypeText(
  jobType: string,
  t: ReturnType<typeof useAppTranslations>["t"]
) {
  if (jobType === "cloud_all") {
    return t("cloud.instances.aiCheckJobTypeAll")
  }

  if (jobType.startsWith("cloud_instance:")) {
    return t("cloud.instances.aiCheckJobTypeInstance", {
      id: jobType.slice("cloud_instance:".length) || "-",
    })
  }

  return jobType || "-"
}

function normalizeStatusDictionaryItems(items: DictionaryItem[]): CloudInstanceStatusDictionaryOption[] {
  const normalizedItems = items
    .map((item) => ({
      value: normalizeStatusFilterValue(item.dict_key),
      label: item.dict_label.trim() || item.dict_key.trim(),
      sortOrder: item.sort_order,
    }))
    .filter((item) => Boolean(item.value) && item.value !== "all")
    .sort((left, right) => {
      if (left.sortOrder !== right.sortOrder) {
        return left.sortOrder - right.sortOrder
      }

      return left.value.localeCompare(right.value)
    })

  const seen = new Set<string>()

  return normalizedItems.filter((item) => {
    if (seen.has(item.value)) {
      return false
    }

    seen.add(item.value)
    return true
  })
}

export default function CloudInstancesPage() {
  const { t, locale } = useAppTranslations("pages")
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const { data, loading, refreshing, execute } = useRequestState<CloudInstancesState>({
    instances: [],
    total: 0,
  })
  const {
    data: aiCheckJobs,
    setData: setAICheckJobs,
    loading: aiCheckJobsLoading,
    refreshing: aiCheckJobsRefreshing,
    execute: executeAICheckJobsRequest,
  } = useRequestState<CloudAICheckJobResponse[]>([], { initialLoading: false })

  const [searchKeyword, setSearchKeyword] = useState("")
  const [providerFilter, setProviderFilter] = useState("all")
  const [regionFilter, setRegionFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState("all")
  const [aiCheckJobsPageSize, setAICheckJobsPageSize] = useState<number>(AI_CHECK_JOBS_PAGE_SIZE_OPTIONS[0])
  const [pageSize, setPageSize] = useState<number>(20)
  const [offset, setOffset] = useState(0)
  const [debouncedSearchKeyword, setDebouncedSearchKeyword] = useState("")
  const [triggeringAICheckAll, setTriggeringAICheckAll] = useState(false)
  const [aiCheckPollIntervalSecs, setAICheckPollIntervalSecs] = useState<(typeof AI_CHECK_POLL_INTERVAL_OPTIONS)[number]>(15)
  const [refreshingAICheckJobId, setRefreshingAICheckJobId] = useState<string | null>(null)
  const [recentlyTriggeredAICheckJobId, setRecentlyTriggeredAICheckJobId] = useState<string | null>(null)
  const [recentlyCompletedAICheckJobs, setRecentlyCompletedAICheckJobs] = useState<Record<string, "succeeded" | "failed">>({})
  const [allInstancesSnapshot, setAllInstancesSnapshot] = useState<CloudInstanceResponse[] | null>(null)
  const [providerDictionaryOptions, setProviderDictionaryOptions] = useState<CloudProviderOption[]>([])
  const [statusDictionaryOptions, setStatusDictionaryOptions] = useState<CloudInstanceStatusDictionaryOption[]>([])
  const syncingFromUrlRef = useRef(false)
  const previousAICheckStatusesRef = useRef<Record<string, string>>({})
  const previousHasRunningAICheckJobsRef = useRef(false)
  const clearCompletedHighlightTimerRef = useRef<number | null>(null)
  const clearTriggeredHighlightTimerRef = useRef<number | null>(null)

  const instances = data.instances
  const total = data.total
  const aiCheckJobsPagination = useClientPagination({
    items: aiCheckJobs,
    pageSize: aiCheckJobsPageSize,
  })
  const setAICheckJobsPage = aiCheckJobsPagination.setPage
  const aiCheckJobsPage = aiCheckJobsPagination.page

  useEffect(() => {
    syncingFromUrlRef.current = true

    const nextSearchKeyword = searchParams.get("search") || ""
    const nextProviderFilter = normalizeCloudProvider(searchParams.get("provider")) || "all"
    const nextRegionFilter = searchParams.get("region") || "all"
    const nextStatusFilter = normalizeStatusFilterValue(searchParams.get("status")) || "all"
    const rawLimit = Number(searchParams.get("limit") || String(PAGE_SIZE_OPTIONS[1]))
    const nextPageSize = PAGE_SIZE_OPTIONS.includes(rawLimit as (typeof PAGE_SIZE_OPTIONS)[number])
      ? rawLimit
      : PAGE_SIZE_OPTIONS[1]
    const rawOffset = Number(searchParams.get("offset") || "0")
    const nextOffset = Number.isFinite(rawOffset) && rawOffset > 0 ? Math.floor(rawOffset) : 0
    const rawAICheckJobsLimit = Number(searchParams.get("aiJobsLimit") || String(AI_CHECK_JOBS_PAGE_SIZE_OPTIONS[0]))
    const nextAICheckJobsPageSize = AI_CHECK_JOBS_PAGE_SIZE_OPTIONS.includes(
      rawAICheckJobsLimit as (typeof AI_CHECK_JOBS_PAGE_SIZE_OPTIONS)[number]
    )
      ? rawAICheckJobsLimit
      : AI_CHECK_JOBS_PAGE_SIZE_OPTIONS[0]
    const rawAICheckJobsPage = Number(searchParams.get("aiJobsPage") || "1")
    const nextAICheckJobsPage = Number.isFinite(rawAICheckJobsPage) && rawAICheckJobsPage > 1
      ? Math.floor(rawAICheckJobsPage)
      : 1

    setSearchKeyword((prev) => (prev === nextSearchKeyword ? prev : nextSearchKeyword))
    setProviderFilter((prev) => (prev === nextProviderFilter ? prev : nextProviderFilter))
    setRegionFilter((prev) => (prev === nextRegionFilter ? prev : nextRegionFilter))
    setStatusFilter((prev) => (prev === nextStatusFilter ? prev : nextStatusFilter))
    setAICheckJobsPageSize((prev) => (prev === nextAICheckJobsPageSize ? prev : nextAICheckJobsPageSize))
    setAICheckJobsPage((prev) => (prev === nextAICheckJobsPage ? prev : nextAICheckJobsPage))
    setPageSize((prev) => (prev === nextPageSize ? prev : nextPageSize))
    setOffset((prev) => (prev === nextOffset ? prev : nextOffset))
  }, [searchParams, setAICheckJobsPage])

  useEffect(() => {
    const nextParams = new URLSearchParams(searchParams.toString())

    if (searchKeyword.trim()) {
      nextParams.set("search", searchKeyword)
    } else {
      nextParams.delete("search")
    }

    if (providerFilter !== "all") {
      nextParams.set("provider", providerFilter)
    } else {
      nextParams.delete("provider")
    }

    if (regionFilter !== "all") {
      nextParams.set("region", regionFilter)
    } else {
      nextParams.delete("region")
    }

    if (statusFilter !== "all") {
      nextParams.set("status", statusFilter)
    } else {
      nextParams.delete("status")
    }

    if (pageSize !== PAGE_SIZE_OPTIONS[1]) {
      nextParams.set("limit", String(pageSize))
    } else {
      nextParams.delete("limit")
    }

    if (offset > 0) {
      nextParams.set("offset", String(offset))
    } else {
      nextParams.delete("offset")
    }

    if (aiCheckJobsPageSize !== AI_CHECK_JOBS_PAGE_SIZE_OPTIONS[0]) {
      nextParams.set("aiJobsLimit", String(aiCheckJobsPageSize))
    } else {
      nextParams.delete("aiJobsLimit")
    }

    if (aiCheckJobsPage > 1) {
      nextParams.set("aiJobsPage", String(aiCheckJobsPage))
    } else {
      nextParams.delete("aiJobsPage")
    }

    const nextQuery = nextParams.toString()
    const currentQuery = searchParams.toString()

    if (nextQuery === currentQuery) {
      return
    }

    router.replace(nextQuery ? `${pathname}?${nextQuery}` : pathname, { scroll: false })
  }, [
    aiCheckJobsPage,
    aiCheckJobsPageSize,
    offset,
    pageSize,
    pathname,
    providerFilter,
    regionFilter,
    router,
    searchKeyword,
    searchParams,
    statusFilter,
  ])

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedSearchKeyword(searchKeyword)
    }, 300)

    return () => window.clearTimeout(timer)
  }, [searchKeyword])

  useEffect(() => {
    if (syncingFromUrlRef.current) {
      syncingFromUrlRef.current = false
      return
    }

    setOffset(0)
  }, [debouncedSearchKeyword, pageSize, providerFilter, regionFilter, statusFilter])

  const fetchInstances = useCallback(async (silent = false) => {
    const params: CloudInstanceQueryParams = {
      provider: providerFilter !== "all" ? providerFilter : undefined,
      region: regionFilter !== "all" ? regionFilter : undefined,
      status: statusFilter !== "all" ? statusFilter : undefined,
      search: debouncedSearchKeyword.trim() || undefined,
      limit: pageSize,
      offset,
    }

    await execute(
      async () => {
        const page = await api.listCloudInstancesPage(params)

        return {
          instances: page.items,
          total: page.total,
        }
      },
      {
        silent,
        onError: (error) => {
          toastApiError(error, t("cloud.instances.toastFetchError"))
        },
      }
    )
  }, [debouncedSearchKeyword, execute, offset, pageSize, providerFilter, regionFilter, statusFilter, t])

  useEffect(() => {
    fetchInstances()
  }, [fetchInstances])

  const fetchAICheckJobs = useCallback(async (silent = false, showErrorToast = true) => {
    await executeAICheckJobsRequest(
      async () => {
        const page = await api.listCloudAICheckJobsPage({
          limit: AI_CHECK_JOBS_LIMIT,
          offset: 0,
        })

        return page.items
      },
      {
        silent,
        onError: (error) => {
          if (showErrorToast) {
            toastApiError(error, t("cloud.instances.toastFetchAICheckJobsError"))
          }
        },
      }
    )
  }, [executeAICheckJobsRequest, t])

  useEffect(() => {
    fetchAICheckJobs()
  }, [fetchAICheckJobs])

  useEffect(() => {
    const previousStatuses = previousAICheckStatusesRef.current
    const nextStatuses: Record<string, string> = {}
    const justCompleted: Record<string, "succeeded" | "failed"> = {}

    for (const job of aiCheckJobs) {
      const normalizedStatus = normalizeAICheckJobStatus(job.status)
      nextStatuses[job.id] = normalizedStatus

      if (previousStatuses[job.id] === "running" && (normalizedStatus === "succeeded" || normalizedStatus === "failed")) {
        justCompleted[job.id] = normalizedStatus
      }
    }

    previousAICheckStatusesRef.current = nextStatuses

    if (Object.keys(justCompleted).length === 0) {
      return
    }

    setRecentlyCompletedAICheckJobs((prev) => ({
      ...prev,
      ...justCompleted,
    }))

    if (clearCompletedHighlightTimerRef.current !== null) {
      window.clearTimeout(clearCompletedHighlightTimerRef.current)
    }

    clearCompletedHighlightTimerRef.current = window.setTimeout(() => {
      setRecentlyCompletedAICheckJobs({})
      clearCompletedHighlightTimerRef.current = null
    }, 2600)
  }, [aiCheckJobs])

  const hasRunningAICheckJobs = useMemo(
    () => aiCheckJobs.some((job) => normalizeAICheckJobStatus(job.status) === "running"),
    [aiCheckJobs]
  )

  useEffect(() => {
    const hadRunningJobs = previousHasRunningAICheckJobsRef.current

    if (hadRunningJobs && !hasRunningAICheckJobs) {
      const failedCount = aiCheckJobs.filter((job) => normalizeAICheckJobStatus(job.status) === "failed").length

      if (failedCount > 0) {
        toast.warning(t("cloud.instances.toastAICheckJobsCompletedWithFailure", { failed: failedCount }))
      } else {
        toast.success(t("cloud.instances.toastAICheckJobsCompletedSuccess"))
      }
    }

    previousHasRunningAICheckJobsRef.current = hasRunningAICheckJobs
  }, [aiCheckJobs, hasRunningAICheckJobs, t])

  useEffect(() => {
    if (!hasRunningAICheckJobs) {
      return
    }

    let disposed = false
    let timer: number | null = null
    let inFlight = false

    const resolveDelayMs = () => {
      const baseDelayMs = aiCheckPollIntervalSecs * 1000

      if (typeof document !== "undefined" && document.visibilityState !== "visible") {
        return Math.min(60_000, baseDelayMs * 2)
      }

      return baseDelayMs
    }

    const scheduleNext = () => {
      if (disposed) {
        return
      }

      const baseDelayMs = resolveDelayMs()
      const jitterRange = Math.max(300, Math.round(baseDelayMs * 0.12))
      const jitter = Math.floor(Math.random() * (jitterRange * 2 + 1)) - jitterRange
      const nextDelay = Math.max(1_000, baseDelayMs + jitter)

      timer = window.setTimeout(() => {
        void tick()
      }, nextDelay)
    }

    const tick = async () => {
      if (disposed) {
        return
      }

      if (inFlight) {
        scheduleNext()
        return
      }

      inFlight = true
      try {
        await fetchAICheckJobs(true, false)
      } finally {
        inFlight = false
        scheduleNext()
      }
    }

    const handleVisibilityChange = () => {
      if (disposed || document.visibilityState !== "visible" || inFlight) {
        return
      }

      if (timer !== null) {
        window.clearTimeout(timer)
        timer = null
      }

      void tick()
    }

    document.addEventListener("visibilitychange", handleVisibilityChange)
    scheduleNext()

    return () => {
      disposed = true

      if (timer !== null) {
        window.clearTimeout(timer)
      }

      document.removeEventListener("visibilitychange", handleVisibilityChange)
    }
  }, [aiCheckPollIntervalSecs, fetchAICheckJobs, hasRunningAICheckJobs])

  useEffect(() => {
    if (!recentlyTriggeredAICheckJobId) {
      return
    }

    const rowElement = document.getElementById(`ai-check-job-row-${recentlyTriggeredAICheckJobId}`)
    if (!rowElement) {
      return
    }

    rowElement.scrollIntoView({ behavior: "smooth", block: "center" })
  }, [aiCheckJobs, recentlyTriggeredAICheckJobId])

  useEffect(() => {
    return () => {
      if (clearCompletedHighlightTimerRef.current !== null) {
        window.clearTimeout(clearCompletedHighlightTimerRef.current)
      }

      if (clearTriggeredHighlightTimerRef.current !== null) {
        window.clearTimeout(clearTriggeredHighlightTimerRef.current)
      }
    }
  }, [])

  useEffect(() => {
    if (allInstancesSnapshot !== null) {
      return
    }

    let cancelled = false

    api.listCloudInstances()
      .then((rows) => {
        if (!cancelled) {
          setAllInstancesSnapshot(rows)
        }
      })
      .catch(() => {
        // ignore snapshot fetch failures; page uses current table data as fallback
      })

    return () => {
      cancelled = true
    }
  }, [allInstancesSnapshot])

  useEffect(() => {
    let cancelled = false

    api.listDictionariesByType(CLOUD_PROVIDER_DICT_TYPE, true)
      .then((items) => {
        if (!cancelled) {
          setProviderDictionaryOptions(normalizeCloudProviderDictionaryItems(items))
        }
      })
      .catch(() => {
        if (!cancelled) {
          setProviderDictionaryOptions([])
        }
      })

    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    let cancelled = false

    const fetchStatusDictionary = async () => {
      try {
        const items = await api.listDictionariesByType(CLOUD_INSTANCE_STATUS_DICT_TYPE)

        if (!cancelled) {
          setStatusDictionaryOptions(normalizeStatusDictionaryItems(items))
        }
      } catch {
        // strictly rely on cloud_instance_status dictionary
        if (!cancelled) {
          setStatusDictionaryOptions([])
        }
      }
    }

    fetchStatusDictionary()

    return () => {
      cancelled = true
    }
  }, [])

  const optionSourceInstances = allInstancesSnapshot ?? instances

  const discoveredProviders = useMemo(
    () => uniqueSortedWithLocale(optionSourceInstances.map((item) => normalizeCloudProvider(item.provider)), locale),
    [locale, optionSourceInstances]
  )

  const fallbackProviderOptions = useMemo(
    () => buildFallbackCloudProviderOptions(locale),
    [locale]
  )

  const providerOptions = useMemo(() => {
    if (providerDictionaryOptions.length > 0) {
      return providerDictionaryOptions.map((item) => ({
        value: item.value,
        label: item.label,
      }))
    }

    if (discoveredProviders.length > 0) {
      return discoveredProviders.map((provider) => ({
        value: provider,
        label: provider,
      }))
    }

    return fallbackProviderOptions.map((item) => ({
      value: item.value,
      label: item.label,
    }))
  }, [discoveredProviders, fallbackProviderOptions, providerDictionaryOptions])

  const providerLabelMap = useMemo(
    () => new Map(providerOptions.map((item) => [item.value, item.label])),
    [providerOptions]
  )

  const getProviderLabel = useCallback(
    (provider: string) => {
      const normalizedProvider = normalizeCloudProvider(provider)
      return providerLabelMap.get(normalizedProvider) || provider || "-"
    },
    [providerLabelMap]
  )

  const providerOptionValues = useMemo(
    () => providerOptions.map((item) => item.value),
    [providerOptions]
  )

  const regionOptions = useMemo(
    () => uniqueSortedWithLocale(optionSourceInstances.map((item) => item.region), locale),
    [locale, optionSourceInstances]
  )

  const statusOptions = useMemo(() => {
    return statusDictionaryOptions.map((item) => item.value)
  }, [statusDictionaryOptions])

  useEffect(() => {
    if (providerFilter === "all") {
      return
    }

    if (!providerOptionValues.includes(providerFilter)) {
      setProviderFilter("all")
    }
  }, [providerFilter, providerOptionValues])

  useEffect(() => {
    if (statusFilter === "all") {
      return
    }

    if (!statusOptions.includes(statusFilter)) {
      setStatusFilter("all")
    }
  }, [statusFilter, statusOptions])

  const pagination = useServerOffsetPagination({
    offset,
    limit: pageSize,
    currentItemsCount: instances.length,
    totalItems: total,
  })

  const stats = useMemo(
    () => ({
      total: optionSourceInstances.length,
      providers: discoveredProviders.length,
      regions: regionOptions.length,
      publicIps: optionSourceInstances.filter((item) => Boolean(item.public_ip)).length,
    }),
    [discoveredProviders.length, optionSourceInstances, regionOptions.length]
  )

  const statusDictionaryLabelMap = useMemo(
    () => new Map(statusDictionaryOptions.map((item) => [item.value, item.label])),
    [statusDictionaryOptions]
  )

  const getTableStatusLabel = useCallback(
    (status: CloudInstanceStatusKey) => resolveStatusText(status, t),
    [t]
  )

  const getStatusFilterLabel = useCallback(
    (status: string) => {
      const normalizedStatus = normalizeStatusFilterValue(status)
      return statusDictionaryLabelMap.get(normalizedStatus) || resolveStatusText(normalizeCloudInstanceStatus(status), t)
    },
    [statusDictionaryLabelMap, t]
  )

  const pageSizeOptionLabel = useCallback(
    (size: number) => (locale === "zh" ? `${size} / 页` : `${size} / page`),
    [locale]
  )

  const handleTriggerAICheckAll = useCallback(async () => {
    if (triggeringAICheckAll) {
      return
    }

    setTriggeringAICheckAll(true)

    try {
      const result = await api.triggerAllCloudInstancesAICheck({})
      const jobId = result.job_id || result.report_id || "-"
      setRecentlyTriggeredAICheckJobId(jobId === "-" ? null : jobId)
      setAICheckJobsPage(1)

      if (jobId !== "-") {
        if (clearTriggeredHighlightTimerRef.current !== null) {
          window.clearTimeout(clearTriggeredHighlightTimerRef.current)
        }

        clearTriggeredHighlightTimerRef.current = window.setTimeout(() => {
          setRecentlyTriggeredAICheckJobId(null)
          clearTriggeredHighlightTimerRef.current = null
        }, 3200)
      }

      toast.success(t("cloud.instances.toastTriggerAICheckAllSuccess", {
        jobId,
      }))
      await fetchAICheckJobs(true)
    } catch (error) {
      toastStatusError(error, t("cloud.instances.toastTriggerAICheckAllError"), {
        400: t("cloud.instances.toastTriggerAICheckNoAccount"),
      })
    } finally {
      setTriggeringAICheckAll(false)
    }
  }, [fetchAICheckJobs, setAICheckJobsPage, t, triggeringAICheckAll])

  const handleRefreshAICheckJob = useCallback(async (jobId: string) => {
    if (!jobId || refreshingAICheckJobId === jobId) {
      return
    }

    setRefreshingAICheckJobId(jobId)

    try {
      const job = await api.getCloudAICheckJob(jobId)
      setAICheckJobs((prev) => prev.map((item) => (item.id === jobId ? job : item)))
      toast.success(t("cloud.instances.toastRefreshAICheckJobSuccess"))
    } catch (error) {
      toastApiError(error, t("cloud.instances.toastRefreshAICheckJobError"))
    } finally {
      setRefreshingAICheckJobId((prev) => (prev === jobId ? null : prev))
    }
  }, [refreshingAICheckJobId, setAICheckJobs, t])

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="space-y-1">
          <h2 className="text-2xl font-bold tracking-tight">{t("cloud.instances.title")}</h2>
          <p className="text-sm text-muted-foreground">{t("cloud.instances.description")}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button type="button" variant="outline" onClick={handleTriggerAICheckAll} disabled={triggeringAICheckAll}>
            {triggeringAICheckAll ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
            {triggeringAICheckAll
              ? t("cloud.instances.triggerAICheckingButton")
              : t("cloud.instances.triggerAICheckAllButton")}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={async () => {
              await Promise.all([fetchInstances(true), fetchAICheckJobs(true)])
            }}
            disabled={refreshing || aiCheckJobsRefreshing}
          >
            {refreshing || aiCheckJobsRefreshing
              ? <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              : <RefreshCw className="mr-2 h-4 w-4" />}
            {t("cloud.instances.refreshButton")}
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader className="gap-3 md:flex-row md:items-center md:justify-between">
          <div className="space-y-1">
            <CardTitle>{t("cloud.instances.aiCheckJobsTitle")}</CardTitle>
            <CardDescription>
              {t("cloud.instances.aiCheckJobsDescription", { limit: AI_CHECK_JOBS_LIMIT })}
            </CardDescription>
            {hasRunningAICheckJobs ? (
              <p className="text-xs text-muted-foreground">
                {t("cloud.instances.aiCheckJobsAutoRefreshHint", { seconds: aiCheckPollIntervalSecs })}
              </p>
            ) : null}
          </div>
          <div className="flex items-center gap-2">
            <Select
              value={String(aiCheckPollIntervalSecs)}
              onValueChange={(value) => {
                const nextValue = Number(value)
                if (AI_CHECK_POLL_INTERVAL_OPTIONS.includes(nextValue as (typeof AI_CHECK_POLL_INTERVAL_OPTIONS)[number])) {
                  setAICheckPollIntervalSecs(nextValue as (typeof AI_CHECK_POLL_INTERVAL_OPTIONS)[number])
                }
              }}
            >
              <SelectTrigger className="w-[140px]" aria-label={t("cloud.instances.aiCheckJobsPollIntervalLabel")}>
                <SelectValue placeholder={t("cloud.instances.aiCheckJobsPollIntervalLabel")} />
              </SelectTrigger>
              <SelectContent>
                {AI_CHECK_POLL_INTERVAL_OPTIONS.map((seconds) => (
                  <SelectItem key={seconds} value={String(seconds)}>
                    {t("cloud.instances.aiCheckJobsPollIntervalOption", { seconds })}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button type="button" variant="outline" size="sm" onClick={() => fetchAICheckJobs(true)} disabled={aiCheckJobsRefreshing}>
              {aiCheckJobsRefreshing
                ? <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                : <RefreshCw className="mr-2 h-4 w-4" />}
              {t("cloud.instances.aiCheckJobsRefreshButton")}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("cloud.instances.aiCheckJobsColType")}</TableHead>
                  <TableHead>{t("cloud.instances.aiCheckJobsColStatus")}</TableHead>
                  <TableHead>{t("cloud.instances.aiCheckJobsColStartedAt")}</TableHead>
                  <TableHead>{t("cloud.instances.aiCheckJobsColFinishedAt")}</TableHead>
                  <TableHead>{t("cloud.instances.aiCheckJobsColResult")}</TableHead>
                  <TableHead className="w-[90px] text-right">{t("cloud.instances.aiCheckJobsColAction")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {aiCheckJobsLoading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-20 text-center text-muted-foreground">
                      {t("cloud.instances.aiCheckJobsLoading")}
                    </TableCell>
                  </TableRow>
                ) : aiCheckJobs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-20 text-center text-muted-foreground">
                      {t("cloud.instances.aiCheckJobsEmpty")}
                    </TableCell>
                  </TableRow>
                ) : (
                  aiCheckJobsPagination.paginatedItems.map((job) => {
                    const completedStatus = recentlyCompletedAICheckJobs[job.id]
                    const isRecentlyTriggered = recentlyTriggeredAICheckJobId === job.id
                    const rowClassName = isRecentlyTriggered
                      ? "bg-sky-500/10 ring-1 ring-inset ring-sky-500/30 transition-colors duration-700"
                      : completedStatus === "failed"
                        ? "bg-destructive/10 transition-colors duration-700"
                        : completedStatus === "succeeded"
                          ? "bg-emerald-500/10 transition-colors duration-700"
                          : undefined

                    return (
                      <TableRow
                        key={job.id}
                        id={`ai-check-job-row-${job.id}`}
                        className={rowClassName}
                      >
                        <TableCell className="max-w-[260px]">
                          <div className="space-y-1">
                            <p className="text-sm">{resolveAICheckJobTypeText(job.job_type, t)}</p>
                            <div className="flex items-center gap-2">
                              <p className="font-mono text-xs text-muted-foreground">{job.id}</p>
                              {isRecentlyTriggered ? (
                                <Badge variant="secondary" className="px-1.5 py-0 text-[10px]">
                                  {t("cloud.instances.aiCheckJobsNewBadge")}
                                </Badge>
                              ) : null}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={resolveAICheckJobStatusVariant(job.status)}>
                            {resolveAICheckJobStatusText(job.status, t)}
                          </Badge>
                        </TableCell>
                        <TableCell>{formatDateTime(job.started_at, locale)}</TableCell>
                        <TableCell>{formatDateTime(job.finished_at, locale)}</TableCell>
                        <TableCell className="max-w-[280px]">
                          {job.report_id
                            ? <span className="font-mono text-xs">{job.report_id}</span>
                            : <span className="text-sm text-muted-foreground">{job.error_message || "-"}</span>}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => handleRefreshAICheckJob(job.id)}
                            disabled={refreshingAICheckJobId === job.id}
                          >
                            {refreshingAICheckJobId === job.id
                              ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              : t("cloud.instances.aiCheckJobsActionRefresh")}
                          </Button>
                        </TableCell>
                      </TableRow>
                    )
                  })
                )}
              </TableBody>
            </Table>
          </div>
          {!aiCheckJobsLoading && aiCheckJobs.length > 0 ? (
            <PaginationControls
              pageSize={aiCheckJobsPageSize}
              pageSizeOptions={[...AI_CHECK_JOBS_PAGE_SIZE_OPTIONS]}
              onPageSizeChange={(nextPageSize) => {
                if (!AI_CHECK_JOBS_PAGE_SIZE_OPTIONS.includes(nextPageSize as (typeof AI_CHECK_JOBS_PAGE_SIZE_OPTIONS)[number])) {
                  return
                }

                setAICheckJobsPageSize(nextPageSize)
                setAICheckJobsPage(1)
              }}
              summaryText={t("cloud.instances.paginationSummary", {
                total: aiCheckJobsPagination.totalRows,
                start: aiCheckJobsPagination.startIndex,
                end: aiCheckJobsPagination.endIndex,
              })}
              pageIndicatorText={t("cloud.instances.paginationPage", {
                current: aiCheckJobsPagination.currentPage,
                total: aiCheckJobsPagination.totalPages,
              })}
              prevLabel={t("cloud.instances.paginationPrev")}
              nextLabel={t("cloud.instances.paginationNext")}
              pageSizePlaceholder={t("cloud.instances.pageSizePlaceholder")}
              onPrevPage={() => aiCheckJobsPagination.setPage((prev) => Math.max(1, prev - 1))}
              onNextPage={() => aiCheckJobsPagination.setPage((prev) => Math.min(aiCheckJobsPagination.totalPages, prev + 1))}
              prevDisabled={aiCheckJobsPagination.currentPage <= 1 || aiCheckJobsPagination.totalRows === 0}
              nextDisabled={
                aiCheckJobsPagination.currentPage >= aiCheckJobsPagination.totalPages
                || aiCheckJobsPagination.totalRows === 0
              }
              pageSizeOptionLabel={pageSizeOptionLabel}
            />
          ) : null}
        </CardContent>
      </Card>

      <CloudInstancesStatsCards
        stats={stats}
        labels={{
          total: t("cloud.instances.statTotal"),
          providers: t("cloud.instances.statProviders"),
          regions: t("cloud.instances.statRegions"),
          publicIps: t("cloud.instances.statPublicIps"),
        }}
      />

      <CloudInstancesFiltersCard
        searchKeyword={searchKeyword}
        providerFilter={providerFilter}
        regionFilter={regionFilter}
        statusFilter={statusFilter}
        providerOptions={providerOptions}
        regionOptions={regionOptions}
        statusOptions={statusOptions}
        onSearchKeywordChange={setSearchKeyword}
        onProviderFilterChange={(value) => setProviderFilter(value === "all" ? "all" : normalizeCloudProvider(value))}
        onRegionFilterChange={setRegionFilter}
        onStatusFilterChange={setStatusFilter}
        getStatusLabel={getStatusFilterLabel}
        texts={{
          title: t("cloud.instances.filtersTitle"),
          description: t("cloud.instances.filtersDescription"),
          filterSearch: t("cloud.instances.filterSearch"),
          filterSearchPlaceholder: t("cloud.instances.filterSearchPlaceholder"),
          filterProvider: t("cloud.instances.filterProvider"),
          filterProviderAll: t("cloud.instances.filterProviderAll"),
          filterRegion: t("cloud.instances.filterRegion"),
          filterRegionAll: t("cloud.instances.filterRegionAll"),
          filterStatus: t("cloud.instances.filterStatus"),
          filterStatusAll: t("cloud.instances.filterStatusAll"),
        }}
      />

      <CloudInstancesTableCard
        loading={loading}
        locale={locale}
        instances={instances}
        title={t("cloud.instances.tableTitle")}
        description={t("cloud.instances.tableDescription")}
        getStatusLabel={getTableStatusLabel}
        getProviderLabel={getProviderLabel}
        formatDateTime={formatDateTime}
        tableTexts={{
          colInstance: t("cloud.instances.tableColInstance"),
          colProvider: t("cloud.instances.tableColProvider"),
          colAccount: t("cloud.instances.tableColAccount"),
          colRegion: t("cloud.instances.tableColRegion"),
          colIp: t("cloud.instances.tableColIp"),
          colOs: t("cloud.instances.tableColOs"),
          colStatus: t("cloud.instances.tableColStatus"),
          colLastSeen: t("cloud.instances.tableColLastSeen"),
          loading: t("cloud.instances.tableLoading"),
          empty: t("cloud.instances.tableEmpty"),
          actionViewDetails: t("cloud.instances.actionViewDetails"),
        }}
        pagination={{
          pageSize,
          pageSizeOptions: [...PAGE_SIZE_OPTIONS],
          onPageSizeChange: (nextPageSize) => {
            setPageSize(nextPageSize)
            setOffset(0)
          },
          summaryText: t("cloud.instances.paginationSummary", {
            total,
            start: pagination.rangeStart,
            end: pagination.rangeEnd,
          }),
          pageIndicatorText: t("cloud.instances.paginationPage", {
            current: pagination.currentPage,
            total: pagination.totalPages,
          }),
          pageSizePlaceholder: t("cloud.instances.pageSizePlaceholder"),
          prevLabel: t("cloud.instances.paginationPrev"),
          nextLabel: t("cloud.instances.paginationNext"),
          onPrevPage: () => setOffset((prev) => Math.max(0, prev - pageSize)),
          onNextPage: () => setOffset((prev) => prev + pageSize),
          prevDisabled: !pagination.canGoPrev || total === 0,
          nextDisabled: !pagination.canGoNext || total === 0,
          pageSizeOptionLabel,
        }}
      />
    </div>
  )
}
