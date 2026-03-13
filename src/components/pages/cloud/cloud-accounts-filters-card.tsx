"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { FilterToolbar } from "@/components/ui/filter-toolbar"
import { Label } from "@/components/ui/label"
import { SearchableCombobox } from "@/components/ui/searchable-combobox"

type EnabledFilter = "all" | "enabled" | "disabled"

type CloudAccountsFiltersCardProps = {
  searchKeyword: string
  providerFilter: string
  enabledFilter: EnabledFilter
  hasPendingChanges: boolean
  hasActiveFilters: boolean
  providerOptions: Array<{
    value: string
    label: string
  }>
  onSearchKeywordChange: (value: string) => void
  onProviderFilterChange: (value: string) => void
  onEnabledFilterChange: (value: EnabledFilter) => void
  onApplyFilters: () => void
  onResetFilters: () => void
  texts: {
    title: string
    description: string
    filterSearch: string
    filterSearchPlaceholder: string
    filterProvider: string
    filterProviderAll: string
    filterStatus: string
    filterStatusAll: string
    filterStatusEnabled: string
    filterStatusDisabled: string
    applyFilters: string
    clearFilters: string
    pendingFilterChanges: string
  }
}

export function CloudAccountsFiltersCard({
  searchKeyword,
  providerFilter,
  enabledFilter,
  hasPendingChanges,
  hasActiveFilters,
  providerOptions,
  onSearchKeywordChange,
  onProviderFilterChange,
  onEnabledFilterChange,
  onApplyFilters,
  onResetFilters,
  texts,
}: CloudAccountsFiltersCardProps) {
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
          <div className="space-y-2">
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

          <div className="space-y-2">
            <Label>{texts.filterStatus}</Label>
            <SearchableCombobox
              value={enabledFilter}
              options={[
                { value: "all", label: texts.filterStatusAll },
                { value: "enabled", label: texts.filterStatusEnabled },
                { value: "disabled", label: texts.filterStatusDisabled },
              ]}
              onValueChange={(value) => onEnabledFilterChange(value as EnabledFilter)}
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
