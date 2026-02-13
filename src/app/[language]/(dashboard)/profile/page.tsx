"use client"

import { useState, useEffect } from "react"
import { getAuthToken, clearAuthToken } from "@/lib/auth-token"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { User, Copy, Shield, LogOut, Eye, EyeOff, Loader2, AlertTriangle } from "lucide-react"
import { motion } from "framer-motion"
import { withLocalePrefix } from "@/components/app-locale"
import { useAppLocale } from "@/hooks/use-app-locale"
import { useAppTranslations } from "@/hooks/use-app-translations"

type JwtPayload = {
  sub?: string
  username?: string
  iat?: number
  exp?: number
}

export default function ProfilePage() {
  const { t } = useAppTranslations("profile")
  const locale = useAppLocale()
  const [token, setToken] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [showToken, setShowToken] = useState(false)
  const [user, setUser] = useState<JwtPayload | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const t = getAuthToken()
    setToken(t)

    if (t) {
      try {
        const payloadPart = t.split(".")[1]
        if (payloadPart) {
          const base64 = payloadPart.replace(/-/g, "+").replace(/_/g, "/")
          const decoded = JSON.parse(window.atob(base64)) as JwtPayload
          setUser(decoded)
        }
      } catch (e) {
        console.error("Failed to decode token", e)
      }
    }
    setLoading(false)
  }, [])

  const handleCopy = () => {
    if (token) {
      navigator.clipboard.writeText(token)
      setCopied(true)
      toast.success(t("toastTokenCopied"))
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const handleLogout = () => {
    clearAuthToken()
    window.location.replace(withLocalePrefix("/login", locale))
  }

  if (loading) {
    return (
      <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-6 p-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">{t("title")}</h2>
          <p className="text-sm text-muted-foreground">{t("description")}</p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Account Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              {t("accountTitle")}
            </CardTitle>
            <CardDescription>{t("accountDescription")}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4"
            >
              <div className="space-y-2">
                <Label className="text-sm font-medium">{t("fieldUsername")}</Label>
                <Input
                  readOnly
                  value={user?.sub || user?.username || "Operator"}
                  className="bg-muted"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium">{t("fieldRole")}</Label>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">
                    <Shield className="mr-1 h-3 w-3" />
                    {t("roleAdmin")}
                  </Badge>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium">{t("fieldIssuedAt")}</Label>
                <Input
                  readOnly
                  value={user?.iat ? new Date(user.iat * 1000).toLocaleString() : "N/A"}
                  className="bg-muted font-mono text-sm"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium">{t("fieldExpires")}</Label>
                <Input
                  readOnly
                  value={user?.exp ? new Date(user.exp * 1000).toLocaleString() : "N/A"}
                  className="bg-muted font-mono text-sm"
                />
              </div>
            </motion.div>

            <div className="pt-4 border-t">
              <Button
                variant="destructive"
                className="w-full"
                onClick={handleLogout}
              >
                <LogOut className="mr-2 h-4 w-4" />
                {t("btnLogout")}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Access Token */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              {t("tokenTitle")}
            </CardTitle>
            <CardDescription>{t("tokenDescription")}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium">{t("fieldToken")}</Label>
              <div className="relative">
                <Input
                  readOnly
                  type={showToken ? "text" : "password"}
                  value={token || ""}
                  className="font-mono text-xs pr-24 bg-muted"
                />
                <div className="absolute right-1 top-1 flex gap-1">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setShowToken(!showToken)}
                    className="h-8 w-8 p-0"
                  >
                    {showToken ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={handleCopy}
                    className="h-8 w-8 p-0"
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>

            <div className="flex gap-3 p-4 rounded-lg border-2 bg-orange-50 border-orange-300">
              <AlertTriangle className="h-5 w-5 text-orange-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-orange-900 leading-relaxed font-medium">
                {t("tokenWarning")}
              </p>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium">{t("fieldSubject")}</Label>
              <Input
                readOnly
                value={user?.sub || "N/A"}
                className="bg-muted font-mono text-xs"
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
