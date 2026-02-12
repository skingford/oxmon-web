"use client"

import { usePathname } from "next/navigation"
import Link from "next/link"
import { motion, AnimatePresence } from "framer-motion"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { withLocalePrefix, stripLocalePrefix } from "@/components/app-locale"
import { useAppTranslations } from "@/hooks/use-app-translations"
import { Bell, History, Settings2 } from "lucide-react"

export default function AlertsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const { locale, t } = useAppTranslations("alerts")
  const normalizedPathname = stripLocalePrefix(pathname)

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-8 space-y-8"
    >
      <div className="flex flex-col gap-1">
        <h1 className="text-4xl font-extrabold tracking-tight text-gradient flex items-center gap-3">
          {t("layout.title")}
        </h1>
        <p className="text-muted-foreground text-sm">{t("layout.description")}</p>
      </div>

      <Tabs value={normalizedPathname} className="space-y-6">
        <TabsList className="bg-muted/50 p-1 glass h-12">
          <Link href={withLocalePrefix("/alerts", locale)}>
            <TabsTrigger value="/alerts" className="flex items-center gap-2 px-6 data-[state=active]:glass h-full transition-all">
              <Bell className="h-4 w-4" />
              {t("layout.tabActive")}
            </TabsTrigger>
          </Link>
          <Link href={withLocalePrefix("/alerts/history", locale)}>
            <TabsTrigger value="/alerts/history" className="flex items-center gap-2 px-6 data-[state=active]:glass h-full transition-all">
              <History className="h-4 w-4" />
              {t("layout.tabHistory")}
            </TabsTrigger>
          </Link>
          <Link href={withLocalePrefix("/alerts/rules", locale)}>
            <TabsTrigger value="/alerts/rules" className="flex items-center gap-2 px-6 data-[state=active]:glass h-full transition-all">
              <Settings2 className="h-4 w-4" />
              {t("layout.tabRules")}
            </TabsTrigger>
          </Link>
        </TabsList>

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
