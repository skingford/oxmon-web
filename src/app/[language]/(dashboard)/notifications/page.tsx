"use client"

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react"
import { ApiRequestError, api, getApiErrorMessage } from "@/lib/api"
import {
  ChannelConfig,
  ChannelOverview,
  CreateChannelRequest,
  SystemConfigResponse,
  UpdateChannelConfigRequest,
} from "@/types/api"
import { useAppTranslations } from "@/hooks/use-app-translations"
import {
  NotificationChannelFormFields,
  NotificationChannelFormState,
  NotificationSystemConfigOption,
} from "@/components/notifications/NotificationChannelFormFields"
import { useRequestState } from "@/hooks/use-request-state"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { NotificationsFiltersCard } from "@/components/notifications/NotificationsFiltersCard"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
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
import {
  Bell,
  CheckCircle2,
  CircleOff,
  Loader2,
  Mail,
  Pencil,
  Plus,
  RefreshCw,
  Send,
  Share2,
  Smartphone,
  Trash2,
  TriangleAlert,
  Users,
  Webhook,
} from "lucide-react"
import { toast } from "sonner"

const PAGE_LIMIT = 100
const CHANNEL_SEVERITY_OPTIONS = ["info", "warning", "critical"] as const

type NotificationsQueryState = {
  channels: ChannelOverview[]
  configMap: Record<string, string>
  systemConfigs: SystemConfigResponse[]
}

type NotificationStatusFilter = "all" | "enabled" | "disabled"


function formatDateTime(value: string | null, locale: "zh" | "en") {
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

function normalizeRecipientsInput(value: string) {
  return Array.from(
    new Set(
      value
        .split(/[\n,]/)
        .map((item) => item.trim())
        .filter(Boolean)
    )
  )
}

function getInitialFormState(): NotificationChannelFormState {
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

function createConfigMap(rows: ChannelConfig[] | unknown[]): Record<string, string> {
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

function getChannelTypeLabel(
  type: string,
  t: (path: any, values?: Record<string, string | number>) => string
) {
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

function getSeverityLabel(
  severity: string,
  t: (path: any, values?: Record<string, string | number>) => string
) {
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

function getSeverityClassName(severity: string) {
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

function getChannelIcon(channelType: string) {
  const normalized = channelType.toLowerCase()

  if (normalized === "email") {
    return <Mail className="h-4 w-4" />
  }

  if (normalized === "webhook") {
    return <Webhook className="h-4 w-4" />
  }

  if (normalized === "slack") {
    return <Share2 className="h-4 w-4" />
  }

  if (normalized === "sms") {
    return <Smartphone className="h-4 w-4" />
  }

  return <Bell className="h-4 w-4" />
}

function shouldRequireSystemConfig(channelType: string) {
  const normalized = channelType.trim().toLowerCase()
  return normalized === "email" || normalized === "sms"
}

export default function NotificationsPage() {
  const { t, locale } = useAppTranslations("pages")
  const {
    data,
    loading,
    refreshing,
    execute,
  } = useRequestState<NotificationsQueryState>({
    channels: [],
    configMap: {},
    systemConfigs: [],
  })

  const channels = data.channels
  const configMap = data.configMap
  const systemConfigs = data.systemConfigs

  const [searchKeyword, setSearchKeyword] = useState("")
  const [typeFilter, setTypeFilter] = useState("all")
  const [severityFilter, setSeverityFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState<NotificationStatusFilter>("all")
  const [systemConfigFilter, setSystemConfigFilter] = useState("all")

  const [isChannelDialogOpen, setIsChannelDialogOpen] = useState(false)
  const [editingChannel, setEditingChannel] = useState<ChannelOverview | null>(null)
  const [formSubmitting, setFormSubmitting] = useState(false)
  const [channelForm, setChannelForm] = useState<NotificationChannelFormState>(getInitialFormState)

  const [isRecipientsDialogOpen, setIsRecipientsDialogOpen] = useState(false)
  const [recipientsDialogChannel, setRecipientsDialogChannel] = useState<ChannelOverview | null>(null)
  const [recipientsLoading, setRecipientsLoading] = useState(false)
  const [recipientsSaving, setRecipientsSaving] = useState(false)
  const [recipientsInput, setRecipientsInput] = useState("")

  const [testingId, setTestingId] = useState<string | null>(null)
  const [togglingId, setTogglingId] = useState<string | null>(null)
  const [deleteDialogChannel, setDeleteDialogChannel] = useState<ChannelOverview | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const fetchChannels = useCallback(
    async (silent = false) => {
      await execute(
        async () => {
          const [channelRows, configRows] = await Promise.all([
            api.listChannels({ limit: PAGE_LIMIT, offset: 0 }),
            api.listChannelConfigs({ limit: PAGE_LIMIT, offset: 0 }).catch(() => []),
          ])
          const systemConfigRows = await api
            .listSystemConfigs({ limit: PAGE_LIMIT, offset: 0 })
            .catch(() => [])

          return {
            channels: channelRows,
            configMap: createConfigMap(configRows),
            systemConfigs: systemConfigRows,
          }
        },
        {
          silent,
          onError: (error) => {
            toast.error(getApiErrorMessage(error, t("notifications.toastFetchError")))
          },
        }
      )
    },
    [execute, t]
  )

  useEffect(() => {
    fetchChannels()
  }, [fetchChannels])

  const stats = useMemo(() => {
    const total = channels.length
    const enabled = channels.filter((channel) => channel.enabled).length
    const disabled = total - enabled
    const missingRecipients = channels.filter((channel) => channel.recipients.length === 0).length

    return {
      total,
      enabled,
      disabled,
      missingRecipients,
    }
  }, [channels])

  const systemConfigMap = useMemo(() => {
    const map = new Map<string, SystemConfigResponse>()
    systemConfigs.forEach((item) => {
      map.set(item.id, item)
    })
    return map
  }, [systemConfigs])

  const availableTypes = useMemo(() => {
    const typeSet = new Set<string>()

    channels.forEach((channel) => {
      if (channel.channel_type) {
        typeSet.add(channel.channel_type)
      }
    })

    return Array.from(typeSet).sort((left, right) => left.localeCompare(right))
  }, [channels])

  const availableSystemConfigs = useMemo(() => {
    return systemConfigs.slice().sort((left, right) => {
      const leftLabel = `${left.display_name} ${left.config_key}`
      const rightLabel = `${right.display_name} ${right.config_key}`
      return leftLabel.localeCompare(rightLabel)
    })
  }, [systemConfigs])

  const filteredChannels = useMemo(() => {
    const keyword = searchKeyword.trim().toLowerCase()

    return channels
      .filter((channel) => {
        if (statusFilter === "enabled" && !channel.enabled) {
          return false
        }

        if (statusFilter === "disabled" && channel.enabled) {
          return false
        }

        if (severityFilter !== "all" && channel.min_severity.toLowerCase() !== severityFilter.toLowerCase()) {
          return false
        }

        if (typeFilter !== "all" && channel.channel_type.toLowerCase() !== typeFilter.toLowerCase()) {
          return false
        }

        if (systemConfigFilter === "unbound" && channel.system_config_id) {
          return false
        }

        if (
          systemConfigFilter !== "all" &&
          systemConfigFilter !== "unbound" &&
          channel.system_config_id !== systemConfigFilter
        ) {
          return false
        }

        if (!keyword) {
          return true
        }

        const searchableText = [
          channel.name,
          channel.channel_type,
          channel.description || "",
          channel.min_severity,
          channel.recipients.join(" "),
        ]
          .join(" ")
          .toLowerCase()

        return searchableText.includes(keyword)
      })
      .sort((left, right) => {
        const leftTime = new Date(left.updated_at).getTime()
        const rightTime = new Date(right.updated_at).getTime()
        return rightTime - leftTime
      })
  }, [channels, searchKeyword, severityFilter, statusFilter, systemConfigFilter, typeFilter])

  const hasActiveFilters =
    Boolean(searchKeyword.trim()) ||
    typeFilter !== "all" ||
    severityFilter !== "all" ||
    statusFilter !== "all" ||
    systemConfigFilter !== "all"
  const currentChannelTypeNormalized = channelForm.channelType.trim().toLowerCase()
  const channelSystemConfigOptions = useMemo<NotificationSystemConfigOption[]>(
    () =>
      systemConfigs
        .filter((item) => item.config_type.toLowerCase() === currentChannelTypeNormalized)
        .map((item) => ({
          id: item.id,
          displayName: item.display_name,
          configKey: item.config_key,
          enabled: item.enabled,
        })),
    [currentChannelTypeNormalized, systemConfigs]
  )

  const getSeverityLabelForForm = useCallback(
    (severity: string) => getSeverityLabel(severity, t),
    [t]
  )

  const resetFilters = () => {
    setSearchKeyword("")
    setTypeFilter("all")
    setSeverityFilter("all")
    setStatusFilter("all")
    setSystemConfigFilter("all")
  }

  const getStatusAwareMessage = (
    error: unknown,
    fallback: string,
    statusMessages?: Partial<Record<number, string>>
  ) => {
    if (error instanceof ApiRequestError && statusMessages?.[error.status]) {
      return statusMessages[error.status] as string
    }

    return getApiErrorMessage(error, fallback)
  }

  const openCreateDialog = () => {
    setEditingChannel(null)
    setChannelForm(getInitialFormState())
    setIsChannelDialogOpen(true)
  }

  const openEditDialog = (channel: ChannelOverview) => {
    setEditingChannel(channel)
    setChannelForm({
      name: channel.name,
      channelType: channel.channel_type,
      systemConfigId: channel.system_config_id || "",
      description: channel.description || "",
      minSeverity: channel.min_severity || "info",
      enabled: channel.enabled,
      recipientsInput: channel.recipients.join("\n"),
      configJson: configMap[channel.id] || "{}",
    })
    setIsChannelDialogOpen(true)
  }

  const handleSubmitChannel = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const name = channelForm.name.trim()
    const channelType = channelForm.channelType.trim()
    const normalizedChannelType = channelType.toLowerCase()
    const systemConfigId = channelForm.systemConfigId.trim()
    const recipients = normalizeRecipientsInput(channelForm.recipientsInput)

    if (!name) {
      toast.error(t("notifications.toastNameRequired"))
      return
    }

    if (!channelType) {
      toast.error(t("notifications.toastTypeRequired"))
      return
    }

    if (shouldRequireSystemConfig(channelType) && !systemConfigId) {
      toast.error(t("notifications.toastSystemConfigRequired"))
      return
    }

    const configInput = channelForm.configJson.trim()
    let normalizedConfig = "{}"

    if (configInput) {
      try {
        normalizedConfig = JSON.stringify(JSON.parse(configInput))
      } catch {
        toast.error(t("notifications.toastConfigInvalid"))
        return
      }
    }

    setFormSubmitting(true)

    try {
      const basePayload: CreateChannelRequest = {
        name,
        channel_type: channelType,
        description: channelForm.description.trim() || undefined,
        min_severity: channelForm.minSeverity,
        recipients,
        config_json: normalizedConfig,
      }
      if (shouldRequireSystemConfig(channelType)) {
        basePayload.system_config_id = systemConfigId
      }

      if (editingChannel) {
        const payload: UpdateChannelConfigRequest = {
          ...basePayload,
          enabled: channelForm.enabled,
        }

        await api.updateChannelConfig(editingChannel.id, payload)
        toast.success(t("notifications.toastUpdateSuccess"))
      } else {
        await api.createChannelConfig(basePayload)
        toast.success(t("notifications.toastCreateSuccess"))
      }

      setIsChannelDialogOpen(false)
      setEditingChannel(null)
      setChannelForm(getInitialFormState())
      await fetchChannels(true)
    } catch (error) {
      toast.error(
        getApiErrorMessage(
          error,
          editingChannel ? t("notifications.toastUpdateError") : t("notifications.toastCreateError")
        )
      )
    } finally {
      setFormSubmitting(false)
    }
  }

  const handleOpenRecipientsDialog = async (channel: ChannelOverview) => {
    setRecipientsDialogChannel(channel)
    setIsRecipientsDialogOpen(true)
    setRecipientsLoading(true)

    try {
      const recipients = await api.getRecipients(channel.id)
      setRecipientsInput(recipients.join("\n"))
    } catch (error) {
      toast.error(getApiErrorMessage(error, t("notifications.toastRecipientsFetchError")))
      setIsRecipientsDialogOpen(false)
      setRecipientsDialogChannel(null)
    } finally {
      setRecipientsLoading(false)
    }
  }

  const handleUpdateRecipients = async () => {
    if (!recipientsDialogChannel) {
      return
    }

    setRecipientsSaving(true)

    try {
      await api.setRecipients(recipientsDialogChannel.id, {
        recipients: normalizeRecipientsInput(recipientsInput),
      })

      toast.success(t("notifications.toastRecipientsUpdateSuccess"))
      setIsRecipientsDialogOpen(false)
      setRecipientsDialogChannel(null)
      setRecipientsInput("")
      await fetchChannels(true)
    } catch (error) {
      toast.error(getApiErrorMessage(error, t("notifications.toastRecipientsUpdateError")))
    } finally {
      setRecipientsSaving(false)
    }
  }

  const handleToggleEnabled = async (channel: ChannelOverview) => {
    setTogglingId(channel.id)

    try {
      await api.updateChannelConfig(channel.id, {
        enabled: !channel.enabled,
      })

      toast.success(
        channel.enabled
          ? t("notifications.toastToggleDisableSuccess")
          : t("notifications.toastToggleEnableSuccess")
      )

      await fetchChannels(true)
    } catch (error) {
      toast.error(getApiErrorMessage(error, t("notifications.toastToggleError")))
    } finally {
      setTogglingId(null)
    }
  }

  const handleTestChannel = async (channel: ChannelOverview) => {
    setTestingId(channel.id)

    try {
      await api.testChannel(channel.id)
      toast.success(t("notifications.toastTestSuccess"))
    } catch (error) {
      toast.error(getApiErrorMessage(error, t("notifications.toastTestError")))
    } finally {
      setTestingId(null)
    }
  }

  const handleDeleteChannel = async () => {
    if (!deleteDialogChannel) {
      return
    }

    setDeletingId(deleteDialogChannel.id)

    try {
      await api.deleteChannelConfig(deleteDialogChannel.id)
      toast.success(t("notifications.toastDeleteSuccess"))
      setDeleteDialogChannel(null)
      await fetchChannels(true)
    } catch (error) {
      toast.error(
        getStatusAwareMessage(error, t("notifications.toastDeleteError"), {
          404: t("notifications.toastDeleteNotFound"),
        })
      )
    } finally {
      setDeletingId(null)
    }
  }

  const severityOptions = CHANNEL_SEVERITY_OPTIONS

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="space-y-1">
          <h2 className="text-2xl font-bold tracking-tight">{t("notifications.title")}</h2>
          <p className="text-sm text-muted-foreground">{t("notifications.description")}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => fetchChannels(true)}
            disabled={refreshing}
          >
            {refreshing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
            {t("notifications.refreshButton")}
          </Button>
          <Button type="button" onClick={openCreateDialog}>
            <Plus className="mr-2 h-4 w-4" />
            {t("notifications.createButton")}
          </Button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>{t("notifications.statTotal")}</CardDescription>
            <CardTitle className="text-2xl">{stats.total}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>{t("notifications.statEnabled")}</CardDescription>
            <CardTitle className="text-2xl text-emerald-600">{stats.enabled}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>{t("notifications.statDisabled")}</CardDescription>
            <CardTitle className="text-2xl text-muted-foreground">{stats.disabled}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>{t("notifications.statNoRecipients")}</CardDescription>
            <CardTitle className="text-2xl text-amber-600">{stats.missingRecipients}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      <Card>
        <CardHeader className="space-y-4">
          <div>
            <CardTitle>{t("notifications.filtersTitle")}</CardTitle>
          </div>
          <FilterToolbar
            className="xl:grid-cols-5"
            search={{
              value: searchKeyword,
              onValueChange: setSearchKeyword,
              placeholder: t("notifications.searchPlaceholder"),
            }}
          >
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="h-10 w-full bg-background">
                <SelectValue placeholder={t("notifications.filterTypeLabel")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("notifications.filterTypeAll")}</SelectItem>
                {availableTypes.map((type) => (
                  <SelectItem key={type} value={type}>
                    {getChannelTypeLabel(type, t)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={severityFilter} onValueChange={setSeverityFilter}>
              <SelectTrigger className="h-10 w-full bg-background">
                <SelectValue placeholder={t("notifications.filterSeverityLabel")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("notifications.filterSeverityAll")}</SelectItem>
                {severityOptions.map((severity) => (
                  <SelectItem key={severity} value={severity}>
                    {getSeverityLabel(severity, t)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={systemConfigFilter} onValueChange={setSystemConfigFilter}>
              <SelectTrigger className="h-10 w-full bg-background">
                <SelectValue placeholder={t("notifications.filterSystemConfigLabel")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("notifications.filterSystemConfigAll")}</SelectItem>
                <SelectItem value="unbound">{t("notifications.filterSystemConfigUnbound")}</SelectItem>
                {availableSystemConfigs.map((item) => (
                  <SelectItem key={item.id} value={item.id}>
                    {item.display_name} ({item.config_key})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="flex items-center gap-2">
              <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as NotificationStatusFilter)}>
                <SelectTrigger className="h-10 w-full bg-background">
                  <SelectValue placeholder={t("notifications.filterStatusLabel")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("notifications.filterStatusAll")}</SelectItem>
                  <SelectItem value="enabled">{t("notifications.filterStatusEnabled")}</SelectItem>
                  <SelectItem value="disabled">{t("notifications.filterStatusDisabled")}</SelectItem>
                </SelectContent>
              </Select>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={resetFilters}
                disabled={!hasActiveFilters}
                title={t("notifications.clearFilters")}
              >
                <FilterX className="h-4 w-4" />
              </Button>
            </div>
          </FilterToolbar>
        </CardHeader>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("notifications.tableTitle")}</CardTitle>
          <CardDescription>{t("notifications.tableDescription")}</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("notifications.tableColName")}</TableHead>
                <TableHead>{t("notifications.tableColType")}</TableHead>
                <TableHead>{t("notifications.tableColSystemConfig")}</TableHead>
                <TableHead>{t("notifications.tableColSeverity")}</TableHead>
                <TableHead>{t("notifications.tableColRecipients")}</TableHead>
                <TableHead>{t("notifications.tableColStatus")}</TableHead>
                <TableHead>{t("notifications.tableColUpdated")}</TableHead>
                <TableHead className="text-right">{t("notifications.tableColActions")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({ length: 4 }).map((_, index) => (
                  <TableRow key={index}>
                    <TableCell colSpan={8} className="h-16 text-muted-foreground">
                      {t("notifications.tableLoading")}
                    </TableCell>
                  </TableRow>
                ))
              ) : filteredChannels.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="h-40 text-center text-muted-foreground">
                    <div className="mx-auto flex max-w-sm flex-col items-center gap-2">
                      <TriangleAlert className="h-5 w-5" />
                      <p>{hasActiveFilters ? t("notifications.tableEmptyFiltered") : t("notifications.tableEmpty")}</p>
                      {!hasActiveFilters ? (
                        <p className="text-xs">{t("notifications.tableEmptyHint")}</p>
                      ) : null}
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filteredChannels.map((channel) => {
                  const recipients = channel.recipients || []
                  const boundSystemConfig = channel.system_config_id
                    ? systemConfigMap.get(channel.system_config_id)
                    : null
                  const statusKey = channel.enabled ? "notifications.statusEnabled" : "notifications.statusDisabled"
                  const recipientCountKey = recipients.length === 1
                    ? "notifications.recipientCountOne"
                    : "notifications.recipientCountMany"

                  return (
                    <TableRow key={channel.id}>
                      <TableCell>
                        <div className="space-y-1">
                          <p className="font-medium">{channel.name}</p>
                          <p className="line-clamp-1 text-xs text-muted-foreground">
                            {channel.description || "-"}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span className="text-primary">{getChannelIcon(channel.channel_type)}</span>
                          <span className="text-sm">{getChannelTypeLabel(channel.channel_type, t)}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {boundSystemConfig ? (
                          <div className="space-y-1">
                            <p className="text-sm">{boundSystemConfig.display_name}</p>
                            <p className="font-mono text-xs text-muted-foreground">
                              {boundSystemConfig.config_key}
                            </p>
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground">
                            {t("notifications.systemConfigNone")}
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={getSeverityClassName(channel.min_severity)}>
                          {getSeverityLabel(channel.min_severity, t)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {recipients.length > 0 ? (
                          <div className="space-y-1">
                            <div className="flex flex-wrap gap-1">
                              {recipients.slice(0, 2).map((recipient) => (
                                <Badge key={recipient} variant="secondary" className="max-w-[180px] truncate">
                                  {recipient}
                                </Badge>
                              ))}
                              {recipients.length > 2 ? (
                                <span className="text-xs text-muted-foreground">
                                  {t("notifications.recipientMore", {
                                    count: recipients.length - 2,
                                  })}
                                </span>
                              ) : null}
                            </div>
                            <p className="text-xs text-muted-foreground">
                              {t(recipientCountKey, { count: recipients.length })}
                            </p>
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground">
                            {t("notifications.recipientNone")}
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Switch
                            checked={channel.enabled}
                            onCheckedChange={() => handleToggleEnabled(channel)}
                            disabled={togglingId === channel.id}
                            aria-label={t("notifications.toggleLabel")}
                          />
                          <Badge variant={channel.enabled ? "secondary" : "outline"}>
                            {channel.enabled ? (
                              <CheckCircle2 className="mr-1 h-3 w-3 text-emerald-600" />
                            ) : (
                              <CircleOff className="mr-1 h-3 w-3 text-muted-foreground" />
                            )}
                            {t(statusKey)}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {formatDateTime(channel.updated_at, locale)}
                      </TableCell>
                      <TableCell>
                        <div className="flex justify-end gap-1">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => openEditDialog(channel)}
                            title={t("notifications.actionEdit")}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => handleOpenRecipientsDialog(channel)}
                            title={t("notifications.actionRecipients")}
                          >
                            <Users className="h-4 w-4" />
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            disabled={testingId === channel.id || !channel.enabled}
                            onClick={() => handleTestChannel(channel)}
                            title={t("notifications.actionTest")}
                          >
                            {testingId === channel.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Send className="h-4 w-4" />
                            )}
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => setDeleteDialogChannel(channel)}
                            title={t("notifications.actionDelete")}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog
        open={isChannelDialogOpen}
        onOpenChange={(open) => {
          setIsChannelDialogOpen(open)
          if (!open) {
            setEditingChannel(null)
          }
        }}
      >
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingChannel ? t("notifications.dialogEditTitle") : t("notifications.dialogCreateTitle")}
            </DialogTitle>
            <DialogDescription>
              {editingChannel
                ? t("notifications.dialogEditDescription")
                : t("notifications.dialogCreateDescription")}
            </DialogDescription>
          </DialogHeader>

          <form className="min-w-0 space-y-4" onSubmit={handleSubmitChannel}>
            <NotificationChannelFormFields
              form={channelForm}
              setForm={setChannelForm}
              idPrefix="channel"
              isEditing={Boolean(editingChannel)}
              severityOptions={severityOptions}
              systemConfigOptions={channelSystemConfigOptions}
              shouldRequireSystemConfig={shouldRequireSystemConfig}
              getSeverityLabel={getSeverityLabelForForm}
              t={t}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsChannelDialogOpen(false)
                  setEditingChannel(null)
                }}
                disabled={formSubmitting}
              >
                {t("notifications.dialogCancel")}
              </Button>
              <Button type="submit" disabled={formSubmitting}>
                {formSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                {editingChannel ? t("notifications.dialogUpdateSubmit") : t("notifications.dialogCreateSubmit")}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog
        open={isRecipientsDialogOpen}
        onOpenChange={(open) => {
          setIsRecipientsDialogOpen(open)

          if (!open) {
            setRecipientsDialogChannel(null)
            setRecipientsInput("")
          }
        }}
      >
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{t("notifications.recipientsDialogTitle")}</DialogTitle>
            <DialogDescription>
              {t("notifications.recipientsDialogDescription", {
                name: recipientsDialogChannel?.name || "-",
              })}
            </DialogDescription>
          </DialogHeader>

          {recipientsLoading ? (
            <div className="flex items-center justify-center py-10 text-sm text-muted-foreground">
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {t("notifications.recipientsDialogLoading")}
            </div>
          ) : (
            <div className="space-y-2">
              <Label htmlFor="recipients-input">{t("notifications.recipientsDialogField")}</Label>
              <Textarea
                id="recipients-input"
                value={recipientsInput}
                onChange={(event) => setRecipientsInput(event.target.value)}
                className="min-h-[180px]"
              />
              <p className="text-xs text-muted-foreground">
                {t("notifications.recipientsDialogHint")}
              </p>
            </div>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsRecipientsDialogOpen(false)}
              disabled={recipientsSaving}
            >
              {t("notifications.recipientsDialogCancel")}
            </Button>
            <Button
              type="button"
              onClick={handleUpdateRecipients}
              disabled={recipientsLoading || recipientsSaving}
            >
              {recipientsSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              {t("notifications.recipientsDialogSubmit")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={Boolean(deleteDialogChannel)}
        onOpenChange={(open) => {
          if (!open) {
            setDeleteDialogChannel(null)
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("notifications.deleteDialogTitle")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("notifications.deleteDialogDescription", {
                name: deleteDialogChannel?.name || "-",
              })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={Boolean(deletingId)}>
              {t("notifications.dialogCancel")}
            </AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={handleDeleteChannel}
              disabled={Boolean(deletingId)}
            >
              {deletingId ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              {t("notifications.deleteDialogConfirm")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
