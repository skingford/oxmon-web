"use client"

import Link from "next/link"
import { useCallback, useEffect, useMemo, useState } from "react"
import { useParams } from "next/navigation"
import { api, ApiRequestError } from "@/lib/api"
import { withLocalePrefix } from "@/components/app-locale"
import {
  useAppTranslations,
} from "@/hooks/use-app-translations"
import { useRefreshState } from "@/hooks/use-refresh-state"
import { AlertEventResponse } from "@/types/api"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { ArrowLeft, CheckCheck, CheckCircle, Loader2, RefreshCw } from "lucide-react"
import { toast } from "@/lib/toast"
import { formatDateTimeByLocale } from "@/lib/date-time"
import { getMetricDisplayName } from "@/components/pages/metrics/metrics-utils"
import { executeAlertRequest } from "@/components/alerts/alert-request-utils"
import {
  getAlertSeverityBadgeClass,
  getAlertSeverityLabel,
} from "@/components/alerts/alert-severity-utils"
import {
  invalidateAlertDisplayMetadataCache,
  useAlertDisplayMetadata,
} from "@/hooks/use-alert-display-metadata"

async function findAlertById(id: string) {
  try {
    const historyById = await api.getAlertHistoryById(id)
    if (historyById) {
      return historyById
    }
  } catch (error) {
    if (!(error instanceof ApiRequestError && error.status === 404)) {
      throw error
    }
  }

  const limit = 200
  let offset = 0
  const maxPages = 25

  for (let i = 0; i < maxPages; i++) {
    const page = await api.getActiveAlerts({ limit, offset })
    const matched = page.items.find((item) => item.id === id)

    if (matched) {
      return matched
    }

    if (offset + page.items.length >= page.total || page.items.length < limit) {
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
    const matched = page.items.find((item) => item.id === id)

    if (matched) {
      return matched
    }

    if (offset + page.items.length >= page.total || page.items.length < limit) {
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

  const { loading, refreshing, runWithRefresh, setLoading } = useRefreshState()
  const [actionInProgress, setActionInProgress] = useState<"ack" | "resolve" | null>(null)
  const [alertDetail, setAlertDetail] = useState<AlertEventResponse | null>(null)
  const [metadataRefreshKey, setMetadataRefreshKey] = useState(0)
  const { sourceDisplayNameMap, metricNameLabelMap } = useAlertDisplayMetadata(locale, {
    refreshKey: metadataRefreshKey,
  })

  const fetchAlert = useCallback(async (options?: { silent?: boolean }) => {
    if (!alertId) {
      setLoading(false)
      return
    }

    await runWithRefresh(async () => {
      await executeAlertRequest(async () => {
        const matched = await findAlertById(alertId)
        setAlertDetail(matched)
      }, t("active.detailFetchError"))
    }, options)
  }, [alertId, runWithRefresh, setLoading, t])

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

  const sourceName = useMemo(() => {
    if (!alertDetail) {
      return "-"
    }

    return sourceDisplayNameMap[alertDetail.agent_id]?.trim() || alertDetail.agent_id
  }, [alertDetail, sourceDisplayNameMap])

  const metricDisplayName = useMemo(() => {
    if (!alertDetail) {
      return "-"
    }

    return getMetricDisplayName(alertDetail.metric_name, metricNameLabelMap)
  }, [alertDetail, metricNameLabelMap])

  const handleAcknowledge = async () => {
    if (!alertDetail) {
      return
    }

    setActionInProgress("ack")
    const ok = await executeAlertRequest(async () => {
      await api.acknowledgeAlert(alertDetail.id)
      toast.success(t("active.toastAcknowledged"))
      await fetchAlert({ silent: true })
    }, t("active.toastAckError"))
    setActionInProgress(null)
    if (!ok) {
      return
    }
  }

  const handleResolve = async () => {
    if (!alertDetail) {
      return
    }

    setActionInProgress("resolve")
    const ok = await executeAlertRequest(async () => {
      await api.resolveAlert(alertDetail.id)
      toast.success(t("active.toastResolved"))
      await fetchAlert({ silent: true })
    }, t("active.toastResolveError"))
    setActionInProgress(null)
    if (!ok) {
      return
    }
  }

  const handleRefresh = useCallback(async () => {
    invalidateAlertDisplayMetadataCache()
    setMetadataRefreshKey((prev) => prev + 1)
    await fetchAlert({ silent: true })
  }, [fetchAlert])

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
        <Button variant="outline" onClick={handleRefresh} disabled={loading || refreshing || actionInProgress !== null}>
          <RefreshCw className={`mr-2 h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
          {t("active.detailRefreshButton")}
        </Button>
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
                <Badge className={getAlertSeverityBadgeClass(alertDetail.severity)}>
                  {getAlertSeverityLabel(alertDetail.severity, t)}
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
              <div className="space-y-0.5">
                <p className="text-sm">{sourceName}</p>
                {sourceName !== alertDetail.agent_id ? (
                  <p className="font-mono text-xs text-muted-foreground">{alertDetail.agent_id}</p>
                ) : null}
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">{t("active.colMetric")}</p>
              <p className="text-sm">{metricDisplayName}</p>
              {metricDisplayName !== alertDetail.metric_name ? (
                <p className="font-mono text-xs text-muted-foreground">{alertDetail.metric_name}</p>
              ) : null}
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
                <p className="text-sm font-medium">
                  {formatDateTimeByLocale(alertDetail.timestamp, locale, alertDetail.timestamp, {
                    year: "numeric",
                    month: "2-digit",
                    day: "2-digit",
                    hour: "2-digit",
                    minute: "2-digit",
                    second: "2-digit",
                  })}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
