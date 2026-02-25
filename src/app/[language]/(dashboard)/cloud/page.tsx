"use client"

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react"
import { Loader2, Plus, RefreshCw } from "lucide-react"
import { toast, toastApiError, toastCopied, toastCreated, toastDeleted, toastSaved } from "@/lib/toast"
import { api, getApiErrorMessage } from "@/lib/api"
import { copyApiCurlCommand } from "@/lib/api-curl"
import { useAppTranslations } from "@/hooks/use-app-translations"
import { useRequestState } from "@/hooks/use-request-state"
import type { CloudAccountResponse, CreateCloudAccountRequest, UpdateCloudAccountRequest } from "@/types/api"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { CopyCurlDropdown, CopyCurlSubmenu } from "@/components/ui/copy-curl-dropdown"
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
}

const DEFAULT_FORM_STATE: CloudAccountFormState = {
  configKey: "",
  provider: "",
  displayName: "",
  description: "",
  enabled: true,
  configText: "{\n  \n}",
}

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

function parseJsonText(value: string) {
  return JSON.parse(value)
}

function getProviderOptions(accounts: CloudAccountResponse[]) {
  return Array.from(
    new Set(accounts.map((item) => item.provider?.trim()).filter((item): item is string => Boolean(item)))
  ).sort((a, b) => a.localeCompare(b))
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

  const openEditDialog = useCallback((account: CloudAccountResponse) => {
    setEditingAccount(account)
    setForm({
      configKey: account.config_key,
      provider: account.provider,
      displayName: account.display_name,
      description: account.description ?? "",
      enabled: account.enabled,
      configText: normalizeJsonText(account.config),
    })
    setDialogOpen(true)
  }, [])

  const closeDialog = useCallback(() => {
    setDialogOpen(false)
    setFormSubmitting(false)
  }, [])

  const handleDialogOpenChange = useCallback((open: boolean) => {
    setDialogOpen(open)

    if (!open) {
      setFormSubmitting(false)
      setEditingAccount(null)
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

    let config: unknown
    try {
      config = parseJsonText(form.configText)
    } catch {
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
          config,
        }

        await api.updateCloudAccount(editingAccount.id, payload)
        toastSaved(t("cloud.accounts.toastUpdateSuccess"))
      } else {
        const payload: CreateCloudAccountRequest = {
          config_key: configKey,
          provider,
          display_name: displayName,
          description: description || null,
          config,
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
  }, [editingAccount, fetchAccounts, form, t])

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

    let config: unknown
    try {
      config = parseJsonText(form.configText)
    } catch {
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
          config,
        },
      })
      toastCopied(t("cloud.accounts.toastCopyCreateCurlDraftSuccess"))
    } catch {
      toast.error(t("cloud.accounts.toastCopyCreateCurlError"))
    }
  }, [form, t])

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

    let config: unknown
    try {
      config = parseJsonText(form.configText)
    } catch {
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
          config,
        },
      })
      toastCopied(t("cloud.accounts.toastCopyUpdateCurlDraftSuccess"))
    } catch {
      toast.error(t("cloud.accounts.toastCopyUpdateCurlError"))
    }
  }, [editingAccount, form, t])

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
                <Input
                  id="cloud-provider"
                  value={form.provider}
                  onChange={(event) => setForm((prev) => ({ ...prev, provider: event.target.value }))}
                  placeholder={t("cloud.accounts.fieldProviderPlaceholder")}
                  disabled={Boolean(editingAccount)}
                />
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
              <div className="space-y-2 md:col-span-2">
                <Label>{t("cloud.accounts.fieldConfigJson")}</Label>
                <JsonTextarea
                  value={form.configText}
                  onChange={(value) => setForm((prev) => ({ ...prev, configText: value }))}
                  placeholder={t("cloud.accounts.fieldConfigJsonPlaceholder")}
                  rows={12}
                  maxHeightClassName="max-h-[360px]"
                />
              </div>
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
                <Button type="submit" disabled={formSubmitting}>
                  {formSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
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
