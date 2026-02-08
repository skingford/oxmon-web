'use client'

import React, { useState, useEffect } from 'react';
import { generateConfig } from '@/actions/ai';

interface ConfigForgeProps {
  onShowToast: (message: string, type: 'success' | 'error' | 'info') => void;
}

const TEMPLATES = [
    { title: 'Nginx Gateway', icon: 'router', prompt: 'Optimized Nginx reverse proxy with SSL termination, HSTS, and Brotli compression.' },
    { title: 'K8s Mesh', icon: 'grid_view', prompt: 'Kubernetes deployment YAML with pod affinity, resource limits, and Istio sidecar injection.' },
    { title: 'Terraform AWS', icon: 'cloud', prompt: 'Terraform script for a multi-AZ VPC with public and private subnets, and an IGW.' },
    { title: 'Redis Cluster', icon: 'database', prompt: 'Redis configuration for a high-availability persistent cluster with sentinel failover.' },
];

const ConfigForge: React.FC<ConfigForgeProps> = ({ onShowToast }) => {
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedCode, setGeneratedCode] = useState<string | null>(null);
  const [isHardeningActive, setIsHardeningActive] = useState(true);
  const [hardeningReport, setHardeningReport] = useState<string | null>(null);
  const [history, setHistory] = useState<{ id: string, title: string, code: string, date: string }[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('ox_forge_history');
      return saved ? JSON.parse(saved) : [];
    }
    return [];
  });

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('ox_forge_history', JSON.stringify(history));
    }
  }, [history]);

  const handleGenerate = async (overriddenPrompt?: string) => {
    const finalPrompt = overriddenPrompt || prompt;
    if (!finalPrompt.trim()) return;
    setIsGenerating(true);
    setGeneratedCode(null);
    setHardeningReport(null);
    try {
      const result = await generateConfig(finalPrompt, isHardeningActive);

      setGeneratedCode(result.code);
      setHardeningReport(result.hardeningReport);
      setHistory(prev => [{ id: Math.random().toString(36).substr(2, 9), title: finalPrompt.substring(0, 30) + '...', code: result.code, date: new Date().toLocaleTimeString() }, ...prev].slice(0, 10));
      onShowToast('Object successfully forged.', 'success');
    } catch (err) { onShowToast('Neural forge failure.', 'error'); } finally { setIsGenerating(false); }
  };

  return (
    <div className="space-y-10 animate-fade-in h-full flex flex-col pb-16">
      <div className="space-y-3">
        <h2 className="text-5xl font-black text-text-main tracking-tighter uppercase">Config Forge</h2>
        <p className="text-secondary text-base font-medium">Neural synthesis for infrastructure-as-code and mission-critical server configurations.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {TEMPLATES.map((t) => (
              <button
                key={t.title}
                onClick={() => { setPrompt(t.prompt); handleGenerate(t.prompt); }}
                className="p-10 bg-white border border-[#E5E5EA] rounded-[3rem] text-left hover:border-primary hover:shadow-2xl transition-all group flex flex-col gap-8 shadow-soft"
              >
                  <div className="w-16 h-16 bg-[#F5F5F7] rounded-[1.75rem] flex items-center justify-center text-[#C1C1C1] group-hover:bg-primary group-hover:text-white transition-all shadow-inner">
                    <span className="material-symbols-outlined text-4xl">{t.icon}</span>
                  </div>
                  <div>
                    <p className="text-[11px] font-black text-secondary uppercase tracking-[0.3em] group-hover:text-primary mb-3 transition-colors">{t.title}</p>
                    <p className="text-[11px] text-secondary font-bold line-clamp-2 leading-relaxed opacity-60 tracking-tight">{t.prompt}</p>
                  </div>
              </button>
          ))}
      </div>

      <div className="flex-1 flex flex-col lg:flex-row gap-12 min-h-0">
        <div className="w-full lg:w-[480px] bg-white rounded-[4rem] border border-[#E5E5EA] p-12 shadow-soft flex flex-col gap-12 shrink-0">
            <div>
                <h3 className="text-[11px] font-black text-secondary uppercase tracking-[0.5em] mb-8">Neural Logic Input</h3>
                <textarea
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="Describe your target infrastructure object in detail..."
                    className="w-full h-64 bg-[#F5F5F7] border border-[#E5E5EA] rounded-[3rem] p-12 text-base focus:ring-[18px] focus:ring-primary/5 outline-none resize-none font-medium shadow-inner transition-all focus:bg-white text-text-main placeholder:text-[#C1C1C1] leading-relaxed"
                />
            </div>

            <div className="space-y-6">
                <div className="flex items-center justify-between p-10 bg-indigo-50/40 rounded-[3rem] border border-indigo-100 shadow-sm group">
                    <div className="flex items-center gap-6">
                        <div className="w-12 h-12 rounded-2xl bg-indigo-500 flex items-center justify-center text-white shadow-xl shadow-indigo-500/30 group-hover:scale-110 transition-transform"><span className="material-symbols-outlined text-[26px] filled">security</span></div>
                        <div>
                            <span className="text-[11px] font-black text-indigo-950 uppercase tracking-[0.3em]">Neural Hardening</span>
                            <p className="text-[9px] font-black text-indigo-500 uppercase mt-1 tracking-widest">SRE Audit Active</p>
                        </div>
                    </div>
                    <button
                        onClick={() => setIsHardeningActive(!isHardeningActive)}
                        className={`relative inline-flex h-9 w-16 items-center rounded-full transition-all duration-500 ${isHardeningActive ? 'bg-indigo-600 shadow-2xl shadow-indigo-600/40' : 'bg-gray-200 shadow-inner'}`}
                    >
                        <span className={`inline-block h-7 w-7 transform rounded-full bg-white transition-all duration-300 ${isHardeningActive ? 'translate-x-8 shadow-lg' : 'translate-x-1'}`} />
                    </button>
                </div>
                <button
                    onClick={() => handleGenerate()}
                    disabled={isGenerating || !prompt.trim()}
                    className="w-full py-7 bg-primary text-white rounded-[2.5rem] font-black text-[12px] uppercase tracking-[0.5em] flex items-center justify-center gap-5 shadow-2xl shadow-primary/40 hover:bg-primary-hover active:scale-95 transition-all disabled:opacity-50"
                >
                    <span className={`material-symbols-outlined text-[28px] ${isGenerating ? 'animate-spin' : ''}`}>autorenew</span>
                    {isGenerating ? 'Synthesizing...' : 'Forge Infrastructure'}
                </button>
            </div>

            {history.length > 0 && (
                <div className="flex-1 min-h-0 flex flex-col">
                    <h4 className="text-[10px] font-black text-secondary uppercase tracking-[0.4em] mb-6">Forge History</h4>
                    <div className="flex-1 overflow-y-auto space-y-4 custom-scrollbar pr-2">
                        {history.map(item => (
                            <button key={item.id} onClick={() => { setGeneratedCode(item.code); setPrompt(item.title); }} className="w-full text-left p-6 bg-gray-50 rounded-2xl border border-transparent hover:border-primary/20 hover:bg-white transition-all group flex items-center justify-between">
                                <div className="min-w-0">
                                    <p className="text-[11px] font-bold text-text-main truncate uppercase tracking-tight">{item.title}</p>
                                    <p className="text-[9px] text-secondary font-black uppercase mt-1 opacity-50">{item.date}</p>
                                </div>
                                <span className="material-symbols-outlined text-gray-300 group-hover:text-primary transition-colors">code</span>
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>

        <div className="flex-1 flex flex-col gap-10 min-h-0">
            <div className="flex-1 bg-[#020617] rounded-[4rem] shadow-2xl overflow-hidden flex flex-col border border-white/5 relative group ring-1 ring-white/10">
                <div className="absolute top-0 right-0 p-16 opacity-5 pointer-events-none group-hover:scale-110 transition-transform"><span className="material-symbols-outlined text-[180px] text-white">developer_mode</span></div>
                <div className="px-16 py-10 bg-white/5 border-b border-white/10 flex items-center justify-between relative z-10">
                    <div className="flex items-center gap-4">
                        <div className="w-3 h-3 rounded-full bg-indigo-500 animate-pulse"></div>
                        <span className="text-[11px] font-black text-indigo-300 uppercase tracking-[0.6em] font-mono">Neural PEM Stream</span>
                    </div>
                    {generatedCode && (
                        <button onClick={() => { navigator.clipboard.writeText(generatedCode!); onShowToast('PEM payload copied.', 'info'); }} className="text-[#86868B] hover:text-white transition-all flex items-center gap-4 text-[10px] font-black uppercase tracking-[0.4em]">
                            <span className="material-symbols-outlined text-[22px]">content_copy</span>
                            Copy Buffer
                        </button>
                    )}
                </div>
                <div className="flex-1 p-16 overflow-y-auto custom-scrollbar font-mono text-[15px] relative z-10">
                    {isGenerating ? (
                        <div className="h-full flex flex-col items-center justify-center space-y-12">
                            <div className="relative">
                                <div className="w-20 h-20 border-4 border-indigo-500/10 rounded-full"></div>
                                <div className="absolute inset-0 w-20 h-20 border-t-4 border-indigo-500 rounded-full animate-spin"></div>
                            </div>
                            <p className="text-indigo-200 font-mono text-xs uppercase tracking-[0.6em] animate-pulse">Initializing Synthesis</p>
                        </div>
                    ) : generatedCode ? (
                        <pre className="text-indigo-400/90 whitespace-pre-wrap leading-relaxed selection:bg-indigo-500/30">{generatedCode}</pre>
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center text-center opacity-10 grayscale space-y-12">
                            <span className="material-symbols-outlined text-9xl">linked_services</span>
                            <p className="text-[14px] font-black uppercase tracking-[0.6em]">Await Neural Handshake</p>
                        </div>
                    )}
                </div>
            </div>

            {hardeningReport && (
                <div className="bg-white rounded-[3.5rem] p-12 border border-[#E5E5EA] shadow-soft animate-fade-in-up">
                    <div className="flex items-center gap-5 mb-8">
                        <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-2xl shadow-indigo-600/30"><span className="material-symbols-outlined text-[24px] filled">policy</span></div>
                        <h4 className="text-[12px] font-black text-text-main uppercase tracking-[0.5em]">Audit Disclosure Summary</h4>
                    </div>
                    <p className="text-base text-secondary leading-[1.8] whitespace-pre-wrap font-medium font-sans tracking-tight">{hardeningReport}</p>
                </div>
            )}
        </div>
      </div>
    </div>
  );
};

export default ConfigForge;
