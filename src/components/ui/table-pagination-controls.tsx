"use client"

import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

type TablePaginationControlsProps = {
  pageSize: number
  pageSizeOptions: number[]
  onPageSizeChange: (pageSize: number) => void
  summaryText: string
  pageIndicatorText: string
  pageSizePlaceholder: string
  prevLabel: string
  nextLabel: string
  onPrevPage: () => void
  onNextPage: () => void
  prevDisabled?: boolean
  nextDisabled?: boolean
  pageSizeOptionLabel?: (pageSize: number) => string
  className?: string
  showPageSizeSelector?: boolean
  showSummary?: boolean
  showPageIndicator?: boolean
}

export function TablePaginationControls({
  pageSize,
  pageSizeOptions,
  onPageSizeChange,
  summaryText,
  pageIndicatorText,
  pageSizePlaceholder,
  prevLabel,
  nextLabel,
  onPrevPage,
  onNextPage,
  prevDisabled,
  nextDisabled,
  pageSizeOptionLabel = (value) => `${value} / page`,
  className,
  showPageSizeSelector = true,
  showSummary = true,
  showPageIndicator = true,
}: TablePaginationControlsProps) {
  return (
    <div className={className || "flex flex-col gap-3 border-t p-4 md:flex-row md:items-center md:justify-between"}>
      {showSummary ? <div className="text-sm text-muted-foreground">{summaryText}</div> : null}

      <div className="flex flex-wrap items-center gap-2">
        {showPageSizeSelector ? (
          <Select value={String(pageSize)} onValueChange={(value) => onPageSizeChange(Number(value))}>
            <SelectTrigger className="w-[120px]">
              <SelectValue placeholder={pageSizePlaceholder} />
            </SelectTrigger>
            <SelectContent>
              {pageSizeOptions.map((option) => (
                <SelectItem key={option} value={String(option)}>
                  {pageSizeOptionLabel(option)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : null}

        <Button type="button" variant="outline" size="sm" onClick={onPrevPage} disabled={prevDisabled}>
          {prevLabel}
        </Button>

        {showPageIndicator ? (
          <div className="min-w-[104px] text-center text-sm text-muted-foreground">{pageIndicatorText}</div>
        ) : null}

        <Button type="button" variant="outline" size="sm" onClick={onNextPage} disabled={nextDisabled}>
          {nextLabel}
        </Button>
      </div>
    </div>
  )
}
