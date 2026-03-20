"use client"

import { Fragment, useCallback, useEffect, useMemo, useRef, useState } from "react"
import Link from "next/link"
import { useParams, usePathname, useRouter, useSearchParams } from "next/navigation"
import { ApiRequestError, api } from "@/lib/api"
import { buildTranslatedPaginationTextBundle } from "@/lib/pagination-summary"
import { copyApiCurlCommand } from "@/lib/api-curl"
import { getInstanceContactChannels } from "@/lib/notifications/instance-contact-utils"
import { AgentDetail, AgentReportLogItem, InstanceContactItem, LatestMetric } from "@/types/api"
import { formatDateTimeByLocale } from "@/lib/date-time"
import { formatMetricValue } from "@/lib/metric-format"
import { useAppLocale } from "@/hooks/use-app-locale"
import { useAppTranslations } from "@/hooks/use-app-translations"
import { useRequestState } from "@/hooks/use-request-state"
import { useServerOffsetPagination } from "@/hooks/use-server-offset-pagination"
import { withLocalePrefix } from "@/components/app-locale"
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
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { PaginationControls } from "@/components/ui/pagination-controls"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { AlertCircle, ArrowLeft, Check, ChevronDown, Gauge, Loader2, Pencil, RefreshCw, Trash2, Users } from "lucide-react"
import { toast, toastApiError, toastCopied, toastDeleted, toastSaved } from "@/lib/toast"

const REPORT_LOGS_PAGE_SIZE_OPTIONS = [10, 20, 50] as const
const PAGINATION_LIMIT_QUERY_KEY = "limit"
const PAGINATION_OFFSET_QUERY_KEY = "offset"
const LEGACY_REPORT_LOGS_LIMIT_QUERY_KEY = "report_limit"
const LEGACY_REPORT_LOGS_OFFSET_QUERY_KEY = "report_offset"

type AgentReportLogsState = {
  items: AgentReportLogItem[]
  total: number
  limit: number
  offset: number
}

type ReportLogsCurlCopyMode = "current" | "first" | "agentOnly"

const REPORT_LOGS_CURL_PREF_KEY = "agent-detail:report-logs-curl-pref"
const REPORT_LOGS_CURL_LAST_COPIED_AT_KEY_PREFIX = "agent-detail:report-logs-curl-last-copied-at:"

function toFiniteNumber(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value
  }

  if (typeof value === "string") {
    const normalized = value.replace("%", "").trim()
    const parsed = Number(normalized)
    if (Number.isFinite(parsed)) {
      return parsed
    }
  }

  return undefined
}

function normalizeMetricName(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9]/g, "")
}

function getMetricValueByPriority(metrics: LatestMetric[], priorityNames: string[]) {
  if (metrics.length === 0) {
    return undefined
  }

  const normalized = metrics.map((metric) => ({
    metric,
    normalizedName: normalizeMetricName(metric.metric_name),
  }))

  for (const name of priorityNames) {
    const normalizedName = normalizeMetricName(name)
    const exactMatched = normalized.find((item) => item.normalizedName === normalizedName)

    if (exactMatched) {
      return toFiniteNumber(exactMatched.metric.value)
    }
  }

  for (const name of priorityNames) {
    const normalizedName = normalizeMetricName(name)
    const partialMatched = normalized.find((item) => item.normalizedName.includes(normalizedName))

    if (partialMatched) {
      return toFiniteNumber(partialMatched.metric.value)
    }
  }

  return undefined
}

function getMetricValueByNamePattern(metrics: LatestMetric[], patterns: RegExp[]) {
  for (const metric of metrics) {
    const normalizedName = normalizeMetricName(metric.metric_name)
    if (patterns.some((pattern) => pattern.test(normalizedName))) {
      const value = toFiniteNumber(metric.value)
      if (value !== undefined) {
        return value
      }
    }
  }

  return undefined
}

function findUsagePercentValue(metrics: LatestMetric[], type: "cpu" | "memory" | "disk") {
  const exactPriorityMap: Record<"cpu" | "memory" | "disk", string[]> = {
    cpu: [
      "cpu_usage_percent",
      "cpu_usage",
      "cpu_used_percent",
      "cpu.percent",
      "cpu_utilization",
      "cpu_util_percent",
      "system_cpu_usage",
      "node_cpu_usage",
    ],
    memory: [
      "memory_usage_percent",
      "memory_usage",
      "memory_used_percent",
      "memory.percent",
      "mem_usage_percent",
      "mem_usage",
      "system_memory_usage",
      "node_memory_usage",
    ],
    disk: [
      "disk_usage_percent",
      "disk_usage",
      "disk_used_percent",
      "disk.percent",
      "disk_util_percent",
      "filesystem_usage_percent",
      "fs_usage_percent",
      "node_filesystem_usage",
    ],
  }

  const exact = getMetricValueByPriority(metrics, exactPriorityMap[type])

  if (exact !== undefined) {
    return exact
  }

  const patternMap: Record<"cpu" | "memory" | "disk", RegExp[]> = {
    cpu: [
      /cpu.*(usage|util|percent|pct)/,
      /(usage|util|percent|pct).*cpu/,
    ],
    memory: [
      /(mem|memory).*(usage|util|percent|pct)/,
      /(usage|util|percent|pct).*(mem|memory)/,
    ],
    disk: [
      /(disk|filesystem|fs).*(usage|util|percent|pct)/,
      /(usage|util|percent|pct).*(disk|filesystem|fs)/,
    ],
  }

  const byPattern = getMetricValueByNamePattern(metrics, patternMap[type])
  if (byPattern !== undefined) {
    return byPattern
  }

  // 宽松兜底：兼容仅上报 `cpu` / `mem` / `memory` / `disk` 等简写指标名
  const loosePriorityMap: Record<"cpu" | "memory" | "disk", string[]> = {
    cpu: ["cpu", "system_cpu", "node_cpu"],
    memory: ["memory", "mem", "system_memory", "node_memory"],
    disk: ["disk", "filesystem", "fs", "system_disk", "node_disk"],
  }

  const loose = getMetricValueByPriority(metrics, loosePriorityMap[type])

  if (loose !== undefined) {
    return loose
  }

  const loosePatternMap: Record<"cpu" | "memory" | "disk", RegExp[]> = {
    cpu: [/cpu/],
    memory: [/(mem|memory)/],
    disk: [/(disk|filesystem|fs)/],
  }

  return getMetricValueByNamePattern(metrics, loosePatternMap[type])
}

function findLoadValue(metrics: LatestMetric[]) {
  const exact = getMetricValueByPriority(metrics, [
    "load1",
    "load_1m",
    "system_load1",
    "node_load1",
    "load_avg_1",
    "load.avg.1m",
  ])

  if (exact !== undefined) {
    return exact
  }

  const partialMatched = metrics.find((metric) => {
    const name = normalizeMetricName(metric.metric_name)
    return (name.includes("load") && name.includes("1")) || name === "load"
  })

  return toFiniteNumber(partialMatched?.value)
}

function toPercent(value?: number) {
  if (value === undefined || value === null || Number.isNaN(value)) {
    return undefined
  }

  if (value >= 0 && value <= 1) {
    return value * 100
  }

  return value
}

function resolveValueColor(value?: number, withThreshold = false) {
  if (value === undefined || value === null || Number.isNaN(value)) {
    return "text-muted-foreground"
  }

  if (!withThreshold) {
    return "text-foreground"
  }

  if (value > 90) {
    return "text-red-600"
  }

  if (value > 80) {
    return "text-amber-600"
  }

  return "text-foreground"
}

function formatPercent(value?: number) {
  const parsed = toFiniteNumber(value)

  if (parsed === undefined) {
    return "-"
  }

  return `${parsed.toFixed(1)}%`
}

function formatLoad(value?: number) {
  const parsed = toFiniteNumber(value)

  if (parsed === undefined) {
    return "-"
  }

  return parsed.toFixed(2)
}

function formatUpdatedAt(metrics: LatestMetric[], locale: "zh" | "en") {
  if (metrics.length === 0) {
    return "-"
  }

  const latest = metrics.reduce((max, current) =>
    new Date(current.timestamp).getTime() > new Date(max.timestamp).getTime() ? current : max
  )

  return formatDateTimeByLocale(latest.timestamp, locale)
}

function buildLatestMetricsFromPoints(points: LatestMetric[]) {
  if (points.length === 0) {
    return []
  }

  const latestByMetric = new Map<string, LatestMetric>()

  for (const point of points) {
    const key = point.metric_name
    const existing = latestByMetric.get(key)

    if (!existing) {
      latestByMetric.set(key, point)
      continue
    }

    const currentTime = new Date(point.timestamp).getTime()
    const existingTime = new Date(existing.timestamp).getTime()

    if (!Number.isNaN(currentTime) && (Number.isNaN(existingTime) || currentTime > existingTime)) {
      latestByMetric.set(key, point)
    }
  }

  return Array.from(latestByMetric.values()).sort((a, b) => {
    const timeA = new Date(a.timestamp).getTime()
    const timeB = new Date(b.timestamp).getTime()
    if (Number.isNaN(timeA) || Number.isNaN(timeB)) {
      return 0
    }
    return timeB - timeA
  })
}

function buildMetricItemKey(metric: LatestMetric, index: number) {
  const labelSignature = Object.entries(metric.labels || {})
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([key, value]) => `${key}:${value}`)
    .join("|")

  return `${metric.metric_name}-${metric.timestamp}-${labelSignature || "no-label"}-${index}`
}

function buildMetricNameLabelMap(items: Array<{ dict_key: string; dict_label: string }>) {
  const map: Record<string, string> = {}
  items.forEach((item) => {
    const key = item.dict_key?.trim()
    const label = item.dict_label?.trim()
    if (!key || !label) {
      return
    }
    map[key] = label
    map[normalizeMetricName(key)] = label
  })
  return map
}

function getMetricDisplayName(metricName: string, nameLabelMap: Record<string, string>) {
  const exact = nameLabelMap[metricName]
  if (exact) {
    return exact
  }

  const normalized = nameLabelMap[normalizeMetricName(metricName)]
  if (normalized) {
    return normalized
  }

  return metricName
}

function getAgentReportLogTimestamp(log: AgentReportLogItem) {
  const candidates = [
    log.reported_at,
    log.report_time,
    log.created_at,
    log.updated_at,
    log.timestamp,
  ]

  const matched = candidates.find((item) => typeof item === "string" && item.trim())
  return typeof matched === "string" ? matched : null
}

function parseFiniteValue(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value
  }

  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value.trim())
    if (Number.isFinite(parsed)) {
      return parsed
    }
  }

  return null
}

function getAgentReportLogStatus(log: AgentReportLogItem) {
  if (typeof log.status === "string" && log.status.trim()) {
    return log.status.trim()
  }

  const fallback = [log.level, log.result, log.state]
    .find((item) => typeof item === "string" && item.trim())
  return typeof fallback === "string" ? fallback.trim() : null
}

function getAgentReportLogHostname(log: AgentReportLogItem) {
  const matched = [
    log.hostname,
    log.host,
    log.node_name,
    log.agent_id,
  ].find((item) => typeof item === "string" && item.trim())

  return typeof matched === "string" ? matched.trim() : null
}

function getAgentReportLogSystem(log: AgentReportLogItem) {
  const osParts = [log.os, log.os_version]
    .filter((item) => typeof item === "string" && item.trim())
    .join(" ")
    .trim()
  const arch = typeof log.arch === "string" && log.arch.trim() ? log.arch.trim() : ""

  if (osParts && arch) {
    return `${osParts} / ${arch}`
  }

  if (osParts) {
    return osParts
  }

  if (arch) {
    return arch
  }

  return null
}

function getAgentReportLogResource(log: AgentReportLogItem) {
  const cpuCores = parseFiniteValue(log.cpu_cores)
  const memoryGb = parseFiniteValue(log.memory_gb)

  const cpuText = cpuCores !== null ? `${cpuCores}C` : ""
  const memoryText = memoryGb !== null ? `${memoryGb.toFixed(1)}GB` : ""
  const text = [cpuText, memoryText].filter(Boolean).join(" / ")

  return text || null
}

function getAgentReportLogMessage(log: AgentReportLogItem) {
  const fallback = [
    log.message,
    log.err_msg,
    log.error_message,
    log.error,
    log.detail,
  ].find((item) => typeof item === "string" && item.trim())

  if (typeof fallback === "string") {
    return fallback.trim()
  }

  const summaryParts: string[] = []
  if (typeof log.hostname === "string" && log.hostname.trim()) {
    summaryParts.push(log.hostname.trim())
  }

  const osPart = [log.os, log.os_version]
    .filter((item) => typeof item === "string" && item.trim())
    .join(" ")
  if (osPart) {
    summaryParts.push(osPart)
  }

  if (typeof log.arch === "string" && log.arch.trim()) {
    summaryParts.push(log.arch.trim())
  }

  const resourceSummary = getAgentReportLogResource(log) || ""
  if (resourceSummary) {
    summaryParts.push(resourceSummary)
  }

  if (summaryParts.length > 0) {
    return summaryParts.join(" · ")
  }

  const copy = { ...log }
  delete copy.id
  delete copy.agent_id
  delete copy.reported_at
  delete copy.report_time
  delete copy.created_at
  delete copy.updated_at
  delete copy.timestamp
  delete copy.hostname
  delete copy.os
  delete copy.os_version
  delete copy.arch
  delete copy.cpu_cores
  delete copy.memory_gb
  delete copy.status
  delete copy.level
  delete copy.result
  delete copy.state

  const text = JSON.stringify(copy)
  return text && text !== "{}" ? text : ""
}

function getAgentReportLogMetricCount(log: AgentReportLogItem) {
  const candidates = [log.metric_count, log.metrics_count, log.point_count, log.points_count]
  for (const value of candidates) {
    const parsed = parseFiniteValue(value)
    if (parsed !== null) {
      return parsed
    }
  }

  return null
}

function formatRelativeTimeFromNow(timestamp: string, locale: "zh" | "en", nowMs: number) {
  const targetMs = new Date(timestamp).getTime()
  if (!Number.isFinite(targetMs)) {
    return formatDateTimeByLocale(timestamp, locale)
  }

  const diffSeconds = Math.round((targetMs - nowMs) / 1000)
  const absSeconds = Math.abs(diffSeconds)
  const rtf = new Intl.RelativeTimeFormat(locale === "zh" ? "zh-CN" : "en-US", {
    numeric: "auto",
  })

  if (absSeconds < 60) {
    return rtf.format(diffSeconds, "second")
  }
  if (absSeconds < 3600) {
    return rtf.format(Math.round(diffSeconds / 60), "minute")
  }
  if (absSeconds < 86400) {
    return rtf.format(Math.round(diffSeconds / 3600), "hour")
  }
  return rtf.format(Math.round(diffSeconds / 86400), "day")
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

function formatIntervalSecs(value: number | null | undefined, locale: "zh" | "en") {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return "-"
  }

  return locale === "zh" ? `${value} 秒` : `${value} sec`
}

function getAgentStatusMeta(
  status: string | null | undefined,
  t: ReturnType<typeof useAppTranslations>["t"]
) {
  const normalized = status?.trim().toLowerCase()

  if (normalized === "active") {
    return {
      label: t("agentDetail.statusActive"),
      className: "border-emerald-500/30 bg-emerald-500/10 text-emerald-600",
    }
  }

  if (normalized === "inactive") {
    return {
      label: t("agentDetail.statusInactive"),
      className: "border-muted bg-muted text-muted-foreground",
    }
  }

  return {
    label: t("agentDetail.statusUnknown"),
    className: "border-amber-500/30 bg-amber-500/10 text-amber-600",
  }
}

function getMetricBarClass(value?: number) {
  if (value === undefined || value === null || Number.isNaN(value)) {
    return "bg-muted-foreground/30"
  }

  if (value > 90) {
    return "bg-red-500"
  }

  if (value > 80) {
    return "bg-amber-500"
  }

  return "bg-emerald-500"
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

export default function AgentDetailPage() {
  const params = useParams()
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const locale = useAppLocale()
  const { t } = useAppTranslations("pages")

  const agentRef = useMemo(() => {
    const raw = params?.id

    if (!raw) {
      return ""
    }

    return decodeURIComponent(Array.isArray(raw) ? raw[0] : raw)
  }, [params])

  const {
    data: metrics,
    setData: setMetrics,
    loading,
    refreshing,
    execute,
  } = useRequestState<LatestMetric[]>([])
  const {
    data: reportLogsData,
    loading: reportLogsLoading,
    refreshing: reportLogsRefreshing,
    execute: executeReportLogsRequest,
  } = useRequestState<AgentReportLogsState>({
    items: [],
    total: 0,
    limit: REPORT_LOGS_PAGE_SIZE_OPTIONS[1],
    offset: 0,
  }, { initialLoading: false })
  const {
    data: matchedContacts,
    loading: matchedContactsLoading,
    refreshing: matchedContactsRefreshing,
    error: matchedContactsError,
    execute: executeMatchedContactsRequest,
    reset: resetMatchedContactsRequest,
  } = useRequestState<InstanceContactItem[]>([], { initialLoading: false })
  const [notFound, setNotFound] = useState(false)
  const [resolvedAgentId, setResolvedAgentId] = useState("")
  const [agentDetail, setAgentDetail] = useState<AgentDetail | null>(null)
  const [metricNameLabelMap, setMetricNameLabelMap] = useState<Record<string, string>>({})
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [editDescription, setEditDescription] = useState("")
  const [editIntervalSecs, setEditIntervalSecs] = useState("")
  const [preparingEdit, setPreparingEdit] = useState(false)
  const [updating, setUpdating] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [reportLogsPageSize, setReportLogsPageSize] = useState<(typeof REPORT_LOGS_PAGE_SIZE_OPTIONS)[number]>(
    REPORT_LOGS_PAGE_SIZE_OPTIONS[1]
  )
  const [reportLogsOffset, setReportLogsOffset] = useState(0)
  const [reportLogsCurlLastCopiedAt, setReportLogsCurlLastCopiedAt] = useState<string | null>(null)
  const [reportLogsCurlNowTick, setReportLogsCurlNowTick] = useState(() => Date.now())
  const [reportLogsCurlPreference, setReportLogsCurlPreference] = useState<{
    mode: ReportLogsCurlCopyMode
    insecure: boolean
  }>({
    mode: "current",
    insecure: false,
  })
  const [expandedReportLogKeys, setExpandedReportLogKeys] = useState<Record<string, boolean>>({})
  const previousAgentRef = useRef<string | null>(null)

  const agentsPath = useMemo(() => withLocalePrefix("/agents", locale), [locale])
  const instanceContactsPath = useMemo(() => withLocalePrefix("/notifications/contacts", locale), [locale])
  const reportLogsCurlLastCopiedStorageKey = useMemo(() => {
    const scopeId = agentRef || resolvedAgentId || "unknown"
    return `${REPORT_LOGS_CURL_LAST_COPIED_AT_KEY_PREFIX}${scopeId}`
  }, [agentRef, resolvedAgentId])

  useEffect(() => {
    const rawLimit = Number(
      searchParams.get(PAGINATION_LIMIT_QUERY_KEY)
      || searchParams.get(LEGACY_REPORT_LOGS_LIMIT_QUERY_KEY)
      || String(REPORT_LOGS_PAGE_SIZE_OPTIONS[1])
    )
    const nextPageSize = REPORT_LOGS_PAGE_SIZE_OPTIONS.includes(
      rawLimit as (typeof REPORT_LOGS_PAGE_SIZE_OPTIONS)[number]
    )
      ? (rawLimit as (typeof REPORT_LOGS_PAGE_SIZE_OPTIONS)[number])
      : REPORT_LOGS_PAGE_SIZE_OPTIONS[1]
    const rawOffset = Number(
      searchParams.get(PAGINATION_OFFSET_QUERY_KEY)
      || searchParams.get(LEGACY_REPORT_LOGS_OFFSET_QUERY_KEY)
      || "0"
    )
    const normalizedOffset = Number.isFinite(rawOffset) && rawOffset > 0 ? Math.floor(rawOffset) : 0
    const nextOffset = Math.floor(normalizedOffset / nextPageSize) * nextPageSize

    setReportLogsPageSize((prev) => (prev === nextPageSize ? prev : nextPageSize))
    setReportLogsOffset((prev) => (prev === nextOffset ? prev : nextOffset))
  }, [searchParams])

  useEffect(() => {
    const nextParams = new URLSearchParams(searchParams.toString())

    if (reportLogsPageSize !== REPORT_LOGS_PAGE_SIZE_OPTIONS[1]) {
      nextParams.set(PAGINATION_LIMIT_QUERY_KEY, String(reportLogsPageSize))
    } else {
      nextParams.delete(PAGINATION_LIMIT_QUERY_KEY)
    }
    nextParams.delete(LEGACY_REPORT_LOGS_LIMIT_QUERY_KEY)

    if (reportLogsOffset > 0) {
      nextParams.set(PAGINATION_OFFSET_QUERY_KEY, String(reportLogsOffset))
    } else {
      nextParams.delete(PAGINATION_OFFSET_QUERY_KEY)
    }
    nextParams.delete(LEGACY_REPORT_LOGS_OFFSET_QUERY_KEY)

    const nextQuery = nextParams.toString()
    const currentQuery = searchParams.toString()

    if (nextQuery === currentQuery) {
      return
    }

    router.replace(nextQuery ? `${pathname}?${nextQuery}` : pathname, { scroll: false })
  }, [pathname, reportLogsOffset, reportLogsPageSize, router, searchParams])

  const fetchAgentDetail = useCallback(async () => {
    if (!agentRef) {
      return
    }

    try {
      const detail = await api.getAgentById(agentRef)
      setAgentDetail(detail)
      setResolvedAgentId((prev) => (prev === detail.agent_id ? prev : detail.agent_id))
      setNotFound(false)
    } catch (error) {
      if (error instanceof ApiRequestError && error.status === 404) {
        setAgentDetail(null)
        setNotFound(true)
        return
      }

      toastApiError(error, t("agentDetail.toastFetchError"))
    }
  }, [agentRef, t])

  const fetchLatestMetrics = useCallback(
    async (silent = false) => {
      if (!agentRef) {
        return
      }

      await execute(
        async () => {
          let hasAnyNotFound = false

          const tryFetchLatest = async (target: string) => {
            try {
              return await api.getAgentLatestMetrics(target)
            } catch (error) {
              if (error instanceof ApiRequestError && error.status === 404) {
                hasAnyNotFound = true
                return []
              }

              throw error
            }
          }

          let latest = await tryFetchLatest(agentRef)

          if (latest.length > 0) {
            setResolvedAgentId((prev) => (prev === agentRef ? prev : agentRef))
            return latest
          }

          let fallbackAgentId = agentDetail?.agent_id || agentRef

          if (!agentDetail) {
            try {
              const detail = await api.getAgentById(agentRef)
              setAgentDetail(detail)
              fallbackAgentId = detail.agent_id || fallbackAgentId
              setResolvedAgentId((prev) => (prev === detail.agent_id ? prev : detail.agent_id))
            } catch (error) {
              if (!(error instanceof ApiRequestError && error.status === 404)) {
                throw error
              }
            }
          }

          if (fallbackAgentId !== agentRef) {
            setResolvedAgentId((prev) => (prev === fallbackAgentId ? prev : fallbackAgentId))
            latest = await tryFetchLatest(fallbackAgentId)
          } else {
            setResolvedAgentId((prev) => (prev === agentRef ? prev : agentRef))
          }

          if (latest.length > 0) {
            return latest
          }

          const metricPoints = await api.queryAllMetrics({
            agent_id__eq: fallbackAgentId,
            limit: 200,
            offset: 0,
          })

          const fallbackMetrics = buildLatestMetricsFromPoints(metricPoints)

          if (fallbackMetrics.length === 0 && hasAnyNotFound) {
            throw new ApiRequestError("Agent not found", { status: 404 })
          }

          return fallbackMetrics
        },
        {
          silent,
          onSuccess: () => {
            setNotFound(false)
          },
          onError: (error: unknown) => {
            if (error instanceof ApiRequestError && error.status === 404) {
              setNotFound(true)
              setMetrics([])
              return
            }

            toastApiError(error, t("agentDetail.toastFetchError"))
          },
        }
      )
    },
    [agentDetail, agentRef, execute, setMetrics, t]
  )

  const fetchReportLogs = useCallback(
    async (silent = false) => {
      if (!agentRef) {
        return
      }

      await executeReportLogsRequest(
        async () => {
          const query = {
            limit: reportLogsPageSize,
            offset: reportLogsOffset,
          }

          const tryFetch = async (target: string) => {
            try {
              return await api.getAgentReportLogs(target, query)
            } catch (error) {
              if (error instanceof ApiRequestError && error.status === 404) {
                return null
              }

              throw error
            }
          }

          const direct = await tryFetch(agentRef)
          if (direct) {
            return direct
          }

          const fallbackId = agentDetail?.agent_id || resolvedAgentId
          if (fallbackId && fallbackId !== agentRef) {
            const fallback = await tryFetch(fallbackId)
            if (fallback) {
              return fallback
            }
          }

          return {
            items: [],
            total: 0,
            limit: reportLogsPageSize,
            offset: reportLogsOffset,
          }
        },
        {
          silent,
          onError: (error) => {
            toastApiError(error, t("agentDetail.toastFetchReportLogsError"))
          },
        }
      )
    },
    [agentDetail, agentRef, executeReportLogsRequest, reportLogsOffset, reportLogsPageSize, resolvedAgentId, t]
  )

  const fetchMatchedContacts = useCallback(
    async (silent = false) => {
      if (!resolvedAgentId) {
        return
      }

      await executeMatchedContactsRequest(
        () => api.matchInstanceContacts(resolvedAgentId),
        {
          silent,
          onError: (error) => {
            toastApiError(error, t("agentDetail.toastFetchContactsError"))
          },
        }
      )
    },
    [executeMatchedContactsRequest, resolvedAgentId, t]
  )

  useEffect(() => {
    fetchAgentDetail()
  }, [fetchAgentDetail])

  useEffect(() => {
    fetchMatchedContacts()
  }, [fetchMatchedContacts])

  useEffect(() => {
    let cancelled = false

    const fetchMetricNameLabels = async () => {
      try {
        const items = await api.listDictionariesByType("metric_name", true)
        if (cancelled) {
          return
        }
        setMetricNameLabelMap(buildMetricNameLabelMap(items))
      } catch {
        if (!cancelled) {
          setMetricNameLabelMap({})
        }
      }
    }

    fetchMetricNameLabels()

    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    fetchLatestMetrics()
  }, [fetchLatestMetrics])

  useEffect(() => {
    fetchReportLogs()
  }, [fetchReportLogs])

  useEffect(() => {
    if (typeof window === "undefined") {
      return
    }

    try {
      const raw = window.localStorage.getItem(REPORT_LOGS_CURL_PREF_KEY)
      if (!raw) {
        return
      }

      const parsed = JSON.parse(raw) as { mode?: unknown; insecure?: unknown }
      const nextMode: ReportLogsCurlCopyMode =
        parsed.mode === "current" || parsed.mode === "first" || parsed.mode === "agentOnly"
          ? parsed.mode
          : "current"
      const nextInsecure = typeof parsed.insecure === "boolean" ? parsed.insecure : false
      setReportLogsCurlPreference({
        mode: nextMode,
        insecure: nextInsecure,
      })
    } catch {
      // ignore invalid preference payload
    }
  }, [])

  useEffect(() => {
    if (typeof window === "undefined") {
      return
    }

    const stored = window.localStorage.getItem(reportLogsCurlLastCopiedStorageKey)
    if (!stored) {
      setReportLogsCurlLastCopiedAt(null)
      return
    }

    const parsedAt = new Date(stored).getTime()
    if (!Number.isFinite(parsedAt)) {
      setReportLogsCurlLastCopiedAt(null)
      return
    }

    setReportLogsCurlLastCopiedAt(new Date(parsedAt).toISOString())
    setReportLogsCurlNowTick(Date.now())
  }, [reportLogsCurlLastCopiedStorageKey])

  useEffect(() => {
    if (!reportLogsCurlLastCopiedAt) {
      return
    }

    const timer = window.setInterval(() => {
      setReportLogsCurlNowTick(Date.now())
    }, 60000)

    return () => {
      window.clearInterval(timer)
    }
  }, [reportLogsCurlLastCopiedAt])

  useEffect(() => {
    if (previousAgentRef.current === null) {
      previousAgentRef.current = agentRef
      return
    }

    if (previousAgentRef.current !== agentRef) {
      setReportLogsOffset(0)
      setExpandedReportLogKeys({})
      resetMatchedContactsRequest([])
      previousAgentRef.current = agentRef
    }
  }, [agentRef, resetMatchedContactsRequest])

  const openEditDialog = async () => {
    if (!agentRef) {
      return
    }

    setPreparingEdit(true)
    try {
      let detail = agentDetail

      if (!detail) {
        detail = await api.getAgentById(agentRef)
        setAgentDetail(detail)
        setResolvedAgentId((prev) => (prev === detail.agent_id ? prev : detail.agent_id))
      }

      setEditDescription(detail.description || "")
      setEditIntervalSecs(
        typeof detail.collection_interval_secs === "number"
          ? String(detail.collection_interval_secs)
          : ""
      )
      setIsEditDialogOpen(true)
    } catch (error) {
      toastApiError(error, t("agentDetail.toastFetchError"))
    } finally {
      setPreparingEdit(false)
    }
  }

  const handleUpdateAgent = async () => {
    if (!agentRef) {
      return
    }

    let normalizedInterval: number | null = null

    if (editIntervalSecs.trim()) {
      const parsed = Number(editIntervalSecs)
      if (!Number.isFinite(parsed) || parsed < 0) {
        toast.error(t("agentDetail.toastInvalidInterval"))
        return
      }
      normalizedInterval = Math.trunc(parsed)
    }

    setUpdating(true)
    try {
      await api.updateAgent(agentRef, {
        description: editDescription.trim() ? editDescription.trim() : null,
        collection_interval_secs: normalizedInterval,
      })
      toastSaved(t("agentDetail.toastUpdateSuccess"))
      setIsEditDialogOpen(false)
      await fetchAgentDetail()
      await fetchLatestMetrics(true)
    } catch (error) {
      toastApiError(error, t("agentDetail.toastUpdateError"))
    } finally {
      setUpdating(false)
    }
  }

  const handleDeleteAgent = async () => {
    if (!agentRef) {
      return
    }

    setDeleting(true)
    try {
      await api.deleteAgent(agentRef)
      toastDeleted(t("agentDetail.toastDeleteSuccess"))
      router.replace(agentsPath)
    } catch (error) {
      toastApiError(error, t("agentDetail.toastDeleteError"))
    } finally {
      setDeleting(false)
    }
  }

  const cpu = toPercent(findUsagePercentValue(metrics, "cpu"))
  const memory = toPercent(findUsagePercentValue(metrics, "memory"))
  const disk = toPercent(findUsagePercentValue(metrics, "disk"))
  const load = findLoadValue(metrics)

  const cards = [
    {
      key: "cpu",
      title: t("agentDetail.cardCpu"),
      value: formatPercent(cpu),
      valueClass: resolveValueColor(cpu, true),
      progressValue: cpu ?? null,
    },
    {
      key: "memory",
      title: t("agentDetail.cardMemory"),
      value: formatPercent(memory),
      valueClass: resolveValueColor(memory, true),
      progressValue: memory ?? null,
    },
    {
      key: "disk",
      title: t("agentDetail.cardDisk"),
      value: formatPercent(disk),
      valueClass: resolveValueColor(disk, true),
      progressValue: disk ?? null,
    },
    {
      key: "load",
      title: t("agentDetail.cardLoad"),
      value: formatLoad(load),
      valueClass: resolveValueColor(load),
      progressValue: null,
    },
  ]
  const latestSnapshotAt = useMemo(() => formatUpdatedAt(metrics, locale), [locale, metrics])
  const agentStatusMeta = useMemo(
    () => getAgentStatusMeta(agentDetail?.status, t),
    [agentDetail?.status, t]
  )
  const refreshBusy =
    loading
    || refreshing
    || reportLogsLoading
    || reportLogsRefreshing
    || matchedContactsLoading
    || matchedContactsRefreshing
  const reportLogsPagination = useServerOffsetPagination({
    offset: reportLogsOffset,
    limit: reportLogsPageSize,
    currentItemsCount: reportLogsData.items.length,
    totalItems: reportLogsData.total,
  })
  const reportLogsBusy = reportLogsLoading || reportLogsRefreshing
  const reportLogsPageSizeOptionLabel = useCallback(
    (size: number) => (locale === "zh" ? `${size} / 页` : `${size} / page`),
    [locale]
  )
  const getReportLogsCurlLabel = useCallback((mode: ReportLogsCurlCopyMode, insecure: boolean) => {
    if (insecure) {
      if (mode === "current") {
        return t("agentDetail.reportLogsCurlCopyCurrentInsecure")
      }
      if (mode === "first") {
        return t("agentDetail.reportLogsCurlCopyFirstPageInsecure")
      }
      return t("agentDetail.reportLogsCurlCopyAgentOnlyInsecure")
    }

    if (mode === "current") {
      return t("agentDetail.reportLogsCurlCopyCurrent")
    }
    if (mode === "first") {
      return t("agentDetail.reportLogsCurlCopyFirstPage")
    }
    return t("agentDetail.reportLogsCurlCopyAgentOnly")
  }, [t])
  const getReportLogsCurlParamsText = useCallback((mode: ReportLogsCurlCopyMode) => {
    if (mode === "agentOnly") {
      return t("agentDetail.reportLogsCurlPrimaryNoParams")
    }

    const effectiveOffset = mode === "first" ? 0 : reportLogsOffset
    return `limit=${reportLogsPageSize}, offset=${effectiveOffset}`
  }, [reportLogsOffset, reportLogsPageSize, t])

  const copyReportLogsCurl = useCallback(async (
    mode: ReportLogsCurlCopyMode = "current",
    insecure = false
  ) => {
    const id = agentRef || resolvedAgentId
    if (!id) {
      return
    }

    setReportLogsCurlPreference({ mode, insecure })
    if (typeof window !== "undefined") {
      window.localStorage.setItem(
        REPORT_LOGS_CURL_PREF_KEY,
        JSON.stringify({ mode, insecure })
      )
    }

    try {
      const query = mode === "agentOnly"
        ? undefined
        : new URLSearchParams({
          limit: String(reportLogsPageSize),
          offset: mode === "first" ? "0" : String(reportLogsOffset),
        })

      await copyApiCurlCommand({
        path: `/v1/agents/${encodeURIComponent(id)}/report-logs`,
        query,
        insecure,
      })
      const copiedAt = new Date().toISOString()
      setReportLogsCurlLastCopiedAt(copiedAt)
      if (typeof window !== "undefined") {
        window.localStorage.setItem(reportLogsCurlLastCopiedStorageKey, copiedAt)
      }
      toastCopied(t("agentDetail.reportLogsCurlCopiedWithActionAndParams", {
        action: getReportLogsCurlLabel(mode, insecure),
        params: getReportLogsCurlParamsText(mode),
      }))
    } catch {
      toast.error(t("agentDetail.reportLogsCurlCopyFailed"))
    }
  }, [agentRef, getReportLogsCurlLabel, getReportLogsCurlParamsText, reportLogsCurlLastCopiedStorageKey, reportLogsOffset, reportLogsPageSize, resolvedAgentId, t])

  const reportLogsCurlPrimaryLabel = useMemo(
    () => getReportLogsCurlLabel(reportLogsCurlPreference.mode, reportLogsCurlPreference.insecure),
    [getReportLogsCurlLabel, reportLogsCurlPreference.insecure, reportLogsCurlPreference.mode]
  )
  const reportLogsCurlPrimaryParamsText = useMemo(
    () => getReportLogsCurlParamsText(reportLogsCurlPreference.mode),
    [getReportLogsCurlParamsText, reportLogsCurlPreference.mode]
  )
  const reportLogsCurlLastCopiedRelativeText = useMemo(() => {
    if (!reportLogsCurlLastCopiedAt) {
      return ""
    }
    return formatRelativeTimeFromNow(reportLogsCurlLastCopiedAt, locale, reportLogsCurlNowTick)
  }, [locale, reportLogsCurlLastCopiedAt, reportLogsCurlNowTick])

  const copyReportLogsCurlByPreference = useCallback(() => {
    void copyReportLogsCurl(reportLogsCurlPreference.mode, reportLogsCurlPreference.insecure)
  }, [copyReportLogsCurl, reportLogsCurlPreference.insecure, reportLogsCurlPreference.mode])

  if (loading && !agentDetail && !notFound) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between gap-3">
          <Button asChild type="button" variant="outline">
            <Link href={agentsPath}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              {t("agentDetail.backToList")}
            </Link>
          </Button>
        </div>
        <Card>
          <CardContent className="flex h-40 items-center justify-center text-muted-foreground">
            <div className="text-center">
              <Loader2 className="mx-auto mb-2 h-5 w-5 animate-spin" />
              {t("agentDetail.loading")}
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (notFound) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between gap-3">
          <Button asChild type="button" variant="outline">
            <Link href={agentsPath}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              {t("agentDetail.backToList")}
            </Link>
          </Button>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>{t("agentDetail.notFoundTitle")}</CardTitle>
            <CardDescription>
              {t("agentDetail.notFoundDescription", {
                agentId: resolvedAgentId || agentRef || "-",
              })}
            </CardDescription>
          </CardHeader>
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
              <Link href={agentsPath}>
                <ArrowLeft className="mr-1 h-4 w-4" />
                {t("agentDetail.backToList")}
              </Link>
            </Button>
          </div>
          <h2 className="text-2xl font-bold tracking-tight">
            {t("agentDetail.title", { agentId: resolvedAgentId || agentRef || "-" })}
          </h2>
          <p className="text-sm text-muted-foreground">{t("agentDetail.description")}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="outline" className={agentStatusMeta.className}>
            {agentStatusMeta.label}
          </Badge>
          <Badge variant={agentDetail?.in_whitelist ? "secondary" : "outline"}>
            {agentDetail?.in_whitelist
              ? t("agentDetail.whitelistBound")
              : t("agentDetail.whitelistUnbound")}
          </Badge>
          <div className="rounded-md border px-2 py-1 text-xs text-muted-foreground">
            {t("agentDetail.updatedAt", { time: latestSnapshotAt })}
          </div>
          <Button
            type="button"
            variant="outline"
            onClick={() => Promise.all([
              fetchAgentDetail(),
              fetchLatestMetrics(true),
              fetchReportLogs(true),
              fetchMatchedContacts(true),
            ])}
            disabled={refreshBusy || !agentRef}
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${refreshBusy ? "animate-spin" : ""}`} />
            {t("agentDetail.refreshButton")}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={openEditDialog}
            disabled={preparingEdit || updating || deleting}
          >
            {preparingEdit ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Pencil className="mr-2 h-4 w-4" />}
            {t("agentDetail.editButton")}
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={() => setIsDeleteDialogOpen(true)}
            disabled={deleting || updating}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            {t("agentDetail.deleteButton")}
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t("agentDetail.sectionBasicTitle")}</CardTitle>
          <CardDescription>{t("agentDetail.sectionBasicDescription")}</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <FieldItem
            label={t("agentDetail.fieldAgentId")}
            value={resolvedAgentId || agentRef || "-"}
            mono
          />
          <FieldItem
            label={t("agentDetail.fieldRecordId")}
            value={agentDetail?.id || "-"}
            mono
          />
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">{t("agentDetail.fieldStatus")}</p>
            <Badge variant="outline" className={agentStatusMeta.className}>
              {agentStatusMeta.label}
            </Badge>
          </div>
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">{t("agentDetail.fieldWhitelist")}</p>
            <Badge variant={agentDetail?.in_whitelist ? "secondary" : "outline"}>
              {agentDetail?.in_whitelist
                ? t("agentDetail.whitelistBound")
                : t("agentDetail.whitelistUnbound")}
            </Badge>
            {agentDetail?.whitelist_id ? (
              <p className="font-mono text-xs text-muted-foreground">
                {agentDetail.whitelist_id}
              </p>
            ) : null}
          </div>
          <FieldItem
            label={t("agentDetail.fieldCollectionIntervalDisplay")}
            value={formatIntervalSecs(agentDetail?.collection_interval_secs, locale)}
          />
          <FieldItem
            label={t("agentDetail.fieldFirstSeen")}
            value={formatDateTimeByLocale(
              agentDetail?.first_seen,
              locale,
              agentDetail?.first_seen || "-",
              { hour12: false }
            )}
            hint={formatRelativeTime(agentDetail?.first_seen, locale)}
          />
          <FieldItem
            label={t("agentDetail.fieldLastSeen")}
            value={formatDateTimeByLocale(
              agentDetail?.last_seen,
              locale,
              agentDetail?.last_seen || "-",
              { hour12: false }
            )}
            hint={formatRelativeTime(agentDetail?.last_seen, locale)}
          />
          <FieldItem
            label={t("agentDetail.fieldCreatedAt")}
            value={formatDateTimeByLocale(
              agentDetail?.created_at,
              locale,
              agentDetail?.created_at || "-",
              { hour12: false }
            )}
          />
          <FieldItem
            label={t("agentDetail.fieldUpdatedAt")}
            value={formatDateTimeByLocale(
              agentDetail?.updated_at,
              locale,
              agentDetail?.updated_at || "-",
              { hour12: false }
            )}
          />
          <FieldItem
            label={t("agentDetail.fieldDescription")}
            value={agentDetail?.description || "-"}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("agentDetail.sectionMetricsTitle")}</CardTitle>
          <CardDescription>
            {t("agentDetail.sectionMetricsDescription", {
              time: latestSnapshotAt,
            })}
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {cards.map((card) => (
            <div key={card.key} className="rounded-lg border p-4">
              <p className="text-xs text-muted-foreground">{card.title}</p>
              <p className={`mt-1 text-2xl font-semibold ${card.valueClass}`}>
                {card.value}
              </p>
              {card.progressValue !== null ? (
                <div className="mt-3">
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                    <div
                      className={`h-full rounded-full transition-all ${getMetricBarClass(card.progressValue)}`}
                      style={{ width: `${Math.max(0, Math.min(100, card.progressValue))}%` }}
                      aria-hidden="true"
                    />
                  </div>
                </div>
              ) : null}
              <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                <Gauge className="h-3.5 w-3.5" />
                <span>{t("agentDetail.updatedBadge")}</span>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="gap-3 md:flex-row md:items-center md:justify-between">
          <div className="space-y-1">
            <CardTitle>{t("agentDetail.contactsTitle")}</CardTitle>
            <CardDescription>{t("agentDetail.contactsDescription")}</CardDescription>
          </div>
          <Button asChild type="button" variant="outline" size="sm">
            <Link href={instanceContactsPath}>
              <Users className="mr-2 h-4 w-4" />
              {t("agentDetail.contactsManage")}
            </Link>
          </Button>
        </CardHeader>
        <CardContent>
          {matchedContactsLoading ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              {t("agentDetail.contactsLoading")}
            </div>
          ) : matchedContactsError ? (
            <p className="text-sm text-muted-foreground">{matchedContactsError}</p>
          ) : matchedContacts.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t("agentDetail.contactsEmpty")}</p>
          ) : (
            <div className="grid gap-4 xl:grid-cols-2">
              {matchedContacts.map((contact) => {
                const channels = getInstanceContactChannels(contact)

                return (
                  <div key={contact.id} className="rounded-lg border bg-muted/20 p-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="space-y-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-medium">{contact.contact_name}</p>
                          <Badge variant={contact.enabled ? "secondary" : "outline"}>
                            {contact.enabled
                              ? t("agentDetail.contactsStatusEnabled")
                              : t("agentDetail.contactsStatusDisabled")}
                          </Badge>
                        </div>
                        {contact.description ? (
                          <p className="text-sm text-muted-foreground">{contact.description}</p>
                        ) : null}
                      </div>
                      <Badge variant="outline">
                        {t("agentDetail.contactsPatternCount", {
                          count: contact.agent_patterns.length,
                        })}
                      </Badge>
                    </div>

                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {contact.agent_patterns.map((pattern) => (
                        <Badge
                          key={`${contact.id}-${pattern}`}
                          variant="outline"
                          className="font-mono text-[11px]"
                        >
                          {pattern}
                        </Badge>
                      ))}
                    </div>

                    <div className="mt-3 flex flex-wrap gap-2">
                      {channels.length === 0 ? (
                        <Badge variant="outline">{t("agentDetail.contactsNoChannel")}</Badge>
                      ) : (
                        channels.map((channel) => (
                          <Badge key={`${contact.id}-${channel.type}`} variant="secondary">
                            {t(
                              `agentDetail.contactsChannel${channel.type[0].toUpperCase()}${channel.type.slice(1)}`
                            )}
                            : {channel.value}
                          </Badge>
                        ))
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("agentDetail.rawTitle")}</CardTitle>
          <CardDescription>{t("agentDetail.rawDescription")}</CardDescription>
        </CardHeader>
        <CardContent>
          {metrics.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t("agentDetail.rawEmpty")}</p>
          ) : (
            <div className="space-y-3">
              {metrics.map((metric, index) => (
                <div
                  key={buildMetricItemKey(metric, index)}
                  className="rounded-lg border bg-muted/20 p-4"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <p className="text-sm font-medium">
                        {getMetricDisplayName(metric.metric_name, metricNameLabelMap)}
                      </p>
                      <p className="font-mono text-xs text-muted-foreground">{metric.metric_name}</p>
                    </div>
                    <span className="text-sm">
                      {formatMetricValue(metric.value, metric.metric_name, {
                        ratioToPercent: true,
                      })}
                    </span>
                  </div>
                  <p className="mt-2 text-xs text-muted-foreground">
                    {t("agentDetail.rawTime", {
                      time: formatDateTimeByLocale(metric.timestamp, locale),
                    })}
                  </p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="gap-3 md:flex-row md:items-start md:justify-between">
          <div className="space-y-1">
            <CardTitle>{t("agentDetail.reportLogsTitle")}</CardTitle>
            <CardDescription>{t("agentDetail.reportLogsDescription")}</CardDescription>
            {reportLogsCurlLastCopiedAt ? (
              <p className="text-xs text-muted-foreground">
                {t("agentDetail.reportLogsCurlLastCopiedAt", {
                  time: formatDateTimeByLocale(reportLogsCurlLastCopiedAt, locale),
                })}
                {` · ${reportLogsCurlLastCopiedRelativeText}`}
              </p>
            ) : null}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <TooltipProvider>
              <Tooltip>
                <DropdownMenu>
                  <TooltipTrigger asChild>
                    <div className="inline-flex items-center">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="rounded-r-none border-r-0"
                        onClick={copyReportLogsCurlByPreference}
                        disabled={!agentRef && !resolvedAgentId}
                      >
                        {reportLogsCurlPrimaryLabel}
                      </Button>
                      <DropdownMenuTrigger asChild>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="rounded-l-none px-2"
                          disabled={!agentRef && !resolvedAgentId}
                        >
                          <ChevronDown className="h-3.5 w-3.5" />
                        </Button>
                      </DropdownMenuTrigger>
                    </div>
                  </TooltipTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem
                      onClick={() => copyReportLogsCurl("current")}
                      className={reportLogsCurlPreference.mode === "current" && !reportLogsCurlPreference.insecure ? "bg-accent/40" : undefined}
                    >
                      {reportLogsCurlPreference.mode === "current" && !reportLogsCurlPreference.insecure ? (
                        <Check className="h-3.5 w-3.5 text-emerald-600" />
                      ) : null}
                      {t("agentDetail.reportLogsCurlCopyCurrent")}
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => copyReportLogsCurl("first")}
                      className={reportLogsCurlPreference.mode === "first" && !reportLogsCurlPreference.insecure ? "bg-accent/40" : undefined}
                    >
                      {reportLogsCurlPreference.mode === "first" && !reportLogsCurlPreference.insecure ? (
                        <Check className="h-3.5 w-3.5 text-emerald-600" />
                      ) : null}
                      {t("agentDetail.reportLogsCurlCopyFirstPage")}
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => copyReportLogsCurl("agentOnly")}
                      className={reportLogsCurlPreference.mode === "agentOnly" && !reportLogsCurlPreference.insecure ? "bg-accent/40" : undefined}
                    >
                      {reportLogsCurlPreference.mode === "agentOnly" && !reportLogsCurlPreference.insecure ? (
                        <Check className="h-3.5 w-3.5 text-emerald-600" />
                      ) : null}
                      {t("agentDetail.reportLogsCurlCopyAgentOnly")}
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() => copyReportLogsCurl("current", true)}
                      className={reportLogsCurlPreference.mode === "current" && reportLogsCurlPreference.insecure ? "bg-accent/40" : undefined}
                    >
                      {reportLogsCurlPreference.mode === "current" && reportLogsCurlPreference.insecure ? (
                        <Check className="h-3.5 w-3.5 text-emerald-600" />
                      ) : null}
                      {t("agentDetail.reportLogsCurlCopyCurrentInsecure")}
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => copyReportLogsCurl("first", true)}
                      className={reportLogsCurlPreference.mode === "first" && reportLogsCurlPreference.insecure ? "bg-accent/40" : undefined}
                    >
                      {reportLogsCurlPreference.mode === "first" && reportLogsCurlPreference.insecure ? (
                        <Check className="h-3.5 w-3.5 text-emerald-600" />
                      ) : null}
                      {t("agentDetail.reportLogsCurlCopyFirstPageInsecure")}
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => copyReportLogsCurl("agentOnly", true)}
                      className={reportLogsCurlPreference.mode === "agentOnly" && reportLogsCurlPreference.insecure ? "bg-accent/40" : undefined}
                    >
                      {reportLogsCurlPreference.mode === "agentOnly" && reportLogsCurlPreference.insecure ? (
                        <Check className="h-3.5 w-3.5 text-emerald-600" />
                      ) : null}
                      {t("agentDetail.reportLogsCurlCopyAgentOnlyInsecure")}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
                <TooltipContent side="top">
                  <div className="space-y-1">
                    <div>{t("agentDetail.reportLogsCurlPrimaryTooltip", {
                      action: reportLogsCurlPrimaryLabel,
                    })}</div>
                    <div className="text-xs text-background/85">
                      {t("agentDetail.reportLogsCurlPrimaryTooltipParams", {
                        params: reportLogsCurlPrimaryParamsText,
                      })}
                    </div>
                  </div>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => fetchReportLogs(true)}
              disabled={reportLogsBusy}
            >
              {reportLogsBusy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
              {t("agentDetail.reportLogsRefreshButton")}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="w-full overflow-x-auto">
            <Table className="min-w-[980px]">
              <TableHeader>
                <TableRow>
                  <TableHead>{t("agentDetail.reportLogsColTime")}</TableHead>
                  <TableHead>{t("agentDetail.reportLogsColHost")}</TableHead>
                  <TableHead>{t("agentDetail.reportLogsColSystem")}</TableHead>
                  <TableHead>{t("agentDetail.reportLogsColResource")}</TableHead>
                  <TableHead>{t("agentDetail.reportLogsColMetricCount")}</TableHead>
                  <TableHead>{t("agentDetail.reportLogsColStatus")}</TableHead>
                  <TableHead>{t("agentDetail.reportLogsColSummary")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reportLogsLoading ? (
                  Array.from({ length: 3 }).map((_, index) => (
                    <TableRow key={index}>
                      <TableCell colSpan={7} className="h-14 text-muted-foreground">
                        {t("agentDetail.reportLogsLoading")}
                      </TableCell>
                    </TableRow>
                  ))
                ) : reportLogsData.items.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="h-32 text-center text-muted-foreground">
                      {t("agentDetail.reportLogsEmpty")}
                    </TableCell>
                  </TableRow>
                ) : (
                  reportLogsData.items.map((log, index) => {
                    const timestamp = getAgentReportLogTimestamp(log)
                    const status = getAgentReportLogStatus(log) || t("agentDetail.reportLogsStatusUnknown")
                    const summary = getAgentReportLogMessage(log) || t("agentDetail.reportLogsSummaryEmpty")
                    const metricCount = getAgentReportLogMetricCount(log)
                    const hostname = getAgentReportLogHostname(log) || "-"
                    const system = getAgentReportLogSystem(log) || "-"
                    const resource = getAgentReportLogResource(log) || "-"
                    const itemKey = typeof log.id === "string" && log.id
                      ? log.id
                      : `${timestamp || "unknown"}-${status || "unknown"}-${index}`
                    const expanded = Boolean(expandedReportLogKeys[itemKey])
                    const rawJson = JSON.stringify(log, null, 2)

                    return (
                      <Fragment key={itemKey}>
                        <TableRow>
                          <TableCell className="text-xs text-muted-foreground">
                            {formatDateTimeByLocale(timestamp, locale)}
                          </TableCell>
                          <TableCell className="font-mono text-xs">{hostname}</TableCell>
                          <TableCell className="text-sm">{system}</TableCell>
                          <TableCell className="text-xs">{resource}</TableCell>
                          <TableCell className="text-xs">
                            {metricCount === null ? "-" : metricCount}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">{status}</Badge>
                          </TableCell>
                          <TableCell className="max-w-[360px] space-y-2">
                            <p className="line-clamp-2 break-all text-xs text-muted-foreground">{summary}</p>
                            <Button
                              type="button"
                              size="sm"
                              variant="ghost"
                              className="h-7 px-2 text-xs"
                              onClick={() =>
                                setExpandedReportLogKeys((prev) => ({
                                  ...prev,
                                  [itemKey]: !prev[itemKey],
                                }))
                              }
                            >
                              {expanded
                                ? t("agentDetail.reportLogsActionCollapse")
                                : t("agentDetail.reportLogsActionExpand")}
                            </Button>
                          </TableCell>
                        </TableRow>
                        {expanded ? (
                          <TableRow>
                            <TableCell colSpan={7}>
                              <div className="space-y-2">
                                <div className="flex items-center justify-between gap-2">
                                  <p className="text-xs font-medium text-muted-foreground">
                                    {t("agentDetail.reportLogsRawTitle")}
                                  </p>
                                  <div className="flex items-center gap-2">
                                    <Button
                                      type="button"
                                      size="sm"
                                      variant="outline"
                                      className="h-7 px-2 text-xs"
                                      onClick={async () => {
                                        try {
                                          await navigator.clipboard.writeText(rawJson)
                                          toastCopied(t("agentDetail.reportLogsRawCopied"))
                                        } catch {
                                          toast.error(t("agentDetail.reportLogsRawCopyFailed"))
                                        }
                                      }}
                                    >
                                      {t("agentDetail.reportLogsRawCopyAction")}
                                    </Button>
                                    <Button
                                      type="button"
                                      size="sm"
                                      variant="outline"
                                      className="h-7 px-2 text-xs"
                                      onClick={() => {
                                        try {
                                          const blob = new Blob([rawJson], { type: "application/json;charset=utf-8" })
                                          const url = URL.createObjectURL(blob)
                                          const link = document.createElement("a")
                                          const safeKey = itemKey.replace(/[^a-zA-Z0-9_-]+/g, "-").slice(0, 80) || "log"
                                          link.href = url
                                          link.download = `agent-report-log-${safeKey}.json`
                                          document.body.appendChild(link)
                                          link.click()
                                          link.remove()
                                          URL.revokeObjectURL(url)
                                          toast.success(t("agentDetail.reportLogsRawDownloaded"))
                                        } catch {
                                          toast.error(t("agentDetail.reportLogsRawDownloadFailed"))
                                        }
                                      }}
                                    >
                                      {t("agentDetail.reportLogsRawDownloadAction")}
                                    </Button>
                                  </div>
                                </div>
                                <pre className="max-h-64 overflow-auto rounded-md border bg-muted/20 p-3 text-xs">
                                  {rawJson}
                                </pre>
                              </div>
                            </TableCell>
                          </TableRow>
                        ) : null}
                      </Fragment>
                    )
                  })
                )}
              </TableBody>
            </Table>
          </div>

          <PaginationControls
            pageSize={reportLogsPageSize}
            pageSizeOptions={[...REPORT_LOGS_PAGE_SIZE_OPTIONS]}
            onPageSizeChange={(value) => {
              const normalized = value as (typeof REPORT_LOGS_PAGE_SIZE_OPTIONS)[number]
              if (normalized === reportLogsPageSize) {
                return
              }

              setReportLogsPageSize(normalized)
              setReportLogsOffset(0)
            }}
            {...buildTranslatedPaginationTextBundle({
              t,
              summaryKey: "agentDetail.reportLogsPaginationSummary",
              total: reportLogsData.total,
              start: reportLogsPagination.rangeStart,
              end: reportLogsPagination.rangeEnd,
              pageKey: "agentDetail.reportLogsPaginationPage",
              currentPage: reportLogsPagination.currentPage,
              totalPages: reportLogsPagination.totalPages,
              prevKey: "agentDetail.reportLogsPaginationPrev",
              nextKey: "agentDetail.reportLogsPaginationNext",
            })}
            pageSizePlaceholder={t("agentDetail.reportLogsPageSizePlaceholder")}
            onPrevPage={() => setReportLogsOffset((prev) => Math.max(0, prev - reportLogsPageSize))}
            onNextPage={() => setReportLogsOffset((prev) => prev + reportLogsPageSize)}
            prevDisabled={reportLogsBusy || !reportLogsPagination.canGoPrev}
            nextDisabled={reportLogsBusy || !reportLogsPagination.canGoNext}
            pageSizeOptionLabel={reportLogsPageSizeOptionLabel}
          />
        </CardContent>
      </Card>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("agentDetail.editDialogTitle")}</DialogTitle>
            <DialogDescription>{t("agentDetail.editDialogDescription")}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="agent-description">{t("agentDetail.fieldDescription")}</Label>
              <Input
                id="agent-description"
                value={editDescription}
                onChange={(event) => setEditDescription(event.target.value)}
                placeholder={t("agentDetail.placeholderDescription")}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="agent-interval">{t("agentDetail.fieldIntervalSecs")}</Label>
              <Input
                id="agent-interval"
                type="number"
                min={0}
                value={editIntervalSecs}
                onChange={(event) => setEditIntervalSecs(event.target.value)}
                placeholder={t("agentDetail.placeholderIntervalSecs")}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)} disabled={updating}>
              {t("agentDetail.btnCancel")}
            </Button>
            <Button onClick={handleUpdateAgent} disabled={updating}>
              {updating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              {t("agentDetail.btnSave")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("agentDetail.deleteDialogTitle")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("agentDetail.deleteDialogDescription", {
                agentId: resolvedAgentId || agentRef || "-",
              })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>{t("agentDetail.btnCancel")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteAgent}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              {t("agentDetail.deleteDialogConfirm")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
