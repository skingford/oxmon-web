"use client"

import Link from "next/link"
import { useCallback, useEffect, useMemo, useState } from "react"
import { useParams } from "next/navigation"
import { api, getApiErrorMessage } from "@/lib/api"
import { withLocalePrefix } from "@/components/app-locale"
import {
  useAppTranslations,
  type AppNamespaceTranslator,
} from "@/hooks/use-app-translations"
import { AlertEventResponse } from "@/types/api"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { ArrowLeft, CheckCheck, CheckCircle, Loader2 } from "lucide-react"
import { toast } from "sonner"

function getSeverityBadgeClass(severity: string) {
  const normalized = severity.toLowerCase()

  if (normalized === "critical") {
    return "border-red-500/30 bg-red-500/10 text-red-600"
  }

  if (normalized === "warning") {
    return "border-amber-500/30 bg-amber-500/10 text-amber-600"
  }

  if (normalized === "info") {
    return "border-blue-500/30 bg-blue-500/10 text-blue-600"
  }

  return "border-muted bg-muted text-muted-foreground"
}

function getSeverityLabel(
  severity: string,
  t: AppNamespaceTranslator<"alerts">
) {
  const normalized = severity.toLowerCase()

  if (normalized === "critical") {
    return t("severity.critical")
  }

  if (normalized === "warning") {
    return t("severity.warning")
  }

  if (normalized === "info") {
    return t("severity.info")
  }

  return severity
}

function formatFullTimestamp(timestamp: string, locale: "zh" | "en") {
  try {
    const date = new Date(timestamp)
    return date.toLocaleString(locale === "zh" ? "zh-CN" : "en-US", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    })
  } catch {
    return timestamp
  }
}

async function findAlertById(id: string) {
  const limit = 200
  let offset = 0
  const maxPages = 25

  for (let i = 0; i < maxPages; i++) {
    const page = await api.getActiveAlerts({ limit, offset })
    const matched = page.find((item) => item.id === id)

    if (matched) {
      return matched
    }

    if (page.length < limit) {
      break
    }

    offset += limit
  }

  offset = 0
  const nowIso = new Date().toISOString()

  for (let i = 0; i < maxPages; i++) {
    const page = await api.getAlertHistory({
      limit,
      offset,
      timestamp__gte: "1970-01-01T00:00:00Z",
      timestamp__lte: nowIso,
    })
    const matched = page.find((item) => item.id === id)

    if (matched) {
      return matched
    }

    if (page.length < limit) {
      break
    }

    offset += limit
  }

  return null
}

export default function AlertDetailPage() {
  const { t, locale } = useAppTranslations("alerts")
  const params = useParams<{ id: string }>()
  const alertId = typeof params.id === "string" ? params.id : ""

  const [loading, setLoading] = useState(true)
  const [actionInProgress, setActionInProgress] = useState<"ack" | "resolve" | null>(null)
  const [alertDetail, setAlertDetail] = useState<AlertEventResponse | null>(null)

  const fetchAlert = useCallback(async () => {
    if (!alertId) {
      setLoading(false)
      return
    }

    setLoading(true)

    try {
      const matched = await findAlertById(alertId)
      setAlertDetail(matched)
    } catch (error) {
      toast.error(getApiErrorMessage(error, t("active.detailFetchError")))
    } finally {
      setLoading(false)
    }
  }, [alertId, t])

  useEffect(() => {
    fetchAlert()
  }, [fetchAlert])

  const canAcknowledge = useMemo(() => {
    if (!alertDetail) {
      return false
    }

    return alertDetail.status < 2
  }, [alertDetail])

  const canResolve = useMemo(() => {
    if (!alertDetail) {
      return false
    }

    return alertDetail.status !== 3
  }, [alertDetail])

  const handleAcknowledge = async () => {
    if (!alertDetail) {
      return
    }

    setActionInProgress("ack")

    try {
      await api.acknowledgeAlert(alertDetail.id)
      toast.success(t("active.toastAcknowledged"))
      await fetchAlert()
    } catch (error) {
      toast.error(getApiErrorMessage(error, t("active.toastAckError")))
    } finally {
      setActionInProgress(null)
    }
  }

  const handleResolve = async () => {
    if (!alertDetail) {
      return
    }

    setActionInProgress("resolve")

    try {
      await api.resolveAlert(alertDetail.id)
      toast.success(t("active.toastResolved"))
      await fetchAlert()
    } catch (error) {
      toast.error(getApiErrorMessage(error, t("active.toastResolveError")))
    } finally {
      setActionInProgress(null)
    }
  }

  if (loading) {
    return (
      <Card className="glass-card">
        <CardContent className="flex min-h-[220px] items-center justify-center text-muted-foreground">
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          {t("active.detailLoading")}
        </CardContent>
      </Card>
    )
  }

  if (!alertDetail) {
    return (
      <Card className="glass-card">
        <CardHeader>
          <CardTitle>{t("active.detailNotFoundTitle")}</CardTitle>
          <CardDescription>
            {t("active.detailNotFoundDescription", { id: alertId || "-" })}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild variant="outline">
            <Link href={withLocalePrefix("/alerts", locale)}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              {t("active.detailBackToList")}
            </Link>
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <h2 className="text-2xl font-bold tracking-tight">{t("active.alertDetails")}</h2>
          <p className="text-sm text-muted-foreground">{t("active.detailDialogDescription")}</p>
        </div>
        <Button asChild variant="outline">
          <Link href={withLocalePrefix("/alerts", locale)}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            {t("active.detailBackToList")}
          </Link>
        </Button>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button onClick={handleAcknowledge} disabled={!canAcknowledge || actionInProgress !== null}>
          {actionInProgress === "ack" ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle className="mr-2 h-4 w-4" />}
          {t("active.btnAcknowledge")}
        </Button>
        <Button variant="outline" onClick={handleResolve} disabled={!canResolve || actionInProgress !== null}>
          {actionInProgress === "resolve" ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCheck className="mr-2 h-4 w-4" />}
          {t("active.btnResolve")}
        </Button>
      </div>

      <Card className="glass-card">
        <CardContent className="space-y-4 py-6">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">{t("active.colSeverity")}</p>
              <Badge className={getSeverityBadgeClass(alertDetail.severity)}>
                {getSeverityLabel(alertDetail.severity, t)}
              </Badge>
            </div>
            <div className="space-y-1 text-right">
              <p className="text-sm font-medium text-muted-foreground">{t("active.ruleIdLabel")}</p>
              <p className="font-mono text-sm">{alertDetail.rule_id}</p>
            </div>
          </div>

          <Separator />

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">{t("active.colAgent")}</p>
              <p className="font-mono text-sm">{alertDetail.agent_id}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">{t("active.colMetric")}</p>
              <p className="text-sm">{alertDetail.metric_name}</p>
            </div>
          </div>

          <div className="space-y-1">
            <p className="text-sm font-medium text-muted-foreground">{t("active.colMessage")}</p>
            <p className="text-sm">{alertDetail.message}</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">{t("active.colValue")}</p>
              <p className="text-2xl font-bold">{alertDetail.value.toFixed(2)}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">{t("active.colThreshold")}</p>
              <p className="text-2xl font-bold text-muted-foreground">{alertDetail.threshold}</p>
            </div>
          </div>

          <Separator />

          <div className="space-y-2">
            <p className="text-sm font-medium">{t("active.timeline")}</p>
            <div className="space-y-2 border-l-2 border-muted pl-4">
              <div className="pb-2">
                <p className="text-xs text-muted-foreground">{t("active.createdAt")}</p>
                <p className="text-sm font-medium">{formatFullTimestamp(alertDetail.timestamp, locale)}</p>
              </div>
              {alertDetail.acknowledged_at ? (
                <div className="pb-2">
                  <p className="text-xs text-muted-foreground">{t("active.acknowledgedAt")}</p>
                  <p className="text-sm font-medium">{formatFullTimestamp(alertDetail.acknowledged_at, locale)}</p>
                </div>
              ) : null}
              {alertDetail.resolved_at ? (
                <div className="pb-2">
                  <p className="text-xs text-muted-foreground">{t("active.resolvedAt")}</p>
                  <p className="text-sm font-medium">{formatFullTimestamp(alertDetail.resolved_at, locale)}</p>
                </div>
              ) : null}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
