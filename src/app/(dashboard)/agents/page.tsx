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
import { Loader2, Plus, RefreshCw, Trash2, Key, Server, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

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
      const data = await api.getWhitelist({ limit: 100, offset: 0 }); // pagination for whitelist is simpler here
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
      
      toast.success(`Agent added with token: ${res.token}`);
      setIsAddOpen(false);
      setNewAgentId("");
      setNewAgentDesc("");
      fetchWhitelist();
    } catch (error) {
      toast.error("Failed to add agent to whitelist");
    } finally {
      setAdding(false);
    }
  };

  const handleDeleteWhitelist = async (id: string) => {
    if (!confirm("Are you sure you want to remove this agent from whitelist?")) return;
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

  return (
    <div className="p-8 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Agents Management</h2>
          <p className="text-muted-foreground">
            Monitor active agents and manage whitelist permissions.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {activeTab === "whitelist" && (
            <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" /> Add to Whitelist
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add Agent to Whitelist</DialogTitle>
                  <DialogDescription>
                    Create a new whitelist entry. You will receive a token upon success.
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleAddAgent}>
                  <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="agent-id" className="text-right">
                        Agent ID
                      </Label>
                      <Input
                        id="agent-id"
                        value={newAgentId}
                        onChange={(e) => setNewAgentId(e.target.value)}
                        className="col-span-3"
                        required
                        placeholder="e.g. agent-01"
                      />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="desc" className="text-right">
                        Description
                      </Label>
                      <Input
                        id="desc"
                        value={newAgentDesc}
                        onChange={(e) => setNewAgentDesc(e.target.value)}
                        className="col-span-3"
                        placeholder="Optional description"
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button type="submit" disabled={adding}>
                      {adding ? "Adding..." : "Add Agent"}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          )}
          <Button variant="outline" size="icon" onClick={activeTab === "all-agents" ? fetchAgents : fetchWhitelist}>
            <RefreshCw className={`h-4 w-4 ${(loadingAgents || loadingWhitelist) ? "animate-spin" : ""}`} />
          </Button>
        </div>
      </div>

      <Tabs defaultValue="all-agents" onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="all-agents" className="flex items-center gap-2">
            <Server className="h-4 w-4" />
            Active Agents
          </TabsTrigger>
          <TabsTrigger value="whitelist" className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4" />
            Whitelist
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all-agents">
          <Card>
            <CardHeader>
              <CardTitle>Active Agents</CardTitle>
              <CardDescription>
                Live status of agents currently reporting to the system.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Agent ID</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Last Seen</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loadingAgents ? (
                    <TableRow>
                      <TableCell colSpan={4} className="h-24 text-center">
                        <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                      </TableCell>
                    </TableRow>
                  ) : agents.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                        No active agents found.
                      </TableCell>
                    </TableRow>
                  ) : (
                    agents.map((agent) => (
                      <TableRow key={agent.agent_id}>
                        <TableCell className="font-medium">
                          {agent.agent_id}
                        </TableCell>
                        <TableCell>
                          <Badge variant={agent.status === "active" ? "success" : "secondary"}>
                            {agent.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {agent.last_seen
                            ? new Date(agent.last_seen).toLocaleString()
                            : "N/A"}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button asChild variant="ghost" size="sm">
                            <Link href={`/agents/${agent.agent_id}`}>
                              View Details
                            </Link>
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
              <div className="flex items-center justify-end space-x-2 py-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setAgentsOffset(Math.max(0, agentsOffset - agentsLimit))}
                  disabled={agentsOffset === 0 || loadingAgents}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setAgentsOffset(agentsOffset + agentsLimit)}
                  disabled={agents.length < agentsLimit || loadingAgents}
                >
                  Next
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="whitelist">
          <Card>
            <CardHeader>
              <CardTitle>Whitelist Management</CardTitle>
              <CardDescription>
                Authorized Agent IDs and their security credentials.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Agent ID</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Last Seen</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loadingWhitelist ? (
                    <TableRow>
                      <TableCell colSpan={5} className="h-24 text-center">
                        <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                      </TableCell>
                    </TableRow>
                  ) : whitelist.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                        No whitelisted agents discovered.
                      </TableCell>
                    </TableRow>
                  ) : (
                    whitelist.map((agent) => (
                      <TableRow key={agent.id}>
                        <TableCell className="font-medium">
                          {agent.agent_id}
                        </TableCell>
                        <TableCell className="max-w-[200px] truncate">{agent.description || "-"}</TableCell>
                        <TableCell>
                          <Badge variant={agent.status === "active" ? "success" : "secondary"}>
                            {agent.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {agent.last_seen
                            ? new Date(agent.last_seen).toLocaleString()
                            : "N/A"}
                        </TableCell>
                        <TableCell className="text-right space-x-2">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => handleRegenerateToken(agent.id)} 
                            title="Regenerate Token"
                          >
                            <Key className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="text-red-500 hover:text-red-600 hover:bg-red-50"
                            onClick={() => handleDeleteWhitelist(agent.id)} 
                            title="Remove from Whitelist"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
