
import React, { useState, useRef, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import Agents from './components/Agents';
import Certificates from './components/Certificates';
import Settings from './components/Settings';
import Alerts from './components/Alerts';
import Logs from './components/Logs';
import Infrastructure from './components/Infrastructure';
import ConfigForge from './components/ConfigForge';
import HelpCenter from './components/HelpCenter';
import Login from './components/Login';
import Toast, { ToastMessage } from './components/Toast';
import LiveAssistant from './components/LiveAssistant';
import { ViewState, Agent, Certificate, Alert, TeamMember, AppPreferences, LogEntry } from './types';
import { MOCK_AGENTS, MOCK_CERTS, MOCK_ALERTS, MOCK_TEAM, DEFAULT_PREFERENCES } from './constants';
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
    { id: '2', timestamp: new Date().toISOString().replace('T', ' ').substr(0, 19), level: 'info', category: 'auth', message: 'Login successful for user Alex Morgan.' }
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
        contents: `Interpret intent: "${commandInput}". Options: dashboard, agents, infrastructure, certificates, alerts, logs, tools, settings. Return JSON: { "action": "navigate", "target": "view_name", "message": "feedback" }`,
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
    } catch (err) { showToast('Neural translation failed.', 'error'); } finally { setIsCommandExecuting(false); }
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
      const prompt = `Synthesize an infrastructure health audit. Agents: ${agents.length}, Critical Alerts: ${alerts.filter(a => a.severity === 'Critical').length}. Provide 2 high-density professional sentences and a single directive for the SRE team.`;
      const response = await ai.models.generateContent({ model: 'gemini-3-flash-preview', contents: prompt });
      setAiSummary(response.text || 'Summary generation offline.');
    } catch (err) { showToast('AI Audit failed.', 'error'); } finally { setIsAiLoading(false); }
  };

  const generateFullReport = async () => {
    showToast('Synthesizing comprehensive report...', 'info');
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const prompt = `Generate a high-fidelity Markdown report for Oxmon SRE team. Analyze: Agents(${agents.length}), Certs(${certificates.length}), Alerts(${alerts.length}). Include: Global Health Score, Risk Matrix, and Remediation Directives.`;
      const response = await ai.models.generateContent({ model: 'gemini-3-pro-preview', contents: prompt });
      const blob = new Blob([response.text || 'Report empty.'], { type: 'text/markdown' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Oxmon_SRE_Report_${new Date().toISOString().split('T')[0]}.md`;
      a.click();
      showToast('Report downloaded to local storage.', 'success');
    } catch (err) { showToast('Synthesis failed.', 'error'); }
  };

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

  const handleUpdateAgentStatus = (id: string) => {
    setAgents(prev => prev.map(a => a.id === id ? { ...a, status: a.status === 'Maintenance' ? 'Online' : 'Maintenance' } : a));
    showToast(`Agent ${id} status toggled via voice link.`, 'info');
  };

  const handleAcknowledgeAlert = (id: string) => {
    setAlerts(prev => prev.map(a => a.id === id ? { ...a, severity: 'Resolved' } : a));
    showToast(`Incident ${id} resolved via voice link.`, 'success');
  };

  if (!isAuthenticated) return <Login onLogin={() => { setIsAuthenticated(true); showToast('Admin authenticated.', 'success'); }} />;

  const systemHealth = 100 - (alerts.filter(a => a.severity === 'Critical').length * 15) - (agents.filter(a => a.status === 'Offline').length * 5);

  return (
    <div className="flex h-screen w-full bg-[#FBFBFD] overflow-hidden text-[#1D1D1F] font-sans selection:bg-[#0071E3]/10">
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
        <header className="h-20 border-b border-[#E5E5EA] bg-white/70 backdrop-blur-2xl flex items-center justify-between px-10 shrink-0 z-10">
          <div className="flex items-center gap-6">
            <button onClick={() => setIsMobileMenuOpen(true)} className="lg:hidden text-[#1D1D1F] p-1 -ml-2 hover:bg-gray-100 rounded-lg transition-colors"><span className="material-symbols-outlined">menu</span></button>
            <div className="flex items-center gap-4 text-[10px] font-black uppercase tracking-[0.25em] text-[#86868B]">
              <div className="flex items-center gap-2 cursor-pointer group" onClick={() => setCurrentView('dashboard')}>
                 <span className="group-hover:text-[#0071E3] transition-colors">Sentinel</span>
              </div>
              <span className="opacity-20">/</span>
              <span className="text-[#1D1D1F] tracking-[0.3em] font-black">{currentView}</span>
            </div>
            {/* Neural Pulse Indicator */}
            <div className="hidden md:flex items-center gap-3 px-4 py-2 bg-gray-50 border border-[#E5E5EA] rounded-full shadow-inner ml-4">
                <div className={`w-2 h-2 rounded-full shadow-lg ${systemHealth > 90 ? 'bg-[#34C759] shadow-[#34C759]/40' : systemHealth > 70 ? 'bg-[#FF9F0A] shadow-[#FF9F0A]/40' : 'bg-[#FF3B30] shadow-[#FF3B30]/40'} animate-pulse`}></div>
                <span className="text-[9px] font-black uppercase tracking-widest text-[#86868B]">Cluster Health: {systemHealth}%</span>
            </div>
          </div>

          <div className="flex items-center gap-6">
            <button onClick={() => setIsCommandPaletteOpen(true)} className="flex items-center gap-3 px-4 py-2.5 bg-[#F5F5F7] border border-[#E5E5EA] rounded-2xl text-[10px] font-black uppercase tracking-widest text-[#86868B] hover:text-[#1D1D1F] hover:bg-white hover:shadow-soft transition-all group shadow-sm">
                <span className="material-symbols-outlined text-[18px] group-hover:text-[#0071E3] transition-colors">terminal</span>
                <span>Command</span>
                <span className="bg-white border border-[#E5E5EA] rounded-lg px-2 py-1 opacity-50 ml-1">⌘K</span>
            </button>
            <div className="relative" ref={searchRef}>
              <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-[#C1C1C1] text-[20px]">search</span>
              <input 
                type="text" 
                placeholder="Global Grep..." 
                value={searchTerm} 
                onChange={(e) => { setSearchTerm(e.target.value); setIsSearchFocused(true); }} 
                onFocus={() => setIsSearchFocused(true)} 
                className="pl-12 pr-6 py-2.5 bg-[#F5F5F7] border border-[#E5E5EA] rounded-2xl text-[11px] font-bold w-64 focus:ring-4 focus:ring-[#0071E3]/5 focus:bg-white transition-all outline-none" 
              />
              {isSearchFocused && searchTerm && (
                 <div className="absolute top-full right-0 mt-3 w-96 bg-white rounded-[2rem] shadow-2xl border border-[#E5E5EA] overflow-hidden z-50 animate-fade-in-up">
                    <div className="py-2">
                       {searchResults.length > 0 ? searchResults.map((result) => (
                             <button key={`${result.type}-${result.id}`} onClick={() => { setCurrentView(result.type === 'Agent' ? 'agents' : result.type === 'Certificate' ? 'certificates' : 'alerts'); setIsSearchFocused(false); setSearchTerm(''); }} className="w-full px-8 py-4 hover:bg-[#F5F5F7] flex items-center gap-4 text-left group transition-colors">
                                <div className="w-10 h-10 rounded-xl bg-[#F5F5F7] flex items-center justify-center text-[#86868B] group-hover:bg-[#0071E3] group-hover:text-white transition-all"><span className="material-symbols-outlined text-[20px]">{result.type === 'Agent' ? 'dns' : result.type === 'Certificate' ? 'verified_user' : 'notifications'}</span></div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-xs font-black uppercase tracking-tight truncate">{result.label}</p>
                                  <p className="text-[9px] font-black uppercase tracking-widest text-[#86868B] mt-1 opacity-60">{result.type} • {result.sub}</p>
                                </div>
                             </button>
                          )) : <div className="p-12 text-center text-[#86868B] text-[10px] font-black uppercase tracking-widest opacity-40">No matching assets identified.</div>}
                    </div>
                 </div>
              )}
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-10 custom-scrollbar bg-gradient-to-b from-white to-[#FBFBFD]">
          <div className="max-w-7xl mx-auto h-full">
            {currentView === 'dashboard' && <Dashboard onChangeView={setCurrentView} agents={agents} certificates={certificates} alerts={alerts} aiSummary={aiSummary} isAiLoading={isAiLoading} onGenerateAiSummary={generateSystemSummary} onGenerateFullReport={generateFullReport} predictiveData={predictiveData} onRunPredictiveScan={generatePredictiveMaintenance} />}
            {currentView === 'agents' && <Agents agents={agents} onAddAgent={(a) => setAgents(prev => [a, ...prev])} onDeleteAgent={(id) => setAgents(prev => prev.filter(a => a.id !== id))} onUpdateStatus={handleUpdateAgentStatus} onShowToast={showToast} initialInjection={terminalInjection} clearInjection={() => setTerminalInjection(null)} />}
            {currentView === 'infrastructure' && <Infrastructure agents={agents} onShowToast={showToast} />}
            {currentView === 'certificates' && <Certificates certificates={certificates} onAddCertificate={(c) => setCertificates(prev => [c, ...prev])} onDeleteCertificate={(id) => setCertificates(prev => prev.filter(c => c.id !== id))} onRenewCertificate={(id) => setCertificates(prev => prev.map(c => c.id === id ? { ...c, status: 'Valid', daysRemaining: 90, lastCheck: 'Just now' } : c))} onShowToast={showToast} />}
            {currentView === 'alerts' && <Alerts alerts={alerts} onAcknowledge={handleAcknowledgeAlert} onShowToast={showToast} onDiagnose={async (a) => `Neural Diagnosis for ${a.source}: Anomalous performance pattern detected. Script: \`\`\`bash\nsudo systemctl restart ox-agent\n\`\`\``} onRunScript={(src, cmd) => { const a = agents.find(ag => ag.name === src); if(a) { setTerminalInjection({ agent: a, command: cmd }); setCurrentView('agents'); } }} />}
            {currentView === 'logs' && <Logs logs={logs} onAnalyze={() => setIsLogAnalyzing(true)} logAnalysis={logAnalysis} isAnalyzing={isLogAnalyzing} onClear={() => setLogs([])} />}
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
        <div className="fixed inset-0 z-[110] flex items-start justify-center pt-[15vh] px-4">
           <div className="absolute inset-0 bg-[#020617]/80 backdrop-blur-md animate-fade-in" onClick={() => setIsCommandPaletteOpen(false)}></div>
           <div className="relative w-full max-w-2xl bg-white rounded-[2.5rem] shadow-2xl border border-[#E5E5EA] overflow-hidden animate-fade-in-up ring-1 ring-black/5">
              <form onSubmit={handleCommandSubmit} className="flex items-center p-12 border-b border-[#E5E5EA]">
                  <span className="material-symbols-outlined text-[#0071E3] text-4xl mr-8 filled">psychology</span>
                  <input autoFocus type="text" value={commandInput} onChange={(e) => setCommandInput(e.target.value)} placeholder="Neural Command Input..." className="flex-1 text-2xl font-black text-[#1D1D1F] outline-none bg-transparent placeholder:text-[#C1C1C1]" disabled={isCommandExecuting} />
                  {isCommandExecuting && <div className="w-8 h-8 border-4 border-[#0071E3] border-t-transparent rounded-full animate-spin"></div>}
              </form>
              <div className="p-10 bg-[#F5F5F7]/50">
                  <h4 className="text-[10px] font-black text-[#86868B] uppercase tracking-[0.4em] mb-8">Intent Suggestions</h4>
                  <div className="grid grid-cols-2 gap-4">
                      {["Show infrastructure nodes", "View incident center", "Analyze audit stream", "Forge Nginx config", "Open security vault"].map((cmd) => (
                          <button key={cmd} onClick={() => setCommandInput(cmd)} className="text-left px-8 py-5 bg-white border border-[#E5E5EA] rounded-2xl text-[11px] font-black uppercase tracking-[0.15em] text-[#86868B] hover:text-[#0071E3] hover:border-[#0071E3]/30 hover:shadow-soft transition-all shadow-sm group">
                            <span className="group-hover:translate-x-1 transition-transform inline-block">{cmd}</span>
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
