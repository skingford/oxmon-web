import { useCallback, useState } from "react"
import { api } from "@/lib/api"
import { normalizeAlertRulePayload } from "@/lib/alerts/rule-form"
import type { AppNamespaceTranslator } from "@/hooks/use-app-translations"
import { AlertRuleResponse, CreateAlertRuleRequest } from "@/types/api"
import { toast, toastApiError } from "@/lib/toast"

type UseAlertRulesActionsOptions = {
  t: AppNamespaceTranslator<"alerts">
  fetchRules: (silent?: boolean) => Promise<void>
  editingRuleId: string | null
  ruleForm: CreateAlertRuleRequest
  onCloseDialog: () => void
  deletingRuleId: string | null
  onDeleteDone: () => void
}

export function useAlertRulesActions({
  t,
  fetchRules,
  editingRuleId,
  ruleForm,
  onCloseDialog,
  deletingRuleId,
  onDeleteDone,
}: UseAlertRulesActionsOptions) {
  const [submitting, setSubmitting] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const handleSubmit = useCallback(async () => {
    const normalizedPayload = normalizeAlertRulePayload(ruleForm)

    try {
      JSON.parse(normalizedPayload.config_json || "{}")
    } catch {
      toast.error(t("rules.toastInvalidConfigJson"))
      return
    }

    setSubmitting(true)

    try {
      if (editingRuleId) {
        await api.updateAlertRule(editingRuleId, normalizedPayload)
        toast.success(t("rules.toastUpdated"))
      } else {
        await api.createAlertRule(normalizedPayload)
        toast.success(t("rules.toastCreated"))
      }

      await fetchRules(true)
      onCloseDialog()
    } catch (error) {
      const errorMsg = editingRuleId ? t("rules.toastUpdateError") : t("rules.toastCreateError")
      toastApiError(error, errorMsg)
    } finally {
      setSubmitting(false)
    }
  }, [editingRuleId, fetchRules, onCloseDialog, ruleForm, t])

  const handleConfirmDelete = useCallback(async () => {
    if (!deletingRuleId) {
      return
    }

    setDeleting(true)
    try {
      await api.deleteAlertRule(deletingRuleId)
      toast.success(t("rules.toastDeleted"))
      await fetchRules(true)
      onDeleteDone()
    } catch (error) {
      toastApiError(error, t("rules.toastDeleteError"))
    } finally {
      setDeleting(false)
    }
  }, [deletingRuleId, fetchRules, onDeleteDone, t])

  const handleToggleEnabled = useCallback(
    async (rule: AlertRuleResponse) => {
      try {
        await api.setAlertRuleEnabled(rule.id, { enabled: !rule.enabled })
        toast.success(rule.enabled ? t("rules.toastDisabled") : t("rules.toastEnabled"))
        await fetchRules(true)
      } catch (error) {
        toastApiError(error, t("rules.toastToggleError"))
      }
    },
    [fetchRules, t]
  )

  return {
    submitting,
    deleting,
    handleSubmit,
    handleConfirmDelete,
    handleToggleEnabled,
  }
}
