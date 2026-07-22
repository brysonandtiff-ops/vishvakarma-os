import { backendStatus } from '@/backend/backendConfig';
import {
  getSupabaseProject,
  updateSupabaseProject,
} from '@/backend/supabase/supabaseProjectGateway';
import type { ManifestCollabBridge } from '@/collaboration/crdt/manifestBridge';

const SNAPSHOT_DEBOUNCE_MS = 2_000; // Fast debounce for saving manifest updates

export class SupabaseSnapshotProvider {
  private timer: ReturnType<typeof setTimeout> | null = null;
  private projectId: string | null = null;
  private bridge: ManifestCollabBridge | null = null;

  bind(projectId: string, bridge: ManifestCollabBridge): void {
    this.projectId = projectId;
    this.bridge = bridge;
  }

  scheduleSnapshot(): void {
    if (!backendStatus.isConfigured || !this.projectId || !this.bridge) return;
    if (this.timer) clearTimeout(this.timer);
    this.timer = setTimeout(() => {
      void this.flushSnapshot();
    }, SNAPSHOT_DEBOUNCE_MS);
  }

  async flushSnapshot(): Promise<void> {
    if (!backendStatus.isConfigured || !this.projectId || !this.bridge) return;
    const manifest = this.bridge.toManifest();
    try {
      await updateSupabaseProject(this.projectId, {
        manifest,
      });
    } catch (error) {
      console.error('[SupabaseSnapshotProvider] Failed to save manifest:', error);
    }
  }

  async restoreSnapshot(projectId: string, bridge: ManifestCollabBridge): Promise<boolean> {
    if (!backendStatus.isConfigured) return false;
    try {
      const project = await getSupabaseProject(projectId);
      if (!project?.manifest) return false;
      bridge.loadManifest(project.manifest);
      this.projectId = projectId;
      this.bridge = bridge;
      return true;
    } catch {
      return false;
    }
  }

  destroy(): void {
    if (this.timer) clearTimeout(this.timer);
    this.timer = null;
    this.bridge = null;
    this.projectId = null;
  }
}

