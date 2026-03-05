type JoinPaginationSummaryTextParams = {
  summaryText: string
  suffixText?: string
  separator?: string
}

type JoinFilteredPaginationSummaryTextParams = {
  summaryText: string
  filteredSummaryText: string
  filteredCount: number
  totalCount: number
  separator?: string
}

type PaginationSummaryTranslator = (
  path: string,
  values?: Record<string, string | number>
) => string

type BuildTranslatedFilteredPaginationSummaryParams = {
  t: PaginationSummaryTranslator
  summaryKey: string
  shownKey: string
  total: number
  start: number
  end: number
  filtered: number
  unfilteredTotal: number
  separator?: string
}

type BuildTranslatedPaginationTextBundleParams = {
  t: PaginationSummaryTranslator
  summaryKey: string
  total: number
  start: number
  end: number
  pageKey: string
  currentPage: number
  totalPages: number
  prevKey: string
  nextKey: string
  shownKey?: string
  filtered?: number
  unfilteredTotal?: number
  separator?: string
}

function joinPaginationSummaryText({
  summaryText,
  suffixText,
  separator = " • ",
}: JoinPaginationSummaryTextParams) {
  if (!suffixText || suffixText.trim().length === 0) {
    return summaryText
  }

  return `${summaryText}${separator}${suffixText}`
}

function joinFilteredPaginationSummaryText({
  summaryText,
  filteredSummaryText,
  filteredCount,
  totalCount,
  separator = " • ",
}: JoinFilteredPaginationSummaryTextParams) {
  if (filteredCount === totalCount) {
    return summaryText
  }

  return joinPaginationSummaryText({
    summaryText,
    suffixText: filteredSummaryText,
    separator,
  })
}

function buildTranslatedFilteredPaginationSummary({
  t,
  summaryKey,
  shownKey,
  total,
  start,
  end,
  filtered,
  unfilteredTotal,
  separator,
}: BuildTranslatedFilteredPaginationSummaryParams) {
  return joinFilteredPaginationSummaryText({
    summaryText: t(summaryKey, {
      total,
      start,
      end,
    }),
    filteredSummaryText: t(shownKey, {
      filtered,
      total: unfilteredTotal,
    }),
    filteredCount: filtered,
    totalCount: unfilteredTotal,
    separator,
  })
}

export function buildTranslatedPaginationTextBundle({
  t,
  summaryKey,
  total,
  start,
  end,
  pageKey,
  currentPage,
  totalPages,
  prevKey,
  nextKey,
  shownKey,
  filtered,
  unfilteredTotal,
  separator,
}: BuildTranslatedPaginationTextBundleParams) {
  const shouldShowFilteredSummary =
    typeof shownKey === "string" &&
    typeof filtered === "number" &&
    Number.isFinite(filtered) &&
    typeof unfilteredTotal === "number" &&
    Number.isFinite(unfilteredTotal)

  const summaryText = shouldShowFilteredSummary
    ? buildTranslatedFilteredPaginationSummary({
        t,
        summaryKey,
        shownKey,
        total,
        start,
        end,
        filtered,
        unfilteredTotal,
        separator,
      })
    : t(summaryKey, { total, start, end })

  return {
    summaryText,
    pageIndicatorText: t(pageKey, {
      current: currentPage,
      total: totalPages,
    }),
    prevLabel: t(prevKey),
    nextLabel: t(nextKey),
  }
}
