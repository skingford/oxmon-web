"use client"

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
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
      <div className="space-y-2">
        <div className="flex h-5 items-center gap-2 text-sm text-muted-foreground">
          <Server className="h-4 w-4" /> {texts.agentLabel}
        </div>
        <Select value={selectedAgent} onValueChange={onSelectedAgentChange} disabled={fetchingOptions}>
          <SelectTrigger className="h-10">
            <SelectValue placeholder={texts.agentPlaceholder} />
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
