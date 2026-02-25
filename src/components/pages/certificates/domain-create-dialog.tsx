"use client"

import type { FormEventHandler } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2, Plus } from "lucide-react"

type DomainCreateDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: FormEventHandler<HTMLFormElement>
  creating: boolean
  values: {
    domain: string
    port: string
    interval: string
    note: string
  }
  onChange: {
    domain: (value: string) => void
    port: (value: string) => void
    interval: (value: string) => void
    note: (value: string) => void
  }
  text: {
    trigger: string
    title: string
    description: string
    domainLabel: string
    domainPlaceholder: string
    portLabel: string
    portPlaceholder: string
    intervalLabel: string
    intervalPlaceholder: string
    noteLabel: string
    notePlaceholder: string
    cancel: string
    submit: string
    submitting: string
  }
}

export function DomainCreateDialog({
  open,
  onOpenChange,
  onSubmit,
  creating,
  values,
  onChange,
  text,
}: DomainCreateDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          {text.trigger}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{text.title}</DialogTitle>
          <DialogDescription>{text.description}</DialogDescription>
        </DialogHeader>

        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="domain-name">{text.domainLabel}</Label>
            <Input
              id="domain-name"
              value={values.domain}
              onChange={(event) => onChange.domain(event.target.value)}
              placeholder={text.domainPlaceholder}
              required
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="domain-port">{text.portLabel}</Label>
              <Input
                id="domain-port"
                value={values.port}
                onChange={(event) => onChange.port(event.target.value)}
                placeholder={text.portPlaceholder}
                inputMode="numeric"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="domain-interval">{text.intervalLabel}</Label>
              <Input
                id="domain-interval"
                value={values.interval}
                onChange={(event) => onChange.interval(event.target.value)}
                placeholder={text.intervalPlaceholder}
                inputMode="numeric"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="domain-note">{text.noteLabel}</Label>
            <Input
              id="domain-note"
              value={values.note}
              onChange={(event) => onChange.note(event.target.value)}
              placeholder={text.notePlaceholder}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              {text.cancel}
            </Button>
            <Button type="submit" disabled={creating}>
              {creating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              {creating ? text.submitting : text.submit}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
