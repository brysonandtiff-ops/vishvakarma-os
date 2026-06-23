import { useEffect, useState } from 'react';
import { getSharedAudioNodes } from '@/modules/studio-audio/audioEngine';

function playSolfeggioBell() {
  const nodes = getSharedAudioNodes();
  if (!nodes) return;
  const { ctx, masterGain } = nodes;

  if (ctx.state === 'suspended') {
    void ctx.resume();
  }

  const now = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = 'sine';
  osc.frequency.setValueAtTime(528, now); // 528Hz Solfeggio frequency

  const overtone = ctx.createOscillator();
  overtone.type = 'sine';
  overtone.frequency.setValueAtTime(792, now); // 528 * 1.5 perfect fifth

  const overtoneGain = ctx.createGain();
  overtoneGain.gain.setValueAtTime(0.04, now);

  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(0.28, now + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 2.5);

  osc.connect(gain);
  overtone.connect(overtoneGain);
  overtoneGain.connect(gain);
  gain.connect(masterGain);

  osc.start(now);
  overtone.start(now);

  osc.stop(now + 2.6);
  overtone.stop(now + 2.6);
}

export default function ShunyaOverlay({ onClose }: { onClose: () => void }) {
  const [phase, setPhase] = useState<'in' | 'out'>('in');

  useEffect(() => {
    // Play Solfeggio bell
    playSolfeggioBell();

    // 1.5s for inhale
    const timer1 = setTimeout(() => {
      setPhase('out');
    }, 1500);

    // 3s total for overlay
    const timer2 = setTimeout(() => {
      onClose();
    }, 3000);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, [onClose]);

  return (
    <div 
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-[#050507]/90 backdrop-blur-[40px] transition-opacity duration-300"
      data-testid="shunya-overlay"
    >
      <div className="text-center space-y-8">
        <h2 className="text-xl font-bold uppercase tracking-[0.2em] text-[#D4AF37]">Shunya Reset</h2>
        <div className="relative flex items-center justify-center w-64 h-64 mx-auto">
          {/* Animated breathing circle */}
          <div 
            className={`rounded-full bg-gradient-to-r from-[#D4AF37]/25 to-[#F5D76A]/10 border border-[#D4AF37]/40 shadow-[0_0_30px_rgba(212,175,55,0.15)] transition-all duration-[1400ms] ease-in-out flex items-center justify-center ${
              phase === 'in' ? 'w-48 h-48' : 'w-24 h-24'
            }`}
          >
            <span className="text-[11px] font-semibold tracking-wider text-white uppercase select-none">
              {phase === 'in' ? 'Inhale' : 'Exhale'}
            </span>
          </div>
        </div>
        <p className="text-[10px] text-pretty text-[#B0B0B0] max-w-xs mx-auto uppercase tracking-widest leading-relaxed">
          Resetting Focus · Aligning Prana
        </p>
      </div>
    </div>
  );
}
