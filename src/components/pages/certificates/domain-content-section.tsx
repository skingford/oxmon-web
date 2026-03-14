"use client"

import { DomainOverviewItem } from "@/types/api"
import { DomainFiltersCard } from "@/components/pages/certificates/domain-filters-card"
import { DomainStatsCards } from "@/components/pages/certificates/domain-stats-cards"
import { DomainTableCard } from "@/components/pages/certificates/domain-table-card"

type TranslateFn = (path: string, values?: Record<string, string | number>) => string

type DomainContentSectionProps = {
  t: TranslateFn
  locale: "zh" | "en"
  stats: {
    total: number
    healthy: number
    failed: number
    expiring: number
  }
  filters: {
    domainKeyword: string
    statusFilter: "all" | "enabled" | "disabled"
    healthFilter: "all" | "healthy" | "failed" | "expiring"
    hasPendingFilterChanges: boolean
    hasActiveFilters: boolean
    onDomainKeywordChange: (value: string) => void
    onStatusFilterChange: (value: "all" | "enabled" | "disabled") => void
    onHealthFilterChange: (value: "all" | "healthy" | "failed" | "expiring") => void
    onApplyFilters: () => void
    onResetFilters: () => void
  }
  table: {
    pageLimit: number
    loading: boolean
    domains: DomainOverviewItem[]
    totalCount: number
    pageNumber: number
    totalPages: number
    rangeStart: number
    rangeEnd: number
    canGoPrev: boolean
    canGoNext: boolean
    checkingId: string | null
    updatingId: string | null
    deletingId: string | null
    onOpenCreateDialog: () => void
    onToggleEnabled: (domain: DomainOverviewItem, enabled: boolean) => void
    onCheckDomain: (domain: DomainOverviewItem) => void
    onOpenHistory: (domain: DomainOverviewItem) => void
    onDeleteDomain: (domain: DomainOverviewItem) => void
    onPrevPage: () => void
    onNextPage: () => void
  }
}

export function DomainContentSection({ t, locale, stats, filters, table }: DomainContentSectionProps) {
  return (
    <>
      <DomainStatsCards t={t} stats={stats} />

      <DomainFiltersCard
        t={t}
        domainKeyword={filters.domainKeyword}
        statusFilter={filters.statusFilter}
        healthFilter={filters.healthFilter}
        hasPendingFilterChanges={filters.hasPendingFilterChanges}
        hasActiveFilters={filters.hasActiveFilters}
        onDomainKeywordChange={filters.onDomainKeywordChange}
        onStatusFilterChange={filters.onStatusFilterChange}
        onHealthFilterChange={filters.onHealthFilterChange}
        onApplyFilters={filters.onApplyFilters}
        onResetFilters={filters.onResetFilters}
      />

      <DomainTableCard
        t={t}
        locale={locale}
        pageLimit={table.pageLimit}
        loading={table.loading}
        domains={table.domains}
        totalCount={table.totalCount}
        pageNumber={table.pageNumber}
        totalPages={table.totalPages}
        rangeStart={table.rangeStart}
        rangeEnd={table.rangeEnd}
        canGoPrev={table.canGoPrev}
        canGoNext={table.canGoNext}
        checkingId={table.checkingId}
        updatingId={table.updatingId}
        deletingId={table.deletingId}
        onOpenCreateDialog={table.onOpenCreateDialog}
        onToggleEnabled={table.onToggleEnabled}
        onCheckDomain={table.onCheckDomain}
        onOpenHistory={table.onOpenHistory}
        onDeleteDomain={table.onDeleteDomain}
        onPrevPage={table.onPrevPage}
        onNextPage={table.onNextPage}
      />
    </>
  )
}
