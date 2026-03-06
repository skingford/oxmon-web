import { formatFullDateTimeByLocale } from "@/lib/date-time"

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
  return formatFullDateTimeByLocale(value, locale, "-")
}
