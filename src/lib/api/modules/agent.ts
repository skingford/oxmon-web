import {
  AddAgentRequest,
  AddAgentResponse,
  AgentDetail,
  AgentResponse,
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

export interface AgentApiModule {
  getAgents: (params?: PaginationParams) => Promise<ListResponse<AgentResponse>>
  getAgentById: (id: string, token?: string) => Promise<AgentDetail>
  updateAgent: (id: string, data: UpdateAgentRequest, token?: string) => Promise<IdResponse>
  deleteAgent: (id: string, token?: string) => Promise<IdResponse>
  getWhitelist: (params?: PaginationParams) => Promise<ListResponse<AgentWhitelistDetail>>
  getWhitelistById: (id: string, token?: string) => Promise<AgentWhitelistDetail>
  addWhitelistAgent: (data: AddAgentRequest, token?: string) => Promise<AddAgentResponse>
  updateWhitelistAgent: (id: string, data: UpdateAgentRequest, token?: string) => Promise<IdResponse>
  deleteWhitelistAgent: (id: string, token?: string) => Promise<IdResponse>
  regenerateToken: (id: string, token?: string) => Promise<RegenerateTokenResponse>
  getAgentLatestMetrics: (id: string, token?: string) => Promise<LatestMetric[]>
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

  if (Array.isArray(source)) {
    return source
      .map((item) => normalizeAgent(item))
      .filter((item): item is AgentResponse => Boolean(item))
  }

  const nestedData = toObject(record.data)

  if (!nestedData) {
    return []
  }

  const nestedCandidates = [
    nestedData.items,
    nestedData.agents,
    nestedData.results,
    nestedData.rows,
    nestedData.list,
  ]
  const nestedSource = nestedCandidates.find((value) => Array.isArray(value))

  if (!Array.isArray(nestedSource)) {
    return []
  }

  return nestedSource
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

  if (Array.isArray(source)) {
    return source
      .map((item) => normalizeWhitelistAgent(item))
      .filter((item): item is AgentWhitelistDetail => Boolean(item))
  }

  const nestedData = toObject(record.data)

  if (!nestedData) {
    return []
  }

  const nestedCandidates = [
    nestedData.items,
    nestedData.agents,
    nestedData.results,
    nestedData.rows,
    nestedData.list,
  ]
  const nestedSource = nestedCandidates.find((value) => Array.isArray(value))

  if (!Array.isArray(nestedSource)) {
    return []
  }

  return nestedSource
    .map((item) => normalizeWhitelistAgent(item))
    .filter((item): item is AgentWhitelistDetail => Boolean(item))
}

function normalizeListMeta(payload: unknown, fallbackLimit = 0, fallbackOffset = 0) {
  const record = toObject(payload)
  const nestedData = record ? toObject(record.data) : null
  const source = nestedData || record

  const total = toNullableNumber(source?.total)
  const limit = toNullableNumber(source?.limit)
  const offset = toNullableNumber(source?.offset)

  return {
    total: total === null ? 0 : Math.max(0, Math.trunc(total)),
    limit: limit === null ? Math.max(0, fallbackLimit) : Math.max(0, Math.trunc(limit)),
    offset: offset === null ? Math.max(0, fallbackOffset) : Math.max(0, Math.trunc(offset)),
  }
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

export function createAgentApiModule({ request, buildQueryString }: AgentApiModuleDeps): AgentApiModule {
  const getAgents = (params: PaginationParams = {}) =>
    request<unknown>(`/v1/agents${buildQueryString(params)}`).then((result) => {
      const items = normalizeAgentList(result)
      const fallbackLimit = params.limit ?? items.length
      const fallbackOffset = params.offset ?? 0
      const meta = normalizeListMeta(result, fallbackLimit, fallbackOffset)

      return {
        items,
        total: meta.total || items.length,
        limit: meta.limit || fallbackLimit,
        offset: meta.offset || fallbackOffset,
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

  const getWhitelist = (params: PaginationParams = {}) =>
    request<unknown>(`/v1/agents/whitelist${buildQueryString(params)}`).then((result) => {
      const items = normalizeWhitelistList(result)
      const fallbackLimit = params.limit ?? items.length
      const fallbackOffset = params.offset ?? 0
      const meta = normalizeListMeta(result, fallbackLimit, fallbackOffset)

      return {
        items,
        total: meta.total || items.length,
        limit: meta.limit || fallbackLimit,
        offset: meta.offset || fallbackOffset,
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
    request<unknown>(`/v1/agents/${encodeURIComponent(id)}/latest`, { token }).then((payload) =>
      extractListPayload(payload) as LatestMetric[]
    )

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
  }
}
