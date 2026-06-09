interface EditorCommandStripProps {
  wallCount: number;
  openingCount: number;
}

export default function EditorCommandStrip({ wallCount, openingCount }: EditorCommandStripProps) {
  return (
    <div className="flex shrink-0 items-center gap-2 border-b border-ws-border/50 px-1 py-2">
      <div className="flex items-center gap-1.5 rounded-xl border border-primary/25 bg-black/20 px-3 py-2">
        <span className="h-2 w-2 rounded-full bg-primary shadow-[0_0_12px_hsl(var(--ws-active))]" />
        <span className="font-technical text-[10px] uppercase tracking-[0.2em] text-ws-text">Project proof</span>
        <span className="font-technical text-[10px] text-ws-text-faint">
          {wallCount} walls · {openingCount} openings
        </span>
      </div>
    </div>
  );
}
