"use client"

import { TablePaginationControls } from "@/components/ui/table-pagination-controls"

type ServerPaginationControlsProps = {
  pageSize: number
  pageIndicatorText: string
  prevLabel: string
  nextLabel: string
  onPrevPage: () => void
  onNextPage: () => void
  prevDisabled: boolean
  nextDisabled: boolean
  className?: string
  summaryText?: string
  showSummary?: boolean
  showPageIndicator?: boolean
}

export function ServerPaginationControls({
  pageSize,
  pageIndicatorText,
  prevLabel,
  nextLabel,
  onPrevPage,
  onNextPage,
  prevDisabled,
  nextDisabled,
  className,
  summaryText = "",
  showSummary = false,
  showPageIndicator = true,
}: ServerPaginationControlsProps) {
  return (
    <TablePaginationControls
      className={className}
      showPageSizeSelector={false}
      showSummary={showSummary}
      showPageIndicator={showPageIndicator}
      pageSize={pageSize}
      pageSizeOptions={[pageSize]}
      onPageSizeChange={() => {}}
      pageSizePlaceholder=""
      summaryText={summaryText}
      pageIndicatorText={pageIndicatorText}
      prevLabel={prevLabel}
      nextLabel={nextLabel}
      onPrevPage={onPrevPage}
      onNextPage={onNextPage}
      prevDisabled={prevDisabled}
      nextDisabled={nextDisabled}
    />
  )
}
