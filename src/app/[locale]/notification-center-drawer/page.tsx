import NotificationCenterDrawerPage from '@/components/NotificationCenterDrawerPage'

type NotificationCenterDrawerRouteProps = {
  params: Promise<{ locale: string }>
}

export default async function NotificationCenterDrawerRoute({
  params,
}: NotificationCenterDrawerRouteProps) {
  const { locale } = await params

  return (
    <NotificationCenterDrawerPage
      locale={locale === 'zh' ? 'zh' : 'en'}
    />
  )
}
