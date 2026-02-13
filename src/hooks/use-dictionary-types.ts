"use client"

import { useCallback, useEffect, useState } from "react"
import { api } from "@/lib/api"
import { DictionaryTypeSummary } from "@/types/api"

type UseDictionaryTypesOptions = {
  autoFetch?: boolean
  onError?: (error: unknown) => void
}

export function useDictionaryTypes(options: UseDictionaryTypesOptions = {}) {
  const { autoFetch = true, onError } = options

  const [typeSummaries, setTypeSummaries] = useState<DictionaryTypeSummary[]>([])
  const [selectedType, setSelectedType] = useState("")
  const [loadingTypes, setLoadingTypes] = useState(autoFetch)

  const fetchDictionaryTypes = useCallback(
    async (silent = false) => {
      if (!silent) {
        setLoadingTypes(true)
      }

      try {
        const data = await api.listDictionaryTypes()
        const sortedTypes = data
          .slice()
          .sort((left, right) => left.dict_type.localeCompare(right.dict_type))

        setTypeSummaries(sortedTypes)
        setSelectedType((previous) => {
          if (previous && sortedTypes.some((typeSummary) => typeSummary.dict_type === previous)) {
            return previous
          }

          return sortedTypes[0]?.dict_type || ""
        })

        return sortedTypes
      } catch (error) {
        onError?.(error)
        setTypeSummaries([])
        setSelectedType("")
        return []
      } finally {
        if (!silent) {
          setLoadingTypes(false)
        }
      }
    },
    [onError]
  )

  useEffect(() => {
    if (!autoFetch) {
      setLoadingTypes(false)
      return
    }

    fetchDictionaryTypes()
  }, [autoFetch, fetchDictionaryTypes])

  return {
    typeSummaries,
    selectedType,
    setSelectedType,
    loadingTypes,
    fetchDictionaryTypes,
  }
}
