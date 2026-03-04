"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { cn } from "@/lib/utils"

export type PaginationControlsProps = {
  pageSize: number
  pageSizeOptions?: number[]
  onPageSizeChange?: (pageSize: number) => void
  summaryText?: string
  pageIndicatorText: string
  pageSizePlaceholder?: string
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

export function PaginationControls({
  pageSize,
  pageSizeOptions,
  onPageSizeChange,
  summaryText = "",
  pageIndicatorText,
  pageSizePlaceholder = "",
  prevLabel,
  nextLabel,
  onPrevPage,
  onNextPage,
  prevDisabled,
  nextDisabled,
  pageSizeOptionLabel = (value) => `${value} / page`,
  className,
  showPageSizeSelector,
  showSummary,
  showPageIndicator = true,
}: PaginationControlsProps) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const resolvedPageSizeOptions = pageSizeOptions && pageSizeOptions.length > 0
    ? pageSizeOptions
    : [pageSize]
  const shouldShowPageSizeSelector = showPageSizeSelector ?? (
    Boolean(onPageSizeChange) && resolvedPageSizeOptions.length > 1
  )
  const canRenderPageSizeSelector = mounted && shouldShowPageSizeSelector
  const shouldShowSummary = showSummary ?? Boolean(summaryText)

  return (
    <div className={cn("flex flex-col gap-3 border-t p-4 md:flex-row md:items-center md:justify-between", className)}>
      {shouldShowSummary ? <div className="text-sm text-muted-foreground">{summaryText}</div> : null}

      <div className="flex flex-wrap items-center gap-2">
        {canRenderPageSizeSelector ? (
          <Select
            value={String(pageSize)}
            onValueChange={(value) => {
              const nextPageSize = Number(value)
              if (!Number.isFinite(nextPageSize) || !onPageSizeChange) {
                return
              }

              onPageSizeChange(nextPageSize)
            }}
          >
            <SelectTrigger className="w-[120px]">
              <SelectValue placeholder={pageSizePlaceholder} />
            </SelectTrigger>
            <SelectContent>
              {resolvedPageSizeOptions.map((option) => (
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
