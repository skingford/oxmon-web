import { act, renderHook, waitFor } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"

import { useCertificateStatusQueryState } from "./use-certificate-status-query-state"

function createSearchParams(query = "") {
  return new URLSearchParams(query) as unknown as Readonly<URLSearchParams>
}

describe("useCertificateStatusQueryState", () => {
  it("从 URL 初始化 search/offset", () => {
    const replace = vi.fn()

    const { result } = renderHook(() =>
      useCertificateStatusQueryState({
        pathname: "/zh/certificates/status",
        searchParams: createSearchParams("search=example.com&offset=15"),
        replace,
      })
    )

    expect(result.current.search).toBe("example.com")
    expect(result.current.offset).toBe(15)
    expect(replace).not.toHaveBeenCalled()
  })

  it("搜索变更时重置 offset 并同步 URL", async () => {
    const replace = vi.fn()
    const searchParams = createSearchParams("search=old.com&offset=20")

    const { result } = renderHook(() =>
      useCertificateStatusQueryState({
        pathname: "/zh/certificates/status",
        searchParams,
        replace,
      })
    )

    act(() => {
      result.current.handleSearchChange("new.com")
    })

    expect(result.current.search).toBe("new.com")
    expect(result.current.offset).toBe(0)

    await waitFor(() => {
      expect(replace).toHaveBeenLastCalledWith("/zh/certificates/status?search=new.com", {
        scroll: false,
      })
    })
  })

  it("清空搜索时移除 URL 参数", async () => {
    const replace = vi.fn()
    const searchParams = createSearchParams("search=example.com&offset=20")

    const { result } = renderHook(() =>
      useCertificateStatusQueryState({
        pathname: "/zh/certificates/status",
        searchParams,
        replace,
      })
    )

    act(() => {
      result.current.handleClearSearch()
    })

    expect(result.current.search).toBe("")
    expect(result.current.offset).toBe(0)

    await waitFor(() => {
      expect(replace).toHaveBeenLastCalledWith("/zh/certificates/status", { scroll: false })
    })
  })
})
