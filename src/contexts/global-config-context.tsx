"use client"

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react"
import { AnimatePresence, motion } from "framer-motion"
import { Loader2 } from "lucide-react"
import { getAuthToken, isAuthTokenValid } from "@/lib/auth-token"
import {
  GLOBAL_CONFIG_CACHE_KEY,
  GLOBAL_CONFIG_CACHE_UPDATED_EVENT,
  readGlobalConfigCache,
  refreshGlobalConfigCache,
  type GlobalConfigCacheSnapshot,
} from "@/lib/global-config-cache"

type GlobalConfigContextValue = {
  config: GlobalConfigCacheSnapshot | null
  loading: boolean
  refreshing: boolean
  refreshConfig: () => Promise<GlobalConfigCacheSnapshot | null>
}

const GlobalConfigContext = createContext<GlobalConfigContextValue | null>(null)

export function GlobalConfigProvider({
  children,
}: {
  children: React.ReactNode
}) {
  const [config, setConfig] = useState<GlobalConfigCacheSnapshot | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const refreshConfig = useCallback(async () => {
    setRefreshing(true)

    try {
      const nextConfig = await refreshGlobalConfigCache()
      setConfig(nextConfig)
      return nextConfig
    } catch {
      return null
    } finally {
      setRefreshing(false)
    }
  }, [])

  useEffect(() => {
    const cached = readGlobalConfigCache()

    if (cached) {
      setConfig(cached)
    }

    const token = getAuthToken()
    if (!isAuthTokenValid(token)) {
      setLoading(false)
      return
    }

    refreshGlobalConfigCache()
      .then((nextConfig) => {
        setConfig(nextConfig)
      })
      .catch(() => {
        // Ignore bootstrap errors and keep the cached snapshot.
      })
      .finally(() => {
        setLoading(false)
      })
  }, [])

  useEffect(() => {
    const handleCacheUpdated = () => {
      setConfig(readGlobalConfigCache())
    }

    const handleStorageChanged = (event: StorageEvent) => {
      if (event.key && event.key !== GLOBAL_CONFIG_CACHE_KEY) {
        return
      }

      setConfig(readGlobalConfigCache())
    }

    window.addEventListener(GLOBAL_CONFIG_CACHE_UPDATED_EVENT, handleCacheUpdated)
    window.addEventListener("storage", handleStorageChanged)

    return () => {
      window.removeEventListener(GLOBAL_CONFIG_CACHE_UPDATED_EVENT, handleCacheUpdated)
      window.removeEventListener("storage", handleStorageChanged)
    }
  }, [])

  const contextValue = useMemo<GlobalConfigContextValue>(
    () => ({
      config,
      loading,
      refreshing,
      refreshConfig,
    }),
    [config, loading, refreshing, refreshConfig]
  )

  return (
    <GlobalConfigContext.Provider value={contextValue}>
      <div className="relative flex min-h-svh w-full overflow-x-hidden">
        {children}

        <AnimatePresence>
          {loading && !config ? (
            <motion.div
              key="global-config-bootstrap"
              className="fixed inset-0 z-[80] flex items-center justify-center bg-background/75 backdrop-blur-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <motion.div
                className="flex items-center gap-2 rounded-full border border-border/60 bg-background/90 px-3 py-2 text-sm text-muted-foreground shadow-sm"
                initial={{ y: 6, opacity: 0.75 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.2 }}
              >
                <Loader2 className="h-4 w-4 animate-spin" />
              </motion.div>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>
    </GlobalConfigContext.Provider>
  )
}

export function useGlobalConfig() {
  const context = useContext(GlobalConfigContext)

  if (!context) {
    throw new Error("useGlobalConfig must be used within GlobalConfigProvider")
  }

  return context
}
