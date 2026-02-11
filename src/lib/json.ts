export function safeJsonParse<T>(rawText: string | undefined | null, fallback: T): T {
  if (!rawText) return fallback

  try {
    return JSON.parse(rawText) as T
  } catch {
    return fallback
  }
}

export function parseLooseJson<T>(rawText: string | undefined | null, fallback: T): T {
  if (!rawText) return fallback

  const trimmed = rawText.trim()
  const candidates = new Set<string>([trimmed])

  const fencedMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)\s*```/i)
  if (fencedMatch?.[1]) {
    candidates.add(fencedMatch[1].trim())
  }

  const firstObjectStart = trimmed.indexOf('{')
  const lastObjectEnd = trimmed.lastIndexOf('}')
  if (firstObjectStart !== -1 && lastObjectEnd > firstObjectStart) {
    candidates.add(trimmed.slice(firstObjectStart, lastObjectEnd + 1))
  }

  const firstArrayStart = trimmed.indexOf('[')
  const lastArrayEnd = trimmed.lastIndexOf(']')
  if (firstArrayStart !== -1 && lastArrayEnd > firstArrayStart) {
    candidates.add(trimmed.slice(firstArrayStart, lastArrayEnd + 1))
  }

  for (const candidate of candidates) {
    const parsed = safeJsonParse<T | symbol>(candidate, Symbol.for('parse_error'))
    if (parsed !== Symbol.for('parse_error')) {
      return parsed as T
    }
  }

  return fallback
}
