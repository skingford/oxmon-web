"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { api, getApiErrorMessage } from "@/lib/api"
import { DashboardOverview } from "@/types/api"
import { toast } from "sonner"
import { AlertCircle, CheckCircle2, Server, Shield, HardDrive, Clock, Activity, FileText, Bell } from "lucide-react"
import { Loader2 } from "lucide-react"

export default function DashboardPage() {
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<DashboardOverview | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const overview = await api.getDashboardOverview()
        setData(overview)
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
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
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

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Agents</CardTitle>
            <Server className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.active_agents} / {data.total_agents}</div>
            <p className="text-xs text-muted-foreground">Online / Total agents</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Alerts (24h)</CardTitle>
            <Bell className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.alerts_24h}</div>
            <p className="text-xs text-muted-foreground">Total alerts in last 24 hours</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Storage Usage</CardTitle>
            <HardDrive className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatBytes(data.storage_total_bytes)}</div>
            <p className="text-xs text-muted-foreground">In {data.partition_count} partitions</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">System Uptime</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatUptime(data.uptime_secs)}</div>
            <p className="text-xs text-muted-foreground">Server uptime</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Alerts by Severity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Object.entries(data.alerts_by_severity).map(([severity, count]) => (
                <div key={severity} className="flex items-center">
                  <div className="w-full flex-1 space-y-1">
                    <p className="text-sm font-medium leading-none capitalize">{severity.replace("_", " ")}</p>
                    <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
                      <div 
                        className={`h-full ${
                          severity === "CRITICAL" ? "bg-red-500" : 
                          severity === "WARNING" ? "bg-yellow-500" : 
                          severity === "INFO" ? "bg-blue-500" : "bg-gray-500"
                        }`}
                        style={{ width: `${(count / (data.alerts_24h || 1)) * 100}%` }}
                      />
                    </div>
                  </div>
                  <div className="ml-4 text-sm font-medium">{count}</div>
                </div>
              ))}
              {Object.keys(data.alerts_by_severity).length === 0 && (
                <div className="text-center py-4 text-muted-foreground">No alerts in the last 24 hours</div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Certificates Health</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                <span className="text-sm font-medium">Valid</span>
              </div>
              <span className="text-sm">{data.cert_summary.valid}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-red-500" />
                <span className="text-sm font-medium">Invalid</span>
              </div>
              <span className="text-sm">{data.cert_summary.invalid}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Activity className="h-4 w-4 text-yellow-500" />
                <span className="text-sm font-medium">Expiring Soon</span>
              </div>
              <span className="text-sm">{data.cert_summary.expiring_soon}</span>
            </div>
            <div className="pt-4 border-t flex items-center justify-between">
              <span className="text-sm font-bold">Total Monitored</span>
              <span className="text-sm font-bold">{data.cert_summary.total_domains}</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
