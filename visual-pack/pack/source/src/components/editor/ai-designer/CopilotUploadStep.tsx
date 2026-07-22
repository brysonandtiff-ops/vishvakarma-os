import { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { FileText, Map, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useCoarsePointer } from '@/hooks/useCoarsePointer';
import type { CopilotDocumentKind, CopilotUploadedDocument } from '@/domain/copilot/copilotSession';
import { createUploadedDocument, validateCopilotUpload } from '@/services/copilot/ingestion/copilotUpload';
import { toast } from 'sonner';

const UPLOAD_SLOTS: { kind: CopilotDocumentKind; label: string; hint: string; icon: typeof FileText }[] = [
  { kind: 'siteSurvey', label: 'Site survey', hint: 'PDF, image, or text', icon: FileText },
  { kind: 'boundaryPlan', label: 'Boundary plan', hint: 'DXF, PDF, or image', icon: Map },
  { kind: 'councilRequirements', label: 'Council requirements', hint: 'PDF or text', icon: FileText },
];

function UploadSlot({
  kind,
  label,
  hint,
  icon: Icon,
  document,
  onUpload,
  onRemove,
  disabled,
  isCoarsePointer = false,
}: {
  kind: CopilotDocumentKind;
  label: string;
  hint: string;
  icon: typeof FileText;
  document?: CopilotUploadedDocument;
  onUpload: (kind: CopilotDocumentKind, file: File) => void;
  onRemove: (kind: CopilotDocumentKind) => void;
  disabled?: boolean;
  isCoarsePointer?: boolean;
}) {
  const onDrop = useCallback(
    (files: File[]) => {
      const file = files[0];
      if (!file) return;
      const error = validateCopilotUpload(kind, file);
      if (error) {
        toast.error(error);
        return;
      }
      onUpload(kind, file);
    },
    [kind, onUpload],
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    multiple: false,
    disabled,
    accept: {
      'application/pdf': ['.pdf'],
      'text/plain': ['.txt'],
      'application/dxf': ['.dxf'],
      'image/png': ['.png'],
      'image/jpeg': ['.jpg', '.jpeg'],
    },
  });

  return (
    <div className="vish-copilot-upload-slot rounded-xl border border-border/60 p-3">
      <div className="mb-2 flex items-center gap-2">
        <Icon className="h-4 w-4 text-primary" />
        <Label>{label}</Label>
      </div>
      {document ? (
        <div className="flex items-center justify-between gap-2 text-xs">
          <span className="truncate text-muted-foreground">{document.fileName}</span>
          <Button type="button" size="sm" variant="ghost" onClick={() => onRemove(kind)} disabled={disabled}>
            Remove
          </Button>
        </div>
      ) : (
        <div
          {...getRootProps()}
          className={`touch-target min-h-[44px] cursor-pointer rounded-lg border border-dashed p-4 text-center text-xs transition-colors ${
            isDragActive ? 'border-primary bg-primary/5' : 'border-border/60 text-muted-foreground hover:border-primary/50'
          }`}
        >
          <input {...getInputProps()} />
          <Upload className="mx-auto mb-1 h-5 w-5" />
          {isCoarsePointer ? `Browse Files · ${hint}` : `Drop file or click · ${hint}`}
        </div>
      )}
    </div>
  );
}

export default function CopilotUploadStep({
  documents,
  filesByKind,
  onUpload,
  onRemove,
  disabled,
}: {
  documents: CopilotUploadedDocument[];
  filesByKind: Map<CopilotDocumentKind, File>;
  onUpload: (kind: CopilotDocumentKind, file: File, doc: CopilotUploadedDocument) => void;
  onRemove: (kind: CopilotDocumentKind) => void;
  disabled?: boolean;
}) {
  const handleUpload = (kind: CopilotDocumentKind, file: File) => {
    onUpload(kind, file, createUploadedDocument(kind, file));
  };
  const isCoarsePointer = useCoarsePointer();

  return (
    <div className="grid gap-3 md:grid-cols-3">
      {UPLOAD_SLOTS.map((slot) => (
        <UploadSlot
          key={slot.kind}
          kind={slot.kind}
          label={slot.label}
          hint={slot.hint}
          icon={slot.icon}
          document={documents.find((d) => d.kind === slot.kind)}
          onUpload={handleUpload}
          onRemove={onRemove}
          disabled={disabled}
          isCoarsePointer={isCoarsePointer}
        />
      ))}
      <p className="text-[10px] text-muted-foreground">
        Optional uploads — design brief alone still works. Uploaded docs improve site and council accuracy.
        {isCoarsePointer && ' On iPad, HEIC photos from Photos are accepted for image uploads.'}
      </p>
      {filesByKind.size > 0 && (
        <p className="text-xs text-muted-foreground">{filesByKind.size} file(s) ready for parsing</p>
      )}
    </div>
  );
}
