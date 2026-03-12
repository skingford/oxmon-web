"use client";

import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { api } from "@/lib/api";
import type { AIReportInstanceItem, AIReportRow } from "@/types/api";
import { formatDateTimeByLocale } from "@/lib/date-time";
import { notifiedBadgeClassName } from "@/lib/notified-status";
import { buildTranslatedPaginationTextBundle } from "@/lib/pagination-summary";
import { toastApiError } from "@/lib/toast";
import {
  parseRiskScore,
  resolveRiskLevel,
  riskLevelLabel,
  riskBadgeClassNameByLevel,
} from "@/lib/risk-level";
import { cn } from "@/lib/utils";
import { useAppTranslations } from "@/hooks/use-app-translations";
import { useAppLocale } from "@/hooks/use-app-locale";
import { useClientPagination } from "@/hooks/use-client-pagination";
import { withLocalePrefix } from "@/components/app-locale";
import type { AppLocale } from "@/components/app-locale";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { JsonTextarea } from "@/components/ui/json-textarea";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PaginationControls } from "@/components/ui/pagination-controls";
import { Code2, Expand, Loader2, RefreshCw } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

function parsePreviewThreshold(
  envKey: "NEXT_PUBLIC_AI_HTML_PREVIEW_LAZY_THRESHOLD" | "NEXT_PUBLIC_AI_HTML_PREVIEW_MANUAL_THRESHOLD",
  fallback: number,
) {
  const value = process.env[envKey];
  if (!value) {
    return fallback;
  }

  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return fallback;
  }

  return parsed;
}

const HTML_PREVIEW_LAZY_THRESHOLD = parsePreviewThreshold(
  "NEXT_PUBLIC_AI_HTML_PREVIEW_LAZY_THRESHOLD",
  180_000,
);
const HTML_PREVIEW_MANUAL_THRESHOLD = Math.max(
  parsePreviewThreshold(
    "NEXT_PUBLIC_AI_HTML_PREVIEW_MANUAL_THRESHOLD",
    480_000,
  ),
  HTML_PREVIEW_LAZY_THRESHOLD + 1,
);

function resolvePreviewThresholdFactor() {
  if (typeof navigator === "undefined") {
    return 1;
  }

  const cpuCores = navigator.hardwareConcurrency ?? 8;
  const memoryGB = (navigator as Navigator & { deviceMemory?: number })
    .deviceMemory;

  if (cpuCores <= 2 || (typeof memoryGB === "number" && memoryGB <= 2)) {
    return 2.2;
  }

  if (cpuCores <= 4 || (typeof memoryGB === "number" && memoryGB <= 4)) {
    return 1.6;
  }

  return 1;
}

function formatJsonText(value?: string | null) {
  if (!value) return "";
  try {
    return JSON.stringify(JSON.parse(value), null, 2);
  } catch {
    return value;
  }
}


function formatReportInstanceTimestamp(value: number, locale: AppLocale) {
  const timestamp = value > 1_000_000_000_000 ? value : value * 1000
  return formatDateTimeByLocale(new Date(timestamp).toISOString(), locale)
}

const INSTANCE_PAGE_SIZE_OPTIONS = [10, 20, 50] as const

function riskLevelPriority(level: ReturnType<typeof resolveRiskLevel>) {
  if (level === "critical") {
    return 3
  }

  if (level === "alert") {
    return 2
  }

  if (level === "attention") {
    return 1
  }

  return 0
}

function riskRowClassNameByLevel(level: ReturnType<typeof resolveRiskLevel>) {
  if (level === "critical") {
    return "border-l-4 border-l-red-500 bg-red-50/60"
  }

  if (level === "alert") {
    return "border-l-4 border-l-amber-500 bg-amber-50/60"
  }

  if (level === "attention") {
    return "border-l-4 border-l-blue-500 bg-blue-50/60"
  }

  return "border-l-4 border-l-emerald-500 bg-emerald-50/60"
}

function riskDotClassNameByLevel(level: ReturnType<typeof resolveRiskLevel>) {
  if (level === "critical") {
    return "bg-red-500"
  }

  if (level === "alert") {
    return "bg-amber-500"
  }

  if (level === "attention") {
    return "bg-blue-500"
  }

  return "bg-emerald-500"
}

function buildHtmlPreviewDoc(value?: string | null) {
  const html = value?.trim();

  if (!html) {
    return `<!doctype html><html lang="zh-CN"><head><meta charset="utf-8" /><meta name="viewport" content="width=device-width, initial-scale=1" /></head><body></body></html>`;
  }

  if (/<html[\s>]/i.test(html)) {
    return html;
  }

  return `<!doctype html><html lang="zh-CN"><head><meta charset="utf-8" /><meta name="viewport" content="width=device-width, initial-scale=1" /><style>html,body{margin:0;padding:0}body{padding:16px;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;line-height:1.6;color:#111827}img,video,iframe{max-width:100%;height:auto}pre{overflow:auto}</style></head><body>${html}</body></html>`;
}

function MetaItem({
  label,
  value,
  mono = false,
}: {
  label: string;
  value: string | number;
  mono?: boolean;
}) {
  return (
    <div className="space-y-1 rounded-md border p-3">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div
        className={mono ? "font-mono text-sm break-all" : "text-sm break-words"}
      >
        {String(value)}
      </div>
    </div>
  );
}

const HtmlPreviewFrame = memo(function HtmlPreviewFrame({
  title,
  src,
  className,
  loading = "eager",
  loadingText,
}: {
  title: string;
  src: string;
  className: string;
  loading?: "eager" | "lazy";
  loadingText: string;
}) {
  if (!src) {
    return (
      <div className={className}>
        <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
          {loadingText}
        </div>
      </div>
    );
  }

  return (
    <iframe
      title={title}
      src={src}
      className={className}
      sandbox="allow-same-origin"
      loading={loading}
    />
  );
});

export default function AIReportDetailPage() {
  const { t } = useAppTranslations("ai");
  const locale = useAppLocale();
  const params = useParams<{ id: string }>();
  const id = String(params?.id || "");
  const [report, setReport] = useState<AIReportRow | null>(null);
  const [reportInstances, setReportInstances] = useState<AIReportInstanceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [detailTab, setDetailTab] = useState<"analysis" | "html">("analysis");
  const [htmlTab, setHtmlTab] = useState<"preview" | "source">("preview");
  const [previewFullscreenOpen, setPreviewFullscreenOpen] = useState(false);
  const [htmlPreviewUrl, setHtmlPreviewUrl] = useState("");
  const [htmlPreviewRequested, setHtmlPreviewRequested] = useState(false);
  const [instancesPageSize, setInstancesPageSize] = useState<number>(INSTANCE_PAGE_SIZE_OPTIONS[0]);
  const htmlPreviewCacheRef = useRef<{
    raw: string;
    url: string;
  } | null>(null);
  const riskLevel = useMemo(
    () => resolveRiskLevel(report?.risk_level || ""),
    [report?.risk_level],
  );
  const riskLevelText = riskLevelLabel(riskLevel, locale);
  const formattedRawMetricsJson = useMemo(
    () => formatJsonText(report?.raw_metrics_json),
    [report?.raw_metrics_json],
  );
  const isDev = process.env.NODE_ENV !== "production";
  const reportInstanceRiskStats = useMemo(() => {
    return reportInstances.reduce(
      (acc, item) => {
        const level = resolveRiskLevel(item.risk_level)
        if (level === "critical") {
          acc.high += 1
        } else if (level === "alert") {
          acc.medium += 1
        } else if (level === "attention") {
          acc.low += 1
        } else {
          acc.normal += 1
        }
        return acc
      },
      { high: 0, medium: 0, low: 0, normal: 0 },
    )
  }, [reportInstances]);
  const sortedReportInstances = useMemo(() => {
    return [...reportInstances].sort((left, right) => {
      const leftLevel = resolveRiskLevel(left.risk_level)
      const rightLevel = resolveRiskLevel(right.risk_level)
      const levelDiff = riskLevelPriority(rightLevel) - riskLevelPriority(leftLevel)

      if (levelDiff !== 0) {
        return levelDiff
      }

      const leftScore = parseRiskScore(left.risk_level) ?? -1
      const rightScore = parseRiskScore(right.risk_level) ?? -1
      const scoreDiff = rightScore - leftScore

      if (scoreDiff !== 0) {
        return scoreDiff
      }

      return right.timestamp - left.timestamp
    })
  }, [reportInstances]);
  const reportInstancesPagination = useClientPagination({
    items: sortedReportInstances,
    pageSize: instancesPageSize,
    resetKey: `${id}|${instancesPageSize}|${sortedReportInstances.length}`,
  });
  const htmlRawContent = report?.html_content || "";
  const htmlSource = htmlRawContent.trim();
  const previewThresholdFactor = useMemo(resolvePreviewThresholdFactor, []);
  const adaptiveLazyThreshold = Math.round(
    HTML_PREVIEW_LAZY_THRESHOLD * previewThresholdFactor,
  );
  const adaptiveManualThreshold = Math.max(
    Math.round(HTML_PREVIEW_MANUAL_THRESHOLD * previewThresholdFactor),
    adaptiveLazyThreshold + 1,
  );
  const htmlSize = htmlRawContent.length;
  const shouldLazyLoadLargePreview = htmlSize > adaptiveLazyThreshold;
  const shouldManualLoadPreview = htmlSize > adaptiveManualThreshold;
  const previewMode: "eager" | "idle" | "manual" = shouldManualLoadPreview
    ? "manual"
    : shouldLazyLoadLargePreview
      ? "idle"
      : "eager";
  const canRenderHtmlPreview =
    !shouldLazyLoadLargePreview || htmlPreviewRequested || !shouldManualLoadPreview;
  const needHtmlPreview =
    canRenderHtmlPreview &&
    (previewFullscreenOpen || (detailTab === "html" && htmlTab === "preview"));

  useEffect(() => {
    setHtmlPreviewRequested(false);
  }, [report?.id]);

  useEffect(() => {
    if (
      !shouldLazyLoadLargePreview ||
      shouldManualLoadPreview ||
      htmlPreviewRequested ||
      detailTab !== "html" ||
      htmlTab !== "preview"
    ) {
      return;
    }

    let cancelled = false;
    let timeoutId: ReturnType<typeof setTimeout> | null = null;
    let idleId: number | null = null;
    const win = typeof window !== "undefined" ? window : null;
    const loadPreviewWhenIdle = () => {
      if (!cancelled) {
        setHtmlPreviewRequested(true);
      }
    };

    if (win && "requestIdleCallback" in win) {
      idleId = win.requestIdleCallback(loadPreviewWhenIdle, { timeout: 600 });
    } else {
      timeoutId = setTimeout(loadPreviewWhenIdle, 180);
    }

    return () => {
      cancelled = true;
      if (idleId !== null && win && "cancelIdleCallback" in win) {
        win.cancelIdleCallback(idleId);
      }
      if (timeoutId !== null) {
        clearTimeout(timeoutId);
      }
    };
  }, [
    detailTab,
    htmlTab,
    htmlPreviewRequested,
    shouldLazyLoadLargePreview,
    shouldManualLoadPreview,
  ]);

  useEffect(() => {
    if (!needHtmlPreview) {
      return;
    }

    if (htmlPreviewCacheRef.current && htmlPreviewCacheRef.current.raw === htmlRawContent) {
      setHtmlPreviewUrl(htmlPreviewCacheRef.current.url);
      return;
    }

    const htmlPreviewDoc = buildHtmlPreviewDoc(htmlRawContent);
    const blob = new Blob([htmlPreviewDoc], {
      type: "text/html;charset=utf-8",
    });
    const objectUrl = URL.createObjectURL(blob);
    if (htmlPreviewCacheRef.current) {
      URL.revokeObjectURL(htmlPreviewCacheRef.current.url);
    }
    htmlPreviewCacheRef.current = {
      raw: htmlRawContent,
      url: objectUrl,
    };
    setHtmlPreviewUrl(objectUrl);
  }, [htmlRawContent, needHtmlPreview]);

  useEffect(() => {
    return () => {
      if (htmlPreviewCacheRef.current) {
        URL.revokeObjectURL(htmlPreviewCacheRef.current.url);
      }
    };
  }, []);

  const fetchDetail = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const [reportResult, instancesResult] = await Promise.allSettled([
        api.getAIReportById(id),
        api.listAIReportInstances(id),
      ]);

      if (reportResult.status === "rejected") {
        throw reportResult.reason;
      }

      setReport(reportResult.value);

      if (instancesResult.status === "fulfilled") {
        setReportInstances(instancesResult.value);
      } else {
        setReportInstances([]);
        console.error("Failed to load AI report instances", instancesResult.reason);
      }
    } catch (error) {
      setReport(null);
      setReportInstances([]);
      toastApiError(error, t("reports.detailToastFetchError"));
    } finally {
      setLoading(false);
    }
  }, [id, t]);

  useEffect(() => {
    void fetchDetail();
  }, [fetchDetail]);

  if (loading && !report) {
    return (
      <div className="flex h-[calc(100vh-4rem)] items-center justify-center gap-2 text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin" />
        <span>{t("reports.detailLoading")}</span>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="min-w-0 space-y-6 p-4 md:p-8">
        <Card>
          <CardHeader>
            <CardTitle>{t("reports.detailNotFound")}</CardTitle>
            <CardDescription>ID: {id || "-"}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline">
              <Link href={withLocalePrefix("/ai/reports", locale)}>
                {t("reports.detailBack")}
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-w-0 space-y-6 p-4 md:p-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">
            {t("reports.detailTitle")}
          </h2>
          <p className="text-sm text-muted-foreground">
            {t("reports.detailDescription")}
          </p>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline">
            <Link href={withLocalePrefix("/ai/reports", locale)}>
              {t("reports.detailBack")}
            </Link>
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => void fetchDetail()}
            disabled={loading}
          >
            <RefreshCw
              className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`}
            />
            {t("reports.detailRefresh")}
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t("reports.detailSectionMeta")}</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          <MetaItem label={t("reports.detailFieldId")} value={report.id} mono />
          <MetaItem
            label={t("reports.detailFieldDate")}
            value={report.report_date}
          />
          <MetaItem
            label={t("reports.detailFieldAccountId")}
            value={report.ai_account_id}
            mono
          />
          <MetaItem
            label={t("reports.detailFieldProvider")}
            value={report.ai_provider}
          />
          <MetaItem
            label={t("reports.detailFieldModel")}
            value={report.ai_model}
          />
          <div className="space-y-1 rounded-md border p-3">
            <div className="text-xs text-muted-foreground">
              {t("reports.detailFieldRisk")}
            </div>
            <div className="text-sm">
              <Badge variant="outline" className={riskBadgeClassNameByLevel(riskLevel)}>
                {riskLevelText}
              </Badge>
            </div>
          </div>
          <MetaItem
            label={t("reports.detailFieldTotalAgents")}
            value={report.total_agents}
          />
          <div className="space-y-1 rounded-md border p-3">
            <div className="text-xs text-muted-foreground">
              {t("reports.detailFieldNotified")}
            </div>
            <div className="text-sm">
              <Badge
                variant="outline"
                className={notifiedBadgeClassName(report.notified)}
              >
                {report.notified
                  ? t("reports.notifiedYes")
                  : t("reports.notifiedNo")}
              </Badge>
            </div>
          </div>
          <MetaItem
            label={t("reports.detailFieldCreatedAt")}
            value={formatDateTimeByLocale(report.created_at, locale)}
          />
          <MetaItem
            label={t("reports.detailFieldUpdatedAt")}
            value={formatDateTimeByLocale(report.updated_at, locale)}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("reports.detailSectionInstances")}</CardTitle>
          <CardDescription>{t("reports.detailSectionInstancesDescription")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <MetaItem label={t("reports.detailInstancesStatTotal")} value={reportInstances.length} />
            <MetaItem label={t("reports.detailInstancesStatHigh")} value={reportInstanceRiskStats.high} />
            <MetaItem label={t("reports.detailInstancesStatMedium")} value={reportInstanceRiskStats.medium} />
            <MetaItem label={t("reports.detailInstancesStatLowOrNormal")} value={reportInstanceRiskStats.low + reportInstanceRiskStats.normal} />
          </div>
          <div className="flex flex-wrap gap-3 rounded-md border border-dashed p-3 text-xs text-muted-foreground">
            {(["normal", "attention", "alert", "critical"] as const).map((level) => (
              <div key={level} className="flex items-center gap-2">
                <span className={cn("h-2.5 w-2.5 rounded-full", riskDotClassNameByLevel(level))} />
                <span>
                  {t(`reports.detailInstancesLegend_${level}`)}
                </span>
              </div>
            ))}
          </div>
          <div className="overflow-x-auto rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("reports.detailInstancesColAgentId")}</TableHead>
                  <TableHead>{t("reports.detailInstancesColName")}</TableHead>
                  <TableHead>{t("reports.detailInstancesColType")}</TableHead>
                  <TableHead>{t("reports.detailInstancesColRisk")}</TableHead>
                  <TableHead className="text-right">CPU</TableHead>
                  <TableHead className="text-right">Memory</TableHead>
                  <TableHead className="text-right">Disk</TableHead>
                  <TableHead>{t("reports.detailInstancesColTimestamp")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedReportInstances.length > 0 ? (
                  reportInstancesPagination.paginatedItems.map((item) => {
                    const itemRiskLevel = resolveRiskLevel(item.risk_level)
                    return (
                      <TableRow
                        key={`${item.agent_id}-${item.timestamp}`}
                        className={riskRowClassNameByLevel(itemRiskLevel)}
                      >
                        <TableCell className="font-mono text-xs">{item.agent_id}</TableCell>
                        <TableCell>{item.instance_name || "-"}</TableCell>
                        <TableCell>{item.agent_type}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <span className={cn("h-2.5 w-2.5 rounded-full", riskDotClassNameByLevel(itemRiskLevel))} />
                            <Badge variant="outline" className={riskBadgeClassNameByLevel(itemRiskLevel)}>
                              {riskLevelLabel(itemRiskLevel, locale)}
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">{item.cpu_usage ?? "-"}</TableCell>
                        <TableCell className="text-right">{item.memory_usage ?? "-"}</TableCell>
                        <TableCell className="text-right">{item.disk_usage ?? "-"}</TableCell>
                        <TableCell>{formatReportInstanceTimestamp(item.timestamp, locale)}</TableCell>
                      </TableRow>
                    )
                  })
                ) : (
                  <TableRow>
                    <TableCell colSpan={8} className="h-24 text-center text-sm text-muted-foreground">
                      {t("reports.detailInstancesEmpty")}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
          {sortedReportInstances.length > 0 ? (
            <PaginationControls
              className="rounded-md border"
              {...buildTranslatedPaginationTextBundle({
                t,
                summaryKey: "reports.paginationSummary",
                total: reportInstancesPagination.totalRows,
                start: reportInstancesPagination.startIndex,
                end: reportInstancesPagination.endIndex,
                pageKey: "reports.paginationPage",
                currentPage: reportInstancesPagination.currentPage,
                totalPages: reportInstancesPagination.totalPages,
                prevKey: "reports.paginationPrev",
                nextKey: "reports.paginationNext",
              })}
              pageSize={instancesPageSize}
              pageSizeOptions={[...INSTANCE_PAGE_SIZE_OPTIONS]}
              onPageSizeChange={setInstancesPageSize}
              pageSizePlaceholder={t("reports.detailInstancesPageSize")}
              pageSizeOptionLabel={(value) => t("reports.detailInstancesPageSizeOption", { value })}
              onPrevPage={() =>
                reportInstancesPagination.setPage((prev) => Math.max(1, prev - 1))
              }
              onNextPage={() =>
                reportInstancesPagination.setPage((prev) =>
                  Math.min(reportInstancesPagination.totalPages, prev + 1),
                )
              }
              prevDisabled={reportInstancesPagination.currentPage <= 1}
              nextDisabled={
                reportInstancesPagination.currentPage >= reportInstancesPagination.totalPages
              }
            />
          ) : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("reports.detailSectionAnalysis")}</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs
            value={detailTab}
            onValueChange={(value) => setDetailTab(value as "analysis" | "html")}
            className="space-y-4"
          >
            <TabsList>
              <TabsTrigger value="analysis">
                {t("reports.detailSectionAnalysis")}
              </TabsTrigger>
              <TabsTrigger value="html">
                {t("reports.detailSectionHtml")}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="analysis">
              <div className="rounded-md border p-4 text-sm leading-6 [&_a]:text-primary [&_a]:underline [&_blockquote]:border-l-2 [&_blockquote]:pl-3 [&_code]:rounded [&_code]:bg-muted [&_code]:px-1.5 [&_code]:py-0.5 [&_h1]:text-xl [&_h1]:font-semibold [&_h2]:text-lg [&_h2]:font-semibold [&_h3]:font-semibold [&_li]:ml-5 [&_li]:list-disc [&_ol]:space-y-1 [&_p]:my-2 [&_pre]:overflow-x-auto [&_pre]:rounded [&_pre]:bg-muted [&_pre]:p-3 [&_ul]:space-y-1">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {report.ai_analysis?.trim() || "-"}
                </ReactMarkdown>
              </div>
            </TabsContent>

            <TabsContent value="html">
              <div className="space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <Tabs
                    value={htmlTab}
                    onValueChange={(value) => setHtmlTab(value as "preview" | "source")}
                  >
                    <TabsList>
                      <TabsTrigger value="preview">
                        {t("reports.detailHtmlTabPreview")}
                      </TabsTrigger>
                      <TabsTrigger value="source">
                        <Code2 className="mr-1 h-4 w-4" />
                        {t("reports.detailHtmlTabSource")}
                      </TabsTrigger>
                    </TabsList>
                  </Tabs>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      if (!canRenderHtmlPreview) {
                        setHtmlPreviewRequested(true);
                      }
                      setPreviewFullscreenOpen(true);
                    }}
                    disabled={htmlTab !== "preview"}
                  >
                    <Expand className="mr-2 h-4 w-4" />
                    {t("reports.detailHtmlFullscreen")}
                  </Button>
                </div>
                {isDev && (
                  <p className="text-xs text-muted-foreground">
                    {t("reports.detailHtmlDebugInfo", {
                      mode: t(`reports.detailHtmlMode_${previewMode}`),
                      size: String(htmlSize),
                      lazyThreshold: String(adaptiveLazyThreshold),
                      manualThreshold: String(adaptiveManualThreshold),
                    })}
                  </p>
                )}

                {htmlTab === "preview" && !canRenderHtmlPreview ? (
                  <div className="flex h-[65vh] min-h-[520px] w-full flex-col items-center justify-center gap-4 rounded-md border bg-muted/20 px-6 text-center">
                    <p className="text-sm text-muted-foreground">
                      {shouldManualLoadPreview
                        ? t("reports.detailHtmlLargeHint")
                        : t("reports.detailHtmlPreloadHint")}
                    </p>
                    <Button
                      type="button"
                      onClick={() => setHtmlPreviewRequested(true)}
                    >
                      {t("reports.detailHtmlLoadPreview")}
                    </Button>
                  </div>
                ) : htmlTab === "preview" && !previewFullscreenOpen ? (
                  <HtmlPreviewFrame
                    title={`ai-report-${report.id}`}
                    src={htmlPreviewUrl}
                    className="h-[65vh] min-h-[520px] w-full rounded-md border bg-white"
                    loading="lazy"
                    loadingText={t("reports.detailHtmlLoading")}
                  />
                ) : htmlTab === "preview" ? (
                  <div className="flex h-[65vh] min-h-[520px] w-full items-center justify-center rounded-md border bg-muted/20 text-sm text-muted-foreground">
                    {t("reports.detailHtmlFullscreenHint")}
                  </div>
                ) : (
                  <Textarea
                    readOnly
                    value={htmlSource}
                    className="min-h-[520px] font-mono text-xs"
                  />
                )}

                {!htmlSource && (
                  <p className="text-sm text-muted-foreground">
                    {t("reports.detailHtmlEmpty")}
                  </p>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("reports.detailSectionRawMetrics")}</CardTitle>
        </CardHeader>
        <CardContent>
          <JsonTextarea
            readOnly
            value={formattedRawMetricsJson}
            onChange={() => {}}
            className="min-h-[180px]"
          />
        </CardContent>
      </Card>

      <Dialog
        open={previewFullscreenOpen}
        onOpenChange={setPreviewFullscreenOpen}
      >
        <DialogContent
          className="top-0 left-0 h-screen w-screen max-h-screen max-w-none translate-x-0 translate-y-0 gap-0 overflow-hidden rounded-none border-0 p-0 sm:max-w-none"
          showCloseButton
        >
          <DialogHeader className="border-b px-6 py-4">
            <DialogTitle>{t("reports.detailHtmlFullscreen")}</DialogTitle>
          </DialogHeader>
          <div className="h-[calc(100vh-4.5rem)] w-full">
            {canRenderHtmlPreview ? (
              <HtmlPreviewFrame
                title={`ai-report-fullscreen-${report.id}`}
                src={htmlPreviewUrl}
                className="h-full w-full border-0 bg-white"
                loadingText={t("reports.detailHtmlLoading")}
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-muted/20 px-6 text-center text-sm text-muted-foreground">
                {t("reports.detailHtmlLoading")}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
