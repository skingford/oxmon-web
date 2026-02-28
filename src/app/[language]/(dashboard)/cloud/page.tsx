"use client"

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react"
import { Loader2, Plus, RefreshCw } from "lucide-react"
import { toast, toastApiError, toastCopied, toastCreated, toastDeleted, toastSaved } from "@/lib/toast"
import { api, getApiErrorMessage } from "@/lib/api"
import { copyApiCurlCommand } from "@/lib/api-curl"
import { useAppTranslations } from "@/hooks/use-app-translations"
import { useRequestState } from "@/hooks/use-request-state"
import type {
  BatchCreateCloudAccountsRequest,
  CloudAccountResponse,
  CreateCloudAccountRequest,
  UpdateCloudAccountRequest,
} from "@/types/api"
import { Button } from "@/components/ui/button"
import { CloudAccountsFiltersCard } from "@/components/pages/cloud/cloud-accounts-filters-card"
import { CloudAccountBatchImportDialog } from "@/components/pages/cloud/cloud-account-batch-import-dialog"
import { CloudAccountDialog, type CloudAccountFormState } from "@/components/pages/cloud/cloud-account-dialog"
import { CloudAccountsStatsCards } from "@/components/pages/cloud/cloud-accounts-stats-cards"
import { CloudAccountsTableCard } from "@/components/pages/cloud/cloud-accounts-table-card"
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

const DEFAULT_FORM_STATE: CloudAccountFormState = {
  configKey: "",
  provider: "tencent",
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
  const [formSubmitting, setFormSubmitting] = useState(false)
  const [editingDialogLoading, setEditingDialogLoading] = useState(false)
  const [batchDialogOpen, setBatchDialogOpen] = useState(false)
  const [batchProvider, setBatchProvider] = useState<(typeof BUILT_IN_CLOUD_PROVIDERS)[number]>("tencent")
  const [batchCollectionIntervalSecs, setBatchCollectionIntervalSecs] = useState("300")
  const [batchText, setBatchText] = useState("")
  const [batchSubmitting, setBatchSubmitting] = useState(false)

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

  const resetBatchForm = useCallback(() => {
    setBatchProvider("tencent")
    setBatchCollectionIntervalSecs("300")
    setBatchText("")
    setBatchSubmitting(false)
  }, [])

  const openCreateDialog = useCallback(() => {
    resetForm()
    setDialogOpen(true)
  }, [resetForm])

  const handleBatchDialogOpenChange = useCallback((open: boolean) => {
    setBatchDialogOpen(open)

    if (!open) {
      resetBatchForm()
    }
  }, [resetBatchForm])

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

  const handleBatchImport = useCallback(async () => {
    const normalizedProvider = normalizeCloudProvider(batchProvider)
    const text = batchText.trim()

    if (!text) {
      toast.error(t("cloud.accounts.toastBatchTextRequired"))
      return
    }

    const intervalText = batchCollectionIntervalSecs.trim()
    let collectionIntervalSecs: number | null = null

    if (intervalText) {
      const parsedValue = Number(intervalText)

      if (!Number.isFinite(parsedValue) || parsedValue <= 0) {
        toast.error(t("cloud.accounts.toastBatchIntervalInvalid"))
        return
      }

      collectionIntervalSecs = Math.floor(parsedValue)
    }

    setBatchSubmitting(true)

    try {
      const payload: BatchCreateCloudAccountsRequest = {
        provider: normalizedProvider,
        text,
        collection_interval_secs: collectionIntervalSecs,
      }
      const result = await api.batchCreateCloudAccounts(payload)
      const errorCount = result.errors.length

      if (errorCount > 0) {
        toast.warning(
          t("cloud.accounts.toastBatchPartial", {
            created: result.created,
            skipped: result.skipped,
            errors: errorCount,
          })
        )
        const previewMessage = result.errors.slice(0, 3).join("；")
        if (previewMessage) {
          toast.error(previewMessage)
        }
      } else {
        toast.success(
          t("cloud.accounts.toastBatchSuccess", {
            created: result.created,
            skipped: result.skipped,
          })
        )
      }

      setBatchDialogOpen(false)
      resetBatchForm()
      await fetchAccounts(true)
    } catch (error) {
      toastApiError(error, t("cloud.accounts.toastBatchError"))
    } finally {
      setBatchSubmitting(false)
    }
  }, [batchCollectionIntervalSecs, batchProvider, batchText, fetchAccounts, resetBatchForm, t])

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
          <CloudAccountBatchImportDialog
            open={batchDialogOpen}
            onOpenChange={handleBatchDialogOpenChange}
            provider={batchProvider}
            onProviderChange={(value) => setBatchProvider(value as (typeof BUILT_IN_CLOUD_PROVIDERS)[number])}
            collectionIntervalSecs={batchCollectionIntervalSecs}
            onCollectionIntervalSecsChange={setBatchCollectionIntervalSecs}
            textValue={batchText}
            onTextValueChange={setBatchText}
            submitting={batchSubmitting}
            onSubmit={handleBatchImport}
            texts={{
              trigger: t("cloud.accounts.batchButton"),
              title: t("cloud.accounts.batchDialogTitle"),
              description: t("cloud.accounts.batchDialogDescription"),
              fieldProvider: t("cloud.accounts.batchFieldProvider"),
              fieldCollectionInterval: t("cloud.accounts.batchFieldCollectionInterval"),
              fieldCollectionIntervalPlaceholder: t("cloud.accounts.batchFieldCollectionIntervalPlaceholder"),
              fieldText: t("cloud.accounts.batchFieldText"),
              fieldTextHint: t("cloud.accounts.batchFieldTextHint"),
              fieldTextPlaceholder: t("cloud.accounts.batchFieldTextPlaceholder"),
              cancel: t("cloud.accounts.batchDialogCancel"),
              submit: t("cloud.accounts.batchDialogSubmit"),
            }}
          />
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

      <CloudAccountDialog
        open={dialogOpen}
        isEditing={Boolean(editingAccount)}
        locale={locale}
        providerSelectValue={providerSelectValue}
        form={form}
        formSubmitting={formSubmitting}
        editingDialogLoading={editingDialogLoading}
        onOpenChange={handleDialogOpenChange}
        onCancel={closeDialog}
        onSubmit={handleSubmit}
        setForm={setForm}
        t={t}
      />

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
