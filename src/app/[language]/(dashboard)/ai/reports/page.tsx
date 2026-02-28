"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import type { AIReportListItem } from "@/types/api";
import { toastApiError } from "@/lib/toast";
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
import { motion, AnimatePresence } from "framer-motion"
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { RefreshCw } from "lucide-react";

function formatDateTime(value?: string | null) {
  if (!value) return "-";
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? value : d.toLocaleString();
}

function riskVariant(
  risk: string,
): "default" | "destructive" | "secondary" | "outline" {
  const x = risk.toLowerCase();
  if (x.includes("high") || x.includes("critical")) return "destructive";
  if (x.includes("medium") || x.includes("warn")) return "default";
  if (x.includes("low")) return "secondary";
  return "outline";
}

export default function AIReportsPage() {
  const { t } = useAppTranslations("ai");
  const locale = useAppLocale();
  const [items, setItems] = useState<AIReportListItem[]>([]);
  const [loading, setLoading] = useState(true);

  const sortedItems = useMemo(
    () =>
      [...items].sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
      ),
    [items],
  );

  const fetchData = async () => {
    setLoading(true);
    try {
      setItems(await api.listAIReports());
    } catch (error) {
      toastApiError(error, t("reports.toastFetchError"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchData();
  }, []);

  return (
    <div className="min-w-0 space-y-6 p-4 md:p-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">
            {t("reports.title")}
          </h2>
          <p className="text-sm text-muted-foreground">
            {t("reports.description")}
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          onClick={() => void fetchData()}
          disabled={loading}
        >
          <RefreshCw
            className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`}
          />
          {t("reports.refreshButton")}
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t("reports.tableTitle")}</CardTitle>
          <CardDescription>{t("reports.tableDescription")}</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("reports.colDate")}</TableHead>
                <TableHead>{t("reports.colProvider")}</TableHead>
                <TableHead>{t("reports.colModel")}</TableHead>
                <TableHead>{t("reports.colRisk")}</TableHead>
                <TableHead>{t("reports.colAgents")}</TableHead>
                <TableHead>{t("reports.colNotified")}</TableHead>
                <TableHead>{t("reports.colCreatedAt")}</TableHead>
                <TableHead className="text-right">
                  {t("reports.colActions")}
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell
                    colSpan={8}
                    className="h-24 text-center text-muted-foreground"
                  >
                    {t("reports.tableLoading")}
                  </TableCell>
                </TableRow>
              ) : sortedItems.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={8}
                    className="h-24 text-center text-muted-foreground"
                  >
                    {t("reports.tableEmpty")}
                  </TableCell>
                </TableRow>
              ) : (
                sortedItems.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>{item.report_date}</TableCell>
                    <TableCell>{item.ai_provider}</TableCell>
                    <TableCell className="max-w-[220px] truncate">
                      {item.ai_model}
                    </TableCell>
                    <TableCell>
                      <Badge variant={riskVariant(item.risk_level)}>
                        {item.risk_level}
                      </Badge>
                    </TableCell>
                    <TableCell>{item.total_agents}</TableCell>
                    <TableCell>
                      {item.notified
                        ? t("reports.notifiedYes")
                        : t("reports.notifiedNo")}
                    </TableCell>
                    <TableCell>{formatDateTime(item.created_at)}</TableCell>
                    <TableCell className="text-right">
                      <Button type="button" size="sm" variant="outline" asChild>
                        <Link
                          href={withLocalePrefix(
                            `/ai/reports/${item.id}`,
                            locale,
                          )}
                        >
                          {t("reports.actionView")}
                        </Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
