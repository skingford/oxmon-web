import MultiMetricComparisonChart from '@/components/pages/MultiMetricComparisonChart'

type MultiMetricComparisonChartRouteProps = {
  params: Promise<{ locale: string }>
}

export default async function MultiMetricComparisonChartRoute({ params }: MultiMetricComparisonChartRouteProps) {
  const { locale } = await params

  return (
    <MultiMetricComparisonChart
      locale={locale === 'zh' ? 'zh' : 'en'}
    />
  )
}
