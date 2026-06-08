import { useState } from 'react';
import { useNavigate } from 'react-router';
import { Play } from 'lucide-react';
import { toast } from 'sonner';
import PageMeta from '@/components/common/PageMeta';
import { MarketingLayout } from '@/components/layouts/MarketingLayout';

const VIDEO_GUIDES = [
  { title: 'Your First Floor Plan', duration: '12 min', editorHint: 'Start with Wall (W) and sample project' },
  { title: 'Sacred 3D View Walkthrough', duration: '18 min', editorHint: 'Press 3 or tap the 3D toggle' },
  { title: 'Export Package (JSON, PNG, PDF, DXF)', duration: '8 min', editorHint: 'Open Export from the editor menu' },
  { title: 'Cloud Save & Local Draft', duration: '6 min', editorHint: 'Save badge shows cloud vs local draft' },
  { title: 'Vastu Harmony Overview', duration: '10 min', editorHint: 'Switch to Draft mode and select Vastu tool' },
  { title: 'MEP & Routing Analysis', duration: '15 min', editorHint: 'Switch to MEP workspace mode' },
] as const;

const FEATURE_MODULES = [
  { name: '2D Drafting', ready: true },
  { name: 'Sacred 3D View', ready: true },
  { name: 'Export Package', ready: true },
  { name: 'Cloud Save', ready: true },
  { name: 'Local Draft', ready: true },
  { name: 'Vastu Harmony', ready: true },
  { name: 'MEP Routing', ready: true },
  { name: 'Collaboration', ready: false, preview: true },
  { name: 'Templates', ready: true },
  { name: 'Apple Pencil Support', ready: true },
] as const;

export default function FeaturesPage() {
  const [tab, setTab] = useState<'guides' | 'features'>('guides');
  const navigate = useNavigate();

  const openGuideInEditor = (title: string, hint: string) => {
    toast.message(title, { description: `${hint} — opening the editor.` });
    navigate('/editor');
  };

  return (
    <MarketingLayout>
      <PageMeta title="Features & Guides" description="Learn Vishvakarma.OS with interactive guides and feature reference." />
      <section className="mx-auto max-w-6xl px-4 py-12 md:px-8">
        <h1 className="text-3xl font-bold text-stone-50 md:text-4xl">
          Feature guides &amp; Project Proof reference
        </h1>
        <p className="mt-3 text-stone-400">Interactive walkthroughs open the editor — full video library coming soon</p>
        <div className="mt-8 grid gap-4 sm:grid-cols-4">
          {[
            { v: '10', l: 'categories' },
            { v: '49', l: 'features' },
            { v: '6', l: 'interactive guides' },
            { v: 'v6.0', l: 'version' },
          ].map((s) => (
            <div key={s.l} className="vish-stat-pill text-center">
              <p className="text-xl font-bold text-primary">{s.v}</p>
              <p className="text-[0.65rem] uppercase tracking-[0.18em] text-stone-500">{s.l}</p>
            </div>
          ))}
        </div>
        <div className="vish-features-toggle mt-10 flex gap-2">
          <button
            type="button"
            data-active={tab === 'guides'}
            onClick={() => setTab('guides')}
            className="rounded-lg border border-stone-700 px-4 py-2 text-xs font-bold uppercase tracking-[0.16em] text-stone-300"
          >
            Interactive Guides
          </button>
          <button
            type="button"
            data-active={tab === 'features'}
            onClick={() => setTab('features')}
            className="rounded-lg border border-stone-700 px-4 py-2 text-xs font-bold uppercase tracking-[0.16em] text-stone-300"
          >
            All Features
          </button>
        </div>
        {tab === 'guides' ? (
          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {VIDEO_GUIDES.map((g) => (
              <article key={g.title} className="vish-video-card">
                <button
                  type="button"
                  className="block w-full text-left"
                  onClick={() => openGuideInEditor(g.title, g.editorHint)}
                  aria-label={`Open interactive guide: ${g.title}`}
                >
                <div className="vish-video-thumb">
                  <span className="vish-play-glow">
                    <Play className="h-5 w-5 fill-current" />
                  </span>
                </div>
                <div className="p-4">
                  <h3 className="font-semibold text-stone-100">{g.title}</h3>
                  <p className="mt-1 text-xs text-stone-500">{g.duration}</p>
                  <span className="mt-2 inline-block rounded-full border border-primary/30 px-2 py-0.5 text-[10px] uppercase tracking-wider text-primary/80">
                    Interactive guide
                  </span>
                </div>
                </button>
              </article>
            ))}
          </div>
        ) : (
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURE_MODULES.map((mod) => (
              <div key={mod.name} className="vish-feature-grid-card">
                <h3 className="text-sm font-bold uppercase tracking-[0.14em] text-primary">{mod.name}</h3>
                <p className="mt-2 text-xs text-stone-500">
                  {mod.ready
                    ? 'Available now in editor.'
                    : 'preview' in mod && mod.preview
                      ? 'Preview — full collaboration ships in v1.2.'
                      : 'Planned — remote collaboration in a future release.'}
                </p>
              </div>
            ))}
          </div>
        )}
      </section>
    </MarketingLayout>
  );
}
