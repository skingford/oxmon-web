"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { FilterToolbar } from "@/components/ui/filter-toolbar"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

type ContactsStatusFilter = "all" | "enabled" | "disabled"

type InstanceContactsFiltersCardProps = {
  searchKeyword: string
  statusFilter: ContactsStatusFilter
  hasPendingChanges: boolean
  hasActiveFilters: boolean
  onSearchKeywordChange: (value: string) => void
  onStatusFilterChange: (value: ContactsStatusFilter) => void
  onApplyFilters: () => void
  onResetFilters: () => void
  texts: {
    title: string
    description: string
    searchLabel: string
    searchPlaceholder: string
    statusLabel: string
    statusAll: string
    statusEnabled: string
    statusDisabled: string
    applyFilters: string
    clearFilters: string
    pendingFilterChanges: string
  }
}

export function InstanceContactsFiltersCard({
  searchKeyword,
  statusFilter,
  hasPendingChanges,
  hasActiveFilters,
  onSearchKeywordChange,
  onStatusFilterChange,
  onApplyFilters,
  onResetFilters,
  texts,
}: InstanceContactsFiltersCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{texts.title}</CardTitle>
        <CardDescription>{texts.description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <FilterToolbar
          className="gap-3 md:grid-cols-2 xl:grid-cols-3"
          search={{
            value: searchKeyword,
            onValueChange: onSearchKeywordChange,
            label: texts.searchLabel,
            placeholder: texts.searchPlaceholder,
            inputClassName: "h-10",
          }}
        >
          <div className="space-y-2">
            <Label>{texts.statusLabel}</Label>
            <Select value={statusFilter} onValueChange={(value) => onStatusFilterChange(value as ContactsStatusFilter)}>
              <SelectTrigger className="h-10 w-full bg-background">
                <SelectValue placeholder={texts.statusLabel} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{texts.statusAll}</SelectItem>
                <SelectItem value="enabled">{texts.statusEnabled}</SelectItem>
                <SelectItem value="disabled">{texts.statusDisabled}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </FilterToolbar>

        <div className="flex flex-wrap items-center justify-end gap-2 pt-1">
          {hasPendingChanges ? (
            <Badge variant="outline" className="h-9 rounded-md px-3 text-xs">
              {texts.pendingFilterChanges}
            </Badge>
          ) : null}
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
      </CardContent>
    </Card>
  )
}
