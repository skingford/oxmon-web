"use client"

import { useState, useEffect } from "react"
import { User, Copy, LogOut, Settings } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { toast } from "sonner"
import { getAuthToken, clearAuthToken } from "@/lib/auth-token"
import { withLocalePrefix } from "@/components/app-locale"
import { useAppLocale } from "@/hooks/use-app-locale"
import { useAppTranslations } from "@/hooks/use-app-translations"
import { useRouter } from "next/navigation"

export function AppHeaderUserMenu() {
  const { t } = useAppTranslations("header")
  const locale = useAppLocale()
  const router = useRouter()
  const [user, setUser] = useState<{ username?: string; sub?: string } | null>(null)

  useEffect(() => {
    const token = getAuthToken()
    if (token) {
      try {
        const payloadPart = token.split(".")[1]
        if (payloadPart) {
          const base64 = payloadPart.replace(/-/g, "+").replace(/_/g, "/")
          const decoded = JSON.parse(window.atob(base64))
          setUser(decoded)
        }
      } catch (e) {
        console.error("Failed to decode token", e)
      }
    }
  }, [])

  const handleCopyToken = () => {
    const token = getAuthToken()
    if (token) {
      navigator.clipboard.writeText(token)
      toast.success(t("toastTokenCopied"))
    } else {
      toast.error(t("toastNoToken"))
    }
  }

  const handleGoToProfile = () => {
    router.push(withLocalePrefix("/profile", locale))
  }

  const handleLogout = () => {
    clearAuthToken()
    window.location.replace(withLocalePrefix("/login", locale))
  }

  const username = user?.sub || user?.username || "Operator"
  const initials = username.slice(0, 2).toUpperCase()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-9 w-9 rounded-full">
          <Avatar className="h-9 w-9">
            <AvatarFallback className="bg-primary/10 text-xs font-medium">
              {initials}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">{username}</p>
            <p className="text-xs leading-none text-muted-foreground">
              {t("roleAdmin")}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleCopyToken}>
          <Copy className="mr-2 h-4 w-4" />
          {t("menuCopyToken")}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleGoToProfile}>
          <Settings className="mr-2 h-4 w-4" />
          {t("menuProfile")}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleLogout}>
          <LogOut className="mr-2 h-4 w-4" />
          {t("menuLogout")}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
