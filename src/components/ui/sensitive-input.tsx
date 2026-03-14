"use client"

import { useEffect, useRef, useState } from "react"
import { Check, Copy, Eye, EyeOff } from "lucide-react"
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
  maskedPreview?: boolean
}

function maskSensitiveValue(value: string) {
  if (!value) {
    return ""
  }

  if (value.length <= 4) {
    return "*".repeat(value.length)
  }

  if (value.length <= 8) {
    return `${value.slice(0, 1)}${"*".repeat(Math.max(1, value.length - 2))}${value.slice(-1)}`
  }

  return `${value.slice(0, 3)}${"*".repeat(Math.max(4, value.length - 7))}${value.slice(-4)}`
}

export function SensitiveInput({
  className,
  hideLabel,
  showLabel,
  resetKey,
  copyLabel,
  copiedMessage,
  enableCopy = false,
  maskedPreview = false,
  ...props
}: SensitiveInputProps) {
  const [revealed, setRevealed] = useState(false)
  const [copied, setCopied] = useState(false)
  const copiedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const stringValue = typeof props.value === "string" ? props.value : ""
  const isReadOnly = Boolean(props.readOnly)
  const shouldShowMaskedPreview = isReadOnly && maskedPreview && !revealed
  const displayValue = shouldShowMaskedPreview
    ? maskSensitiveValue(stringValue)
    : stringValue

  useEffect(() => {
    setRevealed(false)
  }, [resetKey])

  useEffect(() => {
    return () => {
      if (copiedTimerRef.current !== null) {
        clearTimeout(copiedTimerRef.current)
      }
    }
  }, [])

  return (
    <TooltipProvider>
      <div className="relative">
        <Input
          {...props}
          type={shouldShowMaskedPreview || revealed ? "text" : "password"}
          value={displayValue}
          className={cn(
            enableCopy ? "pr-18" : "pr-10",
            isReadOnly && "bg-muted/40",
            className,
          )}
        />

        {enableCopy ? (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className={cn(
                  "absolute right-8 top-1/2 h-7 w-7 -translate-y-1/2",
                  copied && "text-emerald-600 hover:text-emerald-700",
                )}
                onClick={async () => {
                  if (!stringValue) {
                    return
                  }

                  await navigator.clipboard.writeText(stringValue)
                  setCopied(true)
                  if (copiedTimerRef.current !== null) {
                    clearTimeout(copiedTimerRef.current)
                  }
                  copiedTimerRef.current = setTimeout(() => {
                    setCopied(false)
                    copiedTimerRef.current = null
                  }, 1400)
                  toastCopied(copiedMessage || copyLabel || "已复制")
                }}
                aria-label={copied ? (copiedMessage || "已复制") : (copyLabel || "复制")}
                disabled={!stringValue}
              >
                {copied ? (
                  <Check className="h-4 w-4" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent side="top">
              {copied ? (copiedMessage || "已复制") : (copyLabel || "复制")}
            </TooltipContent>
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
