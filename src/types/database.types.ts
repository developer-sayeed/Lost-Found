export interface MongoStatus {
  connected: boolean;
  connecting: boolean;
  databaseName: string;
  host: string;
  source: 'mongodb' | 'local_json_fallback';
  uriConfigured: boolean;
  maskedUri: string;
  error?: string;
  lastConnectedAt?: string;
  pingMs?: number;
  collections: {
    itemsCount: number;
    staffCount: number;
    usersCount: number;
    auditLogsCount: number;
    settingsCount: number;
  };
}

export type DatabaseEngineType =
  | 'mongodb'
  | 'firebase'
  | 'firestore'
  | 'sql'
  | 'postgresql'
  | 'redis'
  | 'supabase'
  | 'local_json'
  | 'indexeddb';

export type DatabaseStatus =
  | 'connected'
  | 'connecting'
  | 'disconnected'
  | 'replicating'
  | 'standby'
  | 'error';

export interface DatabaseConnectionInfo {
  id: string;
  name: string;
  type: DatabaseEngineType;
  description: string;
  badge: string;
  uri?: string;
  host?: string;
  port?: number;
  dbName?: string;
  username?: string;
  password?: string;
  apiKey?: string;
  projectId?: string;
  authDomain?: string;
  schema?: string;
  realtimeSyncEnabled?: boolean;
  ssl?: boolean;
  status: DatabaseStatus;
  isPrimary: boolean;
  isEnabled: boolean;
  pingMs?: number;
  lastSyncAt?: string;
  error?: string;
  recordCounts?: {
    items: number;
    staff: number;
    inquiries: number;
    settings: number;
    notifications: number;
  };
}

export interface MultiDatabaseSystemState {
  primaryEngine: DatabaseEngineType;
  replicationMode: 'dual-write' | 'multi-write' | 'primary-only' | 'eventual';
  realtimeSyncEnabled: boolean;
  autoFailoverEnabled: boolean;
  lastGlobalSyncAt?: string;
  activeConnectionsCount: number;
  totalReplicatedRecords: number;
  averagePingMs: number;
  databases: DatabaseConnectionInfo[];
  syncLogs: Array<{
    id: string;
    timestamp: string;
    action: string;
    engine: DatabaseEngineType;
    status: 'success' | 'warning' | 'error';
    details: string;
    durationMs: number;
  }>;
}

export interface DatabaseHealthInfo {
  success: boolean;
  engine: DatabaseEngineType;
  name: string;
  status: 'connected' | 'degraded' | 'error' | 'disconnected' | 'timeout';
  pingMs: number;
  message: string;
  checkedAt: string;
  isPrimary: boolean;
  host?: string;
  dbName?: string;
}
