'use client'

import React, { useState } from 'react';
import { TeamMember, AppPreferences } from '@/lib/types';
import { performGovernanceAudit } from '@/actions/ai';

type SettingsTab = 'workspace' | 'team' | 'routing' | 'vault';

interface SettingsProps {
    teamMembers: TeamMember[];
    preferences: AppPreferences;
    onAddTeamMember: (member: TeamMember) => void;
    onRemoveTeamMember: (id: string) => void;
    onUpdateTeamMemberRole: (id: string, newRole: TeamMember['role']) => void;
    onUpdatePreferences: (prefs: Partial<AppPreferences>) => void;
    onShowToast: (message: string, type: 'success' | 'error' | 'info') => void;
    apiKey: string;
    onRegenerateKey: () => void;
}

const Toggle: React.FC<{ checked: boolean; onChange: () => void }> = ({ checked, onChange }) => (
  <button onClick={onChange} className={`relative inline-flex h-8 w-14 items-center rounded-full transition-all duration-300 ${checked ? 'bg-primary shadow-lg shadow-primary/30' : 'bg-gray-200'}`}>
    <span className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform duration-300 ${checked ? 'translate-x-7 shadow-md' : 'translate-x-1'}`} />
  </button>
);

const Settings: React.FC<SettingsProps> = ({
    teamMembers, preferences, onAddTeamMember, onRemoveTeamMember, onUpdateTeamMemberRole, onUpdatePreferences, onShowToast, apiKey, onRegenerateKey
}) => {
  const [activeTab, setActiveTab] = useState<SettingsTab>('workspace');
  const [isVerifying, setIsVerifying] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [isAuditing, setIsAuditing] = useState(false);
  const [auditReport, setAuditReport] = useState<string | null>(null);

  const handleVerify = () => {
    setIsVerifying(true);
    setTimeout(() => {
        setIsVerifying(false);
        onShowToast('Verification secure link dispatched.', 'info');
    }, 1500);
  };

  const handleNeuralAudit = async () => {
    setIsAuditing(true);
    setAuditReport(null);
    try {
      const teamData = JSON.stringify(teamMembers.map(m => ({ role: m.role, status: m.status })));
      const result = await performGovernanceAudit(teamData, preferences.secure2FA, preferences.workspaceName);
      setAuditReport(result);
      onShowToast('Governance Audit complete.', 'success');
    } catch (err) { onShowToast('Neural Audit handshake failed.', 'error'); } finally { setIsAuditing(false); }
  };

  const handleInvite = (e: React.FormEvent) => {
      e.preventDefault();
      if (!inviteEmail) return;
      onAddTeamMember({
          id: 'tm_' + Math.random().toString(36).substr(2, 9),
          name: inviteEmail.split('@')[0],
          email: inviteEmail,
          role: 'Viewer',
          status: 'Pending',
          img: null
      });
      setInviteEmail('');
      onShowToast(`Invite broadcasted to ${inviteEmail}`, 'success');
  };

  const NavButton = ({ id, label, icon }: { id: SettingsTab; label: string; icon: string }) => (
    <button onClick={() => setActiveTab(id)} className={`w-full text-left px-8 py-5 rounded-[1.5rem] text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-5 border ${activeTab === id ? 'bg-white shadow-soft text-primary border-primary/10' : 'text-secondary border-transparent hover:bg-gray-50'}`}>
      <span className={`material-symbols-outlined text-[24px] ${activeTab === id ? 'filled' : ''}`}>{icon}</span>
      {label}
    </button>
  );

  return (
    <div className="space-y-10 animate-fade-in flex flex-col h-full pb-16">
      <div className="flex flex-col gap-2">
        <h2 className="text-4xl font-black text-text-main tracking-tighter uppercase">Governance Center</h2>
        <p className="text-secondary text-sm font-medium">Manage workspace identities, security vaults, and team collaboration.</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-12 items-start flex-1 min-h-0">
         <div className="w-full lg:w-80 shrink-0 space-y-3">
            <NavButton id="workspace" label="Workspace Meta" icon="tune" />
            <NavButton id="team" label="Team Access" icon="group" />
            <NavButton id="routing" label="Alert Delivery" icon="notifications" />
            <NavButton id="vault" label="Security Vault" icon="security" />

            <div className="mt-10 p-10 bg-primary/5 rounded-[2.5rem] border border-primary/10 relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:scale-110 transition-transform"><span className="material-symbols-outlined text-6xl text-primary">policy</span></div>
                <p className="text-[10px] font-black text-primary uppercase tracking-[0.3em] mb-4">Compliance Rating</p>
                <div className="flex items-center gap-4">
                    <span className="text-3xl font-black text-primary">A+</span>
                    <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden shadow-inner">
                        <div className="h-full bg-primary shadow-lg shadow-primary/30" style={{ width: '94%' }}></div>
                    </div>
                </div>
                <button onClick={handleNeuralAudit} disabled={isAuditing} className="mt-8 w-full py-4 bg-white border border-primary/10 rounded-2xl text-[9px] font-black uppercase tracking-widest text-primary hover:bg-primary hover:text-white transition-all shadow-soft flex items-center justify-center gap-3">
                    <span className={`material-symbols-outlined text-[18px] ${isAuditing ? 'animate-spin' : ''}`}>auto_awesome</span>
                    {isAuditing ? 'Auditing...' : 'Neural Scan'}
                </button>
            </div>
         </div>

         <div className="flex-1 bg-white rounded-[3rem] border border-border shadow-soft p-12 w-full h-full overflow-y-auto custom-scrollbar">
            {auditReport && (
                <div className="mb-12 p-10 bg-[#0F172A] text-white rounded-[2.5rem] shadow-2xl border border-white/5 animate-fade-in-up relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-10 opacity-5 pointer-events-none group-hover:scale-110 transition-transform"><span className="material-symbols-outlined text-[120px] text-white">neurology</span></div>
                    <div className="flex items-center justify-between mb-8 relative z-10">
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 bg-indigo-500 rounded-xl flex items-center justify-center text-white"><span className="material-symbols-outlined filled">verified_user</span></div>
                            <h4 className="text-[11px] font-black uppercase tracking-[0.3em] text-indigo-300">Neural Governance Audit</h4>
                        </div>
                        <button onClick={() => setAuditReport(null)} className="text-white/40 hover:text-white transition-colors"><span className="material-symbols-outlined">close</span></button>
                    </div>
                    <div className="text-[13px] leading-loose text-indigo-50/80 font-medium whitespace-pre-wrap relative z-10">{auditReport}</div>
                </div>
            )}

            {activeTab === 'workspace' && (
              <div className="space-y-14 max-w-4xl animate-fade-in">
                <div>
                    <h3 className="text-3xl font-black text-text-main tracking-tighter uppercase">Global Parameters</h3>
                    <p className="text-secondary text-sm font-medium mt-1">Identification and support configuration for the Sentinel instance.</p>
                </div>
                <div className="space-y-12">
                  <div className="space-y-4">
                    <label className="block text-[11px] font-black text-secondary uppercase tracking-[0.3em] ml-1">Workspace Alias</label>
                    <input type="text" value={preferences.workspaceName} onChange={(e) => onUpdatePreferences({ workspaceName: e.target.value })} className="w-full px-8 py-5 rounded-[1.75rem] bg-gray-50 border border-border outline-none focus:ring-8 focus:ring-primary/5 focus:bg-white transition-all text-base font-bold text-text-main placeholder:text-gray-300" />
                  </div>
                  <div className="space-y-4">
                    <label className="block text-[11px] font-black text-secondary uppercase tracking-[0.3em] ml-1">Support Endpoint</label>
                    <div className="flex flex-col md:flex-row gap-5">
                      <input type="email" value={preferences.supportEmail} onChange={(e) => onUpdatePreferences({ supportEmail: e.target.value })} className="flex-1 px-8 py-5 rounded-[1.75rem] bg-gray-50 border border-border outline-none focus:ring-8 focus:ring-primary/5 focus:bg-white transition-all text-base font-bold text-text-main placeholder:text-gray-300" />
                      <button onClick={handleVerify} disabled={isVerifying} className="px-10 py-5 bg-white border border-border rounded-[1.75rem] text-[11px] font-black uppercase tracking-widest hover:bg-gray-50 shadow-soft transition-all disabled:opacity-50">
                        {isVerifying ? 'Verifying...' : 'Verify Protocol'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'routing' && (
              <div className="space-y-14 max-w-4xl animate-fade-in">
                <div>
                    <h3 className="text-3xl font-black text-text-main tracking-tighter uppercase">Dispatch Logic</h3>
                    <p className="text-secondary text-sm font-medium mt-1">Automated alert routing and high-fidelity reporting protocols.</p>
                </div>
                <div className="grid grid-cols-1 gap-6">
                    {[
                        { key: 'notifEmail', label: 'SMTP Relay', sub: 'Instant alert propagation via verified email infrastructure.', icon: 'alternate_email', color: 'text-primary bg-primary/5' },
                        { key: 'notifSlack', label: 'Webhooks', sub: 'Broadcast critical telemetry to integrated Slack channels.', icon: 'hub', color: 'text-indigo-500 bg-indigo-50' },
                        { key: 'notifWeekly', label: 'Neural Briefings', sub: 'Receive AI-synthesized cluster reports every 7 days.', icon: 'neurology', color: 'text-amber-500 bg-amber-50' }
                    ].map(route => (
                        <div key={route.key} className="flex items-center justify-between p-10 bg-gray-50/50 rounded-[2.5rem] border border-border hover:bg-white hover:shadow-soft transition-all group">
                            <div className="flex items-center gap-8">
                              <div className={`w-16 h-16 rounded-[1.5rem] flex items-center justify-center ${route.color} transition-transform group-hover:scale-110 shadow-sm`}><span className="material-symbols-outlined text-[32px]">{route.icon}</span></div>
                              <div><h4 className="text-base font-black uppercase tracking-tight text-text-main">{route.label}</h4><p className="text-sm text-secondary font-medium mt-1 leading-relaxed">{route.sub}</p></div>
                            </div>
                            <Toggle checked={(preferences as any)[route.key]} onChange={() => onUpdatePreferences({ [route.key]: !(preferences as any)[route.key] })} />
                        </div>
                    ))}
                </div>
              </div>
            )}

            {activeTab === 'vault' && (
              <div className="space-y-14 max-w-4xl animate-fade-in">
                 <div>
                    <h3 className="text-3xl font-black text-text-main tracking-tighter uppercase">Security Perimeter</h3>
                    <p className="text-secondary text-sm font-medium mt-1">Governance policies and infrastructure access keys.</p>
                </div>
                 <div className="space-y-14">
                    <div className="flex items-center justify-between p-10 bg-gray-50/50 rounded-[2.5rem] border border-border hover:bg-white hover:shadow-soft transition-all group">
                      <div className="flex items-center gap-8">
                        <div className="w-16 h-16 rounded-[1.5rem] flex items-center justify-center bg-red-50 text-danger transition-transform group-hover:scale-110 shadow-sm"><span className="material-symbols-outlined filled text-[32px]">key</span></div>
                        <div><h4 className="text-base font-black uppercase tracking-tight text-text-main">MFA Enforcement</h4><p className="text-sm text-secondary font-medium mt-1 leading-relaxed">Require biometric or token-based authentication for all principals.</p></div>
                      </div>
                      <Toggle checked={preferences.secure2FA} onChange={() => onUpdatePreferences({ secure2FA: !preferences.secure2FA })} />
                    </div>

                    <div className="space-y-6">
                       <label className="block text-[11px] font-black text-secondary uppercase tracking-[0.3em] ml-1">Access Credentials</label>
                       <div className="flex items-center gap-6 p-10 bg-[#0F172A] rounded-[3rem] border border-white/5 shadow-2xl group overflow-hidden relative">
                          <div className="absolute top-0 right-0 p-10 opacity-5 group-hover:scale-110 transition-transform"><span className="material-symbols-outlined text-8xl text-white">lock</span></div>
                          <span className="text-sm font-mono text-indigo-300 truncate flex-1 tracking-tighter z-10">{apiKey}</span>
                          <button onClick={() => { navigator.clipboard.writeText(apiKey); onShowToast('Key copied.', 'info'); }} className="p-4 text-gray-500 hover:text-white transition-all bg-white/5 rounded-2xl z-10 shadow-inner"><span className="material-symbols-outlined text-[24px]">content_copy</span></button>
                       </div>
                       <button onClick={() => onRegenerateKey()} className="flex items-center gap-4 px-8 py-4 bg-red-50 text-danger border border-red-100 rounded-2xl text-[11px] font-black uppercase tracking-widest hover:bg-danger hover:text-white transition-all shadow-sm">
                        <span className="material-symbols-outlined text-[20px]">cached</span>
                        Rotate Sentinel Key
                       </button>
                    </div>
                 </div>
              </div>
            )}

            {activeTab === 'team' && (
              <div className="space-y-14 animate-fade-in">
                 <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-10">
                    <div>
                        <h3 className="text-3xl font-black text-text-main tracking-tighter uppercase">Principal Access</h3>
                        <p className="text-secondary text-sm font-medium mt-1">Assign roles and manage team identities.</p>
                    </div>
                    <form onSubmit={handleInvite} className="flex gap-4 w-full md:w-auto">
                        <input type="email" placeholder="principal@oxmon.io" value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} className="flex-1 md:w-72 px-6 py-4 border border-border rounded-[1.5rem] text-base font-bold outline-none focus:ring-8 focus:ring-primary/5 bg-gray-50 focus:bg-white transition-all placeholder:text-gray-300" />
                        <button type="submit" className="bg-primary text-white px-10 py-4 rounded-[1.5rem] font-black text-[11px] uppercase tracking-widest shadow-2xl shadow-primary/30 transition-all hover:bg-primary-hover active:scale-95">Invite</button>
                    </form>
                 </div>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {teamMembers.map(member => (
                        <div key={member.id} className="flex items-center justify-between p-8 bg-white border border-border rounded-[3rem] shadow-soft group hover:border-primary/10 transition-all">
                            <div className="flex items-center gap-6">
                                <div className="w-16 h-16 rounded-[1.5rem] bg-gray-50 overflow-hidden border border-border shadow-inner transition-transform group-hover:scale-105">
                                    {member.img ? <img src={member.img} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-secondary"><span className="material-symbols-outlined text-[32px]">person</span></div>}
                                </div>
                                <div className="min-w-0">
                                    <p className="text-base font-black text-text-main truncate uppercase tracking-tighter leading-none">{member.name}</p>
                                    <p className="text-[10px] text-secondary font-bold truncate tracking-widest uppercase mt-2 opacity-60">{member.email}</p>
                                </div>
                            </div>
                            <div className="flex flex-col items-end gap-3">
                                <span className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest border shadow-sm ${member.role === 'Owner' ? 'bg-indigo-50 text-primary border-indigo-100' : 'bg-gray-50 text-secondary border-gray-100'}`}>{member.role}</span>
                                {member.role !== 'Owner' && <button onClick={() => onRemoveTeamMember(member.id)} className="p-2 text-secondary hover:text-danger hover:bg-red-50 rounded-xl transition-all opacity-0 group-hover:opacity-100"><span className="material-symbols-outlined text-[20px]">close</span></button>}
                            </div>
                        </div>
                    ))}
                 </div>
              </div>
            )}
         </div>
      </div>
    </div>
  );
};

export default Settings;
