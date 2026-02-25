"use client"

import { ReactNode } from "react"
import { Button } from "@/components/ui/button"
import { Loader2, RefreshCw, ShieldCheck } from "lucide-react"

type DomainHeaderActionsProps = {
  checkingAll: boolean
  loading: boolean
  refreshing: boolean
  onCheckAllDomains: () => void
  onRefreshDomains: () => void
  checkAllLabel: string
  refreshLabel: string
  children?: ReactNode
}

export function DomainHeaderActions({
  checkingAll,
  loading,
  refreshing,
  onCheckAllDomains,
  onRefreshDomains,
  checkAllLabel,
  refreshLabel,
  children,
}: DomainHeaderActionsProps) {
  return (
    <div className="flex items-center gap-2">
      <Button
        variant="outline"
        onClick={onCheckAllDomains}
        disabled={checkingAll}
      >
        {checkingAll ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ShieldCheck className="mr-2 h-4 w-4" />}
        {checkAllLabel}
      </Button>

      <Button
        variant="outline"
        onClick={onRefreshDomains}
        disabled={loading || refreshing}
      >
        <RefreshCw className={`mr-2 h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
        {refreshLabel}
      </Button>

      {children}
    </div>
  )
}
