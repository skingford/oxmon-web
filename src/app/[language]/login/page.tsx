"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { ApiRequestError, api, getApiErrorMessage } from "@/lib/api";
import { getAuthToken, isAuthTokenValid, setAuthToken } from "@/lib/auth-token";
import { resolveAppLocale, withLocalePrefix } from "@/components/app-locale";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true)

  const router = useRouter();
  const pathname = usePathname();
  const locale = resolveAppLocale(pathname);
  const dashboardPath = withLocalePrefix("/", locale);

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
    e.preventDefault();
    setLoading(true);

    try {
      const loginData = await api.login({ username, password });
      setAuthToken(loginData.token);

      toast.success("Login successful");
      router.replace(dashboardPath);
    } catch (error) {
      console.error(error);

      if (error instanceof ApiRequestError && error.status === 401) {
        toast.error("用户名或密码错误")
        return
      }

      toast.error(getApiErrorMessage(error, "登录失败，请稍后重试"));
    } finally {
      setLoading(false);
    }
  };

  if (checkingAuth) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>Checking session...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-screen items-center justify-center bg-gray-50">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-2xl">Login</CardTitle>
          <CardDescription>
            Enter your credentials to access the dashboard.
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleLogin}>
          <CardContent className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                type="text"
                placeholder="admin"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="password">Password</Label>
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
            <Button className="w-full" type="submit" disabled={loading}>
              {loading ? "Signing in..." : "Sign in"}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
