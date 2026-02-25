"use client"

import { ReadonlyURLSearchParams } from "next/navigation"
import { useEffect, useState } from "react"

function parseOffset(value: string | null) {
  const raw = Number(value || "0")

  if (!Number.isFinite(raw) || raw <= 0) {
    return 0
  }

  return Math.floor(raw)
}

type UseCertificateStatusQueryStateParams = {
  pathname: string
  searchParams: ReadonlyURLSearchParams
  replace: (href: string, options: { scroll: boolean }) => void
}

export function useCertificateStatusQueryState({
  pathname,
  searchParams,
  replace,
}: UseCertificateStatusQueryStateParams) {
  const [search, setSearch] = useState(() => searchParams.get("search") || "")
  const [offset, setOffset] = useState(() => parseOffset(searchParams.get("offset")))

  useEffect(() => {
    const nextSearch = searchParams.get("search") || ""
    const nextOffset = parseOffset(searchParams.get("offset"))

    setSearch((previous) => (previous === nextSearch ? previous : nextSearch))
    setOffset((previous) => (previous === nextOffset ? previous : nextOffset))
  }, [searchParams])

  useEffect(() => {
    const nextParams = new URLSearchParams(searchParams.toString())

    if (search.trim()) {
      nextParams.set("search", search)
    } else {
      nextParams.delete("search")
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
  }, [offset, pathname, replace, search, searchParams])

  const handleSearchChange = (value: string) => {
    setSearch(value)
    setOffset((previous) => (previous === 0 ? previous : 0))
  }

  const handleClearSearch = () => {
    setSearch("")
    setOffset(0)
  }

  return {
    search,
    offset,
    setOffset,
    handleSearchChange,
    handleClearSearch,
  }
}
