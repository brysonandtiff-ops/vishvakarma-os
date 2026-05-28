import { HardDrive } from 'lucide-react';
import type { SaveState } from '@/types';

export default function SaveStateBadge({ state, lastDraftAt }: { state: SaveState; lastDraftAt: string | null }) {
  const labels: Record<SaveState, string> = {
    clean: 'Saved',
    unsaved: 'Unsaved',
    'local-draft': 'Local Draft',
    'cloud-saved': 'Cloud Saved',
    'restored-draft': 'Recovered Draft',
  };

  const tone = state === 'unsaved'
    ? 'text-warning border-warning/30 bg-warning/10'
    : state === 'local-draft' || state === 'restored-draft'
      ? 'text-primary border-primary/25 bg-primary/10'
      : 'text-success border-success/25 bg-success/10';

  return (
    <div className={`flex items-center gap-1.5 rounded-xl border px-3 py-1.5 ${tone}`} title={lastDraftAt ? `Last local draft: ${new Date(lastDraftAt).toLocaleString()}` : undefined}>
      <HardDrive className="h-3.5 w-3.5" />
      <span className="font-technical text-[10px]">{labels[state]}</span>
    </div>
  );
}
