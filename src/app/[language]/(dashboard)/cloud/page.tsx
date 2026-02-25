"use client"

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react"
import { Loader2, Play, Plus, RefreshCw, Search, TestTube2, Trash2 } from "lucide-react"
import { toast } from "sonner"
import { api, getApiErrorMessage } from "@/lib/api"
import { useAppTranslations } from "@/hooks/use-app-translations"
import { useRequestState } from "@/hooks/use-request-state"
import type { CloudAccountResponse, CreateCloudAccountRequest, UpdateCloudAccountRequest } from "@/types/api"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
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
            toast.error(getApiErrorMessage(error, t("cloud.accounts.toastFetchError")))
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
        toast.success(t("cloud.accounts.toastUpdateSuccess"))
      } else {
        const payload: CreateCloudAccountRequest = {
          config_key: configKey,
          provider,
          display_name: displayName,
          description: description || null,
          config,
        }

        await api.createCloudAccount(payload)
        toast.success(t("cloud.accounts.toastCreateSuccess"))
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
      toast.error(getApiErrorMessage(error, t("cloud.accounts.toastToggleError")))
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
      toast.error(getApiErrorMessage(error, t("cloud.accounts.toastTestError")))
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
      toast.error(getApiErrorMessage(error, t("cloud.accounts.toastCollectError")))
    } finally {
      setCollectingId(null)
    }
  }, [fetchAccounts, t])

  const handleDelete = useCallback(async () => {
    if (!deleteTarget) {
      return
    }

    setDeleting(true)
    try {
      await api.deleteCloudAccount(deleteTarget.id)
      toast.success(t("cloud.accounts.toastDeleteSuccess"))
      setDeleteTarget(null)
      await fetchAccounts(true)
    } catch (error) {
      toast.error(getApiErrorMessage(error, t("cloud.accounts.toastDeleteError")))
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

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>{t("cloud.accounts.statTotal")}</CardDescription>
            <CardTitle className="text-2xl">{stats.total}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>{t("cloud.accounts.statEnabled")}</CardDescription>
            <CardTitle className="text-2xl">{stats.enabled}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>{t("cloud.accounts.statDisabled")}</CardDescription>
            <CardTitle className="text-2xl">{stats.disabled}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>{t("cloud.accounts.statProviders")}</CardDescription>
            <CardTitle className="text-2xl">{stats.providers}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t("cloud.accounts.filtersTitle")}</CardTitle>
          <CardDescription>{t("cloud.accounts.filtersDescription")}</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-3">
          <div className="space-y-2">
            <Label htmlFor="cloud-account-search">{t("cloud.accounts.filterSearch")}</Label>
            <div className="relative">
              <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
              <Input
                id="cloud-account-search"
                className="pl-9"
                value={searchKeyword}
                onChange={(event) => setSearchKeyword(event.target.value)}
                placeholder={t("cloud.accounts.filterSearchPlaceholder")}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label>{t("cloud.accounts.filterProvider")}</Label>
            <Select value={providerFilter} onValueChange={setProviderFilter}>
              <SelectTrigger>
                <SelectValue placeholder={t("cloud.accounts.filterProviderAll")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("cloud.accounts.filterProviderAll")}</SelectItem>
                {providerOptions.map((provider) => (
                  <SelectItem key={provider} value={provider}>{provider}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>{t("cloud.accounts.filterStatus")}</Label>
            <Select
              value={enabledFilter}
              onValueChange={(value) => setEnabledFilter(value as "all" | "enabled" | "disabled")}
            >
              <SelectTrigger>
                <SelectValue placeholder={t("cloud.accounts.filterStatusAll")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("cloud.accounts.filterStatusAll")}</SelectItem>
                <SelectItem value="enabled">{t("cloud.accounts.filterStatusEnabled")}</SelectItem>
                <SelectItem value="disabled">{t("cloud.accounts.filterStatusDisabled")}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("cloud.accounts.tableTitle")}</CardTitle>
          <CardDescription>{t("cloud.accounts.tableDescription")}</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("cloud.accounts.tableColName")}</TableHead>
                  <TableHead>{t("cloud.accounts.tableColConfigKey")}</TableHead>
                  <TableHead>{t("cloud.accounts.tableColProvider")}</TableHead>
                  <TableHead>{t("cloud.accounts.tableColStatus")}</TableHead>
                  <TableHead>{t("cloud.accounts.tableColUpdatedAt")}</TableHead>
                  <TableHead className="text-right">{t("cloud.accounts.tableColActions")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-28 text-center text-muted-foreground">
                      {t("cloud.accounts.tableLoading")}
                    </TableCell>
                  </TableRow>
                ) : filteredAccounts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-28 text-center text-muted-foreground">
                      {t("cloud.accounts.tableEmpty")}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredAccounts.map((account) => (
                    <TableRow key={account.id}>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="font-medium">{account.display_name}</div>
                          {account.description ? (
                            <div className="max-w-[320px] truncate text-xs text-muted-foreground">
                              {account.description}
                            </div>
                          ) : null}
                        </div>
                      </TableCell>
                      <TableCell className="font-mono text-xs">{account.config_key}</TableCell>
                      <TableCell>
                        <Badge variant="secondary">{account.provider}</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={account.enabled}
                            disabled={togglingId === account.id}
                            onCheckedChange={() => handleToggleEnabled(account)}
                            aria-label={t("cloud.accounts.toggleEnabledLabel")}
                          />
                          <span className="text-sm text-muted-foreground">
                            {account.enabled
                              ? t("cloud.accounts.statusEnabled")
                              : t("cloud.accounts.statusDisabled")}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>{formatDateTime(account.updated_at, locale)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => handleTestConnection(account)}
                            disabled={testingId === account.id}
                          >
                            {testingId === account.id ? (
                              <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <TestTube2 className="mr-1 h-3.5 w-3.5" />
                            )}
                            {t("cloud.accounts.actionTest")}
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => handleCollect(account)}
                            disabled={collectingId === account.id}
                          >
                            {collectingId === account.id ? (
                              <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <Play className="mr-1 h-3.5 w-3.5" />
                            )}
                            {t("cloud.accounts.actionCollect")}
                          </Button>
                          <Button type="button" variant="outline" size="sm" onClick={() => openEditDialog(account)}>
                            {t("cloud.accounts.actionEdit")}
                          </Button>
                          <Button
                            type="button"
                            variant="destructive"
                            size="sm"
                            onClick={() => setDeleteTarget(account)}
                          >
                            <Trash2 className="mr-1 h-3.5 w-3.5" />
                            {t("cloud.accounts.actionDelete")}
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

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

            <DialogFooter>
              <Button type="button" variant="outline" onClick={closeDialog} disabled={formSubmitting}>
                {t("cloud.accounts.dialogCancel")}
              </Button>
              <Button type="submit" disabled={formSubmitting}>
                {formSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
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
