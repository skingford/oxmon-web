"use client"

import { useCallback, useEffect } from "react"
import { api } from "@/lib/api"
import { SilenceWindow } from "@/types/api"
import { useAppTranslations } from "@/hooks/use-app-translations"
import { useRequestState } from "@/hooks/use-request-state"
import { useSilenceWindowsActions } from "@/hooks/use-silence-windows-actions"
import { useSilenceWindowsPageState } from "@/hooks/use-silence-windows-page-state"
import { getInitialFormState, type SilenceStatusFilter, type WindowOriginModeFilter } from "@/lib/notifications/silence-utils"
import { Button } from "@/components/ui/button"
import { SilenceFiltersCard } from "@/components/notifications/SilenceFiltersCard"
import { SilenceStatsCards } from "@/components/notifications/SilenceStatsCards"
import { SilenceWindowDeleteDialog } from "@/components/notifications/SilenceWindowDeleteDialog"
import { SilenceWindowFormDialog } from "@/components/notifications/SilenceWindowFormDialog"
import { SilenceWindowsTableCard } from "@/components/notifications/SilenceWindowsTableCard"
import {
  Loader2,
  Plus,
  RefreshCw,
} from "lucide-react"
import { toastApiError } from "@/lib/toast"

const PAGE_LIMIT = 100

export default function SilenceWindowsPage() {
  const { t, locale } = useAppTranslations("pages")
  const {
    data: windows,
    loading,
    refreshing,
    execute,
  } = useRequestState<SilenceWindow[]>([])

  const fetchWindows = useCallback(
    async (silent = false) => {
      return await execute(
        () => api.listSilenceWindows({ limit: PAGE_LIMIT, offset: 0 }),
        {
          silent,
          onError: (error) => {
            toastApiError(error, t("notifications.silenceToastFetchError"))
          },
        }
      )
    },
    [execute, t]
  )

  useEffect(() => {
    fetchWindows()
  }, [fetchWindows])

  const {
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
    tablePageSizeOptions,
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
  } = useSilenceWindowsPageState({ windows })

  const triggerImportWindowOrigins = () => {
    importOriginsInputRef.current?.click()
  }

  const {
    clearWindowOrigins,
    handleWindowOriginTtlDaysChange,
    handleImportWindowOrigins,
    exportWindowOrigins,
    handleCreateWindow,
    openEditDialog,
    handleEditWindow,
    handleDeleteWindow,
  } = useSilenceWindowsActions({
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
  })

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

      <SilenceStatsCards t={t} stats={stats} />

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

      <SilenceWindowsTableCard
        t={t}
        locale={locale}
        loading={loading}
        windows={tablePagination.paginatedItems}
        windowOrigins={windowOrigins}
        hasActiveFilters={hasActiveFilters}
        onEditWindow={openEditDialog}
        onDeleteWindow={setDeleteDialogWindow}
        pagination={{
          totalRows: tablePagination.totalRows,
          currentPage: tablePagination.currentPage,
          totalPages: tablePagination.totalPages,
          startIndex: tablePagination.startIndex,
          endIndex: tablePagination.endIndex,
          pageSize: tablePageSize,
          pageSizeOptions: [...tablePageSizeOptions],
          onPageSizeChange: setTablePageSize,
          onPrevPage: () => tablePagination.setPage((prev) => Math.max(1, prev - 1)),
          onNextPage: () => tablePagination.setPage((prev) => Math.min(tablePagination.totalPages, prev + 1)),
          prevDisabled: tablePagination.currentPage <= 1 || tablePagination.totalRows === 0,
          nextDisabled: tablePagination.currentPage >= tablePagination.totalPages || tablePagination.totalRows === 0,
        }}
      />

      <SilenceWindowFormDialog
        t={t}
        open={isCreateDialogOpen}
        mode="create"
        form={createForm}
        submitting={createSubmitting}
        onOpenChange={(open) => {
          setIsCreateDialogOpen(open)
          if (!open) {
            setCreateForm(getInitialFormState())
          }
        }}
        onFormChange={setCreateForm}
        onSubmit={handleCreateWindow}
      />

      <SilenceWindowFormDialog
        t={t}
        open={isEditDialogOpen}
        mode="edit"
        form={editForm}
        submitting={editSubmitting}
        editWindowId={editingWindow?.id}
        replaceOriginalAfterEdit={replaceOriginalAfterEdit}
        onReplaceOriginalAfterEditChange={setReplaceOriginalAfterEdit}
        onOpenChange={(open) => {
          setIsEditDialogOpen(open)

          if (!open) {
            setEditingWindow(null)
            setEditForm(getInitialFormState())
            setReplaceOriginalAfterEdit(true)
          }
        }}
        onFormChange={setEditForm}
        onSubmit={handleEditWindow}
      />

      <SilenceWindowDeleteDialog
        t={t}
        open={Boolean(deleteDialogWindow)}
        deleting={Boolean(deletingId)}
        targetId={deleteDialogWindow?.id}
        onOpenChange={(open) => {
          if (!open) {
            setDeleteDialogWindow(null)
          }
        }}
        onConfirm={handleDeleteWindow}
      />
    </div>
  )
}
