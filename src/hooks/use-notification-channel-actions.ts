"use client"

import { useCallback, useState } from "react"
import { api, getApiErrorMessage } from "@/lib/api"
import { getStatusAwareMessage } from "@/lib/api-error-utils"
import { normalizeRecipientsInput } from "@/lib/notifications/channel-utils"
import type { AppNamespaceTranslator } from "@/hooks/use-app-translations"
import type { ChannelOverview } from "@/types/api"
import { toast } from "sonner"

type UseNotificationChannelActionsOptions = {
  t: AppNamespaceTranslator<"pages">
  fetchChannels: (silent?: boolean) => Promise<void>
}

export function useNotificationChannelActions({
  t,
  fetchChannels,
}: UseNotificationChannelActionsOptions) {
  const [isRecipientsDialogOpen, setIsRecipientsDialogOpen] = useState(false)
  const [recipientsDialogChannel, setRecipientsDialogChannel] = useState<ChannelOverview | null>(null)
  const [recipientsLoading, setRecipientsLoading] = useState(false)
  const [recipientsSaving, setRecipientsSaving] = useState(false)
  const [recipientsInput, setRecipientsInput] = useState("")

  const [testingId, setTestingId] = useState<string | null>(null)
  const [togglingId, setTogglingId] = useState<string | null>(null)
  const [deleteDialogChannel, setDeleteDialogChannel] = useState<ChannelOverview | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const handleRecipientsDialogOpenChange = useCallback((open: boolean) => {
    setIsRecipientsDialogOpen(open)

    if (!open) {
      setRecipientsDialogChannel(null)
      setRecipientsInput("")
    }
  }, [])

  const handleOpenRecipientsDialog = useCallback(
    async (channel: ChannelOverview) => {
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
    },
    [t]
  )

  const handleUpdateRecipients = useCallback(async () => {
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
  }, [fetchChannels, recipientsDialogChannel, recipientsInput, t])

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
        toast.error(getApiErrorMessage(error, t("notifications.toastToggleError")))
      } finally {
        setTogglingId(null)
      }
    },
    [fetchChannels, t]
  )

  const handleTestChannel = useCallback(
    async (channel: ChannelOverview) => {
      setTestingId(channel.id)

      try {
        await api.testChannel(channel.id)
        toast.success(t("notifications.toastTestSuccess"))
      } catch (error) {
        toast.error(getApiErrorMessage(error, t("notifications.toastTestError")))
      } finally {
        setTestingId(null)
      }
    },
    [t]
  )

  const openDeleteDialog = useCallback((channel: ChannelOverview) => {
    setDeleteDialogChannel(channel)
  }, [])

  const handleDeleteDialogOpenChange = useCallback((open: boolean) => {
    if (!open) {
      setDeleteDialogChannel(null)
    }
  }, [])

  const handleDeleteChannel = useCallback(async () => {
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
  }, [deleteDialogChannel, fetchChannels, t])

  return {
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
  }
}
