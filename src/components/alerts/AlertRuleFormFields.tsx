"use client"

import { CreateAlertRuleRequest } from "@/types/api"
import { useAppTranslations } from "@/hooks/use-app-translations"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"

type AlertRuleFormFieldsProps = {
  ruleForm: CreateAlertRuleRequest
  metricNames: string[]
  loadingMetrics: boolean
  allowManualInput: boolean
  onRuleFormChange: (next: CreateAlertRuleRequest) => void
}

const SUPPORTED_RULE_TYPES = [
  "threshold",
  "rate_of_change",
  "trend_prediction",
  "cert_expiration",
] as const

export function AlertRuleFormFields({
  ruleForm,
  metricNames,
  loadingMetrics,
  allowManualInput,
  onRuleFormChange,
}: AlertRuleFormFieldsProps) {
  const { t } = useAppTranslations("alerts")
  const hasLegacyRuleType =
    Boolean(ruleForm.rule_type) && !SUPPORTED_RULE_TYPES.includes(ruleForm.rule_type as (typeof SUPPORTED_RULE_TYPES)[number])

  const updateRuleForm = (patch: Partial<CreateAlertRuleRequest>) => {
    onRuleFormChange({
      ...ruleForm,
      ...patch,
    })
  }

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

      <div className="grid grid-cols-2 gap-4">
        <div className="grid gap-2">
          <Label htmlFor="rule-type" className="font-medium text-gray-900">
            {t("rules.fieldType")}
          </Label>
            <Select value={ruleForm.rule_type} onValueChange={(value) => updateRuleForm({ rule_type: value })}>
              <SelectTrigger id="rule-type" className="bg-white border-gray-300 text-gray-900">
                <SelectValue placeholder={t("rules.placeholderType")} />
              </SelectTrigger>
              <SelectContent className="bg-white">
                <SelectItem value="threshold">{t("rules.ruleTypes.threshold")}</SelectItem>
                <SelectItem value="rate_of_change">{t("rules.ruleTypes.rateOfChange")}</SelectItem>
                <SelectItem value="trend_prediction">{t("rules.ruleTypes.trendPrediction")}</SelectItem>
                <SelectItem value="cert_expiration">{t("rules.ruleTypes.certExpiration")}</SelectItem>
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
              placeholder={loadingMetrics ? t("rules.loadingMetrics") : t("rules.placeholderMetricManual")}
              disabled={loadingMetrics}
              className="bg-white border-gray-300 text-gray-900"
            />
          ) : (
            <Select value={ruleForm.metric} onValueChange={(value) => updateRuleForm({ metric: value })}>
              <SelectTrigger id="rule-metric" className="bg-white border-gray-300 text-gray-900">
                <SelectValue placeholder={t("rules.placeholderMetric")} />
              </SelectTrigger>
              <SelectContent className="bg-white max-h-[300px]">
                {metricNames.length === 0 ? (
                  <div className="px-2 py-4 text-center text-sm text-gray-500">
                    {t("rules.noMetricsAvailable")}
                  </div>
                ) : (
                  metricNames.map((name) => (
                    <SelectItem key={name} value={name}>
                      {name}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="grid gap-2">
          <Label htmlFor="rule-pattern" className="font-medium text-gray-900">
            {t("rules.fieldPattern")}
          </Label>
          <Input
            id="rule-pattern"
            value={ruleForm.agent_pattern}
            onChange={(event) => updateRuleForm({ agent_pattern: event.target.value })}
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
            <SelectTrigger id="rule-severity" className="bg-white border-gray-300 text-gray-900">
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
        <Textarea
          id="rule-config"
          value={ruleForm.config_json}
          onChange={(event) => updateRuleForm({ config_json: event.target.value })}
          placeholder={t("rules.placeholderConfig")}
          className="font-mono text-xs bg-white border-gray-300 text-gray-900"
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
          onChange={(event) => updateRuleForm({ silence_secs: parseInt(event.target.value) || 0 })}
          placeholder={t("rules.placeholderSilence")}
          className="bg-white border-gray-300 text-gray-900"
        />
      </div>
    </div>
  )
}
