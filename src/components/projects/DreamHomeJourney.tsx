import { ArrowRight, Box, Footprints, FolderOpen, PenLine, Save } from 'lucide-react';
import { Link } from 'react-router-dom';
import { OFFICIAL_LOGO_SRC } from '@/brand/officialLogo';
import { useAuth } from '@/contexts/AuthContext';
import { isCoOwnerEmail } from '@/config/coOwners';
import { PRIVATE_WELCOME_EVENT } from '@/welcome/PrivateWelcomeCinematic';
import './DreamHomeJourney.css';

const journey = [
  { title: 'Your projects', detail: 'Find a saved home or continue a draft.', to: '#recent-projects', cta: 'See projects', Icon: FolderOpen },
  { title: 'Draw a plan', detail: 'Place walls, doors and windows.', to: '/editor-lite', cta: 'Open 2D editor', Icon: PenLine },
  { title: 'Inspect in 3D', detail: 'Orbit a local draft or a sample home.', to: '/3d-room', cta: 'Open 3D room', Icon: Box },
  { title: 'Walk through', detail: 'Explore the design at eye level.', to: '/3d-room?mode=walk', cta: 'Try Walk mode', Icon: Footprints },
  { title: 'Save & export', detail: 'Open the full editor to save or export.', to: '/editor', cta: 'Open save tools', Icon: Save },
] as const;

function DreamPlan() {
  return (
    <figure className="vish-dream-plan">
      <svg viewBox="0 0 450 320" role="img" aria-label="Illustrative house floor plan with bedrooms, bathroom, kitchen, hall and living room">
        <defs><pattern id="dream-grid" width="17" height="17" patternUnits="userSpaceOnUse"><path d="M17 0H0V17" fill="none" stroke="#d9cba8" strokeWidth=".6" /></pattern></defs>
        <rect width="450" height="320" fill="url(#dream-grid)" />
        <g fill="none" stroke="#242b2d" strokeWidth="6" strokeLinecap="square">
          <path d="M27 30H422V282H27Z" /><path d="M27 145H157M200 145H255M299 145H422" />
          <path d="M158 30V145M298 30V145M201 30V97M201 134V145" />
          <path d="M155 145V282M299 145V217M299 254V282" />
        </g>
        <g stroke="#bf913a" strokeWidth="4"><path d="M66 30H120M343 30H399M27 192V239M422 195V243M87 282H134" /></g>
        <path className="vish-dream-plan__trace" d="M27 30H422V282H27Z" pathLength="1" fill="none" stroke="#c28a30" strokeWidth="2.5" aria-hidden="true" />
        <g fill="none" stroke="#92764f" strokeWidth="2"><path d="M200 145a42 42 0 0 0-42-42" /><path d="M299 254a37 37 0 0 0-37-37" /><path d="M155 282a38 38 0 0 0-38-38" /></g>
        <g fill="#202b2e" textAnchor="middle" fontWeight="700" fontFamily="Arial,sans-serif" fontSize="12">
          <text x="93" y="88">BEDROOM 2</text><text x="227" y="76">BATH</text><text x="360" y="88">BEDROOM 1</text>
          <text x="89" y="211">KITCHEN</text><text x="228" y="204">HALL</text><text x="362" y="211">LIVING</text>
        </g>
        <g fill="#665e4f" textAnchor="middle" fontFamily="Arial,sans-serif" fontSize="9">
          <text x="92" y="104">REST</text><text x="360" y="104">REST</text><text x="89" y="227">COOK</text><text x="228" y="220">CONNECT</text><text x="362" y="227">RELAX</text>
        </g>
      </svg>
      <figcaption>Concept illustration · 2D floor plan</figcaption>
    </figure>
  );
}

export function DreamHomeJourney() {
  const { user } = useAuth();
  return (
    <section className="vish-dream" aria-labelledby="vish-dream-title" data-testid="dream-home-journey">
      <div className="vish-dream__hero">
        <div>
          <div className="vish-dream__brand">
            <img src={OFFICIAL_LOGO_SRC} alt="" aria-hidden="true" />
            <span>Vishvakarma.OS</span>
          </div>
          <h2 id="vish-dream-title">A home begins <em>with imagination.</em></h2>
          <p className="vish-dream__intro">Sketch your floor plan, explore it in 3D, and pick up where you left off.</p>
          <div className="vish-dream__actions">
            <Link className="vish-dream__primary" to="/editor-lite">Start drawing <ArrowRight aria-hidden="true" size={18} /></Link>
            <Link className="vish-dream__secondary" to="/3d-room"><Box aria-hidden="true" size={17} /> Explore in 3D</Link>
            <a className="vish-dream__text-action" href="#recent-projects">Saved projects</a>
          </div>
          {user && isCoOwnerEmail(user.email) && (
            <button type="button" className="vish-dream__text-action" onClick={() => window.dispatchEvent(new Event(PRIVATE_WELCOME_EVENT))}>
              Replay my welcome film
            </button>
          )}
        </div>
        <DreamPlan />
      </div>
      <h3 id="vish-dream-steps" className="vish-dream__steps-header">From sketch to walkthrough</h3>
      <ol className="vish-dream__steps" role="list" aria-labelledby="vish-dream-steps">
        {journey.map(({ title, detail, to, cta, Icon }) => {
          const card = <><span className="vish-dream__step-icon"><Icon size={21} aria-hidden="true" /></span><strong>{title}</strong><span className="vish-dream__detail">{detail}</span><small>{cta}<ArrowRight size={14} aria-hidden="true" /></small></>;
          return <li key={to}>{to.startsWith('#')
            ? <a className="vish-dream__step" href={to} aria-label={cta}>{card}</a>
            : <Link className="vish-dream__step" to={to} aria-label={cta}>{card}</Link>}</li>;
        })}
      </ol>
    </section>
  );
}
