"use client"

import { Dispatch, FormEvent, SetStateAction, useCallback, useState } from "react"
import { api, getApiErrorMessage } from "@/lib/api"
import {
  getConfigFormValuesFromConfigJson,
  getInitialFormState,
  normalizeRecipientsInput,
  serializeChannelConfigJson,
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
  editingChannel: ChannelOverview | null
  setEditingChannel: Dispatch<SetStateAction<ChannelOverview | null>>
  channelForm: NotificationChannelFormState
  setChannelForm: Dispatch<SetStateAction<NotificationChannelFormState>>
  setIsChannelDialogOpen: Dispatch<SetStateAction<boolean>>
}

export function useNotificationChannelSubmit({
  t,
  fetchChannels,
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
        description: channel.description || "",
        minSeverity: channel.min_severity || "info",
        enabled: channel.enabled,
        recipientsInput: channel.recipients.join("\n"),
        configJson: channel.config_json || "{}",
        configFormValues: getConfigFormValuesFromConfigJson(
          channel.channel_type,
          channel.config_json || "{}"
        ),
      })
      setIsChannelDialogOpen(true)
    },
    [setChannelForm, setEditingChannel, setIsChannelDialogOpen]
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
      const normalizedChannelType = channelType.toLowerCase()
      const recipients =
        normalizedChannelType === "dingtalk"
          ? []
          : normalizeRecipientsInput(channelForm.recipientsInput)

      if (!name) {
        toast.error(t("notifications.toastNameRequired"))
        return
      }

      if (!channelType) {
        toast.error(t("notifications.toastTypeRequired"))
        return
      }

      const serializedConfigResult = serializeChannelConfigJson({
        channelType,
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

      setFormSubmitting(true)

      try {
        const basePayload: CreateChannelRequest = {
          name,
          channel_type: channelType,
          description: channelForm.description.trim() || undefined,
          min_severity: channelForm.minSeverity,
          recipients,
          config_json: serializedConfigResult.configJson,
        }

        if (editingChannel) {
          const payload: UpdateChannelConfigRequest = {
            name: basePayload.name,
            description: basePayload.description,
            min_severity: basePayload.min_severity,
            recipients: basePayload.recipients,
            config_json: basePayload.config_json,
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
