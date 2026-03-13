"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { FilterToolbar } from "@/components/ui/filter-toolbar"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

type TranslateFn = (path: string, values?: Record<string, string | number>) => string

type DomainFiltersCardProps = {
  t: TranslateFn
  domainKeyword: string
  statusFilter: "all" | "enabled" | "disabled"
  hasPendingFilterChanges: boolean
  hasActiveFilters: boolean
  onDomainKeywordChange: (value: string) => void
  onStatusFilterChange: (value: "all" | "enabled" | "disabled") => void
  onApplyFilters: () => void
  onResetFilters: () => void
}

export function DomainFiltersCard({
  t,
  domainKeyword,
  statusFilter,
  hasPendingFilterChanges,
  hasActiveFilters,
  onDomainKeywordChange,
  onStatusFilterChange,
  onApplyFilters,
  onResetFilters,
}: DomainFiltersCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("certificates.domains.filtersTitle")}</CardTitle>
        <CardDescription>{t("certificates.domains.filtersDescription")}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <FilterToolbar
          className="gap-3 md:grid-cols-2 xl:grid-cols-4"
          search={{
            value: domainKeyword,
            onValueChange: onDomainKeywordChange,
            label: t("certificates.domains.filterDomainLabel"),
            placeholder: t("certificates.domains.filterDomainPlaceholder"),
            inputClassName: "h-10",
          }}
        >
          <div className="space-y-2">
            <Label>{t("certificates.domains.filterStatusLabel")}</Label>
            <Select value={statusFilter} onValueChange={(value) => onStatusFilterChange(value as "all" | "enabled" | "disabled")}>
              <SelectTrigger className="h-10 w-full bg-background">
                <SelectValue placeholder={t("certificates.domains.filterStatusAll")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("certificates.domains.filterStatusAll")}</SelectItem>
                <SelectItem value="enabled">{t("certificates.domains.filterStatusEnabled")}</SelectItem>
                <SelectItem value="disabled">{t("certificates.domains.filterStatusDisabled")}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="md:col-span-2 xl:col-span-2 flex flex-wrap items-end justify-end gap-2 pt-1">
            {hasPendingFilterChanges ? (
              <Badge variant="outline" className="h-9 rounded-md px-3 text-xs">
                {t("certificates.domains.pendingFilterChanges")}
              </Badge>
            ) : null}
            <Button type="button" onClick={onApplyFilters} disabled={!hasPendingFilterChanges} className="h-10 min-w-[112px]">
              {t("certificates.domains.applyFilters")}
            </Button>
            <Button type="button" variant="outline" onClick={onResetFilters} disabled={!hasActiveFilters && !hasPendingFilterChanges} className="h-10 min-w-[112px]">
              {t("certificates.domains.clearFilters")}
            </Button>
          </div>
        </FilterToolbar>
      </CardContent>
    </Card>
  )
}
