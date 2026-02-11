import CertificateChainVisualPath from '@/components/pages/CertificateChainVisualPath'

type CertificateChainVisualPathRouteProps = {
  params: Promise<{ locale: string }>
}

export default async function CertificateChainVisualPathRoute({ params }: CertificateChainVisualPathRouteProps) {
  const { locale } = await params

  return (
    <CertificateChainVisualPath
      locale={locale === 'zh' ? 'zh' : 'en'}
    />
  )
}
