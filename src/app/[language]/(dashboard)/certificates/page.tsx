"use client"

import { KeyboardEvent, useCallback, useEffect, useMemo, useState } from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { api } from "@/lib/api"
import { copyApiCurlCommand } from "@/lib/api-curl"
import { formatCertificateDateTime } from "@/lib/certificates/formats"
import { CertificateChainInfo, CertificateDetails, CertSummary, ListResponse } from "@/types/api"
import { useAppTranslations } from "@/hooks/use-app-translations"
import { useServerOffsetPagination } from "@/hooks/use-server-offset-pagination"
import { useRequestState } from "@/hooks/use-request-state"
import { withLocalePrefix } from "@/components/app-locale"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { FilterToolbar } from "@/components/ui/filter-toolbar"
import { motion, AnimatePresence } from "framer-motion"
import { Badge } from "@/components/ui/badge"
import { ServerPaginationControls } from "@/components/ui/server-pagination-controls"
import { CopyCurlDropdown } from "@/components/ui/copy-curl-dropdown"
import { HttpMethodBadge } from "@/components/ui/http-method-badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import {
  Copy,
  Loader2,
  RefreshCw,
  ShieldAlert,
  ShieldCheck,
  ShieldX,
} from "lucide-react"
import { toast, toastApiError, toastCopied } from "@/lib/toast"

const PAGE_LIMIT = 20

type CertificatesQueryState = {
  certsPage: ListResponse<CertificateDetails>
  summary: CertSummary | null
}
type TranslateFn = (path: string, values?: Record<string, string | number>) => string

function isValidNonNegativeIntegerText(value: string) {
  const trimmed = value.trim()

  if (!trimmed) {
    return true
  }

  return /^\d+$/.test(trimmed)
}

function formatDate(value: string | null, locale: "zh" | "en") {
  if (!value) {
    return "-"
  }

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return "-"
  }

  return date.toLocaleDateString(locale === "zh" ? "zh-CN" : "en-US", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  })
}

function getDaysUntilExpiry(notAfter: string) {
  const expiryTime = new Date(notAfter).getTime()

  if (!Number.isFinite(expiryTime)) {
    return null
  }

  return Math.ceil((expiryTime - Date.now()) / (24 * 3600 * 1000))
}

function getCertificateStatusMeta(
  certificate: CertificateDetails,
  t: TranslateFn
) {
  const daysUntilExpiry = getDaysUntilExpiry(certificate.not_after)

  if (daysUntilExpiry === null) {
    return {
      className: "border-muted bg-muted text-muted-foreground",
      label: t("certificates.overview.statusUnknown"),
      icon: ShieldX,
    }
  }

  if (daysUntilExpiry < 0) {
    return {
      className: "border-red-500/30 bg-red-500/10 text-red-600",
      label: t("certificates.overview.statusExpired"),
      icon: ShieldAlert,
    }
  }

  if (!certificate.chain_valid) {
    return {
      className: "border-red-500/30 bg-red-500/10 text-red-600",
      label: t("certificates.overview.statusChainInvalid"),
      icon: ShieldAlert,
    }
  }

  if (daysUntilExpiry <= 30) {
    return {
      className: "border-amber-500/30 bg-amber-500/10 text-amber-600",
      label: t("certificates.overview.statusExpiringSoon", { days: daysUntilExpiry }),
      icon: ShieldX,
    }
  }

  return {
    className: "border-emerald-500/30 bg-emerald-500/10 text-emerald-600",
    label: t("certificates.overview.statusHealthy", { days: daysUntilExpiry }),
    icon: ShieldCheck,
  }
}

export default function CertificatesPage() {
  const { t, locale } = useAppTranslations("pages")
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const domainParamValue = searchParams.get("domain") || ""
  const issuerParamValue = searchParams.get("issuer") || ""
  const ipParamValue = searchParams.get("ip") || ""
  const expiryParamValue = searchParams.get("expiry") || ""
  const rawOffset = Number(searchParams.get("offset") || "0")
  const initialOffset = Number.isFinite(rawOffset) && rawOffset > 0 ? Math.floor(rawOffset) : 0

  const [domainKeyword, setDomainKeyword] = useState(domainParamValue)
  const [issuerKeyword, setIssuerKeyword] = useState(issuerParamValue)
  const [ipKeyword, setIpKeyword] = useState(ipParamValue)
  const [expiryDays, setExpiryDays] = useState(expiryParamValue)
  const [issuerKeywordDraft, setIssuerKeywordDraft] = useState(issuerParamValue)
  const [ipKeywordDraft, setIpKeywordDraft] = useState(ipParamValue)
  const [expiryDaysDraft, setExpiryDaysDraft] = useState(expiryParamValue)
  const [offset, setOffset] = useState(initialOffset)

  const [chainDialogOpen, setChainDialogOpen] = useState(false)
  const [selectedCertificate, setSelectedCertificate] = useState<CertificateDetails | null>(null)

  const {
    data: certificatesData,
    loading,
    refreshing,
    execute,
  } = useRequestState<CertificatesQueryState>({
    certsPage: {
      items: [],
      total: 0,
      limit: PAGE_LIMIT,
      offset: 0,
    },
    summary: null,
  })

  const {
    data: chainInfo,
    setData: setChainInfo,
    loading: loadingChain,
    execute: executeChain,
  } = useRequestState<CertificateChainInfo | null>(null, { initialLoading: false })

  const certsPage = certificatesData.certsPage
  const certs = certsPage.items
  const summary = certificatesData.summary

  const expiryLimit = useMemo(() => {
    const days = Number(expiryDays)

    if (!Number.isFinite(days) || days <= 0) {
      return undefined
    }

    return Math.floor(Date.now() / 1000) + Math.floor(days) * 24 * 3600
  }, [expiryDays])

  const fetchCertificates = useCallback(
    async (silent = false) => {
      await execute(
        async () => {
          const [certificates, summaryData] = await Promise.all([
            api.getCertificates({
              limit: PAGE_LIMIT,
              offset,
              issuer__contains: issuerKeyword.trim() || undefined,
              ip_address__contains: ipKeyword.trim() || undefined,
              not_after__lte: expiryLimit,
            }),
            api.getCertSummary(),
          ])

          return {
            certsPage: certificates,
            summary: summaryData,
          }
        },
        {
          silent,
          onError: (error) => {
            toastApiError(error, t("certificates.overview.toastFetchError"))
          },
        }
      )
    },
    [execute, expiryLimit, ipKeyword, issuerKeyword, offset, t]
  )

  useEffect(() => {
    fetchCertificates()
  }, [fetchCertificates])

  useEffect(() => {
    const nextDomain = searchParams.get("domain") || ""
    const nextIssuer = searchParams.get("issuer") || ""
    const nextIp = searchParams.get("ip") || ""
    const nextExpiry = searchParams.get("expiry") || ""
    const nextRawOffset = Number(searchParams.get("offset") || "0")
    const nextOffset = Number.isFinite(nextRawOffset) && nextRawOffset > 0
      ? Math.floor(nextRawOffset)
      : 0

    setDomainKeyword((previous) => (previous === nextDomain ? previous : nextDomain))
    setIssuerKeyword((previous) => (previous === nextIssuer ? previous : nextIssuer))
    setIpKeyword((previous) => (previous === nextIp ? previous : nextIp))
    setExpiryDays((previous) => (previous === nextExpiry ? previous : nextExpiry))
    setIssuerKeywordDraft((previous) => (previous === nextIssuer ? previous : nextIssuer))
    setIpKeywordDraft((previous) => (previous === nextIp ? previous : nextIp))
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

    if (issuerKeyword.trim()) {
      nextParams.set("issuer", issuerKeyword)
    } else {
      nextParams.delete("issuer")
    }

    if (ipKeyword.trim()) {
      nextParams.set("ip", ipKeyword)
    } else {
      nextParams.delete("ip")
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

    router.replace(nextQuery ? `${pathname}?${nextQuery}` : pathname, {
      scroll: false,
    })
  }, [domainKeyword, expiryDays, ipKeyword, issuerKeyword, offset, pathname, router, searchParams])

  const filteredCerts = useMemo(() => {
    const keyword = domainKeyword.trim().toLowerCase()

    if (!keyword) {
      return certs
    }

    return certs.filter((cert) => cert.domain.toLowerCase().includes(keyword))
  }, [certs, domainKeyword])

  const pagination = useServerOffsetPagination({
    offset,
    limit: PAGE_LIMIT,
    currentItemsCount: certs.length,
    totalItems: certsPage.total,
  })
  const hasAppliedApiFilters = Boolean(
    issuerKeyword.trim() || ipKeyword.trim() || expiryDays.trim()
  )
  const hasLocalDomainFilter = Boolean(domainKeyword.trim())
  const hasPendingApiFilterChanges =
    issuerKeywordDraft.trim() !== issuerKeyword.trim() ||
    ipKeywordDraft.trim() !== ipKeyword.trim() ||
    expiryDaysDraft.trim() !== expiryDays.trim()
  const isExpiryDaysDraftValid = isValidNonNegativeIntegerText(expiryDaysDraft)

  const handleDomainKeywordChange = (value: string) => {
    setDomainKeyword(value)
    setOffset((previous) => (previous === 0 ? previous : 0))
  }

  const handleApplyApiFilters = useCallback(() => {
    if (!isExpiryDaysDraftValid) {
      return
    }

    setIssuerKeyword(issuerKeywordDraft)
    setIpKeyword(ipKeywordDraft)
    setExpiryDays(expiryDaysDraft)
    setOffset(0)
  }, [expiryDaysDraft, ipKeywordDraft, isExpiryDaysDraftValid, issuerKeywordDraft])

  const handleApiFilterKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key !== "Enter") {
      return
    }

    event.preventDefault()
    handleApplyApiFilters()
  }

  const handleClearFilters = () => {
    setDomainKeyword("")
    setIssuerKeyword("")
    setIpKeyword("")
    setExpiryDays("")
    setIssuerKeywordDraft("")
    setIpKeywordDraft("")
    setExpiryDaysDraft("")
    setOffset(0)
  }

  const handleViewChain = async (certificate: CertificateDetails) => {
    setSelectedCertificate(certificate)
    setChainDialogOpen(true)
    setChainInfo(null)

    await executeChain(
      () => api.getCertificateChain(certificate.id),
      {
        onError: (error) => {
          toastApiError(error, t("certificates.overview.toastChainError"))
        },
      }
    )
  }

  const handleQuickCheck = (domain: string) => {
    const nextParams = new URLSearchParams({
      domain,
      autoCheck: "1",
    })

    router.push(`${withLocalePrefix("/certificates/domains", locale)}?${nextParams.toString()}`)
  }

  const handleCopyApiCurl = async (insecure = false) => {
    const query = new URLSearchParams()

    if (issuerKeyword.trim()) {
      query.set("issuer__contains", issuerKeyword.trim())
    }

    if (ipKeyword.trim()) {
      query.set("ip_address__contains", ipKeyword.trim())
    }

    if (expiryLimit !== undefined) {
      query.set("not_after__lte", String(expiryLimit))
    }

    try {
      await copyApiCurlCommand({
        path: "/v1/certificates",
        query,
        insecure,
      })
      toastCopied(t("certificates.overview.toastCopyApiCurlSuccess"))
    } catch {
      toast.error(t("certificates.overview.toastCopyApiCurlError"))
    }
  }

  return (
    <div className="min-w-0 space-y-6 p-4 md:p-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Button
          variant="outline"
          onClick={() => fetchCertificates(true)}
          disabled={loading || refreshing}
        >
          <RefreshCw className={`mr-2 h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
          {t("certificates.overview.refreshButton")}
        </Button>
      </div>

      {summary ? (
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>{t("certificates.overview.statTotal")}</CardDescription>
              <CardTitle className="text-3xl">{summary.total_domains}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>{t("certificates.overview.statHealthy")}</CardDescription>
              <CardTitle className="text-3xl text-emerald-600">{summary.valid}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>{t("certificates.overview.statInvalid")}</CardDescription>
              <CardTitle className="text-3xl text-red-600">{summary.invalid}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>{t("certificates.overview.statExpiringSoon")}</CardDescription>
              <CardTitle className="text-3xl text-amber-600">{summary.expiring_soon}</CardTitle>
            </CardHeader>
          </Card>
        </div>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>{t("certificates.overview.filtersTitle")}</CardTitle>
          <CardDescription>{t("certificates.overview.filtersDescription")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <details className="rounded-lg border border-dashed p-3 text-sm">
            <summary className="cursor-pointer font-medium">
              {t("certificates.overview.openapiMappingTitle")}
            </summary>
            <div className="mt-2 space-y-1 text-xs text-muted-foreground">
              <p>{t("certificates.overview.openapiMappingDomainLocal")}</p>
              <p>{t("certificates.overview.openapiMappingIssuer")}</p>
              <p>{t("certificates.overview.openapiMappingIp")}</p>
              <p>{t("certificates.overview.openapiMappingExpiry")}</p>
            </div>
          </details>
          <div className="grid gap-3 lg:grid-cols-[1.1fr_1.9fr]">
            <div className="space-y-3 rounded-lg border p-3">
              <div className="space-y-1">
                <p className="text-sm font-medium">{t("certificates.overview.filterDomainLabel")}</p>
                <p className="text-xs text-muted-foreground">{t("certificates.overview.filterLocalHint")}</p>
              </div>
              <FilterToolbar
                className="md:grid-cols-1 xl:grid-cols-1"
                search={{
                  value: domainKeyword,
                  onValueChange: handleDomainKeywordChange,
                  placeholder: t("certificates.overview.filterDomainPlaceholder"),
                  inputClassName: "h-10",
                }}
              />
            </div>

            <div className="space-y-3 rounded-lg border p-3">
              <div className="space-y-1">
                <p className="text-sm font-medium">{t("certificates.overview.apiFiltersTitle")}</p>
                <p className="text-xs text-muted-foreground">{t("certificates.overview.filterApiHint")}</p>
              </div>

              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                <div className="space-y-2">
                  <Label htmlFor="cert-overview-issuer">{t("certificates.overview.filterIssuerLabel")}</Label>
                  <Input
                    id="cert-overview-issuer"
                    value={issuerKeywordDraft}
                    onChange={(event) => setIssuerKeywordDraft(event.target.value)}
                    onKeyDown={handleApiFilterKeyDown}
                    placeholder={t("certificates.overview.filterIssuerPlaceholder")}
                    className="h-10"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cert-overview-ip">{t("certificates.overview.filterIpLabel")}</Label>
                  <Input
                    id="cert-overview-ip"
                    value={ipKeywordDraft}
                    onChange={(event) => setIpKeywordDraft(event.target.value)}
                    onKeyDown={handleApiFilterKeyDown}
                    placeholder={t("certificates.overview.filterIpPlaceholder")}
                    className="h-10"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cert-overview-expiry-days">{t("certificates.overview.filterExpiryDaysLabel")}</Label>
                  <div className="space-y-1">
                    <Input
                      id="cert-overview-expiry-days"
                      value={expiryDaysDraft}
                      onChange={(event) => setExpiryDaysDraft(event.target.value)}
                      onKeyDown={handleApiFilterKeyDown}
                      placeholder={t("certificates.overview.filterExpiryDaysPlaceholder")}
                      inputMode="numeric"
                      aria-invalid={!isExpiryDaysDraftValid}
                      className="h-10"
                    />
                    {!isExpiryDaysDraftValid ? (
                      <p className="text-xs text-destructive">
                        {t("certificates.overview.filterExpiryDaysInvalid")}
                      </p>
                    ) : null}
                  </div>
                </div>
                <div className="flex items-end gap-2">
                  <Button
                    type="button"
                    onClick={handleApplyApiFilters}
                    className="h-10"
                    disabled={!hasPendingApiFilterChanges || !isExpiryDaysDraftValid}
                  >
                    {t("certificates.overview.applyFilters")}
                  </Button>
                  <Button type="button" variant="outline" onClick={handleClearFilters} className="h-10">
                    {t("certificates.overview.clearFilters")}
                  </Button>
                </div>
              </div>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            <span>{t("certificates.overview.appliedLocalFiltersLabel")}</span>
            {hasLocalDomainFilter ? (
              <Badge variant="secondary">
                {t("certificates.overview.appliedDomain", { value: domainKeyword.trim() })}
              </Badge>
            ) : (
              <span>{t("certificates.overview.appliedLocalFiltersEmpty")}</span>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            <span>{t("certificates.overview.appliedApiFiltersLabel")}</span>
            {hasAppliedApiFilters ? (
              <>
                {issuerKeyword.trim() ? (
                  <Badge variant="secondary">
                    {t("certificates.overview.appliedIssuer", { value: issuerKeyword.trim() })}
                  </Badge>
                ) : null}
                {ipKeyword.trim() ? (
                  <Badge variant="secondary">
                    {t("certificates.overview.appliedIp", { value: ipKeyword.trim() })}
                  </Badge>
                ) : null}
                {expiryDays.trim() ? (
                  <Badge variant="secondary">
                    {t("certificates.overview.appliedExpiryDays", { value: expiryDays.trim() })}
                  </Badge>
                ) : null}
              </>
            ) : (
              <span>{t("certificates.overview.appliedApiFiltersEmpty")}</span>
            )}
            <CopyCurlDropdown
              texts={{
                title: t("certificates.overview.copyApiCurl"),
                normal: t("certificates.overview.copyApiCurlNormal"),
                insecure: t("certificates.overview.copyApiCurlInsecure"),
              }}
              onCopy={handleCopyApiCurl}
              triggerLabel={t("certificates.overview.copyApiCurl")}
              preferenceKeyId="certificates-overview-copy-curl"
              triggerSuffix={<HttpMethodBadge method="GET" className="ml-1" />}
              buttonClassName="h-7 px-2 text-xs"
              tooltip={t("certificates.overview.copyApiCurlHint")}
              insecureBadgeLabel={t("certificates.overview.copyApiCurlInsecureBadge")}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("certificates.overview.tableTitle")}</CardTitle>
          <CardDescription>{t("certificates.overview.tableDescription", { limit: PAGE_LIMIT })}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-3 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            <span>
              {t("certificates.overview.tableResultSummary", {
                filtered: filteredCerts.length,
                page: certs.length,
                total: certsPage.total,
              })}
            </span>
            {hasLocalDomainFilter ? (
              <Badge variant="outline">
                {t("certificates.overview.tableResultSummaryLocalFiltered")}
              </Badge>
            ) : null}
            {hasPendingApiFilterChanges ? (
              <Badge variant="outline">
                {t("certificates.overview.tableResultSummaryPendingApiFilters")}
              </Badge>
            ) : null}
          </div>
          <div className="overflow-hidden rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[35%]">{t("certificates.overview.tableColDomain")}</TableHead>
                  <TableHead className="w-[25%]">{t("certificates.overview.tableColStatus")}</TableHead>
                  <TableHead className="w-[25%]">{t("certificates.overview.tableColExpiration")}</TableHead>
                  <TableHead className="w-[15%] text-right">{t("certificates.overview.tableColActions")}</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={4} className="h-40 text-center text-muted-foreground">
                      <Loader2 className="mx-auto mb-2 h-5 w-5 animate-spin" />
                      {t("certificates.overview.tableLoading")}
                    </TableCell>
                  </TableRow>
                ) : filteredCerts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="h-32 text-center text-muted-foreground">
                      <div className="space-y-1">
                        <p>
                          {certs.length === 0
                            ? t("certificates.overview.tableEmpty")
                            : t("certificates.overview.tableEmptyFiltered")}
                        </p>
                        <p className="text-xs text-muted-foreground/80">
                          {certs.length === 0
                            ? t("certificates.overview.tableEmptyHint")
                            : t("certificates.overview.tableEmptyFilteredHint")}
                        </p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredCerts.map((cert) => {
                    const statusMeta = getCertificateStatusMeta(cert, t)
                    const StatusIcon = statusMeta.icon
                    const daysUntilExpiry = getDaysUntilExpiry(cert.not_after)

                    return (
                      <TableRow
                        key={cert.id}
                        className="cursor-pointer hover:bg-muted/40"
                        onClick={() => router.push(withLocalePrefix(`/certificates/${cert.id}`, locale))}
                      >
                        <TableCell>
                          <div className="space-y-1">
                            <p className="font-medium">{cert.domain}</p>
                            <p className="text-xs text-muted-foreground truncate max-w-[300px]" title={cert.issuer_cn || ""}>
                              {cert.issuer_cn || t("certificates.overview.issuerUnknown")}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={`gap-1 ${statusMeta.className}`}>
                            <StatusIcon className="h-3 w-3" />
                            {statusMeta.label}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <p className="text-sm">{formatDate(cert.not_after, locale)}</p>
                            {daysUntilExpiry !== null && daysUntilExpiry > 0 && (
                              <p className="text-xs text-muted-foreground">
                                {t("certificates.overview.daysRemaining", { days: daysUntilExpiry })}
                              </p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation()
                              router.push(withLocalePrefix(`/certificates/${cert.id}`, locale))
                            }}
                          >
                            {t("certificates.overview.actionViewDetails")}
                          </Button>
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
            pageIndicatorText={t("certificates.overview.paginationPage", { page: pagination.currentPage })}
            prevLabel={t("certificates.overview.paginationPrev")}
            nextLabel={t("certificates.overview.paginationNext")}
            onPrevPage={() => setOffset((previous) => Math.max(0, previous - PAGE_LIMIT))}
            onNextPage={() => setOffset((previous) => previous + PAGE_LIMIT)}
            prevDisabled={!pagination.canGoPrev || loading}
            nextDisabled={!pagination.canGoNext || loading}
          />
        </CardContent>
      </Card>

      <Dialog
        open={chainDialogOpen}
        onOpenChange={(open) => {
          setChainDialogOpen(open)

          if (!open) {
            setSelectedCertificate(null)
            setChainInfo(null)
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("certificates.overview.chainDialogTitle")}</DialogTitle>
            <DialogDescription>
              {t("certificates.overview.chainDialogDescription", {
                domain: selectedCertificate?.domain || "-",
              })}
            </DialogDescription>
          </DialogHeader>

          {loadingChain ? (
            <div className="py-10 text-center text-muted-foreground">
              <Loader2 className="mx-auto mb-2 h-5 w-5 animate-spin" />
              {t("certificates.overview.chainLoading")}
            </div>
          ) : chainInfo ? (
            <div className="space-y-3 rounded-md border p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">{t("certificates.overview.chainFieldStatus")}</span>
                <Badge
                  className={chainInfo.chain_valid
                    ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-600"
                    : "border-red-500/30 bg-red-500/10 text-red-600"}
                >
                  {chainInfo.chain_valid
                    ? t("certificates.overview.chainStatusValid")
                    : t("certificates.overview.chainStatusInvalid")}
                </Badge>
              </div>
              <div className="flex items-center justify-between gap-4">
                <span className="text-sm text-muted-foreground">{t("certificates.overview.chainFieldCheckedAt")}</span>
                <span className="text-sm">{formatCertificateDateTime(chainInfo.last_checked, locale)}</span>
              </div>
              <div className="space-y-1">
                <span className="text-sm text-muted-foreground">{t("certificates.overview.chainFieldError")}</span>
                <p className="text-sm">
                  {chainInfo.chain_error || t("certificates.overview.chainNoError")}
                </p>
              </div>
            </div>
          ) : (
            <div className="py-8 text-center text-muted-foreground">
              {t("certificates.overview.chainNoData")}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
