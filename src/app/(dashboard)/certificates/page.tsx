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

export default function CertificatesPage() {
  const [certs, setCerts] = useState<CertificateDetails[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")

  const fetchCerts = async () => {
    setLoading(true)
    try {
      const response = await api.getCertificates({ limit: 100 })
      setCerts(response)
    } catch (error) {
      console.error(error)
      toast.error(getApiErrorMessage(error, "Failed to load certificates"))
    } finally {
      setLoading(false)
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
                        <Button variant="ghost" size="icon" className="h-8 w-8 hover:text-primary transition-all active:scale-95" asChild>
                          <a href={`https://${cert.domain}`} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="h-3.5 w-3.5" />
                          </a>
                        </Button>
                      </TableCell>
                    </motion.tr>
                  ))
                )}
              </AnimatePresence>
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
}
