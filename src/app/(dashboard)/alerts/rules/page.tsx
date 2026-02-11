"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { AlertRuleDetailResponse, CreateAlertRuleRequest } from "@/types/api";
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
import {  
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
    SheetFooter,
} from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Plus, RefreshCw, Trash2 } from "lucide-react";
import { toast } from "sonner";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

export default function AlertRulesPage() {
  const [rules, setRules] = useState<AlertRuleDetailResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [limit] = useState(20);
  const [offset, setOffset] = useState(0);

  // Form state
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [newRule, setNewRule] = useState<CreateAlertRuleRequest>({
    name: "",
    rule_type: "threshold", // default
    metric: "",
    severity: "warning",
    agent_pattern: "*",
    silence_secs: 300,
    config_json: "{}",
  });

  const fetchRules = async () => {
    setLoading(true);
    try {
      // The API has /v1/alerts/rules/config for full details, /v1/alerts/rules for summary
      // Using /v1/alerts/rules for listing might be enough if it returns enough info
      // But type definition says AlertRuleResponse vs AlertRuleDetailResponse
      // Let's use getAlertRulesConfig for full details including name
      const data = await api.getAlertRulesConfig({ limit, offset });
      setRules(data);
    } catch (error) {
      console.error(error);
      toast.error("Failed to fetch alert rules");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRules();
  }, [offset]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("No token");
      
      await api.createAlertRule(newRule, token);
      toast.success("Rule created successfully");
      setIsSheetOpen(false);
      setNewRule({
        name: "",
        rule_type: "threshold",
        metric: "",
        severity: "warning",
        agent_pattern: "*",
        silence_secs: 300,
        config_json: "{}",
      });
      fetchRules();
    } catch (error) {
      toast.error("Failed to create rule");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex justify-between items-center">
            <span>Alert Rules</span>
            <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon" onClick={fetchRules}>
                    <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
                </Button>
                <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
                    <SheetTrigger asChild>
                        <Button>
                            <Plus className="mr-2 h-4 w-4" /> Create Rule
                        </Button>
                    </SheetTrigger>
                    <SheetContent className="overflow-y-auto">
                        <SheetHeader>
                            <SheetTitle>Create Alert Rule</SheetTitle>
                            <SheetDescription>
                                Add a new rule to monitor metrics.
                            </SheetDescription>
                        </SheetHeader>
                        <form onSubmit={handleCreate} className="space-y-4 py-4">
                            <div className="space-y-2">
                                <Label htmlFor="name">Rule Name</Label>
                                <Input 
                                    id="name" 
                                    value={newRule.name} 
                                    onChange={(e) => setNewRule({...newRule, name: e.target.value})}
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="type">Rule Type</Label>
                                <Select 
                                    value={newRule.rule_type} 
                                    onValueChange={(v) => setNewRule({...newRule, rule_type: v})}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select type" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="threshold">Threshold</SelectItem>
                                        <SelectItem value="absent">Absent</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="metric">Metric Name</Label>
                                <Input 
                                    id="metric" 
                                    value={newRule.metric} 
                                    onChange={(e) => setNewRule({...newRule, metric: e.target.value})}
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="severity">Severity</Label>
                                <Select 
                                    value={newRule.severity} 
                                    onValueChange={(v) => setNewRule({...newRule, severity: v})}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select severity" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="critical">Critical</SelectItem>
                                        <SelectItem value="warning">Warning</SelectItem>
                                        <SelectItem value="info">Info</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="pattern">Agent Pattern (Glob)</Label>
                                <Input 
                                    id="pattern" 
                                    value={newRule.agent_pattern} 
                                    onChange={(e) => setNewRule({...newRule, agent_pattern: e.target.value})}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="silence">Silence (Seconds)</Label>
                                <Input 
                                    id="silence" 
                                    type="number"
                                    value={newRule.silence_secs} 
                                    onChange={(e) => setNewRule({...newRule, silence_secs: parseInt(e.target.value)})}
                                />
                            </div>
                             <div className="space-y-2">
                                <Label htmlFor="config">Config (JSON)</Label>
                                <Textarea 
                                    id="config" 
                                    value={newRule.config_json} 
                                    onChange={(e) => setNewRule({...newRule, config_json: e.target.value})}
                                    rows={5}
                                />
                                <p className="text-xs text-muted-foreground">
                                    For threshold: {"{ \"threshold\": 80.0, \"operator\": \">\" }"}
                                </p>
                            </div>
                            <SheetFooter>
                                <Button type="submit" disabled={submitting}>
                                    {submitting ? "Creating..." : "Create Rule"}
                                </Button>
                            </SheetFooter>
                        </form>
                    </SheetContent>
                </Sheet>
            </div>
        </CardTitle>
        <CardDescription>
          Manage alert definitions and thresholds.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Metric</TableHead>
              <TableHead>Severity</TableHead>
              <TableHead>Pattern</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center">
                  <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                </TableCell>
              </TableRow>
            ) : rules.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center">
                  No rules found.
                </TableCell>
              </TableRow>
            ) : (
              rules.map((rule) => (
                <TableRow key={rule.id}>
                  <TableCell className="font-medium">{rule.name}</TableCell>
                  <TableCell>{rule.rule_type}</TableCell>
                  <TableCell>{rule.metric}</TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        rule.severity === "critical"
                          ? "destructive"
                          : rule.severity === "warning"
                          ? "outline" 
                          : "secondary"
                      }
                    >
                      {rule.severity}
                    </Badge>
                  </TableCell>
                  <TableCell>{rule.agent_pattern}</TableCell>
                  <TableCell>
                     <Badge variant={rule.enabled ? "default" : "secondary"}>
                        {rule.enabled ? "Enabled" : "Disabled"}
                     </Badge>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
