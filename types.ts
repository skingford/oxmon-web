
export interface Agent {
  id: string;
  name: string;
  status: 'Online' | 'Offline' | 'Maintenance';
  ip: string;
  version: string;
  lastReported: string;
  // Detail metadata
  cpu?: number;
  memory?: number;
  uptime?: string;
  os?: string;
  latency?: number; // Added for topology
}

export interface Certificate {
  id: string;
  domain: string;
  issuer: string;
  status: 'Valid' | 'Expiring' | 'Expired';
  expiryDate: string;
  daysRemaining: number;
  lastCheck: string;
  // Detail metadata
  serialNumber?: string;
  signatureAlgorithm?: string;
  notBefore?: string;
  sans?: string[]; // Added for details
  chain?: string[]; // Added for details
}

export interface Alert {
  id: string;
  severity: 'Critical' | 'Warning' | 'Info' | 'Resolved';
  source: string;
  message: string;
  time: string;
}

export interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: 'Owner' | 'Admin' | 'Editor' | 'Viewer';
  status: 'Active' | 'Pending';
  img: string | null;
}

export interface AppPreferences {
  notifEmail: boolean;
  notifSlack: boolean;
  notifWeekly: boolean;
  secure2FA: boolean;
  workspaceName: string;
  supportEmail: string;
}

export interface LogEntry {
  id: string;
  timestamp: string;
  level: 'info' | 'warn' | 'error';
  category: 'system' | 'auth' | 'agent' | 'cert';
  message: string;
}

export type ViewState = 'dashboard' | 'agents' | 'certificates' | 'settings' | 'alerts' | 'logs' | 'infrastructure' | 'tools' | 'help';
