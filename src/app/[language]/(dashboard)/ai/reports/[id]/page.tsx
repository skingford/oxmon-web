"use client";

import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { api } from "@/lib/api";
import type { AIReportRow } from "@/types/api";
import { formatDateTimeByLocale } from "@/lib/date-time";
import { notifiedBadgeClassName } from "@/lib/notified-status";
import { toastApiError } from "@/lib/toast";
import {
  resolveRiskLevel,
  riskLevelLabelZh,
  riskBadgeClassNameByLevel,
} from "@/lib/risk-level";
import { useAppTranslations } from "@/hooks/use-app-translations";
import { useAppLocale } from "@/hooks/use-app-locale";
import { withLocalePrefix } from "@/components/app-locale";
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
  const [loading, setLoading] = useState(true);
  const [detailTab, setDetailTab] = useState<"analysis" | "html">("analysis");
  const [htmlTab, setHtmlTab] = useState<"preview" | "source">("preview");
  const [previewFullscreenOpen, setPreviewFullscreenOpen] = useState(false);
  const [htmlPreviewUrl, setHtmlPreviewUrl] = useState("");
  const [htmlPreviewRequested, setHtmlPreviewRequested] = useState(false);
  const htmlPreviewCacheRef = useRef<{
    raw: string;
    url: string;
  } | null>(null);
  const riskLevel = useMemo(
    () => resolveRiskLevel(report?.risk_level || ""),
    [report?.risk_level],
  );
  const riskLevelLabel = riskLevelLabelZh(riskLevel);
  const formattedRawMetricsJson = useMemo(
    () => formatJsonText(report?.raw_metrics_json),
    [report?.raw_metrics_json],
  );
  const isDev = process.env.NODE_ENV !== "production";
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
      setReport(await api.getAIReportById(id));
    } catch (error) {
      setReport(null);
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
                {riskLevelLabel}
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
