"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function AlertsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div className="p-8 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Alerts</h2>
          <p className="text-muted-foreground">
            Monitor and manage system alerts and rules.
          </p>
        </div>
      </div>

      <Tabs value={pathname} className="space-y-4">
        <TabsList>
          <Link href="/alerts">
            <TabsTrigger value="/alerts">Active Alerts</TabsTrigger>
          </Link>
          <Link href="/alerts/history">
            <TabsTrigger value="/alerts/history">Alert History</TabsTrigger>
          </Link>
          <Link href="/alerts/rules">
            <TabsTrigger value="/alerts/rules">Alert Rules</TabsTrigger>
          </Link>
        </TabsList>
        {children}
      </Tabs>
    </div>
  );
}
