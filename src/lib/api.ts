import {
  AddAgentRequest,
  AddAgentResponse,
  AgentResponse,
  AgentWhitelistDetail,
  AlertEventResponse,
  AlertRuleDetailResponse,
  AlertRuleResponse,
  ApiResponseEnvelope,
  CertificateDetails,
  ChannelOverview,
  CreateAlertRuleRequest,
  DashboardOverview,
  LatestMetric,
  LoginRequest,
  LoginResponse,
  PaginationParams,
  RuntimeConfig,
  StorageInfo,
} from "@/types/api"
import { clearAuthToken, getAuthToken, normalizeAuthToken } from "@/lib/auth-token"

const BASE_URL = ""

type HttpMethod = "GET" | "POST" | "PUT" | "DELETE"

interface RequestConfig {
  method?: HttpMethod
  body?: unknown
  token?: string
  requiresAuth?: boolean
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

function buildQueryString(params: Record<string, unknown> | PaginationParams) {
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
  const { method = "GET", body, token, requiresAuth = true } = config
  const headers: Record<string, string> = {}

  if (body !== undefined) {
    headers["Content-Type"] = "application/json"
  }

  const authToken = normalizeAuthToken(token) || getAuthToken()

  if (requiresAuth && authToken) {
    headers.Authorization = `Bearer ${authToken}`
  }

  const response = await fetch(`${BASE_URL}${endpoint}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  })

  if (response.status === 401) {
    if (typeof window !== "undefined") {
      clearAuthToken()

      if (window.location.pathname !== "/login") {
        window.location.replace("/login")
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

  return resolveEnvelopeData<T>(payload, response.status)
}

export const api = {
  login: (credentials: LoginRequest) =>
    request<LoginResponse>("/v1/auth/login", {
      method: "POST",
      body: credentials,
      requiresAuth: false,
    }),

  getAgents: (params: PaginationParams) =>
    request<AgentResponse[]>(`/v1/agents${buildQueryString(params)}`),

  getWhitelist: (params: PaginationParams) =>
    request<AgentWhitelistDetail[]>(`/v1/agents/whitelist${buildQueryString(params)}`),

  addWhitelistAgent: (data: AddAgentRequest, token: string) =>
    request<AddAgentResponse>("/v1/agents/whitelist", {
      method: "POST",
      body: data,
      token,
    }),

  deleteWhitelistAgent: (id: string, token: string) =>
    request<{ description: string }>(`/v1/agents/whitelist/${id}`, {
      method: "DELETE",
      token,
    }),

  regenerateToken: (id: string, token: string) =>
    request<{ token: string }>(`/v1/agents/whitelist/${id}/token`, {
      method: "POST",
      token,
    }),

  getAgentLatestMetrics: (id: string, token: string) =>
    request<LatestMetric[]>(`/v1/agents/${id}/latest`, { token }),

  getActiveAlerts: (params: PaginationParams) =>
    request<AlertEventResponse[]>(`/v1/alerts/active${buildQueryString(params)}`),

  getAlertHistory: (params: PaginationParams & { agent_id__eq?: string; severity__eq?: string }) =>
    request<AlertEventResponse[]>(`/v1/alerts/history${buildQueryString(params)}`),

  acknowledgeAlert: (id: string, token?: string) =>
    request(`/v1/alerts/history/${id}/acknowledge`, {
      method: "POST",
      token,
    }),

  resolveAlert: (id: string, token?: string) =>
    request(`/v1/alerts/history/${id}/resolve`, {
      method: "POST",
      token,
    }),

  getAlertRules: (params: PaginationParams) =>
    request<AlertRuleResponse[]>(`/v1/alerts/rules${buildQueryString(params)}`),

  createAlertRule: (data: CreateAlertRuleRequest, token: string) =>
    request<AlertRuleDetailResponse>("/v1/alerts/rules", {
      method: "POST",
      body: data,
      token,
    }),

  getAlertRulesConfig: (params: PaginationParams) =>
    request<AlertRuleDetailResponse[]>(`/v1/alerts/rules/config${buildQueryString(params)}`),

  // Dashboard
  getDashboardOverview: () =>
    request<DashboardOverview>("/v1/dashboard/overview"),

  // Certificates
  getCertificates: (params: PaginationParams & { not_after__lte?: number; ip_address__contains?: string; issuer__contains?: string }) =>
    request<CertificateDetails[]>(`/v1/certificates${buildQueryString(params)}`),

  getCertificate: (id: string) =>
    request<CertificateDetails>(`/v1/certificates/${id}`),

  // Notifications
  listChannels: (params: PaginationParams) =>
    request<ChannelOverview[]>(`/v1/notifications/channels${buildQueryString(params)}`),

  // System
  getSystemConfig: () =>
    request<RuntimeConfig>("/v1/system/config"),

  getStorageInfo: () =>
    request<StorageInfo>("/v1/system/storage"),

  triggerCleanup: () =>
    request("/v1/system/storage/cleanup", { method: "POST" }),
}

export { getApiErrorMessage }
