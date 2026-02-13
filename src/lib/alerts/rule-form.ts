import { AlertRuleDetailResponse, CreateAlertRuleRequest } from "@/types/api"

export const DEFAULT_ALERT_RULE_FORM_STATE: CreateAlertRuleRequest = {
  name: "",
  rule_type: "threshold",
  metric: "",
  agent_pattern: "*",
  severity: "warning",
  config_json: "{}",
  silence_secs: 300,
}

export function createDefaultAlertRuleFormState(): CreateAlertRuleRequest {
  return { ...DEFAULT_ALERT_RULE_FORM_STATE }
}

export function mapAlertRuleToFormState(rule: AlertRuleDetailResponse): CreateAlertRuleRequest {
  return {
    name: rule.name,
    rule_type: rule.rule_type,
    metric: rule.metric,
    agent_pattern: rule.agent_pattern,
    severity: rule.severity,
    config_json: rule.config_json,
    silence_secs: rule.silence_secs,
  }
}
