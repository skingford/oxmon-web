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
import { Loader2, RefreshCw, CheckCircle, AlertTriangle, AlertCircle, Info } from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

export default function ActiveAlertsPage() {
  const [alerts, setAlerts] = useState<AlertEventResponse[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchAlerts = async () => {
    setLoading(true);
    try {
      const [alertsData, summaryData] = await Promise.all([
        api.getActiveAlerts({ limit: 100 }),
        api.getAlertSummary()
      ]);
      setAlerts(alertsData);
      setSummary(summaryData);
    } catch (error) {
      console.error(error);
      toast.error("Failed to fetch alerts data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlerts();
  }, []);

  const handleResolve = async (id: string) => {
    try {
      const token = localStorage.getItem("token");
      await api.resolveAlert(id, token || undefined);
      toast.success("Alert resolved");
      fetchAlerts();
    } catch (error) {
      toast.error("Failed to resolve alert");
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case "critical": return <AlertCircle className="h-4 w-4" />;
      case "warning": return <AlertTriangle className="h-4 w-4" />;
      default: return <Info className="h-4 w-4" />;
    }
  };

  return (
    <Card className="glass-card border-none shadow-xl">
      <CardHeader className="pb-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-4">
            <div>
              <CardTitle>Active Alerts</CardTitle>
              <CardDescription>
                Real-time unresolved issues requiring attention.
              </CardDescription>
            </div>
            {summary && (
              <div className="hidden md:flex items-center gap-2 border-l border-white/10 pl-4 ml-2">
                <Badge variant="outline" className="glass border-red-500/20 text-red-500 gap-1.5 h-7">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                  {summary.critical || 0} Critical
                </Badge>
                <Badge variant="outline" className="glass border-amber-500/20 text-amber-500 gap-1.5 h-7">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                  {summary.warning || 0} Warning
                </Badge>
                <Badge variant="outline" className="glass border-blue-500/20 text-blue-500 gap-1.5 h-7">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                  {summary.info || 0} Info
                </Badge>
              </div>
            )}
          </div>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={fetchAlerts}
            className="glass transition-transform active:scale-95"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="rounded-lg border overflow-hidden">
          <Table>
            <TableHeader className="bg-muted/30">
              <TableRow>
                <TableHead className="w-[120px]">Severity</TableHead>
                <TableHead>Message</TableHead>
                <TableHead>Agent</TableHead>
                <TableHead>Condition</TableHead>
                <TableHead>Triggered At</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <AnimatePresence mode="popLayout">
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-48 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        <span className="text-sm text-muted-foreground font-medium">Scanning for active alerts...</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : alerts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-48 text-center">
                      <motion.div 
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="flex flex-col items-center gap-2 text-muted-foreground"
                      >
                         <CheckCircle className="h-12 w-12 text-green-500/20" />
                         <p className="text-lg font-semibold tracking-tight">All systems operational</p>
                         <p className="text-sm">No active alerts found at this time.</p>
                      </motion.div>
                    </TableCell>
                  </TableRow>
                ) : (
                  alerts.map((alert, i) => (
                    <motion.tr
                      key={alert.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className="group hover:bg-muted/50 transition-colors border-b last:border-0"
                    >
                      <TableCell className="py-4">
                        <Badge
                          variant={alert.severity === "critical" ? "destructive" : "secondary"}
                          className={`gap-1 px-2 py-0.5 capitalize shadow-sm ${
                            alert.severity === "warning" 
                            ? "bg-amber-500/10 text-amber-600 border-amber-500/20 hover:bg-amber-500/20" 
                            : alert.severity === "critical"
                            ? "shadow-red-500/10"
                            : "bg-blue-500/10 text-blue-600 border-blue-500/20 hover:bg-blue-500/20"
                          }`}
                        >
                          {getSeverityIcon(alert.severity)}
                          {alert.severity}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-medium max-w-[300px] truncate">{alert.message}</TableCell>
                      <TableCell className="font-mono text-xs">{alert.agent_id}</TableCell>
                      <TableCell className="text-xs">
                        <span className="text-muted-foreground">{alert.metric_name}</span>
                        <div className="font-semibold text-primary">
                          {alert.value} <span className="font-normal text-muted-foreground italic">&gt; {alert.threshold}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground text-xs font-medium">
                        {new Date(alert.timestamp).toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleResolve(alert.id)}
                          className="h-8 w-8 hover:text-green-600 hover:bg-green-500/10 transition-all active:scale-90"
                          title="Acknowledge & Resolve"
                        >
                          <CheckCircle className="h-4 w-4" />
                        </Button>
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
