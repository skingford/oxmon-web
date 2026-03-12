"use client"

import Link from "next/link"
import { useCallback, useEffect } from "react"
import { useParams } from "next/navigation"
import { ArrowLeft, Loader2 } from "lucide-react"
import { api } from "@/lib/api"
import { formatDateTimeByLocale } from "@/lib/date-time"
import type { AuditLogItem } from "@/types/api"
import { withLocalePrefix } from "@/components/app-locale"
import { useAppLocale } from "@/hooks/use-app-locale"
import { useAppTranslations } from "@/hooks/use-app-translations"
import { useRequestState } from "@/hooks/use-request-state"
import { toastApiError } from "@/lib/toast"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { JsonTextarea } from "@/components/ui/json-textarea"

type AuditLogDetailState = {
  item: AuditLogItem | null
}

function normalizeAction(value: string | null | undefined) {
  return (value || "").trim().toUpperCase()
}

function resolveActionVariant(action: string) {
  if (action === "CREATE") {
    return "success" as const
  }

  if (action === "UPDATE") {
    return "warning" as const
  }

  if (action === "DELETE") {
    return "destructive" as const
  }

  return "secondary" as const
}

function asPrettyJsonString(value: unknown) {
  if (typeof value === "string") {
    try {
      return JSON.stringify(JSON.parse(value), null, 2)
    } catch {
      return value
    }
  }

  try {
    return JSON.stringify(value ?? {}, null, 2)
  } catch {
    return String(value)
  }
}

export default function SystemAuditLogDetailPage() {
  const { t, locale } = useAppTranslations("system")
  const appLocale = useAppLocale()
  const params = useParams<{ id: string }>()
  const logId = typeof params.id === "string" ? params.id : ""
  const { data, loading, execute } = useRequestState<AuditLogDetailState>(
    { item: null },
    { initialLoading: true }
  )

  const fetchLogDetail = useCallback(async () => {
    if (!logId) {
      return
    }

    await execute(
      async () => {
        const item = await api.getAuditLogById(logId)
        return { item }
      },
      {
        onError: (error) => {
          toastApiError(error, t("auditLogsDetailToastFetchError"))
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
          {t("auditLogsDetailLoading")}
        </CardContent>
      </Card>
    )
  }

  if (!data.item) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{t("auditLogsDetailNotFoundTitle")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            {t("auditLogsDetailNotFoundDescription", { id: logId || "-" })}
          </p>
          <Button asChild variant="outline">
            <Link href={withLocalePrefix("/system/audit-logs", appLocale)}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              {t("auditLogsDetailBackToList")}
            </Link>
          </Button>
        </CardContent>
      </Card>
    )
  }

  const item = data.item
  const action = normalizeAction(item.action)

  return (
    <div className="space-y-6 px-8 pb-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <h2 className="text-2xl font-bold tracking-tight">{t("auditLogsDetailTitle")}</h2>
          <p className="text-sm text-muted-foreground">{t("auditLogsDetailDescription")}</p>
        </div>
        <Button asChild variant="outline">
          <Link href={withLocalePrefix("/system/audit-logs", appLocale)}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            {t("auditLogsDetailBackToList")}
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t("auditLogsDetailSectionBasic")}</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div>
            <p className="text-xs text-muted-foreground">{t("auditLogsDetailFieldLogId")}</p>
            <p className="font-mono text-sm break-all">{item.id}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">{t("auditLogsTableColCreatedAt")}</p>
            <p className="text-sm">
              {formatDateTimeByLocale(item.created_at, locale, item.created_at || "-", { hour12: false })}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">{t("auditLogsTableColUser")}</p>
            <p className="text-sm">{item.username || item.user_id || t("auditLogsUnknownValue")}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">{t("auditLogsDetailFieldUserId")}</p>
            <p className="font-mono text-sm break-all">{item.user_id || t("auditLogsUnknownValue")}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">{t("auditLogsTableColAction")}</p>
            <Badge variant={resolveActionVariant(action)}>{action || t("auditLogsUnknownValue")}</Badge>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">{t("auditLogsTableColResourceType")}</p>
            <p className="text-sm">{item.resource_type || t("auditLogsUnknownValue")}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">{t("auditLogsTableColResourceId")}</p>
            <p className="font-mono text-sm break-all">{item.resource_id || t("auditLogsUnknownValue")}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">{t("auditLogsTableColIpAddress")}</p>
            <p className="font-mono text-sm break-all">{item.ip_address || t("auditLogsUnknownValue")}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">{t("auditLogsDetailFieldUserAgent")}</p>
            <p className="text-sm break-all">{item.user_agent || t("auditLogsUnknownValue")}</p>
          </div>
          <div className="md:col-span-2">
            <p className="text-xs text-muted-foreground">{t("auditLogsDetailFieldDetail")}</p>
            <p className="text-sm break-words">{(item.detail as string) || t("auditLogsUnknownValue")}</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("auditLogsDetailSectionRaw")}</CardTitle>
        </CardHeader>
        <CardContent>
          <JsonTextarea
            value={asPrettyJsonString(item)}
            onChange={() => {}}
            readOnly
            autoFormat={false}
            showToolbar
            showFormatButton={false}
            showCopyButton
            showInvalidHint={false}
            maxHeightClassName="max-h-[520px]"
          />
        </CardContent>
      </Card>
    </div>
  )
}
