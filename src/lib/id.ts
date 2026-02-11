let fallbackCounter = 0

function nextFallbackEntropy(): string {
  fallbackCounter = (fallbackCounter + 1) % 1_000_000
  const timePart = Date.now().toString(36)
  const counterPart = fallbackCounter.toString(36).padStart(4, '0')

  return `${timePart}${counterPart}`
}

export function createId(prefix: string = 'id'): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return `${prefix}_${crypto.randomUUID().replace(/-/g, '').slice(0, 12)}`
  }

  return `${prefix}_${nextFallbackEntropy()}`
}

export function createHexToken(length: number): string {
  if (length <= 0) {
    return ''
  }

  if (typeof crypto !== 'undefined' && typeof crypto.getRandomValues === 'function') {
    const bytes = new Uint8Array(Math.ceil(length / 2))
    crypto.getRandomValues(bytes)

    return Array.from(bytes)
      .map((byte) => byte.toString(16).padStart(2, '0'))
      .join('')
      .slice(0, length)
  }

  const fallbackSeed = nextFallbackEntropy()
  return fallbackSeed.repeat(Math.ceil(length / fallbackSeed.length)).slice(0, length)
}
