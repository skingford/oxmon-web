export interface AgentResponse {
  agent_id: string;
  last_seen: string | null;
  status: string;
}

export interface AgentWhitelistDetail {
  id: string;
  agent_id: string;
  created_at: string;
  updated_at: string;
  description: string | null;
  token: string | null;
  last_seen: string | null;
  status: string;
}

export interface AddAgentRequest {
  agent_id: string;
  description?: string;
}

export interface AddAgentResponse {
  id: string;
  agent_id: string;
  token: string;
  created_at: string;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface ApiResponseEnvelope<T> {
  err_code: number;
  err_msg: string;
  trace_id?: string;
  data: T;
}

export interface LatestMetric {
  metric_name: string;
  value: number;
  labels: Record<string, string>;
  timestamp: string;
}

export interface AlertEventResponse {
  id: string;
  rule_id: string;
  agent_id: string;
  metric_name: string;
  severity: string;
  message: string;
  value: number;
  threshold: number;
  timestamp: string;
  resolved_at: string | null;
}

export interface AlertRuleResponse {
  id: string;
  metric: string;
  agent_pattern: string;
  severity: string;
}

export interface AlertRuleDetailResponse extends AlertRuleResponse {
  name: string;
  rule_type: string;
  enabled: boolean;
  config_json: string;
  silence_secs: number;
  source: string;
  created_at: string;
  updated_at: string;
}

export interface CreateAlertRuleRequest {
  name: string;
  rule_type: string;
  metric: string;
  agent_pattern?: string;
  severity?: string;
  config_json?: string;
  silence_secs?: number;
}

export interface ApiError {
  err_code: number;
  err_msg: string;
  trace_id?: string;
}

export interface LoginResponse {
  token: string;
  expires_in: number;
}

export interface PaginationParams {
  limit?: number;
  offset?: number;
}

export interface CertSummary {
  total_domains: number;
  valid: number;
  invalid: number;
  expiring_soon: number;
}

export interface DashboardOverview {
  active_agents: number;
  total_agents: number;
  alerts_24h: number;
  alerts_by_severity: Record<string, number>;
  cert_summary: CertSummary;
  partition_count: number;
  storage_total_bytes: number;
  uptime_secs: number;
}

export interface CertificateDetails {
  id: string;
  domain: string;
  not_before: string;
  not_after: string;
  ip_addresses: string[];
  issuer_cn: string | null;
  issuer_o: string | null;
  issuer_ou: string | null;
  issuer_c: string | null;
  chain_valid: boolean;
  last_checked: string;
  created_at: string;
  updated_at: string;
}

export interface ChannelOverview {
  id: string;
  name: string;
  channel_type: string;
  description: string | null;
  min_severity: string;
  enabled: boolean;
  recipient_type: string | null;
  recipients: string[];
  created_at: string;
  updated_at: string;
}

export interface RuntimeConfig {
  grpc_port: number;
  http_port: number;
  data_dir: string;
  retention_days: number;
  require_agent_auth: boolean;
  cert_check_enabled: boolean;
  cert_check_default_interval_secs: number;
  cert_check_tick_secs: number;
  cert_check_max_concurrent: number;
  notification_aggregation_window_secs: number;
  alert_rules_count: number;
  notification_channels_count: number;
}

export interface PartitionDetail {
  partition_id: string;
  agent_id: string;
  metric_name: string;
  start_time: string;
  end_time: string;
  points_count: number;
  size_bytes: number;
}

export interface StorageInfo {
  partitions: PartitionDetail[];
  total_partitions: number;
  total_size_bytes: number;
}

export interface ChangePasswordRequest {
  old_password: string;
  new_password: string;
}

export interface ChainNode {
  subject_cn: string | null;
  issuer_cn: string | null;
  not_after: string;
  is_root: boolean;
  is_trusted: boolean;
}

export interface CertificateChainInfo {
  id: string;
  domain: string;
  is_valid: boolean;
  validation_error: string | null;
  chain: ChainNode[];
}

export interface CertCheckResult {
  domain_id: string;
  domain: string;
  is_success: boolean;
  error_message: string | null;
  checked_at: string;
  certificate_id: string | null;
}

export interface CertDomain {
  id: string;
  domain: string;
  enabled: boolean;
  check_interval_secs: number;
  created_at: string;
  updated_at: string;
}

export interface CreateDomainRequest {
  domain: string;
  enabled?: boolean;
  check_interval_secs?: number;
}

export interface UpdateDomainRequest {
  enabled?: boolean;
  check_interval_secs?: number;
}

export interface BatchCreateDomainsRequest {
  domains: CreateDomainRequest[];
}

export interface MetricDataPointResponse {
  agent_id: string;
  metric_name: string;
  value: number;
  labels: Record<string, string>;
  created_at: string;
}

export interface MetricSummaryResponse {
  agent_id: string;
  metric_name: string;
  min: number;
  max: number;
  avg: number;
  count: number;
}

export interface CreateChannelRequest {
  name: string;
  channel_type: string;
  description?: string;
  min_severity?: string;
  enabled?: boolean;
  config_json: string;
  recipients?: string[];
}

export interface SetRecipientsRequest {
  recipients: string[];
}

export interface SilenceWindow {
  id: string;
  name: string;
  agent_pattern: string;
  metric_pattern: string;
  start_time: string;
  end_time: string;
  created_at: string;
}

export interface CreateSilenceWindowRequest {
  name: string;
  agent_pattern: string;
  metric_pattern: string;
  start_time: string;
  end_time: string;
}

export interface EnableRequest {
  enabled: boolean;
}
