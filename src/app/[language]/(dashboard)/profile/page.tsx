"use client";

import { useState, useEffect } from "react";
import { getAuthToken } from "@/lib/auth-token";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { 
  User, 
  Copy, 
  Check, 
  Shield, 
  Key, 
  LogOut, 
  Fingerprint,
  ExternalLink,
  Lock,
  Edit3,
  Eye,
  EyeOff
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { clearAuthToken } from "@/lib/auth-token";
import Link from "next/link";
import { withLocalePrefix } from "@/components/app-locale";
import { useAppLocale } from "@/hooks/use-app-locale";

export default function ProfilePage() {
  const [token, setToken] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [showToken, setShowToken] = useState(false);
  const [user, setUser] = useState<any>(null);
  const locale = useAppLocale();

  useEffect(() => {
    const t = getAuthToken();
    setToken(t);

    if (t) {
      try {
        const payloadPart = t.split(".")[1];
        if (payloadPart) {
          const base64 = payloadPart.replace(/-/g, "+").replace(/_/g, "/");
          const decoded = JSON.parse(window.atob(base64));
          setUser(decoded);
        }
      } catch (e) {
        console.error("Failed to decode token", e);
      }
    }
  }, []);

  const handleCopy = () => {
    if (token) {
      navigator.clipboard.writeText(token);
      setCopied(true);
      toast.success("Token copied to clipboard");
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleLogout = () => {
    clearAuthToken();
    window.location.replace(withLocalePrefix("/login", locale));
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-black tracking-tight flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-xl text-primary">
            <User className="h-6 w-6" />
          </div>
          User Center
        </h1>
        <p className="text-muted-foreground font-medium">Manage your personal account and access security tokens.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Left Column: Account Summary */}
        <div className="md:col-span-1 space-y-6">
          <Card className="glass-card border-none shadow-xl overflow-hidden">
            <div className="h-24 bg-gradient-to-br from-primary/20 via-primary/5 to-transparent relative">
              <div className="absolute -bottom-10 left-6">
                <div className="h-20 w-20 rounded-2xl glass border-2 border-white/20 flex items-center justify-center shadow-2xl shadow-black/40">
                  <User className="h-10 w-10 text-primary" />
                </div>
              </div>
            </div>
            <CardContent className="pt-14 pb-6 px-6">
              <div className="space-y-1">
                <h2 className="text-xl font-bold tracking-tight">{user?.sub || user?.username || "Operator"}</h2>
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium uppercase tracking-wider">
                  <Shield className="h-3 w-3 text-primary" />
                  Administrator
                </div>
              </div>

              <div className="mt-8 space-y-3">
                <Button 
                    variant="outline" 
                    className="w-full justify-start glass hover:bg-white/5 border-white/5 h-11"
                    onClick={() => toast.info("Profile editing coming soon")}
                >
                  <Edit3 className="mr-2 h-4 w-4" /> Edit Profile
                </Button>
                <Button 
                    variant="ghost" 
                    className="w-full justify-start text-red-500 hover:bg-red-500/10 hover:text-red-600 h-11"
                    onClick={handleLogout}
                >
                  <LogOut className="mr-2 h-4 w-4" /> Sign Out
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="glass border-white/5 shadow-lg">
            <CardHeader className="pb-2">
               <CardTitle className="text-xs font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                 <Fingerprint className="h-3.5 w-3.5" /> Identity Metadata
               </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
               <div className="space-y-1">
                  <span className="text-[10px] text-muted-foreground font-bold uppercase">Subject ID</span>
                  <p className="text-xs font-mono truncate">{user?.sub || "N/A"}</p>
               </div>
               <div className="space-y-1">
                  <span className="text-[10px] text-muted-foreground font-bold uppercase">Issued At</span>
                  <p className="text-xs font-mono">{user?.iat ? new Date(user.iat * 1000).toLocaleString() : "N/A"}</p>
               </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Security & Token */}
        <div className="md:col-span-2 space-y-6">
          <Card className="glass-card border-none shadow-xl">
            <CardHeader className="pb-4 bg-muted/20">
               <div className="flex items-center gap-3">
                  <div className="p-2 bg-amber-500/10 rounded-lg text-amber-500">
                     <Key className="h-5 w-5" />
                  </div>
                  <div>
                    <CardTitle>Access Token</CardTitle>
                    <CardDescription>Use this JWT to authenticate external API calls.</CardDescription>
                  </div>
               </div>
            </CardHeader>
            <CardContent className="pt-6 space-y-6">
              <div className="space-y-4">
                <div className="relative group">
                  <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2 block">Current Bearer Token</Label>
                  <div className="relative">
                    <div className="absolute inset-0 bg-primary/5 blur-xl group-hover:bg-primary/10 transition-colors pointer-events-none" />
                    <Input 
                      readOnly 
                      value={showToken ? (token || "") : (token ? "•".repeat(token.length > 100 ? 100 : token.length) : "")} 
                      className="font-mono text-[11px] h-32 py-4 pr-12 glass resize-none bg-black/20 focus-visible:ring-primary/20 leading-relaxed overflow-hidden"
                    />
                    <div className="absolute right-2 top-2 flex flex-col gap-1">
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-10 w-10 hover:bg-primary/20 transition-all text-muted-foreground hover:text-primary"
                        onClick={() => setShowToken(!showToken)}
                        title={showToken ? "Hide Token" : "Show Token"}
                      >
                        {showToken ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-10 w-10 hover:bg-primary/20 transition-all text-primary"
                        onClick={handleCopy}
                        title="Copy Token"
                      >
                        {copied ? <Check className="h-5 w-5" /> : <Copy className="h-5 w-5" />}
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-4 rounded-xl bg-amber-500/5 border border-amber-500/10">
                   <Shield className="h-5 w-5 text-amber-500 shrink-0" />
                   <p className="text-xs text-amber-200/70 leading-relaxed font-medium">
                     This token grants full administrative access. Keep it secure and never share it in public environments.
                   </p>
                </div>
              </div>

              <div className="pt-4 flex items-center justify-between border-t border-white/5">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-[10px] glass h-5 bg-primary/5 text-primary border-primary/20">
                    EXPIRES: {user?.exp ? new Date(user.exp * 1000).toLocaleDateString() : "NEVER"}
                  </Badge>
                </div>
                <Button variant="link" size="sm" className="text-xs text-muted-foreground hover:text-primary gap-1" asChild>
                   <a href="/docs/api.html" target="_blank">
                      <ExternalLink className="h-3 w-3" /> API Documentation
                   </a>
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="glass border-white/5 relative overflow-hidden group">
             <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
             <CardContent className="p-6 flex items-center justify-between relative z-10">
                <div className="flex items-center gap-4">
                   <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center text-primary">
                      <Lock className="h-5 w-5" />
                   </div>
                   <div>
                      <h3 className="font-bold text-sm">Security Settings</h3>
                      <p className="text-xs text-muted-foreground font-medium">Update your password or enable MFA.</p>
                   </div>
                </div>
                <Button variant="outline" size="sm" className="glass h-9" asChild>
                   <Link href={withLocalePrefix("/system", locale)}>Manage Security</Link>
                </Button>
             </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

