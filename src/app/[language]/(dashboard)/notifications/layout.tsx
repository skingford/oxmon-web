"use client"

import { usePathname } from "next/navigation"
import Link from "next/link"
import { motion, AnimatePresence } from "framer-motion"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { withLocalePrefix, stripLocalePrefix } from "@/components/app-locale"
import { useAppLocale } from "@/hooks/use-app-locale"
import { ShieldOff, Inbox } from "lucide-react"

export default function NotificationsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const locale = useAppLocale()
  const normalizedPathname = stripLocalePrefix(pathname)

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-8 space-y-8"
    >
      <div className="flex flex-col gap-1">
        <h1 className="text-4xl font-extrabold tracking-tight text-gradient flex items-center gap-3">
          Notifications & Suppress
        </h1>
        <p className="text-muted-foreground text-sm">Configure routing rules and maintenance windows for system alerts.</p>
      </div>

      <Tabs value={normalizedPathname} className="space-y-6">
        <TabsList className="bg-muted/50 p-1 glass h-12">
          <Link href={withLocalePrefix("/notifications", locale)}>
            <TabsTrigger value="/notifications" className="flex items-center gap-2 px-6 data-[state=active]:glass h-full transition-all">
              <Inbox className="h-4 w-4" />
              Notification Channels
            </TabsTrigger>
          </Link>
          <Link href={withLocalePrefix("/notifications/silence", locale)}>
            <TabsTrigger value="/notifications/silence" className="flex items-center gap-2 px-6 data-[state=active]:glass h-full transition-all">
              <ShieldOff className="h-4 w-4" />
              Silence Windows
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
