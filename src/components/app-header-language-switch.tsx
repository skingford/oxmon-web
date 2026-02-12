"use client"

import Link from "next/link"
import { usePathname, useSearchParams } from "next/navigation"
import { Check, Languages } from "lucide-react"
import { withLocalePrefix } from "@/components/app-locale"
import { useAppTranslations } from "@/hooks/use-app-translations"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"

export function AppHeaderLanguageSwitch() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const { locale, t } = useAppTranslations("navigation")

  const localeSwitchLabel = t("labels.switchLanguage")
  const chineseLabel = t("labels.languageChinese")
  const englishLabel = t("labels.languageEnglish")

  const queryString = searchParams.toString()
  const currentPathWithChinese = `${withLocalePrefix(pathname, "zh")}${queryString ? `?${queryString}` : ""}`
  const currentPathWithEnglish = `${withLocalePrefix(pathname, "en")}${queryString ? `?${queryString}` : ""}`

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="h-8 gap-1 rounded-full px-2"
          aria-label={localeSwitchLabel}
        >
          <Languages className="size-4" />
          <span className="inline-flex items-center rounded-full border border-border/70 bg-muted/40 p-0.5 text-[11px] leading-none">
            <span
              className={cn(
                "rounded-full px-1.5 py-0.5 font-medium transition-colors",
                locale === "zh" ? "bg-primary text-primary-foreground" : "text-muted-foreground"
              )}
            >
              中
            </span>
            <span
              className={cn(
                "rounded-full px-1.5 py-0.5 font-medium transition-colors",
                locale === "en" ? "bg-primary text-primary-foreground" : "text-muted-foreground"
              )}
            >
              EN
            </span>
          </span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        sideOffset={8}
        className="z-[70] w-44 border-border/70 bg-popover/100 backdrop-blur-none"
      >
        <DropdownMenuLabel>{localeSwitchLabel}</DropdownMenuLabel>
        <DropdownMenuSeparator />

        {locale === "zh" ? (
          <DropdownMenuItem
            disabled
            className="flex w-full items-center justify-between opacity-100"
          >
            <span>{chineseLabel}</span>
            <Check className="size-4" />
          </DropdownMenuItem>
        ) : (
          <DropdownMenuItem asChild>
            <Link href={currentPathWithChinese} className="flex w-full items-center justify-between">
              <span>{chineseLabel}</span>
            </Link>
          </DropdownMenuItem>
        )}

        {locale === "en" ? (
          <DropdownMenuItem
            disabled
            className="flex w-full items-center justify-between opacity-100"
          >
            <span>{englishLabel}</span>
            <Check className="size-4" />
          </DropdownMenuItem>
        ) : (
          <DropdownMenuItem asChild>
            <Link href={currentPathWithEnglish} className="flex w-full items-center justify-between">
              <span>{englishLabel}</span>
            </Link>
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
