"use client"

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
import { Button } from "@/components/ui/button"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ChevronDown, Loader2 } from "lucide-react"

type DomainAutoCreateDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  autoCreating: boolean
  advancedOpen: boolean
  onAdvancedOpenChange: (open: boolean) => void
  clearAdvancedDialogOpen: boolean
  onClearAdvancedDialogOpenChange: (open: boolean) => void
  autoCreateHasAdvancedDraft: boolean
  values: {
    port: string
    interval: string
    note: string
  }
  onChange: {
    port: (value: string) => void
    interval: (value: string) => void
    note: (value: string) => void
  }
  onResetAdvanced: () => void
  onCancel: () => void
  onSubmit: () => void
  text: {
    title: string
    description: string
    advancedToggle: string
    advancedHint: string
    advancedReset: string
    fieldPort: string
    fieldPortPlaceholder: string
    fieldInterval: string
    fieldIntervalPlaceholder: string
    fieldNote: string
    fieldNotePlaceholder: string
    cancel: string
    submit: string
    submitting: string
    clearDialogTitle: string
    clearDialogDescription: string
    clearDialogConfirm: string
  }
}

export function DomainAutoCreateDialog({
  open,
  onOpenChange,
  autoCreating,
  advancedOpen,
  onAdvancedOpenChange,
  clearAdvancedDialogOpen,
  onClearAdvancedDialogOpenChange,
  autoCreateHasAdvancedDraft,
  values,
  onChange,
  onResetAdvanced,
  onCancel,
  onSubmit,
  text,
}: DomainAutoCreateDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{text.title}</DialogTitle>
          <DialogDescription>{text.description}</DialogDescription>
        </DialogHeader>

        <Collapsible open={advancedOpen} onOpenChange={onAdvancedOpenChange}>
          <CollapsibleTrigger asChild>
            <Button type="button" variant="outline" className="w-full justify-between" disabled={autoCreating}>
              {text.advancedToggle}
              <ChevronDown className={`h-4 w-4 transition-transform ${advancedOpen ? "rotate-180" : ""}`} />
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-3 pt-3">
            <div className="flex items-center justify-between gap-2">
              <p className="text-xs text-muted-foreground">{text.advancedHint}</p>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => onClearAdvancedDialogOpenChange(true)}
                disabled={autoCreating || !autoCreateHasAdvancedDraft}
              >
                {text.advancedReset}
              </Button>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="auto-create-port">{text.fieldPort}</Label>
                <Input
                  id="auto-create-port"
                  value={values.port}
                  onChange={(event) => onChange.port(event.target.value)}
                  placeholder={text.fieldPortPlaceholder}
                  inputMode="numeric"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="auto-create-interval">{text.fieldInterval}</Label>
                <Input
                  id="auto-create-interval"
                  value={values.interval}
                  onChange={(event) => onChange.interval(event.target.value)}
                  placeholder={text.fieldIntervalPlaceholder}
                  inputMode="numeric"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="auto-create-note">{text.fieldNote}</Label>
              <Input
                id="auto-create-note"
                value={values.note}
                onChange={(event) => onChange.note(event.target.value)}
                placeholder={text.fieldNotePlaceholder}
              />
            </div>
          </CollapsibleContent>
        </Collapsible>

        <AlertDialog open={clearAdvancedDialogOpen} onOpenChange={onClearAdvancedDialogOpenChange}>
          <AlertDialogContent size="sm">
            <AlertDialogHeader>
              <AlertDialogTitle>{text.clearDialogTitle}</AlertDialogTitle>
              <AlertDialogDescription>{text.clearDialogDescription}</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>{text.cancel}</AlertDialogCancel>
              <AlertDialogAction variant="destructive" onClick={onResetAdvanced}>
                {text.clearDialogConfirm}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={autoCreating}
          >
            {text.cancel}
          </Button>
          <Button type="button" onClick={onSubmit} disabled={autoCreating}>
            {autoCreating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            {autoCreating ? text.submitting : text.submit}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
