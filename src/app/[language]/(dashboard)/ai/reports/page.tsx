"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { api } from "@/lib/api"
import { buildTranslatedPaginationTextBundle } from "@/lib/pagination-summary"
import type { AIReportListItem, ListResponse } from "@/types/api"
import { toastApiError } from "@/lib/toast"
import { formatDateTimeByLocale } from "@/lib/date-time"
import { notifiedBadgeClassName } from "@/lib/notified-status"
import {
  resolveRiskLevel,
  riskLevelLabelZh,
  riskBadgeClassNameByLevel,
} from "@/lib/risk-level"
import { useAppTranslations } from "@/hooks/use-app-translations"
import { useAppLocale } from "@/hooks/use-app-locale"
import { useRequestState } from "@/hooks/use-request-state"
import { useServerOffsetPagination } from "@/hooks/use-server-offset-pagination"
import { withLocalePrefix } from "@/components/app-locale"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { PaginationControls } from "@/components/ui/pagination-controls"
import { Loader2, RefreshCw } from "lucide-react"

type ReportsState = {
  reportsPage: ListResponse<AIReportListItem>
}

const PAGE_SIZE_OPTIONS = [10, 20, 50] as const
const RISK_LEGEND_ITEMS = [
  { textKey: "reports.legendNormal", dotClassName: "bg-emerald-500" },
  { textKey: "reports.legendAttention", dotClassName: "bg-blue-500" },
  { textKey: "reports.legendAlert", dotClassName: "bg-amber-500" },
  { textKey: "reports.legendCritical", dotClassName: "bg-red-500" },
] as const

export default function AIReportsPage() {
  const { t } = useAppTranslations("ai")
  const locale = useAppLocale()
  const [offset, setOffset] = useState(0)
  const [pageSize, setPageSize] = useState<(typeof PAGE_SIZE_OPTIONS)[number]>(PAGE_SIZE_OPTIONS[1])
  const {
    data,
    loading,
    refreshing,
    execute,
  } = useRequestState<ReportsState>({
    reportsPage: {
      items: [],
      total: 0,
      limit: pageSize,
      offset: 0,
    },
  })

  const sortedItems = useMemo(
    () =>
      [...data.reportsPage.items].sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
      ),
    [data.reportsPage.items],
  )

  const fetchData = useCallback(async (silent = false) => {
    await execute(
      async () => {
        const page = await api.listAIReportsPage({
          limit: pageSize,
          offset,
        })

        return {
          reportsPage: page,
        }
      },
      {
        silent,
        onError: (error) => {
          toastApiError(error, t("reports.toastFetchError"))
        },
      },
    )
  }, [execute, offset, pageSize, t])

  useEffect(() => {
    void fetchData()
  }, [fetchData])

  const pagination = useServerOffsetPagination({
    offset,
    limit: pageSize,
    currentItemsCount: sortedItems.length,
    totalItems: data.reportsPage.total,
  })

  const pageSizeOptionLabel = useCallback(
    (size: number) => (locale === "zh" ? `${size} / 页` : `${size} / page`),
    [locale],
  )

  const isBusy = loading || refreshing

  return (
    <div className="min-w-0 space-y-6 p-4 md:p-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">
            {t("reports.title")}
          </h2>
          <p className="text-sm text-muted-foreground">
            {t("reports.description")}
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          onClick={() => void fetchData(true)}
          disabled={isBusy}
        >
          {isBusy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
          {t("reports.refreshButton")}
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t("reports.tableTitle")}</CardTitle>
          <CardDescription>{t("reports.tableDescription")}</CardDescription>
          <div className="flex flex-wrap gap-x-5 gap-y-2 pt-1 text-sm text-muted-foreground">
            {RISK_LEGEND_ITEMS.map((item) => (
              <span key={item.textKey} className="inline-flex items-center gap-2">
                <span
                  className={`inline-block h-2.5 w-2.5 rounded-full ${item.dotClassName}`}
                  aria-hidden="true"
                />
                {t(item.textKey)}
              </span>
            ))}
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("reports.colDate")}</TableHead>
                  <TableHead>{t("reports.colProvider")}</TableHead>
                  <TableHead>{t("reports.colModel")}</TableHead>
                  <TableHead>{t("reports.colRisk")}</TableHead>
                  <TableHead>{t("reports.colAgents")}</TableHead>
                  <TableHead>{t("reports.colNotified")}</TableHead>
                  <TableHead>{t("reports.colCreatedAt")}</TableHead>
                  <TableHead className="text-right">
                    {t("reports.colActions")}
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell
                      colSpan={8}
                      className="h-24 text-center text-muted-foreground"
                    >
                      {t("reports.tableLoading")}
                    </TableCell>
                  </TableRow>
                ) : sortedItems.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={8}
                      className="h-24 text-center text-muted-foreground"
                    >
                      {t("reports.tableEmpty")}
                    </TableCell>
                  </TableRow>
                ) : (
                  sortedItems.map((item) => {
                    const level = resolveRiskLevel(item.risk_level)
                    const riskLabel = riskLevelLabelZh(level)

                    return (
                      <TableRow key={item.id}>
                        <TableCell>{item.report_date}</TableCell>
                        <TableCell>{item.ai_provider}</TableCell>
                        <TableCell className="max-w-[220px] truncate">
                          {item.ai_model}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={riskBadgeClassNameByLevel(level)}
                          >
                            {riskLabel}
                          </Badge>
                        </TableCell>
                        <TableCell>{item.total_agents}</TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={notifiedBadgeClassName(item.notified)}
                          >
                            {item.notified
                              ? t("reports.notifiedYes")
                              : t("reports.notifiedNo")}
                          </Badge>
                        </TableCell>
                        <TableCell>{formatDateTimeByLocale(item.created_at, locale)}</TableCell>
                        <TableCell className="text-right">
                          <Button type="button" size="sm" variant="outline" asChild>
                            <Link href={withLocalePrefix(`/ai/reports/${item.id}`, locale)}>
                              {t("reports.actionView")}
                            </Link>
                          </Button>
                        </TableCell>
                      </TableRow>
                    )
                  })
                )}
              </TableBody>
            </Table>
          </div>

          <PaginationControls
            pageSize={pageSize}
            pageSizeOptions={[...PAGE_SIZE_OPTIONS]}
            onPageSizeChange={(value) => {
              const nextSize = value as (typeof PAGE_SIZE_OPTIONS)[number]
              if (nextSize === pageSize) {
                return
              }

              setPageSize(nextSize)
              setOffset(0)
            }}
            {...buildTranslatedPaginationTextBundle({
              t,
              summaryKey: "reports.paginationSummary",
              total: data.reportsPage.total,
              start: pagination.rangeStart,
              end: pagination.rangeEnd,
              pageKey: "reports.paginationPage",
              currentPage: pagination.currentPage,
              totalPages: pagination.totalPages,
              prevKey: "reports.paginationPrev",
              nextKey: "reports.paginationNext",
            })}
            pageSizePlaceholder={t("reports.pageSizePlaceholder")}
            onPrevPage={() => setOffset((prev) => Math.max(0, prev - pageSize))}
            onNextPage={() => setOffset((prev) => prev + pageSize)}
            prevDisabled={isBusy || !pagination.canGoPrev}
            nextDisabled={isBusy || !pagination.canGoNext}
            pageSizeOptionLabel={pageSizeOptionLabel}
          />
        </CardContent>
      </Card>
    </div>
  )
}
