"use client"

import { useMemo } from "react"
import type { AppNamespaceTranslator } from "@/hooks/use-app-translations"
import {
  getChannelTypeLabel,
  getSeverityLabel,
} from "@/lib/notifications/channel-utils"
import type { ChannelOverview, SystemConfigResponse } from "@/types/api"

type NotificationSystemConfigOption = {
  id: string
  displayName: string
  configKey: string
  enabled: boolean
}

export type NotificationStatusFilter = "all" | "enabled" | "disabled"

type NotificationFilterOption = {
  value: string
  label: string
}

type NotificationSystemConfigFilterOption = {
  id: string
  label: string
}

type UseNotificationChannelFiltersOptions = {
  channels: ChannelOverview[]
  systemConfigs: SystemConfigResponse[]
  searchKeyword: string
  typeFilter: string
  severityFilter: string
  statusFilter: NotificationStatusFilter
  systemConfigFilter: string
  currentChannelType: string
  severityOptions: readonly string[]
  t: AppNamespaceTranslator<"pages">
}

export function useNotificationChannelFilters({
  channels,
  systemConfigs,
  searchKeyword,
  typeFilter,
  severityFilter,
  statusFilter,
  systemConfigFilter,
  currentChannelType,
  severityOptions,
  t,
}: UseNotificationChannelFiltersOptions) {
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

  const filterTypeOptions = useMemo<NotificationFilterOption[]>(
    () => availableTypes.map((type) => ({ value: type, label: getChannelTypeLabel(type, t) })),
    [availableTypes, t]
  )

  const filterSeverityOptions = useMemo<NotificationFilterOption[]>(
    () => severityOptions.map((severity) => ({ value: severity, label: getSeverityLabel(severity, t) })),
    [severityOptions, t]
  )

  const filterSystemConfigOptions = useMemo<NotificationSystemConfigFilterOption[]>(
    () =>
      availableSystemConfigs.map((item) => ({
        id: item.id,
        label: `${item.display_name} (${item.config_key})`,
      })),
    [availableSystemConfigs]
  )

  const currentChannelTypeNormalized = currentChannelType.trim().toLowerCase()

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

  return {
    stats,
    systemConfigMap,
    filteredChannels,
    hasActiveFilters,
    filterTypeOptions,
    filterSeverityOptions,
    filterSystemConfigOptions,
    channelSystemConfigOptions,
  }
}
