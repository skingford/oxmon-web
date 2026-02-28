"use client"

import { RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"

type DashboardPageHeaderProps = {
  refreshing: boolean
  onRefresh: () => void
}

export function DashboardPageHeader({ refreshing, onRefresh }: DashboardPageHeaderProps) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">仪表盘概览</h1>
        <p className="text-sm text-muted-foreground">基于 /v1/dashboard/overview 的实时系统总览</p>
      </div>
      <Button variant="outline" onClick={onRefresh} disabled={refreshing} size="sm">
        <RefreshCw className={`mr-2 h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
        刷新
      </Button>
    </div>
  )
}
