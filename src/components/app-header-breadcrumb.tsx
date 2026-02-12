import Link from "next/link"
import { withLocalePrefix, type AppLocale } from "@/components/app-locale"
import type { MatchedSidebarRoute } from "@/components/app-navigation"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { cn } from "@/lib/utils"

type AppHeaderBreadcrumbProps = {
  locale: AppLocale
  matchedRoute: MatchedSidebarRoute | null
  show?: boolean
  className?: string
}

export function AppHeaderBreadcrumb({
  locale,
  matchedRoute,
  show = true,
  className,
}: AppHeaderBreadcrumbProps) {
  if (!show || !matchedRoute?.groupLabel) {
    return null
  }

  return (
    <Breadcrumb className={cn(className)}>
      <BreadcrumbList className="text-xs">
        <BreadcrumbItem>
          <span>{matchedRoute.groupLabel}</span>
        </BreadcrumbItem>

        {matchedRoute.child ? (
          <>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link href={withLocalePrefix(matchedRoute.item.url, locale)}>
                  {matchedRoute.item.title}
                </Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>{matchedRoute.child.title}</BreadcrumbPage>
            </BreadcrumbItem>
          </>
        ) : (
          <>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>{matchedRoute.item.title}</BreadcrumbPage>
            </BreadcrumbItem>
          </>
        )}
      </BreadcrumbList>
    </Breadcrumb>
  )
}
