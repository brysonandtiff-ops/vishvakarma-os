import { backendStatus } from '@/backend/backendConfig';
import { updateFirestoreProjectCollabSnapshot } from '@/backend/firebase/firestoreProjectGateway';
import type { ManifestCollabBridge } from '@/collaboration/crdt/manifestBridge';

const SNAPSHOT_DEBOUNCE_MS = 30_000;

export class FirebaseSnapshotProvider {
  private timer: ReturnType<typeof setTimeout> | null = null;
  private revision = 0;
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
    this.revision += 1;
    const state = this.bridge.encodeState();
    await updateFirestoreProjectCollabSnapshot(this.projectId, {
      state,
      updatedAt: new Date().toISOString(),
      revision: this.revision,
    });
  }

  async restoreSnapshot(projectId: string, bridge: ManifestCollabBridge): Promise<boolean> {
    if (!backendStatus.isConfigured) return false;
    const { getFirestoreProjectCollabSnapshot } = await import(
      '@/backend/firebase/firestoreProjectGateway'
    );
    const snapshot = await getFirestoreProjectCollabSnapshot(projectId);
    if (!snapshot?.state) return false;
    bridge.applyEncodedState(snapshot.state);
    this.revision = snapshot.revision;
    this.projectId = projectId;
    this.bridge = bridge;
    return true;
  }

  destroy(): void {
    if (this.timer) clearTimeout(this.timer);
    this.timer = null;
    this.bridge = null;
    this.projectId = null;
  }
}
