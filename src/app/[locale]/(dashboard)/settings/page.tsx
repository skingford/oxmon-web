import GlobalNotificationChannelSettings from '@/components/GlobalNotificationChannelSettings'

type GlobalNotificationChannelSettingsRouteProps = {
  params: Promise<{ locale: string }>
}

export default async function GlobalNotificationChannelSettingsRoute({
  params,
}: GlobalNotificationChannelSettingsRouteProps) {
  const { locale } = await params

  return (
    <GlobalNotificationChannelSettings
      locale={locale === 'zh' ? 'zh' : 'en'}
    />
  )
}
