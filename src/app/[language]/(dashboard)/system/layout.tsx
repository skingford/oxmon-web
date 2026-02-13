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
      {children}
    </div>
  )
}
