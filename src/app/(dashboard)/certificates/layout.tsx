"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { motion, AnimatePresence } from "framer-motion";
import { Shield, Globe } from "lucide-react";

export default function CertificatesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      className="p-8 space-y-8"
    >
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-4xl font-extrabold tracking-tight text-gradient text-glow">Identity & Privacy</h2>
          <p className="text-muted-foreground mt-1 text-sm">
            Manage SSL/TLS certificates and monitored domains.
          </p>
        </div>
      </div>

      <Tabs value={pathname} className="space-y-6">
        <TabsList className="bg-muted/50 p-1 glass h-12">
          <Link href="/certificates">
            <TabsTrigger value="/certificates" className="flex items-center gap-2 px-6 data-[state=active]:glass h-full transition-all">
              <Shield className="h-4 w-4" />
              Certificates List
            </TabsTrigger>
          </Link>
          <Link href="/certificates/domains">
            <TabsTrigger value="/certificates/domains" className="flex items-center gap-2 px-6 data-[state=active]:glass h-full transition-all">
              <Globe className="h-4 w-4" />
              Domain Assets
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
  );
}
