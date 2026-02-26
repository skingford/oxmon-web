"use client"

import { AlertCircle, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

type DashboardOverviewErrorCardProps = {
  onRetry: () => void
  retrying?: boolean
}

export function DashboardOverviewErrorCard({ onRetry, retrying = false }: DashboardOverviewErrorCardProps) {
  return (
    <Card>
      <CardContent className="flex flex-col items-center gap-3 py-14 text-center">
        <AlertCircle className="h-10 w-10 text-destructive/70" />
        <div>
          <p className="text-base font-medium">无法加载仪表盘数据</p>
          <p className="text-sm text-muted-foreground">请检查登录状态或稍后重试</p>
        </div>
        <Button onClick={onRetry} disabled={retrying}>
          <RefreshCw className={`mr-2 h-4 w-4 ${retrying ? "animate-spin" : ""}`} />
          重试
        </Button>
      </CardContent>
    </Card>
  )
}
