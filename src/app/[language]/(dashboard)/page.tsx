"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { api, getApiErrorMessage } from "@/lib/api"
import { DashboardOverview } from "@/types/api"
import { toast } from "sonner"
import { AlertCircle, CheckCircle2, Server, HardDrive, Clock, Activity, Bell, ArrowUpRight } from "lucide-react"
import { Loader2 } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Cell,
  PieChart,
  Pie
} from "recharts"

export default function DashboardPage() {
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<DashboardOverview | null>(null)
  const [health, setHealth] = useState<any>(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [overview, healthData] = await Promise.all([
          api.getDashboardOverview(),
          api.getHealth()
        ])
        setData(overview)
        setHealth(healthData)
      } catch (error) {
        console.error(error)
        toast.error(getApiErrorMessage(error, "Failed to load dashboard data"))
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  if (loading) {
    return (
      <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
        <motion.div
           initial={{ opacity: 0, scale: 0.8 }}
           animate={{ opacity: 1, scale: 1 }}
           transition={{ duration: 0.5, repeat: Infinity, repeatType: "reverse" }}
        >
          <div className="relative">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
            <div className="absolute inset-0 blur-xl bg-primary/20 rounded-full" />
          </div>
        </motion.div>
      </div>
    )
  }

  if (!data) return null

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB", "TB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  }

  const formatUptime = (secs: number) => {
    const days = Math.floor(secs / (24 * 3600))
    const hours = Math.floor((secs % (24 * 3600)) / 3600)
    const mins = Math.floor((secs % 3600) / 60)
    return `${days}d ${hours}h ${mins}m`
  }

  const alertData = Object.entries(data.alerts_by_severity).map(([name, value]) => ({
    name: name.toLowerCase().replace("_", " "),
    value
  }))

  const certData = [
    { name: "Valid", value: data.cert_summary.valid, color: "var(--color-chart-2)" },
    { name: "Invalid", value: data.cert_summary.invalid, color: "var(--color-destructive)" },
    { name: "Expiring Soon", value: data.cert_summary.expiring_soon, color: "var(--color-chart-4)" }
  ].filter(c => c.value > 0)

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  }

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    show: { y: 0, opacity: 1 }
  }

  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="p-6 space-y-8"
    >
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight text-gradient">Dashboard</h1>
          <p className="text-muted-foreground mt-1 text-sm">Real-time overview of your infrastructure health.</p>
        </div>
        {health && (
           <div className="flex items-center gap-3 glass px-4 py-2 rounded-xl border-white/5 shadow-inner">
              <div className="flex flex-col items-end">
                 <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Service Health</span>
                 <span className="text-xs font-mono font-bold text-emerald-500 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    Operational
                 </span>
              </div>
              <div className="h-8 w-px bg-white/10" />
              <div className="flex flex-col">
                 <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Version</span>
                 <span className="text-xs font-mono font-bold">v{health.version}</span>
              </div>
           </div>
        )}
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {[
          { title: "Active Agents", value: `${data.active_agents} / ${data.total_agents}`, sub: "Online / Total", icon: Server, color: "text-blue-500" },
          { title: "Alerts (24h)", value: data.alerts_24h, sub: "Last 24 hours", icon: Bell, color: "text-red-500" },
          { title: "Storage Usage", value: formatBytes(data.storage_total_bytes), sub: `${data.partition_count} Partitions`, icon: HardDrive, color: "text-purple-500" },
          { title: "System Uptime", value: formatUptime(data.uptime_secs), sub: "Server running", icon: Clock, color: "text-green-500" }
        ].map((item, i) => (
          <motion.div key={i} variants={itemVariants}>
            <Card className="glass-card overflow-hidden group">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{item.title}</CardTitle>
                <item.icon className={`h-4 w-4 ${item.color} group-hover:scale-110 transition-transform`} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{item.value}</div>
                <p className="text-xs text-muted-foreground">{item.sub}</p>
              </CardContent>
              <div className="absolute top-0 right-0 p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                 <ArrowUpRight className="h-3 w-3 text-muted-foreground" />
              </div>
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
        <motion.div variants={itemVariants} className="col-span-full lg:col-span-4">
          <Card className="glass-card h-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-primary" />
                Alerts Severity Distribution
              </CardTitle>
            </CardHeader>
            <CardContent className="h-[300px]">
              {alertData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={alertData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsla(var(--border), 0.3)" />
                    <XAxis 
                      dataKey="name" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fontSize: 12, fill: "var(--muted-foreground)" }}
                      style={{ textTransform: "capitalize" }}
                    />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "var(--muted-foreground)" }} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: "var(--background)", border: "1px solid var(--border)", borderRadius: "8px" }}
                      cursor={{ fill: "var(--accent)", opacity: 0.1 }}
                    />
                    <Bar dataKey="value" radius={[4, 4, 0, 0]} barSize={40}>
                      {alertData.map((entry, index) => (
                        <Cell 
                          key={`cell-${index}`} 
                          fill={
                            entry.name === "critical" ? "var(--color-destructive)" :
                            entry.name === "warning" ? "var(--color-chart-4)" :
                            entry.name === "info" ? "var(--color-chart-2)" : "var(--color-muted-foreground)"
                          } 
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-muted-foreground space-y-2">
                   <CheckCircle2 className="h-10 w-10 text-green-500/20" />
                   <p>System reporting zero healthy issues.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={itemVariants} className="col-span-full lg:col-span-3">
          <Card className="glass-card h-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-primary" />
                Certificates Status
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col items-center justify-center h-[300px] space-y-4">
               <div className="w-full h-[200px]">
                 <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={certData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {certData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                 </ResponsiveContainer>
               </div>
               <div className="grid grid-cols-3 gap-8 w-full">
                  {certData.map((item, i) => (
                    <div key={i} className="flex flex-col items-center">
                       <span className="text-2xl font-bold">{item.value}</span>
                       <span className="text-[10px] uppercase text-muted-foreground tracking-wider">{item.name}</span>
                    </div>
                  ))}
               </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </motion.div>
  )
}

import { ShieldCheck as OriginalShieldCheck } from "lucide-react"

const ShieldCheck = OriginalShieldCheck
