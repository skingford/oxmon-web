"use client"

import { useEffect, useMemo, useState } from "react"
import { Database, Download, FileJson2, Link2, Loader2, RefreshCw, RotateCcw, Server } from "lucide-react"
import { Button } from "@/components/ui/button"
import { FilterToolbar } from "@/components/ui/filter-toolbar"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"

export type MetricsTimeRange = "15m" | "30m" | "1h" | "6h" | "24h" | "7d" | "all" | "custom"

type MetricsQueryToolbarTexts = {
  agentLabel: string
  agentPlaceholder: string
  metricLabel: string
  metricPlaceholder: string
  labelFilterLabel: string
  labelFilterPlaceholder: string
  queryModeLabel: string
  queryModeAuto: string
  timeRangeLabel: string
  timeRange15m: string
  timeRange30m: string
  timeRange1h: string
  timeRange6h: string
  timeRange24h: string
  timeRange7d: string
  timeRangeAll: string
  timeRangeCustom: string
  refreshDataButton: string
  resetFiltersTitle: string
  exportCsvTitle: string
  exportJsonTitle: string
  copyQueryLinkTitle: string
  startTimeLabel: string
  endTimeLabel: string
}

type MetricsQueryToolbarProps = {
  texts: MetricsQueryToolbarTexts
  agents: string[]
  metricOptions: Array<{
    value: string
    label: string
    subtitle?: string
  }>
  selectedAgent: string
  selectedMetric: string
  labelFilter: string
  autoQuery: boolean
  timeRange: MetricsTimeRange
  customFrom: string
  customTo: string
  fetchingOptions: boolean
  querying: boolean
  hasQueryCondition: boolean
  canExport: boolean
  onSelectedAgentChange: (value: string) => void
  onSelectedMetricChange: (value: string) => void
  onLabelFilterChange: (value: string) => void
  onAutoQueryChange: (value: boolean) => void
  onTimeRangeChange: (value: MetricsTimeRange) => void
  onCustomFromChange: (value: string) => void
  onCustomToChange: (value: string) => void
  onRefresh: () => void
  onResetFilters: () => void
  onExportCsv: () => void
  onExportJson: () => void
  onCopyQueryLink: () => void
}

export function MetricsQueryToolbar({
  texts,
  agents,
  metricOptions,
  selectedAgent,
  selectedMetric,
  labelFilter,
  autoQuery,
  timeRange,
  customFrom,
  customTo,
  fetchingOptions,
  querying,
  hasQueryCondition,
  canExport,
  onSelectedAgentChange,
  onSelectedMetricChange,
  onLabelFilterChange,
  onAutoQueryChange,
  onTimeRangeChange,
  onCustomFromChange,
  onCustomToChange,
  onRefresh,
  onResetFilters,
  onExportCsv,
  onExportJson,
  onCopyQueryLink,
}: MetricsQueryToolbarProps) {
  const RECENT_AGENTS_KEY = "metrics-recent-agents"
  const [agentSearch, setAgentSearch] = useState("")
  const [agentSelectOpen, setAgentSelectOpen] = useState(false)
  const [recentAgents, setRecentAgents] = useState<string[]>([])

  const normalizedAgentSearch = agentSearch.trim().toLowerCase()

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(RECENT_AGENTS_KEY)
      const parsed = raw ? JSON.parse(raw) : []
      if (Array.isArray(parsed)) {
        setRecentAgents(parsed.filter((item): item is string => typeof item === "string").slice(0, 20))
      }
    } catch {
      setRecentAgents([])
    }
  }, [])

  const recentIndexMap = useMemo(() => {
    const map = new Map<string, number>()
    recentAgents.forEach((id, index) => map.set(id, index))
    return map
  }, [recentAgents])

  const orderedAgents = useMemo(() => {
    return [...agents].sort((a, b) => {
      const ai = recentIndexMap.get(a)
      const bi = recentIndexMap.get(b)
      if (ai !== undefined && bi !== undefined) return ai - bi
      if (ai !== undefined) return -1
      if (bi !== undefined) return 1
      return a.localeCompare(b)
    })
  }, [agents, recentIndexMap])

  const handleSelectAgent = (agentId: string) => {
    onSelectedAgentChange(agentId)
    setRecentAgents((prev) => {
      const next = [agentId, ...prev.filter((id) => id !== agentId)].slice(0, 20)
      try {
        window.localStorage.setItem(RECENT_AGENTS_KEY, JSON.stringify(next))
      } catch {}
      return next
    })
  }

  const filteredAgents = useMemo(() => {
    if (!normalizedAgentSearch) {
      return orderedAgents.slice(0, 100)
    }

    const scored = orderedAgents
      .map((agentId) => {
        const text = agentId.toLowerCase()
        const index = text.indexOf(normalizedAgentSearch)

        if (index < 0) {
          return null
        }

        let score = 3
        if (text === normalizedAgentSearch) score = 0
        else if (text.startsWith(normalizedAgentSearch)) score = 1
        else if (index > 0) score = 2

        return { agentId, score, index }
      })
      .filter((item): item is { agentId: string; score: number; index: number } => item !== null)
      .sort((a, b) => {
        const recentA = recentIndexMap.get(a.agentId)
        const recentB = recentIndexMap.get(b.agentId)
        return (
          a.score - b.score ||
          a.index - b.index ||
          (recentA ?? Number.MAX_SAFE_INTEGER) - (recentB ?? Number.MAX_SAFE_INTEGER) ||
          a.agentId.localeCompare(b.agentId)
        )
      })

    return scored.slice(0, 100).map((item) => item.agentId)
  }, [normalizedAgentSearch, orderedAgents, recentIndexMap])

  const renderHighlightedAgent = (agentId: string) => {
    if (!normalizedAgentSearch) {
      return agentId
    }

    const lower = agentId.toLowerCase()
    const start = lower.indexOf(normalizedAgentSearch)

    if (start < 0) {
      return agentId
    }

    const end = start + normalizedAgentSearch.length

    return (
      <>
        {agentId.slice(0, start)}
        <span className="rounded bg-primary/15 px-0.5 text-foreground">
          {agentId.slice(start, end)}
        </span>
        {agentId.slice(end)}
      </>
    )
  }

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
      <div className="space-y-2">
        <div className="flex h-5 items-center gap-2 text-sm text-muted-foreground">
          <Server className="h-4 w-4" /> {texts.agentLabel}
        </div>
        <Select
          open={agentSelectOpen}
          value={selectedAgent}
          onValueChange={handleSelectAgent}
          disabled={fetchingOptions}
          onOpenChange={(open) => {
            setAgentSelectOpen(open)
            if (!open) {
              setAgentSearch("")
            }
          }}
        >
          <SelectTrigger className="h-10">
            <SelectValue placeholder={texts.agentPlaceholder} />
          </SelectTrigger>
          <SelectContent>
            <div className="sticky top-0 z-10 bg-popover p-1">
              <Input
                value={agentSearch}
                onChange={(event) => setAgentSearch(event.target.value)}
                placeholder={texts.agentPlaceholder}
                className="h-8"
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault()
                    event.stopPropagation()
                    const first = filteredAgents[0]
                    if (first) {
                      handleSelectAgent(first)
                      setAgentSelectOpen(false)
                    }
                    return
                  }

                  event.stopPropagation()
                }}
              />
            </div>
            {filteredAgents.map((agentId) => (
              <SelectItem key={agentId} value={agentId}>
                {renderHighlightedAgent(agentId)}
              </SelectItem>
            ))}
            {filteredAgents.length === 0 ? (
              <div className="px-2 py-2 text-xs text-muted-foreground">No matching agents</div>
            ) : null}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <div className="flex h-5 items-center gap-2 text-sm text-muted-foreground">
          <Database className="h-4 w-4" /> {texts.metricLabel}
        </div>
        <Select value={selectedMetric} onValueChange={onSelectedMetricChange} disabled={fetchingOptions}>
          <SelectTrigger className="h-10">
            <SelectValue placeholder={texts.metricPlaceholder} />
          </SelectTrigger>
          <SelectContent>
            {metricOptions.map((metric) => (
              <SelectItem key={metric.value} value={metric.value}>
                <div className="flex flex-col">
                  <span>{metric.label}</span>
                  {metric.subtitle ? (
                    <span className="text-xs text-muted-foreground">{metric.subtitle}</span>
                  ) : null}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="md:col-span-2">
        <FilterToolbar
          className="md:grid-cols-1 xl:grid-cols-1"
          search={{
            value: labelFilter,
            onValueChange: onLabelFilterChange,
            placeholder: texts.labelFilterPlaceholder,
            label: texts.labelFilterLabel,
            inputClassName: "h-10",
          }}
        />
      </div>

      <div className="space-y-2">
        <div className="flex h-5 items-center text-sm text-muted-foreground">{texts.queryModeLabel}</div>
        <div className="flex h-10 items-center justify-between rounded-md border px-3">
          <span className="text-sm">{texts.queryModeAuto}</span>
          <Switch checked={autoQuery} onCheckedChange={onAutoQueryChange} />
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex h-5 items-center text-sm text-muted-foreground">{texts.timeRangeLabel}</div>
        <Select value={timeRange} onValueChange={(value) => onTimeRangeChange(value as MetricsTimeRange)}>
          <SelectTrigger className="h-10">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="15m">{texts.timeRange15m}</SelectItem>
            <SelectItem value="30m">{texts.timeRange30m}</SelectItem>
            <SelectItem value="1h">{texts.timeRange1h}</SelectItem>
            <SelectItem value="6h">{texts.timeRange6h}</SelectItem>
            <SelectItem value="24h">{texts.timeRange24h}</SelectItem>
            <SelectItem value="7d">{texts.timeRange7d}</SelectItem>
            <SelectItem value="all">{texts.timeRangeAll}</SelectItem>
            <SelectItem value="custom">{texts.timeRangeCustom}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2 md:col-span-2">
        <div className="h-5" />
        <div className="flex flex-wrap items-center gap-2">
          <Button className="h-10 min-w-[160px] flex-1" onClick={onRefresh} disabled={!hasQueryCondition || querying}>
            {querying ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
            {texts.refreshDataButton}
          </Button>
          <Button type="button" variant="outline" size="icon" className="h-10 w-10" onClick={onResetFilters} title={texts.resetFiltersTitle}>
            <RotateCcw className="h-4 w-4" />
          </Button>
          <Button type="button" variant="outline" size="icon" className="h-10 w-10" onClick={onExportCsv} disabled={!canExport} title={texts.exportCsvTitle}>
            <Download className="h-4 w-4" />
          </Button>
          <Button type="button" variant="outline" size="icon" className="h-10 w-10" onClick={onExportJson} disabled={!canExport} title={texts.exportJsonTitle}>
            <FileJson2 className="h-4 w-4" />
          </Button>
          <Button type="button" variant="outline" size="icon" className="h-10 w-10" onClick={onCopyQueryLink} title={texts.copyQueryLinkTitle}>
            <Link2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {timeRange === "custom" ? (
        <>
          <div className="space-y-2 md:col-span-2">
            <div className="text-sm text-muted-foreground">{texts.startTimeLabel}</div>
            <Input type="datetime-local" className="h-10" value={customFrom} onChange={(event) => onCustomFromChange(event.target.value)} />
          </div>
          <div className="space-y-2 md:col-span-2">
            <div className="text-sm text-muted-foreground">{texts.endTimeLabel}</div>
            <Input type="datetime-local" className="h-10" value={customTo} onChange={(event) => onCustomToChange(event.target.value)} />
          </div>
        </>
      ) : null}
    </div>
  )
}
