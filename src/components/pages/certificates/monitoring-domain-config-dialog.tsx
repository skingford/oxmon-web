"use client"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { Loader2 } from "lucide-react"

type MonitoringDomainConfigDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description: string
  domain?: string
  showDomainReadonly?: boolean
  port: string
  onPortChange: (value: string) => void
  interval: string
  onIntervalChange: (value: string) => void
  note: string
  onNoteChange: (value: string) => void
  enabled: boolean
  onEnabledChange: (checked: boolean) => void
  enabledStatusLabel: string
  disabledStatusLabel: string
  checkAfterSave: boolean
  onCheckAfterSaveChange: (checked: boolean) => void
  checkAfterSaveLabel: string
  checkAfterSaveHint: string
  submitting: boolean
  onSubmit: () => void
  submitLabel: string
  submittingLabel: string
  cancelLabel: string
  labels: {
    domain: string
    port: string
    portPlaceholder: string
    interval: string
    intervalPlaceholder: string
    note: string
    notePlaceholder: string
    monitoringStatus: string
  }
  idPrefix: string
}

export function MonitoringDomainConfigDialog({
  open,
  onOpenChange,
  title,
  description,
  domain,
  showDomainReadonly = false,
  port,
  onPortChange,
  interval,
  onIntervalChange,
  note,
  onNoteChange,
  enabled,
  onEnabledChange,
  enabledStatusLabel,
  disabledStatusLabel,
  checkAfterSave,
  onCheckAfterSaveChange,
  checkAfterSaveLabel,
  checkAfterSaveHint,
  submitting,
  onSubmit,
  submitLabel,
  submittingLabel,
  cancelLabel,
  labels,
  idPrefix,
}: MonitoringDomainConfigDialogProps) {
  const portInputId = `${idPrefix}-port`
  const intervalInputId = `${idPrefix}-interval`
  const noteInputId = `${idPrefix}-note`

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {showDomainReadonly && domain ? (
            <div className="space-y-2">
              <Label>{labels.domain}</Label>
              <p className="rounded-md border bg-muted/30 px-3 py-2 text-sm font-mono">{domain}</p>
            </div>
          ) : null}

          <div className="space-y-2">
            <Label htmlFor={portInputId}>{labels.port}</Label>
            <Input
              id={portInputId}
              inputMode="numeric"
              placeholder={labels.portPlaceholder}
              value={port}
              onChange={(event) => onPortChange(event.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor={intervalInputId}>{labels.interval}</Label>
            <Input
              id={intervalInputId}
              inputMode="numeric"
              placeholder={labels.intervalPlaceholder}
              value={interval}
              onChange={(event) => onIntervalChange(event.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor={noteInputId}>{labels.note}</Label>
            <Textarea
              id={noteInputId}
              rows={3}
              placeholder={labels.notePlaceholder}
              value={note}
              onChange={(event) => onNoteChange(event.target.value)}
            />
          </div>

          <div className="flex items-center justify-between rounded-lg border p-3">
            <div>
              <p className="text-sm font-medium">{labels.monitoringStatus}</p>
              <p className="text-xs text-muted-foreground">
                {enabled ? enabledStatusLabel : disabledStatusLabel}
              </p>
            </div>
            <Switch checked={enabled} onCheckedChange={onEnabledChange} />
          </div>

          <div className="flex items-center justify-between rounded-lg border p-3">
            <div>
              <p className="text-sm font-medium">{checkAfterSaveLabel}</p>
              <p className="text-xs text-muted-foreground">{checkAfterSaveHint}</p>
            </div>
            <Switch checked={checkAfterSave} onCheckedChange={onCheckAfterSaveChange} />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" disabled={submitting} onClick={() => onOpenChange(false)}>
            {cancelLabel}
          </Button>
          <Button disabled={submitting} onClick={onSubmit}>
            {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            {submitting ? submittingLabel : submitLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
