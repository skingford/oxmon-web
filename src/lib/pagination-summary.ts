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

export function joinPaginationSummaryText({
  summaryText,
  suffixText,
  separator = " • ",
}: JoinPaginationSummaryTextParams) {
  if (!suffixText || suffixText.trim().length === 0) {
    return summaryText
  }

  return `${summaryText}${separator}${suffixText}`
}

export function joinFilteredPaginationSummaryText({
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
