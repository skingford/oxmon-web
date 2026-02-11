import Link from 'next/link'
import OxmonSslCertificateStatus from '@/components/pages/OxmonSslCertificateStatus'

type DomainsPageProps = {
  params: Promise<{ locale: string }>
}

export default async function DomainsPage({ params }: DomainsPageProps) {
  const { locale: rawLocale } = await params
  const locale = rawLocale === 'zh' ? 'zh' : 'en'

  return (
    <div className="flex min-w-0 flex-col pt-6">
      <OxmonSslCertificateStatus />
    </div>
  )
}
