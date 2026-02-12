import {
  AddAgentRequest,
  AddAgentResponse,
  AgentResponse,
  AgentWhitelistDetail,
  LatestMetric,
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
}

interface AgentApiModuleDeps {
  request: <T>(endpoint: string, config?: RequestConfig) => Promise<T>
  buildQueryString: (params: Record<string, unknown> | PaginationParams) => string
}

export interface AgentApiModule {
  getAgents: (params?: PaginationParams) => Promise<AgentResponse[]>
  getWhitelist: (params?: PaginationParams) => Promise<AgentWhitelistDetail[]>
  addWhitelistAgent: (data: AddAgentRequest, token?: string) => Promise<AddAgentResponse>
  updateWhitelistAgent: (id: string, data: UpdateAgentRequest, token?: string) => Promise<AgentWhitelistDetail>
  deleteWhitelistAgent: (id: string, token?: string) => Promise<void>
  regenerateToken: (id: string, token?: string) => Promise<RegenerateTokenResponse>
  getAgentLatestMetrics: (id: string, token?: string) => Promise<LatestMetric[]>
  updateAgent: (id: string, data: UpdateAgentRequest, token?: string) => Promise<AgentWhitelistDetail>
}

export function createAgentApiModule({ request, buildQueryString }: AgentApiModuleDeps): AgentApiModule {
  const getAgents = (params: PaginationParams = {}) =>
    request<AgentResponse[]>(`/v1/agents${buildQueryString(params)}`)

  const getWhitelist = (params: PaginationParams = {}) =>
    request<AgentWhitelistDetail[]>(`/v1/agents/whitelist${buildQueryString(params)}`)

  const addWhitelistAgent = (data: AddAgentRequest, token?: string) =>
    request<AddAgentResponse>("/v1/agents/whitelist", {
      method: "POST",
      body: data,
      token,
    })

  const updateWhitelistAgent = (id: string, data: UpdateAgentRequest, token?: string) =>
    request<AgentWhitelistDetail>(`/v1/agents/whitelist/${id}`, {
      method: "PUT",
      body: data,
      token,
    })

  const deleteWhitelistAgent = (id: string, token?: string) =>
    request<void>(`/v1/agents/whitelist/${id}`, {
      method: "DELETE",
      token,
    })

  const regenerateToken = (id: string, token?: string) =>
    request<RegenerateTokenResponse>(`/v1/agents/whitelist/${id}/token`, {
      method: "POST",
      token,
    })

  const getAgentLatestMetrics = (id: string, token?: string) =>
    request<LatestMetric[]>(`/v1/agents/${id}/latest`, { token })

  const updateAgent = (id: string, data: UpdateAgentRequest, token?: string) =>
    updateWhitelistAgent(id, data, token)

  return {
    getAgents,
    getWhitelist,
    addWhitelistAgent,
    updateWhitelistAgent,
    deleteWhitelistAgent,
    regenerateToken,
    getAgentLatestMetrics,
    updateAgent,
  }
}
