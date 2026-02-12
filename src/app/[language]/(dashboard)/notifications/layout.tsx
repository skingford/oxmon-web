"use client"

import { usePathname } from "next/navigation"
import Link from "next/link"
import { motion, AnimatePresence } from "framer-motion"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { withLocalePrefix, stripLocalePrefix } from "@/components/app-locale"
import { useAppLocale } from "@/hooks/use-app-locale"
import { useAppTranslations } from "@/hooks/use-app-translations"
import { Inbox, ShieldOff } from "lucide-react"

export default function NotificationsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const locale = useAppLocale()
  const { t } = useAppTranslations("pages")
  const normalizedPathname = stripLocalePrefix(pathname)

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8 p-8"
    >
      <div className="flex flex-col gap-1">
        <h1 className="text-gradient flex items-center gap-3 text-4xl font-extrabold tracking-tight">
          {t("notifications.layoutTitle")}
        </h1>
        <p className="text-sm text-muted-foreground">{t("notifications.layoutDescription")}</p>
      </div>

      <Tabs value={normalizedPathname} className="space-y-6">
        <TabsList className="glass h-12 bg-muted/50 p-1">
          <Link href={withLocalePrefix("/notifications", locale)}>
            <TabsTrigger value="/notifications" className="flex h-full items-center gap-2 px-6">
              <Inbox className="h-4 w-4" />
              {t("notifications.tabsChannels")}
            </TabsTrigger>
          </Link>
          <Link href={withLocalePrefix("/notifications/silence", locale)}>
            <TabsTrigger value="/notifications/silence" className="flex h-full items-center gap-2 px-6">
              <ShieldOff className="h-4 w-4" />
              {t("notifications.tabsSilence")}
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
