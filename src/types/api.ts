export interface AgentResponse {
  id?: string;
  agent_id: string;
  last_seen: string | null;
  status: string;
  created_at?: string | null;
  collection_interval_secs?: number | null;
}

export interface AgentDetail {
  id: string;
  agent_id: string;
  first_seen: string;
  last_seen: string;
  status: string;
  collection_interval_secs: number | null;
  description: string | null;
  created_at: string;
  updated_at: string;
  in_whitelist: boolean;
  whitelist_id: string | null;
}

export interface AgentWhitelistDetail {
  id: string;
  agent_id: string;
  created_at: string;
  updated_at: string;
  description: string | null;
  token: string | null;
  collection_interval_secs?: number | null;
  last_seen: string | null;
  status: string;
}

export interface AddAgentRequest {
  agent_id: string;
  description?: string | null;
  collection_interval_secs?: number | null;
}

export interface AddAgentResponse {
  id: string;
  agent_id: string;
  token: string;
  created_at: string;
}

export interface UpdateAgentRequest {
  description?: string | null;
  collection_interval_secs?: number | null;
}

export interface RegenerateTokenResponse {
  agent_id: string;
  token: string;
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
  predicted_breach?: string | null;
  acknowledged_at?: string | null;
  resolved_at?: string | null;
  status: number; // 1=未处理, 2=已确认, 3=已处理
}

export interface AlertRuleResponse {
  id: string;
  name: string;
  rule_type: string;
  metric: string;
  agent_pattern: string;
  severity: string;
  enabled: boolean;
}

export interface AlertRuleDetailResponse extends AlertRuleResponse {
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
  enabled?: boolean;
  config_json?: string;
  silence_secs?: number;
}

export interface UpdateAlertRuleRequest {
  name?: string | null;
  metric?: string | null;
  agent_pattern?: string | null;
  severity?: string | null;
  enabled?: boolean | null;
  config_json?: string | null;
  silence_secs?: number | null;
}

export interface ApiError {
  err_code: number;
  err_msg: string;
  trace_id?: string;
}

export interface IdResponse {
  id: string;
}

export interface HealthResponse {
  version: string;
  uptime_secs: number;
  agent_count: number;
  storage_status: string;
}

export interface LoginResponse {
  token: string;
  expires_in: number;
}

export interface PaginationParams {
  limit?: number;
  offset?: number;
}

export interface ListResponse<T> {
  items: T[];
  total: number;
  limit: number;
  offset: number;
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
  subject_alt_names: string[];
  issuer_cn: string | null;
  issuer_o: string | null;
  issuer_ou: string | null;
  issuer_c: string | null;
  chain_valid: boolean;
  chain_error: string | null;
  last_checked: string;
  created_at: string;
  updated_at: string;
  serial_number?: string | null;
  fingerprint_sha256?: string | null;
  version?: number | null;
  signature_algorithm?: string | null;
  public_key_algorithm?: string | null;
  public_key_bits?: number | null;
  subject_cn?: string | null;
  subject_o?: string | null;
  key_usage?: string[] | null;
  extended_key_usage?: string[] | null;
  is_ca?: boolean | null;
  is_wildcard?: boolean | null;
  ocsp_urls?: string[] | null;
  crl_urls?: string[] | null;
  ca_issuer_urls?: string[] | null;
  sct_count?: number | null;
  tls_version?: string | null;
  cipher_suite?: string | null;
  chain_depth?: number | null;
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
  config_json: string;
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

export interface SystemConfigResponse {
  id: string;
  config_key: string;
  config_type: string;
  provider?: string | null;
  display_name: string;
  description?: string | null;
  config_json: unknown;
  enabled: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateSystemConfigRequest {
  config_key: string;
  config_type: string;
  provider?: string | null;
  display_name: string;
  description?: string | null;
  config_json: string;
}

export interface UpdateSystemConfigRequest {
  display_name?: string | null;
  description?: string | null;
  config_json?: string | null;
  enabled?: boolean | null;
}

export interface PartitionDetail {
  date: string;
  size_bytes: number;
}

export interface StorageInfo {
  partitions: PartitionDetail[];
  total_partitions: number;
  total_size_bytes: number;
}

export interface ChangePasswordRequest {
  current_password: string;
  new_password: string;
}

export interface CertificateChainInfo {
  id: string;
  domain: string;
  chain_valid: boolean;
  chain_error: string | null;
  last_checked: string;
}

export interface CertCheckResult {
  id: string;
  domain_id: string;
  domain: string;
  is_valid: boolean;
  chain_valid: boolean;
  not_before: string | null;
  not_after: string | null;
  days_until_expiry: number | null;
  issuer: string | null;
  subject: string | null;
  san_list: string[] | null;
  resolved_ips: string[] | null;
  error: string | null;
  checked_at: string;
  created_at: string;
  updated_at: string;
  certificate_id?: string | null;
}

export interface CertDomain {
  id: string;
  domain: string;
  port: number;
  enabled: boolean;
  check_interval_secs: number | null;
  note: string | null;
  last_checked_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateDomainRequest {
  domain: string;
  port?: number | null;
  check_interval_secs?: number | null;
  note?: string | null;
}

export interface UpdateDomainRequest {
  port?: number | null;
  enabled?: boolean | null;
  check_interval_secs?: number | null;
  note?: string | null;
}

export interface BatchCreateDomainsRequest {
  domains: CreateDomainRequest[];
}

export interface MetricDataPointResponse {
  id: string;
  agent_id: string;
  metric_name: string;
  value: number;
  labels: Record<string, string>;
  timestamp: string;
  created_at: string;
}

export interface MetricSummaryResponse {
  min: number;
  max: number;
  avg: number;
  count: number;
  agent_id?: string;
  metric_name?: string;
}

export interface CreateChannelRequest {
  name: string;
  channel_type: string;
  description?: string | null;
  min_severity?: string;
  config_json?: string;
  recipients?: string[];
}

export interface UpdateChannelConfigRequest {
  name?: string | null;
  description?: string | null;
  min_severity?: string | null;
  enabled?: boolean | null;
  config_json?: string | null;
  recipients?: string[] | null;
}

export interface NotificationLogItem {
  id: string;
  alert_event_id: string;
  rule_id: string;
  rule_name: string;
  agent_id: string;
  channel_id: string;
  channel_name: string;
  channel_type: string;
  status: string;
  error_message?: string | null;
  duration_ms: number;
  recipient_count: number;
  severity: string;
  created_at: string;
  retry_count: number;
  http_status_code?: number | null;
  response_body?: string | null;
  request_body?: string | null;
  recipient_details?: string | null;
  api_message_id?: string | null;
  api_error_code?: string | null;
}

export interface NotificationLogListResponse {
  items: NotificationLogItem[];
  total: number;
}

export interface NotificationLogSummaryResponse {
  total: number;
  success: number;
  failed: number;
}

export interface NotificationLogQueryParams extends PaginationParams {
  channel_id?: string;
  channel_type?: string;
  status?: string;
  alert_event_id?: string;
  rule_id?: string;
  agent_id?: string;
  start_time?: number;
  end_time?: number;
}

export interface NotificationLogSummaryQueryParams {
  channel_id?: string;
  channel_type?: string;
  start_time?: number;
  end_time?: number;
}

export interface SetRecipientsRequest {
  recipients: string[];
}

export interface SilenceWindow {
  id: string;
  start_time: string;
  end_time: string;
  recurrence?: string | null;
  created_at?: string;
  updated_at?: string;
  name?: string;
  agent_pattern?: string;
  metric_pattern?: string;
}

export interface CreateSilenceWindowRequest {
  start_time: string;
  end_time: string;
  recurrence?: string | null;
}

export interface UpdateSilenceWindowRequest {
  start_time?: string | null;
  end_time?: string | null;
  recurrence?: string | null;
}

export interface AlertSummary {
  total: number;
  active: number;
  by_severity: Record<string, number>;
}

export interface EnableRequest {
  enabled: boolean;
}

export interface DictionaryItem {
  id: string;
  dict_type: string;
  dict_key: string;
  dict_label: string;
  dict_value?: string | null;
  sort_order: number;
  enabled: boolean;
  is_system: boolean;
  description?: string | null;
  extra_json?: string | null;
  created_at: string;
  updated_at: string;
}

export interface DictionaryTypeSummary {
  dict_type: string;
  dict_type_label: string;
  count: number;
}

export interface CreateDictionaryTypeRequest {
  dict_type: string;
  dict_type_label: string;
  sort_order?: number | null;
  description?: string | null;
}

export interface UpdateDictionaryTypeRequest {
  dict_type_label?: string | null;
  sort_order?: number | null;
  description?: string | null;
}

export interface CreateDictionaryRequest {
  dict_type: string;
  dict_key: string;
  dict_label: string;
  dict_value?: string | null;
  sort_order?: number | null;
  enabled?: boolean | null;
  description?: string | null;
  extra_json?: string | null;
}

export interface UpdateDictionaryRequest {
  dict_label?: string | null;
  dict_value?: string | null;
  sort_order?: number | null;
  enabled?: boolean | null;
  description?: string | null;
  extra_json?: string | null;
}
