"use client"

import { RefreshCw } from "lucide-react"
import { useAppTranslations } from "@/hooks/use-app-translations"
import { ALERTS_ALL_SOURCE_VALUE } from "@/components/alerts/constants"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { FilterToolbar } from "@/components/ui/filter-toolbar"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { SearchableCombobox, type SearchableComboboxOption } from "@/components/ui/searchable-combobox"

type ActiveAlertsTopControlsProps = {
  autoRefresh: boolean
  loading: boolean
  refreshing: boolean
  onAutoRefreshChange: (value: boolean) => void
  onRefresh: () => void
}

type ActiveAlertsListHeaderProps = {
  sourceId: string
  sourceOptions: SearchableComboboxOption[]
  searchQuery: string
  hasPendingFilterChanges: boolean
  hasActiveFilters: boolean
  onSourceIdChange: (value: string) => void
  onSearchQueryChange: (value: string) => void
  onApplyFilters: () => void
  onResetFilters: () => void
}

export function ActiveAlertsTopControls({
  autoRefresh,
  loading,
  refreshing,
  onAutoRefreshChange,
  onRefresh,
}: ActiveAlertsTopControlsProps) {
  const { t } = useAppTranslations("alerts")

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">{t("active.title")}</h2>
          <p className="text-sm text-muted-foreground">{t("active.description")}</p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Switch id="auto-refresh" checked={autoRefresh} onCheckedChange={onAutoRefreshChange} />
            <Label htmlFor="auto-refresh" className="cursor-pointer text-sm">
              {t("active.autoRefresh")}
            </Label>
          </div>
          <Button variant="outline" onClick={onRefresh} disabled={loading || refreshing}>
            <RefreshCw className={`mr-2 h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
            {t("active.btnRefresh")}
          </Button>
        </div>
      </div>

      {autoRefresh ? (
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <div className="h-2 w-2 animate-pulse rounded-full bg-emerald-500" />
          {t("active.autoRefreshEnabled")}
        </div>
      ) : null}
    </>
  )
}

export function ActiveAlertsListHeader({
  sourceId,
  sourceOptions,
  searchQuery,
  hasPendingFilterChanges,
  hasActiveFilters,
  onSourceIdChange,
  onSearchQueryChange,
  onApplyFilters,
  onResetFilters,
}: ActiveAlertsListHeaderProps) {
  const { t } = useAppTranslations("alerts")
  const sourceSelectOptions: SearchableComboboxOption[] = [
    { value: ALERTS_ALL_SOURCE_VALUE, label: t("active.filterSourceAll") },
    ...sourceOptions,
  ]

  return (
    <CardHeader>
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <CardTitle>{t("active.title")}</CardTitle>
          <CardDescription>{t("active.description")}</CardDescription>
        </div>
        <div className="grid w-full gap-3 md:w-[760px] md:grid-cols-3">
          <div className="space-y-2">
            <Label htmlFor="active-alert-source">{t("active.filterSource")}</Label>
            <SearchableCombobox
              inputId="active-alert-source"
              value={sourceId || ALERTS_ALL_SOURCE_VALUE}
              options={sourceSelectOptions}
              onValueChange={(value) => onSourceIdChange(value === ALERTS_ALL_SOURCE_VALUE ? "" : value)}
              placeholder={t("active.filterSourcePlaceholder")}
              emptyText={t("active.filterSourceEmpty")}
              inputClassName="h-10"
            />
          </div>
          <FilterToolbar
            className="md:grid-cols-1 xl:grid-cols-1"
            search={{
              value: searchQuery,
              onValueChange: onSearchQueryChange,
              placeholder: t("active.searchPlaceholder"),
              label: t("active.filterKeyword"),
              inputClassName: "h-10",
            }}
          />
          <div className="flex flex-wrap items-end justify-end gap-2 pt-7">
            {hasPendingFilterChanges ? (
              <Badge variant="outline" className="h-9 rounded-md px-3 text-xs">
                {t("active.pendingFilterChanges")}
              </Badge>
            ) : null}
            <Button variant="outline" onClick={onResetFilters} disabled={!hasActiveFilters && !hasPendingFilterChanges} className="h-10 min-w-[112px]">
              {t("active.resetFilters")}
            </Button>
            <Button onClick={onApplyFilters} disabled={!hasPendingFilterChanges} className="h-10 min-w-[112px]">
              {t("active.applyFilters")}
            </Button>
          </div>
        </div>
      </div>
    </CardHeader>
  )
}
