import { useCallback, useEffect, useState } from "react"
import { api, getApiErrorMessage } from "@/lib/api"
import type { AppNamespaceTranslator } from "@/hooks/use-app-translations"
import { AlertRuleResponse } from "@/types/api"
import { toast } from "sonner"

type UseAlertRulesDataOptions = {
  t: AppNamespaceTranslator<"alerts">
}

export function useAlertRulesData({ t }: UseAlertRulesDataOptions) {
  const [rules, setRules] = useState<AlertRuleResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const [metricNames, setMetricNames] = useState<string[]>([])
  const [loadingMetrics, setLoadingMetrics] = useState(false)
  const [allowManualInput, setAllowManualInput] = useState(false)

  const fetchRules = useCallback(
    async (silent = false) => {
      if (silent) {
        setRefreshing(true)
      } else {
        setLoading(true)
      }

      try {
        const data = await api.getAlertRules()
        setRules(data)
      } catch (error) {
        toast.error(getApiErrorMessage(error, t("rules.toastFetchError")))
      } finally {
        setLoading(false)
        setRefreshing(false)
      }
    },
    [t]
  )

  const fetchMetricNames = useCallback(async () => {
    setLoadingMetrics(true)
    setAllowManualInput(false)

    try {
      const names = await api.getMetricNames()
      if (names.length > 0) {
        setMetricNames(names)
        setAllowManualInput(false)
      } else {
        setMetricNames([])
        setAllowManualInput(true)
      }
    } catch (error) {
      console.warn("Failed to fetch metric names:", error)
      setMetricNames([])
      setAllowManualInput(true)
    } finally {
      setLoadingMetrics(false)
    }
  }, [])

  useEffect(() => {
    fetchRules()
  }, [fetchRules])

  return {
    rules,
    loading,
    refreshing,
    metricNames,
    loadingMetrics,
    allowManualInput,
    fetchRules,
    fetchMetricNames,
  }
}
