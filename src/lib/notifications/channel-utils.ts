import type { AppNamespaceTranslator } from "@/hooks/use-app-translations"

export const CHANNEL_TYPE_OPTIONS = ["email", "dingtalk", "webhook", "slack", "sms"] as const

export type ChannelConfigFieldType = "text" | "password" | "number" | "url" | "boolean" | "textarea"

export type ChannelConfigFieldSchema = {
  key: string
  labelKey: string
  placeholderKey: string
  type: ChannelConfigFieldType
  required?: boolean
  defaultValue?: string | boolean
}

const CHANNEL_CONFIG_SCHEMA: Record<string, ChannelConfigFieldSchema[]> = {
  email: [
    {
      key: "smtp_host",
      labelKey: "notifications.configFieldEmailSmtpHost",
      placeholderKey: "notifications.configFieldEmailSmtpHostPlaceholder",
      type: "text",
      required: true,
      defaultValue: "",
    },
    {
      key: "smtp_port",
      labelKey: "notifications.configFieldEmailSmtpPort",
      placeholderKey: "notifications.configFieldEmailSmtpPortPlaceholder",
      type: "number",
      required: true,
      defaultValue: "465",
    },
    {
      key: "smtp_username",
      labelKey: "notifications.configFieldEmailUsername",
      placeholderKey: "notifications.configFieldEmailUsernamePlaceholder",
      type: "text",
      required: true,
      defaultValue: "",
    },
    {
      key: "smtp_password",
      labelKey: "notifications.configFieldEmailPassword",
      placeholderKey: "notifications.configFieldEmailPasswordPlaceholder",
      type: "password",
      required: true,
      defaultValue: "",
    },
    {
      key: "from_name",
      labelKey: "notifications.configFieldEmailFromName",
      placeholderKey: "notifications.configFieldEmailFromNamePlaceholder",
      type: "text",
      defaultValue: "",
    },
    {
      key: "from_email",
      labelKey: "notifications.configFieldEmailFromEmail",
      placeholderKey: "notifications.configFieldEmailFromEmailPlaceholder",
      type: "text",
      required: true,
      defaultValue: "",
    },
  ],
  dingtalk: [
    {
      key: "webhook_url",
      labelKey: "notifications.configFieldDingTalkWebhookUrl",
      placeholderKey: "notifications.configFieldDingTalkWebhookUrlPlaceholder",
      type: "url",
      required: true,
      defaultValue: "",
    },
    {
      key: "secret",
      labelKey: "notifications.configFieldDingTalkSecret",
      placeholderKey: "notifications.configFieldDingTalkSecretPlaceholder",
      type: "password",
      defaultValue: "",
    },
    {
      key: "is_at_all",
      labelKey: "notifications.configFieldDingTalkAtAll",
      placeholderKey: "notifications.configFieldDingTalkAtAllPlaceholder",
      type: "boolean",
      defaultValue: false,
    },
    {
      key: "at_mobiles",
      labelKey: "notifications.configFieldDingTalkAtMobiles",
      placeholderKey: "notifications.configFieldDingTalkAtMobilesPlaceholder",
      type: "textarea",
      defaultValue: "",
    },
    {
      key: "at_user_ids",
      labelKey: "notifications.configFieldDingTalkAtUserIds",
      placeholderKey: "notifications.configFieldDingTalkAtUserIdsPlaceholder",
      type: "textarea",
      defaultValue: "",
    },
  ],
  webhook: [
    {
      key: "url",
      labelKey: "notifications.configFieldWebhookUrl",
      placeholderKey: "notifications.configFieldWebhookUrlPlaceholder",
      type: "url",
      required: true,
      defaultValue: "",
    },
    {
      key: "method",
      labelKey: "notifications.configFieldWebhookMethod",
      placeholderKey: "notifications.configFieldWebhookMethodPlaceholder",
      type: "text",
      defaultValue: "POST",
    },
    {
      key: "content_type",
      labelKey: "notifications.configFieldWebhookContentType",
      placeholderKey: "notifications.configFieldWebhookContentTypePlaceholder",
      type: "text",
      defaultValue: "application/json",
    },
  ],
  slack: [
    {
      key: "webhook_url",
      labelKey: "notifications.configFieldSlackWebhookUrl",
      placeholderKey: "notifications.configFieldSlackWebhookUrlPlaceholder",
      type: "url",
      required: true,
      defaultValue: "",
    },
    {
      key: "channel",
      labelKey: "notifications.configFieldSlackChannel",
      placeholderKey: "notifications.configFieldSlackChannelPlaceholder",
      type: "text",
      defaultValue: "",
    },
  ],
  sms: [
    {
      key: "template_id",
      labelKey: "notifications.configFieldSmsTemplateId",
      placeholderKey: "notifications.configFieldSmsTemplateIdPlaceholder",
      type: "text",
      defaultValue: "",
    },
    {
      key: "sign_name",
      labelKey: "notifications.configFieldSmsSignName",
      placeholderKey: "notifications.configFieldSmsSignNamePlaceholder",
      type: "text",
      defaultValue: "",
    },
  ],
}

export type ChannelConfigFormValues = Record<string, string | boolean>

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
    description: "",
    minSeverity: "info",
    enabled: true,
    recipientsInput: "",
    configJson: "{}",
    configFormValues: getDefaultChannelConfigFormValues("email"),
  }
}

export function getChannelConfigSchema(channelType: string): ChannelConfigFieldSchema[] {
  const normalized = channelType.trim().toLowerCase()
  return CHANNEL_CONFIG_SCHEMA[normalized] || []
}

export function getDefaultChannelConfigFormValues(channelType: string): ChannelConfigFormValues {
  const values: ChannelConfigFormValues = {}
  const schema = getChannelConfigSchema(channelType)

  schema.forEach((field) => {
    if (field.defaultValue !== undefined) {
      values[field.key] = field.defaultValue
      return
    }

    values[field.key] = field.type === "boolean" ? false : ""
  })

  return values
}

function parseConfigJsonRecord(configJson: string): Record<string, unknown> {
  const raw = configJson.trim()

  if (!raw) {
    return {}
  }

  const parsed = JSON.parse(raw)

  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    return {}
  }

  return parsed as Record<string, unknown>
}

export function getConfigFormValuesFromConfigJson(
  channelType: string,
  configJson: string
): ChannelConfigFormValues {
  const schema = getChannelConfigSchema(channelType)
  const defaults = getDefaultChannelConfigFormValues(channelType)

  if (schema.length === 0) {
    return defaults
  }

  let configRecord: Record<string, unknown> = {}

  try {
    configRecord = parseConfigJsonRecord(configJson)
  } catch {
    return defaults
  }

  const values = { ...defaults }

  const resolveRawValue = (fieldKey: string) => configRecord[fieldKey]

  schema.forEach((field) => {
    const rawValue = resolveRawValue(field.key)

    if (rawValue === undefined || rawValue === null) {
      return
    }

    if (field.type === "boolean") {
      values[field.key] = Boolean(rawValue)
      return
    }

    if (Array.isArray(rawValue)) {
      values[field.key] = rawValue.join(", ")
      return
    }

    values[field.key] = String(rawValue)
  })

  return values
}

export type SerializeChannelConfigResult =
  | {
      ok: true
      configJson: string
    }
  | {
      ok: false
      reason: "invalid_json" | "required" | "invalid_number"
      fieldLabelKey?: string
    }

export function serializeChannelConfigJson({
  channelType,
  configJson,
  configFormValues,
}: {
  channelType: string
  configJson: string
  configFormValues: ChannelConfigFormValues
}): SerializeChannelConfigResult {
  const normalizedChannelType = channelType.trim().toLowerCase()
  const schema = getChannelConfigSchema(channelType)

  if (schema.length === 0) {
    const input = configJson.trim()

    if (!input) {
      return { ok: true, configJson: "{}" }
    }

    try {
      return {
        ok: true,
        configJson: JSON.stringify(JSON.parse(input)),
      }
    } catch {
      return {
        ok: false,
        reason: "invalid_json",
      }
    }
  }

  let baseConfig: Record<string, unknown> = {}

  try {
    baseConfig = parseConfigJsonRecord(configJson)
  } catch {
    baseConfig = {}
  }

  const nextConfig: Record<string, unknown> = { ...baseConfig }

  for (const field of schema) {
    const rawValue = configFormValues[field.key]

    if (field.type === "boolean") {
      nextConfig[field.key] = Boolean(rawValue)
      continue
    }

    const textValue = typeof rawValue === "string" ? rawValue.trim() : ""

    if (field.required && !textValue) {
      return {
        ok: false,
        reason: "required",
        fieldLabelKey: field.labelKey,
      }
    }

    if (field.key === "at_mobiles" || field.key === "at_user_ids") {
      const list = Array.from(
        new Set(
          textValue
            .split(/[\n,]/)
            .map((item) => item.trim())
            .filter(Boolean)
        )
      )

      nextConfig[field.key] = list
      continue
    }

    if (!textValue) {
      delete nextConfig[field.key]
      continue
    }

    if (field.type === "number") {
      const parsedNumber = Number(textValue)

      if (!Number.isFinite(parsedNumber)) {
        return {
          ok: false,
          reason: "invalid_number",
          fieldLabelKey: field.labelKey,
        }
      }

      nextConfig[field.key] = parsedNumber
      continue
    }

    nextConfig[field.key] = textValue
  }

  if (normalizedChannelType === "email") {
    const fromNameRaw = configFormValues.from_name
    const fromEmailRaw = configFormValues.from_email
    const fromName = typeof fromNameRaw === "string" ? fromNameRaw.trim() : ""
    const fromEmail = typeof fromEmailRaw === "string" ? fromEmailRaw.trim() : ""

    if (!fromEmail) {
      return {
        ok: false,
        reason: "required",
        fieldLabelKey: "notifications.configFieldEmailFromEmail",
      }
    }

    nextConfig.from_name = fromName
    nextConfig.from_email = fromEmail

    delete nextConfig.from
    delete nextConfig.from_address
    delete nextConfig.username
    delete nextConfig.password
    delete nextConfig.use_tls
  }

  return {
    ok: true,
    configJson: JSON.stringify(nextConfig),
  }
}

export function getChannelTypeLabel(type: string, t: AppNamespaceTranslator<"pages">) {
  const normalized = type.toLowerCase()

  if (normalized === "email") {
    return t("notifications.typeEmail")
  }

  if (normalized === "dingtalk") {
    return t("notifications.typeDingTalk")
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
