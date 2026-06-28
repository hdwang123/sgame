class SoundFX {
  constructor() {
    this.context = null;
    this.pendingSounds = [];

    // Mobile browsers only allow Web Audio to start during a user gesture.
    // Capture the gesture before game controls consume it, and unlock again
    // after returning from the background if the browser suspended audio.
    const unlock = () => this.unlock().then((context) => {
      if (context?.state === 'running') this.flushPendingSounds();
    });
    globalThis.addEventListener?.('pointerdown', unlock, { capture: true, passive: true });
    globalThis.addEventListener?.('touchstart', unlock, { capture: true, passive: true });
    globalThis.addEventListener?.('touchend', unlock, { capture: true, passive: true });
    globalThis.addEventListener?.('click', unlock, { capture: true, passive: true });
    globalThis.addEventListener?.('keydown', unlock, { capture: true });
  }

  getContext() {
    const AudioContext = globalThis.AudioContext || globalThis.webkitAudioContext;
    if (!AudioContext) return null;
    if (this.context?.state === 'closed') this.context = null;
    if (!this.context) this.context = new AudioContext();
    return this.context;
  }

  unlock() {
    const context = this.getContext();
    if (!context || context.state === 'running') return Promise.resolve(context);
    // Start a silent node synchronously inside every gesture. Do not reuse a
    // pending resume Promise: some WebViews leave the first one unresolved but
    // allow a later user gesture to unlock audio immediately.
    try {
      const buffer = context.createBuffer(1, 1, context.sampleRate);
      const source = context.createBufferSource();
      source.buffer = buffer;
      source.connect(context.destination);
      source.start(0);
    } catch {
      // resume() below is still sufficient on browsers without this quirk.
    }
    try {
      return Promise.resolve(context.resume()).then(() => context).catch(() => null);
    } catch {
      return Promise.resolve(null);
    }
  }

  flushPendingSounds() {
    if (this.context?.state !== 'running' || this.pendingSounds.length === 0) return;
    const sounds = this.pendingSounds.splice(0);
    sounds.forEach((name) => this.play(name));
  }

  tone(frequency, duration = 0.08, { type = 'square', volume = 0.035, endFrequency = frequency } = {}) {
    const context = this.getContext();
    if (!context) return;
    const now = context.currentTime;
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, now);
    oscillator.frequency.exponentialRampToValueAtTime(Math.max(30, endFrequency), now + duration);
    gain.gain.setValueAtTime(volume, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
    oscillator.connect(gain).connect(context.destination);
    oscillator.start(now);
    oscillator.stop(now + duration);
  }

  noise(duration = 0.15, volume = 0.04) {
    const context = this.getContext();
    if (!context) return;
    const length = Math.floor(context.sampleRate * duration);
    const buffer = context.createBuffer(1, length, context.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < length; i += 1) data[i] = (Math.random() * 2 - 1) * (1 - i / length);
    const source = context.createBufferSource();
    const gain = context.createGain();
    source.buffer = buffer;
    gain.gain.setValueAtTime(volume, context.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + duration);
    source.connect(gain).connect(context.destination);
    source.start();
  }

  play(name) {
    const context = this.getContext();
    if (!context) return;
    if (context.state !== 'running') {
      if (!this.pendingSounds.includes(name)) {
        this.pendingSounds.push(name);
        if (this.pendingSounds.length > 4) this.pendingSounds.shift();
      }
      this.unlock().then((unlockedContext) => {
        if (unlockedContext?.state === 'running') this.flushPendingSounds();
      });
      return;
    }
    const sounds = {
      move: () => this.tone(150, 0.035, { volume: 0.015, endFrequency: 170 }),
      rotate: () => this.tone(260, 0.07, { volume: 0.025, endFrequency: 420 }),
      drop: () => this.tone(105, 0.09, { volume: 0.04, endFrequency: 58 }),
      line: () => [420, 560, 760].forEach((frequency, index) => setTimeout(() => this.tone(frequency, 0.09, { type: 'triangle', volume: 0.04 }), index * 55)),
      eat: () => this.tone(620, 0.09, { type: 'sine', volume: 0.04, endFrequency: 920 }),
      jump: () => this.tone(240, 0.14, { type: 'square', volume: 0.025, endFrequency: 520 }),
      coin: () => [880, 1320].forEach((frequency, index) => setTimeout(() => this.tone(frequency, 0.08, { type: 'sine', volume: 0.04 }), index * 65)),
      stomp: () => this.tone(180, 0.1, { volume: 0.04, endFrequency: 80 }),
      shoot: () => { this.tone(210, 0.07, { volume: 0.035, endFrequency: 80 }); this.noise(0.055, 0.018); },
      explosion: () => { this.noise(0.24, 0.07); this.tone(95, 0.22, { type: 'sawtooth', volume: 0.04, endFrequency: 38 }); },
      hurt: () => this.tone(190, 0.18, { type: 'sawtooth', volume: 0.04, endFrequency: 70 }),
      win: () => [392, 523, 659, 784].forEach((frequency, index) => setTimeout(() => this.tone(frequency, 0.13, { type: 'triangle', volume: 0.04 }), index * 100)),
      lose: () => [260, 190, 120].forEach((frequency, index) => setTimeout(() => this.tone(frequency, 0.17, { type: 'sawtooth', volume: 0.035 }), index * 120)),
    };
    sounds[name]?.();
  }
}

export const soundFX = new SoundFX();
