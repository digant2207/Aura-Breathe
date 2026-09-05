/**
 * Procedural Web Audio Engine for Aura Breathe
 * Provides calm ambient soundscapes, binaural beats, and resonant phase transition bells.
 */

class AudioEngine {
  private ctx: AudioContext | null = null;
  private ambientGain: GainNode | null = null;
  private bellGain: GainNode | null = null;
  private activeOscillators: (OscillatorNode | AudioBufferSourceNode)[] = [];
  private activeIntervals: number[] = [];
  private currentTrackType: string | null = null;
  private isPlaying: boolean = false;
  private masterVolume: number = 0.75;
  private isMuted: boolean = false;

  private initContext() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();

      this.ambientGain = this.ctx.createGain();
      this.ambientGain.gain.setValueAtTime(this.isMuted ? 0 : this.masterVolume * 0.4, this.ctx.currentTime);
      this.ambientGain.connect(this.ctx.destination);

      this.bellGain = this.ctx.createGain();
      this.bellGain.gain.setValueAtTime(this.isMuted ? 0 : this.masterVolume * 0.5, this.ctx.currentTime);
      this.bellGain.connect(this.ctx.destination);
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public setVolume(volume: number) {
    this.masterVolume = Math.max(0, Math.min(1, volume));
    if (this.ctx && this.ambientGain && this.bellGain && !this.isMuted) {
      this.ambientGain.gain.setTargetAtTime(this.masterVolume * 0.4, this.ctx.currentTime, 0.1);
      this.bellGain.gain.setTargetAtTime(this.masterVolume * 0.5, this.ctx.currentTime, 0.1);
    }
  }

  public toggleMute(): boolean {
    this.isMuted = !this.isMuted;
    if (this.ctx && this.ambientGain && this.bellGain) {
      const targetGain = this.isMuted ? 0 : this.masterVolume;
      this.ambientGain.gain.setTargetAtTime(targetGain * 0.4, this.ctx.currentTime, 0.1);
      this.bellGain.gain.setTargetAtTime(targetGain * 0.5, this.ctx.currentTime, 0.1);
    }
    return this.isMuted;
  }

  public playTrack(trackType: string) {
    this.initContext();
    if (!this.ctx || !this.ambientGain) return;

    // Stop current ambient sound
    this.stopAmbient();

    const normalized = (trackType || '').toLowerCase();
    let resolvedType: 'rain' | 'theta' | 'singing-bowl' | 'aurora' | 'fire' | 'stream' = 'stream';

    if (normalized.includes('stream') || normalized.includes('glacial')) {
      resolvedType = 'stream';
    } else if (normalized.includes('rain')) {
      resolvedType = 'rain';
    } else if (normalized.includes('theta') || normalized.includes('arctic') || normalized.includes('binaural')) {
      resolvedType = 'theta';
    } else if (normalized.includes('aurora') || normalized.includes('northern') || normalized.includes('chimes')) {
      resolvedType = 'aurora';
    } else if (normalized.includes('fire') || normalized.includes('cedar') || normalized.includes('wood')) {
      resolvedType = 'fire';
    } else if (normalized.includes('bowl') || normalized.includes('tibetan') || normalized.includes('singing')) {
      resolvedType = 'singing-bowl';
    }

    this.currentTrackType = resolvedType;
    this.isPlaying = true;

    try {
      if (resolvedType === 'theta') {
        this.playTheta432();
      } else if (resolvedType === 'rain') {
        this.playRain();
      } else if (resolvedType === 'stream') {
        this.playStream();
      } else if (resolvedType === 'aurora') {
        this.playAuroraPad();
      } else if (resolvedType === 'fire') {
        this.playFire();
      } else {
        this.playSingingBowlDrone();
      }
    } catch {
      // Graceful fallback if Web Audio is blocked
    }
  }

  public stopAmbient() {
    this.activeOscillators.forEach((node) => {
      try {
        node.stop();
        node.disconnect();
      } catch {
        // Ignored
      }
    });
    this.activeOscillators = [];

    this.activeIntervals.forEach((id) => window.clearInterval(id));
    this.activeIntervals = [];

    this.isPlaying = false;
  }

  public toggleAmbient(trackType: string) {
    const normalized = (trackType || '').toLowerCase();
    if (this.isPlaying && this.currentTrackType && normalized.includes(this.currentTrackType)) {
      this.stopAmbient();
      return false;
    } else {
      this.playTrack(trackType);
      return true;
    }
  }

  public getIsPlaying(): boolean {
    return this.isPlaying;
  }

  public getCurrentTrack(): string | null {
    return this.currentTrackType;
  }

  // 1. Theta 432Hz Binaural Beat (432Hz Left, 438Hz Right -> 6Hz Theta Waves for deep calm)
  private playTheta432() {
    if (!this.ctx || !this.ambientGain) return;

    const merger = this.ctx.createChannelMerger(2);

    const oscL = this.ctx.createOscillator();
    oscL.type = 'sine';
    oscL.frequency.setValueAtTime(432, this.ctx.currentTime);

    const oscR = this.ctx.createOscillator();
    oscR.type = 'sine';
    oscR.frequency.setValueAtTime(437.5, this.ctx.currentTime); // 5.5Hz Theta wave

    const subOsc = this.ctx.createOscillator();
    subOsc.type = 'sine';
    subOsc.frequency.setValueAtTime(108, this.ctx.currentTime); // Sub-octave harmonic warmth

    const subGain = this.ctx.createGain();
    subGain.gain.setValueAtTime(0.2, this.ctx.currentTime);
    subOsc.connect(subGain);

    oscL.connect(merger, 0, 0);
    oscR.connect(merger, 0, 1);
    subGain.connect(merger, 0, 0);
    subGain.connect(merger, 0, 1);

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(800, this.ctx.currentTime);

    merger.connect(filter);
    filter.connect(this.ambientGain);

    oscL.start();
    oscR.start();
    subOsc.start();

    this.activeOscillators.push(oscL, oscR, subOsc);
  }

  // 2. Glacial Rain / Gentle Shower (Filtered Pink Noise with soft droplet sweeps)
  private playRain() {
    if (!this.ctx || !this.ambientGain) return;

    const bufferSize = this.ctx.sampleRate * 2;
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;

    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.99886 * b0 + white * 0.0555179;
      b1 = 0.99332 * b1 + white * 0.0750759;
      b2 = 0.96900 * b2 + white * 0.1538520;
      b3 = 0.86650 * b3 + white * 0.3104856;
      b4 = 0.55000 * b4 + white * 0.5329522;
      b5 = -0.7616 * b5 - white * 0.0168980;
      output[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.08;
      b6 = white * 0.115926;
    }

    const whiteNoise = this.ctx.createBufferSource();
    whiteNoise.buffer = noiseBuffer;
    whiteNoise.loop = true;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(1000, this.ctx.currentTime);

    const highpass = this.ctx.createBiquadFilter();
    highpass.type = 'highpass';
    highpass.frequency.setValueAtTime(250, this.ctx.currentTime);

    whiteNoise.connect(filter);
    filter.connect(highpass);
    highpass.connect(this.ambientGain);

    whiteNoise.start();
    this.activeOscillators.push(whiteNoise);
  }

  // 3. Glacial Stream (Filtered rushing stream with gentle frequency sweeps)
  private playStream() {
    if (!this.ctx || !this.ambientGain) return;

    const bufferSize = this.ctx.sampleRate * 2;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * 0.09;
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;
    noise.loop = true;

    const bandpass = this.ctx.createBiquadFilter();
    bandpass.type = 'bandpass';
    bandpass.frequency.setValueAtTime(650, this.ctx.currentTime);
    bandpass.Q.setValueAtTime(0.8, this.ctx.currentTime);

    noise.connect(bandpass);
    bandpass.connect(this.ambientGain);
    noise.start();
    this.activeOscillators.push(noise);
  }

  // 4. Aurora Chimes / Soft Synth Pad
  private playAuroraPad() {
    if (!this.ctx || !this.ambientGain) return;

    const freqs = [216, 272, 324, 432]; // Soft suspended chord
    freqs.forEach((f) => {
      if (!this.ctx || !this.ambientGain) return;
      const osc = this.ctx.createOscillator();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(f, this.ctx.currentTime);

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.08, this.ctx.currentTime);

      osc.connect(gain);
      gain.connect(this.ambientGain);
      osc.start();
      this.activeOscillators.push(osc);
    });
  }

  // 5. Fire embers
  private playFire() {
    if (!this.ctx || !this.ambientGain) return;

    const bufferSize = this.ctx.sampleRate * 2;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * 0.06;
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;
    noise.loop = true;

    const lowpass = this.ctx.createBiquadFilter();
    lowpass.type = 'lowpass';
    lowpass.frequency.setValueAtTime(320, this.ctx.currentTime);

    noise.connect(lowpass);
    lowpass.connect(this.ambientGain);
    noise.start();
    this.activeOscillators.push(noise);
  }

  // 6. Tibetan Singing Bowl Drone
  private playSingingBowlDrone() {
    if (!this.ctx || !this.ambientGain) return;

    const freqs = [216, 432, 648];
    freqs.forEach((freq, idx) => {
      if (!this.ctx || !this.ambientGain) return;
      const osc = this.ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime);

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.12 / (idx + 1), this.ctx.currentTime);

      osc.connect(gain);
      gain.connect(this.ambientGain);
      osc.start();
      this.activeOscillators.push(osc);
    });
  }

  // 1. Zen Temple Bell (Japanese bronze gong with inharmonic overtones)
  public playTempleBell() {
    this.initContext();
    if (!this.ctx || !this.bellGain || this.isMuted) return;

    const now = this.ctx.currentTime;
    const baseFreq = 264; // Deep bronze tone
    const partials = [
      { ratio: 1.0, gain: 0.35, decay: 3.5, type: 'sine' as OscillatorType },
      { ratio: 1.48, gain: 0.22, decay: 2.8, type: 'sine' as OscillatorType },
      { ratio: 2.08, gain: 0.16, decay: 2.2, type: 'triangle' as OscillatorType },
      { ratio: 2.76, gain: 0.12, decay: 1.8, type: 'sine' as OscillatorType },
      { ratio: 3.82, gain: 0.08, decay: 1.4, type: 'triangle' as OscillatorType },
    ];

    partials.forEach(({ ratio, gain: gLevel, decay, type }) => {
      if (!this.ctx || !this.bellGain) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = type;
      osc.frequency.setValueAtTime(baseFreq * ratio, now);

      const targetVol = gLevel * this.masterVolume;
      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(targetVol, now + 0.025);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + decay);

      osc.connect(gain);
      gain.connect(this.bellGain);

      osc.start(now);
      osc.stop(now + decay + 0.1);
    });
  }


  // 3. Tibetan Singing Bowl (Detuned dual sine waves for warm physical beating)
  public playTibetanBowl() {
    this.initContext();
    if (!this.ctx || !this.bellGain || this.isMuted) return;

    const now = this.ctx.currentTime;
    const freqs = [
      { f: 216, g: 0.35, decay: 3.8 },
      { f: 218.4, g: 0.35, decay: 3.8 },
      { f: 432, g: 0.18, decay: 2.6 },
      { f: 648, g: 0.08, decay: 1.9 },
    ];

    freqs.forEach(({ f, g, decay }) => {
      if (!this.ctx || !this.bellGain) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(f, now);

      const targetVol = g * this.masterVolume;
      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(targetVol, now + 0.04);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + decay);

      osc.connect(gain);
      gain.connect(this.bellGain);

      osc.start(now);
      osc.stop(now + decay + 0.1);
    });
  }

  // 4. Koshi Wind Chime (High crystalline silver chime shimmer)
  public playKoshiChime() {
    this.initContext();
    if (!this.ctx || !this.bellGain || this.isMuted) return;

    const now = this.ctx.currentTime;
    const chimeFreqs = [432, 648, 864, 1296];
    chimeFreqs.forEach((freq, idx) => {
      if (!this.ctx || !this.bellGain) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = idx % 2 === 0 ? 'sine' : 'triangle';
      osc.frequency.setValueAtTime(freq, now + idx * 0.018);

      const decay = 2.8 - idx * 0.4;
      const targetVol = (0.24 / (idx + 1)) * this.masterVolume;

      gain.gain.setValueAtTime(0, now + idx * 0.018);
      gain.gain.linearRampToValueAtTime(targetVol, now + idx * 0.018 + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.018 + decay);

      osc.connect(gain);
      gain.connect(this.bellGain);

      osc.start(now + idx * 0.018);
      osc.stop(now + idx * 0.018 + decay + 0.1);
    });
  }

  // 5. Zen Temple Wood Block (Organic hollow acoustic temple clapper)
  public playWoodBlock() {
    this.initContext();
    if (!this.ctx || !this.bellGain || this.isMuted) return;

    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(820, now);
    osc.frequency.exponentialRampToValueAtTime(540, now + 0.035);

    const targetVol = 0.38 * this.masterVolume;
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(targetVol, now + 0.003);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.09);

    osc.connect(gain);
    gain.connect(this.bellGain);

    osc.start(now);
    osc.stop(now + 0.12);
  }

  // Smart dispatcher for phase transitions
  public playTransitionCue(bellIdentifier: string = 'zen-temple', pitchHz: number = 432) {
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate([40, 60, 40]);
      } catch {
        // Ignore
      }
    }

    const key = (bellIdentifier || '').toLowerCase();
    if (key.includes('temple')) {
      this.playTempleBell();
    } else if (key.includes('tibetan') || key.includes('bowl')) {
      this.playTibetanBowl();
    } else if (key.includes('wood') || key.includes('clapper')) {
      this.playWoodBlock();
    } else if (key.includes('koshi') || key.includes('chime')) {
      this.playKoshiChime();
    } else {
      this.playTransitionChime(pitchHz);
    }
  }

  // Resonant Phase Transition Bell chime (fallback)
  public playTransitionChime(pitchHz: number = 432) {
    this.initContext();
    if (!this.ctx || !this.bellGain || this.isMuted) return;

    const now = this.ctx.currentTime;

    const harmonics = [1, 2.02, 3.01, 4.04];
    harmonics.forEach((h, index) => {
      if (!this.ctx || !this.bellGain) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = index === 0 ? 'sine' : 'triangle';
      osc.frequency.setValueAtTime(pitchHz * h, now);

      const decayTime = 2.4 - index * 0.4;
      const volume = (0.28 / (index + 1)) * this.masterVolume;

      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(volume, now + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + Math.max(0.2, decayTime));

      osc.connect(gain);
      gain.connect(this.bellGain);

      osc.start(now);
      osc.stop(now + decayTime + 0.1);
    });

    // Haptic feedback cue if supported
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate([40, 60, 40]);
      } catch {
        // Ignore
      }
    }
  }
}

export const audioEngine = new AudioEngine();
