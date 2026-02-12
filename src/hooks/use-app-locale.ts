"use client"

import { useMemo } from "react"
import { usePathname } from "next/navigation"
import { resolveAppLocale } from "@/components/app-locale"

export function useAppLocale() {
  const pathname = usePathname()

  return useMemo(() => resolveAppLocale(pathname), [pathname])
}
