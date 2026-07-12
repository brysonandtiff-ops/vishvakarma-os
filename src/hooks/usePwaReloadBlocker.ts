import { useEffect } from 'react';
import {
  clearPwaReloadBlocker,
  setPwaReloadBlocker,
} from '@/pwaUpdateSafety';

export function usePwaReloadBlocker(id: string, blocked = true) {
  useEffect(() => {
    setPwaReloadBlocker(id, blocked);
    return () => clearPwaReloadBlocker(id);
  }, [blocked, id]);
}
