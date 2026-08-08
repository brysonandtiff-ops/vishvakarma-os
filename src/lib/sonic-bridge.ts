/**
 * SonicBridge: Web Audio API integration for Vishvakarma.OS
 * Provides subtle, high-quality audio feedback for key interactions.
 */

class SonicBridge {
    private ctx: AudioContext | null = null;
    private isInitialized = false;

    private init() {
        if (typeof window === 'undefined') return;
        if (!this.ctx) {
            const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
            if (AudioContextClass) {
                this.ctx = new AudioContextClass();
                this.isInitialized = true;
            }
        }
        if (this.ctx && this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
    }

    /**
     * Plays a very subtle 432Hz sine wave with a short decay.
     * Perfect for button clicks and primary interactions.
     */
    public play432HzResonance(volume = 0.05) {
        this.init();
        if (!this.ctx || !this.isInitialized) return;

        try {
            const oscillator = this.ctx.createOscillator();
            const gainNode = this.ctx.createGain();

            oscillator.type = 'sine';
            oscillator.frequency.setValueAtTime(432, this.ctx.currentTime); // The Vishvakarma resonance

            gainNode.gain.setValueAtTime(0, this.ctx.currentTime);
            gainNode.gain.linearRampToValueAtTime(volume, this.ctx.currentTime + 0.01);
            gainNode.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.15);

            oscillator.connect(gainNode);
            gainNode.connect(this.ctx.destination);

            oscillator.start(this.ctx.currentTime);
            oscillator.stop(this.ctx.currentTime + 0.15);
        } catch (e) {
            console.warn('SonicBridge: Failed to play resonance', e);
        }
    }

    /**
     * Plays a crisp, slightly higher frequency 'snap' sound.
     * Perfect for geometric snapping and tool completion.
     */
    public playSnap(volume = 0.08) {
        this.init();
        if (!this.ctx || !this.isInitialized) return;

        try {
            const oscillator = this.ctx.createOscillator();
            const gainNode = this.ctx.createGain();

            oscillator.type = 'triangle';
            oscillator.frequency.setValueAtTime(864, this.ctx.currentTime); // Octave above 432Hz
            oscillator.frequency.exponentialRampToValueAtTime(432, this.ctx.currentTime + 0.05);

            gainNode.gain.setValueAtTime(0, this.ctx.currentTime);
            gainNode.gain.linearRampToValueAtTime(volume, this.ctx.currentTime + 0.01);
            gainNode.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.1);

            oscillator.connect(gainNode);
            gainNode.connect(this.ctx.destination);

            oscillator.start(this.ctx.currentTime);
            oscillator.stop(this.ctx.currentTime + 0.1);
        } catch (e) {
            console.warn('SonicBridge: Failed to play snap', e);
        }
    }
}

export const sonicBridge = new SonicBridge();
