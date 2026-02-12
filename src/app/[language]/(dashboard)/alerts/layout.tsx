"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { withLocalePrefix, stripLocalePrefix } from "@/components/app-locale";
import { useAppLocale } from "@/hooks/use-app-locale";
import { motion, AnimatePresence } from "framer-motion";
import { Bell, History, FileText } from "lucide-react";

export default function AlertsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const locale = useAppLocale();
  const normalizedPathname = stripLocalePrefix(pathname);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-8 space-y-8"
    >
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-4xl font-extrabold tracking-tight text-gradient">Alerts Center</h2>
          <p className="text-muted-foreground mt-1 text-sm">
            Monitor infrastructure health and manage notification rules.
          </p>
        </div>
      </div>

      <Tabs value={normalizedPathname} className="space-y-6">
        <TabsList className="bg-muted/50 p-1 glass h-12">
          <Link href={withLocalePrefix("/alerts", locale)}>
            <TabsTrigger value="/alerts" className="flex items-center gap-2 px-6 data-[state=active]:glass h-full transition-all">
              <Bell className="h-4 w-4" />
              Active Alerts
            </TabsTrigger>
          </Link>
          <Link href={withLocalePrefix("/alerts/history", locale)}>
            <TabsTrigger value="/alerts/history" className="flex items-center gap-2 px-6 data-[state=active]:glass h-full transition-all">
              <History className="h-4 w-4" />
              Alert History
            </TabsTrigger>
          </Link>
          <Link href={withLocalePrefix("/alerts/rules", locale)}>
            <TabsTrigger value="/alerts/rules" className="flex items-center gap-2 px-6 data-[state=active]:glass h-full transition-all">
              <FileText className="h-4 w-4" />
              Alert Rules
            </TabsTrigger>
          </Link>
        </TabsList>

        <AnimatePresence mode="wait">
          <motion.div
            key={pathname}
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            transition={{ duration: 0.2 }}
          >
            {children}
          </motion.div>
        </AnimatePresence>
      </Tabs>
    </motion.div>
  );
}
