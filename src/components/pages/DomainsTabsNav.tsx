'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'

type DomainsTabsNavProps = {
  locale: 'en' | 'zh'
  managementLabel: string
  settingsLabel: string
}

export default function DomainsTabsNav({
  locale,
  managementLabel,
  settingsLabel,
}: DomainsTabsNavProps) {
  const pathname = usePathname()

  const activeValue = pathname?.endsWith('/settings') ? 'settings' : 'management'

  return (
    <Tabs value={activeValue} className="gap-0">
      <TabsList variant="line" className="h-auto gap-8 bg-transparent p-0">
        <TabsTrigger
          value="management"
          asChild
          className="rounded-none border-b-2 border-transparent px-1 pb-3 text-sm font-semibold text-[#60758a] transition-colors data-[state=active]:border-[#0073e6] data-[state=active]:text-[#0073e6]"
        >
          <Link href={`/${locale}/domains`}>{managementLabel}</Link>
        </TabsTrigger>
        <TabsTrigger
          value="settings"
          asChild
          className="rounded-none border-b-2 border-transparent px-1 pb-3 text-sm font-medium text-[#60758a] transition-colors data-[state=active]:border-[#0073e6] data-[state=active]:text-[#0073e6]"
        >
          <Link href={`/${locale}/domains/settings`}>{settingsLabel}</Link>
        </TabsTrigger>
      </TabsList>
    </Tabs>
  )
}
