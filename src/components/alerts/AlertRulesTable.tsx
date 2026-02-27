"use client";

import { motion } from "framer-motion";
import {
  AlertCircle,
  AlertTriangle,
  Edit2,
  Info,
  Loader2,
  Trash2,
} from "lucide-react";
import { AlertRuleResponse } from "@/types/api";
import { getAlertRuleTypeLabelInfo } from "@/lib/alerts/rule-form";
import {
  useAppTranslations,
  type AppNamespaceTranslator,
} from "@/hooks/use-app-translations";
import { AlertRulesTableHeader } from "@/components/alerts/AlertRulesHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

function getSeverityBadgeClass(severity: string) {
  const normalized = severity.toLowerCase();

  if (normalized === "critical") {
    return "border-red-500/30 bg-red-500/10 text-red-600";
  }

  if (normalized === "warning") {
    return "border-amber-500/30 bg-amber-500/10 text-amber-600";
  }

  if (normalized === "info") {
    return "border-blue-500/30 bg-blue-500/10 text-blue-600";
  }

  return "border-muted bg-muted text-muted-foreground";
}

function getSeverityIcon(severity: string) {
  const normalized = severity.toLowerCase();

  if (normalized === "critical") {
    return AlertCircle;
  }

  if (normalized === "warning") {
    return AlertTriangle;
  }

  if (normalized === "info") {
    return Info;
  }

  return AlertCircle;
}

function getSeverityText(
  severity: string,
  t: AppNamespaceTranslator<"alerts">,
) {
  const normalized = severity.toLowerCase();

  if (normalized === "critical") {
    return t("severity.critical");
  }

  if (normalized === "warning") {
    return t("severity.warning");
  }

  if (normalized === "info") {
    return t("severity.info");
  }

  return severity;
}

function getRuleTypeText(
  ruleType: string,
  t: AppNamespaceTranslator<"alerts">,
) {
  const labelInfo = getAlertRuleTypeLabelInfo(ruleType);
  return t(labelInfo.key, labelInfo.values);
}

function normalizeMetricKey(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]/g, "");
}

type AlertRulesTableProps = {
  loading: boolean;
  rules: AlertRuleResponse[];
  metricLabelMap: Record<string, string>;
  onToggleEnabled: (rule: AlertRuleResponse) => void;
  onEditRule: (rule: AlertRuleResponse) => void;
  onDeleteRule: (id: string) => void;
};

export function AlertRulesTable({
  loading,
  rules,
  metricLabelMap,
  onToggleEnabled,
  onEditRule,
  onDeleteRule,
}: AlertRulesTableProps) {
  const { t } = useAppTranslations("alerts");

  return (
    <Card className="glass-card">
      <AlertRulesTableHeader />
      <CardContent>
        <div className="overflow-hidden rounded-lg border border-white/10">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("rules.colName")}</TableHead>
                <TableHead>{t("rules.colType")}</TableHead>
                <TableHead>{t("rules.colMetric")}</TableHead>
                <TableHead>{t("rules.colPattern")}</TableHead>
                <TableHead>{t("rules.colSeverity")}</TableHead>
                <TableHead>{t("rules.colSilence")}</TableHead>
                <TableHead>{t("rules.colEnabled")}</TableHead>
                <TableHead className="text-right">
                  {t("rules.colActions")}
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell
                    colSpan={8}
                    className="h-40 text-center text-muted-foreground"
                  >
                    <Loader2 className="mx-auto mb-2 h-5 w-5 animate-spin" />
                    {t("rules.tableLoading")}
                  </TableCell>
                </TableRow>
              ) : rules.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="h-40 text-center">
                    <div className="flex flex-col items-center gap-2 text-muted-foreground">
                      <AlertCircle className="h-10 w-10" />
                      <p className="font-semibold">{t("rules.emptyTitle")}</p>
                      <p className="text-sm">{t("rules.emptyDescription")}</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                rules.map((rule, index) => {
                  const SeverityIcon = getSeverityIcon(rule.severity);
                  const metricLabel =
                    metricLabelMap[rule.metric] ||
                    metricLabelMap[normalizeMetricKey(rule.metric)] ||
                    rule.metric;

                  return (
                    <motion.tr
                      key={rule.id}
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.2, delay: index * 0.05 }}
                      className="group"
                    >
                      <TableCell className="font-medium">{rule.name}</TableCell>
                      <TableCell className="text-sm">
                        {getRuleTypeText(rule.rule_type, t)}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span>{metricLabel}</span>
                          {metricLabel !== rule.metric ? (
                            <span className="text-xs text-muted-foreground">
                              {rule.metric}
                            </span>
                          ) : null}
                        </div>
                      </TableCell>
                      <TableCell className="font-mono text-xs">
                        {rule.agent_pattern}
                      </TableCell>
                      <TableCell>
                        <Badge className={getSeverityBadgeClass(rule.severity)}>
                          <SeverityIcon className="mr-1 h-3 w-3" />
                          {getSeverityText(rule.severity, t)}
                        </Badge>
                      </TableCell>
                      <TableCell>-</TableCell>
                      <TableCell>
                        <Switch
                          checked={rule.enabled}
                          onCheckedChange={() => onToggleEnabled(rule)}
                        />
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onEditRule(rule)}
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onDeleteRule(rule.id)}
                            className="text-red-500 hover:text-red-600"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </motion.tr>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
