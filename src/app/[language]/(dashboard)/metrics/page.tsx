"use client"

import { Suspense, useEffect, useMemo, useState } from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { Area, AreaChart, Brush, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"
import { Activity, ArrowDown, ArrowUp, ArrowUpDown, Filter, Loader2 } from "lucide-react"
import { api, getApiErrorMessage } from "@/lib/api"
import { MetricDataPointResponse, MetricSummaryResponse } from "@/types/api"
import { useRequestState } from "@/hooks/use-request-state"
import { useAppTranslations } from "@/hooks/use-app-translations"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { MetricsQueryToolbar, MetricsTimeRange } from "@/components/metrics/MetricsQueryToolbar"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { toast } from "sonner"

type TimeRange = MetricsTimeRange
type TablePageSize = "20" | "50" | "100"
type SortField = "timestamp" | "value"
type SortDirection = "asc" | "desc"

interface TimeBounds {
  from?: string
  to?: string
}

interface MetricFilterOptionsData {
  agents: string[]
  metricNames: string[]
}

interface MetricQueryResultData {
  dataPoints: MetricDataPointResponse[]
  summary: MetricSummaryResponse | null
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
  const { t } = useAppTranslations("pages")
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const {
    data: filterOptions,
    loading: fetchingOptions,
    execute: executeFilterOptions,
  } = useRequestState<MetricFilterOptionsData>(
    {
      agents: [],
      metricNames: [],
    }
  )

  const {
    data: metricQueryResult,
    loading: querying,
    execute: executeMetricQuery,
  } = useRequestState<MetricQueryResultData>(
    {
      dataPoints: [],
      summary: null,
    },
    {
      initialLoading: false,
    }
  )

  const agents = filterOptions.agents
  const metricNames = filterOptions.metricNames
  const dataPoints = metricQueryResult.dataPoints
  const summary = metricQueryResult.summary

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

  const [autoQuery, setAutoQuery] = useState(true)

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
      toast.success(t("metrics.toastCopyLinkSuccess"))
    } catch {
      toast.error(t("metrics.toastCopyLinkError"))
    }
  }

  const handleResetFilters = () => {
    setSelectedAgent(agents[0] || "")
    setSelectedMetric(metricNames[0] || "")
    setLabelFilter("")
    setTimeRange("24h")
    setCustomFrom("")
    setCustomTo("")
    toast.success(t("metrics.toastResetFiltersSuccess"))
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
      toast.error(t("metrics.toastNoDataToExport"))
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

    toast.success(t("metrics.toastExportCsvSuccess", { count: filteredDataPoints.length }))
  }

  const handleExportJson = () => {
    if (filteredDataPoints.length === 0) {
      toast.error(t("metrics.toastNoDataToExport"))
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

    toast.success(t("metrics.toastExportJsonSuccess", { count: filteredDataPoints.length }))
  }

  const queryMetrics = async (showToast = false) => {
    if (!selectedAgent || !selectedMetric) {
      return
    }

    if (timeRange === "custom") {
      if (!customFrom || !customTo) {
        if (showToast) {
          toast.error(t("metrics.toastMissingCustomRange"))
        }
        return
      }

      if (new Date(customFrom).getTime() > new Date(customTo).getTime()) {
        if (showToast) {
          toast.error(t("metrics.toastInvalidCustomRange"))
        }
        return
      }
    }

    await executeMetricQuery(
      async () => {
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

        return {
          dataPoints: sortedPoints,
          summary: stats,
        }
      },
      {
        onSuccess: (result) => {
          if (showToast) {
            toast.success(t("metrics.toastMetricsLoaded", { count: result.dataPoints.length }))
          }
        },
        onError: (error) => {
          toast.error(getApiErrorMessage(error, t("metrics.toastMetricsFetchError")))
        },
      }
    )
  }

  useEffect(() => {
    const loadFilterOptions = async () => {
      await executeFilterOptions(
        async () => {
          const [agentList, metricList] = await Promise.all([
            api.getMetricAgents(),
            api.getMetricNames(),
          ])

          return {
            agents: agentList,
            metricNames: metricList,
          }
        },
        {
          onSuccess: (result) => {
            if (result.agents.length > 0 && !result.agents.includes(selectedAgent)) {
              setSelectedAgent(result.agents[0])
            }

            if (result.metricNames.length > 0 && !result.metricNames.includes(selectedMetric)) {
              setSelectedMetric(result.metricNames[0])
            }
          },
          onError: (error) => {
            toast.error(getApiErrorMessage(error, t("metrics.toastFilterOptionsError")))
          },
        }
      )
    }

    loadFilterOptions()
  }, [executeFilterOptions])

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

  const queryToolbarTexts = useMemo(
    () => ({
      agentLabel: t("metrics.agentLabel"),
      agentPlaceholder: t("metrics.agentPlaceholder"),
      metricLabel: t("metrics.metricLabel"),
      metricPlaceholder: t("metrics.metricPlaceholder"),
      labelFilterLabel: t("metrics.labelFilterLabel"),
      labelFilterPlaceholder: t("metrics.labelFilterPlaceholder"),
      queryModeLabel: t("metrics.queryModeLabel"),
      queryModeAuto: t("metrics.queryModeAuto"),
      timeRangeLabel: t("metrics.timeRangeLabel"),
      timeRange15m: t("metrics.timeRange15m"),
      timeRange30m: t("metrics.timeRange30m"),
      timeRange1h: t("metrics.timeRange1h"),
      timeRange6h: t("metrics.timeRange6h"),
      timeRange24h: t("metrics.timeRange24h"),
      timeRange7d: t("metrics.timeRange7d"),
      timeRangeAll: t("metrics.timeRangeAll"),
      timeRangeCustom: t("metrics.timeRangeCustom"),
      refreshDataButton: t("metrics.refreshDataButton"),
      resetFiltersTitle: t("metrics.resetFiltersTitle"),
      exportCsvTitle: t("metrics.exportCsvTitle"),
      exportJsonTitle: t("metrics.exportJsonTitle"),
      copyQueryLinkTitle: t("metrics.copyQueryLinkTitle"),
      startTimeLabel: t("metrics.startTimeLabel"),
      endTimeLabel: t("metrics.endTimeLabel"),
    }),
    [t]
  )

  return (
    <div className="p-8 space-y-8">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">{t("metrics.title")}</h2>
        <p className="text-muted-foreground">{t("metrics.description")}</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-4 w-4" />
            {t("metrics.queryConditionsTitle")}
          </CardTitle>
          <CardDescription>{t("metrics.queryConditionsDescription")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <MetricsQueryToolbar
            texts={queryToolbarTexts}
            agents={agents}
            metricNames={metricNames}
            selectedAgent={selectedAgent}
            selectedMetric={selectedMetric}
            labelFilter={labelFilter}
            autoQuery={autoQuery}
            timeRange={timeRange}
            customFrom={customFrom}
            customTo={customTo}
            fetchingOptions={fetchingOptions}
            querying={querying}
            hasQueryCondition={hasQueryCondition}
            canExport={filteredDataPoints.length > 0}
            onSelectedAgentChange={setSelectedAgent}
            onSelectedMetricChange={setSelectedMetric}
            onLabelFilterChange={setLabelFilter}
            onAutoQueryChange={setAutoQuery}
            onTimeRangeChange={setTimeRange}
            onCustomFromChange={setCustomFrom}
            onCustomToChange={setCustomTo}
            onRefresh={() => queryMetrics(true)}
            onResetFilters={handleResetFilters}
            onExportCsv={handleExportCsv}
            onExportJson={handleExportJson}
            onCopyQueryLink={handleCopyQueryLink}
          />
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>{t("metrics.statSamples")}</CardDescription>
            <CardTitle>{summary?.count ?? 0}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>{t("metrics.statMin")}</CardDescription>
            <CardTitle>{summary ? formatMetricValue(summary.min) : "-"}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>{t("metrics.statAvg")}</CardDescription>
            <CardTitle>{summary ? formatMetricValue(summary.avg) : "-"}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>{t("metrics.statMax")}</CardDescription>
            <CardTitle>{summary ? formatMetricValue(summary.max) : "-"}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      <Tabs defaultValue="chart" className="space-y-4">
        <TabsList>
          <TabsTrigger value="chart">{t("metrics.tabChart")}</TabsTrigger>
          <TabsTrigger value="table">{t("metrics.tabTable")}</TabsTrigger>
        </TabsList>

        <TabsContent value="chart">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-4 w-4" />
                {t("metrics.trendTitle")}
              </CardTitle>
              <CardDescription>
                {selectedAgent && selectedMetric
                  ? `${selectedAgent} / ${selectedMetric}`
                  : t("metrics.selectQueryCondition")}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {querying ? (
                <div className="h-[360px] flex items-center justify-center text-muted-foreground gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {t("metrics.chartLoading")}
                </div>
              ) : chartData.length === 0 ? (
                <div className="h-[360px] flex items-center justify-center text-muted-foreground">
                  {t("metrics.chartNoData")}
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center justify-between text-sm">
                    <div className="text-muted-foreground">
                      {t("metrics.latestTime", { time: latestPoint ? new Date(latestPoint.timestamp).toLocaleString() : "-" })}
                    </div>
                    <Badge variant="outline">{t("metrics.latestValue", { value: latestPoint ? formatMetricValue(latestPoint.value) : "-" })}</Badge>
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
              <CardTitle>{t("metrics.rawPointsTitle")}</CardTitle>
              <CardDescription>{t("metrics.rawPointsDescription")}</CardDescription>
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
                        {t("metrics.tableColTime")}
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
                        {t("metrics.tableColValue")}
                        {sortField !== "value" ? (
                          <ArrowUpDown className="h-3.5 w-3.5 text-muted-foreground" />
                        ) : sortDirection === "asc" ? (
                          <ArrowUp className="h-3.5 w-3.5" />
                        ) : (
                          <ArrowDown className="h-3.5 w-3.5" />
                        )}
                      </button>
                    </TableHead>
                    <TableHead>{t("metrics.tableColLabels")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedTableData.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={3} className="h-24 text-center text-muted-foreground">
                        {t("metrics.tableEmpty")}
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
                  {t("metrics.tableSummary", { total: totalRows, start: startIndex, end: endIndex })}
                </div>

                <div className="flex items-center gap-2">
                  <Select value={tablePageSize} onValueChange={(value) => setTablePageSize(value as TablePageSize)}>
                    <SelectTrigger className="w-[120px]">
                      <SelectValue placeholder={t("metrics.pageSizePlaceholder")} />
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
                    {t("metrics.prevPage")}
                  </Button>

                  <div className="text-sm text-muted-foreground min-w-[90px] text-center">
                    {t("metrics.pageIndicator", { current: currentPage, total: totalPages })}
                  </div>

                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setTablePage((prev) => Math.min(totalPages, prev + 1))}
                    disabled={currentPage >= totalPages || totalRows === 0}
                  >
                    {t("metrics.nextPage")}
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
