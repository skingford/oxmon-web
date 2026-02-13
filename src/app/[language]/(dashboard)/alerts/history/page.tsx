"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { api, getApiErrorMessage } from "@/lib/api"
import { AlertEventResponse } from "@/types/api"
import { useAppTranslations } from "@/hooks/use-app-translations"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { FilterToolbar } from "@/components/ui/filter-toolbar"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
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
  AlertTriangle,
  CheckCircle,
  Loader2,
  Info,
  XCircle,
  Filter,
  X,
} from "lucide-react"
import { toast } from "sonner"
import { motion } from "framer-motion"

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

function getStatusBadge(alert: AlertEventResponse, t: any) {
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
      const params: any = { limit, offset }

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
      setAlerts(data)
    } catch (error) {
      toast.error(getApiErrorMessage(error, t("history.toastFetchError")))
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

  const canGoPrev = offset > 0
  const canGoNext = alerts.length >= limit

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">{t("history.title")}</h2>
        <p className="text-sm text-muted-foreground">{t("history.description")}</p>
      </div>

      <Card className="glass-card">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Filter className="h-5 w-5" />
                {t("history.filtersTitle")}
              </CardTitle>
              <CardDescription>{t("history.filtersDescription")}</CardDescription>
            </div>
            {hasActiveFilters && (
              <Button variant="ghost" size="sm" onClick={handleResetFilters}>
                <X className="mr-2 h-4 w-4" />
                {t("history.clearAllFilters")}
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <FilterToolbar
            className="gap-4 md:grid-cols-2 lg:grid-cols-5 xl:grid-cols-5"
            search={{
              value: filterAgentId,
              onValueChange: setFilterAgentId,
              placeholder: t("history.filterAgentPlaceholder"),
              label: t("history.filterAgent"),
              inputClassName: "h-10",
            }}
          >
            <div className="space-y-2">
              <Label htmlFor="filter-severity">{t("history.filterSeverity")}</Label>
              <Select value={filterSeverity} onValueChange={setFilterSeverity}>
                <SelectTrigger id="filter-severity" className="h-10 w-full bg-background">
                  <SelectValue placeholder={t("history.filterSelectAllPlaceholder")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("history.statusAll")}</SelectItem>
                  <SelectItem value="critical">{t("severity.critical")}</SelectItem>
                  <SelectItem value="warning">{t("severity.warning")}</SelectItem>
                  <SelectItem value="info">{t("severity.info")}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="filter-status">{t("history.filterStatus")}</Label>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger id="filter-status" className="h-10 w-full bg-background">
                  <SelectValue placeholder={t("history.filterSelectAllPlaceholder")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("history.statusAll")}</SelectItem>
                  <SelectItem value="resolved">{t("history.statusResolved")}</SelectItem>
                  <SelectItem value="acknowledged">{t("history.statusAcknowledged")}</SelectItem>
                  <SelectItem value="open">{t("history.statusOpen")}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="filter-from">{t("history.filterTimeFrom")}</Label>
              <Input
                id="filter-from"
                type="datetime-local"
                value={filterTimeFrom}
                onChange={(e) => setFilterTimeFrom(e.target.value)}
                className="h-10"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="filter-to">{t("history.filterTimeTo")}</Label>
              <Input
                id="filter-to"
                type="datetime-local"
                value={filterTimeTo}
                onChange={(e) => setFilterTimeTo(e.target.value)}
                className="h-10"
              />
            </div>
          </FilterToolbar>

          <div className="mt-4 flex items-center gap-2">
            <Button onClick={handleApplyFilters}>
              <Filter className="mr-2 h-4 w-4" />
              {t("history.filterApply")}
            </Button>
            <Button variant="outline" onClick={handleResetFilters}>
              {t("history.filterReset")}
            </Button>
          </div>

          {hasActiveFilters && (
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <span className="text-xs text-muted-foreground">{t("history.activeFiltersLabel")}</span>
              {filterAgentId && (
                <Badge variant="secondary" className="gap-1">
                  {t("history.activeFilterAgent", { value: filterAgentId })}
                  <button
                    onClick={() => setFilterAgentId("")}
                    className="ml-1 hover:text-foreground"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              )}
              {filterSeverity && filterSeverity !== "all" && (
                <Badge variant="secondary" className="gap-1">
                  {t("history.activeFilterSeverity", { value: t(`severity.${filterSeverity}` as any) })}
                  <button
                    onClick={() => setFilterSeverity("")}
                    className="ml-1 hover:text-foreground"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              )}
              {filterStatus && filterStatus !== "all" && (
                <Badge variant="secondary" className="gap-1">
                  {t("history.activeFilterStatus", {
                    value: t(`history.status${filterStatus.charAt(0).toUpperCase() + filterStatus.slice(1)}` as any),
                  })}
                  <button
                    onClick={() => setFilterStatus("")}
                    className="ml-1 hover:text-foreground"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              )}
              {filterTimeFrom && (
                <Badge variant="secondary" className="gap-1">
                  {t("history.activeFilterStart", { value: new Date(filterTimeFrom).toLocaleDateString() })}
                  <button
                    onClick={() => setFilterTimeFrom("")}
                    className="ml-1 hover:text-foreground"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              )}
              {filterTimeTo && (
                <Badge variant="secondary" className="gap-1">
                  {t("history.activeFilterEnd", { value: new Date(filterTimeTo).toLocaleDateString() })}
                  <button
                    onClick={() => setFilterTimeTo("")}
                    className="ml-1 hover:text-foreground"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              )}
            </div>
          )}
        </CardContent>
      </Card>

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
                            {t(`severity.${alert.severity.toLowerCase()}` as any)}
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
            <div className="mt-4 flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                {t("history.paginationPage", { page: Math.floor(offset / limit) + 1 })}
                {filteredAlerts.length !== alerts.length &&
                  ` • ${t("history.paginationShown", { filtered: filteredAlerts.length, total: alerts.length })}`}
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setOffset(Math.max(0, offset - limit))}
                  disabled={!canGoPrev}
                >
                  {t("history.paginationPrevious")}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setOffset(offset + limit)}
                  disabled={!canGoNext}
                >
                  {t("history.paginationNext")}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
