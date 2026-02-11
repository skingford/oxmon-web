"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { AgentResponse, AgentWhitelistDetail } from "@/types/api";
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
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Plus, RefreshCw, Trash2, Key, Server, ShieldCheck, Search, MoreHorizontal } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

export default function AgentsPage() {
  const [activeTab, setActiveTab] = useState("all-agents");
  
  // All Agents State
  const [agents, setAgents] = useState<AgentResponse[]>([]);
  const [loadingAgents, setLoadingAgents] = useState(true);
  const [agentsLimit] = useState(20);
  const [agentsOffset, setAgentsOffset] = useState(0);

  // Whitelist State
  const [whitelist, setWhitelist] = useState<AgentWhitelistDetail[]>([]);
  const [loadingWhitelist, setLoadingWhitelist] = useState(true);
  
  // Search state
  const [searchQuery, setSearchQuery] = useState("");

  // Whitelist dialog states
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [newAgentId, setNewAgentId] = useState("");
  const [newAgentDesc, setNewAgentDesc] = useState("");
  const [adding, setAdding] = useState(false);

  const fetchAgents = async () => {
    setLoadingAgents(true);
    try {
      const data = await api.getAgents({ limit: agentsLimit, offset: agentsOffset });
      setAgents(data);
    } catch (error) {
      console.error(error);
      toast.error("Failed to fetch active agents");
    } finally {
      setLoadingAgents(false);
    }
  };

  const fetchWhitelist = async () => {
    setLoadingWhitelist(true);
    try {
      const data = await api.getWhitelist({ limit: 100, offset: 0 });
      setWhitelist(data);
    } catch (error) {
      console.error(error);
      toast.error("Failed to fetch whitelist");
    } finally {
      setLoadingWhitelist(false);
    }
  };

  useEffect(() => {
    if (activeTab === "all-agents") fetchAgents();
    else if (activeTab === "whitelist") fetchWhitelist();
  }, [activeTab, agentsOffset]);

  const handleAddAgent = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdding(true);
    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("No token");
      
      const res = await api.addWhitelistAgent({ 
        agent_id: newAgentId, 
        description: newAgentDesc 
      }, token);
      
      toast.success(`Agent successfully whitelisted`, {
        description: `Discovery Token: ${res.token}`
      });
      setIsAddOpen(false);
      setNewAgentId("");
      setNewAgentDesc("");
      fetchWhitelist();
    } catch (error) {
      toast.error("Failed to whitelist agent");
    } finally {
      setAdding(false);
    }
  };

  const handleDeleteWhitelist = async (id: string) => {
    if (!confirm("Remove this agent from whitelist?")) return;
    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("No token");
      await api.deleteWhitelistAgent(id, token);
      toast.success("Agent removed from whitelist");
      fetchWhitelist();
    } catch (error) {
      toast.error("Failed to remove agent");
    }
  };

  const handleRegenerateToken = async (id: string) => {
    if (!confirm("Regenerate token will invalidate the old one. Continue?")) return;
    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("No token");
      const res = await api.regenerateToken(id, token);
      
      toast.message("New Token Generated", {
        description: res.token,
        duration: 10000,
        action: {
          label: "Copy",
          onClick: () => navigator.clipboard.writeText(res.token),
        },
      });
    } catch (error) {
      toast.error("Failed to regenerate token");
    }
  };

  const filteredAgents = agents.filter(a => a.agent_id.toLowerCase().includes(searchQuery.toLowerCase()));
  const filteredWhitelist = whitelist.filter(a => 
    a.agent_id.toLowerCase().includes(searchQuery.toLowerCase()) || 
    (a.description?.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-8 space-y-8"
    >
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-4xl font-extrabold tracking-tight text-gradient">Agents Management</h2>
          <p className="text-muted-foreground mt-1">
            Active infrastructure monitoring and permission control.
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="relative group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
            <Input 
              placeholder="Search ID or description..." 
              className="pl-10 w-64 glass h-10 transition-all focus:w-80"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <Button 
            variant="outline" 
            size="icon" 
            onClick={activeTab === "all-agents" ? fetchAgents : fetchWhitelist}
            className="glass transition-transform active:scale-95"
          >
            <RefreshCw className={`h-4 w-4 ${(loadingAgents || loadingWhitelist) ? "animate-spin" : ""}`} />
          </Button>

          {activeTab === "whitelist" && (
            <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
              <DialogTrigger asChild>
                <Button className="shadow-lg shadow-primary/20 hover:shadow-primary/40 transition-shadow">
                  <Plus className="mr-2 h-4 w-4" /> Add Agent
                </Button>
              </DialogTrigger>
              <DialogContent className="glass shadow-2xl">
                <DialogHeader>
                  <DialogTitle>Register New Agent</DialogTitle>
                  <DialogDescription>
                    Provide credentials for a new agent to join the mesh.
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleAddAgent} className="space-y-6 pt-4">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="agent-id">Agent ID</Label>
                      <Input
                        id="agent-id"
                        value={newAgentId}
                        onChange={(e) => setNewAgentId(e.target.value)}
                        required
                        placeholder="e.g. cloud-node-01"
                        className="glass"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="desc">Description</Label>
                      <Input
                        id="desc"
                        value={newAgentDesc}
                        onChange={(e) => setNewAgentDesc(e.target.value)}
                        placeholder="Purpose or location of the agent"
                        className="glass"
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button type="submit" disabled={adding} className="w-full">
                      {adding ? <Loader2 className="animate-spin h-4 w-4" /> : "Generate Whitelist Credentials"}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>

      <Tabs defaultValue="all-agents" onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="bg-muted/50 p-1 glass h-12">
          <TabsTrigger value="all-agents" className="flex items-center gap-2 px-6 data-[state=active]:glass h-full transition-all">
            <Server className="h-4 w-4" />
            Active Agents
          </TabsTrigger>
          <TabsTrigger value="whitelist" className="flex items-center gap-2 px-6 data-[state=active]:glass h-full transition-all">
            <ShieldCheck className="h-4 w-4" />
            Whitelist
          </TabsTrigger>
        </TabsList>

        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            transition={{ duration: 0.2 }}
          >
            <TabsContent value="all-agents" className="mt-0">
              <Card className="glass-card border-none shadow-xl">
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Active Agents</CardTitle>
                      <CardDescription>Live reporting nodes in your network.</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="rounded-lg border overflow-hidden">
                    <Table>
                      <TableHeader className="bg-muted/30">
                        <TableRow>
                          <TableHead>Agent ID</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Last Seen</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        <AnimatePresence mode="popLayout">
                          {loadingAgents ? (
                            <TableRow>
                              <TableCell colSpan={4} className="h-32 text-center">
                                <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
                              </TableCell>
                            </TableRow>
                          ) : filteredAgents.length === 0 ? (
                            <TableRow>
                              <TableCell colSpan={4} className="h-32 text-center text-muted-foreground italic">
                                No agents found matching search.
                              </TableCell>
                            </TableRow>
                          ) : (
                            filteredAgents.map((agent, i) => (
                              <motion.tr
                                key={agent.agent_id}
                                initial={{ opacity: 0, y: 5 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.03 }}
                                className="group hover:bg-muted/50 transition-colors border-b last:border-0"
                              >
                                <TableCell className="font-mono text-sm py-4">
                                  {agent.agent_id}
                                </TableCell>
                                <TableCell>
                                  <Badge variant={agent.status === "active" ? "success" : "secondary"} className="capitalize">
                                    <div className={`h-1.5 w-1.5 rounded-full mr-2 ${agent.status === "active" ? "bg-white animate-pulse" : "bg-muted-foreground"}`} />
                                    {agent.status}
                                  </Badge>
                                </TableCell>
                                <TableCell className="text-muted-foreground text-sm">
                                  {agent.last_seen
                                    ? new Date(agent.last_seen).toLocaleString()
                                    : "Never connected"}
                                </TableCell>
                                <TableCell className="text-right">
                                  <Button asChild variant="ghost" size="sm" className="hover:text-primary transition-colors">
                                    <Link href={`/agents/${agent.agent_id}`}>
                                      Details
                                    </Link>
                                  </Button>
                                </TableCell>
                              </motion.tr>
                            ))
                          )}
                        </AnimatePresence>
                      </TableBody>
                    </Table>
                  </div>
                  
                  <div className="flex items-center justify-between py-4 mt-2">
                    <p className="text-xs text-muted-foreground font-medium">
                      Showing page {Math.floor(agentsOffset / agentsLimit) + 1}
                    </p>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setAgentsOffset(Math.max(0, agentsOffset - agentsLimit))}
                        disabled={agentsOffset === 0 || loadingAgents}
                      >
                        Previous
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setAgentsOffset(agentsOffset + agentsLimit)}
                        disabled={agents.length < agentsLimit || loadingAgents}
                      >
                        Next
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="whitelist" className="mt-0">
              <Card className="glass-card border-none shadow-xl">
                <CardHeader>
                  <CardTitle>Whitelist Management</CardTitle>
                  <CardDescription>
                    Manage discovered Agent IDs and their security tokens.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="rounded-lg border overflow-hidden">
                    <Table>
                      <TableHeader className="bg-muted/30">
                        <TableRow>
                          <TableHead>Agent ID</TableHead>
                          <TableHead>Description</TableHead>
                          <TableHead>Credentials</TableHead>
                          <TableHead>Last Seen</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        <AnimatePresence>
                          {loadingWhitelist ? (
                            <TableRow>
                              <TableCell colSpan={5} className="h-32 text-center">
                                <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
                              </TableCell>
                            </TableRow>
                          ) : filteredWhitelist.length === 0 ? (
                            <TableRow>
                              <TableCell colSpan={5} className="h-32 text-center text-muted-foreground italic">
                                No whitelisted records found.
                              </TableCell>
                            </TableRow>
                          ) : (
                            filteredWhitelist.map((agent, i) => (
                              <motion.tr
                                key={agent.id}
                                initial={{ opacity: 0, y: 5 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                transition={{ delay: i * 0.03 }}
                                className="group hover:bg-muted/50 transition-colors border-b last:border-0"
                              >
                                <TableCell className="font-mono text-sm py-4">
                                  {agent.agent_id}
                                </TableCell>
                                <TableCell className="max-w-[180px] truncate text-sm text-muted-foreground font-medium">
                                  {agent.description || "—"}
                                </TableCell>
                                <TableCell>
                                  <Badge variant={agent.status === "active" ? "success" : "secondary"}>
                                    {agent.status === "active" ? "Provisioned" : "Pending"}
                                  </Badge>
                                </TableCell>
                                <TableCell className="text-muted-foreground text-sm">
                                  {agent.last_seen
                                    ? new Date(agent.last_seen).toLocaleString()
                                    : "Awaiting registration"}
                                </TableCell>
                                <TableCell className="text-right space-x-1">
                                  <Button 
                                    variant="ghost" 
                                    size="icon" 
                                    onClick={() => handleRegenerateToken(agent.id)} 
                                    className="hover:text-primary transition-colors h-8 w-8"
                                    title="Regenerate Security Token"
                                  >
                                    <Key className="h-4 w-4" />
                                  </Button>
                                  <Button 
                                    variant="ghost" 
                                    size="icon" 
                                    className="text-red-500/60 hover:text-red-600 hover:bg-red-500/10 h-8 w-8"
                                    onClick={() => handleDeleteWhitelist(agent.id)} 
                                    title="Delete Entry"
                                  >
                                    <Trash2 className="h-4 w-4" />
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
            </TabsContent>
          </motion.div>
        </AnimatePresence>
      </Tabs>
    </motion.div>
  );
}
