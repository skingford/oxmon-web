"use client"

import { useCallback, useEffect, useState } from "react"
import { api, getApiErrorMessage } from "@/lib/api"
import {
  ChannelOverview,
  SystemConfigResponse,
} from "@/types/api"
import { useAppTranslations } from "@/hooks/use-app-translations"
import { useNotificationChannelSubmit } from "@/hooks/use-notification-channel-submit"
import { useNotificationChannelActions } from "@/hooks/use-notification-channel-actions"
import { useNotificationChannelFilters, type NotificationStatusFilter } from "@/hooks/use-notification-channel-filters"
import {
  NotificationChannelFormFields,
  NotificationChannelFormState,
} from "@/components/notifications/NotificationChannelFormFields"
import { useRequestState } from "@/hooks/use-request-state"
import {
  createConfigMap,
  getInitialFormState,
  getSeverityLabel,
  shouldRequireSystemConfig,
} from "@/lib/notifications/channel-utils"
import { Button } from "@/components/ui/button"
import { NotificationsFiltersCard } from "@/components/notifications/NotificationsFiltersCard"
import { NotificationsStatsCards } from "@/components/notifications/NotificationsStatsCards"
import { NotificationsChannelsTable } from "@/components/notifications/NotificationsChannelsTable"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
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
import {
  Loader2,
  Plus,
  RefreshCw,
} from "lucide-react"
import { toast } from "sonner"

const CHANNEL_SEVERITY_OPTIONS = ["info", "warning", "critical"] as const

type NotificationsQueryState = {
  channels: ChannelOverview[]
  configMap: Record<string, string>
  systemConfigs: SystemConfigResponse[]
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
  const [channelForm, setChannelForm] = useState<NotificationChannelFormState>(getInitialFormState)


  const fetchChannels = useCallback(
    async (silent = false) => {
      await execute(
        async () => {
          const [channelRows, configRows] = await Promise.all([
            api.listChannels(),
            api.listChannelConfigs().catch(() => []),
          ])
          const systemConfigRows = await api
            .listSystemConfigs()
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

  const {
    stats,
    systemConfigMap,
    filteredChannels,
    hasActiveFilters,
    filterTypeOptions,
    filterSeverityOptions,
    filterSystemConfigOptions,
    channelSystemConfigOptions,
  } = useNotificationChannelFilters({
    channels,
    systemConfigs,
    searchKeyword,
    typeFilter,
    severityFilter,
    statusFilter,
    systemConfigFilter,
    currentChannelType: channelForm.channelType,
    severityOptions: CHANNEL_SEVERITY_OPTIONS,
    t,
  })

  const severityOptions = CHANNEL_SEVERITY_OPTIONS

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

  const {
    formSubmitting,
    openCreateDialog,
    openEditDialog,
    closeChannelDialog,
    handleChannelDialogOpenChange,
    handleSubmitChannel,
  } = useNotificationChannelSubmit({
    t,
    fetchChannels,
    configMap,
    editingChannel,
    setEditingChannel,
    channelForm,
    setChannelForm,
    setIsChannelDialogOpen,
  })

  const {
    isRecipientsDialogOpen,
    recipientsDialogChannel,
    recipientsLoading,
    recipientsSaving,
    recipientsInput,
    setRecipientsInput,
    handleRecipientsDialogOpenChange,
    handleOpenRecipientsDialog,
    handleUpdateRecipients,
    testingId,
    togglingId,
    deleteDialogChannel,
    deletingId,
    openDeleteDialog,
    handleDeleteDialogOpenChange,
    handleToggleEnabled,
    handleTestChannel,
    handleDeleteChannel,
  } = useNotificationChannelActions({
    t,
    fetchChannels,
  })

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

      <NotificationsStatsCards stats={stats} t={t} />

      <NotificationsFiltersCard
        searchKeyword={searchKeyword}
        typeFilter={typeFilter}
        severityFilter={severityFilter}
        statusFilter={statusFilter}
        systemConfigFilter={systemConfigFilter}
        hasActiveFilters={hasActiveFilters}
        typeOptions={filterTypeOptions}
        severityOptions={filterSeverityOptions}
        systemConfigOptions={filterSystemConfigOptions}
        onSearchKeywordChange={setSearchKeyword}
        onTypeFilterChange={setTypeFilter}
        onSeverityFilterChange={setSeverityFilter}
        onStatusFilterChange={setStatusFilter}
        onSystemConfigFilterChange={setSystemConfigFilter}
        onResetFilters={resetFilters}
      />

      <NotificationsChannelsTable
        loading={loading}
        channels={filteredChannels}
        hasActiveFilters={hasActiveFilters}
        systemConfigMap={systemConfigMap}
        togglingId={togglingId}
        testingId={testingId}
        locale={locale}
        t={t}
        onEdit={openEditDialog}
        onOpenRecipients={handleOpenRecipientsDialog}
        onToggleEnabled={handleToggleEnabled}
        onTestChannel={handleTestChannel}
        onOpenDelete={openDeleteDialog}
      />

      <Dialog
        open={isChannelDialogOpen}
        onOpenChange={handleChannelDialogOpenChange}
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
                onClick={closeChannelDialog}
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
        onOpenChange={handleRecipientsDialogOpenChange}
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
              onClick={() => handleRecipientsDialogOpenChange(false)}
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
        onOpenChange={handleDeleteDialogOpenChange}
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
