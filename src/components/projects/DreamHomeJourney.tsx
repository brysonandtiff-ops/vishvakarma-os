import { ArrowRight, Box, Footprints, FolderOpen, PenLine, Save } from 'lucide-react';
import { Link } from 'react-router-dom';
import { OFFICIAL_LOGO_SRC } from '@/brand/officialLogo';
import './DreamHomeJourney.css';

const journey = [
  { step: '01', title: 'Your projects', detail: 'Find a saved home or start a new one.', to: '#recent-projects', cta: 'See projects', Icon: FolderOpen },
  { step: '02', title: 'Draw the plan', detail: 'Draw walls, doors and windows in 2D.', to: '/editor-lite', cta: 'Open 2D editor', Icon: PenLine },
  { step: '03', title: 'See it in 3D', detail: 'Review a saved local draft, or explore a sample.', to: '/3d-room', cta: 'Open 3D room', Icon: Box },
  { step: '04', title: 'Walk through', detail: 'Turn on Walk mode inside the 3D room.', to: '/3d-room', cta: 'Try Walk mode', Icon: Footprints },
  { step: '05', title: 'Save & export', detail: 'Save, reopen or export in the full studio.', to: '/editor', cta: 'Open save tools', Icon: Save },
] as const;

function DreamPlan() {
  return (
    <figure className="vish-dream-plan">
      <div className="vish-dream-plan__header"><span>YOUR HOME, YOUR IDEAS</span><span>PLAN STUDY / 2D</span></div>
      <svg viewBox="0 0 450 320" role="img" aria-label="Illustrative house floor plan with bedrooms, bathroom, kitchen, hall and living room">
        <defs><pattern id="dream-grid" width="17" height="17" patternUnits="userSpaceOnUse"><path d="M17 0H0V17" fill="none" stroke="#d9cba8" strokeWidth=".6" /></pattern></defs>
        <rect width="450" height="320" fill="url(#dream-grid)" />
        <g fill="none" stroke="#242b2d" strokeWidth="6" strokeLinecap="square">
          <path d="M27 30H422V282H27Z" /><path d="M27 145H157M200 145H255M299 145H422" />
          <path d="M158 30V145M298 30V145M201 30V97M201 134V145" />
          <path d="M155 145V282M299 145V217M299 254V282" />
        </g>
        <g stroke="#bf913a" strokeWidth="4"><path d="M66 30H120M343 30H399M27 192V239M422 195V243M87 282H134" /></g>
        <g fill="none" stroke="#92764f" strokeWidth="2"><path d="M200 145a42 42 0 0 0-42-42" /><path d="M299 254a37 37 0 0 0-37-37" /><path d="M155 282a38 38 0 0 0-38-38" /></g>
        <g fill="#202b2e" textAnchor="middle" fontWeight="700" fontFamily="Arial,sans-serif" fontSize="12">
          <text x="93" y="88">BEDROOM 2</text><text x="227" y="76">BATH</text><text x="360" y="88">BEDROOM 1</text>
          <text x="89" y="211">KITCHEN</text><text x="228" y="204">HALL</text><text x="362" y="211">LIVING</text>
        </g>
        <g fill="#665e4f" textAnchor="middle" fontFamily="Arial,sans-serif" fontSize="9">
          <text x="92" y="104">REST</text><text x="360" y="104">REST</text><text x="89" y="227">COOK</text><text x="228" y="220">CONNECT</text><text x="362" y="227">RELAX</text>
        </g>
      </svg>
      <figcaption>Concept illustration from the original design. Not a live editor screenshot.</figcaption>
    </figure>
  );
}

export function DreamHomeJourney() {
  return (
    <section className="vish-dream" aria-labelledby="vish-dream-title" data-testid="dream-home-journey">
      <div className="vish-dream__hero">
        <div>
          <div className="vish-dream__brand">
            <img src={OFFICIAL_LOGO_SRC} alt="" aria-hidden="true" />
            <span>VISHVAKARMA.OS · THE DREAM HOME JOURNEY</span>
          </div>
          <p className="vish-dream__eyebrow">FROM HER SKETCH TO HER DREAM HOME</p>
          <h2 id="vish-dream-title">A home begins <em>with imagination.</em></h2>
          <p className="vish-dream__intro">Start with a sketch, view it in 3D, then return to your ideas when you are ready. Professional tools stay available whenever you need them.</p>
          <div className="vish-dream__actions">
            <Link className="vish-dream__primary" to="/editor-lite">Start drawing <ArrowRight aria-hidden="true" size={18} /></Link>
            <Link className="vish-dream__secondary" to="/3d-room">Explore a 3D room</Link>
          </div>
          <p className="vish-dream__note">Opening a workspace will not delete or overwrite a saved project.</p>
        </div>
        <DreamPlan />
      </div>
      <div className="vish-dream__steps-header">
        <div><p className="vish-dream__eyebrow">ONE EASY STEP AT A TIME</p><h3>Your five-step journey</h3></div>
        <span>SKETCH → 3D → WALK → SAVE</span>
      </div>
      <ol className="vish-dream__steps">
        {journey.map(({ step, title, detail, to, cta, Icon }) => {
          const card = <><span className="vish-dream__step-top"><b>{step}</b><Icon size={23} aria-hidden="true" /></span><strong>{title}</strong><span className="vish-dream__detail">{detail}</span><small>{cta}<ArrowRight size={14} aria-hidden="true" /></small></>;
          return <li key={step}>{to.startsWith('#')
            ? <a className="vish-dream__step" href={to} aria-label={cta}>{card}</a>
            : <Link className="vish-dream__step" to={to} aria-label={cta}>{card}</Link>}</li>;
        })}
      </ol>
      <p className="vish-dream__truth">This guides you to existing tools. Accurate 3D walkthroughs, save/reopen and physical-device operation still need real testing.</p>
    </section>
  );
}
