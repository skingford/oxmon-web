import CertificateDetailViewExampleCom from '@/components/CertificateDetailViewExampleCom'

type CertificateDetailViewExampleComRouteProps = {
  params: Promise<{ locale: string }>
}

export default async function CertificateDetailViewExampleComRoute({ params }: CertificateDetailViewExampleComRouteProps) {
  const { locale } = await params

  return (
    <CertificateDetailViewExampleCom
      locale={locale === 'zh' ? 'zh' : 'en'}
    />
  )
}
