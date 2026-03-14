"use client"

import { ReadonlyURLSearchParams } from "next/navigation"
import { useEffect, useState } from "react"

export type CertificateDomainsStatusFilter = "all" | "enabled" | "disabled"
export type CertificateDomainsHealthFilter = "all" | "healthy" | "failed" | "expiring"

function parseStatusFilter(value: string | null): CertificateDomainsStatusFilter {
  return value === "enabled" || value === "disabled" ? value : "all"
}

function parseHealthFilter(value: string | null): CertificateDomainsHealthFilter {
  return value === "healthy" || value === "failed" || value === "expiring" ? value : "all"
}

function parseOffset(value: string | null) {
  const raw = Number(value || "0")

  if (!Number.isFinite(raw) || raw <= 0) {
    return 0
  }

  return Math.floor(raw)
}

type UseCertificateDomainsQueryStateParams = {
  pathname: string
  searchParams: ReadonlyURLSearchParams
  replace: (href: string, options: { scroll: boolean }) => void
}

export function useCertificateDomainsQueryState({
  pathname,
  searchParams,
  replace,
}: UseCertificateDomainsQueryStateParams) {
  const [domainKeyword, setDomainKeyword] = useState(() => searchParams.get("domain") || "")
  const [statusFilter, setStatusFilter] = useState<CertificateDomainsStatusFilter>(() =>
    parseStatusFilter(searchParams.get("status"))
  )
  const [domainKeywordDraft, setDomainKeywordDraft] = useState(() => searchParams.get("domain") || "")
  const [statusFilterDraft, setStatusFilterDraft] = useState<CertificateDomainsStatusFilter>(() =>
    parseStatusFilter(searchParams.get("status"))
  )
  const [healthFilter, setHealthFilter] = useState<CertificateDomainsHealthFilter>(() =>
    parseHealthFilter(searchParams.get("health"))
  )
  const [healthFilterDraft, setHealthFilterDraft] = useState<CertificateDomainsHealthFilter>(() =>
    parseHealthFilter(searchParams.get("health"))
  )
  const [offset, setOffset] = useState(() => parseOffset(searchParams.get("offset")))

  useEffect(() => {
    const nextDomain = searchParams.get("domain") || ""
    const nextStatus = parseStatusFilter(searchParams.get("status"))
    const nextHealth = parseHealthFilter(searchParams.get("health"))
    const nextOffset = parseOffset(searchParams.get("offset"))

    setDomainKeyword((previous) => (previous === nextDomain ? previous : nextDomain))
    setStatusFilter((previous) => (previous === nextStatus ? previous : nextStatus))
    setHealthFilter((previous) => (previous === nextHealth ? previous : nextHealth))
    setDomainKeywordDraft((previous) => (previous === nextDomain ? previous : nextDomain))
    setStatusFilterDraft((previous) => (previous === nextStatus ? previous : nextStatus))
    setHealthFilterDraft((previous) => (previous === nextHealth ? previous : nextHealth))
    setOffset((previous) => (previous === nextOffset ? previous : nextOffset))
  }, [searchParams])

  useEffect(() => {
    const nextParams = new URLSearchParams(searchParams.toString())

    if (domainKeyword.trim()) {
      nextParams.set("domain", domainKeyword)
    } else {
      nextParams.delete("domain")
    }

    if (statusFilter !== "all") {
      nextParams.set("status", statusFilter)
    } else {
      nextParams.delete("status")
    }

    if (healthFilter !== "all") {
      nextParams.set("health", healthFilter)
    } else {
      nextParams.delete("health")
    }

    if (offset > 0) {
      nextParams.set("offset", String(offset))
    } else {
      nextParams.delete("offset")
    }

    const nextQuery = nextParams.toString()
    const currentQuery = searchParams.toString()

    if (nextQuery === currentQuery) {
      return
    }

    replace(nextQuery ? `${pathname}?${nextQuery}` : pathname, { scroll: false })
  }, [domainKeyword, healthFilter, offset, pathname, replace, searchParams, statusFilter])

  const hasPendingFilterChanges =
    domainKeywordDraft.trim() !== domainKeyword.trim() ||
    statusFilterDraft !== statusFilter ||
    healthFilterDraft !== healthFilter

  const hasActiveFilters =
    Boolean(domainKeyword.trim()) || statusFilter !== "all" || healthFilter !== "all"

  const handleApplyFilters = () => {
    setDomainKeyword(domainKeywordDraft)
    setStatusFilter(statusFilterDraft)
    setHealthFilter(healthFilterDraft)
    setOffset((previous) => (previous === 0 ? previous : 0))
  }

  const handleResetFilters = () => {
    setDomainKeyword("")
    setStatusFilter("all")
    setHealthFilter("all")
    setDomainKeywordDraft("")
    setStatusFilterDraft("all")
    setHealthFilterDraft("all")
    setOffset(0)
  }

  return {
    domainKeyword,
    statusFilter,
    healthFilter,
    domainKeywordDraft,
    statusFilterDraft,
    healthFilterDraft,
    hasPendingFilterChanges,
    hasActiveFilters,
    offset,
    setOffset,
    setDomainKeywordDraft,
    setStatusFilterDraft,
    setHealthFilterDraft,
    handleApplyFilters,
    handleResetFilters,
  }
}
