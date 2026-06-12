import { HardDrive } from 'lucide-react';
import type { SaveState } from '@/types';

const STATE_TOOLTIPS: Record<SaveState, string> = {
  clean: 'All changes are saved to cloud or local storage.',
  unsaved: 'You have unsaved changes — save to protect your work.',
  'local-draft': 'Saved in this browser only. Connect Supabase to sync across devices.',
  'cloud-saved': 'Project saved to Supabase Postgres.',
  'restored-draft': 'Recovered from a previous local draft in this browser.',
};

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

  const draftDetail = lastDraftAt ? ` Last local draft: ${new Date(lastDraftAt).toLocaleString()}.` : '';

  return (
    <div
      className={`flex items-center gap-1.5 rounded-xl border px-3 py-1.5 ${tone}`}
      title={`${STATE_TOOLTIPS[state]}${draftDetail}`}
    >
      <HardDrive className="h-3.5 w-3.5" />
      <span className="font-technical text-[10px]">{labels[state].en}</span>
      <span className="font-devanagari hidden text-[9px] text-current/70 sm:inline">{labels[state].sa}</span>
    </div>
  );
}
