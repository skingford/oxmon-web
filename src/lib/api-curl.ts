import { getAuthToken } from "@/lib/auth-token"

const API_BASE_URL = (process.env.NEXT_PUBLIC_API_BASE_URL || "").trim().replace(/\/+$/, "")
const OX_APP_ID = (process.env.NEXT_PUBLIC_OX_APP_ID || "").trim()

type BuildApiCurlCommandOptions = {
  path: string
  query?: URLSearchParams | string | null
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE"
  insecure?: boolean
  extraHeaders?: Record<string, string | number | boolean | null | undefined>
  redactHeaders?: boolean | RedactHeadersOptions
  body?: unknown
  redactBodySecrets?: boolean | RedactBodySecretsOptions
}

type RedactHeadersOptions = {
  keepKeys?: string[]
  replaceWith?: string
}

type RedactBodySecretsOptions = {
  keepKeys?: string[]
  keepPaths?: string[]
  replaceWith?: string
}

const DEFAULT_REDACTED_VALUE = "***"
const SENSITIVE_HEADER_KEY_PATTERN =
  /(authorization|token|secret|password|api[_-]?key|app[_-]?key|private[_-]?key|credential)/i
const SENSITIVE_KEY_PATTERN =
  /(secret|password|passwd|pwd|access[_-]?key|secret[_-]?key|api[_-]?key|app[_-]?key|private[_-]?key|credential)/i

function redactHeaderValue(
  key: string,
  value: string | number | boolean,
  options?: RedactHeadersOptions
) {
  const keepKeys = new Set((options?.keepKeys || []).map((item) => item.toLowerCase()))
  const shouldKeep = keepKeys.has(key.toLowerCase())

  if (!SENSITIVE_HEADER_KEY_PATTERN.test(key) || shouldKeep) {
    return String(value)
  }

  return options?.replaceWith ?? DEFAULT_REDACTED_VALUE
}

function redactSensitiveBody(
  value: unknown,
  options?: RedactBodySecretsOptions,
  currentPath = ""
): unknown {
  const keepKeys = new Set((options?.keepKeys || []).map((key) => key.toLowerCase()))
  const keepPaths = new Set((options?.keepPaths || []).map((path) => path.toLowerCase()))
  const redactedValue = options?.replaceWith ?? DEFAULT_REDACTED_VALUE

  if (Array.isArray(value)) {
    return value.map((item, index) => redactSensitiveBody(item, options, `${currentPath}[${index}]`))
  }

  if (!value || typeof value !== "object") {
    return value
  }

  const entries = Object.entries(value as Record<string, unknown>).map(([key, nextValue]) => {
    const nextPath = currentPath ? `${currentPath}.${key}` : key
    const shouldKeep =
      keepKeys.has(key.toLowerCase()) ||
      keepPaths.has(nextPath.toLowerCase())

    if (SENSITIVE_KEY_PATTERN.test(key) && !shouldKeep) {
      return [key, redactedValue]
    }

    return [key, redactSensitiveBody(nextValue, options, nextPath)]
  })

  return Object.fromEntries(entries)
}

function resolveQueryString(query?: URLSearchParams | string | null) {
  if (!query) {
    return ""
  }

  if (typeof query === "string") {
    return query.replace(/^\?/, "")
  }

  return query.toString()
}

export function buildApiUrl(path: string, query?: URLSearchParams | string | null) {
  const queryString = resolveQueryString(query)
  const normalizedPath = path.startsWith("/") ? path : `/${path}`
  const base = API_BASE_URL ? `${API_BASE_URL}${normalizedPath}` : normalizedPath

  return queryString ? `${base}?${queryString}` : base
}

export function buildApiCurlCommand({
  path,
  query,
  method = "GET",
  insecure = false,
  extraHeaders,
  redactHeaders = false,
  body,
  redactBodySecrets = false,
}: BuildApiCurlCommandOptions) {
  const url = buildApiUrl(path, query)
  const authToken = getAuthToken() || "<YOUR_TOKEN>"
  const appId = OX_APP_ID || "<YOUR_OX_APP_ID>"
  const redactHeaderOptions =
    redactHeaders && typeof redactHeaders === "object"
      ? redactHeaders
      : undefined
  const headerLines = Object.entries(extraHeaders || {})
    .filter(([, value]) => value !== undefined && value !== null)
    .map(([key, value]) => {
      const finalValue = redactHeaders
        ? redactHeaderValue(key, value, redactHeaderOptions)
        : String(value)

      return `  -H '${key}: ${finalValue}'`
    })
  const redactOptions =
    redactBodySecrets && typeof redactBodySecrets === "object"
      ? redactBodySecrets
      : undefined
  const bodyText =
    body === undefined
      ? null
      : typeof body === "string"
        ? body
        : JSON.stringify(redactBodySecrets ? redactSensitiveBody(body, redactOptions) : body, null, 2)

  const lines = [
    `curl -X ${method} '${url}'`,
    `  -H 'ox-app-id: ${appId}'`,
    `  -H 'Authorization: Bearer ${authToken}'`,
    ...headerLines,
  ]

  if (insecure) {
    lines.splice(1, 0, "  -k")
  }

  if (bodyText !== null) {
    const hasContentType = headerLines.some((line) => /-H 'content-type:/i.test(line))

    if (!hasContentType) {
      lines.push(`  -H 'Content-Type: application/json'`)
    }

    lines.push(`  --data-raw '${bodyText.replace(/'/g, `'\"'\"'`)}'`)
  }

  return lines.join(" \\\n")
}

export async function copyApiCurlCommand(options: BuildApiCurlCommandOptions) {
  const command = buildApiCurlCommand(options)
  await navigator.clipboard.writeText(command)
  return command
}
