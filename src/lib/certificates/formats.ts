import { formatDateTimeByLocale } from "@/lib/date-time"

export function formatCertificateDateTime(value: string | null, locale: "zh" | "en") {
  return formatDateTimeByLocale(value, locale, "-", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  })
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
