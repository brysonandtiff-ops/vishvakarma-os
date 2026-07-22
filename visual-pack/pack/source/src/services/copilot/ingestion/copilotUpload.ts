import type { CopilotDocumentKind, CopilotUploadedDocument } from '@/domain/copilot/copilotSession';

const ALLOWED_MIME: Record<CopilotDocumentKind, Set<string>> = {
  siteSurvey: new Set(['text/plain', 'application/pdf', 'image/png', 'image/jpeg', 'image/jpg', 'image/heic', 'image/heif']),
  boundaryPlan: new Set([
    'application/dxf',
    'text/plain',
    'application/pdf',
    'image/png',
    'image/jpeg',
    'image/jpg',
    'image/heic',
    'image/heif',
  ]),
  councilRequirements: new Set(['text/plain', 'application/pdf', 'text/csv']),
};

const IMAGE_EXTENSIONS = new Set(['png', 'jpg', 'jpeg', 'heic', 'heif']);

const MAX_BYTES = 10 * 1024 * 1024;

export function validateCopilotUpload(kind: CopilotDocumentKind, file: File): string | null {
  if (file.size > MAX_BYTES) {
    return 'File must be 10 MB or smaller';
  }

  const allowed = ALLOWED_MIME[kind];
  const ext = file.name.toLowerCase().split('.').pop() ?? '';
  const extOk =
    (kind === 'boundaryPlan' && ext === 'dxf') ||
    ((kind === 'siteSurvey' || kind === 'boundaryPlan') && IMAGE_EXTENSIONS.has(ext)) ||
    (kind === 'councilRequirements' && (ext === 'txt' || ext === 'pdf' || ext === 'csv'));

  if (!allowed.has(file.type) && !extOk) {
    return `Unsupported file type for ${kind}`;
  }

  return null;
}

export function createUploadedDocument(kind: CopilotDocumentKind, file: File): CopilotUploadedDocument {
  return {
    id: crypto.randomUUID(),
    kind,
    fileName: file.name,
    mimeType: file.type || 'application/octet-stream',
    sizeBytes: file.size,
  };
}
