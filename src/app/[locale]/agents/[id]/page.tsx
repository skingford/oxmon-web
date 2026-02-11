import AgentDetailedMetricsWeb01 from '@/components/AgentDetailedMetricsWeb01'

type AgentDetailRouteProps = {
  params: Promise<{ locale: string; id: string }>
}

export default async function AgentDetailRoute({ params }: AgentDetailRouteProps) {
  const { locale, id } = await params

  return (
    <AgentDetailedMetricsWeb01
      locale={locale === 'zh' ? 'zh' : 'en'}
      agentId={id}
    />
  )
}
