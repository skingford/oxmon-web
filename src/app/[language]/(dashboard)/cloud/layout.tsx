"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { AnimatePresence, motion } from "framer-motion"
import { Cloud, Database, Server } from "lucide-react"
import { stripLocalePrefix, withLocalePrefix } from "@/components/app-locale"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useAppTranslations } from "@/hooks/use-app-translations"

export default function CloudLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const { locale, t } = useAppTranslations("pages")
  const normalizedPathname = stripLocalePrefix(pathname)
  const currentTabValue = normalizedPathname.startsWith("/cloud/instances")
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

      <Tabs value={currentTabValue} className="min-w-0 space-y-6">
        <div className="w-full max-w-full overflow-x-auto">
          <TabsList className="glass h-12 min-w-max bg-muted/50 p-1">
            <Link href={withLocalePrefix("/cloud", locale)}>
              <TabsTrigger value="/cloud" className="flex h-full items-center gap-2 px-6">
                <Database className="h-4 w-4" />
                {t("cloud.tabsAccounts")}
              </TabsTrigger>
            </Link>
            <Link href={withLocalePrefix("/cloud/instances", locale)}>
              <TabsTrigger value="/cloud/instances" className="flex h-full items-center gap-2 px-6">
                <Server className="h-4 w-4" />
                {t("cloud.tabsInstances")}
              </TabsTrigger>
            </Link>
          </TabsList>
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
      </Tabs>
    </motion.div>
  )
}
