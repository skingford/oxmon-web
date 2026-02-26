"use client"

import { useEffect, useMemo, useState } from "react"
import { api } from "@/lib/api"
import type { AIAccountResponse } from "@/types/api"
import { toastApiError, toastCreated, toastDeleted, toastSaved } from "@/lib/toast"
import { useAppTranslations } from "@/hooks/use-app-translations"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { JsonTextarea } from "@/components/ui/json-textarea"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
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
import { Loader2, Plus, RefreshCw } from "lucide-react"
import { Eye, EyeOff } from "lucide-react"

type FormState = {
  config_key: string
  provider: string
  display_name: string
  description: string
  enabled: boolean
  configBaseUrl: string
  configApiKey: string
  configModel: string
  configJson: string
}

const EMPTY_FORM: FormState = {
  config_key: "",
  provider: "",
  display_name: "",
  description: "",
  enabled: true,
  configBaseUrl: "",
  configApiKey: "",
  configModel: "",
  configJson: "{}",
}

function parseConfigObject(value: string): Record<string, unknown> | null {
  try {
    const parsed = JSON.parse(value || "{}")
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return null
    }
    return parsed as Record<string, unknown>
  } catch {
    return null
  }
}

function configInputFieldsFromJson(value: string) {
  const parsed = parseConfigObject(value)
  return {
    configBaseUrl: typeof parsed?.base_url === "string" ? parsed.base_url : "",
    configApiKey: typeof parsed?.api_key === "string" ? parsed.api_key : "",
    configModel: typeof parsed?.model === "string" ? parsed.model : "",
  }
}

function stringifyConfigObject(value: Record<string, unknown>) {
  return JSON.stringify(value, null, 2)
}

function applyConfigInputsToJson(
  currentJson: string,
  inputs: Pick<FormState, "configBaseUrl" | "configApiKey" | "configModel">
) {
  const next = parseConfigObject(currentJson) ?? {}

  if (inputs.configBaseUrl.trim()) next.base_url = inputs.configBaseUrl.trim()
  else delete next.base_url

  if (inputs.configApiKey.trim()) next.api_key = inputs.configApiKey.trim()
  else delete next.api_key

  if (inputs.configModel.trim()) next.model = inputs.configModel.trim()
  else delete next.model

  return stringifyConfigObject(next)
}

function formatDateTime(value?: string | null) {
  if (!value) return "-"
  const d = new Date(value)
  return Number.isNaN(d.getTime()) ? value : d.toLocaleString()
}

export default function AIAccountsPage() {
  const { t } = useAppTranslations("ai")
  const [items, setItems] = useState<AIAccountResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<AIAccountResponse | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<AIAccountResponse | null>(null)
  const [form, setForm] = useState<FormState>(EMPTY_FORM)
  const [showConfigApiKey, setShowConfigApiKey] = useState(false)

  const sortedItems = useMemo(
    () =>
      [...items].sort((a, b) =>
        new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
      ),
    [items]
  )

  const fetchData = async () => {
    setLoading(true)
    try {
      const data = await api.listAIAccounts()
      setItems(data)
    } catch (error) {
      toastApiError(error, t("accounts.toastFetchError"))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void fetchData()
  }, [])

  const openCreate = () => {
    setEditing(null)
    setForm(EMPTY_FORM)
    setShowConfigApiKey(false)
    setDialogOpen(true)
  }

  const openEdit = (item: AIAccountResponse) => {
    const configJson = JSON.stringify(item.config_json ?? {}, null, 2)
    const configFields = configInputFieldsFromJson(configJson)
    setEditing(item)
    setForm({
      config_key: item.config_key,
      provider: item.provider || "",
      display_name: item.display_name,
      description: item.description || "",
      enabled: item.enabled,
      ...configFields,
      configJson,
    })
    setShowConfigApiKey(false)
    setDialogOpen(true)
  }

  const submit = async () => {
    if (!form.config_key.trim()) return void toastApiError(new Error(""), t("accounts.toastConfigKeyRequired"))
    if (!form.provider.trim()) return void toastApiError(new Error(""), t("accounts.toastProviderRequired"))
    if (!form.display_name.trim()) return void toastApiError(new Error(""), t("accounts.toastDisplayNameRequired"))

    let parsedConfig: unknown
    try {
      parsedConfig = JSON.parse(form.configJson || "{}")
    } catch {
      return void toastApiError(new Error(""), t("accounts.toastConfigInvalid"))
    }

    setSubmitting(true)
    try {
      if (editing) {
        await api.updateAIAccount(editing.id, {
          display_name: form.display_name.trim(),
          description: form.description.trim() || null,
          enabled: form.enabled,
          config: parsedConfig,
        })
        toastSaved(t("accounts.toastUpdateSuccess"))
      } else {
        await api.createAIAccount({
          config_key: form.config_key.trim(),
          provider: form.provider.trim(),
          display_name: form.display_name.trim(),
          description: form.description.trim() || null,
          enabled: form.enabled,
          config: parsedConfig,
        })
        toastCreated(t("accounts.toastCreateSuccess"))
      }
      setDialogOpen(false)
      await fetchData()
    } catch (error) {
      toastApiError(
        error,
        editing ? t("accounts.toastUpdateError") : t("accounts.toastCreateError")
      )
    } finally {
      setSubmitting(false)
    }
  }

  const confirmDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      await api.deleteAIAccount(deleteTarget.id)
      toastDeleted(t("accounts.toastDeleteSuccess"))
      setDeleteTarget(null)
      await fetchData()
    } catch (error) {
      toastApiError(error, t("accounts.toastDeleteError"))
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="min-w-0 space-y-6 p-4 md:p-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">{t("accounts.title")}</h2>
          <p className="text-sm text-muted-foreground">{t("accounts.description")}</p>
        </div>
        <div className="flex gap-2">
          <Button type="button" variant="outline" onClick={() => void fetchData()} disabled={loading}>
            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            {t("accounts.refreshButton")}
          </Button>
          <Button type="button" onClick={openCreate}>
            <Plus className="mr-2 h-4 w-4" />
            {t("accounts.createButton")}
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t("accounts.tableTitle")}</CardTitle>
          <CardDescription>{t("accounts.tableDescription")}</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("accounts.colName")}</TableHead>
                <TableHead>{t("accounts.colKey")}</TableHead>
                <TableHead>{t("accounts.colProvider")}</TableHead>
                <TableHead>{t("accounts.colStatus")}</TableHead>
                <TableHead>{t("accounts.colUpdatedAt")}</TableHead>
                <TableHead className="text-right">{t("accounts.colActions")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                    {t("accounts.tableLoading")}
                  </TableCell>
                </TableRow>
              ) : sortedItems.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                    {t("accounts.tableEmpty")}
                  </TableCell>
                </TableRow>
              ) : (
                sortedItems.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>
                      <div className="min-w-0">
                        <div className="font-medium">{item.display_name}</div>
                        {item.description ? (
                          <div className="max-w-[320px] truncate text-xs text-muted-foreground">
                            {item.description}
                          </div>
                        ) : null}
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-xs">{item.config_key}</TableCell>
                    <TableCell>{item.provider || "-"}</TableCell>
                    <TableCell>
                      <Badge variant={item.enabled ? "default" : "secondary"}>
                        {item.enabled ? t("accounts.statusEnabled") : t("accounts.statusDisabled")}
                      </Badge>
                    </TableCell>
                    <TableCell>{formatDateTime(item.updated_at)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button type="button" size="sm" variant="outline" onClick={() => openEdit(item)}>
                          {t("accounts.actionEdit")}
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="destructive"
                          onClick={() => setDeleteTarget(item)}
                        >
                          {t("accounts.actionDelete")}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editing ? t("accounts.dialogEditTitle") : t("accounts.dialogCreateTitle")}
            </DialogTitle>
            <DialogDescription>{t("accounts.dialogDescription")}</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>{t("accounts.fieldConfigKey")}</Label>
              <Input
                value={form.config_key}
                disabled={Boolean(editing)}
                onChange={(e) => setForm((s) => ({ ...s, config_key: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>{t("accounts.fieldProvider")}</Label>
              <Input
                value={form.provider}
                disabled={Boolean(editing)}
                onChange={(e) => setForm((s) => ({ ...s, provider: e.target.value }))}
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label>{t("accounts.fieldDisplayName")}</Label>
              <Input
                value={form.display_name}
                onChange={(e) => setForm((s) => ({ ...s, display_name: e.target.value }))}
              />
            </div>
            <div className="flex items-center justify-between rounded-md border p-3 sm:col-span-2">
              <Label>{t("accounts.fieldEnabled")}</Label>
              <Switch
                checked={form.enabled}
                onCheckedChange={(checked) => setForm((s) => ({ ...s, enabled: checked }))}
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label>{t("accounts.fieldDescription")}</Label>
              <Input
                value={form.description}
                onChange={(e) => setForm((s) => ({ ...s, description: e.target.value }))}
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <p className="text-sm font-medium">{t("accounts.configFieldsTitle")}</p>
              <p className="text-xs text-muted-foreground">{t("accounts.configFieldsDescription")}</p>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>{t("accounts.fieldConfigBaseUrl")}</Label>
                  <Input
                    value={form.configBaseUrl}
                    onChange={(e) =>
                      setForm((s) => {
                        const configBaseUrl = e.target.value
                        const nextInputs = {
                          configBaseUrl,
                          configApiKey: s.configApiKey,
                          configModel: s.configModel,
                        }
                        return {
                          ...s,
                          ...nextInputs,
                          configJson: applyConfigInputsToJson(s.configJson, nextInputs),
                        }
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>{t("accounts.fieldConfigApiKey")}</Label>
                  <div className="relative">
                    <Input
                      type={showConfigApiKey ? "text" : "password"}
                      value={form.configApiKey}
                      className="pr-10"
                      onChange={(e) =>
                        setForm((s) => {
                          const configApiKey = e.target.value
                          const nextInputs = {
                            configBaseUrl: s.configBaseUrl,
                            configApiKey,
                            configModel: s.configModel,
                          }
                          return {
                            ...s,
                            ...nextInputs,
                            configJson: applyConfigInputsToJson(s.configJson, nextInputs),
                          }
                        })
                      }
                    />
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      className="absolute top-1/2 right-1 h-8 w-8 -translate-y-1/2 p-0"
                      onClick={() => setShowConfigApiKey((v) => !v)}
                    >
                      {showConfigApiKey ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>{t("accounts.fieldConfigModel")}</Label>
                  <Input
                    value={form.configModel}
                    onChange={(e) =>
                      setForm((s) => {
                        const configModel = e.target.value
                        const nextInputs = {
                          configBaseUrl: s.configBaseUrl,
                          configApiKey: s.configApiKey,
                          configModel,
                        }
                        return {
                          ...s,
                          ...nextInputs,
                          configJson: applyConfigInputsToJson(s.configJson, nextInputs),
                        }
                      })
                    }
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2 sm:col-span-2">
              <Label>{t("accounts.fieldConfigJson")}</Label>
              <JsonTextarea
                value={form.configJson}
                onChange={(value) =>
                  setForm((s) => ({
                    ...s,
                    ...configInputFieldsFromJson(value),
                    configJson: value,
                  }))
                }
                className="min-h-[180px]"
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setDialogOpen(false)} disabled={submitting}>
              {t("accounts.cancel")}
            </Button>
            <Button type="button" onClick={() => void submit()} disabled={submitting}>
              {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              {editing ? t("accounts.submitUpdate") : t("accounts.submitCreate")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={Boolean(deleteTarget)} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("accounts.deleteConfirmTitle")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("accounts.deleteConfirmDescription", { name: deleteTarget?.display_name || "-" })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>{t("accounts.cancel")}</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={() => void confirmDelete()}
              disabled={deleting}
            >
              {deleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              {t("accounts.deleteConfirmAction")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
