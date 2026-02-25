import {
  ActiveAlertQueryParams,
  AlertEventResponse,
  AlertRuleQueryParams,
  AlertRuleDetailResponse,
  AlertRuleResponse,
  AlertSummary,
  ApiResponseEnvelope,
  CertStatusQueryParams,
  CertificateDetails,
  ChannelOverview,
  DictionaryByTypeQueryParams,
  DictionaryTypeQueryParams,
  CloudAccountQueryParams,
  CloudAccountResponse,
  CloudInstanceQueryParams,
  CloudInstanceDetailResponse,
  CloudInstanceResponse,
  CreateCloudAccountRequest,
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
  UpdateCloudAccountRequest,
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
  MetricCatalogQueryParams,
  MetricDataPointResponse,
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
} from "@/types/api"
import {
  clearAuthToken,
  getAuthToken,
  normalizeAuthToken,
} from "@/lib/auth-token"
import { clearGlobalConfigCache } from "@/lib/global-config-cache"
import { resolveAppLocale, stripLocalePrefix, withLocalePrefix } from "@/components/app-locale"
import { createAgentApiModule } from "@/lib/api/modules/agent"

function normalizeBaseUrl(value: string | undefined) {
  if (!value) {
    return ""
  }

  return value.trim().replace(/\/+$/, "")
}
const BASE_URL = normalizeBaseUrl(process.env.NEXT_PUBLIC_API_BASE_URL)
const OX_APP_ID = process.env.NEXT_PUBLIC_OX_APP_ID?.trim() || ""
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

function getRequiredAppId() {
  if (!OX_APP_ID) {
    throw new ApiRequestError("缺少 NEXT_PUBLIC_OX_APP_ID 配置，无法发起 API 请求")
  }

  return OX_APP_ID
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

function hasExplicitPaginationParams(params?: PaginationParams) {
  return params?.limit !== undefined || params?.offset !== undefined
}

function toPageFetchConfig(
  params?: PaginationParams,
  defaultLimit = 200
): Required<PaginationFetchConfig> {
  return {
    limit: Math.max(1, params?.limit ?? defaultLimit),
    offset: Math.max(0, params?.offset ?? 0),
  }
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

const LIST_KEYS = ["items", "agents", "results", "rows", "list", "records"] as const

function extractListPayload(payload: unknown): unknown[] {
  if (Array.isArray(payload)) {
    return payload
  }

  const record = toObject(payload)

  if (!record) {
    return []
  }

  for (const key of LIST_KEYS) {
    const candidate = record[key]

    if (Array.isArray(candidate)) {
      return candidate
    }
  }

  const nestedData = toObject(record.data)

  if (!nestedData) {
    return []
  }

  for (const key of LIST_KEYS) {
    const candidate = nestedData[key]

    if (Array.isArray(candidate)) {
      return candidate
    }
  }

  return []
}

function toStringList(payload: unknown): string[] {
  return extractListPayload(payload).map((item) => String(item))
}

function normalizeListResponse<T>(
  payload: unknown,
  options: { fallbackLimit?: number; fallbackOffset?: number } = {}
): ListResponse<T> {
  const items = extractListPayload(payload) as T[]
  const record = toObject(payload)
  const nestedData = record ? toObject(record.data) : null
  const source = nestedData || record
  const fallbackLimit = options.fallbackLimit ?? items.length
  const fallbackOffset = options.fallbackOffset ?? 0

  const total = Math.max(0, Math.trunc(toNumberValue(source?.total, items.length)))
  const limit = Math.max(0, Math.trunc(toNumberValue(source?.limit, fallbackLimit)))
  const offset = Math.max(0, Math.trunc(toNumberValue(source?.offset, fallbackOffset)))

  return {
    items,
    total,
    limit,
    offset,
  }
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

  const rawStatus = Math.trunc(toNumberValue(record.status, 1))
  const status = [1, 2, 3].includes(rawStatus) ? rawStatus : 1

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
    predicted_breach: toNullableStringValue(record.predicted_breach),
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

function normalizeAlertRule(value: unknown): AlertRuleResponse | null {
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
  headers["ox-app-id"] = getRequiredAppId()

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

    if (response.status === 401 && requiresAuth) {
      if (typeof window !== "undefined") {
        clearAuthToken()
        clearGlobalConfigCache()

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

    let payload: unknown = null
    let responseText = ""

    try {
      responseText = await response.text()
    } catch {
      responseText = ""
    }

    if (responseText) {
      try {
        payload = JSON.parse(responseText)
      } catch {
        payload = null
      }
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

      const plainTextErrorMessage = responseText.trim()

      if (plainTextErrorMessage) {
        throw new ApiRequestError(plainTextErrorMessage, {
          status: response.status,
        })
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
    request<unknown>(`/v1/alerts/active${buildQueryString(params)}`).then((payload) => {
      const page = normalizeListResponse<unknown>(payload, {
        fallbackLimit: params.limit ?? 0,
        fallbackOffset: params.offset ?? 0,
      })

      return {
        ...page,
        items: page.items
          .map((item) => normalizeAlertEvent(item))
          .filter((item): item is AlertEventResponse => Boolean(item)),
      }
    }),

  getAlertHistory: (params: PaginationParams & {
    agent_id__eq?: string
    severity__eq?: string
    timestamp__gte?: string
    timestamp__lte?: string
  } = {}) =>
    request<unknown>(`/v1/alerts/history${buildQueryString(params)}`).then((payload) => {
      const page = normalizeListResponse<unknown>(payload, {
        fallbackLimit: params.limit ?? 0,
        fallbackOffset: params.offset ?? 0,
      })

      return {
        ...page,
        items: page.items
          .map((item) => normalizeAlertEvent(item))
          .filter((item): item is AlertEventResponse => Boolean(item)),
      }
    }),

  getAlertHistoryById: (id: string) =>
    request<unknown>(`/v1/alerts/history/${id}`).then((item) => {
      const normalized = normalizeAlertEvent(item)

      if (!normalized) {
        throw new ApiRequestError("Invalid alert event response format", { status: 200 })
      }

      return normalized
    }),

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
      return request<unknown>(`/v1/alerts/rules${buildQueryString(params || {})}`).then((items) =>
        extractListPayload(items)
          .map((item) => normalizeAlertRule(item))
          .filter((item): item is AlertRuleResponse => Boolean(item))
      )
    }

    const queryParams = {
      name__contains: params?.name__contains,
      rule_type__eq: params?.rule_type__eq,
      metric__contains: params?.metric__contains,
      severity__eq: params?.severity__eq,
      enabled__eq: params?.enabled__eq,
    }

    return requestAllPages<unknown>((page) =>
      request<unknown>(`/v1/alerts/rules${buildQueryString({ ...queryParams, ...page })}`).then(
        (payload) => extractListPayload(payload)
      )
    ).then((items) =>
      items
        .map((item) => normalizeAlertRule(item))
        .filter((item): item is AlertRuleResponse => Boolean(item))
    )
  },

  createAlertRule: (data: CreateAlertRuleRequest) =>
    request<IdResponse>("/v1/alerts/rules", { method: "POST", body: data }),


  // Dashboard
  getDashboardOverview: () =>
    request<DashboardOverview>("/v1/dashboard/overview"),

  // Certificates
  getCertificates: (params: PaginationParams & {
    not_after__lte?: number
    ip_address__contains?: string
    issuer__contains?: string
  } = {}) =>
    request<unknown>(`/v1/certificates${buildQueryString(params)}`).then((payload) =>
      normalizeListResponse<CertificateDetails>(payload, {
        fallbackLimit: params.limit ?? 0,
        fallbackOffset: params.offset ?? 0,
      })
    ),

  getCertificate: (id: string) =>
    request<CertificateDetails>(`/v1/certificates/${id}`),

  // Notifications
  listChannels: (params?: NotificationChannelQueryParams) => {
    if (hasExplicitPaginationParams(params)) {
      return request<unknown>(`/v1/notifications/channels${buildQueryString(params || {})}`).then(
        (payload) => extractListPayload(payload) as ChannelOverview[]
      )
    }

    const queryParams = {
      name__contains: params?.name__contains,
      channel_type__eq: params?.channel_type__eq,
      enabled__eq: params?.enabled__eq,
      min_severity__eq: params?.min_severity__eq,
    }

    return requestAllPages<ChannelOverview>((page) =>
      request<unknown>(`/v1/notifications/channels${buildQueryString({ ...queryParams, ...page })}`).then(
        (payload) => extractListPayload(payload) as ChannelOverview[]
      )
    )
  },

  getChannelById: (id: string) =>
    request<ChannelOverview>(`/v1/notifications/channels/${id}`),

  // Cloud
  listCloudAccounts: (params?: CloudAccountQueryParams) => {
    if (hasExplicitPaginationParams(params)) {
      return request<unknown>(`/v1/cloud/accounts${buildQueryString(params || {})}`).then(
        (payload) => extractListPayload(payload) as CloudAccountResponse[]
      )
    }

    const queryParams = {
      enabled: params?.enabled,
    }

    return requestAllPages<CloudAccountResponse>((page) =>
      request<unknown>(`/v1/cloud/accounts${buildQueryString({ ...queryParams, ...page })}`).then(
        (payload) => extractListPayload(payload) as CloudAccountResponse[]
      )
    )
  },

  getCloudAccountById: (id: string) =>
    request<CloudAccountResponse>(`/v1/cloud/accounts/${id}`),

  createCloudAccount: (data: CreateCloudAccountRequest) =>
    request<CloudAccountResponse>("/v1/cloud/accounts", { method: "POST", body: data }),

  updateCloudAccount: (id: string, data: UpdateCloudAccountRequest) =>
    request<CloudAccountResponse>(`/v1/cloud/accounts/${id}`, { method: "PUT", body: data }),

  deleteCloudAccount: (id: string) =>
    request<IdResponse>(`/v1/cloud/accounts/${id}`, { method: "DELETE", allowEmptyResponse: true }),

  testCloudAccountConnection: (id: string) =>
    request<TestConnectionResponse>(`/v1/cloud/accounts/${id}/test`, { method: "POST" }),

  triggerCloudAccountCollection: (id: string) =>
    request<TriggerCollectionResponse>(`/v1/cloud/accounts/${id}/collect`, { method: "POST" }),

  listCloudInstances: (params?: CloudInstanceQueryParams) => {
    if (hasExplicitPaginationParams(params)) {
      return request<unknown>(`/v1/cloud/instances${buildQueryString(params || {})}`).then(
        (payload) => extractListPayload(payload) as CloudInstanceResponse[]
      )
    }

    const queryParams = {
      provider: params?.provider,
      region: params?.region,
      status: params?.status,
      search: params?.search,
    }

    return requestAllPages<CloudInstanceResponse>((page) =>
      request<unknown>(`/v1/cloud/instances${buildQueryString({ ...queryParams, ...page })}`).then(
        (payload) => extractListPayload(payload) as CloudInstanceResponse[]
      )
    )
  },

  listCloudInstancesPage: (params: CloudInstanceQueryParams = {}) =>
    request<unknown>(`/v1/cloud/instances${buildQueryString(params)}`).then((payload) =>
      normalizeListResponse<CloudInstanceResponse>(payload, {
        fallbackLimit: params.limit ?? 0,
        fallbackOffset: params.offset ?? 0,
      })
    ),

  getCloudInstanceDetail: (id: string) =>
    request<CloudInstanceDetailResponse>(`/v1/cloud/instances/${id}`),

  // System
  getSystemConfig: () =>
    request<RuntimeConfig>("/v1/system/config"),

  getStorageInfo: () =>
    request<StorageInfo>("/v1/system/storage"),

  triggerCleanup: () =>
    request("/v1/system/storage/cleanup", { method: "POST", allowEmptyResponse: true }),

  listSystemConfigs: (params?: SystemConfigQueryParams) => {
    if (hasExplicitPaginationParams(params)) {
      return request<unknown>(`/v1/system/configs${buildQueryString(params || {})}`).then((payload) =>
        extractListPayload(payload) as SystemConfigResponse[]
      )
    }

    const queryParams = {
      config_type: params?.config_type,
      config_key: params?.config_key,
      enabled: params?.enabled,
    }

    return requestAllPages<SystemConfigResponse>((page) =>
      request<unknown>(`/v1/system/configs${buildQueryString({ ...queryParams, ...page })}`).then((payload) =>
        extractListPayload(payload) as SystemConfigResponse[]
      )
    )
  },

  getSystemConfigById: (id: string) =>
    request<SystemConfigResponse>(`/v1/system/configs/${id}`),

  createSystemConfig: (data: CreateSystemConfigRequest) =>
    request<IdResponse>("/v1/system/configs", { method: "POST", body: data }),

  updateSystemConfig: (id: string, data: UpdateSystemConfigRequest) =>
    request<IdResponse>(`/v1/system/configs/${id}`, { method: "PUT", body: data }),

  deleteSystemConfig: (id: string) =>
    request<IdResponse>(`/v1/system/configs/${id}`, { method: "DELETE" }),

  // Dictionaries
  listDictionaryTypes: (params?: DictionaryTypeQueryParams) => {
    if (hasExplicitPaginationParams(params)) {
      return request<unknown>(`/v1/dictionaries/types${buildQueryString(params || {})}`).then(
        (payload) => extractListPayload(payload) as DictionaryTypeSummary[]
      )
    }

    const queryParams = {
      dict_type__contains: params?.dict_type__contains,
    }

    return requestAllPages<DictionaryTypeSummary>((page) =>
      request<unknown>(`/v1/dictionaries/types${buildQueryString({ ...queryParams, ...page })}`).then(
        (payload) => extractListPayload(payload) as DictionaryTypeSummary[]
      )
    )
  },

  createDictionaryType: (data: CreateDictionaryTypeRequest) =>
    request<IdResponse>("/v1/dictionaries/types", { method: "POST", body: data }),

  updateDictionaryType: (dictType: string, data: UpdateDictionaryTypeRequest) =>
    request<IdResponse>(`/v1/dictionaries/types/${encodeURIComponent(dictType)}`, { method: "PUT", body: data }),

  deleteDictionaryType: (dictType: string) =>
    request<IdResponse>(`/v1/dictionaries/types/${encodeURIComponent(dictType)}`, { method: "DELETE" }),

  listDictionariesByType: async (
    dictType: string,
    enabledOnly = false,
    params?: PaginationParams,
    filters?: Omit<DictionaryByTypeQueryParams, "limit" | "offset" | "enabled_only">
  ) => {
    const encodedType = encodeURIComponent(dictType)

    const requestDictionaryPage = (page: Required<PaginationFetchConfig>) =>
      request<unknown>(`/v1/dictionaries/type/${encodedType}${buildQueryString({
        enabled_only: enabledOnly,
        key__contains: filters?.key__contains,
        label__contains: filters?.label__contains,
        ...page,
      })}`).then(
        (payload) => extractListPayload(payload) as DictionaryItem[]
      )

    if (params) {
      return requestDictionaryPage({
        limit: Math.max(1, params.limit ?? 200),
        offset: Math.max(0, params.offset ?? 0),
      })
    }

    return requestAllPages<DictionaryItem>(requestDictionaryPage)
  },

  createDictionary: (data: CreateDictionaryRequest) =>
    request<IdResponse>("/v1/dictionaries", { method: "POST", body: data }),

  getDictionary: (id: string) =>
    request<DictionaryItem>(`/v1/dictionaries/${id}`),

  updateDictionary: (id: string, data: UpdateDictionaryRequest) =>
    request<IdResponse>(`/v1/dictionaries/${id}`, { method: "PUT", body: data }),

  deleteDictionary: (id: string) =>
    request<IdResponse>(`/v1/dictionaries/${id}`, { method: "DELETE" }),

  // Auth - Security
  changePassword: (data: ChangePasswordRequest) =>
    request("/v1/auth/password", { method: "POST", body: data, allowEmptyResponse: true }),

  // Certificates - Advanced
  getCertificateChain: (id: string) =>
    request<CertificateChainInfo>(`/v1/certificates/${id}/chain`),

  checkAllDomains: () =>
    request<unknown>("/v1/certs/check", { method: "POST" }).then((payload) =>
      extractListPayload(payload) as CertCheckResult[]
    ),

  listDomains: (params: PaginationParams & { enabled__eq?: boolean; domain__contains?: string } = {}) =>
    request<unknown>(`/v1/certs/domains${buildQueryString(params)}`).then((payload) =>
      normalizeListResponse<CertDomain>(payload, {
        fallbackLimit: params.limit ?? 0,
        fallbackOffset: params.offset ?? 0,
      })
    ),

  createDomain: (data: CreateDomainRequest) =>
    request<IdResponse>("/v1/certs/domains", { method: "POST", body: data }),

  createDomainsBatch: (data: BatchCreateDomainsRequest) =>
    request<unknown>("/v1/certs/domains/batch", { method: "POST", body: data }).then((payload) =>
      extractListPayload(payload) as IdResponse[]
    ),

  getDomain: (id: string) =>
    request<CertDomain>(`/v1/certs/domains/${id}`),

  updateDomain: (id: string, data: UpdateDomainRequest) =>
    request<IdResponse>(`/v1/certs/domains/${id}`, { method: "PUT", body: data }),

  deleteDomain: (id: string) =>
    request<IdResponse>(`/v1/certs/domains/${id}`, { method: "DELETE" }),

  checkSingleDomain: (id: string) =>
    request<CertCheckResult>(`/v1/certs/domains/${id}/check`, { method: "POST" }),

  getCertCheckHistory: (id: string, params: PaginationParams = {}) =>
    request<unknown>(`/v1/certs/domains/${id}/history${buildQueryString(params)}`).then((payload) =>
      extractListPayload(payload) as CertCheckResult[]
    ),

  getCertStatusAll: (params: CertStatusQueryParams = {}) =>
    request<unknown>(`/v1/certs/status${buildQueryString(params)}`).then((payload) =>
      normalizeListResponse<CertCheckResult>(payload, {
        fallbackLimit: params.limit ?? 0,
        fallbackOffset: params.offset ?? 0,
      })
    ),

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
    request<unknown>(`/v1/metrics${buildQueryString(params)}`).then((payload) =>
      extractListPayload(payload) as MetricDataPointResponse[]
    ),

  getMetricAgents: (params?: MetricCatalogQueryParams) => {
    const requestMetricAgentPage = (page: Required<PaginationFetchConfig>) =>
      request<unknown>(`/v1/metrics/agents${buildQueryString({
        timestamp__gte: params?.timestamp__gte,
        timestamp__lte: params?.timestamp__lte,
        ...page,
      })}`).then((payload) => toStringList(payload))

    if (hasExplicitPaginationParams(params)) {
      return requestMetricAgentPage(toPageFetchConfig(params))
    }

    return requestAllPages<string>(requestMetricAgentPage).then((items) =>
      Array.from(new Set(items))
    )
  },

  getMetricNames: (params?: MetricCatalogQueryParams) => {
    const requestMetricNamePage = (page: Required<PaginationFetchConfig>) =>
      request<unknown>(`/v1/metrics/names${buildQueryString({
        timestamp__gte: params?.timestamp__gte,
        timestamp__lte: params?.timestamp__lte,
        ...page,
      })}`).then((payload) => toStringList(payload))

    if (hasExplicitPaginationParams(params)) {
      return requestMetricNamePage(toPageFetchConfig(params))
    }

    return requestAllPages<string>(requestMetricNamePage).then((items) =>
      Array.from(new Set(items))
    )
  },

  getMetricSummary: (params: { agent_id: string; metric_name: string; timestamp__gte?: string; timestamp__lte?: string }) =>
    request<MetricSummaryResponse>(`/v1/metrics/summary${buildQueryString(params)}`),

  createChannelConfig: (data: CreateChannelRequest) =>
    request<IdResponse>("/v1/notifications/channels", { method: "POST", body: data }),

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
    request<IdResponse>(`/v1/notifications/channels/${id}`, { method: "DELETE" }),

  getRecipients: (id: string, params?: PaginationParams) => {
    void params

    return request<ChannelOverview>(`/v1/notifications/channels/${id}`)
      .then((channel) => channel.recipients || [])
  },

  setRecipients: (id: string, data: SetRecipientsRequest) =>
    request<IdResponse>(`/v1/notifications/channels/${id}`, {
      method: "PUT",
      body: { recipients: data.recipients },
    }),

  testChannel: (id: string) =>
    request(`/v1/notifications/channels/${id}/test`, { method: "POST", allowEmptyResponse: true }),

  listSilenceWindows: (params: SilenceWindowQueryParams = {}) =>
    request<unknown>(`/v1/notifications/silence-windows${buildQueryString(params)}`).then((items) =>
      extractListPayload(items)
        .map((item) => normalizeSilenceWindow(item))
        .filter((item): item is SilenceWindow => Boolean(item))
    ),

  getNotificationLogs: (params: NotificationLogQueryParams = {}) =>
    request<NotificationLogListResponse>(`/v1/notifications/logs${buildQueryString(params)}`),

  getNotificationLogById: (id: string) =>
    request<NotificationLogItem>(`/v1/notifications/logs/${id}`),

  getNotificationLogSummary: (params: NotificationLogSummaryQueryParams = {}) =>
    request<NotificationLogSummaryResponse>(`/v1/notifications/logs/summary${buildQueryString(params)}`),

  createSilenceWindow: (data: CreateSilenceWindowRequest) =>
    request<IdResponse>("/v1/notifications/silence-windows", { method: "POST", body: data }),

  deleteSilenceWindow: (id: string) =>
    request<IdResponse>(`/v1/notifications/silence-windows/${id}`, { method: "DELETE" }),

  getSilenceWindowById: (id: string) =>
    request<unknown>(`/v1/notifications/silence-windows/${id}`).then((item) => {
      const normalized = normalizeSilenceWindow(item)

      if (!normalized) {
        throw new ApiRequestError("Invalid silence window response format", { status: 200 })
      }

      return normalized
    }),

  updateSilenceWindow: (id: string, data: UpdateSilenceWindowRequest) =>
    request<IdResponse>(`/v1/notifications/silence-windows/${id}`, { method: "PUT", body: data }),

  setAlertRuleEnabled: (id: string, data: EnableRequest) =>
    request<IdResponse>(`/v1/alerts/rules/${id}/enable`, { method: "PUT", body: data }),

  getAlertRule: (id: string) =>
    request<unknown>(`/v1/alerts/rules/${id}`).then((result) => {
      const normalized = normalizeAlertRuleDetail(result)

      if (!normalized) {
        throw new ApiRequestError("Invalid alert rule response format", { status: 200 })
      }

      return normalized
    }),

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
    request<AlertSummary>(`/v1/alerts/summary${buildQueryString(params || {})}`),

  getHealth: () =>
    request<HealthResponse>("/v1/health", { requiresAuth: false }),
}

export { getApiErrorMessage }
