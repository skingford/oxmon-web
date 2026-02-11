import CertificateStatusReportPdfPreviewPage from '@/components/CertificateStatusReportPdfPreviewPage'

type CertificateStatusReportPdfPreviewRouteProps = {
  params: Promise<{ locale: string }>
}

export default async function CertificateStatusReportPdfPreviewRoute({
  params,
}: CertificateStatusReportPdfPreviewRouteProps) {
  const { locale } = await params

  return (
    <CertificateStatusReportPdfPreviewPage
      locale={locale === 'zh' ? 'zh' : 'en'}
    />
  )
}
