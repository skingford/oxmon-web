"use client"

import Link from "next/link"
import { HardDrive } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

type DashboardQuickLinksCardProps = {
  alertsPath: string
  certificatesPath: string
  cloudAccountsPath: string
  cloudInstancesPath: string
  systemPath: string
  alerts24h: number
  totalDomains: number
  enabledCloudAccounts: number
  runningCloudInstances: number
  storageSizeText: string
}

export function DashboardQuickLinksCard({
  alertsPath,
  certificatesPath,
  cloudAccountsPath,
  cloudInstancesPath,
  systemPath,
  alerts24h,
  totalDomains,
  enabledCloudAccounts,
  runningCloudInstances,
  storageSizeText,
}: DashboardQuickLinksCardProps) {
  return (
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
            <Badge variant={alerts24h > 0 ? "destructive" : "secondary"}>{alerts24h}</Badge>
          </div>
        </Link>

        <Link href={certificatesPath} className="rounded-md border p-3 transition-colors hover:bg-muted/40">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">证书总览</p>
              <p className="text-xs text-muted-foreground">关注证书健康与到期风险</p>
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span>域名</span>
              <span className="font-semibold text-foreground tabular-nums">{totalDomains}</span>
            </div>
          </div>
        </Link>

        <Link href={cloudAccountsPath} className="rounded-md border p-3 transition-colors hover:bg-muted/40">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">云账户</p>
              <p className="text-xs text-muted-foreground">管理云账号配置与连接状态</p>
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span>启用</span>
              <span className="font-semibold text-foreground tabular-nums">{enabledCloudAccounts}</span>
            </div>
          </div>
        </Link>

        <Link href={cloudInstancesPath} className="rounded-md border p-3 transition-colors hover:bg-muted/40">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">云实例</p>
              <p className="text-xs text-muted-foreground">查看实例状态与区域分布</p>
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span>运行中</span>
              <span className="font-semibold text-foreground tabular-nums">{runningCloudInstances}</span>
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
              <span className="font-semibold text-foreground">{storageSizeText}</span>
            </div>
          </div>
        </Link>
      </CardContent>
    </Card>
  )
}
