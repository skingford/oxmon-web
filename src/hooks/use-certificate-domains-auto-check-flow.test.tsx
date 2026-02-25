import { renderHook, waitFor } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"

import { useCertificateDomainsAutoCheckFlow } from "./use-certificate-domains-auto-check-flow"

function createDomain(overrides: Partial<{
  id: string
  domain: string
  port: number
  enabled: boolean
  check_interval_secs: number | null
  note: string | null
  last_checked_at: string | null
  created_at: string
  updated_at: string
}> = {}) {
  return {
    id: "domain-1",
    domain: "example.com",
    port: 443,
    enabled: true,
    check_interval_secs: 300,
    note: null,
    last_checked_at: null,
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
    ...overrides,
  }
}

describe("useCertificateDomainsAutoCheckFlow", () => {
  it("命中已有域名时触发检查（忽略大小写与空格）", async () => {
    const onCheckDomain = vi.fn()
    const onAutoCreateDomain = vi.fn()
    const onAutoCreateDialogInit = vi.fn()

    renderHook(() =>
      useCertificateDomainsAutoCheckFlow({
        autoCheckParamValue: "1",
        domainParamValue: " Example.COM ",
        loading: false,
        domains: [createDomain({ domain: "example.com" })],
        onCheckDomain,
        onAutoCreateDomain,
        onAutoCreateDialogInit,
      })
    )

    await waitFor(() => {
      expect(onCheckDomain).toHaveBeenCalledTimes(1)
      expect(onCheckDomain).toHaveBeenCalledWith(expect.objectContaining({ domain: "example.com" }))
    })

    expect(onAutoCreateDomain).not.toHaveBeenCalled()
    expect(onAutoCreateDialogInit).not.toHaveBeenCalled()
  })

  it("未命中域名时进入自动创建流程并初始化弹窗", async () => {
    const onCheckDomain = vi.fn()
    const onAutoCreateDomain = vi.fn()
    const onAutoCreateDialogInit = vi.fn()

    renderHook(() =>
      useCertificateDomainsAutoCheckFlow({
        autoCheckParamValue: "1",
        domainParamValue: "missing.example.com",
        loading: false,
        domains: [createDomain({ domain: "example.com" })],
        onCheckDomain,
        onAutoCreateDomain,
        onAutoCreateDialogInit,
      })
    )

    await waitFor(() => {
      expect(onAutoCreateDomain).toHaveBeenCalledWith("missing.example.com")
    })

    expect(onAutoCreateDialogInit).toHaveBeenCalledTimes(1)
    expect(onCheckDomain).not.toHaveBeenCalled()
  })

  it("空域名参数时只标记处理，不触发检查或创建", async () => {
    const onCheckDomain = vi.fn()
    const onAutoCreateDomain = vi.fn()

    renderHook(() =>
      useCertificateDomainsAutoCheckFlow({
        autoCheckParamValue: "1",
        domainParamValue: "   ",
        loading: false,
        domains: [createDomain()],
        onCheckDomain,
        onAutoCreateDomain,
      })
    )

    await waitFor(() => {
      expect(onCheckDomain).not.toHaveBeenCalled()
      expect(onAutoCreateDomain).not.toHaveBeenCalled()
    })
  })

  it("domain 参数变化时会重置 handled 并再次触发流程", async () => {
    const onCheckDomain = vi.fn()
    const onAutoCreateDomain = vi.fn()

    const { rerender } = renderHook(
      ({
        domainParamValue,
      }: {
        domainParamValue: string
      }) =>
        useCertificateDomainsAutoCheckFlow({
          autoCheckParamValue: "1",
          domainParamValue,
          loading: false,
          domains: [createDomain({ domain: "first.example.com", id: "d1" })],
          onCheckDomain,
          onAutoCreateDomain,
        }),
      {
        initialProps: { domainParamValue: "first.example.com" },
      }
    )

    await waitFor(() => {
      expect(onCheckDomain).toHaveBeenCalledTimes(1)
    })

    rerender({ domainParamValue: "second.example.com" })

    await waitFor(() => {
      expect(onAutoCreateDomain).toHaveBeenCalledWith("second.example.com")
    })
  })
})
