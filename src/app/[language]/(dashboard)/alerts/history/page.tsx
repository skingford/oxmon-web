"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { api } from "@/lib/api"
import { AlertEventResponse, ListResponse } from "@/types/api"
import { useAppTranslations } from "@/hooks/use-app-translations"
import { useRefreshState } from "@/hooks/use-refresh-state"
import { useServerOffsetPagination } from "@/hooks/use-server-offset-pagination"
import { AlertHistoryFiltersCard } from "@/components/alerts/AlertHistoryFiltersCard"
import { AlertStatusBadge } from "@/components/alerts/AlertStatusBadge"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { PaginationControls } from "@/components/ui/pagination-controls"
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
  Loader2,
  RefreshCw,
} from "lucide-react"
import { formatDateTimeByLocale } from "@/lib/date-time"
import { buildTranslatedPaginationTextBundle } from "@/lib/pagination-summary"
import { motion, AnimatePresence } from "framer-motion"
import { getMetricDisplayName } from "@/components/pages/metrics/metrics-utils"
import { executeAlertRequest } from "@/components/alerts/alert-request-utils"
import {
  getAlertSeverityBadgeClass,
  getAlertSeverityIcon,
  getAlertSeverityLabel,
} from "@/components/alerts/alert-severity-utils"
import {
  matchesAlertHistoryStatusFilter,
} from "@/components/alerts/alert-status-utils"
import {
  invalidateAlertDisplayMetadataCache,
  useAlertDisplayMetadata,
} from "@/hooks/use-alert-display-metadata"

type AlertHistoryFilterParams = {
  limit: number
  offset: number
  source_id__eq?: string
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

export default function AlertHistoryPage() {
  const { t, locale } = useAppTranslations("alerts")
  const [alertsPage, setAlertsPage] = useState<ListResponse<AlertEventResponse>>({ items: [], total: 0, limit: 20, offset: 0 })
  const { loading, refreshing, runWithRefresh } = useRefreshState()
  const [metadataRefreshKey, setMetadataRefreshKey] = useState(0)
  const { sourceDisplayNameMap, metricNameLabelMap, sourceOptions } = useAlertDisplayMetadata(
    locale,
    { refreshKey: metadataRefreshKey }
  )

  const [filterSourceId, setFilterSourceId] = useState("")
  const [filterSeverity, setFilterSeverity] = useState("")
  const [filterStatus, setFilterStatus] = useState("")
  const [filterTimeFrom, setFilterTimeFrom] = useState("")
  const [filterTimeTo, setFilterTimeTo] = useState("")

  const [offset, setOffset] = useState(0)
  const limit = 20
  const alerts = alertsPage.items
  const alertsTotal = alertsPage.total

  const fetchHistory = useCallback(async (options?: { silent?: boolean }) => {
    await runWithRefresh(async () => {
      await executeAlertRequest(async () => {
        const params: AlertHistoryFilterParams = { limit, offset }

        if (filterSourceId.trim()) {
          params.source_id__eq = filterSourceId.trim()
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
        setAlertsPage(data)
      }, t("history.toastFetchError"))
    }, options)
  }, [filterSeverity, filterSourceId, filterTimeFrom, filterTimeTo, limit, offset, runWithRefresh, t])

  useEffect(() => {
    fetchHistory()
  }, [fetchHistory])

  // 客户端状态筛选（因为 API 不支持状态筛选参数）
  // 状态: 1=未处理, 2=已确认, 3=已处理
  const filteredAlerts = useMemo(() => {
    if (!filterStatus || filterStatus === "all") return alertsPage.items

    return alertsPage.items.filter((alert) => matchesAlertHistoryStatusFilter(filterStatus, alert.status))
  }, [alertsPage.items, filterStatus])

  const handleApplyFilters = () => {
    setOffset(0)
    fetchHistory()
  }

  const handleRefresh = useCallback(async () => {
    invalidateAlertDisplayMetadataCache()
    setMetadataRefreshKey((prev) => prev + 1)
    await fetchHistory({ silent: true })
  }, [fetchHistory])

  const handleResetFilters = () => {
    setFilterSourceId("")
    setFilterSeverity("")
    setFilterStatus("")
    setFilterTimeFrom("")
    setFilterTimeTo("")
    setOffset(0)
  }

  const hasActiveFilters =
    filterSourceId || filterSeverity || filterStatus || filterTimeFrom || filterTimeTo

  const pagination = useServerOffsetPagination({
    offset,
    limit,
    currentItemsCount: alertsPage.items.length,
    totalItems: alertsPage.total,
  })

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight">{t("history.title")}</h2>
            <p className="text-sm text-muted-foreground">{t("history.description")}</p>
          </div>
          <Button variant="outline" onClick={handleRefresh} disabled={loading || refreshing}>
            <RefreshCw className={`mr-2 h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
            {t("history.btnRefresh")}
          </Button>
        </div>
      </div>

      <AlertHistoryFiltersCard
        filterSourceId={filterSourceId}
        filterSeverity={filterSeverity}
        filterStatus={filterStatus}
        filterTimeFrom={filterTimeFrom}
        filterTimeTo={filterTimeTo}
        sourceOptions={sourceOptions}
        hasActiveFilters={Boolean(hasActiveFilters)}
        onFilterSourceIdChange={setFilterSourceId}
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
                  <AnimatePresence mode="popLayout">
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
                          const SeverityIcon = getAlertSeverityIcon(alert.severity)
                    const sourceName = sourceDisplayNameMap[alert.agent_id]?.trim() || alert.agent_id
                    const metricLabel = getMetricDisplayName(alert.metric_name, metricNameLabelMap)

                    return (
                      <motion.tr
                        key={alert.id}
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.2, delay: index * 0.03 }}
                        className="group hover:bg-muted/50"
                      >
                        <TableCell>
                            <Badge className={getAlertSeverityBadgeClass(alert.severity)}>
                            <SeverityIcon className="mr-1 h-3 w-3" />
                              {getAlertSeverityLabel(alert.severity, t)}
                            </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-0.5">
                            <p className="text-xs font-medium">{sourceName}</p>
                            {sourceName !== alert.agent_id ? (
                              <p className="font-mono text-[11px] text-muted-foreground">
                                {alert.agent_id}
                              </p>
                            ) : null}
                          </div>
                        </TableCell>
                        <TableCell>
                          <p>{metricLabel}</p>
                          {metricLabel !== alert.metric_name ? (
                            <p className="font-mono text-[11px] text-muted-foreground">
                              {alert.metric_name}
                            </p>
                          ) : null}
                        </TableCell>
                        <TableCell className="max-w-xs truncate" title={alert.message}>
                          {alert.message}
                        </TableCell>
                        <TableCell>
                          <span className="font-semibold">{alert.value.toFixed(2)}</span>
                          <span className="text-muted-foreground"> / {alert.threshold}</span>
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {formatDateTimeByLocale(alert.timestamp, locale, alert.timestamp, {
                            year: "numeric",
                            month: "2-digit",
                            day: "2-digit",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </TableCell>
                        <TableCell><AlertStatusBadge status={alert.status} t={t} /></TableCell>
                      </motion.tr>
                    )
                  })
                )}
                </AnimatePresence>
                </TableBody>
            </Table>
          </div>

          {!loading && alerts.length > 0 && (
            <PaginationControls
              className="mt-4"
              pageSize={limit}
              {...buildTranslatedPaginationTextBundle({
                t,
                summaryKey: "history.paginationSummary",
                total: alertsPage.total,
                start: pagination.rangeStart,
                end: pagination.rangeEnd,
                shownKey: "history.paginationShown",
                filtered: filteredAlerts.length,
                unfilteredTotal: alerts.length,
                pageKey: "history.paginationPage",
                currentPage: pagination.currentPage,
                totalPages: pagination.totalPages,
                prevKey: "history.paginationPrev",
                nextKey: "history.paginationNext",
              })}
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
