"use client"

import { useEffect, useState } from "react"
import { ApiRequestError, api, getApiErrorMessage } from "@/lib/api"
import { parseOptionalNonNegativeInt } from "@/lib/certificates/formats"
import { CertDomain } from "@/types/api"
import { toast } from "sonner"

type TranslateFn = (path: string, values?: Record<string, string | number>) => string

type UseCertificateMonitoringConfigParams = {
  certificateDomain: string | null
  t: TranslateFn
  onRefreshCertificateDetail: () => Promise<void>
}

export function useCertificateMonitoringConfig({
  certificateDomain,
  t,
  onRefreshCertificateDetail,
}: UseCertificateMonitoringConfigParams) {
  const [linkedDomain, setLinkedDomain] = useState<CertDomain | null>(null)
  const [domainLookupLoading, setDomainLookupLoading] = useState(false)
  const [createDomainOpen, setCreateDomainOpen] = useState(false)
  const [editDomainOpen, setEditDomainOpen] = useState(false)
  const [creatingDomain, setCreatingDomain] = useState(false)
  const [savingDomain, setSavingDomain] = useState(false)
  const [createCheckAfterSave, setCreateCheckAfterSave] = useState(true)
  const [editCheckAfterSave, setEditCheckAfterSave] = useState(true)
  const [createCheckAfterSaveTouched, setCreateCheckAfterSaveTouched] = useState(false)
  const [editCheckAfterSaveTouched, setEditCheckAfterSaveTouched] = useState(false)
  const [editBaselinePort, setEditBaselinePort] = useState("")
  const [editBaselineEnabled, setEditBaselineEnabled] = useState(true)
  const [editPort, setEditPort] = useState("")
  const [editInterval, setEditInterval] = useState("")
  const [editNote, setEditNote] = useState("")
  const [editEnabled, setEditEnabled] = useState(true)

  const fillDomainEditForm = (domain: CertDomain) => {
    setEditPort(String(domain.port ?? ""))
    setEditInterval(domain.check_interval_secs === null ? "" : String(domain.check_interval_secs))
    setEditNote(domain.note || "")
    setEditEnabled(domain.enabled)
  }

  const fetchLinkedDomain = async (domainName: string) => {
    setDomainLookupLoading(true)

    try {
      const result = await api.listDomains({
        limit: 100,
        offset: 0,
        domain__contains: domainName,
      })

      const exactMatch = result.items.find(
        (item) => item.domain.trim().toLowerCase() === domainName.trim().toLowerCase()
      ) || null

      setLinkedDomain(exactMatch)

      if (exactMatch) {
        fillDomainEditForm(exactMatch)
      }
    } catch {
      setLinkedDomain(null)
    } finally {
      setDomainLookupLoading(false)
    }
  }

  const runCheckWithToast = async (domainId: string) => {
    try {
      const result = await api.checkSingleDomain(domainId)

      if (result.is_valid && result.chain_valid) {
        toast.success(t("certificates.domains.toastCheckSuccess"))
      } else {
        toast.error(
          t("certificates.domains.toastCheckFailed", {
            reason: result.error || t("certificates.domains.errorUnknown"),
          })
        )
      }
    } catch (error) {
      toast.error(getApiErrorMessage(error, t("certificates.domains.toastCheckError")))
    }
  }

  const handleOpenEditDomain = () => {
    if (!linkedDomain) return

    fillDomainEditForm(linkedDomain)
    setEditBaselinePort(String(linkedDomain.port ?? ""))
    setEditBaselineEnabled(linkedDomain.enabled)
    setEditCheckAfterSave(false)
    setEditCheckAfterSaveTouched(false)
    setEditDomainOpen(true)
  }

  const handleOpenCreateDomain = () => {
    setEditPort("")
    setEditInterval("")
    setEditNote("")
    setEditEnabled(true)
    setCreateCheckAfterSave(true)
    setCreateCheckAfterSaveTouched(false)
    setCreateDomainOpen(true)
  }

  useEffect(() => {
    if (!createDomainOpen || createCheckAfterSaveTouched) {
      return
    }

    const hasConnectionOverrides = editPort.trim() !== "" || editInterval.trim() !== ""
    const noteOnlyChange = !hasConnectionOverrides && editNote.trim() !== ""
    setCreateCheckAfterSave(editEnabled && !noteOnlyChange)
  }, [
    createCheckAfterSaveTouched,
    createDomainOpen,
    editEnabled,
    editInterval,
    editNote,
    editPort,
  ])

  useEffect(() => {
    if (!editDomainOpen || editCheckAfterSaveTouched) {
      return
    }

    const shouldEnableAutoCheck = editPort !== editBaselinePort || editEnabled !== editBaselineEnabled
    setEditCheckAfterSave(shouldEnableAutoCheck)
  }, [
    editBaselineEnabled,
    editBaselinePort,
    editCheckAfterSaveTouched,
    editDomainOpen,
    editEnabled,
    editPort,
  ])

  const handleCreateDomainConfig = async () => {
    if (!certificateDomain) {
      return
    }

    const port = parseOptionalNonNegativeInt(editPort)
    const checkInterval = parseOptionalNonNegativeInt(editInterval)

    if (port === undefined || checkInterval === undefined) {
      toast.error(t("certificates.domains.toastInvalidNumber"))
      return
    }

    setCreatingDomain(true)

    try {
      const created = await api.createDomain({
        domain: certificateDomain,
        port,
        check_interval_secs: checkInterval,
        note: editNote.trim() ? editNote.trim() : null,
      })

      if (!editEnabled) {
        await api.updateDomain(created.id, { enabled: false })
      }

      toast.success(t("certificates.detail.toastCreateMonitoringSuccess"))
      setCreateDomainOpen(false)

      if (editEnabled && createCheckAfterSave) {
        await runCheckWithToast(created.id)
      }

      await fetchLinkedDomain(certificateDomain)
      await onRefreshCertificateDetail()
    } catch (error) {
      if (error instanceof ApiRequestError && error.status === 409) {
        toast.error(t("certificates.domains.toastCreateConflict"))
      } else {
        toast.error(getApiErrorMessage(error, t("certificates.domains.toastCreateError")))
      }
    } finally {
      setCreatingDomain(false)
    }
  }

  const handleSaveDomainConfig = async () => {
    if (!linkedDomain) {
      return
    }

    const port = parseOptionalNonNegativeInt(editPort)
    const checkInterval = parseOptionalNonNegativeInt(editInterval)

    if (port === undefined || checkInterval === undefined) {
      toast.error(t("certificates.domains.toastInvalidNumber"))
      return
    }

    setSavingDomain(true)

    try {
      await api.updateDomain(linkedDomain.id, {
        port,
        enabled: editEnabled,
        check_interval_secs: checkInterval,
        note: editNote.trim() ? editNote.trim() : null,
      })

      toast.success(t("certificates.detail.toastUpdateMonitoringSuccess"))
      setEditDomainOpen(false)

      if (editEnabled && editCheckAfterSave) {
        await runCheckWithToast(linkedDomain.id)
      }

      await fetchLinkedDomain(linkedDomain.domain)
      await onRefreshCertificateDetail()
    } catch (error) {
      toast.error(getApiErrorMessage(error, t("certificates.domains.toastUpdateError")))
    } finally {
      setSavingDomain(false)
    }
  }

  return {
    linkedDomain,
    domainLookupLoading,
    fetchLinkedDomain,
    createDomainOpen,
    setCreateDomainOpen,
    editDomainOpen,
    setEditDomainOpen,
    creatingDomain,
    savingDomain,
    editPort,
    setEditPort,
    editInterval,
    setEditInterval,
    editNote,
    setEditNote,
    editEnabled,
    setEditEnabled,
    createCheckAfterSave,
    editCheckAfterSave,
    handleCreateCheckAfterSaveChange: (checked: boolean) => {
      setCreateCheckAfterSaveTouched(true)
      setCreateCheckAfterSave(checked)
    },
    handleEditCheckAfterSaveChange: (checked: boolean) => {
      setEditCheckAfterSaveTouched(true)
      setEditCheckAfterSave(checked)
    },
    handleOpenEditDomain,
    handleOpenCreateDomain,
    handleCreateDomainConfig,
    handleSaveDomainConfig,
  }
}
