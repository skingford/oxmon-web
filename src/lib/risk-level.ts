export type RiskLevel = "normal" | "attention" | "alert" | "critical"

export function riskLevelLabelZh(level: RiskLevel) {
  if (level === "normal") {
    return "正常"
  }

  if (level === "attention") {
    return "关注"
  }

  if (level === "alert") {
    return "告警"
  }

  return "严重告警"
}

export function riskLevelLabel(level: RiskLevel, locale: "zh" | "en" = "zh") {
  if (locale === "en") {
    if (level === "normal") {
      return "Normal"
    }

    if (level === "attention") {
      return "Attention"
    }

    if (level === "alert") {
      return "Alert"
    }

    return "Critical"
  }

  return riskLevelLabelZh(level)
}

export function resolveRiskLevelByScore(score: number): RiskLevel {
  if (score > 85) {
    return "critical"
  }

  if (score > 80) {
    return "alert"
  }

  if (score < 60) {
    return "normal"
  }

  return "attention"
}

export function riskLevelColorHex(level: RiskLevel) {
  if (level === "normal") {
    return "#22c55e"
  }

  if (level === "attention") {
    return "#3b82f6"
  }

  if (level === "alert") {
    return "#f59e0b"
  }

  return "#ef4444"
}

export function parseRiskScore(risk: string) {
  const matched = risk.match(/-?\d+(\.\d+)?/)
  if (!matched) {
    return null
  }

  const score = Number.parseFloat(matched[0])
  if (!Number.isFinite(score)) {
    return null
  }

  if (!risk.includes("%") && score >= 0 && score <= 1) {
    return score * 100
  }

  return score
}

export function resolveRiskLevel(risk: string): RiskLevel {
  const score = parseRiskScore(risk)
  if (score !== null) {
    return resolveRiskLevelByScore(score)
  }

  const normalized = risk.toLowerCase()
  if (normalized.includes("critical") || normalized.includes("high")) {
    return "critical"
  }
  if (normalized.includes("warn") || normalized.includes("alert") || normalized.includes("medium")) {
    return "alert"
  }
  if (normalized.includes("attention") || normalized.includes("watch")) {
    return "attention"
  }

  return "normal"
}

export function riskBadgeClassNameByLevel(level: RiskLevel) {
  if (level === "critical") {
    return "border-red-200 bg-red-50 text-red-600"
  }

  if (level === "alert") {
    return "border-amber-200 bg-amber-50 text-amber-600"
  }

  if (level === "attention") {
    return "border-blue-200 bg-blue-50 text-blue-600"
  }

  return "border-emerald-200 bg-emerald-50 text-emerald-600"
}

export function riskBadgeClassName(risk: string) {
  const level = resolveRiskLevel(risk)
  return riskBadgeClassNameByLevel(level)
}
