"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { BookText, Tag } from "lucide-react"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { stripLocalePrefix, withLocalePrefix } from "@/components/app-locale"
import { useAppLocale } from "@/hooks/use-app-locale"
import { useAppTranslations } from "@/hooks/use-app-translations"

export default function SystemDictionariesLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const locale = useAppLocale()
  const { t } = useAppTranslations("system")

  const normalizedPathname = stripLocalePrefix(pathname)
  const activeTab = normalizedPathname.startsWith("/system/dictionaries/types")
    ? "/system/dictionaries/types"
    : "/system/dictionaries"

  return (
    <div className="space-y-4">
      <div className="px-8">
        <Tabs value={activeTab}>
          <TabsList className="h-11 bg-muted/50 p-1">
            <Link href={withLocalePrefix("/system/dictionaries", locale)}>
              <TabsTrigger value="/system/dictionaries" className="flex h-full items-center gap-2 px-5">
                <BookText className="h-4 w-4" />
                {t("dictionaryTabEntries")}
              </TabsTrigger>
            </Link>
            <Link href={withLocalePrefix("/system/dictionaries/types", locale)}>
              <TabsTrigger
                value="/system/dictionaries/types"
                className="flex h-full items-center gap-2 px-5"
              >
                <Tag className="h-4 w-4" />
                {t("dictionaryTabTypes")}
              </TabsTrigger>
            </Link>
          </TabsList>
        </Tabs>
      </div>

      {children}
    </div>
  )
}
