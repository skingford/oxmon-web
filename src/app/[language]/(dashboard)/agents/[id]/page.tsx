"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { useParams } from "next/navigation"
import { api, getApiErrorMessage } from "@/lib/api"
import { LatestMetric } from "@/types/api"
import { useAppLocale } from "@/hooks/use-app-locale"
import { withLocalePrefix } from "@/components/app-locale"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertCircle, ArrowLeft, Gauge, Loader2, RefreshCw } from "lucide-react"
import { toast } from "sonner"

function findMetricValue(metrics: LatestMetric[], names: string[]) {
  const candidates = names.map((name) => name.toLowerCase())

  const matched = metrics.find((metric) =>
    candidates.some((name) => metric.metric_name.toLowerCase().includes(name))
  )

  return matched?.value
}

function resolveValueColor(value?: number, withThreshold = false) {
  if (value === undefined || value === null || Number.isNaN(value)) {
    return "text-muted-foreground"
  }

  if (!withThreshold) {
    return "text-foreground"
  }

  if (value > 90) {
    return "text-red-600"
  }

  if (value > 80) {
    return "text-amber-600"
  }

  return "text-foreground"
}

function formatPercent(value?: number) {
  if (value === undefined || value === null || Number.isNaN(value)) {
    return "-"
  }

  return `${value.toFixed(1)}%`
}

function formatLoad(value?: number) {
  if (value === undefined || value === null || Number.isNaN(value)) {
    return "-"
  }

  return value.toFixed(2)
}

function formatUpdatedAt(metrics: LatestMetric[]) {
  if (metrics.length === 0) {
    return "-"
  }

  const latest = metrics.reduce((max, current) =>
    new Date(current.timestamp).getTime() > new Date(max.timestamp).getTime() ? current : max
  )

  const time = new Date(latest.timestamp)

  if (Number.isNaN(time.getTime())) {
    return "-"
  }

  return time.toLocaleString()
}

export default function AgentDetailPage() {
  const params = useParams()
  const locale = useAppLocale()

  const agentId = useMemo(() => {
    const raw = params?.id

    if (!raw) {
      return ""
    }

    return decodeURIComponent(Array.isArray(raw) ? raw[0] : raw)
  }, [params])

  const [metrics, setMetrics] = useState<LatestMetric[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [notFound, setNotFound] = useState(false)

  const agentsPath = useMemo(() => withLocalePrefix("/agents", locale), [locale])

  const fetchLatestMetrics = useCallback(
    async (silent = false) => {
      if (!agentId) {
        return
      }

      if (silent) {
        setRefreshing(true)
      } else {
        setLoading(true)
      }

      try {
        const data = await api.getAgentLatestMetrics(agentId)
        setMetrics(data)
        setNotFound(false)
      } catch (error: any) {
        if (error?.status === 404) {
          setNotFound(true)
          setMetrics([])
        } else {
          toast.error(getApiErrorMessage(error, "加载 Agent 指标失败"))
        }
      } finally {
        setLoading(false)
        setRefreshing(false)
      }
    },
    [agentId]
  )

  useEffect(() => {
    fetchLatestMetrics()
  }, [fetchLatestMetrics])

  const cpu = findMetricValue(metrics, ["cpu_usage", "cpu.percent", "cpu"])
  const memory = findMetricValue(metrics, ["memory_usage", "memory.percent", "mem"])
  const disk = findMetricValue(metrics, ["disk_usage", "disk.percent", "disk"])
  const load = findMetricValue(metrics, ["load1", "load_avg", "load"])

  const cards = [
    {
      key: "cpu",
      title: "CPU 使用率",
      value: formatPercent(cpu),
      valueClass: resolveValueColor(cpu, true),
    },
    {
      key: "memory",
      title: "内存使用率",
      value: formatPercent(memory),
      valueClass: resolveValueColor(memory, true),
    },
    {
      key: "disk",
      title: "磁盘使用率",
      value: formatPercent(disk),
      valueClass: resolveValueColor(disk, true),
    },
    {
      key: "load",
      title: "负载均值",
      value: formatLoad(load),
      valueClass: resolveValueColor(load),
    },
  ]

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <Button variant="ghost" className="mb-2 -ml-3" asChild>
            <Link href={agentsPath}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              返回 Agent 列表
            </Link>
          </Button>
          <h1 className="text-2xl font-semibold tracking-tight">Agent: {agentId || "-"}</h1>
          <p className="text-sm text-muted-foreground">基于 /v1/agents/{"{id}"}/latest 的最新指标快照</p>
        </div>
        <Button
          variant="outline"
          onClick={() => fetchLatestMetrics(true)}
          disabled={loading || refreshing || !agentId}
        >
          <RefreshCw className={`mr-2 h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
          刷新
        </Button>
      </div>

      {loading ? (
        <Card>
          <CardContent className="flex h-56 flex-col items-center justify-center text-muted-foreground">
            <Loader2 className="mb-3 h-6 w-6 animate-spin" />
            指标加载中...
          </CardContent>
        </Card>
      ) : notFound ? (
        <Card>
          <CardContent className="flex h-64 flex-col items-center justify-center gap-3 text-center">
            <AlertCircle className="h-10 w-10 text-destructive/70" />
            <div>
              <p className="text-base font-medium">Agent 未找到</p>
              <p className="text-sm text-muted-foreground">请确认 Agent ID 是否正确，或返回列表页重试</p>
            </div>
            <Button variant="outline" asChild>
              <Link href={agentsPath}>返回 Agent 列表</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="flex flex-wrap items-center gap-3">
            <Badge className="border-emerald-500/30 bg-emerald-500/10 text-emerald-600">指标已更新</Badge>
            <span className="text-sm text-muted-foreground">最近采集时间：{formatUpdatedAt(metrics)}</span>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:gap-6">
            {cards.map((card) => (
              <Card key={card.key}>
                <CardHeader className="pb-2">
                  <CardDescription className="flex items-center gap-2 text-sm">
                    <Gauge className="h-4 w-4" />
                    {card.title}
                  </CardDescription>
                  <CardTitle className={`text-4xl font-bold tracking-tight ${card.valueClass}`}>
                    {card.value}
                  </CardTitle>
                </CardHeader>
              </Card>
            ))}
          </div>

          <Card>
            <CardHeader>
              <CardTitle>原始指标</CardTitle>
              <CardDescription>用于排查指标名称映射与标签细节</CardDescription>
            </CardHeader>
            <CardContent>
              {metrics.length === 0 ? (
                <p className="text-sm text-muted-foreground">暂无最新指标数据</p>
              ) : (
                <div className="space-y-2">
                  {metrics.map((metric) => (
                    <div
                      key={`${metric.metric_name}-${metric.timestamp}`}
                      className="rounded-md border bg-muted/20 p-3"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="font-mono text-sm font-medium">{metric.metric_name}</p>
                        <span className="text-sm">{metric.value}</span>
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground">
                        时间：{new Date(metric.timestamp).toLocaleString()}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}
