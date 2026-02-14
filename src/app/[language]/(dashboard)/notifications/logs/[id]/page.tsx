"use client"

import Link from "next/link"
import { useCallback, useEffect } from "react"
import { useParams } from "next/navigation"
import { api, getApiErrorMessage } from "@/lib/api"
import type { NotificationLogItem } from "@/types/api"
import { withLocalePrefix } from "@/components/app-locale"
import { useAppLocale } from "@/hooks/use-app-locale"
import { useAppTranslations } from "@/hooks/use-app-translations"
import { useRequestState } from "@/hooks/use-request-state"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { JsonTextarea } from "@/components/ui/json-textarea"
import { ArrowLeft, Loader2 } from "lucide-react"
import { toast } from "sonner"

type LogDetailState = {
  item: NotificationLogItem | null
}

function formatJsonValue(value: string | null | undefined) {
  if (!value) {
    return ""
  }

  try {
    return JSON.stringify(JSON.parse(value), null, 2)
  } catch {
    return value
  }
}

export default function NotificationLogDetailPage() {
  const { t, locale } = useAppTranslations("pages")
  const appLocale = useAppLocale()
  const params = useParams<{ id: string }>()
  const logId = typeof params.id === "string" ? params.id : ""

  const {
    data,
    loading,
    execute,
  } = useRequestState<LogDetailState>({ item: null }, { initialLoading: true })

  const fetchLogDetail = useCallback(async () => {
    if (!logId) {
      return
    }

    await execute(
      async () => {
        const item = await api.getNotificationLogById(logId)
        return { item }
      },
      {
        onError: (error) => {
          toast.error(getApiErrorMessage(error, t("notifications.logsDetailToastFetchError")))
        },
      }
    )
  }, [execute, logId, t])

  useEffect(() => {
    fetchLogDetail()
  }, [fetchLogDetail])

  if (loading) {
    return (
      <Card>
        <CardContent className="flex min-h-[220px] items-center justify-center text-muted-foreground">
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          {t("notifications.logsDetailLoading")}
        </CardContent>
      </Card>
    )
  }

  if (!data.item) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{t("notifications.logsDetailNotFoundTitle")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            {t("notifications.logsDetailNotFoundDescription", { id: logId || "-" })}
          </p>
          <Button asChild variant="outline">
            <Link href={withLocalePrefix("/notifications/logs", appLocale)}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              {t("notifications.logsDetailBackToList")}
            </Link>
          </Button>
        </CardContent>
      </Card>
    )
  }

  const item = data.item

  const createdAt = (() => {
    const parsed = Date.parse(item.created_at)
    if (!Number.isFinite(parsed)) {
      return t("notifications.logsUnknownValue")
    }
    return new Date(parsed).toLocaleString(locale === "zh" ? "zh-CN" : "en-US")
  })()

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <h2 className="text-2xl font-bold tracking-tight">{t("notifications.logsDetailTitle")}</h2>
          <p className="text-sm text-muted-foreground">{t("notifications.logsDetailDescription")}</p>
        </div>
        <Button asChild variant="outline">
          <Link href={withLocalePrefix("/notifications/logs", appLocale)}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            {t("notifications.logsDetailBackToList")}
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t("notifications.logsDetailSectionBasic")}</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div>
            <p className="text-xs text-muted-foreground">{t("notifications.logsDetailFieldLogId")}</p>
            <p className="font-mono text-sm break-all">{item.id}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">{t("notifications.logsTableColCreatedAt")}</p>
            <p className="text-sm">{createdAt}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">{t("notifications.logsTableColStatus")}</p>
            <Badge variant="outline">{item.status}</Badge>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">{t("notifications.logsTableColSeverity")}</p>
            <p className="text-sm">{item.severity || t("notifications.logsUnknownValue")}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">{t("notifications.logsTableColChannel")}</p>
            <p className="text-sm">{item.channel_name || t("notifications.logsUnknownValue")}</p>
            <p className="text-xs text-muted-foreground">{item.channel_id}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">{t("notifications.logsTableColRule")}</p>
            <p className="text-sm">{item.rule_name || t("notifications.logsUnknownValue")}</p>
            <p className="text-xs text-muted-foreground">{item.rule_id}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">{t("notifications.logsTableColAgent")}</p>
            <p className="text-sm">{item.agent_id || t("notifications.logsUnknownValue")}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">{t("notifications.logsTableColDuration")}</p>
            <p className="text-sm">{item.duration_ms}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">{t("notifications.logsTableColRetryCount")}</p>
            <p className="text-sm">{item.retry_count}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">{t("notifications.logsTableColHttpStatus")}</p>
            <p className="text-sm">{item.http_status_code ?? t("notifications.logsUnknownValue")}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">{t("notifications.logsTableColRecipients")}</p>
            <p className="text-sm">{item.recipient_count}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">{t("notifications.logsDetailFieldApiMessageId")}</p>
            <p className="font-mono text-sm break-all">{item.api_message_id || t("notifications.logsUnknownValue")}</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("notifications.logsDetailSectionError")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <p className="text-xs text-muted-foreground">{t("notifications.logsTableColError")}</p>
          <p className="text-sm break-words">{item.error_message || t("notifications.logsUnknownValue")}</p>
          <p className="text-xs text-muted-foreground">{t("notifications.logsDetailFieldApiErrorCode")}</p>
          <p className="font-mono text-sm break-all">{item.api_error_code || t("notifications.logsUnknownValue")}</p>
          <p className="text-xs text-muted-foreground">{t("notifications.logsDetailFieldRecipientDetails")}</p>
          <p className="font-mono text-sm break-all">{item.recipient_details || t("notifications.logsUnknownValue")}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("notifications.logsDetailSectionPayload")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground">{t("notifications.logsDetailFieldRequestBody")}</p>
            {item.request_body ? (
              <JsonTextarea
                value={formatJsonValue(item.request_body)}
                onChange={() => {}}
                readOnly
                autoFormat={false}
                showToolbar
                showFormatButton={false}
                showCopyButton
                showInvalidHint={false}
                maxHeightClassName="max-h-[280px]"
              />
            ) : (
              <p className="text-sm text-muted-foreground">{t("notifications.logsUnknownValue")}</p>
            )}
          </div>

          <div className="space-y-2">
            <p className="text-xs text-muted-foreground">{t("notifications.logsDetailFieldResponseBody")}</p>
            {item.response_body ? (
              <JsonTextarea
                value={formatJsonValue(item.response_body)}
                onChange={() => {}}
                readOnly
                autoFormat={false}
                showToolbar
                showFormatButton={false}
                showCopyButton
                showInvalidHint={false}
                maxHeightClassName="max-h-[280px]"
              />
            ) : (
              <p className="text-sm text-muted-foreground">{t("notifications.logsUnknownValue")}</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
