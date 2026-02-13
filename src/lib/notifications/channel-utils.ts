import type { AppNamespaceTranslator } from "@/hooks/use-app-translations"
import type { ChannelConfig } from "@/types/api"

export function formatDateTime(value: string | null, locale: "zh" | "en") {
  if (!value) {
    return "-"
  }

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return "-"
  }

  return date.toLocaleString(locale === "zh" ? "zh-CN" : "en-US", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  })
}

export function normalizeRecipientsInput(value: string) {
  return Array.from(
    new Set(
      value
        .split(/[\n,]/)
        .map((item) => item.trim())
        .filter(Boolean)
    )
  )
}

export function getInitialFormState() {
  return {
    name: "",
    channelType: "email",
    systemConfigId: "",
    description: "",
    minSeverity: "info",
    enabled: true,
    recipientsInput: "",
    configJson: "{}",
  }
}

export function createConfigMap(rows: ChannelConfig[] | unknown[]): Record<string, string> {
  const map: Record<string, string> = {}

  rows.forEach((row) => {
    if (!row || typeof row !== "object") {
      return
    }

    const record = row as Record<string, unknown>
    const id = typeof record.id === "string" ? record.id : null

    if (!id) {
      return
    }

    if (typeof record.config_json === "string") {
      map[id] = record.config_json
      return
    }

    if (record.config_json && typeof record.config_json === "object") {
      map[id] = JSON.stringify(record.config_json, null, 2)
      return
    }

    if (record.config && typeof record.config === "object") {
      map[id] = JSON.stringify(record.config, null, 2)
    }
  })

  return map
}

export function getChannelTypeLabel(type: string, t: AppNamespaceTranslator<"pages">) {
  const normalized = type.toLowerCase()

  if (normalized === "email") {
    return t("notifications.typeEmail")
  }

  if (normalized === "webhook") {
    return t("notifications.typeWebhook")
  }

  if (normalized === "slack") {
    return t("notifications.typeSlack")
  }

  if (normalized === "sms") {
    return t("notifications.typeSms")
  }

  return type || t("notifications.typeUnknown")
}

export function getSeverityLabel(severity: string, t: AppNamespaceTranslator<"pages">) {
  const normalized = severity.toLowerCase()

  if (normalized === "critical") {
    return t("notifications.severityCritical")
  }

  if (normalized === "warning") {
    return t("notifications.severityWarning")
  }

  if (normalized === "info") {
    return t("notifications.severityInfo")
  }

  return t("notifications.severityUnknown")
}

export function getSeverityClassName(severity: string) {
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

export function shouldRequireSystemConfig(channelType: string) {
  const normalized = channelType.trim().toLowerCase()
  return normalized === "email" || normalized === "sms"
}
