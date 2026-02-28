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
  AIReportListItem,
  AIReportRow,
  ActiveAlertQueryParams,
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
  UpdateAIAccountRequest,
  UpdateCloudAccountRequest,
  UpdateSystemConfigRequest,
  StorageInfo,
  ChangePasswordRequest,
  CertificateChainInfo,
  CertCheckResult,
  CertSummary,
  CertStatusSummary,
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
  fetchPage: (params: Required<PaginationFetchConfig>) => Promise<T[]>,
  options: PaginationFetchConfig = {},
) {
  const limit = Math.max(1, options.limit ?? 200);
  let offset = Math.max(0, options.offset ?? 0);
  const merged: T[] = [];

  while (true) {
    const page = await fetchPage({ limit, offset });
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

function extractListItems<T>(payload: unknown): T[] {
  if (Array.isArray(payload)) {
    return payload as T[];
  }

  const record = payload as any;
  if (!record || typeof record !== "object") {
    return [];
  }

  if (Array.isArray(record.items)) {
    return record.items;
  }

  if (Array.isArray(record.data)) {
    return record.data;
  }

  if (Array.isArray(record.data?.items)) {
    return record.data.items;
  }

  return [];
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

  const keys = Object.keys(record);
  const envelopeKeys = new Set(["data", "err_code", "err_msg", "trace_id"]);
  const isEnvelopeShape = keys.every((key) => envelopeKeys.has(key));

  if (!isEnvelopeShape) {
    return null;
  }

  return record as ApiResponseEnvelopeLike;
}

function normalizeListResponse<T>(
  payload: unknown,
  options: { fallbackLimit?: number; fallbackOffset?: number } = {},
): ListResponse<T> {
  const record = payload as any;
  let items: T[] = extractListItems<T>(payload);
  let total = 0;

  if (Array.isArray(payload)) {
    total = items.length;
  } else if (record && typeof record === 'object') {
    total = record.total ?? record.data?.total ?? record.data?.length ?? items.length;
  }

  const limit = options.fallbackLimit ?? items.length;
  const offset = options.fallbackOffset ?? 0;

  return {
    items,
    total,
    limit,
    offset,
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
      return {} as T;
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
    request<unknown>(`/v1/alerts/active${buildQueryString(params)}`).then(
      (payload) => normalizeListResponse<AlertEventResponse>(payload, {
        fallbackLimit: params.limit ?? 0,
        fallbackOffset: params.offset ?? 0,
      }),
    ),

  getAlertHistory: (
    params: PaginationParams & {
      agent_id__eq?: string;
      severity__eq?: string;
      timestamp__gte?: string;
      timestamp__lte?: string;
    } = {},
  ) =>
    request<unknown>(`/v1/alerts/history${buildQueryString(params)}`).then(
      (payload) => normalizeListResponse<AlertEventResponse>(payload, {
        fallbackLimit: params.limit ?? 0,
        fallbackOffset: params.offset ?? 0,
      }),
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
      return request<unknown>(
        `/v1/alerts/rules${buildQueryString(params || {})}`,
      ).then((items) => (Array.isArray(items) ? items : ((items as any).items || (items as any).data || (items as any).data?.items || [])) as AlertRuleResponse[]);
    }

    const queryParams = {
      name__contains: params?.name__contains,
      rule_type__eq: params?.rule_type__eq,
      metric__contains: params?.metric__contains,
      severity__eq: params?.severity__eq,
      enabled__eq: params?.enabled__eq,
    };

    return requestAllPages<AlertRuleResponse>((page) =>
      request<unknown>(
        `/v1/alerts/rules${buildQueryString({ ...queryParams, ...page })}`,
      ).then((payload) => (Array.isArray(payload) ? payload : ((payload as any).items || (payload as any).data || (payload as any).data?.items || [])) as AlertRuleResponse[])
    );
  },

  createAlertRule: (data: CreateAlertRuleRequest) =>
    request<IdResponse>("/v1/alerts/rules", { method: "POST", body: data }),

  getDashboardOverview: () =>
    request<DashboardOverview>("/v1/dashboard/overview"),

  getCertificates: (
    params: PaginationParams & {
      not_after__lte?: number;
      ip_address__contains?: string;
      issuer__contains?: string;
    } = {},
  ) =>
    request<unknown>(`/v1/certificates${buildQueryString(params)}`).then(
      (payload) => normalizeListResponse<CertificateDetails>(payload, {
        fallbackLimit: params.limit ?? 0,
        fallbackOffset: params.offset ?? 0,
      })
    ),

  getCertificate: (id: string) =>
    request<CertificateDetails>(`/v1/certificates/${id}`),

  listChannels: (params?: NotificationChannelQueryParams) => {
    if (hasExplicitPaginationParams(params)) {
      return request<unknown>(
        `/v1/notifications/channels${buildQueryString(params || {})}`,
      ).then((payload) => (Array.isArray(payload) ? payload : ((payload as any).items || (payload as any).data || (payload as any).data?.items || [])) as ChannelOverview[]);
    }

    const queryParams = {
      name__contains: params?.name__contains,
      channel_type__eq: params?.channel_type__eq,
      enabled__eq: params?.enabled__eq,
      min_severity__eq: params?.min_severity__eq,
    };

    return requestAllPages<ChannelOverview>((page) =>
      request<unknown>(
        `/v1/notifications/channels${buildQueryString({ ...queryParams, ...page })}`,
      ).then((payload) => (Array.isArray(payload) ? payload : ((payload as any).items || (payload as any).data || (payload as any).data?.items || [])) as ChannelOverview[])
    );
  },

  getChannelById: (id: string) =>
    request<ChannelOverview>(`/v1/notifications/channels/${id}`),

  listCloudAccounts: (params?: CloudAccountQueryParams) => {
    if (hasExplicitPaginationParams(params)) {
      return request<unknown>(
        `/v1/cloud/accounts${buildQueryString(params || {})}`,
      ).then((payload) => (Array.isArray(payload) ? payload : ((payload as any).items || (payload as any).data || (payload as any).data?.items || [])) as CloudAccountResponse[]);
    }

    const queryParams = {
      provider: params?.provider,
      enabled: params?.enabled,
    };

    return requestAllPages<CloudAccountResponse>((page) =>
      request<unknown>(
        `/v1/cloud/accounts${buildQueryString({ ...queryParams, ...page })}`,
      ).then((payload) => (Array.isArray(payload) ? payload : ((payload as any).items || (payload as any).data || (payload as any).data?.items || [])) as CloudAccountResponse[])
    );
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
      return request<unknown>(
        `/v1/cloud/instances${buildQueryString(params || {})}`,
      ).then((payload) => (Array.isArray(payload) ? payload : ((payload as any).items || (payload as any).data || (payload as any).data?.items || [])) as CloudInstanceResponse[]);
    }

    const queryParams = {
      provider: params?.provider,
      region: params?.region,
      status: params?.status,
      search: params?.search,
    };

    return requestAllPages<CloudInstanceResponse>((page) =>
      request<unknown>(
        `/v1/cloud/instances${buildQueryString({ ...queryParams, ...page })}`,
      ).then((payload) => (Array.isArray(payload) ? payload : ((payload as any).items || (payload as any).data || (payload as any).data?.items || [])) as CloudInstanceResponse[])
    );
  },

  listCloudInstancesPage: (params: CloudInstanceQueryParams = {}) =>
    request<unknown>(`/v1/cloud/instances${buildQueryString(params)}`).then(
      (payload) => normalizeListResponse<CloudInstanceResponse>(payload, {
        fallbackLimit: params.limit ?? 0,
        fallbackOffset: params.offset ?? 0,
      }),
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

  listAIAccounts: () =>
    request<unknown>("/v1/ai/accounts").then(
      (payload) => (Array.isArray(payload) ? payload : ((payload as any).items || (payload as any).data || (payload as any).data?.items || [])) as AIAccountResponse[],
    ),

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
    request<IdResponse>(`/v1/ai/accounts/${id}`, {
      method: "DELETE",
      allowEmptyResponse: true,
    }),

  listAIReports: () =>
    request<unknown>("/v1/ai/reports").then(
      (payload) => (Array.isArray(payload) ? payload : ((payload as any).items || (payload as any).data || (payload as any).data?.items || [])) as AIReportListItem[],
    ),

  getAIReportById: (id: string) => request<AIReportRow>(`/v1/ai/reports/${id}`),

  getSystemConfig: () => request<RuntimeConfig>("/v1/system/config"),

  getStorageInfo: () => request<StorageInfo>("/v1/system/storage"),

  triggerCleanup: () =>
    request("/v1/system/storage/cleanup", {
      method: "POST",
      allowEmptyResponse: true,
    }),

  listSystemConfigs: (params?: SystemConfigQueryParams) => {
    if (hasExplicitPaginationParams(params)) {
      return request<unknown>(
        `/v1/system/configs${buildQueryString(params || {})}`,
      ).then((payload) => (Array.isArray(payload) ? payload : ((payload as any).items || (payload as any).data || (payload as any).data?.items || [])) as SystemConfigResponse[]);
    }

    const queryParams = {
      config_type: params?.config_type,
      config_key: params?.config_key,
      enabled: params?.enabled,
    };

    return requestAllPages<SystemConfigResponse>((page) =>
      request<unknown>(
        `/v1/system/configs${buildQueryString({ ...queryParams, ...page })}`,
      ).then((payload) => (Array.isArray(payload) ? payload : ((payload as any).items || (payload as any).data || (payload as any).data?.items || [])) as SystemConfigResponse[])
    );
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

  listDictionaryTypes: (params?: DictionaryTypeQueryParams) => {
    if (hasExplicitPaginationParams(params)) {
      return request<unknown>(
        `/v1/dictionaries/types${buildQueryString(params || {})}`,
      ).then((payload) => (Array.isArray(payload) ? payload : ((payload as any).items || (payload as any).data || (payload as any).data?.items || [])) as DictionaryTypeSummary[]);
    }

    const queryParams = {
      dict_type__contains: params?.dict_type__contains,
    };

    return requestAllPages<DictionaryTypeSummary>((page) =>
      request<unknown>(
        `/v1/dictionaries/types${buildQueryString({ ...queryParams, ...page })}`,
      ).then((payload) => (Array.isArray(payload) ? payload : ((payload as any).items || (payload as any).data || (payload as any).data?.items || [])) as DictionaryTypeSummary[])
    );
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
      request<unknown>(
        `/v1/dictionaries/types/all${buildQueryString({
          dict_type__in: normalizedDictTypes,
          enabled_only: enabledOnly,
          key__contains: filters?.key__contains,
          label__contains: filters?.label__contains,
          ...page,
        })}`,
      ).then((payload) => (Array.isArray(payload) ? payload : ((payload as any).items || (payload as any).data || (payload as any).data?.items || [])) as DictionaryItem[]);

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

  changePassword: (data: ChangePasswordRequest) =>
    request("/v1/auth/password", {
      method: "POST",
      body: data,
      allowEmptyResponse: true,
    }),

  getCertificateChain: (id: string) =>
    request<CertificateChainInfo>(`/v1/certificates/${id}/chain`),

  checkAllDomains: () =>
    request<unknown>("/v1/certs/check", { method: "POST" }).then(
      (payload) => (Array.isArray(payload) ? payload : ((payload as any).items || (payload as any).data || (payload as any).data?.items || [])) as CertCheckResult[],
    ),

  listDomains: (
    params: PaginationParams & {
      enabled__eq?: boolean;
      domain__contains?: string;
    } = {},
  ) =>
    request<unknown>(`/v1/certs/domains${buildQueryString(params)}`).then(
      (payload) => normalizeListResponse<CertDomain>(payload, {
        fallbackLimit: params.limit ?? 0,
        fallbackOffset: params.offset ?? 0,
      }),
    ),

  getCertDomainsSummary: () =>
    request<CertDomainsSummary>("/v1/certs/domains/summary"),

  createDomain: (data: CreateDomainRequest) =>
    request<IdResponse>("/v1/certs/domains", { method: "POST", body: data }),

  createDomainsBatch: (data: BatchCreateDomainsRequest) =>
    request<unknown>("/v1/certs/domains/batch", {
      method: "POST",
      body: data,
    }).then((payload) => (Array.isArray(payload) ? payload : ((payload as any).items || (payload as any).data || (payload as any).data?.items || [])) as IdResponse[]),

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
    request<unknown>(
      `/v1/certs/domains/${id}/history${buildQueryString(params)}`,
    ).then((payload) => (Array.isArray(payload) ? payload : ((payload as any).items || (payload as any).data || (payload as any).data?.items || [])) as CertCheckResult[]),

  getCertStatusAll: (params: CertStatusQueryParams = {}) =>
    request<unknown>(`/v1/certs/status${buildQueryString(params)}`).then(
      (payload) => normalizeListResponse<CertCheckResult>(payload, {
        fallbackLimit: params.limit ?? 0,
        fallbackOffset: params.offset ?? 0,
      }),
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

  queryAllMetrics: (
    params: PaginationParams & {
      agent_id__eq?: string;
      metric_name__eq?: string;
      timestamp__gte?: string;
      timestamp__lte?: string;
    } = {},
  ) =>
    request<unknown>(`/v1/metrics${buildQueryString(params)}`).then(
      (payload) => (Array.isArray(payload) ? payload : ((payload as any).items || (payload as any).data || (payload as any).data?.items || [])) as MetricDataPointResponse[],
    ),

  getMetricAgents: (params?: MetricCatalogQueryParams) => {
    const requestMetricAgentPage = (page: Required<PaginationFetchConfig>) =>
      request<unknown>(
        `/v1/metrics/agents${buildQueryString({
          timestamp__gte: params?.timestamp__gte,
          timestamp__lte: params?.timestamp__lte,
          ...page,
        })}`,
      ).then((payload) => (Array.isArray(payload) ? payload : ((payload as any).items || (payload as any).data || (payload as any).data?.items || [])) as string[]);

    if (hasExplicitPaginationParams(params)) {
      return requestMetricAgentPage(toPageFetchConfig(params));
    }

    return requestAllPages<string>(requestMetricAgentPage).then((items) =>
      Array.from(new Set(items)),
    );
  },

  getMetricSources: (params?: MetricSourceQueryParams) => {
    const requestMetricSourcePage = (page: Required<PaginationFetchConfig>) =>
      request<unknown>(
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
      ).then((payload) => (Array.isArray(payload) ? payload : ((payload as any).items || (payload as any).data || (payload as any).data?.items || [])) as MetricSourceItemResponse[]);

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
      request<unknown>(
        `/v1/metrics/names${buildQueryString({
          timestamp__gte: params?.timestamp__gte,
          timestamp__lte: params?.timestamp__lte,
          ...page,
        })}`,
      ).then((payload) => (Array.isArray(payload) ? payload : ((payload as any).items || (payload as any).data || (payload as any).data?.items || [])) as string[]);

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
    request(`/v1/notifications/channels/${id}/test`, {
      method: "POST",
      allowEmptyResponse: true,
    }),

  listSilenceWindows: (params: SilenceWindowQueryParams = {}) =>
    request<unknown>(
      `/v1/notifications/silence-windows${buildQueryString(params)}`,
    ).then((items) => (Array.isArray(items) ? items : ((items as any).items || (items as any).data || (items as any).data?.items || [])) as SilenceWindow[]),

  getNotificationLogs: (params: NotificationLogQueryParams = {}) =>
    request<NotificationLogListResponse>(
      `/v1/notifications/logs${buildQueryString(params)}`,
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
