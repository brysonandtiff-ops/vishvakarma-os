import http from 'node:http';
import { WebSocketServer } from 'ws';
// @ts-expect-error y-websocket bin utils has no published types
import { setupWSConnection } from 'y-websocket/bin/utils';
import { canJoinProjectRoom, extractProjectIdFromRoom, parseAuthTokenFromUrl, verifyCastViewerToken, verifyCollabToken } from './auth.js';

const PORT = Number(process.env.COLLAB_WS_PORT ?? 1234);
const DEFAULT_ALLOWED_ORIGINS = [
  'https://vishvakarma-os.app',
  'https://vishvakarma-os.vercel.app',
  'https://vishvakarma-os-tyrasic-creations.vercel.app',
  'https://vishvakarma-os-git-main-tyrasic-creations.vercel.app',
  'http://127.0.0.1:5173',
  'http://localhost:5173',
];

function normalizeOrigin(value: string): string | null {
  try {
    return new URL(value).origin;
  } catch {
    return null;
  }
}

const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS ?? DEFAULT_ALLOWED_ORIGINS.join(','))
  .split(',')
  .map((value) => value.trim())
  .filter(Boolean)
  .map(normalizeOrigin)
  .filter((origin): origin is string => Boolean(origin));

function isOriginAllowed(origin: string | undefined): boolean {
  if (!origin) return process.env.ALLOW_MISSING_ORIGIN === 'true';
  const normalized = normalizeOrigin(origin);
  if (!normalized) return false;
  return ALLOWED_ORIGINS.includes(normalized);
}

function parseTokenFromUrl(url: string | undefined): string | null {
  return parseAuthTokenFromUrl(url).token;
}

const server = http.createServer((_req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('Vishvakarma collab presence server');
});

const wss = new WebSocketServer({ noServer: true });

server.on('upgrade', async (request, socket, head) => {
  const origin = request.headers.origin;
  if (!isOriginAllowed(origin)) {
    socket.write('HTTP/1.1 403 Forbidden\r\n\r\n');
    socket.destroy();
    return;
  }

  const { token, castToken } = parseAuthTokenFromUrl(request.url);
  const authToken = castToken ?? token;
  if (!authToken) {
    socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n');
    socket.destroy();
    return;
  }

  let uid: string;
  let castViewer = false;
  try {
    if (castToken) {
      const verified = await verifyCastViewerToken(castToken);
      uid = verified.uid;
      castViewer = true;
    } else {
      const verified = await verifyCollabToken(authToken);
      uid = verified.uid;
    }
  } catch {
    socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n');
    socket.destroy();
    return;
  }

  const roomName = request.url?.split('?')[0]?.split('/').pop() ?? '';
  const projectId = extractProjectIdFromRoom(roomName);
  if (!projectId) {
    socket.write('HTTP/1.1 400 Bad Request\r\n\r\n');
    socket.destroy();
    return;
  }

  try {
    if (castViewer) {
      const verified = await verifyCastViewerToken(castToken!);
      if (verified.projectId !== projectId) {
        socket.write('HTTP/1.1 403 Forbidden\r\n\r\n');
        socket.destroy();
        return;
      }
    } else {
      const allowed = await canJoinProjectRoom(uid, projectId);
      if (!allowed) {
        socket.write('HTTP/1.1 403 Forbidden\r\n\r\n');
        socket.destroy();
        return;
      }
    }
  } catch (error) {
    console.error('[collab] authorization failed', error);
    socket.write('HTTP/1.1 500 Internal Server Error\r\n\r\n');
    socket.destroy();
    return;
  }

  wss.handleUpgrade(request, socket, head, (ws) => {
    setupWSConnection(ws, request, { docName: roomName, gc: true });
  });
});

server.listen(PORT, () => {
  console.log(`[collab] presence server listening on :${PORT}`);
});
