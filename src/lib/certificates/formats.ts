import { formatFullDateTimeByLocale } from "@/lib/date-time"

export function formatCertificateDateTime(value: string | null, locale: "zh" | "en") {
  return formatFullDateTimeByLocale(value, locale, "-")
}

export function parseOptionalNonNegativeInt(value: string) {
  if (!value.trim()) {
    return null
  }

  const numberValue = Number(value)

  if (!Number.isFinite(numberValue) || numberValue < 0) {
    return undefined
  }

  return Math.floor(numberValue)
}
