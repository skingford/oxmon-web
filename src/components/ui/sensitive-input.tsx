"use client"

import { useEffect, useState } from "react"
import { Copy, Eye, EyeOff } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { toastCopied } from "@/lib/toast"
import { cn } from "@/lib/utils"

type SensitiveInputProps = Omit<React.ComponentProps<typeof Input>, "type"> & {
  hideLabel: string
  showLabel: string
  resetKey?: string | number | boolean
  copyLabel?: string
  copiedMessage?: string
  enableCopy?: boolean
}

export function SensitiveInput({
  className,
  hideLabel,
  showLabel,
  resetKey,
  copyLabel,
  copiedMessage,
  enableCopy = false,
  ...props
}: SensitiveInputProps) {
  const [revealed, setRevealed] = useState(false)
  const stringValue = typeof props.value === "string" ? props.value : ""

  useEffect(() => {
    setRevealed(false)
  }, [resetKey])

  return (
    <TooltipProvider>
      <div className="relative">
        <Input
          {...props}
          type={revealed ? "text" : "password"}
          className={cn(enableCopy ? "pr-18" : "pr-10", className)}
        />

        {enableCopy ? (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-8 top-1/2 h-7 w-7 -translate-y-1/2"
                onClick={async () => {
                  if (!stringValue) {
                    return
                  }

                  await navigator.clipboard.writeText(stringValue)
                  toastCopied(copiedMessage || copyLabel || "已复制")
                }}
                aria-label={copyLabel || "复制"}
                disabled={!stringValue}
              >
                <Copy className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="top">{copyLabel || "复制"}</TooltipContent>
          </Tooltip>
        ) : null}

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="absolute right-1 top-1/2 h-7 w-7 -translate-y-1/2"
              onClick={() => setRevealed((previous) => !previous)}
              aria-label={revealed ? hideLabel : showLabel}
            >
              {revealed ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent side="top">
            {revealed ? hideLabel : showLabel}
          </TooltipContent>
        </Tooltip>
      </div>
    </TooltipProvider>
  )
}
