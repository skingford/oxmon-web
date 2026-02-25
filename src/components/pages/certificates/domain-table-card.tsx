"use client"

import { formatCertificateDateTime } from "@/lib/certificates/formats"
import { CertDomain } from "@/types/api"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ServerPaginationControls } from "@/components/ui/server-pagination-controls"
import { Switch } from "@/components/ui/switch"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { History, Loader2, Plus, ShieldCheck, Trash2 } from "lucide-react"

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

type DomainTableCardProps = {
  t: TranslateFn
  locale: "zh" | "en"
  pageLimit: number
  loading: boolean
  domains: CertDomain[]
  pageNumber: number
  canGoPrev: boolean
  canGoNext: boolean
  checkingId: string | null
  updatingId: string | null
  deletingId: string | null
  onOpenCreateDialog: () => void
  onToggleEnabled: (domain: CertDomain, enabled: boolean) => void
  onCheckDomain: (domain: CertDomain) => void
  onOpenHistory: (domain: CertDomain) => void
  onDeleteDomain: (domain: CertDomain) => void
  onPrevPage: () => void
  onNextPage: () => void
}

export function DomainTableCard({
  t,
  locale,
  pageLimit,
  loading,
  domains,
  pageNumber,
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
                <TableHead>{t("certificates.domains.tableColPort")}</TableHead>
                <TableHead>{t("certificates.domains.tableColStatus")}</TableHead>
                <TableHead>{t("certificates.domains.tableColInterval")}</TableHead>
                <TableHead>{t("certificates.domains.tableColLastChecked")}</TableHead>
                <TableHead>{t("certificates.domains.tableColNote")}</TableHead>
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
                  const checking = checkingId === domain.id
                  const updating = updatingId === domain.id
                  const deleting = deletingId === domain.id

                  return (
                    <TableRow key={domain.id} className="hover:bg-muted/40">
                      <TableCell className="font-medium">{domain.domain}</TableCell>
                      <TableCell className="text-muted-foreground">{domain.port}</TableCell>
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
                      <TableCell className="text-muted-foreground">
                        {domain.check_interval_secs
                          ? t("certificates.domains.intervalSeconds", { seconds: domain.check_interval_secs })
                          : t("certificates.domains.intervalDefault")}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {formatCertificateDateTime(domain.last_checked_at, locale)}
                      </TableCell>
                      <TableCell className="max-w-[220px] truncate text-muted-foreground" title={domain.note || ""}>
                        {domain.note || t("certificates.domains.noteEmpty")}
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

        <ServerPaginationControls
          className="mt-4 flex items-center justify-end gap-2"
          pageSize={pageLimit}
          pageIndicatorText={t("certificates.domains.paginationPage", { page: pageNumber })}
          prevLabel={t("certificates.domains.paginationPrev")}
          nextLabel={t("certificates.domains.paginationNext")}
          onPrevPage={onPrevPage}
          onNextPage={onNextPage}
          prevDisabled={!canGoPrev || loading}
          nextDisabled={!canGoNext || loading}
        />
      </CardContent>
    </Card>
  )
}
