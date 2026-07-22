import type { ReactNode } from 'react';
import { toast as sonnerToast, type ExternalToast } from 'sonner';
import { playStudioSound } from '@/modules/studio-audio/audioEngine';

function withSound(kind: 'success' | 'error' | 'message', fn: typeof sonnerToast.success) {
  return (message: string | ReactNode, data?: ExternalToast) => {
    if (kind === 'success') playStudioSound('toastSuccess');
    else if (kind === 'error') playStudioSound('toastError');
    return fn(message, data);
  };
}

export const studioToast = {
  success: withSound('success', sonnerToast.success.bind(sonnerToast)),
  error: withSound('error', sonnerToast.error.bind(sonnerToast)),
  message: withSound('message', sonnerToast.message.bind(sonnerToast)),
};

export { sonnerToast as toast };
