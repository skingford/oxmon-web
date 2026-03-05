import { MetricsTimeRange } from "@/components/metrics/MetricsQueryToolbar";
import {
  detectMetricUnit,
  formatBinaryBytes,
  formatMetricValue,
  type MetricUnitKind,
} from "@/lib/metric-format";

export type TimeRange = MetricsTimeRange;
export type TablePageSize = "20" | "50" | "100";
export type SortField = "timestamp" | "value";
export type SortDirection = "asc" | "desc";

export interface TimeBounds {
  from?: string;
  to?: string;
}

export function matchLabelFilter(labels: Record<string, string>, rawFilter: string) {
  const filterText = rawFilter.trim().toLowerCase();

  if (!filterText) {
    return true;
  }

  const separatorIndex = filterText.indexOf(":");

  if (separatorIndex >= 0) {
    const keyFilter = filterText.slice(0, separatorIndex).trim();
    const valueFilter = filterText.slice(separatorIndex + 1).trim();

    return Object.entries(labels).some(([key, value]) => {
      const keyMatch = !keyFilter || key.toLowerCase().includes(keyFilter);
      const valueMatch =
        !valueFilter || value.toLowerCase().includes(valueFilter);
      return keyMatch && valueMatch;
    });
  }

  return Object.entries(labels).some(([key, value]) => {
    const keyText = key.toLowerCase();
    const valueText = value.toLowerCase();
    return keyText.includes(filterText) || valueText.includes(filterText);
  });
}

export function isTimeRange(value: string | null): value is TimeRange {
  return (
    value === "15m" ||
    value === "30m" ||
    value === "1h" ||
    value === "6h" ||
    value === "24h" ||
    value === "7d" ||
    value === "all" ||
    value === "custom"
  );
}

export { detectMetricUnit, formatBinaryBytes, formatMetricValue };
export type { MetricUnitKind };

export function normalizeMetricName(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9]/g, "");
}

export function buildMetricNameLabelMap(
  items: Array<{ dict_key: string; dict_label: string }>,
) {
  const map: Record<string, string> = {};
  items.forEach((item) => {
    const key = item.dict_key?.trim();
    const label = item.dict_label?.trim();
    if (!key || !label) {
      return;
    }
    map[key] = label;
    map[normalizeMetricName(key)] = label;
  });
  return map;
}

export function getMetricDisplayName(
  metricName: string,
  nameLabelMap: Record<string, string>,
) {
  const exact = nameLabelMap[metricName];
  if (exact) {
    return exact;
  }

  const normalized = nameLabelMap[normalizeMetricName(metricName)];
  if (normalized) {
    return normalized;
  }

  return metricName;
}

export function toIsoDateTime(value?: string) {
  if (!value) {
    return undefined;
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return undefined;
  }

  return date.toISOString();
}

export function getTimeBounds(
  range: TimeRange,
  customFrom?: string,
  customTo?: string,
): TimeBounds {
  if (range === "all") {
    return {};
  }

  if (range === "custom") {
    return {
      from: toIsoDateTime(customFrom),
      to: toIsoDateTime(customTo),
    };
  }

  const now = new Date();
  const from = new Date(now);

  if (range === "15m") from.setMinutes(from.getMinutes() - 15);
  if (range === "30m") from.setMinutes(from.getMinutes() - 30);
  if (range === "1h") from.setHours(from.getHours() - 1);
  if (range === "6h") from.setHours(from.getHours() - 6);
  if (range === "24h") from.setHours(from.getHours() - 24);
  if (range === "7d") from.setDate(from.getDate() - 7);

  return {
    from: from.toISOString(),
    to: now.toISOString(),
  };
}

export function toCsvCell(value: unknown) {
  const text = value === null || value === undefined ? "" : String(value);

  if (/[",\n]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`;
  }

  return text;
}
