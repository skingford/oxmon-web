import type { AppLocale } from "@/components/app-locale"

const FULL_DATE_TIME_OPTIONS: Intl.DateTimeFormatOptions = {
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
}

export function formatDateTimeByLocale(
  value: string | null | undefined,
  locale: AppLocale,
  fallback = "-",
  options?: Intl.DateTimeFormatOptions,
) {
  if (!value) {
    return fallback
  }

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return fallback
  }

  return date.toLocaleString(locale === "zh" ? "zh-CN" : "en-US", options)
}

export function formatFullDateTimeByLocale(
  value: string | null | undefined,
  locale: AppLocale,
  fallback = "-",
) {
  return formatDateTimeByLocale(value, locale, fallback, FULL_DATE_TIME_OPTIONS)
}

export function formatRecentOrDateTimeByLocale(
  value: string | null | undefined,
  locale: AppLocale,
  fallback = "-",
  options?: {
    dateTimeOptions?: Intl.DateTimeFormatOptions
    texts?: {
      justNow?: string
      minutesAgo?: (count: number) => string
    }
  },
) {
  if (!value) {
    return fallback
  }

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return fallback
  }

  const diff = Date.now() - date.getTime()
  const minute = 60 * 1000
  const hour = 60 * minute
  const defaultJustNow = locale === "zh" ? "刚刚" : "just now"
  const defaultMinutesAgo = (count: number) =>
    locale === "zh" ? `${count} 分钟前` : `${count} minutes ago`

  if (diff >= 0 && diff < minute) {
    return options?.texts?.justNow || defaultJustNow
  }

  if (diff >= 0 && diff < hour) {
    const minutes = Math.floor(diff / minute)
    return options?.texts?.minutesAgo?.(minutes) || defaultMinutesAgo(minutes)
  }

  return formatDateTimeByLocale(
    value,
    locale,
    fallback,
    options?.dateTimeOptions,
  )
}
