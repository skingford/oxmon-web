"use client";

import { CreateAlertRuleRequest } from "@/types/api";
import {
  ALERT_RULE_TYPE_OPTIONS,
  isSupportedAlertRuleType,
} from "@/lib/alerts/rule-form";
import { useAppTranslations } from "@/hooks/use-app-translations";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SearchableCombobox } from "@/components/ui/searchable-combobox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { JsonTextarea } from "@/components/ui/json-textarea";

type AlertRuleFormFieldsProps = {
  ruleForm: CreateAlertRuleRequest;
  metricOptions: Array<{
    value: string;
    label: string;
  }>;
  loadingMetrics: boolean;
  allowManualInput: boolean;
  onRuleFormChange: (next: CreateAlertRuleRequest) => void;
};

export function AlertRuleFormFields({
  ruleForm,
  metricOptions,
  loadingMetrics,
  allowManualInput,
  onRuleFormChange,
}: AlertRuleFormFieldsProps) {
  const { t } = useAppTranslations("alerts");
  const hasLegacyRuleType =
    Boolean(ruleForm.rule_type) &&
    !isSupportedAlertRuleType(ruleForm.rule_type);

  const updateRuleForm = (patch: Partial<CreateAlertRuleRequest>) => {
    onRuleFormChange({
      ...ruleForm,
      ...patch,
    });
  };

  const selectableMetricOptions =
    ruleForm.metric &&
    !metricOptions.some((item) => item.value === ruleForm.metric)
      ? [{ value: ruleForm.metric, label: ruleForm.metric }, ...metricOptions]
      : metricOptions;

  return (
    <div className="grid gap-4 py-4">
      <div className="grid gap-2">
        <Label htmlFor="rule-name" className="font-medium text-gray-900">
          {t("rules.fieldName")}
        </Label>
        <Input
          id="rule-name"
          value={ruleForm.name}
          onChange={(event) => updateRuleForm({ name: event.target.value })}
          placeholder={t("rules.placeholderName")}
          className="bg-white border-gray-300 text-gray-900"
        />
      </div>

      <div className="grid gap-2">
        <Label htmlFor="rule-type" className="font-medium text-gray-900">
          {t("rules.fieldType")}
        </Label>
        <Select
          value={ruleForm.rule_type}
          onValueChange={(value) => updateRuleForm({ rule_type: value })}
        >
          <SelectTrigger
            id="rule-type"
            className="w-full bg-white border-gray-300 text-gray-900"
          >
            <SelectValue placeholder={t("rules.placeholderType")} />
          </SelectTrigger>
          <SelectContent className="bg-white">
            {ALERT_RULE_TYPE_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {t(option.labelKey)}
              </SelectItem>
            ))}
            {hasLegacyRuleType ? (
              <SelectItem value={ruleForm.rule_type}>
                {t("rules.ruleTypes.legacy", { value: ruleForm.rule_type })}
              </SelectItem>
            ) : null}
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-2">
        <Label htmlFor="rule-metric" className="font-medium text-gray-900">
          {t("rules.fieldMetric")}
        </Label>

        {allowManualInput || loadingMetrics ? (
          <Input
            id="rule-metric"
            value={ruleForm.metric}
            onChange={(event) => updateRuleForm({ metric: event.target.value })}
            placeholder={
              loadingMetrics
                ? t("rules.loadingMetrics")
                : t("rules.placeholderMetricManual")
            }
            disabled={loadingMetrics}
            className="bg-white border-gray-300 text-gray-900"
          />
        ) : (
          <SearchableCombobox
            inputId="rule-metric"
            value={ruleForm.metric}
            options={selectableMetricOptions.map((metric) => ({
              value: metric.value,
              label: metric.label,
              subtitle:
                metric.label !== metric.value ? metric.value : undefined,
            }))}
            onValueChange={(value) => updateRuleForm({ metric: value })}
            placeholder={t("rules.placeholderMetric")}
            emptyText={t("rules.noMetricsAvailable")}
            clearSearchOnClose
            clearSearchOnSelect
            inputClassName="bg-white border-gray-300 text-gray-900"
          />
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="grid gap-2">
          <Label htmlFor="rule-pattern" className="font-medium text-gray-900">
            {t("rules.fieldPattern")}
          </Label>
          <Input
            id="rule-pattern"
            value={ruleForm.agent_pattern}
            onChange={(event) =>
              updateRuleForm({ agent_pattern: event.target.value })
            }
            placeholder={t("rules.placeholderPattern")}
            className="bg-white border-gray-300 text-gray-900"
          />
        </div>

        <div className="grid gap-2">
          <Label htmlFor="rule-severity" className="font-medium text-gray-900">
            {t("rules.fieldSeverity")}
          </Label>
          <Select
            value={ruleForm.severity || "warning"}
            onValueChange={(value) => updateRuleForm({ severity: value })}
          >
            <SelectTrigger
              id="rule-severity"
              className="w-full bg-white border-gray-300 text-gray-900"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-white">
              <SelectItem value="critical">{t("severity.critical")}</SelectItem>
              <SelectItem value="warning">{t("severity.warning")}</SelectItem>
              <SelectItem value="info">{t("severity.info")}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid gap-2">
        <Label htmlFor="rule-config" className="font-medium text-gray-900">
          {t("rules.fieldConfig")}
        </Label>
        <JsonTextarea
          id="rule-config"
          value={ruleForm.config_json}
          onChange={(value) => updateRuleForm({ config_json: value })}
          placeholder={t("rules.placeholderConfig")}
          className="bg-white border-gray-300 text-gray-900"
          rows={4}
        />
      </div>

      <div className="grid gap-2">
        <Label htmlFor="rule-silence" className="font-medium text-gray-900">
          {t("rules.fieldSilence")}
        </Label>
        <Input
          id="rule-silence"
          type="number"
          value={ruleForm.silence_secs ?? 0}
          onChange={(event) =>
            updateRuleForm({ silence_secs: parseInt(event.target.value) || 0 })
          }
          placeholder={t("rules.placeholderSilence")}
          className="bg-white border-gray-300 text-gray-900"
        />
      </div>
    </div>
  );
}
