"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { api } from "@/lib/api"
import type { DashboardOverview } from "@/types/api"
import { toastApiError } from "@/lib/toast"

const EMPTY_CLOUD_SUMMARY: DashboardOverview["cloud_summary"] = {
  total_accounts: 0,
  enabled_accounts: 0,
  total_instances: 0,
  running_instances: 0,
  stopped_instances: 0,
  pending_instances: 0,
  error_instances: 0,
  unknown_instances: 0,
}

const EMPTY_CERT_SUMMARY: DashboardOverview["cert_summary"] = {
  total_domains: 0,
  valid: 0,
  invalid: 0,
  expiring_soon: 0,
}

function formatUptime(seconds: number) {
  if (!Number.isFinite(seconds) || seconds < 0) {
    return "-"
  }

  const days = Math.floor(seconds / 86400)
  const hours = Math.floor((seconds % 86400) / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)

  if (days > 0) {
    return `${days} 天 ${hours} 小时`
  }

  if (hours > 0) {
    return `${hours} 小时 ${minutes} 分钟`
  }

  return `${minutes} 分钟`
}

function formatBytes(bytes: number) {
  if (!Number.isFinite(bytes) || bytes < 0) {
    return "-"
  }

  if (bytes === 0) {
    return "0 B"
  }

  const units = ["B", "KB", "MB", "GB", "TB", "PB"]
  const exponent = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1)
  const value = bytes / Math.pow(1024, exponent)

  return `${value.toFixed(value >= 100 ? 0 : value >= 10 ? 1 : 2)} ${units[exponent]}`
}

function formatPercent(numerator: number, denominator: number) {
  if (denominator <= 0) {
    return 0
  }

  return Math.round((numerator / denominator) * 100)
}

export function useDashboardOverview() {
  const [overview, setOverview] = useState<DashboardOverview | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const fetchOverview = useCallback(async (silent = false) => {
    if (silent) {
      setRefreshing(true)
    } else {
      setLoading(true)
    }

    try {
      const data = await api.getDashboardOverview()
      setOverview(data)
    } catch (error) {
      toastApiError(error, "加载仪表盘概览失败")
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => {
    void fetchOverview()
  }, [fetchOverview])

  const onlineRate = overview ? formatPercent(overview.active_agents, overview.total_agents) : 0
  const cloudSummary = overview?.cloud_summary ?? EMPTY_CLOUD_SUMMARY
  const certSummary = overview?.cert_summary ?? EMPTY_CERT_SUMMARY
  const cloudEnabledAccountRate = formatPercent(cloudSummary.enabled_accounts, cloudSummary.total_accounts)
  const uptimeText = overview ? formatUptime(overview.uptime_secs) : "-"
  const storageSizeText = overview ? formatBytes(overview.storage_total_bytes) : "-"

  const severityStats = useMemo<Array<[string, number]>>(() => {
    if (!overview) {
      return []
    }

    const predefinedOrder = ["critical", "warning", "info"]
    const allEntries = Object.entries(overview.alerts_by_severity || {})

    return allEntries.sort(([left], [right]) => {
      const leftIndex = predefinedOrder.indexOf(left.toLowerCase())
      const rightIndex = predefinedOrder.indexOf(right.toLowerCase())

      if (leftIndex === -1 && rightIndex === -1) {
        return left.localeCompare(right)
      }

      if (leftIndex === -1) {
        return 1
      }

      if (rightIndex === -1) {
        return -1
      }

      return leftIndex - rightIndex
    })
  }, [overview])

  return {
    overview,
    loading,
    refreshing,
    fetchOverview,
    onlineRate,
    cloudSummary,
    certSummary,
    cloudEnabledAccountRate,
    uptimeText,
    storageSizeText,
    severityStats,
  }
}
