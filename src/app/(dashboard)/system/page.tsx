"use client"

import { useEffect, useState } from "react"
import { api, getApiErrorMessage } from "@/lib/api"
import { RuntimeConfig, StorageInfo } from "@/types/api"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { toast } from "sonner"
import { Loader2, Settings, HardDrive, Trash2, Activity, Info, Server, Cpu } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

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
    if (!confirm("Are you sure you want to trigger a manual storage cleanup? This will remove expired data partitions.")) return
    
    setCleaning(true)
    try {
      await api.triggerCleanup()
      toast.success("Storage cleanup triggered successfully")
      // Refresh storage info
      const storageData = await api.getStorageInfo()
      setStorage(storageData)
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Failed to trigger cleanup"))
    } finally {
      setCleaning(false)
    }
  }

  if (loading) {
    return (
      <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB", "TB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">System Settings</h1>
          <p className="text-muted-foreground">Runtime configuration and system data management.</p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Settings className="h-5 w-5 text-primary" />
              <CardTitle>Runtime Configuration</CardTitle>
            </div>
            <CardDescription>Core server settings and operational parameters.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">HTTP Port</p>
                <p className="font-medium underline decoration-primary/30 decoration-2">{config?.http_port}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">gRPC Port</p>
                <p className="font-medium">{config?.grpc_port}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Data Directory</p>
                <p className="font-mono text-xs bg-muted p-1 rounded break-all">{config?.data_dir}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Data Retention</p>
                <p className="font-medium">{config?.retention_days} Days</p>
              </div>
            </div>

            <div className="pt-4 border-t space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span>Agent Authentication Required</span>
                <Badge variant={config?.require_agent_auth ? "success" : "secondary"}>
                  {config?.require_agent_auth ? "Required" : "Optional"}
                </Badge>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span>Certificate Checks</span>
                <Badge variant={config?.cert_check_enabled ? "success" : "secondary"}>
                  {config?.cert_check_enabled ? "Enabled" : "Disabled"}
                </Badge>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span>Active Alert Rules</span>
                <span className="font-medium">{config?.alert_rules_count}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span>Notification Channels</span>
                <span className="font-medium">{config?.notification_channels_count}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="flex flex-col">
          <CardHeader>
            <div className="flex items-center gap-2">
              <HardDrive className="h-5 w-5 text-primary" />
              <CardTitle>Storage Management</CardTitle>
            </div>
            <CardDescription>Partition info and data maintenance.</CardDescription>
          </CardHeader>
          <CardContent className="flex-1 space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Total Database Size</p>
                <p className="text-3xl font-bold">{formatBytes(storage?.total_size_bytes || 0)}</p>
              </div>
              <div className="text-right space-y-1">
                <p className="text-sm text-muted-foreground">Active Partitions</p>
                <p className="text-2xl font-semibold">{storage?.total_partitions}</p>
              </div>
            </div>

            <div className="bg-muted/50 p-4 rounded-lg space-y-2">
              <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                <Info className="h-3 w-3" />
                <span>Maintenance Tips</span>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                The system automatically cleans up expired data based on the retention policy ({config?.retention_days} days). 
                Manual cleanup triggers an immediate inspection of all partitions.
              </p>
            </div>
          </CardContent>
          <CardFooter className="pt-4 border-t">
            <Button 
              variant="destructive" 
              className="w-full gap-2" 
              onClick={handleCleanup}
              disabled={cleaning}
            >
              {cleaning ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
              Trigger Data Cleanup
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}
