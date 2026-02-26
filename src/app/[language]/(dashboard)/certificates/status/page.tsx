"use client"

import { KeyboardEvent, useCallback, useEffect, useMemo, useState } from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { api } from "@/lib/api"
import { copyApiCurlCommand } from "@/lib/api-curl"
import { formatCertificateDateTime } from "@/lib/certificates/formats"
import { CertCheckResult, CertStatusSummary, ListResponse } from "@/types/api"
import { useAppTranslations } from "@/hooks/use-app-translations"
import { useServerOffsetPagination } from "@/hooks/use-server-offset-pagination"
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
import { CopyCurlDropdown } from "@/components/ui/copy-curl-dropdown"
import { FilterToolbar } from "@/components/ui/filter-toolbar"
import { HttpMethodBadge } from "@/components/ui/http-method-badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ServerPaginationControls } from "@/components/ui/server-pagination-controls"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Loader2,
  RefreshCw,
  ShieldCheck,
  ShieldX,
} from "lucide-react"
import { toast, toastActionSuccess, toastApiError, toastCopied } from "@/lib/toast"

const PAGE_LIMIT = 20
type TranslateFn = (path: string, values?: Record<string, string | number>) => string
type CertificateStatusQueryState = {
  statusesPage: ListResponse<CertCheckResult>
  summary: CertStatusSummary | null
}

function isValidNonNegativeIntegerText(value: string) {
  const trimmed = value.trim()

  if (!trimmed) {
    return true
  }

  return /^\d+$/.test(trimmed)
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
  const domainParamValue = searchParams.get("domain") || ""
  const isValidParamValue = searchParams.get("is_valid") || "all"
  const expiryParamValue = searchParams.get("expiry") || ""
  const rawOffset = Number(searchParams.get("offset") || "0")
  const initialOffset = Number.isFinite(rawOffset) && rawOffset > 0 ? Math.floor(rawOffset) : 0

  const [domainKeyword, setDomainKeyword] = useState(domainParamValue)
  const [isValidFilter, setIsValidFilter] = useState<"all" | "true" | "false">(
    isValidParamValue === "true" || isValidParamValue === "false" ? isValidParamValue : "all"
  )
  const [expiryDays, setExpiryDays] = useState(expiryParamValue)
  const [domainKeywordDraft, setDomainKeywordDraft] = useState(domainParamValue)
  const [isValidFilterDraft, setIsValidFilterDraft] = useState<"all" | "true" | "false">(
    isValidParamValue === "true" || isValidParamValue === "false" ? isValidParamValue : "all"
  )
  const [expiryDaysDraft, setExpiryDaysDraft] = useState(expiryParamValue)
  const [offset, setOffset] = useState(initialOffset)
  const [checkingAll, setCheckingAll] = useState(false)

  const {
    data: statusData,
    loading,
    refreshing,
    execute,
  } = useRequestState<CertificateStatusQueryState>({
    statusesPage: {
      items: [],
      total: 0,
      limit: PAGE_LIMIT,
      offset: 0,
    },
    summary: null,
  })
  const statusesPage = statusData.statusesPage
  const statuses = statusesPage.items
  const summary = statusData.summary

  const expiryDaysLimit = useMemo(() => {
    const value = Number(expiryDays)

    if (!Number.isFinite(value) || value < 0) {
      return undefined
    }

    return Math.floor(value)
  }, [expiryDays])

  const fetchStatus = useCallback(
    async (silent = false) => {
      await execute(
        async () => {
          const commonFilters = {
            domain__contains: domainKeyword.trim() || undefined,
            is_valid__eq:
              isValidFilter === "all"
                ? undefined
                : isValidFilter === "true",
            days_until_expiry__lte: expiryDaysLimit,
          }

          const [statusesPageData, summaryData] = await Promise.all([
            api.getCertStatusAll({
              limit: PAGE_LIMIT,
              offset,
              ...commonFilters,
            }),
            api.getCertStatusSummary(commonFilters),
          ])

          return {
            statusesPage: statusesPageData,
            summary: summaryData,
          }
        },
        {
          silent,
          onError: (error) => {
            toastApiError(error, t("certificates.status.toastFetchError"))
          },
        }
      )
    },
    [domainKeyword, execute, expiryDaysLimit, isValidFilter, offset, t]
  )

  useEffect(() => {
    fetchStatus()
  }, [fetchStatus])

  const stats = useMemo(() => {
    if (summary) {
      return {
        total: summary.total,
        healthy: summary.healthy,
        failed: summary.failed,
        expiringSoon: summary.expiring_soon,
      }
    }

    return {
      total: 0,
      healthy: 0,
      failed: 0,
      expiringSoon: 0,
    }
  }, [summary])

  const pagination = useServerOffsetPagination({
    offset,
    limit: PAGE_LIMIT,
    currentItemsCount: statuses.length,
    totalItems: statusesPage.total,
  })
  const hasAppliedApiFilters = Boolean(
    domainKeyword.trim() || isValidFilter !== "all" || expiryDays.trim()
  )
  const hasPendingApiFilterChanges =
    domainKeywordDraft.trim() !== domainKeyword.trim() ||
    isValidFilterDraft !== isValidFilter ||
    expiryDaysDraft.trim() !== expiryDays.trim()
  const isExpiryDaysDraftValid = isValidNonNegativeIntegerText(expiryDaysDraft)

  useEffect(() => {
    const nextDomain = searchParams.get("domain") || ""
    const nextIsValid = searchParams.get("is_valid") || "all"
    const nextExpiry = searchParams.get("expiry") || ""
    const nextRawOffset = Number(searchParams.get("offset") || "0")
    const nextOffset = Number.isFinite(nextRawOffset) && nextRawOffset > 0 ? Math.floor(nextRawOffset) : 0

    const normalizedIsValid =
      nextIsValid === "true" || nextIsValid === "false" ? nextIsValid : "all"

    setDomainKeyword((previous) => (previous === nextDomain ? previous : nextDomain))
    setIsValidFilter((previous) => (previous === normalizedIsValid ? previous : normalizedIsValid))
    setExpiryDays((previous) => (previous === nextExpiry ? previous : nextExpiry))
    setDomainKeywordDraft((previous) => (previous === nextDomain ? previous : nextDomain))
    setIsValidFilterDraft((previous) => (previous === normalizedIsValid ? previous : normalizedIsValid))
    setExpiryDaysDraft((previous) => (previous === nextExpiry ? previous : nextExpiry))
    setOffset((previous) => (previous === nextOffset ? previous : nextOffset))
  }, [searchParams])

  useEffect(() => {
    const nextParams = new URLSearchParams(searchParams.toString())

    if (domainKeyword.trim()) {
      nextParams.set("domain", domainKeyword)
    } else {
      nextParams.delete("domain")
    }

    if (isValidFilter !== "all") {
      nextParams.set("is_valid", isValidFilter)
    } else {
      nextParams.delete("is_valid")
    }

    if (expiryDays.trim()) {
      nextParams.set("expiry", expiryDays)
    } else {
      nextParams.delete("expiry")
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

    router.replace(nextQuery ? `${pathname}?${nextQuery}` : pathname, { scroll: false })
  }, [domainKeyword, expiryDays, isValidFilter, offset, pathname, router, searchParams])

  const handleApplyFilters = useCallback(() => {
    if (!isExpiryDaysDraftValid) {
      return
    }

    setDomainKeyword(domainKeywordDraft)
    setIsValidFilter(isValidFilterDraft)
    setExpiryDays(expiryDaysDraft)
    setOffset(0)
  }, [domainKeywordDraft, expiryDaysDraft, isExpiryDaysDraftValid, isValidFilterDraft])

  const handleFilterKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key !== "Enter") {
      return
    }

    event.preventDefault()
    handleApplyFilters()
  }

  const handleClearFilters = () => {
    setDomainKeyword("")
    setIsValidFilter("all")
    setExpiryDays("")
    setDomainKeywordDraft("")
    setIsValidFilterDraft("all")
    setExpiryDaysDraft("")
    setOffset(0)
  }

  const handleCheckAllDomains = async () => {
    setCheckingAll(true)

    try {
      await api.checkAllDomains()
      toastActionSuccess(t("certificates.status.toastCheckAllSuccess"))
      await fetchStatus(true)
    } catch (error) {
      toastApiError(error, t("certificates.status.toastCheckAllError"))
    } finally {
      setCheckingAll(false)
    }
  }

  const handleCopyApiCurl = async (insecure = false) => {
    const query = new URLSearchParams()

    if (domainKeyword.trim()) {
      query.set("domain__contains", domainKeyword.trim())
    }

    if (isValidFilter !== "all") {
      query.set("is_valid__eq", String(isValidFilter === "true"))
    }

    if (expiryDaysLimit !== undefined) {
      query.set("days_until_expiry__lte", String(expiryDaysLimit))
    }

    try {
      await copyApiCurlCommand({
        path: "/v1/certs/status",
        query,
        insecure,
      })
      toastCopied(t("certificates.status.toastCopyApiCurlSuccess"))
    } catch {
      toast.error(t("certificates.status.toastCopyApiCurlError"))
    }
  }

  return (
    <div className="min-w-0 space-y-6 p-4 md:p-8">
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
          <CardTitle>{t("certificates.status.filtersTitle")}</CardTitle>
          <CardDescription>{t("certificates.status.filtersDescription")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <details className="rounded-lg border border-dashed p-3 text-sm">
            <summary className="cursor-pointer font-medium">
              {t("certificates.status.openapiMappingTitle")}
            </summary>
            <div className="mt-2 space-y-1 text-xs text-muted-foreground">
              <p>{t("certificates.status.openapiMappingDomain")}</p>
              <p>{t("certificates.status.openapiMappingValidity")}</p>
              <p>{t("certificates.status.openapiMappingExpiry")}</p>
            </div>
          </details>
          <div className="grid gap-2 text-xs text-muted-foreground md:grid-cols-2">
            <p>{t("certificates.status.filterApiHint")}</p>
            <p>{t("certificates.status.filterLayoutHint")}</p>
          </div>
          <FilterToolbar
            className="gap-3 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-4"
            search={{
              value: domainKeywordDraft,
              onValueChange: setDomainKeywordDraft,
              onKeyDown: handleFilterKeyDown,
              label: t("certificates.status.filterDomainLabel"),
              placeholder: t("certificates.status.filterDomainPlaceholder"),
              inputClassName: "h-10",
            }}
          >
            <div className="space-y-2">
              <Label>{t("certificates.status.filterValidityLabel")}</Label>
              <Select
                value={isValidFilterDraft}
                onValueChange={(value) => setIsValidFilterDraft(value as "all" | "true" | "false")}
              >
                <SelectTrigger className="h-10">
                  <SelectValue placeholder={t("certificates.status.filterValidityAll")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("certificates.status.filterValidityAll")}</SelectItem>
                  <SelectItem value="true">{t("certificates.status.filterValidityTrue")}</SelectItem>
                  <SelectItem value="false">{t("certificates.status.filterValidityFalse")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="cert-status-expiry-days">{t("certificates.status.filterExpiryDaysLabel")}</Label>
              <div className="space-y-1">
                <Input
                  id="cert-status-expiry-days"
                  value={expiryDaysDraft}
                  onChange={(event) => setExpiryDaysDraft(event.target.value)}
                  onKeyDown={handleFilterKeyDown}
                  placeholder={t("certificates.status.filterExpiryDaysPlaceholder")}
                  inputMode="numeric"
                  aria-invalid={!isExpiryDaysDraftValid}
                  className="h-10"
                />
                {!isExpiryDaysDraftValid ? (
                  <p className="text-xs text-destructive">
                    {t("certificates.status.filterExpiryDaysInvalid")}
                  </p>
                ) : null}
              </div>
            </div>
            <div className="flex items-end gap-2">
              <Button
                type="button"
                onClick={handleApplyFilters}
                disabled={!hasPendingApiFilterChanges || !isExpiryDaysDraftValid}
                className="h-10"
              >
                {t("certificates.status.applyFilters")}
              </Button>
              <Button type="button" variant="outline" onClick={handleClearFilters} className="h-10">
                {t("certificates.status.clearFilters")}
              </Button>
            </div>
          </FilterToolbar>
          <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            <span>{t("certificates.status.appliedFiltersLabel")}</span>
            {hasAppliedApiFilters ? (
              <>
                {domainKeyword.trim() ? (
                  <Badge variant="secondary">{t("certificates.status.appliedDomain", { value: domainKeyword.trim() })}</Badge>
                ) : null}
                {isValidFilter !== "all" ? (
                  <Badge variant="secondary">
                    {isValidFilter === "true"
                      ? t("certificates.status.appliedValidityTrue")
                      : t("certificates.status.appliedValidityFalse")}
                  </Badge>
                ) : null}
                {expiryDays.trim() ? (
                  <Badge variant="secondary">{t("certificates.status.appliedExpiryDays", { value: expiryDays.trim() })}</Badge>
                ) : null}
              </>
            ) : (
              <span>{t("certificates.status.appliedFiltersEmpty")}</span>
            )}
            {hasPendingApiFilterChanges ? (
              <Badge variant="outline">{t("certificates.status.pendingFilterChanges")}</Badge>
            ) : null}
            <CopyCurlDropdown
              texts={{
                title: t("certificates.status.copyApiCurl"),
                normal: t("certificates.status.copyApiCurlNormal"),
                insecure: t("certificates.status.copyApiCurlInsecure"),
              }}
              onCopy={handleCopyApiCurl}
              triggerLabel={t("certificates.status.copyApiCurl")}
              preferenceKeyId="certificates-status-copy-curl"
              triggerSuffix={<HttpMethodBadge method="GET" className="ml-1" />}
              buttonClassName="h-7 px-2 text-xs"
              tooltip={t("certificates.status.copyApiCurlHint")}
              insecureBadgeLabel={t("certificates.status.copyApiCurlInsecureBadge")}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <CardTitle>{t("certificates.status.tableTitle")}</CardTitle>
              <CardDescription>{t("certificates.status.tableDescription", { limit: PAGE_LIMIT })}</CardDescription>
            </div>
            <div className="text-xs text-muted-foreground">
              {t("certificates.status.tableResultSummary", {
                page: statuses.length,
                total: statusesPage.total,
              })}
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
                ) : statuses.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-32 text-center text-muted-foreground">
                      <div className="space-y-1">
                        <p>
                          {t("certificates.status.tableEmpty")}
                        </p>
                        <p className="text-xs text-muted-foreground/80">
                          {hasAppliedApiFilters
                            ? t("certificates.status.tableEmptyFilteredHint")
                            : t("certificates.status.tableEmptyHint")}
                        </p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  statuses.map((status) => {
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
                          {formatCertificateDateTime(status.checked_at, locale)}
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

          <ServerPaginationControls
            className="mt-4 flex items-center justify-end gap-2"
            pageSize={PAGE_LIMIT}
            pageIndicatorText={t("certificates.status.paginationPage", { page: pagination.currentPage })}
            prevLabel={t("certificates.status.paginationPrev")}
            nextLabel={t("certificates.status.paginationNext")}
            onPrevPage={() => setOffset((previous) => Math.max(0, previous - PAGE_LIMIT))}
            onNextPage={() => setOffset((previous) => previous + PAGE_LIMIT)}
            prevDisabled={!pagination.canGoPrev || loading}
            nextDisabled={!pagination.canGoNext || loading}
          />
        </CardContent>
      </Card>
    </div>
  )
}
