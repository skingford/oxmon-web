import Metrics from '@/components/pages/Metrics'

type MetricsPageProps = {
  params: Promise<{ locale: string }>
}

export default async function MetricsPage({ params }: MetricsPageProps) {
  const { locale } = await params

  return (
    <Metrics
      locale={locale === 'zh' ? 'zh' : 'en'}
    />
  )
}
