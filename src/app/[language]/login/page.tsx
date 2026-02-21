"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { ApiRequestError, api, getApiErrorMessage } from "@/lib/api"
import { getAuthToken, isAuthTokenValid, setAuthToken } from "@/lib/auth-token"
import { refreshGlobalConfigCache } from "@/lib/global-config-cache"
import { encryptPasswordWithPublicKey } from "@/lib/password-encryption"
import { withLocalePrefix } from "@/components/app-locale"
import { AppHeaderLanguageSwitch } from "@/components/app-header-language-switch"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { useAppTranslations } from "@/hooks/use-app-translations"
import { toast } from "sonner"
import { Loader2 } from "lucide-react"
import { AnimatePresence, motion } from "framer-motion"

export default function LoginPage() {
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [submitStage, setSubmitStage] = useState<"idle" | "signingIn" | "initializingConfig">("idle")
  const [checkingAuth, setCheckingAuth] = useState(true)
  const { locale, t } = useAppTranslations("auth")

  const router = useRouter()
  const dashboardPath = useMemo(() => withLocalePrefix("/dashboard", locale), [locale])
  const submitting = submitStage !== "idle"
  const initializingConfig = submitStage === "initializingConfig"

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setCheckingAuth(false)
    }, 3000)

    let redirected = false

    try {
      const token = getAuthToken()

      if (isAuthTokenValid(token)) {
        redirected = true
        router.replace(dashboardPath)
        return
      }
    } catch {
      // Ignore invalid token parsing errors and fall back to login form.
    }

    if (!redirected) {
      setCheckingAuth(false)
    }

    return () => {
      window.clearTimeout(timeoutId)
    }
  }, [router, dashboardPath])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitStage("signingIn")
    let redirected = false

    try {
      const publicKeyResponse = await api.getAuthPublicKey()

      if (publicKeyResponse.algorithm !== "RSA-OAEP-SHA256") {
        throw new Error(`Unsupported login encryption algorithm: ${publicKeyResponse.algorithm}`)
      }

      const encryptedPassword = await encryptPasswordWithPublicKey(
        publicKeyResponse.public_key,
        password
      )

      const loginData = await api.login({
        username,
        encrypted_password: encryptedPassword,
      })
      setAuthToken(loginData.access_token)
      setSubmitStage("initializingConfig")

      try {
        await refreshGlobalConfigCache()
      } catch (configError) {
        console.error("Failed to initialize global config cache", configError)
      }

      toast.success(t("login.toastLoginSuccess"))
      redirected = true
      router.replace(dashboardPath)
    } catch (error) {
      console.error(error)

      if (error instanceof ApiRequestError && error.status === 401) {
        toast.error(t("login.toastInvalidCredentials"))
      } else {
        toast.error(getApiErrorMessage(error, t("login.toastLoginFailed")))
      }
    } finally {
      if (!redirected) {
        setSubmitStage("idle")
      }
    }
  }

  if (checkingAuth) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>{t("login.checkingSession")}</span>
        </div>
      </div>
    )
  }

  return (
    <div className="relative flex h-screen items-center justify-center bg-gray-50">
      <AnimatePresence>
        {initializingConfig ? (
          <motion.div
            className="absolute inset-0 z-20 flex items-center justify-center bg-background/80 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <motion.div
              className="flex items-center gap-2 rounded-full border border-border/60 bg-background/90 px-4 py-2 text-sm text-muted-foreground shadow-sm"
              initial={{ y: 8, opacity: 0.8 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.24, ease: "easeOut" }}
            >
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>{t("login.initializingConfig")}</span>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>

      <div className="absolute right-4 top-4">
        <AppHeaderLanguageSwitch />
      </div>
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-2xl">{t("login.title")}</CardTitle>
          <CardDescription>
            {t("login.description")}
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleLogin}>
          <CardContent className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="username">{t("login.fieldUsername")}</Label>
              <Input
                id="username"
                type="text"
                placeholder={t("login.fieldUsernamePlaceholder")}
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="password">{t("login.fieldPassword")}</Label>
              <Input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </CardContent>
          <CardFooter className="pt-4">
            <Button className="w-full" type="submit" disabled={submitting}>
              {submitStage === "signingIn"
                ? t("login.submitLoading")
                : submitStage === "initializingConfig"
                  ? t("login.submitInitializing")
                  : t("login.submit")}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
