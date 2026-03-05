import { formatDateTimeByLocale } from "@/lib/date-time"

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
  return formatDateTimeByLocale(value, locale, "-", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  })
}
