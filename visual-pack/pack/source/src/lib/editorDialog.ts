import { cn } from '@/lib/utils';

/** Shared DialogContent classes for editor chrome (BRAND_LOCK rounded-3xl). */
export const editorDialogClassName = cn(
  'vish-dialog-chrome max-w-[calc(100%-2rem)] rounded-3xl border-primary/30 md:max-w-md'
);

export const editorDialogClassNameLg = cn(
  'vish-dialog-chrome max-h-[min(90vh,720px)] max-w-[calc(100%-2rem)] overflow-hidden rounded-3xl md:max-w-lg'
);

export const editorDialogClassNameXl = cn(
  'vish-dialog-chrome max-h-[min(90vh,720px)] max-w-[calc(100%-2rem)] overflow-hidden rounded-3xl md:max-w-2xl'
);

export const editorCopilotDialogClassName = cn(
  'vish-dialog-chrome vish-copilot-dialog max-h-[85vh] max-w-[calc(100%-2rem)] overflow-y-auto rounded-3xl md:max-w-3xl'
);
