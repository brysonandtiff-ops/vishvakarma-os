import { Box, Footprints, PenLine } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { EditorManifestView } from '@/editor/openManifestInEditor';
import { useAuth } from '@/contexts/AuthContext';
import { isCoOwnerEmail } from '@/config/coOwners';
import { PRIVATE_WELCOME_EVENT } from '@/welcome/PrivateWelcomeCinematic';
import './DreamHomeJourney.css';

interface DreamHomeJourneyProps {
  onOpenSample: (view?: EditorManifestView) => void;
}

export function DreamHomeJourney({ onOpenSample }: DreamHomeJourneyProps) {
  const { user } = useAuth();

  return (
    <section className="vish-studio-preview" aria-labelledby="studio-preview-title">
      <div className="vish-studio-preview__content">
        <h2 id="studio-preview-title">Try the Atrium Wing in Studio</h2>
        <p>Open the sample plan to draw, inspect the model, or walk inside.</p>
        <div className="vish-studio-preview__actions">
          <Button type="button" variant="outline" className="min-h-[44px]" onClick={() => onOpenSample()}>
            <PenLine aria-hidden="true" /> Blueprint
          </Button>
          <Button type="button" variant="outline" className="min-h-[44px]" onClick={() => onOpenSample('orbit')}>
            <Box aria-hidden="true" /> 3D
          </Button>
          <Button type="button" variant="outline" className="min-h-[44px]" onClick={() => onOpenSample('walk')}>
            <Footprints aria-hidden="true" /> Walk
          </Button>
        </div>
        {user && isCoOwnerEmail(user.email) && (
          <Button type="button" variant="link" className="min-h-[44px] px-0" onClick={() => window.dispatchEvent(new Event(PRIVATE_WELCOME_EVENT))}>
            Replay my welcome film
          </Button>
        )}
      </div>
      <figure className="vish-studio-preview__art">
        <img src="/room-studies/concepts.webp" alt="Three rendered architectural studies of sample homes" width="3120" height="740" loading="lazy" />
        <figcaption>Sample home studies</figcaption>
      </figure>
    </section>
  );
}
