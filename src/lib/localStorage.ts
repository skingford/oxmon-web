// client-localstorage-schema pattern: Version and minimize localStorage data

const STORAGE_VERSION = 'v1'

export interface StorageSchema {
  version: string
  data: any
}

export function getFromLocalStorage<T>(key: string, defaultValue: T): T {
  if (typeof window === 'undefined') return defaultValue

  try {
    const item = localStorage.getItem(key)
    if (!item) return defaultValue

    const parsed: StorageSchema = JSON.parse(item)

    // Version check
    if (parsed.version !== STORAGE_VERSION) {
      console.warn(`Storage version mismatch for key: ${key}`)
      return defaultValue
    }

    return parsed.data as T
  } catch {
    return defaultValue
  }
}

export function setToLocalStorage<T>(key: string, value: T): void {
  if (typeof window === 'undefined') return

  try {
    const data: StorageSchema = {
      version: STORAGE_VERSION,
      data: value
    }
    localStorage.setItem(key, JSON.stringify(data))
  } catch (error) {
    console.error('Failed to save to localStorage:', error)
  }
}

export function removeFromLocalStorage(key: string): void {
  if (typeof window === 'undefined') return

  try {
    localStorage.removeItem(key)
  } catch (error) {
    console.error('Failed to remove from localStorage:', error)
  }
}
