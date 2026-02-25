"use client"

import { CertCheckResult } from "@/types/api"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Loader2 } from "lucide-react"

type DomainHistoryDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  historyItems: CertCheckResult[]
  historyLoading: boolean
  formatDateTime: (value: string | null, locale: "zh" | "en") => string
  locale: "zh" | "en"
  text: {
    title: string
    description: string
    loading: string
    empty: string
    statusValid: string
    statusInvalid: string
    noError: string
  }
}

export function DomainHistoryDialog({
  open,
  onOpenChange,
  historyItems,
  historyLoading,
  formatDateTime,
  locale,
  text,
}: DomainHistoryDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{text.title}</DialogTitle>
          <DialogDescription>{text.description}</DialogDescription>
        </DialogHeader>

        {historyLoading ? (
          <div className="py-8 text-center text-muted-foreground">
            <Loader2 className="mx-auto mb-2 h-5 w-5 animate-spin" />
            {text.loading}
          </div>
        ) : historyItems.length === 0 ? (
          <div className="py-8 text-center text-muted-foreground">
            {text.empty}
          </div>
        ) : (
          <div className="space-y-3">
            {historyItems.map((item) => (
              <div key={item.id} className="rounded-md border p-3">
                <div className="flex items-center justify-between gap-3">
                  <Badge
                    className={item.is_valid && item.chain_valid
                      ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-600"
                      : "border-red-500/30 bg-red-500/10 text-red-600"}
                  >
                    {item.is_valid && item.chain_valid ? text.statusValid : text.statusInvalid}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {formatDateTime(item.checked_at, locale)}
                  </span>
                </div>
                <p className="mt-2 text-sm text-muted-foreground">
                  {item.error || text.noError}
                </p>
              </div>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
