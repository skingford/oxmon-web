"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { api, getApiErrorMessage } from "@/lib/api"
import { CertCheckResult } from "@/types/api"
import { useAppTranslations } from "@/hooks/use-app-translations"
import { useRequestState } from "@/hooks/use-request-state"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { FilterToolbar } from "@/components/ui/filter-toolbar"
import {
  ChevronLeft,
  ChevronRight,
  Loader2,
  RefreshCw,
  ShieldCheck,
  ShieldX,
} from "lucide-react"
import { toast } from "sonner"

const PAGE_LIMIT = 20
type TranslateFn = (path: string, values?: Record<string, string | number>) => string

function formatDateTime(value: string | null, locale: "zh" | "en") {
  if (!value) {
    return "-"
  }

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return "-"
  }

  return date.toLocaleString(locale === "zh" ? "zh-CN" : "en-US", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  })
}

function getStatusMeta(
  status: CertCheckResult,
  t: TranslateFn
) {
  if (status.is_valid && status.chain_valid) {
    return {
      className: "border-emerald-500/30 bg-emerald-500/10 text-emerald-600",
      label: t("certificates.status.statusHealthy"),
      icon: ShieldCheck,
    }
  }

  return {
    className: "border-red-500/30 bg-red-500/10 text-red-600",
    label: t("certificates.status.statusFailed"),
    icon: ShieldX,
  }
}

export default function CertificateStatusPage() {
  const { t, locale } = useAppTranslations("pages")
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const searchParamValue = searchParams.get("search") || ""
  const rawOffset = Number(searchParams.get("offset") || "0")
  const initialOffset = Number.isFinite(rawOffset) && rawOffset > 0 ? Math.floor(rawOffset) : 0

  const [search, setSearch] = useState(searchParamValue)
  const [offset, setOffset] = useState(initialOffset)
  const [currentPageCount, setCurrentPageCount] = useState(0)
  const [checkingAll, setCheckingAll] = useState(false)

  const {
    data: statuses,
    loading,
    refreshing,
    execute,
  } = useRequestState<CertCheckResult[]>([])

  const fetchStatus = useCallback(
    async (silent = false) => {
      await execute(
        () => api.getCertStatusAll({ limit: PAGE_LIMIT, offset }),
        {
          silent,
          onSuccess: (data) => {
            setCurrentPageCount(data.length)
          },
          onError: (error) => {
            toast.error(getApiErrorMessage(error, t("certificates.status.toastFetchError")))
          },
        }
      )
    },
    [execute, offset, t]
  )

  useEffect(() => {
    fetchStatus()
  }, [fetchStatus])

  useEffect(() => {
    const nextSearch = searchParams.get("search") || ""
    const nextRawOffset = Number(searchParams.get("offset") || "0")
    const nextOffset = Number.isFinite(nextRawOffset) && nextRawOffset > 0
      ? Math.floor(nextRawOffset)
      : 0

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

    router.replace(nextQuery ? `${pathname}?${nextQuery}` : pathname, {
      scroll: false,
    })
  }, [offset, pathname, router, search, searchParams])

  const handleSearchChange = (value: string) => {
    setSearch(value)
    setOffset((previous) => (previous === 0 ? previous : 0))
  }

  const handleClearSearch = () => {
    setSearch("")
    setOffset(0)
  }

  const filteredStatuses = useMemo(() => {
    const keyword = search.trim().toLowerCase()

    if (!keyword) {
      return statuses
    }

    return statuses.filter((item) => item.domain.toLowerCase().includes(keyword))
  }, [search, statuses])

  const stats = useMemo(() => {
    return statuses.reduce(
      (result, status) => {
        const healthy = status.is_valid && status.chain_valid

        if (healthy) {
          result.healthy += 1
        } else {
          result.failed += 1
        }

        if (typeof status.days_until_expiry === "number" && status.days_until_expiry >= 0 && status.days_until_expiry <= 30) {
          result.expiringSoon += 1
        }

        return result
      },
      {
        total: statuses.length,
        healthy: 0,
        failed: 0,
        expiringSoon: 0,
      }
    )
  }, [statuses])

  const pageNumber = Math.floor(offset / PAGE_LIMIT) + 1
  const canGoPrev = offset > 0
  const canGoNext = currentPageCount >= PAGE_LIMIT

  const handleCheckAllDomains = async () => {
    setCheckingAll(true)

    try {
      await api.checkAllDomains()
      toast.success(t("certificates.status.toastCheckAllSuccess"))
      await fetchStatus(true)
    } catch (error) {
      toast.error(getApiErrorMessage(error, t("certificates.status.toastCheckAllError")))
    } finally {
      setCheckingAll(false)
    }
  }

  return (
    <div className="space-y-6 p-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">{t("certificates.status.title")}</h2>
          <p className="text-sm text-muted-foreground">{t("certificates.status.description")}</p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={handleCheckAllDomains}
            disabled={checkingAll}
          >
            {checkingAll ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ShieldCheck className="mr-2 h-4 w-4" />}
            {t("certificates.status.checkAllButton")}
          </Button>
          <Button
            variant="outline"
            onClick={() => fetchStatus(true)}
            disabled={loading || refreshing}
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
            {t("certificates.status.refreshButton")}
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>{t("certificates.status.statTotal")}</CardDescription>
            <CardTitle className="text-3xl">{stats.total}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>{t("certificates.status.statHealthy")}</CardDescription>
            <CardTitle className="text-3xl text-emerald-600">{stats.healthy}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>{t("certificates.status.statFailed")}</CardDescription>
            <CardTitle className="text-3xl text-red-600">{stats.failed}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>{t("certificates.status.statExpiringSoon")}</CardDescription>
            <CardTitle className="text-3xl text-amber-600">{stats.expiringSoon}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <CardTitle>{t("certificates.status.tableTitle")}</CardTitle>
              <CardDescription>{t("certificates.status.tableDescription", { limit: PAGE_LIMIT })}</CardDescription>
            </div>
            <div className="flex w-full items-center gap-2 md:w-auto">
              <div className="w-full md:w-80">
                <FilterToolbar
                  className="md:grid-cols-1 xl:grid-cols-1"
                  search={{
                    value: search,
                    onValueChange: handleSearchChange,
                    placeholder: t("certificates.status.searchPlaceholder"),
                    inputClassName: "h-10",
                  }}
                />
              </div>
              <Button type="button" variant="outline" onClick={handleClearSearch}>
                {t("certificates.status.clearSearch")}
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          <div className="overflow-hidden rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("certificates.status.tableColDomain")}</TableHead>
                  <TableHead>{t("certificates.status.tableColStatus")}</TableHead>
                  <TableHead>{t("certificates.status.tableColChain")}</TableHead>
                  <TableHead>{t("certificates.status.tableColExpiry")}</TableHead>
                  <TableHead>{t("certificates.status.tableColCheckedAt")}</TableHead>
                  <TableHead>{t("certificates.status.tableColError")}</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-40 text-center text-muted-foreground">
                      <Loader2 className="mx-auto mb-2 h-5 w-5 animate-spin" />
                      {t("certificates.status.tableLoading")}
                    </TableCell>
                  </TableRow>
                ) : filteredStatuses.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-32 text-center text-muted-foreground">
                      <div className="space-y-1">
                        <p>
                          {statuses.length === 0
                            ? t("certificates.status.tableEmpty")
                            : t("certificates.status.tableEmptyFiltered")}
                        </p>
                        <p className="text-xs text-muted-foreground/80">
                          {statuses.length === 0
                            ? t("certificates.status.tableEmptyHint")
                            : t("certificates.status.tableEmptyFilteredHint")}
                        </p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredStatuses.map((status) => {
                    const statusMeta = getStatusMeta(status, t)
                    const StatusIcon = statusMeta.icon

                    return (
                      <TableRow key={status.id} className="hover:bg-muted/40">
                        <TableCell className="font-medium">{status.domain}</TableCell>
                        <TableCell>
                          <Badge className={`gap-1 ${statusMeta.className}`}>
                            <StatusIcon className="h-3 w-3" />
                            {statusMeta.label}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge
                            className={status.chain_valid
                              ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-600"
                              : "border-red-500/30 bg-red-500/10 text-red-600"}
                          >
                            {status.chain_valid
                              ? t("certificates.status.chainValid")
                              : t("certificates.status.chainInvalid")}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {typeof status.days_until_expiry === "number"
                            ? t("certificates.status.expiryDays", { days: status.days_until_expiry })
                            : t("certificates.status.expiryUnknown")}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {formatDateTime(status.checked_at, locale)}
                        </TableCell>
                        <TableCell className="max-w-60 truncate text-muted-foreground" title={status.error || ""}>
                          {status.error || t("certificates.status.errorNone")}
                        </TableCell>
                      </TableRow>
                    )
                  })
                )}
              </TableBody>
            </Table>
          </div>

          <div className="mt-4 flex items-center justify-end gap-2">
            <span className="mr-2 text-xs text-muted-foreground">
              {t("certificates.status.paginationPage", { page: pageNumber })}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={!canGoPrev || loading}
              onClick={() => setOffset((previous) => Math.max(0, previous - PAGE_LIMIT))}
            >
              <ChevronLeft className="mr-1 h-4 w-4" />
              {t("certificates.status.paginationPrev")}
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={!canGoNext || loading}
              onClick={() => setOffset((previous) => previous + PAGE_LIMIT)}
            >
              {t("certificates.status.paginationNext")}
              <ChevronRight className="ml-1 h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
