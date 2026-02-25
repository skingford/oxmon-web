"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { FilterToolbar } from "@/components/ui/filter-toolbar"

type TranslateFn = (path: string, values?: Record<string, string | number>) => string

type DomainFiltersCardProps = {
  t: TranslateFn
  domainKeyword: string
  statusFilter: "all" | "enabled" | "disabled"
  onDomainKeywordChange: (value: string) => void
  onStatusFilterChange: (value: "all" | "enabled" | "disabled") => void
  onResetFilters: () => void
}

export function DomainFiltersCard({
  t,
  domainKeyword,
  statusFilter,
  onDomainKeywordChange,
  onStatusFilterChange,
  onResetFilters,
}: DomainFiltersCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("certificates.domains.filtersTitle")}</CardTitle>
        <CardDescription>{t("certificates.domains.filtersDescription")}</CardDescription>
      </CardHeader>
      <CardContent>
        <FilterToolbar
          className="gap-3 md:grid-cols-2 xl:grid-cols-2"
          search={{
            value: domainKeyword,
            onValueChange: onDomainKeywordChange,
            placeholder: t("certificates.domains.filterDomainPlaceholder"),
            inputClassName: "h-10",
          }}
        >
          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              variant={statusFilter === "all" ? "default" : "outline"}
              onClick={() => onStatusFilterChange("all")}
              className="h-10"
            >
              {t("certificates.domains.filterStatusAll")}
            </Button>
            <Button
              type="button"
              variant={statusFilter === "enabled" ? "default" : "outline"}
              onClick={() => onStatusFilterChange("enabled")}
              className="h-10"
            >
              {t("certificates.domains.filterStatusEnabled")}
            </Button>
            <Button
              type="button"
              variant={statusFilter === "disabled" ? "default" : "outline"}
              onClick={() => onStatusFilterChange("disabled")}
              className="h-10"
            >
              {t("certificates.domains.filterStatusDisabled")}
            </Button>
            <Button type="button" variant="outline" onClick={onResetFilters} className="h-10">
              {t("certificates.domains.clearFilters")}
            </Button>
          </div>
        </FilterToolbar>
      </CardContent>
    </Card>
  )
}
