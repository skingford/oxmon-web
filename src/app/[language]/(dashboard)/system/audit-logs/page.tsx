"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { Loader2, RefreshCw } from "lucide-react"
import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"
import { api } from "@/lib/api"
import { buildTranslatedPaginationTextBundle } from "@/lib/pagination-summary"
import { formatDateTimeByLocale } from "@/lib/date-time"
import type { AdminUserResponse, AuditLogItem, AuditSecuritySummary, AuditSecurityTimeseries, ListResponse } from "@/types/api"
import { useAppTranslations } from "@/hooks/use-app-translations"
import { useRequestState } from "@/hooks/use-request-state"
import { useServerOffsetPagination } from "@/hooks/use-server-offset-pagination"
import { withLocalePrefix } from "@/components/app-locale"
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
import { PaginationControls } from "@/components/ui/pagination-controls"
import { toastApiError } from "@/lib/toast"

type AuditLogsState = {
  auditLogsPage: ListResponse<AuditLogItem>
}

type AuditFilters = {
  userId: string
  action: string
  resourceType: string
  startTime: string
  endTime: string
}

const PAGE_LIMIT = 20

function getDefaultFilters(): AuditFilters {
  return {
    userId: "all",
    action: "all",
    resourceType: "",
    startTime: "",
    endTime: "",
  }
}

function toIsoTime(value: string) {
  if (!value.trim()) {
    return undefined
  }

  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) {
    return undefined
  }

  return parsed.toISOString()
}

function normalizeAuditAction(value: string | null | undefined) {
  return (value || "").trim().toUpperCase()
}

function resolveAuditActionBadgeVariant(action: string) {
  if (action === "CREATE") {
    return "success" as const
  }

  if (action === "UPDATE") {
    return "warning" as const
  }

  if (action === "DELETE") {
    return "destructive" as const
  }

  return "secondary" as const
}


function formatSecurityHourLabel(value: string, locale: string) {
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) {
    return value
  }

  return parsed.toLocaleTimeString(locale === "zh" ? "zh-CN" : "en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  })
}

export default function SystemAuditLogsPage() {
  const { t, locale } = useAppTranslations("system")
  const [draftFilters, setDraftFilters] = useState<AuditFilters>(getDefaultFilters)
  const [appliedFilters, setAppliedFilters] = useState<AuditFilters>(getDefaultFilters)
  const [offset, setOffset] = useState(0)
  const [users, setUsers] = useState<AdminUserResponse[]>([])
  const [securitySummary, setSecuritySummary] = useState<AuditSecuritySummary | null>(null)
  const [securityTimeseries, setSecurityTimeseries] = useState<AuditSecurityTimeseries | null>(null)
  const [securitySummaryLoading, setSecuritySummaryLoading] = useState(false)
  const {
    data,
    loading,
    refreshing,
    execute,
  } = useRequestState<AuditLogsState>({
    auditLogsPage: {
      items: [],
      total: 0,
      limit: PAGE_LIMIT,
      offset: 0,
    },
  })

  const fetchAdminUsers = useCallback(async () => {
    try {
      const allUsers = await api.listAdminUsers()
      setUsers(allUsers)
    } catch {
      setUsers([])
    }
  }, [])


  const fetchSecuritySummary = useCallback(async (silent = false) => {
    if (!silent) {
      setSecuritySummaryLoading(true)
    }

    try {
      const [summary, timeseries] = await Promise.all([
        api.getAuditSecuritySummary({ hours: 24 }),
        api.getAuditSecurityTimeseries({ hours: 24 }),
      ])
      setSecuritySummary(summary)
      setSecurityTimeseries(timeseries)
    } catch (error) {
      if (!silent) {
        toastApiError(error, t("auditLogsSecurityToastFetchError"))
      }
    } finally {
      setSecuritySummaryLoading(false)
    }
  }, [t])

  const fetchAuditLogs = useCallback(async (silent = false) => {
    await execute(
      async () => {
        const page = await api.listAuditLogsPage({
          user_id: appliedFilters.userId === "all" ? undefined : appliedFilters.userId,
          action: appliedFilters.action === "all" ? undefined : appliedFilters.action,
          resource_type: appliedFilters.resourceType.trim() || undefined,
          start_time: toIsoTime(appliedFilters.startTime),
          end_time: toIsoTime(appliedFilters.endTime),
          limit: PAGE_LIMIT,
          offset,
        })

        return {
          auditLogsPage: page,
        }
      },
      {
        silent,
        onError: (error) => {
          toastApiError(error, t("auditLogsToastFetchError"))
        },
      }
    )
  }, [appliedFilters.action, appliedFilters.endTime, appliedFilters.resourceType, appliedFilters.startTime, appliedFilters.userId, execute, offset, t])

  useEffect(() => {
    fetchAuditLogs()
    fetchSecuritySummary()
  }, [fetchAuditLogs, fetchSecuritySummary])

  useEffect(() => {
    fetchAdminUsers()
  }, [fetchAdminUsers])

  const pagination = useServerOffsetPagination({
    offset,
    limit: PAGE_LIMIT,
    currentItemsCount: data.auditLogsPage.items.length,
    totalItems: data.auditLogsPage.total,
  })

  const securityTrendData = useMemo(() => {
    return (securityTimeseries?.points || []).map((point) => ({
      hour: point.hour,
      hourLabel: formatSecurityHourLabel(point.hour, locale),
      loginSuccess: point.login_success_count,
      loginFailed: point.login_failed_count,
      lockTriggered: point.lock_triggered_count,
    }))
  }, [locale, securityTimeseries?.points])

  const actionStats = useMemo(() => {
    return data.auditLogsPage.items.reduce(
      (acc, item) => {
        const action = normalizeAuditAction(item.action)
        if (action === "CREATE") {
          acc.create += 1
        } else if (action === "UPDATE") {
          acc.update += 1
        } else if (action === "DELETE") {
          acc.delete += 1
        }
        return acc
      },
      { create: 0, update: 0, delete: 0 }
    )
  }, [data.auditLogsPage.items])

  const hasActiveFilters = Boolean(
    appliedFilters.userId !== "all" ||
      appliedFilters.action !== "all" ||
      appliedFilters.resourceType.trim() ||
      appliedFilters.startTime.trim() ||
      appliedFilters.endTime.trim()
  )

  const applyFilters = () => {
    setAppliedFilters(draftFilters)

    if (offset !== 0) {
      setOffset(0)
    }
  }

  const resetFilters = () => {
    const nextFilters = getDefaultFilters()
    setDraftFilters(nextFilters)
    setAppliedFilters(nextFilters)
    setOffset(0)
  }

  return (
    <div className="space-y-6 px-8 pb-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="space-y-1">
          <h2 className="text-2xl font-bold tracking-tight">{t("auditLogsTitle")}</h2>
          <p className="text-sm text-muted-foreground">{t("auditLogsDescription")}</p>
        </div>
        <Button
          type="button"
          variant="outline"
          onClick={() => {
            void Promise.all([fetchAuditLogs(true), fetchSecuritySummary(true)])
          }}
          disabled={refreshing || securitySummaryLoading}
        >
          {refreshing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
          {t("auditLogsRefreshButton")}
        </Button>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-medium">{t("auditLogsSecurityTitle")}</h3>
            <p className="text-sm text-muted-foreground">{t("auditLogsSecurityDescription")}</p>
          </div>
          {securitySummaryLoading ? <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" /> : null}
        </div>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>{t("auditLogsSecurityStatLoginSuccess")}</CardDescription>
              <CardTitle className="text-2xl text-emerald-600">{securitySummary?.login_success_count ?? "-"}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>{t("auditLogsSecurityStatLoginFailed")}</CardDescription>
              <CardTitle className="text-2xl text-amber-600">{securitySummary?.login_failed_count ?? "-"}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>{t("auditLogsSecurityStatLockTriggered")}</CardDescription>
              <CardTitle className="text-2xl text-red-600">{securitySummary?.lock_triggered_count ?? "-"}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>{t("auditLogsSecurityStatUniqueFailedIps")}</CardDescription>
              <CardTitle className="text-2xl">{securitySummary?.unique_failed_ips ?? "-"}</CardTitle>
            </CardHeader>
          </Card>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>{t("auditLogsSecurityTrendTitle")}</CardTitle>
            <CardDescription>{t("auditLogsSecurityTrendDescription")}</CardDescription>
          </CardHeader>
          <CardContent>
            {securityTrendData.length > 0 ? (
              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={securityTrendData} margin={{ top: 8, right: 16, bottom: 8, left: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                    <XAxis dataKey="hourLabel" tickLine={false} axisLine={false} minTickGap={24} />
                    <YAxis allowDecimals={false} tickLine={false} axisLine={false} width={36} />
                    <Tooltip
                      labelFormatter={(_, payload) => payload?.[0]?.payload?.hour ? formatDateTimeByLocale(payload[0].payload.hour, locale) : "-"}
                    />
                    <Legend />
                    <Line type="monotone" dataKey="loginSuccess" stroke="#16a34a" strokeWidth={2} dot={false} name={t("auditLogsSecurityStatLoginSuccess")} />
                    <Line type="monotone" dataKey="loginFailed" stroke="#d97706" strokeWidth={2} dot={false} name={t("auditLogsSecurityStatLoginFailed")} />
                    <Line type="monotone" dataKey="lockTriggered" stroke="#dc2626" strokeWidth={2} dot={false} name={t("auditLogsSecurityStatLockTriggered")} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="flex h-48 items-center justify-center rounded-md border border-dashed text-sm text-muted-foreground">
                {t("auditLogsSecurityTrendEmpty")}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>{t("auditLogsStatTotal")}</CardDescription>
            <CardTitle className="text-2xl">{data.auditLogsPage.total}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>{t("auditLogsStatCreate")}</CardDescription>
            <CardTitle className="text-2xl text-emerald-600">{actionStats.create}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>{t("auditLogsStatUpdate")}</CardDescription>
            <CardTitle className="text-2xl text-amber-600">{actionStats.update}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>{t("auditLogsStatDelete")}</CardDescription>
            <CardTitle className="text-2xl text-red-600">{actionStats.delete}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t("auditLogsFiltersTitle")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
            <div className="space-y-2">
              <Label htmlFor="audit-user">{t("auditLogsFieldUser")}</Label>
              <Select value={draftFilters.userId} onValueChange={(value) => setDraftFilters((prev) => ({ ...prev, userId: value }))}>
                <SelectTrigger id="audit-user">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("auditLogsFilterUserAll")}</SelectItem>
                  {users.map((user) => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.username}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="audit-action">{t("auditLogsFieldAction")}</Label>
              <Select value={draftFilters.action} onValueChange={(value) => setDraftFilters((prev) => ({ ...prev, action: value }))}>
                <SelectTrigger id="audit-action">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("auditLogsFilterActionAll")}</SelectItem>
                  <SelectItem value="CREATE">CREATE</SelectItem>
                  <SelectItem value="UPDATE">UPDATE</SelectItem>
                  <SelectItem value="DELETE">DELETE</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="audit-resource-type">{t("auditLogsFieldResourceType")}</Label>
              <Input
                id="audit-resource-type"
                value={draftFilters.resourceType}
                onChange={(event) => setDraftFilters((prev) => ({ ...prev, resourceType: event.target.value }))}
                placeholder={t("auditLogsFieldResourceTypePlaceholder")}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="audit-start">{t("auditLogsFieldStartTime")}</Label>
              <Input
                id="audit-start"
                type="datetime-local"
                value={draftFilters.startTime}
                onChange={(event) => setDraftFilters((prev) => ({ ...prev, startTime: event.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="audit-end">{t("auditLogsFieldEndTime")}</Label>
              <Input
                id="audit-end"
                type="datetime-local"
                value={draftFilters.endTime}
                onChange={(event) => setDraftFilters((prev) => ({ ...prev, endTime: event.target.value }))}
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button type="button" onClick={applyFilters}>{t("auditLogsApplyFilters")}</Button>
            <Button type="button" variant="outline" onClick={resetFilters}>{t("auditLogsClearFilters")}</Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("auditLogsTableTitle")}</CardTitle>
          <CardDescription>{t("auditLogsTableDescription")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("auditLogsTableColCreatedAt")}</TableHead>
                  <TableHead>{t("auditLogsTableColUser")}</TableHead>
                  <TableHead>{t("auditLogsTableColAction")}</TableHead>
                  <TableHead>{t("auditLogsTableColResourceType")}</TableHead>
                  <TableHead>{t("auditLogsTableColResourceId")}</TableHead>
                  <TableHead>{t("auditLogsTableColIpAddress")}</TableHead>
                  <TableHead>{t("auditLogsTableColActions")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                      {t("auditLogsTableLoading")}
                    </TableCell>
                  </TableRow>
                ) : data.auditLogsPage.items.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                      {hasActiveFilters ? t("auditLogsTableEmptyFiltered") : t("auditLogsTableEmpty")}
                    </TableCell>
                  </TableRow>
                ) : (
                  data.auditLogsPage.items.map((item) => {
                    const action = normalizeAuditAction(item.action)

                    return (
                      <TableRow key={item.id}>
                        <TableCell>{formatDateTimeByLocale(item.created_at, locale, item.created_at || "-", { hour12: false })}</TableCell>
                        <TableCell>{item.username || item.user_id || t("auditLogsUnknownValue")}</TableCell>
                        <TableCell>
                          <Badge variant={resolveAuditActionBadgeVariant(action)}>{action || t("auditLogsUnknownValue")}</Badge>
                        </TableCell>
                        <TableCell>{item.resource_type || t("auditLogsUnknownValue")}</TableCell>
                        <TableCell className="font-mono text-xs">{item.resource_id || t("auditLogsUnknownValue")}</TableCell>
                        <TableCell className="font-mono text-xs">{item.ip_address || t("auditLogsUnknownValue")}</TableCell>
                        <TableCell>
                          <Button asChild variant="outline" size="sm">
                            <Link href={withLocalePrefix(`/system/audit-logs/${item.id}`, locale)}>
                              {t("auditLogsActionDetails")}
                            </Link>
                          </Button>
                        </TableCell>
                      </TableRow>
                    )
                  })
                )}
              </TableBody>
            </Table>
          </div>

          <PaginationControls
            className="mt-4"
            pageSize={PAGE_LIMIT}
            {...buildTranslatedPaginationTextBundle({
              t,
              summaryKey: "auditLogsPaginationSummary",
              total: data.auditLogsPage.total,
              start: pagination.rangeStart,
              end: pagination.rangeEnd,
              pageKey: "auditLogsPaginationPage",
              currentPage: pagination.currentPage,
              totalPages: pagination.totalPages,
              prevKey: "auditLogsPaginationPrev",
              nextKey: "auditLogsPaginationNext",
            })}
            onPrevPage={() => setOffset((previous) => Math.max(0, previous - PAGE_LIMIT))}
            onNextPage={() => setOffset((previous) => previous + PAGE_LIMIT)}
            prevDisabled={!pagination.canGoPrev || loading}
            nextDisabled={!pagination.canGoNext || loading}
          />
        </CardContent>
      </Card>
    </div>
  )
}
