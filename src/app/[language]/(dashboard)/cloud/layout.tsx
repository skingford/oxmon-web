"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { AnimatePresence, motion } from "framer-motion"
import { BarChart3, Cloud, Database, Server } from "lucide-react"
import { stripLocalePrefix, withLocalePrefix } from "@/components/app-locale"
import { cn } from "@/lib/utils"
import { useAppTranslations } from "@/hooks/use-app-translations"

export default function CloudLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const { locale, t } = useAppTranslations("pages")
  const normalizedPathname = stripLocalePrefix(pathname)
  const currentTabValue = normalizedPathname.startsWith("/cloud/instances/ranking")
    ? "/cloud/instances/ranking"
    : normalizedPathname.startsWith("/cloud/instances")
      ? "/cloud/instances"
      : "/cloud"

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="min-w-0 space-y-8 p-4 md:p-8"
    >
      <div className="flex flex-col gap-1">
        <h1 className="text-gradient flex items-center gap-3 text-4xl font-extrabold tracking-tight">
          <Cloud className="h-8 w-8" />
          {t("cloud.layoutTitle")}
        </h1>
        <p className="text-sm text-muted-foreground">{t("cloud.layoutDescription")}</p>
      </div>

      <div className="min-w-0 space-y-6">
        <div className="w-full max-w-full overflow-x-auto">
          <div className="glass inline-flex h-12 min-w-max items-center rounded-lg bg-muted/50 p-1">
            <Link
              href={withLocalePrefix("/cloud", locale)}
              className={cn(
                "inline-flex h-full items-center gap-2 rounded-md px-6 text-sm transition-colors",
                currentTabValue === "/cloud"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-foreground/60 hover:text-foreground"
              )}
            >
              <Database className="h-4 w-4" />
              {t("cloud.tabsAccounts")}
            </Link>
            <Link
              href={withLocalePrefix("/cloud/instances", locale)}
              className={cn(
                "inline-flex h-full items-center gap-2 rounded-md px-6 text-sm transition-colors",
                currentTabValue === "/cloud/instances"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-foreground/60 hover:text-foreground"
              )}
            >
              <Server className="h-4 w-4" />
              {t("cloud.tabsInstances")}
            </Link>
            <Link
              href={withLocalePrefix("/cloud/instances/ranking", locale)}
              className={cn(
                "inline-flex h-full items-center gap-2 rounded-md px-6 text-sm transition-colors",
                currentTabValue === "/cloud/instances/ranking"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-foreground/60 hover:text-foreground"
              )}
            >
              <BarChart3 className="h-4 w-4" />
              {t("cloud.tabsInstanceRanking")}
            </Link>
          </div>
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={pathname}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
          >
            {children}
          </motion.div>
        </AnimatePresence>
      </div>
    </motion.div>
  )
}
