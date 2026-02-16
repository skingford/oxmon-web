"use client"

import { useMemo } from "react"
import type { AppNamespaceTranslator } from "@/hooks/use-app-translations"
import {
  getChannelTypeLabel,
  getSeverityLabel,
} from "@/lib/notifications/channel-utils"
import type { ChannelOverview } from "@/types/api"

export type NotificationStatusFilter = "all" | "enabled" | "disabled"

type NotificationFilterOption = {
  value: string
  label: string
}

type UseNotificationChannelFiltersOptions = {
  channels: ChannelOverview[]
  searchKeyword: string
  typeFilter: string
  severityFilter: string
  statusFilter: NotificationStatusFilter
  severityOptions: readonly string[]
  t: AppNamespaceTranslator<"pages">
}

export function useNotificationChannelFilters({
  channels,
  searchKeyword,
  typeFilter,
  severityFilter,
  statusFilter,
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

  const availableTypes = useMemo(() => {
    const typeSet = new Set<string>()

    channels.forEach((channel) => {
      if (channel.channel_type) {
        typeSet.add(channel.channel_type)
      }
    })

    return Array.from(typeSet).sort((left, right) => left.localeCompare(right))
  }, [channels])

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
  }, [channels, searchKeyword, severityFilter, statusFilter, typeFilter])

  const hasActiveFilters =
    Boolean(searchKeyword.trim()) ||
    typeFilter !== "all" ||
    severityFilter !== "all" ||
    statusFilter !== "all"

  const filterTypeOptions = useMemo<NotificationFilterOption[]>(
    () => availableTypes.map((type) => ({ value: type, label: getChannelTypeLabel(type, t) })),
    [availableTypes, t]
  )

  const filterSeverityOptions = useMemo<NotificationFilterOption[]>(
    () => severityOptions.map((severity) => ({ value: severity, label: getSeverityLabel(severity, t) })),
    [severityOptions, t]
  )

  return {
    stats,
    filteredChannels,
    hasActiveFilters,
    filterTypeOptions,
    filterSeverityOptions,
  }
}
