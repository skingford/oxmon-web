import ChartMetricTooltipDetailPage from '@/components/ChartMetricTooltipDetailPage'

type ChartMetricTooltipDetailRouteProps = {
  params: Promise<{ locale: string }>
}

export default async function ChartMetricTooltipDetailRoute({ params }: ChartMetricTooltipDetailRouteProps) {
  const { locale } = await params

  return (
    <ChartMetricTooltipDetailPage
      locale={locale === 'zh' ? 'zh' : 'en'}
    />
  )
}
