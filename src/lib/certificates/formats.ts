export function formatCertificateDateTime(value: string | null, locale: "zh" | "en") {
  if (!value) {
    return "-"
  }

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
