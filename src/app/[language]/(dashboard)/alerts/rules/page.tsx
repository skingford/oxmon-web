"use client"

import { useCallback, useEffect, useState } from "react"
import { api, getApiErrorMessage } from "@/lib/api"
import { AlertRuleDetailResponse, CreateAlertRuleRequest } from "@/types/api"
import { useAppTranslations } from "@/hooks/use-app-translations"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
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
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  AlertCircle,
  AlertTriangle,
  Edit2,
  Info,
  Loader2,
  Plus,
  RefreshCw,
  Trash2,
} from "lucide-react"
import { toast } from "sonner"
import { motion } from "framer-motion"

function getSeverityBadgeClass(severity: string) {
  const normalized = severity.toLowerCase()

  if (normalized === "critical") {
    return "border-red-500/30 bg-red-500/10 text-red-600"
  }

  if (normalized === "warning") {
    return "border-amber-500/30 bg-amber-500/10 text-amber-600"
  }

  if (normalized === "info") {
    return "border-blue-500/30 bg-blue-500/10 text-blue-600"
  }

  return "border-muted bg-muted text-muted-foreground"
}

function getSeverityIcon(severity: string) {
  const normalized = severity.toLowerCase()

  if (normalized === "critical") {
    return AlertCircle
  }

  if (normalized === "warning") {
    return AlertTriangle
  }

  if (normalized === "info") {
    return Info
  }

  return AlertCircle
}

const DEFAULT_FORM_STATE: CreateAlertRuleRequest = {
  name: "",
  rule_type: "threshold",
  metric: "",
  agent_pattern: "*",
  severity: "warning",
  config_json: "{}",
  silence_secs: 300,
}

export default function AlertRulesPage() {
  const { t } = useAppTranslations("alerts")
  const [rules, setRules] = useState<AlertRuleDetailResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingRuleId, setEditingRuleId] = useState<string | null>(null)
  const [ruleForm, setRuleForm] = useState<CreateAlertRuleRequest>(DEFAULT_FORM_STATE)
  const [submitting, setSubmitting] = useState(false)
  const [metricNames, setMetricNames] = useState<string[]>([])
  const [loadingMetrics, setLoadingMetrics] = useState(false)
  const [allowManualInput, setAllowManualInput] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deletingRuleId, setDeletingRuleId] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)

  const fetchRules = useCallback(
    async (silent = false) => {
      if (silent) {
        setRefreshing(true)
      } else {
        setLoading(true)
      }

      try {
        const data = await api.getAlertRules({ limit: 100, offset: 0 })
        setRules(data)
      } catch (error) {
        toast.error(getApiErrorMessage(error, t("rules.toastFetchError")))
      } finally {
        setLoading(false)
        setRefreshing(false)
      }
    },
    [t]
  )

  useEffect(() => {
    fetchRules()
  }, [fetchRules])

  const fetchMetricNames = useCallback(async () => {
    setLoadingMetrics(true)
    setAllowManualInput(false)
    try {
      const names = await api.getMetricNames()
      if (names && names.length > 0) {
        setMetricNames(names)
        setAllowManualInput(false)
      } else {
        // 如果返回空列表，允许手动输入
        setAllowManualInput(true)
        setMetricNames([])
      }
    } catch (error) {
      // API 失败时允许手动输入（包括认证失败、网络错误等）
      console.warn("Failed to fetch metric names:", error)
      setAllowManualInput(true)
      setMetricNames([])
    } finally {
      setLoadingMetrics(false)
    }
  }, [])

  const handleOpenCreateDialog = () => {
    setEditingRuleId(null)
    setRuleForm(DEFAULT_FORM_STATE)
    setIsDialogOpen(true)
    fetchMetricNames()
  }

  const handleOpenEditDialog = (rule: AlertRuleDetailResponse) => {
    setEditingRuleId(rule.id)
    setRuleForm({
      name: rule.name,
      rule_type: rule.rule_type,
      metric: rule.metric,
      agent_pattern: rule.agent_pattern,
      severity: rule.severity,
      config_json: rule.config_json,
      silence_secs: rule.silence_secs,
    })
    setIsDialogOpen(true)
    fetchMetricNames()
  }

  const handleCloseDialog = () => {
    setIsDialogOpen(false)
    setEditingRuleId(null)
    setRuleForm(DEFAULT_FORM_STATE)
  }

  const handleSubmit = async () => {
    try {
      JSON.parse(ruleForm.config_json || "{}")
    } catch {
      toast.error(t("rules.toastInvalidConfigJson"))
      return
    }

    setSubmitting(true)

    try {
      if (editingRuleId) {
        await api.updateAlertRule(editingRuleId, ruleForm)
        toast.success(t("rules.toastUpdated"))
      } else {
        await api.createAlertRule(ruleForm)
        toast.success(t("rules.toastCreated"))
      }

      await fetchRules(true)
      handleCloseDialog()
    } catch (error) {
      const errorMsg = editingRuleId ? t("rules.toastUpdateError") : t("rules.toastCreateError")
      toast.error(getApiErrorMessage(error, errorMsg))
    } finally {
      setSubmitting(false)
    }
  }

  const handleOpenDeleteDialog = (id: string) => {
    setDeletingRuleId(id)
    setDeleteDialogOpen(true)
  }

  const handleConfirmDelete = async () => {
    if (!deletingRuleId) return

    setDeleting(true)
    try {
      await api.deleteAlertRule(deletingRuleId)
      toast.success(t("rules.toastDeleted"))
      await fetchRules(true)
      setDeleteDialogOpen(false)
      setDeletingRuleId(null)
    } catch (error) {
      toast.error(getApiErrorMessage(error, t("rules.toastDeleteError")))
    } finally {
      setDeleting(false)
    }
  }

  const handleToggleEnabled = async (rule: AlertRuleDetailResponse) => {
    try {
      await api.setAlertRuleEnabled(rule.id, { enabled: !rule.enabled })
      toast.success(rule.enabled ? t("rules.toastDisabled") : t("rules.toastEnabled"))
      await fetchRules(true)
    } catch (error) {
      toast.error(getApiErrorMessage(error, t("rules.toastToggleError")))
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">{t("rules.title")}</h2>
          <p className="text-sm text-muted-foreground">{t("rules.description")}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={handleOpenCreateDialog}>
            <Plus className="mr-2 h-4 w-4" />
            {t("rules.btnCreate")}
          </Button>
          <Button
            variant="outline"
            onClick={() => fetchRules(true)}
            disabled={loading || refreshing}
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
            刷新
          </Button>
        </div>
      </div>

      <Card className="glass-card">
        <CardHeader>
          <CardTitle>{t("rules.title")}</CardTitle>
          <CardDescription>查看和管理所有告警规则</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-hidden rounded-lg border border-white/10">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("rules.colName")}</TableHead>
                  <TableHead>{t("rules.colType")}</TableHead>
                  <TableHead>{t("rules.colMetric")}</TableHead>
                  <TableHead>{t("rules.colPattern")}</TableHead>
                  <TableHead>{t("rules.colSeverity")}</TableHead>
                  <TableHead>{t("rules.colSilence")}</TableHead>
                  <TableHead>{t("rules.colEnabled")}</TableHead>
                  <TableHead className="text-right">{t("rules.colActions")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={8} className="h-40 text-center text-muted-foreground">
                      <Loader2 className="mx-auto mb-2 h-5 w-5 animate-spin" />
                      Loading...
                    </TableCell>
                  </TableRow>
                ) : rules.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="h-40 text-center">
                      <div className="flex flex-col items-center gap-2 text-muted-foreground">
                        <AlertCircle className="h-10 w-10" />
                        <p className="font-semibold">{t("rules.emptyTitle")}</p>
                        <p className="text-sm">{t("rules.emptyDescription")}</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  rules.map((rule, index) => {
                    const SeverityIcon = getSeverityIcon(rule.severity)

                    return (
                      <motion.tr
                        key={rule.id}
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.2, delay: index * 0.05 }}
                        className="group"
                      >
                        <TableCell className="font-medium">{rule.name}</TableCell>
                        <TableCell className="text-sm">
                          {t(`rules.ruleTypes.${rule.rule_type}` as any) || rule.rule_type}
                        </TableCell>
                        <TableCell>{rule.metric}</TableCell>
                        <TableCell className="font-mono text-xs">{rule.agent_pattern}</TableCell>
                        <TableCell>
                          <Badge className={getSeverityBadgeClass(rule.severity)}>
                            <SeverityIcon className="mr-1 h-3 w-3" />
                            {t(`severity.${rule.severity.toLowerCase()}` as any)}
                          </Badge>
                        </TableCell>
                        <TableCell>{rule.silence_secs}s</TableCell>
                        <TableCell>
                          <Switch
                            checked={rule.enabled}
                            onCheckedChange={() => handleToggleEnabled(rule)}
                          />
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleOpenEditDialog(rule)}
                            >
                              <Edit2 className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleOpenDeleteDialog(rule.id)}
                              className="text-red-500 hover:text-red-600"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </motion.tr>
                    )
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen} modal>
        <DialogContent className="bg-white border border-gray-200 sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-gray-900">
              {editingRuleId ? t("rules.dialogEditTitle") : t("rules.dialogCreateTitle")}
            </DialogTitle>
            <DialogDescription className="text-base text-gray-600">
              {editingRuleId ? t("rules.dialogEditDesc") : t("rules.dialogCreateDesc")}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="rule-name" className="font-medium text-gray-900">
                {t("rules.fieldName")}
              </Label>
              <Input
                id="rule-name"
                value={ruleForm.name}
                onChange={(e) => setRuleForm({ ...ruleForm, name: e.target.value })}
                placeholder={t("rules.placeholderName")}
                className="bg-white border-gray-300 text-gray-900"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="rule-type" className="font-medium text-gray-900">
                  {t("rules.fieldType")}
                </Label>
                <Select
                  value={ruleForm.rule_type}
                  onValueChange={(value) => setRuleForm({ ...ruleForm, rule_type: value })}
                >
                  <SelectTrigger id="rule-type" className="bg-white border-gray-300 text-gray-900">
                    <SelectValue placeholder={t("rules.placeholderType")} />
                  </SelectTrigger>
                  <SelectContent className="bg-white">
                    <SelectItem value="threshold">{t("rules.ruleTypes.threshold")}</SelectItem>
                    <SelectItem value="rate_of_change">{t("rules.ruleTypes.rateOfChange")}</SelectItem>
                    <SelectItem value="anomaly">{t("rules.ruleTypes.anomaly")}</SelectItem>
                    <SelectItem value="availability">{t("rules.ruleTypes.availability")}</SelectItem>
                    <SelectItem value="pattern">{t("rules.ruleTypes.pattern")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="rule-metric" className="font-medium text-gray-900">
                  {t("rules.fieldMetric")}
                </Label>
                {allowManualInput || loadingMetrics ? (
                  <Input
                    id="rule-metric"
                    value={ruleForm.metric}
                    onChange={(e) => setRuleForm({ ...ruleForm, metric: e.target.value })}
                    placeholder={loadingMetrics ? t("rules.loadingMetrics") : t("rules.placeholderMetricManual")}
                    disabled={loadingMetrics}
                    className="bg-white border-gray-300 text-gray-900"
                  />
                ) : (
                  <Select
                    value={ruleForm.metric}
                    onValueChange={(value) => setRuleForm({ ...ruleForm, metric: value })}
                  >
                    <SelectTrigger id="rule-metric" className="bg-white border-gray-300 text-gray-900">
                      <SelectValue placeholder={t("rules.placeholderMetric")} />
                    </SelectTrigger>
                    <SelectContent className="bg-white max-h-[300px]">
                      {metricNames.length === 0 ? (
                        <div className="px-2 py-4 text-center text-sm text-gray-500">
                          {t("rules.noMetricsAvailable")}
                        </div>
                      ) : (
                        metricNames.map((name) => (
                          <SelectItem key={name} value={name}>
                            {name}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="rule-pattern" className="font-medium text-gray-900">
                  {t("rules.fieldPattern")}
                </Label>
                <Input
                  id="rule-pattern"
                  value={ruleForm.agent_pattern}
                  onChange={(e) => setRuleForm({ ...ruleForm, agent_pattern: e.target.value })}
                  placeholder={t("rules.placeholderPattern")}
                  className="bg-white border-gray-300 text-gray-900"
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="rule-severity" className="font-medium text-gray-900">
                  {t("rules.fieldSeverity")}
                </Label>
                <Select
                  value={ruleForm.severity}
                  onValueChange={(value) => setRuleForm({ ...ruleForm, severity: value })}
                >
                  <SelectTrigger id="rule-severity" className="bg-white border-gray-300 text-gray-900">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-white">
                    <SelectItem value="critical">{t("severity.critical")}</SelectItem>
                    <SelectItem value="warning">{t("severity.warning")}</SelectItem>
                    <SelectItem value="info">{t("severity.info")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="rule-config" className="font-medium text-gray-900">
                {t("rules.fieldConfig")}
              </Label>
              <Textarea
                id="rule-config"
                value={ruleForm.config_json}
                onChange={(e) => setRuleForm({ ...ruleForm, config_json: e.target.value })}
                placeholder={t("rules.placeholderConfig")}
                className="font-mono text-xs bg-white border-gray-300 text-gray-900"
                rows={4}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="rule-silence" className="font-medium text-gray-900">
                {t("rules.fieldSilence")}
              </Label>
              <Input
                id="rule-silence"
                type="number"
                value={ruleForm.silence_secs}
                onChange={(e) =>
                  setRuleForm({ ...ruleForm, silence_secs: parseInt(e.target.value) || 0 })
                }
                placeholder={t("rules.placeholderSilence")}
                className="bg-white border-gray-300 text-gray-900"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={handleCloseDialog} disabled={submitting}>
              {t("rules.btnCancel")}
            </Button>
            <Button onClick={handleSubmit} disabled={submitting}>
              {submitting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              {editingRuleId ? t("rules.btnUpdate") : t("rules.btnSave")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="bg-white border border-gray-200">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl font-bold text-gray-900">
              {t("rules.deleteDialogTitle")}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-base text-gray-600">
              {t("rules.deleteDialogDescription")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>
              {t("rules.btnCancel")}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              disabled={deleting}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {deleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t("rules.btnDeleting")}
                </>
              ) : (
                t("rules.btnDelete")
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
