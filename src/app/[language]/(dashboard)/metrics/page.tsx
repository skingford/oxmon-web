"use client"

import { Suspense, useEffect, useMemo, useState } from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { Area, AreaChart, Brush, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"
import { Activity, ArrowDown, ArrowUp, ArrowUpDown, Database, Download, FileJson2, Filter, Link2, Loader2, RefreshCw, RotateCcw, Server } from "lucide-react"
import { api, getApiErrorMessage } from "@/lib/api"
import { MetricDataPointResponse, MetricSummaryResponse } from "@/types/api"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { toast } from "sonner"

type TimeRange = "15m" | "30m" | "1h" | "6h" | "24h" | "7d" | "all" | "custom"
type TablePageSize = "20" | "50" | "100"
type SortField = "timestamp" | "value"
type SortDirection = "asc" | "desc"

interface TimeBounds {
  from?: string
  to?: string
}

function matchLabelFilter(labels: Record<string, string>, rawFilter: string) {
  const filterText = rawFilter.trim().toLowerCase()

  if (!filterText) {
    return true
  }

  const separatorIndex = filterText.indexOf(":")

  if (separatorIndex >= 0) {
    const keyFilter = filterText.slice(0, separatorIndex).trim()
    const valueFilter = filterText.slice(separatorIndex + 1).trim()

    return Object.entries(labels).some(([key, value]) => {
      const keyMatch = !keyFilter || key.toLowerCase().includes(keyFilter)
      const valueMatch = !valueFilter || value.toLowerCase().includes(valueFilter)
      return keyMatch && valueMatch
    })
  }

  return Object.entries(labels).some(([key, value]) => {
    const keyText = key.toLowerCase()
    const valueText = value.toLowerCase()
    return keyText.includes(filterText) || valueText.includes(filterText)
  })
}

function isTimeRange(value: string | null): value is TimeRange {
  return value === "15m" || value === "30m" || value === "1h" || value === "6h" || value === "24h" || value === "7d" || value === "all" || value === "custom"
}

function formatMetricValue(value: number) {
  if (Number.isNaN(value)) {
    return "-"
  }

  if (Math.abs(value) >= 1000) {
    return value.toLocaleString(undefined, { maximumFractionDigits: 2 })
  }

  return value.toLocaleString(undefined, { maximumFractionDigits: 4 })
}

function toIsoDateTime(value?: string) {
  if (!value) {
    return undefined
  }

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return undefined
  }

  return date.toISOString()
}

function getTimeBounds(range: TimeRange, customFrom?: string, customTo?: string): TimeBounds {
  if (range === "all") {
    return {}
  }

  if (range === "custom") {
    return {
      from: toIsoDateTime(customFrom),
      to: toIsoDateTime(customTo),
    }
  }

  const now = new Date()
  const from = new Date(now)

  if (range === "15m") from.setMinutes(from.getMinutes() - 15)
  if (range === "30m") from.setMinutes(from.getMinutes() - 30)
  if (range === "1h") from.setHours(from.getHours() - 1)
  if (range === "6h") from.setHours(from.getHours() - 6)
  if (range === "24h") from.setHours(from.getHours() - 24)
  if (range === "7d") from.setDate(from.getDate() - 7)

  return {
    from: from.toISOString(),
    to: now.toISOString(),
  }
}

function toCsvCell(value: unknown) {
  const text = value === null || value === undefined ? "" : String(value)

  if (/[",\n]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`
  }

  return text
}

function MetricsPageContent() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const [agents, setAgents] = useState<string[]>([])
  const [metricNames, setMetricNames] = useState<string[]>([])
  const [selectedAgent, setSelectedAgent] = useState(searchParams.get("agent_id") || "")
  const [selectedMetric, setSelectedMetric] = useState(searchParams.get("metric_name") || "")
  const [labelFilter, setLabelFilter] = useState(searchParams.get("label") || "")
  const [timeRange, setTimeRange] = useState<TimeRange>(() => {
    const rangeParam = searchParams.get("range")

    if (isTimeRange(rangeParam)) {
      return rangeParam
    }

    if (searchParams.get("from") || searchParams.get("to")) {
      return "custom"
    }

    return "24h"
  })
  const [customFrom, setCustomFrom] = useState(searchParams.get("from") || "")
  const [customTo, setCustomTo] = useState(searchParams.get("to") || "")

  const [fetchingOptions, setFetchingOptions] = useState(true)
  const [querying, setQuerying] = useState(false)
  const [autoQuery, setAutoQuery] = useState(true)

  const [dataPoints, setDataPoints] = useState<MetricDataPointResponse[]>([])
  const [summary, setSummary] = useState<MetricSummaryResponse | null>(null)
  const [tablePage, setTablePage] = useState(1)
  const [tablePageSize, setTablePageSize] = useState<TablePageSize>("20")
  const [sortField, setSortField] = useState<SortField>("timestamp")
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc")

  const hasCustomRange = timeRange !== "custom" || (Boolean(customFrom) && Boolean(customTo))
  const hasQueryCondition = Boolean(selectedAgent && selectedMetric && hasCustomRange)

  const handleCopyQueryLink = async () => {
    if (typeof window === "undefined") {
      return
    }

    try {
      await navigator.clipboard.writeText(window.location.href)
      toast.success("已复制当前查询链接")
    } catch {
      toast.error("复制链接失败，请手动复制地址栏")
    }
  }

  const handleResetFilters = () => {
    setSelectedAgent(agents[0] || "")
    setSelectedMetric(metricNames[0] || "")
    setLabelFilter("")
    setTimeRange("24h")
    setCustomFrom("")
    setCustomTo("")
    toast.success("已重置筛选条件")
  }

  const handleTableSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"))
      return
    }

    setSortField(field)
    setSortDirection("desc")
  }

  const handleExportCsv = () => {
    if (filteredDataPoints.length === 0) {
      toast.error("暂无可导出的数据")
      return
    }

    const headers = ["id", "timestamp", "created_at", "agent_id", "metric_name", "value", "labels"]
    const rows = filteredDataPoints.map((point) => [
      point.id,
      point.timestamp,
      point.created_at,
      point.agent_id,
      point.metric_name,
      point.value,
      JSON.stringify(point.labels || {}),
    ])

    const csvContent = [
      headers.join(","),
      ...rows.map((row) => row.map((cell) => toCsvCell(cell)).join(",")),
    ].join("\n")

    const csvWithBom = `\ufeff${csvContent}`
    const blob = new Blob([csvWithBom], { type: "text/csv;charset=utf-8;" })
    const downloadUrl = URL.createObjectURL(blob)
    const safeAgent = selectedAgent || "all"
    const safeMetric = selectedMetric || "all"
    const filenameTime = new Date().toISOString().replace(/[.:]/g, "-")
    const filename = `metrics-${safeAgent}-${safeMetric}-${filenameTime}.csv`
    const link = document.createElement("a")

    link.href = downloadUrl
    link.download = filename
    document.body.appendChild(link)
    link.click()
    link.remove()
    URL.revokeObjectURL(downloadUrl)

    toast.success(`已导出 ${filteredDataPoints.length} 条数据`)
  }

  const handleExportJson = () => {
    if (filteredDataPoints.length === 0) {
      toast.error("暂无可导出的数据")
      return
    }

    const bounds = getTimeBounds(timeRange, customFrom, customTo)
    const exportPayload = {
      query: {
        agent_id: selectedAgent,
        metric_name: selectedMetric,
        label_filter: labelFilter || undefined,
        range: timeRange,
        timestamp__gte: bounds.from,
        timestamp__lte: bounds.to,
      },
      summary,
      count: filteredDataPoints.length,
      points: filteredDataPoints,
      exported_at: new Date().toISOString(),
    }

    const jsonContent = JSON.stringify(exportPayload, null, 2)
    const blob = new Blob([jsonContent], { type: "application/json;charset=utf-8;" })
    const downloadUrl = URL.createObjectURL(blob)
    const safeAgent = selectedAgent || "all"
    const safeMetric = selectedMetric || "all"
    const filenameTime = new Date().toISOString().replace(/[.:]/g, "-")
    const filename = `metrics-${safeAgent}-${safeMetric}-${filenameTime}.json`
    const link = document.createElement("a")

    link.href = downloadUrl
    link.download = filename
    document.body.appendChild(link)
    link.click()
    link.remove()
    URL.revokeObjectURL(downloadUrl)

    toast.success(`已导出 ${filteredDataPoints.length} 条 JSON 数据`)
  }

  const queryMetrics = async (showToast = false) => {
    if (!selectedAgent || !selectedMetric) {
      return
    }

    if (timeRange === "custom") {
      if (!customFrom || !customTo) {
        if (showToast) {
          toast.error("请选择完整的开始和结束时间")
        }
        return
      }

      if (new Date(customFrom).getTime() > new Date(customTo).getTime()) {
        if (showToast) {
          toast.error("开始时间不能晚于结束时间")
        }
        return
      }
    }

    setQuerying(true)

    try {
      const bounds = getTimeBounds(timeRange, customFrom, customTo)

      const [points, stats] = await Promise.all([
        api.queryAllMetrics({
          agent_id__eq: selectedAgent,
          metric_name__eq: selectedMetric,
          timestamp__gte: bounds.from,
          timestamp__lte: bounds.to,
          limit: 200,
          offset: 0,
        }),
        api.getMetricSummary({
          agent_id: selectedAgent,
          metric_name: selectedMetric,
          timestamp__gte: bounds.from,
          timestamp__lte: bounds.to,
        }),
      ])

      const sortedPoints = [...points].sort((a, b) => {
        const aTime = new Date(a.timestamp).getTime()
        const bTime = new Date(b.timestamp).getTime()
        return aTime - bTime
      })

      setDataPoints(sortedPoints)
      setSummary(stats)

      if (showToast) {
        toast.success(`已加载 ${sortedPoints.length} 条指标数据`)
      }
    } catch (error) {
      toast.error(getApiErrorMessage(error, "加载指标失败"))
    } finally {
      setQuerying(false)
    }
  }

  useEffect(() => {
    const loadFilterOptions = async () => {
      setFetchingOptions(true)

      try {
        const [agentList, metricList] = await Promise.all([
          api.getMetricAgents(),
          api.getMetricNames(),
        ])

        setAgents(agentList)
        setMetricNames(metricList)

        if (agentList.length > 0 && !agentList.includes(selectedAgent)) {
          setSelectedAgent(agentList[0])
        }

        if (metricList.length > 0 && !metricList.includes(selectedMetric)) {
          setSelectedMetric(metricList[0])
        }
      } catch (error) {
        toast.error(getApiErrorMessage(error, "加载筛选项失败"))
      } finally {
        setFetchingOptions(false)
      }
    }

    loadFilterOptions()
  }, [])

  useEffect(() => {
    const nextParams = new URLSearchParams(searchParams.toString())

    if (selectedAgent) nextParams.set("agent_id", selectedAgent)
    else nextParams.delete("agent_id")

    if (selectedMetric) nextParams.set("metric_name", selectedMetric)
    else nextParams.delete("metric_name")

    if (labelFilter.trim()) nextParams.set("label", labelFilter)
    else nextParams.delete("label")

    nextParams.set("range", timeRange)

    if (timeRange === "custom") {
      if (customFrom) nextParams.set("from", customFrom)
      else nextParams.delete("from")

      if (customTo) nextParams.set("to", customTo)
      else nextParams.delete("to")
    } else {
      nextParams.delete("from")
      nextParams.delete("to")
    }

    const currentQuery = searchParams.toString()
    const nextQuery = nextParams.toString()

    if (currentQuery === nextQuery) {
      return
    }

    router.replace(nextQuery ? `${pathname}?${nextQuery}` : pathname, { scroll: false })
  }, [pathname, router, searchParams, selectedAgent, selectedMetric, labelFilter, timeRange, customFrom, customTo])

  useEffect(() => {
    if (!autoQuery || fetchingOptions || !hasQueryCondition) {
      return
    }

    const timerId = window.setTimeout(() => {
      queryMetrics()
    }, 300)

    return () => {
      window.clearTimeout(timerId)
    }
  }, [autoQuery, fetchingOptions, hasQueryCondition, selectedAgent, selectedMetric, labelFilter, timeRange, customFrom, customTo])

  useEffect(() => {
    setTablePage(1)
  }, [selectedAgent, selectedMetric, labelFilter, timeRange, customFrom, customTo, tablePageSize, sortField, sortDirection])

  const filteredDataPoints = useMemo(() => {
    if (!labelFilter.trim()) {
      return dataPoints
    }

    return dataPoints.filter((point) => matchLabelFilter(point.labels || {}, labelFilter))
  }, [dataPoints, labelFilter])

  const chartData = useMemo(
    () =>
      filteredDataPoints.map((point) => {
        const date = new Date(point.timestamp)
        return {
          timestamp: date.toLocaleString(),
          time: date.toLocaleTimeString(),
          value: point.value,
        }
      }),
    [filteredDataPoints]
  )

  const sortedTableData = useMemo(() => {
    const cloned = [...filteredDataPoints]

    cloned.sort((left, right) => {
      const diff = sortField === "timestamp"
        ? new Date(left.timestamp).getTime() - new Date(right.timestamp).getTime()
        : left.value - right.value

      return sortDirection === "asc" ? diff : -diff
    })

    return cloned
  }, [filteredDataPoints, sortField, sortDirection])

  const latestPoint = filteredDataPoints.length > 0 ? filteredDataPoints[filteredDataPoints.length - 1] : null
  const pageSize = Number(tablePageSize)
  const totalRows = sortedTableData.length
  const totalPages = Math.max(1, Math.ceil(totalRows / pageSize))
  const currentPage = Math.min(tablePage, totalPages)
  const startIndex = totalRows === 0 ? 0 : (currentPage - 1) * pageSize + 1
  const endIndex = totalRows === 0 ? 0 : Math.min(currentPage * pageSize, totalRows)

  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * pageSize
    const end = start + pageSize
    return sortedTableData.slice(start, end)
  }, [sortedTableData, currentPage, pageSize])

  useEffect(() => {
    if (tablePage > totalPages) {
      setTablePage(totalPages)
    }
  }, [tablePage, totalPages])

  return (
    <div className="p-8 space-y-8">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Metrics</h2>
        <p className="text-muted-foreground">查询与分析 Agent 原始指标数据</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-4 w-4" />
            查询条件
          </CardTitle>
          <CardDescription>选择 Agent、指标名和时间范围来加载数据</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
            <div className="space-y-2">
              <div className="text-sm text-muted-foreground flex items-center gap-2">
                <Server className="h-4 w-4" /> Agent
              </div>
              <Select value={selectedAgent} onValueChange={setSelectedAgent} disabled={fetchingOptions}>
                <SelectTrigger>
                  <SelectValue placeholder="选择 Agent" />
                </SelectTrigger>
                <SelectContent>
                  {agents.map((agentId) => (
                    <SelectItem key={agentId} value={agentId}>
                      {agentId}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <div className="text-sm text-muted-foreground flex items-center gap-2">
                <Database className="h-4 w-4" /> Metric
              </div>
              <Select value={selectedMetric} onValueChange={setSelectedMetric} disabled={fetchingOptions}>
                <SelectTrigger>
                  <SelectValue placeholder="选择指标" />
                </SelectTrigger>
                <SelectContent>
                  {metricNames.map((metricName) => (
                    <SelectItem key={metricName} value={metricName}>
                      {metricName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2 md:col-span-2">
              <div className="text-sm text-muted-foreground">Label Filter</div>
              <Input
                placeholder="支持 key:value 或关键字（例如 domain:example.com）"
                value={labelFilter}
                onChange={(event) => setLabelFilter(event.target.value)}
              />
            </div>

            <div className="space-y-2">
              <div className="text-sm text-muted-foreground">Query Mode</div>
              <div className="flex h-9 items-center justify-between rounded-md border px-3">
                <span className="text-sm">自动查询（300ms 防抖）</span>
                <Switch checked={autoQuery} onCheckedChange={setAutoQuery} />
              </div>
            </div>

            <div className="space-y-2">
              <div className="text-sm text-muted-foreground">Time Range</div>
              <Select value={timeRange} onValueChange={(value) => setTimeRange(value as TimeRange)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="15m">Last 15 minutes</SelectItem>
                  <SelectItem value="30m">Last 30 minutes</SelectItem>
                  <SelectItem value="1h">Last 1 hour</SelectItem>
                  <SelectItem value="6h">Last 6 hours</SelectItem>
                  <SelectItem value="24h">Last 24 hours</SelectItem>
                  <SelectItem value="7d">Last 7 days</SelectItem>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="custom">Custom</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-end gap-2">
              <Button className="flex-1" onClick={() => queryMetrics(true)} disabled={!hasQueryCondition || querying}>
                {querying ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
                刷新数据
              </Button>
              <Button type="button" variant="outline" size="icon" onClick={handleResetFilters} title="重置筛选条件">
                <RotateCcw className="h-4 w-4" />
              </Button>
              <Button type="button" variant="outline" size="icon" onClick={handleExportCsv} disabled={filteredDataPoints.length === 0} title="导出当前结果为 CSV">
                <Download className="h-4 w-4" />
              </Button>
              <Button type="button" variant="outline" size="icon" onClick={handleExportJson} disabled={filteredDataPoints.length === 0} title="导出当前结果为 JSON">
                <FileJson2 className="h-4 w-4" />
              </Button>
              <Button type="button" variant="outline" size="icon" onClick={handleCopyQueryLink} title="复制当前查询链接">
                <Link2 className="h-4 w-4" />
              </Button>
            </div>

            {timeRange === "custom" && (
              <>
                <div className="space-y-2 md:col-span-2">
                  <div className="text-sm text-muted-foreground">开始时间</div>
                  <Input
                    type="datetime-local"
                    value={customFrom}
                    onChange={(event) => setCustomFrom(event.target.value)}
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <div className="text-sm text-muted-foreground">结束时间</div>
                  <Input
                    type="datetime-local"
                    value={customTo}
                    onChange={(event) => setCustomTo(event.target.value)}
                  />
                </div>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>样本数</CardDescription>
            <CardTitle>{summary?.count ?? 0}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>最小值</CardDescription>
            <CardTitle>{summary ? formatMetricValue(summary.min) : "-"}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>平均值</CardDescription>
            <CardTitle>{summary ? formatMetricValue(summary.avg) : "-"}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>最大值</CardDescription>
            <CardTitle>{summary ? formatMetricValue(summary.max) : "-"}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      <Tabs defaultValue="chart" className="space-y-4">
        <TabsList>
          <TabsTrigger value="chart">趋势图</TabsTrigger>
          <TabsTrigger value="table">原始数据</TabsTrigger>
        </TabsList>

        <TabsContent value="chart">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-4 w-4" />
                指标趋势
              </CardTitle>
              <CardDescription>
                {selectedAgent && selectedMetric
                  ? `${selectedAgent} / ${selectedMetric}`
                  : "请选择查询条件"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {querying ? (
                <div className="h-[360px] flex items-center justify-center text-muted-foreground gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  正在加载图表数据...
                </div>
              ) : chartData.length === 0 ? (
                <div className="h-[360px] flex items-center justify-center text-muted-foreground">
                  暂无数据
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center justify-between text-sm">
                    <div className="text-muted-foreground">
                      最新时间：{latestPoint ? new Date(latestPoint.timestamp).toLocaleString() : "-"}
                    </div>
                    <Badge variant="outline">最新值 {latestPoint ? formatMetricValue(latestPoint.value) : "-"}</Badge>
                  </div>

                  <div className="h-[320px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="time" tick={{ fontSize: 12 }} minTickGap={20} />
                        <YAxis tick={{ fontSize: 12 }} width={80} />
                        <Tooltip
                          formatter={(value) => formatMetricValue(Number(value))}
                          labelFormatter={(label, payload) => {
                            const point = payload?.[0]?.payload
                            return point?.timestamp || label
                          }}
                        />
                        <Area type="monotone" dataKey="value" stroke="var(--primary)" fill="var(--primary)" fillOpacity={0.2} strokeWidth={2} />
                        <Brush dataKey="time" height={22} travellerWidth={8} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="table">
          <Card>
            <CardHeader>
              <CardTitle>原始数据点</CardTitle>
              <CardDescription>展示最近查询到的指标明细</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>
                      <button
                        type="button"
                        className="inline-flex items-center gap-1"
                        onClick={() => handleTableSort("timestamp")}
                      >
                        Time
                        {sortField !== "timestamp" ? (
                          <ArrowUpDown className="h-3.5 w-3.5 text-muted-foreground" />
                        ) : sortDirection === "asc" ? (
                          <ArrowUp className="h-3.5 w-3.5" />
                        ) : (
                          <ArrowDown className="h-3.5 w-3.5" />
                        )}
                      </button>
                    </TableHead>
                    <TableHead>
                      <button
                        type="button"
                        className="inline-flex items-center gap-1"
                        onClick={() => handleTableSort("value")}
                      >
                        Value
                        {sortField !== "value" ? (
                          <ArrowUpDown className="h-3.5 w-3.5 text-muted-foreground" />
                        ) : sortDirection === "asc" ? (
                          <ArrowUp className="h-3.5 w-3.5" />
                        ) : (
                          <ArrowDown className="h-3.5 w-3.5" />
                        )}
                      </button>
                    </TableHead>
                    <TableHead>Labels</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedTableData.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={3} className="h-24 text-center text-muted-foreground">
                        暂无匹配数据
                      </TableCell>
                    </TableRow>
                  ) : (
                    paginatedData.map((point, index) => (
                      <TableRow key={point.id || `${point.timestamp}-${index}`}>
                        <TableCell>{new Date(point.timestamp).toLocaleString()}</TableCell>
                        <TableCell className="font-mono">{formatMetricValue(point.value)}</TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {Object.entries(point.labels || {}).length === 0 ? (
                              <span className="text-muted-foreground text-xs">-</span>
                            ) : (
                              Object.entries(point.labels || {}).map(([key, value]) => (
                                <Badge key={`${key}-${value}`} variant="secondary" className="text-xs">
                                  {key}:{value}
                                </Badge>
                              ))
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>

              <div className="mt-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div className="text-sm text-muted-foreground">
                  共 {totalRows} 条，当前显示 {startIndex}-{endIndex}
                </div>

                <div className="flex items-center gap-2">
                  <Select value={tablePageSize} onValueChange={(value) => setTablePageSize(value as TablePageSize)}>
                    <SelectTrigger className="w-[120px]">
                      <SelectValue placeholder="每页条数" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="20">20 / page</SelectItem>
                      <SelectItem value="50">50 / page</SelectItem>
                      <SelectItem value="100">100 / page</SelectItem>
                    </SelectContent>
                  </Select>

                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setTablePage((prev) => Math.max(1, prev - 1))}
                    disabled={currentPage <= 1 || totalRows === 0}
                  >
                    上一页
                  </Button>

                  <div className="text-sm text-muted-foreground min-w-[90px] text-center">
                    第 {currentPage} / {totalPages} 页
                  </div>

                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setTablePage((prev) => Math.min(totalPages, prev + 1))}
                    disabled={currentPage >= totalPages || totalRows === 0}
                  >
                    下一页
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

function MetricsPageFallback() {
  return (
    <div className="flex min-h-[40vh] items-center justify-center">
      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
    </div>
  )
}

export default function MetricsPage() {
  return (
    <Suspense fallback={<MetricsPageFallback />}>
      <MetricsPageContent />
    </Suspense>
  )
}
