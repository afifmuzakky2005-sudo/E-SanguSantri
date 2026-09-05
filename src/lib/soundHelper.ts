/**
 * soundHelper.ts
 * Utility to play offline, synthesized sound effects using the Web Audio API.
 * Prevents third-party asset loading errors or network delays.
 */

// Play distinct deposit (Setor) chime sound (joyful ascending bell arpeggio)
export const playSetorSound = () => {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;

    const ctx = new AudioContextClass();
    const now = ctx.currentTime;

    // Upward joyful deposit arpeggio: C5, E5, G5, C6
    const notes = [523.25, 659.25, 783.99, 1046.50];
    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle'; // Sweet bell tone
      osc.frequency.setValueAtTime(freq, now + idx * 0.07);

      gain.gain.setValueAtTime(0, now + idx * 0.07);
      gain.gain.linearRampToValueAtTime(0.2, now + idx * 0.07 + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.07 + 0.35);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now + idx * 0.07);
      osc.stop(now + idx * 0.07 + 0.35);
    });
  } catch (e) {
    console.warn("Setor sound failed to play:", e);
  }
};

// Play distinct withdrawal (Tarik) cash payout sound (crisp cash register payout chime)
export const playTarikSound = () => {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;

    const ctx = new AudioContextClass();
    const now = ctx.currentTime;

    // Crisp cash-out payout tone: E5 -> A5 -> E6
    const notes = [
      { freq: 659.25, time: 0, duration: 0.15 },
      { freq: 880.00, time: 0.08, duration: 0.18 },
      { freq: 1318.51, time: 0.16, duration: 0.35 },
    ];

    notes.forEach(({ freq, time, duration }) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + time);

      gain.gain.setValueAtTime(0, now + time);
      gain.gain.linearRampToValueAtTime(0.22, now + time + 0.012);
      gain.gain.exponentialRampToValueAtTime(0.001, now + time + duration);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now + time);
      osc.stop(now + time + duration);
    });

    // Add a subtle low warmth bass pulse (A3 - 220Hz)
    const subOsc = ctx.createOscillator();
    const subGain = ctx.createGain();
    subOsc.type = 'sine';
    subOsc.frequency.setValueAtTime(220, now);
    subGain.gain.setValueAtTime(0.12, now);
    subGain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);
    subOsc.connect(subGain);
    subGain.connect(ctx.destination);
    subOsc.start(now);
    subOsc.stop(now + 0.28);
  } catch (e) {
    console.warn("Tarik sound failed to play:", e);
  }
};

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
