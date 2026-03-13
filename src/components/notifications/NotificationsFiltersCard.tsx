"use client"

import { useAppTranslations } from "@/hooks/use-app-translations"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { FilterToolbar } from "@/components/ui/filter-toolbar"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

type NotificationStatusFilter = "all" | "enabled" | "disabled"

type NotificationsFiltersCardProps = {
  searchKeyword: string
  typeFilter: string
  severityFilter: string
  statusFilter: NotificationStatusFilter
  hasPendingFilterChanges: boolean
  hasActiveFilters: boolean
  typeOptions: Array<{
    value: string
    label: string
  }>
  severityOptions: Array<{
    value: string
    label: string
  }>
  onSearchKeywordChange: (value: string) => void
  onTypeFilterChange: (value: string) => void
  onSeverityFilterChange: (value: string) => void
  onStatusFilterChange: (value: NotificationStatusFilter) => void
  onApplyFilters: () => void
  onResetFilters: () => void
}

export function NotificationsFiltersCard({
  searchKeyword,
  typeFilter,
  severityFilter,
  statusFilter,
  hasPendingFilterChanges,
  hasActiveFilters,
  typeOptions,
  severityOptions,
  onSearchKeywordChange,
  onTypeFilterChange,
  onSeverityFilterChange,
  onStatusFilterChange,
  onApplyFilters,
  onResetFilters,
}: NotificationsFiltersCardProps) {
  const { t } = useAppTranslations("pages")

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("notifications.filtersTitle")}</CardTitle>
        <CardDescription>{t("notifications.filtersDescription")}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <FilterToolbar
          className="xl:grid-cols-4"
          search={{
            value: searchKeyword,
            onValueChange: onSearchKeywordChange,
            label: t("notifications.searchLabel"),
            placeholder: t("notifications.searchPlaceholder"),
            inputClassName: "h-10",
          }}
        >
          <div className="space-y-2">
            <Label>{t("notifications.filterTypeLabel")}</Label>
            <Select value={typeFilter} onValueChange={onTypeFilterChange}>
              <SelectTrigger className="h-10 w-full bg-background">
                <SelectValue placeholder={t("notifications.filterTypeLabel")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("notifications.filterTypeAll")}</SelectItem>
                {typeOptions.map((typeOption) => (
                  <SelectItem key={typeOption.value} value={typeOption.value}>
                    {typeOption.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>{t("notifications.filterSeverityLabel")}</Label>
            <Select value={severityFilter} onValueChange={onSeverityFilterChange}>
              <SelectTrigger className="h-10 w-full bg-background">
                <SelectValue placeholder={t("notifications.filterSeverityLabel")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("notifications.filterSeverityAll")}</SelectItem>
                {severityOptions.map((severityOption) => (
                  <SelectItem key={severityOption.value} value={severityOption.value}>
                    {severityOption.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>{t("notifications.filterStatusLabel")}</Label>
            <Select value={statusFilter} onValueChange={(value) => onStatusFilterChange(value as NotificationStatusFilter)}>
              <SelectTrigger className="h-10 w-full bg-background">
                <SelectValue placeholder={t("notifications.filterStatusLabel")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("notifications.filterStatusAll")}</SelectItem>
                <SelectItem value="enabled">{t("notifications.filterStatusEnabled")}</SelectItem>
                <SelectItem value="disabled">{t("notifications.filterStatusDisabled")}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </FilterToolbar>

        <div className="flex flex-wrap items-center justify-end gap-2 pt-1">
          {hasPendingFilterChanges ? (
            <Badge variant="outline" className="h-9 rounded-md px-3 text-xs">
              {t("notifications.pendingFilterChanges")}
            </Badge>
          ) : null}
          <Button type="button" onClick={onApplyFilters} disabled={!hasPendingFilterChanges} className="h-10 min-w-[112px]">
            {t("notifications.applyFilters")}
          </Button>
          <Button type="button" variant="outline" onClick={onResetFilters} disabled={!hasActiveFilters && !hasPendingFilterChanges} className="h-10 min-w-[112px]">
            {t("notifications.clearFilters")}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
