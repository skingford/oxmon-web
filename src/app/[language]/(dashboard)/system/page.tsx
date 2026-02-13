"use client"

import { FormEvent, useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { api, getApiErrorMessage } from "@/lib/api"
import {
  ChannelOverview,
  CreateSystemConfigRequest,
  RuntimeConfig,
  StorageInfo,
  SystemConfigResponse,
  UpdateSystemConfigRequest,
} from "@/types/api"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { toast } from "sonner"
import {
  BookText,
  FilterX,
  Loader2,
  Plus,
  Settings,
  HardDrive,
  Shield,
  RefreshCw,
  Server,
  Tag,
  Trash2,
  Pencil,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { useAppTranslations } from "@/hooks/use-app-translations"
import { SystemConfigFormFields, SystemConfigFormState } from "@/components/system/SystemConfigFormFields"
import {
  getInitialSystemConfigForm,
  getSystemConfigFormFromItem,
} from "@/lib/system/system-config-form"
import { withLocalePrefix } from "@/components/app-locale"
import { motion } from "framer-motion"

type SystemConfigStatusFilter = "all" | "enabled" | "disabled"

export default function SystemPage() {
  const { t, locale } = useAppTranslations("system")
  const [config, setConfig] = useState<RuntimeConfig | null>(null)
  const [storage, setStorage] = useState<StorageInfo | null>(null)
  const [systemConfigs, setSystemConfigs] = useState<SystemConfigResponse[]>([])
  const [notificationChannels, setNotificationChannels] = useState<ChannelOverview[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [cleaning, setCleaning] = useState(false)
  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false)
  const [isCleanupDialogOpen, setIsCleanupDialogOpen] = useState(false)
  const [isSystemConfigDialogOpen, setIsSystemConfigDialogOpen] = useState(false)
  const [editingSystemConfig, setEditingSystemConfig] = useState<SystemConfigResponse | null>(null)
  const [systemConfigForm, setSystemConfigForm] = useState<SystemConfigFormState>(getInitialSystemConfigForm)
  const [systemConfigSubmitting, setSystemConfigSubmitting] = useState(false)
  const [systemConfigDeleteTarget, setSystemConfigDeleteTarget] = useState<SystemConfigResponse | null>(null)
  const [deletingSystemConfigId, setDeletingSystemConfigId] = useState<string | null>(null)
  const [togglingSystemConfigId, setTogglingSystemConfigId] = useState<string | null>(null)
  const [systemConfigSearchKeyword, setSystemConfigSearchKeyword] = useState("")
  const [systemConfigTypeFilter, setSystemConfigTypeFilter] = useState("all")
  const [systemConfigStatusFilter, setSystemConfigStatusFilter] = useState<SystemConfigStatusFilter>("all")
  const [passwordForm, setPasswordForm] = useState({ current_password: "", new_password: "" })
  const [changing, setChanging] = useState(false)

  const fetchData = async (silent = false) => {
    if (silent) {
      setRefreshing(true)
    } else {
      setLoading(true)
    }

    try {
      const [configData, storageData, systemConfigRows, channelRows] = await Promise.all([
        api.getSystemConfig(),
        api.getStorageInfo(),
        api.listSystemConfigs(),
        api.listChannels().catch(() => []),
      ])
      setConfig(configData)
      setStorage(storageData)
      setSystemConfigs(systemConfigRows)
      setNotificationChannels(channelRows)
    } catch (error) {
      toast.error(getApiErrorMessage(error, t("toastFetchError")))
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const handleConfirmCleanup = async () => {
    setCleaning(true)
    try {
      await api.triggerCleanup()
      toast.success(t("toastCleanupSuccess"))
      const storageData = await api.getStorageInfo()
      setStorage(storageData)
      setIsCleanupDialogOpen(false)
    } catch (error) {
      toast.error(getApiErrorMessage(error, t("toastCleanupError")))
    } finally {
      setCleaning(false)
    }
  }

  const handleChangePassword = async () => {
    if (!passwordForm.current_password || !passwordForm.new_password) {
      toast.error(t("toastPasswordRequired"))
      return
    }
    setChanging(true)
    try {
      await api.changePassword(passwordForm)
      toast.success(t("toastPasswordSuccess"))
      setIsPasswordDialogOpen(false)
      setPasswordForm({ current_password: "", new_password: "" })
    } catch (error) {
      toast.error(getApiErrorMessage(error, t("toastPasswordError")))
    } finally {
      setChanging(false)
    }
  }

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB", "TB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  }

  const formatUptime = (seconds: number) => {
    const days = Math.floor(seconds / 86400)
    const hours = Math.floor((seconds % 86400) / 3600)
    return t("uptimeFormat", { days, hours })
  }

  const formatDateTime = (value: string) => {
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

  const systemConfigStats = useMemo(() => {
    const total = systemConfigs.length
    const enabled = systemConfigs.filter((item) => item.enabled).length
    const disabled = total - enabled

    return { total, enabled, disabled }
  }, [systemConfigs])

  const availableSystemConfigTypes = useMemo(() => {
    return Array.from(new Set(systemConfigs.map((item) => item.config_type))).sort((a, b) =>
      a.localeCompare(b)
    )
  }, [systemConfigs])

  const systemConfigReferenceMap = useMemo(() => {
    const map = new Map<string, { count: number; channelNames: string[] }>()

    notificationChannels.forEach((channel) => {
      if (!channel.system_config_id) {
        return
      }

      const previous = map.get(channel.system_config_id) || {
        count: 0,
        channelNames: [],
      }

      previous.count += 1
      if (!previous.channelNames.includes(channel.name) && previous.channelNames.length < 3) {
        previous.channelNames.push(channel.name)
      }
      map.set(channel.system_config_id, previous)
    })

    return map
  }, [notificationChannels])

  const deletingTargetReference = systemConfigDeleteTarget
    ? systemConfigReferenceMap.get(systemConfigDeleteTarget.id) || { count: 0, channelNames: [] }
    : { count: 0, channelNames: [] }

  const filteredSystemConfigs = useMemo(() => {
    const keyword = systemConfigSearchKeyword.trim().toLowerCase()

    return systemConfigs
      .filter((item) => {
        if (systemConfigTypeFilter !== "all" && item.config_type !== systemConfigTypeFilter) {
          return false
        }

        if (systemConfigStatusFilter === "enabled" && !item.enabled) {
          return false
        }

        if (systemConfigStatusFilter === "disabled" && item.enabled) {
          return false
        }

        if (!keyword) {
          return true
        }

        return [
          item.display_name,
          item.config_key,
          item.config_type,
          item.provider || "",
          item.description || "",
        ]
          .join(" ")
          .toLowerCase()
          .includes(keyword)
      })
      .sort((left, right) => {
        const leftTime = new Date(left.updated_at).getTime() || 0
        const rightTime = new Date(right.updated_at).getTime() || 0
        return rightTime - leftTime
      })
  }, [systemConfigs, systemConfigSearchKeyword, systemConfigStatusFilter, systemConfigTypeFilter])

  const hasActiveSystemConfigFilters =
    Boolean(systemConfigSearchKeyword.trim()) ||
    systemConfigTypeFilter !== "all" ||
    systemConfigStatusFilter !== "all"

  const openCreateSystemConfigDialog = () => {
    setEditingSystemConfig(null)
    setSystemConfigForm(getInitialSystemConfigForm())
    setIsSystemConfigDialogOpen(true)
  }

  const openEditSystemConfigDialog = (item: SystemConfigResponse) => {
    setEditingSystemConfig(item)
    setSystemConfigForm(getSystemConfigFormFromItem(item))
    setIsSystemConfigDialogOpen(true)
  }

  const handleResetSystemConfigFilters = () => {
    setSystemConfigSearchKeyword("")
    setSystemConfigTypeFilter("all")
    setSystemConfigStatusFilter("all")
  }

  const handleSubmitSystemConfig = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const displayName = systemConfigForm.displayName.trim()
    const configKey = systemConfigForm.configKey.trim()
    const configType = systemConfigForm.configType.trim().toLowerCase()
    const provider = systemConfigForm.provider.trim()
    const description = systemConfigForm.description.trim()
    const configJsonInput = systemConfigForm.configJson.trim()

    if (!displayName) {
      toast.error(t("systemConfigToastDisplayNameRequired"))
      return
    }

    if (!editingSystemConfig && !configKey) {
      toast.error(t("systemConfigToastConfigKeyRequired"))
      return
    }

    if (!editingSystemConfig && !configType) {
      toast.error(t("systemConfigToastConfigTypeRequired"))
      return
    }

    if (!configJsonInput) {
      toast.error(t("systemConfigToastConfigJsonRequired"))
      return
    }

    let normalizedConfigJson = "{}"

    try {
      normalizedConfigJson = JSON.stringify(JSON.parse(configJsonInput))
    } catch {
      toast.error(t("systemConfigToastConfigJsonInvalid"))
      return
    }

    setSystemConfigSubmitting(true)

    try {
      if (editingSystemConfig) {
        const payload: UpdateSystemConfigRequest = {
          display_name: displayName,
          description: description || null,
          config_json: normalizedConfigJson,
          enabled: systemConfigForm.enabled,
        }

        await api.updateSystemConfig(editingSystemConfig.id, payload)
        toast.success(t("systemConfigToastUpdateSuccess"))
      } else {
        const payload: CreateSystemConfigRequest = {
          config_key: configKey,
          config_type: configType,
          display_name: displayName,
          description: description || null,
          config_json: normalizedConfigJson,
        }

        if (provider) {
          payload.provider = provider
        }

        await api.createSystemConfig(payload)
        toast.success(t("systemConfigToastCreateSuccess"))
      }

      setIsSystemConfigDialogOpen(false)
      setEditingSystemConfig(null)
      setSystemConfigForm(getInitialSystemConfigForm())
      await fetchData(true)
    } catch (error) {
      toast.error(
        getApiErrorMessage(
          error,
          editingSystemConfig
            ? t("systemConfigToastUpdateError")
            : t("systemConfigToastCreateError")
        )
      )
    } finally {
      setSystemConfigSubmitting(false)
    }
  }

  const handleToggleSystemConfigEnabled = async (item: SystemConfigResponse, enabled: boolean) => {
    if (item.enabled === enabled) {
      return
    }

    setTogglingSystemConfigId(item.id)

    try {
      const updated = await api.updateSystemConfig(item.id, { enabled })
      setSystemConfigs((previous) =>
        previous.map((row) => (row.id === updated.id ? updated : row))
      )
      toast.success(
        enabled
          ? t("systemConfigToastEnableSuccess")
          : t("systemConfigToastDisableSuccess")
      )
    } catch (error) {
      toast.error(getApiErrorMessage(error, t("systemConfigToastToggleError")))
    } finally {
      setTogglingSystemConfigId(null)
    }
  }

  const handleDeleteSystemConfig = async () => {
    if (!systemConfigDeleteTarget) {
      return
    }

    const reference = systemConfigReferenceMap.get(systemConfigDeleteTarget.id)
    if (reference && reference.count > 0) {
      toast.error(
        t("systemConfigToastDeleteReferenced", {
          count: reference.count,
        })
      )
      return
    }

    setDeletingSystemConfigId(systemConfigDeleteTarget.id)

    try {
      await api.deleteSystemConfig(systemConfigDeleteTarget.id)
      toast.success(t("systemConfigToastDeleteSuccess"))
      setSystemConfigDeleteTarget(null)
      await fetchData(true)
    } catch (error) {
      toast.error(getApiErrorMessage(error, t("systemConfigToastDeleteError")))
    } finally {
      setDeletingSystemConfigId(null)
    }
  }

  if (loading) {
    return (
      <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-6 px-8 pb-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">{t("title")}</h2>
          <p className="text-sm text-muted-foreground">{t("description")}</p>
        </div>
        <Button
          variant="outline"
          onClick={() => fetchData(true)}
          disabled={refreshing}
        >
          <RefreshCw className={`mr-2 h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
          {t("btnRefresh")}
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Runtime Configuration */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Server className="h-5 w-5" />
                {t("runtimeTitle")}
              </CardTitle>
              <CardDescription>{t("runtimeDescription")}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium">{t("fieldHttpPort")}</Label>
                  <Input readOnly value={config?.http_port} className="bg-muted font-mono" />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium">{t("fieldGrpcPort")}</Label>
                  <Input readOnly value={config?.grpc_port} className="bg-muted font-mono" />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium">{t("fieldDataDir")}</Label>
                <Input readOnly value={config?.data_dir || "N/A"} className="bg-muted font-mono" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium">{t("fieldRetentionDays")}</Label>
                  <Input
                    readOnly
                    value={config?.retention_days ?? "N/A"}
                    className="bg-muted font-mono"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium">{t("fieldAgentAuth")}</Label>
                  <Input
                    readOnly
                    value={
                      config?.require_agent_auth
                        ? t("systemConfigFilterStatusEnabled")
                        : t("systemConfigFilterStatusDisabled")
                    }
                    className="bg-muted"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium">{t("fieldCertCheckEnabled")}</Label>
                  <Input
                    readOnly
                    value={
                      config?.cert_check_enabled
                        ? t("systemConfigFilterStatusEnabled")
                        : t("systemConfigFilterStatusDisabled")
                    }
                    className="bg-muted"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium">{t("fieldCertCheckDefaultInterval")}</Label>
                  <Input
                    readOnly
                    value={config?.cert_check_default_interval_secs ?? "N/A"}
                    className="bg-muted font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium">{t("fieldCertCheckTickSecs")}</Label>
                  <Input
                    readOnly
                    value={config?.cert_check_tick_secs ?? "N/A"}
                    className="bg-muted font-mono"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium">{t("fieldCertCheckMaxConcurrent")}</Label>
                  <Input
                    readOnly
                    value={config?.cert_check_max_concurrent ?? "N/A"}
                    className="bg-muted font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium">{t("fieldNotifyAggregationWindow")}</Label>
                  <Input
                    readOnly
                    value={config?.notification_aggregation_window_secs ?? "N/A"}
                    className="bg-muted font-mono"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium">{t("fieldAlertRulesCount")}</Label>
                  <Input
                    readOnly
                    value={config?.alert_rules_count ?? 0}
                    className="bg-muted font-mono"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium">{t("fieldNotificationChannelsCount")}</Label>
                <Input
                  readOnly
                  value={config?.notification_channels_count ?? 0}
                  className="bg-muted font-mono"
                />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Storage Management */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <HardDrive className="h-5 w-5" />
                {t("storageTitle")}
              </CardTitle>
              <CardDescription>{t("storageDescription")}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium">{t("fieldTotalSize")}</Label>
                <Input
                  readOnly
                  value={storage ? formatBytes(storage.total_size_bytes) : "0 Bytes"}
                  className="bg-muted font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium">{t("fieldTotalPartitions")}</Label>
                  <Input
                    readOnly
                    value={storage?.total_partitions || 0}
                    className="bg-muted font-mono"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium">{t("fieldLatestPartitionDate")}</Label>
                  <Input
                    readOnly
                    value={storage?.partitions?.[0]?.date || "-"}
                    className="bg-muted font-mono"
                  />
                </div>
              </div>

              <div className="pt-4 border-t">
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => setIsCleanupDialogOpen(true)}
                >
                  <Settings className="mr-2 h-4 w-4" />
                  {t("btnCleanup")}
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Security Settings */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="md:col-span-2"
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                {t("securityTitle")}
              </CardTitle>
              <CardDescription>{t("securityDescription")}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between p-4 rounded-lg border bg-muted/50">
                <div>
                  <p className="font-medium text-sm">{t("fieldPassword")}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {t("securityDescription")}
                  </p>
                </div>
                <Button onClick={() => setIsPasswordDialogOpen(true)}>
                  {t("btnChangePassword")}
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="md:col-span-2"
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookText className="h-5 w-5" />
                {t("dictionaryQuickTitle")}
              </CardTitle>
              <CardDescription>{t("dictionaryQuickDescription")}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 md:grid-cols-2">
                <Button asChild variant="outline" className="h-11 justify-start">
                  <Link href={withLocalePrefix("/system/dictionaries", locale)}>
                    <BookText className="mr-2 h-4 w-4" />
                    {t("dictionaryQuickEntries")}
                  </Link>
                </Button>
                <Button asChild variant="outline" className="h-11 justify-start">
                  <Link href={withLocalePrefix("/system/dictionaries/types", locale)}>
                    <Tag className="mr-2 h-4 w-4" />
                    {t("dictionaryQuickTypes")}
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      <Dialog
        open={isSystemConfigDialogOpen}
        onOpenChange={(open) => {
          setIsSystemConfigDialogOpen(open)

          if (!open) {
            setEditingSystemConfig(null)
            setSystemConfigForm(getInitialSystemConfigForm())
          }
        }}
      >
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingSystemConfig
                ? t("systemConfigDialogEditTitle")
                : t("systemConfigDialogCreateTitle")}
            </DialogTitle>
            <DialogDescription>
              {editingSystemConfig
                ? t("systemConfigDialogEditDescription")
                : t("systemConfigDialogCreateDescription")}
            </DialogDescription>
          </DialogHeader>

          <form className="space-y-4" onSubmit={handleSubmitSystemConfig}>
            <SystemConfigFormFields
              form={systemConfigForm}
              setForm={setSystemConfigForm}
              idPrefix="system-config"
              isEditing={Boolean(editingSystemConfig)}
              providerReadOnly={Boolean(editingSystemConfig && !editingSystemConfig.provider)}
              t={t}
            />

            <DialogFooter>
              <Button
                variant="outline"
                type="button"
                onClick={() => setIsSystemConfigDialogOpen(false)}
                disabled={systemConfigSubmitting}
              >
                {t("btnCancel")}
              </Button>
              <Button type="submit" disabled={systemConfigSubmitting}>
                {systemConfigSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                {editingSystemConfig
                  ? t("systemConfigDialogUpdateSubmit")
                  : t("systemConfigDialogCreateSubmit")}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={Boolean(systemConfigDeleteTarget)}
        onOpenChange={(open) => {
          if (!open) {
            setSystemConfigDeleteTarget(null)
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("systemConfigDeleteDialogTitle")}</AlertDialogTitle>
            <AlertDialogDescription>
              <div className="space-y-2">
                <p>
                  {t("systemConfigDeleteDialogDescription", {
                    name: systemConfigDeleteTarget?.display_name || "-",
                    key: systemConfigDeleteTarget?.config_key || "-",
                  })}
                </p>
                {deletingTargetReference.count > 0 ? (
                  <p className="text-amber-600">
                    {t("systemConfigDeleteDialogReferencedHint", {
                      count: deletingTargetReference.count,
                    })}
                  </p>
                ) : null}
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={Boolean(deletingSystemConfigId)}>
              {t("btnCancel")}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteSystemConfig}
              disabled={Boolean(deletingSystemConfigId) || deletingTargetReference.count > 0}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deletingSystemConfigId ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              {t("systemConfigDeleteDialogConfirm")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Change Password Dialog */}
      <Dialog open={isPasswordDialogOpen} onOpenChange={setIsPasswordDialogOpen}>
        <DialogContent className="bg-white border border-gray-200">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-gray-900">
              {t("dialogPasswordTitle")}
            </DialogTitle>
            <DialogDescription className="text-base text-gray-600">
              {t("dialogPasswordDescription")}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="old-password" className="font-medium text-gray-900">
                {t("fieldOldPassword")}
              </Label>
              <Input
                id="old-password"
                type="password"
                value={passwordForm.current_password}
                onChange={(e) =>
                  setPasswordForm({ ...passwordForm, current_password: e.target.value })
                }
                className="bg-white border-gray-300 text-gray-900"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="new-password" className="font-medium text-gray-900">
                {t("fieldNewPassword")}
              </Label>
              <Input
                id="new-password"
                type="password"
                value={passwordForm.new_password}
                onChange={(e) =>
                  setPasswordForm({ ...passwordForm, new_password: e.target.value })
                }
                className="bg-white border-gray-300 text-gray-900"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsPasswordDialogOpen(false)}
              disabled={changing}
            >
              {t("btnCancel")}
            </Button>
            <Button onClick={handleChangePassword} disabled={changing}>
              {changing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {t("btnSave")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Cleanup Confirmation Dialog */}
      <AlertDialog open={isCleanupDialogOpen} onOpenChange={setIsCleanupDialogOpen}>
        <AlertDialogContent className="bg-white border border-gray-200">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl font-bold text-gray-900">
              {t("btnCleanup")}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-base text-gray-600">
              {t("confirmCleanup")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={cleaning}>
              {t("btnCancel")}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmCleanup}
              disabled={cleaning}
            >
              {cleaning && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {t("btnCleanup")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
