/**
 * soundHelper.ts
 * Utility to play offline, synthesized beep sound effects using the Web Audio API.
 * Prevents third-party asset loading errors or network delays.
 */

// Play a high-pitched double beep to indicate success
export const playSuccessSound = () => {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    
    const ctx = new AudioContextClass();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    osc.type = 'sine';
    osc.frequency.setValueAtTime(880, ctx.currentTime); // A5 (High pitch)
    gain.gain.setValueAtTime(0.08, ctx.currentTime);
    
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.08);
    
    // Play second beep shortly after
    setTimeout(() => {
      try {
        const ctx2 = new AudioContextClass();
        const osc2 = ctx2.createOscillator();
        const gain2 = ctx2.createGain();
        
        osc2.connect(gain2);
        gain2.connect(ctx2.destination);
        
        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(1200, ctx2.currentTime); // Higher D6 pitch
        gain2.gain.setValueAtTime(0.08, ctx2.currentTime);
        
        osc2.start(ctx2.currentTime);
        osc2.stop(ctx2.currentTime + 0.12);
      } catch (e) {
        console.warn("Subsequent audio failed to play:", e);
      }
    }, 100);
  } catch (e) {
    console.warn("AudioContext success sound failed to play:", e);
  }
};

// Play a lower, slightly distorted beep to indicate failure / error
export const playErrorSound = () => {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    
    const ctx = new AudioContextClass();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    osc.type = 'sawtooth'; // Buzz sound
    osc.frequency.setValueAtTime(180, ctx.currentTime); // Low pitch G3
    osc.frequency.exponentialRampToValueAtTime(80, ctx.currentTime + 0.25); // Slur down
    
    gain.gain.setValueAtTime(0.12, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.01, ctx.currentTime + 0.25);
    
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.25);
  } catch (e) {
    console.warn("AudioContext error sound failed to play:", e);
  }
};
