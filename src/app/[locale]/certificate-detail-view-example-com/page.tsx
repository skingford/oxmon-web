import CertificateDetailViewExampleComPage from '@/components/CertificateDetailViewExampleComPage'

type CertificateDetailViewExampleComRouteProps = {
  params: Promise<{ locale: string }>
}

export default async function CertificateDetailViewExampleComRoute({ params }: CertificateDetailViewExampleComRouteProps) {
  const { locale } = await params

  return (
    <CertificateDetailViewExampleComPage
      locale={locale === 'zh' ? 'zh' : 'en'}
    />
  )
}
