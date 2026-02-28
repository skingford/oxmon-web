import type { CloudInstanceResponse } from "@/types/api"

export type CloudInstanceStatusKey = "running" | "stopped" | "pending" | "error" | "unknown"

export function uniqueSortedWithLocale(values: Array<string | null | undefined>, locale: "zh" | "en") {
  return Array.from(new Set(values.map((item) => item?.trim()).filter((item): item is string => Boolean(item))))
    .sort((a, b) => a.localeCompare(b, locale === "zh" ? "zh-CN" : "en-US"))
}

export function resolveCloudInstanceName(instance: CloudInstanceResponse) {
  return instance.instance_name?.trim() || instance.instance_id
}

export function normalizeCloudInstanceStatus(status: string | null | undefined): CloudInstanceStatusKey {
  const normalized = (status || "").trim().toLowerCase()

  if (!normalized || ["unknown", "unk", "none", "null", "nil", "-"].includes(normalized)) {
    return "unknown"
  }

  if (["running", "active", "online", "started", "up", "1"].includes(normalized)) {
    return "running"
  }

  if (["stopped", "stop", "offline", "terminated", "shutdown", "shutoff", "down", "0"].includes(normalized)) {
    return "stopped"
  }

  if (["pending", "starting", "provisioning", "initializing", "booting", "2"].includes(normalized)) {
    return "pending"
  }

  if (["failed", "error", "err", "unhealthy", "3"].includes(normalized)) {
    return "error"
  }

  return "unknown"
}

export function resolveCloudInstanceStatus(instance: Pick<CloudInstanceResponse, "status" | "normalized_status">) {
  return normalizeCloudInstanceStatus(instance.normalized_status || instance.status)
}

export function getCloudInstanceStatusBadgeVariant(
  status: CloudInstanceStatusKey
): "default" | "secondary" | "outline" | "destructive" {
  if (status === "running") {
    return "default"
  }

  if (status === "stopped" || status === "error") {
    return "destructive"
  }

  if (status === "pending") {
    return "secondary"
  }

  return "outline"
}
