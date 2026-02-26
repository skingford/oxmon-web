"use client"

import { CertDomain } from "@/types/api"
import { DomainFiltersCard } from "@/components/pages/certificates/domain-filters-card"
import { DomainStatsCards } from "@/components/pages/certificates/domain-stats-cards"
import { DomainTableCard } from "@/components/pages/certificates/domain-table-card"

type TranslateFn = (path: string, values?: Record<string, string | number>) => string

type DomainContentSectionProps = {
  t: TranslateFn
  locale: "zh" | "en"
  stats: {
    total: number
    enabled: number
    disabled: number
  }
  filters: {
    domainKeyword: string
    statusFilter: "all" | "enabled" | "disabled"
    onDomainKeywordChange: (value: string) => void
    onStatusFilterChange: (value: "all" | "enabled" | "disabled") => void
    onResetFilters: () => void
  }
  table: {
    pageLimit: number
    loading: boolean
    domains: CertDomain[]
    pageNumber: number
    canGoPrev: boolean
    canGoNext: boolean
    checkingId: string | null
    updatingId: string | null
    deletingId: string | null
    onOpenCreateDialog: () => void
    onToggleEnabled: (domain: CertDomain, enabled: boolean) => void
    onCheckDomain: (domain: CertDomain) => void
    onOpenHistory: (domain: CertDomain) => void
    onDeleteDomain: (domain: CertDomain) => void
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
        onDomainKeywordChange={filters.onDomainKeywordChange}
        onStatusFilterChange={filters.onStatusFilterChange}
        onResetFilters={filters.onResetFilters}
      />

      <DomainTableCard
        t={t}
        locale={locale}
        pageLimit={table.pageLimit}
        loading={table.loading}
        domains={table.domains}
        pageNumber={table.pageNumber}
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
