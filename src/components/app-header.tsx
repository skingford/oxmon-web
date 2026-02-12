"use client"

import type { ReactNode } from "react"
import { Suspense, useMemo } from "react"
import { usePathname } from "next/navigation"
import { AppHeaderBreadcrumb } from "@/components/app-header-breadcrumb"
import {
  getAppHeaderMeta,
  getDefaultAppHeaderTitle,
} from "@/components/app-header.config"
import { AppHeaderLanguageSwitch } from "@/components/app-header-language-switch"
import { getMatchedSidebarRoute } from "@/components/app-navigation"
import { useAppLocale } from "@/hooks/use-app-locale"
import { Separator } from "@/components/ui/separator"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { cn } from "@/lib/utils"

type AppHeaderProps = {
  className?: string
  title?: string
  description?: string
  actions?: ReactNode
  showBreadcrumb?: boolean
}

export function AppHeader({
  className,
  title,
  description,
  actions,
  showBreadcrumb = true,
}: AppHeaderProps) {
  const pathname = usePathname()
  const locale = useAppLocale()

  const matchedRoute = useMemo(() => getMatchedSidebarRoute(pathname, locale), [pathname, locale])
  const headerMeta = useMemo(() => getAppHeaderMeta(pathname, locale), [pathname, locale])

  const resolvedTitle =
    title ||
    headerMeta?.title ||
    matchedRoute?.child?.title ||
    matchedRoute?.item.title ||
    getDefaultAppHeaderTitle(locale)

  const resolvedDescription = description || headerMeta?.description

  return (
    <header
      className={cn(
        "sticky top-0 z-20 border-b border-border/40 bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/70",
        className
      )}
    >
      <div className="flex min-h-16 items-center gap-4 px-4 py-2 md:px-6">
        <div className="flex shrink-0 items-center rounded-full border border-border/70 bg-background/80 p-1 shadow-xs">
          <SidebarTrigger className="size-8 rounded-full hover:bg-accent/60" />
          <Separator orientation="vertical" className="mx-1 hidden h-4 sm:block" />
          <span className="hidden pr-2 text-xs font-medium text-muted-foreground sm:inline">
            导航
          </span>
        </div>

        <div className="min-w-0 flex-1">
          <AppHeaderBreadcrumb
            locale={locale}
            matchedRoute={matchedRoute}
            show={showBreadcrumb}
            className="hidden sm:block"
          />

          {/* <h1 className="truncate text-sm font-semibold md:text-base">{resolvedTitle}</h1>
          {resolvedDescription ? (
            <p className="hidden truncate text-xs text-muted-foreground md:block md:text-sm">
              {resolvedDescription}
            </p>
          ) : null} */}
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <Suspense fallback={<div className="h-8 w-20 rounded-full border border-border/70 bg-muted/30" />}>
            <AppHeaderLanguageSwitch />
          </Suspense>
          {actions ? <div className="flex items-center gap-2">{actions}</div> : null}
        </div>
      </div>
    </header>
  )
}
