import OxmonSslCertificateStatus from '@/components/pages/OxmonSslCertificateStatus'
import DomainsTabsNav from '@/components/pages/DomainsTabsNav'
import { t } from '@/lib/i18n'

type DomainsPageProps = {
  params: Promise<{ locale: string }>
}

export default async function DomainsPage({ params }: DomainsPageProps) {
  const { locale: rawLocale } = await params
  const locale = rawLocale === 'zh' ? 'zh' : 'en'

  return (
    <div className="flex min-w-0 flex-col pt-6">
      <div className="mb-6 border-b border-[#e5e5e5]/70">
        <DomainsTabsNav
          locale={locale}
          managementLabel={t(locale, 'domains.tabs.management')}
          settingsLabel={t(locale, 'domains.tabs.settings')}
        />
      </div>

      <OxmonSslCertificateStatus locale={locale} />
    </div>
  )
}
