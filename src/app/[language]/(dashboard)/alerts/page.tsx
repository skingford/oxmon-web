"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { api } from "@/lib/api"
import { AlertEventResponse, AlertSummary } from "@/types/api"
import { withLocalePrefix } from "@/components/app-locale"
import {
  useAppTranslations,
  type AppNamespaceTranslator,
} from "@/hooks/use-app-translations"
import { useServerOffsetPagination } from "@/hooks/use-server-offset-pagination"
import { ActiveAlertsListHeader, ActiveAlertsTopControls } from "@/components/alerts/ActiveAlertsHeader"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { ServerPaginationControls } from "@/components/ui/server-pagination-controls"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Skeleton } from "@/components/ui/skeleton"
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
  CheckCircle,
  CheckCheck,
  ExternalLink,
  MoreHorizontal,
  Loader2,
  AlertTriangle,
  Info,
} from "lucide-react"
import { toast, toastApiError } from "@/lib/toast"
import { motion, AnimatePresence } from "framer-motion"
import {
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts"

function TableRowSkeleton() {
  return (
    <TableRow>
      <TableCell>
        <Skeleton className="h-4 w-4" />
      </TableCell>
      <TableCell>
        <Skeleton className="h-6 w-20" />
      </TableCell>
      <TableCell>
        <Skeleton className="h-4 w-32" />
      </TableCell>
      <TableCell>
        <Skeleton className="h-4 w-48" />
      </TableCell>
      <TableCell>
        <Skeleton className="h-4 w-20" />
      </TableCell>
      <TableCell className="text-right">
        <div className="flex items-center justify-end gap-2">
          <Skeleton className="h-8 w-16" />
          <Skeleton className="h-8 w-20" />
          <Skeleton className="h-8 w-20" />
        </div>
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

function formatTimestamp(
  timestamp: string,
  locale: "zh" | "en",
  t: AppNamespaceTranslator<"alerts">
) {
  try {
    const date = new Date(timestamp)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const minute = 60 * 1000
    const hour = 60 * minute

    if (diff < minute) {
      return t("active.timeJustNow")
    }

    if (diff < hour) {
      return t("active.timeMinutesAgo", { count: Math.floor(diff / minute) })
    }

    return date.toLocaleString(locale === "zh" ? "zh-CN" : "en-US", {
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    })
  } catch {
    return timestamp
  }
}

function getSeverityLabel(
  severity: string,
  t: AppNamespaceTranslator<"alerts">
) {
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

export default function ActiveAlertsPage() {
  const router = useRouter()
  const { t, locale } = useAppTranslations("alerts")
  const [alerts, setAlerts] = useState<AlertEventResponse[]>([])
  const [alertsTotal, setAlertsTotal] = useState(0)
  const [summary, setSummary] = useState<AlertSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [actionInProgress, setActionInProgress] = useState<string | null>(null)
  const [offset, setOffset] = useState(0)
  const limit = 20

  // 搜索和筛选
  const [searchQuery, setSearchQuery] = useState("")

  // 自动刷新
  const [autoRefresh, setAutoRefresh] = useState(false)

  // 批量操作
  const [selectedAlerts, setSelectedAlerts] = useState<Set<string>>(new Set())

  const fetchData = useCallback(
    async (silent = false) => {
      if (silent) {
        setRefreshing(true)
      } else {
        setLoading(true)
      }

      try {
        const [alertsData, summaryData] = await Promise.all([
          api.getActiveAlerts({ limit, offset }),
          api.getAlertSummary(),
        ])

        setAlerts(alertsData.items)
        setAlertsTotal(alertsData.total)
        setSummary(summaryData)
      } catch (error) {
        toastApiError(error, t("active.toastFetchError"))
      } finally {
        setLoading(false)
        setRefreshing(false)
      }
    },
    [limit, offset, t]
  )

  useEffect(() => {
    fetchData()
  }, [fetchData])

  // 自动刷新逻辑
  useEffect(() => {
    if (!autoRefresh) return

    const interval = setInterval(() => {
      fetchData(true)
    }, 30000) // 30秒

    return () => clearInterval(interval)
  }, [autoRefresh, fetchData])

  // 搜索筛选
  const filteredAlerts = useMemo(() => {
    if (!searchQuery.trim()) return alerts

    const query = searchQuery.toLowerCase().trim()
    return alerts.filter(
      (alert) =>
        alert.agent_id.toLowerCase().includes(query) ||
        alert.message.toLowerCase().includes(query) ||
        alert.metric_name.toLowerCase().includes(query)
    )
  }, [alerts, searchQuery])

  const handleAcknowledge = async (id: string) => {
    setActionInProgress(id)

    try {
      await api.acknowledgeAlert(id)
      toast.success(t("active.toastAcknowledged"))
      await fetchData(true)
      setSelectedAlerts((prev) => {
        const next = new Set(prev)
        next.delete(id)
        return next
      })
    } catch (error) {
      toastApiError(error, t("active.toastAckError"))
    } finally {
      setActionInProgress(null)
    }
  }

  const handleResolve = async (id: string) => {
    setActionInProgress(id)

    try {
      await api.resolveAlert(id)
      toast.success(t("active.toastResolved"))
      await fetchData(true)
      setSelectedAlerts((prev) => {
        const next = new Set(prev)
        next.delete(id)
        return next
      })
    } catch (error) {
      toastApiError(error, t("active.toastResolveError"))
    } finally {
      setActionInProgress(null)
    }
  }

  const handleBulkAcknowledge = async () => {
    if (selectedAlerts.size === 0) return

    const ids = Array.from(selectedAlerts)
    setActionInProgress("bulk")

    try {
      await Promise.all(ids.map((id) => api.acknowledgeAlert(id)))
      toast.success(`${ids.length} ${t("active.toastBulkAcknowledged")}`)
      await fetchData(true)
      setSelectedAlerts(new Set())
    } catch (error) {
      toastApiError(error, t("active.toastBulkAckError"))
    } finally {
      setActionInProgress(null)
    }
  }

  const handleBulkResolve = async () => {
    if (selectedAlerts.size === 0) return

    const ids = Array.from(selectedAlerts)
    setActionInProgress("bulk")

    try {
      await Promise.all(ids.map((id) => api.resolveAlert(id)))
      toast.success(`${ids.length} ${t("active.toastBulkResolved")}`)
      await fetchData(true)
      setSelectedAlerts(new Set())
    } catch (error) {
      toastApiError(error, t("active.toastBulkResolveError"))
    } finally {
      setActionInProgress(null)
    }
  }

  const handleToggleSelect = (id: string) => {
    setSelectedAlerts((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  const handleSelectAll = () => {
    if (selectedAlerts.size === filteredAlerts.length) {
      setSelectedAlerts(new Set())
    } else {
      setSelectedAlerts(new Set(filteredAlerts.map((alert) => alert.id)))
    }
  }

  const handleViewDetails = (alert: AlertEventResponse) => {
    router.push(withLocalePrefix(`/alerts/${alert.id}`, locale))
  }

  const pagination = useServerOffsetPagination({
    offset,
    limit,
    currentItemsCount: alerts.length,
    totalItems: alertsTotal,
  })
  const allSelected = filteredAlerts.length > 0 && selectedAlerts.size === filteredAlerts.length

  // 生成趋势数据（按小时聚合）
  const trendData = useMemo(() => {
    if (alerts.length === 0) return []

    const now = new Date()
    const hours = 24
    const buckets: Record<string, { time: string; count: number; timestamp: number }> = {}

    // 初始化24小时的时间桶
    for (let i = hours - 1; i >= 0; i--) {
      const time = new Date(now.getTime() - i * 60 * 60 * 1000)
      const key = `${time.getHours()}:00`
      buckets[key] = {
        time: key,
        count: 0,
        timestamp: time.getTime(),
      }
    }

    // 统计每个小时的告警数量
    alerts.forEach((alert) => {
      const alertTime = new Date(alert.timestamp)
      const hourKey = `${alertTime.getHours()}:00`
      if (buckets[hourKey]) {
        buckets[hourKey].count++
      }
    })

    return Object.values(buckets).sort((a, b) => a.timestamp - b.timestamp)
  }, [alerts])

  // 生成严重程度分布数据
  const severityData = useMemo(() => {
    const data = [
      { name: "Critical", value: 0, color: "#ef4444" },
      { name: "Warning", value: 0, color: "#f59e0b" },
      { name: "Info", value: 0, color: "#3b82f6" },
    ]

    alerts.forEach((alert) => {
      const severity = alert.severity.toLowerCase()
      if (severity === "critical") data[0].value++
      else if (severity === "warning") data[1].value++
      else if (severity === "info") data[2].value++
    })

    return data.filter((d) => d.value > 0)
  }, [alerts])

  return (
    <div className="space-y-6">
      <ActiveAlertsTopControls
        autoRefresh={autoRefresh}
        loading={loading}
        refreshing={refreshing}
        onAutoRefreshChange={setAutoRefresh}
        onRefresh={() => fetchData(true)}
      />

      <div className="grid gap-4 md:grid-cols-4">
        {loading ? (
          <>
            {[1, 2, 3, 4].map((i) => (
              <Card key={i} className="glass-card">
                <CardHeader className="pb-2">
                  <Skeleton className="h-4 w-24 mb-2" />
                  <Skeleton className="h-9 w-16" />
                </CardHeader>
              </Card>
            ))}
          </>
        ) : (
          <>
            <Card className="glass-card">
              <CardHeader className="pb-2">
                <CardDescription>{t("active.summaryTotal")}</CardDescription>
                <CardTitle className="text-3xl">{summary?.total ?? 0}</CardTitle>
              </CardHeader>
            </Card>
            <Card className="glass-card">
              <CardHeader className="pb-2">
                <CardDescription>{t("active.summaryActive")}</CardDescription>
                <CardTitle className="text-3xl text-blue-600">{summary?.active ?? 0}</CardTitle>
              </CardHeader>
            </Card>
            <Card className="glass-card">
              <CardHeader className="pb-2">
                <CardDescription>{t("active.summaryCritical")}</CardDescription>
                <CardTitle className="text-3xl text-red-600">
                  {summary?.by_severity?.critical ?? 0}
                </CardTitle>
              </CardHeader>
            </Card>
            <Card className="glass-card">
              <CardHeader className="pb-2">
                <CardDescription>{t("active.summaryWarning")}</CardDescription>
                <CardTitle className="text-3xl text-amber-600">
                  {summary?.by_severity?.warning ?? 0}
                </CardTitle>
              </CardHeader>
            </Card>
          </>
        )}
      </div>

      {!loading && alerts.length > 0 && (
        <div className="grid gap-4 md:grid-cols-2">
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="text-lg">{t("active.trendChart")}</CardTitle>
              <CardDescription>{t("active.last24Hours")}</CardDescription>
            </CardHeader>
            <CardContent>
              {trendData.length > 0 ? (
                <ResponsiveContainer width="100%" height={200}>
                  <AreaChart data={trendData}>
                    <defs>
                      <linearGradient id="colorAlerts" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                    <XAxis
                      dataKey="time"
                      tick={{ fontSize: 12 }}
                      tickLine={false}
                      axisLine={{ stroke: "#e5e7eb", opacity: 0.3 }}
                    />
                    <YAxis
                      tick={{ fontSize: 12 }}
                      tickLine={false}
                      axisLine={{ stroke: "#e5e7eb", opacity: 0.3 }}
                    />
                    <Tooltip
                      contentStyle={{
                        background: "rgba(255, 255, 255, 0.95)",
                        border: "1px solid #e5e7eb",
                        borderRadius: "8px",
                        padding: "8px",
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="count"
                      stroke="#3b82f6"
                      strokeWidth={2}
                      fill="url(#colorAlerts)"
                      name={t("active.alertsCount")}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[200px] flex items-center justify-center text-muted-foreground text-sm">
                  {t("active.noChartData")}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="text-lg">{t("active.severityDistribution")}</CardTitle>
              <CardDescription>按严重程度分类统计</CardDescription>
            </CardHeader>
            <CardContent>
              {severityData.length > 0 ? (
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={severityData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={(entry) => `${entry.name}: ${entry.value}`}
                      outerRadius={70}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {severityData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        background: "rgba(255, 255, 255, 0.95)",
                        border: "1px solid #e5e7eb",
                        borderRadius: "8px",
                        padding: "8px",
                      }}
                    />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[200px] flex items-center justify-center text-muted-foreground text-sm">
                  {t("active.noChartData")}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      <Card className="glass-card">
        <ActiveAlertsListHeader searchQuery={searchQuery} onSearchQueryChange={setSearchQuery} />
        <CardContent>
          {selectedAlerts.size > 0 && (
            <div className="mb-4 flex items-center justify-between rounded-lg border border-blue-500/30 bg-blue-500/10 p-3">
              <div className="flex items-center gap-2 text-sm">
                <CheckCircle className="h-4 w-4 text-blue-600" />
                <span className="font-medium">
                  {selectedAlerts.size} {t("active.selected")}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleBulkAcknowledge}
                  disabled={actionInProgress === "bulk"}
                >
                  {actionInProgress === "bulk" ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <CheckCircle className="mr-2 h-4 w-4" />
                  )}
                  {t("active.bulkAcknowledge")}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleBulkResolve}
                  disabled={actionInProgress === "bulk"}
                >
                  {actionInProgress === "bulk" ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <CheckCheck className="mr-2 h-4 w-4" />
                  )}
                  {t("active.bulkResolve")}
                </Button>
              </div>
            </div>
          )}

          <div className="overflow-hidden rounded-lg border border-white/10">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <Checkbox
                      checked={allSelected}
                      onCheckedChange={handleSelectAll}
                      disabled={loading || filteredAlerts.length === 0}
                    />
                  </TableHead>
                  <TableHead>{t("active.colSeverity")}</TableHead>
                  <TableHead>{t("active.colAgent")}</TableHead>
                  <TableHead>{t("active.colMessage")}</TableHead>
                  <TableHead>{t("active.colTime")}</TableHead>
                  <TableHead className="text-right">{t("active.colActions")}</TableHead>
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
                    <TableCell colSpan={6} className="h-40 text-center">
                      <div className="flex flex-col items-center gap-2 text-muted-foreground">
                        <CheckCircle className="h-10 w-10 text-emerald-500" />
                        <p className="font-semibold">{t("active.emptyTitle")}</p>
                        <p className="text-sm">{t("active.emptyDescription")}</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  <AnimatePresence mode="popLayout">
                    {filteredAlerts.map((alert) => {
                      const SeverityIcon = getSeverityIcon(alert.severity)
                      const isActionDisabled = actionInProgress === alert.id || actionInProgress === "bulk"
                      const isSelected = selectedAlerts.has(alert.id)

                      return (
                        <motion.tr
                          key={alert.id}
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, x: -20 }}
                          transition={{ duration: 0.2 }}
                          className="group cursor-pointer hover:bg-muted/50"
                          onClick={(e) => {
                            if ((e.target as HTMLElement).closest('button, input[type="checkbox"]')) return
                            handleViewDetails(alert)
                          }}
                        >
                          <TableCell onClick={(e) => e.stopPropagation()}>
                            <Checkbox
                              checked={isSelected}
                              onCheckedChange={() => handleToggleSelect(alert.id)}
                              disabled={isActionDisabled}
                            />
                          </TableCell>
                          <TableCell>
                            <Badge className={getSeverityBadgeClass(alert.severity)}>
                              <SeverityIcon className="mr-1 h-3 w-3" />
                              {getSeverityLabel(alert.severity, t)}
                            </Badge>
                          </TableCell>
                          <TableCell className="font-mono text-xs">{alert.agent_id}</TableCell>
                          <TableCell className="max-w-xs truncate" title={alert.message}>
                            {alert.message}
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground">
                            {formatTimestamp(alert.timestamp, locale, t)}
                          </TableCell>
                          <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                            <div className="hidden items-center justify-end gap-1 sm:flex">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleViewDetails(alert)}
                                className="h-8 w-8"
                                title={t("active.viewDetails")}
                                aria-label={t("active.viewDetails")}
                              >
                                <ExternalLink className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleAcknowledge(alert.id)}
                                disabled={isActionDisabled || alert.status >= 2}
                                className="h-8 w-8"
                                title={t("active.btnAcknowledge")}
                                aria-label={t("active.btnAcknowledge")}
                              >
                                {actionInProgress === alert.id ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <CheckCircle className="h-4 w-4" />
                                )}
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleResolve(alert.id)}
                                disabled={isActionDisabled || alert.status === 3}
                                className="h-8 w-8"
                                title={t("active.btnResolve")}
                                aria-label={t("active.btnResolve")}
                              >
                                {actionInProgress === alert.id ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <CheckCheck className="h-4 w-4" />
                                )}
                              </Button>
                            </div>
                            <div className="flex justify-end sm:hidden">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8"
                                    aria-label={t("active.moreActions")}
                                  >
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-44">
                                  <DropdownMenuItem onClick={() => handleViewDetails(alert)}>
                                    <ExternalLink className="h-4 w-4" />
                                    {t("active.viewDetails")}
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() => handleAcknowledge(alert.id)}
                                    disabled={isActionDisabled || alert.status >= 2}
                                  >
                                    {actionInProgress === alert.id ? (
                                      <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                      <CheckCircle className="h-4 w-4" />
                                    )}
                                    {t("active.btnAcknowledge")}
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() => handleResolve(alert.id)}
                                    disabled={isActionDisabled || alert.status === 3}
                                  >
                                    {actionInProgress === alert.id ? (
                                      <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                      <CheckCheck className="h-4 w-4" />
                                    )}
                                    {t("active.btnResolve")}
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </TableCell>
                        </motion.tr>
                      )
                    })}
                  </AnimatePresence>
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
              summaryText={`${t("active.paginationPage", { page: Math.floor(offset / limit) + 1 })}${
                searchQuery ? ` • ${t("active.paginationFilteredResults", { count: filteredAlerts.length })}` : ""
              }`}
              pageIndicatorText=""
              prevLabel={t("active.paginationPrevious")}
              nextLabel={t("active.paginationNext")}
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
