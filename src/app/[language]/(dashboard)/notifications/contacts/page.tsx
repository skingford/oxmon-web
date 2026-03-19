"use client"

import type { FormEvent } from "react"
import { useCallback, useEffect, useMemo, useState } from "react"
import { Loader2, Plus, RefreshCw } from "lucide-react"
import { api } from "@/lib/api"
import { buildTranslatedPaginationTextBundle } from "@/lib/pagination-summary"
import { getInstanceContactChannels, getInstanceContactPatternCount, normalizeInstanceContactPatternsInput } from "@/lib/notifications/instance-contact-utils"
import { toast, toastApiError, toastCreated, toastDeleted, toastSaved } from "@/lib/toast"
import { useAppTranslations } from "@/hooks/use-app-translations"
import { useRequestState } from "@/hooks/use-request-state"
import { useServerOffsetPagination } from "@/hooks/use-server-offset-pagination"
import type {
  CreateInstanceContactRequest,
  InstanceContactItem,
  InstanceContactQueryParams,
  ListResponse,
  UpdateInstanceContactRequest,
} from "@/types/api"
import { InstanceContactFormDialog, getDefaultInstanceContactFormState, type InstanceContactFormState } from "@/components/notifications/InstanceContactFormDialog"
import { InstanceContactsFiltersCard } from "@/components/notifications/InstanceContactsFiltersCard"
import { InstanceContactsStatsCards } from "@/components/notifications/InstanceContactsStatsCards"
import { InstanceContactsTable } from "@/components/notifications/InstanceContactsTable"
import { Button } from "@/components/ui/button"
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

const PAGE_SIZE_OPTIONS = [10, 20, 50] as const

type ContactsState = {
  contactsPage: ListResponse<InstanceContactItem>
  allContacts: InstanceContactItem[]
}

function buildInstanceContactFormState(contact: InstanceContactItem): InstanceContactFormState {
  return {
    patternsText: (contact.agent_patterns || []).join("\n"),
    contactName: contact.contact_name || "",
    contactEmail: contact.contact_email || "",
    contactPhone: contact.contact_phone || "",
    contactDingtalk: contact.contact_dingtalk || "",
    contactWebhook: contact.contact_webhook || "",
    description: contact.description || "",
    enabled: contact.enabled,
  }
}

function normalizeOptionalText(value: string) {
  const trimmed = value.trim()
  return trimmed ? trimmed : null
}

export default function InstanceContactsPage() {
  const { t, locale } = useAppTranslations("pages")
  const {
    data,
    loading,
    refreshing,
    execute,
  } = useRequestState<ContactsState>({
    contactsPage: {
      items: [],
      total: 0,
      limit: PAGE_SIZE_OPTIONS[1],
      offset: 0,
    },
    allContacts: [],
  })

  const [searchKeyword, setSearchKeyword] = useState("")
  const [statusFilter, setStatusFilter] = useState<"all" | "enabled" | "disabled">("all")
  const [searchKeywordDraft, setSearchKeywordDraft] = useState("")
  const [statusFilterDraft, setStatusFilterDraft] = useState<"all" | "enabled" | "disabled">("all")
  const [offset, setOffset] = useState(0)
  const [pageSize, setPageSize] = useState<(typeof PAGE_SIZE_OPTIONS)[number]>(PAGE_SIZE_OPTIONS[1])

  const [dialogOpen, setDialogOpen] = useState(false)
  const [dialogMode, setDialogMode] = useState<"create" | "edit">("create")
  const [editingContactId, setEditingContactId] = useState<string | null>(null)
  const [form, setForm] = useState<InstanceContactFormState>(getDefaultInstanceContactFormState)
  const [dialogLoading, setDialogLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [togglingId, setTogglingId] = useState<string | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<InstanceContactItem | null>(null)
  const [deleting, setDeleting] = useState(false)

  const fetchContacts = useCallback(async (silent = false) => {
    const params: InstanceContactQueryParams = {
      contact_name_contains: searchKeyword.trim() || undefined,
      enabled_eq:
        statusFilter === "all"
          ? undefined
          : statusFilter === "enabled",
      limit: pageSize,
      offset,
    }

    await execute(
      async () => {
        const [contactsPage, allContacts] = await Promise.all([
          api.listInstanceContactsPage(params),
          api.listInstanceContacts(),
        ])

        return {
          contactsPage,
          allContacts,
        }
      },
      {
        silent,
        onError: (error) => {
          toastApiError(error, t("notifications.contactsToastFetchError"))
        },
      }
    )
  }, [execute, offset, pageSize, searchKeyword, statusFilter, t])

  useEffect(() => {
    fetchContacts()
  }, [fetchContacts])

  const closeDialog = useCallback(() => {
    setDialogOpen(false)
    setDialogMode("create")
    setEditingContactId(null)
    setDialogLoading(false)
    setSubmitting(false)
    setForm(getDefaultInstanceContactFormState())
  }, [])

  const openCreateDialog = useCallback(() => {
    setDialogMode("create")
    setEditingContactId(null)
    setForm(getDefaultInstanceContactFormState())
    setDialogLoading(false)
    setDialogOpen(true)
  }, [])

  const openEditDialog = useCallback(async (contact: InstanceContactItem) => {
    setDialogMode("edit")
    setEditingContactId(contact.id)
    setDialogLoading(true)
    setDialogOpen(true)

    try {
      const detail = await api.getInstanceContact(contact.id)
      setForm(buildInstanceContactFormState(detail))
    } catch (error) {
      toastApiError(error, t("notifications.contactsToastFetchDetailError"))
      closeDialog()
    } finally {
      setDialogLoading(false)
    }
  }, [closeDialog, t])

  const hasActiveFilters = Boolean(searchKeyword.trim()) || statusFilter !== "all"
  const hasPendingChanges =
    searchKeywordDraft.trim() !== searchKeyword.trim() ||
    statusFilterDraft !== statusFilter

  const stats = useMemo(() => ({
    total: data.allContacts.length,
    enabled: data.allContacts.filter((contact) => contact.enabled).length,
    disabled: data.allContacts.filter((contact) => !contact.enabled).length,
    patterns: getInstanceContactPatternCount(data.allContacts),
  }), [data.allContacts])

  const pagination = useServerOffsetPagination({
    offset,
    limit: pageSize,
    currentItemsCount: data.contactsPage.items.length,
    totalItems: data.contactsPage.total,
  })

  const paginationText = useMemo(() => buildTranslatedPaginationTextBundle({
    t,
    summaryKey: "notifications.contactsPaginationSummary",
    total: data.contactsPage.total,
    start: pagination.rangeStart,
    end: pagination.rangeEnd,
    pageKey: "notifications.contactsPaginationPage",
    currentPage: pagination.currentPage,
    totalPages: pagination.totalPages,
    prevKey: "notifications.contactsPaginationPrev",
    nextKey: "notifications.contactsPaginationNext",
  }), [data.contactsPage.total, pagination.currentPage, pagination.rangeEnd, pagination.rangeStart, pagination.totalPages, t])

  const handleApplyFilters = useCallback(() => {
    setSearchKeyword(searchKeywordDraft.trim())
    setStatusFilter(statusFilterDraft)
    setOffset(0)
  }, [searchKeywordDraft, statusFilterDraft])

  const handleResetFilters = useCallback(() => {
    setSearchKeyword("")
    setStatusFilter("all")
    setSearchKeywordDraft("")
    setStatusFilterDraft("all")
    setOffset(0)
  }, [])

  const buildPayload = useCallback(() => {
    const agentPatterns = normalizeInstanceContactPatternsInput(form.patternsText)
    const contactName = form.contactName.trim()

    if (!contactName) {
      toast.error(t("notifications.contactsToastNameRequired"))
      return null
    }

    if (agentPatterns.length === 0) {
      toast.error(t("notifications.contactsToastPatternsRequired"))
      return null
    }

    const hasChannel =
      Boolean(form.contactEmail.trim()) ||
      Boolean(form.contactPhone.trim()) ||
      Boolean(form.contactDingtalk.trim()) ||
      Boolean(form.contactWebhook.trim())

    if (!hasChannel) {
      toast.error(t("notifications.contactsToastChannelRequired"))
      return null
    }

    return {
      agent_patterns: agentPatterns,
      contact_name: contactName,
      contact_email: normalizeOptionalText(form.contactEmail),
      contact_phone: normalizeOptionalText(form.contactPhone),
      contact_dingtalk: normalizeOptionalText(form.contactDingtalk),
      contact_webhook: normalizeOptionalText(form.contactWebhook),
      description: normalizeOptionalText(form.description),
    }
  }, [form, t])

  const handleSubmit = useCallback(async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const basePayload = buildPayload()
    if (!basePayload) {
      return
    }

    setSubmitting(true)

    try {
      if (dialogMode === "create") {
        await api.createInstanceContact(basePayload as CreateInstanceContactRequest)
        toastCreated(t("notifications.contactsToastCreateSuccess"))
      } else {
        if (!editingContactId) {
          return
        }

        await api.updateInstanceContact(editingContactId, {
          ...(basePayload as UpdateInstanceContactRequest),
          enabled: form.enabled,
        })
        toastSaved(t("notifications.contactsToastUpdateSuccess"))
      }

      closeDialog()
      await fetchContacts(true)
    } catch (error) {
      toastApiError(
        error,
        dialogMode === "create"
          ? t("notifications.contactsToastCreateError")
          : t("notifications.contactsToastUpdateError")
      )
    } finally {
      setSubmitting(false)
    }
  }, [buildPayload, closeDialog, dialogMode, editingContactId, fetchContacts, form.enabled, t])

  const handleToggleEnabled = useCallback(async (contact: InstanceContactItem) => {
    setTogglingId(contact.id)

    try {
      await api.updateInstanceContact(contact.id, {
        enabled: !contact.enabled,
      })
      await fetchContacts(true)
    } catch (error) {
      toastApiError(error, t("notifications.contactsToastToggleError"))
    } finally {
      setTogglingId(null)
    }
  }, [fetchContacts, t])

  const handleDelete = useCallback(async () => {
    if (!deleteTarget) {
      return
    }

    setDeleting(true)

    try {
      await api.deleteInstanceContact(deleteTarget.id)
      toastDeleted(t("notifications.contactsToastDeleteSuccess"))
      setDeleteTarget(null)

      if (data.contactsPage.items.length === 1 && offset > 0) {
        setOffset((prev) => Math.max(0, prev - pageSize))
      } else {
        await fetchContacts(true)
      }
    } catch (error) {
      toastApiError(error, t("notifications.contactsToastDeleteError"))
    } finally {
      setDeleting(false)
    }
  }, [data.contactsPage.items.length, deleteTarget, fetchContacts, offset, pageSize, t])

  const contactsWithChannels = useMemo(
    () => data.allContacts.filter((contact) => getInstanceContactChannels(contact).length > 0).length,
    [data.allContacts]
  )

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="space-y-1">
          <h2 className="text-2xl font-bold tracking-tight">{t("notifications.contactsTitle")}</h2>
          <p className="text-sm text-muted-foreground">
            {t("notifications.contactsDescription", { count: contactsWithChannels })}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button type="button" variant="outline" onClick={() => fetchContacts(true)} disabled={refreshing}>
            {refreshing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
            {t("notifications.contactsRefreshButton")}
          </Button>
          <Button type="button" onClick={openCreateDialog}>
            <Plus className="mr-2 h-4 w-4" />
            {t("notifications.contactsCreateButton")}
          </Button>
        </div>
      </div>

      <InstanceContactsStatsCards
        stats={stats}
        texts={{
          total: t("notifications.contactsStatTotal"),
          enabled: t("notifications.contactsStatEnabled"),
          disabled: t("notifications.contactsStatDisabled"),
          patterns: t("notifications.contactsStatPatterns"),
        }}
      />

      <InstanceContactsFiltersCard
        searchKeyword={searchKeywordDraft}
        statusFilter={statusFilterDraft}
        hasPendingChanges={hasPendingChanges}
        hasActiveFilters={hasActiveFilters}
        onSearchKeywordChange={setSearchKeywordDraft}
        onStatusFilterChange={setStatusFilterDraft}
        onApplyFilters={handleApplyFilters}
        onResetFilters={handleResetFilters}
        texts={{
          title: t("notifications.contactsFiltersTitle"),
          description: t("notifications.contactsFiltersDescription"),
          searchLabel: t("notifications.contactsSearchLabel"),
          searchPlaceholder: t("notifications.contactsSearchPlaceholder"),
          statusLabel: t("notifications.contactsFilterStatusLabel"),
          statusAll: t("notifications.contactsFilterStatusAll"),
          statusEnabled: t("notifications.contactsFilterStatusEnabled"),
          statusDisabled: t("notifications.contactsFilterStatusDisabled"),
          applyFilters: t("notifications.contactsApplyFilters"),
          clearFilters: t("notifications.contactsClearFilters"),
          pendingFilterChanges: t("notifications.contactsPendingFilterChanges"),
        }}
      />

      <InstanceContactsTable
        loading={loading}
        contacts={data.contactsPage.items}
        hasActiveFilters={hasActiveFilters}
        togglingId={togglingId}
        locale={locale}
        pagination={{
          pageSize,
          pageSizeOptions: [...PAGE_SIZE_OPTIONS],
          onPageSizeChange: (nextPageSize) => {
            const normalized = PAGE_SIZE_OPTIONS.includes(nextPageSize as (typeof PAGE_SIZE_OPTIONS)[number])
              ? (nextPageSize as (typeof PAGE_SIZE_OPTIONS)[number])
              : PAGE_SIZE_OPTIONS[1]
            setPageSize(normalized)
            setOffset(0)
          },
          pageSizePlaceholder: t("notifications.contactsPageSizePlaceholder"),
          pageSizeOptionLabel: (value) => t("notifications.contactsPageSizeOption", { value }),
          onPrevPage: () => setOffset((prev) => Math.max(0, prev - pageSize)),
          onNextPage: () => setOffset((prev) => prev + pageSize),
          prevDisabled: loading || !pagination.canGoPrev,
          nextDisabled: loading || !pagination.canGoNext,
          ...paginationText,
        }}
        onToggleEnabled={handleToggleEnabled}
        onEdit={openEditDialog}
        onDelete={setDeleteTarget}
        texts={{
          title: t("notifications.contactsTableTitle"),
          description: t("notifications.contactsTableDescription"),
          colName: t("notifications.contactsTableColName"),
          colPatterns: t("notifications.contactsTableColPatterns"),
          colChannels: t("notifications.contactsTableColChannels"),
          colStatus: t("notifications.contactsTableColStatus"),
          colUpdatedAt: t("notifications.contactsTableColUpdatedAt"),
          colActions: t("notifications.contactsTableColActions"),
          loading: t("notifications.contactsTableLoading"),
          empty: t("notifications.contactsTableEmpty"),
          emptyFiltered: t("notifications.contactsTableEmptyFiltered"),
          actionEdit: t("notifications.actionEdit"),
          actionDelete: t("notifications.actionDelete"),
          channelEmail: t("notifications.contactsChannelEmail"),
          channelPhone: t("notifications.contactsChannelPhone"),
          channelDingtalk: t("notifications.contactsChannelDingtalk"),
          channelWebhook: t("notifications.contactsChannelWebhook"),
          patternMore: t("notifications.contactsPatternMore", { count: "{count}" }),
          toggleLabel: t("notifications.contactsToggleLabel"),
          statusEnabled: t("notifications.statusEnabled"),
          statusDisabled: t("notifications.statusDisabled"),
        }}
      />

      <InstanceContactFormDialog
        open={dialogOpen}
        mode={dialogMode}
        loading={dialogLoading}
        submitting={submitting}
        form={form}
        onOpenChange={(open) => {
          if (!open && !submitting) {
            closeDialog()
          }
        }}
        onFormChange={setForm}
        onSubmit={handleSubmit}
        t={t}
      />

      <AlertDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => {
          if (!open && !deleting) {
            setDeleteTarget(null)
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("notifications.contactsDeleteDialogTitle")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("notifications.contactsDeleteDialogDescription", {
                name: deleteTarget?.contact_name || "-",
              })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>{t("notifications.dialogCancel")}</AlertDialogCancel>
            <AlertDialogAction variant="destructive" onClick={handleDelete} disabled={deleting}>
              {deleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              {t("notifications.actionDelete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
