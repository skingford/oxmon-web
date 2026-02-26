"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useParams } from "next/navigation"
import { api } from "@/lib/api"
import type { AIReportRow } from "@/types/api"
import { toastApiError } from "@/lib/toast"
import { useAppTranslations } from "@/hooks/use-app-translations"
import { useAppLocale } from "@/hooks/use-app-locale"
import { withLocalePrefix } from "@/components/app-locale"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Loader2, RefreshCw } from "lucide-react"

function formatDateTime(value?: string | null) {
  if (!value) return "-"
  const d = new Date(value)
  return Number.isNaN(d.getTime()) ? value : d.toLocaleString()
}

function MetaItem({ label, value, mono = false }: { label: string; value: string | number; mono?: boolean }) {
  return (
    <div className="space-y-1 rounded-md border p-3">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className={mono ? "font-mono text-sm break-all" : "text-sm break-words"}>{String(value)}</div>
    </div>
  )
}

export default function AIReportDetailPage() {
  const { t } = useAppTranslations("ai")
  const locale = useAppLocale()
  const params = useParams<{ id: string }>()
  const id = String(params?.id || "")
  const [report, setReport] = useState<AIReportRow | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchDetail = async () => {
    if (!id) return
    setLoading(true)
    try {
      setReport(await api.getAIReportById(id))
    } catch (error) {
      setReport(null)
      toastApiError(error, t("reports.detailToastFetchError"))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void fetchDetail()
  }, [id])

  if (loading && !report) {
    return (
      <div className="flex h-[calc(100vh-4rem)] items-center justify-center gap-2 text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin" />
        <span>{t("reports.detailLoading")}</span>
      </div>
    )
  }

  if (!report) {
    return (
      <div className="min-w-0 space-y-6 p-4 md:p-8">
        <Card>
          <CardHeader>
            <CardTitle>{t("reports.detailNotFound")}</CardTitle>
            <CardDescription>ID: {id || "-"}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline">
              <Link href={withLocalePrefix("/ai/reports", locale)}>{t("reports.detailBack")}</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-w-0 space-y-6 p-4 md:p-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">{t("reports.detailTitle")}</h2>
          <p className="text-sm text-muted-foreground">{t("reports.detailDescription")}</p>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline">
            <Link href={withLocalePrefix("/ai/reports", locale)}>{t("reports.detailBack")}</Link>
          </Button>
          <Button type="button" variant="outline" onClick={() => void fetchDetail()} disabled={loading}>
            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            {t("reports.detailRefresh")}
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t("reports.detailSectionMeta")}</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          <MetaItem label={t("reports.detailFieldId")} value={report.id} mono />
          <MetaItem label={t("reports.detailFieldDate")} value={report.report_date} />
          <MetaItem label={t("reports.detailFieldAccountId")} value={report.ai_account_id} mono />
          <MetaItem label={t("reports.detailFieldProvider")} value={report.ai_provider} />
          <MetaItem label={t("reports.detailFieldModel")} value={report.ai_model} />
          <div className="space-y-1 rounded-md border p-3">
            <div className="text-xs text-muted-foreground">{t("reports.detailFieldRisk")}</div>
            <div className="text-sm">
              <Badge variant="outline">{report.risk_level}</Badge>
            </div>
          </div>
          <MetaItem label={t("reports.detailFieldTotalAgents")} value={report.total_agents} />
          <MetaItem
            label={t("reports.detailFieldNotified")}
            value={report.notified ? t("reports.notifiedYes") : t("reports.notifiedNo")}
          />
          <MetaItem label={t("reports.detailFieldCreatedAt")} value={formatDateTime(report.created_at)} />
          <MetaItem label={t("reports.detailFieldUpdatedAt")} value={formatDateTime(report.updated_at)} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("reports.detailSectionAnalysis")}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="whitespace-pre-wrap rounded-md border p-4 text-sm leading-6">
            {report.ai_analysis || "-"}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("reports.detailSectionHtml")}</CardTitle>
        </CardHeader>
        <CardContent>
          <iframe
            title={`ai-report-${report.id}`}
            srcDoc={report.html_content || "<html><body></body></html>"}
            className="h-[520px] w-full rounded-md border bg-white"
            sandbox="allow-same-origin"
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("reports.detailSectionRawMetrics")}</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            readOnly
            value={report.raw_metrics_json || ""}
            className="min-h-72 font-mono text-xs"
          />
        </CardContent>
      </Card>
    </div>
  )
}
