'use client'

import React, { useState, useEffect, useRef } from 'react';
import { Agent } from '@/lib/types';
import { simulateNodeFailure, analyzeHardwareImage } from '@/actions/ai';
import { useI18n } from '@/contexts/I18nContext';

interface InfrastructureProps {
    agents: Agent[];
    onShowToast: (message: string, type: 'success' | 'error' | 'info') => void;
}

const GlobalNodeMap: React.FC<{ agents: Agent[] }> = ({ agents }) => {
    const { tr } = useI18n();
    const regions = [
        { id: 'us-east', name: 'Americas', x: 22, y: 38, color: '#0071E3' },
        { id: 'eu-west', name: 'Europe', x: 48, y: 32, color: '#34C759' },
        { id: 'asia-east', name: 'APAC', x: 78, y: 48, color: '#FF9F0A' },
        { id: 'sa-east', name: 'LatAm', x: 30, y: 68, color: '#FF3B30' },
    ];

    return (
        <div className="relative w-full h-full bg-[#020617] rounded-[3.5rem] overflow-hidden flex items-center justify-center p-20 group ring-1 ring-white/5 shadow-2xl">
            <div className="absolute inset-0 opacity-10 pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]"></div>

            <svg viewBox="0 0 100 100" className="w-full h-full text-white/5 fill-current transition-all duration-2000 group-hover:scale-[1.02]">
                <path d="M12,40 Q15,35 25,32 T40,35 T55,30 T75,35 T90,45 L85,65 Q75,75 55,72 T35,78 T10,65 Z" fill="rgba(255,255,255,0.015)" />
                <path d="M45,20 Q55,15 65,22 T80,30 L75,40 Q65,45 50,40 Z" fill="rgba(255,255,255,0.015)" />

                {/* Global Data Highways */}
                <path d="M22,38 Q35,30 48,32" fill="none" stroke="rgba(0,113,227,0.5)" strokeWidth="0.4" strokeDasharray="2 4" className="animate-pulse" />
                <path d="M48,32 Q63,40 78,48" fill="none" stroke="rgba(52,199,89,0.5)" strokeWidth="0.4" strokeDasharray="2 4" className="animate-pulse" />
                <path d="M22,38 Q25,53 30,68" fill="none" stroke="rgba(255,59,48,0.5)" strokeWidth="0.4" strokeDasharray="2 4" className="animate-pulse" />
            </svg>

            {regions.map(r => (
                <div key={r.id} className="absolute text-[10px] font-black text-white/40 uppercase tracking-[0.5em] pointer-events-none" style={{ left: `${r.x}%`, top: `${r.y - 10}%` }}>
                    {tr(r.name)}
                </div>
            ))}

            {agents.map((agent) => {
                const getPos = (a: Agent) => {
                    if (a.name.includes('US')) return { x: 22, y: 38 };
                    if (a.name.includes('Europe')) return { x: 48, y: 32 };
                    if (a.name.includes('Database')) return { x: 78, y: 48 };
                    return { x: 30, y: 68 };
                };
                const { x, y } = getPos(agent);
                const isOnline = agent.status === 'Online';
                return (
                    <div key={agent.id} className="absolute group/node cursor-pointer" style={{ left: `${x}%`, top: `${y}%` }}>
                        <div className="relative flex items-center justify-center">
                            <div className={`absolute w-10 h-10 rounded-full animate-ping opacity-20 ${isOnline ? 'bg-[#0071E3]' : 'bg-[#FF3B30]'}`}></div>
                            <div className={`w-5 h-5 rounded-full shadow-2xl relative z-10 border border-white/50 transition-all group-hover/node:scale-150 ${isOnline ? 'bg-[#0071E3]' : 'bg-[#FF3B30]'}`}></div>
                        </div>
                    </div>
                );
            })}
        </div>
    );
};

const Infrastructure: React.FC<InfrastructureProps> = ({ agents, onShowToast }) => {
    const { tr } = useI18n();
    const [viewMode, setViewMode] = useState<'topology' | 'map' | 'inspector'>('topology');
    const [selectedNode, setSelectedNode] = useState<Agent | null>(null);

    const [isTelemetryFlowOn, setIsTelemetryFlowOn] = useState(false);
    const [isSimulatingFailure, setIsSimulatingFailure] = useState(false);
    const [failureAnalysis, setFailureAnalysis] = useState<string | null>(null);

    // Inspector States
    const [isCameraActive, setIsCameraActive] = useState(false);
    const [uploadedImage, setUploadedImage] = useState<string | null>(null);
    const [isAnalyzingImage, setIsAnalyzingImage] = useState(false);
    const [imageAnalysis, setImageAnalysis] = useState<string | null>(null);

    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

    useEffect(() => {
        const update = () => {
            if (containerRef.current) {
                setDimensions({ width: containerRef.current.clientWidth, height: containerRef.current.clientHeight });
            }
        };
        update();
        window.addEventListener('resize', update);
        return () => window.removeEventListener('resize', update);
    }, [viewMode]);

    const startCamera = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                setIsCameraActive(true);
            }
        } catch (err) {
            onShowToast(tr('Vision sync failed: Camera permission required.'), 'error');
        }
    };

    const stopCamera = () => {
        if (videoRef.current && videoRef.current.srcObject) {
            const stream = videoRef.current.srcObject as MediaStream;
            stream.getTracks().forEach(track => track.stop());
            videoRef.current.srcObject = null;
            setIsCameraActive(false);
        }
    };

    const captureAndAnalyze = () => {
        if (canvasRef.current && videoRef.current) {
            const context = canvasRef.current.getContext('2d');
            canvasRef.current.width = videoRef.current.videoWidth;
            canvasRef.current.height = videoRef.current.videoHeight;
            context?.drawImage(videoRef.current, 0, 0);
            const base64 = canvasRef.current.toDataURL('image/jpeg');
            setUploadedImage(base64);
            analyzeHardware(base64);
            stopCamera();
        }
    };

    const handleSimulateFailure = async () => {
        if (!selectedNode) return;
        setIsSimulatingFailure(true);
        setFailureAnalysis(null);
        try {
            const result = await simulateNodeFailure(selectedNode.name, selectedNode.ip);
            setFailureAnalysis(result);
            onShowToast(tr('Sim-X Projection synchronized.'), 'info');
        } catch (err) { onShowToast(tr('Neural sim interrupted.'), 'error'); } finally { setIsSimulatingFailure(false); }
    };

    const analyzeHardware = async (base64: string) => {
        setIsAnalyzingImage(true);
        setImageAnalysis(null);
        try {
            const data = base64.split(',')[1];
            const result = await analyzeHardwareImage(data);
            setImageAnalysis(result);
            onShowToast(tr('Physical Audit synchronized.'), 'success');
        } catch (err) { onShowToast(tr('Neural Vision handshake failed.'), 'error'); } finally { setIsAnalyzingImage(false); }
    };

    const activeNodes = agents.filter(a => a.status !== 'Offline');
    const centerX = dimensions.width / 2;
    const centerY = dimensions.height / 2;
    const radius = Math.min(dimensions.width, dimensions.height) * 0.38;

    return (
        <div className="h-full flex flex-col space-y-12 animate-fade-in pb-16">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-8">
                <div className="space-y-3">
                    <h2 className="text-5xl font-black text-text-main tracking-tighter uppercase">{tr('Topology Mesh')}</h2>
                    <p className="text-secondary text-base font-medium">{tr('Interactive neural topology explorer for distributed infrastructure visualization.')}</p>
                </div>
                <div className="bg-[#F5F5F7] p-2 rounded-[1.75rem] flex gap-2 shadow-inner border border-[#E5E5EA]">
                    <button onClick={() => setViewMode('topology')} className={`px-10 py-3.5 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all ${viewMode === 'topology' ? 'bg-white shadow-soft text-primary' : 'text-secondary hover:text-text-main'}`}>{tr('Mesh Grid')}</button>
                    <button onClick={() => setViewMode('map')} className={`px-10 py-3.5 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all ${viewMode === 'map' ? 'bg-white shadow-soft text-primary' : 'text-secondary hover:text-text-main'}`}>{tr('Global Map')}</button>
                    <button onClick={() => setViewMode('inspector')} className={`px-10 py-3.5 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all ${viewMode === 'inspector' ? 'bg-white shadow-soft text-primary' : 'text-secondary hover:text-text-main'}`}>{tr('HW Vision')}</button>
                </div>
            </div>

            <div className="flex-1 bg-white rounded-[4rem] border border-[#E5E5EA] shadow-soft relative overflow-hidden flex flex-col lg:flex-row min-h-[700px]">
                <div className="flex-1 relative bg-[#FBFBFD]" ref={containerRef}>
                    {viewMode === 'topology' && (
                        <>
                            <div className="absolute top-12 left-12 z-30">
                                <button onClick={() => setIsTelemetryFlowOn(!isTelemetryFlowOn)} className={`px-8 py-4 rounded-[1.5rem] text-[11px] font-black uppercase tracking-[0.3em] transition-all flex items-center gap-4 border shadow-soft ${isTelemetryFlowOn ? 'bg-primary border-primary text-white shadow-primary/30' : 'bg-white border-[#E5E5EA] text-[#86868B] hover:border-primary/40'}`}>
                                    <span className={`material-symbols-outlined text-[22px] ${isTelemetryFlowOn ? 'animate-pulse' : ''}`}>online_prediction</span>
                                    {isTelemetryFlowOn ? tr('Live Telemetry Active') : tr('Enable Neural Flow')}
                                </button>
                            </div>
                            <svg className="w-full h-full absolute inset-0">
                                {activeNodes.map((agent, i) => {
                                    const angle = (i / activeNodes.length) * Math.PI * 2;
                                    const tx = centerX + Math.cos(angle) * radius;
                                    const ty = centerY + Math.sin(angle) * radius;
                                    const isActive = selectedNode?.id === agent.id;
                                    return (
                                        <g key={`mesh-group-${agent.id}`}>
                                            <line x1={centerX} y1={centerY} x2={tx} y2={ty} stroke={isActive ? '#0071E3' : '#E5E5EA'} strokeWidth={isActive ? 5 : 2} className="transition-all duration-1000" strokeDasharray={isTelemetryFlowOn ? "14 7" : "none"} />
                                            {isTelemetryFlowOn && (
                                                <circle r="5" fill="#0071E3" className="animate-ping opacity-50 shadow-2xl shadow-primary/50">
                                                    <animateMotion dur={`${1.2 + Math.random() * 1.5}s`} repeatCount="indefinite" path={`M ${centerX} ${centerY} L ${tx} ${ty}`} />
                                                </circle>
                                            )}
                                        </g>
                                    );
                                })}
                            </svg>
                            <div className="absolute z-10" style={{ left: centerX, top: centerY, transform: 'translate(-50%, -50%)' }}>
                                <div className="w-32 h-32 bg-primary rounded-[3.5rem] flex items-center justify-center text-white shadow-2xl ring-[18px] ring-primary/5 group cursor-pointer hover:scale-105 transition-transform">
                                    <span className="material-symbols-outlined text-6xl filled group-hover:scale-110 transition-transform">hub</span>
                                </div>
                            </div>
                            {activeNodes.map((agent, i) => {
                                const angle = (i / activeNodes.length) * Math.PI * 2;
                                const tx = centerX + Math.cos(angle) * radius;
                                const ty = centerY + Math.sin(angle) * radius;
                                return (
                                    <button key={agent.id} onClick={() => setSelectedNode(agent)} className={`absolute z-20 -translate-x-1/2 -translate-y-1/2 transition-all duration-700 ${selectedNode?.id === agent.id ? 'scale-125' : 'hover:scale-110'}`} style={{ left: tx, top: ty }}>
                                        <div className={`w-20 h-20 rounded-[2rem] flex items-center justify-center shadow-2xl border-2 transition-all ${selectedNode?.id === agent.id ? 'bg-primary border-primary text-white' : 'bg-white text-secondary border-[#E5E5EA]'}`}>
                                            <span className="material-symbols-outlined text-[32px]">dns</span>
                                        </div>
                                        <span className="absolute top-full left-1/2 -translate-x-1/2 mt-5 whitespace-nowrap text-[11px] font-black text-secondary uppercase tracking-[0.25em] bg-white/90 backdrop-blur-2xl px-5 py-2.5 rounded-2xl border border-[#E5E5EA] shadow-soft opacity-0 group-hover:opacity-100 transition-all pointer-events-none">{agent.name}</span>
                                    </button>
                                );
                            })}
                        </>
                    )}

                    {viewMode === 'map' && <GlobalNodeMap agents={activeNodes} />}

                    {viewMode === 'inspector' && (
                        <div className="flex-1 p-24 overflow-y-auto flex flex-col items-center custom-scrollbar">
                            <div className="max-w-5xl w-full space-y-20">
                                <div className="text-center space-y-6">
                                    <h3 className="text-5xl font-black text-text-main tracking-tighter uppercase">{tr('Hardware Vision Audit')}</h3>
                                    <p className="text-secondary text-lg font-medium max-w-3xl mx-auto leading-relaxed">{tr('AI-powered physical infrastructure diagnostics via remote visual sync. Capture hardware logic frames for high-fidelity health assessment.')}</p>
                                </div>

                                {isCameraActive ? (
                                    <div className="relative rounded-[4.5rem] overflow-hidden bg-black aspect-video shadow-2xl border border-[#E5E5EA] group ring-1 ring-white/10">
                                        <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover grayscale brightness-125 contrast-110" />
                                        <canvas ref={canvasRef} className="hidden" />
                                        <div className="absolute inset-0 border-[40px] border-white/5 pointer-events-none"></div>
                                        <div className="absolute top-1/2 left-0 right-0 h-[2px] bg-red-500/50 animate-pulse shadow-2xl shadow-red-500/60"></div>
                                        <div className="absolute bottom-16 left-0 right-0 flex justify-center gap-10">
                                            <button onClick={captureAndAnalyze} className="px-14 py-6 bg-primary text-white rounded-[1.75rem] font-black text-[12px] uppercase tracking-[0.4em] shadow-3xl shadow-primary/40 hover:bg-primary-hover active:scale-95 transition-all">{tr('Capture Logic Frame')}</button>
                                            <button onClick={stopCamera} className="px-14 py-6 bg-white/10 text-white rounded-[1.75rem] font-black text-[12px] uppercase tracking-[0.4em] border border-white/20 backdrop-blur-3xl hover:bg-white/20 transition-all">{tr('Terminate Stream')}</button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                                        <div className="relative group cursor-pointer">
                                            <input type="file" accept="image/*" onChange={(e) => {
                                                const file = e.target.files?.[0];
                                                if(file) {
                                                    const reader = new FileReader();
                                                    reader.onload = (ev) => { const base64 = ev.target?.result as string; setUploadedImage(base64); analyzeHardware(base64); };
                                                    reader.readAsDataURL(file);
                                                }
                                            }} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
                                            <div className="p-28 border-4 border-dashed border-[#E5E5EA] rounded-[4.5rem] bg-white flex flex-col items-center justify-center transition-all group-hover:border-primary group-hover:bg-primary/5 shadow-inner">
                                                <div className="w-32 h-32 bg-[#F5F5F7] rounded-[3rem] flex items-center justify-center text-[#C1C1C1] group-hover:text-primary transition-all">
                                                    <span className="material-symbols-outlined text-8xl">cloud_upload</span>
                                                </div>
                                                <p className="mt-12 text-sm font-black text-text-main uppercase tracking-[0.5em] text-center">{tr('Sync Static Payload')}</p>
                                            </div>
                                        </div>
                                        <button onClick={startCamera} className="p-28 border-4 border-dashed border-[#E5E5EA] rounded-[4.5rem] bg-white flex flex-col items-center justify-center transition-all hover:border-indigo-500 hover:bg-indigo-50 shadow-inner group">
                                            <div className="w-32 h-32 bg-[#F5F5F7] rounded-[3rem] flex items-center justify-center text-[#C1C1C1] group-hover:text-indigo-500 transition-all">
                                                <span className="material-symbols-outlined text-8xl">linked_camera</span>
                                            </div>
                                            <p className="mt-12 text-sm font-black text-text-main uppercase tracking-[0.5em] text-center">{tr('Neural Live-Stream')}</p>
                                        </button>
                                    </div>
                                )}

                                {isAnalyzingImage && (
                                    <div className="p-20 bg-white rounded-[4rem] border border-[#E5E5EA] shadow-soft flex flex-col items-center gap-10 animate-pulse">
                                        <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                                        <p className="text-[12px] font-black text-primary uppercase tracking-[0.6em]">{tr('Synchronizing Vision Logic...')}</p>
                                    </div>
                                )}

                                {uploadedImage && !isAnalyzingImage && (
                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 animate-fade-in-up">
                                        <div className="rounded-[3.5rem] border border-[#E5E5EA] overflow-hidden shadow-2xl bg-white p-6 group">
                                            <img src={uploadedImage} className="w-full h-auto rounded-[2.5rem] grayscale brightness-110 group-hover:grayscale-0 transition-all duration-1000" alt={tr('Hardware Payload')} />
                                        </div>
                                        <div className="bg-[#0F172A] text-white p-20 rounded-[3.5rem] shadow-2xl border border-white/10 overflow-y-auto max-h-[600px] custom-scrollbar flex flex-col">
                                            <div className="flex items-center gap-6 mb-16 border-b border-white/10 pb-12 shrink-0">
                                                <div className="w-20 h-20 bg-success text-white rounded-[2rem] flex items-center justify-center shadow-2xl shadow-success/40 ring-1 ring-white/10"><span className="material-symbols-outlined text-5xl filled">verified</span></div>
                                                <div>
                                                    <h4 className="text-[14px] font-black uppercase tracking-[0.4em] text-indigo-300">{tr('Vision Diagnostic Audit')}</h4>
                                                    <p className="text-white/40 text-[11px] font-black uppercase mt-3">{tr('SRE Grade: Optimized Physical Layer')}</p>
                                                </div>
                                            </div>
                                            <div className="text-[17px] text-white/90 leading-[2.2] font-medium whitespace-pre-wrap font-sans">{imageAnalysis || tr('Handshaking with neural vision mesh...')}</div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                <div className="w-full lg:w-[520px] border-t lg:border-t-0 lg:border-l border-[#E5E5EA] bg-[#F5F5F7]/40 p-16 flex flex-col overflow-y-auto custom-scrollbar">
                    <h3 className="font-black text-text-main text-[12px] uppercase tracking-[0.6em] mb-16">{tr('Neural Cluster Profile')}</h3>
                    {selectedNode ? (
                        <div className="space-y-16 animate-fade-in">
                            <div className="p-12 bg-white rounded-[3.5rem] border border-[#E5E5EA] shadow-soft group relative overflow-hidden">
                                <div className="absolute top-0 right-0 p-12 opacity-5 group-hover:scale-110 transition-transform"><span className="material-symbols-outlined text-[120px] text-primary">dns</span></div>
                                <p className="text-[11px] uppercase font-black text-secondary mb-5 tracking-[0.5em]">{tr('Entity Identifier')}</p>
                                <p className="text-4xl font-black text-primary tracking-tighter truncate">{selectedNode.name}</p>
                                <div className="mt-14 space-y-10">
                                    <div className="flex justify-between items-center text-[12px] font-black uppercase tracking-widest text-secondary"><span>{tr('Mesh Integrity')}</span><span className="text-success flex items-center gap-3"><div className="w-2 h-2 rounded-full bg-success"></div>{tr('OPTIMIZED')}</span></div>
                                    <div className="flex justify-between items-center text-[12px] font-black uppercase tracking-widest text-secondary"><span>{tr('Cluster Uptime')}</span><span className="text-text-main">99.982%</span></div>
                                    <div className="flex justify-between items-center text-[12px] font-black uppercase tracking-widest text-secondary"><span>{tr('Global Endpoint')}</span><span className="text-text-main font-mono opacity-60 tracking-tight">{selectedNode.ip}</span></div>
                                </div>
                            </div>
                            <div className="space-y-6">
                                <button onClick={handleSimulateFailure} disabled={isSimulatingFailure} className="w-full py-7 bg-danger text-white rounded-[2rem] font-black text-[12px] uppercase tracking-[0.5em] hover:bg-danger/90 transition-all shadow-2xl shadow-danger/40 active:scale-95 disabled:opacity-50">
                                    {isSimulatingFailure ? tr('Initializing Sim-X...') : tr('Execute Failure Sim-X')}
                                </button>
                                {failureAnalysis && (
                                    <div className="p-12 bg-red-50/90 border border-red-200 rounded-[3.5rem] text-[14px] text-red-950 leading-relaxed font-bold animate-fade-in-up shadow-inner backdrop-blur-3xl">
                                        <div className="flex items-center gap-5 mb-8 text-danger"><span className="material-symbols-outlined text-[28px] filled">emergency_home</span><span className="text-[12px] uppercase tracking-[0.4em] font-black">{tr('Risk Projection Audit')}</span></div>
                                        <div className="prose prose-sm text-red-900 font-medium">
                                            {failureAnalysis}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center text-center p-20 space-y-12 opacity-20 grayscale">
                            <div className="w-32 h-32 bg-[#E5E5EA] rounded-full flex items-center justify-center text-secondary"><span className="material-symbols-outlined text-8xl">ads_click</span></div>
                            <p className="text-[13px] font-black text-secondary uppercase tracking-[0.6em] leading-[3.2]">{tr('Await Target Selection for')}<br/>{tr('High-Fidelity Neural Profile')}</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Infrastructure;
