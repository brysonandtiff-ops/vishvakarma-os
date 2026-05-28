import { HardDrive } from 'lucide-react';
import type { SaveState } from '@/types';

export default function SaveStateBadge({ state, lastDraftAt }: { state: SaveState; lastDraftAt: string | null }) {
  const labels: Record<SaveState, { en: string; sa: string }> = {
    clean: { en: 'Saved', sa: 'सुरक्षित' },
    unsaved: { en: 'Unsaved', sa: 'लेख्य' },
    'local-draft': { en: 'Local Draft', sa: 'स्थानीय' },
    'cloud-saved': { en: 'Cloud Saved', sa: 'मेघ सुरक्षित' },
    'restored-draft': { en: 'Recovered Draft', sa: 'पुनर्प्राप्त' },
  };

  const tone = state === 'unsaved'
    ? 'text-warning border-warning/30 bg-warning/10'
    : state === 'local-draft' || state === 'restored-draft'
      ? 'text-primary border-primary/25 bg-primary/10'
      : 'text-success border-success/25 bg-success/10';

  return (
    <div className={`flex items-center gap-1.5 rounded-xl border px-3 py-1.5 ${tone}`} title={`${labels[state].sa} · ${lastDraftAt ? `Last local draft: ${new Date(lastDraftAt).toLocaleString()}` : labels[state].en}`}>
      <HardDrive className="h-3.5 w-3.5" />
      <span className="font-technical text-[10px]">{labels[state].en}</span>
      <span className="font-devanagari hidden text-[9px] text-current/70 sm:inline">{labels[state].sa}</span>
    </div>
  );
}
