"use client"

import { useEffect, useState } from "react"
import { api } from "@/lib/api"
import { SearchableComboboxOption } from "@/components/ui/searchable-combobox"
import { buildMetricNameLabelMap } from "@/components/pages/metrics/metrics-utils"
import { buildMetricSourceDisplayNameMap } from "@/lib/metric-source"

type AlertDisplayMetadataPayload = {
  sourceDisplayNameMap: Record<string, string>
  metricNameLabelMap: Record<string, string>
  sourceOptionsByLocale: Record<"zh" | "en", SearchableComboboxOption[]>
}

const ALERT_DISPLAY_METADATA_TTL_MS = 5 * 60 * 1000

let cachedAlertDisplayMetadata: AlertDisplayMetadataPayload | null = null
let cachedAlertDisplayMetadataAt = 0
let inFlightAlertDisplayMetadataPromise: Promise<AlertDisplayMetadataPayload> | null = null

export function invalidateAlertDisplayMetadataCache() {
  cachedAlertDisplayMetadata = null
  cachedAlertDisplayMetadataAt = 0
  inFlightAlertDisplayMetadataPromise = null
}
function buildSourceOptions(
  sources: Awaited<ReturnType<typeof api.getMetricSources>>,
  locale: "zh" | "en"
): SearchableComboboxOption[] {
  return [...sources]
    .sort((a, b) =>
      (a.display_name || a.id).localeCompare(
        b.display_name || b.id,
        locale === "zh" ? "zh-CN" : "en-US"
      )
    )
    .map((item) => {
      const label = item.display_name?.trim() || item.id
      return {
        value: item.id,
        label,
        subtitle: label === item.id ? undefined : item.id,
      }
    })
}

async function fetchAlertDisplayMetadata() {
  const now = Date.now()
  const isCacheValid =
    cachedAlertDisplayMetadata &&
    now - cachedAlertDisplayMetadataAt < ALERT_DISPLAY_METADATA_TTL_MS

  if (isCacheValid) {
    return cachedAlertDisplayMetadata
  }

  if (inFlightAlertDisplayMetadataPromise) {
    return inFlightAlertDisplayMetadataPromise
  }

  inFlightAlertDisplayMetadataPromise = (async () => {
    const [sources, metricLabelItems] = await Promise.all([
      api.getMetricSources(),
      api.listDictionariesByType("metric_name", true),
    ])

    const payload: AlertDisplayMetadataPayload = {
      sourceDisplayNameMap: buildMetricSourceDisplayNameMap(sources),
      sourceOptionsByLocale: {
        zh: buildSourceOptions(sources, "zh"),
        en: buildSourceOptions(sources, "en"),
      },
      metricNameLabelMap: buildMetricNameLabelMap(
        metricLabelItems.map((item) => ({
          dict_key: item.dict_key || "",
          dict_label: item.dict_label || "",
        }))
      ),
    }

    cachedAlertDisplayMetadata = payload
    cachedAlertDisplayMetadataAt = Date.now()
    return payload
  })()

  try {
    return await inFlightAlertDisplayMetadataPromise
  } finally {
    inFlightAlertDisplayMetadataPromise = null
  }
}

export function useAlertDisplayMetadata(
  locale: "zh" | "en",
  options?: {
    refreshKey?: number
  }
) {
  const [sourceDisplayNameMap, setSourceDisplayNameMap] = useState<Record<string, string>>({})
  const [metricNameLabelMap, setMetricNameLabelMap] = useState<Record<string, string>>({})
  const [sourceOptions, setSourceOptions] = useState<SearchableComboboxOption[]>([])
  const refreshKey = options?.refreshKey ?? 0

  useEffect(() => {
    let active = true

    const fetchDisplayMetadata = async () => {
      try {
        const metadata = await fetchAlertDisplayMetadata()

        if (!active) {
          return
        }

        setSourceDisplayNameMap(metadata.sourceDisplayNameMap)
        setSourceOptions(metadata.sourceOptionsByLocale[locale] || [])
        setMetricNameLabelMap(metadata.metricNameLabelMap)
      } catch {
        if (!active) {
          return
        }

        setSourceDisplayNameMap({})
        setMetricNameLabelMap({})
        setSourceOptions([])
      }
    }

    fetchDisplayMetadata()

    return () => {
      active = false
    }
  }, [locale, refreshKey])

  return {
    sourceDisplayNameMap,
    metricNameLabelMap,
    sourceOptions,
  }
}
