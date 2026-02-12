import { DEFAULT_APP_LOCALE, type AppLocale } from "@/components/app-locale"
import enMessages from "@/messages/en.json"
import zhMessages from "@/messages/zh.json"

export type AppMessages = typeof zhMessages

type NestedMessagePath<T> = {
  [Key in keyof T & string]: T[Key] extends string
    ? Key
    : T[Key] extends Record<string, unknown>
      ? `${Key}.${NestedMessagePath<T[Key]>}`
      : never
}[keyof T & string]

export type AppMessageNamespace = keyof AppMessages & string
export type AppMessageNamespacePath<Namespace extends AppMessageNamespace> =
  NestedMessagePath<AppMessages[Namespace]>

export type AppMessagePath = {
  [Namespace in AppMessageNamespace]: `${Namespace}.${AppMessageNamespacePath<Namespace>}`
}[AppMessageNamespace]

export type NavigationLabelKey = keyof AppMessages["navigation"]["labels"] & string
export type HeaderDescriptionKey =
  keyof AppMessages["header"]["descriptions"] & string

export type MessageValues = Record<string, string | number>

const appMessages: Record<AppLocale, AppMessages> = {
  zh: zhMessages,
  en: enMessages,
}

function getAppMessages(locale: AppLocale) {
  return appMessages[locale] || appMessages[DEFAULT_APP_LOCALE]
}

function interpolateMessage(template: string, values?: MessageValues) {
  if (!values) {
    return template
  }

  return template.replace(/\{(\w+)\}/g, (match, token) => {
    if (!(token in values)) {
      return match
    }

    return String(values[token])
  })
}

function getMessageValue(path: AppMessagePath, locale: AppLocale = DEFAULT_APP_LOCALE) {
  const segments = path.split(".")
  let cursor: unknown = getAppMessages(locale)

  for (const segment of segments) {
    if (!cursor || typeof cursor !== "object") {
      return undefined
    }

    const segmentValue = (cursor as Record<string, unknown>)[segment]

    if (segmentValue === undefined) {
      return undefined
    }

    cursor = segmentValue
  }

  return cursor
}

export function t(
  path: AppMessagePath,
  locale: AppLocale = DEFAULT_APP_LOCALE,
  values?: MessageValues
) {
  const localizedValue = getMessageValue(path, locale)

  if (typeof localizedValue !== "string") {
    return path
  }

  return interpolateMessage(localizedValue, values)
}

export function createTranslator(locale: AppLocale = DEFAULT_APP_LOCALE) {
  return (path: AppMessagePath, values?: MessageValues) => t(path, locale, values)
}

export function createScopedTranslator<Namespace extends AppMessageNamespace>(
  locale: AppLocale = DEFAULT_APP_LOCALE,
  namespace: Namespace
) {
  return (path: AppMessageNamespacePath<Namespace>, values?: MessageValues) =>
    t(`${namespace}.${path}` as AppMessagePath, locale, values)
}

export function getNavigationLabel(
  key: NavigationLabelKey,
  locale: AppLocale = DEFAULT_APP_LOCALE
) {
  const translate = createScopedTranslator(locale, "navigation")
  return translate(`labels.${key}`)
}

export function getHeaderDescription(
  key: HeaderDescriptionKey,
  locale: AppLocale = DEFAULT_APP_LOCALE
) {
  const translate = createScopedTranslator(locale, "header")
  return translate(`descriptions.${key}`)
}
