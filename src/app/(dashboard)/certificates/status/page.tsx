"use client";

import { useEffect, useState } from "react";
import { api, getApiErrorMessage } from "@/lib/api";
import { CertCheckResult } from "@/types/api";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Loader2, RefreshCw, Activity, CheckCircle2, XCircle, Clock, ShieldCheck, Search } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function CertificateStatusPage() {
  const [statuses, setStatuses] = useState<CertCheckResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const fetchStatus = async () => {
    setLoading(true);
    try {
      const data = await api.getCertStatusAll({ limit: 100 });
      setStatuses(data);
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Failed to load check results"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  const filtered = statuses.filter(s => 
    s.domain.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Card className="glass-card border-none shadow-xl overflow-hidden">
      <CardHeader className="pb-4 bg-muted/20">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
             <div className="p-2 bg-primary/10 rounded-lg text-primary">
                <Activity className="h-5 w-5" />
             </div>
             <div>
                <CardTitle>Global Status</CardTitle>
                <CardDescription>Latest verification results across all monitored endpoints.</CardDescription>
             </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative group">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
              <Input
                placeholder="Filter domains..."
                className="pl-10 glass w-64 h-10 transition-all focus:w-80"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <Button 
                variant="outline" 
                size="icon" 
                onClick={fetchStatus}
                className="glass transition-transform active:scale-95"
            >
                <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-6">
        <div className="rounded-xl border border-white/5 overflow-hidden">
          <Table>
            <TableHeader className="bg-white/5">
              <TableRow className="border-white/5 hover:bg-transparent">
                <TableHead>Domain Address</TableHead>
                <TableHead>State</TableHead>
                <TableHead>Chain</TableHead>
                <TableHead>Checked At</TableHead>
                <TableHead className="text-right px-6">Error Detail</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <AnimatePresence mode="popLayout">
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="h-48 text-center text-primary">
                      <Loader2 className="h-8 w-8 animate-spin mx-auto" />
                    </TableCell>
                  </TableRow>
                ) : filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="h-48 text-center text-muted-foreground italic">
                      No status reports available.
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map((status, i) => (
                    <motion.tr 
                      key={status.domain}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.02 }}
                      className="group border-white/5 hover:bg-white/5"
                    >
                      <TableCell className="py-4 font-bold text-sm">
                        {status.domain}
                      </TableCell>
                      <TableCell>
                        <Badge variant={status.is_success ? "success" : "destructive"} className="gap-1.5 h-6 px-2">
                           {status.is_success ? (
                             <CheckCircle2 className="h-3 w-3" />
                           ) : (
                             <XCircle className="h-3 w-3" />
                           )}
                           {status.is_success ? "Healthy" : "Failed"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                         {status.chain_valid ? (
                            <Badge variant="outline" className="text-[10px] glass border-emerald-500/20 text-emerald-500 gap-1 h-5">
                               <ShieldCheck className="h-2.5 w-2.5" /> Valid
                            </Badge>
                         ) : (
                            <Badge variant="outline" className="text-[10px] glass border-red-500/20 text-red-500 gap-1 h-5">
                               <XCircle className="h-2.5 w-2.5" /> Broken
                            </Badge>
                         )}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground font-medium flex items-center gap-1.5 group-hover:text-foreground transition-colors pt-5">
                         <Clock className="h-3 w-3" />
                         {new Date(status.checked_at).toLocaleTimeString()}
                      </TableCell>
                      <TableCell className="text-right px-6 text-xs text-muted-foreground max-w-[200px] truncate italic" title={status.error || ""}>
                         {status.error || "Handshake successful."}
                      </TableCell>
                    </motion.tr>
                  ))
                )}
              </AnimatePresence>
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
