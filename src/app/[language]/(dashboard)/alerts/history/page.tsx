"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { api } from "@/lib/api"
import { AlertEventResponse } from "@/types/api"
import {
  useAppTranslations,
  type AppNamespaceTranslator,
} from "@/hooks/use-app-translations"
import { useServerOffsetPagination } from "@/hooks/use-server-offset-pagination"
import { AlertHistoryFiltersCard } from "@/components/alerts/AlertHistoryFiltersCard"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { ServerPaginationControls } from "@/components/ui/server-pagination-controls"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  AlertCircle,
  AlertTriangle,
  CheckCircle,
  Loader2,
  Info,
  XCircle,
} from "lucide-react"
import { toast, toastApiError } from "@/lib/toast"
import { motion } from "framer-motion"

type AlertHistoryParams = {
  limit: number
  offset: number
  agent_id__eq?: string
  severity__eq?: string
  timestamp__gte?: string
  timestamp__lte?: string
}

function TableRowSkeleton() {
  return (
    <TableRow>
      <TableCell>
        <Skeleton className="h-6 w-20" />
      </TableCell>
      <TableCell>
        <Skeleton className="h-4 w-32" />
      </TableCell>
      <TableCell>
        <Skeleton className="h-4 w-24" />
      </TableCell>
      <TableCell>
        <Skeleton className="h-4 w-48" />
      </TableCell>
      <TableCell>
        <Skeleton className="h-4 w-16" />
      </TableCell>
      <TableCell>
        <Skeleton className="h-4 w-32" />
      </TableCell>
      <TableCell>
        <Skeleton className="h-6 w-24" />
      </TableCell>
    </TableRow>
  )
}

function getSeverityBadgeClass(severity: string) {
  const normalized = severity.toLowerCase()

  if (normalized === "critical") {
    return "border-red-500/30 bg-red-500/10 text-red-600"
  }

  if (normalized === "warning") {
    return "border-amber-500/30 bg-amber-500/10 text-amber-600"
  }

  if (normalized === "info") {
    return "border-blue-500/30 bg-blue-500/10 text-blue-600"
  }

  return "border-muted bg-muted text-muted-foreground"
}

function getSeverityIcon(severity: string) {
  const normalized = severity.toLowerCase()

  if (normalized === "critical") {
    return AlertCircle
  }

  if (normalized === "warning") {
    return AlertTriangle
  }

  if (normalized === "info") {
    return Info
  }

  return AlertCircle
}

function getSeverityText(severity: string, t: AppNamespaceTranslator<"alerts">) {
  const normalized = severity.toLowerCase()

  if (normalized === "critical") {
    return t("severity.critical")
  }

  if (normalized === "warning") {
    return t("severity.warning")
  }

  if (normalized === "info") {
    return t("severity.info")
  }

  return severity
}

function getStatusBadge(alert: AlertEventResponse, t: AppNamespaceTranslator<"alerts">) {
  // 状态: 1=未处理, 2=已确认, 3=已处理
  switch (alert.status) {
    case 3:
      return (
        <Badge className="border-emerald-500/30 bg-emerald-500/10 text-emerald-600">
          <CheckCircle className="mr-1 h-3 w-3" />
          {t("history.statusResolved")}
        </Badge>
      )
    case 2:
      return (
        <Badge className="border-amber-500/30 bg-amber-500/10 text-amber-600">
          <AlertCircle className="mr-1 h-3 w-3" />
          {t("history.statusAcknowledged")}
        </Badge>
      )
    case 1:
    default:
      return (
        <Badge className="border-red-500/30 bg-red-500/10 text-red-600">
          <XCircle className="mr-1 h-3 w-3" />
          {t("history.statusOpen")}
        </Badge>
      )
  }
}

function formatTimestamp(timestamp: string, locale: "zh" | "en") {
  try {
    const date = new Date(timestamp)
    return date.toLocaleString(locale === "zh" ? "zh-CN" : "en-US", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    })
  } catch {
    return timestamp
  }
}

export default function AlertHistoryPage() {
  const { t, locale } = useAppTranslations("alerts")
  const [alerts, setAlerts] = useState<AlertEventResponse[]>([])
  const [alertsTotal, setAlertsTotal] = useState(0)
  const [loading, setLoading] = useState(true)

  const [filterAgentId, setFilterAgentId] = useState("")
  const [filterSeverity, setFilterSeverity] = useState("")
  const [filterStatus, setFilterStatus] = useState("")
  const [filterTimeFrom, setFilterTimeFrom] = useState("")
  const [filterTimeTo, setFilterTimeTo] = useState("")

  const [offset, setOffset] = useState(0)
  const limit = 20

  const fetchHistory = useCallback(async () => {
    setLoading(true)

    try {
      const params: AlertHistoryParams = { limit, offset }

      if (filterAgentId.trim()) {
        params.agent_id__eq = filterAgentId.trim()
      }

      if (filterSeverity && filterSeverity !== "all") {
        params.severity__eq = filterSeverity
      }

      if (filterTimeFrom) {
        params.timestamp__gte = new Date(filterTimeFrom).toISOString()
      }

      if (filterTimeTo) {
        params.timestamp__lte = new Date(filterTimeTo).toISOString()
      }

      const data = await api.getAlertHistory(params)
      setAlerts(data.items)
      setAlertsTotal(data.total)
    } catch (error) {
      toastApiError(error, t("history.toastFetchError"))
    } finally {
      setLoading(false)
    }
  }, [limit, offset, filterAgentId, filterSeverity, filterTimeFrom, filterTimeTo, t])

  useEffect(() => {
    fetchHistory()
  }, [fetchHistory])

  // 客户端状态筛选（因为 API 不支持状态筛选参数）
  // 状态: 1=未处理, 2=已确认, 3=已处理
  const filteredAlerts = useMemo(() => {
    if (!filterStatus || filterStatus === "all") return alerts

    return alerts.filter((alert) => {
      if (filterStatus === "resolved") return alert.status === 3
      if (filterStatus === "acknowledged") return alert.status === 2
      if (filterStatus === "open") return alert.status === 1
      return true
    })
  }, [alerts, filterStatus])

  const handleApplyFilters = () => {
    setOffset(0)
    fetchHistory()
  }

  const handleResetFilters = () => {
    setFilterAgentId("")
    setFilterSeverity("")
    setFilterStatus("")
    setFilterTimeFrom("")
    setFilterTimeTo("")
    setOffset(0)
  }

  const hasActiveFilters =
    filterAgentId || filterSeverity || filterStatus || filterTimeFrom || filterTimeTo

  const pagination = useServerOffsetPagination({
    offset,
    limit,
    currentItemsCount: alerts.length,
    totalItems: alertsTotal,
  })

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">{t("history.title")}</h2>
        <p className="text-sm text-muted-foreground">{t("history.description")}</p>
      </div>

      <AlertHistoryFiltersCard
        filterAgentId={filterAgentId}
        filterSeverity={filterSeverity}
        filterStatus={filterStatus}
        filterTimeFrom={filterTimeFrom}
        filterTimeTo={filterTimeTo}
        hasActiveFilters={Boolean(hasActiveFilters)}
        onFilterAgentIdChange={setFilterAgentId}
        onFilterSeverityChange={setFilterSeverity}
        onFilterStatusChange={setFilterStatus}
        onFilterTimeFromChange={setFilterTimeFrom}
        onFilterTimeToChange={setFilterTimeTo}
        onApplyFilters={handleApplyFilters}
        onResetFilters={handleResetFilters}
      />

      <Card className="glass-card">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>{t("history.title")}</CardTitle>
              <CardDescription>
                {filteredAlerts.length !== alerts.length
                  ? t("history.resultsDescriptionWithCount", {
                      filtered: filteredAlerts.length,
                      total: alerts.length,
                    })
                  : t("history.resultsDescription")}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-hidden rounded-lg border border-white/10">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("active.colSeverity")}</TableHead>
                  <TableHead>{t("active.colAgent")}</TableHead>
                  <TableHead>{t("active.colMetric")}</TableHead>
                  <TableHead>{t("active.colMessage")}</TableHead>
                  <TableHead>{t("active.colValue")}</TableHead>
                  <TableHead>{t("active.colTime")}</TableHead>
                  <TableHead>{t("history.colStatus")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <>
                    {[1, 2, 3, 4, 5].map((i) => (
                      <TableRowSkeleton key={i} />
                    ))}
                  </>
                ) : filteredAlerts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="h-40 text-center">
                      <div className="flex flex-col items-center gap-2 text-muted-foreground">
                        <AlertCircle className="h-10 w-10" />
                        <p className="font-semibold">{t("history.emptyTitle")}</p>
                        <p className="text-sm">{t("history.emptyDescription")}</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredAlerts.map((alert, index) => {
                    const SeverityIcon = getSeverityIcon(alert.severity)

                    return (
                      <motion.tr
                        key={alert.id}
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.2, delay: index * 0.03 }}
                        className="group hover:bg-muted/50"
                      >
                        <TableCell>
                          <Badge className={getSeverityBadgeClass(alert.severity)}>
                            <SeverityIcon className="mr-1 h-3 w-3" />
                            {getSeverityText(alert.severity, t)}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-mono text-xs">{alert.agent_id}</TableCell>
                        <TableCell>{alert.metric_name}</TableCell>
                        <TableCell className="max-w-xs truncate" title={alert.message}>
                          {alert.message}
                        </TableCell>
                        <TableCell>
                          <span className="font-semibold">{alert.value.toFixed(2)}</span>
                          <span className="text-muted-foreground"> / {alert.threshold}</span>
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {formatTimestamp(alert.timestamp, locale)}
                        </TableCell>
                        <TableCell>{getStatusBadge(alert, t)}</TableCell>
                      </motion.tr>
                    )
                  })
                )}
              </TableBody>
            </Table>
          </div>

          {!loading && alerts.length > 0 && (
            <ServerPaginationControls
              className="mt-4 flex items-center justify-between"
              pageSize={limit}
              showSummary
              showPageIndicator={false}
              summaryText={`${t("history.paginationPage", { page: Math.floor(offset / limit) + 1 })}${
                filteredAlerts.length !== alerts.length
                  ? ` • ${t("history.paginationShown", { filtered: filteredAlerts.length, total: alerts.length })}`
                  : ""
              }`}
              pageIndicatorText=""
              prevLabel={t("history.paginationPrevious")}
              nextLabel={t("history.paginationNext")}
              onPrevPage={() => setOffset(Math.max(0, offset - limit))}
              onNextPage={() => setOffset(offset + limit)}
              prevDisabled={!pagination.canGoPrev}
              nextDisabled={!pagination.canGoNext}
            />
          )}
        </CardContent>
      </Card>
    </div>
  )
}
