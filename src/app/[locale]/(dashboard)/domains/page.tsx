import Link from 'next/link'
import OxmonSslCertificateStatus from '@/components/pages/OxmonSslCertificateStatus'
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
        <div className="flex gap-8">
          <Link
            href={`/${locale}/domains`}
            className="border-b-2 border-[#0073e6] px-1 pb-3 text-sm font-semibold text-[#0073e6]"
          >
            {t(locale, 'domains.tabs.management')}
          </Link>
          <Link
            href={`/${locale}/domains/settings`}
            className="border-b-2 border-transparent px-1 pb-3 text-sm font-medium text-[#60758a] transition-colors hover:text-[#1D1D1F]"
          >
            {t(locale, 'domains.tabs.settings')}
          </Link>
        </div>
      </div>

      <OxmonSslCertificateStatus locale={locale} />
    </div>
  )
}
