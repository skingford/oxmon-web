import {
  AddAgentRequest,
  AddAgentResponse,
  AgentDetail,
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
  allowEmptyResponse?: boolean
}

interface AgentApiModuleDeps {
  request: <T>(endpoint: string, config?: RequestConfig) => Promise<T>
  buildQueryString: (params: Record<string, unknown> | PaginationParams) => string
}

export interface AgentApiModule {
  getAgents: (params?: PaginationParams) => Promise<AgentResponse[]>
  getAgentById: (id: string, token?: string) => Promise<AgentDetail>
  getWhitelist: (params?: PaginationParams) => Promise<AgentWhitelistDetail[]>
  getWhitelistById: (id: string, token?: string) => Promise<AgentWhitelistDetail>
  addWhitelistAgent: (data: AddAgentRequest, token?: string) => Promise<AddAgentResponse>
  updateWhitelistAgent: (id: string, data: UpdateAgentRequest, token?: string) => Promise<AgentWhitelistDetail>
  deleteWhitelistAgent: (id: string, token?: string) => Promise<void>
  regenerateToken: (id: string, token?: string) => Promise<RegenerateTokenResponse>
  getAgentLatestMetrics: (id: string, token?: string) => Promise<LatestMetric[]>
  updateAgent: (id: string, data: UpdateAgentRequest, token?: string) => Promise<AgentWhitelistDetail>
}

function toObject(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null
  }

  return value as Record<string, unknown>
}

function toNullableString(value: unknown): string | null {
  if (typeof value === "string") {
    return value
  }

  if (value === null || value === undefined) {
    return null
  }

  return String(value)
}

function normalizeAgent(value: unknown): AgentResponse | null {
  const record = toObject(value)

  if (!record) {
    return null
  }

  const agentId = toNullableString(record.agent_id)?.trim()
  const status = toNullableString(record.status)?.trim()

  if (!agentId || !status) {
    return null
  }

  const rawInterval = record.collection_interval_secs
  let collectionIntervalSecs: number | null | undefined

  if (typeof rawInterval === "number" && Number.isFinite(rawInterval)) {
    collectionIntervalSecs = rawInterval
  } else if (typeof rawInterval === "string") {
    const parsed = Number(rawInterval)
    collectionIntervalSecs = Number.isFinite(parsed) ? parsed : null
  } else if (rawInterval === null || rawInterval === undefined) {
    collectionIntervalSecs = rawInterval as null | undefined
  } else {
    collectionIntervalSecs = null
  }

  return {
    id: toNullableString(record.id) || undefined,
    agent_id: agentId,
    status,
    last_seen: toNullableString(record.last_seen),
    created_at: toNullableString(record.created_at) || undefined,
    collection_interval_secs: collectionIntervalSecs,
  }
}

function normalizeAgentList(payload: unknown): AgentResponse[] {
  if (Array.isArray(payload)) {
    return payload
      .map((item) => normalizeAgent(item))
      .filter((item): item is AgentResponse => Boolean(item))
  }

  const record = toObject(payload)

  if (!record) {
    return []
  }

  const candidates = [record.items, record.agents, record.results, record.rows, record.list]
  const source = candidates.find((value) => Array.isArray(value))

  if (!Array.isArray(source)) {
    return []
  }

  return source
    .map((item) => normalizeAgent(item))
    .filter((item): item is AgentResponse => Boolean(item))
}

function toNullableNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value
  }

  if (typeof value === "string") {
    const parsed = Number(value)
    return Number.isFinite(parsed) ? parsed : null
  }

  return null
}

function normalizeWhitelistAgent(value: unknown): AgentWhitelistDetail | null {
  const record = toObject(value)

  if (!record) {
    return null
  }

  const id = toNullableString(record.id)?.trim()
  const agentId = toNullableString(record.agent_id)?.trim()

  if (!id || !agentId) {
    return null
  }

  return {
    id,
    agent_id: agentId,
    created_at: toNullableString(record.created_at) || "",
    updated_at: toNullableString(record.updated_at) || "",
    description: toNullableString(record.description),
    token: toNullableString(record.token),
    collection_interval_secs: toNullableNumber(record.collection_interval_secs),
    last_seen: toNullableString(record.last_seen),
    status: toNullableString(record.status) || "unknown",
  }
}

function normalizeWhitelistList(payload: unknown): AgentWhitelistDetail[] {
  if (Array.isArray(payload)) {
    return payload
      .map((item) => normalizeWhitelistAgent(item))
      .filter((item): item is AgentWhitelistDetail => Boolean(item))
  }

  const record = toObject(payload)

  if (!record) {
    return []
  }

  const candidates = [record.items, record.agents, record.results, record.rows, record.list]
  const source = candidates.find((value) => Array.isArray(value))

  if (!Array.isArray(source)) {
    return []
  }

  return source
    .map((item) => normalizeWhitelistAgent(item))
    .filter((item): item is AgentWhitelistDetail => Boolean(item))
}

export function createAgentApiModule({ request, buildQueryString }: AgentApiModuleDeps): AgentApiModule {
  const getAgents = (params: PaginationParams = {}) =>
    request<unknown>(`/v1/agents${buildQueryString(params)}`).then((result) =>
      normalizeAgentList(result)
    )

  const getAgentById = (id: string, token?: string) =>
    request<AgentDetail>(`/v1/agents/${encodeURIComponent(id)}`, { token })

  const getWhitelist = (params: PaginationParams = {}) =>
    request<unknown>(`/v1/agents/whitelist${buildQueryString(params)}`).then((result) =>
      normalizeWhitelistList(result)
    )

  const getWhitelistById = (id: string, token?: string) =>
    request<AgentWhitelistDetail>(`/v1/agents/whitelist/${encodeURIComponent(id)}`, { token })

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
      allowEmptyResponse: true,
    })

  const regenerateToken = (id: string, token?: string) =>
    request<RegenerateTokenResponse>(`/v1/agents/whitelist/${id}/token`, {
      method: "POST",
      token,
    })

  const getAgentLatestMetrics = (id: string, token?: string) =>
    request<LatestMetric[]>(`/v1/agents/${encodeURIComponent(id)}/latest`, { token })

  const updateAgent = (id: string, data: UpdateAgentRequest, token?: string) =>
    updateWhitelistAgent(id, data, token)

  return {
    getAgents,
    getAgentById,
    getWhitelist,
    getWhitelistById,
    addWhitelistAgent,
    updateWhitelistAgent,
    deleteWhitelistAgent,
    regenerateToken,
    getAgentLatestMetrics,
    updateAgent,
  }
}
