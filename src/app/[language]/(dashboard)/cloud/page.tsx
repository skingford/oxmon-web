"use client"

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react"
import { Eye, EyeOff, Loader2, Plus, RefreshCw } from "lucide-react"
import { toast, toastApiError, toastCopied, toastCreated, toastDeleted, toastSaved } from "@/lib/toast"
import { api, getApiErrorMessage } from "@/lib/api"
import { copyApiCurlCommand } from "@/lib/api-curl"
import { useAppTranslations } from "@/hooks/use-app-translations"
import { useRequestState } from "@/hooks/use-request-state"
import type { CloudAccountResponse, CreateCloudAccountRequest, UpdateCloudAccountRequest } from "@/types/api"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { CloudAccountsFiltersCard } from "@/components/pages/cloud/cloud-accounts-filters-card"
import { CloudAccountsStatsCards } from "@/components/pages/cloud/cloud-accounts-stats-cards"
import { CloudAccountsTableCard } from "@/components/pages/cloud/cloud-accounts-table-card"
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
  accountName: string
  description: string
  secretId: string
  secretKey: string
  regionsText: string
  collectionIntervalSecs: string
  enabled: boolean
}

const DEFAULT_FORM_STATE: CloudAccountFormState = {
  configKey: "",
  provider: "",
  displayName: "",
  accountName: "",
  description: "",
  secretId: "",
  secretKey: "",
  regionsText: "",
  collectionIntervalSecs: "300",
  enabled: true,
}

const CLOUD_PROVIDER_ALIASES: Record<string, string> = {
  aliyun: "alibaba",
  alicloud: "alibaba",
  alibabacloud: "alibaba",
  tencentcloud: "tencent",
  qcloud: "tencent",
}

const BUILT_IN_CLOUD_PROVIDERS = ["tencent", "alibaba"] as const

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

function normalizeCloudProvider(provider: string) {
  const normalized = provider.trim().toLowerCase()
  return CLOUD_PROVIDER_ALIASES[normalized] || normalized
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
    accountName: account.account_name,
    description: account.description ?? "",
    secretId: account.secret_id ?? "",
    secretKey: account.secret_key ?? "",
    regionsText: (account.regions || []).join(", "),
    collectionIntervalSecs: String(account.collection_interval_secs || 300),
    enabled: account.enabled,
  }
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
  const [showSecretKey, setShowSecretKey] = useState(false)
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
        item.account_name,
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
    setShowSecretKey(false)
  }, [])

  const handleDialogOpenChange = useCallback((open: boolean) => {
    setDialogOpen(open)

    if (!open) {
      setFormSubmitting(false)
      setEditingAccount(null)
      setEditingDialogLoading(false)
      setShowSecretKey(false)
    }
  }, [])

  const handleSubmit = useCallback(async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const displayName = form.displayName.trim()
    const description = form.description.trim()

    if (!displayName) {
      toast.error(t("cloud.accounts.toastDisplayNameRequired"))
      return
    }

    setFormSubmitting(true)

    try {
      if (editingAccount) {
        const secretId = form.secretId.trim()
        const secretKey = form.secretKey.trim()
        const regions = parseDelimitedValues(form.regionsText)

        const payload: UpdateCloudAccountRequest = {
          display_name: displayName,
          description: description || null,
          account_name: form.accountName.trim() || null,
          enabled: form.enabled,
        }

        if (!secretId) {
          toast.error(locale === "zh" ? "请填写 SecretId / AccessKey ID" : "Please provide SecretId / AccessKey ID")
          return
        }

        if (!secretKey) {
          toast.error(locale === "zh" ? "请填写 SecretKey / AccessKey Secret" : "Please provide SecretKey / AccessKey Secret")
          return
        }

        if (regions.length === 0) {
          toast.error(locale === "zh" ? "请至少填写一个地域" : "Please provide at least one region")
          return
        }

        const baseCollectionIntervalSecsValue = form.collectionIntervalSecs.trim()
        if (baseCollectionIntervalSecsValue) {
          const interval = Number(baseCollectionIntervalSecsValue)
          if (!Number.isFinite(interval) || interval <= 0) {
            toast.error(locale === "zh" ? "采集间隔必须是正整数（秒）" : "Collection interval must be a positive integer")
            return
          }
          payload.collection_interval_secs = interval
        } else {
          payload.collection_interval_secs = null
        }

        payload.secret_id = secretId
        payload.secret_key = secretKey
        payload.regions = regions

        await api.updateCloudAccount(editingAccount.id, payload)
        toastSaved(t("cloud.accounts.toastUpdateSuccess"))
      } else {
        const configKey = form.configKey.trim()
        const provider = form.provider.trim()
        const accountName = form.accountName.trim()
        const secretId = form.secretId.trim()
        const secretKey = form.secretKey.trim()
        const regions = parseDelimitedValues(form.regionsText)
        const collectionIntervalSecsValue = form.collectionIntervalSecs.trim()

        if (!configKey) {
          toast.error(t("cloud.accounts.toastConfigKeyRequired"))
          return
        }

        if (!provider) {
          toast.error(t("cloud.accounts.toastProviderRequired"))
          return
        }

        if (!accountName) {
          toast.error(locale === "zh" ? "请输入云账号名称" : "Please enter account name")
          return
        }

        if (!secretId) {
          toast.error(locale === "zh" ? "请填写 SecretId / AccessKey ID" : "Please provide SecretId / AccessKey ID")
          return
        }

        if (!secretKey) {
          toast.error(locale === "zh" ? "请填写 SecretKey / AccessKey Secret" : "Please provide SecretKey / AccessKey Secret")
          return
        }

        if (regions.length === 0) {
          toast.error(locale === "zh" ? "请至少填写一个地域" : "Please provide at least one region")
          return
        }

        const collectionIntervalSecs = collectionIntervalSecsValue
          ? Number(collectionIntervalSecsValue)
          : null

        if (collectionIntervalSecsValue && (!Number.isFinite(collectionIntervalSecs) || collectionIntervalSecs <= 0)) {
          toast.error(locale === "zh" ? "采集间隔必须是正整数（秒）" : "Collection interval must be a positive integer")
          return
        }

        const payload: CreateCloudAccountRequest = {
          config_key: configKey,
          provider,
          display_name: displayName,
          description: description || null,
          account_name: accountName,
          secret_id: secretId,
          secret_key: secretKey,
          regions,
          collection_interval_secs: collectionIntervalSecs,
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
          keepPaths: [],
        },
        body: {
          display_name: account.display_name,
          description: account.description,
          account_name: account.account_name,
          secret_id: account.secret_id,
          secret_key: account.secret_key,
          regions: account.regions,
          collection_interval_secs: account.collection_interval_secs,
          enabled: account.enabled,
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
            {editingAccount ? (
              <div className="space-y-4">
                <div className="space-y-4 rounded-md border p-4">
                  <p className="text-sm font-medium">{locale === "zh" ? "基础配置" : "Basic Config"}</p>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="cloud-config-key">{t("cloud.accounts.fieldConfigKey")}</Label>
                      <Input
                        id="cloud-config-key"
                        value={form.configKey}
                        onChange={(event) => setForm((prev) => ({ ...prev, configKey: event.target.value }))}
                        placeholder={t("cloud.accounts.fieldConfigKeyPlaceholder")}
                        disabled
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="cloud-provider">{t("cloud.accounts.fieldProvider")}</Label>
                      <Input
                        id="cloud-provider"
                        value={form.provider}
                        onChange={(event) => setForm((prev) => ({ ...prev, provider: event.target.value }))}
                        placeholder={t("cloud.accounts.fieldProviderPlaceholder")}
                        disabled
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="cloud-display-name">{t("cloud.accounts.fieldDisplayName")}</Label>
                      <Input
                        id="cloud-display-name"
                        value={form.displayName}
                        onChange={(event) => setForm((prev) => ({ ...prev, displayName: event.target.value }))}
                        placeholder={t("cloud.accounts.fieldDisplayNamePlaceholder")}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="cloud-description">{t("cloud.accounts.fieldDescription")}</Label>
                      <Textarea
                        id="cloud-description"
                        rows={3}
                        value={form.description}
                        onChange={(event) => setForm((prev) => ({ ...prev, description: event.target.value }))}
                        placeholder={t("cloud.accounts.fieldDescriptionPlaceholder")}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="cloud-account-name">
                        {locale === "zh" ? "云账号名称" : "Account Name"}
                      </Label>
                      <Input
                        id="cloud-account-name"
                        value={form.accountName}
                        onChange={(event) => setForm((prev) => ({ ...prev, accountName: event.target.value }))}
                        placeholder={locale === "zh" ? "例如：生产主账号" : "e.g. Production Main Account"}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="cloud-collection-interval">
                        {locale === "zh" ? "采集间隔（秒）" : "Collection Interval (seconds)"}
                      </Label>
                      <Input
                        id="cloud-collection-interval"
                        type="number"
                        min={1}
                        step={1}
                        value={form.collectionIntervalSecs}
                        onChange={(event) => setForm((prev) => ({ ...prev, collectionIntervalSecs: event.target.value }))}
                        placeholder="300"
                      />
                    </div>
                    <div className="space-y-2">
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
                  </div>
                </div>

                <div className="space-y-4 rounded-md border p-4">
                  <p className="text-sm font-medium">{locale === "zh" ? "云配置" : "Cloud Config"}</p>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="cloud-secret-id">
                        {locale === "zh" ? "SecretId / AccessKey ID" : "SecretId / AccessKey ID"}
                      </Label>
                      <Input
                        id="cloud-secret-id"
                        value={form.secretId}
                        onChange={(event) => setForm((prev) => ({ ...prev, secretId: event.target.value }))}
                        placeholder={locale === "zh" ? "请输入密钥 ID" : "Enter key ID"}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="cloud-secret-key">
                        {locale === "zh" ? "SecretKey / AccessKey Secret" : "SecretKey / AccessKey Secret"}
                      </Label>
                      <div className="relative">
                        <Input
                          id="cloud-secret-key"
                          type={showSecretKey ? "text" : "password"}
                          value={form.secretKey}
                          onChange={(event) => setForm((prev) => ({ ...prev, secretKey: event.target.value }))}
                          placeholder={locale === "zh" ? "请输入密钥 Secret" : "Enter key secret"}
                          className="pr-10"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="absolute top-1/2 right-1 h-8 w-8 -translate-y-1/2"
                          onClick={() => setShowSecretKey((prev) => !prev)}
                          aria-label={showSecretKey
                            ? locale === "zh" ? "隐藏密钥" : "Hide secret"
                            : locale === "zh" ? "显示密钥" : "Show secret"}
                          aria-pressed={showSecretKey}
                        >
                          {showSecretKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                      </div>
                    </div>
                    <div className="space-y-2 md:col-span-2">
                      <Label htmlFor="cloud-regions">
                        {locale === "zh" ? "地域列表" : "Regions"}
                      </Label>
                      <Input
                        id="cloud-regions"
                        value={form.regionsText}
                        onChange={(event) => setForm((prev) => ({ ...prev, regionsText: event.target.value }))}
                        placeholder={locale === "zh" ? "例如：ap-shanghai, ap-guangzhou" : "e.g. ap-shanghai, ap-guangzhou"}
                      />
                      <p className="text-xs text-muted-foreground">
                        {locale === "zh" ? "多个地域可用逗号或换行分隔" : "Separate multiple regions with commas or new lines"}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="space-y-4 rounded-md border p-4">
                  <p className="text-sm font-medium">{locale === "zh" ? "基础信息" : "Basic Info"}</p>
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
                          setForm((prev) => ({
                            ...prev,
                            provider: value,
                          }))
                        }}
                      >
                        <SelectTrigger id="cloud-provider" className="w-full">
                          <SelectValue placeholder={t("cloud.accounts.fieldProviderPlaceholder")} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="tencent">Tencent</SelectItem>
                          <SelectItem value="alibaba">Alibaba / Aliyun</SelectItem>
                          <SelectItem value="__custom__">{locale === "zh" ? "自定义" : "Custom"}</SelectItem>
                        </SelectContent>
                      </Select>
                      {providerSelectValue === "__custom__" ? (
                        <Input
                          value={form.provider}
                          onChange={(event) => {
                            setForm((prev) => ({
                              ...prev,
                              provider: event.target.value,
                            }))
                          }}
                          placeholder={t("cloud.accounts.fieldProviderPlaceholder")}
                          disabled={Boolean(editingAccount)}
                        />
                      ) : null}
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
                  </div>
                </div>

                <div className="space-y-4 rounded-md border p-4">
                  <p className="text-sm font-medium">{locale === "zh" ? "云配置" : "Cloud Config"}</p>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2 md:col-span-2">
                      <Label htmlFor="cloud-account-name">
                        {locale === "zh" ? "云账号名称" : "Account Name"}
                      </Label>
                      <Input
                        id="cloud-account-name"
                        value={form.accountName}
                        onChange={(event) => setForm((prev) => ({ ...prev, accountName: event.target.value }))}
                        placeholder={locale === "zh" ? "例如：生产主账号" : "e.g. Production Main Account"}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="cloud-secret-id">
                        {locale === "zh" ? "SecretId / AccessKey ID" : "SecretId / AccessKey ID"}
                      </Label>
                      <Input
                        id="cloud-secret-id"
                        value={form.secretId}
                        onChange={(event) => setForm((prev) => ({ ...prev, secretId: event.target.value }))}
                        placeholder={locale === "zh" ? "请输入密钥 ID" : "Enter key ID"}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="cloud-secret-key">
                        {locale === "zh" ? "SecretKey / AccessKey Secret" : "SecretKey / AccessKey Secret"}
                      </Label>
                      <div className="relative">
                        <Input
                          id="cloud-secret-key"
                          type={showSecretKey ? "text" : "password"}
                          value={form.secretKey}
                          onChange={(event) => setForm((prev) => ({ ...prev, secretKey: event.target.value }))}
                          placeholder={locale === "zh" ? "请输入密钥 Secret" : "Enter key secret"}
                          className="pr-10"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="absolute top-1/2 right-1 h-8 w-8 -translate-y-1/2"
                          onClick={() => setShowSecretKey((prev) => !prev)}
                          aria-label={showSecretKey
                            ? locale === "zh" ? "隐藏密钥" : "Hide secret"
                            : locale === "zh" ? "显示密钥" : "Show secret"}
                          aria-pressed={showSecretKey}
                        >
                          {showSecretKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                      </div>
                    </div>
                    <div className="space-y-2 md:col-span-2">
                      <Label htmlFor="cloud-regions">
                        {locale === "zh" ? "地域列表" : "Regions"}
                      </Label>
                      <Input
                        id="cloud-regions"
                        value={form.regionsText}
                        onChange={(event) => setForm((prev) => ({ ...prev, regionsText: event.target.value }))}
                        placeholder={locale === "zh" ? "例如：ap-shanghai, ap-guangzhou" : "e.g. ap-shanghai, ap-guangzhou"}
                      />
                      <p className="text-xs text-muted-foreground">
                        {locale === "zh" ? "多个地域可用逗号或换行分隔" : "Separate multiple regions with commas or new lines"}
                      </p>
                    </div>
                    <div className="space-y-2 md:col-span-2">
                      <Label htmlFor="cloud-collection-interval">
                        {locale === "zh" ? "采集间隔（秒）" : "Collection Interval (seconds)"}
                      </Label>
                      <Input
                        id="cloud-collection-interval"
                        type="number"
                        min={1}
                        step={1}
                        value={form.collectionIntervalSecs}
                        onChange={(event) => setForm((prev) => ({ ...prev, collectionIntervalSecs: event.target.value }))}
                        placeholder="300"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            <DialogFooter className="flex gap-2 sm:justify-end">
              <Button type="button" variant="outline" onClick={closeDialog} disabled={formSubmitting}>
                {t("cloud.accounts.dialogCancel")}
              </Button>
              <Button type="submit" disabled={formSubmitting || editingDialogLoading}>
                {formSubmitting || editingDialogLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                {editingAccount ? t("cloud.accounts.dialogUpdateSubmit") : t("cloud.accounts.dialogCreateSubmit")}
              </Button>
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
