import { describe, expect, it, vi, afterEach } from 'vitest';
import {
  availableEnglishVoices, clampNarrationRate, createNarrationUtterance,
  rankNarrationVoice, selectNarrationVoice, spokenNarrationText,
} from '@/voice-tour/voiceQuality';

const voices = [
  {name:'eSpeak English',lang:'en-US',voiceURI:'robot',localService:true},
  {name:'Karen',lang:'en-AU',voiceURI:'australian',localService:true},
  {name:'Enhanced Samantha',lang:'en-US',voiceURI:'enhanced',localService:true},
  {name:'Sophie',lang:'fr-FR',voiceURI:'french',localService:true},
];
afterEach(() => vi.unstubAllGlobals());

describe('S.I.R.E. native voice quality', () => {
  it('prefers an Australian voice rather than known robotic engines', () => {
    expect(selectNarrationVoice(voices)?.voiceURI).toBe('australian');
    expect(rankNarrationVoice(voices[0])).toBeLessThan(0);
  });
  it('honours an explicitly selected English voice and rejects non-English', () => {
    expect(selectNarrationVoice(voices,'enhanced')?.voiceURI).toBe('enhanced');
    expect(selectNarrationVoice(voices,'french')?.voiceURI).toBe('australian');
    expect(availableEnglishVoices(voices)).toHaveLength(3);
    expect(selectNarrationVoice([])).toBeNull();
  });
  it('uses gentle speaking speeds, not exaggerated pitch', () => {
    expect(clampNarrationRate(-2)).toBe(0.86);
    expect(clampNarrationRate(3)).toBe(1.12);
    expect(clampNarrationRate(Number.NaN)).toBe(0.98);
  });
  it('speaks common app vocabulary without broken technical abbreviations', () => {
    expect(spokenNarrationText('Vishvakarma.OS has 2D and 3D rooms.'))
      .toContain('Vishvakarma O S has two D and three D rooms.');
  });
  it('configures iPad browser narration from real installed voices', () => {
    class MockUtterance {
      text: string; lang=''; rate=0; pitch=0; volume=0;
      voice: unknown=null;
      constructor(text:string) {this.text=text;}
    }
    vi.stubGlobal('SpeechSynthesisUtterance',MockUtterance);
    const u=createNarrationUtterance('Vishvakarma.OS',voices as unknown as SpeechSynthesisVoice[],{voiceURI:'australian',rate:0.98});
    expect(u.voice?.voiceURI).toBe('australian');
    expect(u.lang).toBe('en-AU');
    expect(u.pitch).toBe(1);
    expect(u.rate).toBe(0.98);
  });
});
