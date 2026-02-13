"use client"

import { Dispatch, FormEvent, SetStateAction, useCallback, useState } from "react"
import { api, getApiErrorMessage } from "@/lib/api"
import {
  getInitialFormState,
  normalizeRecipientsInput,
  shouldRequireSystemConfig,
} from "@/lib/notifications/channel-utils"
import type { AppNamespaceTranslator } from "@/hooks/use-app-translations"
import type { NotificationChannelFormState } from "@/components/notifications/NotificationChannelFormFields"
import type {
  ChannelOverview,
  CreateChannelRequest,
  UpdateChannelConfigRequest,
} from "@/types/api"
import { toast } from "sonner"

type UseNotificationChannelSubmitOptions = {
  t: AppNamespaceTranslator<"pages">
  fetchChannels: (silent?: boolean) => Promise<void>
  configMap: Record<string, string>
  editingChannel: ChannelOverview | null
  setEditingChannel: Dispatch<SetStateAction<ChannelOverview | null>>
  channelForm: NotificationChannelFormState
  setChannelForm: Dispatch<SetStateAction<NotificationChannelFormState>>
  setIsChannelDialogOpen: Dispatch<SetStateAction<boolean>>
}

export function useNotificationChannelSubmit({
  t,
  fetchChannels,
  configMap,
  editingChannel,
  setEditingChannel,
  channelForm,
  setChannelForm,
  setIsChannelDialogOpen,
}: UseNotificationChannelSubmitOptions) {
  const [formSubmitting, setFormSubmitting] = useState(false)

  const openCreateDialog = useCallback(() => {
    setEditingChannel(null)
    setChannelForm(getInitialFormState())
    setIsChannelDialogOpen(true)
  }, [setChannelForm, setEditingChannel, setIsChannelDialogOpen])

  const openEditDialog = useCallback(
    (channel: ChannelOverview) => {
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
    },
    [configMap, setChannelForm, setEditingChannel, setIsChannelDialogOpen]
  )

  const closeChannelDialog = useCallback(() => {
    setIsChannelDialogOpen(false)
    setEditingChannel(null)
  }, [setEditingChannel, setIsChannelDialogOpen])

  const handleChannelDialogOpenChange = useCallback(
    (open: boolean) => {
      setIsChannelDialogOpen(open)

      if (!open) {
        setEditingChannel(null)
      }
    },
    [setEditingChannel, setIsChannelDialogOpen]
  )

  const handleSubmitChannel = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault()

      const name = channelForm.name.trim()
      const channelType = channelForm.channelType.trim()
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
    },
    [
      channelForm,
      editingChannel,
      fetchChannels,
      setChannelForm,
      setEditingChannel,
      setIsChannelDialogOpen,
      t,
    ]
  )

  return {
    formSubmitting,
    openCreateDialog,
    openEditDialog,
    closeChannelDialog,
    handleChannelDialogOpenChange,
    handleSubmitChannel,
  }
}
