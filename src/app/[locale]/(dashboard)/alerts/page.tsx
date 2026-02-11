import AlertRulesConfigurationTab from '@/components/pages/AlertRulesConfigurationTab'

type AlertsPageProps = {
  searchParams: Promise<{ tab?: string }>
}

export default async function AlertsPage({ searchParams }: AlertsPageProps) {
  const { tab } = await searchParams

  return (
    <AlertRulesConfigurationTab
      initialTab={tab === 'history' ? 'history' : 'rules'}
    />
  )
}
