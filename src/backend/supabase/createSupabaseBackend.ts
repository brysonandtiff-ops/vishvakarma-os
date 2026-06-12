import { backendStatus } from '@/backend/backendConfig';
import type { BackendGateway } from '@/backend/backendTypes';
import * as api from '@/db/api';
import {
  clearSupabaseSessionSnapshot,
  requestSupabaseAccessLink,
} from '@/backend/supabase/supabaseAuthGateway';

export function createSupabaseBackend(): BackendGateway {
  return {
    status: backendStatus,
    auth: {
      requestAccessLink: (email, redirectTo) => requestSupabaseAccessLink(email, redirectTo),
      signOut: async () => {
        clearSupabaseSessionSnapshot();
      },
    },
    projects: {
      getProjects: () => api.getProjects(),
      getProject: (id) => api.getProject(id),
      createProject: (name, description, manifest) => api.createProject(name, description, manifest),
      updateProject: (id, updates) => api.updateProject(id, updates),
      deleteProject: (id) => api.deleteProject(id),
    },
    governance: {
      getSpecs: () => api.getSpecs(),
      getRegistryEntries: () => api.getRegistryEntries(),
      getChangeRequests: () => api.getChangeRequests(),
      getReleases: () => api.getReleases(),
      getAuditLogs: () => api.getAuditLogs(),
    },
  };
}

export const supabaseBackend = createSupabaseBackend();
