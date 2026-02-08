
import React, { useState, useRef, useEffect } from 'react';
import Sidebar from './Sidebar';
import Dashboard from './Dashboard';
import Agents from './Agents';
import Certificates from './Certificates';
import Settings from './Settings';
import Alerts from './Alerts';
import Logs from './Logs';
import Infrastructure from './Infrastructure';
import ConfigForge from './ConfigForge';
import HelpCenter from './HelpCenter';
import Login from './Login';
import Toast, { ToastMessage } from './Toast';
import LiveAssistant from './LiveAssistant';
import { ViewState, Agent, Certificate, Alert, TeamMember, AppPreferences, LogEntry } from '../types';
import { MOCK_AGENTS, MOCK_CERTS, MOCK_ALERTS, MOCK_TEAM, DEFAULT_PREFERENCES } from '../constants';
import { GoogleGenAI, Type } from "@google/genai";

const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentView, setCurrentView] = useState<ViewState>('dashboard');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [isAssistantOpen, setIsAssistantOpen] = useState(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [commandInput, setCommandInput] = useState('');
  const [isCommandExecuting, setIsCommandExecuting] = useState(false);
  
  const [aiSummary, setAiSummary] = useState<string>('');
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [logAnalysis, setLogAnalysis] = useState<string | null>(null);
  const [isLogAnalyzing, setIsLogAnalyzing] = useState(false);
  const [predictiveData, setPredictiveData] = useState<string | null>(null);
  const [terminalInjection, setTerminalInjection] = useState<{ agent: Agent, command: string } | null>(null);

  const [agents, setAgents] = useState<Agent[]>(() => {
    const saved = localStorage.getItem('ox_agents');
    return saved ? JSON.parse(saved) : MOCK_AGENTS;
  });
  const [certificates, setCertificates] = useState<Certificate[]>(() => {
    const saved = localStorage.getItem('ox_certs');
    return saved ? JSON.parse(saved) : MOCK_CERTS;
  });
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>(() => {
    const saved = localStorage.getItem('ox_team');
    return saved ? JSON.parse(saved) : MOCK_TEAM;
  });
  const [preferences, setPreferences] = useState<AppPreferences>(() => {
    const saved = localStorage.getItem('ox_prefs');
    return saved ? JSON.parse(saved) : DEFAULT_PREFERENCES;
  });
  const [alerts, setAlerts] = useState<Alert[]>(() => {
    const saved = localStorage.getItem('ox_alerts');
    return saved ? JSON.parse(saved) : MOCK_ALERTS;
  });
  
  const [apiKey, setApiKey] = useState('ox_live_' + Math.random().toString(36).substr(2, 24));
  const [logs, setLogs] = useState<LogEntry[]>(() => [
    { id: '1', timestamp: new Date().toISOString().replace('T', ' ').substr(0, 19), level: 'info', category: 'system', message: 'Admin dashboard initialized.' },
    { id: '2', timestamp: new Date().toISOString().replace('T', ' ').substr(0, 19), level: 'info', category: 'auth', message: 'Login successful for master principal Alex Morgan.' },
    { id: '3', timestamp: new Date().toISOString().replace('T', ' ').substr(0, 19), level: 'warn', category: 'cert', message: 'SSL drift detected on dev.oxmon.internal.' }
  ]);

  useEffect(() => {
    localStorage.setItem('ox_agents', JSON.stringify(agents));
    localStorage.setItem('ox_certs', JSON.stringify(certificates));
    localStorage.setItem('ox_team', JSON.stringify(teamMembers));
    localStorage.setItem('ox_prefs', JSON.stringify(preferences));
    localStorage.setItem('ox_alerts', JSON.stringify(alerts));
  }, [agents, certificates, teamMembers, preferences, alerts]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsCommandPaletteOpen(true);
      }
      if (e.key === 'Escape') setIsCommandPaletteOpen(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const [searchTerm, setSearchTerm] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsSearchFocused(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const searchResults = searchTerm.trim() === '' ? [] : [
    ...agents.filter(a => a.name.toLowerCase().includes(searchTerm.toLowerCase()) || a.ip.includes(searchTerm)).map(a => ({ type: 'Agent', id: a.id, label: a.name, sub: a.ip })),
    ...certificates.filter(c => c.domain.toLowerCase().includes(searchTerm.toLowerCase())).map(c => ({ type: 'Certificate', id: c.id, label: c.domain, sub: c.issuer })),
    ...alerts.filter(a => a.message.toLowerCase().includes(searchTerm.toLowerCase()) || a.source.toLowerCase().includes(searchTerm.toLowerCase())).map(a => ({ type: 'Alert', id: a.id, label: a.source, sub: a.message }))
  ];

  const handleCommandSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commandInput.trim()) return;
    setIsCommandExecuting(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Interpret intent: "${commandInput}". Options: dashboard, agents, infrastructure, certificates, alerts, logs, tools, settings, help. Return JSON: { "action": "navigate", "target": "view_name", "message": "feedback" }`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              action: { type: Type.STRING },
              target: { type: Type.STRING },
              message: { type: Type.STRING }
            },
            required: ['action', 'target', 'message']
          }
        }
      });
      const result = JSON.parse(response.text || '{}');
      if (result.action === 'navigate') {
        setCurrentView(result.target as ViewState);
        showToast(result.message, 'info');
      }
      setIsCommandPaletteOpen(false);
      setCommandInput('');
    } catch (err) { showToast('Neural translation interrupted.', 'error'); } finally { setIsCommandExecuting(false); }
  };

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    const id = Math.random().toString(36).substr(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);
  };

  const removeToast = (id: string) => setToasts((prev) => prev.filter((t) => t.id !== id));

  const generateSystemSummary = async () => {
    setIsAiLoading(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const prompt = `Synthesize an infrastructure health audit. Agents: ${agents.length}, Critical Alerts: ${alerts.filter(a => a.severity === 'Critical').length}. High Latency: ${agents.some(a => (a.latency || 0) > 100)}. Provide 2 high-density sentences and a single technical directive.`;
      const response = await ai.models.generateContent({ model: 'gemini-3-flash-preview', contents: prompt });
      setAiSummary(response.text || 'Audit sync offline.');
    } catch (err) { showToast('Neural Audit failed.', 'error'); } finally { setIsAiLoading(false); }
  };

  const generateFullReport = async () => {
    showToast('Synthesizing comprehensive report...', 'info');
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const prompt = `Generate a high-fidelity Markdown report for Oxmon SRE team. Analyze: Agents(${agents.length}), Certs(${certificates.length}), Alerts(${alerts.length}). Include: Global Health Score, Systemic Risk Matrix, and remediation directives for Critical issues.`;
      const response = await ai.models.generateContent({ model: 'gemini-3-pro-preview', contents: prompt });
      const blob = new Blob([response.text || 'Payload empty.'], { type: 'text/markdown' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Oxmon_Audit_${new Date().toISOString().split('T')[0]}.md`;
      a.click();
      showToast('Neural Audit exported.', 'success');
    } catch (err) { showToast('Export failed.', 'error'); }
  };

  const handleUpdateAgentStatus = (id: string) => {
    setAgents(prev => prev.map(a => a.id === id ? { ...a, status: a.status === 'Online' ? 'Maintenance' : 'Online' } : a));
    showToast(`Node ${id} state rotated.`, 'info');
  };

  const handleAcknowledgeAlert = (id: string) => {
    setAlerts(prev => prev.map(a => a.id === id ? { ...a, severity: 'Resolved' } : a));
    showToast(`Incident ${id} neutralized.`, 'success');
  };

  const handleAnalyzeLogs = async () => {
      setIsLogAnalyzing(true);
      try {
          const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
          const recentLogs = logs.slice(0, 10).map(l => `[${l.level}] ${l.category}: ${l.message}`).join('\n');
          const response = await ai.models.generateContent({
              model: 'gemini-3-flash-preview',
              contents: `Act as a senior DevOps Observability expert. Analyze the following cluster telemetry and identify cross-correlation patterns, systemic bottlenecks, or security drift: \n${recentLogs}`
          });
          setLogAnalysis(response.text || 'Pattern correlation empty.');
      } catch (err) { showToast('Neural correlation failed.', 'error'); } finally { setIsLogAnalyzing(false); }
  };

  // Fix: Added missing generatePredictiveMaintenance function
  const generatePredictiveMaintenance = async () => {
    showToast('Executing neural cluster forecast...', 'info');
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const prompt = `Perform failure anticipation for this cluster: ${agents.map(a => `${a.name}(${a.ip})`).join(', ')}. Base it on simulated health trends. Identify high-risk nodes and provide remediation advice.`;
      const response = await ai.models.generateContent({ model: 'gemini-3-flash-preview', contents: prompt });
      setPredictiveData(response.text || 'No imminent risks identified.');
      showToast('Forecast synced.', 'success');
    } catch (err) { showToast('Predictive handshake failed.', 'error'); }
  };

  if (!isAuthenticated) return <Login onLogin={() => { setIsAuthenticated(true); showToast('Principal authenticated.', 'success'); }} />;

  const systemHealth = 100 - (alerts.filter(a => a.severity === 'Critical').length * 15) - (agents.filter(a => a.status === 'Offline').length * 5);

  return (
    <div className="flex h-screen w-full bg-[#FBFBFD] overflow-hidden text-[#1D1D1F] font-sans selection:bg-[#0071E3]/15">
      <Sidebar 
        currentView={currentView} 
        onChangeView={setCurrentView} 
        onLogout={() => { setIsAuthenticated(false); showToast('Session terminated.', 'info'); }} 
        isOpen={isMobileMenuOpen} 
        onClose={() => setIsMobileMenuOpen(false)} 
        onOpenAssistant={() => setIsAssistantOpen(true)} 
        stats={{ criticalAlerts: alerts.filter(a => a.severity === 'Critical').length, offlineAgents: agents.filter(a => a.status === 'Offline').length }} 
      />
      <main className="flex-1 flex flex-col h-full overflow-hidden relative">
        <header className="h-24 border-b border-[#E5E5EA] bg-white/70 backdrop-blur-3xl flex items-center justify-between px-12 shrink-0 z-10">
          <div className="flex items-center gap-10">
            <button onClick={() => setIsMobileMenuOpen(true)} className="lg:hidden text-[#1D1D1F] p-2 -ml-3 hover:bg-gray-100 rounded-2xl transition-all"><span className="material-symbols-outlined text-[28px]">menu</span></button>
            <div className="flex items-center gap-6 text-[11px] font-black uppercase tracking-[0.4em] text-[#86868B]">
              <div className="flex items-center gap-3 cursor-pointer group" onClick={() => setCurrentView('dashboard')}>
                 <span className="group-hover:text-primary transition-colors">Sentinel</span>
              </div>
              <span className="opacity-10">/</span>
              <span className="text-[#1D1D1F] tracking-[0.5em] font-black">{currentView}</span>
            </div>
            {/* Neural Heartbeat Pulse */}
            <div className="hidden md:flex items-center gap-4 px-6 py-2.5 bg-gray-50 border border-[#E5E5EA] rounded-full shadow-inner ml-6 group cursor-default">
                <div className={`w-2.5 h-2.5 rounded-full shadow-lg ${systemHealth > 90 ? 'bg-success shadow-success/40' : systemHealth > 70 ? 'bg-warning shadow-warning/40' : 'bg-danger shadow-danger/40'} animate-pulse`}></div>
                <span className="text-[10px] font-black uppercase tracking-[0.25em] text-[#86868B] group-hover:text-text-main transition-colors">Mesh Health: {systemHealth}%</span>
            </div>
          </div>

          <div className="flex items-center gap-8">
            <button onClick={() => setIsCommandPaletteOpen(true)} className="flex items-center gap-4 px-6 py-3 bg-[#F5F5F7] border border-[#E5E5EA] rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] text-[#86868B] hover:text-[#1D1D1F] hover:bg-white hover:shadow-soft transition-all group shadow-sm ring-offset-4 ring-offset-white focus:ring-4 focus:ring-primary/5 outline-none">
                <span className="material-symbols-outlined text-[22px] group-hover:text-primary transition-colors group-hover:scale-110 transition-transform">terminal</span>
                <span>Neural Cmd</span>
                <span className="bg-white border border-[#E5E5EA] rounded-xl px-2.5 py-1.5 opacity-50 ml-2 shadow-inner">⌘K</span>
            </button>
            <div className="relative" ref={searchRef}>
              <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-[#C1C1C1] text-[24px] group-focus-within:text-primary transition-colors">search</span>
              <input 
                type="text" 
                placeholder="Global Grep..." 
                value={searchTerm} 
                onChange={(e) => { setSearchTerm(e.target.value); setIsSearchFocused(true); }} 
                onFocus={() => setIsSearchFocused(true)} 
                className="pl-14 pr-8 py-3.5 bg-[#F5F5F7] border border-[#E5E5EA] rounded-[1.5rem] text-[12px] font-bold w-72 focus:ring-8 focus:ring-primary/5 focus:bg-white transition-all outline-none shadow-sm" 
              />
              {isSearchFocused && searchTerm && (
                 <div className="absolute top-full right-0 mt-4 w-[420px] bg-white rounded-[2.5rem] shadow-3xl border border-[#E5E5EA] overflow-hidden z-50 animate-fade-in-up ring-1 ring-black/5">
                    <div className="py-4">
                       {searchResults.length > 0 ? searchResults.map((result) => (
                             <button key={`${result.type}-${result.id}`} onClick={() => { setCurrentView(result.type === 'Agent' ? 'agents' : result.type === 'Certificate' ? 'certificates' : 'alerts'); setIsSearchFocused(false); setSearchTerm(''); }} className="w-full px-10 py-6 hover:bg-[#FBFBFD] flex items-center gap-6 text-left group transition-all border-b border-gray-50 last:border-0">
                                <div className="w-12 h-12 rounded-2xl bg-[#F5F5F7] flex items-center justify-center text-[#86868B] group-hover:bg-primary group-hover:text-white group-hover:scale-110 transition-all shadow-inner"><span className="material-symbols-outlined text-[24px]">{result.type === 'Agent' ? 'dns' : result.type === 'Certificate' ? 'verified_user' : 'notifications'}</span></div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-black uppercase tracking-tight truncate group-hover:text-primary transition-colors">{result.label}</p>
                                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-secondary mt-2 opacity-40">{result.type} • {result.sub}</p>
                                </div>
                                <span className="material-symbols-outlined text-gray-200 group-hover:text-primary transition-all opacity-0 group-hover:opacity-100">chevron_right</span>
                             </button>
                          )) : <div className="p-16 text-center text-[#86868B] text-[11px] font-black uppercase tracking-[0.5em] opacity-40">Zero Results Found.</div>}
                    </div>
                 </div>
              )}
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-12 custom-scrollbar bg-gradient-to-b from-white to-[#FBFBFD]">
          <div className="max-w-7xl mx-auto h-full">
            {currentView === 'dashboard' && <Dashboard onChangeView={setCurrentView} agents={agents} certificates={certificates} alerts={alerts} aiSummary={aiSummary} isAiLoading={isAiLoading} onGenerateAiSummary={generateSystemSummary} onGenerateFullReport={generateFullReport} predictiveData={predictiveData} onRunPredictiveScan={generatePredictiveMaintenance} />}
            {currentView === 'agents' && <Agents agents={agents} onAddAgent={(a) => setAgents(prev => [a, ...prev])} onDeleteAgent={(id) => setAgents(prev => prev.filter(a => a.id !== id))} onUpdateStatus={handleUpdateAgentStatus} onShowToast={showToast} initialInjection={terminalInjection} clearInjection={() => setTerminalInjection(null)} />}
            {currentView === 'infrastructure' && <Infrastructure agents={agents} onShowToast={showToast} />}
            {currentView === 'certificates' && <Certificates certificates={certificates} onAddCertificate={(c) => setCertificates(prev => [c, ...prev])} onDeleteCertificate={(id) => setCertificates(prev => prev.filter(c => c.id !== id))} onRenewCertificate={(id) => setCertificates(prev => prev.map(c => c.id === id ? { ...c, status: 'Valid', daysRemaining: 90, lastCheck: 'Just now' } : c))} onShowToast={showToast} />}
            {currentView === 'alerts' && <Alerts alerts={alerts} onAcknowledge={handleAcknowledgeAlert} onShowToast={showToast} onDiagnose={async (a) => `Neural Diagnosis for ${a.source}: Anomalous performance drift identified in DB-Cluster sequence. Directive: \`\`\`bash\nsudo systemctl restart ox-agent && ox-admin --clear-cache\n\`\`\``} onRunScript={(src, cmd) => { const a = agents.find(ag => ag.name === src); if(a) { setTerminalInjection({ agent: a, command: cmd }); setCurrentView('agents'); } }} />}
            {currentView === 'logs' && <Logs logs={logs} onAnalyze={handleAnalyzeLogs} logAnalysis={logAnalysis} isAnalyzing={isLogAnalyzing} onClear={() => setLogAnalysis(null)} />}
            {currentView === 'tools' && <ConfigForge onShowToast={showToast} />}
            {currentView === 'help' && <HelpCenter />}
            {currentView === 'settings' && (
              <Settings 
                teamMembers={teamMembers} 
                preferences={preferences} 
                onAddTeamMember={(m) => setTeamMembers(prev => [...prev, m])} 
                onRemoveTeamMember={(id) => setTeamMembers(prev => prev.filter(m => m.id !== id))} 
                onUpdateTeamMemberRole={(id, role) => setTeamMembers(prev => prev.map(m => m.id === id ? { ...m, role } : m))} 
                onUpdatePreferences={(p) => setPreferences(prev => ({ ...prev, ...p }))} 
                onShowToast={showToast} 
                apiKey={apiKey} 
                onRegenerateKey={() => setApiKey('ox_' + Math.random().toString(36).substr(2, 24))} 
              />
            )}
          </div>
        </div>
      </main>
      <LiveAssistant 
        isOpen={isAssistantOpen} 
        onClose={() => setIsAssistantOpen(false)} 
        agents={agents} 
        alerts={alerts} 
        certificates={certificates} 
        onUpdateAgentStatus={handleUpdateAgentStatus}
        onAcknowledgeAlert={handleAcknowledgeAlert}
      />
      {isCommandPaletteOpen && (
        <div className="fixed inset-0 z-[110] flex items-start justify-center pt-[18vh] px-8">
           <div className="absolute inset-0 bg-[#020617]/85 backdrop-blur-xl animate-fade-in" onClick={() => setIsCommandPaletteOpen(false)}></div>
           <div className="relative w-full max-w-3xl bg-white rounded-[3.5rem] shadow-3xl border border-[#E5E5EA] overflow-hidden animate-fade-in-up ring-1 ring-black/5">
              <form onSubmit={handleCommandSubmit} className="flex items-center p-14 border-b border-[#E5E5EA] bg-gradient-to-br from-white to-gray-50/50">
                  <div className="w-16 h-16 rounded-2xl bg-primary/5 flex items-center justify-center text-primary shadow-inner mr-10 group-hover:scale-110 transition-transform"><span className="material-symbols-outlined text-4xl filled">psychology</span></div>
                  <input autoFocus type="text" value={commandInput} onChange={(e) => setCommandInput(e.target.value)} placeholder="Neural Command Handshake..." className="flex-1 text-3xl font-black text-[#1D1D1F] outline-none bg-transparent placeholder:text-[#E5E5EA] tracking-tighter" disabled={isCommandExecuting} />
                  {isCommandExecuting && <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>}
              </form>
              <div className="p-12 bg-[#FBFBFD]/80">
                  <h4 className="text-[11px] font-black text-[#86868B] uppercase tracking-[0.5em] mb-10 opacity-60">Handshake Intent Suggestions</h4>
                  <div className="grid grid-cols-2 gap-6">
                      {["Show infrastructure nodes", "View incident center", "Analyze global audit stream", "Forge Nginx gateway", "Open security vault", "Help center search"].map((cmd) => (
                          <button key={cmd} onClick={() => setCommandInput(cmd)} className="text-left px-8 py-6 bg-white border border-[#E5E5EA] rounded-[1.75rem] text-[12px] font-black uppercase tracking-[0.15em] text-[#86868B] hover:text-primary hover:border-primary/20 hover:shadow-soft transition-all shadow-sm group ring-offset-4 ring-offset-white focus:ring-4 focus:ring-primary/5 outline-none">
                            <span className="group-hover:translate-x-2 transition-transform inline-block">{cmd}</span>
                          </button>
                      ))}
                  </div>
              </div>
           </div>
        </div>
      )}
      <Toast toasts={toasts} onRemove={removeToast} />
    </div>
  );
};

export default App;
