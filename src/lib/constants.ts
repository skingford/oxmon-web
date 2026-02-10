import { Agent, Certificate, Alert, TeamMember, AppPreferences } from './types';

export const MOCK_AGENTS: Agent[] = [
  { id: 'ox-agent-001', name: 'ox-agent-001', status: 'Online', ip: '192.168.1.10', version: 'v1.2.4', lastReported: '2 mins ago' },
  { id: 'ox-agent-002', name: 'ox-agent-002', status: 'Offline', ip: '192.168.1.12', version: 'v1.2.4', lastReported: '4 hours ago' },
  { id: 'ox-agent-003', name: 'ox-agent-003', status: 'Online', ip: '10.0.0.5', version: 'v1.2.5', lastReported: 'Just now' },
  { id: 'ox-agent-004', name: 'ox-agent-004', status: 'Online', ip: '10.0.0.8', version: 'v1.2.3', lastReported: '5 mins ago' },
  { id: 'ox-agent-005', name: 'ox-agent-005', status: 'Maintenance', ip: '192.168.1.15', version: 'v1.2.4', lastReported: '1 day ago' },
];

export const MOCK_CERTS: Certificate[] = [
  { id: '1', domain: 'api.oxmon.com', issuer: "Let's Encrypt R3", status: 'Valid', expiryDate: 'Jan 22, 2024', daysRemaining: 89, lastCheck: '2 mins ago' },
  { id: '2', domain: 'app.oxmon.io', issuer: 'DigiCert Global', status: 'Expiring', expiryDate: 'Nov 15, 2023', daysRemaining: 14, lastCheck: '1 hour ago' },
  { id: '3', domain: 'dev.oxmon.internal', issuer: 'Self-Signed', status: 'Expired', expiryDate: 'Oct 20, 2023', daysRemaining: -2, lastCheck: '5 mins ago' },
  { id: '4', domain: 'auth.oxmon.com', issuer: 'Google Trust Services', status: 'Valid', expiryDate: 'Dec 25, 2023', daysRemaining: 58, lastCheck: '10 mins ago' },
  { id: '5', domain: 'mail.oxmon.io', issuer: "Let's Encrypt R3", status: 'Expiring', expiryDate: 'Nov 23, 2023', daysRemaining: 22, lastCheck: '45 mins ago' },
];

export const MOCK_ALERTS: Alert[] = [
  { id: '1', severity: 'Warning', source: 'host-us-east-1a', message: 'CPU usage exceeding 85%', time: '10:42 AM' },
  { id: '2', severity: 'Critical', source: 'db-cluster-02', message: 'Connection timeout: DB-02', time: '09:15 AM' },
  { id: '3', severity: 'Resolved', source: 'api-gateway', message: 'Latency returned to normal', time: '08:30 AM' },
  { id: '4', severity: 'Info', source: 'backup-service', message: 'Backup completed successfully', time: '04:00 AM' },
];

export const MOCK_TEAM: TeamMember[] = [
  { id: '1', name: 'Alex Morgan', email: 'admin@oxmon.io', role: 'Owner', status: 'Active', img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuC5F8Dcs3wNWThcZRGAAjFlfnNfVWcMZTTV-v1F_jJ9s0DzxgtaOXhtG4xLBsy5U0zt-_we9BWVW5sAnvPCybjOwe3XNbCK080yggg_knFw0RvUYBEKRFyiEgBYcwxe8SVj2fL3qn6Mpy94ivvgYsOeQVyUYLxAaNOmc3XPSMQQVSgZrm5fogWTnOgfKqva373uAWuxoKd9GVFcO0rwp-9kOGDRSvVD3qP3uBREoaPnL-iIYeAI-l_ZQ0MQmIKcJ2AxD6Jvxck_wGM' },
  { id: '2', name: 'Sarah Jenkins', email: 'sarah@oxmon.io', role: 'Editor', status: 'Active', img: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80' },
  { id: '3', name: 'Dev Ops', email: 'ops@oxmon.io', role: 'Viewer', status: 'Pending', img: null },
];

export const DEFAULT_PREFERENCES: AppPreferences = {
  notifEmail: true,
  notifSlack: false,
  notifWeekly: true,
  secure2FA: true,
  workspaceName: 'Oxmon Production',
  supportEmail: 'support@oxmon.io'
};
