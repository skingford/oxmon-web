"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { withLocalePrefix, stripLocalePrefix } from "@/components/app-locale";
import { motion, AnimatePresence } from "framer-motion";
import { Shield, Globe, Activity } from "lucide-react";
import { useAppTranslations } from "@/hooks/use-app-translations";
import { cn } from "@/lib/utils";

export default function CertificatesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { t, locale } = useAppTranslations("pages")
  const pathname = usePathname();
  const normalizedPathname = stripLocalePrefix(pathname);
  const navItems = [
    {
      href: "/certificates",
      label: t("certificates.overview.navCertificates"),
      icon: Shield,
    },
    {
      href: "/certificates/domains",
      label: t("certificates.overview.navDomains"),
      icon: Globe,
    },
    {
      href: "/certificates/status",
      label: t("certificates.overview.navStatus"),
      icon: Activity,
    },
  ] as const

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

      <div className="min-w-0 space-y-6">
        <div className="w-full max-w-full overflow-x-auto">
          <nav
            aria-label="Certificates navigation"
            className="mb-0 inline-flex h-12 min-w-max items-center rounded-lg bg-muted/50 p-1 glass"
          >
            {navItems.map((item) => {
              const Icon = item.icon
              const isActive = normalizedPathname === item.href

              return (
                <Link
                  key={item.href}
                  href={withLocalePrefix(item.href, locale)}
                  aria-current={isActive ? "page" : undefined}
                  className={cn(
                    "inline-flex h-full items-center gap-2 rounded-md border border-transparent px-6 py-1 text-sm font-medium whitespace-nowrap transition-all",
                    isActive
                      ? "glass text-foreground shadow-sm"
                      : "text-foreground/60 hover:text-foreground"
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </Link>
              )
            })}
          </nav>
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
      </div>
    </motion.div>
  );
}
