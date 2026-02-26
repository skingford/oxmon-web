"use client"

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { ApiRequestError, api } from "@/lib/api"
import { formatCertificateDateTime, parseOptionalNonNegativeInt } from "@/lib/certificates/formats"
import { pickCountKey } from "@/lib/i18n-count"
import { CertCheckResult, CertDomain, CertDomainsSummary, ListResponse } from "@/types/api"
import { useAppTranslations } from "@/hooks/use-app-translations"
import { useServerOffsetPagination } from "@/hooks/use-server-offset-pagination"
import { useCertificateAutoCreateDraft } from "@/hooks/use-certificate-auto-create-draft"
import { useCertificateDomainsAutoCheckFlow } from "@/hooks/use-certificate-domains-auto-check-flow"
import { useCertificateDomainsQueryState } from "@/hooks/use-certificate-domains-query-state"
import { useRequestState } from "@/hooks/use-request-state"
import { DomainAutoCreateDialog } from "@/components/pages/certificates/domain-auto-create-dialog"
import { DomainBatchCreateDialog } from "@/components/pages/certificates/domain-batch-create-dialog"
import { DomainCreateDialog } from "@/components/pages/certificates/domain-create-dialog"
import { DomainDeleteDialog } from "@/components/pages/certificates/domain-delete-dialog"
import { DomainContentSection } from "@/components/pages/certificates/domain-content-section"
import { DomainHistoryDialog } from "@/components/pages/certificates/domain-history-dialog"
import { DomainToolbarSection } from "@/components/pages/certificates/domain-toolbar-section"
import { toast, toastActionSuccess, toastApiError, toastCreated, toastDeleted, toastStatusError } from "@/lib/toast"

const PAGE_LIMIT = 20

type DomainsQueryState = {
  domainsPage: ListResponse<CertDomain>
  summary: CertDomainsSummary | null
}

export default function DomainsPage() {
  const { t, locale } = useAppTranslations("pages")
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const domainParamValue = searchParams.get("domain") || ""
  const autoCheckParamValue = searchParams.get("autoCheck")
  const {
    domainKeyword,
    statusFilter,
    offset,
    setOffset,
    handleDomainKeywordChange,
    handleStatusFilterChange,
    handleResetFilters,
  } = useCertificateDomainsQueryState({
    pathname,
    searchParams,
    replace: (href, options) => router.replace(href, options),
  })

  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [batchDialogOpen, setBatchDialogOpen] = useState(false)
  const [deleteDialogDomain, setDeleteDialogDomain] = useState<CertDomain | null>(null)
  const [historyDialogOpen, setHistoryDialogOpen] = useState(false)

  const [creating, setCreating] = useState(false)
  const [batchCreating, setBatchCreating] = useState(false)
  const [checkingAll, setCheckingAll] = useState(false)
  const [checkingId, setCheckingId] = useState<string | null>(null)
  const [updatingId, setUpdatingId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const [newDomain, setNewDomain] = useState("")
  const [newPort, setNewPort] = useState("")
  const [newCheckInterval, setNewCheckInterval] = useState("")
  const [newNote, setNewNote] = useState("")
  const [batchDomains, setBatchDomains] = useState("")

  const [historyLoading, setHistoryLoading] = useState(false)
  const [historyDomain, setHistoryDomain] = useState<CertDomain | null>(null)
  const [historyItems, setHistoryItems] = useState<CertCheckResult[]>([])
  const [autoCreateDomain, setAutoCreateDomain] = useState<string | null>(null)
  const [autoCreateAdvancedOpen, setAutoCreateAdvancedOpen] = useState(false)
  const [clearAdvancedDialogOpen, setClearAdvancedDialogOpen] = useState(false)
  const [autoCreating, setAutoCreating] = useState(false)

  const {
    port: autoCreatePort,
    setPort: setAutoCreatePort,
    checkInterval: autoCreateCheckInterval,
    setCheckInterval: setAutoCreateCheckInterval,
    note: autoCreateNote,
    setNote: setAutoCreateNote,
    advancedFilledCount: autoCreateAdvancedFilledCount,
    hasAdvancedDraft: autoCreateHasAdvancedDraft,
    resetAdvancedDraft,
  } = useCertificateAutoCreateDraft()
  const autoCreateAdvancedResetCount = Math.max(1, autoCreateAdvancedFilledCount)
  const autoCreateAdvancedResetTitleKey = pickCountKey(
    "certificates.domains.autoCreateAdvancedResetDialogTitleOne",
    "certificates.domains.autoCreateAdvancedResetDialogTitleMany",
    autoCreateAdvancedResetCount
  )
  const autoCreateAdvancedResetConfirmKey = pickCountKey(
    "certificates.domains.autoCreateAdvancedResetDialogConfirmOne",
    "certificates.domains.autoCreateAdvancedResetDialogConfirmMany",
    autoCreateAdvancedResetCount
  )

  const {
    data: domainsData,
    loading,
    refreshing,
    execute,
  } = useRequestState<DomainsQueryState>({
    domainsPage: {
      items: [],
      total: 0,
      limit: PAGE_LIMIT,
      offset: 0,
    },
    summary: null,
  })
  const domainsPage = domainsData.domainsPage
  const domains = domainsPage.items
  const summary = domainsData.summary

  const resetAutoCreateDraft = (preserveAdvanced = true) => {
    setAutoCreateDomain(null)

    if (!preserveAdvanced) {
      resetAdvancedDraft()
    }

    setAutoCreateAdvancedOpen(false)
    setClearAdvancedDialogOpen(false)
  }

  const clearAutoCreateAdvancedDraft = () => {
    const clearedCount = autoCreateAdvancedFilledCount

    resetAdvancedDraft()
    setAutoCreateAdvancedOpen(false)
    setClearAdvancedDialogOpen(false)

    if (clearedCount > 0) {
      const successKey = pickCountKey(
        "certificates.domains.toastAutoCreateAdvancedResetSuccessOne",
        "certificates.domains.toastAutoCreateAdvancedResetSuccessMany",
        clearedCount
      )

      toast.success(t(successKey, {
        count: clearedCount,
      }))
    }
  }

  const fetchDomains = useCallback(
    async (silent = false) => {
      await execute(
        async () => {
          const [domainsPageData, summaryData] = await Promise.all([
            api.listDomains({
              limit: PAGE_LIMIT,
              offset,
              domain__contains: domainKeyword.trim() || undefined,
              enabled__eq: statusFilter === "all" ? undefined : statusFilter === "enabled",
            }),
            api.getCertDomainsSummary(),
          ])

          return {
            domainsPage: domainsPageData,
            summary: summaryData,
          }
        },
        {
          silent,
          onError: (error) => {
            toastApiError(error, t("certificates.domains.toastFetchError"))
          },
        }
      )
    },
    [domainKeyword, execute, offset, statusFilter, t]
  )

  useEffect(() => {
    fetchDomains()
  }, [fetchDomains])

  useEffect(() => {
    if (!autoCreateDomain) {
      return
    }

    if (autoCreateHasAdvancedDraft) {
      setAutoCreateAdvancedOpen(true)
    }
  }, [autoCreateDomain, autoCreateHasAdvancedDraft])

  const pagination = useServerOffsetPagination({
    offset,
    limit: PAGE_LIMIT,
    currentItemsCount: domains.length,
    totalItems: domainsPage.total,
  })

  const handleCreateDomain = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const domain = newDomain.trim()

    if (!domain) {
      toast.error(t("certificates.domains.toastDomainRequired"))
      return
    }

    const port = parseOptionalNonNegativeInt(newPort)
    const checkInterval = parseOptionalNonNegativeInt(newCheckInterval)

    if (port === undefined || checkInterval === undefined) {
      setAutoCreateAdvancedOpen(true)
      toast.error(t("certificates.domains.toastInvalidNumber"))
      return
    }

    setCreating(true)

    try {
      await api.createDomain({
        domain,
        port,
        check_interval_secs: checkInterval,
        note: newNote.trim() ? newNote.trim() : null,
      })

      toastCreated(t("certificates.domains.toastCreateSuccess"))
      setCreateDialogOpen(false)
      setNewDomain("")
      setNewPort("")
      setNewCheckInterval("")
      setNewNote("")
      await fetchDomains(true)
    } catch (error) {
      toastStatusError(error, t("certificates.domains.toastCreateError"), {
        409: t("certificates.domains.toastCreateConflict"),
      })
    } finally {
      setCreating(false)
    }
  }

  const handleBatchCreate = async () => {
    const parsedDomains = batchDomains
      .split(/[\n,]+/)
      .map((value) => value.trim())
      .filter(Boolean)

    if (parsedDomains.length === 0) {
      toast.error(t("certificates.domains.toastBatchEmpty"))
      return
    }

    setBatchCreating(true)

    try {
      await api.createDomainsBatch({
        domains: parsedDomains.map((domain) => ({ domain })),
      })

      toast.success(t("certificates.domains.toastBatchSuccess", { count: parsedDomains.length }))
      setBatchDomains("")
      setBatchDialogOpen(false)
      await fetchDomains(true)
    } catch (error) {
      toastStatusError(error, t("certificates.domains.toastBatchError"), {
        409: t("certificates.domains.toastCreateConflict"),
      })
    } finally {
      setBatchCreating(false)
    }
  }

  const handleToggleEnabled = async (domain: CertDomain, enabled: boolean) => {
    setUpdatingId(domain.id)

    try {
      await api.updateDomain(domain.id, { enabled })
      toast.success(enabled
        ? t("certificates.domains.toastEnableSuccess")
        : t("certificates.domains.toastDisableSuccess"))
      await fetchDomains(true)
    } catch (error) {
      toastApiError(error, t("certificates.domains.toastUpdateError"))
    } finally {
      setUpdatingId(null)
    }
  }

  const handleCheckDomain = async (domain: CertDomain) => {
    setCheckingId(domain.id)

    try {
      const result = await api.checkSingleDomain(domain.id)

      if (result.is_valid && result.chain_valid) {
        toastActionSuccess(t("certificates.domains.toastCheckSuccess"))
      } else {
        toast.error(
          t("certificates.domains.toastCheckFailed", {
            reason: result.error || t("certificates.domains.errorUnknown"),
          })
        )
      }

      await fetchDomains(true)
    } catch (error) {
      toastApiError(error, t("certificates.domains.toastCheckError"))
    } finally {
      setCheckingId(null)
    }
  }

  useCertificateDomainsAutoCheckFlow({
    autoCheckParamValue,
    domainParamValue,
    loading,
    domains,
    onCheckDomain: handleCheckDomain,
    onAutoCreateDomain: setAutoCreateDomain,
    onAutoCreateDialogInit: () => setAutoCreateAdvancedOpen(false),
  })

  const handleCheckAllDomains = async () => {
    setCheckingAll(true)

    try {
      const results = await api.checkAllDomains()
      const failedCount = results.filter((item) => !(item.is_valid && item.chain_valid)).length

      if (failedCount > 0) {
        toast.warning(t("certificates.domains.toastCheckAllPartial", {
          failed: failedCount,
          total: results.length,
        }))
      } else {
        toastActionSuccess(t("certificates.domains.toastCheckAllSuccess"))
      }

      await fetchDomains(true)
    } catch (error) {
      toastApiError(error, t("certificates.domains.toastCheckAllError"))
    } finally {
      setCheckingAll(false)
    }
  }

  const handleAutoCreateAndCheck = async () => {
    if (!autoCreateDomain) {
      return
    }

    const domain = autoCreateDomain.trim()

    if (!domain) {
      resetAutoCreateDraft()
      return
    }

    const port = parseOptionalNonNegativeInt(autoCreatePort)
    const checkInterval = parseOptionalNonNegativeInt(autoCreateCheckInterval)

    if (port === undefined || checkInterval === undefined) {
      setAutoCreateAdvancedOpen(true)
      toast.error(t("certificates.domains.toastInvalidNumber"))
      return
    }

    setAutoCreating(true)

    try {
      const created = await api.createDomain({
        domain,
        port,
        check_interval_secs: checkInterval,
        note: autoCreateNote.trim() ? autoCreateNote.trim() : null,
      })
      toast.success(t("certificates.domains.toastAutoCreateSuccess", { domain }))
      resetAutoCreateDraft()
      const createdDomain = await api.getDomain(created.id)
      await handleCheckDomain(createdDomain)
    } catch (error) {
      if (error instanceof ApiRequestError && error.status === 409) {
        try {
          const maybeExisting = await api.listDomains({
            limit: PAGE_LIMIT,
            offset: 0,
            domain__contains: domain,
          })

          const existing = maybeExisting.items.find((item) => item.domain.toLowerCase() === domain.toLowerCase())

          if (existing) {
            toast.success(t("certificates.domains.toastAutoCreateConflict", { domain }))
            resetAutoCreateDraft()
            await handleCheckDomain(existing)
            return
          }
        } catch {
          // ignore fallback query error and continue to generic error handling
        }
      }

      toastStatusError(error, t("certificates.domains.toastAutoCreateError"), {
        409: t("certificates.domains.toastCreateConflict"),
      })
    } finally {
      setAutoCreating(false)
    }
  }

  const openHistoryDialog = async (domain: CertDomain) => {
    setHistoryDomain(domain)
    setHistoryDialogOpen(true)
    setHistoryLoading(true)

    try {
      const result = await api.getCertCheckHistory(domain.id, {
        limit: 50,
        offset: 0,
      })

      setHistoryItems(result)
    } catch (error) {
      toastApiError(error, t("certificates.domains.toastHistoryError"))
      setHistoryItems([])
    } finally {
      setHistoryLoading(false)
    }
  }

  const handleDeleteDomain = async () => {
    if (!deleteDialogDomain) {
      return
    }

    const target = deleteDialogDomain
    setDeletingId(target.id)

    try {
      await api.deleteDomain(target.id)
      toastDeleted(t("certificates.domains.toastDeleteSuccess"))
      setDeleteDialogDomain(null)

      if (domains.length === 1 && offset > 0) {
        setOffset((previous) => Math.max(0, previous - PAGE_LIMIT))
      } else {
        await fetchDomains(true)
      }
    } catch (error) {
      toastStatusError(error, t("certificates.domains.toastDeleteError"), {
        404: t("certificates.domains.toastDeleteNotFound"),
      })
    } finally {
      setDeletingId(null)
    }
  }

  const stats = useMemo(() => {
    if (summary) {
      return summary
    }

    return {
      total: 0,
      enabled: 0,
      disabled: 0,
    }
  }, [summary])

  const createDialogText = {
    trigger: t("certificates.domains.addButton"),
    title: t("certificates.domains.addDialogTitle"),
    description: t("certificates.domains.addDialogDescription"),
    domainLabel: t("certificates.domains.fieldDomain"),
    domainPlaceholder: t("certificates.domains.fieldDomainPlaceholder"),
    portLabel: t("certificates.domains.fieldPort"),
    portPlaceholder: t("certificates.domains.fieldPortPlaceholder"),
    intervalLabel: t("certificates.domains.fieldInterval"),
    intervalPlaceholder: t("certificates.domains.fieldIntervalPlaceholder"),
    noteLabel: t("certificates.domains.fieldNote"),
    notePlaceholder: t("certificates.domains.fieldNotePlaceholder"),
    cancel: t("certificates.domains.cancelButton"),
    submit: t("certificates.domains.addSubmit"),
    submitting: t("certificates.domains.addSubmitting"),
  }

  const batchCreateDialogText = {
    trigger: t("certificates.domains.batchButton"),
    title: t("certificates.domains.batchDialogTitle"),
    description: t("certificates.domains.batchDialogDescription"),
    fieldLabel: t("certificates.domains.batchFieldLabel"),
    placeholder: t("certificates.domains.batchPlaceholder"),
    cancel: t("certificates.domains.cancelButton"),
    submit: t("certificates.domains.batchSubmit"),
  }

  const deleteDialogText = {
    title: t("certificates.domains.deleteDialogTitle"),
    description: t("certificates.domains.deleteDialogDescription", {
      domain: deleteDialogDomain?.domain || "-",
    }),
    cancel: t("certificates.domains.cancelButton"),
    confirm: t("certificates.domains.actionDelete"),
  }

  const autoCreateDialogText = {
    title: t("certificates.domains.autoCreateDialogTitle"),
    description: t("certificates.domains.autoCreateDialogDescription", {
      domain: autoCreateDomain || "-",
    }),
    advancedToggle: t("certificates.domains.autoCreateAdvancedToggle"),
    advancedHint: t("certificates.domains.autoCreateAdvancedHint"),
    advancedReset: t("certificates.domains.autoCreateAdvancedReset"),
    fieldPort: t("certificates.domains.fieldPort"),
    fieldPortPlaceholder: t("certificates.domains.fieldPortPlaceholder"),
    fieldInterval: t("certificates.domains.fieldInterval"),
    fieldIntervalPlaceholder: t("certificates.domains.fieldIntervalPlaceholder"),
    fieldNote: t("certificates.domains.fieldNote"),
    fieldNotePlaceholder: t("certificates.domains.fieldNotePlaceholder"),
    cancel: t("certificates.domains.cancelButton"),
    submit: t("certificates.domains.autoCreateSubmit"),
    submitting: t("certificates.domains.autoCreateSubmitting"),
    clearDialogTitle: t(autoCreateAdvancedResetTitleKey, {
      count: autoCreateAdvancedResetCount,
    }),
    clearDialogDescription: t("certificates.domains.autoCreateAdvancedResetDialogDescription", {
      count: autoCreateAdvancedResetCount,
    }),
    clearDialogConfirm: t(autoCreateAdvancedResetConfirmKey, {
      count: autoCreateAdvancedResetCount,
    }),
  }

  const historyDialogText = {
    title: t("certificates.domains.historyDialogTitle", {
      domain: historyDomain?.domain || "-",
    }),
    description: t("certificates.domains.historyDialogDescription"),
    loading: t("certificates.domains.historyLoading"),
    empty: t("certificates.domains.historyEmpty"),
    statusValid: t("certificates.domains.historyStatusValid"),
    statusInvalid: t("certificates.domains.historyStatusInvalid"),
    noError: t("certificates.domains.historyNoError"),
  }

  return (
    <div className="min-w-0 space-y-6 p-4 md:p-8">
      <DomainToolbarSection
        title={t("certificates.domains.title")}
        description={t("certificates.domains.description")}
        checkingAll={checkingAll}
        loading={loading}
        refreshing={refreshing}
        onCheckAllDomains={handleCheckAllDomains}
        onRefreshDomains={() => {
          void fetchDomains(true)
        }}
        checkAllLabel={t("certificates.domains.checkAllButton")}
        refreshLabel={t("certificates.domains.refreshButton")}
      >
        <DomainCreateDialog
          open={createDialogOpen}
          onOpenChange={setCreateDialogOpen}
          onSubmit={handleCreateDomain}
          creating={creating}
          values={{
            domain: newDomain,
            port: newPort,
            interval: newCheckInterval,
            note: newNote,
          }}
          onChange={{
            domain: setNewDomain,
            port: setNewPort,
            interval: setNewCheckInterval,
            note: setNewNote,
          }}
          text={createDialogText}
        />

        <DomainBatchCreateDialog
          open={batchDialogOpen}
          onOpenChange={setBatchDialogOpen}
          value={batchDomains}
          onValueChange={setBatchDomains}
          onSubmit={handleBatchCreate}
          submitting={batchCreating}
          text={batchCreateDialogText}
        />
      </DomainToolbarSection>

      <DomainContentSection
        t={t}
        locale={locale}
        stats={stats}
        filters={{
          domainKeyword,
          statusFilter,
          onDomainKeywordChange: handleDomainKeywordChange,
          onStatusFilterChange: handleStatusFilterChange,
          onResetFilters: handleResetFilters,
        }}
        table={{
          pageLimit: PAGE_LIMIT,
          loading,
          domains,
          pageNumber: pagination.currentPage,
          canGoPrev: pagination.canGoPrev,
          canGoNext: pagination.canGoNext,
          checkingId,
          updatingId,
          deletingId,
          onOpenCreateDialog: () => setCreateDialogOpen(true),
          onToggleEnabled: handleToggleEnabled,
          onCheckDomain: (domain) => {
            void handleCheckDomain(domain)
          },
          onOpenHistory: openHistoryDialog,
          onDeleteDomain: setDeleteDialogDomain,
          onPrevPage: () => setOffset((previous) => Math.max(0, previous - PAGE_LIMIT)),
          onNextPage: () => setOffset((previous) => previous + PAGE_LIMIT),
        }}
      />

      <DomainDeleteDialog
        open={Boolean(deleteDialogDomain)}
        onOpenChange={(open) => {
          if (!open) {
            setDeleteDialogDomain(null)
          }
        }}
        deleting={Boolean(deletingId)}
        onConfirm={handleDeleteDomain}
        text={deleteDialogText}
      />

      <DomainAutoCreateDialog
        open={Boolean(autoCreateDomain)}
        onOpenChange={(open) => !open && resetAutoCreateDraft()}
        autoCreating={autoCreating}
        advancedOpen={autoCreateAdvancedOpen}
        onAdvancedOpenChange={setAutoCreateAdvancedOpen}
        clearAdvancedDialogOpen={clearAdvancedDialogOpen}
        onClearAdvancedDialogOpenChange={setClearAdvancedDialogOpen}
        autoCreateHasAdvancedDraft={autoCreateHasAdvancedDraft}
        values={{
          port: autoCreatePort,
          interval: autoCreateCheckInterval,
          note: autoCreateNote,
        }}
        onChange={{
          port: setAutoCreatePort,
          interval: setAutoCreateCheckInterval,
          note: setAutoCreateNote,
        }}
        onResetAdvanced={clearAutoCreateAdvancedDraft}
        onCancel={() => resetAutoCreateDraft()}
        onSubmit={handleAutoCreateAndCheck}
        text={autoCreateDialogText}
      />

      <DomainHistoryDialog
        open={historyDialogOpen}
        onOpenChange={(open) => {
          setHistoryDialogOpen(open)

          if (!open) {
            setHistoryDomain(null)
            setHistoryItems([])
          }
        }}
        historyItems={historyItems}
        historyLoading={historyLoading}
        formatDateTime={formatCertificateDateTime}
        locale={locale}
        text={historyDialogText}
      />
    </div>
  )
}
