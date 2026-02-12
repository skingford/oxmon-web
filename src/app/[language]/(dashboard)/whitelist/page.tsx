"use client";

import { useEffect, useState } from "react";
import { ApiRequestError, api, getApiErrorMessage } from "@/lib/api";
import { AgentWhitelistDetail } from "@/types/api";
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
import { Loader2, Plus, RefreshCw, Trash2, Key } from "lucide-react";
import { toast } from "sonner";

export default function WhitelistPage() {
  const [agents, setAgents] = useState<AgentWhitelistDetail[]>([]);
  const [loading, setLoading] = useState(true);
  const [limit] = useState(20);
  const [offset, setOffset] = useState(0);

  // Dialog states
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [newAgentId, setNewAgentId] = useState("");
  const [newAgentDesc, setNewAgentDesc] = useState("");
  const [adding, setAdding] = useState(false);

  const getStatusAwareMessage = (
    error: unknown,
    fallback: string,
    statusMessages?: Partial<Record<number, string>>
  ) => {
    if (error instanceof ApiRequestError && statusMessages?.[error.status]) {
      return statusMessages[error.status] as string;
    }

    return getApiErrorMessage(error, fallback);
  };

  const fetchAgents = async () => {
    setLoading(true);
    try {
      const data = await api.getWhitelist({ limit, offset });
      setAgents(data);
    } catch (error) {
      console.error(error);
      toast.error(getApiErrorMessage(error, "Failed to fetch whitelist"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAgents();
  }, [offset]);

  const handleAddAgent = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdding(true);
    try {
      const res = await api.addWhitelistAgent({ 
        agent_id: newAgentId, 
        description: newAgentDesc || null,
      });
      
      toast.success(`Agent added with token: ${res.token}`);
      setIsAddOpen(false);
      setNewAgentId("");
      setNewAgentDesc("");
      await fetchAgents();
    } catch (error) {
      toast.error(
        getStatusAwareMessage(error, "Failed to add agent", {
          409: "Agent ID already exists",
        })
      );
    } finally {
      setAdding(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to remove this agent from whitelist?")) return;
    try {
      await api.deleteWhitelistAgent(id);
      toast.success("Agent removed");
      await fetchAgents();
    } catch (error) {
      toast.error(
        getStatusAwareMessage(error, "Failed to remove agent", {
          404: "Agent not found or already removed",
        })
      );
    }
  };

  const handleRegenerateToken = async (id: string) => {
    if (!confirm("Regenerate token will invalidate the old one. Continue?")) return;
    try {
      const res = await api.regenerateToken(id);
      
      // Show token in a dialog or toast
      // For simplicity using alert or toast with duration
      // Ideally should execute a copy to clipboard or show a modal
      toast.message("New Token Generated", {
        description: res.token,
        duration: 10000,
        action: {
          label: "Copy",
          onClick: () => navigator.clipboard.writeText(res.token),
        },
      });
    } catch (error) {
      toast.error(
        getStatusAwareMessage(error, "Failed to regenerate token", {
          404: "Agent not found",
        })
      );
    }
  };

  return (
    <div className="p-8 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Whitelist</h2>
          <p className="text-muted-foreground">
            Manage allowed agents and their access tokens.
          </p>
        </div>
        <div className="flex items-center space-x-2">
            <Button variant="outline" size="icon" onClick={fetchAgents}>
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            </Button>
            <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
                <DialogTrigger asChild>
                    <Button>
                        <Plus className="mr-2 h-4 w-4" /> Add Agent
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
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
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
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                  </TableCell>
                </TableRow>
              ) : agents.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center">
                    No whitelisted agents.
                  </TableCell>
                </TableRow>
              ) : (
                agents.map((agent) => (
                  <TableRow key={agent.id}>
                    <TableCell className="font-medium">
                      {agent.agent_id}
                    </TableCell>
                    <TableCell>{agent.description || "-"}</TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          agent.status === "active" ? "default" : "secondary"
                        }
                      >
                        {agent.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {agent.last_seen
                        ? new Date(agent.last_seen).toLocaleString()
                        : "N/A"}
                    </TableCell>
                    <TableCell className="text-right space-x-2">
                        <Button variant="outline" size="icon" onClick={() => handleRegenerateToken(agent.id)} title="Regenerate Token">
                            <Key className="h-4 w-4" />
                        </Button>
                        <Button variant="destructive" size="icon" onClick={() => handleDelete(agent.id)} title="Remove">
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
    </div>
  );
}
