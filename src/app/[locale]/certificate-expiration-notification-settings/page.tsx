import CertificateExpirationNotificationSettingsPage from '@/components/CertificateExpirationNotificationSettingsPage'

type CertificateExpirationNotificationSettingsRouteProps = {
  params: Promise<{ locale: string }>
}

export default async function CertificateExpirationNotificationSettingsRoute({
  params,
}: CertificateExpirationNotificationSettingsRouteProps) {
  const { locale } = await params

  return (
    <CertificateExpirationNotificationSettingsPage
      locale={locale === 'zh' ? 'zh' : 'en'}
    />
  )
}
