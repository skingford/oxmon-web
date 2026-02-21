"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { api, getApiErrorMessage } from "@/lib/api"
import {
  NotificationLogItem,
  NotificationLogSummaryQueryParams,
} from "@/types/api"
import { useAppTranslations } from "@/hooks/use-app-translations"
import { withLocalePrefix } from "@/components/app-locale"
import { useRequestState } from "@/hooks/use-request-state"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Loader2, RefreshCw } from "lucide-react"
import { toast } from "sonner"

type LogsQueryState = {
  items: NotificationLogItem[]
  total: number
  summary: {
    total: number
    success: number
    failed: number
  }
}

type LogFilters = {
  channelId: string
  channelType: string
  status: string
  alertEventId: string
  ruleId: string
  agentId: string
  startTime: string
  endTime: string
}

const PAGE_LIMIT = 20

function toUnixSeconds(value: string) {
  if (!value.trim()) {
    return undefined
  }

  const timestamp = Date.parse(value)

  if (!Number.isFinite(timestamp)) {
    return undefined
  }

  return Math.floor(timestamp / 1000)
}

function getDefaultFilters(): LogFilters {
  return {
    channelId: "",
    channelType: "",
    status: "all",
    alertEventId: "",
    ruleId: "",
    agentId: "",
    startTime: "",
    endTime: "",
  }
}

export default function NotificationLogsPage() {
  const { t, locale } = useAppTranslations("pages")
  const {
    data,
    loading,
    refreshing,
    execute,
  } = useRequestState<LogsQueryState>({
    items: [],
    total: 0,
    summary: {
      total: 0,
      success: 0,
      failed: 0,
    },
  })

  const [filters, setFilters] = useState<LogFilters>(getDefaultFilters)
  const [offset, setOffset] = useState(0)

  const summaryParams = useMemo<NotificationLogSummaryQueryParams>(() => {
    const startTime = toUnixSeconds(filters.startTime)
    const endTime = toUnixSeconds(filters.endTime)

    return {
      channel_id: filters.channelId.trim() || undefined,
      channel_type: filters.channelType.trim() || undefined,
      start_time: startTime,
      end_time: endTime,
    }
  }, [filters.channelId, filters.channelType, filters.startTime, filters.endTime])

  const fetchLogs = useCallback(
    async (silent = false) => {
      await execute(
        async () => {
          const [logs, summary] = await Promise.all([
            api.getNotificationLogs({
              channel_id: filters.channelId.trim() || undefined,
              channel_type: filters.channelType.trim() || undefined,
              status: filters.status === "all" ? undefined : filters.status,
              alert_event_id: filters.alertEventId.trim() || undefined,
              rule_id: filters.ruleId.trim() || undefined,
              agent_id: filters.agentId.trim() || undefined,
              start_time: summaryParams.start_time,
              end_time: summaryParams.end_time,
              limit: PAGE_LIMIT,
              offset,
            }),
            api.getNotificationLogSummary(summaryParams),
          ])

          return {
            items: logs.items,
            total: logs.total,
            summary,
          }
        },
        {
          silent,
          onError: (error) => {
            toast.error(getApiErrorMessage(error, t("notifications.logsToastFetchError")))
          },
        }
      )
    },
    [execute, filters, offset, summaryParams, t]
  )

  useEffect(() => {
    fetchLogs()
  }, [fetchLogs])

  const totalPages = Math.max(1, Math.ceil(data.total / PAGE_LIMIT))
  const currentPage = Math.floor(offset / PAGE_LIMIT) + 1
  const rangeStart = data.total === 0 ? 0 : offset + 1
  const rangeEnd = Math.min(offset + data.items.length, data.total)

  const formatDateTime = (value: string) => {
    const parsed = Date.parse(value)

    if (!Number.isFinite(parsed)) {
      return t("notifications.logsUnknownValue")
    }

    return new Date(parsed).toLocaleString(locale === "zh" ? "zh-CN" : "en-US")
  }

  const getStatusBadgeClassName = (status: string) => {
    if (status === "success") {
      return "border-emerald-500/30 bg-emerald-500/10 text-emerald-600"
    }

    if (status === "failed") {
      return "border-red-500/30 bg-red-500/10 text-red-600"
    }

    return "border-muted bg-muted text-muted-foreground"
  }

  const applyFilters = () => {
    if (offset === 0) {
      fetchLogs(true)
      return
    }

    setOffset(0)
  }

  const resetFilters = () => {
    setFilters(getDefaultFilters())
    setOffset(0)
  }

  const updateFilter = <Key extends keyof LogFilters>(key: Key, value: LogFilters[Key]) => {
    setFilters((previous) => ({
      ...previous,
      [key]: value,
    }))
  }

  const hasActiveFilters = Boolean(
    filters.channelId.trim() ||
      filters.channelType.trim() ||
      filters.status !== "all" ||
      filters.alertEventId.trim() ||
      filters.ruleId.trim() ||
      filters.agentId.trim() ||
      filters.startTime.trim() ||
      filters.endTime.trim()
  )

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="space-y-1">
          <h2 className="text-2xl font-bold tracking-tight">{t("notifications.logsTitle")}</h2>
          <p className="text-sm text-muted-foreground">{t("notifications.logsDescription")}</p>
        </div>
        <Button
          type="button"
          variant="outline"
          onClick={() => fetchLogs(true)}
          disabled={refreshing}
        >
          {refreshing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
          {t("notifications.logsRefreshButton")}
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>{t("notifications.logsStatTotal")}</CardDescription>
            <CardTitle className="text-2xl">{data.summary.total}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>{t("notifications.logsStatSuccess")}</CardDescription>
            <CardTitle className="text-2xl text-emerald-600">{data.summary.success}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>{t("notifications.logsStatFailed")}</CardDescription>
            <CardTitle className="text-2xl text-red-600">{data.summary.failed}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>{t("notifications.logsStatPageCount")}</CardDescription>
            <CardTitle className="text-2xl">{data.items.length}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t("notifications.logsFiltersTitle")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <div className="space-y-2">
              <Label htmlFor="channel-id">{t("notifications.logsFieldChannelId")}</Label>
              <Input
                id="channel-id"
                value={filters.channelId}
                onChange={(event) => updateFilter("channelId", event.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="channel-type">{t("notifications.logsFieldChannelType")}</Label>
              <Input
                id="channel-type"
                value={filters.channelType}
                onChange={(event) => updateFilter("channelType", event.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="status">{t("notifications.logsFieldStatus")}</Label>
              <Select value={filters.status} onValueChange={(value) => updateFilter("status", value)}>
                <SelectTrigger id="status" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("notifications.logsStatusAll")}</SelectItem>
                  <SelectItem value="success">{t("notifications.logsStatusSuccess")}</SelectItem>
                  <SelectItem value="failed">{t("notifications.logsStatusFailed")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="agent-id">{t("notifications.logsFieldAgentId")}</Label>
              <Input
                id="agent-id"
                value={filters.agentId}
                onChange={(event) => updateFilter("agentId", event.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="alert-event-id">{t("notifications.logsFieldAlertEventId")}</Label>
              <Input
                id="alert-event-id"
                value={filters.alertEventId}
                onChange={(event) => updateFilter("alertEventId", event.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="rule-id">{t("notifications.logsFieldRuleId")}</Label>
              <Input
                id="rule-id"
                value={filters.ruleId}
                onChange={(event) => updateFilter("ruleId", event.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="start-time">{t("notifications.logsFieldStartTime")}</Label>
              <Input
                id="start-time"
                type="datetime-local"
                value={filters.startTime}
                onChange={(event) => updateFilter("startTime", event.target.value)}
                className="logs-filter-datetime"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="end-time">{t("notifications.logsFieldEndTime")}</Label>
              <Input
                id="end-time"
                type="datetime-local"
                value={filters.endTime}
                onChange={(event) => updateFilter("endTime", event.target.value)}
                className="logs-filter-datetime"
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button type="button" onClick={applyFilters}>{t("notifications.logsApplyFilters")}</Button>
            <Button type="button" variant="outline" onClick={resetFilters}>{t("notifications.logsClearFilters")}</Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("notifications.logsTableTitle")}</CardTitle>
          <CardDescription>{t("notifications.logsTableDescription")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("notifications.logsTableColCreatedAt")}</TableHead>
                  <TableHead>{t("notifications.logsTableColStatus")}</TableHead>
                  <TableHead>{t("notifications.logsTableColChannel")}</TableHead>
                  <TableHead>{t("notifications.logsTableColRule")}</TableHead>
                  <TableHead>{t("notifications.logsTableColSeverity")}</TableHead>
                  <TableHead>{t("notifications.logsTableColError")}</TableHead>
                  <TableHead>{t("notifications.logsTableColActions")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                      {t("notifications.logsTableLoading")}
                    </TableCell>
                  </TableRow>
                ) : data.items.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                      {hasActiveFilters ? t("notifications.logsTableEmptyFiltered") : t("notifications.logsTableEmpty")}
                    </TableCell>
                  </TableRow>
                ) : (
                  data.items.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>{formatDateTime(item.created_at)}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={getStatusBadgeClassName(item.status)}>
                          {item.status === "success"
                            ? t("notifications.logsStatusSuccess")
                            : item.status === "failed"
                              ? t("notifications.logsStatusFailed")
                              : item.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <p className="font-medium">{item.channel_name || t("notifications.logsUnknownValue")}</p>
                          <p className="text-xs text-muted-foreground">{item.channel_type}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <p className="font-medium">{item.rule_name || t("notifications.logsUnknownValue")}</p>
                          <p className="text-xs text-muted-foreground">{item.rule_id}</p>
                        </div>
                      </TableCell>
                      <TableCell>{item.severity || t("notifications.logsUnknownValue")}</TableCell>
                      <TableCell className="max-w-[280px] truncate" title={item.error_message || undefined}>
                        {item.error_message || t("notifications.logsUnknownValue")}
                      </TableCell>
                      <TableCell>
                        <Button asChild variant="outline" size="sm">
                          <Link href={withLocalePrefix(`/notifications/logs/${item.id}`, locale)}>
                            {t("notifications.logsActionDetails")}
                          </Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-muted-foreground">
              {t("notifications.logsPaginationSummary", {
                total: data.total,
                start: rangeStart,
                end: rangeEnd,
              })}
            </p>
            <div className="flex items-center gap-2">
              <p className="text-sm text-muted-foreground">
                {t("notifications.logsPaginationPage", {
                  page: currentPage,
                  total: totalPages,
                })}
              </p>
              <Button
                type="button"
                variant="outline"
                onClick={() => setOffset((previous) => Math.max(0, previous - PAGE_LIMIT))}
                disabled={offset === 0 || loading}
              >
                {t("notifications.logsPaginationPrev")}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => setOffset((previous) => previous + PAGE_LIMIT)}
                disabled={offset + PAGE_LIMIT >= data.total || loading}
              >
                {t("notifications.logsPaginationNext")}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
