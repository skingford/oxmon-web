"use client"

import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Loader2 } from "lucide-react"

type DomainBatchCreateDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  value: string
  onValueChange: (value: string) => void
  onSubmit: () => void
  submitting: boolean
  text: {
    trigger: string
    title: string
    description: string
    fieldLabel: string
    placeholder: string
    cancel: string
    submit: string
  }
}

export function DomainBatchCreateDialog({
  open,
  onOpenChange,
  value,
  onValueChange,
  onSubmit,
  submitting,
  text,
}: DomainBatchCreateDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline">{text.trigger}</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{text.title}</DialogTitle>
          <DialogDescription>{text.description}</DialogDescription>
        </DialogHeader>

        <div className="space-y-2">
          <Label htmlFor="batch-domains">{text.fieldLabel}</Label>
          <Textarea
            id="batch-domains"
            value={value}
            onChange={(event) => onValueChange(event.target.value)}
            placeholder={text.placeholder}
            rows={8}
          />
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            {text.cancel}
          </Button>
          <Button type="button" onClick={onSubmit} disabled={submitting}>
            {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            {text.submit}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
