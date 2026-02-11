"use client"

import { useEffect, useState } from "react"
import { api, getApiErrorMessage } from "@/lib/api"
import { RuntimeConfig, StorageInfo } from "@/types/api"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { toast } from "sonner"
import { Loader2, Settings, HardDrive, Trash2, Activity, Info, Server, Cpu, Clock, ShieldCheck, Database, Key } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { motion } from "framer-motion"

export default function SystemPage() {
  const [config, setConfig] = useState<RuntimeConfig | null>(null)
  const [storage, setStorage] = useState<StorageInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [cleaning, setCleaning] = useState(false)

  const fetchData = async () => {
    try {
      const [configData, storageData] = await Promise.all([
        api.getSystemConfig(),
        api.getStorageInfo()
      ])
      setConfig(configData)
      setStorage(storageData)
    } catch (error) {
      console.error(error)
      toast.error(getApiErrorMessage(error, "Failed to load system information"))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const handleCleanup = async () => {
    if (!confirm("Confirm manual storage reclamation? Expired data partitions will be purged.")) return
    
    setCleaning(true)
    try {
      await api.triggerCleanup()
      toast.success("Reclamation sequence initiated")
      const storageData = await api.getStorageInfo()
      setStorage(storageData)
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Failed to initiate cleanup"))
    } finally {
      setCleaning(false)
    }
  }

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB", "TB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  }

  if (loading) {
    return (
      <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary/50" />
      </div>
    )
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-8 space-y-8"
    >
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-4xl font-extrabold tracking-tight text-gradient">Core Orchestrator</h2>
          <p className="text-muted-foreground mt-1 text-sm">Engine runtime parameters and data persistence lifecycle.</p>
        </div>
      </div>

      <div className="grid gap-8 md:grid-cols-2">
        <Card className="glass-card border-none shadow-2xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
            <Settings className="h-48 w-48 rotate-12" />
          </div>
          <CardHeader className="bg-muted/20 border-b border-white/5 pb-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg text-primary">
                <Server className="h-5 w-5" />
              </div>
              <div>
                <CardTitle>Runtime Environment</CardTitle>
                <CardDescription>Server architecture and port mapping.</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-6 space-y-6">
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-1.5 glass p-3 rounded-xl border-white/5">
                <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">HTTP Interface</p>
                <p className="text-xl font-bold tracking-tight text-primary">:{config?.http_port}</p>
              </div>
              <div className="space-y-1.5 glass p-3 rounded-xl border-white/5">
                <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">gRPC Protocol</p>
                <p className="text-xl font-bold tracking-tight text-primary">:{config?.grpc_port}</p>
              </div>
              <div className="col-span-2 space-y-1.5 glass p-3 rounded-xl border-white/5">
                <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest flex items-center gap-1">
                   <Clock className="h-3 w-3" /> Data Retention
                </p>
                <p className="text-lg font-bold">{config?.retention_days} Cycles (Days)</p>
              </div>
            </div>

            <div className="space-y-3 pt-2">
               <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest mb-2">Security Enforcement</p>
               <div className="flex items-center justify-between glass px-4 py-3 rounded-xl border-white/5 transition-all hover:bg-white/5">
                  <div className="flex items-center gap-2">
                    <Key className="h-4 w-4 text-primary/70" />
                    <span className="text-sm font-medium">Agent Authentication</span>
                  </div>
                  <Badge variant={config?.require_agent_auth ? "success" : "secondary"} className="text-[10px] shadow-sm">
                    {config?.require_agent_auth ? "MANDATORY" : "OPTIONAL"}
                  </Badge>
               </div>
               <div className="flex items-center justify-between glass px-4 py-3 rounded-xl border-white/5 transition-all hover:bg-white/5">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="h-4 w-4 text-emerald-500/70" />
                    <span className="text-sm font-medium">Identity Validation</span>
                  </div>
                  <Badge variant={config?.cert_check_enabled ? "success" : "secondary"} className="text-[10px] shadow-sm">
                    {config?.cert_check_enabled ? "ENABLED" : "DISABLED"}
                  </Badge>
               </div>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-2">
               <div className="glass p-4 rounded-xl border-white/5 flex flex-col items-center justify-center text-center">
                  <span className="text-3xl font-black text-primary/40">{config?.alert_rules_count}</span>
                  <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-tighter">Active Rules</span>
               </div>
               <div className="glass p-4 rounded-xl border-white/5 flex flex-col items-center justify-center text-center">
                  <span className="text-3xl font-black text-primary/40">{config?.notification_channels_count}</span>
                  <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-tighter">Endpoints</span>
               </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card border-none shadow-2xl flex flex-col relative overflow-hidden group">
          <div className="absolute -bottom-10 -left-10 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
            <Database className="h-48 w-48 -rotate-12" />
          </div>
          <CardHeader className="bg-muted/20 border-b border-white/5 pb-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg text-primary">
                <HardDrive className="h-5 w-5" />
              </div>
              <div>
                <CardTitle>Storage Utilization</CardTitle>
                <CardDescription>Persistence health and partition metrics.</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="flex-1 pt-8 space-y-8">
            <div className="flex items-center justify-between items-end">
              <div className="space-y-1">
                <p className="text-xs uppercase font-bold text-muted-foreground tracking-widest">Combined Data Volume</p>
                <p className="text-5xl font-black tracking-tighter text-primary">{formatBytes(storage?.total_size_bytes || 0)}</p>
              </div>
              <div className="text-right glass px-4 py-2 rounded-xl border-white/10">
                <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">Active Cells</p>
                <p className="text-2xl font-black text-primary">{storage?.total_partitions}</p>
              </div>
            </div>

            <div className="space-y-4">
               <div className="h-3 w-full bg-white/5 rounded-full overflow-hidden border border-white/5 shadow-inner">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: "65%" }} 
                    transition={{ duration: 1, delay: 0.5 }}
                    className="h-full bg-gradient-to-r from-primary/40 via-primary to-primary shadow-[0_0_15px_rgba(var(--primary),0.5)]"
                  />
               </div>
               <div className="flex justify-between text-[11px] font-bold text-muted-foreground uppercase tracking-widest">
                  <span>Usage Profile</span>
                  <span>Healthy: 100%</span>
               </div>
            </div>

            <div className="bg-primary/5 p-5 rounded-2xl border border-primary/10 relative">
              <div className="flex items-center gap-2 mb-3 text-primary">
                <Info className="h-4 w-4" />
                <span className="text-xs font-black uppercase tracking-widest">Lifecycle Protocol</span>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed font-medium">
                The persistence engine automatically prunes segments older than {config?.retention_days} days. 
                Manual reclamation forces an immediate validation of all storage shards.
              </p>
            </div>
          </CardContent>
          <CardFooter className="pt-6 border-t border-white/5 px-8">
            <Button 
              variant="destructive" 
              className="w-full h-12 gap-3 shadow-xl transition-all active:scale-95 text-xs font-bold uppercase tracking-widest" 
              onClick={handleCleanup}
              disabled={cleaning}
            >
              {cleaning ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
              {cleaning ? "Purging Segments..." : "Force Storage Reclamation"}
            </Button>
          </CardFooter>
        </Card>
      </div>

      <div className="glass p-4 rounded-xl border border-white/5 flex items-center justify-between">
         <div className="flex items-center gap-3">
            <Cpu className="h-4 w-4 text-muted-foreground" />
            <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">Master Node: </span>
            <code className="text-[11px] font-mono bg-white/5 px-2 py-1 rounded text-primary/70">{config?.data_dir}</code>
         </div>
         <Badge variant="outline" className="text-[9px] border-white/10 opacity-50">v4.0.0-PRO-X</Badge>
      </div>
    </motion.div>
  )
}
