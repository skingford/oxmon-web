"use client"

import { ReadonlyURLSearchParams } from "next/navigation"
import { useEffect, useState } from "react"

export type CertificateDomainsStatusFilter = "all" | "enabled" | "disabled"

function parseStatusFilter(value: string | null): CertificateDomainsStatusFilter {
  return value === "enabled" || value === "disabled" ? value : "all"
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
  const [offset, setOffset] = useState(() => parseOffset(searchParams.get("offset")))

  useEffect(() => {
    const nextDomain = searchParams.get("domain") || ""
    const nextStatus = parseStatusFilter(searchParams.get("status"))
    const nextOffset = parseOffset(searchParams.get("offset"))

    setDomainKeyword((previous) => (previous === nextDomain ? previous : nextDomain))
    setStatusFilter((previous) => (previous === nextStatus ? previous : nextStatus))
    setDomainKeywordDraft((previous) => (previous === nextDomain ? previous : nextDomain))
    setStatusFilterDraft((previous) => (previous === nextStatus ? previous : nextStatus))
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
  }, [domainKeyword, offset, pathname, replace, searchParams, statusFilter])

  const hasPendingFilterChanges =
    domainKeywordDraft.trim() !== domainKeyword.trim() ||
    statusFilterDraft !== statusFilter

  const hasActiveFilters = Boolean(domainKeyword.trim()) || statusFilter !== "all"

  const handleApplyFilters = () => {
    setDomainKeyword(domainKeywordDraft)
    setStatusFilter(statusFilterDraft)
    setOffset((previous) => (previous === 0 ? previous : 0))
  }

  const handleResetFilters = () => {
    setDomainKeyword("")
    setStatusFilter("all")
    setDomainKeywordDraft("")
    setStatusFilterDraft("all")
    setOffset(0)
  }

  return {
    domainKeyword,
    statusFilter,
    domainKeywordDraft,
    statusFilterDraft,
    hasPendingFilterChanges,
    hasActiveFilters,
    offset,
    setOffset,
    setDomainKeywordDraft,
    setStatusFilterDraft,
    handleApplyFilters,
    handleResetFilters,
  }
}
