"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { Loader2, RefreshCw } from "lucide-react"
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ReferenceArea,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
import {
  uniqueSortedWithLocale,
} from "@/components/pages/cloud/cloud-instance-list-utils"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useAppTranslations } from "@/hooks/use-app-translations"
import { useRequestState } from "@/hooks/use-request-state"
import { api } from "@/lib/api"
import { toastApiError } from "@/lib/toast"
import type { CloudInstanceResponse, CloudInstancesChartResponse, DictionaryItem } from "@/types/api"

type CloudInstanceStatusDictionaryOption = {
  value: string
  label: string
  sortOrder: number
}

type RankingMetricId = "cpu" | "memory" | "disk"

type RankingMetricConfig = {
  id: RankingMetricId
  metric: string
  labelKey: string
}

type RankingSortOrder = "desc" | "asc"

type RankingRow = {
  id: string
  label: string
  value: number
  provider: string
  region: string
  level: UtilizationLevel
}

type UtilizationLevel = "normal" | "attention" | "alert" | "critical"

const EMPTY_CHART_DATA: CloudInstancesChartResponse = {
  labels: [],
  instances: [],
  series: {},
}

const CHART_LIMIT = 30
const CLOUD_INSTANCE_STATUS_DICT_TYPE = "cloud_instance_status"

const RANKING_METRICS: RankingMetricConfig[] = [
  { id: "memory", metric: "cloud.memory.usage", labelKey: "cloud.instances.chartMetricLabel_cloud_memory_usage" },
  { id: "disk", metric: "cloud.disk.usage", labelKey: "cloud.instances.chartMetricLabel_cloud_disk_usage" },
  { id: "cpu", metric: "cloud.cpu.usage", labelKey: "cloud.instances.chartMetricLabel_cloud_cpu_usage" },
]

function normalizeStatusFilterValue(value: string | null | undefined) {
  return (value || "").trim().toLowerCase()
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

function formatPercentValue(value: number | null | undefined) {
  if (typeof value !== "number" || Number.isNaN(value)) {
    return "-"
  }

  return `${value.toFixed(2)}%`
}

function getUtilizationLevel(value: number): UtilizationLevel {
  if (value > 85) {
    return "critical"
  }

  if (value > 80) {
    return "alert"
  }

  if (value < 60) {
    return "normal"
  }

  return "attention"
}

function getBarColorByLevel(level: UtilizationLevel) {
  if (level === "normal") {
    return "#22c55e"
  }

  if (level === "attention") {
    return "#3b82f6"
  }

  if (level === "alert") {
    return "#f59e0b"
  }

  return "#ef4444"
}

function buildRankingRows(chartData: CloudInstancesChartResponse, metricKey: string) {
  const values = Array.isArray(chartData.series?.[metricKey]) ? chartData.series?.[metricKey] : []

  return chartData.labels
    .map((label, index) => {
      const value = values[index]
      const instance = chartData.instances[index]

      if (typeof value !== "number" || Number.isNaN(value)) {
        return null
      }

      return {
        id: instance?.id || String(index),
        label: label || instance?.instance_name || instance?.instance_id || "-",
        value,
        provider: instance?.provider || "-",
        region: instance?.region || "-",
        level: getUtilizationLevel(value),
      }
    })
    .filter((item): item is RankingRow => Boolean(item))
}

function sortRankingRows(rows: RankingRow[], order: RankingSortOrder) {
  const sorted = [...rows].sort((left, right) => {
    if (order === "asc") {
      return left.value - right.value
    }

    return right.value - left.value
  })

  return sorted.slice(0, CHART_LIMIT)
}

function MetricRankingCard({
  title,
  rows,
  loading,
  emptyText,
  legendItems,
  getLevelLabel,
}: {
  title: string
  rows: RankingRow[]
  loading: boolean
  emptyText: string
  legendItems: Array<{ key: UtilizationLevel; label: string }>
  getLevelLabel: (level: UtilizationLevel) => string
}) {
  const chartHeight = Math.max(260, rows.length * 34)

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">{title}</CardTitle>
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
          {legendItems.map((item) => (
            <span key={item.key} className="inline-flex items-center gap-1.5">
              <span
                className="inline-block h-2.5 w-2.5 rounded-full"
                style={{ backgroundColor: getBarColorByLevel(item.key) }}
                aria-hidden="true"
              />
              {item.label}
            </span>
          ))}
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex h-72 items-center justify-center text-sm text-muted-foreground">
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          </div>
        ) : rows.length === 0 ? (
          <div className="flex h-72 items-center justify-center text-sm text-muted-foreground">{emptyText}</div>
        ) : (
          <div className="max-h-[560px] overflow-y-auto rounded-md border px-2 py-2">
            <div style={{ height: chartHeight }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={rows} layout="vertical" margin={{ top: 8, right: 12, bottom: 8, left: 12 }}>
                  <ReferenceArea x1={0} x2={60} fill="#22c55e" fillOpacity={0.08} />
                  <ReferenceArea x1={60} x2={80} fill="#3b82f6" fillOpacity={0.08} />
                  <ReferenceArea x1={80} x2={85} fill="#f59e0b" fillOpacity={0.1} />
                  <ReferenceArea x1={85} x2={100} fill="#ef4444" fillOpacity={0.1} />
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                  <XAxis type="number" tickFormatter={(value) => `${Number(value).toFixed(0)}%`} tick={{ fontSize: 12 }} />
                  <YAxis
                    dataKey="label"
                    type="category"
                    width={170}
                    tick={{ fontSize: 12 }}
                    tickFormatter={(value: string) => value.length > 22 ? `${value.slice(0, 22)}...` : value}
                  />
                  <Tooltip
                    formatter={(value: number) => formatPercentValue(value)}
                    labelFormatter={(label, payload) => {
                      const row = payload?.[0]?.payload as RankingRow | undefined
                      if (!row) {
                        return String(label)
                      }

                      return `${row.label} · ${row.provider}/${row.region} · ${getLevelLabel(row.level)}`
                    }}
                  />
                  <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                    {rows.map((row) => (
                      <Cell key={row.id} fill={getBarColorByLevel(row.level)} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export default function CloudInstancesRankingPage() {
  const { t, locale } = useAppTranslations("pages")
  const [providerFilter, setProviderFilter] = useState("all")
  const [regionFilter, setRegionFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState("all")
  const [sortOrder, setSortOrder] = useState<RankingSortOrder>("desc")
  const [allInstancesSnapshot, setAllInstancesSnapshot] = useState<CloudInstanceResponse[] | null>(null)
  const [statusDictionaryOptions, setStatusDictionaryOptions] = useState<CloudInstanceStatusDictionaryOption[]>([])
  const {
    data: rankingData,
    loading,
    refreshing,
    execute,
  } = useRequestState<Record<RankingMetricId, CloudInstancesChartResponse>>(
    {
      cpu: EMPTY_CHART_DATA,
      memory: EMPTY_CHART_DATA,
      disk: EMPTY_CHART_DATA,
    },
    { initialLoading: true }
  )

  useEffect(() => {
    let cancelled = false

    api.listCloudInstances()
      .then((rows) => {
        if (!cancelled) {
          setAllInstancesSnapshot(rows)
        }
      })
      .catch(() => {
        if (!cancelled) {
          setAllInstancesSnapshot([])
        }
      })

    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    let cancelled = false

    api.listDictionariesByType(CLOUD_INSTANCE_STATUS_DICT_TYPE)
      .then((items) => {
        if (!cancelled) {
          setStatusDictionaryOptions(normalizeStatusDictionaryItems(items))
        }
      })
      .catch(() => {
        if (!cancelled) {
          setStatusDictionaryOptions([])
        }
      })

    return () => {
      cancelled = true
    }
  }, [])

  const fetchRankings = useCallback(async (silent = false) => {
    await execute(
      async () => {
        const results = await Promise.all(
          RANKING_METRICS.map(async (item) => {
            const payload = await api.getCloudInstancesChart({
              provider: providerFilter !== "all" ? providerFilter : undefined,
              region: regionFilter !== "all" ? regionFilter : undefined,
              status: statusFilter !== "all" ? statusFilter : undefined,
              metrics: item.metric,
            })

            return [item.id, payload] as const
          })
        )

        return {
          cpu: results.find(([id]) => id === "cpu")?.[1] || EMPTY_CHART_DATA,
          memory: results.find(([id]) => id === "memory")?.[1] || EMPTY_CHART_DATA,
          disk: results.find(([id]) => id === "disk")?.[1] || EMPTY_CHART_DATA,
        }
      },
      {
        silent,
        onError: (error) => {
          toastApiError(error, t("cloud.instancesRanking.toastFetchError"))
        },
      }
    )
  }, [execute, providerFilter, regionFilter, statusFilter, t])

  useEffect(() => {
    fetchRankings()
  }, [fetchRankings])

  const optionSourceInstances = allInstancesSnapshot || []

  const providerOptions = useMemo(
    () => uniqueSortedWithLocale(optionSourceInstances.map((item) => item.provider), locale),
    [locale, optionSourceInstances]
  )

  const regionOptions = useMemo(
    () => uniqueSortedWithLocale(optionSourceInstances.map((item) => item.region), locale),
    [locale, optionSourceInstances]
  )

  const statusOptions = useMemo(
    () => statusDictionaryOptions.map((item) => item.value),
    [statusDictionaryOptions]
  )

  const statusDictionaryLabelMap = useMemo(
    () => new Map(statusDictionaryOptions.map((item) => [item.value, item.label])),
    [statusDictionaryOptions]
  )

  const resolveStatusFilterLabel = useCallback((status: string) => {
    const normalizedStatus = normalizeStatusFilterValue(status)
    return statusDictionaryLabelMap.get(normalizedStatus) || status
  }, [statusDictionaryLabelMap])

  const rowsByMetric = useMemo(
    () => ({
      cpu: sortRankingRows(buildRankingRows(rankingData.cpu, "cloud.cpu.usage"), sortOrder),
      memory: sortRankingRows(buildRankingRows(rankingData.memory, "cloud.memory.usage"), sortOrder),
      disk: sortRankingRows(buildRankingRows(rankingData.disk, "cloud.disk.usage"), sortOrder),
    }),
    [rankingData.cpu, rankingData.disk, rankingData.memory, sortOrder]
  )

  const handleResetFilters = useCallback(() => {
    setProviderFilter("all")
    setRegionFilter("all")
    setStatusFilter("all")
  }, [])

  const getLevelLabel = useCallback((level: UtilizationLevel) => {
    if (level === "normal") {
      return t("cloud.instancesRanking.legendNormal")
    }
    if (level === "attention") {
      return t("cloud.instancesRanking.legendAttention")
    }
    if (level === "alert") {
      return t("cloud.instancesRanking.legendAlert")
    }
    return t("cloud.instancesRanking.legendCritical")
  }, [t])

  const legendItems = useMemo(
    () => (["normal", "attention", "alert", "critical"] as UtilizationLevel[]).map((level) => ({
      key: level,
      label: getLevelLabel(level),
    })),
    [getLevelLabel]
  )

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="space-y-1">
          <h2 className="text-2xl font-bold tracking-tight">{t("cloud.instancesRanking.title")}</h2>
          <p className="text-sm text-muted-foreground">{t("cloud.instancesRanking.description")}</p>
        </div>
        <Button type="button" variant="outline" onClick={() => fetchRankings(true)} disabled={refreshing}>
          {refreshing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
          {t("cloud.instancesRanking.refreshButton")}
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t("cloud.instancesRanking.filtersTitle")}</CardTitle>
          <CardDescription>{t("cloud.instancesRanking.filtersDescription")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label>{t("cloud.instances.filterProvider")}</Label>
              <Select value={providerFilter} onValueChange={setProviderFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("cloud.instances.filterProviderAll")}</SelectItem>
                  {providerOptions.map((provider) => (
                    <SelectItem key={provider} value={provider}>{provider}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>{t("cloud.instances.filterRegion")}</Label>
              <Select value={regionFilter} onValueChange={setRegionFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("cloud.instances.filterRegionAll")}</SelectItem>
                  {regionOptions.map((region) => (
                    <SelectItem key={region} value={region}>{region}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>{t("cloud.instances.filterStatus")}</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("cloud.instances.filterStatusAll")}</SelectItem>
                  {statusOptions.map((status) => (
                    <SelectItem key={status} value={status}>{resolveStatusFilterLabel(status)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-4">
            <div className="space-y-2 md:col-span-2">
              <Label>{t("cloud.instancesRanking.sortLabel")}</Label>
              <Select value={sortOrder} onValueChange={(value) => setSortOrder(value as RankingSortOrder)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="desc">{t("cloud.instancesRanking.sortOptionDesc")}</SelectItem>
                  <SelectItem value="asc">{t("cloud.instancesRanking.sortOptionAsc")}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-end md:col-span-1 md:col-start-4">
              <Button type="button" variant="outline" className="w-full" onClick={handleResetFilters}>
                {t("cloud.instancesRanking.resetFiltersButton")}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-4">
        {RANKING_METRICS.map((item) => (
          <MetricRankingCard
            key={item.id}
            title={t(item.labelKey)}
            rows={rowsByMetric[item.id]}
            loading={loading}
            emptyText={t("cloud.instancesRanking.chartEmpty")}
            legendItems={legendItems}
            getLevelLabel={getLevelLabel}
          />
        ))}
      </div>
    </div>
  )
}
