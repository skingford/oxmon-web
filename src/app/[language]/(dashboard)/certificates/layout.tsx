"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { withLocalePrefix, stripLocalePrefix } from "@/components/app-locale";
import { useAppLocale } from "@/hooks/use-app-locale";
import { motion, AnimatePresence } from "framer-motion";
import { Shield, Globe, Activity } from "lucide-react";
import { useAppTranslations } from "@/hooks/use-app-translations";

export default function CertificatesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
    const { t, locale } = useAppTranslations("pages")
  const pathname = usePathname();
  // const locale = useAppLocale();
  const normalizedPathname = stripLocalePrefix(pathname);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      className="min-w-0 space-y-8 p-4 md:p-8"
    >
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-4xl font-extrabold tracking-tight text-glow">{t("certificates.overview.title")}</h2>
          <p className="text-muted-foreground mt-1 text-sm">
           {t("certificates.overview.description")}
          </p>
        </div>
      </div>

      <Tabs value={normalizedPathname} className="min-w-0 space-y-6">
        <div className="w-full max-w-full overflow-x-auto">
          <TabsList className="mb-0 h-12 min-w-max bg-muted/50 p-1 glass">
          <Link href={withLocalePrefix("/certificates", locale)}>
            <TabsTrigger value="/certificates" className="flex items-center gap-2 px-6 data-[state=active]:glass h-full transition-all">
              <Shield className="h-4 w-4" />
              Certificates List
            </TabsTrigger>
          </Link>
          <Link href={withLocalePrefix("/certificates/domains", locale)}>
            <TabsTrigger value="/certificates/domains" className="flex items-center gap-2 px-6 data-[state=active]:glass h-full transition-all">
              <Globe className="h-4 w-4" />
              Domains
            </TabsTrigger>
          </Link>
          <Link href={withLocalePrefix("/certificates/status", locale)}>
            <TabsTrigger value="/certificates/status" className="flex items-center gap-2 px-6 data-[state=active]:glass h-full transition-all">
              <Activity className="h-4 w-4" />
              Status
            </TabsTrigger>
          </Link>
          </TabsList>
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={pathname}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.2 }}
          >
            {children}
          </motion.div>
        </AnimatePresence>
      </Tabs>
    </motion.div>
  );
}
