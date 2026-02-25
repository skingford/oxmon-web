"use client"

import type { ChangeEvent, Dispatch, FormEvent, SetStateAction } from "react"
import { api } from "@/lib/api"
import {
  filterActiveWindowOrigins,
  getInitialFormState,
  mergeWindowOrigins,
  normalizeWindowOriginTtlDays,
  parseDate,
  parseImportedWindowOrigins,
  resolveCreatedWindowId,
  toLocalDatetimeInputValue,
  toSilencePayload,
  type SilenceFormState,
  type WindowOriginMeta,
  type WindowOriginMode,
  type WindowOriginTtlDays,
} from "@/lib/notifications/silence-utils"
import type { AppNamespaceTranslator } from "@/hooks/use-app-translations"
import type { SilenceWindow } from "@/types/api"
import { toast, toastActionSuccess, toastApiError, toastCreated, toastDeleted, toastStatusError, toastSaved } from "@/lib/toast"

type UseSilenceWindowsActionsOptions = {
  t: AppNamespaceTranslator<"pages">
  fetchWindows: (silent?: boolean) => Promise<SilenceWindow[] | null | undefined>
  windowOriginTtlDays: WindowOriginTtlDays
  windowOriginTtlMs: number
  windowOrigins: Record<string, WindowOriginMeta>
  hasWindowOrigins: boolean
  originModeCounts: { replaced: number; cloned: number }
  createForm: SilenceFormState
  editForm: SilenceFormState
  editingWindow: SilenceWindow | null
  replaceOriginalAfterEdit: boolean
  deleteDialogWindow: SilenceWindow | null
  setWindowOriginTtlDays: Dispatch<SetStateAction<WindowOriginTtlDays>>
  setWindowOrigins: Dispatch<SetStateAction<Record<string, WindowOriginMeta>>>
  setImportingOrigins: Dispatch<SetStateAction<boolean>>
  setCreateSubmitting: Dispatch<SetStateAction<boolean>>
  setCreateForm: Dispatch<SetStateAction<SilenceFormState>>
  setIsCreateDialogOpen: Dispatch<SetStateAction<boolean>>
  setEditingWindow: Dispatch<SetStateAction<SilenceWindow | null>>
  setEditSubmitting: Dispatch<SetStateAction<boolean>>
  setEditForm: Dispatch<SetStateAction<SilenceFormState>>
  setIsEditDialogOpen: Dispatch<SetStateAction<boolean>>
  setReplaceOriginalAfterEdit: Dispatch<SetStateAction<boolean>>
  setDeletingId: Dispatch<SetStateAction<string | null>>
  setDeleteDialogWindow: Dispatch<SetStateAction<SilenceWindow | null>>
}

export function useSilenceWindowsActions({
  t,
  fetchWindows,
  windowOriginTtlDays,
  windowOriginTtlMs,
  windowOrigins,
  hasWindowOrigins,
  originModeCounts,
  createForm,
  editForm,
  editingWindow,
  replaceOriginalAfterEdit,
  deleteDialogWindow,
  setWindowOriginTtlDays,
  setWindowOrigins,
  setImportingOrigins,
  setCreateSubmitting,
  setCreateForm,
  setIsCreateDialogOpen,
  setEditingWindow,
  setEditSubmitting,
  setEditForm,
  setIsEditDialogOpen,
  setReplaceOriginalAfterEdit,
  setDeletingId,
  setDeleteDialogWindow,
}: UseSilenceWindowsActionsOptions) {
  const clearWindowOrigins = () => {
    setWindowOrigins({})
    toastActionSuccess(t("notifications.silenceToastClearOriginsSuccess"))
  }

  const handleWindowOriginTtlDaysChange = (value: string) => {
    setWindowOriginTtlDays(normalizeWindowOriginTtlDays(value))
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
      toastCreated(t("notifications.silenceToastCreateSuccess"))
      setIsCreateDialogOpen(false)
      setCreateForm(getInitialFormState())
      await fetchWindows(true)
    } catch (error) {
      toastApiError(error, t("notifications.silenceToastCreateError"))
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
          toastSaved(t("notifications.silenceToastUpdateSuccess"))
        } catch {
          originMode = "cloned"
          toast.warning(
            t("notifications.silenceToastReplaceDeleteWarning", {
              id: editingWindow.id,
            })
          )
          toastActionSuccess(t("notifications.silenceToastCloneSuccess"))
        }
      } else {
        toastActionSuccess(t("notifications.silenceToastCloneSuccess"))
      }

      const latestWindows = await fetchWindows(true)
      const directId = createdWindow && typeof createdWindow.id === "string" ? createdWindow.id : null
      const resolvedId = latestWindows ? resolveCreatedWindowId(latestWindows, payload, editingWindow.id) : null
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
      toastApiError(error, t("notifications.silenceToastUpdateError"))
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

      toastDeleted(t("notifications.silenceToastDeleteSuccess"))
      setDeleteDialogWindow(null)
      await fetchWindows(true)
    } catch (error) {
      toastStatusError(error, t("notifications.silenceToastDeleteError"), {
        404: t("notifications.silenceToastDeleteNotFound"),
      })
    } finally {
      setDeletingId(null)
    }
  }

  return {
    clearWindowOrigins,
    handleWindowOriginTtlDaysChange,
    handleImportWindowOrigins,
    exportWindowOrigins,
    handleCreateWindow,
    openEditDialog,
    handleEditWindow,
    handleDeleteWindow,
  }
}
