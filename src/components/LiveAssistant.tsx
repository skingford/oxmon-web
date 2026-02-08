'use client'

import React, { useState, useEffect, useRef } from 'react';
import { GoogleGenAI, LiveServerMessage, Modality, Type, FunctionDeclaration } from '@google/genai';
import { Agent, Alert, Certificate } from '@/lib/types';

interface LiveAssistantProps {
  isOpen: boolean;
  onClose: () => void;
  agents: Agent[];
  alerts: Alert[];
  certificates: Certificate[];
  onUpdateAgentStatus: (id: string) => void;
  onAcknowledgeAlert: (id: string) => void;
}

const LiveAssistant: React.FC<LiveAssistantProps> = ({
  isOpen,
  onClose,
  agents,
  alerts,
  certificates,
  onUpdateAgentStatus,
  onAcknowledgeAlert
}) => {
  const [isActive, setIsActive] = useState(false);
  const [transcriptions, setTranscriptions] = useState<{ type: 'user' | 'model', text: string }[]>([]);
  const [isConnecting, setIsConnecting] = useState(false);

  const audioContextRef = useRef<AudioContext | null>(null);
  const inputAudioContextRef = useRef<AudioContext | null>(null);
  const nextStartTimeRef = useRef(0);
  const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  const sessionRef = useRef<any>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
        scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [transcriptions]);

  // Define tools for the AI
  const controlAgentTool: FunctionDeclaration = {
    name: 'control_agent',
    parameters: {
      type: Type.OBJECT,
      description: 'Toggle the maintenance/online status of a specific infrastructure agent.',
      properties: {
        agentId: { type: Type.STRING, description: 'The unique ID of the agent.' },
        action: { type: Type.STRING, enum: ['toggle'], description: 'The action to perform.' }
      },
      required: ['agentId', 'action']
    }
  };

  const acknowledgeAlertTool: FunctionDeclaration = {
    name: 'acknowledge_alert',
    parameters: {
      type: Type.OBJECT,
      description: 'Acknowledge and resolve a specific system alert.',
      properties: {
        alertId: { type: Type.STRING, description: 'The unique ID of the alert.' }
      },
      required: ['alertId']
    }
  };

  const startSession = async () => {
    setIsConnecting(true);
    setTranscriptions([{ type: 'model', text: 'Initializing high-fidelity neural link...' }]);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.NEXT_PUBLIC_GEMINI_API_KEY });

      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      inputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      const sessionPromise = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-12-2025',
        callbacks: {
          onopen: () => {
            setIsActive(true);
            setIsConnecting(false);
            setTranscriptions(prev => [...prev, { type: 'model', text: 'Oxmon Sentinel Link established. Awaiting voice directives.' }]);

            const source = inputAudioContextRef.current!.createMediaStreamSource(stream);
            const scriptProcessor = inputAudioContextRef.current!.createScriptProcessor(4096, 1, 1);

            scriptProcessor.onaudioprocess = (e) => {
              const inputData = e.inputBuffer.getChannelData(0);
              const l = inputData.length;
              const int16 = new Int16Array(l);
              for (let i = 0; i < l; i++) {
                int16[i] = inputData[i] * 32768;
              }
              const bytes = new Uint8Array(int16.buffer);
              let binary = '';
              for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i]);
              const base64 = btoa(binary);

              sessionPromise.then(session => {
                session.sendRealtimeInput({ media: { data: base64, mimeType: 'audio/pcm;rate=16000' } });
              });
            };

            source.connect(scriptProcessor);
            scriptProcessor.connect(inputAudioContextRef.current!.destination);
          },
          onmessage: async (message: LiveServerMessage) => {
            // Handle Tool Calls
            if (message.toolCall) {
              for (const fc of message.toolCall.functionCalls) {
                // Fix: Cast args to any to access dynamic properties and pass to string-expecting handlers
                if (fc.name === 'control_agent') {
                  onUpdateAgentStatus((fc.args as any).agentId);
                  sessionPromise.then(s => s.sendToolResponse({ functionResponses: { id: fc.id, name: fc.name, response: { result: 'ok' } } }));
                }
                // Fix: Cast args to any to access dynamic properties and pass to string-expecting handlers
                if (fc.name === 'acknowledge_alert') {
                  onAcknowledgeAlert((fc.args as any).alertId);
                  sessionPromise.then(s => s.sendToolResponse({ functionResponses: { id: fc.id, name: fc.name, response: { result: 'ok' } } }));
                }
              }
            }

            // Handle Transcriptions
            if (message.serverContent?.outputTranscription) {
              const text = message.serverContent.outputTranscription.text;
              setTranscriptions(prev => {
                  const last = prev[prev.length - 1];
                  if (last && last.type === 'model') return [...prev.slice(0, -1), { ...last, text: last.text + text }];
                  return [...prev, { type: 'model', text }];
              });
            } else if (message.serverContent?.inputTranscription) {
                const text = message.serverContent.inputTranscription.text;
                setTranscriptions(prev => {
                    const last = prev[prev.length - 1];
                    if (last && last.type === 'user') return [...prev.slice(0, -1), { ...last, text: last.text + text }];
                    return [...prev, { type: 'user', text }];
                });
            }

            // Handle Audio Data
            const audioData = message.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
            if (audioData && audioContextRef.current) {
                const binaryString = atob(audioData);
                const bytes = new Uint8Array(binaryString.length);
                for (let i = 0; i < binaryString.length; i++) bytes[i] = binaryString.charCodeAt(i);
                const dataInt16 = new Int16Array(bytes.buffer);
                const frameCount = dataInt16.length;
                const buffer = audioContextRef.current.createBuffer(1, frameCount, 24000);
                const channelData = buffer.getChannelData(0);
                for (let i = 0; i < frameCount; i++) channelData[i] = dataInt16[i] / 32768.0;

                nextStartTimeRef.current = Math.max(nextStartTimeRef.current, audioContextRef.current.currentTime);
                const source = audioContextRef.current.createBufferSource();
                source.buffer = buffer;
                source.connect(audioContextRef.current.destination);
                source.start(nextStartTimeRef.current);
                nextStartTimeRef.current += buffer.duration;
                sourcesRef.current.add(source);
                source.onended = () => sourcesRef.current.delete(source);
            }

            if (message.serverContent?.interrupted) {
                sourcesRef.current.forEach(s => s.stop());
                sourcesRef.current.clear();
                nextStartTimeRef.current = 0;
            }
          },
          onerror: (e) => {
              setIsActive(false);
              setIsConnecting(false);
          },
          onclose: () => {
              setIsActive(false);
              setIsConnecting(false);
          }
        },
        config: {
          responseModalities: [Modality.AUDIO],
          systemInstruction: `You are the Oxmon Neural Assistant. You monitor global infrastructure.
          Data:
          - Agents: ${JSON.stringify(agents.map(a => ({ id: a.id, name: a.name, status: a.status })))}
          - Alerts: ${JSON.stringify(alerts.filter(a => a.severity !== 'Resolved'))}

          Capabilities:
          - You can toggle agent status using 'control_agent'.
          - You can resolve alerts using 'acknowledge_alert'.

          Voice Persona: Professional, SRE expert, calm, slightly robotic but helpful. Be brief.`,
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Puck' } }
          },
          tools: [{ functionDeclarations: [controlAgentTool, acknowledgeAlertTool] }],
          inputAudioTranscription: {},
          outputAudioTranscription: {}
        }
      });

      sessionRef.current = await sessionPromise;

    } catch (err) {
      setIsConnecting(false);
      setTranscriptions(prev => [...prev, { type: 'model', text: 'Error: Neural handshake failed. Check environment configuration.' }]);
    }
  };

  const stopSession = () => {
    if (sessionRef.current) {
        sessionRef.current.close();
        sessionRef.current = null;
    }
    if (audioContextRef.current) audioContextRef.current.close();
    if (inputAudioContextRef.current) inputAudioContextRef.current.close();
    setIsActive(false);
    setTranscriptions([]);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-[#020617]/80 backdrop-blur-md animate-fade-in" onClick={onClose}></div>
      <div className="relative bg-[#0F172A] w-full max-w-lg rounded-[3rem] shadow-2xl border border-white/10 overflow-hidden flex flex-col h-[650px] animate-fade-in-up ring-1 ring-white/20">
         <div className="p-10 bg-white/5 border-b border-white/10 flex items-center justify-between">
            <div className="flex items-center gap-5">
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-white shadow-2xl transition-all ${isActive ? 'bg-primary shadow-primary/30' : 'bg-white/10'}`}>
                    <span className={`material-symbols-outlined text-[32px] filled ${isActive ? 'animate-pulse' : ''}`}>neurology</span>
                </div>
                <div>
                    <h3 className="text-white font-black text-xs uppercase tracking-[0.25em]">Sentinel Assistant</h3>
                    <p className={`text-[10px] font-black uppercase mt-1 ${isActive ? 'text-success' : isConnecting ? 'text-warning' : 'text-white/40'}`}>{isActive ? 'Neural Link Active' : isConnecting ? 'Handshaking...' : 'Ready for Telemetry'}</p>
                </div>
            </div>
            <button onClick={onClose} className="w-10 h-10 flex items-center justify-center text-gray-500 hover:text-white transition-colors bg-white/5 rounded-xl">
                <span className="material-symbols-outlined">close</span>
            </button>
         </div>

         <div ref={scrollRef} className="flex-1 overflow-y-auto p-10 space-y-6 custom-scrollbar bg-gradient-to-b from-transparent to-black/20">
            {transcriptions.length === 0 && !isConnecting && (
                <div className="h-full flex flex-col items-center justify-center text-center p-8 space-y-8 opacity-40">
                    <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center border border-white/10">
                        <span className="material-symbols-outlined text-5xl text-white">settings_voice</span>
                    </div>
                    <p className="text-white text-xs leading-loose font-medium max-w-xs uppercase tracking-widest">Awaiting neural handshake for real-time infrastructure command & control.</p>
                </div>
            )}
            {transcriptions.map((t, i) => (
                <div key={i} className={`flex ${t.type === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in`}>
                    <div className={`max-w-[85%] px-6 py-4 rounded-[1.5rem] text-sm font-medium leading-relaxed ${t.type === 'user' ? 'bg-primary text-white shadow-xl shadow-primary/20' : 'bg-white/5 text-indigo-100 border border-white/5'}`}>
                        {t.text}
                    </div>
                </div>
            ))}
            {isConnecting && (
                <div className="flex justify-start animate-pulse">
                     <div className="bg-white/5 px-6 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest text-indigo-300 border border-white/5 italic">Initializing high-fidelity stream...</div>
                </div>
            )}
         </div>

         <div className="p-10 bg-white/5 border-t border-white/10 flex flex-col items-center gap-8">
            <div className="flex items-center gap-6">
                {isActive && (
                    <div className="flex items-center gap-3">
                         <div className="flex gap-1.5 h-10 items-center">
                            {[1,2,3,4,3,2,1].map((h, i) => (
                                <div key={i} className="w-1 bg-primary rounded-full animate-pulse" style={{ height: `${h * 6}px`, animationDelay: `${i * 150}ms` }}></div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {!isActive && !isConnecting ? (
                <button
                  onClick={startSession}
                  className="w-full py-5 bg-primary text-white rounded-[1.5rem] font-black text-[10px] uppercase tracking-[0.2em] flex items-center justify-center gap-4 shadow-2xl shadow-primary/30 hover:bg-primary-hover active:scale-95 transition-all"
                >
                    <span className="material-symbols-outlined">mic</span>
                    Initiate Neural Session
                </button>
            ) : isActive ? (
                <button
                  onClick={stopSession}
                  className="w-full py-5 bg-white/5 hover:bg-white/10 text-white rounded-[1.5rem] font-black text-[10px] uppercase tracking-[0.2em] flex items-center justify-center gap-4 border border-white/10 transition-all active:scale-95"
                >
                    <span className="material-symbols-outlined">mic_off</span>
                    Terminate Link
                </button>
            ) : (
                <div className="w-full py-5 bg-primary/20 text-white rounded-[1.5rem] font-black text-[10px] uppercase tracking-[0.2em] flex items-center justify-center gap-4 animate-pulse">
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    Synthesizing Link...
                </div>
            )}
            <p className="text-[9px] text-white/20 uppercase font-black tracking-[0.4em]">Oxmon Native Audio Intelligence v3.1</p>
         </div>
      </div>
    </div>
  );
};

export default LiveAssistant;
