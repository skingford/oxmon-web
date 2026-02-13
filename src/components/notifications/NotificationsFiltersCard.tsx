"use client"

import { FilterX } from "lucide-react"
import { useAppTranslations } from "@/hooks/use-app-translations"
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle } from "@/components/ui/card"
import { FilterToolbar } from "@/components/ui/filter-toolbar"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

type NotificationStatusFilter = "all" | "enabled" | "disabled"

type NotificationsFiltersCardProps = {
  searchKeyword: string
  typeFilter: string
  severityFilter: string
  statusFilter: NotificationStatusFilter
  systemConfigFilter: string
  hasActiveFilters: boolean
  typeOptions: Array<{
    value: string
    label: string
  }>
  severityOptions: Array<{
    value: string
    label: string
  }>
  systemConfigOptions: Array<{
    id: string
    label: string
  }>
  onSearchKeywordChange: (value: string) => void
  onTypeFilterChange: (value: string) => void
  onSeverityFilterChange: (value: string) => void
  onStatusFilterChange: (value: NotificationStatusFilter) => void
  onSystemConfigFilterChange: (value: string) => void
  onResetFilters: () => void
}

export function NotificationsFiltersCard({
  searchKeyword,
  typeFilter,
  severityFilter,
  statusFilter,
  systemConfigFilter,
  hasActiveFilters,
  typeOptions,
  severityOptions,
  systemConfigOptions,
  onSearchKeywordChange,
  onTypeFilterChange,
  onSeverityFilterChange,
  onStatusFilterChange,
  onSystemConfigFilterChange,
  onResetFilters,
}: NotificationsFiltersCardProps) {
  const { t } = useAppTranslations("pages")

  return (
    <Card>
      <CardHeader className="space-y-4">
        <div>
          <CardTitle>{t("notifications.filtersTitle")}</CardTitle>
        </div>

        <FilterToolbar
          className="xl:grid-cols-5"
          search={{
            value: searchKeyword,
            onValueChange: onSearchKeywordChange,
            placeholder: t("notifications.searchPlaceholder"),
            inputClassName: "h-10",
          }}
        >
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

          <Select value={systemConfigFilter} onValueChange={onSystemConfigFilterChange}>
            <SelectTrigger className="h-10 w-full bg-background">
              <SelectValue placeholder={t("notifications.filterSystemConfigLabel")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("notifications.filterSystemConfigAll")}</SelectItem>
              <SelectItem value="unbound">{t("notifications.filterSystemConfigUnbound")}</SelectItem>
              {systemConfigOptions.map((systemConfigOption) => (
                <SelectItem key={systemConfigOption.id} value={systemConfigOption.id}>
                  {systemConfigOption.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="flex items-center gap-2">
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
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="h-10 w-10"
              onClick={onResetFilters}
              disabled={!hasActiveFilters}
              title={t("notifications.clearFilters")}
            >
              <FilterX className="h-4 w-4" />
            </Button>
          </div>
        </FilterToolbar>
      </CardHeader>
    </Card>
  )
}
