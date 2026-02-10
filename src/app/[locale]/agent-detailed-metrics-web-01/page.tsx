import AgentDetailedMetricsWeb01Page from '@/components/AgentDetailedMetricsWeb01Page'

type AgentDetailedMetricsRouteProps = {
  params: Promise<{ locale: string }>
}

export default async function AgentDetailedMetricsRoute({ params }: AgentDetailedMetricsRouteProps) {
  const { locale } = await params

  return (
    <AgentDetailedMetricsWeb01Page
      locale={locale === 'zh' ? 'zh' : 'en'}
    />
  )
}
