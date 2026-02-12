"use client"

import { useCallback, useRef, useState } from "react"

type RequestExecutor<TData> = () => Promise<TData>

interface ExecuteOptions<TData> {
  silent?: boolean
  onSuccess?: (data: TData) => void
  onError?: (error: unknown) => void
}

interface UseRequestStateOptions {
  initialLoading?: boolean
}

export function useRequestState<TData>(
  initialData: TData,
  options: UseRequestStateOptions = {}
) {
  const { initialLoading = true } = options
  const [data, setData] = useState<TData>(initialData)
  const [loading, setLoading] = useState(initialLoading)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const requestIdRef = useRef(0)

  const execute = useCallback(
    async (executor: RequestExecutor<TData>, executeOptions: ExecuteOptions<TData> = {}) => {
      const requestId = requestIdRef.current + 1
      requestIdRef.current = requestId

      if (executeOptions.silent) {
        setRefreshing(true)
      } else {
        setLoading(true)
      }

      setError(null)

      try {
        const result = await executor()

        if (requestId !== requestIdRef.current) {
          return null
        }

        setData(result)
        executeOptions.onSuccess?.(result)
        return result
      } catch (requestError) {
        if (requestId !== requestIdRef.current) {
          return null
        }

        setError(requestError instanceof Error ? requestError.message : "请求失败")
        executeOptions.onError?.(requestError)
        return null
      } finally {
        if (requestId === requestIdRef.current) {
          setLoading(false)
          setRefreshing(false)
        }
      }
    },
    []
  )

  const reset = useCallback(
    (nextData: TData = initialData) => {
      requestIdRef.current += 1
      setData(nextData)
      setError(null)
      setLoading(false)
      setRefreshing(false)
    },
    [initialData]
  )

  return {
    data,
    setData,
    loading,
    refreshing,
    error,
    execute,
    reset,
  }
}
