"use client"

import { Check, Copy } from "lucide-react"
import { usePathname } from "next/navigation"
import { ReactNode, useEffect, useMemo, useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

type CopyCurlMenuTexts = {
  title: string
  normal: string
  insecure: string
}

type CopyCurlTooltipContent =
  | ReactNode
  | {
    title?: ReactNode
    description?: ReactNode
  }

type CopyCurlDropdownProps = {
  texts: CopyCurlMenuTexts
  onCopy: (insecure: boolean) => void
  triggerLabel: string
  preferenceKeyId?: string
  triggerSuffix?: ReactNode
  buttonClassName?: string
  buttonSize?: "sm" | "default"
  disabled?: boolean
  tooltip?: CopyCurlTooltipContent
  insecureBadgeLabel?: string
}

type CopyCurlSubmenuProps = {
  texts: CopyCurlMenuTexts
  onCopy: (insecure: boolean) => void
  label: string
  preferenceKeyId?: string
  suffix?: ReactNode
  insecureBadgeLabel?: string
}

type CopyCurlChoice = "normal" | "insecure"
const COPY_CURL_PREF_KEY_PREFIX = "copy-curl-pref:"

function isStructuredTooltip(
  value: CopyCurlTooltipContent | undefined
): value is { title?: ReactNode; description?: ReactNode } {
  return Boolean(value) && typeof value === "object" && "title" in value
}

function readStoredCopyCurlChoice(key: string): CopyCurlChoice | null {
  if (typeof window === "undefined") {
    return null
  }

  const value = window.localStorage.getItem(key)
  return value === "normal" || value === "insecure" ? value : null
}

function writeStoredCopyCurlChoice(key: string, choice: CopyCurlChoice) {
  if (typeof window === "undefined") {
    return
  }

  window.localStorage.setItem(key, choice)
}

export function CopyCurlDropdown({
  texts,
  onCopy,
  triggerLabel,
  preferenceKeyId,
  triggerSuffix,
  buttonClassName,
  buttonSize = "sm",
  disabled = false,
  tooltip,
  insecureBadgeLabel = "DEV ONLY",
}: CopyCurlDropdownProps) {
  const pathname = usePathname()
  const preferenceKey = useMemo(
    () => `${COPY_CURL_PREF_KEY_PREFIX}${pathname}:${preferenceKeyId || triggerLabel}`,
    [pathname, preferenceKeyId, triggerLabel]
  )
  const [preferredChoice, setPreferredChoice] = useState<CopyCurlChoice>("normal")

  useEffect(() => {
    const stored = readStoredCopyCurlChoice(preferenceKey)
    setPreferredChoice(stored || "normal")
  }, [preferenceKey])

  const handleCopyWithPreference = (insecure: boolean) => {
    const nextChoice: CopyCurlChoice = insecure ? "insecure" : "normal"
    setPreferredChoice(nextChoice)
    writeStoredCopyCurlChoice(preferenceKey, nextChoice)
    onCopy(insecure)
  }

  const tooltipNode: ReactNode =
    isStructuredTooltip(tooltip)
      ? (
        <div className="space-y-1">
          {tooltip.title ? <div className="font-medium">{tooltip.title}</div> : null}
          {tooltip.description ? <div className="text-background/85">{tooltip.description}</div> : null}
        </div>
      )
      : (tooltip ?? null)

  const triggerButton = (
    <Button type="button" variant="outline" size={buttonSize} className={buttonClassName} disabled={disabled}>
      <Copy className="mr-1 h-3.5 w-3.5" />
      {triggerLabel}
      {triggerSuffix}
    </Button>
  )

  const menuTrigger = (
    <DropdownMenuTrigger asChild>
      {triggerButton}
    </DropdownMenuTrigger>
  )

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <span className="inline-flex">
            <DropdownMenu>
              {menuTrigger}
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>{texts.title}</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => handleCopyWithPreference(false)}
                  className={preferredChoice === "normal" ? "bg-accent/40" : undefined}
                >
                  {preferredChoice === "normal" ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : null}
                  {texts.normal}
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => handleCopyWithPreference(true)}
                  className={preferredChoice === "insecure" ? "bg-accent/40" : undefined}
                >
                  {preferredChoice === "insecure" ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : null}
                  {texts.insecure}
                  <Badge variant="outline" className="ml-auto border-amber-300 text-amber-700">
                    {insecureBadgeLabel}
                  </Badge>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </span>
        </TooltipTrigger>
        {tooltipNode ? (
          <TooltipContent side="top" className="max-w-[280px]">
            {tooltipNode}
          </TooltipContent>
        ) : null}
      </Tooltip>
    </TooltipProvider>
  )
}

export function CopyCurlSubmenu({
  texts,
  onCopy,
  label,
  preferenceKeyId,
  suffix,
  insecureBadgeLabel = "DEV ONLY",
}: CopyCurlSubmenuProps) {
  const pathname = usePathname()
  const preferenceKey = useMemo(
    () => `${COPY_CURL_PREF_KEY_PREFIX}${pathname}:${preferenceKeyId || label}`,
    [pathname, preferenceKeyId, label]
  )
  const [preferredChoice, setPreferredChoice] = useState<CopyCurlChoice>("normal")

  useEffect(() => {
    const stored = readStoredCopyCurlChoice(preferenceKey)
    setPreferredChoice(stored || "normal")
  }, [preferenceKey])

  const handleCopyWithPreference = (insecure: boolean) => {
    const nextChoice: CopyCurlChoice = insecure ? "insecure" : "normal"
    setPreferredChoice(nextChoice)
    writeStoredCopyCurlChoice(preferenceKey, nextChoice)
    onCopy(insecure)
  }

  return (
    <DropdownMenuSub>
      <DropdownMenuSubTrigger>
        {label}
        {suffix}
      </DropdownMenuSubTrigger>
      <DropdownMenuSubContent>
        <DropdownMenuItem
          onClick={() => handleCopyWithPreference(false)}
          className={preferredChoice === "normal" ? "bg-accent/40" : undefined}
        >
          {preferredChoice === "normal" ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : null}
          {texts.normal}
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => handleCopyWithPreference(true)}
          className={preferredChoice === "insecure" ? "bg-accent/40" : undefined}
        >
          {preferredChoice === "insecure" ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : null}
          {texts.insecure}
          <Badge variant="outline" className="ml-auto border-amber-300 text-amber-700">
            {insecureBadgeLabel}
          </Badge>
        </DropdownMenuItem>
      </DropdownMenuSubContent>
    </DropdownMenuSub>
  )
}
