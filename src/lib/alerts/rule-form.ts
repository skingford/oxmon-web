import { AlertRuleDetailResponse, CreateAlertRuleRequest } from "@/types/api";

export const SUPPORTED_ALERT_RULE_TYPES = [
  "threshold",
  "rate_of_change",
  "trend_prediction",
  "cert_expiration",
] as const;

export type SupportedAlertRuleType =
  (typeof SUPPORTED_ALERT_RULE_TYPES)[number];
export type AlertRuleTypeLabelKey =
  | "rules.ruleTypes.threshold"
  | "rules.ruleTypes.rateOfChange"
  | "rules.ruleTypes.trendPrediction"
  | "rules.ruleTypes.certExpiration"
  | "rules.ruleTypes.legacy";

type AlertRuleTypeLabelInfo = {
  key: AlertRuleTypeLabelKey;
  values?: Record<string, string>;
};

const ALERT_RULE_TYPE_LABEL_KEYS: Record<
  SupportedAlertRuleType,
  Exclude<AlertRuleTypeLabelKey, "rules.ruleTypes.legacy">
> = {
  threshold: "rules.ruleTypes.threshold",
  rate_of_change: "rules.ruleTypes.rateOfChange",
  trend_prediction: "rules.ruleTypes.trendPrediction",
  cert_expiration: "rules.ruleTypes.certExpiration",
};

const LEGACY_ALERT_RULE_TYPE_ALIASES: Record<string, SupportedAlertRuleType> = {
  anomaly: "trend_prediction",
  pattern: "threshold",
  availability: "threshold",
  heartbeat_absent: "threshold",
  "cert.expiration": "cert_expiration",
  "cert-expiration": "cert_expiration",
};

export const ALERT_RULE_TYPE_OPTIONS = SUPPORTED_ALERT_RULE_TYPES.map(
  (value) => ({
    value,
    labelKey: ALERT_RULE_TYPE_LABEL_KEYS[value],
  }),
);

export const DEFAULT_ALERT_RULE_FORM_STATE: CreateAlertRuleRequest = {
  name: "",
  rule_type: "threshold",
  metric: "",
  agent_pattern: "*",
  severity: "warning",
  config_json: "{}",
  silence_secs: 300,
};

export function isSupportedAlertRuleType(
  value: string,
): value is SupportedAlertRuleType {
  return (SUPPORTED_ALERT_RULE_TYPES as readonly string[]).includes(value);
}

export function normalizeAlertRuleType(value: string) {
  if (isSupportedAlertRuleType(value)) {
    return value;
  }

  const mapped = getLegacyAlertRuleTypeAlias(value);

  if (mapped) {
    return mapped;
  }

  return DEFAULT_ALERT_RULE_FORM_STATE.rule_type;
}

export function getLegacyAlertRuleTypeAlias(
  value: string,
): SupportedAlertRuleType | null {
  const normalized = value.trim().toLowerCase();
  return LEGACY_ALERT_RULE_TYPE_ALIASES[normalized] || null;
}

export function getAlertRuleTypeLabelInfo(
  ruleType: string,
): AlertRuleTypeLabelInfo {
  if (isSupportedAlertRuleType(ruleType)) {
    return {
      key: ALERT_RULE_TYPE_LABEL_KEYS[ruleType],
    };
  }

  const mapped = getLegacyAlertRuleTypeAlias(ruleType);
  if (mapped) {
    return {
      key: ALERT_RULE_TYPE_LABEL_KEYS[mapped],
    };
  }

  return {
    key: "rules.ruleTypes.legacy",
    values: { value: ruleType },
  };
}

export function normalizeAlertRulePayload(
  form: CreateAlertRuleRequest,
): CreateAlertRuleRequest {
  return {
    ...form,
    rule_type: normalizeAlertRuleType(form.rule_type),
  };
}

export function createDefaultAlertRuleFormState(): CreateAlertRuleRequest {
  return { ...DEFAULT_ALERT_RULE_FORM_STATE };
}

export function mapAlertRuleToFormState(
  rule: AlertRuleDetailResponse,
): CreateAlertRuleRequest {
  return {
    name: rule.name,
    rule_type: rule.rule_type,
    metric: rule.metric,
    agent_pattern: rule.agent_pattern,
    severity: rule.severity,
    config_json: rule.config_json,
    silence_secs: rule.silence_secs,
  };
}
