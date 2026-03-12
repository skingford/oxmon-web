"use client"

import { useCallback, useEffect, useState } from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { api } from "@/lib/api"
import {
  ChannelOverview,
  ListResponse,
  NotificationChannelQueryParams,
} from "@/types/api"
import { useAppTranslations } from "@/hooks/use-app-translations"
import { useNotificationChannelSubmit } from "@/hooks/use-notification-channel-submit"
import { useNotificationChannelFilters, type NotificationStatusFilter } from "@/hooks/use-notification-channel-filters"
import { buildTranslatedPaginationTextBundle } from "@/lib/pagination-summary"
import {
  NotificationChannelFormFields,
  NotificationChannelFormState,
} from "@/components/notifications/NotificationChannelFormFields"
import { useRequestState } from "@/hooks/use-request-state"
import {
  getInitialFormState,
  getSeverityLabel,
} from "@/lib/notifications/channel-utils"
import { useServerOffsetPagination } from "@/hooks/use-server-offset-pagination"
import { Button } from "@/components/ui/button"
import { NotificationsFiltersCard } from "@/components/notifications/NotificationsFiltersCard"
import { NotificationsStatsCards } from "@/components/notifications/NotificationsStatsCards"
import { NotificationsChannelsTable } from "@/components/notifications/NotificationsChannelsTable"
import {
  DialogClose,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Loader2,
  Plus,
  RefreshCw,
  X,
} from "lucide-react"
import { toast, toastApiError } from "@/lib/toast"

const CHANNEL_SEVERITY_OPTIONS = ["info", "warning", "critical"] as const
const PAGE_SIZE_OPTIONS = [10, 20, 50] as const

type NotificationsQueryState = {
  channelsPage: ListResponse<ChannelOverview>
}

export default function NotificationsPage() {
  const { t, locale } = useAppTranslations("pages")
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const {
    data,
    loading,
    refreshing,
    execute,
  } = useRequestState<NotificationsQueryState>({
    channelsPage: {
      items: [],
      total: 0,
      limit: PAGE_SIZE_OPTIONS[1],
      offset: 0,
    },
  })

  const channels = data.channelsPage.items
  const total = data.channelsPage.total

  const [searchKeyword, setSearchKeyword] = useState("")
  const [typeFilter, setTypeFilter] = useState("all")
  const [severityFilter, setSeverityFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState<NotificationStatusFilter>("all")
  const [offset, setOffset] = useState(0)
  const [pageSize, setPageSize] = useState<(typeof PAGE_SIZE_OPTIONS)[number]>(PAGE_SIZE_OPTIONS[1])
  const [allChannelsSnapshot, setAllChannelsSnapshot] = useState<ChannelOverview[] | null>(null)

  const [isChannelDialogOpen, setIsChannelDialogOpen] = useState(false)
  const [editingChannel, setEditingChannel] = useState<ChannelOverview | null>(null)
  const [channelForm, setChannelForm] = useState<NotificationChannelFormState>(getInitialFormState)
  const [togglingId, setTogglingId] = useState<string | null>(null)

  useEffect(() => {
    const nextSearchKeyword = searchParams.get("search") || ""
    const nextTypeFilter = searchParams.get("type") || "all"
    const nextSeverityFilter = searchParams.get("severity") || "all"
    const rawStatusFilter = searchParams.get("status")
    const nextStatusFilter: NotificationStatusFilter =
      rawStatusFilter === "enabled" || rawStatusFilter === "disabled"
        ? rawStatusFilter
        : "all"

    const rawLimit = Number(searchParams.get("limit") || String(PAGE_SIZE_OPTIONS[1]))
    const nextPageSize = PAGE_SIZE_OPTIONS.includes(rawLimit as (typeof PAGE_SIZE_OPTIONS)[number])
      ? (rawLimit as (typeof PAGE_SIZE_OPTIONS)[number])
      : PAGE_SIZE_OPTIONS[1]
    const rawOffset = Number(searchParams.get("offset") || "0")
    const nextOffset = Number.isFinite(rawOffset) && rawOffset > 0 ? Math.floor(rawOffset) : 0

    setSearchKeyword((prev) => (prev === nextSearchKeyword ? prev : nextSearchKeyword))
    setTypeFilter((prev) => (prev === nextTypeFilter ? prev : nextTypeFilter))
    setSeverityFilter((prev) => (prev === nextSeverityFilter ? prev : nextSeverityFilter))
    setStatusFilter((prev) => (prev === nextStatusFilter ? prev : nextStatusFilter))
    setPageSize((prev) => (prev === nextPageSize ? prev : nextPageSize))
    setOffset((prev) => (prev === nextOffset ? prev : nextOffset))
  }, [searchParams])

  useEffect(() => {
    const nextParams = new URLSearchParams(searchParams.toString())

    if (searchKeyword.trim()) {
      nextParams.set("search", searchKeyword)
    } else {
      nextParams.delete("search")
    }

    if (typeFilter !== "all") {
      nextParams.set("type", typeFilter)
    } else {
      nextParams.delete("type")
    }

    if (severityFilter !== "all") {
      nextParams.set("severity", severityFilter)
    } else {
      nextParams.delete("severity")
    }

    if (statusFilter !== "all") {
      nextParams.set("status", statusFilter)
    } else {
      nextParams.delete("status")
    }

    if (pageSize !== PAGE_SIZE_OPTIONS[1]) {
      nextParams.set("limit", String(pageSize))
    } else {
      nextParams.delete("limit")
    }

    if (offset > 0) {
      nextParams.set("offset", String(offset))
    } else {
      nextParams.delete("offset")
    }

    const nextQuery = nextParams.toString()
    const currentQuery = searchParams.toString()

    if (nextQuery === currentQuery) {
      return
    }

    router.replace(nextQuery ? `${pathname}?${nextQuery}` : pathname, { scroll: false })
  }, [
    offset,
    pageSize,
    pathname,
    router,
    searchKeyword,
    searchParams,
    severityFilter,
    statusFilter,
    typeFilter,
  ])


  const fetchChannelsPage = useCallback(
    async (silent = false) => {
      const params: NotificationChannelQueryParams = {
        name__contains: searchKeyword.trim() || undefined,
        channel_type__eq: typeFilter !== "all" ? typeFilter : undefined,
        min_severity__eq: severityFilter !== "all" ? severityFilter : undefined,
        enabled__eq:
          statusFilter === "all"
            ? undefined
            : statusFilter === "enabled",
        limit: PAGE_SIZE_OPTIONS[1],
        offset,
      }

      await execute(
        async () => {
          const page = await api.listChannelsPage(params)

          return {
            channelsPage: page,
          }
        },
        {
          silent,
          onError: (error) => {
            toastApiError(error, t("notifications.toastFetchError"))
          },
        }
      )
    },
    [execute, offset, pageSize, searchKeyword, severityFilter, statusFilter, t, typeFilter]
  )

  useEffect(() => {
    fetchChannelsPage()
  }, [fetchChannelsPage])

  const fetchChannelsSnapshot = useCallback(async () => {
    try {
      setAllChannelsSnapshot(await api.listChannels())
    } catch {
      // ignore snapshot fetch failures; main table still relies on paginated API
      setAllChannelsSnapshot(null)
    }
  }, [])

  useEffect(() => {
    fetchChannelsSnapshot()
  }, [fetchChannelsSnapshot])

  const refreshChannels = useCallback(
    async (silent = false) => {
      await Promise.all([
        fetchChannelsPage(silent),
        fetchChannelsSnapshot(),
      ])
    },
    [fetchChannelsPage, fetchChannelsSnapshot]
  )

  const optionSourceChannels = allChannelsSnapshot ?? channels

  const {
    stats,
    hasActiveFilters,
    filterTypeOptions,
    filterSeverityOptions,
  } = useNotificationChannelFilters({
    channels: optionSourceChannels,
    searchKeyword,
    typeFilter,
    severityFilter,
    statusFilter,
    severityOptions: CHANNEL_SEVERITY_OPTIONS,
    t,
  })

  const pagination = useServerOffsetPagination({
    offset,
    limit: PAGE_SIZE_OPTIONS[1],
    currentItemsCount: channels.length,
    totalItems: total,
  })

  const pageSizeOptionLabel = useCallback(
    (size: number) => (locale === "zh" ? `${size} / 页` : `${size} / page`),
    [locale]
  )

  const isBusy = loading || refreshing
  const severityOptions = CHANNEL_SEVERITY_OPTIONS

  const getSeverityLabelForForm = useCallback(
    (severity: string) => getSeverityLabel(severity, t),
    [t]
  )

  const resetFilters = () => {
    setSearchKeyword("")
    setTypeFilter("all")
    setSeverityFilter("all")
    setStatusFilter("all")
    setOffset(0)
  }

  const {
    formSubmitting,
    openCreateDialog,
    openEditDialog,
    closeChannelDialog,
    handleChannelDialogOpenChange,
    handleSubmitChannel,
  } = useNotificationChannelSubmit({
    t,
    fetchChannels: refreshChannels,
    editingChannel,
    setEditingChannel,
    channelForm,
    setChannelForm,
    setIsChannelDialogOpen,
  })

  const handleToggleEnabled = useCallback(
    async (channel: ChannelOverview) => {
      setTogglingId(channel.id)

      try {
        await api.updateChannelConfig(channel.id, {
          enabled: !channel.enabled,
        })

        toast.success(
          channel.enabled
            ? t("notifications.toastToggleDisableSuccess")
            : t("notifications.toastToggleEnableSuccess")
        )

        await refreshChannels(true)
      } catch (error) {
        toastApiError(error, t("notifications.toastToggleError"))
      } finally {
        setTogglingId(null)
      }
    },
    [refreshChannels, t]
  )

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="space-y-1">
          <h2 className="text-2xl font-bold tracking-tight">{t("notifications.title")}</h2>
          <p className="text-sm text-muted-foreground">{t("notifications.description")}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => refreshChannels(true)}
            disabled={isBusy}
          >
            {isBusy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
            {t("notifications.refreshButton")}
          </Button>
          <Button type="button" onClick={openCreateDialog}>
            <Plus className="mr-2 h-4 w-4" />
            {t("notifications.createButton")}
          </Button>
        </div>
      </div>

      <NotificationsStatsCards stats={stats} t={t} />

      <NotificationsFiltersCard
        searchKeyword={searchKeyword}
        typeFilter={typeFilter}
        severityFilter={severityFilter}
        statusFilter={statusFilter}
        hasActiveFilters={hasActiveFilters}
        typeOptions={filterTypeOptions}
        severityOptions={filterSeverityOptions}
        onSearchKeywordChange={(value) => {
          setSearchKeyword(value)
          setOffset(0)
        }}
        onTypeFilterChange={(value) => {
          setTypeFilter(value)
          setOffset(0)
        }}
        onSeverityFilterChange={(value) => {
          setSeverityFilter(value)
          setOffset(0)
        }}
        onStatusFilterChange={(value) => {
          setStatusFilter(value)
          setOffset(0)
        }}
        onResetFilters={resetFilters}
      />

      <NotificationsChannelsTable
        loading={loading}
        channels={channels}
        pagination={{
          pageSize,
          pageSizeOptions: [...PAGE_SIZE_OPTIONS],
          onPageSizeChange: (nextPageSize) => {
            const normalizedPageSize = nextPageSize as (typeof PAGE_SIZE_OPTIONS)[number]
            if (normalizedPageSize === pageSize) {
              return
            }

            setPageSize(normalizedPageSize)
            setOffset(0)
          },
          ...buildTranslatedPaginationTextBundle({
            t,
            summaryKey: "notifications.paginationSummary",
            total,
            start: pagination.rangeStart,
            end: pagination.rangeEnd,
            shownKey: "notifications.paginationShown",
            filtered: total,
            unfilteredTotal: allChannelsSnapshot?.length ?? total,
            pageKey: "notifications.paginationPage",
            currentPage: pagination.currentPage,
            totalPages: pagination.totalPages,
            prevKey: "notifications.paginationPrev",
            nextKey: "notifications.paginationNext",
          }),
          pageSizePlaceholder: t("notifications.pageSizePlaceholder"),
          onPrevPage: () => setOffset((prev) => Math.max(0, prev - pageSize)),
          onNextPage: () => setOffset((prev) => prev + pageSize),
          prevDisabled: isBusy || !pagination.canGoPrev,
          nextDisabled: isBusy || !pagination.canGoNext,
          pageSizeOptionLabel,
        }}
        hasActiveFilters={hasActiveFilters}
        togglingId={togglingId}
        locale={locale}
        t={t}
        onToggleEnabled={handleToggleEnabled}
      />

      <Dialog
        open={isChannelDialogOpen}
        onOpenChange={handleChannelDialogOpenChange}
      >
        <DialogContent className="flex max-h-[88vh] flex-col gap-0 overflow-hidden p-0 sm:max-w-2xl" showCloseButton={false}>
          <DialogHeader className="sticky top-0 z-10 border-b bg-background px-6 py-4">
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-1 pr-2">
                <DialogTitle>
                  {editingChannel ? t("notifications.dialogEditTitle") : t("notifications.dialogCreateTitle")}
                </DialogTitle>
                <DialogDescription>
                  {editingChannel
                    ? t("notifications.dialogEditDescription")
                    : t("notifications.dialogCreateDescription")}
                </DialogDescription>
              </div>
              <DialogClose asChild>
                <Button type="button" variant="ghost" size="icon" className="h-8 w-8 shrink-0">
                  <X className="h-4 w-4" />
                </Button>
              </DialogClose>
            </div>
          </DialogHeader>

          <form className="flex min-h-0 flex-1 flex-col" onSubmit={handleSubmitChannel}>
            <div className="min-h-0 flex-1 overflow-y-auto px-6 py-4">
              <div className="space-y-4">
                <NotificationChannelFormFields
                  form={channelForm}
                  setForm={setChannelForm}
              idPrefix="channel"
              isEditing={Boolean(editingChannel)}
              severityOptions={severityOptions}
              getSeverityLabel={getSeverityLabelForForm}
              t={t}
            />
              </div>
            </div>

            <DialogFooter className="sticky bottom-0 z-10 border-t bg-background px-6 py-4">
              <Button
                type="button"
                variant="outline"
                onClick={closeChannelDialog}
                disabled={formSubmitting}
              >
                {t("notifications.dialogCancel")}
              </Button>
              <Button type="submit" disabled={formSubmitting}>
                {formSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                {editingChannel ? t("notifications.dialogUpdateSubmit") : t("notifications.dialogCreateSubmit")}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
