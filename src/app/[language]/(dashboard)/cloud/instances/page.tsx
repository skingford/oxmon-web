"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { Loader2, RefreshCw } from "lucide-react"
import { CloudInstancesFiltersCard } from "@/components/pages/cloud/cloud-instances-filters-card"
import { CloudInstancesStatsCards } from "@/components/pages/cloud/cloud-instances-stats-cards"
import { CloudInstancesTableCard } from "@/components/pages/cloud/cloud-instances-table-card"
import {
  normalizeCloudInstanceStatus,
  uniqueSortedWithLocale,
  type CloudInstanceStatusKey,
} from "@/components/pages/cloud/cloud-instance-list-utils"
import { Button } from "@/components/ui/button"
import { useAppTranslations } from "@/hooks/use-app-translations"
import { useRequestState } from "@/hooks/use-request-state"
import { useServerOffsetPagination } from "@/hooks/use-server-offset-pagination"
import { api } from "@/lib/api"
import { toastApiError } from "@/lib/toast"
import type { CloudInstanceQueryParams, CloudInstanceResponse, DictionaryItem } from "@/types/api"

type CloudInstancesState = {
  instances: CloudInstanceResponse[]
  total: number
}

const PAGE_SIZE_OPTIONS = [10, 20, 50] as const
const CLOUD_INSTANCE_STATUS_DICT_TYPE = "cloud_instance_status"

type CloudInstanceStatusDictionaryOption = {
  value: string
  label: string
  sortOrder: number
}

function normalizeStatusFilterValue(value: string | null | undefined) {
  return (value || "").trim().toLowerCase()
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

  const [searchKeyword, setSearchKeyword] = useState("")
  const [providerFilter, setProviderFilter] = useState("all")
  const [regionFilter, setRegionFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState("all")
  const [pageSize, setPageSize] = useState<number>(20)
  const [offset, setOffset] = useState(0)
  const [debouncedSearchKeyword, setDebouncedSearchKeyword] = useState("")
  const [allInstancesSnapshot, setAllInstancesSnapshot] = useState<CloudInstanceResponse[] | null>(null)
  const [statusDictionaryOptions, setStatusDictionaryOptions] = useState<CloudInstanceStatusDictionaryOption[]>([])
  const syncingFromUrlRef = useRef(false)

  const instances = data.instances
  const total = data.total

  useEffect(() => {
    syncingFromUrlRef.current = true

    const nextSearchKeyword = searchParams.get("search") || ""
    const nextProviderFilter = searchParams.get("provider") || "all"
    const nextRegionFilter = searchParams.get("region") || "all"
    const nextStatusFilter = normalizeStatusFilterValue(searchParams.get("status")) || "all"
    const rawLimit = Number(searchParams.get("limit") || String(PAGE_SIZE_OPTIONS[1]))
    const nextPageSize = PAGE_SIZE_OPTIONS.includes(rawLimit as (typeof PAGE_SIZE_OPTIONS)[number])
      ? rawLimit
      : PAGE_SIZE_OPTIONS[1]
    const rawOffset = Number(searchParams.get("offset") || "0")
    const nextOffset = Number.isFinite(rawOffset) && rawOffset > 0 ? Math.floor(rawOffset) : 0

    setSearchKeyword((prev) => (prev === nextSearchKeyword ? prev : nextSearchKeyword))
    setProviderFilter((prev) => (prev === nextProviderFilter ? prev : nextProviderFilter))
    setRegionFilter((prev) => (prev === nextRegionFilter ? prev : nextRegionFilter))
    setStatusFilter((prev) => (prev === nextStatusFilter ? prev : nextStatusFilter))
    setPageSize((prev) => (prev === nextPageSize ? prev : nextPageSize))
    setOffset((prev) => (prev === nextOffset ? prev : nextOffset))
  }, [searchParams])

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

    const nextQuery = nextParams.toString()
    const currentQuery = searchParams.toString()

    if (nextQuery === currentQuery) {
      return
    }

    router.replace(nextQuery ? `${pathname}?${nextQuery}` : pathname, { scroll: false })
  }, [offset, pageSize, pathname, providerFilter, regionFilter, router, searchKeyword, searchParams, statusFilter])

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

  const providerOptions = useMemo(
    () => uniqueSortedWithLocale(optionSourceInstances.map((item) => item.provider), locale),
    [locale, optionSourceInstances]
  )

  const regionOptions = useMemo(
    () => uniqueSortedWithLocale(optionSourceInstances.map((item) => item.region), locale),
    [locale, optionSourceInstances]
  )

  const statusOptions = useMemo(() => {
    return statusDictionaryOptions.map((item) => item.value)
  }, [statusDictionaryOptions])

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
      providers: providerOptions.length,
      regions: regionOptions.length,
      publicIps: optionSourceInstances.filter((item) => Boolean(item.public_ip)).length,
    }),
    [optionSourceInstances, providerOptions.length, regionOptions.length]
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

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="space-y-1">
          <h2 className="text-2xl font-bold tracking-tight">{t("cloud.instances.title")}</h2>
          <p className="text-sm text-muted-foreground">{t("cloud.instances.description")}</p>
        </div>
        <Button type="button" variant="outline" onClick={() => fetchInstances(true)} disabled={refreshing}>
          {refreshing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
          {t("cloud.instances.refreshButton")}
        </Button>
      </div>

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
        onProviderFilterChange={setProviderFilter}
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
