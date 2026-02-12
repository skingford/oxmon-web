"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { api, getApiErrorMessage } from "@/lib/api"
import { AgentResponse } from "@/types/api"
import { useAppLocale } from "@/hooks/use-app-locale"
import { withLocalePrefix } from "@/components/app-locale"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  ChevronLeft,
  ChevronRight,
  ListChecks,
  Loader2,
  RefreshCw,
  Search,
  Server,
  Wifi,
  WifiOff,
} from "lucide-react"
import { toast } from "sonner"

function formatLastSeen(lastSeen: string | null) {
  if (!lastSeen) {
    return "从未上报"
  }

  const seenAt = new Date(lastSeen)

  if (Number.isNaN(seenAt.getTime())) {
    return "-"
  }

  const diff = Date.now() - seenAt.getTime()
  const minute = 60 * 1000
  const hour = 60 * minute
  const day = 24 * hour

  if (diff < minute) {
    return "刚刚"
  }

  if (diff < hour) {
    return `${Math.floor(diff / minute)} 分钟前`
  }

  if (diff < day) {
    return `${Math.floor(diff / hour)} 小时前`
  }

  return `${Math.floor(diff / day)} 天前`
}

function getStatusMeta(status: string) {
  const normalized = status.toLowerCase()

  if (normalized === "active") {
    return {
      label: "在线",
      icon: Wifi,
      className: "border-emerald-500/30 bg-emerald-500/10 text-emerald-600",
    }
  }

  if (normalized === "inactive") {
    return {
      label: "离线",
      icon: WifiOff,
      className: "border-muted bg-muted text-muted-foreground",
    }
  }

  return {
    label: "未知",
    icon: Server,
    className: "border-amber-500/30 bg-amber-500/10 text-amber-600",
  }
}

export default function AgentsPage() {
  const locale = useAppLocale()
  const [agents, setAgents] = useState<AgentResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [search, setSearch] = useState("")
  const [offset, setOffset] = useState(0)
  const limit = 20

  const [currentPageCount, setCurrentPageCount] = useState(0)

  const whitelistPath = useMemo(() => withLocalePrefix("/whitelist", locale), [locale])

  const fetchAgents = useCallback(
    async (silent = false) => {
      if (silent) {
        setRefreshing(true)
      } else {
        setLoading(true)
      }

      try {
        const data = await api.getAgents({ limit, offset })
        setAgents(data)
        setCurrentPageCount(data.length)
      } catch (error) {
        toast.error(getApiErrorMessage(error, "加载 Agent 列表失败"))
      } finally {
        setLoading(false)
        setRefreshing(false)
      }
    },
    [limit, offset]
  )

  useEffect(() => {
    fetchAgents()
  }, [fetchAgents])

  const filteredAgents = useMemo(() => {
    const keyword = search.trim().toLowerCase()

    if (!keyword) {
      return agents
    }

    return agents.filter((agent) => agent.agent_id.toLowerCase().includes(keyword))
  }, [agents, search])

  const statusStats = useMemo(() => {
    return agents.reduce(
      (stats, agent) => {
        const status = agent.status.toLowerCase()

        if (status === "active") {
          stats.active += 1
        } else if (status === "inactive") {
          stats.inactive += 1
        } else {
          stats.unknown += 1
        }

        return stats
      },
      {
        active: 0,
        inactive: 0,
        unknown: 0,
      }
    )
  }, [agents])

  const pageNumber = Math.floor(offset / limit) + 1
  const canGoPrev = offset > 0
  const canGoNext = currentPageCount >= limit

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Agent 列表</h1>
          <p className="text-sm text-muted-foreground">展示在线状态与最后上报时间，支持跳转详情页</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" asChild>
            <Link href={whitelistPath}>
              <ListChecks className="mr-2 h-4 w-4" />
              白名单
            </Link>
          </Button>
          <Button
            variant="outline"
            onClick={() => fetchAgents(true)}
            disabled={loading || refreshing}
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
            刷新
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>在线 Agent</CardDescription>
            <CardTitle className="text-3xl text-emerald-600">{statusStats.active}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>离线 Agent</CardDescription>
            <CardTitle className="text-3xl text-muted-foreground">{statusStats.inactive}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>状态未知</CardDescription>
            <CardTitle className="text-3xl text-amber-600">{statusStats.unknown}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <CardTitle>当前页 Agent</CardTitle>
              <CardDescription>默认每页 {limit} 条，按最后上报时间排序</CardDescription>
            </div>
            <div className="relative w-full md:w-72">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="按 Agent ID 搜索"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                className="pl-9"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-hidden rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Agent ID</TableHead>
                  <TableHead>状态</TableHead>
                  <TableHead>最后上报</TableHead>
                  <TableHead className="text-right">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={4} className="h-40 text-center text-muted-foreground">
                      <Loader2 className="mx-auto mb-2 h-5 w-5 animate-spin" />
                      加载 Agent 数据中...
                    </TableCell>
                  </TableRow>
                ) : filteredAgents.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="h-32 text-center text-muted-foreground">
                      暂无 Agent 数据
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredAgents.map((agent) => {
                    const statusMeta = getStatusMeta(agent.status)
                    const AgentStatusIcon = statusMeta.icon
                    const detailPath = withLocalePrefix(
                      `/agents/${encodeURIComponent(agent.agent_id)}`,
                      locale
                    )

                    return (
                      <TableRow key={agent.agent_id} className="hover:bg-muted/40">
                        <TableCell className="font-mono text-sm">
                          <Link href={detailPath} className="text-primary hover:underline">
                            {agent.agent_id}
                          </Link>
                        </TableCell>
                        <TableCell>
                          <Badge className={`gap-1 ${statusMeta.className}`}>
                            <AgentStatusIcon className="h-3 w-3" />
                            {statusMeta.label}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {formatLastSeen(agent.last_seen)}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="sm" asChild>
                            <Link href={detailPath}>查看详情</Link>
                          </Button>
                        </TableCell>
                      </TableRow>
                    )
                  })
                )}
              </TableBody>
            </Table>
          </div>

          <div className="mt-4 flex items-center justify-end gap-2">
            <span className="mr-2 text-xs text-muted-foreground">第 {pageNumber} 页</span>
            <Button
              variant="outline"
              size="sm"
              disabled={!canGoPrev || loading}
              onClick={() => setOffset((prev) => Math.max(0, prev - limit))}
            >
              <ChevronLeft className="mr-1 h-4 w-4" />
              上一页
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={!canGoNext || loading}
              onClick={() => setOffset((prev) => prev + limit)}
            >
              下一页
              <ChevronRight className="ml-1 h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
