"use client"

import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { Loader2 } from "lucide-react"

type TranslateFn = (path: string, values?: Record<string, string | number>) => string

type SilenceWindowDeleteDialogProps = {
  t: TranslateFn
  open: boolean
  deleting: boolean
  targetId?: string | null
  onOpenChange: (open: boolean) => void
  onConfirm: () => void
}

export function SilenceWindowDeleteDialog({
  t,
  open,
  deleting,
  targetId,
  onOpenChange,
  onConfirm,
}: SilenceWindowDeleteDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t("notifications.silenceDeleteDialogTitle")}</AlertDialogTitle>
          <AlertDialogDescription>
            {t("notifications.silenceDeleteDialogDescription", {
              id: targetId || t("notifications.silenceUnknownId"),
            })}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={deleting}>{t("notifications.silenceDialogCancel")}</AlertDialogCancel>
          <AlertDialogAction variant="destructive" onClick={onConfirm} disabled={deleting}>
            {deleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            {t("notifications.silenceDeleteDialogConfirm")}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
