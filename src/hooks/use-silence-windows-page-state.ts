"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import type { SilenceWindow } from "@/types/api"
import { useClientPagination } from "@/hooks/use-client-pagination"
import {
  DAY_IN_MS,
  WINDOW_ORIGIN_STORAGE_KEY,
  WINDOW_ORIGIN_TTL_STORAGE_KEY,
  filterActiveWindowOrigins,
  getInitialFormState,
  getWindowStatus,
  isWindowOriginExpired,
  parseDate,
  readWindowOriginTtlDaysFromStorage,
  readWindowOriginsFromStorage,
  type SilenceFormState,
  type SilenceStatusFilter,
  type WindowOriginMeta,
  type WindowOriginModeFilter,
  type WindowOriginTtlDays,
} from "@/lib/notifications/silence-utils"

type UseSilenceWindowsPageStateOptions = {
  windows: SilenceWindow[]
}

const TABLE_PAGE_SIZE_OPTIONS = [20, 50, 100] as const

export function useSilenceWindowsPageState({ windows }: UseSilenceWindowsPageStateOptions) {
  const [searchKeyword, setSearchKeyword] = useState("")
  const [statusFilter, setStatusFilter] = useState<SilenceStatusFilter>("all")
  const [originModeFilter, setOriginModeFilter] = useState<WindowOriginModeFilter>("all")
  const [onlyOriginMarked, setOnlyOriginMarked] = useState(false)
  const [tablePageSize, setTablePageSize] = useState<number>(20)

  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [createSubmitting, setCreateSubmitting] = useState(false)
  const [createForm, setCreateForm] = useState<SilenceFormState>(getInitialFormState)

  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [editingWindow, setEditingWindow] = useState<SilenceWindow | null>(null)
  const [editSubmitting, setEditSubmitting] = useState(false)
  const [editForm, setEditForm] = useState<SilenceFormState>(getInitialFormState)
  const [replaceOriginalAfterEdit, setReplaceOriginalAfterEdit] = useState(true)

  const [windowOriginTtlDays, setWindowOriginTtlDays] = useState<WindowOriginTtlDays>(
    () => readWindowOriginTtlDaysFromStorage()
  )
  const windowOriginTtlMs = useMemo(() => windowOriginTtlDays * DAY_IN_MS, [windowOriginTtlDays])
  const [windowOrigins, setWindowOrigins] = useState<Record<string, WindowOriginMeta>>(() =>
    readWindowOriginsFromStorage(windowOriginTtlDays * DAY_IN_MS)
  )
  const importOriginsInputRef = useRef<HTMLInputElement | null>(null)
  const [importingOrigins, setImportingOrigins] = useState(false)

  const [deleteDialogWindow, setDeleteDialogWindow] = useState<SilenceWindow | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  useEffect(() => {
    if (typeof window === "undefined") {
      return
    }

    try {
      window.localStorage.setItem(WINDOW_ORIGIN_TTL_STORAGE_KEY, String(windowOriginTtlDays))
    } catch {
      return
    }
  }, [windowOriginTtlDays])

  useEffect(() => {
    if (typeof window === "undefined") {
      return
    }

    try {
      if (Object.keys(windowOrigins).length === 0) {
        window.localStorage.removeItem(WINDOW_ORIGIN_STORAGE_KEY)
        return
      }

      window.localStorage.setItem(WINDOW_ORIGIN_STORAGE_KEY, JSON.stringify(windowOrigins))
    } catch {
      return
    }
  }, [windowOrigins])

  useEffect(() => {
    setWindowOrigins((previous) => {
      const next = filterActiveWindowOrigins(previous, windowOriginTtlMs)

      if (next === previous) {
        return previous
      }

      return next
    })
  }, [windowOriginTtlMs])

  useEffect(() => {
    setWindowOrigins((previous) => {
      if (Object.keys(previous).length === 0) {
        return previous
      }

      const existingWindowIds = new Set(windows.map((window) => window.id))
      const now = Date.now()
      const nextEntries = Object.entries(previous).filter(([windowId, meta]) => {
        if (!existingWindowIds.has(windowId)) {
          return false
        }

        return !isWindowOriginExpired(meta, windowOriginTtlMs, now)
      })

      if (nextEntries.length === Object.keys(previous).length) {
        return previous
      }

      return Object.fromEntries(nextEntries)
    })
  }, [windowOriginTtlMs, windows])

  const stats = useMemo(() => {
    const currentTime = Date.now()
    const total = windows.length
    const active = windows.filter((window) => getWindowStatus(window, currentTime) === "active").length
    const scheduled = windows.filter((window) => getWindowStatus(window, currentTime) === "scheduled").length
    const expired = windows.filter((window) => getWindowStatus(window, currentTime) === "expired").length

    return {
      total,
      active,
      scheduled,
      expired,
    }
  }, [windows])

  const filteredWindows = useMemo(() => {
    const keyword = searchKeyword.trim().toLowerCase()

    return windows
      .filter((window) => {
        const status = getWindowStatus(window)

        if (statusFilter !== "all" && statusFilter !== status) {
          return false
        }

        const origin = windowOrigins[window.id]
        const hasOrigin = Boolean(origin)

        if (onlyOriginMarked && !hasOrigin) {
          return false
        }

        if (originModeFilter !== "all") {
          if (!origin || origin.mode !== originModeFilter) {
            return false
          }
        }

        if (!keyword) {
          return true
        }

        const searchableText = [
          window.id,
          window.recurrence || "",
          window.start_time,
          window.end_time,
          windowOrigins[window.id]?.sourceId || "",
        ]
          .join(" ")
          .toLowerCase()

        return searchableText.includes(keyword)
      })
      .sort((left, right) => {
        const leftTime = parseDate(left.start_time)?.getTime() || 0
        const rightTime = parseDate(right.start_time)?.getTime() || 0
        return rightTime - leftTime
      })
  }, [onlyOriginMarked, originModeFilter, searchKeyword, statusFilter, windowOrigins, windows])

  const hasActiveFilters =
    Boolean(searchKeyword.trim()) ||
    statusFilter !== "all" ||
    originModeFilter !== "all" ||
    onlyOriginMarked

  const originMarksCount = Object.keys(windowOrigins).length

  const originModeCounts = useMemo(() => {
    return Object.values(windowOrigins).reduce(
      (accumulator, originMeta) => {
        if (originMeta.mode === "replaced") {
          accumulator.replaced += 1
          return accumulator
        }

        accumulator.cloned += 1
        return accumulator
      },
      { replaced: 0, cloned: 0 }
    )
  }, [windowOrigins])

  const hasWindowOrigins = originMarksCount > 0

  const paginationResetKey = `${searchKeyword}|${statusFilter}|${originModeFilter}|${onlyOriginMarked}|${tablePageSize}|${originMarksCount}`
  const tablePagination = useClientPagination({
    items: filteredWindows,
    pageSize: tablePageSize,
    resetKey: paginationResetKey,
  })

  const resetFilters = () => {
    setSearchKeyword("")
    setStatusFilter("all")
    setOriginModeFilter("all")
    setOnlyOriginMarked(false)
  }

  return {
    searchKeyword,
    setSearchKeyword,
    statusFilter,
    setStatusFilter,
    originModeFilter,
    setOriginModeFilter,
    onlyOriginMarked,
    setOnlyOriginMarked,
    tablePageSize,
    setTablePageSize,
    tablePageSizeOptions: TABLE_PAGE_SIZE_OPTIONS,
    tablePagination,
    isCreateDialogOpen,
    setIsCreateDialogOpen,
    createSubmitting,
    setCreateSubmitting,
    createForm,
    setCreateForm,
    isEditDialogOpen,
    setIsEditDialogOpen,
    editingWindow,
    setEditingWindow,
    editSubmitting,
    setEditSubmitting,
    editForm,
    setEditForm,
    replaceOriginalAfterEdit,
    setReplaceOriginalAfterEdit,
    windowOriginTtlDays,
    setWindowOriginTtlDays,
    windowOriginTtlMs,
    windowOrigins,
    setWindowOrigins,
    importOriginsInputRef,
    importingOrigins,
    setImportingOrigins,
    deleteDialogWindow,
    setDeleteDialogWindow,
    deletingId,
    setDeletingId,
    stats,
    hasActiveFilters,
    originMarksCount,
    originModeCounts,
    hasWindowOrigins,
    resetFilters,
  }
}
