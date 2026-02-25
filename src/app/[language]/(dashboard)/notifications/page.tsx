"use client"

import { useCallback, useEffect, useState } from "react"
import { api } from "@/lib/api"
import {
  ChannelOverview,
} from "@/types/api"
import { useAppTranslations } from "@/hooks/use-app-translations"
import { useNotificationChannelSubmit } from "@/hooks/use-notification-channel-submit"
import { useNotificationChannelFilters, type NotificationStatusFilter } from "@/hooks/use-notification-channel-filters"
import {
  NotificationChannelFormFields,
  NotificationChannelFormState,
} from "@/components/notifications/NotificationChannelFormFields"
import { useRequestState } from "@/hooks/use-request-state"
import {
  getInitialFormState,
  getSeverityLabel,
} from "@/lib/notifications/channel-utils"
import { Button } from "@/components/ui/button"
import { NotificationsFiltersCard } from "@/components/notifications/NotificationsFiltersCard"
import { NotificationsStatsCards } from "@/components/notifications/NotificationsStatsCards"
import { NotificationsChannelsTable } from "@/components/notifications/NotificationsChannelsTable"
import {
  DialogClose,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Loader2,
  Plus,
  RefreshCw,
  X,
} from "lucide-react"
import { toast, toastApiError } from "@/lib/toast"

const CHANNEL_SEVERITY_OPTIONS = ["info", "warning", "critical"] as const

type NotificationsQueryState = {
  channels: ChannelOverview[]
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
  })

  const channels = data.channels

  const [searchKeyword, setSearchKeyword] = useState("")
  const [typeFilter, setTypeFilter] = useState("all")
  const [severityFilter, setSeverityFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState<NotificationStatusFilter>("all")

  const [isChannelDialogOpen, setIsChannelDialogOpen] = useState(false)
  const [editingChannel, setEditingChannel] = useState<ChannelOverview | null>(null)
  const [channelForm, setChannelForm] = useState<NotificationChannelFormState>(getInitialFormState)
  const [togglingId, setTogglingId] = useState<string | null>(null)


  const fetchChannels = useCallback(
    async (silent = false) => {
      await execute(
        async () => {
          return {
            channels: await api.listChannels(),
          }
        },
        {
          silent,
          onError: (error) => {
            toastApiError(error, t("notifications.toastFetchError"))
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
    filteredChannels,
    hasActiveFilters,
    filterTypeOptions,
    filterSeverityOptions,
  } = useNotificationChannelFilters({
    channels,
    searchKeyword,
    typeFilter,
    severityFilter,
    statusFilter,
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
    editingChannel,
    setEditingChannel,
    channelForm,
    setChannelForm,
    setIsChannelDialogOpen,
  })

  const handleToggleEnabled = useCallback(
    async (channel: ChannelOverview) => {
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
        toastApiError(error, t("notifications.toastToggleError"))
      } finally {
        setTogglingId(null)
      }
    },
    [fetchChannels, t]
  )

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
        hasActiveFilters={hasActiveFilters}
        typeOptions={filterTypeOptions}
        severityOptions={filterSeverityOptions}
        onSearchKeywordChange={setSearchKeyword}
        onTypeFilterChange={setTypeFilter}
        onSeverityFilterChange={setSeverityFilter}
        onStatusFilterChange={setStatusFilter}
        onResetFilters={resetFilters}
      />

      <NotificationsChannelsTable
        loading={loading}
        channels={filteredChannels}
        hasActiveFilters={hasActiveFilters}
        togglingId={togglingId}
        locale={locale}
        t={t}
        onToggleEnabled={handleToggleEnabled}
      />

      <Dialog
        open={isChannelDialogOpen}
        onOpenChange={handleChannelDialogOpenChange}
      >
        <DialogContent className="flex max-h-[88vh] flex-col gap-0 overflow-hidden p-0 sm:max-w-2xl" showCloseButton={false}>
          <DialogHeader className="sticky top-0 z-10 border-b bg-background px-6 py-4">
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-1 pr-2">
                <DialogTitle>
                  {editingChannel ? t("notifications.dialogEditTitle") : t("notifications.dialogCreateTitle")}
                </DialogTitle>
                <DialogDescription>
                  {editingChannel
                    ? t("notifications.dialogEditDescription")
                    : t("notifications.dialogCreateDescription")}
                </DialogDescription>
              </div>
              <DialogClose asChild>
                <Button type="button" variant="ghost" size="icon" className="h-8 w-8 shrink-0">
                  <X className="h-4 w-4" />
                </Button>
              </DialogClose>
            </div>
          </DialogHeader>

          <form className="flex min-h-0 flex-1 flex-col" onSubmit={handleSubmitChannel}>
            <div className="min-h-0 flex-1 overflow-y-auto px-6 py-4">
              <div className="space-y-4">
                <NotificationChannelFormFields
                  form={channelForm}
                  setForm={setChannelForm}
              idPrefix="channel"
              isEditing={Boolean(editingChannel)}
              severityOptions={severityOptions}
              getSeverityLabel={getSeverityLabelForForm}
              t={t}
            />
              </div>
            </div>

            <DialogFooter className="sticky bottom-0 z-10 border-t bg-background px-6 py-4">
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
    </div>
  )
}
