import { api } from "@/lib/api"
import type { RuntimeConfig, SystemConfigResponse } from "@/types/api"

export const GLOBAL_CONFIG_CACHE_KEY = "oxmon:global-config-cache:v1"
export const GLOBAL_CONFIG_CACHE_UPDATED_EVENT = "oxmon:global-config-cache-updated"

export type GlobalConfigCacheSnapshot = {
  runtimeConfig: RuntimeConfig
  systemConfigs: SystemConfigResponse[]
  updatedAt: number
}

type GlobalConfigCachePayload = {
  runtimeConfig: RuntimeConfig
  systemConfigs: SystemConfigResponse[]
  updatedAt?: number
}

function isBrowser() {
  return typeof window !== "undefined"
}

function toSnapshot(value: unknown): GlobalConfigCacheSnapshot | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null
  }

  const record = value as Record<string, unknown>
  const runtimeConfig = record.runtimeConfig
  const systemConfigs = record.systemConfigs
  const updatedAt = Number(record.updatedAt)

  if (!runtimeConfig || typeof runtimeConfig !== "object" || Array.isArray(runtimeConfig)) {
    return null
  }

  if (!Array.isArray(systemConfigs)) {
    return null
  }

  if (!Number.isFinite(updatedAt)) {
    return null
  }

  return {
    runtimeConfig: runtimeConfig as RuntimeConfig,
    systemConfigs: systemConfigs as SystemConfigResponse[],
    updatedAt,
  }
}

function dispatchCacheUpdatedEvent() {
  if (!isBrowser()) {
    return
  }

  window.dispatchEvent(new CustomEvent(GLOBAL_CONFIG_CACHE_UPDATED_EVENT))
}

export function readGlobalConfigCache() {
  if (!isBrowser()) {
    return null
  }

  const rawValue = window.localStorage.getItem(GLOBAL_CONFIG_CACHE_KEY)

  if (!rawValue) {
    return null
  }

  try {
    return toSnapshot(JSON.parse(rawValue))
  } catch {
    return null
  }
}

export function writeGlobalConfigCache(payload: GlobalConfigCachePayload) {
  if (!isBrowser()) {
    return null
  }

  const snapshot: GlobalConfigCacheSnapshot = {
    runtimeConfig: payload.runtimeConfig,
    systemConfigs: payload.systemConfigs,
    updatedAt: payload.updatedAt ?? Date.now(),
  }

  window.localStorage.setItem(GLOBAL_CONFIG_CACHE_KEY, JSON.stringify(snapshot))
  dispatchCacheUpdatedEvent()

  return snapshot
}

export function clearGlobalConfigCache() {
  if (!isBrowser()) {
    return
  }

  window.localStorage.removeItem(GLOBAL_CONFIG_CACHE_KEY)
  dispatchCacheUpdatedEvent()
}

export async function fetchGlobalConfigSnapshot() {
  const [runtimeConfig, systemConfigs] = await Promise.all([
    api.getSystemConfig(),
    api.listSystemConfigs(),
  ])

  return {
    runtimeConfig,
    systemConfigs,
    updatedAt: Date.now(),
  } as GlobalConfigCacheSnapshot
}

export async function refreshGlobalConfigCache() {
  const snapshot = await fetchGlobalConfigSnapshot()
  writeGlobalConfigCache(snapshot)
  return snapshot
}
