import {
  AddAgentRequest,
  AddAgentResponse,
  AgentDetail,
  AgentListQueryParams,
  AgentReportLogItem,
  AgentReportLogQueryParams,
  AgentResponse,
  AgentWhitelistQueryParams,
  AgentWhitelistDetail,
  IdResponse,
  LatestMetric,
  ListResponse,
  PaginationParams,
  RegenerateTokenResponse,
  UpdateAgentRequest,
} from "@/types/api"

type HttpMethod = "GET" | "POST" | "PUT" | "DELETE"

interface RequestConfig {
  method?: HttpMethod
  body?: unknown
  token?: string
  requiresAuth?: boolean
  allowEmptyResponse?: boolean
}

interface AgentApiModuleDeps {
  request: <T>(endpoint: string, config?: RequestConfig) => Promise<T>
  buildQueryString: (params: Record<string, unknown> | PaginationParams) => string
}

function resolveListItems<T>(payload: unknown): T[] {
  if (Array.isArray(payload)) {
    return payload as T[]
  }

  const record = payload as any

  if (Array.isArray(record?.items)) {
    return record.items as T[]
  }

  if (Array.isArray(record?.data?.items)) {
    return record.data.items as T[]
  }

  if (Array.isArray(record?.data)) {
    return record.data as T[]
  }

  return []
}

export interface AgentApiModule {
  getAgents: (params?: AgentListQueryParams) => Promise<ListResponse<AgentResponse>>
  getAgentById: (id: string, token?: string) => Promise<AgentDetail>
  updateAgent: (id: string, data: UpdateAgentRequest, token?: string) => Promise<IdResponse>
  deleteAgent: (id: string, token?: string) => Promise<IdResponse>
  getWhitelist: (params?: AgentWhitelistQueryParams) => Promise<ListResponse<AgentWhitelistDetail>>
  getWhitelistById: (id: string, token?: string) => Promise<AgentWhitelistDetail>
  addWhitelistAgent: (data: AddAgentRequest, token?: string) => Promise<AddAgentResponse>
  updateWhitelistAgent: (id: string, data: UpdateAgentRequest, token?: string) => Promise<IdResponse>
  deleteWhitelistAgent: (id: string, token?: string) => Promise<IdResponse>
  regenerateToken: (id: string, token?: string) => Promise<RegenerateTokenResponse>
  getAgentLatestMetrics: (id: string, token?: string) => Promise<LatestMetric[]>
  getAgentReportLogs: (
    id: string,
    params?: AgentReportLogQueryParams,
    token?: string
  ) => Promise<ListResponse<AgentReportLogItem>>
}

export function createAgentApiModule({ request, buildQueryString }: AgentApiModuleDeps): AgentApiModule {
  const getAgents = (params: AgentListQueryParams = {}) =>
    request<AgentResponse[]>(`/v1/agents${buildQueryString(params)}`).then((result) => {
      const items = resolveListItems<AgentResponse>(result)
      const fallbackLimit = params.limit ?? items.length
      const fallbackOffset = params.offset ?? 0
      return {
        items,
        total: (result as any).total ?? (result as any).data?.total ?? items.length,
        limit: (result as any).limit ?? fallbackLimit,
        offset: (result as any).offset ?? fallbackOffset,
      }
    })

  const getAgentById = (id: string, token?: string) =>
    request<AgentDetail>(`/v1/agents/${encodeURIComponent(id)}`, { token })

  const updateAgent = (id: string, data: UpdateAgentRequest, token?: string) =>
    request<IdResponse>(`/v1/agents/${encodeURIComponent(id)}`, {
      method: "PUT",
      body: data,
      token,
    })

  const deleteAgent = (id: string, token?: string) =>
    request<IdResponse>(`/v1/agents/${encodeURIComponent(id)}`, {
      method: "DELETE",
      token,
    })

  const getWhitelist = (params: AgentWhitelistQueryParams = {}) =>
    request<AgentWhitelistDetail[]>(`/v1/agents/whitelist${buildQueryString(params)}`).then((result) => {
      const items = resolveListItems<AgentWhitelistDetail>(result)
      const fallbackLimit = params.limit ?? items.length
      const fallbackOffset = params.offset ?? 0
      return {
        items,
        total: (result as any).total ?? (result as any).data?.total ?? items.length,
        limit: (result as any).limit ?? fallbackLimit,
        offset: (result as any).offset ?? fallbackOffset,
      }
    })

  const getWhitelistById = (id: string, token?: string) =>
    request<AgentWhitelistDetail>(`/v1/agents/whitelist/${encodeURIComponent(id)}`, { token })

  const addWhitelistAgent = (data: AddAgentRequest, token?: string) =>
    request<AddAgentResponse>("/v1/agents/whitelist", {
      method: "POST",
      body: data,
      token,
    })

  const updateWhitelistAgent = (id: string, data: UpdateAgentRequest, token?: string) =>
    request<IdResponse>(`/v1/agents/whitelist/${encodeURIComponent(id)}`, {
      method: "PUT",
      body: data,
      token,
    })

  const deleteWhitelistAgent = (id: string, token?: string) =>
    request<IdResponse>(`/v1/agents/whitelist/${encodeURIComponent(id)}`, {
      method: "DELETE",
      token,
    })

  const regenerateToken = (id: string, token?: string) =>
    request<RegenerateTokenResponse>(`/v1/agents/whitelist/${encodeURIComponent(id)}/token`, {
      method: "POST",
      token,
    })

  const getAgentLatestMetrics = (id: string, token?: string) =>
    request<LatestMetric[]>(`/v1/agents/${encodeURIComponent(id)}/latest`, { token })
      .then((result) => resolveListItems<LatestMetric>(result))

  const getAgentReportLogs = (
    id: string,
    params: AgentReportLogQueryParams = {},
    token?: string
  ) =>
    request<unknown>(
      `/v1/agents/${encodeURIComponent(id)}/report-logs${buildQueryString(params)}`,
      { token }
    ).then((result) => {
      const record = result as any
      const normalizedItems = resolveListItems<AgentReportLogItem>(result)
      const fallbackLimit = params.limit ?? normalizedItems.length
      const fallbackOffset = params.offset ?? 0

      return {
        items: normalizedItems,
        total: record?.total ?? record?.data?.total ?? normalizedItems.length,
        limit: record?.limit ?? fallbackLimit,
        offset: record?.offset ?? fallbackOffset,
      }
    })

  return {
    getAgents,
    getAgentById,
    updateAgent,
    deleteAgent,
    getWhitelist,
    getWhitelistById,
    addWhitelistAgent,
    updateWhitelistAgent,
    deleteWhitelistAgent,
    regenerateToken,
    getAgentLatestMetrics,
    getAgentReportLogs,
  }
}
