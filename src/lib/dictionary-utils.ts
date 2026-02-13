export function normalizeNullableText(value: string) {
  const trimmed = value.trim()
  return trimmed ? trimmed : null
}

export function parseOptionalSortOrder(value: string) {
  const trimmed = value.trim()

  if (!trimmed) {
    return null
  }

  const parsed = Number(trimmed)

  if (!Number.isFinite(parsed) || !Number.isInteger(parsed)) {
    return undefined
  }

  return parsed
}

export function formatDateTime(value: string, locale: "zh" | "en") {
  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
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
