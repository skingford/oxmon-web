'use client'

import React, { useCallback, useMemo, useState } from 'react'
import { TeamMember, AppPreferences } from '@/lib/types'
import { performGovernanceAudit } from '@/actions/ai'
import { createId } from '@/lib/id'
import { useI18n } from '@/contexts/I18nContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Bell,
  BrainCircuit,
  Check,
  Copy,
  KeyRound,
  Lock,
  Mail,
  Network,
  RefreshCw,
  Shield,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  User,
  Users,
  X,
  type LucideIcon,
} from 'lucide-react'

type SettingsTab = 'workspace' | 'team' | 'routing' | 'vault'
type RoutingPreferenceKey = 'notifEmail' | 'notifSlack' | 'notifWeekly'

interface RoutingRouteItem {
  key: RoutingPreferenceKey
  label: string
  sub: string
  icon: LucideIcon
  color: string
  enabled: boolean
}

interface SettingsProps {
  teamMembers: TeamMember[]
  preferences: AppPreferences
  onAddTeamMember: (member: TeamMember) => void
  onRemoveTeamMember: (id: string) => void
  onUpdateTeamMemberRole: (id: string, newRole: TeamMember['role']) => void
  onUpdatePreferences: (prefs: Partial<AppPreferences>) => void
  onShowToast: (message: string, type: 'success' | 'error' | 'info') => void
  apiKey: string
  onRegenerateKey: () => void
}

const Toggle: React.FC<{ checked: boolean; onChange: () => void }> = ({
  checked,
  onChange,
}) => (
  <Button
    onClick={onChange}
    className={`relative inline-flex h-8 w-14 items-center rounded-full transition-all duration-300 ${checked ? 'bg-primary shadow-lg shadow-primary/30' : 'bg-gray-200'}`}
  >
    {checked ? (
      <Check className="inline-block h-6 w-6 translate-x-7 transform rounded-full bg-white shadow-md transition-transform duration-300" />
    ) : (
      <X className="inline-block h-6 w-6 translate-x-1 transform rounded-full bg-white transition-transform duration-300" />
    )}
  </Button>
)

const Settings: React.FC<SettingsProps> = ({
  teamMembers,
  preferences,
  onAddTeamMember,
  onRemoveTeamMember,
  onUpdateTeamMemberRole,
  onUpdatePreferences,
  onShowToast,
  apiKey,
  onRegenerateKey,
}) => {
  const { tr } = useI18n()
  const [activeTab, setActiveTab] = useState<SettingsTab>('workspace')
  const [isVerifying, setIsVerifying] = useState(false)
  const [inviteEmail, setInviteEmail] = useState('')
  const [isAuditing, setIsAuditing] = useState(false)
  const [auditReport, setAuditReport] = useState<string | null>(null)

  const routingRoutes = useMemo<RoutingRouteItem[]>(
    () => [
      {
        key: 'notifEmail',
        label: tr('SMTP Relay'),
        sub: tr('Instant alert propagation via verified email infrastructure.'),
        icon: Mail,
        color: 'text-primary bg-primary/5',
        enabled: preferences.notifEmail,
      },
      {
        key: 'notifSlack',
        label: tr('Webhooks'),
        sub: tr('Broadcast critical telemetry to integrated Slack channels.'),
        icon: Network,
        color: 'text-indigo-500 bg-indigo-50',
        enabled: preferences.notifSlack,
      },
      {
        key: 'notifWeekly',
        label: tr('Neural Briefings'),
        sub: tr('Receive AI-synthesized cluster reports every 7 days.'),
        icon: BrainCircuit,
        color: 'text-amber-500 bg-amber-50',
        enabled: preferences.notifWeekly,
      },
    ],
    [
      preferences.notifEmail,
      preferences.notifSlack,
      preferences.notifWeekly,
      tr,
    ],
  )

  const handleVerify = () => {
    setIsVerifying(true)
    setTimeout(() => {
      setIsVerifying(false)
      onShowToast(tr('Verification secure link dispatched.'), 'info')
    }, 1500)
  }

  const handleNeuralAudit = async () => {
    setIsAuditing(true)
    setAuditReport(null)
    try {
      const teamData = JSON.stringify(
        teamMembers.map((member) => ({
          role: member.role,
          status: member.status,
        })),
      )
      const result = await performGovernanceAudit(
        teamData,
        preferences.secure2FA,
        preferences.workspaceName,
      )
      setAuditReport(result)
      onShowToast(tr('Governance Audit complete.'), 'success')
    } catch {
      onShowToast(tr('Neural Audit handshake failed.'), 'error')
    } finally {
      setIsAuditing(false)
    }
  }

  const handleInvite = (event: React.FormEvent) => {
    event.preventDefault()
    if (!inviteEmail) return
    onAddTeamMember({
      id: createId('tm'),
      name: inviteEmail.split('@')[0],
      email: inviteEmail,
      role: 'Viewer',
      status: 'Pending',
      img: null,
    })
    setInviteEmail('')
    onShowToast(`Invite broadcasted to ${inviteEmail}`, 'success')
  }

  const handleToggleRoutingPreference = useCallback(
    (key: RoutingPreferenceKey) => {
      onUpdatePreferences({ [key]: !preferences[key] })
    },
    [onUpdatePreferences, preferences],
  )

  const handleCopyApiKey = useCallback(() => {
    navigator.clipboard.writeText(apiKey)
    onShowToast(tr('Key copied.'), 'info')
  }, [apiKey, onShowToast, tr])

  const NavButton = ({
    id,
    label,
    icon,
  }: {
    id: SettingsTab
    label: string
    icon: LucideIcon
  }) => {
    const NavIcon = icon

    return (
      <TabsTrigger
        value={id}
        className="w-full justify-start rounded-[1.5rem] border border-transparent px-8 py-5 text-left text-[10px] font-black uppercase tracking-widest text-secondary transition-all data-[state=active]:border-primary/10 data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-soft"
      >
        <NavIcon className="text-[24px]" />
        {label}
      </TabsTrigger>
    )
  }

  return (
    <div className="space-y-10 animate-fade-in flex flex-col h-full pb-16">
      <div className="flex flex-col gap-2">
        <h2 className="text-4xl font-black text-text-main tracking-tighter uppercase">
          {tr('Governance Center')}
        </h2>
        <p className="text-secondary text-sm font-medium">
          {tr(
            'Manage workspace identities, security vaults, and team collaboration.',
          )}
        </p>
      </div>

      <Tabs
        value={activeTab}
        onValueChange={(value) => setActiveTab(value as SettingsTab)}
        className="flex flex-1 min-h-0 flex-col gap-12 lg:flex-row lg:items-start"
      >
        <div className="w-full shrink-0 lg:w-80">
          <TabsList className="h-auto w-full flex-col items-stretch gap-3 bg-transparent p-0">
            <NavButton
              id="workspace"
              label={tr('Workspace Meta')}
              icon={SlidersHorizontal}
            />
            <NavButton id="team" label={tr('Team Access')} icon={Users} />
            <NavButton id="routing" label={tr('Alert Delivery')} icon={Bell} />
            <NavButton id="vault" label={tr('Security Vault')} icon={Shield} />
          </TabsList>

          <div className="mt-10 p-10 bg-primary/5 rounded-[2.5rem] border border-primary/10 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:scale-110 transition-transform">
              <ShieldCheck className="text-6xl text-primary" />
            </div>
            <p className="text-[10px] font-black text-primary uppercase tracking-[0.3em] mb-4">
              {tr('Compliance Rating')}
            </p>
            <div className="flex items-center gap-4">
              <span className="text-3xl font-black text-primary">A+</span>
              <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden shadow-inner">
                <div
                  className="h-full bg-primary shadow-lg shadow-primary/30"
                  style={{ width: '94%' }}
                ></div>
              </div>
            </div>
            <Button
              onClick={handleNeuralAudit}
              disabled={isAuditing}
              className="mt-8 w-full py-4 bg-white border border-primary/10 rounded-2xl text-[9px] font-black uppercase tracking-widest text-primary hover:bg-primary hover:text-white transition-all shadow-soft flex items-center justify-center gap-3"
            >
              <Sparkles
                className={`text-[18px] ${isAuditing ? 'animate-spin' : ''}`}
              />
              {isAuditing ? tr('Auditing...') : tr('Neural Scan')}
            </Button>
          </div>
        </div>

        <div className="flex-1 bg-white rounded-[3rem] border border-border shadow-soft p-12 w-full h-full overflow-y-auto custom-scrollbar">
          {auditReport && (
            <div className="mb-12 p-10 bg-[#0F172A] text-white rounded-[2.5rem] shadow-2xl border border-white/5 animate-fade-in-up relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-10 opacity-5 pointer-events-none group-hover:scale-110 transition-transform">
                <BrainCircuit className="text-[120px] text-white" />
              </div>
              <div className="flex items-center justify-between mb-8 relative z-10">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-indigo-500 rounded-xl flex items-center justify-center text-white">
                    <ShieldCheck />
                  </div>
                  <h4 className="text-[11px] font-black uppercase tracking-[0.3em] text-indigo-300">
                    {tr('Neural Governance Audit')}
                  </h4>
                </div>
                <Button
                  onClick={() => setAuditReport(null)}
                  className="text-white/40 hover:text-white transition-colors"
                >
                  <X />
                </Button>
              </div>
              <div className="text-[13px] leading-loose text-indigo-50/80 font-medium whitespace-pre-wrap relative z-10">
                {auditReport}
              </div>
            </div>
          )}

          <TabsContent value="workspace" className="mt-0">
            <div className="space-y-14 max-w-4xl animate-fade-in">
              <div>
                <h3 className="text-3xl font-black text-text-main tracking-tighter uppercase">
                  {tr('Global Parameters')}
                </h3>
                <p className="text-secondary text-sm font-medium mt-1">
                  {tr(
                    'Identification and support configuration for the Sentinel instance.',
                  )}
                </p>
              </div>
              <div className="space-y-12">
                <div className="space-y-4">
                  <Label className="block text-[11px] font-black text-secondary uppercase tracking-[0.3em] ml-1">
                    {tr('Workspace Alias')}
                  </Label>
                  <Input
                    type="text"
                    value={preferences.workspaceName}
                    onChange={(e) =>
                      onUpdatePreferences({ workspaceName: e.target.value })
                    }
                    className="w-full px-8 py-5 rounded-[1.75rem] bg-gray-50 border border-border outline-none focus:ring-8 focus:ring-primary/5 focus:bg-white transition-all text-base font-bold text-text-main placeholder:text-gray-300"
                  />
                </div>
                <div className="space-y-4">
                  <Label className="block text-[11px] font-black text-secondary uppercase tracking-[0.3em] ml-1">
                    {tr('Support Endpoint')}
                  </Label>
                  <div className="flex flex-col md:flex-row gap-5">
                    <Input
                      type="email"
                      value={preferences.supportEmail}
                      onChange={(e) =>
                        onUpdatePreferences({ supportEmail: e.target.value })
                      }
                      className="flex-1 px-8 py-5 rounded-[1.75rem] bg-gray-50 border border-border outline-none focus:ring-8 focus:ring-primary/5 focus:bg-white transition-all text-base font-bold text-text-main placeholder:text-gray-300"
                    />
                    <Button
                      onClick={handleVerify}
                      disabled={isVerifying}
                      className="px-10 py-5 bg-white border border-border rounded-[1.75rem] text-[11px] font-black uppercase tracking-widest hover:bg-gray-50 shadow-soft transition-all disabled:opacity-50"
                    >
                      {isVerifying ? tr('Verifying...') : tr('Verify Protocol')}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="routing" className="mt-0">
            <div className="space-y-14 max-w-4xl animate-fade-in">
              <div>
                <h3 className="text-3xl font-black text-text-main tracking-tighter uppercase">
                  {tr('Dispatch Logic')}
                </h3>
                <p className="text-secondary text-sm font-medium mt-1">
                  {tr(
                    'Automated alert routing and high-fidelity reporting protocols.',
                  )}
                </p>
              </div>
              <div className="grid grid-cols-1 gap-6">
                {routingRoutes.map((route) => (
                  <div
                    key={route.key}
                    className="flex items-center justify-between p-10 bg-gray-50/50 rounded-[2.5rem] border border-border hover:bg-white hover:shadow-soft transition-all group"
                  >
                    <div className="flex items-center gap-8">
                      <div
                        className={`w-16 h-16 rounded-[1.5rem] flex items-center justify-center ${route.color} transition-transform group-hover:scale-110 shadow-sm`}
                      >
                        {(() => {
                          const RouteIcon = route.icon
                          return <RouteIcon className="text-[32px]" />
                        })()}
                      </div>
                      <div>
                        <h4 className="text-base font-black uppercase tracking-tight text-text-main">
                          {route.label}
                        </h4>
                        <p className="text-sm text-secondary font-medium mt-1 leading-relaxed">
                          {route.sub}
                        </p>
                      </div>
                    </div>
                    <Toggle
                      checked={route.enabled}
                      onChange={() => handleToggleRoutingPreference(route.key)}
                    />
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="vault" className="mt-0">
            <div className="space-y-14 max-w-4xl animate-fade-in">
              <div>
                <h3 className="text-3xl font-black text-text-main tracking-tighter uppercase">
                  {tr('Security Perimeter')}
                </h3>
                <p className="text-secondary text-sm font-medium mt-1">
                  {tr('Governance policies and infrastructure access keys.')}
                </p>
              </div>
              <div className="space-y-14">
                <div className="flex items-center justify-between p-10 bg-gray-50/50 rounded-[2.5rem] border border-border hover:bg-white hover:shadow-soft transition-all group">
                  <div className="flex items-center gap-8">
                    <div className="w-16 h-16 rounded-[1.5rem] flex items-center justify-center bg-red-50 text-danger transition-transform group-hover:scale-110 shadow-sm">
                      <KeyRound className="text-[32px]" />
                    </div>
                    <div>
                      <h4 className="text-base font-black uppercase tracking-tight text-text-main">
                        {tr('MFA Enforcement')}
                      </h4>
                      <p className="text-sm text-secondary font-medium mt-1 leading-relaxed">
                        {tr(
                          'Require biometric or token-based authentication for all principals.',
                        )}
                      </p>
                    </div>
                  </div>
                  <Toggle
                    checked={preferences.secure2FA}
                    onChange={() =>
                      onUpdatePreferences({ secure2FA: !preferences.secure2FA })
                    }
                  />
                </div>

                <div className="space-y-6">
                  <Label className="block text-[11px] font-black text-secondary uppercase tracking-[0.3em] ml-1">
                    {tr('Access Credentials')}
                  </Label>
                  <div className="flex items-center gap-6 p-10 bg-[#0F172A] rounded-[3rem] border border-white/5 shadow-2xl group overflow-hidden relative">
                    <div className="absolute top-0 right-0 p-10 opacity-5 group-hover:scale-110 transition-transform">
                      <Lock className="text-8xl text-white" />
                    </div>
                    <span className="text-sm font-mono text-indigo-300 truncate flex-1 tracking-tighter z-10">
                      {apiKey}
                    </span>
                    <Button
                      onClick={handleCopyApiKey}
                      className="p-4 text-gray-500 hover:text-white transition-all bg-white/5 rounded-2xl z-10 shadow-inner"
                    >
                      <Copy className="text-[24px]" />
                    </Button>
                  </div>
                  <Button
                    onClick={() => onRegenerateKey()}
                    className="flex items-center gap-4 px-8 py-4 bg-red-50 text-danger border border-red-100 rounded-2xl text-[11px] font-black uppercase tracking-widest hover:bg-danger hover:text-white transition-all shadow-sm"
                  >
                    <RefreshCw className="text-[20px]" />
                    {tr('Rotate Sentinel Key')}
                  </Button>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="team" className="mt-0">
            <div className="space-y-14 animate-fade-in">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-10">
                <div>
                  <h3 className="text-3xl font-black text-text-main tracking-tighter uppercase">
                    {tr('Principal Access')}
                  </h3>
                  <p className="text-secondary text-sm font-medium mt-1">
                    {tr('Assign roles and manage team identities.')}
                  </p>
                </div>
                <form
                  onSubmit={handleInvite}
                  className="flex gap-4 w-full md:w-auto"
                >
                  <Input
                    type="email"
                    placeholder={tr('principal@oxmon.io')}
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    className="flex-1 md:w-72 px-6 py-4 border border-border rounded-[1.5rem] text-base font-bold outline-none focus:ring-8 focus:ring-primary/5 bg-gray-50 focus:bg-white transition-all placeholder:text-gray-300"
                  />
                  <Button
                    type="submit"
                    className="bg-primary text-white px-10 py-4 rounded-[1.5rem] font-black text-[11px] uppercase tracking-widest shadow-2xl shadow-primary/30 transition-all hover:bg-primary-hover active:scale-95"
                  >
                    {tr('Invite')}
                  </Button>
                </form>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {teamMembers.map((member) => (
                  <div
                    key={member.id}
                    className="flex items-center justify-between p-8 bg-white border border-border rounded-[3rem] shadow-soft group hover:border-primary/10 transition-all"
                  >
                    <div className="flex items-center gap-6">
                      <div className="w-16 h-16 rounded-[1.5rem] bg-gray-50 overflow-hidden border border-border shadow-inner transition-transform group-hover:scale-105">
                        {member.img ? (
                          <img
                            src={member.img}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-secondary">
                            <User className="text-[32px]" />
                          </div>
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="text-base font-black text-text-main truncate uppercase tracking-tighter leading-none">
                          {member.name}
                        </p>
                        <p className="text-[10px] text-secondary font-bold truncate tracking-widest uppercase mt-2 opacity-60">
                          {member.email}
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-3">
                      <span
                        className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest border shadow-sm ${member.role === 'Owner' ? 'bg-indigo-50 text-primary border-indigo-100' : 'bg-gray-50 text-secondary border-gray-100'}`}
                      >
                        {tr(member.role)}
                      </span>
                      {member.role !== 'Owner' && (
                        <Button
                          onClick={() => onRemoveTeamMember(member.id)}
                          className="p-2 text-secondary hover:text-danger hover:bg-red-50 rounded-xl transition-all opacity-0 group-hover:opacity-100"
                        >
                          <X className="text-[20px]" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>
        </div>
      </Tabs>
    </div>
  )
}

export default Settings
