"use client"

import { useCallback } from "react"
import { AlertCircle, CheckCircle2, ChevronDown, Copy, FileSearch, Loader2, RefreshCw } from "lucide-react"
import type { AppNamespaceTranslator } from "@/hooks/use-app-translations"
import type { CloudAccountResponse, DiagnoseResponse, DiagnoseTraceResponse } from "@/types/api"
import { formatDateTimeByLocale } from "@/lib/date-time"
import { toast, toastCopied } from "@/lib/toast"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Separator } from "@/components/ui/separator"

type CloudAccountDiagnoseDialogProps = {
  open: boolean
  loading: boolean
  locale: "zh" | "en"
  account: CloudAccountResponse | null
  result: DiagnoseResponse | null
  errorMessage: string | null
  onOpenChange: (open: boolean) => void
  onRefresh: () => void
  onCopyCurl: () => void | Promise<void>
  t: AppNamespaceTranslator<"pages">
}

function getTraceStatusClassName(status: number) {
  if (status >= 500) {
    return "border-red-200 bg-red-50 text-red-700"
  }

  if (status >= 400) {
    return "border-amber-200 bg-amber-50 text-amber-700"
  }

  return "border-emerald-200 bg-emerald-50 text-emerald-700"
}

function getSummaryBadge(result: DiagnoseResponse | null, t: AppNamespaceTranslator<"pages">) {
  if (!result) {
    return null
  }

  return result.success ? (
    <Badge className="border-emerald-500/30 bg-emerald-500/10 text-emerald-700">
      <CheckCircle2 className="mr-1 h-3.5 w-3.5" />
      {t("cloud.accounts.diagnoseStatusSuccess")}
    </Badge>
  ) : (
    <Badge variant="destructive" className="border-red-500/30 bg-red-500/10 text-red-700">
      <AlertCircle className="mr-1 h-3.5 w-3.5" />
      {t("cloud.accounts.diagnoseStatusFailed")}
    </Badge>
  )
}

function HeaderList({ entries }: { entries: Array<[string, string]> }) {
  if (entries.length === 0) {
    return <p className="text-xs text-muted-foreground">-</p>
  }

  return (
    <div className="space-y-1 rounded-md border bg-muted/20 p-3">
      {entries.map(([key, value], index) => (
        <div key={`${key}-${index}`} className="grid gap-1 text-xs md:grid-cols-[180px_minmax(0,1fr)]">
          <span className="font-mono text-muted-foreground">{key}</span>
          <span className="break-all font-mono">{value}</span>
        </div>
      ))}
    </div>
  )
}

function TraceBlock({
  title,
  value,
}: {
  title: string
  value: string | null | undefined
}) {
  return (
    <div className="space-y-2">
      <p className="text-sm font-medium">{title}</p>
      <pre className="max-h-72 overflow-auto rounded-md border bg-muted/20 p-3 font-mono text-xs whitespace-pre-wrap break-all">
        {value?.trim() || "-"}
      </pre>
    </div>
  )
}

function TraceCard({
  trace,
  index,
  t,
}: {
  trace: DiagnoseTraceResponse
  index: number
  t: AppNamespaceTranslator<"pages">
}) {
  return (
    <Collapsible>
      <div className="rounded-xl border bg-card">
        <CollapsibleTrigger className="w-full">
          <div className="flex w-full flex-wrap items-center gap-3 p-4 text-left">
            <Badge variant="outline" className="font-mono">
              {trace.method}
            </Badge>
            <div className="min-w-0 flex-1 space-y-1">
              <p className="text-sm font-medium">{t("cloud.accounts.diagnoseTraceTitle", { index: index + 1 })}</p>
              <p className="truncate font-mono text-xs text-muted-foreground">{trace.url}</p>
            </div>
            <Badge variant="outline" className={getTraceStatusClassName(trace.response_status)}>
              HTTP {trace.response_status}
            </Badge>
            <Badge variant="secondary">{t("cloud.accounts.diagnoseTraceDuration", { duration: trace.duration_ms })}</Badge>
            <ChevronDown className="h-4 w-4 text-muted-foreground transition-transform data-[state=open]:rotate-180" />
          </div>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <Separator />
          <div className="space-y-5 p-4">
            <div className="grid gap-3 md:grid-cols-2">
              <div className="space-y-2">
                <p className="text-sm font-medium">{t("cloud.accounts.diagnoseRequestHeaders")}</p>
                <HeaderList entries={trace.request_headers} />
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium">{t("cloud.accounts.diagnoseResponseHeaders")}</p>
                <HeaderList entries={trace.response_headers} />
              </div>
            </div>

            <div className="grid gap-5 xl:grid-cols-2">
              <TraceBlock title={t("cloud.accounts.diagnoseRequestBody")} value={trace.request_body} />
              <TraceBlock title={t("cloud.accounts.diagnoseResponseBody")} value={trace.response_body} />
            </div>

            <div className="grid gap-5 xl:grid-cols-2">
              <TraceBlock title={t("cloud.accounts.diagnoseCanonicalRequest")} value={trace.canonical_request} />
              <TraceBlock title={t("cloud.accounts.diagnoseStringToSign")} value={trace.string_to_sign} />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <Card className="border-dashed">
                <CardHeader className="pb-2">
                  <CardDescription>{t("cloud.accounts.diagnoseSignAlgorithm")}</CardDescription>
                  <CardTitle className="text-base font-mono">{trace.sign_algorithm}</CardTitle>
                </CardHeader>
              </Card>
              <Card className="border-dashed">
                <CardHeader className="pb-2">
                  <CardDescription>{t("cloud.accounts.diagnoseCredentialScope")}</CardDescription>
                  <CardTitle className="text-base font-mono">{trace.credential_scope}</CardTitle>
                </CardHeader>
              </Card>
            </div>
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  )
}

export function CloudAccountDiagnoseDialog({
  open,
  loading,
  locale,
  account,
  result,
  errorMessage,
  onOpenChange,
  onRefresh,
  onCopyCurl,
  t,
}: CloudAccountDiagnoseDialogProps) {
  const handleCopyRaw = useCallback(async () => {
    if (!result) {
      return
    }

    try {
      await navigator.clipboard.writeText(JSON.stringify(result, null, 2))
      toastCopied(t("cloud.accounts.toastCopyDiagnoseResultSuccess"))
    } catch {
      toast.error(t("cloud.accounts.toastCopyDiagnoseResultError"))
    }
  }, [result, t])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-5xl">
        <DialogHeader>
          <DialogTitle>
            {t("cloud.accounts.diagnoseDialogTitle", {
              name: account?.display_name || account?.account_name || "-",
            })}
          </DialogTitle>
          <DialogDescription>{t("cloud.accounts.diagnoseDialogDescription")}</DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex min-h-56 flex-col items-center justify-center gap-3 text-muted-foreground">
            <Loader2 className="h-6 w-6 animate-spin" />
            <p>{t("cloud.accounts.diagnoseLoading")}</p>
          </div>
        ) : errorMessage ? (
          <Card className="border-red-200 bg-red-50/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base text-red-700">
                <AlertCircle className="h-4 w-4" />
                {t("cloud.accounts.diagnoseErrorTitle")}
              </CardTitle>
              <CardDescription className="text-red-700/80">{errorMessage}</CardDescription>
            </CardHeader>
            <CardContent>
              <Button type="button" variant="outline" onClick={onRefresh}>
                <RefreshCw className="mr-2 h-4 w-4" />
                {t("cloud.accounts.diagnoseRetry")}
              </Button>
            </CardContent>
          </Card>
        ) : result ? (
          <div className="space-y-6">
            <div className="flex flex-wrap items-center gap-3">
              {getSummaryBadge(result, t)}
              <Badge variant="secondary">{result.provider}</Badge>
              <Badge variant="outline">{result.account_name}</Badge>
              <span className="text-sm text-muted-foreground">
                {t("cloud.accounts.diagnoseDiagnosedAt", {
                  time: formatDateTimeByLocale(result.diagnosed_at, locale),
                })}
              </span>
            </div>

            {result.error_message ? (
              <Card className="border-amber-200 bg-amber-50/60">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base text-amber-700">{t("cloud.accounts.diagnoseErrorMessageTitle")}</CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-amber-700">{result.error_message}</CardContent>
              </Card>
            ) : null}

            <Card>
              <CardHeader>
                <CardTitle>{t("cloud.accounts.diagnoseSummaryTitle")}</CardTitle>
                <CardDescription>{t("cloud.accounts.diagnoseSummaryDescription")}</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-4 md:grid-cols-3">
                <div className="rounded-lg border bg-muted/20 p-4">
                  <p className="text-sm text-muted-foreground">{t("cloud.accounts.diagnoseSummaryProvider")}</p>
                  <p className="mt-1 font-medium">{result.provider}</p>
                </div>
                <div className="rounded-lg border bg-muted/20 p-4">
                  <p className="text-sm text-muted-foreground">{t("cloud.accounts.diagnoseSummaryAccount")}</p>
                  <p className="mt-1 font-medium">{result.account_name}</p>
                </div>
                <div className="rounded-lg border bg-muted/20 p-4">
                  <p className="text-sm text-muted-foreground">{t("cloud.accounts.diagnoseSummaryTraceCount")}</p>
                  <p className="mt-1 font-medium">{result.traces.length}</p>
                </div>
              </CardContent>
            </Card>

            <div className="space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h3 className="text-lg font-semibold">{t("cloud.accounts.diagnoseTraceListTitle")}</h3>
                  <p className="text-sm text-muted-foreground">{t("cloud.accounts.diagnoseTraceListDescription")}</p>
                </div>
                <Button type="button" variant="outline" onClick={handleCopyRaw}>
                  <Copy className="mr-2 h-4 w-4" />
                  {t("cloud.accounts.diagnoseCopyRaw")}
                </Button>
              </div>

              {result.traces.length === 0 ? (
                <Card className="border-dashed">
                  <CardContent className="flex h-28 items-center justify-center text-sm text-muted-foreground">
                    {t("cloud.accounts.diagnoseTraceEmpty")}
                  </CardContent>
                </Card>
              ) : (
                result.traces.map((trace, index) => (
                  <TraceCard key={`${trace.url}-${index}`} trace={trace} index={index} t={t} />
                ))
              )}
            </div>
          </div>
        ) : (
          <Card className="border-dashed">
            <CardContent className="flex min-h-48 flex-col items-center justify-center gap-3 text-center text-muted-foreground">
              <FileSearch className="h-6 w-6" />
              <p>{t("cloud.accounts.diagnoseEmpty")}</p>
            </CardContent>
          </Card>
        )}

        <DialogFooter className="flex flex-col gap-2 sm:flex-row sm:justify-end">
          <Button type="button" variant="outline" onClick={onCopyCurl}>
            <Copy className="mr-2 h-4 w-4" />
            {t("cloud.accounts.actionCopyDiagnoseCurl")}
          </Button>
          <Button type="button" variant="outline" onClick={onRefresh} disabled={!account}>
            <RefreshCw className="mr-2 h-4 w-4" />
            {t("cloud.accounts.diagnoseRetry")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
