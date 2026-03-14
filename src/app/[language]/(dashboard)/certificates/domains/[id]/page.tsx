"use client"

import Link from "next/link"
import { ReactNode, useCallback, useEffect, useMemo, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { ApiRequestError, api } from "@/lib/api"
import { formatCertificateDateTime, parseOptionalNonNegativeInt } from "@/lib/certificates/formats"
import { CertCheckResult, CertificateDetails, DomainDetailView, DomainOverviewItem } from "@/types/api"
import { useAppTranslations } from "@/hooks/use-app-translations"
import { withLocalePrefix } from "@/components/app-locale"
import { DomainDeleteDialog } from "@/components/pages/certificates/domain-delete-dialog"
import { MonitoringDomainConfigDialog } from "@/components/pages/certificates/monitoring-domain-config-dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Area, AreaChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"
import { ArrowLeft, ExternalLink, Globe, History, Loader2, Pencil, RefreshCw, Server, ShieldAlert, ShieldCheck, ShieldX, Trash2, TriangleAlert } from "lucide-react"
import { toast, toastActionSuccess, toastApiError, toastDeleted, toastSaved, toastStatusError } from "@/lib/toast"

type TranslateFn = (path: string, values?: Record<string, string | number>) => string

type LatestCheckStatusMeta = {
  className: string
  icon: typeof ShieldCheck
  label: string
}

type HistoryFilter = "all" | "valid" | "invalid"
type HistoryRange = "all" | "1h" | "24h" | "7d"

function getLatestCheckStatusMeta(latestCheck: CertCheckResult | null, t: TranslateFn): LatestCheckStatusMeta {
  if (!latestCheck) {
    return {
      className: "border-muted bg-muted text-muted-foreground",
      icon: ShieldX,
      label: t("certificates.detail.statusUnknown"),
    }
  }

  if (!latestCheck.is_valid || !latestCheck.chain_valid) {
    const isExpired = (latestCheck.days_until_expiry ?? 0) < 0

    return {
      className: "border-red-500/30 bg-red-500/10 text-red-600",
      icon: ShieldAlert,
      label: isExpired
        ? t("certificates.detail.statusExpired")
        : t("certificates.domains.historyStatusInvalid"),
    }
  }

  if (latestCheck.days_until_expiry !== null && latestCheck.days_until_expiry <= 30) {
    return {
      className: "border-amber-500/30 bg-amber-500/10 text-amber-600",
      icon: ShieldX,
      label: t("certificates.detail.statusExpiringSoon", {
        days: latestCheck.days_until_expiry,
      }),
    }
  }

  return {
    className: "border-emerald-500/30 bg-emerald-500/10 text-emerald-600",
    icon: ShieldCheck,
    label: latestCheck.days_until_expiry === null
      ? t("certificates.domains.historyStatusValid")
      : t("certificates.detail.statusHealthy", {
          days: latestCheck.days_until_expiry,
        }),
  }
}

function getBooleanBadgeMeta(enabled: boolean) {
  if (enabled) {
    return {
      className: "border-emerald-500/30 bg-emerald-500/10 text-emerald-600",
    }
  }

  return {
    className: "border-muted bg-muted text-muted-foreground",
  }
}

function formatList(value: string[] | null | undefined) {
  if (!Array.isArray(value)) {
    return []
  }

  return value.filter(Boolean)
}

function renderListOrFallback(items: string[], fallback: string) {
  if (items.length === 0) {
    return <p className="text-sm text-muted-foreground">{fallback}</p>
  }

  return (
    <div className="flex flex-wrap gap-2">
      {items.map((item) => (
        <Badge key={item} variant="secondary" className="max-w-full break-all text-xs">
          {item}
        </Badge>
      ))}
    </div>
  )
}

function TechnicalField({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="rounded-xl border border-border/60 bg-background/80 p-4 shadow-sm">
      <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">{label}</p>
      <div className="mt-2 text-sm break-all text-foreground">{value}</div>
    </div>
  )
}

function TrendCard({
  title,
  description,
  children,
}: {
  title: string
  description: string
  children: ReactNode
}) {
  return (
    <Card className="overflow-hidden border-border/60 shadow-sm">
      <CardHeader className="border-b border-border/60 pb-4">
        <CardTitle className="text-base">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="pt-6">{children}</CardContent>
    </Card>
  )
}

function SummaryStatCard({
  label,
  value,
  tone = "default",
}: {
  label: string
  value: ReactNode
  tone?: "default" | "success" | "danger"
}) {
  const valueClassName = tone === "success"
    ? "text-emerald-600"
    : tone === "danger"
      ? "text-red-600"
      : "text-foreground"

  return (
    <div className="rounded-2xl border border-border/60 bg-card p-5 shadow-sm">
      <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">{label}</p>
      <p className={`mt-3 text-3xl font-semibold tabular-nums ${valueClassName}`}>{value}</p>
    </div>
  )
}

function resolveRangeStart(range: HistoryRange) {
  const now = Date.now()

  if (range === "1h") {
    return now - 3600 * 1000
  }

  if (range === "24h") {
    return now - 24 * 3600 * 1000
  }

  if (range === "7d") {
    return now - 7 * 24 * 3600 * 1000
  }

  return null
}

function CertificateDetailsSection({
  certificate,
  locale,
  t,
  certificateId,
}: {
  certificate: CertificateDetails | null
  locale: "zh" | "en"
  t: TranslateFn
  certificateId: string | null
}) {
  if (!certificate) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{t("certificates.domains.detailCertificateTitle")}</CardTitle>
          <CardDescription>{t("certificates.domains.detailCertificateDescription")}</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">{t("certificates.domains.detailCertificateEmpty")}</p>
        </CardContent>
      </Card>
    )
  }

  const altNames = formatList(certificate.subject_alt_names)
  const keyUsage = formatList(certificate.key_usage)
  const extendedKeyUsage = formatList(certificate.extended_key_usage)
  const ocspUrls = formatList(certificate.ocsp_urls)
  const crlUrls = formatList(certificate.crl_urls)
  const caIssuerUrls = formatList(certificate.ca_issuer_urls)

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <CardTitle>{t("certificates.domains.detailCertificateTitle")}</CardTitle>
            <CardDescription>{t("certificates.domains.detailCertificateDescription")}</CardDescription>
          </div>
          {certificateId ? (
            <Button variant="outline" asChild>
              <Link href={withLocalePrefix(`/certificates/${certificateId}`, locale)}>
                {t("certificates.domains.detailOpenCertificate")}
              </Link>
            </Button>
          ) : null}
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <TechnicalField label={t("certificates.detail.fieldIssuer")} value={certificate.issuer_cn || "-"} />
          <TechnicalField label={t("certificates.detail.fieldIssuerOrg")} value={certificate.issuer_o || "-"} />
          <TechnicalField label={t("certificates.detail.fieldIssuerOu")} value={certificate.issuer_ou || "-"} />
          <TechnicalField label={t("certificates.detail.fieldIssuerCountry")} value={certificate.issuer_c || "-"} />
          <TechnicalField label={t("certificates.detail.fieldSubjectCn")} value={certificate.subject_cn || "-"} />
          <TechnicalField label={t("certificates.detail.fieldSubjectOrg")} value={certificate.subject_o || "-"} />
          <TechnicalField label={t("certificates.detail.fieldNotBefore")} value={formatCertificateDateTime(certificate.not_before, locale)} />
          <TechnicalField label={t("certificates.detail.fieldNotAfter")} value={formatCertificateDateTime(certificate.not_after, locale)} />
          <TechnicalField label={t("certificates.detail.fieldLastChecked")} value={formatCertificateDateTime(certificate.last_checked, locale)} />
          <TechnicalField label={t("certificates.detail.fieldSerialNumber")} value={certificate.serial_number || "-"} />
          <TechnicalField label={t("certificates.detail.fieldFingerprintSha256")} value={certificate.fingerprint_sha256 || "-"} />
          <TechnicalField label={t("certificates.detail.fieldSignatureAlgorithm")} value={certificate.signature_algorithm || "-"} />
          <TechnicalField label={t("certificates.detail.fieldPublicKeyAlgorithm")} value={certificate.public_key_algorithm || "-"} />
          <TechnicalField label={t("certificates.detail.fieldPublicKeyBits")} value={certificate.public_key_bits ?? "-"} />
          <TechnicalField label={t("certificates.detail.fieldTlsVersion")} value={certificate.tls_version || "-"} />
          <TechnicalField label={t("certificates.detail.fieldCipherSuite")} value={certificate.cipher_suite || "-"} />
          <TechnicalField label={t("certificates.detail.fieldVersion")} value={certificate.version ?? "-"} />
          <TechnicalField label={t("certificates.detail.fieldChainDepth")} value={certificate.chain_depth ?? "-"} />
          <TechnicalField label={t("certificates.detail.fieldSctCount")} value={certificate.sct_count ?? "-"} />
          <TechnicalField
            label={t("certificates.detail.fieldIsWildcard")}
            value={certificate.is_wildcard === null ? "-" : certificate.is_wildcard ? t("certificates.domains.statusEnabled") : t("certificates.domains.statusDisabled")}
          />
          <TechnicalField
            label={t("certificates.detail.fieldIsCa")}
            value={certificate.is_ca === null ? "-" : certificate.is_ca ? t("certificates.domains.statusEnabled") : t("certificates.domains.statusDisabled")}
          />
        </div>

        <Separator />

        <div className="space-y-4">
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">{t("certificates.detail.fieldAltNames")}</p>
            {renderListOrFallback(altNames, t("certificates.domains.noteEmpty"))}
          </div>
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">{t("certificates.detail.ipAddressesTitle")}</p>
            {renderListOrFallback(certificate.ip_addresses, t("certificates.detail.noIpAddresses"))}
          </div>
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">{t("certificates.detail.fieldKeyUsage")}</p>
            {renderListOrFallback(keyUsage, t("certificates.domains.noteEmpty"))}
          </div>
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">{t("certificates.detail.fieldExtendedKeyUsage")}</p>
            {renderListOrFallback(extendedKeyUsage, t("certificates.domains.noteEmpty"))}
          </div>
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">{t("certificates.detail.fieldOcspUrls")}</p>
            {renderListOrFallback(ocspUrls, t("certificates.domains.noteEmpty"))}
          </div>
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">{t("certificates.detail.fieldCrlUrls")}</p>
            {renderListOrFallback(crlUrls, t("certificates.domains.noteEmpty"))}
          </div>
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">{t("certificates.detail.fieldCaIssuerUrls")}</p>
            {renderListOrFallback(caIssuerUrls, t("certificates.domains.noteEmpty"))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default function DomainDetailPage() {
  const { t, locale } = useAppTranslations("pages")
  const params = useParams()
  const router = useRouter()
  const domainId = params.id as string

  const [detail, setDetail] = useState<DomainDetailView | null>(null)
  const [overviewItem, setOverviewItem] = useState<DomainOverviewItem | null>(null)
  const [historyItems, setHistoryItems] = useState<CertCheckResult[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [checking, setChecking] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [editPort, setEditPort] = useState("")
  const [editInterval, setEditInterval] = useState("")
  const [editNote, setEditNote] = useState("")
  const [editEnabled, setEditEnabled] = useState(true)
  const [checkAfterSave, setCheckAfterSave] = useState(false)
  const [historyFilter, setHistoryFilter] = useState<HistoryFilter>("all")
  const [historyRange, setHistoryRange] = useState<HistoryRange>("24h")

  const fetchData = useCallback(async (silent = false) => {
    if (silent) {
      setRefreshing(true)
    } else {
      setLoading(true)
    }

    try {
      const [detailView, history] = await Promise.all([
        api.getDomainDetailView(domainId),
        api.getCertCheckHistory(domainId, {
          limit: 50,
          offset: 0,
        }),
      ])

      setDetail(detailView)
      setHistoryItems(history)
      setEditPort(String(detailView.domain_info.port ?? ""))
      setEditInterval(detailView.domain_info.check_interval_secs === null ? "" : String(detailView.domain_info.check_interval_secs))
      setEditNote(detailView.domain_info.note || "")
      setEditEnabled(detailView.domain_info.enabled)
      setCheckAfterSave(false)

      try {
        const overview = await api.listDomainOverview({
          domain_contains: detailView.domain_info.domain,
          limit: 20,
          offset: 0,
        })

        const exactMatch = overview.items.find((item) => item.id === detailView.domain_info.id)
          || overview.items.find((item) => item.domain.toLowerCase() === detailView.domain_info.domain.toLowerCase())
          || null

        setOverviewItem(exactMatch)
      } catch {
        setOverviewItem(null)
      }
    } catch (error) {
      toastApiError(error, t("certificates.domains.toastDetailFetchError"))
      router.push(withLocalePrefix("/certificates/domains", locale))
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [domainId, locale, router, t])

  useEffect(() => {
    void fetchData()
  }, [fetchData])

  const handleCheckNow = async () => {
    if (!detail) {
      return
    }

    setChecking(true)

    try {
      const result = await api.checkSingleDomain(detail.domain_info.id)

      if (result.is_valid && result.chain_valid) {
        toastActionSuccess(t("certificates.domains.toastCheckSuccess"))
      } else {
        toast.error(
          t("certificates.domains.toastCheckFailed", {
            reason: result.error || t("certificates.domains.errorUnknown"),
          })
        )
      }

      await fetchData(true)
    } catch (error) {
      if (error instanceof ApiRequestError && error.status === 404) {
        toast.error(t("certificates.domains.toastDeleteNotFound"))
      } else {
        toastApiError(error, t("certificates.domains.toastCheckError"))
      }
    } finally {
      setChecking(false)
    }
  }

  const handleOpenEdit = () => {
    if (!detail) {
      return
    }

    setEditPort(String(detail.domain_info.port ?? ""))
    setEditInterval(detail.domain_info.check_interval_secs === null ? "" : String(detail.domain_info.check_interval_secs))
    setEditNote(detail.domain_info.note || "")
    setEditEnabled(detail.domain_info.enabled)
    setCheckAfterSave(false)
    setEditOpen(true)
  }

  const handleSaveConfig = async () => {
    if (!detail) {
      return
    }

    const port = parseOptionalNonNegativeInt(editPort)
    const checkInterval = parseOptionalNonNegativeInt(editInterval)

    if (port === undefined || checkInterval === undefined) {
      toast.error(t("certificates.domains.toastInvalidNumber"))
      return
    }

    setSaving(true)

    try {
      await api.updateDomain(detail.domain_info.id, {
        port,
        enabled: editEnabled,
        check_interval_secs: checkInterval,
        note: editNote.trim() ? editNote.trim() : null,
      })

      toastSaved(t("certificates.domains.toastUpdateSuccess"))
      setEditOpen(false)

      if (editEnabled && checkAfterSave) {
        await api.checkSingleDomain(detail.domain_info.id)
      }

      await fetchData(true)
    } catch (error) {
      toastApiError(error, t("certificates.domains.toastUpdateError"))
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteDomain = async () => {
    if (!detail) {
      return
    }

    setDeleting(true)

    try {
      await api.deleteDomain(detail.domain_info.id)
      toastDeleted(t("certificates.domains.toastDeleteSuccess"))
      router.push(withLocalePrefix("/certificates/domains", locale))
    } catch (error) {
      toastStatusError(error, t("certificates.domains.toastDeleteError"), {
        404: t("certificates.domains.toastDeleteNotFound"),
      })
    } finally {
      setDeleting(false)
    }
  }

  const domain = detail?.domain_info ?? null
  const latestCheck = detail?.latest_check ?? null
  const certificate = detail?.certificate_details ?? null
  const historyStats = useMemo(() => {
    const validCount = historyItems.filter((item) => item.is_valid && item.chain_valid).length
    const invalidCount = historyItems.length - validCount

    return {
      total: historyItems.length,
      valid: validCount,
      invalid: invalidCount,
    }
  }, [historyItems])
  const filteredHistoryItems = useMemo(() => {
    const rangeStart = resolveRangeStart(historyRange)

    const rangeFiltered = historyItems.filter((item) => {
      if (rangeStart === null) {
        return true
      }

      const checkedAt = new Date(item.checked_at).getTime()

      if (!Number.isFinite(checkedAt)) {
        return false
      }

      return checkedAt >= rangeStart
    })

    if (historyFilter === "valid") {
      return rangeFiltered.filter((item) => item.is_valid && item.chain_valid)
    }

    if (historyFilter === "invalid") {
      return rangeFiltered.filter((item) => !(item.is_valid && item.chain_valid))
    }

    return rangeFiltered
  }, [historyFilter, historyItems, historyRange])
  const trendChartData = useMemo(() => {
    return historyItems
      .slice()
      .reverse()
      .map((item, index) => ({
        index: index + 1,
        time: formatCertificateDateTime(item.checked_at, locale),
        shortTime: new Date(item.checked_at).toLocaleTimeString(locale === "zh" ? "zh-CN" : "en-US", {
          hour: "2-digit",
          minute: "2-digit",
        }),
        expiryDays: item.days_until_expiry ?? null,
        availability: item.is_valid && item.chain_valid ? 100 : 0,
      }))
  }, [historyItems, locale])

  if (loading) {
    return (
      <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!detail) {
    return null
  }

  const monitoringStatusMeta = getBooleanBadgeMeta(domain.enabled)
  const latestStatusMeta = getLatestCheckStatusMeta(latestCheck, t)
  const LatestStatusIcon = latestStatusMeta.icon
  const latestResolvedIps = formatList(latestCheck?.resolved_ips)
  const latestSanList = formatList(latestCheck?.san_list)
  const latestSummaryItems = [
    {
      label: t("certificates.domains.detailSummaryTotalChecks"),
      value: historyStats.total,
      tone: "default" as const,
    },
    {
      label: t("certificates.domains.detailSummaryValidChecks"),
      value: historyStats.valid,
      tone: "success" as const,
    },
    {
      label: t("certificates.domains.detailSummaryInvalidChecks"),
      value: historyStats.invalid,
      tone: "danger" as const,
    },
    {
      label: t("certificates.domains.detailSummaryResolvedIpCount"),
      value: latestResolvedIps.length,
      tone: "default" as const,
    },
  ]

  return (
    <div className="min-w-0 space-y-6 p-4 md:p-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="icon"
            onClick={() => router.push(withLocalePrefix("/certificates/domains", locale))}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h2 className="text-2xl font-semibold tracking-tight">{domain.domain}</h2>
            <p className="text-sm text-muted-foreground">{t("certificates.domains.detailDescription")}</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" onClick={() => void fetchData(true)} disabled={refreshing}>
            <RefreshCw className={`mr-2 h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
            {t("certificates.domains.refreshButton")}
          </Button>
          <Button variant="outline" onClick={handleOpenEdit}>
            <Pencil className="mr-2 h-4 w-4" />
            {t("certificates.domains.detailEditButton")}
          </Button>
          <Button onClick={() => void handleCheckNow()} disabled={checking}>
            {checking ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ShieldCheck className="mr-2 h-4 w-4" />}
            {checking ? t("certificates.domains.detailChecking") : t("certificates.domains.actionCheck")}
          </Button>
          <Button variant="destructive" onClick={() => setDeleteOpen(true)}>
            <Trash2 className="mr-2 h-4 w-4" />
            {t("certificates.domains.actionDelete")}
          </Button>
          <Button variant="outline" asChild>
            <a href={`https://${domain.domain}`} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="mr-2 h-4 w-4" />
              {t("certificates.detail.btnVisit")}
            </a>
          </Button>
        </div>
      </div>

      <Card className="overflow-hidden border-border/60 shadow-sm">
        <CardHeader className="border-b border-border/60">
          <div className="flex flex-col gap-6 xl:flex-row xl:items-start xl:justify-between">
            <div className="flex items-start gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-sky-100 bg-sky-50 text-sky-600 shadow-sm">
                <Globe className="h-8 w-8" />
              </div>
              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-2xl font-semibold tracking-tight">{domain.domain}</h3>
                  <Badge className={monitoringStatusMeta.className}>
                    {domain.enabled ? t("certificates.domains.statusEnabled") : t("certificates.domains.statusDisabled")}
                  </Badge>
                  <Badge className={latestStatusMeta.className}>{latestStatusMeta.label}</Badge>
                </div>
                <p className="max-w-2xl text-sm leading-6 text-muted-foreground">{t("certificates.domains.detailHeroDescription")}</p>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="secondary">{t("certificates.domains.fieldPort")}: {domain.port}</Badge>
                  <Badge variant="secondary">
                    {t("certificates.domains.fieldInterval")}:
                    {" "}
                    {domain.check_interval_secs === null
                      ? t("certificates.domains.intervalDefault")
                      : t("certificates.domains.intervalSeconds", { seconds: domain.check_interval_secs })}
                  </Badge>
                  <Badge variant="secondary">
                    {t("certificates.domains.tableColLastChecked")}:
                    {" "}
                    {formatCertificateDateTime(domain.last_checked_at, locale)}
                  </Badge>
                </div>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 xl:w-[360px]">
              <div className="rounded-2xl border border-border/60 bg-muted/30 p-4">
                <div className="flex items-center gap-3">
                  <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${latestStatusMeta.className}`}>
                    <LatestStatusIcon className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                      {t("certificates.domains.detailLatestCheckTitle")}
                    </p>
                    <p className="mt-1 text-sm font-medium">{latestStatusMeta.label}</p>
                  </div>
                </div>
              </div>
              <div className="rounded-2xl border border-border/60 bg-muted/30 p-4">
                <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                  {t("certificates.detail.fieldLastChecked")}
                </p>
                <p className="mt-2 text-sm font-medium">
                  {formatCertificateDateTime(latestCheck?.checked_at || null, locale)}
                </p>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <TechnicalField label={t("certificates.domains.fieldDomain")} value={<span className="font-mono">{domain.domain}</span>} />
              <TechnicalField label={t("certificates.domains.tableColStatus")} value={domain.enabled ? t("certificates.domains.statusEnabled") : t("certificates.domains.statusDisabled")} />
              <TechnicalField label={t("certificates.domains.tableColLastChecked")} value={formatCertificateDateTime(domain.last_checked_at, locale)} />
              <TechnicalField label={t("certificates.detail.fieldLastChecked")} value={formatCertificateDateTime(latestCheck?.checked_at || null, locale)} />
              <TechnicalField label={t("certificates.domains.detailFieldIssuer")} value={latestCheck?.issuer || certificate?.issuer_cn || "-"} />
              <TechnicalField label={t("certificates.domains.detailFieldSubject")} value={latestCheck?.subject || certificate?.subject_cn || "-"} />
              <TechnicalField label={t("certificates.domains.detailSummaryResolvedIpCount")} value={latestResolvedIps.length} />
              <TechnicalField label={t("certificates.domains.fieldNote")} value={domain.note || t("certificates.domains.noteEmpty")} />
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {latestSummaryItems.map((item) => (
              <SummaryStatCard key={item.label} label={item.label} value={item.value} tone={item.tone} />
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 xl:grid-cols-2">
        <TrendCard
          title={t("certificates.domains.detailTrendExpiryTitle")}
          description={t("certificates.domains.detailTrendExpiryDescription")}
        >
          {trendChartData.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t("certificates.domains.historyEmpty")}</p>
          ) : (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trendChartData} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="expiryFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#2563eb" stopOpacity={0.35} />
                      <stop offset="95%" stopColor="#2563eb" stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="shortTime" tickLine={false} axisLine={false} minTickGap={24} />
                  <YAxis tickLine={false} axisLine={false} width={42} />
                  <Tooltip />
                  <Area
                    type="monotone"
                    dataKey="expiryDays"
                    stroke="#2563eb"
                    strokeWidth={2}
                    fill="url(#expiryFill)"
                    connectNulls
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </TrendCard>

        <TrendCard
          title={t("certificates.domains.detailTrendAvailabilityTitle")}
          description={t("certificates.domains.detailTrendAvailabilityDescription")}
        >
          {trendChartData.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t("certificates.domains.historyEmpty")}</p>
          ) : (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trendChartData} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="shortTime" tickLine={false} axisLine={false} minTickGap={24} />
                  <YAxis tickLine={false} axisLine={false} width={42} domain={[0, 100]} />
                  <Tooltip />
                  <Line
                    type="monotone"
                    dataKey="availability"
                    stroke="#16a34a"
                    strokeWidth={2.5}
                    dot={{ r: 2 }}
                    activeDot={{ r: 5 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </TrendCard>
      </div>

      <Tabs defaultValue="history" className="space-y-4">
        <TabsList variant="line" className="rounded-none border-b bg-transparent p-0">
          <TabsTrigger value="history" className="px-4 pb-3">{t("certificates.domains.detailTabHistory")}</TabsTrigger>
          <TabsTrigger value="latest" className="px-4 pb-3">{t("certificates.domains.detailTabLatest")}</TabsTrigger>
          <TabsTrigger value="certificate" className="px-4 pb-3">{t("certificates.domains.detailTabCertificate")}</TabsTrigger>
        </TabsList>

        <TabsContent value="history">
          <Card className="border-border/60 shadow-sm">
            <CardHeader className="gap-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <History className="h-5 w-5" />
                    {t("certificates.domains.detailHistoryTitle")}
                  </CardTitle>
                  <CardDescription>{t("certificates.domains.detailHistoryDescription")}</CardDescription>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <div className="flex flex-wrap gap-2">
                    {([
                      ["all", t("certificates.domains.detailHistoryFilterAll")],
                      ["valid", t("certificates.domains.detailHistoryFilterValid")],
                      ["invalid", t("certificates.domains.detailHistoryFilterInvalid")],
                    ] as const).map(([value, label]) => (
                      <Button
                        key={value}
                        type="button"
                        variant={historyFilter === value ? "default" : "outline"}
                        size="sm"
                        onClick={() => setHistoryFilter(value)}
                      >
                        {label}
                      </Button>
                    ))}
                  </div>
                  <Select value={historyRange} onValueChange={(value) => setHistoryRange(value as HistoryRange)}>
                    <SelectTrigger className="w-[140px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1h">{t("certificates.domains.detailHistoryRange1h")}</SelectItem>
                      <SelectItem value="24h">{t("certificates.domains.detailHistoryRange24h")}</SelectItem>
                      <SelectItem value="7d">{t("certificates.domains.detailHistoryRange7d")}</SelectItem>
                      <SelectItem value="all">{t("certificates.domains.detailHistoryRangeAll")}</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button type="button" variant="outline" size="sm" onClick={() => void fetchData(true)} disabled={refreshing}>
                    <RefreshCw className={`mr-2 h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
                    {t("certificates.domains.refreshButton")}
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {filteredHistoryItems.length === 0 ? (
                <p className="text-sm text-muted-foreground">{t("certificates.domains.historyEmpty")}</p>
              ) : (
                <div className="overflow-hidden rounded-xl border">
                  <Table>
                    <TableHeader className="bg-muted/40">
                      <TableRow>
                        <TableHead>{t("certificates.domains.detailTableTime")}</TableHead>
                        <TableHead>{t("certificates.domains.fieldDomain")}</TableHead>
                        <TableHead>{t("certificates.domains.detailTableStatus")}</TableHead>
                        <TableHead>{t("certificates.domains.detailTableAvailability")}</TableHead>
                        <TableHead>{t("certificates.domains.detailFieldResolvedIps")}</TableHead>
                        <TableHead>{t("certificates.domains.detailFieldExpiryDays")}</TableHead>
                        <TableHead>{t("certificates.domains.detailTableError")}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredHistoryItems.map((item) => {
                        const itemStatusMeta = getLatestCheckStatusMeta(item, t)

                        return (
                          <TableRow key={item.id}>
                            <TableCell className="text-muted-foreground">
                              {formatCertificateDateTime(item.checked_at, locale)}
                            </TableCell>
                            <TableCell className="font-medium">{item.domain}</TableCell>
                            <TableCell>
                              <Badge className={itemStatusMeta.className}>
                                {item.is_valid && item.chain_valid
                                  ? t("certificates.domains.historyStatusValid")
                                  : t("certificates.domains.historyStatusInvalid")}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Badge className={item.chain_valid ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-600" : "border-red-500/30 bg-red-500/10 text-red-600"}>
                                {item.chain_valid ? "100%" : "0%"}
                              </Badge>
                            </TableCell>
                            <TableCell className="max-w-[220px]">
                              <div className="truncate text-muted-foreground" title={formatList(item.resolved_ips).join(", ")}>
                                {formatList(item.resolved_ips).join(", ") || t("certificates.detail.noIpAddresses")}
                              </div>
                            </TableCell>
                            <TableCell className="text-muted-foreground">
                              {item.days_until_expiry === null
                                ? "-"
                                : item.days_until_expiry >= 0
                                  ? t("certificates.detail.daysRemaining", { days: item.days_until_expiry })
                                  : t("certificates.detail.statusExpired")}
                            </TableCell>
                            <TableCell className="max-w-[280px]">
                              <div className={`truncate ${item.error ? "text-red-600" : "text-muted-foreground"}`} title={item.error || t("certificates.domains.historyNoError")}>
                                {item.error || t("certificates.domains.historyNoError")}
                              </div>
                            </TableCell>
                          </TableRow>
                        )
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="latest">
          <div className="grid gap-6 xl:grid-cols-2">
            <Card className="border-border/60 shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Server className="h-5 w-5" />
                  {t("certificates.domains.detailLatestCheckTitle")}
                </CardTitle>
                <CardDescription>{t("certificates.domains.detailLatestCheckDescription")}</CardDescription>
              </CardHeader>
              <CardContent>
                {!latestCheck ? (
                  <p className="text-sm text-muted-foreground">{t("certificates.domains.detailLatestCheckEmpty")}</p>
                ) : (
                  <div className="space-y-6">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge className={latestStatusMeta.className}>
                        {latestCheck.is_valid && latestCheck.chain_valid ? t("certificates.domains.historyStatusValid") : t("certificates.domains.historyStatusInvalid")}
                      </Badge>
                      <Badge className={latestCheck.chain_valid ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-600" : "border-red-500/30 bg-red-500/10 text-red-600"}>
                        {latestCheck.chain_valid ? t("certificates.detail.chainValid") : t("certificates.detail.chainInvalid")}
                      </Badge>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                      <TechnicalField label={t("certificates.domains.detailFieldIssuer")} value={latestCheck.issuer || "-"} />
                      <TechnicalField label={t("certificates.domains.detailFieldSubject")} value={latestCheck.subject || "-"} />
                      <TechnicalField label={t("certificates.detail.fieldLastChecked")} value={formatCertificateDateTime(latestCheck.checked_at, locale)} />
                      <TechnicalField label={t("certificates.detail.fieldNotBefore")} value={formatCertificateDateTime(latestCheck.not_before, locale)} />
                      <TechnicalField label={t("certificates.detail.fieldNotAfter")} value={formatCertificateDateTime(latestCheck.not_after, locale)} />
                      <TechnicalField label={t("certificates.domains.detailFieldExpiryDays")} value={latestCheck.days_until_expiry ?? "-"} />
                    </div>

                    <Separator />

                    <div className="grid gap-4 lg:grid-cols-2">
                      <div className="space-y-2">
                        <p className="text-sm font-medium text-muted-foreground">{t("certificates.domains.detailFieldResolvedIps")}</p>
                        {renderListOrFallback(latestResolvedIps, t("certificates.detail.noIpAddresses"))}
                      </div>
                      <div className="space-y-2">
                        <p className="text-sm font-medium text-muted-foreground">{t("certificates.domains.detailFieldSanList")}</p>
                        {renderListOrFallback(latestSanList, t("certificates.domains.noteEmpty"))}
                      </div>
                    </div>

                    <div className="rounded-xl border border-dashed p-4">
                      <div className="flex items-start gap-2">
                        <TriangleAlert className="mt-0.5 h-4 w-4 text-muted-foreground" />
                        <div className="space-y-1">
                          <p className="text-sm font-medium">{t("certificates.detail.chainError")}</p>
                          <p className={`text-sm ${latestCheck.error ? "text-red-600" : "text-muted-foreground"}`}>
                            {latestCheck.error || t("certificates.domains.historyNoError")}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="border-border/60 shadow-sm">
              <CardHeader>
                <CardTitle>{t("certificates.domains.detailOverviewTitle")}</CardTitle>
                <CardDescription>{t("certificates.domains.detailOverviewDescription")}</CardDescription>
              </CardHeader>
              <CardContent>
                {!overviewItem ? (
                  <p className="text-sm text-muted-foreground">{t("certificates.domains.detailOverviewEmpty")}</p>
                ) : (
                  <div className="space-y-6">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge className={overviewItem.check_error ? "border-red-500/30 bg-red-500/10 text-red-600" : "border-emerald-500/30 bg-emerald-500/10 text-emerald-600"}>
                        {overviewItem.check_error ? t("certificates.domains.detailOverviewStatusError") : t("certificates.domains.detailOverviewStatusNormal")}
                      </Badge>
                      {overviewItem.tls_version ? <Badge variant="secondary">{overviewItem.tls_version}</Badge> : null}
                      {overviewItem.public_key_algorithm ? <Badge variant="secondary">{overviewItem.public_key_algorithm}</Badge> : null}
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                      <TechnicalField label={t("certificates.domains.detailOverviewFingerprint")} value={overviewItem.fingerprint_sha256 || "-"} />
                      <TechnicalField label={t("certificates.domains.detailOverviewTlsVersion")} value={overviewItem.tls_version || "-"} />
                      <TechnicalField label={t("certificates.domains.detailOverviewPublicKey")} value={overviewItem.public_key_algorithm || "-"} />
                      <TechnicalField label={t("certificates.domains.detailOverviewPublicKeyBits")} value={overviewItem.public_key_bits ?? "-"} />
                      <TechnicalField label={t("certificates.domains.detailOverviewChainDepth")} value={overviewItem.chain_depth ?? "-"} />
                      <TechnicalField label={t("certificates.domains.detailOverviewWildcard")} value={overviewItem.is_wildcard === null ? "-" : overviewItem.is_wildcard ? t("certificates.domains.statusEnabled") : t("certificates.domains.statusDisabled")} />
                    </div>

                    <Separator />

                    <div className="rounded-xl border border-dashed p-4">
                      <p className="text-sm font-medium">{t("certificates.domains.detailOverviewCheckError")}</p>
                      <p className={`mt-2 text-sm ${overviewItem.check_error ? "text-red-600" : "text-muted-foreground"}`}>
                        {overviewItem.check_error || t("certificates.domains.historyNoError")}
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="certificate">
          <CertificateDetailsSection
            certificate={certificate}
            locale={locale}
            t={t}
            certificateId={certificate?.id || null}
          />
        </TabsContent>
      </Tabs>

      <MonitoringDomainConfigDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        title={t("certificates.domains.detailEditTitle")}
        description={t("certificates.domains.detailEditDescription")}
        domain={domain.domain}
        showDomainReadonly
        port={editPort}
        onPortChange={setEditPort}
        interval={editInterval}
        onIntervalChange={setEditInterval}
        note={editNote}
        onNoteChange={setEditNote}
        enabled={editEnabled}
        onEnabledChange={setEditEnabled}
        enabledStatusLabel={t("certificates.domains.statusEnabled")}
        disabledStatusLabel={t("certificates.domains.statusDisabled")}
        checkAfterSave={checkAfterSave}
        onCheckAfterSaveChange={setCheckAfterSave}
        checkAfterSaveLabel={t("certificates.detail.checkAfterSaveLabel")}
        checkAfterSaveHint={t("certificates.detail.checkAfterSaveHint")}
        submitting={saving}
        onSubmit={handleSaveConfig}
        submitLabel={t("certificates.domains.detailEditSubmit")}
        submittingLabel={t("certificates.domains.detailEditSubmitting")}
        cancelLabel={t("certificates.domains.cancelButton")}
        labels={{
          domain: t("certificates.domains.fieldDomain"),
          port: t("certificates.domains.fieldPort"),
          portPlaceholder: t("certificates.domains.fieldPortPlaceholder"),
          interval: t("certificates.domains.fieldInterval"),
          intervalPlaceholder: t("certificates.domains.fieldIntervalPlaceholder"),
          note: t("certificates.domains.fieldNote"),
          notePlaceholder: t("certificates.domains.fieldNotePlaceholder"),
          monitoringStatus: t("certificates.detail.monitoringFieldStatus"),
        }}
        idPrefix="domain-detail-edit"
      />

      <DomainDeleteDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        deleting={deleting}
        onConfirm={handleDeleteDomain}
        text={{
          title: t("certificates.domains.deleteDialogTitle"),
          description: t("certificates.domains.deleteDialogDescription", {
            domain: domain.domain,
          }),
          cancel: t("certificates.domains.cancelButton"),
          confirm: t("certificates.domains.actionDelete"),
        }}
      />
    </div>
  )
}
