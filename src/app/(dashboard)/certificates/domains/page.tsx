"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Plus, Globe, Trash2, Shield, Loader2, Info, CheckCircle2 } from "lucide-react"
import { toast } from "sonner"
import { motion, AnimatePresence } from "framer-motion"

export default function DomainsPage() {
  const [loading, setLoading] = useState(false)
  const [newDomain, setNewDomain] = useState("")

  const handleAddDomain = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newDomain) return
    
    setLoading(true)
    try {
      await new Promise(resolve => setTimeout(resolve, 800))
      toast.success(`Domain added`, {
        description: `${newDomain} is now under surveillance.`
      })
      setNewDomain("")
    } catch (error) {
      toast.error("Failed to add domain")
    } finally {
      setLoading(false)
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
                Add Domain
              </CardTitle>
              <CardDescription>Enroll a new asset for monitoring.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleAddDomain} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="domain" className="text-xs uppercase font-bold text-muted-foreground tracking-widest">Asset Address</Label>
                  <div className="flex flex-col gap-3">
                    <Input 
                      id="domain" 
                      placeholder="example.com" 
                      value={newDomain}
                      onChange={(e) => setNewDomain(e.target.value)}
                      required
                      className="glass h-11"
                    />
                    <Button type="submit" disabled={loading} className="w-full shadow-lg h-11 shadow-primary/20 hover:shadow-primary/40">
                      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Shield className="h-4 w-4 mr-2" />}
                      Start Monitoring
                    </Button>
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
                  <CardTitle>Governance Policy</CardTitle>
                  <CardDescription>Automated verification standards.</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="grid md:grid-cols-2 gap-8 pt-4">
               <div className="space-y-4">
                  <div className="flex items-start gap-3">
                     <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0 mt-0.5" />
                     <div className="space-y-1">
                        <p className="font-bold text-sm">Automated Discovery</p>
                        <p className="text-xs text-muted-foreground leading-relaxed">Continuous scanning of SAN and alternative identifiers.</p>
                     </div>
                  </div>
                  <div className="flex items-start gap-3">
                     <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0 mt-0.5" />
                     <div className="space-y-1">
                        <p className="font-bold text-sm">Chain Verification</p>
                        <p className="text-xs text-muted-foreground leading-relaxed">Full trust chain validation against root authorities.</p>
                     </div>
                  </div>
               </div>
               <div className="bg-primary/5 p-4 rounded-xl border border-primary/10">
                  <div className="flex items-center gap-2 mb-2 text-primary">
                    <Info className="h-4 w-4" />
                    <span className="font-bold text-xs uppercase tracking-tight">System Notice</span>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Certificates are audited every 24 hours. Critical threshold alerts are triggered 30 days prior to expiration.
                  </p>
               </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      <motion.div variants={itemVariants}>
        <Card className="glass-card border-none shadow-xl overflow-hidden">
          <CardHeader className="bg-muted/30">
            <CardTitle className="text-lg">Configured Surveillance List</CardTitle>
            <CardDescription>Currently monitored external infrastructure endpoints.</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y border-t border-white/5">
              <AnimatePresence>
                {[ "google.com", "github.com", "microsoft.com" ].map((domain, i) => (
                  <motion.div 
                    key={domain}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="flex items-center justify-between p-5 hover:bg-muted/40 transition-colors group"
                  >
                    <div className="flex items-center gap-4">
                      <div className="h-10 w-10 glass rounded-full flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                        <Globe className="h-5 w-5" />
                      </div>
                      <div className="flex flex-col">
                        <span className="font-bold tracking-tight">{domain}</span>
                        <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest flex items-center gap-1">
                           <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                           Active Surveillance
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                       <Button variant="ghost" size="sm" className="hidden group-hover:flex transition-all text-xs h-8">
                          View History
                       </Button>
                       <Button variant="ghost" size="icon" className="text-red-500/40 hover:text-red-600 hover:bg-red-500/10 h-8 w-8 transition-all active:scale-90">
                         <Trash2 className="h-4 w-4" />
                       </Button>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  )
}
