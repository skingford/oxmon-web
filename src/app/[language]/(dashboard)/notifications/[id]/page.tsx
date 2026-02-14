"use client"

import Link from "next/link"
import { useCallback, useEffect, useMemo, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { api, getApiErrorMessage } from "@/lib/api"
import { getStatusAwareMessage } from "@/lib/api-error-utils"
import { withLocalePrefix } from "@/components/app-locale"
import { useAppLocale } from "@/hooks/use-app-locale"
import { useAppTranslations } from "@/hooks/use-app-translations"
import { useRequestState } from "@/hooks/use-request-state"
import {
  formatDateTime,
  getConfigFormValuesFromConfigJson,
  getChannelTypeLabel,
  getInitialFormState,
  getSeverityClassName,
  getSeverityLabel,
  normalizeRecipientsInput,
  serializeChannelConfigJson,
} from "@/lib/notifications/channel-utils"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  DialogClose,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { NotificationChannelFormFields, type NotificationChannelFormState } from "@/components/notifications/NotificationChannelFormFields"
import { JsonTextarea } from "@/components/ui/json-textarea"
import { Label } from "@/components/ui/label"
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
import { ArrowLeft, ChevronDown, ChevronUp, Loader2, MoreHorizontal, Pencil, Send, Trash2, Users, X } from "lucide-react"
import { toast } from "sonner"

type ChannelDetailState = {
  channel: {
    id: string
    name: string
    channel_type: string
    min_severity: string
    enabled: boolean
    description: string | null
    system_config_id?: string | null
    recipients: string[]
    created_at: string
    updated_at: string
  } | null
  configJson: string
}

function formatConfigJson(value: string) {
  const raw = value.trim()
  if (!raw) {
    return ""
  }

  try {
    return JSON.stringify(JSON.parse(raw), null, 2)
  } catch {
    return value
  }
}

export default function NotificationChannelDetailPage() {
  const { t, locale } = useAppTranslations("pages")
  const appLocale = useAppLocale()
  const router = useRouter()
  const params = useParams<{ id: string }>()
  const channelId = typeof params.id === "string" ? params.id : ""

  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isRecipientsDialogOpen, setIsRecipientsDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [channelForm, setChannelForm] = useState<NotificationChannelFormState>(getInitialFormState)
  const [recipientsInput, setRecipientsInput] = useState("")
  const [savingChannel, setSavingChannel] = useState(false)
  const [savingRecipients, setSavingRecipients] = useState(false)
  const [testing, setTesting] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [isConfigExpanded, setIsConfigExpanded] = useState(false)

  const {
    data,
    loading,
    execute,
  } = useRequestState<ChannelDetailState>(
    {
      channel: null,
      configJson: "",
    },
    { initialLoading: true }
  )

  const fetchChannelDetail = useCallback(async () => {
    if (!channelId) {
      return
    }

    await execute(
      async () => {
        const [channel, config] = await Promise.all([
          api.getChannelById(channelId),
          api.getChannelConfigById(channelId).catch(() => null),
        ])

        if (!channel) {
          return {
            channel: null,
            configJson: "",
          }
        }

        const configJson =
          typeof config?.config_json === "string"
            ? formatConfigJson(config.config_json)
            : config?.config_json && typeof config.config_json === "object"
              ? JSON.stringify(config.config_json, null, 2)
              : config?.config && typeof config.config === "object"
                ? JSON.stringify(config.config, null, 2)
                : ""

        return {
          channel,
          configJson,
        }
      },
      {
        onError: (error) => {
          toast.error(getApiErrorMessage(error, t("notifications.detailToastFetchError")))
        },
      }
    )
  }, [channelId, execute, t])

  useEffect(() => {
    fetchChannelDetail()
  }, [fetchChannelDetail])

  const severityOptions = useMemo(
    () => ["info", "warning", "critical"] as const,
    []
  )

  const getSeverityLabelForForm = useCallback(
    (severity: string) => getSeverityLabel(severity, t),
    [t]
  )

  if (loading) {
    return (
      <Card>
        <CardContent className="flex min-h-[220px] items-center justify-center text-muted-foreground">
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          {t("notifications.detailLoading")}
        </CardContent>
      </Card>
    )
  }

  if (!data.channel) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{t("notifications.detailNotFoundTitle")}</CardTitle>
          <CardDescription>{t("notifications.detailNotFoundDescription", { id: channelId || "-" })}</CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild variant="outline">
            <Link href={withLocalePrefix("/notifications", appLocale)}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              {t("notifications.detailBackToList")}
            </Link>
          </Button>
        </CardContent>
      </Card>
    )
  }

  const channel = data.channel

  const openEditDialog = () => {
    const currentConfigJson = data.configJson || "{}"

    setChannelForm({
      name: channel.name || "",
      channelType: channel.channel_type || "email",
      systemConfigId: channel.system_config_id || "",
      description: channel.description || "",
      minSeverity: channel.min_severity || "info",
      enabled: channel.enabled,
      recipientsInput: (channel.recipients || []).join("\n"),
      configJson: currentConfigJson,
      configFormValues: getConfigFormValuesFromConfigJson(channel.channel_type || "email", currentConfigJson),
    })
    setIsEditDialogOpen(true)
  }

  const openRecipientsDialog = () => {
    setRecipientsInput((channel.recipients || []).join("\n"))
    setIsRecipientsDialogOpen(true)
  }

  const handleSaveChannel = async () => {
    const serializedConfigResult = serializeChannelConfigJson({
      channelType: channelForm.channelType.trim(),
      configJson: channelForm.configJson,
      configFormValues: channelForm.configFormValues,
    })

    if (serializedConfigResult.ok === false) {
      if (serializedConfigResult.reason === "invalid_json") {
        toast.error(t("notifications.toastConfigInvalid"))
        return
      }

      if (serializedConfigResult.reason === "required" && serializedConfigResult.fieldLabelKey) {
        toast.error(
          t("notifications.toastConfigFieldRequired", {
            field: t(serializedConfigResult.fieldLabelKey),
          })
        )
        return
      }

      if (serializedConfigResult.reason === "invalid_number" && serializedConfigResult.fieldLabelKey) {
        toast.error(
          t("notifications.toastConfigFieldInvalidNumber", {
            field: t(serializedConfigResult.fieldLabelKey),
          })
        )
        return
      }

      toast.error(t("notifications.toastConfigInvalid"))
      return
    }

    setSavingChannel(true)

    try {
      const recipients =
        channelForm.channelType.trim().toLowerCase() === "dingtalk"
          ? []
          : normalizeRecipientsInput(channelForm.recipientsInput)

      await api.updateChannelConfig(channel.id, {
        name: channelForm.name.trim(),
        channel_type: channelForm.channelType.trim(),
        description: channelForm.description.trim() || null,
        min_severity: channelForm.minSeverity,
        enabled: channelForm.enabled,
        recipients,
        config_json: serializedConfigResult.configJson,
      })
      toast.success(t("notifications.toastUpdateSuccess"))
      setIsEditDialogOpen(false)
      await fetchChannelDetail()
    } catch (error) {
      toast.error(getApiErrorMessage(error, t("notifications.toastUpdateError")))
    } finally {
      setSavingChannel(false)
    }
  }

  const handleSaveRecipients = async () => {
    setSavingRecipients(true)

    try {
      await api.setRecipients(channel.id, {
        recipients: normalizeRecipientsInput(recipientsInput),
      })
      toast.success(t("notifications.toastRecipientsUpdateSuccess"))
      setIsRecipientsDialogOpen(false)
      await fetchChannelDetail()
    } catch (error) {
      toast.error(getApiErrorMessage(error, t("notifications.toastRecipientsUpdateError")))
    } finally {
      setSavingRecipients(false)
    }
  }

  const handleTestChannel = async () => {
    setTesting(true)

    try {
      await api.testChannel(channel.id)
      toast.success(t("notifications.toastTestSuccess"))
    } catch (error) {
      toast.error(getApiErrorMessage(error, t("notifications.toastTestError")))
    } finally {
      setTesting(false)
    }
  }

  const handleDeleteChannel = async () => {
    setDeleting(true)

    try {
      await api.deleteChannelConfig(channel.id)
      toast.success(t("notifications.toastDeleteSuccess"))
      router.push(withLocalePrefix("/notifications", appLocale))
    } catch (error) {
      toast.error(
        getStatusAwareMessage(error, t("notifications.toastDeleteError"), {
          404: t("notifications.toastDeleteNotFound"),
        })
      )
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <h2 className="text-2xl font-bold tracking-tight">
            {t("notifications.detailTitle", { name: channel.name })}
          </h2>
          <p className="text-sm text-muted-foreground">{t("notifications.detailDescription")}</p>
        </div>
        <Button asChild variant="outline">
          <Link href={withLocalePrefix("/notifications", appLocale)}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            {t("notifications.detailBackToList")}
          </Link>
        </Button>
      </div>

      <div className="flex items-center justify-between gap-2">
        <div className="hidden flex-wrap gap-2 sm:flex">
          <Button type="button" variant="outline" onClick={openEditDialog}>
            <Pencil className="mr-2 h-4 w-4" />
            {t("notifications.actionEdit")}
          </Button>
          <Button type="button" variant="outline" onClick={openRecipientsDialog}>
            <Users className="mr-2 h-4 w-4" />
            {t("notifications.actionRecipients")}
          </Button>
          <Button type="button" variant="outline" onClick={handleTestChannel} disabled={testing || !channel.enabled}>
            {testing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
            {t("notifications.actionTest")}
          </Button>
          <Button type="button" variant="destructive" onClick={() => setIsDeleteDialogOpen(true)}>
            <Trash2 className="mr-2 h-4 w-4" />
            {t("notifications.actionDelete")}
          </Button>
        </div>

        <div className="sm:hidden">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button type="button" variant="outline" size="icon" aria-label={t("notifications.detailMoreActions")}>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44">
              <DropdownMenuItem onClick={openEditDialog}>
                <Pencil className="h-4 w-4" />
                {t("notifications.actionEdit")}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={openRecipientsDialog}>
                <Users className="h-4 w-4" />
                {t("notifications.actionRecipients")}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleTestChannel} disabled={testing || !channel.enabled}>
                {testing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                {t("notifications.actionTest")}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setIsDeleteDialogOpen(true)} variant="destructive">
                <Trash2 className="h-4 w-4" />
                {t("notifications.actionDelete")}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t("notifications.detailSectionBasic")}</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div>
            <p className="text-xs text-muted-foreground">{t("notifications.detailFieldId")}</p>
            <p className="font-mono text-sm break-all">{channel.id}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">{t("notifications.detailFieldType")}</p>
            <p className="text-sm">{getChannelTypeLabel(channel.channel_type, t)}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">{t("notifications.detailFieldSeverity")}</p>
            <Badge variant="outline" className={getSeverityClassName(channel.min_severity)}>
              {getSeverityLabel(channel.min_severity, t)}
            </Badge>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">{t("notifications.detailFieldStatus")}</p>
            <Badge variant={channel.enabled ? "secondary" : "outline"}>
              {channel.enabled ? t("notifications.statusEnabled") : t("notifications.statusDisabled")}
            </Badge>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">{t("notifications.detailFieldCreatedAt")}</p>
            <p className="text-sm">{formatDateTime(channel.created_at, locale)}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">{t("notifications.detailFieldUpdatedAt")}</p>
            <p className="text-sm">{formatDateTime(channel.updated_at, locale)}</p>
          </div>
          <div className="md:col-span-2">
            <p className="text-xs text-muted-foreground">{t("notifications.detailFieldDescription")}</p>
            <p className="text-sm text-muted-foreground">{channel.description || "-"}</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("notifications.detailSectionDelivery")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="text-xs text-muted-foreground">{t("notifications.detailFieldRecipients")}</p>
            {channel.recipients.length === 0 ? (
              <p className="text-sm text-muted-foreground">{t("notifications.recipientNone")}</p>
            ) : (
              <ul className="mt-2 space-y-1">
                {channel.recipients.map((recipient) => (
                  <li key={recipient} className="font-mono text-sm break-all">
                    {recipient}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-2">
            <div className="space-y-1">
              <CardTitle>{t("notifications.detailSectionConfig")}</CardTitle>
              <CardDescription>{t("notifications.detailConfigHint")}</CardDescription>
            </div>
            <Button type="button" variant="outline" size="sm" onClick={() => setIsConfigExpanded((previous) => !previous)}>
              {isConfigExpanded ? (
                <>
                  <ChevronUp className="mr-2 h-4 w-4" />
                  {t("notifications.detailCollapseConfig")}
                </>
              ) : (
                <>
                  <ChevronDown className="mr-2 h-4 w-4" />
                  {t("notifications.detailExpandConfig")}
                </>
              )}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isConfigExpanded ? (
            data.configJson ? (
              <JsonTextarea
                value={data.configJson}
                onChange={() => {}}
                readOnly
                autoFormat={false}
                showToolbar
                showFormatButton={false}
                showCopyButton
                enableRepair={false}
                showInvalidHint={false}
                maxHeightClassName="max-h-[420px]"
              />
            ) : (
              <p className="text-sm text-muted-foreground">-</p>
            )
          ) : null}
        </CardContent>
      </Card>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="flex max-h-[88vh] flex-col gap-0 overflow-hidden p-0 sm:max-w-2xl" showCloseButton={false}>
          <DialogHeader className="sticky top-0 z-10 border-b bg-background px-6 py-4">
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-1 pr-2">
                <DialogTitle>{t("notifications.dialogEditTitle")}</DialogTitle>
                <DialogDescription>{t("notifications.dialogEditDescription")}</DialogDescription>
              </div>
              <DialogClose asChild>
                <Button type="button" variant="ghost" size="icon" className="h-8 w-8 shrink-0">
                  <X className="h-4 w-4" />
                </Button>
              </DialogClose>
            </div>
          </DialogHeader>

          <div className="min-h-0 flex-1 overflow-y-auto px-6 py-4">
            <div className="space-y-4">
              <NotificationChannelFormFields
                form={channelForm}
                setForm={setChannelForm}
                idPrefix="detail-channel"
                isEditing
                severityOptions={severityOptions}
                getSeverityLabel={getSeverityLabelForForm}
                t={t}
              />
            </div>
          </div>

          <DialogFooter className="sticky bottom-0 z-10 border-t bg-background px-6 py-4">
            <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)} disabled={savingChannel}>
              {t("notifications.dialogCancel")}
            </Button>
            <Button type="button" onClick={handleSaveChannel} disabled={savingChannel}>
              {savingChannel ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              {t("notifications.dialogUpdateSubmit")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isRecipientsDialogOpen} onOpenChange={setIsRecipientsDialogOpen}>
        <DialogContent className="flex max-h-[88vh] flex-col gap-0 overflow-hidden p-0 sm:max-w-lg" showCloseButton={false}>
          <DialogHeader className="sticky top-0 z-10 border-b bg-background px-6 py-4">
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-1 pr-2">
                <DialogTitle>{t("notifications.recipientsDialogTitle")}</DialogTitle>
                <DialogDescription>
                  {t("notifications.recipientsDialogDescription", { name: channel.name || "-" })}
                </DialogDescription>
              </div>
              <DialogClose asChild>
                <Button type="button" variant="ghost" size="icon" className="h-8 w-8 shrink-0">
                  <X className="h-4 w-4" />
                </Button>
              </DialogClose>
            </div>
          </DialogHeader>
          <div className="min-h-0 flex-1 overflow-y-auto px-6 py-4">
            <div className="space-y-2">
              <Label htmlFor="detail-recipients-input">{t("notifications.recipientsDialogField")}</Label>
              <Textarea
                id="detail-recipients-input"
                value={recipientsInput}
                onChange={(event) => setRecipientsInput(event.target.value)}
                className="min-h-[180px]"
              />
              <p className="text-xs text-muted-foreground">{t("notifications.recipientsDialogHint")}</p>
            </div>
          </div>
          <DialogFooter className="sticky bottom-0 z-10 border-t bg-background px-6 py-4">
            <Button type="button" variant="outline" onClick={() => setIsRecipientsDialogOpen(false)} disabled={savingRecipients}>
              {t("notifications.recipientsDialogCancel")}
            </Button>
            <Button type="button" onClick={handleSaveRecipients} disabled={savingRecipients}>
              {savingRecipients ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              {t("notifications.recipientsDialogSubmit")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("notifications.deleteDialogTitle")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("notifications.deleteDialogDescription", { name: channel.name || "-" })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>{t("notifications.dialogCancel")}</AlertDialogCancel>
            <AlertDialogAction variant="destructive" onClick={handleDeleteChannel} disabled={deleting}>
              {deleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              {t("notifications.deleteDialogConfirm")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
