import {
  getSidebarFooterItems,
  getSidebarMenuGroups,
  type SidebarChildItem,
  type SidebarItem,
} from "@/components/app-sidebar.config"
import {
  DEFAULT_APP_LOCALE,
  stripLocalePrefix,
  type AppLocale,
} from "@/components/app-locale"
import { createScopedTranslator } from "@/components/app-messages"

export type MatchedSidebarRoute = {
  groupLabel?: string
  item: SidebarItem
  child?: SidebarChildItem
  isFooter?: boolean
}

export function isRouteActive(pathname: string, itemUrl: string, exact = false) {
  const normalizedPathname = stripLocalePrefix(pathname)

  if (exact) {
    return normalizedPathname === itemUrl
  }

  if (itemUrl === "/") {
    return normalizedPathname === "/"
  }

  return normalizedPathname === itemUrl || normalizedPathname.startsWith(`${itemUrl}/`)
}

function matchMenuRoute(pathname: string, locale: AppLocale): MatchedSidebarRoute | null {
  const sidebarMenuGroups = getSidebarMenuGroups(locale)

  for (const group of sidebarMenuGroups) {
    for (const item of group.items) {
      if (item.children && item.children.length > 0) {
        const child = item.children.find((entry) =>
          isRouteActive(pathname, entry.url, entry.exact)
        )

        if (child) {
          return {
            groupLabel: group.label,
            item,
            child,
          }
        }
      }

      if (isRouteActive(pathname, item.url, item.exact)) {
        return {
          groupLabel: group.label,
          item,
        }
      }
    }
  }

  return null
}

function matchFooterRoute(pathname: string, locale: AppLocale): MatchedSidebarRoute | null {
  const sidebarFooterItems = getSidebarFooterItems(locale)
  const translateNavigation = createScopedTranslator(locale, "navigation")

  for (const item of sidebarFooterItems) {
    if (isRouteActive(pathname, item.url, item.exact)) {
      return {
        groupLabel: translateNavigation("labels.groupAccount"),
        item,
        isFooter: true,
      }
    }
  }

  return null
}

export function getMatchedSidebarRoute(
  pathname: string,
  locale: AppLocale = DEFAULT_APP_LOCALE
): MatchedSidebarRoute | null {
  return matchMenuRoute(pathname, locale) ?? matchFooterRoute(pathname, locale)
}
