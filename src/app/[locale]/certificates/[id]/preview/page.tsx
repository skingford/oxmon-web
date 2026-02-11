import CertificateStatusReportPdfPreview from '@/components/pages/CertificateStatusReportPdfPreview'

type CertificateStatusReportPdfPreviewRouteProps = {
  params: Promise<{ locale: string }>
}

export default async function CertificateStatusReportPdfPreviewRoute({
  params,
}: CertificateStatusReportPdfPreviewRouteProps) {
  const { locale } = await params

  return (
    <CertificateStatusReportPdfPreview
      locale={locale === 'zh' ? 'zh' : 'en'}
    />
  )
}
