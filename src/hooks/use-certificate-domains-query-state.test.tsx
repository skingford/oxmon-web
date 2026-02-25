import { act, renderHook, waitFor } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"

import { useCertificateDomainsQueryState } from "./use-certificate-domains-query-state"

function createSearchParams(query = "") {
  return new URLSearchParams(query) as unknown as Readonly<URLSearchParams>
}

describe("useCertificateDomainsQueryState", () => {
  it("从 URL 初始化 domain/status/offset", () => {
    const replace = vi.fn()

    const { result } = renderHook(() =>
      useCertificateDomainsQueryState({
        pathname: "/zh/certificates/domains",
        searchParams: createSearchParams("domain=example.com&status=enabled&offset=20"),
        replace,
      })
    )

    expect(result.current.domainKeyword).toBe("example.com")
    expect(result.current.statusFilter).toBe("enabled")
    expect(result.current.offset).toBe(20)
    expect(replace).not.toHaveBeenCalled()
  })

  it("搜索关键字变更时重置 offset 并同步 URL", async () => {
    const replace = vi.fn()
    const searchParams = createSearchParams("domain=old.com&status=enabled&offset=40")

    const { result } = renderHook(() =>
      useCertificateDomainsQueryState({
        pathname: "/zh/certificates/domains",
        searchParams,
        replace,
      })
    )

    act(() => {
      result.current.handleDomainKeywordChange("new.com")
    })

    expect(result.current.domainKeyword).toBe("new.com")
    expect(result.current.offset).toBe(0)

    await waitFor(() => {
      expect(replace).toHaveBeenLastCalledWith(
        "/zh/certificates/domains?domain=new.com&status=enabled",
        { scroll: false }
      )
    })
  })

  it("重置筛选时清空 domain/status/offset 并同步 URL", async () => {
    const replace = vi.fn()
    const searchParams = createSearchParams("domain=example.com&status=disabled&offset=10")

    const { result } = renderHook(() =>
      useCertificateDomainsQueryState({
        pathname: "/zh/certificates/domains",
        searchParams,
        replace,
      })
    )

    act(() => {
      result.current.handleResetFilters()
    })

    expect(result.current.domainKeyword).toBe("")
    expect(result.current.statusFilter).toBe("all")
    expect(result.current.offset).toBe(0)

    await waitFor(() => {
      expect(replace).toHaveBeenLastCalledWith("/zh/certificates/domains", { scroll: false })
    })
  })
})
