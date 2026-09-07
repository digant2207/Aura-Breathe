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

  // Energy track procedural audio nodes for closed-eyes breath guidance
  private energyNodes: {
    osc1: OscillatorNode;
    osc2: OscillatorNode;
    subOsc: OscillatorNode;
    shimmerOsc: OscillatorNode;
    filter: BiquadFilterNode;
    gain: GainNode;
  } | null = null;
  private energyPreviewTimeout: number | null = null;

  private initContext() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();

      this.ambientGain = this.ctx.createGain();
      this.ambientGain.gain.setValueAtTime(this.isMuted ? 0 : this.masterVolume * 0.38, this.ctx.currentTime);
      this.ambientGain.connect(this.ctx.destination);

      this.bellGain = this.ctx.createGain();
      // Increased bell gain headroom for unmistakable clarity over ambient sound
      this.bellGain.gain.setValueAtTime(this.isMuted ? 0 : this.masterVolume * 0.85, this.ctx.currentTime);
      this.bellGain.connect(this.ctx.destination);
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public setVolume(volume: number) {
    this.masterVolume = Math.max(0, Math.min(1, volume));
    if (this.ctx && this.ambientGain && this.bellGain && !this.isMuted) {
      this.ambientGain.gain.setTargetAtTime(this.masterVolume * 0.38, this.ctx.currentTime, 0.1);
      this.bellGain.gain.setTargetAtTime(this.masterVolume * 0.85, this.ctx.currentTime, 0.1);
    }
  }

  public toggleMute(): boolean {
    this.isMuted = !this.isMuted;
    if (this.ctx && this.ambientGain && this.bellGain) {
      const targetGain = this.isMuted ? 0 : this.masterVolume;
      this.ambientGain.gain.setTargetAtTime(targetGain * 0.38, this.ctx.currentTime, 0.1);
      this.bellGain.gain.setTargetAtTime(targetGain * 0.85, this.ctx.currentTime, 0.1);
    }
    return this.isMuted;
  }

  /**
   * Automatic Audio Ducking: lowers ambient track volume momentarily when a bell or mallet strikes,
   * ensuring transition cues ring out crystal-clear even with closed eyes.
   */
  public duckAmbient(durationSec: number = 1.8, duckDepth: number = 0.35) {
    if (!this.ctx || !this.ambientGain || this.isMuted) return;
    const now = this.ctx.currentTime;
    const normalGain = this.masterVolume * 0.38;
    const duckedGain = normalGain * duckDepth;

    this.ambientGain.gain.cancelScheduledValues(now);
    this.ambientGain.gain.setValueAtTime(this.ambientGain.gain.value, now);
    this.ambientGain.gain.linearRampToValueAtTime(duckedGain, now + 0.035);
    this.ambientGain.gain.setValueAtTime(duckedGain, now + Math.max(0.15, durationSec * 0.3));
    this.ambientGain.gain.setTargetAtTime(normalGain, now + Math.max(0.25, durationSec * 0.3), 0.5);
  }

  public playTrack(trackType: string) {
    this.initContext();
    if (!this.ctx || !this.ambientGain) return;

    // Stop current ambient sound
    this.stopAmbient();

    // Ensure ambient gain is at audible target volume
    const targetGain = this.isMuted ? 0 : this.masterVolume * 0.38;
    this.ambientGain.gain.cancelScheduledValues(this.ctx.currentTime);
    this.ambientGain.gain.setValueAtTime(targetGain, this.ctx.currentTime);

    const normalized = (trackType || '').toLowerCase();
    let resolvedType: 'rain' | 'theta' | 'singing-bowl' | 'aurora' | 'stream' | 'energy' | 'auto-bowl' | 'universe-888' = 'stream';

    if (normalized.includes('energy')) {
      resolvedType = 'energy';
    } else if (normalized.includes('universe') || normalized.includes('888') || normalized.includes('fire') || normalized.includes('cedar')) {
      resolvedType = 'universe-888';
    } else if (normalized.includes('auto') || normalized.includes('buddhist')) {
      resolvedType = 'auto-bowl';
    } else if (normalized.includes('stream') || normalized.includes('glacial')) {
      resolvedType = 'stream';
    } else if (normalized.includes('rain')) {
      resolvedType = 'rain';
    } else if (normalized.includes('theta') || normalized.includes('arctic') || normalized.includes('binaural')) {
      resolvedType = 'theta';
    } else if (normalized.includes('aurora') || normalized.includes('northern') || normalized.includes('chimes')) {
      resolvedType = 'aurora';
    } else if (normalized.includes('bowl') || normalized.includes('tibetan') || normalized.includes('singing')) {
      resolvedType = 'singing-bowl';
    }

    this.currentTrackType = resolvedType;
    this.isPlaying = true;

    try {
      if (resolvedType === 'energy') {
        this.playEnergyTrack();
      } else if (resolvedType === 'universe-888') {
        this.playUniverse888();
      } else if (resolvedType === 'auto-bowl') {
        this.playAutoBowl();
      } else if (resolvedType === 'theta') {
        this.playTheta432();
      } else if (resolvedType === 'rain') {
        this.playRain();
      } else if (resolvedType === 'stream') {
        this.playStream();
      } else if (resolvedType === 'aurora') {
        this.playAuroraPad();
      } else {
        this.playSingingBowlDrone();
      }
    } catch {
      // Graceful fallback if Web Audio is blocked
    }
  }

  public pauseAmbient() {
    if (this.ctx && this.ambientGain) {
      const now = this.ctx.currentTime;
      this.ambientGain.gain.cancelScheduledValues(now);
      this.ambientGain.gain.setValueAtTime(this.ambientGain.gain.value, now);
      this.ambientGain.gain.linearRampToValueAtTime(0, now + 0.04);
    }
    if (this.energyPreviewTimeout !== null) {
      window.clearTimeout(this.energyPreviewTimeout);
      this.energyPreviewTimeout = null;
    }
    this.isPlaying = false;
  }

  public resumeAmbient() {
    this.initContext();
    if (!this.ctx || !this.ambientGain) return;
    const now = this.ctx.currentTime;
    const targetGain = this.isMuted ? 0 : this.masterVolume * 0.38;
    this.ambientGain.gain.cancelScheduledValues(now);
    this.ambientGain.gain.setValueAtTime(0, now);
    this.ambientGain.gain.linearRampToValueAtTime(targetGain, now + 0.08);
    this.isPlaying = true;
  }

  public stopAmbient() {
    if (this.energyPreviewTimeout !== null) {
      window.clearTimeout(this.energyPreviewTimeout);
      this.energyPreviewTimeout = null;
    }
    this.energyNodes = null;

    if (this.ctx && this.ambientGain) {
      try {
        const now = this.ctx.currentTime;
        this.ambientGain.gain.cancelScheduledValues(now);
        this.ambientGain.gain.setValueAtTime(this.ambientGain.gain.value, now);
        this.ambientGain.gain.linearRampToValueAtTime(0, now + 0.02);
      } catch (_) {}
    }

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

  // 5. Universe 888Hz: Universal Abundance & Miracle Frequency (YouTube: XHJhtr2StW4)
  private playUniverse888() {
    if (!this.ctx || !this.ambientGain) return;

    const merger = this.ctx.createChannelMerger(2);

    // Left channel: 888 Hz (Sacred Universal Frequency)
    const oscL = this.ctx.createOscillator();
    oscL.type = 'sine';
    oscL.frequency.setValueAtTime(888, this.ctx.currentTime);

    // Right channel: 893.5 Hz -> 5.5 Hz Theta wave for deep manifestation & cosmic alignment
    const oscR = this.ctx.createOscillator();
    oscR.type = 'sine';
    oscR.frequency.setValueAtTime(893.5, this.ctx.currentTime);

    // Sub-harmonic octaves for celestial depth: 444 Hz & 222 Hz
    const subOsc1 = this.ctx.createOscillator();
    subOsc1.type = 'sine';
    subOsc1.frequency.setValueAtTime(444, this.ctx.currentTime);

    const subOsc2 = this.ctx.createOscillator();
    subOsc2.type = 'sine';
    subOsc2.frequency.setValueAtTime(222, this.ctx.currentTime);

    // Cosmic shimmer overtone at 1776 Hz (double octave of 888)
    const shimmerOsc = this.ctx.createOscillator();
    shimmerOsc.type = 'triangle';
    shimmerOsc.frequency.setValueAtTime(1776, this.ctx.currentTime);

    const mainGain = this.ctx.createGain();
    mainGain.gain.setValueAtTime(0.24, this.ctx.currentTime);
    oscL.connect(mainGain);
    oscR.connect(mainGain);

    const subGain = this.ctx.createGain();
    subGain.gain.setValueAtTime(0.18, this.ctx.currentTime);
    subOsc1.connect(subGain);
    subOsc2.connect(subGain);

    const shimmerGain = this.ctx.createGain();
    shimmerGain.gain.setValueAtTime(0.04, this.ctx.currentTime);
    shimmerOsc.connect(shimmerGain);

    mainGain.connect(merger, 0, 0);
    mainGain.connect(merger, 0, 1);
    subGain.connect(merger, 0, 0);
    subGain.connect(merger, 0, 1);
    shimmerGain.connect(merger, 0, 0);
    shimmerGain.connect(merger, 0, 1);

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(1500, this.ctx.currentTime);

    merger.connect(filter);
    filter.connect(this.ambientGain);

    oscL.start();
    oscR.start();
    subOsc1.start();
    subOsc2.start();
    shimmerOsc.start();

    this.activeOscillators.push(oscL, oscR, subOsc1, subOsc2, shimmerOsc);
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

  // 7. Energy Track: Closed-Eyes Dynamic Breath Guidance
  // Calm, grounding frequency swell that rises slowly and gently with the breath.
  // Inhale: starts slowly at 136.1Hz (Sacred OM) and rises gently to 216Hz, soft velvet filter.
  // Hold: peaceful, expansive warm resonance with gentle 1.5Hz theta beat.
  // Exhale: slowly glides back down to 136.1Hz releasing all tension.
  // Rest: soft fade into total silence.
  private playEnergyTrack() {
    if (!this.ctx || !this.ambientGain) return;

    const osc1 = this.ctx.createOscillator();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(136.1, this.ctx.currentTime); // C#3 OM calming grounding root

    const osc2 = this.ctx.createOscillator();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(137.6, this.ctx.currentTime); // 1.5Hz organic slow wave beating

    const subOsc = this.ctx.createOscillator();
    subOsc.type = 'sine';
    subOsc.frequency.setValueAtTime(68, this.ctx.currentTime); // Deep sub-bass grounding warmth

    const shimmerOsc = this.ctx.createOscillator();
    shimmerOsc.type = 'sine';
    shimmerOsc.frequency.setValueAtTime(272.2, this.ctx.currentTime); // Soft warm octave

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(220, this.ctx.currentTime);
    filter.Q.setValueAtTime(0.7, this.ctx.currentTime); // Soft, non-resonant velvety warmth

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.08, this.ctx.currentTime);

    osc1.connect(filter);
    osc2.connect(filter);
    subOsc.connect(filter);
    shimmerOsc.connect(filter);

    filter.connect(gain);
    gain.connect(this.ambientGain);

    osc1.start();
    osc2.start();
    subOsc.start();
    shimmerOsc.start();

    this.activeOscillators.push(osc1, osc2, subOsc, shimmerOsc);
    this.energyNodes = { osc1, osc2, subOsc, shimmerOsc, filter, gain };

    // Initial default preview cycle (4s inhale -> 4s hold -> 4s exhale -> 2s rest)
    this.startEnergyPreviewLoop();
  }

  private startEnergyPreviewLoop() {
    if (this.energyPreviewTimeout !== null) {
      window.clearTimeout(this.energyPreviewTimeout);
      this.energyPreviewTimeout = null;
    }

    const runStep = (step: 'inhale' | 'hold1' | 'exhale' | 'hold2') => {
      if (!this.isPlaying || this.currentTrackType !== 'energy') return;

      if (step === 'inhale') {
        this.syncEnergyPhase('inhale', 4);
        this.energyPreviewTimeout = window.setTimeout(() => runStep('hold1'), 4000);
      } else if (step === 'hold1') {
        this.syncEnergyPhase('hold1', 4);
        this.energyPreviewTimeout = window.setTimeout(() => runStep('exhale'), 4000);
      } else if (step === 'exhale') {
        this.syncEnergyPhase('exhale', 4);
        this.energyPreviewTimeout = window.setTimeout(() => runStep('hold2'), 4000);
      } else {
        this.syncEnergyPhase('hold2', 2);
        this.energyPreviewTimeout = window.setTimeout(() => runStep('inhale'), 2000);
      }
    };

    runStep('inhale');
  }

  /**
   * Synchronize the Energy track with the real-time breathing phase and duration.
   * Cancels standalone preview timer so the active breathing session takes total control.
   * Designed for deep calm: rises slowly and gently with an organic curve.
   */
  public syncEnergyPhase(phase: string, durationSec: number) {
    if (this.energyPreviewTimeout !== null) {
      window.clearTimeout(this.energyPreviewTimeout);
      this.energyPreviewTimeout = null;
    }

    if (!this.ctx || !this.energyNodes || this.currentTrackType !== 'energy' || !this.isPlaying) return;
    const now = this.ctx.currentTime;
    const dur = Math.max(0.6, durationSec);
    const { osc1, osc2, subOsc, shimmerOsc, filter, gain } = this.energyNodes;

    // Smoothly reset audio param automation curves
    const curGain = gain.gain.value;
    gain.gain.cancelScheduledValues(now);
    gain.gain.setValueAtTime(curGain, now);

    osc1.frequency.cancelScheduledValues(now);
    osc2.frequency.cancelScheduledValues(now);
    subOsc.frequency.cancelScheduledValues(now);
    shimmerOsc.frequency.cancelScheduledValues(now);
    filter.frequency.cancelScheduledValues(now);

    if (phase === 'inhale') {
      // INHALE: Rises SLOWLY and GENTLY without sudden spikes for maximum calm.
      // Starts at grounding 136.1 Hz (OM) and softly glides to 216 Hz across the full duration.
      // S-curve progression: very slow initial swell, gentle middle, peaceful crest.
      const tMid = now + dur * 0.5;
      const tEnd = now + dur;

      osc1.frequency.setValueAtTime(136.1, now);
      osc1.frequency.linearRampToValueAtTime(168, tMid);
      osc1.frequency.linearRampToValueAtTime(216, tEnd);

      osc2.frequency.setValueAtTime(137.6, now);
      osc2.frequency.linearRampToValueAtTime(169.5, tMid);
      osc2.frequency.linearRampToValueAtTime(217.5, tEnd);

      subOsc.frequency.setValueAtTime(68, now);
      subOsc.frequency.linearRampToValueAtTime(84, tMid);
      subOsc.frequency.linearRampToValueAtTime(108, tEnd);

      shimmerOsc.frequency.setValueAtTime(272.2, now);
      shimmerOsc.frequency.linearRampToValueAtTime(336, tMid);
      shimmerOsc.frequency.linearRampToValueAtTime(432, tEnd);

      // Filter opens up softly (stays warm, velvety, and calm — never harsh or bright)
      filter.frequency.setValueAtTime(220, now);
      filter.frequency.linearRampToValueAtTime(340, tMid);
      filter.frequency.linearRampToValueAtTime(480, tEnd);

      // Volume swells gently into calm soothing presence (not overpowering)
      gain.gain.setValueAtTime(Math.max(0.06, curGain), now);
      gain.gain.linearRampToValueAtTime(0.14, tMid);
      gain.gain.linearRampToValueAtTime(0.22, tEnd);

    } else if (phase === 'hold1') {
      // HOLD: Energy gently sustains in body — peaceful, warm, expansive stillness
      osc1.frequency.setValueAtTime(216, now);
      osc2.frequency.setValueAtTime(217.5, now);
      subOsc.frequency.setValueAtTime(108, now);
      shimmerOsc.frequency.setValueAtTime(432, now);

      filter.frequency.setValueAtTime(480, now);
      gain.gain.setValueAtTime(0.22, now);

    } else if (phase === 'exhale') {
      // EXHALE: Slowly and smoothly descends back to grounding base, releasing tension
      const tMid = now + dur * 0.5;
      const tEnd = now + dur;

      osc1.frequency.setValueAtTime(216, now);
      osc1.frequency.linearRampToValueAtTime(168, tMid);
      osc1.frequency.linearRampToValueAtTime(136.1, tEnd);

      osc2.frequency.setValueAtTime(217.5, now);
      osc2.frequency.linearRampToValueAtTime(169.5, tMid);
      osc2.frequency.linearRampToValueAtTime(137.6, tEnd);

      subOsc.frequency.setValueAtTime(108, now);
      subOsc.frequency.linearRampToValueAtTime(84, tMid);
      subOsc.frequency.linearRampToValueAtTime(68, tEnd);

      shimmerOsc.frequency.setValueAtTime(432, now);
      shimmerOsc.frequency.linearRampToValueAtTime(336, tMid);
      shimmerOsc.frequency.linearRampToValueAtTime(272.2, tEnd);

      // Filter softly warms down
      filter.frequency.setValueAtTime(480, now);
      filter.frequency.linearRampToValueAtTime(320, tMid);
      filter.frequency.linearRampToValueAtTime(220, tEnd);

      // Volume gently eases down
      gain.gain.setValueAtTime(0.22, now);
      gain.gain.linearRampToValueAtTime(0.12, tMid);
      gain.gain.linearRampToValueAtTime(0.06, tEnd);

    } else if (phase === 'hold2') {
      // REST: Total calm silence with smooth, gentle fade
      gain.gain.linearRampToValueAtTime(0.0001, now + 0.25);
    }
  }

  // 8. 528Hz Buddhist Singing Bowl Track (Model from YouTube automated striker video eNmjWjpxUOM)
  // Continuous warm meditative singing bowl drone, with wooden mallet strikes synchronized with breath transitions.
  private playAutoBowl() {
    if (!this.ctx || !this.ambientGain) return;

    // Meditative 528Hz & 264Hz Tibetan bronze bowl hum
    const freqs = [264, 528, 529.6];
    freqs.forEach((freq, idx) => {
      if (!this.ctx || !this.ambientGain) return;
      const osc = this.ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime);

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.14 / (idx + 1), this.ctx.currentTime);

      osc.connect(gain);
      gain.connect(this.ambientGain);
      osc.start();
      this.activeOscillators.push(osc);
    });
  }

  /**
   * Synchronize breath phase transition with ambient soundscape.
   * If user is playing the 528Hz Buddhist Bowl track, strikes the wooden mallet
   * in perfect alignment with their breathing style!
   */
  public syncBreathTransition(phase: string) {
    if (this.currentTrackType === 'auto-bowl' && this.isPlaying) {
      // Subtle mallet strike in harmony with breath transition
      this.playAuto528Bowl(0.32);
    }
  }

  // 1. Zen Temple Bell (Japanese bronze gong with inharmonic overtones)
  public playTempleBell() {
    this.initContext();
    if (!this.ctx || !this.bellGain || this.isMuted) return;

    this.duckAmbient(2.2, 0.35);

    const now = this.ctx.currentTime;
    const baseFreq = 264; // Deep bronze tone
    const partials = [
      { ratio: 1.0, gain: 0.45, decay: 3.8, type: 'sine' as OscillatorType },
      { ratio: 1.48, gain: 0.28, decay: 3.0, type: 'sine' as OscillatorType },
      { ratio: 2.08, gain: 0.20, decay: 2.4, type: 'triangle' as OscillatorType },
      { ratio: 2.76, gain: 0.15, decay: 2.0, type: 'sine' as OscillatorType },
      { ratio: 3.82, gain: 0.10, decay: 1.6, type: 'triangle' as OscillatorType },
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

  // 2. 528Hz Buddhist Singing Bowl with Wooden Mallet Strike (YouTube: eNmjWjpxUOM)
  public playAuto528Bowl(volumeMultiplier: number = 1.0) {
    this.initContext();
    if (!this.ctx || !this.bellGain || this.isMuted) return;

    this.duckAmbient(2.5, 0.3);

    const now = this.ctx.currentTime;

    // 1. Tactile wooden striker contact transient (like automated mallet rod in video)
    const malletOsc = this.ctx.createOscillator();
    const malletFilter = this.ctx.createBiquadFilter();
    const malletGain = this.ctx.createGain();

    malletOsc.type = 'triangle';
    malletOsc.frequency.setValueAtTime(680, now);
    malletOsc.frequency.exponentialRampToValueAtTime(160, now + 0.035);

    malletFilter.type = 'bandpass';
    malletFilter.frequency.setValueAtTime(800, now);
    malletFilter.Q.setValueAtTime(1.5, now);

    const strikeVol = 0.55 * this.masterVolume * volumeMultiplier;
    malletGain.gain.setValueAtTime(0, now);
    malletGain.gain.linearRampToValueAtTime(strikeVol, now + 0.003);
    malletGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.07);

    malletOsc.connect(malletFilter);
    malletFilter.connect(malletGain);
    malletGain.connect(this.bellGain);

    malletOsc.start(now);
    malletOsc.stop(now + 0.08);

    // 2. Pure 528 Hz Buddhist singing bowl acoustic resonance with physical beating
    const partials = [
      { f: 528.0, g: 0.50, decay: 4.8, type: 'sine' as OscillatorType },
      { f: 529.6, g: 0.44, decay: 4.6, type: 'sine' as OscillatorType }, // 1.6 Hz authentic beating
      { f: 264.0, g: 0.26, decay: 4.2, type: 'sine' as OscillatorType }, // Warm lower sub-harmonic
      { f: 1056.0, g: 0.20, decay: 3.4, type: 'triangle' as OscillatorType }, // Octave ring
      { f: 1584.0, g: 0.12, decay: 2.2, type: 'sine' as OscillatorType }, // Upper shimmer
    ];

    partials.forEach(({ f, g, decay, type }) => {
      if (!this.ctx || !this.bellGain) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = type;
      osc.frequency.setValueAtTime(f, now);

      const targetVol = g * this.masterVolume * volumeMultiplier;
      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(targetVol, now + 0.025);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + decay);

      osc.connect(gain);
      gain.connect(this.bellGain);

      osc.start(now);
      osc.stop(now + decay + 0.1);
    });

    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate([40, 60, 40]);
      } catch {}
    }
  }

  // 3. Tibetan Singing Bowl (Detuned dual sine waves for warm physical beating)
  public playTibetanBowl() {
    this.initContext();
    if (!this.ctx || !this.bellGain || this.isMuted) return;

    this.duckAmbient(2.4, 0.35);

    const now = this.ctx.currentTime;
    const freqs = [
      { f: 216, g: 0.42, decay: 4.0 },
      { f: 218.4, g: 0.42, decay: 4.0 },
      { f: 432, g: 0.22, decay: 2.8 },
      { f: 648, g: 0.12, decay: 2.0 },
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

    this.duckAmbient(2.0, 0.35);

    const now = this.ctx.currentTime;
    const chimeFreqs = [432, 648, 864, 1296];
    chimeFreqs.forEach((freq, idx) => {
      if (!this.ctx || !this.bellGain) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = idx % 2 === 0 ? 'sine' : 'triangle';
      osc.frequency.setValueAtTime(freq, now + idx * 0.018);

      const decay = 3.0 - idx * 0.4;
      const targetVol = (0.30 / (idx + 1)) * this.masterVolume;

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

    this.duckAmbient(1.2, 0.35);

    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(820, now);
    osc.frequency.exponentialRampToValueAtTime(540, now + 0.035);

    const targetVol = 0.45 * this.masterVolume;
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(targetVol, now + 0.003);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.09);

    osc.connect(gain);
    gain.connect(this.bellGain);

    osc.start(now);
    osc.stop(now + 0.12);
  }

  // Unique Calm Session End Sound: Peaceful, soothing harmonic wash into stillness
  public playSessionEndSound() {
    this.initContext();
    if (!this.ctx || !this.bellGain || this.isMuted) return;

    // Immediately stop ambient soundscape
    this.stopAmbient();

    const now = this.ctx.currentTime;

    // Stage 1: Soft warm singing bowl mallet tap
    const malletOsc = this.ctx.createOscillator();
    const malletGain = this.ctx.createGain();
    malletOsc.type = 'sine';
    malletOsc.frequency.setValueAtTime(264, now);
    malletOsc.frequency.exponentialRampToValueAtTime(132, now + 0.08);

    malletGain.gain.setValueAtTime(0.35 * this.masterVolume, now);
    malletGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.35);

    malletOsc.connect(malletGain);
    malletGain.connect(this.bellGain);
    malletOsc.start(now);
    malletOsc.stop(now + 0.4);

    // Stage 2: Serene celestial Solfeggio 528Hz & 432Hz harmonic wash with expansive peaceful decay
    const harmonics = [
      { f: 264, g: 0.32, decay: 4.8, type: 'sine' as OscillatorType },
      { f: 432, g: 0.28, decay: 5.2, type: 'sine' as OscillatorType },
      { f: 528, g: 0.45, decay: 5.8, type: 'sine' as OscillatorType }, // Miracle / Peace tone
      { f: 660, g: 0.22, decay: 4.5, type: 'triangle' as OscillatorType }, // Peaceful major third
      { f: 792, g: 0.16, decay: 4.0, type: 'sine' as OscillatorType }, // Pure fifth
      { f: 1056, g: 0.10, decay: 3.5, type: 'sine' as OscillatorType }, // Octave sparkle
    ];

    harmonics.forEach(({ f, g, decay, type }, idx) => {
      if (!this.ctx || !this.bellGain) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = type;
      osc.frequency.setValueAtTime(f, now + 0.03 + idx * 0.008);

      const targetVol = g * this.masterVolume;
      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(targetVol, now + 0.06);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + decay);

      osc.connect(gain);
      gain.connect(this.bellGain);

      osc.start(now);
      osc.stop(now + decay + 0.1);
    });

    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate([60, 100, 80]);
      } catch {}
    }
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
    if (key.includes('auto') || key.includes('528')) {
      this.playAuto528Bowl();
    } else if (key.includes('temple')) {
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
