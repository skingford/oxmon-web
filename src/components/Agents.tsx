'use client'

import { useState, useEffect, useRef, memo } from 'react';
import type { Agent } from '@/lib/types';
import { executeTerminalCommand } from '@/actions/ai';
import { AreaChart } from 'recharts/lib/chart/AreaChart';
import { Area } from 'recharts/lib/cartesian/Area';
import { ResponsiveContainer } from 'recharts/lib/component/ResponsiveContainer';

interface AgentsProps {
  agents: Agent[];
  onAddAgent: (agent: Agent) => void;
  onDeleteAgent: (id: string) => void;
  onUpdateStatus: (id: string) => void;
  onShowToast: (message: string, type: 'success' | 'error' | 'info') => void;
  initialInjection?: { agent: Agent, command: string } | null;
  clearInjection?: () => void;
}

const TelemetryChart: React.FC<{ color: string }> = ({ color }) => {
    const [data, setData] = useState(Array.from({ length: 20 }).map((_, i) => ({ time: i, val: 20 + Math.random() * 50 })));
    useEffect(() => {
        const interval = setInterval(() => {
            setData(prev => [...prev.slice(1), { time: prev.length, val: 20 + Math.random() * 50 }]);
        }, 3000);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="h-24 w-full mt-4">
            <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data}>
                    <defs>
                        <linearGradient id={`grad-${color}`} x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor={color} stopOpacity={0.15}/>
                            <stop offset="95%" stopColor={color} stopOpacity={0}/>
                        </linearGradient>
                    </defs>
                    <Area type="monotone" dataKey="val" stroke={color} strokeWidth={2} fillOpacity={1} fill={`url(#grad-${color})`} isAnimationActive={false} />
                </AreaChart>
            </ResponsiveContainer>
        </div>
    );
};

const Agents: React.FC<AgentsProps> = ({ agents, onAddAgent, onDeleteAgent, onUpdateStatus, onShowToast, initialInjection, clearInjection }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isTerminalOpen, setIsTerminalOpen] = useState(false);
  const [selectedAgentTerminal, setSelectedAgentTerminal] = useState<Agent | null>(null);
  const [terminalOutput, setTerminalOutput] = useState<{ type: 'cmd' | 'resp', text: string }[]>([]);
  const [currentInput, setCurrentInput] = useState('');
  const [isCommandExecuting, setIsCommandExecuting] = useState(false);
  const terminalBottomRef = useRef<HTMLDivElement>(null);
  const [detailAgent, setDetailAgent] = useState<Agent | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newAgent, setNewAgent] = useState({ name: '', ip: '', version: 'v1.2.6' });

  useEffect(() => {
    if (initialInjection) {
        setSelectedAgentTerminal(initialInjection.agent);
        setIsTerminalOpen(true);
        setTerminalOutput([{ type: 'resp', text: `Initiating smart session for ${initialInjection.agent.name}...` }]);
        setTimeout(() => executeCommand(initialInjection.command, initialInjection.agent), 800);
        clearInjection?.();
    }
  }, [initialInjection]);

  useEffect(() => {
    if (terminalBottomRef.current) terminalBottomRef.current.scrollIntoView({ behavior: 'smooth' });
  }, [terminalOutput]);

  const executeCommand = async (cmd: string, agent: Agent) => {
    if (!cmd.trim() || isCommandExecuting) return;
    setTerminalOutput(prev => [...prev, { type: 'cmd', text: cmd }]);
    setIsCommandExecuting(true);
    try {
        const response = await executeTerminalCommand(agent.name, agent.os || 'Linux', cmd);
        setTerminalOutput(prev => [...prev, { type: 'resp', text: response }]);
    } catch (err) {
        setTerminalOutput(prev => [...prev, { type: 'resp', text: 'Connection interrupt. Node heartbeat lost.' }]);
    } finally { setIsCommandExecuting(false); }
  };

  const handleAddSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      const agent: Agent = {
          id: 'ag_' + Math.random().toString(36).substr(2, 9),
          name: newAgent.name,
          ip: newAgent.ip,
          version: newAgent.version,
          status: 'Online',
          lastReported: 'Just now'
      };
      onAddAgent(agent);
      setIsAddModalOpen(false);
      setNewAgent({ name: '', ip: '', version: 'v1.2.6' });
      onShowToast(`Node ${agent.name} deployed.`, 'success');
  };

  const filteredAgents = agents.filter(agent =>
    agent.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    agent.ip.includes(searchTerm)
  );

  return (
    <div className="space-y-10 animate-fade-in relative pb-16">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div>
          <h2 className="text-3xl font-black text-text-main tracking-tight uppercase">Infrastructure Grid</h2>
          <p className="text-secondary text-sm font-medium mt-1">Operational state and compute telemetry for the distributed cluster.</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="relative group">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-secondary text-[20px]">search</span>
            <input type="text" placeholder="Grep nodes..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10 pr-4 py-2.5 bg-white border border-border rounded-2xl text-sm w-64 shadow-soft focus:ring-4 focus:ring-primary/5 transition-all outline-none font-bold" />
          </div>
          <button onClick={() => setIsAddModalOpen(true)} className="bg-primary text-white px-6 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-primary/20 hover:bg-primary-hover active:scale-95 transition-all">Deploy Node</button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {filteredAgents.map((agent) => (
          <div key={agent.id} className="bg-white rounded-[2.5rem] p-10 border border-border shadow-soft group hover:border-primary/20 transition-all flex flex-col cursor-pointer" onClick={() => setDetailAgent(agent)}>
            <div className="flex items-center justify-between mb-8">
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110 ${agent.status === 'Online' ? 'bg-green-50 text-success' : 'bg-red-50 text-danger'}`}>
                <span className="material-symbols-outlined text-[28px]">{agent.status === 'Online' ? 'dns' : 'emergency_home'}</span>
              </div>
              <div className="flex flex-col items-end">
                <span onClick={(e) => { e.stopPropagation(); onUpdateStatus(agent.id); }} className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border cursor-pointer hover:opacity-80 transition-opacity ${agent.status === 'Online' ? 'bg-green-50 text-success border-green-100' : 'bg-red-50 text-danger border-red-100'}`}>{agent.status}</span>
                <span className="text-[10px] font-black text-secondary uppercase tracking-widest mt-2">{agent.ip}</span>
              </div>
            </div>
            <h4 className="text-lg font-black text-text-main group-hover:text-primary transition-colors tracking-tight">{agent.name}</h4>
            <p className="text-[10px] font-black text-secondary uppercase tracking-[0.2em] mt-1">{agent.version} • Sync: {agent.lastReported}</p>

            {agent.status === 'Online' && <TelemetryChart color="#0071E3" />}

            <div className="mt-8 pt-8 border-t border-gray-50 flex gap-3">
              <button onClick={(e) => { e.stopPropagation(); setSelectedAgentTerminal(agent); setIsTerminalOpen(true); }} className="flex-1 py-3 bg-gray-50 text-secondary hover:text-primary hover:bg-primary/5 rounded-xl text-[9px] font-black uppercase tracking-[0.15em] transition-all flex items-center justify-center gap-2">
                <span className="material-symbols-outlined text-[16px]">terminal</span> Shell
              </button>
              <button onClick={(e) => { e.stopPropagation(); setDetailAgent(agent); }} className="flex-1 py-3 bg-gray-50 text-secondary hover:text-indigo-500 hover:bg-indigo-50 rounded-xl text-[9px] font-black uppercase tracking-[0.15em] transition-all flex items-center justify-center gap-2">
                <span className="material-symbols-outlined text-[16px]">monitoring</span> Data
              </button>
            </div>
          </div>
        ))}
      </div>

      {isTerminalOpen && selectedAgentTerminal && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-6">
          <div className="absolute inset-0 bg-[#0F172A]/90 backdrop-blur-xl animate-fade-in" onClick={() => setIsTerminalOpen(false)}></div>
          <div className="relative bg-[#020617] rounded-[2.5rem] shadow-2xl w-full max-w-4xl h-[700px] flex flex-col border border-white/10 overflow-hidden ring-1 ring-white/5 animate-fade-in-up">
             <div className="flex items-center justify-between px-10 py-6 bg-white/5 border-b border-white/10">
                <div className="flex items-center gap-4">
                   <div className="flex gap-2"><div className="w-3 h-3 rounded-full bg-red-500/20"></div><div className="w-3 h-3 rounded-full bg-amber-500/20"></div><div className="w-3 h-3 rounded-full bg-green-500/20"></div></div>
                   <h3 className="text-indigo-300 font-mono text-[10px] font-black uppercase tracking-[0.3em]">Neural Terminal: {selectedAgentTerminal.name}</h3>
                </div>
                <button onClick={() => setIsTerminalOpen(false)} className="text-gray-500 hover:text-white transition-colors"><span className="material-symbols-outlined">close</span></button>
             </div>
             <div className="flex-1 p-10 overflow-y-auto font-mono text-xs text-gray-400 space-y-5 custom-scrollbar">
                {terminalOutput.map((out, idx) => (
                    <div key={idx} className={out.type === 'cmd' ? 'text-indigo-400' : 'text-blue-50'}>
                        {out.type === 'cmd' ? <div className="flex gap-4"><span className="text-indigo-700 font-black">»</span><span>{out.text}</span></div> : <pre className="whitespace-pre-wrap leading-relaxed opacity-80">{out.text}</pre>}
                    </div>
                ))}
                {isCommandExecuting && <div className="flex items-center gap-3 text-indigo-400 animate-pulse text-[10px] font-black uppercase tracking-widest"><span className="w-4 h-4 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin"></span>Synthesizing response...</div>}
                <div ref={terminalBottomRef}></div>
             </div>
             <form onSubmit={(e) => { e.preventDefault(); if(currentInput.trim()) { executeCommand(currentInput, selectedAgentTerminal); setCurrentInput(''); } }} className="p-8 bg-white/5 border-t border-white/10 flex items-center gap-6">
                <span className="text-indigo-600 font-black font-mono">»</span>
                <input autoFocus type="text" value={currentInput} onChange={(e) => setCurrentInput(e.target.value)} disabled={isCommandExecuting} className="flex-1 bg-transparent border-none outline-none text-white font-mono text-sm placeholder:text-gray-700" placeholder="Awaiting neural command payload..." />
             </form>
          </div>
        </div>
      )}

      {detailAgent && (
        <div className="fixed inset-0 z-[110] flex justify-end">
            <div className="absolute inset-0 bg-black/30 backdrop-blur-sm animate-fade-in" onClick={() => setDetailAgent(null)}></div>
            <div className="relative w-full max-w-xl bg-white h-full shadow-2xl border-l border-border p-12 animate-slide-in-right flex flex-col overflow-hidden">
                <div className="flex justify-between items-start mb-12">
                    <div>
                        <h3 className="text-2xl font-black text-text-main tracking-tight uppercase">Node Insight</h3>
                        <p className="text-[10px] font-mono text-secondary mt-2 tracking-widest uppercase">{detailAgent.id} • {detailAgent.ip}</p>
                    </div>
                    <button onClick={() => setDetailAgent(null)} className="p-2 text-secondary hover:text-text-main bg-gray-50 rounded-xl transition-all"><span className="material-symbols-outlined">close</span></button>
                </div>

                <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 space-y-12">
                    <div className="grid grid-cols-2 gap-6">
                        {[
                            { label: 'Platform', val: 'ARM64-GEN2', icon: 'settings_input_component' },
                            { label: 'OS Build', val: 'UBUNTU 24.04', icon: 'terminal' },
                            { label: 'Uptime', val: '18D 14H', icon: 'schedule' },
                            { label: 'Sync Status', val: 'NOMINAL', icon: 'verified' }
                        ].map(info => (
                            <div key={info.label} className="p-8 bg-gray-50 rounded-[2.5rem] border border-border group hover:bg-white hover:shadow-soft transition-all">
                                <div className="flex items-center gap-3 mb-4 text-secondary group-hover:text-primary transition-colors"><span className="material-symbols-outlined text-[20px]">{info.icon}</span><p className="text-[10px] font-black uppercase tracking-widest">{info.label}</p></div>
                                <p className="text-sm font-black text-text-main">{info.val}</p>
                            </div>
                        ))}
                    </div>

                    <div className="space-y-6">
                        <h5 className="text-[10px] uppercase font-black text-secondary tracking-[0.2em]">Live Heartbeat</h5>
                        <div className="p-10 bg-white border border-border rounded-[2.5rem] shadow-soft">
                             <div className="flex justify-between items-end mb-8"><p className="text-[10px] font-black text-primary uppercase tracking-widest">CPU LOAD</p><p className="text-2xl font-black text-indigo-950">24.8%</p></div>
                             <TelemetryChart color="#0071E3" />
                        </div>
                    </div>
                </div>

                <div className="pt-10 border-t border-border flex gap-4">
                    <button onClick={() => { setSelectedAgentTerminal(detailAgent); setIsTerminalOpen(true); }} className="flex-1 py-4 bg-primary text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-primary/20 hover:bg-primary-hover active:scale-95 transition-all">Smart Shell</button>
                    <button onClick={() => onDeleteAgent(detailAgent.id)} className="px-8 py-4 border border-border rounded-2xl font-black text-[10px] uppercase tracking-widest text-danger hover:bg-red-50 transition-all">Decommission</button>
                </div>
            </div>
        </div>
      )}

      {isAddModalOpen && (
        <div className="fixed inset-0 z-[130] flex items-center justify-center p-6">
          <div className="absolute inset-0 bg-[#0F172A]/80 backdrop-blur-xl animate-fade-in" onClick={() => setIsAddModalOpen(false)}></div>
          <div className="relative bg-white rounded-[3rem] shadow-2xl w-full max-w-md p-12 animate-fade-in-up border border-white/20">
            <h3 className="text-2xl font-black text-text-main mb-8 tracking-tight uppercase">Provision Node</h3>
            <form onSubmit={handleAddSubmit} className="space-y-6">
              <div className="space-y-2">
                  <label className="block text-[10px] font-black text-secondary uppercase tracking-widest ml-1">Node Label</label>
                  <input required type="text" value={newAgent.name} onChange={(e) => setNewAgent({...newAgent, name: e.target.value})} placeholder="e.g. AWS Production Node" className="w-full px-6 py-4 rounded-2xl bg-gray-50 border border-border outline-none focus:ring-4 focus:ring-primary/5 focus:bg-white transition-all text-sm font-bold" />
              </div>
              <div className="space-y-2">
                  <label className="block text-[10px] font-black text-secondary uppercase tracking-widest ml-1">IP Address</label>
                  <input required type="text" value={newAgent.ip} onChange={(e) => setNewAgent({...newAgent, ip: e.target.value})} placeholder="0.0.0.0" className="w-full px-6 py-4 rounded-2xl bg-gray-50 border border-border outline-none focus:ring-4 focus:ring-primary/5 focus:bg-white transition-all text-sm font-bold" />
              </div>
              <div className="flex justify-end gap-3 pt-6">
                  <button type="button" onClick={() => setIsAddModalOpen(false)} className="px-6 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest text-secondary">Cancel</button>
                  <button type="submit" className="px-10 py-4 rounded-2xl bg-primary text-white font-black text-[10px] uppercase tracking-widest shadow-xl shadow-primary/20 active:scale-95 transition-all">Register Agent</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Agents;
