import { AlertCircle, CheckCircle, XCircle, type LucideIcon } from "lucide-react"

type AlertStatusKey = "open" | "acknowledged" | "resolved" | "unknown"

function normalizeAlertStatus(status: number | null | undefined): AlertStatusKey {
  if (status === 3) {
    return "resolved"
  }

  if (status === 2) {
    return "acknowledged"
  }

  if (status === 1) {
    return "open"
  }

  return "unknown"
}

export function getAlertStatusBadgeClass(status: number | null | undefined) {
  const normalized = normalizeAlertStatus(status)

  if (normalized === "resolved") {
    return "border-emerald-500/30 bg-emerald-500/10 text-emerald-600"
  }

  if (normalized === "acknowledged") {
    return "border-amber-500/30 bg-amber-500/10 text-amber-600"
  }

  return "border-red-500/30 bg-red-500/10 text-red-600"
}

export function getAlertStatusIcon(status: number | null | undefined): LucideIcon {
  const normalized = normalizeAlertStatus(status)

  if (normalized === "resolved") {
    return CheckCircle
  }

  if (normalized === "acknowledged") {
    return AlertCircle
  }

  return XCircle
}

export function getAlertStatusLabel(
  status: number | null | undefined,
  t: (key: "history.statusResolved" | "history.statusAcknowledged" | "history.statusOpen") => string,
) {
  const normalized = normalizeAlertStatus(status)

  if (normalized === "resolved") {
    return t("history.statusResolved")
  }

  if (normalized === "acknowledged") {
    return t("history.statusAcknowledged")
  }

  return t("history.statusOpen")
}

export function getAlertHistoryStatusFilterLabel(
  status: string,
  t: (key: "history.statusResolved" | "history.statusAcknowledged" | "history.statusOpen") => string,
) {
  if (status === "resolved") {
    return t("history.statusResolved")
  }

  if (status === "acknowledged") {
    return t("history.statusAcknowledged")
  }

  if (status === "open") {
    return t("history.statusOpen")
  }

  return status
}

export function resolveAlertStatusByHistoryFilter(status: string) {
  if (status === "resolved") {
    return 3
  }

  if (status === "acknowledged") {
    return 2
  }

  if (status === "open") {
    return 1
  }

  return null
}

export function matchesAlertHistoryStatusFilter(
  filterStatus: string,
  alertStatus: number | null | undefined,
) {
  const expectedStatus = resolveAlertStatusByHistoryFilter(filterStatus)

  if (expectedStatus === null) {
    return true
  }

  return alertStatus === expectedStatus
}
