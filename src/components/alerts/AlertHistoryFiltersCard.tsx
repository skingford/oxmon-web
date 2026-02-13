"use client"

import { Filter, X } from "lucide-react"
import {
  useAppTranslations,
  type AppNamespaceTranslator,
} from "@/hooks/use-app-translations"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { FilterToolbar } from "@/components/ui/filter-toolbar"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

type AlertHistoryFiltersCardProps = {
  filterAgentId: string
  filterSeverity: string
  filterStatus: string
  filterTimeFrom: string
  filterTimeTo: string
  hasActiveFilters: boolean
  onFilterAgentIdChange: (value: string) => void
  onFilterSeverityChange: (value: string) => void
  onFilterStatusChange: (value: string) => void
  onFilterTimeFromChange: (value: string) => void
  onFilterTimeToChange: (value: string) => void
  onApplyFilters: () => void
  onResetFilters: () => void
}

function getStatusText(status: string, t: AppNamespaceTranslator<"alerts">) {
  if (status === "resolved") {
    return t("history.statusResolved")
  }

  if (status === "acknowledged") {
    return t("history.statusAcknowledged")
  }

  if (status === "open") {
    return t("history.statusOpen")
  }

  return status
}

function getSeverityText(severity: string, t: AppNamespaceTranslator<"alerts">) {
  if (severity === "critical") {
    return t("severity.critical")
  }

  if (severity === "warning") {
    return t("severity.warning")
  }

  if (severity === "info") {
    return t("severity.info")
  }

  return severity
}

export function AlertHistoryFiltersCard({
  filterAgentId,
  filterSeverity,
  filterStatus,
  filterTimeFrom,
  filterTimeTo,
  hasActiveFilters,
  onFilterAgentIdChange,
  onFilterSeverityChange,
  onFilterStatusChange,
  onFilterTimeFromChange,
  onFilterTimeToChange,
  onApplyFilters,
  onResetFilters,
}: AlertHistoryFiltersCardProps) {
  const { t } = useAppTranslations("alerts")

  return (
    <Card className="glass-card">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              {t("history.filtersTitle")}
            </CardTitle>
            <CardDescription>{t("history.filtersDescription")}</CardDescription>
          </div>
          {hasActiveFilters ? (
            <Button variant="ghost" size="sm" onClick={onResetFilters}>
              <X className="mr-2 h-4 w-4" />
              {t("history.clearAllFilters")}
            </Button>
          ) : null}
        </div>
      </CardHeader>

      <CardContent>
        <FilterToolbar
          className="gap-4 md:grid-cols-2 lg:grid-cols-5 xl:grid-cols-5"
          search={{
            value: filterAgentId,
            onValueChange: onFilterAgentIdChange,
            placeholder: t("history.filterAgentPlaceholder"),
            label: t("history.filterAgent"),
            inputClassName: "h-10",
          }}
        >
          <div className="space-y-2">
            <Label htmlFor="filter-severity">{t("history.filterSeverity")}</Label>
            <Select value={filterSeverity} onValueChange={onFilterSeverityChange}>
              <SelectTrigger id="filter-severity" className="h-10 w-full bg-background">
                <SelectValue placeholder={t("history.filterSelectAllPlaceholder")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("history.statusAll")}</SelectItem>
                <SelectItem value="critical">{t("severity.critical")}</SelectItem>
                <SelectItem value="warning">{t("severity.warning")}</SelectItem>
                <SelectItem value="info">{t("severity.info")}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="filter-status">{t("history.filterStatus")}</Label>
            <Select value={filterStatus} onValueChange={onFilterStatusChange}>
              <SelectTrigger id="filter-status" className="h-10 w-full bg-background">
                <SelectValue placeholder={t("history.filterSelectAllPlaceholder")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("history.statusAll")}</SelectItem>
                <SelectItem value="resolved">{t("history.statusResolved")}</SelectItem>
                <SelectItem value="acknowledged">{t("history.statusAcknowledged")}</SelectItem>
                <SelectItem value="open">{t("history.statusOpen")}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="filter-from">{t("history.filterTimeFrom")}</Label>
            <Input
              id="filter-from"
              type="datetime-local"
              value={filterTimeFrom}
              onChange={(event) => onFilterTimeFromChange(event.target.value)}
              className="h-10"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="filter-to">{t("history.filterTimeTo")}</Label>
            <Input
              id="filter-to"
              type="datetime-local"
              value={filterTimeTo}
              onChange={(event) => onFilterTimeToChange(event.target.value)}
              className="h-10"
            />
          </div>
        </FilterToolbar>

        <div className="mt-4 flex items-center gap-2">
          <Button onClick={onApplyFilters}>
            <Filter className="mr-2 h-4 w-4" />
            {t("history.filterApply")}
          </Button>
          <Button variant="outline" onClick={onResetFilters}>
            {t("history.filterReset")}
          </Button>
        </div>

        {hasActiveFilters ? (
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <span className="text-xs text-muted-foreground">{t("history.activeFiltersLabel")}</span>
            {filterAgentId ? (
              <Badge variant="secondary" className="gap-1">
                {t("history.activeFilterAgent", { value: filterAgentId })}
                <button onClick={() => onFilterAgentIdChange("")} className="ml-1 hover:text-foreground">
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ) : null}

            {filterSeverity && filterSeverity !== "all" ? (
              <Badge variant="secondary" className="gap-1">
                {t("history.activeFilterSeverity", { value: getSeverityText(filterSeverity, t) })}
                <button onClick={() => onFilterSeverityChange("")} className="ml-1 hover:text-foreground">
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ) : null}

            {filterStatus && filterStatus !== "all" ? (
              <Badge variant="secondary" className="gap-1">
                {t("history.activeFilterStatus", { value: getStatusText(filterStatus, t) })}
                <button onClick={() => onFilterStatusChange("")} className="ml-1 hover:text-foreground">
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ) : null}

            {filterTimeFrom ? (
              <Badge variant="secondary" className="gap-1">
                {t("history.activeFilterStart", { value: new Date(filterTimeFrom).toLocaleDateString() })}
                <button onClick={() => onFilterTimeFromChange("")} className="ml-1 hover:text-foreground">
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ) : null}

            {filterTimeTo ? (
              <Badge variant="secondary" className="gap-1">
                {t("history.activeFilterEnd", { value: new Date(filterTimeTo).toLocaleDateString() })}
                <button onClick={() => onFilterTimeToChange("")} className="ml-1 hover:text-foreground">
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ) : null}
          </div>
        ) : null}
      </CardContent>
    </Card>
  )
}
