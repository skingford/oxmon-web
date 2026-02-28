import { RuntimeConfig } from "@/types/api";
import { useAppTranslations } from "@/hooks/use-app-translations";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Server } from "lucide-react";
import { motion } from "framer-motion";

interface RuntimeConfigCardProps {
  config: RuntimeConfig | null;
}

export function RuntimeConfigCard({ config }: RuntimeConfigCardProps) {
  const { t } = useAppTranslations("system");

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
    >
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Server className="h-5 w-5" />
            {t("runtimeTitle")}
          </CardTitle>
          <CardDescription>{t("runtimeDescription")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium">{t("fieldHttpPort")}</Label>
              <Input readOnly value={config?.http_port || ""} className="bg-muted font-mono" />
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium">{t("fieldGrpcPort")}</Label>
              <Input readOnly value={config?.grpc_port || ""} className="bg-muted font-mono" />
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium">{t("fieldDataDir")}</Label>
            <Input readOnly value={config?.data_dir || "N/A"} className="bg-muted font-mono" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium">{t("fieldRetentionDays")}</Label>
              <Input readOnly value={config?.retention_days ?? "N/A"} className="bg-muted font-mono" />
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium">{t("fieldAgentAuth")}</Label>
              <Input
                readOnly
                value={
                  config?.require_agent_auth
                    ? t("systemConfigFilterStatusEnabled")
                    : t("systemConfigFilterStatusDisabled")
                }
                className="bg-muted"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium">{t("fieldCertCheckEnabled")}</Label>
              <Input
                readOnly
                value={
                  config?.cert_check_enabled
                    ? t("systemConfigFilterStatusEnabled")
                    : t("systemConfigFilterStatusDisabled")
                }
                className="bg-muted"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium">{t("fieldCertCheckDefaultInterval")}</Label>
              <Input readOnly value={config?.cert_check_default_interval_secs ?? "N/A"} className="bg-muted font-mono" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium">{t("fieldCertCheckTickSecs")}</Label>
              <Input readOnly value={config?.cert_check_tick_secs ?? "N/A"} className="bg-muted font-mono" />
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium">{t("fieldCertCheckMaxConcurrent")}</Label>
              <Input readOnly value={config?.cert_check_max_concurrent ?? "N/A"} className="bg-muted font-mono" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium">{t("fieldNotifyAggregationWindow")}</Label>
              <Input readOnly value={config?.notification_aggregation_window_secs ?? "N/A"} className="bg-muted font-mono" />
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium">{t("fieldAlertRulesCount")}</Label>
              <Input readOnly value={config?.alert_rules_count ?? 0} className="bg-muted font-mono" />
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium">{t("fieldNotificationChannelsCount")}</Label>
            <Input readOnly value={config?.notification_channels_count ?? 0} className="bg-muted font-mono" />
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
