"use client"

import { Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"

type CloudAccountBatchImportDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  provider: string
  onProviderChange: (value: string) => void
  collectionIntervalSecs: string
  onCollectionIntervalSecsChange: (value: string) => void
  textValue: string
  onTextValueChange: (value: string) => void
  submitting: boolean
  onSubmit: () => void
  texts: {
    trigger: string
    title: string
    description: string
    fieldProvider: string
    fieldCollectionInterval: string
    fieldCollectionIntervalPlaceholder: string
    fieldText: string
    fieldTextHint: string
    fieldTextPlaceholder: string
    cancel: string
    submit: string
  }
}

export function CloudAccountBatchImportDialog({
  open,
  onOpenChange,
  provider,
  onProviderChange,
  collectionIntervalSecs,
  onCollectionIntervalSecsChange,
  textValue,
  onTextValueChange,
  submitting,
  onSubmit,
  texts,
}: CloudAccountBatchImportDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button type="button" variant="outline">{texts.trigger}</Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{texts.title}</DialogTitle>
          <DialogDescription>{texts.description}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="cloud-batch-provider">{texts.fieldProvider}</Label>
              <Select value={provider} onValueChange={onProviderChange}>
                <SelectTrigger id="cloud-batch-provider">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="tencent">Tencent</SelectItem>
                  <SelectItem value="alibaba">Alibaba / Aliyun</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="cloud-batch-collection-interval">{texts.fieldCollectionInterval}</Label>
              <Input
                id="cloud-batch-collection-interval"
                type="number"
                min={1}
                step={1}
                value={collectionIntervalSecs}
                onChange={(event) => onCollectionIntervalSecsChange(event.target.value)}
                placeholder={texts.fieldCollectionIntervalPlaceholder}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="cloud-batch-text">{texts.fieldText}</Label>
            <Textarea
              id="cloud-batch-text"
              rows={10}
              value={textValue}
              onChange={(event) => onTextValueChange(event.target.value)}
              placeholder={texts.fieldTextPlaceholder}
            />
            <p className="text-xs text-muted-foreground">{texts.fieldTextHint}</p>
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>
            {texts.cancel}
          </Button>
          <Button type="button" onClick={onSubmit} disabled={submitting}>
            {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            {texts.submit}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
