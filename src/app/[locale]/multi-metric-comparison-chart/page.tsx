import MultiMetricComparisonChartPage from '@/components/MultiMetricComparisonChartPage'

type MultiMetricComparisonChartRouteProps = {
  params: Promise<{ locale: string }>
}

export default async function MultiMetricComparisonChartRoute({ params }: MultiMetricComparisonChartRouteProps) {
  const { locale } = await params

  return (
    <MultiMetricComparisonChartPage
      locale={locale === 'zh' ? 'zh' : 'en'}
    />
  )
}
