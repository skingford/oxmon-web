
import React, { useState } from 'react';
import { GoogleGenAI } from "@google/genai";

const HelpCenter: React.FC = () => {
  const [query, setQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [answer, setAnswer] = useState<string | null>(null);
  const [groundingChunks, setGroundingChunks] = useState<any[]>([]);

  const TRENDING_INSIGHTS = [
    { title: "Nginx Optimization", sub: "Load balancing strategies for 1M+ RPS clusters.", icon: "speed" },
    { title: "Zero Trust K8s", sub: "Hardening pod security policies in multi-tenant environments.", icon: "shield_with_heart" },
    { title: "Multi-Region DR", sub: "Optimizing EBS snapshots for low RTO failover.", icon: "settings_backup_restore" },
    { title: "Neural Observability", sub: "Integrating AI-driven log correlation pipelines.", icon: "psychology" }
  ];

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    setIsSearching(true);
    setAnswer(null);
    setGroundingChunks([]);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `You are the Senior SRE Advisor for the Oxmon Infrastructure Platform. Provide a technical, expert-level response for the following query: "${query}". Include grounded best practices and reference links if applicable.`,
        config: { tools: [{ googleSearch: {} }] }
      });
      setAnswer(response.text || 'Knowledge handshake interrupted.');
      setGroundingChunks(response.candidates?.[0]?.groundingMetadata?.groundingChunks || []);
    } catch (err) { setAnswer("Neural connection to the Knowledge Hub failed."); } finally { setIsSearching(false); }
  };

  return (
    <div className="space-y-16 animate-fade-in max-w-6xl mx-auto h-full flex flex-col pb-16">
      <div className="text-center space-y-6">
        <div className="w-24 h-24 bg-primary/10 text-primary rounded-[2.5rem] flex items-center justify-center mx-auto shadow-soft ring-[12px] ring-primary/5">
            <span className="material-symbols-outlined text-5xl filled">neurology</span>
        </div>
        <h2 className="text-5xl font-black text-text-main tracking-tighter uppercase">Knowledge Hub</h2>
        <p className="text-secondary max-w-2xl mx-auto leading-[2] text-base font-medium">Neural advisor for global infrastructure patterns, enterprise DevOps best practices, and Oxmon technical documentation.</p>
      </div>

      <div className="bg-white rounded-[4rem] border border-[#E5E5EA] shadow-2xl p-4 relative group focus-within:ring-[14px] focus-within:ring-primary/5 transition-all">
          <form onSubmit={handleSearch} className="flex items-center">
              <span className="material-symbols-outlined ml-8 text-gray-300 group-focus-within:text-primary transition-colors text-[32px]">search</span>
              <input 
                type="text" 
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Consult the SRE Neural Advisor..."
                className="flex-1 px-8 py-6 outline-none text-2xl font-bold text-text-main placeholder:text-gray-200"
              />
              <button 
                type="submit" 
                disabled={isSearching}
                className="bg-primary text-white px-14 py-6 rounded-[3rem] font-black text-[11px] uppercase tracking-[0.3em] shadow-2xl shadow-primary/30 hover:bg-primary-hover active:scale-95 transition-all disabled:opacity-50"
              >
                  {isSearching ? 'Thinking...' : 'Launch Neural Search'}
              </button>
          </form>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar pr-6 space-y-12">
          {!answer && !isSearching && (
              <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 animate-fade-in">
                  <div className="lg:col-span-4">
                      <h4 className="text-[11px] font-black text-secondary uppercase tracking-[0.4em] mb-8">Sentinel Trending Insights</h4>
                  </div>
                  {TRENDING_INSIGHTS.map((insight) => (
                      <button 
                        key={insight.title}
                        onClick={() => { setQuery(insight.title + ": " + insight.sub); }}
                        className="bg-white p-10 rounded-[3rem] border border-[#E5E5EA] text-left hover:border-primary hover:shadow-soft transition-all group flex flex-col justify-between h-56"
                      >
                          <div className="w-14 h-14 bg-gray-50 rounded-[1.5rem] flex items-center justify-center text-secondary group-hover:bg-primary/5 group-hover:text-primary transition-all">
                              <span className="material-symbols-outlined text-[28px]">{insight.icon}</span>
                          </div>
                          <div>
                              <p className="text-base font-black text-text-main uppercase tracking-tight mb-2 group-hover:text-primary transition-colors">{insight.title}</p>
                              <p className="text-[11px] text-secondary font-bold leading-relaxed opacity-60">{insight.sub}</p>
                          </div>
                      </button>
                  ))}
                  
                  <div className="lg:col-span-4 mt-12 grid grid-cols-1 md:grid-cols-2 gap-8 opacity-60">
                    {[
                      "Diagnose high CPU wait patterns on DB-01",
                      "Analyze TLS 1.3 trust chain vulnerabilities",
                      "Distributed cluster latency optimization",
                      "Automating remediation for Nginx 504 events"
                    ].map((hint) => (
                      <button key={hint} onClick={() => { setQuery(hint); }} className="text-left p-10 bg-white/50 border-2 border-dashed border-[#E5E5EA] rounded-[3rem] text-[11px] font-black uppercase tracking-[0.3em] text-secondary hover:border-primary/40 hover:text-primary hover:bg-white transition-all">
                          {hint}
                      </button>
                    ))}
                  </div>
              </div>
          )}

          {isSearching && (
              <div className="space-y-16 animate-fade-in-up">
                  <div className="bg-white rounded-[4rem] border border-[#E5E5EA] p-20 shadow-soft animate-pulse flex flex-col items-center justify-center space-y-10">
                      <div className="w-20 h-20 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                      <p className="text-[11px] font-black text-secondary uppercase tracking-[0.4em]">Handshaking with global SRE knowledge mesh...</p>
                  </div>
              </div>
          )}

          {answer && (
              <div className="bg-white rounded-[4rem] border border-[#E5E5EA] p-16 shadow-soft animate-fade-in-up relative overflow-hidden group">
                  <div className="absolute top-0 right-0 p-16 opacity-5 pointer-events-none group-hover:scale-110 transition-transform"><span className="material-symbols-outlined text-[150px] text-primary">auto_awesome</span></div>
                  <div className="flex items-center gap-6 mb-12 border-b border-[#F5F5F7] pb-10 relative z-10">
                      <div className="p-4 bg-indigo-600 text-white rounded-[1.5rem] shadow-2xl shadow-indigo-600/30"><span className="material-symbols-outlined text-[32px] filled">verified</span></div>
                      <div>
                        <h3 className="font-black text-text-main text-xl uppercase tracking-tighter leading-none">AI Neural Insight</h3>
                        <p className="text-indigo-600 text-[11px] font-black uppercase tracking-widest mt-2">Grounded Domain Synthesis Active</p>
                      </div>
                  </div>
                  <div className="prose prose-lg max-w-none text-secondary leading-[2.2] font-medium whitespace-pre-wrap relative z-10 text-[17px]">
                      {answer}
                  </div>
                  
                  {groundingChunks.length > 0 && (
                      <div className="mt-16 pt-12 border-t border-[#F5F5F7] relative z-10">
                          <p className="text-[11px] font-black text-secondary uppercase tracking-[0.4em] mb-10">Expert Reference Nodes</p>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                              {groundingChunks.map((chunk, i) => chunk.web && (
                                  <a key={i} href={chunk.web.uri} target="_blank" rel="noopener noreferrer" className="flex items-center justify-between p-8 bg-[#F5F5F7]/50 rounded-[2.5rem] hover:bg-white hover:shadow-soft border border-transparent hover:border-[#E5E5EA] transition-all group">
                                      <div className="flex items-center gap-6 overflow-hidden">
                                          <div className="w-10 h-10 bg-white rounded-2xl flex items-center justify-center border border-[#E5E5EA] text-primary group-hover:bg-primary group-hover:text-white transition-all shadow-sm"><span className="material-symbols-outlined text-[20px]">link</span></div>
                                          <span className="text-sm font-black text-text-main truncate tracking-tight">{chunk.web.title || chunk.web.uri}</span>
                                      </div>
                                      <span className="material-symbols-outlined text-[#C1C1C1] group-hover:text-primary text-[24px] group-hover:translate-x-1 transition-all">arrow_outward</span>
                                  </a>
                              ))}
                          </div>
                      </div>
                  )}
              </div>
          )}
      </div>
    </div>
  );
};

export default HelpCenter;
