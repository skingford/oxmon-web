"use client"

import { useCallback, useState } from "react"

type RunWithRefreshOptions = {
  silent?: boolean
}

export function useRefreshState(initialLoading = true) {
  const [loading, setLoading] = useState(initialLoading)
  const [refreshing, setRefreshing] = useState(false)

  const runWithRefresh = useCallback(
    async <T>(task: () => Promise<T>, options?: RunWithRefreshOptions) => {
      const silent = options?.silent === true

      if (silent) {
        setRefreshing(true)
      } else {
        setLoading(true)
      }

      try {
        return await task()
      } finally {
        setLoading(false)
        setRefreshing(false)
      }
    },
    []
  )

  return {
    loading,
    refreshing,
    runWithRefresh,
    setLoading,
    setRefreshing,
  }
}
