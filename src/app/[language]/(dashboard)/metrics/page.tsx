"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import dynamic from "next/dynamic";

const MetricAreaChart = dynamic(() => import("@/components/pages/metrics/metric-area-chart"), { ssr: false });
import {
  Activity,
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  Filter,
  Loader2,
} from "lucide-react";
import { api } from "@/lib/api";
import { MetricDataPointResponse, MetricSummaryResponse } from "@/types/api";
import { useRequestState } from "@/hooks/use-request-state";
import { useAppTranslations } from "@/hooks/use-app-translations";
import { useClientPagination } from "@/hooks/use-client-pagination";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  MetricsQueryToolbar,
  MetricsTimeRange,
} from "@/components/metrics/MetricsQueryToolbar";
import { Button } from "@/components/ui/button";
import { TablePaginationControls } from "@/components/ui/table-pagination-controls";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  toast,
  toastActionSuccess,
  toastApiError,
  toastCopied,
} from "@/lib/toast";

import {
  TimeRange,
  TablePageSize,
  SortField,
  SortDirection,
  TimeBounds,
  matchLabelFilter,
  isTimeRange,
  detectMetricUnit,
  formatBinaryBytes,
  formatMetricValue,
  normalizeMetricName,
  buildMetricNameLabelMap,
  getMetricDisplayName,
  toIsoDateTime,
  getTimeBounds,
  toCsvCell
} from "@/components/pages/metrics/metrics-utils";

interface MetricFilterOptionsData {
  agents: string[];
  metricNames: string[];
  metricNameLabelMap: Record<string, string>;
}

interface MetricQueryResultData {
  dataPoints: MetricDataPointResponse[];
  summary: MetricSummaryResponse | null;
}

function MetricsPageContent() {
  const { t } = useAppTranslations("pages");
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const {
    data: filterOptions,
    loading: fetchingOptions,
    execute: executeFilterOptions,
  } = useRequestState<MetricFilterOptionsData>({
    agents: [],
    metricNames: [],
    metricNameLabelMap: {},
  });

  const {
    data: metricQueryResult,
    loading: querying,
    execute: executeMetricQuery,
  } = useRequestState<MetricQueryResultData>(
    {
      dataPoints: [],
      summary: null,
    },
    {
      initialLoading: false,
    },
  );

  const agents = filterOptions.agents;
  const metricNames = filterOptions.metricNames;
  const metricNameLabelMap = filterOptions.metricNameLabelMap;
  const dataPoints = metricQueryResult.dataPoints;
  const summary = metricQueryResult.summary;

  const [selectedAgent, setSelectedAgent] = useState(
    searchParams.get("agent_id") || "",
  );
  const [agentSearchKeyword, setAgentSearchKeyword] = useState("");
  const [debouncedAgentSearchKeyword, setDebouncedAgentSearchKeyword] =
    useState("");
  const [selectedMetric, setSelectedMetric] = useState(
    searchParams.get("metric_name") || "",
  );
  const [labelFilter, setLabelFilter] = useState(
    searchParams.get("label") || "",
  );
  const [timeRange, setTimeRange] = useState<TimeRange>(() => {
    const rangeParam = searchParams.get("range");

    if (isTimeRange(rangeParam)) {
      return rangeParam;
    }

    if (searchParams.get("from") || searchParams.get("to")) {
      return "custom";
    }

    return "24h";
  });
  const [customFrom, setCustomFrom] = useState(searchParams.get("from") || "");
  const [customTo, setCustomTo] = useState(searchParams.get("to") || "");

  const [autoQuery, setAutoQuery] = useState(true);
  const [agentScopedMetricNames, setAgentScopedMetricNames] = useState<
    string[] | null
  >(null);
  const [loadingAgentScopedMetricNames, setLoadingAgentScopedMetricNames] =
    useState(false);

  const [tablePageSize, setTablePageSize] = useState<TablePageSize>("20");
  const [sortField, setSortField] = useState<SortField>("timestamp");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");

  const hasCustomRange =
    timeRange !== "custom" || (Boolean(customFrom) && Boolean(customTo));
  const hasQueryCondition = Boolean(
    selectedAgent && selectedMetric && hasCustomRange,
  );

  const effectiveMetricNames = agentScopedMetricNames ?? metricNames;

  const handleCopyQueryLink = async () => {
    if (typeof window === "undefined") {
      return;
    }

    try {
      await navigator.clipboard.writeText(window.location.href);
      toastCopied(t("metrics.toastCopyLinkSuccess"));
    } catch {
      toast.error(t("metrics.toastCopyLinkError"));
    }
  };

  const handleResetFilters = () => {
    setAgentSearchKeyword("");
    setSelectedAgent(agents[0] || "");
    setSelectedMetric(metricNames[0] || "");
    setLabelFilter("");
    setTimeRange("24h");
    setCustomFrom("");
    setCustomTo("");
    toastActionSuccess(t("metrics.toastResetFiltersSuccess"));
  };

  const handleTableSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
      return;
    }

    setSortField(field);
    setSortDirection("desc");
  };

  useEffect(() => {
    const timerId = window.setTimeout(() => {
      setDebouncedAgentSearchKeyword(agentSearchKeyword.trim());
    }, 320);

    return () => {
      window.clearTimeout(timerId);
    };
  }, [agentSearchKeyword]);

  const handleExportCsv = () => {
    if (filteredDataPoints.length === 0) {
      toast.error(t("metrics.toastNoDataToExport"));
      return;
    }

    const headers = [
      "id",
      "timestamp",
      "created_at",
      "agent_id",
      "metric_name",
      "metric_label",
      "value",
      "labels",
    ];
    const rows = filteredDataPoints.map((point) => [
      point.id,
      point.timestamp,
      point.created_at,
      point.agent_id,
      point.metric_name,
      getMetricDisplayName(point.metric_name, metricNameLabelMap),
      point.value,
      JSON.stringify(point.labels || {}),
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map((row) => row.map((cell) => toCsvCell(cell)).join(",")),
    ].join("\n");

    const csvWithBom = `\ufeff${csvContent}`;
    const blob = new Blob([csvWithBom], { type: "text/csv;charset=utf-8;" });
    const downloadUrl = URL.createObjectURL(blob);
    const safeAgent = selectedAgent || "all";
    const safeMetric = selectedMetric || "all";
    const filenameTime = new Date().toISOString().replace(/[.:]/g, "-");
    const filename = `metrics-${safeAgent}-${safeMetric}-${filenameTime}.csv`;
    const link = document.createElement("a");

    link.href = downloadUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(downloadUrl);

    toast.success(
      t("metrics.toastExportCsvSuccess", { count: filteredDataPoints.length }),
    );
  };

  const handleExportJson = () => {
    if (filteredDataPoints.length === 0) {
      toast.error(t("metrics.toastNoDataToExport"));
      return;
    }

    const bounds = getTimeBounds(timeRange, customFrom, customTo);
    const exportPayload = {
      query: {
        agent_id: selectedAgent,
        metric_name: selectedMetric,
        label_filter: labelFilter || undefined,
        range: timeRange,
        timestamp__gte: bounds.from,
        timestamp__lte: bounds.to,
      },
      summary,
      count: filteredDataPoints.length,
      points: filteredDataPoints,
      exported_at: new Date().toISOString(),
    };

    const jsonContent = JSON.stringify(exportPayload, null, 2);
    const blob = new Blob([jsonContent], {
      type: "application/json;charset=utf-8;",
    });
    const downloadUrl = URL.createObjectURL(blob);
    const safeAgent = selectedAgent || "all";
    const safeMetric = selectedMetric || "all";
    const filenameTime = new Date().toISOString().replace(/[.:]/g, "-");
    const filename = `metrics-${safeAgent}-${safeMetric}-${filenameTime}.json`;
    const link = document.createElement("a");

    link.href = downloadUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(downloadUrl);

    toast.success(
      t("metrics.toastExportJsonSuccess", { count: filteredDataPoints.length }),
    );
  };

  const queryMetrics = async (showToast = false) => {
    if (!selectedAgent || !selectedMetric) {
      return;
    }

    if (timeRange === "custom") {
      if (!customFrom || !customTo) {
        if (showToast) {
          toast.error(t("metrics.toastMissingCustomRange"));
        }
        return;
      }

      if (new Date(customFrom).getTime() > new Date(customTo).getTime()) {
        if (showToast) {
          toast.error(t("metrics.toastInvalidCustomRange"));
        }
        return;
      }
    }

    await executeMetricQuery(
      async () => {
        const bounds = getTimeBounds(timeRange, customFrom, customTo);

        const [points, stats] = await Promise.all([
          api.queryAllMetrics({
            agent_id__eq: selectedAgent,
            metric_name__eq: selectedMetric,
            timestamp__gte: bounds.from,
            timestamp__lte: bounds.to,
            limit: 200,
            offset: 0,
          }),
          api.getMetricSummary({
            agent_id: selectedAgent,
            metric_name: selectedMetric,
            timestamp__gte: bounds.from,
            timestamp__lte: bounds.to,
          }),
        ]);

        const sortedPoints = [...points].sort((a, b) => {
          const aTime = new Date(a.timestamp).getTime();
          const bTime = new Date(b.timestamp).getTime();
          return aTime - bTime;
        });

        return {
          dataPoints: sortedPoints,
          summary: stats,
        };
      },
      {
        onSuccess: (result) => {
          if (showToast) {
            toast.success(
              t("metrics.toastMetricsLoaded", {
                count: result.dataPoints.length,
              }),
            );
          }
        },
        onError: (error) => {
          toastApiError(error, t("metrics.toastMetricsFetchError"));
        },
      },
    );
  };

  useEffect(() => {
    if (timeRange === "custom") {
      if (!customFrom || !customTo) {
        return;
      }

      const fromTime = new Date(customFrom).getTime();
      const toTime = new Date(customTo).getTime();

      if (Number.isNaN(fromTime) || Number.isNaN(toTime) || fromTime > toTime) {
        return;
      }
    }

    const loadFilterOptions = async () => {
      await executeFilterOptions(
        async () => {
          const bounds = getTimeBounds(timeRange, customFrom, customTo);
          const [sourceList, metricList] = await Promise.all([
            api.getMetricSources({
              timestamp__gte: bounds.from,
              timestamp__lte: bounds.to,
              query__contains: debouncedAgentSearchKeyword || undefined,
              limit: 200,
              offset: 0,
            }),
            api.getMetricNames({
              timestamp__gte: bounds.from,
              timestamp__lte: bounds.to,
            }),
          ]);
          let metricLabelItems: Array<{
            dict_key: string;
            dict_label: string;
          }> = [];

          try {
            metricLabelItems = await api.listDictionariesByType(
              "metric_name",
              true,
            );
          } catch {
            metricLabelItems = [];
          }

          return {
            agents: sourceList.map((item) => item.id),
            metricNames: metricList,
            metricNameLabelMap: buildMetricNameLabelMap(metricLabelItems),
          };
        },
        {
          onSuccess: (result) => {
            setSelectedAgent((current) => {
              // 搜索模式下不自动变更选中项，避免“未点击就触发”
              if (debouncedAgentSearchKeyword) {
                return current;
              }

              if (result.agents.length === 0) {
                return "";
              }

              if (current) {
                return result.agents.includes(current)
                  ? current
                  : result.agents[0];
              }

              return result.agents[0];
            });

            setSelectedMetric((current) => {
              if (result.metricNames.length === 0) {
                return "";
              }

              return result.metricNames.includes(current)
                ? current
                : result.metricNames[0];
            });
          },
          onError: (error) => {
            toastApiError(error, t("metrics.toastFilterOptionsError"));
          },
        },
      );
    };

    loadFilterOptions();
  }, [
    executeFilterOptions,
    timeRange,
    customFrom,
    customTo,
    debouncedAgentSearchKeyword,
  ]);

  useEffect(() => {
    const nextParams = new URLSearchParams(searchParams.toString());

    if (selectedAgent) nextParams.set("agent_id", selectedAgent);
    else nextParams.delete("agent_id");

    if (selectedMetric) nextParams.set("metric_name", selectedMetric);
    else nextParams.delete("metric_name");

    if (labelFilter.trim()) nextParams.set("label", labelFilter);
    else nextParams.delete("label");

    nextParams.set("range", timeRange);

    if (timeRange === "custom") {
      if (customFrom) nextParams.set("from", customFrom);
      else nextParams.delete("from");

      if (customTo) nextParams.set("to", customTo);
      else nextParams.delete("to");
    } else {
      nextParams.delete("from");
      nextParams.delete("to");
    }

    const currentQuery = searchParams.toString();
    const nextQuery = nextParams.toString();

    if (currentQuery === nextQuery) {
      return;
    }

    router.replace(nextQuery ? `${pathname}?${nextQuery}` : pathname, {
      scroll: false,
    });
  }, [
    pathname,
    router,
    searchParams,
    selectedAgent,
    selectedMetric,
    labelFilter,
    timeRange,
    customFrom,
    customTo,
  ]);

  useEffect(() => {
    if (!selectedAgent) {
      setAgentScopedMetricNames(null);
      return;
    }

    if (timeRange === "custom") {
      if (!customFrom || !customTo) {
        setAgentScopedMetricNames(null);
        return;
      }

      const fromTime = new Date(customFrom).getTime();
      const toTime = new Date(customTo).getTime();
      if (Number.isNaN(fromTime) || Number.isNaN(toTime) || fromTime > toTime) {
        setAgentScopedMetricNames(null);
        return;
      }
    }

    let cancelled = false;

    const loadAgentMetricNames = async () => {
      setLoadingAgentScopedMetricNames(true);
      try {
        const bounds = getTimeBounds(timeRange, customFrom, customTo);
        const names = new Set<string>();
        const pageSize = 500;
        let offset = 0;

        while (!cancelled) {
          const page = await api.queryAllMetrics({
            agent_id__eq: selectedAgent,
            timestamp__gte: bounds.from,
            timestamp__lte: bounds.to,
            limit: pageSize,
            offset,
          });

          page.forEach((point) => {
            if (point.metric_name) {
              names.add(point.metric_name);
            }
          });

          if (page.length < pageSize) {
            break;
          }

          offset += pageSize;

          // Defensive guard for very large ranges to avoid UI lockups.
          if (offset >= 20000) {
            break;
          }
        }

        if (!cancelled) {
          setAgentScopedMetricNames(Array.from(names).sort());
        }
      } catch {
        if (!cancelled) {
          setAgentScopedMetricNames(null);
        }
      } finally {
        if (!cancelled) {
          setLoadingAgentScopedMetricNames(false);
        }
      }
    };

    void loadAgentMetricNames();

    return () => {
      cancelled = true;
    };
  }, [selectedAgent, timeRange, customFrom, customTo]);

  useEffect(() => {
    if (effectiveMetricNames.length === 0) {
      if (selectedMetric) {
        setSelectedMetric("");
      }
      return;
    }

    if (!effectiveMetricNames.includes(selectedMetric)) {
      setSelectedMetric(effectiveMetricNames[0]);
    }
  }, [effectiveMetricNames, selectedMetric]);

  useEffect(() => {
    if (
      !autoQuery ||
      fetchingOptions ||
      loadingAgentScopedMetricNames ||
      !hasQueryCondition
    ) {
      return;
    }

    const timerId = window.setTimeout(() => {
      queryMetrics();
    }, 300);

    return () => {
      window.clearTimeout(timerId);
    };
  }, [
    autoQuery,
    fetchingOptions,
    loadingAgentScopedMetricNames,
    hasQueryCondition,
    selectedAgent,
    selectedMetric,
    labelFilter,
    timeRange,
    customFrom,
    customTo,
  ]);

  const filteredDataPoints = useMemo(() => {
    if (!labelFilter.trim()) {
      return dataPoints;
    }

    return dataPoints.filter((point) =>
      matchLabelFilter(point.labels || {}, labelFilter),
    );
  }, [dataPoints, labelFilter]);

  const chartData = useMemo(
    () =>
      filteredDataPoints.map((point) => {
        const date = new Date(point.timestamp);
        return {
          timestamp: date.toLocaleString(),
          time: date.toLocaleTimeString(),
          value: point.value,
        };
      }),
    [filteredDataPoints],
  );

  const sortedTableData = useMemo(() => {
    const cloned = [...filteredDataPoints];

    cloned.sort((left, right) => {
      const diff =
        sortField === "timestamp"
          ? new Date(left.timestamp).getTime() -
            new Date(right.timestamp).getTime()
          : left.value - right.value;

      return sortDirection === "asc" ? diff : -diff;
    });

    return cloned;
  }, [filteredDataPoints, sortField, sortDirection]);

  const latestPoint =
    filteredDataPoints.length > 0
      ? filteredDataPoints[filteredDataPoints.length - 1]
      : null;
  const pageSize = Number(tablePageSize);
  const tablePaginationResetKey = `${selectedAgent}|${selectedMetric}|${labelFilter}|${timeRange}|${customFrom}|${customTo}|${tablePageSize}|${sortField}|${sortDirection}`;
  const tablePagination = useClientPagination({
    items: sortedTableData,
    pageSize,
    resetKey: tablePaginationResetKey,
  });

  const queryToolbarTexts = useMemo(
    () => ({
      agentLabel: t("metrics.agentLabel"),
      agentPlaceholder: t("metrics.agentPlaceholder"),
      metricLabel: t("metrics.metricLabel"),
      metricPlaceholder: t("metrics.metricPlaceholder"),
      labelFilterLabel: t("metrics.labelFilterLabel"),
      labelFilterPlaceholder: t("metrics.labelFilterPlaceholder"),
      queryModeLabel: t("metrics.queryModeLabel"),
      queryModeAuto: t("metrics.queryModeAuto"),
      timeRangeLabel: t("metrics.timeRangeLabel"),
      timeRange15m: t("metrics.timeRange15m"),
      timeRange30m: t("metrics.timeRange30m"),
      timeRange1h: t("metrics.timeRange1h"),
      timeRange6h: t("metrics.timeRange6h"),
      timeRange24h: t("metrics.timeRange24h"),
      timeRange7d: t("metrics.timeRange7d"),
      timeRangeAll: t("metrics.timeRangeAll"),
      timeRangeCustom: t("metrics.timeRangeCustom"),
      refreshDataButton: t("metrics.refreshDataButton"),
      resetFiltersTitle: t("metrics.resetFiltersTitle"),
      exportCsvTitle: t("metrics.exportCsvTitle"),
      exportJsonTitle: t("metrics.exportJsonTitle"),
      copyQueryLinkTitle: t("metrics.copyQueryLinkTitle"),
      startTimeLabel: t("metrics.startTimeLabel"),
      endTimeLabel: t("metrics.endTimeLabel"),
    }),
    [t],
  );

  const metricOptions = useMemo(
    () =>
      effectiveMetricNames.map((metricName) => {
        const displayName = getMetricDisplayName(
          metricName,
          metricNameLabelMap,
        );
        return {
          value: metricName,
          label: displayName,
          subtitle: displayName === metricName ? undefined : metricName,
        };
      }),
    [effectiveMetricNames, metricNameLabelMap],
  );
  const selectedMetricDisplayName = useMemo(
    () => getMetricDisplayName(selectedMetric, metricNameLabelMap),
    [metricNameLabelMap, selectedMetric],
  );

  return (
    <div className="min-w-0 space-y-8 p-4 md:p-8">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">
          {t("metrics.title")}
        </h2>
        <p className="text-muted-foreground">{t("metrics.description")}</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-4 w-4" />
            {t("metrics.queryConditionsTitle")}
          </CardTitle>
          <CardDescription>
            {t("metrics.queryConditionsDescription")}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <MetricsQueryToolbar
            texts={queryToolbarTexts}
            agents={agents}
            agentSearchKeyword={agentSearchKeyword}
            metricOptions={metricOptions}
            selectedAgent={selectedAgent}
            selectedMetric={selectedMetric}
            labelFilter={labelFilter}
            autoQuery={autoQuery}
            timeRange={timeRange}
            customFrom={customFrom}
            customTo={customTo}
            querying={querying}
            fetchingOptions={fetchingOptions || loadingAgentScopedMetricNames}
            hasQueryCondition={hasQueryCondition}
            canExport={filteredDataPoints.length > 0}
            onSelectedAgentChange={setSelectedAgent}
            onAgentSearchKeywordChange={setAgentSearchKeyword}
            onSelectedMetricChange={setSelectedMetric}
            onLabelFilterChange={setLabelFilter}
            onAutoQueryChange={setAutoQuery}
            onTimeRangeChange={setTimeRange}
            onCustomFromChange={setCustomFrom}
            onCustomToChange={setCustomTo}
            onRefresh={() => queryMetrics(true)}
            onResetFilters={handleResetFilters}
            onExportCsv={handleExportCsv}
            onExportJson={handleExportJson}
            onCopyQueryLink={handleCopyQueryLink}
          />
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>{t("metrics.statSamples")}</CardDescription>
            <CardTitle>{summary?.count ?? 0}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>{t("metrics.statMin")}</CardDescription>
            <CardTitle>
              {summary ? formatMetricValue(summary.min, selectedMetric) : "-"}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>{t("metrics.statAvg")}</CardDescription>
            <CardTitle>
              {summary ? formatMetricValue(summary.avg, selectedMetric) : "-"}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>{t("metrics.statMax")}</CardDescription>
            <CardTitle>
              {summary ? formatMetricValue(summary.max, selectedMetric) : "-"}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      <Tabs defaultValue="chart" className="space-y-4">
        <TabsList>
          <TabsTrigger value="chart">{t("metrics.tabChart")}</TabsTrigger>
          <TabsTrigger value="table">{t("metrics.tabTable")}</TabsTrigger>
        </TabsList>

        <TabsContent value="chart">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-4 w-4" />
                {t("metrics.trendTitle")}
              </CardTitle>
              <CardDescription>
                {selectedAgent && selectedMetric
                  ? `${selectedAgent} / ${selectedMetricDisplayName}${selectedMetricDisplayName === selectedMetric ? "" : ` (${selectedMetric})`}`
                  : t("metrics.selectQueryCondition")}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {querying ? (
                <div className="h-[360px] flex items-center justify-center text-muted-foreground gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {t("metrics.chartLoading")}
                </div>
              ) : chartData.length === 0 ? (
                <div className="h-[360px] flex items-center justify-center text-muted-foreground">
                  {t("metrics.chartNoData")}
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center justify-between text-sm">
                    <div className="text-muted-foreground">
                      {t("metrics.latestTime", {
                        time: latestPoint
                          ? new Date(latestPoint.timestamp).toLocaleString()
                          : "-",
                      })}
                    </div>
                    <Badge variant="outline">
                      {t("metrics.latestValue", {
                        value: latestPoint
                          ? formatMetricValue(latestPoint.value, selectedMetric)
                          : "-",
                      })}
                    </Badge>
                  </div>

                  <div className="h-[320px] w-full">
                    <MetricAreaChart data={chartData} selectedMetric={selectedMetric} />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="table">
          <Card>
            <CardHeader>
              <CardTitle>{t("metrics.rawPointsTitle")}</CardTitle>
              <CardDescription>
                {t("metrics.rawPointsDescription")}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("metrics.tableColMetric")}</TableHead>
                    <TableHead>
                      <button
                        type="button"
                        className="inline-flex items-center gap-1"
                        onClick={() => handleTableSort("timestamp")}
                      >
                        {t("metrics.tableColTime")}
                        {sortField !== "timestamp" ? (
                          <ArrowUpDown className="h-3.5 w-3.5 text-muted-foreground" />
                        ) : sortDirection === "asc" ? (
                          <ArrowUp className="h-3.5 w-3.5" />
                        ) : (
                          <ArrowDown className="h-3.5 w-3.5" />
                        )}
                      </button>
                    </TableHead>
                    <TableHead>
                      <button
                        type="button"
                        className="inline-flex items-center gap-1"
                        onClick={() => handleTableSort("value")}
                      >
                        {t("metrics.tableColValue")}
                        {sortField !== "value" ? (
                          <ArrowUpDown className="h-3.5 w-3.5 text-muted-foreground" />
                        ) : sortDirection === "asc" ? (
                          <ArrowUp className="h-3.5 w-3.5" />
                        ) : (
                          <ArrowDown className="h-3.5 w-3.5" />
                        )}
                      </button>
                    </TableHead>
                    <TableHead>{t("metrics.tableColLabels")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedTableData.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={4}
                        className="h-24 text-center text-muted-foreground"
                      >
                        {t("metrics.tableEmpty")}
                      </TableCell>
                    </TableRow>
                  ) : (
                    tablePagination.paginatedItems.map((point, index) => (
                      <TableRow key={point.id || `${point.timestamp}-${index}`}>
                        <TableCell>
                          <div className="flex flex-col">
                            <span>
                              {getMetricDisplayName(
                                point.metric_name,
                                metricNameLabelMap,
                              )}
                            </span>
                            {getMetricDisplayName(
                              point.metric_name,
                              metricNameLabelMap,
                            ) !== point.metric_name ? (
                              <span className="text-xs text-muted-foreground font-mono">
                                {point.metric_name}
                              </span>
                            ) : null}
                          </div>
                        </TableCell>
                        <TableCell>
                          {new Date(point.timestamp).toLocaleString()}
                        </TableCell>
                        <TableCell className="font-mono">
                          {formatMetricValue(point.value, point.metric_name)}
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {Object.entries(point.labels || {}).length === 0 ? (
                              <span className="text-muted-foreground text-xs">
                                -
                              </span>
                            ) : (
                              Object.entries(point.labels || {}).map(
                                ([key, value]) => (
                                  <Badge
                                    key={`${key}-${value}`}
                                    variant="secondary"
                                    className="text-xs"
                                  >
                                    {key}:{value}
                                  </Badge>
                                ),
                              )
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>

              <TablePaginationControls
                className="mt-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between"
                summaryText={t("metrics.tableSummary", {
                  total: tablePagination.totalRows,
                  start: tablePagination.startIndex,
                  end: tablePagination.endIndex,
                })}
                pageSize={pageSize}
                pageSizeOptions={[20, 50, 100]}
                onPageSizeChange={(value) =>
                  setTablePageSize(String(value) as TablePageSize)
                }
                pageSizePlaceholder={t("metrics.pageSizePlaceholder")}
                prevLabel={t("metrics.prevPage")}
                nextLabel={t("metrics.nextPage")}
                pageIndicatorText={t("metrics.pageIndicator", {
                  current: tablePagination.currentPage,
                  total: tablePagination.totalPages,
                })}
                onPrevPage={() =>
                  tablePagination.setPage((prev) => Math.max(1, prev - 1))
                }
                onNextPage={() =>
                  tablePagination.setPage((prev) =>
                    Math.min(tablePagination.totalPages, prev + 1),
                  )
                }
                prevDisabled={
                  tablePagination.currentPage <= 1 ||
                  tablePagination.totalRows === 0
                }
                nextDisabled={
                  tablePagination.currentPage >= tablePagination.totalPages ||
                  tablePagination.totalRows === 0
                }
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function MetricsPageFallback() {
  return (
    <div className="flex min-h-[40vh] items-center justify-center">
      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
    </div>
  );
}

export default function MetricsPage() {
  return (
    <Suspense fallback={<MetricsPageFallback />}>
      <MetricsPageContent />
    </Suspense>
  );
}
