"use client"

import { useEffect, useState } from "react"
import { api, getApiErrorMessage } from "@/lib/api"
import { CertificateDetails } from "@/types/api"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { Loader2, ShieldCheck, ShieldAlert, ExternalLink, Search, RefreshCw, Calendar, Lock } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { motion, AnimatePresence } from "framer-motion"
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog"
import { ChainNode } from "@/types/api"

export default function CertificatesPage() {
  const [certs, setCerts] = useState<CertificateDetails[]>([])
  const [summary, setSummary] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [chain, setChain] = useState<ChainNode[] | null>(null)
  const [loadingChain, setLoadingChain] = useState(false)
  const [isChainOpen, setIsChainOpen] = useState(false)

  const fetchCerts = async () => {
    setLoading(true)
    try {
      const [response, summaryData] = await Promise.all([
        api.getCertificates({ limit: 100 }),
        api.getCertSummary()
      ])
      setCerts(response)
      setSummary(summaryData)
    } catch (error) {
      console.error(error)
      toast.error(getApiErrorMessage(error, "Failed to load certificates"))
    } finally {
      setLoading(false)
    }
  }

  const handleViewChain = async (id: string) => {
    setLoadingChain(true)
    setIsChainOpen(true)
    try {
      const data = await api.getCertificateChain(id)
      setChain(data.chain)
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Failed to load certificate chain"))
      setIsChainOpen(false)
    } finally {
      setLoadingChain(false)
    }
  }

  useEffect(() => {
    fetchCerts()
  }, [])

  const filteredCerts = certs.filter(cert => 
    cert.domain.toLowerCase().includes(search.toLowerCase()) ||
    cert.issuer_cn?.toLowerCase().includes(search.toLowerCase())
  )

  const getStatusBadge = (cert: CertificateDetails) => {
    const expiry = new Date(cert.not_after)
    const now = new Date()
    const daysToExpiry = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 3600 * 24))
    
    if (!cert.chain_valid || daysToExpiry < 0) {
      return (
        <Badge variant="destructive" className="gap-1 px-2 py-0.5 shadow-sm shadow-red-500/10">
           <ShieldAlert className="h-3 w-3" />
           {daysToExpiry < 0 ? "Expired" : "Chain Invalid"}
        </Badge>
      )
    }
    
    if (daysToExpiry < 30) {
      return (
        <Badge variant="warning" className="gap-1 px-2 py-0.5 bg-amber-500/10 text-amber-600 border-amber-500/20 shadow-sm shadow-amber-500/10">
           <Calendar className="h-3 w-3" />
           Expiring in {daysToExpiry}d
        </Badge>
      )
    }

    return (
      <Badge variant="success" className="gap-1 px-2 py-0.5 bg-emerald-500/10 text-emerald-600 border-emerald-500/20 shadow-sm shadow-emerald-500/10">
         <ShieldCheck className="h-3 w-3" />
         Valid ({daysToExpiry}d)
      </Badge>
    )
  }

  return (
    <div className="space-y-8">
      <AnimatePresence mode="wait">
        {summary && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-6"
          >
            {[
              { label: "Healthy Assets", count: summary.valid, sub: "Valid certificate chain", color: "text-emerald-500", bg: "bg-emerald-500/10", icon: ShieldCheck },
              { label: "Critical Risk", count: summary.invalid, sub: "Expired or invalid chain", color: "text-red-500", bg: "bg-red-500/10", icon: ShieldAlert },
              { label: "Warning Phase", count: summary.expiring_soon, sub: "Expiring within 30 days", color: "text-amber-500", bg: "bg-amber-500/10", icon: Calendar },
            ].map((stat, i) => (
              <Card key={i} className="glass border-white/5 relative overflow-hidden group">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">{stat.label}</span>
                    <stat.icon className={`h-4 w-4 ${stat.color}`} />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-black tracking-tighter">{stat.count}</div>
                  <p className="text-[10px] text-muted-foreground font-medium mt-1">{stat.sub}</p>
                </CardContent>
                <div className={`absolute inset-0 ${stat.bg} opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none`} />
              </Card>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      <Card className="glass-card border-none shadow-xl overflow-hidden">
        <CardHeader className="pb-4 bg-muted/20">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
             <div className="p-2 bg-primary/10 rounded-lg text-primary">
                <Lock className="h-5 w-5" />
             </div>
             <div>
                <CardTitle>Certificate Inventory</CardTitle>
                <CardDescription>Managed identity assets and validation status.</CardDescription>
             </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative group">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
              <Input
                placeholder="Search domains..."
                className="pl-10 glass w-64 h-10 transition-all focus:w-80"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <Button 
                variant="outline" 
                size="icon" 
                onClick={fetchCerts}
                className="glass transition-transform active:scale-95"
            >
                <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-6">
        <div className="rounded-xl border overflow-hidden">
          <Table>
            <TableHeader className="bg-muted/30">
              <TableRow>
                <TableHead>Domain Name</TableHead>
                <TableHead>Health Status</TableHead>
                <TableHead>Issuer CN</TableHead>
                <TableHead>Expiration</TableHead>
                <TableHead>Audit Log</TableHead>
                <TableHead className="text-right">Link</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <AnimatePresence mode="popLayout">
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-48 text-center text-primary">
                      <Loader2 className="h-8 w-8 animate-spin mx-auto" />
                    </TableCell>
                  </TableRow>
                ) : filteredCerts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-48 text-center text-muted-foreground italic font-medium">
                      Zero matching certificates found.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredCerts.map((cert, i) => (
                    <motion.tr 
                      key={cert.id}
                      initial={{ opacity: 0, scale: 0.98 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: i * 0.02 }}
                      className="group hover:bg-muted/30 transition-colors border-b last:border-0"
                    >
                      <TableCell className="py-4">
                        <div className="flex items-center gap-3">
                           <div className={`p-1.5 rounded-full ${cert.chain_valid ? 'bg-emerald-500/10 text-emerald-600' : 'bg-red-500/10 text-red-600'}`}>
                             <ShieldCheck className="h-3.5 w-3.5" />
                           </div>
                           <span className="font-bold tracking-tight text-sm">{cert.domain}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="transition-all transform group-hover:scale-105 origin-left">
                          {getStatusBadge(cert)}
                        </div>
                      </TableCell>
                      <TableCell className="max-w-[180px] truncate text-xs font-medium text-muted-foreground" title={cert.issuer_cn || ""}>
                        {cert.issuer_cn || "Unknown Issue Authority"}
                      </TableCell>
                      <TableCell className="text-sm font-semibold">
                        {new Date(cert.not_after).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                      </TableCell>
                      <TableCell className="text-[11px] text-muted-foreground font-mono">
                        Last scan: {new Date(cert.last_checked).toLocaleTimeString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 hover:text-primary transition-all active:scale-95"
                            onClick={() => handleViewChain(cert.id)}
                            title="View Certificate Chain"
                          >
                            <ShieldCheck className="h-3.5 w-3.5" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 hover:text-primary transition-all active:scale-95" asChild>
                            <a href={`https://${cert.domain}`} target="_blank" rel="noopener noreferrer">
                              <ExternalLink className="h-3.5 w-3.5" />
                            </a>
                          </Button>
                        </div>
                      </TableCell>
                    </motion.tr>
                  ))
                )}
              </AnimatePresence>
            </TableBody>
          </Table>
        </div>
      </CardContent>

      <Dialog open={isChainOpen} onOpenChange={setIsChainOpen}>
        <DialogContent className="glass-card !border-white/10 sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Lock className="h-5 w-5 text-primary" /> Certificate Trust Chain
            </DialogTitle>
            <DialogDescription>Full validation hierarchy from Leaf to Root CA.</DialogDescription>
          </DialogHeader>
          <div className="py-6 overflow-hidden">
            {loadingChain ? (
              <div className="flex flex-col items-center justify-center py-12 gap-3">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="text-xs text-muted-foreground animate-pulse">Reconstructing trust hierarchy...</p>
              </div>
            ) : chain ? (
              <div className="space-y-4 relative">
                <div className="absolute left-[23px] top-4 bottom-4 w-px bg-gradient-to-b from-primary/50 to-transparent" />
                {chain.map((node, i) => (
                  <motion.div 
                    key={i} 
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className="flex items-start gap-4 relative z-10"
                  >
                    <div className="h-12 w-12 rounded-full glass border-white/10 flex items-center justify-center shrink-0 shadow-lg shadow-black/20 bg-background/50">
                      <ShieldCheck className={`h-5 w-5 ${i === 0 ? "text-primary" : "text-muted-foreground"}`} />
                    </div>
                    <div className="flex flex-col gap-1 pt-1">
                       <span className={`text-sm font-bold ${i === 0 ? "text-primary" : "text-foreground"}`}>{node.subject_cn}</span>
                       <div className="flex flex-col text-[10px] text-muted-foreground font-medium uppercase tracking-wider">
                          <span>Issued by: {node.issuer_cn}</span>
                          <span className="mt-0.5 text-[9px] opacity-70">Expires: {new Date(node.not_after).toLocaleDateString()}</span>
                       </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground italic">No chain data available.</div>
            )}
          </div>
        </DialogContent>
      </Dialog>
      </Card>
    </div>
  )
}
