
import React, { useState, useEffect } from 'react';
import { AreaChart, Area, ResponsiveContainer, Tooltip } from 'recharts';
import { ViewState, Agent, Certificate, Alert } from '../types';
import { GoogleGenAI } from "@google/genai";

interface DashboardProps {
  onChangeView: (view: ViewState) => void;
  agents: Agent[];
  certificates: Certificate[];
  alerts: Alert[];
  aiSummary: string;
  isAiLoading: boolean;
  onGenerateAiSummary: () => void;
  onGenerateFullReport: () => void;
  predictiveData: string | null;
  onRunPredictiveScan: () => void;
}

const Dashboard: React.FC<DashboardProps> = ({ 
  onChangeView, 
  agents, 
  certificates, 
  alerts, 
  aiSummary, 
  isAiLoading, 
  onGenerateAiSummary,
  onGenerateFullReport,
  predictiveData,
  onRunPredictiveScan
}) => {
  const [securityScore, setSecurityScore] = useState(100);
  const [throughputData, setThroughputData] = useState<any[]>([]);
  const [isVideoLoading, setIsVideoLoading] = useState(false);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [videoStatusMsg, setVideoStatusMsg] = useState('');
  const [isScanningPredictive, setIsScanningPredictive] = useState(false);

  const [regionalMetrics, setRegionalMetrics] = useState([
    { region: 'US-East', ping: 24, load: 45, color: '#0071E3', trend: 'down' },
    { region: 'EU-West', ping: 38, load: 62, color: '#34C759', trend: 'up' },
    { region: 'Asia-South', ping: 124, load: 28, color: '#FF9F0A', trend: 'stable' },
    { region: 'BR-East', ping: 82, load: 55, color: '#FF3B30', trend: 'down' },
  ]);

  useEffect(() => {
    let score = 100;
    score -= alerts.filter(a => a.severity === 'Critical').length * 12;
    score -= alerts.filter(a => a.severity === 'Warning').length * 4;
    score -= certificates.filter(c => c.status === 'Expired').length * 15;
    score -= agents.filter(a => a.status === 'Offline').length * 8;
    setSecurityScore(Math.max(5, score));
  }, [alerts, certificates, agents]);

  useEffect(() => {
    const initialData = Array.from({ length: 30 }).map((_, i) => ({
      time: i,
      val: 40 + Math.random() * 20
    }));
    setThroughputData(initialData);

    const timer = setInterval(() => {
      setThroughputData(prev => [...prev.slice(1), { time: prev.length, val: 40 + Math.random() * 30 }]);
      setRegionalMetrics(prev => prev.map(r => ({
          ...r,
          ping: Math.max(10, r.ping + (Math.random() * 6 - 3)),
          load: Math.max(5, Math.min(95, r.load + (Math.random() * 4 - 2)))
      })));
    }, 3000);
    return () => clearInterval(timer);
  }, []);

  const handlePredictiveScan = async () => {
    setIsScanningPredictive(true);
    await onRunPredictiveScan();
    setIsScanningPredictive(false);
  };

  const handleGenerateBriefingVideo = async () => {
    // Check for API key selection for Veo models
    // @ts-ignore
    if (window.aistudio && !(await window.aistudio.hasSelectedApiKey())) {
        // @ts-ignore
        await window.aistudio.openSelectKey();
    }

    setIsVideoLoading(true);
    setVideoUrl(null);
    setVideoStatusMsg('Compiling global cluster telemetry...');

    try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const prompt = `A high-fidelity cinematic 3D macro shot of a blue glowing holographic server core in a dark, high-tech SRE facility. Data streams pulse through fibers. 8K, photorealistic, moody atmosphere.`;

        setVideoStatusMsg('Rendering neural frames...');
        let operation = await ai.models.generateVideos({
            model: 'veo-3.1-fast-generate-preview',
            prompt: prompt,
            config: { numberOfVideos: 1, resolution: '1080p', aspectRatio: '16:9' }
        });

        while (!operation.done) {
            await new Promise(resolve => setTimeout(resolve, 8000));
            operation = await ai.operations.getVideosOperation({ operation: operation });
        }

        const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
        if (downloadLink) {
            const response = await fetch(`${downloadLink}&key=${process.env.API_KEY}`);
            const blob = await response.blob();
            setVideoUrl(URL.createObjectURL(blob));
        }
    } catch (err: any) {
        setVideoStatusMsg('Neural synthesis link failed.');
    } finally {
        setIsVideoLoading(false);
    }
  };

  return (
    <div className="space-y-10 animate-fade-in pb-24">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
        <div className="space-y-3">
            <h2 className="text-5xl font-black text-text-main tracking-tighter uppercase flex items-center gap-5">
                Executive Overview
                <div className="hidden sm:flex items-center gap-2.5 px-5 py-2 bg-primary/5 rounded-full border border-primary/10">
                    <span className="w-2.5 h-2.5 rounded-full bg-primary animate-pulse shadow-lg shadow-primary/40"></span>
                    <span className="text-[10px] font-black text-primary uppercase tracking-[0.25em]">Oxmon Sentinel v4.0</span>
                </div>
            </h2>
            <p className="text-secondary text-base font-medium max-w-2xl">High-fidelity visualization of global infrastructure reach, distributed cluster health, and neural security metrics.</p>
        </div>
        <div className="flex flex-wrap items-center gap-4">
            <button onClick={handleGenerateBriefingVideo} disabled={isVideoLoading} className="group flex items-center gap-3 px-8 py-3.5 bg-white border border-border hover:border-primary/30 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-soft transition-all">
                <span className={`material-symbols-outlined text-[22px] text-primary ${isVideoLoading ? 'animate-spin' : 'filled'}`}>movie_filter</span>
                <span>{isVideoLoading ? 'Synthesizing...' : 'AI Visual Briefing'}</span>
            </button>
            <button onClick={onGenerateAiSummary} disabled={isAiLoading} className="flex items-center gap-3 px-10 py-3.5 bg-primary text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-2xl shadow-primary/20 hover:bg-primary-hover active:scale-95 transition-all disabled:opacity-70">
                <span className={`material-symbols-outlined text-[22px] ${isAiLoading ? 'animate-spin' : ''}`}>neurology</span>
                <span>{isAiLoading ? 'Analyzing...' : 'Neural Cluster Audit'}</span>
            </button>
        </div>
      </div>

      {(isVideoLoading || videoUrl) && (
        <div className="bg-[#020617] rounded-[3.5rem] p-12 border border-white/5 shadow-2xl animate-fade-in-up relative overflow-hidden group ring-1 ring-white/10">
            <div className="absolute top-0 right-0 p-16 opacity-5 pointer-events-none group-hover:scale-110 transition-transform"><span className="material-symbols-outlined text-[220px] text-white">videocam</span></div>
            <div className="flex items-center justify-between mb-12 relative z-10">
                <div className="flex items-center gap-6">
                    <div className="w-16 h-16 bg-indigo-500 rounded-2xl flex items-center justify-center text-white shadow-2xl shadow-indigo-500/40">
                        <span className="material-symbols-outlined text-4xl filled">play_circle</span>
                    </div>
                    <div>
                        <h3 className="text-white font-black text-base uppercase tracking-[0.3em]">Sentinel Visual Dispatch</h3>
                        <p className="text-indigo-400 text-[11px] font-black uppercase tracking-widest mt-2">{videoStatusMsg}</p>
                    </div>
                </div>
                <button onClick={() => { setVideoUrl(null); setIsVideoLoading(false); }} className="w-12 h-12 flex items-center justify-center text-gray-500 hover:text-white transition-colors bg-white/5 rounded-2xl border border-white/10">
                    <span className="material-symbols-outlined">close</span>
                </button>
            </div>
            <div className="relative rounded-[3rem] overflow-hidden bg-black aspect-video shadow-2xl border border-white/10 group/player">
                {isVideoLoading ? (
                    <div className="absolute inset-0 flex flex-col items-center justify-center space-y-10">
                        <div className="relative">
                            <div className="w-24 h-24 border-4 border-indigo-500/10 rounded-full"></div>
                            <div className="absolute inset-0 w-24 h-24 border-t-4 border-indigo-500 rounded-full animate-spin"></div>
                        </div>
                        <p className="text-indigo-100 font-mono text-xs uppercase tracking-[0.5em] animate-pulse">Forging Neural Frames</p>
                    </div>
                ) : (
                    <video src={videoUrl!} controls autoPlay className="w-full h-full object-cover" />
                )}
            </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-10">
          <div className="bg-white rounded-[3rem] p-12 shadow-soft border border-border flex flex-col items-center justify-center relative overflow-hidden group">
              <div className="absolute top-12 left-12"><span className="text-[11px] font-black text-secondary uppercase tracking-[0.4em]">Global Health Index</span></div>
              <div className="relative w-56 h-56 flex items-center justify-center">
                  <svg className="w-full h-full transform -rotate-90 scale-110">
                      <circle cx="112" cy="112" r="100" stroke="#F5F5F7" strokeWidth="16" fill="transparent" />
                      <circle cx="112" cy="112" r="100" stroke="currentColor" strokeWidth="16" fill="transparent" strokeDasharray={628} strokeDashoffset={628 - (628 * securityScore) / 100} strokeLinecap="round" className={`transition-all duration-1000 ${securityScore > 85 ? 'text-primary' : securityScore > 70 ? 'text-warning' : 'text-danger'}`} />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-7xl font-black text-text-main tracking-tighter leading-none">{securityScore}</span>
                      <span className="text-[11px] font-black text-secondary uppercase tracking-widest mt-4">Optimized</span>
                  </div>
              </div>
          </div>

          <div className="lg:col-span-2 bg-white rounded-[3rem] p-12 shadow-soft border border-border flex flex-col group">
              <div className="flex items-center justify-between mb-12">
                  <span className="text-[11px] font-black text-secondary uppercase tracking-[0.4em]">Global Mesh Throughput</span>
                  <div className="flex gap-8">
                      <div className="flex items-center gap-3"><span className="w-3 h-3 rounded-full bg-primary shadow-lg shadow-primary/30 animate-pulse"></span><span className="text-[10px] font-black uppercase tracking-[0.2em]">Live Traffic</span></div>
                      <div className="flex items-center gap-3"><span className="w-3 h-3 rounded-full bg-gray-200"></span><span className="text-[10px] font-black uppercase tracking-[0.2em] text-secondary">Historical</span></div>
                  </div>
              </div>
              <div className="flex-1 h-56">
                  <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={throughputData}>
                          <defs>
                              <linearGradient id="colorPulse" x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="5%" stopColor="#0071E3" stopOpacity={0.25}/>
                                  <stop offset="95%" stopColor="#0071E3" stopOpacity={0}/>
                              </linearGradient>
                          </defs>
                          <Tooltip 
                            contentStyle={{ borderRadius: '24px', border: 'none', boxShadow: '0 20px 50px rgba(0,0,0,0.1)', fontSize: '11px', fontWeight: '900', textTransform: 'uppercase', padding: '16px' }}
                            cursor={{ stroke: '#0071E3', strokeWidth: 2, strokeDasharray: '6 6' }}
                          />
                          <Area type="monotone" dataKey="val" stroke="#0071E3" strokeWidth={4} fillOpacity={1} fill="url(#colorPulse)" isAnimationActive={false} />
                      </AreaChart>
                  </ResponsiveContainer>
              </div>
          </div>

          <div className="bg-white rounded-[3rem] p-12 shadow-soft border border-border flex flex-col justify-between">
              <span className="text-[11px] font-black text-secondary uppercase tracking-[0.4em]">Regional Latency</span>
              <div className="space-y-10">
                  {regionalMetrics.map(reg => (
                      <div key={reg.region} className="group/reg">
                          <div className="flex items-center justify-between mb-4">
                              <div className="flex items-center gap-3">
                                  <span className="text-[11px] font-black uppercase tracking-widest text-secondary group-hover/reg:text-text-main transition-colors">{reg.region}</span>
                                  <span className={`material-symbols-outlined text-[16px] ${reg.trend === 'up' ? 'text-danger' : reg.trend === 'down' ? 'text-success' : 'text-secondary opacity-40'}`}>
                                    {reg.trend === 'up' ? 'trending_up' : reg.trend === 'down' ? 'trending_down' : 'trending_flat'}
                                  </span>
                              </div>
                              <span className="text-xs font-black tracking-tight" style={{ color: reg.color }}>{Math.round(reg.ping)}ms</span>
                          </div>
                          <div className="h-2 bg-gray-100 rounded-full overflow-hidden shadow-inner">
                              <div className="h-full transition-all duration-1000 shadow-xl" style={{ width: `${reg.load}%`, backgroundColor: reg.color }}></div>
                          </div>
                      </div>
                  ))}
              </div>
          </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          <div className="lg:col-span-2 space-y-10">
            <div className="bg-[#0F172A] rounded-[3.5rem] p-16 shadow-2xl relative overflow-hidden group border border-white/5">
                <div className="absolute top-0 right-0 p-16 opacity-5 pointer-events-none group-hover:scale-110 transition-transform">
                    <span className="material-symbols-outlined text-[200px] text-white">neurology</span>
                </div>
                <div className="flex items-center gap-8 mb-16 relative z-10">
                    <div className="w-20 h-20 bg-indigo-500/10 rounded-3xl flex items-center justify-center text-indigo-400 border border-white/10 shadow-inner">
                        <span className="material-symbols-outlined text-5xl filled">psychology</span>
                    </div>
                    <div>
                        <h3 className="text-white font-black text-lg uppercase tracking-[0.3em]">Sentinel Intelligence Synthesis</h3>
                        <p className="text-indigo-500 text-xs font-black uppercase tracking-widest mt-2">Neural Observation Logic Active</p>
                    </div>
                </div>
                <div className="relative z-10">
                    {isAiLoading ? (
                        <div className="space-y-6 animate-pulse">
                            <div className="h-6 bg-white/5 rounded-full w-full"></div>
                            <div className="h-6 bg-white/5 rounded-full w-[94%]"></div>
                            <div className="h-6 bg-white/5 rounded-full w-[88%]"></div>
                        </div>
                    ) : (
                        <p className="text-indigo-100/80 text-lg leading-[2.2] whitespace-pre-wrap font-medium">
                            {aiSummary || "Establish link to the Oxmon Sentinel to receive distributed cluster health summaries, systemic risk matrix assessments, and automated remediation forecasts."}
                        </p>
                    )}
                </div>
                {aiSummary && (
                    <div className="mt-12 pt-12 border-t border-white/10 flex gap-6 relative z-10">
                        <button onClick={onGenerateAiSummary} className="px-8 py-4 bg-white/5 border border-white/10 rounded-2xl text-[10px] font-black uppercase tracking-[0.25em] text-indigo-300 hover:bg-white/10 transition-all">Refresh Neural Audit</button>
                    </div>
                )}
            </div>

            <div className="bg-white rounded-[3.5rem] p-16 border border-border shadow-soft relative overflow-hidden group">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-10 mb-16">
                    <div className="flex items-center gap-8">
                        <div className="w-20 h-20 bg-amber-50 rounded-3xl flex items-center justify-center text-warning border border-amber-100 shadow-sm">
                            <span className="material-symbols-outlined text-5xl filled">online_prediction</span>
                        </div>
                        <div>
                            <h3 className="text-text-main font-black text-lg uppercase tracking-[0.3em]">Neural Health Forecast</h3>
                            <p className="text-secondary text-xs font-black uppercase tracking-widest mt-2">Predictive Anomaly Detection</p>
                        </div>
                    </div>
                    <button 
                        onClick={handlePredictiveScan} 
                        disabled={isScanningPredictive}
                        className={`flex items-center gap-3 px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest border transition-all ${isScanningPredictive ? 'bg-amber-100 text-warning border-amber-200 animate-pulse' : 'bg-white text-secondary hover:text-text-main border-border shadow-sm hover:shadow-soft'}`}
                    >
                        <span className={`material-symbols-outlined text-[22px] ${isScanningPredictive ? 'animate-spin' : ''}`}>sync</span>
                        {isScanningPredictive ? 'Executing Scan...' : 'Execute Forecast'}
                    </button>
                </div>
                <div className="relative min-h-[200px] flex items-center justify-center">
                    {predictiveData ? (
                        <div className="w-full p-12 bg-amber-50/40 rounded-[3rem] border border-amber-100/50 animate-fade-in-up">
                            <div className="flex items-center gap-4 mb-8 text-warning"><span className="material-symbols-outlined text-[26px] filled">bolt</span><span className="text-[11px] font-black uppercase tracking-[0.3em]">Risk Vector Projection</span></div>
                            <p className="text-amber-950 text-base leading-[2] font-medium whitespace-pre-wrap">
                                {predictiveData}
                            </p>
                        </div>
                    ) : (
                        <div className="p-20 border-4 border-dashed border-gray-50 rounded-[4rem] text-center space-y-8 opacity-30 group-hover:opacity-50 transition-all">
                            <div className="w-20 h-20 bg-gray-50 rounded-full mx-auto flex items-center justify-center text-gray-400">
                                <span className="material-symbols-outlined text-6xl">query_stats</span>
                            </div>
                            <p className="text-[11px] font-black text-secondary uppercase tracking-[0.4em] leading-relaxed max-w-sm mx-auto">
                                No active forecast payload.<br/>Initiate neural link to anticipate systemic cluster vulnerabilities.
                            </p>
                        </div>
                    )}
                </div>
            </div>
          </div>

          <div className="bg-white rounded-[3.5rem] p-12 shadow-soft border border-border flex flex-col group">
              <div className="flex items-center justify-between mb-16">
                  <span className="text-[11px] font-black text-secondary uppercase tracking-[0.4em]">Sentinel Heartbeat</span>
                  <div className="flex items-center gap-3">
                      <div className="w-3 h-3 rounded-full bg-success animate-pulse shadow-lg shadow-success/40"></div>
                      <span className="text-[10px] font-black uppercase tracking-[0.2em] text-success">Optimized</span>
                  </div>
              </div>
              <div className="flex-1 space-y-10">
                  {alerts.slice(0, 6).map(alert => (
                      <div key={alert.id} className="flex gap-8 group/alert cursor-pointer transition-all hover:translate-x-1" onClick={() => onChangeView('alerts')}>
                          <div className={`w-16 h-16 rounded-3xl shrink-0 flex items-center justify-center border transition-all ${
                              alert.severity === 'Critical' ? 'bg-red-50 text-danger border-red-100 shadow-2xl shadow-red-500/10' : 'bg-gray-50 text-secondary border-gray-100 group-hover/alert:border-primary/20'
                          }`}>
                              <span className={`material-symbols-outlined text-[28px] ${alert.severity === 'Critical' ? 'animate-pulse' : ''}`}>{alert.severity === 'Critical' ? 'emergency' : 'info'}</span>
                          </div>
                          <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between mb-1.5">
                                <p className="text-[10px] font-black text-secondary uppercase tracking-[0.2em] opacity-60 font-mono truncate">{alert.source}</p>
                                <span className="text-[10px] font-black text-secondary/40 uppercase tracking-widest">{alert.time}</span>
                              </div>
                              <p className="text-sm font-bold text-text-main truncate group-hover/alert:text-primary transition-colors tracking-tight leading-snug">{alert.message}</p>
                          </div>
                      </div>
                  ))}
              </div>
              <div className="mt-16 pt-12 border-t border-gray-50">
                  <button onClick={() => onChangeView('alerts')} className="w-full flex items-center justify-center gap-3 text-[11px] font-black text-primary uppercase tracking-[0.3em] hover:gap-5 transition-all group/btn">
                      Sentinel Incident Center
                      <span className="material-symbols-outlined text-[20px] transition-transform group-hover/btn:translate-x-1">arrow_right_alt</span>
                  </button>
              </div>
          </div>
      </div>
    </div>
  );
};

export default Dashboard;
