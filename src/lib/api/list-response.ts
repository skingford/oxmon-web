import { ListResponse } from "@/types/api"

export type NormalizedListPayload<T> = {
  items: T[]
  total?: number
  limit?: number
  offset?: number
}

export function normalizeListPayload<T>(payload: unknown): NormalizedListPayload<T> {
  if (Array.isArray(payload)) {
    return { items: payload as T[], total: payload.length }
  }

  if (!payload || typeof payload !== "object") {
    throw new Error("Invalid API list response format")
  }

  const record = payload as Record<string, unknown>

  if (Array.isArray(record.items)) {
    return {
      items: record.items as T[],
      total: typeof record.total === "number" ? record.total : record.items.length,
      limit: typeof record.limit === "number" ? record.limit : undefined,
      offset: typeof record.offset === "number" ? record.offset : undefined,
    }
  }

  if (Array.isArray(record.data)) {
    return {
      items: record.data as T[],
      total: typeof record.total === "number" ? record.total : record.data.length,
      limit: typeof record.limit === "number" ? record.limit : undefined,
      offset: typeof record.offset === "number" ? record.offset : undefined,
    }
  }

  if (record.data && typeof record.data === "object") {
    const nested = record.data as Record<string, unknown>

    if (Array.isArray(nested.items)) {
      return {
        items: nested.items as T[],
        total:
          typeof nested.total === "number"
            ? nested.total
            : typeof record.total === "number"
              ? record.total
              : nested.items.length,
        limit:
          typeof nested.limit === "number"
            ? nested.limit
            : typeof record.limit === "number"
              ? record.limit
              : undefined,
        offset:
          typeof nested.offset === "number"
            ? nested.offset
            : typeof record.offset === "number"
              ? record.offset
              : undefined,
      }
    }
  }

  throw new Error("Invalid API list response format")
}

export function extractListItemsPayload<T>(payload: unknown): T[] {
  return normalizeListPayload<T>(payload).items
}

export function toListResponse<T>(
  payloadOrItems: unknown,
  options: { fallbackLimit?: number; fallbackOffset?: number } = {},
): ListResponse<T> {
  const normalized = Array.isArray(payloadOrItems)
    ? ({ items: payloadOrItems as T[], total: (payloadOrItems as T[]).length } satisfies NormalizedListPayload<T>)
    : normalizeListPayload<T>(payloadOrItems)

  return {
    items: normalized.items,
    total: normalized.total ?? normalized.items.length,
    limit: normalized.limit ?? options.fallbackLimit ?? normalized.items.length,
    offset: normalized.offset ?? options.fallbackOffset ?? 0,
  }
}
