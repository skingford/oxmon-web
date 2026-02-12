"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { api, getApiErrorMessage } from "@/lib/api"
import { type DashboardOverview } from "@/types/api"
import { withLocalePrefix } from "@/components/app-locale"
import { useAppLocale } from "@/hooks/use-app-locale"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import {
  AlertCircle,
  AlertTriangle,
  Bell,
  CheckCircle2,
  Clock3,
  HardDrive,
  RefreshCw,
  Server,
  ShieldCheck,
  ShieldX,
} from "lucide-react"
import { toast } from "sonner"

function formatUptime(seconds: number) {
  if (!Number.isFinite(seconds) || seconds < 0) {
    return "-"
  }

  const days = Math.floor(seconds / 86400)
  const hours = Math.floor((seconds % 86400) / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)

  if (days > 0) {
    return `${days} 天 ${hours} 小时`
  }

  if (hours > 0) {
    return `${hours} 小时 ${minutes} 分钟`
  }

  return `${minutes} 分钟`
}

function formatBytes(bytes: number) {
  if (!Number.isFinite(bytes) || bytes < 0) {
    return "-"
  }

  if (bytes === 0) {
    return "0 B"
  }

  const units = ["B", "KB", "MB", "GB", "TB", "PB"]
  const exponent = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1)
  const value = bytes / Math.pow(1024, exponent)

  return `${value.toFixed(value >= 100 ? 0 : value >= 10 ? 1 : 2)} ${units[exponent]}`
}

function formatPercent(numerator: number, denominator: number) {
  if (denominator <= 0) {
    return 0
  }

  return Math.round((numerator / denominator) * 100)
}

function DashboardOverviewSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <Card key={index}>
            <CardHeader className="space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-7 w-28" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-3 w-2/3" />
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="space-y-2">
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-3 w-56" />
          </CardHeader>
          <CardContent className="space-y-3">
            {Array.from({ length: 4 }).map((_, index) => (
              <Skeleton key={index} className="h-9 w-full" />
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="space-y-2">
            <Skeleton className="h-4 w-44" />
            <Skeleton className="h-3 w-52" />
          </CardHeader>
          <CardContent className="space-y-3">
            {Array.from({ length: 5 }).map((_, index) => (
              <Skeleton key={index} className="h-6 w-full" />
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default function DashboardPage() {
  const locale = useAppLocale()
  const [overview, setOverview] = useState<DashboardOverview | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const alertsPath = useMemo(() => withLocalePrefix("/alerts", locale), [locale])
  const certificatesPath = useMemo(() => withLocalePrefix("/certificates", locale), [locale])
  const systemPath = useMemo(() => withLocalePrefix("/system", locale), [locale])

  const fetchOverview = useCallback(async (silent = false) => {
    if (silent) {
      setRefreshing(true)
    } else {
      setLoading(true)
    }

    try {
      const data = await api.getDashboardOverview()
      setOverview(data)
    } catch (error) {
      toast.error(getApiErrorMessage(error, "加载仪表盘概览失败"))
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => {
    fetchOverview()
  }, [fetchOverview])

  const onlineRate = useMemo(() => {
    if (!overview) {
      return 0
    }

    return formatPercent(overview.active_agents, overview.total_agents)
  }, [overview])

  const severityStats = useMemo(() => {
    if (!overview) {
      return []
    }

    const predefinedOrder = ["critical", "warning", "info"]
    const allEntries = Object.entries(overview.alerts_by_severity || {})

    return allEntries.sort(([left], [right]) => {
      const leftIndex = predefinedOrder.indexOf(left.toLowerCase())
      const rightIndex = predefinedOrder.indexOf(right.toLowerCase())

      if (leftIndex === -1 && rightIndex === -1) {
        return left.localeCompare(right)
      }

      if (leftIndex === -1) {
        return 1
      }

      if (rightIndex === -1) {
        return -1
      }

      return leftIndex - rightIndex
    })
  }, [overview])

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">仪表盘概览</h1>
          <p className="text-sm text-muted-foreground">基于 /v1/dashboard/overview 的实时系统总览</p>
        </div>
        <Button variant="outline" onClick={() => fetchOverview(true)} disabled={refreshing}>
          <RefreshCw className={`mr-2 h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
          刷新
        </Button>
      </div>

      {loading && !overview ? (
        <DashboardOverviewSkeleton />
      ) : !overview ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-14 text-center">
            <AlertCircle className="h-10 w-10 text-destructive/70" />
            <div>
              <p className="text-base font-medium">无法加载仪表盘数据</p>
              <p className="text-sm text-muted-foreground">请检查登录状态或稍后重试</p>
            </div>
            <Button onClick={() => fetchOverview()}>
              <RefreshCw className="mr-2 h-4 w-4" />
              重试
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="pb-3">
                <CardDescription className="flex items-center gap-2">
                  <Server className="h-4 w-4" />
                  Agent 在线率
                </CardDescription>
                <CardTitle className="text-3xl font-semibold tabular-nums">
                  {overview.active_agents} / {overview.total_agents}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-end justify-between">
                  <span
                    className={`text-xl font-semibold ${onlineRate >= 50 ? "text-emerald-600" : "text-red-600"}`}
                  >
                    {onlineRate}%
                  </span>
                  <span className="text-xs text-muted-foreground">活跃 / 总数</span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    className={`h-full ${onlineRate >= 50 ? "bg-emerald-500" : "bg-red-500"}`}
                    style={{ width: `${Math.max(Math.min(onlineRate, 100), 0)}%` }}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardDescription className="flex items-center gap-2">
                  <Bell className="h-4 w-4" />
                  24 小时告警
                </CardDescription>
                <CardTitle className="text-3xl font-semibold tabular-nums">{overview.alerts_24h}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <p className="text-xs text-muted-foreground">按严重级别分布</p>
                <div className="flex flex-wrap gap-2">
                  {severityStats.length === 0 ? (
                    <Badge variant="secondary">暂无告警</Badge>
                  ) : (
                    severityStats.map(([severity, count]) => {
                      const key = severity.toLowerCase()
                      const badgeVariant =
                        key === "critical" ? "destructive" : key === "warning" ? "warning" : "secondary"

                      return (
                        <Badge key={severity} variant={badgeVariant} className="capitalize">
                          {severity}: {count}
                        </Badge>
                      )
                    })
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardDescription className="flex items-center gap-2">
                  <Clock3 className="h-4 w-4" />
                  服务运行时长
                </CardDescription>
                <CardTitle className="text-3xl font-semibold tabular-nums">
                  {formatUptime(overview.uptime_secs)}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-1 text-sm text-muted-foreground">
                <div className="flex items-center justify-between">
                  <span>存储分区</span>
                  <span className="font-medium text-foreground">{overview.partition_count}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>存储总大小</span>
                  <span className="font-medium text-foreground">{formatBytes(overview.storage_total_bytes)}</span>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">证书健康摘要</CardTitle>
                <CardDescription>来自 cert_summary 字段</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between rounded-md border p-3">
                  <div className="flex items-center gap-2 text-sm">
                    <ShieldCheck className="h-4 w-4 text-emerald-600" />
                    <span>有效证书</span>
                  </div>
                  <span className="text-sm font-semibold tabular-nums">{overview.cert_summary.valid}</span>
                </div>
                <div className="flex items-center justify-between rounded-md border p-3">
                  <div className="flex items-center gap-2 text-sm">
                    <ShieldX className="h-4 w-4 text-red-600" />
                    <span>无效证书</span>
                  </div>
                  <span className="text-sm font-semibold tabular-nums">{overview.cert_summary.invalid}</span>
                </div>
                <div className="flex items-center justify-between rounded-md border p-3">
                  <div className="flex items-center gap-2 text-sm">
                    <AlertTriangle className="h-4 w-4 text-amber-600" />
                    <span>即将过期</span>
                  </div>
                  <span className="text-sm font-semibold tabular-nums">{overview.cert_summary.expiring_soon}</span>
                </div>
                <div className="flex items-center justify-between rounded-md border p-3">
                  <div className="flex items-center gap-2 text-sm">
                    <CheckCircle2 className="h-4 w-4 text-primary" />
                    <span>监控域名总数</span>
                  </div>
                  <span className="text-sm font-semibold tabular-nums">{overview.cert_summary.total_domains}</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">快捷入口</CardTitle>
                <CardDescription>继续处理告警、证书和系统维护</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-3">
                <Link href={alertsPath} className="rounded-md border p-3 transition-colors hover:bg-muted/40">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">活跃告警</p>
                      <p className="text-xs text-muted-foreground">查看并处理当前告警事件</p>
                    </div>
                    <Badge variant={overview.alerts_24h > 0 ? "destructive" : "secondary"}>
                      {overview.alerts_24h}
                    </Badge>
                  </div>
                </Link>

                <Link
                  href={certificatesPath}
                  className="rounded-md border p-3 transition-colors hover:bg-muted/40"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">证书总览</p>
                      <p className="text-xs text-muted-foreground">关注证书健康与到期风险</p>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span>域名</span>
                      <span className="font-semibold text-foreground tabular-nums">
                        {overview.cert_summary.total_domains}
                      </span>
                    </div>
                  </div>
                </Link>

                <Link href={systemPath} className="rounded-md border p-3 transition-colors hover:bg-muted/40">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">系统设置</p>
                      <p className="text-xs text-muted-foreground">查看分区数与存储总量</p>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <HardDrive className="h-4 w-4" />
                      <span className="font-semibold text-foreground">
                        {formatBytes(overview.storage_total_bytes)}
                      </span>
                    </div>
                  </div>
                </Link>
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  )
}
