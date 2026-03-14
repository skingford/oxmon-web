"use client"

import Link from "next/link"
import { formatCertificateDateTime } from "@/lib/certificates/formats"
import { DomainOverviewItem } from "@/types/api"
import { withLocalePrefix } from "@/components/app-locale"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { PaginationControls } from "@/components/ui/pagination-controls"
import { Switch } from "@/components/ui/switch"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { buildTranslatedPaginationTextBundle } from "@/lib/pagination-summary"
import { AlertTriangle, Eye, History, Loader2, Plus, ShieldCheck, Trash2 } from "lucide-react"

type TranslateFn = (path: string, values?: Record<string, string | number>) => string

function getDomainStatusMeta(enabled: boolean, t: TranslateFn) {
  if (enabled) {
    return {
      className: "border-emerald-500/30 bg-emerald-500/10 text-emerald-600",
      label: t("certificates.domains.statusEnabled"),
    }
  }

  return {
    className: "border-muted bg-muted text-muted-foreground",
    label: t("certificates.domains.statusDisabled"),
  }
}

function getCertificateHealthMeta(domain: DomainOverviewItem, t: TranslateFn) {
  if (domain.is_valid === null || domain.is_valid === undefined) {
    return {
      className: "border-muted bg-muted text-muted-foreground",
      label: t("certificates.domains.tableHealthUnknown"),
    }
  }

  if (!domain.is_valid || !domain.chain_valid || domain.check_error) {
    return {
      className: "border-red-500/30 bg-red-500/10 text-red-600",
      label: t("certificates.domains.tableHealthFailed"),
    }
  }

  if ((domain.days_until_expiry ?? 9999) <= 30) {
    return {
      className: "border-amber-500/30 bg-amber-500/10 text-amber-600",
      label: t("certificates.domains.tableHealthExpiring"),
    }
  }

  return {
    className: "border-emerald-500/30 bg-emerald-500/10 text-emerald-600",
    label: t("certificates.domains.tableHealthHealthy"),
  }
}

type DomainTableCardProps = {
  t: TranslateFn
  locale: "zh" | "en"
  pageLimit: number
  loading: boolean
  domains: DomainOverviewItem[]
  totalCount: number
  pageNumber: number
  totalPages: number
  rangeStart: number
  rangeEnd: number
  canGoPrev: boolean
  canGoNext: boolean
  checkingId: string | null
  updatingId: string | null
  deletingId: string | null
  onOpenCreateDialog: () => void
  onToggleEnabled: (domain: DomainOverviewItem, enabled: boolean) => void
  onCheckDomain: (domain: DomainOverviewItem) => void
  onOpenHistory: (domain: DomainOverviewItem) => void
  onDeleteDomain: (domain: DomainOverviewItem) => void
  onPrevPage: () => void
  onNextPage: () => void
}

export function DomainTableCard({
  t,
  locale,
  pageLimit,
  loading,
  domains,
  totalCount,
  pageNumber,
  totalPages,
  rangeStart,
  rangeEnd,
  canGoPrev,
  canGoNext,
  checkingId,
  updatingId,
  deletingId,
  onOpenCreateDialog,
  onToggleEnabled,
  onCheckDomain,
  onOpenHistory,
  onDeleteDomain,
  onPrevPage,
  onNextPage,
}: DomainTableCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("certificates.domains.tableTitle")}</CardTitle>
        <CardDescription>{t("certificates.domains.tableDescription", { limit: pageLimit })}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="overflow-hidden rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("certificates.domains.tableColDomain")}</TableHead>
                <TableHead>{t("certificates.domains.tableColStatus")}</TableHead>
                <TableHead>{t("certificates.domains.tableColHealth")}</TableHead>
                <TableHead>{t("certificates.domains.tableColExpiry")}</TableHead>
                <TableHead>{t("certificates.domains.tableColLastChecked")}</TableHead>
                <TableHead>{t("certificates.domains.tableColSnapshot")}</TableHead>
                <TableHead className="text-right">{t("certificates.domains.tableColActions")}</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-40 text-center text-muted-foreground">
                    <Loader2 className="mx-auto mb-2 h-5 w-5 animate-spin" />
                    {t("certificates.domains.tableLoading")}
                  </TableCell>
                </TableRow>
              ) : domains.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-32 text-center text-muted-foreground">
                    <div className="space-y-2">
                      <p>{t("certificates.domains.tableEmpty")}</p>
                      <p className="text-xs text-muted-foreground/80">
                        {t("certificates.domains.tableEmptyHint")}
                      </p>
                      <Button type="button" size="sm" onClick={onOpenCreateDialog}>
                        <Plus className="mr-2 h-4 w-4" />
                        {t("certificates.domains.addButton")}
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                domains.map((domain) => {
                  const statusMeta = getDomainStatusMeta(domain.enabled, t)
                  const healthMeta = getCertificateHealthMeta(domain, t)
                  const checking = checkingId === domain.id
                  const updating = updatingId === domain.id
                  const deleting = deletingId === domain.id

                  return (
                    <TableRow key={domain.id} className="hover:bg-muted/40">
                      <TableCell className="min-w-[260px]">
                        <Link
                          href={withLocalePrefix(`/certificates/domains/${domain.id}`, locale)}
                          className="font-medium transition-colors hover:text-primary"
                        >
                          {domain.domain}
                        </Link>
                        <div className="mt-1 flex flex-wrap gap-2 text-xs text-muted-foreground">
                          <span>{t("certificates.domains.fieldPort")}: {domain.port}</span>
                          <span>
                            {t("certificates.domains.fieldInterval")}:
                            {" "}
                            {domain.check_interval_secs
                              ? t("certificates.domains.intervalSeconds", { seconds: domain.check_interval_secs })
                              : t("certificates.domains.intervalDefault")}
                          </span>
                          {domain.note ? <span title={domain.note}>{domain.note}</span> : null}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Badge className={statusMeta.className}>{statusMeta.label}</Badge>
                          <Switch
                            checked={domain.enabled}
                            disabled={updating}
                            onCheckedChange={(checked) => onToggleEnabled(domain, checked)}
                          />
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={healthMeta.className}>{healthMeta.label}</Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {domain.days_until_expiry === null || domain.days_until_expiry === undefined
                          ? "-"
                          : domain.days_until_expiry >= 0
                            ? t("certificates.detail.daysRemaining", { days: domain.days_until_expiry })
                            : t("certificates.detail.statusExpired")}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {formatCertificateDateTime(domain.checked_at || domain.last_checked_at || null, locale)}
                      </TableCell>
                      <TableCell className="max-w-[260px]">
                        <div className="space-y-1 text-xs text-muted-foreground">
                          <p className="truncate" title={domain.issuer || ""}>
                            {domain.issuer || domain.subject_cn || t("certificates.domains.noteEmpty")}
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {domain.tls_version ? <span>{domain.tls_version}</span> : null}
                            {domain.public_key_algorithm ? <span>{domain.public_key_algorithm}</span> : null}
                          </div>
                          <div className={`flex items-center gap-1 ${domain.check_error ? "text-red-600" : "text-muted-foreground"}`}>
                            {domain.check_error ? <AlertTriangle className="h-3.5 w-3.5" /> : null}
                            <span className="truncate" title={domain.check_error || ""}>
                              {domain.check_error || t("certificates.domains.historyNoError")}
                            </span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={checking}
                            onClick={() => onCheckDomain(domain)}
                          >
                            {checking
                              ? <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              : <ShieldCheck className="mr-2 h-4 w-4" />}
                            {t("certificates.domains.actionCheck")}
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            asChild
                            title={t("certificates.domains.actionDetail")}
                          >
                            <Link href={withLocalePrefix(`/certificates/domains/${domain.id}`, locale)}>
                              <Eye className="h-4 w-4" />
                            </Link>
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => onOpenHistory(domain)}
                            title={t("certificates.domains.actionHistory")}
                          >
                            <History className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="destructive"
                            size="icon"
                            onClick={() => onDeleteDomain(domain)}
                            disabled={deleting}
                            title={t("certificates.domains.actionDelete")}
                          >
                            {deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>
        </div>

        <PaginationControls
          className="mt-4"
          pageSize={pageLimit}
          {...buildTranslatedPaginationTextBundle({
            t,
            summaryKey: "certificates.domains.paginationSummary",
            total: totalCount,
            start: rangeStart,
            end: rangeEnd,
            pageKey: "certificates.domains.paginationPage",
            currentPage: pageNumber,
            totalPages,
            prevKey: "certificates.domains.paginationPrev",
            nextKey: "certificates.domains.paginationNext",
          })}
          onPrevPage={onPrevPage}
          onNextPage={onNextPage}
          prevDisabled={!canGoPrev || loading}
          nextDisabled={!canGoNext || loading}
        />
      </CardContent>
    </Card>
  )
}
