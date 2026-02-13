"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { api, getApiErrorMessage } from "@/lib/api"
import { CertificateChainInfo, CertificateDetails, CertSummary } from "@/types/api"
import { useAppTranslations } from "@/hooks/use-app-translations"
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
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
  ChevronLeft,
  ChevronRight,
  ChevronRight as ArrowRight,
  Loader2,
  RefreshCw,
  ShieldAlert,
  ShieldCheck,
  ShieldX,
} from "lucide-react"
import { toast } from "sonner"

const PAGE_LIMIT = 20

type CertificatesQueryState = {
  certs: CertificateDetails[]
  summary: CertSummary | null
}
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
  const [offset, setOffset] = useState(initialOffset)
  const [currentPageCount, setCurrentPageCount] = useState(0)

  const [chainDialogOpen, setChainDialogOpen] = useState(false)
  const [selectedCertificate, setSelectedCertificate] = useState<CertificateDetails | null>(null)

  const {
    data: certificatesData,
    loading,
    refreshing,
    execute,
  } = useRequestState<CertificatesQueryState>({
    certs: [],
    summary: null,
  })

  const {
    data: chainInfo,
    setData: setChainInfo,
    loading: loadingChain,
    execute: executeChain,
  } = useRequestState<CertificateChainInfo | null>(null, { initialLoading: false })

  const certs = certificatesData.certs
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
            certs: certificates,
            summary: summaryData,
          }
        },
        {
          silent,
          onSuccess: (data) => {
            setCurrentPageCount(data.certs.length)
          },
          onError: (error) => {
            toast.error(getApiErrorMessage(error, t("certificates.overview.toastFetchError")))
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

  const pageNumber = Math.floor(offset / PAGE_LIMIT) + 1
  const canGoPrev = offset > 0
  const canGoNext = currentPageCount >= PAGE_LIMIT

  const handleDomainKeywordChange = (value: string) => {
    setDomainKeyword(value)
    setOffset((previous) => (previous === 0 ? previous : 0))
  }

  const handleIssuerKeywordChange = (value: string) => {
    setIssuerKeyword(value)
    setOffset((previous) => (previous === 0 ? previous : 0))
  }

  const handleIpKeywordChange = (value: string) => {
    setIpKeyword(value)
    setOffset((previous) => (previous === 0 ? previous : 0))
  }

  const handleExpiryDaysChange = (value: string) => {
    setExpiryDays(value)
    setOffset((previous) => (previous === 0 ? previous : 0))
  }

  const handleClearFilters = () => {
    setDomainKeyword("")
    setIssuerKeyword("")
    setIpKeyword("")
    setExpiryDays("")
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
          toast.error(getApiErrorMessage(error, t("certificates.overview.toastChainError")))
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

  return (
    <div className="space-y-6 p-8">
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
        <CardContent>
          <FilterToolbar
            className="gap-3 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-4"
            search={{
              value: domainKeyword,
              onValueChange: handleDomainKeywordChange,
              placeholder: t("certificates.overview.filterDomainPlaceholder"),
              inputClassName: "h-10",
            }}
          >
            <Input
              value={issuerKeyword}
              onChange={(event) => handleIssuerKeywordChange(event.target.value)}
              placeholder={t("certificates.overview.filterIssuerPlaceholder")}
              className="h-10"
            />
            <Input
              value={ipKeyword}
              onChange={(event) => handleIpKeywordChange(event.target.value)}
              placeholder={t("certificates.overview.filterIpPlaceholder")}
              className="h-10"
            />
            <div className="flex gap-2">
              <Input
                value={expiryDays}
                onChange={(event) => handleExpiryDaysChange(event.target.value)}
                placeholder={t("certificates.overview.filterExpiryDaysPlaceholder")}
                inputMode="numeric"
                className="h-10"
              />
              <Button type="button" variant="outline" onClick={handleClearFilters} className="h-10">
                {t("certificates.overview.clearFilters")}
              </Button>
            </div>
          </FilterToolbar>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("certificates.overview.tableTitle")}</CardTitle>
          <CardDescription>{t("certificates.overview.tableDescription", { limit: PAGE_LIMIT })}</CardDescription>
        </CardHeader>
        <CardContent>
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
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation()
                              router.push(withLocalePrefix(`/certificates/${cert.id}`, locale))
                            }}
                          >
                            {t("certificates.overview.actionViewDetails")}
                            <ArrowRight className="ml-1 h-4 w-4" />
                          </Button>
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
              {t("certificates.overview.paginationPage", { page: pageNumber })}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={!canGoPrev || loading}
              onClick={() => setOffset((previous) => Math.max(0, previous - PAGE_LIMIT))}
            >
              <ChevronLeft className="mr-1 h-4 w-4" />
              {t("certificates.overview.paginationPrev")}
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={!canGoNext || loading}
              onClick={() => setOffset((previous) => previous + PAGE_LIMIT)}
            >
              {t("certificates.overview.paginationNext")}
              <ChevronRight className="ml-1 h-4 w-4" />
            </Button>
          </div>
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
                <span className="text-sm">{formatDateTime(chainInfo.last_checked, locale)}</span>
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
