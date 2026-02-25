"use client"

type UseServerOffsetPaginationOptions = {
  offset: number
  limit: number
  currentItemsCount: number
  totalItems: number
}

export function useServerOffsetPagination({
  offset,
  limit,
  currentItemsCount,
  totalItems,
}: UseServerOffsetPaginationOptions) {
  const currentPage = Math.floor(offset / limit) + 1
  const totalPages = Math.max(1, Math.ceil(totalItems / limit))
  const canGoPrev = offset > 0
  const canGoNext = offset + currentItemsCount < totalItems
  const rangeStart = totalItems === 0 ? 0 : offset + 1
  const rangeEnd = Math.min(offset + currentItemsCount, totalItems)

  return {
    currentPage,
    totalPages,
    canGoPrev,
    canGoNext,
    rangeStart,
    rangeEnd,
  }
}
