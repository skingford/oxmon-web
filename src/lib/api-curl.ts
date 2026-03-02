import { getAuthToken } from "@/lib/auth-token"

const API_BASE_URL = (process.env.NEXT_PUBLIC_API_BASE_URL || "").trim().replace(/\/+$/, "")
const OX_APP_ID = (process.env.NEXT_PUBLIC_OX_APP_ID || "").trim()

type BuildApiCurlCommandOptions = {
  path: string
  query?: URLSearchParams | string | null
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE"
  insecure?: boolean
  extraHeaders?: Record<string, string | number | boolean | null | undefined>
  body?: unknown
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
  body,
}: BuildApiCurlCommandOptions) {
  const url = buildApiUrl(path, query)
  const authToken = getAuthToken() || "<YOUR_TOKEN>"
  const appId = OX_APP_ID || "<YOUR_OX_APP_ID>"
  const headerLines = Object.entries(extraHeaders || {})
    .filter(([, value]) => value !== undefined && value !== null)
    .map(([key, value]) => `  -H '${key}: ${String(value)}'`)
  const bodyText =
    body === undefined
      ? null
      : typeof body === "string"
        ? body
        : JSON.stringify(body, null, 2)

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
