import FullScreenMetricsChartViewPage from '@/components/FullScreenMetricsChartViewPage'

type FullScreenMetricsChartViewRouteProps = {
  params: Promise<{ locale: string }>
}

export default async function FullScreenMetricsChartViewRoute({ params }: FullScreenMetricsChartViewRouteProps) {
  const { locale } = await params

  return (
    <FullScreenMetricsChartViewPage
      locale={locale === 'zh' ? 'zh' : 'en'}
    />
  )
}
