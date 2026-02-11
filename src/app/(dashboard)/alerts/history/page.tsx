"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { AlertEventResponse } from "@/types/api";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, RefreshCw, Search, History, Calendar, Filter } from "lucide-react";
import { toast } from "sonner";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
  } from "@/components/ui/select"
import { motion, AnimatePresence } from "framer-motion";

export default function AlertHistoryPage() {
  const [alerts, setAlerts] = useState<AlertEventResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [limit] = useState(20);
  const [offset, setOffset] = useState(0);
  
  // Filters
  const [agentId, setAgentId] = useState("");
  const [severity, setSeverity] = useState<string>("all");

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const params: any = { limit, offset };
      if (agentId) params.agent_id__eq = agentId;
      if (severity && severity !== "all") params.severity__eq = severity;
      
      const data = await api.getAlertHistory(params);
      setAlerts(data);
    } catch (error) {
      console.error(error);
      toast.error("Failed to fetch alert history");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, [offset]);

  const handleSearch = () => {
    setOffset(0);
    fetchHistory();
  };

  return (
    <Card className="glass-card border-none shadow-xl overflow-hidden">
      <CardHeader className="pb-4 bg-muted/20">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3">
             <div className="p-2 bg-primary/10 rounded-lg text-primary">
                <History className="h-5 w-5" />
             </div>
             <div>
                <CardTitle>Alert History</CardTitle>
                <CardDescription>Comprehensive log of past infrastructure events.</CardDescription>
             </div>
          </div>
          <Button 
            variant="outline" 
            size="icon" 
            onClick={fetchHistory}
            className="glass transition-transform active:scale-95"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="pt-6 space-y-6">
        <div className="flex gap-4 items-end flex-wrap glass p-4 rounded-xl border-white/5">
            <div className="grid gap-2">
                <Label htmlFor="agent-filter" className="text-xs uppercase tracking-wider text-muted-foreground font-bold">Agent ID</Label>
                <div className="relative">
                   <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                   <Input 
                      id="agent-filter" 
                      placeholder="e.g. agent-01" 
                      value={agentId} 
                      onChange={(e) => setAgentId(e.target.value)}
                      className="w-[200px] pl-9 glass h-9 border-white/10"
                   />
                </div>
            </div>
            <div className="grid gap-2">
                <Label className="text-xs uppercase tracking-wider text-muted-foreground font-bold">Severity</Label>
                <Select value={severity} onValueChange={setSeverity}>
                    <SelectTrigger className="w-[180px] glass h-9 border-white/10">
                        <SelectValue placeholder="Severity" />
                    </SelectTrigger>
                    <SelectContent className="glass">
                        <SelectItem value="all">All Levels</SelectItem>
                        <SelectItem value="critical">Critical</SelectItem>
                        <SelectItem value="warning">Warning</SelectItem>
                        <SelectItem value="info">Info</SelectItem>
                    </SelectContent>
                </Select>
            </div>
            <Button onClick={handleSearch} size="sm" className="h-9 px-6 shadow-md transition-all active:scale-95">
                <Filter className="mr-2 h-4 w-4" /> Apply Filters
            </Button>
        </div>

        <div className="rounded-lg border overflow-hidden">
          <Table>
            <TableHeader className="bg-muted/30">
              <TableRow>
                <TableHead>Severity</TableHead>
                <TableHead>Event Details</TableHead>
                <TableHead>Agent</TableHead>
                <TableHead>Value / Threshold</TableHead>
                <TableHead>Triggered</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <AnimatePresence mode="popLayout">
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-48 text-center">
                      <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
                    </TableCell>
                  </TableRow>
                ) : alerts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-48 text-center text-muted-foreground italic">
                      No historical alerts found matching your filters.
                    </TableCell>
                  </TableRow>
                ) : (
                  alerts.map((alert, i) => (
                    <motion.tr 
                      key={alert.id}
                      initial={{ opacity: 0, x: -5 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.02 }}
                      className="hover:bg-muted/30 transition-colors border-b last:border-0"
                    >
                      <TableCell>
                        <Badge
                          variant={alert.severity === "critical" ? "destructive" : "secondary"}
                          className={`capitalize ${
                            alert.severity === "warning" 
                            ? "bg-amber-500/10 text-amber-600 border-amber-500/20" 
                            : alert.severity === "info"
                            ? "bg-blue-500/10 text-blue-600 border-blue-500/20"
                            : ""
                          }`}
                        >
                          {alert.severity}
                        </Badge>
                      </TableCell>
                      <TableCell className="max-w-[200px] truncate font-medium text-sm">{alert.message}</TableCell>
                      <TableCell className="font-mono text-xs">{alert.agent_id}</TableCell>
                      <TableCell className="text-xs">
                        {alert.value} <span className="text-muted-foreground">/ {alert.threshold}</span>
                      </TableCell>
                      <TableCell className="text-muted-foreground text-[11px] font-medium">
                        {new Date(alert.timestamp).toLocaleString()}
                      </TableCell>
                      <TableCell>
                        {alert.resolved_at 
                            ? <Badge variant="success" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20">Resolved</Badge>
                            : <Badge variant="outline" className="text-amber-500 border-amber-500/50 animate-pulse">Open</Badge>}
                      </TableCell>
                    </motion.tr>
                  ))
                )}
              </AnimatePresence>
            </TableBody>
          </Table>
        </div>

        <div className="flex items-center justify-between pt-4">
            <p className="text-xs text-muted-foreground">
              Page {Math.floor(offset / limit) + 1}
            </p>
            <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setOffset(Math.max(0, offset - limit))}
                  disabled={offset === 0 || loading}
                  className="h-8"
                >
                  Previous
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setOffset(offset + limit)}
                  disabled={alerts.length < limit || loading}
                  className="h-8"
                >
                  Next
                </Button>
              </div>
          </div>
      </CardContent>
    </Card>
  );
}
