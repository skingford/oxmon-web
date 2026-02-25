"use client"

import type { SilenceWindow } from "@/types/api"
import {
  formatDateTime,
  formatDuration,
  getStatusMeta,
  getWindowStatus,
  parseDate,
  type WindowOriginMeta,
} from "@/lib/notifications/silence-utils"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { TablePaginationControls } from "@/components/ui/table-pagination-controls"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Pencil, ShieldOff, Trash2 } from "lucide-react"

type TranslateFn = (path: string, values?: Record<string, string | number>) => string

type SilenceWindowsTableCardProps = {
  t: TranslateFn
  locale: "zh" | "en"
  loading: boolean
  windows: SilenceWindow[]
  windowOrigins: Record<string, WindowOriginMeta>
  hasActiveFilters: boolean
  onEditWindow: (window: SilenceWindow) => void
  onDeleteWindow: (window: SilenceWindow) => void
  pagination: {
    totalRows: number
    currentPage: number
    totalPages: number
    startIndex: number
    endIndex: number
    pageSize: number
    pageSizeOptions: number[]
    onPageSizeChange: (value: number) => void
    onPrevPage: () => void
    onNextPage: () => void
    prevDisabled: boolean
    nextDisabled: boolean
  }
}

export function SilenceWindowsTableCard({
  t,
  locale,
  loading,
  windows,
  windowOrigins,
  hasActiveFilters,
  onEditWindow,
  onDeleteWindow,
  pagination,
}: SilenceWindowsTableCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("notifications.silenceTableTitle")}</CardTitle>
        <CardDescription>{t("notifications.silenceTableDescription")}</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("notifications.silenceTableColWindow")}</TableHead>
              <TableHead>{t("notifications.silenceTableColRange")}</TableHead>
              <TableHead>{t("notifications.silenceTableColRecurrence")}</TableHead>
              <TableHead>{t("notifications.silenceTableColStatus")}</TableHead>
              <TableHead>{t("notifications.silenceTableColCreatedAt")}</TableHead>
              <TableHead className="text-right">{t("notifications.silenceTableColActions")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              Array.from({ length: 4 }).map((_, index) => (
                <TableRow key={index}>
                  <TableCell colSpan={6} className="h-16 text-muted-foreground">
                    {t("notifications.silenceTableLoading")}
                  </TableCell>
                </TableRow>
              ))
            ) : pagination.totalRows === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-40 text-center text-muted-foreground">
                  <div className="mx-auto flex max-w-sm flex-col items-center gap-2">
                    <ShieldOff className="h-5 w-5" />
                    <p>
                      {hasActiveFilters
                        ? t("notifications.silenceTableEmptyFiltered")
                        : t("notifications.silenceTableEmpty")}
                    </p>
                    {!hasActiveFilters ? (
                      <p className="text-xs">{t("notifications.silenceTableEmptyHint")}</p>
                    ) : null}
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              windows.map((window) => {
                const status = getWindowStatus(window)
                const statusMeta = getStatusMeta(status, t)
                const startDate = parseDate(window.start_time)
                const endDate = parseDate(window.end_time)
                const duration = startDate && endDate
                  ? formatDuration(endDate.getTime() - startDate.getTime(), locale)
                  : t("notifications.silenceDurationUnknown")
                const origin = windowOrigins[window.id]

                return (
                  <TableRow key={window.id}>
                    <TableCell>
                      <div className="space-y-1">
                        <p className="font-medium">
                          {window.name || t("notifications.silenceWindowNameFallback", { id: window.id })}
                        </p>
                        <p className="font-mono text-xs text-muted-foreground">{window.id}</p>
                        {origin ? (
                          <p className="text-[11px] text-muted-foreground">
                            {origin.mode === "replaced"
                              ? t("notifications.silenceOriginReplacedFrom", { id: origin.sourceId })
                              : t("notifications.silenceOriginClonedFrom", { id: origin.sourceId })}
                          </p>
                        ) : null}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1 text-xs text-muted-foreground">
                        <p>{formatDateTime(window.start_time, locale)}</p>
                        <p>{formatDateTime(window.end_time, locale)}</p>
                        <p>{t("notifications.silenceDurationLabel", { duration })}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-muted-foreground">
                        {window.recurrence || t("notifications.silenceRecurrenceOnce")}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={statusMeta.className}>
                        {statusMeta.label}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {formatDateTime(window.created_at, locale)}
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-1">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => onEditWindow(window)}
                          title={t("notifications.silenceActionEdit")}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => onDeleteWindow(window)}
                          title={t("notifications.silenceActionDelete")}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>

        <TablePaginationControls
          className="mt-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between"
          pageSize={pagination.pageSize}
          pageSizeOptions={pagination.pageSizeOptions}
          onPageSizeChange={pagination.onPageSizeChange}
          summaryText={t("notifications.silencePaginationSummary", {
            total: pagination.totalRows,
            start: pagination.startIndex,
            end: pagination.endIndex,
          })}
          pageIndicatorText={t("notifications.silencePaginationPage", {
            current: pagination.currentPage,
            total: pagination.totalPages,
          })}
          pageSizePlaceholder={t("notifications.silencePageSizePlaceholder")}
          prevLabel={t("notifications.silencePaginationPrev")}
          nextLabel={t("notifications.silencePaginationNext")}
          onPrevPage={pagination.onPrevPage}
          onNextPage={pagination.onNextPage}
          prevDisabled={pagination.prevDisabled}
          nextDisabled={pagination.nextDisabled}
          pageSizeOptionLabel={(size) => (locale === "zh" ? `${size} / 页` : `${size} / page`)}
        />
      </CardContent>
    </Card>
  )
}
