import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Film, Pause, Play, RotateCcw, Volume2, VolumeX, X } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useNarrationVoices } from '@/voice-tour/useNarrationVoices';
import { createNarrationUtterance, NARRATION_VOICE_SAMPLE } from '@/voice-tour/voiceQuality';
import { isCoOwnerEmail } from '@/config/coOwners';
import { OFFICIAL_LOGO_SRC } from '@/brand/officialLogo';
import { WORLD_RECORD_HONESTY_DISCLAIMER } from '@/governance/records/worldRecordRegistry';
import './PrivateWelcomeCinematic.css';

export const PRIVATE_WELCOME_EVENT = 'vish:replay-private-welcome';
export const WELCOME_STORAGE_PREFIX = 'vish-private-welcome-v1:';

type WelcomeScene = {
  key: string;
  title: string;
  kicker: string;
  caption: string;
  narration: string;
  path: string;
  action: string;
  visual?: string;
  visualLabel?: string;
};

export const PRIVATE_WELCOME_SCENES: readonly WelcomeScene[] = [
  { key:'start', title:'Welcome to your dream home studio',
    kicker:'A SPECIAL GIFT · VISHVAKARMA.OS',
    caption:'A place to turn a simple drawing into a home you can explore.',
    narration:'Welcome to Vishvakarma dot O S. This is your own place to imagine a home. Begin with a simple sketch, build a visual preview and explore at your own pace. Everything you see here is based on the original Vishvakarma artwork and real application source.',
    path:'/projects', action:'Open Projects' },
  { key:'projects', title:'Every home begins with a project',
    kicker:'CHAPTER 01 · YOUR PROJECTS',
    caption:'Start a new home, use a sample or reopen a saved project. Your original designs remain yours.',
    narration:'Open Projects to start a new design. You can try an example house or return to a project that you have already saved. You are in control of what you change.',
    path:'/projects', action:'Explore projects',
    visual:'/marketing/product-2d.webp', visualLabel:'Marketing illustration — not live project data' },
  { key:'plan', title:'Draw walls, doors and windows',
    kicker:'CHAPTER 02 · 2D BLUEPRINT',
    caption:'The Lite Editor has wall, door, window, grid, snap, undo and export tools.',
    narration:'Draw a wall on the cream drafting canvas. Choose doors and windows from the tool rail. Zoom, use the grid, undo a change or export a copy of the plan.',
    path:'/editor-lite', action:'Open the blueprint editor',
    visual:'/marketing/product-2d.webp', visualLabel:'Illustrative product image — not runtime proof' },
  { key:'3d', title:'See the design in three dimensions',
    kicker:'CHAPTER 03 · YOUR 3D HOME',
    caption:'The 3D Room can display a local draft or a sample house. Exact geometric accuracy still needs testing.',
    narration:'The 3D Room gives you a different view of the plan. It can show a local draft or a sample if there is no draft. The full editor also has a three dimensional preview.',
    path:'/3d-room', action:'Explore the 3D room',
    visual:'/marketing/product-3d.webp', visualLabel:'Illustrative product image — not verified 3D capture' },
  { key:'walk', title:'Explore room by room',
    kicker:'CHAPTER 04 · WALK MODE',
    caption:'Choose Walk mode in the 3D Room. Touch movement is designed for iPad; real-device acceptance remains open.',
    narration:'When you are ready, choose Walk mode. The source includes an iPad directional pad and desktop keyboard controls. This is intended for exploration, but it must still be tested on your actual iPad.',
    path:'/3d-room', action:'Try Walk mode',
    visual:'/marketing/product-3d.webp', visualLabel:'Concept image — not a tested walkthrough video' },
  { key:'save', title:'Your ideas are worth keeping',
    kicker:'CHAPTER 05 · SAVE AND SHARE',
    caption:'The full editor includes save, reopen and export workflows. Cloud persistence needs real-account verification.',
    narration:'Use the full editor to save your designs, open them again or export a copy. Before relying on cloud storage, always check that the saved project actually reopens.',
    path:'/editor', action:'Open save tools' },
  { key:'governance', title:'Professional tools when you want them',
    kicker:'CHAPTER 06 · MORE THAN DRAWING',
    caption:'Specifications, design optimisation, registry, change requests, releases and audit history are part of the app.',
    narration:'Vishvakarma also contains professional tools. Spec Center explains requirements. Design Optimization compares options. Change Requests and Audit Log help trace decisions. You do not need to use these advanced rooms to enjoy drawing your first house.',
    path:'/spec-center', action:'Visit Spec Center' },
  { key:'records', title:'An ambition backed by evidence',
    kicker:'CHAPTER 07 · RECORD CANDIDATES',
    caption:'An internal June 2026 measurement listed 12 metric gates and 19 total gates. This is a self-verified candidate, not an official Guinness record.',
    narration:'The developers have documented a proposed world record concerning the number of enforced pre-release checks in a browser-based architectural editor. The source contains an older internal measurement of twelve metric gates. Guinness World Records has not certified this claim, and the application and independent evidence review remain outstanding.',
    path:'/world-records', action:'Read the record evidence' },
  { key:'finish', title:'Your journey starts with one sketch',
    kicker:'ENJOY YOUR CREATIVE HOME',
    caption:'Take your time. Start with Projects or open the full existing voice-guided walkthrough any time.',
    narration:'Your dream home begins with one simple line. Explore at your own pace, use the built in help, and enjoy making something truly yours. Welcome to Vishvakarma dot O S.',
    path:'/projects', action:'Start my journey' },
];

export function isDesignatedWelcomeUser(user: {id:string;email:string} | null | undefined): boolean {
  return Boolean(user?.id && isCoOwnerEmail(user.email));
}

function completedKey(uid: string) {
  return WELCOME_STORAGE_PREFIX + uid;
}

function hasSeenWelcome(uid: string): boolean {
  try { return window.localStorage.getItem(completedKey(uid)) === '1'; }
  catch { return false; }
}

function markWelcomeSeen(uid: string) {
  try { window.localStorage.setItem(completedKey(uid), '1'); }
  catch { /* Restricted Safari storage: dismissal still works for this session. */ }
}

export function PrivateWelcomeCinematic() {
  const { user, profile, loading } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [sceneIndex, setSceneIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  // Audio starts only after a user taps Play; supported iPads start in spoken mode.
  const [voice, setVoice] = useState(() => typeof window !== 'undefined' &&
    'speechSynthesis' in window && 'SpeechSynthesisUtterance' in window);
  const { voices, settings, updateSettings } = useNarrationVoices();
  const lastShown = useRef<string | null>(null);
  const eligible = !loading && isDesignatedWelcomeUser(user);

  useEffect(() => {
    if (!eligible || !user || location.pathname === '/auth' || lastShown.current === user.id) return;
    lastShown.current = user.id;
    if (!hasSeenWelcome(user.id)) {
      setSceneIndex(0);
      setOpen(true);
    }
  }, [eligible, user?.id, location.pathname]);

  useEffect(() => {
    const replay = () => {
      if (!eligible) return;
      setSceneIndex(0);
      setOpen(true);
      setPlaying(false);
    };
    window.addEventListener(PRIVATE_WELCOME_EVENT, replay);
    return () => window.removeEventListener(PRIVATE_WELCOME_EVENT, replay);
  }, [eligible]);

  const stopVoice = useCallback(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) window.speechSynthesis.cancel();
  }, []);

  const close = useCallback(() => {
    setPlaying(false);
    stopVoice();
    if (user?.id) markWelcomeSeen(user.id);
    setOpen(false);
  }, [stopVoice, user?.id]);

  const next = useCallback(() => {
    stopVoice();
    setSceneIndex((index) => Math.min(index + 1, PRIVATE_WELCOME_SCENES.length - 1));
  }, [stopVoice]);
  const previous = useCallback(() => {
    stopVoice();
    setSceneIndex((index) => Math.max(0, index - 1));
  }, [stopVoice]);

  useEffect(() => {
    if (!open || !playing) return undefined;
    if (voice && 'speechSynthesis' in window && 'SpeechSynthesisUtterance' in window) {
      const utterance = createNarrationUtterance(PRIVATE_WELCOME_SCENES[sceneIndex].narration, voices, settings);
      utterance.onend = () => {
        if (sceneIndex === PRIVATE_WELCOME_SCENES.length - 1) setPlaying(false);
        else setSceneIndex((index) => Math.min(index + 1, PRIVATE_WELCOME_SCENES.length - 1));
      };
      window.speechSynthesis.speak(utterance);
      return () => { utterance.onend = null; window.speechSynthesis.cancel(); };
    }
    const timer = window.setTimeout(() => {
      if (sceneIndex === PRIVATE_WELCOME_SCENES.length - 1) setPlaying(false);
      else setSceneIndex((index) => Math.min(index + 1, PRIVATE_WELCOME_SCENES.length - 1));
    }, 9500);
    return () => window.clearTimeout(timer);
  }, [open, playing, sceneIndex, voice, voices, settings]);

  useEffect(() => {
    if (!open) return undefined;
    const onEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') close();
    };
    window.addEventListener('keydown', onEscape);
    return () => window.removeEventListener('keydown', onEscape);
  }, [close, open]);

  const previewVoice = () => {
    stopVoice();
    setPlaying(false);
    if (!('speechSynthesis' in window) || !('SpeechSynthesisUtterance' in window)) return;
    const utterance = createNarrationUtterance(NARRATION_VOICE_SAMPLE, voices, settings);
    window.speechSynthesis.speak(utterance);
  };

  if (!eligible || !user || !open) return null;
  const scene = PRIVATE_WELCOME_SCENES[sceneIndex];
  const last = sceneIndex === PRIVATE_WELCOME_SCENES.length - 1;

  return (
    <div className="vish-private-film-backdrop" role="presentation">
      <section className="vish-private-film" role="dialog" aria-modal="true" aria-labelledby="vish-welcome-title" data-testid="vish-private-welcome">
        <div className="vish-private-film__top">
          <span><Film size={16} aria-hidden="true" /> A PRIVATE INTRODUCTION · VISHVAKARMA.OS</span>
          <button type="button" className="vish-private-film__icon" onClick={close} aria-label="Skip and close welcome"><X size={20} /></button>
        </div>
        <div className="vish-private-film__stage" key={scene.key}>
          <div className="vish-private-film__brand">
            <img src={OFFICIAL_LOGO_SRC} alt="Vishvakarma.OS original swan/V emblem" />
          </div>
          <div className="vish-private-film__content" aria-live="polite">
            <p className="vish-private-film__kicker">{scene.kicker}</p>
            <h2 id="vish-welcome-title">{scene.title}</h2>
            <p className="vish-private-film__caption">{scene.caption}</p>
            {scene.key === 'records' && <p className="vish-private-film__proof">{WORLD_RECORD_HONESTY_DISCLAIMER}</p>}
            {scene.key === 'start' && (
              <p className="vish-private-film__proof">
                {profile?.role === 'admin'
                  ? 'Your database profile reports administrator access. Security and permission testing are still required.'
                  : 'Administrator access has not been confirmed for this account yet.'}
              </p>
            )}
          </div>
          {scene.visual && (
            <figure className="vish-private-film__visual">
              <img src={scene.visual} alt="" aria-hidden="true" />
              <figcaption>{scene.visualLabel}</figcaption>
            </figure>
          )}
        </div>
        <div className="vish-private-film__progress" aria-label="Welcome progress">
          {PRIVATE_WELCOME_SCENES.map((item, index) => (
            <button key={item.key} type="button" aria-label={'Go to chapter ' + (index+1) + ': ' + item.title}
              aria-current={index === sceneIndex ? 'step' : undefined}
              className={index === sceneIndex ? 'is-active' : ''}
              onClick={() => { stopVoice(); setSceneIndex(index); }}>
              <span />
            </button>
          ))}
        </div>
        <div className="vish-private-film__voice-controls" aria-label="Narrator voice settings">
          <label htmlFor="vish-welcome-voice">Narrator voice
            <select id="vish-welcome-voice" value={settings.voiceURI}
              onChange={(event) => { stopVoice(); setPlaying(false); updateSettings({ voiceURI: event.target.value }); }}>
              <option value="">Automatic — prefer Australian English</option>
              {voices.map((item) => <option key={item.voiceURI} value={item.voiceURI}>{item.name} · {item.lang}</option>)}
            </select>
          </label>
          <label htmlFor="vish-welcome-pace">Speaking pace
            <select id="vish-welcome-pace" value={settings.rate}
              onChange={(event) => { stopVoice(); setPlaying(false); updateSettings({ rate: Number(event.target.value) }); }}>
              <option value="0.9">Relaxed</option><option value="0.98">Natural</option><option value="1.08">Brisk</option>
            </select>
          </label>
          <button type="button" onClick={previewVoice} disabled={!('speechSynthesis' in window)}
            aria-label="Hear a sample of the selected narrator">Hear voice sample</button>
          <p>Voice quality depends on voices installed on this iPad. No artificial pitch effect or paid AI voice is used.</p>
        </div>
        <div className="vish-private-film__actions">
          <button type="button" className="vish-private-film__control" onClick={previous} disabled={sceneIndex === 0}>
            <ArrowLeft size={16} /> Back
          </button>
          <button type="button" className="vish-private-film__control" aria-pressed={playing}
            onClick={() => { if(playing) stopVoice(); setPlaying(!playing); }}>
            {playing ? <Pause size={16} /> : <Play size={16} />} {playing ? 'Pause film' : voice ? 'Play narrated film' : 'Play with captions'}
          </button>
          <button type="button" className="vish-private-film__control" aria-pressed={voice}
            onClick={() => { stopVoice(); setVoice(!voice); }}>
            {voice ? <Volume2 size={16} /> : <VolumeX size={16} />} {voice ? 'Voice on' : 'Captions only'}
          </button>
          {last ? (
            <button type="button" className="vish-private-film__primary" onClick={() => { close(); navigate(scene.path); }}>
              {scene.action} <ArrowRight size={17} />
            </button>
          ) : (
            <button type="button" className="vish-private-film__primary" onClick={next}>
              Next chapter <ArrowRight size={17} />
            </button>
          )}
        </div>
        <div className="vish-private-film__footer">
          <span>{sceneIndex + 1} of {PRIVATE_WELCOME_SCENES.length} · <span className="sr-only">Film chapter</span>Illustrated guided tour, not a live screen recording</span>
          <div>
            <button type="button" onClick={() => { stopVoice(); setSceneIndex(0); setPlaying(false); }}><RotateCcw size={14} /> Replay</button>
            <Link to={scene.path} onClick={close}>{scene.action}</Link>
            <button type="button" onClick={close}>Skip film</button>
          </div>
        </div>
      </section>
    </div>
  );
}
