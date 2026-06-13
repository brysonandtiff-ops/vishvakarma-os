export interface Option {
  label: string;
  value: string;
  icon?: React.ComponentType<{ className?: string }>;
  withCount?: boolean;
}

// Auth types
export interface Profile {
  id: string;
  email?: string;
  full_name?: string;
  avatar_url?: string;
  role?: string;
  created_at?: string;
  updated_at?: string;
}

// Re-export all types from types.ts
export * from './types';
export * from './billing';
export type { ProjectMemberRole, ProjectPermission } from '@/domain/projects/projectRoles';

export type SaveState = 'clean' | 'unsaved' | 'local-draft' | 'cloud-saved' | 'restored-draft';
