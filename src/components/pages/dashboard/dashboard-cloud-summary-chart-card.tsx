"use client"

import type { CloudSummary } from "@/types/api"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"

type DashboardCloudSummaryChartCardProps = {
  cloudSummary: CloudSummary
  cloudEnabledAccountRate: number
}

export function DashboardCloudSummaryChartCard({
  cloudSummary,
  cloudEnabledAccountRate,
}: DashboardCloudSummaryChartCardProps) {
  const cloudInstancesChartData = [
    { name: "运行", value: cloudSummary.running_instances, fill: "#10b981" },
    { name: "停止", value: cloudSummary.stopped_instances, fill: "#94a3b8" },
    { name: "待处理", value: cloudSummary.pending_instances, fill: "#f59e0b" },
    { name: "异常", value: cloudSummary.error_instances, fill: "#ef4444" },
    { name: "未知", value: cloudSummary.unknown_instances, fill: "#64748b" },
  ]

  const cloudAccountChartData = [
    { name: "启用", value: cloudSummary.enabled_accounts, fill: "#3b82f6" },
    {
      name: "未启用",
      value: Math.max(0, cloudSummary.total_accounts - cloudSummary.enabled_accounts),
      fill: "#cbd5e1",
    },
  ]

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">云资源摘要</CardTitle>
        <CardDescription>来自 cloud_summary 字段</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid gap-3 md:grid-cols-2">
          <div className="h-52 w-full rounded-md border p-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={cloudInstancesChartData} margin={{ top: 8, right: 8, bottom: 4, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} tickLine={false} axisLine={false} />
                <YAxis allowDecimals={false} tick={{ fontSize: 12 }} tickLine={false} axisLine={false} />
                <Tooltip cursor={{ fill: "#f8fafc" }} />
                <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                  {cloudInstancesChartData.map((item) => (
                    <Cell key={item.name} fill={item.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="h-52 w-full rounded-md border p-2">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={cloudAccountChartData}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={48}
                  outerRadius={72}
                  paddingAngle={2}
                >
                  {cloudAccountChartData.map((item) => (
                    <Cell key={item.name} fill={item.fill} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
          <div className="rounded-md border p-2">
            账户启用率
            <p className="mt-1 text-sm font-semibold text-foreground">{cloudEnabledAccountRate}%</p>
          </div>
          <div className="rounded-md border p-2">
            云实例总数
            <p className="mt-1 text-sm font-semibold text-foreground">{cloudSummary.total_instances}</p>
          </div>
          <div className="rounded-md border p-2">
            运行中实例
            <p className="mt-1 text-sm font-semibold text-foreground">{cloudSummary.running_instances}</p>
          </div>
          <div className="rounded-md border p-2">
            异常 / 未知
            <p className="mt-1 text-sm font-semibold text-foreground">
              {cloudSummary.error_instances + cloudSummary.unknown_instances}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
