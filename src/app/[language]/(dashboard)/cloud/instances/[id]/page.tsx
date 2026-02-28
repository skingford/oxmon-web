"use client"

import Link from "next/link"
import { useCallback, useEffect, useMemo, useState } from "react"
import { useParams } from "next/navigation"
import { ArrowLeft, Loader2, RefreshCw } from "lucide-react"
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
import { toast, toastApiError, toastCopied } from "@/lib/toast"
import { ApiRequestError, api } from "@/lib/api"
import { copyApiCurlCommand } from "@/lib/api-curl"
import { withLocalePrefix } from "@/components/app-locale"
import {
  getCloudInstanceStatusBadgeVariant,
  resolveCloudInstanceStatus,
  type CloudInstanceStatusKey,
} from "@/components/pages/cloud/cloud-instance-list-utils"
import { useAppTranslations } from "@/hooks/use-app-translations"
import { useRequestState } from "@/hooks/use-request-state"
import type { CloudInstanceDetailResponse, MetricLatestValue } from "@/types/api"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { CopyCurlDropdown } from "@/components/ui/copy-curl-dropdown"
import { HttpMethodBadge } from "@/components/ui/http-method-badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"

const INSTANCE_METRIC_OPTIONS = [
  "cloud.cpu.usage",
  "cloud.memory.usage",
  "cloud.disk.usage",
  "cloud.network.in_bytes",
  "cloud.network.out_bytes",
  "cloud.disk.iops_read",
  "cloud.disk.iops_write",
  "cloud.connections",
] as const

const HISTORY_RANGE_OPTIONS = ["1h", "6h", "24h", "7d"] as const

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

function formatChartTime(value: string, locale: "zh" | "en") {
  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return value
  }

  return date.toLocaleString(locale === "zh" ? "zh-CN" : "en-US", {
    hour12: false,
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  })
}

function formatRelativeTime(value: string | null | undefined, locale: "zh" | "en") {
  if (!value) {
    return "-"
  }

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return "-"
  }

  const diffMs = Date.now() - date.getTime()
  const absMs = Math.abs(diffMs)
  const isPast = diffMs >= 0

  const minute = 60 * 1000
  const hour = 60 * minute
  const day = 24 * hour

  const makeText = (count: number, unit: "minute" | "hour" | "day") => {
    if (locale === "zh") {
      const unitText = unit === "minute" ? "分钟" : unit === "hour" ? "小时" : "天"
      return isPast ? `${count} ${unitText}前` : `${count} ${unitText}后`
    }

    const unitText = unit === "minute" ? "minute" : unit === "hour" ? "hour" : "day"
    const plural = count === 1 ? unitText : `${unitText}s`
    return isPast ? `${count} ${plural} ago` : `in ${count} ${plural}`
  }

  if (absMs < minute) {
    return locale === "zh" ? "刚刚" : "just now"
  }

  if (absMs < hour) {
    return makeText(Math.floor(absMs / minute), "minute")
  }

  if (absMs < day) {
    return makeText(Math.floor(absMs / hour), "hour")
  }

  return makeText(Math.floor(absMs / day), "day")
}

function formatNumber(value: number | null | undefined, digits = 2) {
  if (typeof value !== "number" || Number.isNaN(value)) {
    return "-"
  }

  return value.toLocaleString(undefined, {
    maximumFractionDigits: digits,
    minimumFractionDigits: 0,
  })
}

function formatBytesPerSecond(value: number) {
  const units = ["B/s", "KB/s", "MB/s", "GB/s", "TB/s"] as const
  let nextValue = value
  let unitIndex = 0

  while (Math.abs(nextValue) >= 1024 && unitIndex < units.length - 1) {
    nextValue /= 1024
    unitIndex += 1
  }

  const digits = Math.abs(nextValue) >= 100 ? 0 : Math.abs(nextValue) >= 10 ? 1 : 2
  return `${formatNumber(nextValue, digits)} ${units[unitIndex]}`
}

function formatMetricValue(metric: MetricLatestValue | null | undefined, metricKey: string) {
  if (!metric) {
    return "-"
  }

  if (/(network_(in|out)_bytes|network\.(in_bytes|out_bytes))/.test(metricKey)) {
    return formatBytesPerSecond(metric.value)
  }

  const value = formatNumber(metric.value, 2)

  if (/usage/.test(metricKey)) {
    return `${value}%`
  }

  if (/(disk_iops_|disk\.iops_)/.test(metricKey)) {
    return `${value} IOPS`
  }

  if (metricKey === "connections" || metricKey === "cloud.connections") {
    return `${value}`
  }

  return value
}

function resolveHistoryRangeStart(range: (typeof HISTORY_RANGE_OPTIONS)[number]) {
  const now = Date.now()

  if (range === "1h") {
    return new Date(now - 60 * 60 * 1000).toISOString()
  }

  if (range === "6h") {
    return new Date(now - 6 * 60 * 60 * 1000).toISOString()
  }

  if (range === "24h") {
    return new Date(now - 24 * 60 * 60 * 1000).toISOString()
  }

  return new Date(now - 7 * 24 * 60 * 60 * 1000).toISOString()
}

function normalizeHistoryPoints(
  value: unknown,
  locale: "zh" | "en"
) {
  if (!Array.isArray(value)) {
    return []
  }

  return value
    .map((item) => {
      if (!item || typeof item !== "object") {
        return null
      }

      const point = item as { timestamp?: unknown; collected_at?: unknown; value?: unknown }
      const timestamp = typeof point.timestamp === "string"
        ? point.timestamp
        : typeof point.collected_at === "string"
          ? point.collected_at
          : ""
      const numericValue = Number(point.value)

      if (!timestamp || !Number.isFinite(numericValue)) {
        return null
      }

      return {
        timestamp,
        time: formatChartTime(timestamp, locale),
        value: numericValue,
      }
    })
    .filter((item): item is { timestamp: string; time: string; value: number } => Boolean(item))
    .sort((left, right) => new Date(left.timestamp).getTime() - new Date(right.timestamp).getTime())
}

function getMetricValueClass(metric: MetricLatestValue | null | undefined, metricKey: string) {
  if (!metric) {
    return "text-muted-foreground"
  }

  if (!/^(cpu_usage|memory_usage|disk_usage)$/.test(metricKey)) {
    return "text-foreground"
  }

  const value = metric.value

  if (!Number.isFinite(value)) {
    return "text-muted-foreground"
  }

  if (value > 90) {
    return "text-red-600"
  }

  if (value > 80) {
    return "text-amber-600"
  }

  return "text-emerald-600"
}

function getUsagePercent(metric: MetricLatestValue | null | undefined, metricKey: string) {
  if (!metric || !/^(cpu_usage|memory_usage|disk_usage)$/.test(metricKey)) {
    return null
  }

  if (!Number.isFinite(metric.value)) {
    return null
  }

  return Math.max(0, Math.min(100, metric.value))
}

function getUsageBarClass(percent: number) {
  if (percent > 90) {
    return "bg-red-500"
  }

  if (percent > 80) {
    return "bg-amber-500"
  }

  return "bg-emerald-500"
}

function getStatusLabel(status: CloudInstanceStatusKey, t: ReturnType<typeof useAppTranslations>["t"]) {
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

function resolveInstanceTitle(instance: CloudInstanceDetailResponse | null) {
  if (!instance) {
    return "-"
  }

  return instance.instance_name?.trim() || instance.instance_id
}

function FieldItem({
  label,
  value,
  mono = false,
  hint,
}: {
  label: string
  value: string
  mono?: boolean
  hint?: string
}) {
  return (
    <div className="space-y-1">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={mono ? "font-mono text-sm" : "text-sm"}>{value || "-"}</p>
      {hint && hint !== "-" ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  )
}

export default function CloudInstanceDetailPage() {
  const params = useParams<{ id: string }>()
  const instanceId = Array.isArray(params?.id) ? params.id[0] : params?.id || ""
  const { t, locale } = useAppTranslations("pages")
  const [autoRefreshEnabled, setAutoRefreshEnabled] = useState(false)
  const [lastRefreshAt, setLastRefreshAt] = useState<string | null>(null)
  const [historyMetric, setHistoryMetric] = useState<(typeof INSTANCE_METRIC_OPTIONS)[number]>("cloud.cpu.usage")
  const [historyRange, setHistoryRange] = useState<(typeof HISTORY_RANGE_OPTIONS)[number]>("24h")
  const {
    data: instance,
    loading,
    refreshing,
    error,
    execute,
  } = useRequestState<CloudInstanceDetailResponse | null>(null)
  const {
    data: historyPoints,
    loading: historyLoading,
    error: historyError,
    execute: executeHistoryRequest,
  } = useRequestState<Array<{ timestamp: string; time: string; value: number }>>([], { initialLoading: false })

  const fetchDetail = useCallback(async (silent = false) => {
    if (!instanceId) {
      return
    }

    await execute(
      () => api.getCloudInstanceDetail(instanceId),
      {
        silent,
        onSuccess: () => {
          setLastRefreshAt(new Date().toISOString())
        },
        onError: (requestError) => {
          if (requestError instanceof ApiRequestError && requestError.status === 404) {
            return
          }

          toastApiError(requestError, t("cloud.instances.detailToastFetchError"))
        },
      }
    )
  }, [execute, instanceId, t])

  useEffect(() => {
    fetchDetail()
  }, [fetchDetail])

  useEffect(() => {
    if (!autoRefreshEnabled || !instanceId) {
      return
    }

    const timer = window.setInterval(() => {
      void fetchDetail(true)
    }, 15_000)

    return () => {
      window.clearInterval(timer)
    }
  }, [autoRefreshEnabled, fetchDetail, instanceId])

  const fetchHistory = useCallback(async () => {
    if (!instanceId) {
      return
    }

    await executeHistoryRequest(async () => {
      const payload = await api.getCloudInstanceMetrics(instanceId, {
        from: resolveHistoryRangeStart(historyRange),
        to: new Date().toISOString(),
        metrics: historyMetric,
      })

      return normalizeHistoryPoints(payload.series?.[historyMetric], locale)
    })
  }, [executeHistoryRequest, historyMetric, historyRange, instanceId, locale])

  useEffect(() => {
    fetchHistory()
  }, [fetchHistory])

  const metricCards = useMemo(() => {
    if (!instance) {
      return []
    }

    return [
      { key: "cpu_usage", label: t("cloud.instances.detailMetricCpuUsage"), metric: instance.cpu_usage },
      { key: "memory_usage", label: t("cloud.instances.detailMetricMemoryUsage"), metric: instance.memory_usage },
      { key: "disk_usage", label: t("cloud.instances.detailMetricDiskUsage"), metric: instance.disk_usage },
      { key: "network_in_bytes", label: t("cloud.instances.detailMetricNetworkIn"), metric: instance.network_in_bytes },
      { key: "network_out_bytes", label: t("cloud.instances.detailMetricNetworkOut"), metric: instance.network_out_bytes },
      { key: "disk_iops_read", label: t("cloud.instances.detailMetricDiskIopsRead"), metric: instance.disk_iops_read },
      { key: "disk_iops_write", label: t("cloud.instances.detailMetricDiskIopsWrite"), metric: instance.disk_iops_write },
      { key: "connections", label: t("cloud.instances.detailMetricConnections"), metric: instance.connections },
    ]
  }, [instance, t])

  const historyMetricOptions = useMemo(
    () =>
      INSTANCE_METRIC_OPTIONS.map((metric) => ({
        value: metric,
        label: t(`cloud.instances.chartMetricLabel_${metric.replace(/\./g, "_")}`),
      })),
    [t]
  )

  const handleCopyApiCurl = useCallback(async (insecure = false) => {
    try {
      await copyApiCurlCommand({
        path: `/v1/cloud/instances/${instanceId}`,
        insecure,
      })
      toastCopied(t("cloud.instances.detailToastCopyApiCurlSuccess"))
    } catch {
      toast.error(t("cloud.instances.detailToastCopyApiCurlError"))
    }
  }, [instanceId, t])

  if (loading && !instance) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between gap-3">
          <Button asChild type="button" variant="outline">
            <Link href={withLocalePrefix("/cloud/instances", locale)}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              {t("cloud.instances.detailBack")}
            </Link>
          </Button>
        </div>
        <Card>
          <CardContent className="flex h-40 items-center justify-center text-muted-foreground">
            <div className="text-center">
              <Loader2 className="mx-auto mb-2 h-5 w-5 animate-spin" />
              {t("cloud.instances.detailLoading")}
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!instance) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between gap-3">
          <Button asChild type="button" variant="outline">
            <Link href={withLocalePrefix("/cloud/instances", locale)}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              {t("cloud.instances.detailBack")}
            </Link>
          </Button>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>{t("cloud.instances.detailNotFoundTitle")}</CardTitle>
            <CardDescription>
              {t("cloud.instances.detailNotFoundDescription", { id: instanceId || "-" })}
            </CardDescription>
          </CardHeader>
          {error ? (
            <CardContent>
              <p className="text-xs text-muted-foreground">{error}</p>
            </CardContent>
          ) : null}
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Button asChild type="button" variant="outline" size="sm">
              <Link href={withLocalePrefix("/cloud/instances", locale)}>
                <ArrowLeft className="mr-1 h-4 w-4" />
                {t("cloud.instances.detailBack")}
              </Link>
            </Button>
          </div>
          <h2 className="text-2xl font-bold tracking-tight">{resolveInstanceTitle(instance)}</h2>
          <p className="text-sm text-muted-foreground">{t("cloud.instances.detailDescription")}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="mr-1 flex items-center gap-2 rounded-md border px-2 py-1">
            <span
              className={`inline-block h-2 w-2 rounded-full ${
                autoRefreshEnabled ? "bg-emerald-500 animate-pulse" : "bg-muted-foreground/40"
              }`}
              aria-hidden="true"
            />
            <Switch
              checked={autoRefreshEnabled}
              onCheckedChange={setAutoRefreshEnabled}
              aria-label={t("cloud.instances.detailAutoRefresh")}
            />
            <span className="text-xs text-muted-foreground">
              {autoRefreshEnabled
                ? t("cloud.instances.detailAutoRefreshEnabled")
                : t("cloud.instances.detailAutoRefresh")}
            </span>
          </div>
          <div className="mr-1 rounded-md border px-2 py-1 text-xs text-muted-foreground">
            {t("cloud.instances.detailLastRefreshLabel")}: {formatDateTime(lastRefreshAt, locale)}
          </div>
          <CopyCurlDropdown
            texts={{
              title: t("cloud.instances.detailCopyApiCurl"),
              normal: t("cloud.instances.detailCopyApiCurlNormal"),
              insecure: t("cloud.instances.detailCopyApiCurlInsecure"),
            }}
            onCopy={handleCopyApiCurl}
            triggerLabel={t("cloud.instances.detailCopyApiCurl")}
            preferenceKeyId="cloud-instance-detail-copy-curl"
            triggerSuffix={<HttpMethodBadge method="GET" className="ml-1" />}
            tooltip={t("cloud.instances.detailCopyApiCurlHint")}
            insecureBadgeLabel={t("cloud.instances.detailCopyApiCurlInsecureBadge")}
          />
          <Button
            type="button"
            variant="outline"
            onClick={async () => {
              await Promise.all([fetchDetail(true), fetchHistory()])
            }}
            disabled={refreshing || historyLoading}
          >
            {refreshing || historyLoading
              ? <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              : <RefreshCw className="mr-2 h-4 w-4" />}
            {t("cloud.instances.detailRefreshButton")}
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t("cloud.instances.detailSectionBasic")}</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <FieldItem label={t("cloud.instances.detailFieldId")} value={instance.id} mono />
          <FieldItem label={t("cloud.instances.detailFieldInstanceId")} value={instance.instance_id} mono />
          <FieldItem label={t("cloud.instances.detailFieldName")} value={instance.instance_name || "-"} />
          <FieldItem label={t("cloud.instances.detailFieldProvider")} value={instance.provider} />
          <FieldItem label={t("cloud.instances.detailFieldAccount")} value={instance.account_config_key} mono />
          <FieldItem label={t("cloud.instances.detailFieldRegion")} value={instance.region} />
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">{t("cloud.instances.detailFieldStatus")}</p>
            <Badge variant={getCloudInstanceStatusBadgeVariant(resolveCloudInstanceStatus(instance))}>
              {getStatusLabel(resolveCloudInstanceStatus(instance), t)}
            </Badge>
          </div>
          <FieldItem label={t("cloud.instances.detailFieldOs")} value={instance.os || "-"} />
          <FieldItem label={t("cloud.instances.detailFieldPublicIp")} value={instance.public_ip || "-"} mono />
          <FieldItem label={t("cloud.instances.detailFieldPrivateIp")} value={instance.private_ip || "-"} mono />
          <FieldItem
            label={t("cloud.instances.detailFieldLastSeen")}
            value={formatDateTime(instance.last_seen_at, locale)}
            hint={formatRelativeTime(instance.last_seen_at, locale)}
          />
          <FieldItem
            label={t("cloud.instances.detailFieldLastCollected")}
            value={formatDateTime(instance.last_collected_at, locale)}
            hint={formatRelativeTime(instance.last_collected_at, locale)}
          />
          <FieldItem label={t("cloud.instances.detailFieldCreatedAt")} value={formatDateTime(instance.created_at, locale)} />
          <FieldItem label={t("cloud.instances.detailFieldUpdatedAt")} value={formatDateTime(instance.updated_at, locale)} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("cloud.instances.detailSectionSpecs")}</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <FieldItem label={t("cloud.instances.detailFieldInstanceType")} value={instance.instance_type || "-"} />
          <FieldItem label={t("cloud.instances.detailFieldCpuCores")} value={formatNumber(instance.cpu_cores, 0)} />
          <FieldItem label={t("cloud.instances.detailFieldMemoryGb")} value={formatNumber(instance.memory_gb)} />
          <FieldItem label={t("cloud.instances.detailFieldDiskGb")} value={formatNumber(instance.disk_gb)} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("cloud.instances.detailSectionMetrics")}</CardTitle>
          <CardDescription>{t("cloud.instances.detailFieldLastCollected")}: {formatDateTime(instance.last_collected_at, locale)}</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {metricCards.map((item) => (
            <div key={item.key} className="rounded-lg border p-3">
              {(() => {
                const usagePercent = getUsagePercent(item.metric, item.key)

                return (
                  <>
              <p className="text-xs text-muted-foreground">{item.label}</p>
                    <p className={`mt-1 text-lg font-semibold ${getMetricValueClass(item.metric, item.key)}`}>
                      {item.metric ? formatMetricValue(item.metric, item.key) : t("cloud.instances.detailMetricNoData")}
                    </p>
                    {usagePercent !== null ? (
                      <div className="mt-2">
                        <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                          <div
                            className={`h-full rounded-full transition-all ${getUsageBarClass(usagePercent)}`}
                            style={{ width: `${usagePercent}%` }}
                            aria-hidden="true"
                          />
                        </div>
                      </div>
                    ) : null}
                    <p className="mt-1 text-xs text-muted-foreground">
                      {item.metric
                        ? t("cloud.instances.detailMetricCollectedAt", {
                          time: formatDateTime(item.metric.collected_at, locale),
                        })
                        : "-"}
                    </p>
                    {item.metric ? (
                      <p className="text-xs text-muted-foreground">
                        {formatRelativeTime(item.metric.collected_at, locale)}
                      </p>
                    ) : null}
                  </>
                )
              })()}
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="gap-3 md:flex-row md:items-center md:justify-between">
          <div className="space-y-1">
            <CardTitle>{t("cloud.instances.detailHistoryTitle")}</CardTitle>
            <CardDescription>{t("cloud.instances.detailHistoryDescription")}</CardDescription>
          </div>
          <div className="grid w-full gap-2 sm:grid-cols-2 md:w-auto">
            <Select value={historyMetric} onValueChange={(value) => {
              setHistoryMetric(value as (typeof INSTANCE_METRIC_OPTIONS)[number])
            }}>
              <SelectTrigger className="w-full md:w-[220px]">
                <SelectValue placeholder={t("cloud.instances.detailHistoryMetricPlaceholder")} />
              </SelectTrigger>
              <SelectContent>
                {historyMetricOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={historyRange} onValueChange={(value) => {
              setHistoryRange(value as (typeof HISTORY_RANGE_OPTIONS)[number])
            }}>
              <SelectTrigger className="w-full md:w-[160px]">
                <SelectValue placeholder={t("cloud.instances.detailHistoryRangePlaceholder")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1h">{t("cloud.instances.detailHistoryRange_1h")}</SelectItem>
                <SelectItem value="6h">{t("cloud.instances.detailHistoryRange_6h")}</SelectItem>
                <SelectItem value="24h">{t("cloud.instances.detailHistoryRange_24h")}</SelectItem>
                <SelectItem value="7d">{t("cloud.instances.detailHistoryRange_7d")}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {historyLoading ? (
            <div className="flex h-72 items-center justify-center text-sm text-muted-foreground">
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {t("cloud.instances.detailHistoryLoading")}
            </div>
          ) : historyError ? (
            <div className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
              {historyError || t("cloud.instances.detailHistoryError")}
            </div>
          ) : historyPoints.length === 0 ? (
            <div className="flex h-72 items-center justify-center text-sm text-muted-foreground">
              {t("cloud.instances.detailHistoryEmpty")}
            </div>
          ) : (
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={historyPoints} margin={{ top: 10, right: 18, bottom: 8, left: 8 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="time" tick={{ fontSize: 12 }} minTickGap={24} />
                  <YAxis
                    tick={{ fontSize: 12 }}
                    width={94}
                    tickFormatter={(value) => formatMetricValue(
                      {
                        metric_name: historyMetric,
                        value: Number(value),
                        collected_at: "",
                      },
                      historyMetric
                    )}
                  />
                  <Tooltip
                    formatter={(value: number) => formatMetricValue(
                      {
                        metric_name: historyMetric,
                        value,
                        collected_at: "",
                      },
                      historyMetric
                    )}
                    labelFormatter={(label, payload) => payload?.[0]?.payload?.timestamp || String(label)}
                  />
                  <Line
                    type="monotone"
                    dataKey="value"
                    stroke="var(--primary)"
                    strokeWidth={2}
                    dot={false}
                    isAnimationActive={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
