"use client"

import { Loader2 } from "lucide-react"
import { useAppTranslations } from "@/hooks/use-app-translations"
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

type AlertRuleDeleteDialogProps = {
  open: boolean
  deleting: boolean
  onOpenChange: (open: boolean) => void
  onConfirmDelete: () => void
}

export function AlertRuleDeleteDialog({
  open,
  deleting,
  onOpenChange,
  onConfirmDelete,
}: AlertRuleDeleteDialogProps) {
  const { t } = useAppTranslations("alerts")

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
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
            onClick={onConfirmDelete}
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
  )
}
