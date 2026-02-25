"use client"

import { useEffect, useState } from "react"
import { CertDomain } from "@/types/api"

type UseCertificateDomainsAutoCheckFlowParams = {
  autoCheckParamValue: string | null
  domainParamValue: string
  loading: boolean
  domains: CertDomain[]
  onCheckDomain: (domain: CertDomain) => Promise<void> | void
  onAutoCreateDomain: (domain: string) => void
  onAutoCreateDialogInit?: () => void
}

export function useCertificateDomainsAutoCheckFlow({
  autoCheckParamValue,
  domainParamValue,
  loading,
  domains,
  onCheckDomain,
  onAutoCreateDomain,
  onAutoCreateDialogInit,
}: UseCertificateDomainsAutoCheckFlowParams) {
  const [autoCheckHandled, setAutoCheckHandled] = useState(false)

  useEffect(() => {
    if (autoCheckParamValue === "1") {
      setAutoCheckHandled(false)
    }
  }, [autoCheckParamValue, domainParamValue])

  useEffect(() => {
    if (autoCheckHandled || autoCheckParamValue !== "1" || loading) {
      return
    }

    const matchedDomain = domainParamValue.trim().toLowerCase()

    if (!matchedDomain) {
      setAutoCheckHandled(true)
      return
    }

    const target = domains.find((item) => item.domain.toLowerCase() === matchedDomain)

    if (!target) {
      setAutoCheckHandled(true)
      onAutoCreateDomain(domainParamValue.trim())
      onAutoCreateDialogInit?.()
      return
    }

    setAutoCheckHandled(true)
    void onCheckDomain(target)
  }, [
    autoCheckHandled,
    autoCheckParamValue,
    domainParamValue,
    domains,
    loading,
    onAutoCreateDialogInit,
    onAutoCreateDomain,
    onCheckDomain,
  ])
}
