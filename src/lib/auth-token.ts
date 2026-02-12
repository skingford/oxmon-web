const TOKEN_STORAGE_KEY = "token"

function decodeJwtPayloadRaw(token: string) {
  const payloadPart = token.split(".")[1]

  if (!payloadPart) {
    return null
  }

  try {
    const base64 = payloadPart
      .replace(/-/g, "+")
      .replace(/_/g, "/")
      .padEnd(Math.ceil(payloadPart.length / 4) * 4, "=")

    const decoded = window.atob(base64)
    return JSON.parse(decoded) as Record<string, unknown>
  } catch {
    return null
  }
}

function decodeJwtPayload(token: string) {
  if (typeof window === "undefined") {
    return null
  }

  return decodeJwtPayloadRaw(token)
}

export function normalizeAuthToken(rawToken?: string | null) {
  if (!rawToken) {
    return null
  }

  const trimmed = rawToken.trim()

  if (!trimmed) {
    return null
  }

  const withoutPrefix = trimmed.replace(/^Bearer\s+/i, "").trim()
  const isQuoted =
    (withoutPrefix.startsWith('"') && withoutPrefix.endsWith('"')) ||
    (withoutPrefix.startsWith("'") && withoutPrefix.endsWith("'"))

  const normalized = isQuoted
    ? withoutPrefix.slice(1, -1).trim()
    : withoutPrefix

  return normalized || null
}

export function getAuthToken() {
  if (typeof window === "undefined") {
    return null
  }

  return normalizeAuthToken(localStorage.getItem(TOKEN_STORAGE_KEY))
}

export function isAuthTokenValid(rawToken?: string | null, clockSkewSeconds = 30) {
  const token = normalizeAuthToken(rawToken)

  if (!token) {
    return false
  }

  const payload = decodeJwtPayload(token)

  if (!payload) {
    return false
  }

  const expValue = payload.exp
  const exp = typeof expValue === "number" ? expValue : Number(expValue)

  if (!Number.isFinite(exp)) {
    return false
  }

  const currentTimestamp = Math.floor(Date.now() / 1000)
  return exp > currentTimestamp + clockSkewSeconds
}

export function setAuthToken(token: string) {
  if (typeof window === "undefined") {
    return
  }

  const normalizedToken = normalizeAuthToken(token)

  if (!normalizedToken) {
    return
  }

  localStorage.setItem(TOKEN_STORAGE_KEY, normalizedToken)
}

export function clearAuthToken() {
  if (typeof window === "undefined") {
    return
  }

  localStorage.removeItem(TOKEN_STORAGE_KEY)
}
