"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { 
  Plus, 
  Globe, 
  Trash2, 
  Shield, 
  Loader2, 
  Info, 
  CheckCircle2, 
  RefreshCw,
  History,
  AlertCircle
} from "lucide-react"
import { api, getApiErrorMessage } from "@/lib/api"
import { CertDomain, CertCheckResult } from "@/types/api"
import { toast } from "sonner"
import { motion, AnimatePresence } from "framer-motion"
import { Badge } from "@/components/ui/badge"
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from "@/components/ui/dialog"

export default function DomainsPage() {
  const [domains, setDomains] = useState<CertDomain[]>([])
  const [loading, setLoading] = useState(true)
  const [adding, setAdding] = useState(false)
  const [checking, setChecking] = useState<string | null>(null)
  const [newDomain, setNewDomain] = useState("")
  const [isBatchOpen, setIsBatchOpen] = useState(false)
  const [batchDomains, setBatchDomains] = useState("")
  const [historyOpen, setHistoryOpen] = useState(false)
  const [auditHistory, setAuditHistory] = useState<CertCheckResult[]>([])
  const [loadingHistory, setLoadingHistory] = useState(false)
  const [selectedDomain, setSelectedDomain] = useState<CertDomain | null>(null)

  const fetchDomains = async () => {
    try {
      const data = await api.listDomains({ limit: 100 })
      setDomains(data)
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Failed to load domains"))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDomains()
  }, [])

  const handleAddDomain = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newDomain) return
    
    setAdding(true)
    try {
      await api.createDomain({ domain: newDomain })
      toast.success(`Domain enrolled`, {
        description: `${newDomain} is now under surveillance.`
      })
      setNewDomain("")
      fetchDomains()
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Failed to add domain"))
    } finally {
      setAdding(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to stop monitoring this domain?")) return
    try {
      await api.deleteDomain(id)
      toast.success("Domain removed from monitoring list")
      fetchDomains()
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Delete failed"))
    }
  }

  const handleCheck = async (id: string) => {
    setChecking(id)
    try {
      const result = await api.checkSingleDomain(id)
      if (result.is_valid && result.chain_valid) {
        toast.success(`Check completed`, { description: `${result.domain} is healthy.` })
      } else {
        toast.error(`Security Warning`, { description: `${result.domain} validation failed: ${result.error || 'Unknown error'}` })
      }
      fetchDomains()
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Manual check failed"))
    } finally {
      setChecking(null)
    }
  }

  const handleBatchAdd = async () => {
    const domainsList = batchDomains.split(/[\n,]+/).map(d => d.trim()).filter(d => !!d)
    if (domainsList.length === 0) return

    setAdding(true)
    try {
      await api.createDomainsBatch({ domains: domainsList.map(d => ({ domain: d })) })
      toast.success(`${domainsList.length} domains enrolled`)
      setBatchDomains("")
      setIsBatchOpen(false)
      fetchDomains()
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Batch enrollment failed"))
    } finally {
      setAdding(false)
    }
  }

  const viewHistory = async (domain: CertDomain) => {
    setSelectedDomain(domain)
    setHistoryOpen(true)
    setLoadingHistory(true)
    try {
      const data = await api.getCertCheckHistory(domain.id, { limit: 50 })
      setAuditHistory(data as any)
    } catch (error) {
      toast.error("Failed to load audit trail")
    } finally {
      setLoadingHistory(false)
    }
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 15 },
    show: { opacity: 1, y: 0 }
  }

  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="space-y-8"
    >
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <motion.div variants={itemVariants} className="lg:col-span-1">
          <Card className="glass-card h-full">
            <CardHeader>
              <CardTitle className="text-xl flex items-center gap-2">
                <Plus className="h-5 w-5 text-primary" />
                Enroll Domain
              </CardTitle>
              <CardDescription>Enroll a new asset for automated trust monitoring.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleAddDomain} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="domain" className="text-xs uppercase font-bold text-muted-foreground tracking-widest">Asset Address</Label>
                  <div className="flex flex-col gap-3">
                    <Input 
                      id="domain" 
                      placeholder="e.g. cloud.oxmon.com" 
                      value={newDomain}
                      onChange={(e) => setNewDomain(e.target.value)}
                      required
                      className="glass h-11"
                    />
                    <div className="flex gap-2">
                      <Button type="submit" disabled={adding} className="flex-1 shadow-lg h-11 shadow-primary/20 hover:shadow-primary/40 bg-primary">
                        {adding ? <Loader2 className="h-4 w-4 animate-spin" /> : <Shield className="h-4 w-4 mr-2" />}
                        Single
                      </Button>
                      <Button type="button" variant="outline" onClick={() => setIsBatchOpen(true)} className="glass h-11 px-4">
                        Batch
                      </Button>
                    </div>
                  </div>
                </div>
              </form>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={itemVariants} className="lg:col-span-2">
          <Card className="glass-card h-full border-none shadow-xl bg-gradient-to-br from-background/50 to-primary/5">
            <CardHeader>
              <div className="flex items-center gap-2">
                <div className="p-2 bg-primary/10 rounded-lg text-primary">
                  <Shield className="h-5 w-5" />
                </div>
                <div>
                  <CardTitle>Surveillance Policy</CardTitle>
                  <CardDescription>Automated verification standards for identity assets.</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="grid md:grid-cols-2 gap-8 pt-4">
               <div className="space-y-4">
                  <div className="flex items-start gap-3">
                     <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0 mt-0.5" />
                     <div className="space-y-1">
                        <p className="font-bold text-sm">Real-time Checksum</p>
                        <p className="text-xs text-muted-foreground leading-relaxed">Cryptographic validation of leaf certificate integrity.</p>
                     </div>
                  </div>
                  <div className="flex items-start gap-3">
                     <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0 mt-0.5" />
                     <div className="space-y-1">
                        <p className="font-bold text-sm">OCSP Monitoring</p>
                        <p className="text-xs text-muted-foreground leading-relaxed">Continuous tracking of revocation lists and trust status.</p>
                     </div>
                  </div>
               </div>
               <div className="bg-primary/5 p-4 rounded-xl border border-primary/10">
                  <div className="flex items-center gap-2 mb-2 text-primary">
                    <Info className="h-4 w-4" />
                    <span className="font-bold text-xs uppercase tracking-tight">Governance Notice</span>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Identity assets are audited twice daily. Security escalations are triggered if chain integrity is compromised.
                  </p>
               </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      <motion.div variants={itemVariants}>
        <Card className="glass-card border-none shadow-xl overflow-hidden">
          <CardHeader className="bg-muted/30 border-b border-white/5">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg">Monitoring Registry</CardTitle>
                <CardDescription>Live tracking list of external infrastructure endpoints.</CardDescription>
              </div>
              <Button variant="ghost" size="sm" onClick={fetchDomains} className="h-8 gap-2 glass">
                <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
                Sync
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y border-white/5">
              <AnimatePresence mode="popLayout">
                {loading ? (
                  Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="flex items-center justify-between p-6 animate-pulse">
                      <div className="flex items-center gap-4">
                        <div className="h-10 w-10 glass rounded-full" />
                        <div className="space-y-2">
                           <div className="h-4 w-32 bg-white/5 rounded" />
                           <div className="h-3 w-24 bg-white/5 rounded" />
                        </div>
                      </div>
                    </div>
                  ))
                ) : domains.length === 0 ? (
                  <div className="flex flex-col items-center justify-center p-24 text-muted-foreground">
                     <Globe className="h-12 w-12 opacity-10 mb-4" />
                     <p>No managed domains found in registry.</p>
                  </div>
                ) : (
                  domains.map((domain, i) => (
                    <motion.div 
                      key={domain.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ delay: i * 0.05 }}
                      className="flex items-center justify-between p-5 hover:bg-white/5 transition-all group"
                    >
                      <div className="flex items-center gap-4">
                        <div className={`h-11 w-11 glass rounded-xl flex items-center justify-center transition-all group-hover:bg-primary/10 ${domain.enabled ? 'text-primary' : 'text-muted-foreground'}`}>
                          <Globe className="h-5 w-5" />
                        </div>
                        <div className="flex flex-col">
                          <span className="font-bold tracking-tight text-sm">{domain.domain}</span>
                          <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest flex items-center gap-2 mt-1">
                             <div className={`h-1.5 w-1.5 rounded-full ${domain.enabled ? 'bg-emerald-500 animate-pulse' : 'bg-muted-foreground'}`} />
                             {domain.enabled ? 'Active Surveillance' : 'Retired Asset'}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => handleCheck(domain.id)}
                          disabled={checking === domain.id}
                          className="h-9 px-4 glass border-white/5 text-xs gap-2 hover:bg-primary/10 hover:text-primary transition-all"
                        >
                          {checking === domain.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
                          Audit Now
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-9 w-9 text-muted-foreground hover:bg-white/5" 
                          onClick={() => viewHistory(domain)}
                          title="Audit History"
                        >
                          <History className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => handleDelete(domain.id)}
                          className="text-red-500/40 hover:text-red-600 hover:bg-red-500/10 h-9 w-9 transition-all active:scale-90"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </motion.div>
                  ))
                )}
              </AnimatePresence>
            </div>
          </CardContent>
        </Card>
      </motion.div>
      <Dialog open={isBatchOpen} onOpenChange={setIsBatchOpen}>
        <DialogContent className="glass-card !border-white/10 sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Batch Enrollment</DialogTitle>
            <DialogDescription>Input multiple domains separated by commas or newlines.</DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label htmlFor="batch" className="mb-2 block text-xs font-bold uppercase tracking-widest">Domain List</Label>
            <textarea 
              id="batch"
              className="w-full h-48 glass rounded-xl p-4 text-sm font-mono focus:outline-none focus:ring-1 focus:ring-primary border border-white/5"
              placeholder="example.com&#10;google.com, github.com"
              value={batchDomains}
              onChange={e => setBatchDomains(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setIsBatchOpen(false)}>Cancel</Button>
            <Button onClick={handleBatchAdd} disabled={adding} className="bg-primary hover:bg-primary/90 text-white min-w-[120px]">
              {adding ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Plus className="h-4 w-4 mr-2" />}
              Enroll Assets
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={historyOpen} onOpenChange={setHistoryOpen}>
        <DialogContent className="glass-card !border-white/10 sm:max-w-[600px] max-h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <History className="h-5 w-5 text-primary" /> Audit Trail: <span className="text-foreground">{selectedDomain?.domain}</span>
            </DialogTitle>
            <DialogDescription>Historical validation records and security handshake metrics.</DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-auto mt-4 rounded-lg border border-white/5">
             {loadingHistory ? (
                <div className="py-24 flex flex-col items-center justify-center gap-3">
                   <Loader2 className="h-8 w-8 animate-spin text-primary" />
                   <p className="text-xs text-muted-foreground animate-pulse">Retracing audit steps...</p>
                </div>
             ) : auditHistory.length === 0 ? (
                <div className="py-24 text-center text-muted-foreground italic text-sm">No historical audits recorded for this asset.</div>
             ) : (
                <div className="divide-y divide-white/5">
                    {auditHistory.map((item, i) => (
                      <div key={i} className="p-4 flex items-center justify-between hover:bg-white/5 transition-colors">
                         <div className="flex flex-col gap-1">
                            <div className="flex items-center gap-2">
                               <div className={`h-2 w-2 rounded-full ${(item.is_valid && item.chain_valid) ? 'bg-emerald-500' : 'bg-red-500'}`} />
                               <span className="text-xs font-bold">{(item.is_valid && item.chain_valid) ? 'Security Passed' : 'Security Failed'}</span>
                            </div>
                            <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">{new Date(item.checked_at).toLocaleString()}</span>
                         </div>
                         {!(item.is_valid && item.chain_valid) && (
                            <span className="text-[10px] text-red-500/80 font-medium italic max-w-[200px] truncate">{item.error}</span>
                         )}
                         {item.certificate_id && (
                            <Badge variant="outline" className="text-[9px] font-mono glass border-white/5">CERT:{item.certificate_id.slice(0, 8)}</Badge>
                         )}
                      </div>
                   ))}
                </div>
             )}
          </div>
        </DialogContent>
      </Dialog>
    </motion.div>
  )
}
