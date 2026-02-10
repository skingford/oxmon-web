import OxmonSslCertificateStatusPage from '@/components/OxmonSslCertificateStatusPage'

type OxmonSslCertificateStatusRouteProps = {
  params: Promise<{ locale: string }>
}

export default async function OxmonSslCertificateStatusRoute({ params }: OxmonSslCertificateStatusRouteProps) {
  const { locale } = await params

  return (
    <OxmonSslCertificateStatusPage
      locale={locale === 'zh' ? 'zh' : 'en'}
    />
  )
}
