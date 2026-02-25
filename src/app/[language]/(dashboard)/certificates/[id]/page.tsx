"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { api } from "@/lib/api"
import { formatCertificateDateTime } from "@/lib/certificates/formats"
import { CertificateChainInfo, CertificateDetails } from "@/types/api"
import { useAppTranslations } from "@/hooks/use-app-translations"
import { useAppLocale } from "@/hooks/use-app-locale"
import { useCertificateMonitoringConfig } from "@/hooks/use-certificate-monitoring-config"
import { withLocalePrefix } from "@/components/app-locale"
import { MonitoringDomainConfigDialog } from "@/components/pages/certificates/monitoring-domain-config-dialog"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import {
  ArrowLeft,
  Pencil,
  ExternalLink,
  Loader2,
  RefreshCw,
  ShieldAlert,
  ShieldCheck,
  ShieldX,
  Calendar,
  Server,
  Globe,
  Info,
} from "lucide-react"
import { toast, toastApiError } from "@/lib/toast"
type TranslateFn = (path: string, values?: Record<string, string | number>) => string

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
      label: t("certificates.detail.statusUnknown"),
      icon: ShieldX,
    }
  }

  if (daysUntilExpiry < 0) {
    return {
      className: "border-red-500/30 bg-red-500/10 text-red-600",
      label: t("certificates.detail.statusExpired"),
      icon: ShieldAlert,
    }
  }

  if (!certificate.chain_valid) {
    return {
      className: "border-red-500/30 bg-red-500/10 text-red-600",
      label: t("certificates.detail.statusChainInvalid"),
      icon: ShieldAlert,
    }
  }

  if (daysUntilExpiry <= 30) {
    return {
      className: "border-amber-500/30 bg-amber-500/10 text-amber-600",
      label: t("certificates.detail.statusExpiringSoon", { days: daysUntilExpiry }),
      icon: ShieldX,
    }
  }

  return {
    className: "border-emerald-500/30 bg-emerald-500/10 text-emerald-600",
    label: t("certificates.detail.statusHealthy", { days: daysUntilExpiry }),
    icon: ShieldCheck,
  }
}

export default function CertificateDetailPage() {
  const { t, locale } = useAppTranslations("pages")
  const params = useParams()
  const router = useRouter()
  const appLocale = useAppLocale()
  const certificateId = params.id as string

  const [certificate, setCertificate] = useState<CertificateDetails | null>(null)
  const [chainInfo, setChainInfo] = useState<CertificateChainInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const fetchData = async (silent = false) => {
    if (silent) {
      setRefreshing(true)
    } else {
      setLoading(true)
    }

    try {
      const [certData, chainData] = await Promise.all([
        api.getCertificate(certificateId),
        api.getCertificateChain(certificateId),
      ])

      setCertificate(certData)
      setChainInfo(chainData)
      await fetchLinkedDomain(certData.domain)
    } catch (error) {
      toastApiError(error, t("certificates.detail.toastFetchError"))
      router.push(withLocalePrefix("/certificates", appLocale))
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [certificateId])

  const {
    linkedDomain,
    domainLookupLoading,
    fetchLinkedDomain,
    createDomainOpen,
    setCreateDomainOpen,
    editDomainOpen,
    setEditDomainOpen,
    creatingDomain,
    savingDomain,
    editPort,
    setEditPort,
    editInterval,
    setEditInterval,
    editNote,
    setEditNote,
    editEnabled,
    setEditEnabled,
    createCheckAfterSave,
    editCheckAfterSave,
    handleCreateCheckAfterSaveChange,
    handleEditCheckAfterSaveChange,
    handleOpenEditDomain,
    handleOpenCreateDomain,
    handleCreateDomainConfig,
    handleSaveDomainConfig,
  } = useCertificateMonitoringConfig({
    certificateDomain: certificate?.domain ?? null,
    t,
    onRefreshCertificateDetail: () => fetchData(true),
  })

  const handleQuickCheck = () => {
    if (!certificate) return
    const nextParams = new URLSearchParams({
      domain: certificate.domain,
      autoCheck: "1",
    })
    router.push(`${withLocalePrefix("/certificates/domains", appLocale)}?${nextParams.toString()}`)
  }

  if (loading) {
    return (
      <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!certificate) {
    return null
  }

  const statusMeta = getCertificateStatusMeta(certificate, t)
  const StatusIcon = statusMeta.icon
  const daysUntilExpiry = getDaysUntilExpiry(certificate.not_after)

  return (
    <div className="min-w-0 space-y-6 p-4 md:p-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="icon"
            onClick={() => router.push(withLocalePrefix("/certificates", appLocale))}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h2 className="text-2xl font-semibold tracking-tight">{certificate.domain}</h2>
            <p className="text-sm text-muted-foreground">{t("certificates.detail.description")}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => fetchData(true)}
            disabled={refreshing}
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
            {t("certificates.detail.btnRefresh")}
          </Button>
          <Button variant="outline" asChild>
            <a href={`https://${certificate.domain}`} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="mr-2 h-4 w-4" />
              {t("certificates.detail.btnVisit")}
            </a>
          </Button>
        </div>
      </div>

      {/* 状态卡片 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5" />
            {t("certificates.detail.statusTitle")}
          </CardTitle>
          <CardDescription>{t("certificates.detail.statusDescription")}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between p-4 rounded-lg border bg-muted/50">
            <div className="flex items-center gap-3">
              <StatusIcon className={`h-8 w-8 ${statusMeta.className.includes("red") ? "text-red-600" : statusMeta.className.includes("amber") ? "text-amber-600" : "text-emerald-600"}`} />
              <div>
                <p className="font-medium">{statusMeta.label}</p>
                {daysUntilExpiry !== null && daysUntilExpiry > 0 && (
                  <p className="text-sm text-muted-foreground">
                    {t("certificates.detail.daysRemaining", { days: daysUntilExpiry })}
                  </p>
                )}
              </div>
            </div>
            <Badge className={statusMeta.className}>
              {certificate.chain_valid
                ? t("certificates.detail.chainValid")
                : t("certificates.detail.chainInvalid")}
            </Badge>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        {/* 基本信息 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Info className="h-5 w-5" />
              {t("certificates.detail.basicInfoTitle")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">{t("certificates.detail.fieldDomain")}</p>
              <p className="text-sm font-mono">{certificate.domain}</p>
            </div>
            <Separator />
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">{t("certificates.detail.fieldIssuer")}</p>
              <p className="text-sm">{certificate.issuer_cn || "-"}</p>
            </div>
            <Separator />
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">{t("certificates.detail.fieldIssuerOrg")}</p>
              <p className="text-sm">{certificate.issuer_o || "-"}</p>
            </div>
            <Separator />
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">{t("certificates.detail.fieldAltNames")}</p>
              {certificate.subject_alt_names.length > 0 ? (
                <div className="flex flex-wrap gap-1">
                  {certificate.subject_alt_names.map((name, index) => (
                    <Badge key={index} variant="secondary" className="text-xs">
                      {name}
                    </Badge>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">-</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* 有效期信息 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              {t("certificates.detail.validityTitle")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">{t("certificates.detail.fieldNotBefore")}</p>
              <p className="text-sm">{formatCertificateDateTime(certificate.not_before, locale)}</p>
            </div>
            <Separator />
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">{t("certificates.detail.fieldNotAfter")}</p>
              <p className="text-sm">{formatCertificateDateTime(certificate.not_after, locale)}</p>
            </div>
            <Separator />
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">{t("certificates.detail.fieldLastChecked")}</p>
              <p className="text-sm">{formatCertificateDateTime(certificate.last_checked, locale)}</p>
            </div>
          </CardContent>
        </Card>

        {/* IP 地址 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Server className="h-5 w-5" />
              {t("certificates.detail.ipAddressesTitle")}
            </CardTitle>
            <CardDescription>{t("certificates.detail.ipAddressesDescription")}</CardDescription>
          </CardHeader>
          <CardContent>
            {certificate.ip_addresses.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {certificate.ip_addresses.map((ip, index) => (
                  <Badge key={index} variant="outline" className="font-mono">
                    {ip}
                  </Badge>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">{t("certificates.detail.noIpAddresses")}</p>
            )}
          </CardContent>
        </Card>

        {/* 证书链信息 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5" />
              {t("certificates.detail.chainTitle")}
            </CardTitle>
            <CardDescription>{t("certificates.detail.chainDescription")}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {chainInfo ? (
              <>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-muted-foreground">
                    {t("certificates.detail.chainStatus")}
                  </span>
                  <Badge
                    className={chainInfo.chain_valid
                      ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-600"
                      : "border-red-500/30 bg-red-500/10 text-red-600"}
                  >
                    {chainInfo.chain_valid
                      ? t("certificates.detail.chainValid")
                      : t("certificates.detail.chainInvalid")}
                  </Badge>
                </div>
                <Separator />
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">
                    {t("certificates.detail.chainLastChecked")}
                  </p>
                  <p className="text-sm">{formatCertificateDateTime(chainInfo.last_checked, locale)}</p>
                </div>
                {chainInfo.chain_error && (
                  <>
                    <Separator />
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-muted-foreground">
                        {t("certificates.detail.chainError")}
                      </p>
                      <p className="text-sm text-red-600">{chainInfo.chain_error}</p>
                    </div>
                  </>
                )}
              </>
            ) : (
              <p className="text-sm text-muted-foreground">{t("certificates.detail.noChainData")}</p>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t("certificates.detail.monitoringTitle")}</CardTitle>
          <CardDescription>{t("certificates.detail.monitoringDescription")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {domainLookupLoading ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              {t("certificates.detail.monitoringLoading")}
            </div>
          ) : linkedDomain ? (
            <>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">{t("certificates.domains.fieldDomain")}</p>
                  <p className="text-sm font-mono">{linkedDomain.domain}</p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">{t("certificates.detail.monitoringFieldStatus")}</p>
                  <Badge
                    className={linkedDomain.enabled
                      ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-600"
                      : "border-muted bg-muted text-muted-foreground"}
                  >
                    {linkedDomain.enabled
                      ? t("certificates.domains.statusEnabled")
                      : t("certificates.detail.monitoringStatusDisabled")}
                  </Badge>
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">{t("certificates.domains.fieldPort")}</p>
                  <p className="text-sm">{linkedDomain.port}</p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">{t("certificates.domains.fieldInterval")}</p>
                  <p className="text-sm">
                    {linkedDomain.check_interval_secs === null
                      ? t("certificates.domains.intervalDefault")
                      : t("certificates.domains.intervalSeconds", { seconds: linkedDomain.check_interval_secs })}
                  </p>
                </div>
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">{t("certificates.domains.fieldNote")}</p>
                <p className="text-sm">{linkedDomain.note || t("certificates.domains.noteEmpty")}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button variant="outline" onClick={handleOpenEditDomain}>
                  <Pencil className="mr-2 h-4 w-4" />
                  {t("certificates.detail.btnEditMonitoring")}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => fetchLinkedDomain(linkedDomain.domain)}
                  disabled={domainLookupLoading}
                >
                  <RefreshCw className={`mr-2 h-4 w-4 ${domainLookupLoading ? "animate-spin" : ""}`} />
                  {t("certificates.detail.btnRefreshMonitoring")}
                </Button>
              </div>
            </>
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">{t("certificates.detail.monitoringNotFound")}</p>
              <Button
                variant="outline"
                onClick={() => {
                  handleOpenCreateDomain()
                }}
              >
                {t("certificates.detail.btnCreateMonitoring")}
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  const nextParams = new URLSearchParams({ domain: certificate.domain })
                  router.push(`${withLocalePrefix("/certificates/domains", appLocale)}?${nextParams.toString()}`)
                }}
              >
                {t("certificates.detail.btnGoToMonitoring")}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 操作按钮 */}
      <Card>
        <CardHeader>
          <CardTitle>{t("certificates.detail.actionsTitle")}</CardTitle>
          <CardDescription>{t("certificates.detail.actionsDescription")}</CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={handleQuickCheck}>
            <RefreshCw className="mr-2 h-4 w-4" />
            {t("certificates.detail.btnQuickCheck")}
          </Button>
        </CardContent>
      </Card>

      <MonitoringDomainConfigDialog
        open={editDomainOpen}
        onOpenChange={setEditDomainOpen}
        title={t("certificates.detail.editMonitoringDialogTitle")}
        description={t("certificates.detail.editMonitoringDialogDescription")}
        port={editPort}
        onPortChange={setEditPort}
        interval={editInterval}
        onIntervalChange={setEditInterval}
        note={editNote}
        onNoteChange={setEditNote}
        enabled={editEnabled}
        onEnabledChange={setEditEnabled}
        enabledStatusLabel={t("certificates.domains.statusEnabled")}
        disabledStatusLabel={t("certificates.detail.monitoringStatusDisabled")}
        checkAfterSave={editCheckAfterSave}
        onCheckAfterSaveChange={handleEditCheckAfterSaveChange}
        checkAfterSaveLabel={t("certificates.detail.checkAfterSaveLabel")}
        checkAfterSaveHint={t("certificates.detail.checkAfterSaveHint")}
        submitting={savingDomain}
        onSubmit={handleSaveDomainConfig}
        submitLabel={t("certificates.detail.btnSaveMonitoring")}
        submittingLabel={t("certificates.detail.btnSavingMonitoring")}
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
        idPrefix="cert-domain-edit"
      />

      <MonitoringDomainConfigDialog
        open={createDomainOpen}
        onOpenChange={setCreateDomainOpen}
        title={t("certificates.detail.createMonitoringDialogTitle")}
        description={t("certificates.detail.createMonitoringDialogDescription")}
        domain={certificate.domain}
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
        disabledStatusLabel={t("certificates.detail.monitoringStatusDisabled")}
        checkAfterSave={createCheckAfterSave}
        onCheckAfterSaveChange={handleCreateCheckAfterSaveChange}
        checkAfterSaveLabel={t("certificates.detail.checkAfterSaveLabel")}
        checkAfterSaveHint={t("certificates.detail.checkAfterCreateHint")}
        submitting={creatingDomain}
        onSubmit={handleCreateDomainConfig}
        submitLabel={t("certificates.detail.btnCreateMonitoring")}
        submittingLabel={t("certificates.detail.btnCreatingMonitoring")}
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
        idPrefix="cert-domain-create"
      />
    </div>
  )
}
