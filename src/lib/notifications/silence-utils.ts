import type { AppNamespaceTranslator } from "@/hooks/use-app-translations"
import type { CreateSilenceWindowRequest, SilenceWindow } from "@/types/api"

export type SilenceStatus = "active" | "scheduled" | "expired" | "unknown"
export type SilenceStatusFilter = "all" | SilenceStatus
export type WindowOriginMode = "replaced" | "cloned"
export type WindowOriginModeFilter = "all" | WindowOriginMode

export type SilenceFormState = {
  startTime: string
  endTime: string
  recurrence: string
}

export type WindowOriginMeta = {
  sourceId: string
  mode: WindowOriginMode
  createdAt: number
}

export const DAY_IN_MS = 24 * 60 * 60 * 1000
export const WINDOW_ORIGIN_TTL_OPTIONS = [1, 7, 30] as const
export type WindowOriginTtlDays = (typeof WINDOW_ORIGIN_TTL_OPTIONS)[number]
export const WINDOW_ORIGIN_TTL_DEFAULT_DAYS = 7
export const WINDOW_ORIGIN_STORAGE_KEY = "oxmon.notifications.silence.window-origins.v1"
export const WINDOW_ORIGIN_TTL_STORAGE_KEY = "oxmon.notifications.silence.window-origins.ttl-days.v1"

function sanitizeWindowOrigins(value: unknown): Record<string, WindowOriginMeta> {
  if (!value || typeof value !== "object") {
    return {}
  }

  const next: Record<string, WindowOriginMeta> = {}

  Object.entries(value as Record<string, unknown>).forEach(([windowId, meta]) => {
    if (!windowId || typeof meta !== "object" || !meta) {
      return
    }

    const sourceId = (meta as Record<string, unknown>).sourceId
    const mode = (meta as Record<string, unknown>).mode
    const createdAt = (meta as Record<string, unknown>).createdAt

    if (typeof sourceId !== "string") {
      return
    }

    if (mode !== "replaced" && mode !== "cloned") {
      return
    }

    const normalizedCreatedAt =
      typeof createdAt === "number" && Number.isFinite(createdAt) && createdAt > 0
        ? createdAt
        : Date.now()

    next[windowId] = {
      sourceId,
      mode,
      createdAt: normalizedCreatedAt,
    }
  })

  return next
}

export function normalizeWindowOriginTtlDays(value: unknown): WindowOriginTtlDays {
  const parsed = Number(value)

  if (!Number.isFinite(parsed)) {
    return WINDOW_ORIGIN_TTL_DEFAULT_DAYS
  }

  if (!WINDOW_ORIGIN_TTL_OPTIONS.includes(parsed as WindowOriginTtlDays)) {
    return WINDOW_ORIGIN_TTL_DEFAULT_DAYS
  }

  return parsed as WindowOriginTtlDays
}

export function readWindowOriginTtlDaysFromStorage(): WindowOriginTtlDays {
  if (typeof window === "undefined") {
    return WINDOW_ORIGIN_TTL_DEFAULT_DAYS
  }

  try {
    const rawValue = window.localStorage.getItem(WINDOW_ORIGIN_TTL_STORAGE_KEY)
    return normalizeWindowOriginTtlDays(rawValue)
  } catch {
    return WINDOW_ORIGIN_TTL_DEFAULT_DAYS
  }
}

export function isWindowOriginExpired(originMeta: WindowOriginMeta, ttlMs: number, now = Date.now()) {
  return now - originMeta.createdAt > ttlMs
}

export function filterActiveWindowOrigins(
  origins: Record<string, WindowOriginMeta>,
  ttlMs: number,
  now = Date.now()
) {
  const entries = Object.entries(origins).filter(([, meta]) => !isWindowOriginExpired(meta, ttlMs, now))

  if (entries.length === Object.keys(origins).length) {
    return origins
  }

  return Object.fromEntries(entries)
}

export function readWindowOriginsFromStorage(ttlMs: number): Record<string, WindowOriginMeta> {
  if (typeof window === "undefined") {
    return {}
  }

  try {
    const rawValue = window.localStorage.getItem(WINDOW_ORIGIN_STORAGE_KEY)

    if (!rawValue) {
      return {}
    }

    const parsed = sanitizeWindowOrigins(JSON.parse(rawValue))
    return filterActiveWindowOrigins(parsed, ttlMs)
  } catch {
    return {}
  }
}

function normalizeImportedWindowOriginEntry(
  rawWindowId: unknown,
  rawSourceId: unknown,
  rawMode: unknown,
  rawCreatedAt: unknown
): { windowId: string; meta: WindowOriginMeta } | null {
  if (typeof rawWindowId !== "string" || typeof rawSourceId !== "string") {
    return null
  }

  if (rawMode !== "replaced" && rawMode !== "cloned") {
    return null
  }

  let createdAt = Date.now()

  if (typeof rawCreatedAt === "number" && Number.isFinite(rawCreatedAt) && rawCreatedAt > 0) {
    createdAt = rawCreatedAt
  }

  if (typeof rawCreatedAt === "string") {
    const parsedDate = Date.parse(rawCreatedAt)

    if (Number.isFinite(parsedDate) && parsedDate > 0) {
      createdAt = parsedDate
    }
  }

  return {
    windowId: rawWindowId,
    meta: {
      sourceId: rawSourceId,
      mode: rawMode,
      createdAt,
    },
  }
}

export function parseImportedWindowOrigins(value: unknown): Record<string, WindowOriginMeta> {
  if (!value || typeof value !== "object") {
    return {}
  }

  const payload = value as Record<string, unknown>

  if (Array.isArray(payload.entries)) {
    const entries: Record<string, WindowOriginMeta> = {}

    payload.entries.forEach((entry) => {
      if (!entry || typeof entry !== "object") {
        return
      }

      const normalized = normalizeImportedWindowOriginEntry(
        (entry as Record<string, unknown>).window_id,
        (entry as Record<string, unknown>).source_id,
        (entry as Record<string, unknown>).mode,
        (entry as Record<string, unknown>).created_at
      )

      if (!normalized) {
        return
      }

      const previous = entries[normalized.windowId]

      if (!previous || normalized.meta.createdAt >= previous.createdAt) {
        entries[normalized.windowId] = normalized.meta
      }
    })

    return entries
  }

  return sanitizeWindowOrigins(payload)
}

export function mergeWindowOrigins(
  currentOrigins: Record<string, WindowOriginMeta>,
  importedOrigins: Record<string, WindowOriginMeta>
) {
  const next = { ...currentOrigins }

  Object.entries(importedOrigins).forEach(([windowId, importedMeta]) => {
    const previous = next[windowId]

    if (!previous || importedMeta.createdAt >= previous.createdAt) {
      next[windowId] = importedMeta
    }
  })

  return next
}

export function getInitialFormState(): SilenceFormState {
  return {
    startTime: "",
    endTime: "",
    recurrence: "",
  }
}

export function parseDate(value: string | null | undefined) {
  if (!value) {
    return null
  }

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return null
  }

  return date
}

function normalizeRecurrence(value: string | null | undefined) {
  return (value || "").trim()
}

export function toLocalDatetimeInputValue(value: string | null | undefined) {
  const date = parseDate(value)

  if (!date) {
    return ""
  }

  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")
  const hours = String(date.getHours()).padStart(2, "0")
  const minutes = String(date.getMinutes()).padStart(2, "0")

  return `${year}-${month}-${day}T${hours}:${minutes}`
}

export function formatDateTime(value: string | null | undefined, locale: "zh" | "en") {
  const date = parseDate(value)

  if (!date) {
    return "-"
  }

  return date.toLocaleString(locale === "zh" ? "zh-CN" : "en-US", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  })
}

export function getWindowStatus(window: SilenceWindow, currentTime = Date.now()): SilenceStatus {
  const startTime = parseDate(window.start_time)?.getTime()
  const endTime = parseDate(window.end_time)?.getTime()

  if (!startTime || !endTime) {
    return "unknown"
  }

  if (currentTime < startTime) {
    return "scheduled"
  }

  if (currentTime > endTime) {
    return "expired"
  }

  return "active"
}

export function formatDuration(milliseconds: number, locale: "zh" | "en") {
  const totalMinutes = Math.floor(milliseconds / 60000)

  if (totalMinutes < 0) {
    return "-"
  }

  const days = Math.floor(totalMinutes / (24 * 60))
  const hours = Math.floor((totalMinutes % (24 * 60)) / 60)
  const minutes = totalMinutes % 60

  if (locale === "zh") {
    if (days > 0) {
      return `${days} 天 ${hours} 小时`
    }

    if (hours > 0) {
      return `${hours} 小时 ${minutes} 分钟`
    }

    return `${minutes} 分钟`
  }

  if (days > 0) {
    return `${days}d ${hours}h`
  }

  if (hours > 0) {
    return `${hours}h ${minutes}m`
  }

  return `${minutes}m`
}

export function getStatusMeta(status: SilenceStatus, t: AppNamespaceTranslator<"pages">) {
  if (status === "active") {
    return {
      label: t("notifications.silenceStatusActive"),
      className: "border-emerald-500/30 bg-emerald-500/10 text-emerald-600",
    }
  }

  if (status === "scheduled") {
    return {
      label: t("notifications.silenceStatusScheduled"),
      className: "border-amber-500/30 bg-amber-500/10 text-amber-600",
    }
  }

  if (status === "expired") {
    return {
      label: t("notifications.silenceStatusExpired"),
      className: "border-muted bg-muted text-muted-foreground",
    }
  }

  return {
    label: t("notifications.silenceStatusUnknown"),
    className: "border-red-500/30 bg-red-500/10 text-red-600",
  }
}

export function toSilencePayload(form: SilenceFormState): CreateSilenceWindowRequest | null {
  if (!form.startTime || !form.endTime) {
    return null
  }

  const startDate = parseDate(form.startTime)
  const endDate = parseDate(form.endTime)

  if (!startDate || !endDate) {
    return null
  }

  if (endDate.getTime() <= startDate.getTime()) {
    return null
  }

  const payload: CreateSilenceWindowRequest = {
    start_time: startDate.toISOString(),
    end_time: endDate.toISOString(),
  }

  const recurrenceValue = normalizeRecurrence(form.recurrence)

  if (recurrenceValue) {
    payload.recurrence = recurrenceValue
  }

  return payload
}

function isWindowMatchingPayload(window: SilenceWindow, payload: CreateSilenceWindowRequest) {
  const windowStart = parseDate(window.start_time)?.getTime()
  const windowEnd = parseDate(window.end_time)?.getTime()
  const payloadStart = parseDate(payload.start_time)?.getTime()
  const payloadEnd = parseDate(payload.end_time)?.getTime()

  if (!windowStart || !windowEnd || !payloadStart || !payloadEnd) {
    return false
  }

  if (windowStart !== payloadStart || windowEnd !== payloadEnd) {
    return false
  }

  return normalizeRecurrence(window.recurrence) === normalizeRecurrence(payload.recurrence)
}

export function resolveCreatedWindowId(
  windows: SilenceWindow[],
  payload: CreateSilenceWindowRequest,
  excludedId?: string
) {
  const matched = windows
    .filter((window) => window.id !== excludedId)
    .filter((window) => isWindowMatchingPayload(window, payload))
    .sort((left, right) => {
      const rightCreated = parseDate(right.created_at)?.getTime() || 0
      const leftCreated = parseDate(left.created_at)?.getTime() || 0

      if (rightCreated !== leftCreated) {
        return rightCreated - leftCreated
      }

      const rightUpdated = parseDate(right.updated_at)?.getTime() || 0
      const leftUpdated = parseDate(left.updated_at)?.getTime() || 0

      if (rightUpdated !== leftUpdated) {
        return rightUpdated - leftUpdated
      }

      return right.id.localeCompare(left.id)
    })

  if (matched.length === 0) {
    return null
  }

  return matched[0].id
}
