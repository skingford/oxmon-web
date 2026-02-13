"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { BookText, Settings } from "lucide-react"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { stripLocalePrefix, withLocalePrefix } from "@/components/app-locale"
import { useAppLocale } from "@/hooks/use-app-locale"
import { useAppTranslations } from "@/hooks/use-app-translations"

export default function SystemLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const locale = useAppLocale()
  const { t } = useAppTranslations("navigation")

  const normalizedPathname = stripLocalePrefix(pathname)
  const activeTab = normalizedPathname.startsWith("/system/dictionaries")
    ? "/system/dictionaries"
    : "/system"

  return (
    <div className="space-y-4">
      <div className="px-8 pt-6">
        <Tabs value={activeTab}>
          <TabsList className="h-11 bg-muted/50 p-1">
            <Link href={withLocalePrefix("/system", locale)}>
              <TabsTrigger value="/system" className="flex h-full items-center gap-2 px-5">
                <Settings className="h-4 w-4" />
                {t("labels.itemSystem")}
              </TabsTrigger>
            </Link>
            <Link href={withLocalePrefix("/system/dictionaries", locale)}>
              <TabsTrigger value="/system/dictionaries" className="flex h-full items-center gap-2 px-5">
                <BookText className="h-4 w-4" />
                {t("labels.itemSystemDictionaries")}
              </TabsTrigger>
            </Link>
          </TabsList>
        </Tabs>
      </div>

      {children}
    </div>
  )
}
