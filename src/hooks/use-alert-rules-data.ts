import { useCallback, useEffect, useState } from "react";
import { api } from "@/lib/api";
import type { AppNamespaceTranslator } from "@/hooks/use-app-translations";
import { AlertRuleResponse } from "@/types/api";
import { toastApiError } from "@/lib/toast";

type UseAlertRulesDataOptions = {
  t: AppNamespaceTranslator<"alerts">;
};

export function useAlertRulesData({ t }: UseAlertRulesDataOptions) {
  type MetricOption = {
    value: string;
    label: string;
  };

  const [rules, setRules] = useState<AlertRuleResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [metricOptions, setMetricOptions] = useState<MetricOption[]>([]);
  const [loadingMetrics, setLoadingMetrics] = useState(false);
  const [allowManualInput, setAllowManualInput] = useState(false);

  const fetchRules = useCallback(
    async (silent = false) => {
      if (silent) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      try {
        const data = await api.getAlertRules();
        setRules(data);
      } catch (error) {
        toastApiError(error, t("rules.toastFetchError"));
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [t],
  );

  const fetchMetricNames = useCallback(async () => {
    setLoadingMetrics(true);
    setAllowManualInput(false);

    try {
      const dictItems = await api.listDictionariesByType(
        "metric_name,rule_type",
        false,
      );

      if (dictItems.length > 0) {
        const unique = new Map<
          string,
          { value: string; label: string; sortOrder: number }
        >();
        dictItems.forEach((item) => {
          const value = item.dict_key;
          if (!value) return;
          const key = `${item.dict_type}:${value}`;
          if (unique.has(key)) return;
          unique.set(key, {
            value,
            label: item.dict_label || value,
            sortOrder: item.sort_order ?? Number.MAX_SAFE_INTEGER,
          });
        });

        const options = Array.from(unique.values())
          .sort(
            (a, b) =>
              a.sortOrder - b.sortOrder ||
              a.label.localeCompare(b.label) ||
              a.value.localeCompare(b.value),
          )
          .map(({ value, label }) => ({ value, label }));

        setMetricOptions(options);
        setAllowManualInput(false);
        return;
      }

      const metricNames = await api.getMetricNames();
      if (metricNames.length > 0) {
        setMetricOptions(
          metricNames.map((name) => ({ value: name, label: name })),
        );
        setAllowManualInput(false);
      } else {
        setMetricOptions([]);
        setAllowManualInput(true);
      }
    } catch (error) {
      console.warn("Failed to fetch metric names:", error);
      setMetricOptions([]);
      setAllowManualInput(true);
    } finally {
      setLoadingMetrics(false);
    }
  }, []);

  useEffect(() => {
    fetchRules();
    fetchMetricNames();
  }, [fetchRules, fetchMetricNames]);

  return {
    rules,
    loading,
    refreshing,
    metricOptions,
    loadingMetrics,
    allowManualInput,
    fetchRules,
    fetchMetricNames,
  };
}
