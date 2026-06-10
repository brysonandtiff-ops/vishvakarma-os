import { initializeApp, cert, getApps, type App } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

let adminApp: App | null = null;

function getAdminApp(): App {
  if (adminApp) return adminApp;
  if (getApps().length > 0) {
    adminApp = getApps()[0];
    return adminApp;
  }

  const projectId = process.env.FIREBASE_PROJECT_ID;
  if (!projectId) {
    throw new Error('FIREBASE_PROJECT_ID is required for collab server auth');
  }

  const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (serviceAccountJson) {
    adminApp = initializeApp({
      credential: cert(JSON.parse(serviceAccountJson)),
      projectId,
    });
    return adminApp;
  }

  adminApp = initializeApp({ projectId });
  return adminApp;
}

export async function verifyCollabToken(token: string): Promise<{ uid: string; email?: string }> {
  const auth = getAuth(getAdminApp());
  const decoded = await auth.verifyIdToken(token);
  return { uid: decoded.uid, email: decoded.email };
}

export async function canJoinProjectRoom(uid: string, projectId: string): Promise<boolean> {
  const db = getFirestore(getAdminApp());
  const doc = await db.collection('projects').doc(projectId).get();
  if (!doc.exists) return false;

  const data = doc.data();
  if (!data) return false;
  if (data.ownerId === uid) return true;

  const collaborators: string[] = Array.isArray(data.collaborators) ? data.collaborators : [];
  return collaborators.includes(uid);
}

export function extractProjectIdFromRoom(roomName: string): string | null {
  if (!roomName.startsWith('project-')) return null;
  return roomName.slice('project-'.length);
}
