"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { FilterToolbar } from "@/components/ui/filter-toolbar"
import { Label } from "@/components/ui/label"
import { SearchableCombobox } from "@/components/ui/searchable-combobox"

type CloudInstancesFiltersCardProps = {
  searchKeyword: string
  providerFilter: string
  regionFilter: string
  statusFilter: string
  hasPendingChanges: boolean
  hasActiveFilters: boolean
  providerOptions: Array<{
    value: string
    label: string
  }>
  regionOptions: string[]
  statusOptions: string[]
  onSearchKeywordChange: (value: string) => void
  onProviderFilterChange: (value: string) => void
  onRegionFilterChange: (value: string) => void
  onStatusFilterChange: (value: string) => void
  onApplyFilters: () => void
  onResetFilters: () => void
  getStatusLabel: (status: string) => string
  texts: {
    title: string
    description: string
    filterSearch: string
    filterSearchPlaceholder: string
    filterProvider: string
    filterProviderAll: string
    filterRegion: string
    filterRegionAll: string
    filterStatus: string
    filterStatusAll: string
    applyFilters: string
    clearFilters: string
    pendingFilterChanges: string
  }
}

export function CloudInstancesFiltersCard({
  searchKeyword,
  providerFilter,
  regionFilter,
  statusFilter,
  hasPendingChanges,
  hasActiveFilters,
  providerOptions,
  regionOptions,
  statusOptions,
  onSearchKeywordChange,
  onProviderFilterChange,
  onRegionFilterChange,
  onStatusFilterChange,
  onApplyFilters,
  onResetFilters,
  getStatusLabel,
  texts,
}: CloudInstancesFiltersCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{texts.title}</CardTitle>
        <CardDescription>{texts.description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <FilterToolbar
          className="gap-3 md:grid-cols-2 xl:grid-cols-4"
          search={{
            value: searchKeyword,
            onValueChange: onSearchKeywordChange,
            label: texts.filterSearch,
            placeholder: texts.filterSearchPlaceholder,
            inputClassName: "h-10",
          }}
        >
          <div className="min-w-0 space-y-2">
            <Label>{texts.filterProvider}</Label>
            <SearchableCombobox
              value={providerFilter}
              options={[
                { value: "all", label: texts.filterProviderAll },
                ...providerOptions,
              ]}
              onValueChange={onProviderFilterChange}
              placeholder={texts.filterProviderAll}
            />
          </div>

          <div className="min-w-0 space-y-2">
            <Label>{texts.filterRegion}</Label>
            <SearchableCombobox
              value={regionFilter}
              options={[
                { value: "all", label: texts.filterRegionAll },
                ...regionOptions.map((region) => ({
                  value: region,
                  label: region,
                })),
              ]}
              onValueChange={onRegionFilterChange}
              placeholder={texts.filterRegionAll}
            />
          </div>

          <div className="min-w-0 space-y-2">
            <Label>{texts.filterStatus}</Label>
            <SearchableCombobox
              value={statusFilter}
              options={[
                { value: "all", label: texts.filterStatusAll },
                ...statusOptions.map((status) => ({
                  value: status,
                  label: getStatusLabel(status),
                })),
              ]}
              onValueChange={onStatusFilterChange}
              placeholder={texts.filterStatusAll}
            />
          </div>

          <div className="md:col-span-2 xl:col-span-4 flex flex-wrap items-center justify-end gap-2 pt-1">
            {hasPendingChanges ? <Badge variant="outline" className="h-9 rounded-md px-3 text-xs">{texts.pendingFilterChanges}</Badge> : null}
            <Button type="button" onClick={onApplyFilters} disabled={!hasPendingChanges} className="h-10 min-w-[112px]">
              {texts.applyFilters}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={onResetFilters}
              disabled={!hasActiveFilters && !hasPendingChanges}
              className="h-10 min-w-[112px]"
            >
              {texts.clearFilters}
            </Button>
          </div>
        </FilterToolbar>
      </CardContent>
    </Card>
  )
}
