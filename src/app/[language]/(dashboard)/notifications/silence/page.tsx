"use client"

import { ChangeEvent, FormEvent, useCallback, useEffect, useMemo, useRef, useState } from "react"
import { ApiRequestError, api, getApiErrorMessage } from "@/lib/api"
import { CreateSilenceWindowRequest, SilenceWindow } from "@/types/api"
import { useAppTranslations } from "@/hooks/use-app-translations"
import { useRequestState } from "@/hooks/use-request-state"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { SilenceFiltersCard } from "@/components/notifications/SilenceFiltersCard"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  Loader2,
  Pencil,
  Plus,
  RefreshCw,
  ShieldOff,
  Trash2,
} from "lucide-react"
import { toast } from "sonner"

const PAGE_LIMIT = 100

type SilenceStatus = "active" | "scheduled" | "expired" | "unknown"
type SilenceStatusFilter = "all" | SilenceStatus
type WindowOriginMode = "replaced" | "cloned"
type WindowOriginModeFilter = "all" | WindowOriginMode

type SilenceFormState = {
  startTime: string
  endTime: string
  recurrence: string
}

type WindowOriginMeta = {
  sourceId: string
  mode: WindowOriginMode
  createdAt: number
}

const DAY_IN_MS = 24 * 60 * 60 * 1000
const WINDOW_ORIGIN_TTL_OPTIONS = [1, 7, 30] as const
const WINDOW_ORIGIN_TTL_DEFAULT_DAYS = 7
const WINDOW_ORIGIN_STORAGE_KEY = "oxmon.notifications.silence.window-origins.v1"
const WINDOW_ORIGIN_TTL_STORAGE_KEY = "oxmon.notifications.silence.window-origins.ttl-days.v1"

function sanitizeWindowOrigins(value: unknown): Record<string, WindowOriginMeta> {
  if (!value || typeof value !== "object") {
    return {}
  }

  const next: Record<string, WindowOriginMeta> = {}

  Object.entries(value as Record<string, unknown>).forEach(([windowId, meta]) => {
    if (!windowId || typeof meta !== "object" || !meta) {
      return
    }

    const sourceId = (meta as Record<string, unknown>).sourceId
    const mode = (meta as Record<string, unknown>).mode
    const createdAt = (meta as Record<string, unknown>).createdAt

    if (typeof sourceId !== "string") {
      return
    }

    if (mode !== "replaced" && mode !== "cloned") {
      return
    }

    const normalizedCreatedAt =
      typeof createdAt === "number" && Number.isFinite(createdAt) && createdAt > 0
        ? createdAt
        : Date.now()

    next[windowId] = {
      sourceId,
      mode,
      createdAt: normalizedCreatedAt,
    }
  })

  return next
}

function normalizeWindowOriginTtlDays(value: unknown) {
  const parsed = Number(value)

  if (!Number.isFinite(parsed)) {
    return WINDOW_ORIGIN_TTL_DEFAULT_DAYS
  }

  if (!WINDOW_ORIGIN_TTL_OPTIONS.includes(parsed as (typeof WINDOW_ORIGIN_TTL_OPTIONS)[number])) {
    return WINDOW_ORIGIN_TTL_DEFAULT_DAYS
  }

  return parsed as (typeof WINDOW_ORIGIN_TTL_OPTIONS)[number]
}

function readWindowOriginTtlDaysFromStorage() {
  if (typeof window === "undefined") {
    return WINDOW_ORIGIN_TTL_DEFAULT_DAYS
  }

  try {
    const rawValue = window.localStorage.getItem(WINDOW_ORIGIN_TTL_STORAGE_KEY)
    return normalizeWindowOriginTtlDays(rawValue)
  } catch {
    return WINDOW_ORIGIN_TTL_DEFAULT_DAYS
  }
}

function isWindowOriginExpired(originMeta: WindowOriginMeta, ttlMs: number, now = Date.now()) {
  return now - originMeta.createdAt > ttlMs
}

function filterActiveWindowOrigins(
  origins: Record<string, WindowOriginMeta>,
  ttlMs: number,
  now = Date.now()
) {
  const entries = Object.entries(origins).filter(([, meta]) => !isWindowOriginExpired(meta, ttlMs, now))

  if (entries.length === Object.keys(origins).length) {
    return origins
  }

  return Object.fromEntries(entries)
}

function readWindowOriginsFromStorage(ttlMs: number): Record<string, WindowOriginMeta> {
  if (typeof window === "undefined") {
    return {}
  }

  try {
    const rawValue = window.localStorage.getItem(WINDOW_ORIGIN_STORAGE_KEY)

    if (!rawValue) {
      return {}
    }

    const parsed = sanitizeWindowOrigins(JSON.parse(rawValue))
    return filterActiveWindowOrigins(parsed, ttlMs)
  } catch {
    return {}
  }
}

function normalizeImportedWindowOriginEntry(
  rawWindowId: unknown,
  rawSourceId: unknown,
  rawMode: unknown,
  rawCreatedAt: unknown
): { windowId: string; meta: WindowOriginMeta } | null {
  if (typeof rawWindowId !== "string" || typeof rawSourceId !== "string") {
    return null
  }

  if (rawMode !== "replaced" && rawMode !== "cloned") {
    return null
  }

  let createdAt = Date.now()

  if (typeof rawCreatedAt === "number" && Number.isFinite(rawCreatedAt) && rawCreatedAt > 0) {
    createdAt = rawCreatedAt
  }

  if (typeof rawCreatedAt === "string") {
    const parsedDate = Date.parse(rawCreatedAt)

    if (Number.isFinite(parsedDate) && parsedDate > 0) {
      createdAt = parsedDate
    }
  }

  return {
    windowId: rawWindowId,
    meta: {
      sourceId: rawSourceId,
      mode: rawMode,
      createdAt,
    },
  }
}

function parseImportedWindowOrigins(value: unknown): Record<string, WindowOriginMeta> {
  if (!value || typeof value !== "object") {
    return {}
  }

  const payload = value as Record<string, unknown>

  if (Array.isArray(payload.entries)) {
    const entries: Record<string, WindowOriginMeta> = {}

    payload.entries.forEach((entry) => {
      if (!entry || typeof entry !== "object") {
        return
      }

      const normalized = normalizeImportedWindowOriginEntry(
        (entry as Record<string, unknown>).window_id,
        (entry as Record<string, unknown>).source_id,
        (entry as Record<string, unknown>).mode,
        (entry as Record<string, unknown>).created_at
      )

      if (!normalized) {
        return
      }

      const previous = entries[normalized.windowId]

      if (!previous || normalized.meta.createdAt >= previous.createdAt) {
        entries[normalized.windowId] = normalized.meta
      }
    })

    return entries
  }

  return sanitizeWindowOrigins(payload)
}

function mergeWindowOrigins(
  currentOrigins: Record<string, WindowOriginMeta>,
  importedOrigins: Record<string, WindowOriginMeta>
) {
  const next = { ...currentOrigins }

  Object.entries(importedOrigins).forEach(([windowId, importedMeta]) => {
    const previous = next[windowId]

    if (!previous || importedMeta.createdAt >= previous.createdAt) {
      next[windowId] = importedMeta
    }
  })

  return next
}

function getInitialFormState(): SilenceFormState {
  return {
    startTime: "",
    endTime: "",
    recurrence: "",
  }
}

function parseDate(value: string | null | undefined) {
  if (!value) {
    return null
  }

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return null
  }

  return date
}

function normalizeRecurrence(value: string | null | undefined) {
  return (value || "").trim()
}

function toLocalDatetimeInputValue(value: string | null | undefined) {
  const date = parseDate(value)

  if (!date) {
    return ""
  }

  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")
  const hours = String(date.getHours()).padStart(2, "0")
  const minutes = String(date.getMinutes()).padStart(2, "0")

  return `${year}-${month}-${day}T${hours}:${minutes}`
}

function formatDateTime(value: string | null | undefined, locale: "zh" | "en") {
  const date = parseDate(value)

  if (!date) {
    return "-"
  }

  return date.toLocaleString(locale === "zh" ? "zh-CN" : "en-US", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  })
}

function getWindowStatus(window: SilenceWindow, currentTime = Date.now()): SilenceStatus {
  const startTime = parseDate(window.start_time)?.getTime()
  const endTime = parseDate(window.end_time)?.getTime()

  if (!startTime || !endTime) {
    return "unknown"
  }

  if (currentTime < startTime) {
    return "scheduled"
  }

  if (currentTime > endTime) {
    return "expired"
  }

  return "active"
}

function formatDuration(milliseconds: number, locale: "zh" | "en") {
  const totalMinutes = Math.floor(milliseconds / 60000)

  if (totalMinutes < 0) {
    return "-"
  }

  const days = Math.floor(totalMinutes / (24 * 60))
  const hours = Math.floor((totalMinutes % (24 * 60)) / 60)
  const minutes = totalMinutes % 60

  if (locale === "zh") {
    if (days > 0) {
      return `${days} 天 ${hours} 小时`
    }

    if (hours > 0) {
      return `${hours} 小时 ${minutes} 分钟`
    }

    return `${minutes} 分钟`
  }

  if (days > 0) {
    return `${days}d ${hours}h`
  }

  if (hours > 0) {
    return `${hours}h ${minutes}m`
  }

  return `${minutes}m`
}

function getStatusMeta(
  status: SilenceStatus,
  t: (path: any, values?: Record<string, string | number>) => string
) {
  if (status === "active") {
    return {
      label: t("notifications.silenceStatusActive"),
      className: "border-emerald-500/30 bg-emerald-500/10 text-emerald-600",
    }
  }

  if (status === "scheduled") {
    return {
      label: t("notifications.silenceStatusScheduled"),
      className: "border-amber-500/30 bg-amber-500/10 text-amber-600",
    }
  }

  if (status === "expired") {
    return {
      label: t("notifications.silenceStatusExpired"),
      className: "border-muted bg-muted text-muted-foreground",
    }
  }

  return {
    label: t("notifications.silenceStatusUnknown"),
    className: "border-red-500/30 bg-red-500/10 text-red-600",
  }
}

function toSilencePayload(form: SilenceFormState): CreateSilenceWindowRequest | null {
  if (!form.startTime || !form.endTime) {
    return null
  }

  const startDate = parseDate(form.startTime)
  const endDate = parseDate(form.endTime)

  if (!startDate || !endDate) {
    return null
  }

  if (endDate.getTime() <= startDate.getTime()) {
    return null
  }

  const payload: CreateSilenceWindowRequest = {
    start_time: startDate.toISOString(),
    end_time: endDate.toISOString(),
  }

  const recurrenceValue = normalizeRecurrence(form.recurrence)

  if (recurrenceValue) {
    payload.recurrence = recurrenceValue
  }

  return payload
}

function isWindowMatchingPayload(window: SilenceWindow, payload: CreateSilenceWindowRequest) {
  const windowStart = parseDate(window.start_time)?.getTime()
  const windowEnd = parseDate(window.end_time)?.getTime()
  const payloadStart = parseDate(payload.start_time)?.getTime()
  const payloadEnd = parseDate(payload.end_time)?.getTime()

  if (!windowStart || !windowEnd || !payloadStart || !payloadEnd) {
    return false
  }

  if (windowStart !== payloadStart || windowEnd !== payloadEnd) {
    return false
  }

  return normalizeRecurrence(window.recurrence) === normalizeRecurrence(payload.recurrence)
}

function resolveCreatedWindowId(
  windows: SilenceWindow[],
  payload: CreateSilenceWindowRequest,
  excludedId?: string
) {
  const matched = windows
    .filter((window) => window.id !== excludedId)
    .filter((window) => isWindowMatchingPayload(window, payload))
    .sort((left, right) => {
      const rightCreated = parseDate(right.created_at)?.getTime() || 0
      const leftCreated = parseDate(left.created_at)?.getTime() || 0

      if (rightCreated !== leftCreated) {
        return rightCreated - leftCreated
      }

      const rightUpdated = parseDate(right.updated_at)?.getTime() || 0
      const leftUpdated = parseDate(left.updated_at)?.getTime() || 0

      if (rightUpdated !== leftUpdated) {
        return rightUpdated - leftUpdated
      }

      return right.id.localeCompare(left.id)
    })

  if (matched.length === 0) {
    return null
  }

  return matched[0].id
}

export default function SilenceWindowsPage() {
  const { t, locale } = useAppTranslations("pages")
  const {
    data: windows,
    loading,
    refreshing,
    execute,
  } = useRequestState<SilenceWindow[]>([])

  const [searchKeyword, setSearchKeyword] = useState("")
  const [statusFilter, setStatusFilter] = useState<SilenceStatusFilter>("all")
  const [originModeFilter, setOriginModeFilter] = useState<WindowOriginModeFilter>("all")
  const [onlyOriginMarked, setOnlyOriginMarked] = useState(false)

  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [createSubmitting, setCreateSubmitting] = useState(false)
  const [createForm, setCreateForm] = useState<SilenceFormState>(getInitialFormState)

  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [editingWindow, setEditingWindow] = useState<SilenceWindow | null>(null)
  const [editSubmitting, setEditSubmitting] = useState(false)
  const [editForm, setEditForm] = useState<SilenceFormState>(getInitialFormState)
  const [replaceOriginalAfterEdit, setReplaceOriginalAfterEdit] = useState(true)

  const [windowOriginTtlDays, setWindowOriginTtlDays] = useState<(typeof WINDOW_ORIGIN_TTL_OPTIONS)[number]>(
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

  const fetchWindows = useCallback(
    async (silent = false) => {
      return await execute(
        () => api.listSilenceWindows({ limit: PAGE_LIMIT, offset: 0 }),
        {
          silent,
          onError: (error) => {
            toast.error(getApiErrorMessage(error, t("notifications.silenceToastFetchError")))
          },
        }
      )
    },
    [execute, t]
  )

  useEffect(() => {
    fetchWindows()
  }, [fetchWindows])

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

  const resetFilters = () => {
    setSearchKeyword("")
    setStatusFilter("all")
    setOriginModeFilter("all")
    setOnlyOriginMarked(false)
  }

  const clearWindowOrigins = () => {
    setWindowOrigins({})
    toast.success(t("notifications.silenceToastClearOriginsSuccess"))
  }

  const handleWindowOriginTtlDaysChange = (value: string) => {
    setWindowOriginTtlDays(normalizeWindowOriginTtlDays(value))
  }

  const triggerImportWindowOrigins = () => {
    importOriginsInputRef.current?.click()
  }

  const handleImportWindowOrigins = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = ""

    if (!file) {
      return
    }

    setImportingOrigins(true)

    try {
      const fileContent = await file.text()
      const parsedContent = JSON.parse(fileContent)
      const importedOrigins = parseImportedWindowOrigins(parsedContent)
      const importedCount = Object.keys(importedOrigins).length

      if (importedCount === 0) {
        toast.error(t("notifications.silenceToastImportOriginsEmpty"))
        return
      }

      setWindowOrigins((previous) => {
        const merged = mergeWindowOrigins(previous, importedOrigins)
        return filterActiveWindowOrigins(merged, windowOriginTtlMs)
      })

      toast.success(t("notifications.silenceToastImportOriginsSuccess", { count: importedCount }))
    } catch {
      toast.error(t("notifications.silenceToastImportOriginsError"))
    } finally {
      setImportingOrigins(false)
    }
  }

  const exportWindowOrigins = () => {
    if (!hasWindowOrigins) {
      toast.error(t("notifications.silenceToastExportOriginsEmpty"))
      return
    }

    try {
      const exportedAt = new Date()
      const entries = Object.entries(windowOrigins)
        .map(([windowId, originMeta]) => ({
          window_id: windowId,
          source_id: originMeta.sourceId,
          mode: originMeta.mode,
          created_at: new Date(originMeta.createdAt).toISOString(),
        }))
        .sort((left, right) => right.created_at.localeCompare(left.created_at))

      const payload = {
        schema_version: 1,
        exported_at: exportedAt.toISOString(),
        ttl_days: windowOriginTtlDays,
        total: entries.length,
        mode_counts: originModeCounts,
        entries,
      }

      const fileContent = JSON.stringify(payload, null, 2)
      const blob = new Blob([fileContent], { type: "application/json" })
      const objectUrl = window.URL.createObjectURL(blob)
      const downloadLink = document.createElement("a")
      const fileTimestamp = exportedAt.toISOString().replace(/[:.]/g, "-")

      downloadLink.href = objectUrl
      downloadLink.download = `silence-origin-marks-${fileTimestamp}.json`
      downloadLink.style.display = "none"

      document.body.appendChild(downloadLink)
      downloadLink.click()
      downloadLink.remove()

      window.URL.revokeObjectURL(objectUrl)

      toast.success(t("notifications.silenceToastExportOriginsSuccess", { count: entries.length }))
    } catch {
      toast.error(t("notifications.silenceToastExportOriginsError"))
    }
  }

  const getStatusAwareMessage = (
    error: unknown,
    fallback: string,
    statusMessages?: Partial<Record<number, string>>
  ) => {
    if (error instanceof ApiRequestError && statusMessages?.[error.status]) {
      return statusMessages[error.status] as string
    }

    return getApiErrorMessage(error, fallback)
  }

  const validateFormAndGetPayload = (form: SilenceFormState) => {
    if (!form.startTime || !form.endTime) {
      toast.error(t("notifications.silenceToastTimeRequired"))
      return null
    }

    const payload = toSilencePayload(form)

    if (!payload) {
      const startDate = parseDate(form.startTime)
      const endDate = parseDate(form.endTime)

      if (!startDate || !endDate) {
        toast.error(t("notifications.silenceToastTimeInvalid"))
      } else {
        toast.error(t("notifications.silenceToastTimeOrderInvalid"))
      }

      return null
    }

    return payload
  }

  const handleCreateWindow = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const payload = validateFormAndGetPayload(createForm)

    if (!payload) {
      return
    }

    setCreateSubmitting(true)

    try {
      await api.createSilenceWindow(payload)
      toast.success(t("notifications.silenceToastCreateSuccess"))
      setIsCreateDialogOpen(false)
      setCreateForm(getInitialFormState())
      await fetchWindows(true)
    } catch (error) {
      toast.error(getApiErrorMessage(error, t("notifications.silenceToastCreateError")))
    } finally {
      setCreateSubmitting(false)
    }
  }

  const openEditDialog = (window: SilenceWindow) => {
    setEditingWindow(window)
    setEditForm({
      startTime: toLocalDatetimeInputValue(window.start_time),
      endTime: toLocalDatetimeInputValue(window.end_time),
      recurrence: window.recurrence || "",
    })
    setReplaceOriginalAfterEdit(true)
    setIsEditDialogOpen(true)
  }

  const handleEditWindow = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!editingWindow) {
      return
    }

    const payload = validateFormAndGetPayload(editForm)

    if (!payload) {
      return
    }

    setEditSubmitting(true)

    try {
      const createdWindow = await api.createSilenceWindow(payload)
      let originMode: WindowOriginMode = replaceOriginalAfterEdit ? "replaced" : "cloned"

      if (replaceOriginalAfterEdit) {
        try {
          await api.deleteSilenceWindow(editingWindow.id)
          toast.success(t("notifications.silenceToastUpdateSuccess"))
        } catch {
          originMode = "cloned"
          toast.warning(
            t("notifications.silenceToastReplaceDeleteWarning", {
              id: editingWindow.id,
            })
          )
          toast.success(t("notifications.silenceToastCloneSuccess"))
        }
      } else {
        toast.success(t("notifications.silenceToastCloneSuccess"))
      }

      const latestWindows = await fetchWindows(true)
      const directId = createdWindow && typeof createdWindow.id === "string"
        ? createdWindow.id
        : null
      const resolvedId = latestWindows
        ? resolveCreatedWindowId(latestWindows, payload, editingWindow.id)
        : null
      const targetId = directId || resolvedId

      if (targetId) {
        setWindowOrigins((previous) => ({
          ...previous,
          [targetId]: {
            sourceId: editingWindow.id,
            mode: originMode,
            createdAt: Date.now(),
          },
        }))
      }

      setIsEditDialogOpen(false)
      setEditingWindow(null)
      setEditForm(getInitialFormState())
    } catch (error) {
      toast.error(getApiErrorMessage(error, t("notifications.silenceToastUpdateError")))
    } finally {
      setEditSubmitting(false)
    }
  }

  const handleDeleteWindow = async () => {
    if (!deleteDialogWindow) {
      return
    }

    setDeletingId(deleteDialogWindow.id)

    try {
      await api.deleteSilenceWindow(deleteDialogWindow.id)
      setWindowOrigins((previous) => {
        const next = { ...previous }
        delete next[deleteDialogWindow.id]

        Object.keys(next).forEach((windowId) => {
          if (next[windowId].sourceId === deleteDialogWindow.id) {
            delete next[windowId]
          }
        })

        return next
      })

      toast.success(t("notifications.silenceToastDeleteSuccess"))
      setDeleteDialogWindow(null)
      await fetchWindows(true)
    } catch (error) {
      toast.error(
        getStatusAwareMessage(error, t("notifications.silenceToastDeleteError"), {
          404: t("notifications.silenceToastDeleteNotFound"),
        })
      )
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="space-y-1">
          <h2 className="text-2xl font-bold tracking-tight">{t("notifications.silenceTitle")}</h2>
          <p className="text-sm text-muted-foreground">{t("notifications.silenceDescription")}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => fetchWindows(true)}
            disabled={refreshing}
          >
            {refreshing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
            {t("notifications.silenceRefreshButton")}
          </Button>
          <Button type="button" onClick={() => setIsCreateDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            {t("notifications.silenceCreateButton")}
          </Button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>{t("notifications.silenceStatTotal")}</CardDescription>
            <CardTitle className="text-2xl">{stats.total}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>{t("notifications.silenceStatActive")}</CardDescription>
            <CardTitle className="text-2xl text-emerald-600">{stats.active}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>{t("notifications.silenceStatScheduled")}</CardDescription>
            <CardTitle className="text-2xl text-amber-600">{stats.scheduled}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>{t("notifications.silenceStatExpired")}</CardDescription>
            <CardTitle className="text-2xl text-muted-foreground">{stats.expired}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      <SilenceFiltersCard
        searchKeyword={searchKeyword}
        statusFilter={statusFilter}
        originModeFilter={originModeFilter}
        windowOriginTtlDays={windowOriginTtlDays}
        onlyOriginMarked={onlyOriginMarked}
        hasActiveFilters={hasActiveFilters}
        hasWindowOrigins={hasWindowOrigins}
        importingOrigins={importingOrigins}
        originMarksCount={originMarksCount}
        originModeCounts={originModeCounts}
        importOriginsInputRef={importOriginsInputRef}
        onSearchKeywordChange={setSearchKeyword}
        onStatusFilterChange={(value) => setStatusFilter(value as SilenceStatusFilter)}
        onOriginModeFilterChange={(value) => setOriginModeFilter(value as WindowOriginModeFilter)}
        onWindowOriginTtlDaysChange={handleWindowOriginTtlDaysChange}
        onOnlyOriginMarkedChange={setOnlyOriginMarked}
        onImportWindowOrigins={handleImportWindowOrigins}
        onResetFilters={resetFilters}
        onClearWindowOrigins={clearWindowOrigins}
        onTriggerImportOrigins={triggerImportWindowOrigins}
        onExportWindowOrigins={exportWindowOrigins}
      />

      <Card>
        <CardHeader>
          <CardTitle>{t("notifications.silenceTableTitle")}</CardTitle>
          <CardDescription>{t("notifications.silenceTableDescription")}</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("notifications.silenceTableColWindow")}</TableHead>
                <TableHead>{t("notifications.silenceTableColRange")}</TableHead>
                <TableHead>{t("notifications.silenceTableColRecurrence")}</TableHead>
                <TableHead>{t("notifications.silenceTableColStatus")}</TableHead>
                <TableHead>{t("notifications.silenceTableColCreatedAt")}</TableHead>
                <TableHead className="text-right">{t("notifications.silenceTableColActions")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({ length: 4 }).map((_, index) => (
                  <TableRow key={index}>
                    <TableCell colSpan={6} className="h-16 text-muted-foreground">
                      {t("notifications.silenceTableLoading")}
                    </TableCell>
                  </TableRow>
                ))
              ) : filteredWindows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-40 text-center text-muted-foreground">
                    <div className="mx-auto flex max-w-sm flex-col items-center gap-2">
                      <ShieldOff className="h-5 w-5" />
                      <p>
                        {hasActiveFilters
                          ? t("notifications.silenceTableEmptyFiltered")
                          : t("notifications.silenceTableEmpty")}
                      </p>
                      {!hasActiveFilters ? (
                        <p className="text-xs">{t("notifications.silenceTableEmptyHint")}</p>
                      ) : null}
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filteredWindows.map((window) => {
                  const status = getWindowStatus(window)
                  const statusMeta = getStatusMeta(status, t)
                  const startDate = parseDate(window.start_time)
                  const endDate = parseDate(window.end_time)
                  const duration = startDate && endDate
                    ? formatDuration(endDate.getTime() - startDate.getTime(), locale)
                    : t("notifications.silenceDurationUnknown")
                  const origin = windowOrigins[window.id]

                  return (
                    <TableRow key={window.id}>
                      <TableCell>
                        <div className="space-y-1">
                          <p className="font-medium">
                            {window.name || t("notifications.silenceWindowNameFallback", { id: window.id })}
                          </p>
                          <p className="font-mono text-xs text-muted-foreground">{window.id}</p>
                          {origin ? (
                            <p className="text-[11px] text-muted-foreground">
                              {origin.mode === "replaced"
                                ? t("notifications.silenceOriginReplacedFrom", { id: origin.sourceId })
                                : t("notifications.silenceOriginClonedFrom", { id: origin.sourceId })}
                            </p>
                          ) : null}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1 text-xs text-muted-foreground">
                          <p>{formatDateTime(window.start_time, locale)}</p>
                          <p>{formatDateTime(window.end_time, locale)}</p>
                          <p>{t("notifications.silenceDurationLabel", { duration })}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-muted-foreground">
                          {window.recurrence || t("notifications.silenceRecurrenceOnce")}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={statusMeta.className}>
                          {statusMeta.label}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {formatDateTime(window.created_at, locale)}
                      </TableCell>
                      <TableCell>
                        <div className="flex justify-end gap-1">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => openEditDialog(window)}
                            title={t("notifications.silenceActionEdit")}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => setDeleteDialogWindow(window)}
                            title={t("notifications.silenceActionDelete")}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog
        open={isCreateDialogOpen}
        onOpenChange={(open) => {
          setIsCreateDialogOpen(open)
          if (!open) {
            setCreateForm(getInitialFormState())
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("notifications.silenceCreateDialogTitle")}</DialogTitle>
            <DialogDescription>{t("notifications.silenceCreateDialogDescription")}</DialogDescription>
          </DialogHeader>

          <form className="space-y-4" onSubmit={handleCreateWindow}>
            <div className="space-y-2">
              <Label htmlFor="silence-start-time">{t("notifications.silenceFieldStart")}</Label>
              <Input
                id="silence-start-time"
                type="datetime-local"
                value={createForm.startTime}
                onChange={(event) =>
                  setCreateForm((previous) => ({
                    ...previous,
                    startTime: event.target.value,
                  }))
                }
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="silence-end-time">{t("notifications.silenceFieldEnd")}</Label>
              <Input
                id="silence-end-time"
                type="datetime-local"
                value={createForm.endTime}
                onChange={(event) =>
                  setCreateForm((previous) => ({
                    ...previous,
                    endTime: event.target.value,
                  }))
                }
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="silence-recurrence">{t("notifications.silenceFieldRecurrence")}</Label>
              <Input
                id="silence-recurrence"
                value={createForm.recurrence}
                onChange={(event) =>
                  setCreateForm((previous) => ({
                    ...previous,
                    recurrence: event.target.value,
                  }))
                }
                placeholder={t("notifications.silenceFieldRecurrencePlaceholder")}
              />
              <p className="text-xs text-muted-foreground">{t("notifications.silenceFieldRecurrenceHint")}</p>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsCreateDialogOpen(false)}
                disabled={createSubmitting}
              >
                {t("notifications.silenceDialogCancel")}
              </Button>
              <Button type="submit" disabled={createSubmitting}>
                {createSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                {createSubmitting
                  ? t("notifications.silenceDialogCreating")
                  : t("notifications.silenceDialogCreateSubmit")}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog
        open={isEditDialogOpen}
        onOpenChange={(open) => {
          setIsEditDialogOpen(open)

          if (!open) {
            setEditingWindow(null)
            setEditForm(getInitialFormState())
            setReplaceOriginalAfterEdit(true)
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("notifications.silenceEditDialogTitle")}</DialogTitle>
            <DialogDescription>
              {t("notifications.silenceEditDialogDescription", {
                id: editingWindow?.id || t("notifications.silenceUnknownId"),
              })}
            </DialogDescription>
          </DialogHeader>

          <form className="space-y-4" onSubmit={handleEditWindow}>
            <div className="space-y-2">
              <Label htmlFor="silence-edit-start-time">{t("notifications.silenceFieldStart")}</Label>
              <Input
                id="silence-edit-start-time"
                type="datetime-local"
                value={editForm.startTime}
                onChange={(event) =>
                  setEditForm((previous) => ({
                    ...previous,
                    startTime: event.target.value,
                  }))
                }
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="silence-edit-end-time">{t("notifications.silenceFieldEnd")}</Label>
              <Input
                id="silence-edit-end-time"
                type="datetime-local"
                value={editForm.endTime}
                onChange={(event) =>
                  setEditForm((previous) => ({
                    ...previous,
                    endTime: event.target.value,
                  }))
                }
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="silence-edit-recurrence">{t("notifications.silenceFieldRecurrence")}</Label>
              <Input
                id="silence-edit-recurrence"
                value={editForm.recurrence}
                onChange={(event) =>
                  setEditForm((previous) => ({
                    ...previous,
                    recurrence: event.target.value,
                  }))
                }
                placeholder={t("notifications.silenceFieldRecurrencePlaceholder")}
              />
              <p className="text-xs text-muted-foreground">{t("notifications.silenceFieldRecurrenceHint")}</p>
            </div>

            <div className="flex items-start justify-between rounded-md border p-3">
              <div className="space-y-1">
                <p className="text-sm font-medium">{t("notifications.silenceFieldReplaceOriginal")}</p>
                <p className="text-xs text-muted-foreground">
                  {t("notifications.silenceFieldReplaceOriginalHint")}
                </p>
              </div>
              <Switch
                checked={replaceOriginalAfterEdit}
                onCheckedChange={setReplaceOriginalAfterEdit}
              />
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsEditDialogOpen(false)}
                disabled={editSubmitting}
              >
                {t("notifications.silenceDialogCancel")}
              </Button>
              <Button type="submit" disabled={editSubmitting}>
                {editSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                {editSubmitting
                  ? t("notifications.silenceDialogUpdating")
                  : t("notifications.silenceDialogUpdateSubmit")}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={Boolean(deleteDialogWindow)}
        onOpenChange={(open) => {
          if (!open) {
            setDeleteDialogWindow(null)
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("notifications.silenceDeleteDialogTitle")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("notifications.silenceDeleteDialogDescription", {
                id: deleteDialogWindow?.id || t("notifications.silenceUnknownId"),
              })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={Boolean(deletingId)}>
              {t("notifications.silenceDialogCancel")}
            </AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={handleDeleteWindow}
              disabled={Boolean(deletingId)}
            >
              {deletingId ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              {t("notifications.silenceDeleteDialogConfirm")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
