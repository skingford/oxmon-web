import CertificateChainVisualPathPage from '@/components/CertificateChainVisualPathPage'

type CertificateChainVisualPathRouteProps = {
  params: Promise<{ locale: string }>
}

export default async function CertificateChainVisualPathRoute({ params }: CertificateChainVisualPathRouteProps) {
  const { locale } = await params

  return (
    <CertificateChainVisualPathPage
      locale={locale === 'zh' ? 'zh' : 'en'}
    />
  )
}
