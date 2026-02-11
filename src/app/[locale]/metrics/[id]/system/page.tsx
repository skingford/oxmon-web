import FullScreenMetricsChartView from '@/components/FullScreenMetricsChartView'

type FullScreenMetricsChartViewRouteProps = {
  params: Promise<{ locale: string }>
}

export default async function FullScreenMetricsChartViewRoute({ params }: FullScreenMetricsChartViewRouteProps) {
  const { locale } = await params

  return (
    <FullScreenMetricsChartView
      locale={locale === 'zh' ? 'zh' : 'en'}
    />
  )
}
