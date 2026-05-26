import type {
  AuditLog,
  ChangeRequest,
  Project,
  ProjectManifest,
  RegistryEntry,
  Release,
  Spec,
} from '@/types';

export type BackendProvider = 'supabase' | 'firebase';
export type BackendMode = 'connected' | 'local-only';

export interface BackendStatus {
  provider: BackendProvider;
  mode: BackendMode;
  isConfigured: boolean;
  configurationError: string | null;
}

export interface AuthGateway {
  requestAccessLink(email: string, redirectTo: string): Promise<{ error: Error | null }>;
  signOut(): Promise<void>;
}

export interface ProjectGateway {
  getProjects(): Promise<Project[]>;
  getProject(id: string): Promise<Project | null>;
  createProject(name: string, description: string | undefined, manifest: ProjectManifest): Promise<Project>;
  updateProject(id: string, updates: Partial<Pick<Project, 'name' | 'description' | 'manifest'>>): Promise<Project>;
  deleteProject(id: string): Promise<void>;
}

export interface GovernanceGateway {
  getSpecs(): Promise<Spec[]>;
  getRegistryEntries(): Promise<RegistryEntry[]>;
  getChangeRequests(): Promise<ChangeRequest[]>;
  getReleases(): Promise<Release[]>;
  getAuditLogs(): Promise<AuditLog[]>;
}

export interface BackendGateway {
  status: BackendStatus;
  auth: AuthGateway;
  projects: ProjectGateway;
  governance: GovernanceGateway;
}

export function createBackendNotImplementedError(provider: BackendProvider, feature: string) {
  return new Error(`${provider} backend ${feature} is not implemented yet.`);
}
