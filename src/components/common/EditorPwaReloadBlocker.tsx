import { useLocation } from 'react-router-dom';
import { usePwaReloadBlocker } from '@/hooks/usePwaReloadBlocker';

const EDITOR_PATHS = new Set(['/editor', '/editor-lite']);

/**
 * Editor sessions are treated as reload-sensitive even when a cloud save appears
 * clean: pointer gestures, open dialogs, local history, and pending draft timers
 * are all in-memory state. Updates are therefore explicit while an editor is open.
 */
export default function EditorPwaReloadBlocker() {
  const { pathname } = useLocation();
  usePwaReloadBlocker('active-editor-session', EDITOR_PATHS.has(pathname));
  return null;
}
