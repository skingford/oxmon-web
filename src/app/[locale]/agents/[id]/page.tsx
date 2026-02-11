import AgentDetailedMetricsWeb01Page from '@/components/AgentDetailedMetricsWeb01Page'

type AgentDetailRouteProps = {
  params: Promise<{ locale: string; id: string }>
}

export default async function AgentDetailRoute({ params }: AgentDetailRouteProps) {
  const { locale, id } = await params

  return (
    <AgentDetailedMetricsWeb01Page
      locale={locale === 'zh' ? 'zh' : 'en'}
      agentId={id}
    />
  )
}
