import CertificateExpirationNotificationSettings from '@/components/pages/CertificateExpirationNotificationSettings'

type CertificateNotificationSettingsRouteProps = {
  params: Promise<{ locale: string }>
}

export default async function CertificateNotificationSettingsRoute({
  params,
}: CertificateNotificationSettingsRouteProps) {
  const { locale } = await params

  return (
    <CertificateExpirationNotificationSettings
      locale={locale === 'zh' ? 'zh' : 'en'}
    />
  )
}
