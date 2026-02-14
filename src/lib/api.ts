import {
  AlertEventResponse,
  AlertRuleDetailResponse,
  AlertRuleResponse,
  AlertSummary,
  ApiResponseEnvelope,
  CertificateDetails,
  ChannelOverview,
  ChannelConfig,
  NotificationLogListResponse,
  NotificationLogSummaryResponse,
  NotificationLogQueryParams,
  NotificationLogSummaryQueryParams,
  CreateAlertRuleRequest,
  UpdateAlertRuleRequest,
  DashboardOverview,
  LoginRequest,
  LoginResponse,
  HealthResponse,
  PaginationParams,
  RuntimeConfig,
  SystemConfigResponse,
  CreateSystemConfigRequest,
  UpdateSystemConfigRequest,
  StorageInfo,
  ChangePasswordRequest,
  CertificateChainInfo,
  CertCheckResult,
  CertSummary,
  CertDomain,
  CreateDomainRequest,
  UpdateDomainRequest,
  BatchCreateDomainsRequest,
  MetricDataPointResponse,
  MetricSummaryResponse,
  CreateChannelRequest,
  UpdateChannelConfigRequest,
  SetRecipientsRequest,
  SilenceWindow,
  CreateSilenceWindowRequest,
  EnableRequest,
  DictionaryItem,
  DictionaryType,
  DictionaryTypeSummary,
  CreateDictionaryRequest,
  UpdateDictionaryRequest,
  CreateDictionaryTypeRequest,
  UpdateDictionaryTypeRequest,
} from "@/types/api"
import {
  clearAuthToken,
  getAuthToken,
  normalizeAuthToken,
} from "@/lib/auth-token"
import { resolveAppLocale, stripLocalePrefix, withLocalePrefix } from "@/components/app-locale"
import { createAgentApiModule } from "@/lib/api/modules/agent"

const BASE_URL = ""
const inFlightGetRequests = new Map<string, Promise<unknown>>()

type HttpMethod = "GET" | "POST" | "PUT" | "DELETE"

interface RequestConfig {
  method?: HttpMethod
  body?: unknown
  token?: string
  requiresAuth?: boolean
  allowEmptyResponse?: boolean
}

type PaginationFetchConfig = {
  limit?: number
  offset?: number
}

export class ApiRequestError extends Error {
  status: number
  errCode?: number
  traceId?: string

  constructor(message: string, options?: { status?: number; errCode?: number; traceId?: string }) {
    super(message)
    this.name = "ApiRequestError"
    this.status = options?.status ?? 0
    this.errCode = options?.errCode
    this.traceId = options?.traceId
  }
}

function buildQueryString(
  params:
    | Record<string, unknown>
    | PaginationParams
    | NotificationLogSummaryQueryParams
) {
  const query = new URLSearchParams()
  const paramsRecord = params as Record<string, unknown>

  Object.entries(paramsRecord).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      query.append(key, String(value))
    }
  })

  const queryString = query.toString()
  return queryString ? `?${queryString}` : ""
}

function getApiErrorMessage(error: unknown, fallback: string) {
  if (error instanceof ApiRequestError) {
    return error.message
  }

  if (error instanceof Error && error.message) {
    return error.message
  }

  return fallback
}

async function requestAllPages<T>(
  fetchPage: (params: Required<PaginationFetchConfig>) => Promise<T[]>,
  options: PaginationFetchConfig = {}
) {
  const limit = Math.max(1, options.limit ?? 200)
  let offset = Math.max(0, options.offset ?? 0)
  const merged: T[] = []

  while (true) {
    const page = await fetchPage({ limit, offset })
    merged.push(...page)

    if (page.length < limit) {
      break
    }

    offset += limit
  }

  return merged
}

function toObject(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null
  }

  return value as Record<string, unknown>
}

function toStringValue(value: unknown, fallback = "") {
  return typeof value === "string" ? value : fallback
}

function toNullableStringValue(value: unknown) {
  if (typeof value === "string") {
    return value
  }

  if (value === null || value === undefined) {
    return null
  }

  return String(value)
}

function toNumberValue(value: unknown, fallback = 0) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value
  }

  if (typeof value === "string") {
    const parsed = Number(value)

    if (Number.isFinite(parsed)) {
      return parsed
    }
  }

  return fallback
}

function normalizeAlertEvent(value: unknown): AlertEventResponse | null {
  const record = toObject(value)

  if (!record) {
    return null
  }

  const id = toStringValue(record.id)
  const ruleId = toStringValue(record.rule_id)
  const agentId = toStringValue(record.agent_id)
  const metricName = toStringValue(record.metric_name)
  const severity = toStringValue(record.severity)
  const message = toStringValue(record.message)
  const timestamp = toStringValue(record.timestamp)

  if (!id || !ruleId || !agentId || !metricName || !severity || !message || !timestamp) {
    return null
  }

  let status = Math.trunc(toNumberValue(record.status, 1))

  if (![1, 2, 3].includes(status)) {
    if (toNullableStringValue(record.resolved_at)) {
      status = 3
    } else if (toNullableStringValue(record.acknowledged_at)) {
      status = 2
    } else {
      status = 1
    }
  }

  return {
    id,
    rule_id: ruleId,
    agent_id: agentId,
    metric_name: metricName,
    severity,
    message,
    value: toNumberValue(record.value, 0),
    threshold: toNumberValue(record.threshold, 0),
    timestamp,
    acknowledged_at: toNullableStringValue(record.acknowledged_at),
    resolved_at: toNullableStringValue(record.resolved_at),
    status,
  }
}

function normalizeSilenceWindow(value: unknown): SilenceWindow | null {
  const record = toObject(value)

  if (!record) {
    return null
  }

  const id = toStringValue(record.id)
  const startTime = toStringValue(record.start_time)
  const endTime = toStringValue(record.end_time)

  if (!id || !startTime || !endTime) {
    return null
  }

  return {
    id,
    start_time: startTime,
    end_time: endTime,
    recurrence: toNullableStringValue(record.recurrence),
    created_at: toNullableStringValue(record.created_at) || undefined,
    updated_at: toNullableStringValue(record.updated_at) || undefined,
    name: toNullableStringValue(record.name) || undefined,
    agent_pattern: toNullableStringValue(record.agent_pattern) || undefined,
    metric_pattern: toNullableStringValue(record.metric_pattern) || undefined,
  }
}

function normalizeAlertRuleDetail(value: unknown): AlertRuleDetailResponse | null {
  const record = toObject(value)

  if (!record) {
    return null
  }

  const id = toStringValue(record.id)
  const name = toStringValue(record.name)
  const ruleType = toStringValue(record.rule_type)
  const metric = toStringValue(record.metric)
  const agentPattern = toStringValue(record.agent_pattern)
  const severity = toStringValue(record.severity)
  const source = toStringValue(record.source, "manual")
  const createdAt = toStringValue(record.created_at)
  const updatedAt = toStringValue(record.updated_at)

  if (
    !id ||
    !name ||
    !ruleType ||
    !metric ||
    !agentPattern ||
    !severity
  ) {
    return null
  }

  return {
    id,
    name,
    rule_type: ruleType,
    metric,
    agent_pattern: agentPattern,
    severity,
    enabled: Boolean(record.enabled),
    config_json: toStringValue(record.config_json, "{}"),
    silence_secs: Math.max(0, Math.trunc(toNumberValue(record.silence_secs, 0))),
    source,
    created_at: createdAt || "",
    updated_at: updatedAt || "",
  }
}

function resolveEnvelopeData<T>(payload: unknown, status: number): T {
  if (!payload || typeof payload !== "object") {
    throw new ApiRequestError("Invalid API response format", { status })
  }

  const envelope = payload as Partial<ApiResponseEnvelope<T>>

  if (typeof envelope.err_code === "number") {
    if (envelope.err_code !== 0) {
      throw new ApiRequestError(envelope.err_msg || "Request failed", {
        status,
        errCode: envelope.err_code,
        traceId: envelope.trace_id,
      })
    }

    return envelope.data as T
  }

  return payload as T
}

async function request<T>(endpoint: string, config: RequestConfig = {}): Promise<T> {
  const { method = "GET", body, token, requiresAuth = true, allowEmptyResponse = false } = config
  const headers: Record<string, string> = {}

  if (body !== undefined) {
    headers["Content-Type"] = "application/json"
  }

  const authToken = normalizeAuthToken(token) || getAuthToken()

  if (requiresAuth && authToken) {
    headers.Authorization = `Bearer ${authToken}`
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
      : ""

  const executeRequest = async () => {
    const response = await fetch(`${BASE_URL}${endpoint}`, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    })

    if (response.status === 401) {
      if (typeof window !== "undefined") {
        clearAuthToken()

        const currentPathname = window.location.pathname
        const locale = resolveAppLocale(currentPathname)
        const loginPath = withLocalePrefix("/login", locale)

        if (stripLocalePrefix(currentPathname) !== "/login") {
          window.location.replace(loginPath)
        }
      }

      throw new ApiRequestError("认证已过期，请重新登录", { status: 401 })
    }

    if (response.status === 204) {
      return {} as T
    }

    let payload: unknown

    try {
      payload = await response.json()
    } catch {
      payload = null
    }

    if (!response.ok) {
      if (payload && typeof payload === "object") {
        const envelope = payload as Partial<ApiResponseEnvelope<unknown>>
        throw new ApiRequestError(
          envelope.err_msg || `Request failed: ${response.status} ${response.statusText}`,
          {
            status: response.status,
            errCode: envelope.err_code,
            traceId: envelope.trace_id,
          }
        )
      }

      throw new ApiRequestError(`Request failed: ${response.status} ${response.statusText}`, {
        status: response.status,
      })
    }

    if (payload === null) {
      if (allowEmptyResponse) {
        return {} as T
      }

      throw new ApiRequestError("Invalid API response format", { status: response.status })
    }

    return resolveEnvelopeData<T>(payload, response.status)
  }

  if (!dedupeKey) {
    return executeRequest()
  }

  const existingPromise = inFlightGetRequests.get(dedupeKey)

  if (existingPromise) {
    return existingPromise as Promise<T>
  }

  const requestPromise = executeRequest().finally(() => {
    inFlightGetRequests.delete(dedupeKey)
  }) as Promise<unknown>

  inFlightGetRequests.set(dedupeKey, requestPromise)

  return requestPromise as Promise<T>
}

const agentApi = createAgentApiModule({
  request,
  buildQueryString,
})

export const api = {
  login: (credentials: LoginRequest) =>
    request<LoginResponse>("/v1/auth/login", {
      method: "POST",
      body: credentials,
      requiresAuth: false,
    }),

  ...agentApi,

  getActiveAlerts: (params: PaginationParams = {}) =>
    request<unknown[]>(`/v1/alerts/active${buildQueryString(params)}`).then((items) =>
      items
        .map((item) => normalizeAlertEvent(item))
        .filter((item): item is AlertEventResponse => Boolean(item))
    ),

  getAlertHistory: (params: PaginationParams & {
    agent_id__eq?: string
    severity__eq?: string
    timestamp__gte?: string
    timestamp__lte?: string
  } = {}) =>
    request<unknown[]>(`/v1/alerts/history${buildQueryString(params)}`).then((items) =>
      items
        .map((item) => normalizeAlertEvent(item))
        .filter((item): item is AlertEventResponse => Boolean(item))
    ),

  acknowledgeAlert: (id: string, token?: string) =>
    request(`/v1/alerts/history/${id}/acknowledge`, {
      method: "POST",
      token,
      allowEmptyResponse: true,
    }),

  resolveAlert: (id: string, token?: string) =>
    request(`/v1/alerts/history/${id}/resolve`, {
      method: "POST",
      token,
      allowEmptyResponse: true,
    }),

  getAlertRules: (params?: PaginationParams) => {
    if (params) {
      return request<unknown[]>(`/v1/alerts/rules${buildQueryString(params)}`).then((items) =>
        items
          .map((item) => normalizeAlertRuleDetail(item))
          .filter((item): item is AlertRuleDetailResponse => Boolean(item))
      )
    }

    return requestAllPages<unknown>((page) =>
      request<unknown[]>(`/v1/alerts/rules${buildQueryString(page)}`)
    ).then((items) =>
      items
        .map((item) => normalizeAlertRuleDetail(item))
        .filter((item): item is AlertRuleDetailResponse => Boolean(item))
    )
  },

  createAlertRule: (data: CreateAlertRuleRequest) =>
    request<unknown>("/v1/alerts/rules", {
      method: "POST",
      body: data,
    }).then((result) => {
      const normalized = normalizeAlertRuleDetail(result)

      if (!normalized) {
        throw new ApiRequestError("Invalid alert rule response format", { status: 200 })
      }

      return normalized
    }),


  // Dashboard
  getDashboardOverview: () =>
    request<DashboardOverview>("/v1/dashboard/overview"),

  // Certificates
  getCertificates: (params: PaginationParams & {
    not_after__lte?: number
    ip_address__contains?: string
    issuer__contains?: string
  } = {}) =>
    request<CertificateDetails[]>(`/v1/certificates${buildQueryString(params)}`),

  getCertificate: (id: string) =>
    request<CertificateDetails>(`/v1/certificates/${id}`),

  // Notifications
  listChannels: (params?: PaginationParams) => {
    if (params) {
      return request<ChannelOverview[]>(`/v1/notifications/channels${buildQueryString(params)}`)
    }

    return requestAllPages<ChannelOverview>((page) =>
      request<ChannelOverview[]>(`/v1/notifications/channels${buildQueryString(page)}`)
    )
  },

  getChannelById: (id: string) =>
    request<ChannelOverview>(`/v1/notifications/channels/${id}`),

  // System
  getSystemConfig: () =>
    request<RuntimeConfig>("/v1/system/config"),

  getStorageInfo: () =>
    request<StorageInfo>("/v1/system/storage"),

  triggerCleanup: () =>
    request("/v1/system/storage/cleanup", { method: "POST", allowEmptyResponse: true }),

  listSystemConfigs: (params?: PaginationParams) => {
    if (params) {
      return request<SystemConfigResponse[]>(`/v1/system/configs${buildQueryString(params)}`)
    }

    return requestAllPages<SystemConfigResponse>((page) =>
      request<SystemConfigResponse[]>(`/v1/system/configs${buildQueryString(page)}`)
    )
  },

  getSystemConfigById: (id: string) =>
    request<SystemConfigResponse>(`/v1/system/configs/${id}`),

  createSystemConfig: (data: CreateSystemConfigRequest) =>
    request<SystemConfigResponse>("/v1/system/configs", { method: "POST", body: data }),

  updateSystemConfig: (id: string, data: UpdateSystemConfigRequest) =>
    request<SystemConfigResponse>(`/v1/system/configs/${id}`, { method: "PUT", body: data }),

  deleteSystemConfig: (id: string) =>
    request(`/v1/system/configs/${id}`, { method: "DELETE", allowEmptyResponse: true }),

  // Dictionaries
  listDictionaryTypes: (params?: PaginationParams) => {
    if (params) {
      return request<DictionaryTypeSummary[]>(`/v1/dictionaries/types${buildQueryString(params)}`)
    }

    return requestAllPages<DictionaryTypeSummary>((page) =>
      request<DictionaryTypeSummary[]>(`/v1/dictionaries/types${buildQueryString(page)}`)
    )
  },

  createDictionaryType: (data: CreateDictionaryTypeRequest) =>
    request<DictionaryType>("/v1/dictionaries/types", { method: "POST", body: data }),

  updateDictionaryType: (dictType: string, data: UpdateDictionaryTypeRequest) =>
    request<DictionaryType>(`/v1/dictionaries/types/${encodeURIComponent(dictType)}`, { method: "PUT", body: data }),

  deleteDictionaryType: (dictType: string) =>
    request(`/v1/dictionaries/types/${encodeURIComponent(dictType)}`, { method: "DELETE", allowEmptyResponse: true }),

  listDictionariesByType: async (
    dictType: string,
    enabledOnly = false,
    params?: PaginationParams
  ) => {
    const encodedType = encodeURIComponent(dictType)

    const requestDictionaryPage = async (page: Required<PaginationFetchConfig>) => {
      const query = buildQueryString({
        enabled_only: enabledOnly,
        ...page,
      })

      try {
        return await request<DictionaryItem[]>(`/v1/dictionaries/type/${encodedType}${query}`)
      } catch (error) {
        if (error instanceof ApiRequestError && error.status === 404) {
          return request<DictionaryItem[]>(`/v1/dictionaries/type/${encodedType}/${enabledOnly}${buildQueryString(page)}`)
        }

        throw error
      }
    }

    if (params) {
      return requestDictionaryPage({
        limit: Math.max(1, params.limit ?? 200),
        offset: Math.max(0, params.offset ?? 0),
      })
    }

    return requestAllPages<DictionaryItem>(requestDictionaryPage)
  },

  createDictionary: (data: CreateDictionaryRequest) =>
    request<DictionaryItem>("/v1/dictionaries", { method: "POST", body: data }),

  getDictionary: (id: string) =>
    request<DictionaryItem>(`/v1/dictionaries/${id}`),

  updateDictionary: (id: string, data: UpdateDictionaryRequest) =>
    request<DictionaryItem>(`/v1/dictionaries/${id}`, { method: "PUT", body: data }),

  deleteDictionary: (id: string) =>
    request(`/v1/dictionaries/${id}`, { method: "DELETE", allowEmptyResponse: true }),

  // Auth - Security
  changePassword: (data: ChangePasswordRequest) =>
    request("/v1/auth/password", { method: "POST", body: data }),

  // Certificates - Advanced
  getCertificateChain: (id: string) =>
    request<CertificateChainInfo>(`/v1/certificates/${id}/chain`),

  checkAllDomains: () =>
    request<CertCheckResult[]>("/v1/certs/check", { method: "POST" }),

  listDomains: (params: PaginationParams & { enabled__eq?: boolean; domain__contains?: string } = {}) =>
    request<CertDomain[]>(`/v1/certs/domains${buildQueryString(params)}`),

  createDomain: (data: CreateDomainRequest) =>
    request<CertDomain>("/v1/certs/domains", { method: "POST", body: data }),

  createDomainsBatch: (data: BatchCreateDomainsRequest) =>
    request<CertDomain[]>("/v1/certs/domains/batch", { method: "POST", body: data }),

  getDomain: (id: string) =>
    request<CertDomain>(`/v1/certs/domains/${id}`),

  updateDomain: (id: string, data: UpdateDomainRequest) =>
    request<CertDomain>(`/v1/certs/domains/${id}`, { method: "PUT", body: data }),

  deleteDomain: (id: string) =>
    request(`/v1/certs/domains/${id}`, { method: "DELETE", allowEmptyResponse: true }),

  checkSingleDomain: (id: string) =>
    request<CertCheckResult>(`/v1/certs/domains/${id}/check`, { method: "POST" }),

  getCertCheckHistory: (id: string, params: PaginationParams = {}) =>
    request<CertCheckResult[]>(`/v1/certs/domains/${id}/history${buildQueryString(params)}`),

  getCertStatusAll: (params: PaginationParams = {}) =>
    request<CertCheckResult[]>(`/v1/certs/status${buildQueryString(params)}`),

  getCertStatusByDomain: (domain: string) =>
    request<CertCheckResult>(`/v1/certs/status/${encodeURIComponent(domain)}`),

  getCertSummary: () =>
    request<CertSummary>("/v1/certs/summary"),

  // Metrics - Explorer
  queryAllMetrics: (params: PaginationParams & {
    agent_id__eq?: string
    metric_name__eq?: string
    timestamp__gte?: string
    timestamp__lte?: string
  } = {}) =>
    request<MetricDataPointResponse[]>(`/v1/metrics${buildQueryString(params)}`),

  getMetricAgents: (params?: { timestamp__gte?: string; timestamp__lte?: string }) =>
    request<string[]>(`/v1/metrics/agents${buildQueryString(params || {})}`),

  getMetricNames: (params?: { timestamp__gte?: string; timestamp__lte?: string }) =>
    request<string[]>(`/v1/metrics/names${buildQueryString(params || {})}`),

  getMetricSummary: (params: { agent_id: string; metric_name: string; timestamp__gte?: string; timestamp__lte?: string }) =>
    request<MetricSummaryResponse>(`/v1/metrics/summary${buildQueryString(params)}`),

  // Notifications - Advanced
  listChannelConfigs: (params?: PaginationParams) => {
    if (params) {
      return request<ChannelConfig[]>(`/v1/notifications/channels/config${buildQueryString(params)}`)
    }

    return requestAllPages<ChannelConfig>((page) =>
      request<ChannelConfig[]>(`/v1/notifications/channels/config${buildQueryString(page)}`)
    )
  },

  getChannelConfigById: (id: string) =>
    request<ChannelConfig>(`/v1/notifications/channels/config/${id}`),

  createChannelConfig: (data: CreateChannelRequest) =>
    request<ChannelConfig>("/v1/notifications/channels/config", { method: "POST", body: data }),

  updateChannelConfig: (id: string, data: UpdateChannelConfigRequest) =>
    request<ChannelConfig>(`/v1/notifications/channels/config/${id}`, { method: "PUT", body: data }),

  deleteChannelConfig: (id: string) =>
    request(`/v1/notifications/channels/config/${id}`, { method: "DELETE", allowEmptyResponse: true }),

  getRecipients: (id: string, params?: PaginationParams) => {
    if (params) {
      return request<string[]>(`/v1/notifications/channels/${id}/recipients${buildQueryString(params)}`)
    }

    return requestAllPages<string>((page) =>
      request<string[]>(`/v1/notifications/channels/${id}/recipients${buildQueryString(page)}`)
    )
  },

  setRecipients: (id: string, data: SetRecipientsRequest) =>
    request<string[]>(`/v1/notifications/channels/${id}/recipients`, { method: "PUT", body: data }),

  testChannel: (id: string) =>
    request(`/v1/notifications/channels/${id}/test`, { method: "POST", allowEmptyResponse: true }),

  listSilenceWindows: (params: PaginationParams = {}) =>
    request<unknown[]>(`/v1/notifications/silence-windows${buildQueryString(params)}`).then((items) =>
      items
        .map((item) => normalizeSilenceWindow(item))
        .filter((item): item is SilenceWindow => Boolean(item))
    ),

  getNotificationLogs: (params: NotificationLogQueryParams = {}) =>
    request<NotificationLogListResponse>(`/v1/notifications/logs${buildQueryString(params)}`),

  getNotificationLogById: async (id: string) => {
    const limit = 200
    let offset = 0

    while (true) {
      const page = await request<NotificationLogListResponse>(
        `/v1/notifications/logs${buildQueryString({ limit, offset })}`
      )
      const found = page.items.find((item) => item.id === id)

      if (found) {
        return found
      }

      if (page.items.length < limit) {
        break
      }

      offset += limit
    }

    throw new ApiRequestError("Notification log not found", { status: 404 })
  },

  getNotificationLogSummary: (params: NotificationLogSummaryQueryParams = {}) =>
    request<NotificationLogSummaryResponse>(`/v1/notifications/logs/summary${buildQueryString(params)}`),

  createSilenceWindow: (data: CreateSilenceWindowRequest) =>
    request<unknown>("/v1/notifications/silence-windows", {
      method: "POST",
      body: data,
      allowEmptyResponse: true,
    }).then((result) => {
      const normalized = normalizeSilenceWindow(result)
      return (normalized || {}) as Partial<SilenceWindow>
    }),

  deleteSilenceWindow: (id: string) =>
    request(`/v1/notifications/silence-windows/${id}`, { method: "DELETE", allowEmptyResponse: true }),

  setAlertRuleEnabled: (id: string, data: EnableRequest) =>
    request<unknown>(`/v1/alerts/rules/${id}/enable`, { method: "PUT", body: data }).then((result) => {
      const normalized = normalizeAlertRuleDetail(result)

      if (!normalized) {
        throw new ApiRequestError("Invalid alert rule response format", { status: 200 })
      }

      return normalized
    }),

  getAlertRule: (id: string) =>
    request<unknown>(`/v1/alerts/rules/${id}`).then((result) => {
      const normalized = normalizeAlertRuleDetail(result)

      if (!normalized) {
        throw new ApiRequestError("Invalid alert rule response format", { status: 200 })
      }

      return normalized
    }),

  updateAlertRule: (id: string, data: UpdateAlertRuleRequest) =>
    request<unknown>(`/v1/alerts/rules/${id}`, { method: "PUT", body: data }).then((result) => {
      const normalized = normalizeAlertRuleDetail(result)

      if (!normalized) {
        throw new ApiRequestError("Invalid alert rule response format", { status: 200 })
      }

      return normalized
    }),

  deleteAlertRule: (id: string) =>
    request(`/v1/alerts/rules/${id}`, { method: "DELETE", allowEmptyResponse: true }),

  getAlertSummary: (params?: { hours?: number }) =>
    request<AlertSummary>(`/v1/alerts/summary${buildQueryString(params || {})}`),

  getHealth: () =>
    request<HealthResponse>("/v1/health", { requiresAuth: false }),
}

export { getApiErrorMessage }
