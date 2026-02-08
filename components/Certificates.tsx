
import React, { useState } from 'react';
import { Certificate } from '../types';
import { GoogleGenAI } from "@google/genai";

interface CertificatesProps {
  certificates: Certificate[];
  onAddCertificate: (cert: Certificate) => void;
  onDeleteCertificate: (id: string) => void;
  onRenewCertificate: (id: string) => void;
  onShowToast: (message: string, type: 'success' | 'error' | 'info') => void;
}

const Certificates: React.FC<CertificatesProps> = ({ certificates, onAddCertificate, onDeleteCertificate, onRenewCertificate, onShowToast }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newCert, setNewCert] = useState({ domain: '', issuer: '', expiry: '' });
  const [detailCert, setDetailCert] = useState<Certificate | null>(null);

  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<string | null>(null);

  const filteredCertificates = certificates.filter(cert => 
    cert.domain.toLowerCase().includes(searchTerm.toLowerCase()) || 
    cert.issuer.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAnalyzeTrust = async (cert: Certificate) => {
    setIsAnalyzing(true);
    setAnalysisResult(null);
    try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const prompt = `Perform a high-density neural security audit for domain "${cert.domain}" issued by "${cert.issuer}". Current state: expiring in ${cert.daysRemaining} days. Identify trust chain vulnerabilities, cipher suite drift, and provide an SRE grade (A-F).`;
        const response = await ai.models.generateContent({ model: 'gemini-3-flash-preview', contents: prompt });
        setAnalysisResult(response.text || 'Handshake synchronization empty.');
    } catch (err) { onShowToast('Neural audit handshake failed.', 'error'); } finally { setIsAnalyzing(false); }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cert: Certificate = {
      id: Math.random().toString(36).substr(2, 9),
      domain: newCert.domain,
      issuer: newCert.issuer,
      status: 'Valid',
      expiryDate: new Date(newCert.expiry).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      daysRemaining: Math.floor((new Date(newCert.expiry).getTime() - new Date().getTime()) / (1000 * 3600 * 24)),
      lastCheck: 'Just now'
    };
    onAddCertificate(cert);
    setIsModalOpen(false);
    setNewCert({ domain: '', issuer: '', expiry: '' });
    onShowToast(`Monitor active for ${cert.domain}.`, 'success');
  };

  return (
    <div className="space-y-12 animate-fade-in pb-20">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-8">
        <div className="space-y-3">
          <h2 className="text-5xl font-black text-text-main tracking-tighter uppercase">Trust Perimeter</h2>
          <p className="text-secondary text-base font-medium">Global lifecycle management for TLS/SSL credentials and distributed trust chains.</p>
        </div>
        <div className="flex items-center gap-4">
           <div className="relative group">
            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-secondary text-[22px] group-focus-within:text-primary transition-colors">search</span>
            <input type="text" placeholder="Filter domains..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-12 pr-6 py-3.5 bg-white border border-border rounded-2xl text-sm w-72 shadow-soft focus:ring-8 focus:ring-primary/5 transition-all outline-none font-bold" />
          </div>
          <button onClick={() => setIsModalOpen(true)} className="flex items-center gap-3 bg-primary text-white px-10 py-3.5 rounded-2xl text-[11px] font-black uppercase tracking-widest shadow-2xl shadow-primary/30 hover:bg-primary-hover active:scale-95 transition-all">
            <span className="material-symbols-outlined text-[24px]">add_moderator</span>
            Deploy Monitor
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        {[
            { label: 'Domains Protected', val: certificates.length, color: 'text-text-main', icon: 'verified_user' },
            { label: 'Secure Gradient', val: certificates.filter(c => c.status === 'Valid').length, color: 'text-success', icon: 'shield_with_heart' },
            { label: 'Expiring Soon', val: certificates.filter(c => c.status === 'Expiring').length, color: 'text-warning', icon: 'notification_important' },
            { label: 'TTL Overdue', val: certificates.filter(c => c.status === 'Expired').length, color: 'text-danger', icon: 'error' }
        ].map(stat => (
            <div key={stat.label} className="bg-white p-10 rounded-[3rem] border border-border shadow-soft group hover:border-primary/20 transition-all flex flex-col justify-between h-48 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:scale-110 transition-transform"><span className={`material-symbols-outlined text-8xl ${stat.color}`}>{stat.icon}</span></div>
                <p className="text-[11px] font-black text-secondary uppercase tracking-[0.4em] relative z-10">{stat.label}</p>
                <div className="flex items-end justify-between relative z-10">
                    <span className={`text-6xl font-black ${stat.color} tracking-tighter`}>{stat.val}</span>
                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all group-hover:scale-110 group-hover:shadow-xl ${stat.color} bg-gray-50`}><span className="material-symbols-outlined text-[32px]">{stat.icon}</span></div>
                </div>
            </div>
        ))}
      </div>

      <div className="bg-white rounded-[3.5rem] shadow-soft border border-border overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead className="bg-[#FBFBFD] border-b border-border">
            <tr>
              <th className="py-7 px-12 text-[11px] font-black text-secondary uppercase tracking-[0.4em]">Domain Endpoint</th>
              <th className="py-7 px-12 text-[11px] font-black text-secondary uppercase tracking-[0.4em]">Trust Integrity</th>
              <th className="py-7 px-12 text-[11px] font-black text-secondary uppercase tracking-[0.4em]">CA Entity</th>
              <th className="py-7 px-12 text-[11px] font-black text-secondary uppercase tracking-[0.4em]">TTL Remaining</th>
              <th className="py-7 px-12 w-16"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {filteredCertificates.length > 0 ? filteredCertificates.map((cert) => (
              <tr key={cert.id} className="hover:bg-gray-50/50 transition-all group cursor-pointer" onClick={() => setDetailCert(cert)}>
                <td className="py-8 px-12"><span className="text-base font-black text-text-main font-mono tracking-tight group-hover:text-primary transition-colors">{cert.domain}</span></td>
                <td className="py-8 px-12">
                  <div className={`inline-flex items-center gap-3 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border-2 ${cert.status === 'Valid' ? 'bg-green-50 text-success border-green-100 shadow-sm' : cert.status === 'Expiring' ? 'bg-orange-50 text-warning border-orange-100 shadow-sm' : 'bg-red-50 text-danger border-red-100 shadow-sm'}`}>
                    <span className={`w-2 h-2 rounded-full ${cert.status === 'Valid' ? 'bg-success animate-pulse shadow-lg shadow-success/40' : 'bg-danger'}`}></span>
                    {cert.status}
                  </div>
                </td>
                <td className="py-8 px-12 text-[12px] font-bold text-secondary uppercase tracking-widest opacity-60">{cert.issuer}</td>
                <td className="py-8 px-12">
                    <div className="flex flex-col">
                        <span className={`text-lg font-black tracking-tight ${cert.daysRemaining < 15 ? 'text-danger' : 'text-text-main'}`}>{cert.daysRemaining} Days</span>
                        <span className="text-[10px] text-secondary font-black uppercase tracking-widest mt-1 opacity-40">{cert.expiryDate}</span>
                    </div>
                </td>
                <td className="py-8 px-12 text-right">
                  <span className="material-symbols-outlined text-gray-200 group-hover:text-primary transition-all group-hover:translate-x-3 text-[28px]">arrow_right_alt</span>
                </td>
              </tr>
            )) : (
                <tr>
                    <td colSpan={5} className="py-32 text-center opacity-30">
                        <div className="flex flex-col items-center gap-6">
                            <span className="material-symbols-outlined text-6xl">linked_services</span>
                            <p className="text-[12px] font-black uppercase tracking-[0.5em]">No matching trust assets identified.</p>
                        </div>
                    </td>
                </tr>
            )}
          </tbody>
        </table>
      </div>

      {detailCert && (
        <div className="fixed inset-0 z-[110] flex justify-end">
            <div className="absolute inset-0 bg-[#020617]/80 backdrop-blur-md animate-fade-in" onClick={() => { setDetailCert(null); setAnalysisResult(null); }}></div>
            <div className="relative w-full max-w-2xl bg-white h-full shadow-3xl border-l border-border p-16 animate-slide-in-right flex flex-col overflow-hidden">
                <div className="flex justify-between items-start mb-16">
                    <div className="space-y-2">
                        <h3 className="text-3xl font-black text-text-main tracking-tighter uppercase leading-none">Trust Analysis</h3>
                        <p className="text-[11px] font-black text-secondary tracking-[0.4em] uppercase font-mono opacity-50">{detailCert.domain}</p>
                    </div>
                    <button onClick={() => { setDetailCert(null); setAnalysisResult(null); }} className="w-12 h-12 flex items-center justify-center text-secondary hover:text-text-main bg-gray-50 rounded-2xl transition-all"><span className="material-symbols-outlined">close</span></button>
                </div>

                <div className="flex-1 overflow-y-auto custom-scrollbar pr-4 space-y-14">
                    <div className="p-12 bg-gradient-to-br from-indigo-50/50 to-white rounded-[3.5rem] border border-indigo-100 shadow-soft relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-12 opacity-5 group-hover:scale-110 transition-transform"><span className="material-symbols-outlined text-[150px] text-primary">verified</span></div>
                        <p className="text-[11px] font-black text-primary uppercase tracking-[0.5em] mb-8">Asset Telemetry</p>
                        <div className="grid grid-cols-2 gap-10">
                            <div className="space-y-2">
                                <p className="text-[10px] text-secondary uppercase font-black tracking-widest opacity-40">Status</p>
                                <p className="text-xl font-black text-indigo-950 uppercase tracking-tight">{detailCert.status}</p>
                            </div>
                            <div className="space-y-2 text-right">
                                <p className="text-[10px] text-secondary uppercase font-black tracking-widest opacity-40">TTL</p>
                                <p className="text-xl font-black text-indigo-950 tracking-tight">{detailCert.daysRemaining} Days</p>
                            </div>
                            <div className="space-y-2">
                                <p className="text-[10px] text-secondary uppercase font-black tracking-widest opacity-40">Authority</p>
                                <p className="text-[13px] font-black text-indigo-950 uppercase tracking-widest">{detailCert.issuer}</p>
                            </div>
                            <div className="space-y-2 text-right">
                                <p className="text-[10px] text-secondary uppercase font-black tracking-widest opacity-40">Last Sync</p>
                                <p className="text-[13px] font-black text-indigo-950 uppercase tracking-widest">{detailCert.lastCheck}</p>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-8">
                        <div className="flex items-center justify-between">
                            <h5 className="text-[11px] uppercase font-black text-secondary tracking-[0.5em]">Neural Trust Audit</h5>
                            <button onClick={() => handleAnalyzeTrust(detailCert)} disabled={isAnalyzing} className="text-[11px] font-black text-primary uppercase tracking-widest flex items-center gap-3 disabled:opacity-50 group/audit">
                                <span className={`material-symbols-outlined text-[20px] ${isAnalyzing ? 'animate-spin' : ''}`}>auto_awesome</span>
                                {isAnalyzing ? 'Synchronizing...' : 'Refresh Neural Audit'}
                            </button>
                        </div>
                        
                        {analysisResult ? (
                            <div className="p-12 bg-[#0F172A] text-white rounded-[3rem] border border-white/5 shadow-3xl animate-fade-in-up relative overflow-hidden group">
                                <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none group-hover:scale-110 transition-transform"><span className="material-symbols-outlined text-[120px]">psychology</span></div>
                                <div className="text-[15px] leading-[2.2] text-indigo-100/90 font-medium whitespace-pre-wrap relative z-10 prose prose-invert">{analysisResult}</div>
                            </div>
                        ) : isAnalyzing ? (
                            <div className="space-y-6 animate-pulse">
                                <div className="h-6 bg-gray-50 rounded-full w-full"></div>
                                <div className="h-6 bg-gray-50 rounded-full w-[94%]"></div>
                                <div className="h-6 bg-gray-50 rounded-full w-[88%]"></div>
                            </div>
                        ) : (
                            <div className="p-24 border-4 border-dashed border-gray-100 rounded-[3.5rem] text-center space-y-8 group hover:border-primary/20 transition-all">
                                <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto text-gray-300 group-hover:text-primary transition-colors"><span className="material-symbols-outlined text-4xl">security</span></div>
                                <p className="text-[11px] font-black text-secondary uppercase tracking-[0.5em] leading-[2.5]">Establish neural link for high-fidelity<br/>trust chain vulnerability assessment</p>
                            </div>
                        )}
                    </div>
                </div>

                <div className="pt-12 border-t border-border flex gap-5">
                    <button onClick={() => { onRenewCertificate(detailCert.id); setDetailCert(null); }} className="flex-1 py-6 bg-primary text-white rounded-[2rem] font-black text-[11px] uppercase tracking-[0.4em] shadow-3xl shadow-primary/40 hover:bg-primary-hover active:scale-95 transition-all">Renew Trust Asset</button>
                    <button onClick={() => { onDeleteCertificate(detailCert.id); setDetailCert(null); }} className="px-10 py-6 border-2 border-border rounded-[2rem] font-black text-[11px] uppercase tracking-[0.4em] text-danger hover:bg-red-50 hover:border-red-100 transition-all active:scale-95">Decommission</button>
                </div>
            </div>
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 z-[130] flex items-center justify-center p-8">
          <div className="absolute inset-0 bg-[#0F172A]/80 backdrop-blur-xl animate-fade-in" onClick={() => setIsModalOpen(false)}></div>
          <div className="relative bg-white rounded-[4rem] shadow-3xl w-full max-w-xl p-16 animate-fade-in-up border border-white/20 ring-1 ring-black/5">
            <div className="flex items-center gap-6 mb-12">
                <div className="w-16 h-16 bg-primary/5 rounded-2xl flex items-center justify-center text-primary shadow-inner"><span className="material-symbols-outlined text-4xl">add_moderator</span></div>
                <h3 className="text-3xl font-black text-text-main tracking-tighter uppercase leading-none">Provision Monitor</h3>
            </div>
            <form onSubmit={handleSubmit} className="space-y-10">
              <div className="space-y-3">
                  <label className="block text-[11px] font-black text-secondary uppercase tracking-[0.4em] ml-1 opacity-50">FQDN / Endpoint Identifier</label>
                  <input required type="text" value={newCert.domain} onChange={(e) => setNewCert({...newCert, domain: e.target.value})} placeholder="e.g. sentinel.oxmon.io" className="w-full px-8 py-5 rounded-[2rem] bg-gray-50 border border-border outline-none focus:ring-8 focus:ring-primary/5 focus:bg-white transition-all text-base font-bold placeholder:text-gray-300" />
              </div>
              <div className="space-y-3">
                  <label className="block text-[11px] font-black text-secondary uppercase tracking-[0.4em] ml-1 opacity-50">CA Issuing Authority</label>
                  <input required type="text" value={newCert.issuer} onChange={(e) => setNewCert({...newCert, issuer: e.target.value})} placeholder="e.g. DigiCert Global G2" className="w-full px-8 py-5 rounded-[2rem] bg-gray-50 border border-border outline-none focus:ring-8 focus:ring-primary/5 focus:bg-white transition-all text-base font-bold placeholder:text-gray-300" />
              </div>
              <div className="space-y-3">
                  <label className="block text-[11px] font-black text-secondary uppercase tracking-[0.4em] ml-1 opacity-50">Handshake Expiry</label>
                  <input required type="date" value={newCert.expiry} onChange={(e) => setNewCert({...newCert, expiry: e.target.value})} className="w-full px-8 py-5 rounded-[2rem] bg-gray-50 border border-border outline-none focus:ring-8 focus:ring-primary/5 focus:bg-white transition-all text-base font-bold" />
              </div>
              <div className="flex justify-end gap-5 pt-8">
                  <button type="button" onClick={() => setIsModalOpen(false)} className="px-8 py-5 rounded-2xl text-[11px] font-black uppercase tracking-[0.4em] text-secondary hover:text-text-main transition-colors">Discard</button>
                  <button type="submit" className="px-12 py-5 rounded-[2rem] bg-primary text-white font-black text-[11px] uppercase tracking-[0.4em] shadow-3xl shadow-primary/30 hover:bg-primary-hover active:scale-95 transition-all">Enable Monitor</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Certificates;
