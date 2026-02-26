"use client"

import { Dispatch, FormEvent, SetStateAction, useCallback, useEffect, useMemo, useState } from "react"
import { Eye, EyeOff, Loader2, Plus, RefreshCw } from "lucide-react"
import { toast, toastApiError, toastCopied, toastCreated, toastDeleted, toastSaved } from "@/lib/toast"
import { api, getApiErrorMessage } from "@/lib/api"
import { copyApiCurlCommand } from "@/lib/api-curl"
import { useAppTranslations } from "@/hooks/use-app-translations"
import { useRequestState } from "@/hooks/use-request-state"
import type { CloudAccountResponse, CreateCloudAccountRequest, UpdateCloudAccountRequest } from "@/types/api"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { CopyCurlDropdown } from "@/components/ui/copy-curl-dropdown"
import { CloudAccountsFiltersCard } from "@/components/pages/cloud/cloud-accounts-filters-card"
import { CloudAccountsStatsCards } from "@/components/pages/cloud/cloud-accounts-stats-cards"
import { CloudAccountsTableCard } from "@/components/pages/cloud/cloud-accounts-table-card"
import { HttpMethodBadge } from "@/components/ui/http-method-badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { JsonTextarea } from "@/components/ui/json-textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

type CloudAccountsState = {
  accounts: CloudAccountResponse[]
}

type CloudAccountFormState = {
  configKey: string
  provider: string
  displayName: string
  description: string
  enabled: boolean
  configText: string
  configFormValues: CloudAccountConfigFormValues
}

const DEFAULT_FORM_STATE: CloudAccountFormState = {
  configKey: "",
  provider: "",
  displayName: "",
  description: "",
  enabled: true,
  configText: "{\n  \n}",
  configFormValues: {},
}

type CloudProviderConfigFieldType = "text" | "password" | "url" | "boolean"

type CloudProviderConfigFieldSchema = {
  key: string
  type: CloudProviderConfigFieldType
  required?: boolean
  aliases?: string[]
  label: {
    zh: string
    en: string
  }
  placeholder?: {
    zh: string
    en: string
  }
}

type CloudAccountConfigFormValues = Record<string, string | boolean>

const CLOUD_PROVIDER_SCHEMA: Record<string, CloudProviderConfigFieldSchema[]> = {
  tencent: [
    {
      key: "secret_id",
      type: "text",
      required: true,
      aliases: ["secretId"],
      label: { zh: "SecretId", en: "SecretId" },
      placeholder: { zh: "腾讯云 API SecretId", en: "Tencent Cloud API SecretId" },
    },
    {
      key: "secret_key",
      type: "password",
      required: true,
      aliases: ["secretKey"],
      label: { zh: "SecretKey", en: "SecretKey" },
      placeholder: { zh: "腾讯云 API SecretKey", en: "Tencent Cloud API SecretKey" },
    },
    {
      key: "region",
      type: "text",
      aliases: ["region_id", "regionId", "regions"],
      label: { zh: "默认地域", en: "Default Region" },
      placeholder: { zh: "例如：ap-guangzhou（可选）", en: "e.g. ap-guangzhou (optional)" },
    },
  ],
  alibaba: [
    {
      key: "secret_id",
      type: "text",
      required: true,
      aliases: ["access_key_id", "accessKeyId", "AccessKeyId", "access_key", "accessKey", "ak"],
      label: { zh: "AccessKey ID", en: "AccessKey ID" },
      placeholder: { zh: "阿里云 AccessKey ID", en: "Alibaba Cloud AccessKey ID" },
    },
    {
      key: "secret_key",
      type: "password",
      required: true,
      aliases: ["access_key_secret", "accessKeySecret", "AccessKeySecret", "secretKey", "sk"],
      label: { zh: "AccessKey Secret", en: "AccessKey Secret" },
      placeholder: { zh: "阿里云 AccessKey Secret", en: "Alibaba Cloud AccessKey Secret" },
    },
    {
      key: "region_id",
      type: "text",
      aliases: ["regionId", "region", "regions"],
      label: { zh: "默认地域 ID", en: "Default Region ID" },
      placeholder: { zh: "例如：cn-hangzhou（可选）", en: "e.g. cn-hangzhou (optional)" },
    },
  ],
  aws: [
    {
      key: "access_key_id",
      type: "text",
      required: true,
      aliases: ["accessKeyId", "AccessKeyId", "aws_access_key_id", "access_key", "accessKey"],
      label: { zh: "Access Key ID", en: "Access Key ID" },
      placeholder: { zh: "AWS Access Key ID", en: "AWS Access Key ID" },
    },
    {
      key: "secret_access_key",
      type: "password",
      required: true,
      aliases: ["secretAccessKey", "SecretAccessKey", "aws_secret_access_key", "secret_key", "secretKey"],
      label: { zh: "Secret Access Key", en: "Secret Access Key" },
      placeholder: { zh: "AWS Secret Access Key", en: "AWS Secret Access Key" },
    },
    {
      key: "region",
      type: "text",
      aliases: ["region_id", "regionId", "regions"],
      label: { zh: "默认区域", en: "Default Region" },
      placeholder: { zh: "例如：ap-southeast-1（可选）", en: "e.g. ap-southeast-1 (optional)" },
    },
  ],
  huawei: [
    {
      key: "access_key",
      type: "text",
      required: true,
      aliases: ["accessKey", "AccessKey", "ak", "access_key_id"],
      label: { zh: "Access Key", en: "Access Key" },
      placeholder: { zh: "华为云 Access Key", en: "Huawei Cloud Access Key" },
    },
    {
      key: "secret_key",
      type: "password",
      required: true,
      aliases: ["secretKey", "SecretKey", "sk", "access_key_secret"],
      label: { zh: "Secret Key", en: "Secret Key" },
      placeholder: { zh: "华为云 Secret Key", en: "Huawei Cloud Secret Key" },
    },
    {
      key: "region",
      type: "text",
      aliases: ["region_id", "regionId", "regions"],
      label: { zh: "默认区域", en: "Default Region" },
      placeholder: { zh: "例如：cn-north-4（可选）", en: "e.g. cn-north-4 (optional)" },
    },
  ],
  azure: [
    {
      key: "tenant_id",
      type: "text",
      required: true,
      aliases: ["tenantId"],
      label: { zh: "Tenant ID", en: "Tenant ID" },
      placeholder: { zh: "Azure Tenant ID", en: "Azure Tenant ID" },
    },
    {
      key: "client_id",
      type: "text",
      required: true,
      aliases: ["clientId"],
      label: { zh: "Client ID", en: "Client ID" },
      placeholder: { zh: "Azure Client ID", en: "Azure Client ID" },
    },
    {
      key: "client_secret",
      type: "password",
      required: true,
      aliases: ["clientSecret"],
      label: { zh: "Client Secret", en: "Client Secret" },
      placeholder: { zh: "Azure Client Secret", en: "Azure Client Secret" },
    },
    {
      key: "subscription_id",
      type: "text",
      required: true,
      aliases: ["subscriptionId"],
      label: { zh: "Subscription ID", en: "Subscription ID" },
      placeholder: { zh: "Azure Subscription ID", en: "Azure Subscription ID" },
    },
  ],
}

const CLOUD_PROVIDER_ALIASES: Record<string, string> = {
  aliyun: "alibaba",
  alicloud: "alibaba",
  alibabacloud: "alibaba",
  tencentcloud: "tencent",
  qcloud: "tencent",
  huaweicloud: "huawei",
}

const BUILT_IN_CLOUD_PROVIDERS = ["tencent", "alibaba", "aws", "huawei", "azure"] as const

function formatDateTime(value: string | null | undefined, locale: "zh" | "en") {
  if (!value) {
    return "-"
  }

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return value
  }

  return date.toLocaleString(locale === "zh" ? "zh-CN" : "en-US", {
    hour12: false,
  })
}

function normalizeJsonText(value: unknown) {
  try {
    return JSON.stringify(value ?? {}, null, 2)
  } catch {
    return "{\n  \n}"
  }
}

function normalizeCloudProvider(provider: string) {
  const normalized = provider.trim().toLowerCase()
  return CLOUD_PROVIDER_ALIASES[normalized] || normalized
}

function getCloudProviderAliasTarget(provider: string) {
  const normalized = provider.trim().toLowerCase()
  return CLOUD_PROVIDER_ALIASES[normalized] || null
}

function getCloudProviderConfigSchema(provider: string) {
  return CLOUD_PROVIDER_SCHEMA[normalizeCloudProvider(provider)] || []
}

function getDefaultCloudProviderConfigFormValues(provider: string): CloudAccountConfigFormValues {
  const values: CloudAccountConfigFormValues = {}

  getCloudProviderConfigSchema(provider).forEach((field) => {
    values[field.key] = field.type === "boolean" ? false : ""
  })

  return values
}

function parseObjectRecord(value: unknown): Record<string, unknown> {
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value)
      if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
        return parsed as Record<string, unknown>
      }
    } catch {
      return {}
    }
  }

  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {}
  }

  return value as Record<string, unknown>
}

function normalizeLookupKey(key: string) {
  return key.replace(/[^a-zA-Z0-9]/g, "").toLowerCase()
}

function findValueByCandidateKeys(
  record: Record<string, unknown>,
  candidateKeys: string[]
): unknown {
  for (const key of candidateKeys) {
    if (record[key] !== undefined) {
      return record[key]
    }
  }

  const normalizedCandidates = new Set(candidateKeys.map(normalizeLookupKey))

  for (const [key, value] of Object.entries(record)) {
    if (normalizedCandidates.has(normalizeLookupKey(key))) {
      return value
    }
  }

  for (const value of Object.values(record)) {
    if (!value || typeof value !== "object" || Array.isArray(value)) {
      continue
    }

    const nested = findValueByCandidateKeys(value as Record<string, unknown>, candidateKeys)

    if (nested !== undefined) {
      return nested
    }
  }

  return undefined
}

function normalizeConfigFieldTextValue(rawValue: unknown, candidateKeys: string[]): string {
  if (Array.isArray(rawValue)) {
    return rawValue
      .map((item) => normalizeConfigFieldTextValue(item, candidateKeys))
      .map((item) => item.trim())
      .filter(Boolean)
      .join(", ")
  }

  if (rawValue && typeof rawValue === "object") {
    const nested = findValueByCandidateKeys(rawValue as Record<string, unknown>, candidateKeys)

    if (nested !== undefined && nested !== null && nested !== rawValue) {
      return normalizeConfigFieldTextValue(nested, candidateKeys)
    }

    try {
      return JSON.stringify(rawValue)
    } catch {
      return ""
    }
  }

  return String(rawValue)
}

function parseDelimitedValues(value: string): string[] {
  return Array.from(
    new Set(
      value
        .split(/[\n,]/)
        .map((item) => item.trim())
        .filter(Boolean)
    )
  )
}

function parseConfigRecordFromText(configText: string): Record<string, unknown> {
  const trimmed = configText.trim()

  if (!trimmed) {
    return {}
  }

  return parseObjectRecord(JSON.parse(trimmed))
}

function getCloudProviderConfigFormValuesFromConfig(
  provider: string,
  config: unknown
): CloudAccountConfigFormValues {
  const schema = getCloudProviderConfigSchema(provider)
  const defaults = getDefaultCloudProviderConfigFormValues(provider)

  if (schema.length === 0) {
    return defaults
  }

  const configRecord = parseObjectRecord(config)
  const values = { ...defaults }

  schema.forEach((field) => {
    const rawValue = findValueByCandidateKeys(configRecord, [field.key, ...(field.aliases || [])])

    if (rawValue === undefined || rawValue === null) {
      return
    }

    if (field.type === "boolean") {
      values[field.key] = Boolean(rawValue)
      return
    }

    values[field.key] = normalizeConfigFieldTextValue(rawValue, [
      field.key,
      ...(field.aliases || []),
      "region",
      "region_id",
      "regionId",
      "name",
      "id",
    ])
  })

  return values
}

type SerializeCloudAccountConfigResult =
  | {
      ok: true
      config: Record<string, unknown>
      configText: string
    }
  | {
      ok: false
      reason: "invalid_json" | "required"
      fieldLabel?: string
    }

function isCloudConfigSerializeError(
  result: SerializeCloudAccountConfigResult
): result is Extract<SerializeCloudAccountConfigResult, { ok: false }> {
  return !result.ok
}

function serializeCloudAccountConfig({
  provider,
  configText,
  configFormValues,
  locale,
}: {
  provider: string
  configText: string
  configFormValues: CloudAccountConfigFormValues
  locale: "zh" | "en"
}): SerializeCloudAccountConfigResult {
  const schema = getCloudProviderConfigSchema(provider)

  if (schema.length === 0) {
    try {
      const config = parseConfigRecordFromText(configText)
      return {
        ok: true,
        config,
        configText: JSON.stringify(config, null, 2),
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
    baseConfig = parseConfigRecordFromText(configText)
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
        fieldLabel: field.label[locale],
      }
    }

    if (!textValue) {
      delete nextConfig[field.key]
      field.aliases?.forEach((alias) => {
        delete nextConfig[alias]
      })
      continue
    }

    const isRegionField = field.key === "region" || field.key === "region_id"

    if (isRegionField) {
      const regionValues = parseDelimitedValues(textValue)

      if (regionValues.length > 1) {
        nextConfig[field.key] = regionValues[0]
        nextConfig.regions = regionValues
        field.aliases?.forEach((alias) => {
          if (alias !== field.key && alias !== "regions") {
            delete nextConfig[alias]
          }
        })
        continue
      }

      if (regionValues.length === 1) {
        nextConfig[field.key] = regionValues[0]
        delete nextConfig.regions
        field.aliases?.forEach((alias) => {
          if (alias !== field.key) {
            delete nextConfig[alias]
          }
        })
        continue
      }
    }

    nextConfig[field.key] = textValue
    field.aliases?.forEach((alias) => {
      if (alias !== field.key) {
        delete nextConfig[alias]
      }
    })
  }

  return {
    ok: true,
    config: nextConfig,
    configText: JSON.stringify(nextConfig, null, 2),
  }
}

function getProviderOptions(accounts: CloudAccountResponse[]) {
  return Array.from(
    new Set(accounts.map((item) => item.provider?.trim()).filter((item): item is string => Boolean(item)))
  ).sort((a, b) => a.localeCompare(b))
}

function buildCloudAccountFormState(account: CloudAccountResponse): CloudAccountFormState {
  return {
    configKey: account.config_key,
    provider: account.provider,
    displayName: account.display_name,
    description: account.description ?? "",
    enabled: account.enabled,
    configText: normalizeJsonText(account.config),
    configFormValues: getCloudProviderConfigFormValuesFromConfig(account.provider, account.config),
  }
}

type CloudAccountConfigFieldsProps = {
  locale: "zh" | "en"
  provider: string
  form: CloudAccountFormState
  setForm: Dispatch<SetStateAction<CloudAccountFormState>>
  configJsonLabel: string
  configJsonPlaceholder: string
}

function CloudAccountConfigFields({
  locale,
  provider,
  form,
  setForm,
  configJsonLabel,
  configJsonPlaceholder,
}: CloudAccountConfigFieldsProps) {
  const schema = getCloudProviderConfigSchema(provider)
  const hasStructuredFields = schema.length > 0

  const updateFieldValue = (key: string, value: string | boolean) => {
    setForm((previous) => ({
      ...previous,
      configFormValues: {
        ...previous.configFormValues,
        [key]: value,
      },
    }))
  }

  return (
    <div className="space-y-2 md:col-span-2">
      <Label>{configJsonLabel}</Label>
      {hasStructuredFields ? (
        <div className="space-y-4 rounded-md border p-4">
          <p className="text-xs text-muted-foreground">
            {locale === "zh"
              ? "已根据供应商显示配置项，提交时会自动组装为 JSON。"
              : "Configuration fields are shown by provider type and will be assembled into JSON automatically on submit."}
          </p>
          <div className="grid gap-4 sm:grid-cols-2">
            {schema.map((field) => (
              <CloudProviderConfigFieldInput
                key={field.key}
                locale={locale}
                field={field}
                value={form.configFormValues[field.key]}
                onChange={updateFieldValue}
              />
            ))}
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground">
            {locale === "zh"
              ? "当前供应商暂无预设表单字段，请使用 JSON 配置（建议使用常见供应商标识如 tencent / alibaba / aws / huawei / azure）。"
              : "No preset fields for this provider yet. Please use JSON config (recommended provider names: tencent / alibaba / aws / huawei / azure)."}
          </p>
          <JsonTextarea
            value={form.configText}
            onChange={(value) => setForm((previous) => ({ ...previous, configText: value }))}
            placeholder={configJsonPlaceholder}
            rows={12}
            maxHeightClassName="max-h-[360px]"
          />
        </div>
      )}
    </div>
  )
}

type CloudProviderConfigFieldInputProps = {
  locale: "zh" | "en"
  field: CloudProviderConfigFieldSchema
  value: string | boolean | undefined
  onChange: (key: string, value: string | boolean) => void
}

function CloudProviderConfigFieldInput({
  locale,
  field,
  value,
  onChange,
}: CloudProviderConfigFieldInputProps) {
  const [showPassword, setShowPassword] = useState(false)
  const label = field.label[locale]
  const placeholder = field.placeholder?.[locale] || ""
  const inputId = `cloud-config-field-${field.key}`
  const shouldTakeFullRow = field.key === "access_key" || field.key === "access_key_id" || field.key === "secret_id"
  const fieldContainerClassName = shouldTakeFullRow ? "space-y-2 sm:col-span-2" : "space-y-2"

  if (field.type === "boolean") {
    return (
      <div className={fieldContainerClassName}>
        <Label htmlFor={inputId}>{label}</Label>
        <div className="flex h-10 items-center rounded-md border px-3">
          <Switch
            id={inputId}
            checked={Boolean(value)}
            onCheckedChange={(checked) => onChange(field.key, checked)}
          />
          <span className="ml-3 text-sm text-muted-foreground">
            {Boolean(value)
              ? locale === "zh" ? "启用" : "Enabled"
              : locale === "zh" ? "关闭" : "Disabled"}
          </span>
        </div>
      </div>
    )
  }

  if (field.type === "password") {
    return (
      <div className={fieldContainerClassName}>
        <Label htmlFor={inputId}>
          {label}
          {field.required ? <span className="text-destructive"> *</span> : null}
        </Label>
        <div className="relative">
          <Input
            id={inputId}
            type={showPassword ? "text" : "password"}
            value={typeof value === "string" ? value : ""}
            onChange={(event) => onChange(field.key, event.target.value)}
            placeholder={placeholder}
            className="pr-10"
          />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="absolute top-1/2 right-1 h-8 w-8 -translate-y-1/2"
            onClick={() => setShowPassword((previous) => !previous)}
            aria-label={showPassword
              ? locale === "zh" ? "隐藏密钥" : "Hide secret"
              : locale === "zh" ? "显示密钥" : "Show secret"}
            aria-pressed={showPassword}
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className={fieldContainerClassName}>
      <Label htmlFor={inputId}>
        {label}
        {field.required ? <span className="text-destructive"> *</span> : null}
      </Label>
      <Input
        id={inputId}
        type={field.type}
        value={typeof value === "string" ? value : ""}
        onChange={(event) => onChange(field.key, event.target.value)}
        placeholder={placeholder}
      />
    </div>
  )
}

export default function CloudAccountsPage() {
  const { t, locale } = useAppTranslations("pages")
  const { data, loading, refreshing, execute } = useRequestState<CloudAccountsState>({
    accounts: [],
  })

  const [searchKeyword, setSearchKeyword] = useState("")
  const [enabledFilter, setEnabledFilter] = useState<"all" | "enabled" | "disabled">("all")
  const [providerFilter, setProviderFilter] = useState("all")

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingAccount, setEditingAccount] = useState<CloudAccountResponse | null>(null)
  const [form, setForm] = useState<CloudAccountFormState>(DEFAULT_FORM_STATE)
  const [formSubmitting, setFormSubmitting] = useState(false)
  const [editingDialogLoading, setEditingDialogLoading] = useState(false)

  const [testingId, setTestingId] = useState<string | null>(null)
  const [collectingId, setCollectingId] = useState<string | null>(null)
  const [togglingId, setTogglingId] = useState<string | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<CloudAccountResponse | null>(null)
  const [deleting, setDeleting] = useState(false)

  const accounts = data.accounts

  const fetchAccounts = useCallback(
    async (silent = false) => {
      await execute(
        async () => ({
          accounts: await api.listCloudAccounts(),
        }),
        {
          silent,
          onError: (error) => {
            toastApiError(error, t("cloud.accounts.toastFetchError"))
          },
        }
      )
    },
    [execute, t]
  )

  useEffect(() => {
    fetchAccounts()
  }, [fetchAccounts])

  const providerOptions = useMemo(() => getProviderOptions(accounts), [accounts])
  const normalizedProvider = useMemo(() => normalizeCloudProvider(form.provider), [form.provider])
  const providerAliasTarget = useMemo(() => getCloudProviderAliasTarget(form.provider), [form.provider])
  const providerSelectValue = useMemo(() => {
    return BUILT_IN_CLOUD_PROVIDERS.includes(normalizedProvider as (typeof BUILT_IN_CLOUD_PROVIDERS)[number])
      ? normalizedProvider
      : "__custom__"
  }, [normalizedProvider])

  const filteredAccounts = useMemo(() => {
    const keyword = searchKeyword.trim().toLowerCase()

    return accounts.filter((item) => {
      if (enabledFilter === "enabled" && !item.enabled) {
        return false
      }

      if (enabledFilter === "disabled" && item.enabled) {
        return false
      }

      if (providerFilter !== "all" && item.provider !== providerFilter) {
        return false
      }

      if (!keyword) {
        return true
      }

      const haystack = [
        item.display_name,
        item.config_key,
        item.provider,
        item.description ?? "",
      ]
        .join(" ")
        .toLowerCase()

      return haystack.includes(keyword)
    })
  }, [accounts, enabledFilter, providerFilter, searchKeyword])

  const stats = useMemo(() => {
    const enabledCount = accounts.filter((item) => item.enabled).length
    return {
      total: accounts.length,
      enabled: enabledCount,
      disabled: accounts.length - enabledCount,
      providers: providerOptions.length,
    }
  }, [accounts, providerOptions.length])

  const resetForm = useCallback(() => {
    setForm(DEFAULT_FORM_STATE)
    setEditingAccount(null)
  }, [])

  const openCreateDialog = useCallback(() => {
    resetForm()
    setDialogOpen(true)
  }, [resetForm])

  const openEditDialog = useCallback(async (account: CloudAccountResponse) => {
    setEditingDialogLoading(true)
    setEditingAccount(account)
    setForm(buildCloudAccountFormState(account))
    setDialogOpen(true)

    try {
      const detail = await api.getCloudAccountById(account.id)
      setEditingAccount(detail)
      setForm(buildCloudAccountFormState(detail))
    } catch (error) {
      toastApiError(error, t("cloud.accounts.toastFetchError"))
    } finally {
      setEditingDialogLoading(false)
    }
  }, [t])

  const closeDialog = useCallback(() => {
    setDialogOpen(false)
    setFormSubmitting(false)
    setEditingDialogLoading(false)
  }, [])

  const handleDialogOpenChange = useCallback((open: boolean) => {
    setDialogOpen(open)

    if (!open) {
      setFormSubmitting(false)
      setEditingAccount(null)
      setEditingDialogLoading(false)
    }
  }, [])

  const handleSubmit = useCallback(async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const configKey = form.configKey.trim()
    const provider = form.provider.trim()
    const displayName = form.displayName.trim()
    const description = form.description.trim()

    if (!configKey && !editingAccount) {
      toast.error(t("cloud.accounts.toastConfigKeyRequired"))
      return
    }

    if (!provider && !editingAccount) {
      toast.error(t("cloud.accounts.toastProviderRequired"))
      return
    }

    if (!displayName) {
      toast.error(t("cloud.accounts.toastDisplayNameRequired"))
      return
    }

    const serializedConfig = serializeCloudAccountConfig({
      provider,
      configText: form.configText,
      configFormValues: form.configFormValues,
      locale,
    })

    if (isCloudConfigSerializeError(serializedConfig)) {
      if (serializedConfig.reason === "required" && serializedConfig.fieldLabel) {
        toast.error(
          locale === "zh"
            ? `请填写配置项：${serializedConfig.fieldLabel}`
            : `Config field is required: ${serializedConfig.fieldLabel}`
        )
        return
      }

      toast.error(t("cloud.accounts.toastConfigInvalid"))
      return
    }

    setFormSubmitting(true)

    try {
      if (editingAccount) {
        const payload: UpdateCloudAccountRequest = {
          display_name: displayName,
          description: description || null,
          enabled: form.enabled,
          config: serializedConfig.config,
        }

        await api.updateCloudAccount(editingAccount.id, payload)
        toastSaved(t("cloud.accounts.toastUpdateSuccess"))
      } else {
        const payload: CreateCloudAccountRequest = {
          config_key: configKey,
          provider,
          display_name: displayName,
          description: description || null,
          config: serializedConfig.config,
        }

        await api.createCloudAccount(payload)
        toastCreated(t("cloud.accounts.toastCreateSuccess"))
      }

      setDialogOpen(false)
      await fetchAccounts(true)
    } catch (error) {
      toast.error(
        getApiErrorMessage(
          error,
          editingAccount
            ? t("cloud.accounts.toastUpdateError")
            : t("cloud.accounts.toastCreateError")
        )
      )
    } finally {
      setFormSubmitting(false)
    }
  }, [editingAccount, fetchAccounts, form, locale, t])

  const handleToggleEnabled = useCallback(async (account: CloudAccountResponse) => {
    setTogglingId(account.id)
    try {
      await api.updateCloudAccount(account.id, {
        enabled: !account.enabled,
      })
      toast.success(
        account.enabled
          ? t("cloud.accounts.toastDisableSuccess")
          : t("cloud.accounts.toastEnableSuccess")
      )
      await fetchAccounts(true)
    } catch (error) {
      toastApiError(error, t("cloud.accounts.toastToggleError"))
    } finally {
      setTogglingId(null)
    }
  }, [fetchAccounts, t])

  const handleTestConnection = useCallback(async (account: CloudAccountResponse) => {
    setTestingId(account.id)
    try {
      const result = await api.testCloudAccountConnection(account.id)
      const suffix = result.instance_count != null
        ? ` (${t("cloud.accounts.testResultInstanceCount", { count: result.instance_count })})`
        : ""
      toast.success(`${result.message}${suffix}`)
    } catch (error) {
      toastApiError(error, t("cloud.accounts.toastTestError"))
    } finally {
      setTestingId(null)
    }
  }, [t])

  const handleCollect = useCallback(async (account: CloudAccountResponse) => {
    setCollectingId(account.id)
    try {
      const result = await api.triggerCloudAccountCollection(account.id)
      const suffix = result.collected_count != null
        ? ` (${t("cloud.accounts.collectResultCount", { count: result.collected_count })})`
        : ""
      toast.success(`${result.message}${suffix}`)
      await fetchAccounts(true)
    } catch (error) {
      toastApiError(error, t("cloud.accounts.toastCollectError"))
    } finally {
      setCollectingId(null)
    }
  }, [fetchAccounts, t])

  const handleCopyTestCurl = useCallback(async (account: CloudAccountResponse, insecure = false) => {
    try {
      await copyApiCurlCommand({
        path: `/v1/cloud/accounts/${account.id}/test`,
        method: "POST",
        insecure,
      })
      toastCopied(t("cloud.accounts.toastCopyTestCurlSuccess"))
    } catch {
      toast.error(t("cloud.accounts.toastCopyTestCurlError"))
    }
  }, [t])

  const handleCopyCollectCurl = useCallback(async (account: CloudAccountResponse, insecure = false) => {
    try {
      await copyApiCurlCommand({
        path: `/v1/cloud/accounts/${account.id}/collect`,
        method: "POST",
        insecure,
      })
      toastCopied(t("cloud.accounts.toastCopyCollectCurlSuccess"))
    } catch {
      toast.error(t("cloud.accounts.toastCopyCollectCurlError"))
    }
  }, [t])

  const handleCopyUpdateCurl = useCallback(async (account: CloudAccountResponse, insecure = false) => {
    try {
      await copyApiCurlCommand({
        path: `/v1/cloud/accounts/${account.id}`,
        method: "PUT",
        insecure,
        redactBodySecrets: {
          keepPaths: ["config.token"],
        },
        body: {
          display_name: account.display_name,
          description: account.description,
          enabled: account.enabled,
          config: account.config,
        },
      })
      toastCopied(t("cloud.accounts.toastCopyUpdateCurlSuccess"))
    } catch {
      toast.error(t("cloud.accounts.toastCopyUpdateCurlError"))
    }
  }, [t])

  const handleDelete = useCallback(async () => {
    if (!deleteTarget) {
      return
    }

    setDeleting(true)
    try {
      await api.deleteCloudAccount(deleteTarget.id)
      toastDeleted(t("cloud.accounts.toastDeleteSuccess"))
      setDeleteTarget(null)
      await fetchAccounts(true)
    } catch (error) {
      toastApiError(error, t("cloud.accounts.toastDeleteError"))
    } finally {
      setDeleting(false)
    }
  }, [deleteTarget, fetchAccounts, t])

  const handleCopyCreateCurlFromForm = useCallback(async (insecure = false) => {
    const configKey = form.configKey.trim()
    const provider = form.provider.trim()
    const displayName = form.displayName.trim()
    const description = form.description.trim()

    if (!configKey) {
      toast.error(t("cloud.accounts.toastConfigKeyRequired"))
      return
    }

    if (!provider) {
      toast.error(t("cloud.accounts.toastProviderRequired"))
      return
    }

    if (!displayName) {
      toast.error(t("cloud.accounts.toastDisplayNameRequired"))
      return
    }

    const serializedConfig = serializeCloudAccountConfig({
      provider,
      configText: form.configText,
      configFormValues: form.configFormValues,
      locale,
    })

    if (isCloudConfigSerializeError(serializedConfig)) {
      if (serializedConfig.reason === "required" && serializedConfig.fieldLabel) {
        toast.error(
          locale === "zh"
            ? `请填写配置项：${serializedConfig.fieldLabel}`
            : `Config field is required: ${serializedConfig.fieldLabel}`
        )
        return
      }

      toast.error(t("cloud.accounts.toastConfigInvalid"))
      return
    }

    try {
      await copyApiCurlCommand({
        path: "/v1/cloud/accounts",
        method: "POST",
        insecure,
        redactBodySecrets: {
          keepPaths: ["config.token"],
        },
        body: {
          config_key: configKey,
          provider,
          display_name: displayName,
          description: description || null,
          config: serializedConfig.config,
        },
      })
      toastCopied(t("cloud.accounts.toastCopyCreateCurlDraftSuccess"))
    } catch {
      toast.error(t("cloud.accounts.toastCopyCreateCurlError"))
    }
  }, [form, locale, t])

  const handleCopyUpdateCurlFromForm = useCallback(async (insecure = false) => {
    if (!editingAccount) {
      return
    }

    const displayName = form.displayName.trim()
    const description = form.description.trim()

    if (!displayName) {
      toast.error(t("cloud.accounts.toastDisplayNameRequired"))
      return
    }

    const serializedConfig = serializeCloudAccountConfig({
      provider: form.provider,
      configText: form.configText,
      configFormValues: form.configFormValues,
      locale,
    })

    if (isCloudConfigSerializeError(serializedConfig)) {
      if (serializedConfig.reason === "required" && serializedConfig.fieldLabel) {
        toast.error(
          locale === "zh"
            ? `请填写配置项：${serializedConfig.fieldLabel}`
            : `Config field is required: ${serializedConfig.fieldLabel}`
        )
        return
      }

      toast.error(t("cloud.accounts.toastConfigInvalid"))
      return
    }

    try {
      await copyApiCurlCommand({
        path: `/v1/cloud/accounts/${editingAccount.id}`,
        method: "PUT",
        insecure,
        redactBodySecrets: {
          keepPaths: ["config.token"],
        },
        body: {
          display_name: displayName,
          description: description || null,
          enabled: form.enabled,
          config: serializedConfig.config,
        },
      })
      toastCopied(t("cloud.accounts.toastCopyUpdateCurlDraftSuccess"))
    } catch {
      toast.error(t("cloud.accounts.toastCopyUpdateCurlError"))
    }
  }, [editingAccount, form, locale, t])

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="space-y-1">
          <h2 className="text-2xl font-bold tracking-tight">{t("cloud.accounts.title")}</h2>
          <p className="text-sm text-muted-foreground">{t("cloud.accounts.description")}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button type="button" variant="outline" onClick={() => fetchAccounts(true)} disabled={refreshing}>
            {refreshing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
            {t("cloud.accounts.refreshButton")}
          </Button>
          <Button type="button" onClick={openCreateDialog}>
            <Plus className="mr-2 h-4 w-4" />
            {t("cloud.accounts.createButton")}
          </Button>
        </div>
      </div>

      <CloudAccountsStatsCards
        stats={stats}
        texts={{
          total: t("cloud.accounts.statTotal"),
          enabled: t("cloud.accounts.statEnabled"),
          disabled: t("cloud.accounts.statDisabled"),
          providers: t("cloud.accounts.statProviders"),
        }}
      />

      <CloudAccountsFiltersCard
        searchKeyword={searchKeyword}
        providerFilter={providerFilter}
        enabledFilter={enabledFilter}
        providerOptions={providerOptions}
        onSearchKeywordChange={setSearchKeyword}
        onProviderFilterChange={setProviderFilter}
        onEnabledFilterChange={(value) => setEnabledFilter(value as "all" | "enabled" | "disabled")}
        texts={{
          title: t("cloud.accounts.filtersTitle"),
          description: t("cloud.accounts.filtersDescription"),
          filterSearch: t("cloud.accounts.filterSearch"),
          filterSearchPlaceholder: t("cloud.accounts.filterSearchPlaceholder"),
          filterProvider: t("cloud.accounts.filterProvider"),
          filterProviderAll: t("cloud.accounts.filterProviderAll"),
          filterStatus: t("cloud.accounts.filterStatus"),
          filterStatusAll: t("cloud.accounts.filterStatusAll"),
          filterStatusEnabled: t("cloud.accounts.filterStatusEnabled"),
          filterStatusDisabled: t("cloud.accounts.filterStatusDisabled"),
        }}
      />

      <CloudAccountsTableCard
        loading={loading}
        locale={locale}
        accounts={filteredAccounts}
        testingId={testingId}
        collectingId={collectingId}
        togglingId={togglingId}
        onToggleEnabled={handleToggleEnabled}
        onTestConnection={handleTestConnection}
        onCollect={handleCollect}
        onCopyTestCurl={handleCopyTestCurl}
        onCopyCollectCurl={handleCopyCollectCurl}
        onCopyUpdateCurl={handleCopyUpdateCurl}
        onEdit={openEditDialog}
        onDelete={setDeleteTarget}
        formatDateTime={formatDateTime}
        texts={{
          title: t("cloud.accounts.tableTitle"),
          description: t("cloud.accounts.tableDescription"),
          colName: t("cloud.accounts.tableColName"),
          colConfigKey: t("cloud.accounts.tableColConfigKey"),
          colProvider: t("cloud.accounts.tableColProvider"),
          colStatus: t("cloud.accounts.tableColStatus"),
          colUpdatedAt: t("cloud.accounts.tableColUpdatedAt"),
          colActions: t("cloud.accounts.tableColActions"),
          tableLoading: t("cloud.accounts.tableLoading"),
          tableEmpty: t("cloud.accounts.tableEmpty"),
          toggleEnabledLabel: t("cloud.accounts.toggleEnabledLabel"),
          statusEnabled: t("cloud.accounts.statusEnabled"),
          statusDisabled: t("cloud.accounts.statusDisabled"),
          actionTest: t("cloud.accounts.actionTest"),
          actionCollect: t("cloud.accounts.actionCollect"),
          actionMore: t("cloud.accounts.actionMore"),
          actionDebugCurl: t("cloud.accounts.actionDebugCurl"),
          actionCopyTestCurl: t("cloud.accounts.actionCopyTestCurl"),
          actionCopyCollectCurl: t("cloud.accounts.actionCopyCollectCurl"),
          actionCopyUpdateCurl: t("cloud.accounts.actionCopyUpdateCurl"),
          actionEdit: t("cloud.accounts.actionEdit"),
          actionDelete: t("cloud.accounts.actionDelete"),
          debugMenuLabel: t("cloud.accounts.debugMenuLabel"),
          copyApiCurlNormal: t("cloud.accounts.copyApiCurlNormal"),
          copyApiCurlInsecure: t("cloud.accounts.copyApiCurlInsecure"),
          copyApiCurlInsecureBadge: t("cloud.accounts.copyApiCurlInsecureBadge"),
        }}
      />

      <Dialog open={dialogOpen} onOpenChange={handleDialogOpenChange}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle>
              {editingAccount ? t("cloud.accounts.dialogEditTitle") : t("cloud.accounts.dialogCreateTitle")}
            </DialogTitle>
            <DialogDescription>
              {editingAccount ? t("cloud.accounts.dialogEditDescription") : t("cloud.accounts.dialogCreateDescription")}
            </DialogDescription>
          </DialogHeader>

          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="cloud-config-key">{t("cloud.accounts.fieldConfigKey")}</Label>
                <Input
                  id="cloud-config-key"
                  value={form.configKey}
                  onChange={(event) => setForm((prev) => ({ ...prev, configKey: event.target.value }))}
                  placeholder={t("cloud.accounts.fieldConfigKeyPlaceholder")}
                  disabled={Boolean(editingAccount)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cloud-provider">{t("cloud.accounts.fieldProvider")}</Label>
                <Select
                  value={providerSelectValue}
                  disabled={Boolean(editingAccount)}
                  onValueChange={(value) => {
                    if (value === "__custom__") {
                      return
                    }

                    const nextDefaults = getDefaultCloudProviderConfigFormValues(value)

                    setForm((prev) => ({
                      ...prev,
                      provider: value,
                      configFormValues: {
                        ...nextDefaults,
                        ...prev.configFormValues,
                      },
                    }))
                  }}
                >
                  <SelectTrigger id="cloud-provider" className="w-full">
                    <SelectValue placeholder={t("cloud.accounts.fieldProviderPlaceholder")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="tencent">Tencent</SelectItem>
                    <SelectItem value="alibaba">Alibaba / Aliyun</SelectItem>
                    <SelectItem value="aws">AWS</SelectItem>
                    <SelectItem value="huawei">Huawei Cloud</SelectItem>
                    <SelectItem value="azure">Azure</SelectItem>
                    <SelectItem value="__custom__">{locale === "zh" ? "自定义" : "Custom"}</SelectItem>
                  </SelectContent>
                </Select>
                {providerSelectValue === "__custom__" ? (
                  <Input
                    value={form.provider}
                    onChange={(event) => {
                      const nextProvider = event.target.value
                      const nextDefaults = getDefaultCloudProviderConfigFormValues(nextProvider)

                      setForm((prev) => ({
                        ...prev,
                        provider: nextProvider,
                        configFormValues: {
                          ...nextDefaults,
                          ...prev.configFormValues,
                        },
                      }))
                    }}
                    placeholder={t("cloud.accounts.fieldProviderPlaceholder")}
                    disabled={Boolean(editingAccount)}
                  />
                ) : null}
                <div className="space-y-1">
                  {providerAliasTarget ? (
                    <p className="text-xs text-muted-foreground">
                      {locale === "zh"
                        ? `已识别供应商别名，将按 ${providerAliasTarget} 字段模板展示与提交。`
                        : `Provider alias recognized. Using the ${providerAliasTarget} field template for display and submit.`}
                    </p>
                  ) : null}
                  {providerSelectValue !== "__custom__" ? (
                    <p className="text-xs text-muted-foreground">
                      {locale === "zh"
                        ? "已启用结构化配置表单，提交时会自动组装 JSON。"
                        : "Structured config form is enabled and JSON will be assembled automatically on submit."}
                    </p>
                  ) : null}
                </div>
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="cloud-display-name">{t("cloud.accounts.fieldDisplayName")}</Label>
                <Input
                  id="cloud-display-name"
                  value={form.displayName}
                  onChange={(event) => setForm((prev) => ({ ...prev, displayName: event.target.value }))}
                  placeholder={t("cloud.accounts.fieldDisplayNamePlaceholder")}
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="cloud-description">{t("cloud.accounts.fieldDescription")}</Label>
                <Textarea
                  id="cloud-description"
                  rows={3}
                  value={form.description}
                  onChange={(event) => setForm((prev) => ({ ...prev, description: event.target.value }))}
                  placeholder={t("cloud.accounts.fieldDescriptionPlaceholder")}
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <div className="flex items-center justify-between rounded-md border px-3 py-2">
                  <div>
                    <p className="text-sm font-medium">{t("cloud.accounts.fieldEnabled")}</p>
                    <p className="text-xs text-muted-foreground">
                      {form.enabled ? t("cloud.accounts.statusEnabled") : t("cloud.accounts.statusDisabled")}
                    </p>
                  </div>
                  <Switch
                    checked={form.enabled}
                    onCheckedChange={(checked) => setForm((prev) => ({ ...prev, enabled: checked }))}
                    disabled={false}
                  />
                </div>
              </div>
              <CloudAccountConfigFields
                locale={locale}
                provider={form.provider}
                form={form}
                setForm={setForm}
                configJsonLabel={t("cloud.accounts.fieldConfigJson")}
                configJsonPlaceholder={t("cloud.accounts.fieldConfigJsonPlaceholder")}
              />
            </div>

            <DialogFooter className="gap-2 sm:justify-between">
              <Button type="button" variant="outline" onClick={closeDialog} disabled={formSubmitting}>
                {t("cloud.accounts.dialogCancel")}
              </Button>
              <div className="flex w-full flex-col-reverse gap-2 sm:w-auto sm:flex-row">
                {!editingAccount ? (
                  <CopyCurlDropdown
                    texts={{
                      title: t("cloud.accounts.dialogCopyCreateCurl"),
                      normal: t("cloud.accounts.copyApiCurlNormal"),
                      insecure: t("cloud.accounts.copyApiCurlInsecure"),
                    }}
                    onCopy={handleCopyCreateCurlFromForm}
                    triggerLabel={t("cloud.accounts.dialogCopyCreateCurl")}
                    preferenceKeyId="cloud-accounts-dialog-copy-create-curl"
                    triggerSuffix={<HttpMethodBadge method="POST" className="ml-2" />}
                    disabled={formSubmitting}
                    tooltip={{
                      title: t("cloud.accounts.dialogCopyCreateCurl"),
                      description: t("cloud.accounts.copyApiCurlHintWrite"),
                    }}
                    insecureBadgeLabel={t("cloud.accounts.copyApiCurlInsecureBadge")}
                  />
                ) : (
                  <CopyCurlDropdown
                    texts={{
                      title: t("cloud.accounts.dialogCopyUpdateCurl"),
                      normal: t("cloud.accounts.copyApiCurlNormal"),
                      insecure: t("cloud.accounts.copyApiCurlInsecure"),
                    }}
                    onCopy={handleCopyUpdateCurlFromForm}
                    triggerLabel={t("cloud.accounts.dialogCopyUpdateCurl")}
                    preferenceKeyId="cloud-accounts-dialog-copy-update-curl"
                    triggerSuffix={<HttpMethodBadge method="PUT" className="ml-2" />}
                    disabled={formSubmitting}
                    tooltip={{
                      title: t("cloud.accounts.dialogCopyUpdateCurl"),
                      description: t("cloud.accounts.copyApiCurlHintWrite"),
                    }}
                    insecureBadgeLabel={t("cloud.accounts.copyApiCurlInsecureBadge")}
                  />
                )}
                <Button type="submit" disabled={formSubmitting || editingDialogLoading}>
                  {formSubmitting || editingDialogLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  {editingAccount ? t("cloud.accounts.dialogUpdateSubmit") : t("cloud.accounts.dialogCreateSubmit")}
                </Button>
              </div>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={Boolean(deleteTarget)} onOpenChange={(open) => {
        if (!open && !deleting) {
          setDeleteTarget(null)
        }
      }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("cloud.accounts.deleteDialogTitle")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("cloud.accounts.deleteDialogDescription", {
                name: deleteTarget?.display_name || "-",
              })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>{t("cloud.accounts.deleteDialogCancel")}</AlertDialogCancel>
            <AlertDialogAction variant="destructive" onClick={handleDelete} disabled={deleting}>
              {deleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              {t("cloud.accounts.deleteDialogConfirm")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
