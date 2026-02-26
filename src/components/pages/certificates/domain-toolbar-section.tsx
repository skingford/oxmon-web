"use client"

import { ReactNode } from "react"
import { DomainHeaderActions } from "@/components/pages/certificates/domain-header-actions"

type DomainToolbarSectionProps = {
  title: string
  description: string
  checkingAll: boolean
  loading: boolean
  refreshing: boolean
  onCheckAllDomains: () => void
  onRefreshDomains: () => void
  checkAllLabel: string
  refreshLabel: string
  children: ReactNode
}

export function DomainToolbarSection({
  title,
  description,
  checkingAll,
  loading,
  refreshing,
  onCheckAllDomains,
  onRefreshDomains,
  checkAllLabel,
  refreshLabel,
  children,
}: DomainToolbarSectionProps) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">{title}</h2>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>

      <DomainHeaderActions
        checkingAll={checkingAll}
        loading={loading}
        refreshing={refreshing}
        onCheckAllDomains={onCheckAllDomains}
        onRefreshDomains={onRefreshDomains}
        checkAllLabel={checkAllLabel}
        refreshLabel={refreshLabel}
      >
        {children}
      </DomainHeaderActions>
    </div>
  )
}
