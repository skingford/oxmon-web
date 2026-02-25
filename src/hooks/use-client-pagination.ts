"use client"

import { useEffect, useMemo, useState } from "react"

type UseClientPaginationOptions<T> = {
  items: T[]
  pageSize: number
  initialPage?: number
  resetKey?: string
}

export function useClientPagination<T>({
  items,
  pageSize,
  initialPage = 1,
  resetKey,
}: UseClientPaginationOptions<T>) {
  const [page, setPage] = useState(initialPage)

  const totalRows = items.length
  const totalPages = Math.max(1, Math.ceil(totalRows / pageSize))
  const currentPage = Math.min(page, totalPages)
  const startIndex = totalRows === 0 ? 0 : (currentPage - 1) * pageSize + 1
  const endIndex = totalRows === 0 ? 0 : Math.min(currentPage * pageSize, totalRows)

  const paginatedItems = useMemo(() => {
    const start = (currentPage - 1) * pageSize
    return items.slice(start, start + pageSize)
  }, [items, currentPage, pageSize])

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages)
    }
  }, [page, totalPages])

  useEffect(() => {
    setPage(initialPage)
  }, [initialPage, resetKey])

  return {
    page,
    setPage,
    currentPage,
    totalRows,
    totalPages,
    startIndex,
    endIndex,
    paginatedItems,
  }
}
