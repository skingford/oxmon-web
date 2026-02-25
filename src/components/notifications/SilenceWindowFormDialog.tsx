"use client"

import type { FormEvent } from "react"
import type { SilenceFormState } from "@/lib/notifications/silence-utils"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Loader2 } from "lucide-react"

type TranslateFn = (path: string, values?: Record<string, string | number>) => string

type SilenceWindowFormDialogProps = {
  t: TranslateFn
  open: boolean
  mode: "create" | "edit"
  form: SilenceFormState
  submitting: boolean
  onOpenChange: (open: boolean) => void
  onFormChange: (updater: (previous: SilenceFormState) => SilenceFormState) => void
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
  editWindowId?: string | null
  replaceOriginalAfterEdit?: boolean
  onReplaceOriginalAfterEditChange?: (value: boolean) => void
}

export function SilenceWindowFormDialog({
  t,
  open,
  mode,
  form,
  submitting,
  onOpenChange,
  onFormChange,
  onSubmit,
  editWindowId,
  replaceOriginalAfterEdit,
  onReplaceOriginalAfterEditChange,
}: SilenceWindowFormDialogProps) {
  const isEdit = mode === "edit"
  const idPrefix = isEdit ? "silence-edit" : "silence"

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {isEdit ? t("notifications.silenceEditDialogTitle") : t("notifications.silenceCreateDialogTitle")}
          </DialogTitle>
          <DialogDescription>
            {isEdit
              ? t("notifications.silenceEditDialogDescription", {
                  id: editWindowId || t("notifications.silenceUnknownId"),
                })
              : t("notifications.silenceCreateDialogDescription")}
          </DialogDescription>
        </DialogHeader>

        <form className="space-y-4" onSubmit={onSubmit}>
          <div className="space-y-2">
            <Label htmlFor={`${idPrefix}-start-time`}>{t("notifications.silenceFieldStart")}</Label>
            <Input
              id={`${idPrefix}-start-time`}
              type="datetime-local"
              value={form.startTime}
              onChange={(event) =>
                onFormChange((previous) => ({
                  ...previous,
                  startTime: event.target.value,
                }))
              }
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor={`${idPrefix}-end-time`}>{t("notifications.silenceFieldEnd")}</Label>
            <Input
              id={`${idPrefix}-end-time`}
              type="datetime-local"
              value={form.endTime}
              onChange={(event) =>
                onFormChange((previous) => ({
                  ...previous,
                  endTime: event.target.value,
                }))
              }
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor={`${idPrefix}-recurrence`}>{t("notifications.silenceFieldRecurrence")}</Label>
            <Input
              id={`${idPrefix}-recurrence`}
              value={form.recurrence}
              onChange={(event) =>
                onFormChange((previous) => ({
                  ...previous,
                  recurrence: event.target.value,
                }))
              }
              placeholder={t("notifications.silenceFieldRecurrencePlaceholder")}
            />
            <p className="text-xs text-muted-foreground">{t("notifications.silenceFieldRecurrenceHint")}</p>
          </div>

          {isEdit && typeof replaceOriginalAfterEdit === "boolean" && onReplaceOriginalAfterEditChange ? (
            <div className="flex items-start justify-between rounded-md border p-3">
              <div className="space-y-1">
                <p className="text-sm font-medium">{t("notifications.silenceFieldReplaceOriginal")}</p>
                <p className="text-xs text-muted-foreground">{t("notifications.silenceFieldReplaceOriginalHint")}</p>
              </div>
              <Switch checked={replaceOriginalAfterEdit} onCheckedChange={onReplaceOriginalAfterEditChange} />
            </div>
          ) : null}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>
              {t("notifications.silenceDialogCancel")}
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              {isEdit
                ? submitting
                  ? t("notifications.silenceDialogUpdating")
                  : t("notifications.silenceDialogUpdateSubmit")
                : submitting
                  ? t("notifications.silenceDialogCreating")
                  : t("notifications.silenceDialogCreateSubmit")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
