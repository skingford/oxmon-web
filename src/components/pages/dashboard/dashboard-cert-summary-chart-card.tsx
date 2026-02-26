"use client"

import type { CertSummary } from "@/types/api"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"

type DashboardCertSummaryChartCardProps = {
  certSummary: CertSummary
}

export function DashboardCertSummaryChartCard({ certSummary }: DashboardCertSummaryChartCardProps) {
  const certChartData = [
    { name: "有效", value: certSummary.valid, fill: "#10b981" },
    { name: "无效", value: certSummary.invalid, fill: "#ef4444" },
    { name: "即将过期", value: certSummary.expiring_soon, fill: "#f59e0b" },
  ]

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">证书健康摘要</CardTitle>
        <CardDescription>来自 cert_summary 字段</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="h-52 w-full rounded-md border p-2">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={certChartData} margin={{ top: 8, right: 8, bottom: 4, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} tickLine={false} axisLine={false} />
              <YAxis allowDecimals={false} tick={{ fontSize: 12 }} tickLine={false} axisLine={false} />
              <Tooltip cursor={{ fill: "#f8fafc" }} />
              <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                {certChartData.map((item) => (
                  <Cell key={item.name} fill={item.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="flex items-center justify-between rounded-md border p-3 text-sm">
          <span className="text-muted-foreground">监控域名总数</span>
          <span className="font-semibold tabular-nums">{certSummary.total_domains}</span>
        </div>
      </CardContent>
    </Card>
  )
}
