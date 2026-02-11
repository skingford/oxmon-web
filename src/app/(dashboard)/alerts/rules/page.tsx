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
import { Loader2, Plus, RefreshCw, Trash2, Settings2, Activity, Zap, ShieldAlert } from "lucide-react";
import { toast } from "sonner";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { motion, AnimatePresence } from "framer-motion";

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
    rule_type: "threshold", 
    metric: "",
    severity: "warning",
    agent_pattern: "*",
    silence_secs: 300,
    config_json: "{}",
  });

  const fetchRules = async () => {
    setLoading(true);
    try {
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
    <Card className="glass-card border-none shadow-xl overflow-hidden">
      <CardHeader className="pb-4 bg-muted/20">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3">
             <div className="p-2 bg-primary/10 rounded-lg text-primary">
                <Settings2 className="h-5 w-5" />
             </div>
             <div>
                <CardTitle>Alert Rules</CardTitle>
                <CardDescription>Define and manage metric monitoring criteria.</CardDescription>
             </div>
          </div>
          <div className="flex items-center gap-2">
            <Button 
                variant="outline" 
                size="icon" 
                onClick={fetchRules}
                className="glass transition-transform active:scale-95"
            >
                <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            </Button>
            <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
                <SheetTrigger asChild>
                    <Button className="shadow-lg shadow-primary/20 transition-all hover:shadow-primary/40">
                        <Plus className="mr-2 h-4 w-4" /> New Rule
                    </Button>
                </SheetTrigger>
                <SheetContent className="overflow-y-auto glass-card !border-l border-white/10 w-[400px] sm:w-[540px]">
                    <SheetHeader className="pb-6 border-b border-white/5">
                        <SheetTitle className="text-2xl font-bold flex items-center gap-2">
                           <Zap className="h-5 w-5 text-primary" />
                           Create Alert Rule
                        </SheetTitle>
                        <SheetDescription>
                            Define a new metric threshold or absence check.
                        </SheetDescription>
                    </SheetHeader>
                    <form onSubmit={handleCreate} className="space-y-6 py-6">
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="name" className="text-sm font-semibold">Rule Name</Label>
                                <Input 
                                    id="name" 
                                    placeholder="e.g. High CPU Usage"
                                    value={newRule.name} 
                                    onChange={(e) => setNewRule({...newRule, name: e.target.value})}
                                    required
                                    className="glass"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                               <div className="space-y-2">
                                    <Label htmlFor="type" className="text-sm font-semibold">Rule Type</Label>
                                    <Select 
                                        value={newRule.rule_type} 
                                        onValueChange={(v) => setNewRule({...newRule, rule_type: v})}
                                    >
                                        <SelectTrigger className="glass">
                                            <SelectValue placeholder="Select type" />
                                        </SelectTrigger>
                                        <SelectContent className="glass">
                                            <SelectItem value="threshold">Threshold</SelectItem>
                                            <SelectItem value="absent">Metric Absence</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="severity" className="text-sm font-semibold">Severity</Label>
                                    <Select 
                                        value={newRule.severity} 
                                        onValueChange={(v) => setNewRule({...newRule, severity: v})}
                                    >
                                        <SelectTrigger className="glass">
                                            <SelectValue placeholder="Select severity" />
                                        </SelectTrigger>
                                        <SelectContent className="glass">
                                            <SelectItem value="critical">Critical</SelectItem>
                                            <SelectItem value="warning">Warning</SelectItem>
                                            <SelectItem value="info">Info</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="metric" className="text-sm font-semibold">Metric Identifier</Label>
                                <Input 
                                    id="metric" 
                                    placeholder="e.g. system_cpu_utilization"
                                    value={newRule.metric} 
                                    onChange={(e) => setNewRule({...newRule, metric: e.target.value})}
                                    required
                                    className="glass"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="pattern" className="text-sm font-semibold">Agent Pattern (Glob)</Label>
                                <Input 
                                    id="pattern" 
                                    placeholder="e.g. app-*"
                                    value={newRule.agent_pattern} 
                                    onChange={(e) => setNewRule({...newRule, agent_pattern: e.target.value})}
                                    className="glass"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="silence" className="text-sm font-semibold">Notification Silence (Seconds)</Label>
                                <Input 
                                    id="silence" 
                                    type="number"
                                    value={newRule.silence_secs} 
                                    onChange={(e) => setNewRule({...newRule, silence_secs: parseInt(e.target.value)})}
                                    className="glass"
                                />
                            </div>
                             <div className="space-y-2">
                                <Label htmlFor="config" className="text-sm font-semibold">Configuration (JSON)</Label>
                                <Textarea 
                                    id="config" 
                                    value={newRule.config_json} 
                                    onChange={(e) => setNewRule({...newRule, config_json: e.target.value})}
                                    rows={5}
                                    className="glass font-mono text-xs"
                                />
                                <div className="p-3 bg-muted/40 rounded-lg text-[11px] text-muted-foreground leading-relaxed">
                                    <p className="font-bold flex items-center gap-1 mb-1">
                                       <Info className="h-3 w-3" /> Tip:
                                    </p>
                                    For threshold: {"{ \"threshold\": 80.0, \"operator\": \">\" }"}
                                </div>
                            </div>
                        </div>
                        <SheetFooter className="pt-4">
                            <Button type="submit" disabled={submitting} className="w-full h-11 shadown-xl">
                                {submitting ? <Loader2 className="animate-spin h-4 w-4" /> : "Deploy Alert Rule"}
                            </Button>
                        </SheetFooter>
                    </form>
                </SheetContent>
            </Sheet>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-6">
        <div className="rounded-xl border overflow-hidden">
          <Table>
            <TableHeader className="bg-muted/30">
              <TableRow>
                <TableHead>Rule Detail</TableHead>
                <TableHead>Target Metric</TableHead>
                <TableHead>Severity</TableHead>
                <TableHead>Pattern</TableHead>
                <TableHead>Status</TableHead>
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
                ) : rules.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="h-48 text-center text-muted-foreground italic">
                      No monitoring rules defined yet.
                    </TableCell>
                  </TableRow>
                ) : (
                  rules.map((rule, i) => (
                    <motion.tr 
                      key={rule.id}
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.03 }}
                      className="hover:bg-muted/30 transition-colors border-b last:border-0"
                    >
                      <TableCell className="py-4">
                        <div className="flex flex-col">
                           <span className="font-bold text-sm">{rule.name}</span>
                           <span className="text-[10px] uppercase text-muted-foreground font-medium tracking-tight">Type: {rule.rule_type}</span>
                        </div>
                      </TableCell>
                      <TableCell className="font-mono text-xs text-primary">{rule.metric}</TableCell>
                      <TableCell>
                        <Badge
                          variant={rule.severity === "critical" ? "destructive" : "secondary"}
                          className={`capitalize text-[10px] ${
                            rule.severity === "warning" ? "bg-amber-500/10 text-amber-600 border-amber-500/20" : ""
                          }`}
                        >
                          {rule.severity}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-mono text-xs text-muted-foreground">{rule.agent_pattern}</TableCell>
                      <TableCell>
                         <Badge variant={rule.enabled ? "success" : "secondary"} className="text-[10px]">
                            {rule.enabled ? "Operational" : "Standby"}
                         </Badge>
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

import { Info } from "lucide-react"
