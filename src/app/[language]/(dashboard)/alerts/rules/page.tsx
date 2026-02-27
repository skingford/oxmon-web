"use client";

import { useMemo } from "react";
import { useAppTranslations } from "@/hooks/use-app-translations";
import { useAlertRulesActions } from "@/hooks/use-alert-rules-actions";
import { useAlertRulesData } from "@/hooks/use-alert-rules-data";
import { useAlertRulesDialogState } from "@/hooks/use-alert-rules-dialog-state";
import { api } from "@/lib/api";
import { AlertRuleDeleteDialog } from "@/components/alerts/AlertRuleDeleteDialog";
import { AlertRuleFormFields } from "@/components/alerts/AlertRuleFormFields";
import { AlertRulesPageHeader } from "@/components/alerts/AlertRulesHeader";
import { AlertRulesTable } from "@/components/alerts/AlertRulesTable";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Loader2 } from "lucide-react";
import { toast, toastApiError } from "@/lib/toast";

function normalizeMetricKey(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]/g, "");
}

export default function AlertRulesPage() {
  const { t } = useAppTranslations("alerts");

  const {
    rules,
    loading,
    refreshing,
    metricOptions,
    loadingMetrics,
    allowManualInput,
    fetchRules,
    fetchMetricNames,
  } = useAlertRulesData({ t });

  const {
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
  } = useAlertRulesDialogState();

  const handleOpenCreateDialog = () => {
    openCreateDialog();
    fetchMetricNames();
  };

  const handleOpenEditDialog = async (ruleId: string) => {
    try {
      const detail = await api.getAlertRule(ruleId);
      openEditDialog(detail);
      fetchMetricNames();
    } catch (error) {
      toastApiError(error, t("rules.toastFetchError"));
    }
  };

  const {
    submitting,
    deleting,
    handleSubmit,
    handleConfirmDelete,
    handleToggleEnabled,
  } = useAlertRulesActions({
    t,
    fetchRules,
    editingRuleId,
    ruleForm,
    onCloseDialog: closeDialog,
    deletingRuleId,
    onDeleteDone: closeDeleteDialog,
  });

  const metricLabelMap = useMemo(() => {
    const map: Record<string, string> = {};
    metricOptions.forEach((item) => {
      if (!item.value) return;
      map[item.value] = item.label || item.value;
      map[normalizeMetricKey(item.value)] = item.label || item.value;
    });
    return map;
  }, [metricOptions]);

  return (
    <div className="space-y-6">
      <AlertRulesPageHeader
        loading={loading}
        refreshing={refreshing}
        onCreate={handleOpenCreateDialog}
        onRefresh={() => fetchRules(true)}
      />

      <AlertRulesTable
        loading={loading}
        rules={rules}
        metricLabelMap={metricLabelMap}
        onToggleEnabled={handleToggleEnabled}
        onEditRule={(rule) => handleOpenEditDialog(rule.id)}
        onDeleteRule={openDeleteDialog}
      />

      <Dialog open={isDialogOpen} onOpenChange={handleDialogOpenChange} modal>
        <DialogContent className="bg-white border border-gray-200 sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-gray-900">
              {editingRuleId
                ? t("rules.dialogEditTitle")
                : t("rules.dialogCreateTitle")}
            </DialogTitle>
            <DialogDescription className="text-base text-gray-600">
              {editingRuleId
                ? t("rules.dialogEditDesc")
                : t("rules.dialogCreateDesc")}
            </DialogDescription>
          </DialogHeader>

          <AlertRuleFormFields
            ruleForm={ruleForm}
            metricOptions={metricOptions}
            loadingMetrics={loadingMetrics}
            allowManualInput={allowManualInput}
            onRuleFormChange={(next) => setRuleForm(next)}
          />

          <DialogFooter>
            <Button
              variant="outline"
              onClick={closeDialog}
              disabled={submitting}
            >
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

      <AlertRuleDeleteDialog
        open={deleteDialogOpen}
        deleting={deleting}
        onOpenChange={handleDeleteDialogOpenChange}
        onConfirmDelete={handleConfirmDelete}
      />
    </div>
  );
}
