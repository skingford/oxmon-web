import { useCallback, useState } from "react"
import { AlertRuleDetailResponse, CreateAlertRuleRequest } from "@/types/api"
import {
  createDefaultAlertRuleFormState,
  mapAlertRuleToFormState,
} from "@/lib/alerts/rule-form"

export function useAlertRulesDialogState() {
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingRuleId, setEditingRuleId] = useState<string | null>(null)
  const [ruleForm, setRuleForm] = useState<CreateAlertRuleRequest>(createDefaultAlertRuleFormState)

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deletingRuleId, setDeletingRuleId] = useState<string | null>(null)

  const openCreateDialog = useCallback(() => {
    setEditingRuleId(null)
    setRuleForm(createDefaultAlertRuleFormState())
    setIsDialogOpen(true)
  }, [])

  const openEditDialog = useCallback((rule: AlertRuleDetailResponse) => {
    setEditingRuleId(rule.id)
    setRuleForm(mapAlertRuleToFormState(rule))
    setIsDialogOpen(true)
  }, [])

  const closeDialog = useCallback(() => {
    setIsDialogOpen(false)
    setEditingRuleId(null)
    setRuleForm(createDefaultAlertRuleFormState())
  }, [])

  const handleDialogOpenChange = useCallback(
    (open: boolean) => {
      if (!open) {
        closeDialog()
        return
      }

      setIsDialogOpen(true)
    },
    [closeDialog]
  )

  const openDeleteDialog = useCallback((id: string) => {
    setDeletingRuleId(id)
    setDeleteDialogOpen(true)
  }, [])

  const closeDeleteDialog = useCallback(() => {
    setDeleteDialogOpen(false)
    setDeletingRuleId(null)
  }, [])

  const handleDeleteDialogOpenChange = useCallback(
    (open: boolean) => {
      if (!open) {
        closeDeleteDialog()
        return
      }

      setDeleteDialogOpen(true)
    },
    [closeDeleteDialog]
  )

  return {
    isDialogOpen,
    editingRuleId,
    ruleForm,
    setRuleForm,
    deleteDialogOpen,
    deletingRuleId,
    openCreateDialog,
    openEditDialog,
    closeDialog,
    handleDialogOpenChange,
    openDeleteDialog,
    closeDeleteDialog,
    handleDeleteDialogOpenChange,
  }
}
