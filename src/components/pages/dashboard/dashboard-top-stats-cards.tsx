"use client"

import { Bell, Clock3, Server } from "lucide-react"
import type { DashboardOverview } from "@/types/api"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

type DashboardTopStatsCardsProps = {
  overview: DashboardOverview
  onlineRate: number
  severityStats: Array<[string, number]>
  uptimeText: string
  storageSizeText: string
}

export function DashboardTopStatsCards({
  overview,
  onlineRate,
  severityStats,
  uptimeText,
  storageSizeText,
}: DashboardTopStatsCardsProps) {
  return (
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
          <CardTitle className="text-3xl font-semibold tabular-nums">{uptimeText}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-1 text-sm text-muted-foreground">
          <div className="flex items-center justify-between">
            <span>存储分区</span>
            <span className="font-medium text-foreground">{overview.partition_count}</span>
          </div>
          <div className="flex items-center justify-between">
            <span>存储总大小</span>
            <span className="font-medium text-foreground">{storageSizeText}</span>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
