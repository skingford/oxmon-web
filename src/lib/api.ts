import NProgress from "nprogress";

if (typeof window !== "undefined") {
  NProgress.configure({ showSpinner: false, minimum: 0.1, speed: 300 });
}

let activeRequests = 0;

function startProgress() {
  if (typeof window === "undefined") return;
  if (activeRequests === 0) {
    NProgress.start();
  }
  activeRequests++;
}

function finishProgress() {
  if (typeof window === "undefined") return;
  activeRequests--;
  if (activeRequests <= 0) {
    activeRequests = 0;
    NProgress.done();
  }
}

import {
  AIAccountResponse,
  AIReportInstanceItem,
  AIReportInstanceQueryParams,
  AIReportListItem,
  AIReportQueryParams,
  AIReportRow,
  ActiveAlertQueryParams,
  AdminUserQueryParams,
  AdminUserResponse,
  AuditSecuritySummary,
  AuditSecurityTimeseries,
  AuditLogItem,
  AuditLogQueryParams,
  AlertEventResponse,
  AlertRuleQueryParams,
  AlertRuleDetailResponse,
  AlertRuleResponse,
  AlertSummary,
  ApiError,
  CertStatusQueryParams,
  CertificateDetails,
  ChannelOverview,
  DictionaryByTypeQueryParams,
  DictionaryTypeQueryParams,
  BatchCreateCloudAccountsRequest,
  BatchCreateCloudAccountsResponse,
  CloudAccountQueryParams,
  CloudAICheckJobQueryParams,
  CloudAICheckJobResponse,
  CloudAccountResponse,
  CloudInstanceMetricsQueryParams,
  CloudInstanceMetricsResponse,
  CloudInstanceQueryParams,
  CloudInstanceDetailResponse,
  CloudInstanceResponse,
  CloudInstancesChartQueryParams,
  CloudInstancesChartResponse,
  CreateCloudAccountRequest,
  CreateAIAccountRequest,
  NotificationLogItem,
  NotificationLogListResponse,
  NotificationLogSummaryResponse,
  NotificationLogQueryParams,
  NotificationLogSummaryQueryParams,
  CreateAdminUserRequest,
  EmptySuccessResponse,
  LoginThrottleListResponse,
  LoginThrottleItem,
  LoginThrottleQueryParams,
  ResetAdminPasswordRequest,
  UnlockLoginThrottleRequest,
  UpdateAdminUserRequest,
  CreateAlertRuleRequest,
  UpdateAlertRuleRequest,
  DashboardOverview,
  LoginRequest,
  LoginResponse,
  PublicKeyResponse,
  HealthResponse,
  ListResponse,
  PaginationParams,
  RuntimeConfig,
  SystemConfigResponse,
  TestConnectionResponse,
  CreateSystemConfigRequest,
  TriggerCollectionResponse,
  TriggerAIReportResponse,
  TriggerCloudAICheckRequest,
  TriggerCloudAICheckResponse,
  TriggerSingleInstanceAICheckResponse,
  UpdateAIAccountRequest,
  UpdateCloudAccountRequest,
  UpdateSystemConfigRequest,
  StorageInfo,
  ChangePasswordRequest,
  CertificateChainInfo,
  CertCheckResult,
  CertSummary,
  CertStatusSummary,
  CertDomainsBackfillResponse,
  CertDomainsSummary,
  CertDomain,
  CreateDomainRequest,
  UpdateDomainRequest,
  BatchCreateDomainsRequest,
  MetricCatalogQueryParams,
  MetricDataPointResponse,
  MetricSourceItemResponse,
  MetricSourceQueryParams,
  MetricSummaryResponse,
  CreateChannelRequest,
  NotificationChannelQueryParams,
  SystemConfigQueryParams,
  UpdateChannelConfigRequest,
  SetRecipientsRequest,
  SilenceWindow,
  SilenceWindowQueryParams,
  CreateSilenceWindowRequest,
  UpdateSilenceWindowRequest,
  EnableRequest,
  IdResponse,
  DictionaryItem,
  DictionaryTypeSummary,
  CreateDictionaryRequest,
  UpdateDictionaryRequest,
  CreateDictionaryTypeRequest,
  UpdateDictionaryTypeRequest,
} from "@/types/api";
import {
  clearAuthToken,
  getAuthToken,
  normalizeAuthToken,
} from "@/lib/auth-token";
import { clearGlobalConfigCache } from "@/lib/global-config-cache";
import {
  resolveAppLocale,
  stripLocalePrefix,
  withLocalePrefix,
} from "@/components/app-locale";
import { createAgentApiModule } from "@/lib/api/modules/agent";
import {
  extractListItemsPayload as extractListItemsPayloadBase,
  normalizeListPayload as normalizeListPayloadBase,
  type NormalizedListPayload,
  toListResponse as toListResponseBase,
} from "@/lib/api/list-response";

function normalizeBaseUrl(value: string | undefined) {
  if (!value) {
    return "";
  }
  return value.trim().replace(/\/+$/, "");
}

const BASE_URL = normalizeBaseUrl(process.env.NEXT_PUBLIC_API_BASE_URL);
const OX_APP_ID = process.env.NEXT_PUBLIC_OX_APP_ID?.trim() || "";
const inFlightGetRequests = new Map<string, Promise<unknown>>();

type HttpMethod = "GET" | "POST" | "PUT" | "DELETE";

interface RequestConfig {
  method?: HttpMethod;
  body?: unknown;
  token?: string;
  requiresAuth?: boolean;
  allowEmptyResponse?: boolean;
  responseType?: "json" | "text";
}

type PaginationFetchConfig = {
  limit?: number;
  offset?: number;
};

export class ApiRequestError extends Error {
  status: number;
  errCode?: number;
  traceId?: string;

  constructor(
    message: string,
    options?: { status?: number; errCode?: number; traceId?: string },
  ) {
    super(message);
    this.name = "ApiRequestError";
    this.status = options?.status ?? 0;
    this.errCode = options?.errCode;
    this.traceId = options?.traceId;
  }
}

function buildQueryString(
  params:
    | Record<string, unknown>
    | PaginationParams
    | NotificationLogSummaryQueryParams
    | CloudInstancesChartQueryParams
    | CloudInstanceMetricsQueryParams,
) {
  const query = new URLSearchParams();
  const paramsRecord = params as Record<string, unknown>;

  Object.entries(paramsRecord).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      query.append(key, String(value));
    }
  });

  const queryString = query.toString();
  return queryString ? `?${queryString}` : "";
}

function getApiErrorMessage(error: unknown, fallback: string) {
  if (error instanceof ApiRequestError) {
    return error.message;
  }
  if (error instanceof Error && error.message) {
    return error.message;
  }
  return fallback;
}

function getRequiredAppId() {
  if (!OX_APP_ID) {
    throw new ApiRequestError(
      "缺少 NEXT_PUBLIC_OX_APP_ID 配置，无法发起 API 请求",
    );
  }
  return OX_APP_ID;
}

async function requestAllPages<T>(
  fetchPage: (params: Required<PaginationFetchConfig>) => Promise<unknown>,
  options: PaginationFetchConfig = {},
) {
  const limit = Math.max(1, options.limit ?? 200);
  let offset = Math.max(0, options.offset ?? 0);
  const merged: T[] = [];

  while (true) {
    const pagePayload = await fetchPage({ limit, offset });
    const page = normalizeListPayload<T>(pagePayload).items
    merged.push(...page);

    if (page.length < limit) {
      break;
    }
    offset += limit;
  }

  return merged;
}

function hasExplicitPaginationParams(params?: PaginationParams) {
  return params?.limit !== undefined || params?.offset !== undefined;
}

function toPageFetchConfig(
  params?: PaginationParams,
  defaultLimit = 200,
): Required<PaginationFetchConfig> {
  return {
    limit: Math.max(1, params?.limit ?? defaultLimit),
    offset: Math.max(0, params?.offset ?? 0),
  };
}

function createInvalidListResponseError(error: unknown) {
  return new ApiRequestError(
    error instanceof Error && error.message
      ? error.message
      : "Invalid API list response format",
  )
}

function extractArrayPayload<T>(payload: unknown): T[] {
  return extractListItemsPayload<T>(payload)
}

function normalizeListPayload<T>(payload: unknown): NormalizedListPayload<T> {
  try {
    return normalizeListPayloadBase<T>(payload)
  } catch (error) {
    throw createInvalidListResponseError(error)
  }
}

function extractListItemsPayload<T>(payload: unknown): T[] {
  try {
    return extractListItemsPayloadBase<T>(payload)
  } catch (error) {
    throw createInvalidListResponseError(error)
  }
}

function toListResponse<T>(
  payloadOrItems: unknown,
  options: { fallbackLimit?: number; fallbackOffset?: number } = {},
): ListResponse<T> {
  try {
    return toListResponseBase<T>(payloadOrItems, options)
  } catch (error) {
    throw createInvalidListResponseError(error)
  }
}

type ApiResponseEnvelopeLike = {
  err_code?: number;
  err_msg?: string;
  trace_id?: string;
  data: unknown;
};

function getEnvelopePayload(payload: unknown): ApiResponseEnvelopeLike | null {
  if (!payload || typeof payload !== "object") {
    return null;
  }

  const record = payload as Record<string, unknown>;
  if (!("data" in record)) {
    return null;
  }

  const hasEnvelopeMetadata =
    "err_code" in record || "err_msg" in record || "trace_id" in record;

  if (!hasEnvelopeMetadata) {
    return null;
  }

  return record as ApiResponseEnvelopeLike;
}

function parseStrictAuditLogListResponse(
  payload: unknown,
  options: { fallbackLimit?: number; fallbackOffset?: number } = {},
): ListResponse<AuditLogItem> {
  const record =
    payload && typeof payload === "object"
      ? (payload as Record<string, unknown>)
      : null;

  if (!record || !Array.isArray(record.items)) {
    throw new ApiRequestError("Invalid audit logs list response format");
  }

  if (typeof record.total !== "number") {
    throw new ApiRequestError("Invalid audit logs total in response");
  }

  return {
    items: record.items as AuditLogItem[],
    total: record.total,
    limit: typeof record.limit === "number" ? record.limit : options.fallbackLimit ?? 0,
    offset:
      typeof record.offset === "number"
        ? record.offset
        : options.fallbackOffset ?? 0,
  };
}

async function request<T>(
  endpoint: string,
  config: RequestConfig = {},
): Promise<T> {
  const {
    method = "GET",
    body,
    token,
    requiresAuth = true,
    allowEmptyResponse = false,
    responseType = "json",
  } = config;
  const headers: Record<string, string> = {};
  headers["ox-app-id"] = getRequiredAppId();

  if (body !== undefined) {
    headers["Content-Type"] = "application/json";
  }

  const authToken = normalizeAuthToken(token) || getAuthToken();

  if (requiresAuth && authToken) {
    headers.Authorization = `Bearer ${authToken}`;
  }

  const dedupeKey =
    method === "GET"
      ? JSON.stringify({
          method,
          endpoint,
          authToken: authToken || "",
          requiresAuth,
          allowEmptyResponse,
          responseType,
        })
      : "";

  const executeRequest = async () => {
    const response = await fetch(`${BASE_URL}${endpoint}`, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });

    if (response.status === 401 && requiresAuth) {
      if (typeof window !== "undefined") {
        clearAuthToken();
        clearGlobalConfigCache();
        const currentPathname = window.location.pathname;
        const locale = resolveAppLocale(currentPathname);
        const loginPath = withLocalePrefix("/login", locale);

        if (stripLocalePrefix(currentPathname) !== "/login") {
          window.location.replace(loginPath);
        }
      }
      throw new ApiRequestError("认证已过期，请重新登录", { status: 401 });
    }

    if (response.status === 204) {
      return (responseType === "text" ? "" : {}) as T;
    }

    let payload: unknown = null;
    let responseText = "";

    try {
      responseText = await response.text();
    } catch {
      responseText = "";
    }

    if (responseText) {
      try {
        payload = JSON.parse(responseText);
      } catch {
        payload = null;
      }
    }

    if (!response.ok) {
      if (payload && typeof payload === "object") {
        const err = payload as ApiError;
        throw new ApiRequestError(
          err.err_msg || (err as any).message || `Request failed: ${response.status} ${response.statusText}`,
          {
            status: response.status,
            errCode: err.err_code,
            traceId: err.trace_id,
          },
        );
      }

      const plainTextErrorMessage = responseText.trim();
      if (plainTextErrorMessage) {
        throw new ApiRequestError(plainTextErrorMessage, {
          status: response.status,
        });
      }

      throw new ApiRequestError(
        `Request failed: ${response.status} ${response.statusText}`,
        {
          status: response.status,
        },
      );
    }

    if (responseType === "text") {
      return responseText as T;
    }

    if (payload === null) {
      if (allowEmptyResponse) {
        return {} as T;
      }
      throw new ApiRequestError("Invalid API response format", {
        status: response.status,
      });
    }

    const envelope = getEnvelopePayload(payload);
    if (envelope) {
      if (
        typeof envelope.err_code === "number" &&
        envelope.err_code !== 0
      ) {
        throw new ApiRequestError(envelope.err_msg || "API 请求失败", {
          status: response.status,
          errCode: envelope.err_code,
          traceId: envelope.trace_id,
        });
      }

      return envelope.data as T;
    }

    return payload as T;
  };

  startProgress();

  if (!dedupeKey) {
    return executeRequest().finally(finishProgress);
  }

  const existingPromise = inFlightGetRequests.get(dedupeKey);
  if (existingPromise) {
    return (existingPromise as Promise<T>).finally(finishProgress);
  }

  const requestPromise = executeRequest().finally(() => {
    inFlightGetRequests.delete(dedupeKey);
  }) as Promise<unknown>;

  inFlightGetRequests.set(dedupeKey, requestPromise);
  return (requestPromise as Promise<T>).finally(finishProgress);
}

function requestListItems<T>(
  endpoint: string,
  config: RequestConfig = {},
): Promise<T[]> {
  return request<unknown>(endpoint, config).then((payload) =>
    extractListItemsPayload<T>(payload),
  )
}

function requestListResponse<T>(
  endpoint: string,
  options: { fallbackLimit?: number; fallbackOffset?: number } = {},
  config: RequestConfig = {},
): Promise<ListResponse<T>> {
  return request<unknown>(endpoint, config).then((payload) =>
    toListResponse<T>(payload, options),
  )
}

const agentApi = createAgentApiModule({
  request,
  buildQueryString,
});

export const api = {
  getAuthPublicKey: () =>
    request<PublicKeyResponse>("/v1/auth/public-key", {
      requiresAuth: false,
    }),

  login: (credentials: LoginRequest) =>
    request<LoginResponse>("/v1/auth/login", {
      method: "POST",
      body: credentials,
      requiresAuth: false,
    }),

  ...agentApi,

  getActiveAlerts: (params: ActiveAlertQueryParams = {}) =>
    requestListResponse<AlertEventResponse>(
      `/v1/alerts/active${buildQueryString(params)}`,
      {
        fallbackLimit: params.limit ?? 0,
        fallbackOffset: params.offset ?? 0,
      },
    ),

  getAlertHistory: (
    params: PaginationParams & {
      agent_id__eq?: string;
      severity__eq?: string;
      timestamp__gte?: string;
      timestamp__lte?: string;
    } = {},
  ) =>
    requestListResponse<AlertEventResponse>(
      `/v1/alerts/history${buildQueryString(params)}`,
      {
        fallbackLimit: params.limit ?? 0,
        fallbackOffset: params.offset ?? 0,
      },
    ),

  getAlertHistoryById: (id: string) =>
    request<AlertEventResponse>(`/v1/alerts/history/${id}`),

  acknowledgeAlert: (id: string, token?: string) =>
    request<IdResponse>(`/v1/alerts/history/${id}/acknowledge`, {
      method: "POST",
      token,
    }),

  resolveAlert: (id: string, token?: string) =>
    request<IdResponse>(`/v1/alerts/history/${id}/resolve`, {
      method: "POST",
      token,
    }),

  getAlertRules: (params?: AlertRuleQueryParams) => {
    if (hasExplicitPaginationParams(params)) {
      return requestListItems<AlertRuleResponse>(
        `/v1/alerts/rules${buildQueryString(params || {})}`,
      )
    }

    const queryParams = {
      name__contains: params?.name__contains,
      rule_type__eq: params?.rule_type__eq,
      metric__contains: params?.metric__contains,
      severity__eq: params?.severity__eq,
      enabled__eq: params?.enabled__eq,
    }

    return requestAllPages<AlertRuleResponse>((page) =>
      requestListItems<AlertRuleResponse>(
        `/v1/alerts/rules${buildQueryString({ ...queryParams, ...page })}`,
      ),
    )
  },

  createAlertRule: (data: CreateAlertRuleRequest) =>
    request<IdResponse>("/v1/alerts/rules", { method: "POST", body: data }),

  getDashboardOverview: () =>
    request<DashboardOverview>("/v1/dashboard/overview"),

  getCertificates: (
    params: PaginationParams & {
      domain__contains?: string;
      not_after__gte?: number;
      not_after__lte?: number;
      ip_address__contains?: string;
      issuer__contains?: string;
      is_valid__eq?: boolean;
    } = {},
  ) =>
    requestListResponse<CertificateDetails>(
      `/v1/certificates${buildQueryString(params)}`,
      {
        fallbackLimit: params.limit ?? 0,
        fallbackOffset: params.offset ?? 0,
      },
    ),

  getCertificate: (id: string) =>
    request<CertificateDetails>(`/v1/certificates/${id}`),

  listChannels: (params?: NotificationChannelQueryParams) => {
    if (hasExplicitPaginationParams(params)) {
      return requestListItems<ChannelOverview>(
        `/v1/notifications/channels${buildQueryString(params || {})}`,
      )
    }

    const queryParams = {
      name__contains: params?.name__contains,
      channel_type__eq: params?.channel_type__eq,
      enabled__eq: params?.enabled__eq,
      min_severity__eq: params?.min_severity__eq,
    }

    return requestAllPages<ChannelOverview>((page) =>
      requestListItems<ChannelOverview>(
        `/v1/notifications/channels${buildQueryString({ ...queryParams, ...page })}`,
      ),
    )
  },

  listChannelsPage: (params: NotificationChannelQueryParams = {}) =>
    requestListResponse<ChannelOverview>(
      `/v1/notifications/channels${buildQueryString(params)}`,
      {
        fallbackLimit: params.limit ?? 0,
        fallbackOffset: params.offset ?? 0,
      },
    ),

  getChannelById: (id: string) =>
    request<ChannelOverview>(`/v1/notifications/channels/${id}`),

  listCloudAccounts: (params?: CloudAccountQueryParams) => {
    if (hasExplicitPaginationParams(params)) {
      return requestListItems<CloudAccountResponse>(
        `/v1/cloud/accounts${buildQueryString(params || {})}`,
      )
    }

    const queryParams = {
      provider: params?.provider,
      enabled: params?.enabled,
    }

    return requestAllPages<CloudAccountResponse>((page) =>
      requestListItems<CloudAccountResponse>(
        `/v1/cloud/accounts${buildQueryString({ ...queryParams, ...page })}`,
      ),
    )
  },

  getCloudAccountById: (id: string) =>
    request<CloudAccountResponse>(`/v1/cloud/accounts/${id}`),

  createCloudAccount: (data: CreateCloudAccountRequest) =>
    request<CloudAccountResponse>("/v1/cloud/accounts", {
      method: "POST",
      body: data,
    }),

  batchCreateCloudAccounts: (data: BatchCreateCloudAccountsRequest) =>
    request<BatchCreateCloudAccountsResponse>("/v1/cloud/accounts/batch", {
      method: "POST",
      body: data,
    }),

  updateCloudAccount: (id: string, data: UpdateCloudAccountRequest) =>
    request<CloudAccountResponse>(`/v1/cloud/accounts/${id}`, {
      method: "PUT",
      body: data,
    }),

  deleteCloudAccount: (id: string) =>
    request<IdResponse>(`/v1/cloud/accounts/${id}`, {
      method: "DELETE",
      allowEmptyResponse: true,
    }),

  testCloudAccountConnection: (id: string) =>
    request<TestConnectionResponse>(`/v1/cloud/accounts/${id}/test`, {
      method: "POST",
    }),

  triggerCloudAccountCollection: (id: string) =>
    request<TriggerCollectionResponse>(`/v1/cloud/accounts/${id}/collect`, {
      method: "POST",
    }),

  listCloudInstances: (params?: CloudInstanceQueryParams) => {
    if (hasExplicitPaginationParams(params)) {
      return requestListItems<CloudInstanceResponse>(
        `/v1/cloud/instances${buildQueryString(params || {})}`,
      )
    }

    const queryParams = {
      provider: params?.provider,
      region: params?.region,
      status: params?.status,
      search: params?.search,
    }

    return requestAllPages<CloudInstanceResponse>((page) =>
      requestListItems<CloudInstanceResponse>(
        `/v1/cloud/instances${buildQueryString({ ...queryParams, ...page })}`,
      ),
    )
  },

  listCloudInstancesPage: (params: CloudInstanceQueryParams = {}) =>
    requestListResponse<CloudInstanceResponse>(
      `/v1/cloud/instances${buildQueryString(params)}`,
      {
        fallbackLimit: params.limit ?? 0,
        fallbackOffset: params.offset ?? 0,
      },
    ),

  getCloudInstanceDetail: (id: string) =>
    request<CloudInstanceDetailResponse>(`/v1/cloud/instances/${id}`),

  getCloudInstancesChart: (params?: CloudInstancesChartQueryParams) =>
    request<CloudInstancesChartResponse>(
      `/v1/cloud/instances/chart${buildQueryString(params || {})}`,
    ),

  getCloudInstanceMetrics: (
    id: string,
    params?: CloudInstanceMetricsQueryParams,
  ) =>
    request<CloudInstanceMetricsResponse>(
      `/v1/cloud/instances/${id}/metrics${buildQueryString(params || {})}`,
    ),

  triggerAllCloudInstancesAICheck: (data: TriggerCloudAICheckRequest = {}) =>
    request<TriggerCloudAICheckResponse>("/v1/cloud/instances/ai-check", {
      method: "POST",
      body: data,
    }),

  triggerCloudInstanceAICheck: (
    id: string,
    data: TriggerCloudAICheckRequest = {},
  ) =>
    request<TriggerSingleInstanceAICheckResponse>(`/v1/cloud/instances/${id}/ai-check`, {
      method: "POST",
      body: data,
    }),

  listCloudAICheckJobsPage: (params: CloudAICheckJobQueryParams = {}) =>
    requestListResponse<CloudAICheckJobResponse>(
      `/v1/cloud/instances/ai-check/jobs${buildQueryString(params)}`,
      {
        fallbackLimit: params.limit ?? 0,
        fallbackOffset: params.offset ?? 0,
      },
    ),

  listCloudAICheckJobs: (
    params: CloudAICheckJobQueryParams = {},
  ) => {
    if (hasExplicitPaginationParams(params)) {
      return requestListItems<CloudAICheckJobResponse>(
        `/v1/cloud/instances/ai-check/jobs${buildQueryString(params)}`,
      )
    }

    const queryParams = {
      status: params?.status,
      job_type: params?.job_type,
    }

    return requestAllPages<CloudAICheckJobResponse>((page) =>
      requestListItems<CloudAICheckJobResponse>(
        `/v1/cloud/instances/ai-check/jobs${buildQueryString({ ...queryParams, ...page })}`,
      )
    )
  },

  getCloudAICheckJob: (id: string) =>
    request<CloudAICheckJobResponse>(`/v1/cloud/instances/ai-check/jobs/${id}`),

  listAIAccounts: (
    params: PaginationParams & {
      provider?: string;
      enabled?: boolean;
    } = {},
  ) => {
    if (hasExplicitPaginationParams(params)) {
      return requestListItems<AIAccountResponse>(
        `/v1/ai/accounts${buildQueryString(params || {})}`,
      )
    }

    const queryParams = {
      provider: params?.provider,
      enabled: params?.enabled,
    }

    return requestAllPages<AIAccountResponse>((page) =>
      requestListItems<AIAccountResponse>(
        `/v1/ai/accounts${buildQueryString({ ...queryParams, ...page })}`,
      ),
    )
  },

  getAIAccountById: (id: string) =>
    request<AIAccountResponse>(`/v1/ai/accounts/${id}`),

  createAIAccount: (data: CreateAIAccountRequest) =>
    request<AIAccountResponse>("/v1/ai/accounts", {
      method: "POST",
      body: data,
    }),

  updateAIAccount: (id: string, data: UpdateAIAccountRequest) =>
    request<AIAccountResponse>(`/v1/ai/accounts/${id}`, {
      method: "PUT",
      body: data,
    }),

  deleteAIAccount: (id: string) =>
    request<EmptySuccessResponse>(`/v1/ai/accounts/${id}`, {
      method: "DELETE",
      allowEmptyResponse: true,
    }),

  listAIReportsPage: (params: AIReportQueryParams = {}) =>
    requestListResponse<AIReportListItem>(
      `/v1/ai/reports${buildQueryString(params)}`,
      {
        fallbackLimit: params.limit ?? 0,
        fallbackOffset: params.offset ?? 0,
      },
    ),

  listAIReports: (params: AIReportQueryParams = {}) => {
    if (hasExplicitPaginationParams(params)) {
      return requestListItems<AIReportListItem>(
        `/v1/ai/reports${buildQueryString(params)}`,
      )
    }

    const queryParams = {
      report_date: params?.report_date,
      risk_level: params?.risk_level,
    }

    return requestAllPages<AIReportListItem>((page) =>
      requestListItems<AIReportListItem>(
        `/v1/ai/reports${buildQueryString({ ...queryParams, ...page })}`,
      ),
    )
  },

  triggerAIReport: (id: string) =>
    request<TriggerAIReportResponse>(`/v1/ai/accounts/${id}/trigger`, {
      method: "POST",
    }),

  getAIReportById: (id: string, excludeContent?: boolean) =>
    request<AIReportRow>(
      `/v1/ai/reports/${id}${buildQueryString(
        excludeContent === undefined ? {} : { exclude_content: excludeContent },
      )}`,
    ),

  listAIReportInstancesPage: (
    id: string,
    params: AIReportInstanceQueryParams = {},
  ) =>
    requestListResponse<AIReportInstanceItem>(
      `/v1/ai/reports/${id}/instances${buildQueryString(params)}`,
      {
        fallbackLimit: params.limit ?? 0,
        fallbackOffset: params.offset ?? 0,
      },
    ),

  listAIReportInstances: (
    id: string,
    params: AIReportInstanceQueryParams = {},
  ) => {
    if (hasExplicitPaginationParams(params)) {
      return requestListItems<AIReportInstanceItem>(
        `/v1/ai/reports/${id}/instances${buildQueryString(params)}`,
      )
    }

    const queryParams = {
      risk_level: params.risk_level,
    }

    return requestAllPages<AIReportInstanceItem>((page) =>
      requestListItems<AIReportInstanceItem>(
        `/v1/ai/reports/${id}/instances${buildQueryString({ ...queryParams, ...page })}`,
      ),
    )
  },

  getAIReportView: (id: string) =>
    request<string>(`/v1/ai/reports/${id}/view`, {
      responseType: "text",
    }),

  getSystemConfig: () => request<RuntimeConfig>("/v1/system/config"),

  getStorageInfo: () => request<StorageInfo>("/v1/system/storage"),

  triggerCleanup: () =>
    request<EmptySuccessResponse>("/v1/system/storage/cleanup", {
      method: "POST",
      allowEmptyResponse: true,
    }),

  backfillCertDomains: (params: { dry_run?: boolean; preview_limit?: number } = {}) =>
    request<CertDomainsBackfillResponse>(
      `/v1/system/certs/backfill-domains${buildQueryString(params)}`,
    ),

  listSystemConfigs: (params?: SystemConfigQueryParams) => {
    if (hasExplicitPaginationParams(params)) {
      return requestListItems<SystemConfigResponse>(
        `/v1/system/configs${buildQueryString(params || {})}`,
      )
    }

    const queryParams = {
      config_type: params?.config_type,
      config_key: params?.config_key,
      enabled: params?.enabled,
    }

    return requestAllPages<SystemConfigResponse>((page) =>
      requestListItems<SystemConfigResponse>(
        `/v1/system/configs${buildQueryString({ ...queryParams, ...page })}`,
      ),
    )
  },

  getSystemConfigById: (id: string) =>
    request<SystemConfigResponse>(`/v1/system/configs/${id}`),

  createSystemConfig: (data: CreateSystemConfigRequest) =>
    request<IdResponse>("/v1/system/configs", { method: "POST", body: data }),

  updateSystemConfig: (id: string, data: UpdateSystemConfigRequest) =>
    request<IdResponse>(`/v1/system/configs/${id}`, {
      method: "PUT",
      body: data,
    }),

  deleteSystemConfig: (id: string) =>
    request<IdResponse>(`/v1/system/configs/${id}`, { method: "DELETE" }),

  listAdminUsersPage: (params: AdminUserQueryParams = {}) =>
    requestListResponse<AdminUserResponse>(
      `/v1/admin/users${buildQueryString(params)}`,
      {
        fallbackLimit: params.limit ?? 0,
        fallbackOffset: params.offset ?? 0,
      },
    ),

  listAdminUsers: (params?: AdminUserQueryParams) => {
    if (hasExplicitPaginationParams(params)) {
      return requestListItems<AdminUserResponse>(
        `/v1/admin/users${buildQueryString(params || {})}`,
      )
    }

    const queryParams = {
      username__contains: params?.username__contains,
    }

    return requestAllPages<AdminUserResponse>((page) =>
      requestListItems<AdminUserResponse>(
        `/v1/admin/users${buildQueryString({ ...queryParams, ...page })}`,
      ),
    )
  },

  getAdminUserById: (id: string) =>
    request<AdminUserResponse>(`/v1/admin/users/${id}`),

  createAdminUser: (data: CreateAdminUserRequest) =>
    request<EmptySuccessResponse>("/v1/admin/users", {
      method: "POST",
      body: data,
    }),

  updateAdminUser: (id: string, data: UpdateAdminUserRequest) =>
    request<AdminUserResponse>(`/v1/admin/users/${id}`, {
      method: "PUT",
      body: data,
    }),

  deleteAdminUser: (id: string) =>
    request<EmptySuccessResponse>(`/v1/admin/users/${id}`, {
      method: "DELETE",
      allowEmptyResponse: true,
    }),

  resetAdminUserPassword: (id: string, data: ResetAdminPasswordRequest) =>
    request<EmptySuccessResponse>(`/v1/admin/users/${id}/password`, {
      method: "POST",
      body: data,
      allowEmptyResponse: true,
    }),

  listLoginThrottles: (params: LoginThrottleQueryParams = {}) =>
    request<unknown>(
      `/v1/admin/users/login-throttles${buildQueryString(params)}`,
    ).then((payload) =>
      toListResponse<LoginThrottleItem>(payload, {
        fallbackLimit: params.limit ?? 0,
        fallbackOffset: params.offset ?? 0,
      }),
    ),

  unlockLoginThrottle: (data: UnlockLoginThrottleRequest) =>
    request<EmptySuccessResponse>("/v1/admin/users/unlock-login-throttle", {
      method: "POST",
      body: data,
    }),

  listAuditLogsPage: (params: AuditLogQueryParams = {}) =>
    request<unknown>(`/v1/audit/logs${buildQueryString(params)}`).then(
      (payload) =>
        parseStrictAuditLogListResponse(payload, {
          fallbackLimit: params.limit ?? 0,
          fallbackOffset: params.offset ?? 0,
        }),
    ),

  getAuditLogById: (id: string) => request<AuditLogItem>(`/v1/audit/logs/${id}`),

  getAuditSecuritySummary: (params: { hours?: number } = {}) =>
    request<AuditSecuritySummary>(
      `/v1/audit/logs/security-summary${buildQueryString(params)}`,
    ),

  getAuditSecurityTimeseries: (params: { hours?: number } = {}) =>
    request<AuditSecurityTimeseries>(
      `/v1/audit/logs/security-summary/timeseries${buildQueryString(params)}`,
    ),

  listDictionaryTypes: (params?: DictionaryTypeQueryParams) => {
    if (hasExplicitPaginationParams(params)) {
      return requestListItems<DictionaryTypeSummary>(
        `/v1/dictionaries/types${buildQueryString(params || {})}`,
      )
    }

    const queryParams = {
      dict_type__contains: params?.dict_type__contains,
    }

    return requestAllPages<DictionaryTypeSummary>((page) =>
      requestListItems<DictionaryTypeSummary>(
        `/v1/dictionaries/types${buildQueryString({ ...queryParams, ...page })}`,
      ),
    )
  },

  createDictionaryType: (data: CreateDictionaryTypeRequest) =>
    request<IdResponse>("/v1/dictionaries/types", {
      method: "POST",
      body: data,
    }),

  updateDictionaryType: (dictType: string, data: UpdateDictionaryTypeRequest) =>
    request<IdResponse>(
      `/v1/dictionaries/types/${encodeURIComponent(dictType)}`,
      { method: "PUT", body: data },
    ),

  deleteDictionaryType: (dictType: string) =>
    request<IdResponse>(
      `/v1/dictionaries/types/${encodeURIComponent(dictType)}`,
      { method: "DELETE" },
    ),

  listDictionariesByType: async (
    dictType: string,
    enabledOnly = false,
    params?: PaginationParams,
    filters?: Omit<
      DictionaryByTypeQueryParams,
      "limit" | "offset" | "enabled_only"
    >,
  ) => {
    const normalizedDictTypes = dictType
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean)
      .join(",");
    if (!normalizedDictTypes) {
      return [];
    }

    const requestDictionaryPage = (page: Required<PaginationFetchConfig>) =>
      requestListItems<DictionaryItem>(
        `/v1/dictionaries/types/all${buildQueryString({
          dict_type__in: normalizedDictTypes,
          enabled_only: enabledOnly,
          key__contains: filters?.key__contains,
          label__contains: filters?.label__contains,
          ...page,
        })}`,
      )

    if (params) {
      return requestDictionaryPage({
        limit: Math.max(1, params.limit ?? 200),
        offset: Math.max(0, params.offset ?? 0),
      });
    }

    return requestAllPages<DictionaryItem>(requestDictionaryPage);
  },

  createDictionary: (data: CreateDictionaryRequest) =>
    request<IdResponse>("/v1/dictionaries", { method: "POST", body: data }),

  getDictionary: (id: string) =>
    request<DictionaryItem>(`/v1/dictionaries/${id}`),

  updateDictionary: (id: string, data: UpdateDictionaryRequest) =>
    request<IdResponse>(`/v1/dictionaries/${id}`, {
      method: "PUT",
      body: data,
    }),

  deleteDictionary: (id: string) =>
    request<IdResponse>(`/v1/dictionaries/${id}`, { method: "DELETE" }),

  logout: () =>
    request<EmptySuccessResponse>("/v1/auth/logout", {
      method: "POST",
      allowEmptyResponse: true,
    }),

  changePassword: (data: ChangePasswordRequest) =>
    request<EmptySuccessResponse>("/v1/auth/password", {
      method: "POST",
      body: data,
      allowEmptyResponse: true,
    }),

  getCertificateChain: (id: string) =>
    request<CertificateChainInfo>(`/v1/certificates/${id}/chain`),

  checkAllDomains: () =>
    requestListItems<CertCheckResult>("/v1/certs/check", { method: "POST" }),

  listDomains: (
    params: PaginationParams & {
      enabled__eq?: boolean;
      domain__contains?: string;
    } = {},
  ) =>
    requestListResponse<CertDomain>(
      `/v1/certs/domains${buildQueryString(params)}`,
      {
        fallbackLimit: params.limit ?? 0,
        fallbackOffset: params.offset ?? 0,
      },
    ),

  getCertDomainsSummary: () =>
    request<CertDomainsSummary>("/v1/certs/domains/summary"),

  createDomain: (data: CreateDomainRequest) =>
    request<IdResponse>("/v1/certs/domains", { method: "POST", body: data }),

  createDomainsBatch: (data: BatchCreateDomainsRequest) =>
    requestListItems<IdResponse>("/v1/certs/domains/batch", {
      method: "POST",
      body: data,
    }),

  getDomain: (id: string) => request<CertDomain>(`/v1/certs/domains/${id}`),

  updateDomain: (id: string, data: UpdateDomainRequest) =>
    request<IdResponse>(`/v1/certs/domains/${id}`, {
      method: "PUT",
      body: data,
    }),

  deleteDomain: (id: string) =>
    request<IdResponse>(`/v1/certs/domains/${id}`, { method: "DELETE" }),

  checkSingleDomain: (id: string) =>
    request<CertCheckResult>(`/v1/certs/domains/${id}/check`, {
      method: "POST",
    }),

  getCertCheckHistory: (id: string, params: PaginationParams = {}) =>
    requestListItems<CertCheckResult>(
      `/v1/certs/domains/${id}/history${buildQueryString(params)}`,
    ),

  getCertStatusAll: (params: CertStatusQueryParams = {}) =>
    requestListResponse<CertCheckResult>(
      `/v1/certs/status${buildQueryString(params)}`,
      {
        fallbackLimit: params.limit ?? 0,
        fallbackOffset: params.offset ?? 0,
      },
    ),

  getCertStatusSummary: (
    params: Omit<CertStatusQueryParams, "limit" | "offset"> = {},
  ) =>
    request<CertStatusSummary>(
      `/v1/certs/status/summary${buildQueryString(params)}`,
    ),

  getCertStatusByDomain: (domain: string) =>
    request<CertCheckResult>(`/v1/certs/status/${encodeURIComponent(domain)}`),

  getCertSummary: () => request<CertSummary>("/v1/certs/summary"),

  testCertReport: () =>
    request<EmptySuccessResponse>("/v1/notifications/test-cert-report", {
      method: "POST",
      allowEmptyResponse: true,
    }),

  queryAllMetrics: (
    params: PaginationParams & {
      agent_id__eq?: string;
      metric_name__eq?: string;
      timestamp__gte?: string;
      timestamp__lte?: string;
    } = {},
  ) =>
    requestListItems<MetricDataPointResponse>(`/v1/metrics${buildQueryString(params)}`),

  getMetricAgents: (params?: MetricCatalogQueryParams) => {
    const requestMetricAgentPage = (page: Required<PaginationFetchConfig>) =>
      requestListItems<string>(
        `/v1/metrics/agents${buildQueryString({
          timestamp__gte: params?.timestamp__gte,
          timestamp__lte: params?.timestamp__lte,
          ...page,
        })}`,
      )

    if (hasExplicitPaginationParams(params)) {
      return requestMetricAgentPage(toPageFetchConfig(params));
    }

    return requestAllPages<string>(requestMetricAgentPage).then((items) =>
      Array.from(new Set(items)),
    );
  },

  getMetricSources: (params?: MetricSourceQueryParams) => {
    const requestMetricSourcePage = (page: Required<PaginationFetchConfig>) =>
      requestListItems<MetricSourceItemResponse>(
        `/v1/metrics/sources${buildQueryString({
          timestamp__gte: params?.timestamp__gte,
          timestamp__lte: params?.timestamp__lte,
          source__eq: params?.source__eq,
          query__contains: params?.query__contains,
          provider__eq: params?.provider__eq,
          region__eq: params?.region__eq,
          status__eq: params?.status__eq,
          ...page,
        })}`,
      )

    if (hasExplicitPaginationParams(params)) {
      return requestMetricSourcePage(toPageFetchConfig(params));
    }

    return requestAllPages<MetricSourceItemResponse>(
      requestMetricSourcePage,
    ).then((items) => {
      const deduped = new Map<string, MetricSourceItemResponse>();
      for (const item of items) {
        if (!deduped.has(item.id)) {
          deduped.set(item.id, item);
        }
      }
      return Array.from(deduped.values());
    });
  },

  getMetricNames: (params?: MetricCatalogQueryParams) => {
    const requestMetricNamePage = (page: Required<PaginationFetchConfig>) =>
      requestListItems<string>(
        `/v1/metrics/names${buildQueryString({
          timestamp__gte: params?.timestamp__gte,
          timestamp__lte: params?.timestamp__lte,
          ...page,
        })}`,
      )

    if (hasExplicitPaginationParams(params)) {
      return requestMetricNamePage(toPageFetchConfig(params));
    }

    return requestAllPages<string>(requestMetricNamePage).then((items) =>
      Array.from(new Set(items)),
    );
  },

  getMetricSummary: (params: {
    agent_id: string;
    metric_name: string;
    timestamp__gte?: string;
    timestamp__lte?: string;
  }) =>
    request<MetricSummaryResponse>(
      `/v1/metrics/summary${buildQueryString(params)}`,
    ),

  createChannelConfig: (data: CreateChannelRequest) =>
    request<IdResponse>("/v1/notifications/channels", {
      method: "POST",
      body: data,
    }),

  updateChannelConfig: (id: string, data: UpdateChannelConfigRequest) =>
    request<IdResponse>(`/v1/notifications/channels/${id}`, {
      method: "PUT",
      body: {
        name: data.name,
        description: data.description,
        min_severity: data.min_severity,
        enabled: data.enabled,
        config_json: data.config_json,
        recipients: data.recipients,
      },
    }),

  deleteChannelConfig: (id: string) =>
    request<IdResponse>(`/v1/notifications/channels/${id}`, {
      method: "DELETE",
    }),

  getRecipients: (id: string, params?: PaginationParams) => {
    void params;

    return request<ChannelOverview>(`/v1/notifications/channels/${id}`).then(
      (channel) => channel.recipients || [],
    );
  },

  setRecipients: (id: string, data: SetRecipientsRequest) =>
    request<IdResponse>(`/v1/notifications/channels/${id}`, {
      method: "PUT",
      body: { recipients: data.recipients },
    }),

  testChannel: (id: string) =>
    request<EmptySuccessResponse>(`/v1/notifications/channels/${id}/test`, {
      method: "POST",
      allowEmptyResponse: true,
    }),

  listSilenceWindows: (params: SilenceWindowQueryParams = {}) =>
    requestListItems<SilenceWindow>(
      `/v1/notifications/silence-windows${buildQueryString(params)}`,
    ),

  getNotificationLogs: (params: NotificationLogQueryParams = {}) =>
    requestListResponse<NotificationLogItem>(
      `/v1/notifications/logs${buildQueryString(params)}`,
      {
        fallbackLimit: params.limit ?? 0,
        fallbackOffset: params.offset ?? 0,
      },
    ),

  getNotificationLogById: (id: string) =>
    request<NotificationLogItem>(`/v1/notifications/logs/${id}`),

  getNotificationLogSummary: (params: NotificationLogSummaryQueryParams = {}) =>
    request<NotificationLogSummaryResponse>(
      `/v1/notifications/logs/summary${buildQueryString(params)}`,
    ),

  createSilenceWindow: (data: CreateSilenceWindowRequest) =>
    request<IdResponse>("/v1/notifications/silence-windows", {
      method: "POST",
      body: data,
    }),

  deleteSilenceWindow: (id: string) =>
    request<IdResponse>(`/v1/notifications/silence-windows/${id}`, {
      method: "DELETE",
    }),

  getSilenceWindowById: (id: string) =>
    request<SilenceWindow>(`/v1/notifications/silence-windows/${id}`),

  updateSilenceWindow: (id: string, data: UpdateSilenceWindowRequest) =>
    request<IdResponse>(`/v1/notifications/silence-windows/${id}`, {
      method: "PUT",
      body: data,
    }),

  setAlertRuleEnabled: (id: string, data: EnableRequest) =>
    request<IdResponse>(`/v1/alerts/rules/${id}/enable`, {
      method: "PUT",
      body: data,
    }),

  getAlertRule: (id: string) =>
    request<AlertRuleDetailResponse>(`/v1/alerts/rules/${id}`),

  updateAlertRule: (id: string, data: UpdateAlertRuleRequest) =>
    request<IdResponse>(`/v1/alerts/rules/${id}`, {
      method: "PUT",
      body: {
        name: data.name,
        metric: data.metric,
        agent_pattern: data.agent_pattern,
        severity: data.severity,
        enabled: data.enabled,
        config_json: data.config_json,
        silence_secs: data.silence_secs,
      },
    }),

  deleteAlertRule: (id: string) =>
    request<IdResponse>(`/v1/alerts/rules/${id}`, { method: "DELETE" }),

  getAlertSummary: (params?: { hours?: number }) =>
    request<AlertSummary>(
      `/v1/alerts/summary${buildQueryString(params || {})}`,
    ),

  getHealth: () =>
    request<HealthResponse>("/v1/health", { requiresAuth: false }),
};

export { getApiErrorMessage };
