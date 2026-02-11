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
import { Loader2, RefreshCw, Search } from "lucide-react";
import { toast } from "sonner";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
  } from "@/components/ui/select"

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
    <Card>
      <CardHeader>
        <CardTitle className="flex justify-between items-center">
            <span>Alert History</span>
            <Button variant="ghost" size="icon" onClick={fetchHistory}>
                <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            </Button>
        </CardTitle>
        <CardDescription>
          Historical log of all alerts.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-4 items-end flex-wrap">
            <div className="grid gap-2">
                <Label htmlFor="agent-filter">Agent ID</Label>
                <Input 
                    id="agent-filter" 
                    placeholder="Filter by Agent ID" 
                    value={agentId} 
                    onChange={(e) => setAgentId(e.target.value)}
                    className="w-[200px]"
                />
            </div>
            <div className="grid gap-2">
                <Label>Severity</Label>
                <Select value={severity} onValueChange={setSeverity}>
                    <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Severity" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All</SelectItem>
                        <SelectItem value="critical">Critical</SelectItem>
                        <SelectItem value="warning">Warning</SelectItem>
                        <SelectItem value="info">Info</SelectItem>
                    </SelectContent>
                </Select>
            </div>
            <Button onClick={handleSearch}>
                <Search className="mr-2 h-4 w-4" /> Search
            </Button>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Severity</TableHead>
              <TableHead>Message</TableHead>
              <TableHead>Agent</TableHead>
              <TableHead>Metric</TableHead>
              <TableHead>Time</TableHead>
              <TableHead>Resolved At</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center">
                  <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                </TableCell>
              </TableRow>
            ) : alerts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center">
                  No alerts found.
                </TableCell>
              </TableRow>
            ) : (
              alerts.map((alert) => (
                <TableRow key={alert.id}>
                  <TableCell>
                    <Badge
                      variant={
                        alert.severity === "critical"
                          ? "destructive"
                          : alert.severity === "warning"
                          ? "outline" // fallback
                          : "secondary"
                      }
                      className={
                        alert.severity === "warning"
                          ? "border-yellow-500 text-yellow-500"
                          : ""
                      }
                    >
                      {alert.severity}
                    </Badge>
                  </TableCell>
                  <TableCell>{alert.message}</TableCell>
                  <TableCell>{alert.agent_id}</TableCell>
                  <TableCell>
                    {alert.metric_name}: {alert.value}
                  </TableCell>
                  <TableCell>
                    {new Date(alert.timestamp).toLocaleString()}
                  </TableCell>
                  <TableCell>
                    {alert.resolved_at 
                        ? new Date(alert.resolved_at).toLocaleString() 
                        : <span className="text-yellow-500 italic">Unresolved</span>}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>

        <div className="flex items-center justify-end space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setOffset(Math.max(0, offset - limit))}
              disabled={offset === 0 || loading}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setOffset(offset + limit)}
              disabled={alerts.length < limit || loading}
            >
              Next
            </Button>
          </div>
      </CardContent>
    </Card>
  );
}
