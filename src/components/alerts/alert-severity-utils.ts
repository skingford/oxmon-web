import { AlertCircle, AlertTriangle, Info, type LucideIcon } from "lucide-react"

type AlertSeverityKey = "critical" | "warning" | "info"

function normalizeAlertSeverity(severity: string): AlertSeverityKey | "unknown" {
  const normalized = severity.toLowerCase()

  if (normalized === "critical") {
    return "critical"
  }

  if (normalized === "warning") {
    return "warning"
  }

  if (normalized === "info") {
    return "info"
  }

  return "unknown"
}

export function getAlertSeverityBadgeClass(severity: string) {
  const normalized = normalizeAlertSeverity(severity)

  if (normalized === "critical") {
    return "border-red-500/30 bg-red-500/10 text-red-600"
  }

  if (normalized === "warning") {
    return "border-amber-500/30 bg-amber-500/10 text-amber-600"
  }

  if (normalized === "info") {
    return "border-blue-500/30 bg-blue-500/10 text-blue-600"
  }

  return "border-muted bg-muted text-muted-foreground"
}

export function getAlertSeverityIcon(severity: string): LucideIcon {
  const normalized = normalizeAlertSeverity(severity)

  if (normalized === "warning") {
    return AlertTriangle
  }

  if (normalized === "info") {
    return Info
  }

  return AlertCircle
}

export function getAlertSeverityLabel(
  severity: string,
  t: (key: "severity.critical" | "severity.warning" | "severity.info") => string,
) {
  const normalized = normalizeAlertSeverity(severity)

  if (normalized === "critical") {
    return t("severity.critical")
  }

  if (normalized === "warning") {
    return t("severity.warning")
  }

  if (normalized === "info") {
    return t("severity.info")
  }

  return severity
}
