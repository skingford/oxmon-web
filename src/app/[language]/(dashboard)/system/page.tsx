"use client"

import { useEffect, useState } from "react"
import { api, getApiErrorMessage } from "@/lib/api"
import { RuntimeConfig, StorageInfo } from "@/types/api"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { toast } from "sonner"
import { Loader2, Settings, HardDrive, Shield, RefreshCw, Server } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { useAppTranslations } from "@/hooks/use-app-translations"
import { motion } from "framer-motion"

export default function SystemPage() {
  const { t } = useAppTranslations("system")
  const [config, setConfig] = useState<RuntimeConfig | null>(null)
  const [storage, setStorage] = useState<StorageInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [cleaning, setCleaning] = useState(false)
  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false)
  const [isCleanupDialogOpen, setIsCleanupDialogOpen] = useState(false)
  const [passwordForm, setPasswordForm] = useState({ old_password: "", new_password: "" })
  const [changing, setChanging] = useState(false)

  const fetchData = async (silent = false) => {
    if (silent) {
      setRefreshing(true)
    } else {
      setLoading(true)
    }

    try {
      const [configData, storageData] = await Promise.all([
        api.getSystemConfig(),
        api.getStorageInfo(),
      ])
      setConfig(configData)
      setStorage(storageData)
    } catch (error) {
      toast.error(getApiErrorMessage(error, t("toastFetchError")))
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const handleConfirmCleanup = async () => {
    setCleaning(true)
    try {
      await api.triggerCleanup()
      toast.success(t("toastCleanupSuccess"))
      const storageData = await api.getStorageInfo()
      setStorage(storageData)
      setIsCleanupDialogOpen(false)
    } catch (error) {
      toast.error(getApiErrorMessage(error, t("toastCleanupError")))
    } finally {
      setCleaning(false)
    }
  }

  const handleChangePassword = async () => {
    if (!passwordForm.old_password || !passwordForm.new_password) {
      toast.error(t("toastPasswordRequired"))
      return
    }
    setChanging(true)
    try {
      await api.changePassword(passwordForm)
      toast.success(t("toastPasswordSuccess"))
      setIsPasswordDialogOpen(false)
      setPasswordForm({ old_password: "", new_password: "" })
    } catch (error) {
      toast.error(getApiErrorMessage(error, t("toastPasswordError")))
    } finally {
      setChanging(false)
    }
  }

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB", "TB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  }

  const formatUptime = (seconds: number) => {
    const days = Math.floor(seconds / 86400)
    const hours = Math.floor((seconds % 86400) / 3600)
    return t("uptimeFormat", { days, hours })
  }

  if (loading) {
    return (
      <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-6 p-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">{t("title")}</h2>
          <p className="text-sm text-muted-foreground">{t("description")}</p>
        </div>
        <Button
          variant="outline"
          onClick={() => fetchData(true)}
          disabled={refreshing}
        >
          <RefreshCw className={`mr-2 h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
          {t("btnRefresh")}
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Runtime Configuration */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Server className="h-5 w-5" />
                {t("runtimeTitle")}
              </CardTitle>
              <CardDescription>{t("runtimeDescription")}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium">{t("fieldHttpPort")}</Label>
                  <Input readOnly value={config?.http_port} className="bg-muted font-mono" />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium">{t("fieldGrpcPort")}</Label>
                  <Input readOnly value={config?.grpc_port} className="bg-muted font-mono" />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium">{t("fieldLogLevel")}</Label>
                <Input readOnly value={config?.log_level} className="bg-muted font-mono" />
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium">{t("fieldUptime")}</Label>
                <Input
                  readOnly
                  value={config?.uptime_secs ? formatUptime(config.uptime_secs) : "N/A"}
                  className="bg-muted"
                />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Storage Management */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <HardDrive className="h-5 w-5" />
                {t("storageTitle")}
              </CardTitle>
              <CardDescription>{t("storageDescription")}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium">{t("fieldTotalSize")}</Label>
                <Input
                  readOnly
                  value={storage ? formatBytes(storage.total_size_bytes) : "0 Bytes"}
                  className="bg-muted font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium">{t("fieldAlertPartitions")}</Label>
                  <Input
                    readOnly
                    value={storage?.alert_events_partition_count || 0}
                    className="bg-muted font-mono"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium">{t("fieldMetricPartitions")}</Label>
                  <Input
                    readOnly
                    value={storage?.metrics_partition_count || 0}
                    className="bg-muted font-mono"
                  />
                </div>
              </div>

              <div className="pt-4 border-t">
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => setIsCleanupDialogOpen(true)}
                >
                  <Settings className="mr-2 h-4 w-4" />
                  {t("btnCleanup")}
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Security Settings */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="md:col-span-2"
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                {t("securityTitle")}
              </CardTitle>
              <CardDescription>{t("securityDescription")}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between p-4 rounded-lg border bg-muted/50">
                <div>
                  <p className="font-medium text-sm">{t("fieldPassword")}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {t("securityDescription")}
                  </p>
                </div>
                <Button onClick={() => setIsPasswordDialogOpen(true)}>
                  {t("btnChangePassword")}
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Change Password Dialog */}
      <Dialog open={isPasswordDialogOpen} onOpenChange={setIsPasswordDialogOpen}>
        <DialogContent className="bg-white border border-gray-200">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-gray-900">
              {t("dialogPasswordTitle")}
            </DialogTitle>
            <DialogDescription className="text-base text-gray-600">
              {t("dialogPasswordDescription")}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="old-password" className="font-medium text-gray-900">
                {t("fieldOldPassword")}
              </Label>
              <Input
                id="old-password"
                type="password"
                value={passwordForm.old_password}
                onChange={(e) =>
                  setPasswordForm({ ...passwordForm, old_password: e.target.value })
                }
                className="bg-white border-gray-300 text-gray-900"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="new-password" className="font-medium text-gray-900">
                {t("fieldNewPassword")}
              </Label>
              <Input
                id="new-password"
                type="password"
                value={passwordForm.new_password}
                onChange={(e) =>
                  setPasswordForm({ ...passwordForm, new_password: e.target.value })
                }
                className="bg-white border-gray-300 text-gray-900"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsPasswordDialogOpen(false)}
              disabled={changing}
            >
              {t("btnCancel")}
            </Button>
            <Button onClick={handleChangePassword} disabled={changing}>
              {changing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {t("btnSave")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Cleanup Confirmation Dialog */}
      <AlertDialog open={isCleanupDialogOpen} onOpenChange={setIsCleanupDialogOpen}>
        <AlertDialogContent className="bg-white border border-gray-200">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl font-bold text-gray-900">
              {t("btnCleanup")}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-base text-gray-600">
              {t("confirmCleanup")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={cleaning}>
              {t("btnCancel")}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmCleanup}
              disabled={cleaning}
            >
              {cleaning && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {t("btnCleanup")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
