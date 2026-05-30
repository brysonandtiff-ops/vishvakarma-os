import { Mic } from 'lucide-react';
import { toast } from 'sonner';

export default function EditorVoiceMic() {
  return (
    <button
      type="button"
      className="pointer-events-auto absolute bottom-4 right-16 z-20 flex h-10 w-10 items-center justify-center rounded-full border border-primary/35 bg-ws-menubar text-primary shadow-lg hover:bg-primary/10"
      aria-label="Voice commands"
      data-testid="editor-voice-mic"
      onClick={() => toast.message('Voice commands', { description: 'Voice drafting is not enabled in this release.' })}
    >
      <Mic className="h-4 w-4" />
    </button>
  );
}
