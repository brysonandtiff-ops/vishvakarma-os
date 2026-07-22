import { Wifi, WifiOff } from 'lucide-react';
import type { CloudSaveLabel } from '@/hooks/useCloudSaveStatus';

const TOOLTIPS: Record<CloudSaveLabel, string> = {
  'Supabase Cloud Save': 'Supabase Postgres is configured — projects can sync to the cloud when signed in.',
  'Local Draft': 'Supabase not configured — work is saved in this browser only.',
};

export default function SaveModeBadge({
  connected,
  label = 'Cloud Save',
}: {
  connected: boolean | null;
  label?: CloudSaveLabel | string;
}) {
  if (connected === null) return null;

  const tooltip = connected
    ? TOOLTIPS['Supabase Cloud Save']
    : TOOLTIPS['Local Draft'];

  return (
    <div
      className="flex items-center gap-1.5 rounded-xl border border-ws-border bg-black/20 px-3 py-1.5"
      title={tooltip}
    >
      {connected ? (
        <>
          <Wifi className="h-3.5 w-3.5 text-success" />
          <span className="font-technical text-[10px] text-success">{label}</span>
        </>
      ) : (
        <>
          <WifiOff className="h-3.5 w-3.5 text-ws-text-faint" />
          <span className="font-technical text-[10px] text-ws-text-faint">Local Draft</span>
        </>
      )}
    </div>
  );
}
