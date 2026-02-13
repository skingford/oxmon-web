"use client"

import { ChangeEvent, FormEvent, useCallback, useEffect, useMemo, useRef, useState } from "react"
import { ApiRequestError, api, getApiErrorMessage } from "@/lib/api"
import { SilenceWindow } from "@/types/api"
import { useAppTranslations } from "@/hooks/use-app-translations"
import { useRequestState } from "@/hooks/use-request-state"
import {
  DAY_IN_MS,
  WINDOW_ORIGIN_STORAGE_KEY,
  WINDOW_ORIGIN_TTL_STORAGE_KEY,
  filterActiveWindowOrigins,
  formatDateTime,
  formatDuration,
  getInitialFormState,
  getStatusMeta,
  getWindowStatus,
  isWindowOriginExpired,
  mergeWindowOrigins,
  normalizeWindowOriginTtlDays,
  parseDate,
  parseImportedWindowOrigins,
  readWindowOriginTtlDaysFromStorage,
  readWindowOriginsFromStorage,
  resolveCreatedWindowId,
  toLocalDatetimeInputValue,
  toSilencePayload,
  type SilenceFormState,
  type SilenceStatusFilter,
  type WindowOriginMeta,
  type WindowOriginMode,
  type WindowOriginModeFilter,
  type WindowOriginTtlDays,
} from "@/lib/notifications/silence-utils"
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
