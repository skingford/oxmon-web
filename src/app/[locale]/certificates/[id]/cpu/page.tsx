import ChartMetricTooltipDetail from '@/components/ChartMetricTooltipDetail'

type ChartMetricTooltipDetailRouteProps = {
  params: Promise<{ locale: string }>
}

export default async function ChartMetricTooltipDetailRoute({ params }: ChartMetricTooltipDetailRouteProps) {
  const { locale } = await params

  return (
    <ChartMetricTooltipDetail
      locale={locale === 'zh' ? 'zh' : 'en'}
    />
  )
}
