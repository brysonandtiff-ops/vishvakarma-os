import { Wifi, WifiOff } from 'lucide-react';

export default function SaveModeBadge({ connected }: { connected: boolean | null }) {
  if (connected === null) return null;

  return (
    <div className="flex items-center gap-1.5 rounded-xl border border-ws-border bg-black/20 px-3 py-1.5">
      {connected ? (
        <>
          <Wifi className="h-3.5 w-3.5 text-success" />
          <span className="font-technical text-[10px] text-success">Cloud Save</span>
        </>
      ) : (
        <>
          <WifiOff className="h-3.5 w-3.5 text-ws-text-faint" />
          <span className="font-technical text-[10px] text-ws-text-faint">Local Preview</span>
        </>
      )}
    </div>
  );
}
