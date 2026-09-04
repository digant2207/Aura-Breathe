import React, { useState, useEffect, useRef } from 'react';
import { BreathPattern, BreathPhase } from '../types';
import { audioEngine } from '../utils/audioEngine';

interface BreatheScreenProps {
  pattern: BreathPattern;
  durationMinutes: number;
  onEndSession: (completedSeconds: number) => void;
  activeSoundName: string;
  onChangeSoundName?: (name: string) => void;
  transitionBellEnabled?: boolean;
}

// Gentle biological sinusoidal easing for natural, organic breathing
const easeInOutSine = (x: number): number => -(Math.cos(Math.PI * x) - 1) / 2;

export const BreatheScreen: React.FC<BreatheScreenProps> = ({
  pattern,
  durationMinutes,
  onEndSession,
  activeSoundName,
  transitionBellEnabled = true,
}) => {
  // Total session countdown in seconds
  const totalSessionSec = durationMinutes * 60;
  const [sessionRemainingSec, setSessionRemainingSec] = useState<number>(totalSessionSec);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [isCompleted, setIsCompleted] = useState<boolean>(false);

  // Breath cycle state
  const [phase, setPhase] = useState<BreathPhase>('inhale');
  const [phaseSecRemaining, setPhaseSecRemaining] = useState<number>(pattern.inhale || 4);
  const [fillProgress, setFillProgress] = useState<number>(0); // 0 (empty) to 1 (full)
  const [orbScale, setOrbScale] = useState<number>(0.9);

  // Rounds
  const totalCycleSeconds = Math.max(1, pattern.inhale + pattern.hold1 + pattern.exhale + pattern.hold2);
  const calculatedTotalRounds = Math.max(1, Math.round(totalSessionSec / totalCycleSeconds));
  const [currentRound, setCurrentRound] = useState<number>(1);
  const completedSecondsRef = useRef<number>(0);

  // Screen Wake Lock API state to prevent iPhone screen timeout
  const [wakeLockActive, setWakeLockActive] = useState<boolean>(false);
  const wakeLockRef = useRef<any>(null);

  // High precision animation timestamp refs
  const phaseStartTimeRef = useRef<number>(performance.now());
  const pausedAtRef = useRef<number | null>(null);
  const phaseRef = useRef<BreathPhase>('inhale');
  const patternRef = useRef<BreathPattern>(pattern);
  const isPausedRef = useRef<boolean>(isPaused);
  const isCompletedRef = useRef<boolean>(isCompleted);
  const transitionBellEnabledRef = useRef<boolean>(transitionBellEnabled);

  // Keep refs synchronized
  useEffect(() => {
    phaseRef.current = phase;
  }, [phase]);

  useEffect(() => {
    patternRef.current = pattern;
  }, [pattern]);

  useEffect(() => {
    transitionBellEnabledRef.current = transitionBellEnabled;
  }, [transitionBellEnabled]);

  // Sound playing state
  const [soundPlaying, setSoundPlaying] = useState<boolean>(true);

  // Play ambient audio when screen mounts
  useEffect(() => {
    if (activeSoundName.toLowerCase().includes('rain')) {
      audioEngine.playTrack('rain');
    } else if (activeSoundName.toLowerCase().includes('theta')) {
      audioEngine.playTrack('theta');
    } else if (activeSoundName.toLowerCase().includes('aurora') || activeSoundName.toLowerCase().includes('chimes')) {
      audioEngine.playTrack('aurora');
    } else {
      audioEngine.playTrack('rain');
    }
    setSoundPlaying(true);

    return () => {
      audioEngine.stopAmbient();
    };
  }, [activeSoundName]);

  // Handle pause and resume without animation skips
  useEffect(() => {
    isPausedRef.current = isPaused;
    if (isPaused) {
      pausedAtRef.current = performance.now();
    } else if (pausedAtRef.current !== null) {
      const pauseDuration = performance.now() - pausedAtRef.current;
      phaseStartTimeRef.current += pauseDuration;
      pausedAtRef.current = null;
    }
  }, [isPaused]);

  useEffect(() => {
    isCompletedRef.current = isCompleted;
  }, [isCompleted]);

  // Screen Wake Lock API: Keeps iPhone screen alive and prevents timeout/sleep during breathing
  useEffect(() => {
    let isMounted = true;

    const acquireLock = async () => {
      if (isPaused || isCompleted) return;

      try {
        if ('wakeLock' in navigator) {
          const lock = await (navigator as any).wakeLock.request('screen');
          if (isMounted) {
            wakeLockRef.current = lock;
            setWakeLockActive(true);
            lock.addEventListener('release', () => {
              if (isMounted) setWakeLockActive(false);
            });
          } else {
            lock.release();
          }
        }
      } catch (err) {
        // Wake lock can fail if system battery saver is on or user switches tabs
        console.warn('Screen WakeLock unavailable:', err);
      }
    };

    acquireLock();

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && !isPaused && !isCompleted) {
        acquireLock();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      isMounted = false;
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (wakeLockRef.current) {
        try {
          wakeLockRef.current.release();
        } catch (_) {}
        wakeLockRef.current = null;
      }
      setWakeLockActive(false);
    };
  }, [isPaused, isCompleted]);

  // Overall session seconds counter
  useEffect(() => {
    if (isPaused || isCompleted) return;

    const interval = window.setInterval(() => {
      setSessionRemainingSec((prev) => {
        if (prev <= 1) {
          setIsCompleted(true);
          audioEngine.playTransitionChime(528);
          return 0;
        }
        completedSecondsRef.current += 1;
        return prev - 1;
      });
    }, 1000);

    return () => window.clearInterval(interval);
  }, [isPaused, isCompleted]);

  // Helper to determine phase duration in seconds
  const getPhaseDuration = (currentPhase: BreathPhase, currentPattern: BreathPattern): number => {
    switch (currentPhase) {
      case 'inhale':
        return Math.max(1, currentPattern.inhale);
      case 'hold1':
        return Math.max(1, currentPattern.hold1);
      case 'exhale':
        return Math.max(1, currentPattern.exhale);
      case 'hold2':
        return Math.max(1, currentPattern.hold2);
    }
  };

  // Main 60 FPS silky-smooth animation & phase transition loop
  useEffect(() => {
    let animFrameId: number;
    phaseStartTimeRef.current = performance.now();

    const loop = (now: number) => {
      if (!isPausedRef.current && !isCompletedRef.current) {
        const curPhase = phaseRef.current;
        const curPattern = patternRef.current;
        const durationSec = getPhaseDuration(curPhase, curPattern);
        const durationMs = durationSec * 1000;
        const elapsedMs = now - phaseStartTimeRef.current;
        const rawFraction = Math.min(1, Math.max(0, elapsedMs / durationMs));

        // 1. Calculate continuous fill progress (0 = empty, 1 = full)
        let currentFill = 0;
        let scale = 1.0;

        if (curPhase === 'inhale') {
          // Clockwise fill from 0% to 100%
          const eased = easeInOutSine(rawFraction);
          currentFill = eased;
          scale = 0.90 + 0.25 * eased;
        } else if (curPhase === 'hold1') {
          // Hold full at 100% with gentle breathing resonance
          currentFill = 1.0;
          scale = 1.15 + 0.015 * Math.sin(now * 0.003);
        } else if (curPhase === 'exhale') {
          // Anticlockwise empty from 100% down to 0%
          const eased = easeInOutSine(rawFraction);
          currentFill = 1.0 - eased;
          scale = 1.15 - 0.27 * eased;
        } else if (curPhase === 'hold2') {
          // Hold empty at 0% in calm stillness
          currentFill = 0.0;
          scale = 0.88;
        }

        setFillProgress(currentFill);
        setOrbScale(scale);

        // 2. Numerical countdown display
        const secRemaining = Math.max(0, Math.ceil(durationSec * (1 - rawFraction)));
        setPhaseSecRemaining(secRemaining);

        // 3. Handle phase completion and seamless transition
        if (elapsedMs >= durationMs) {
          let nextPhase: BreathPhase = 'inhale';

          if (curPhase === 'inhale') {
            if (curPattern.hold1 > 0) {
              nextPhase = 'hold1';
            } else {
              nextPhase = 'exhale';
            }
          } else if (curPhase === 'hold1') {
            nextPhase = 'exhale';
          } else if (curPhase === 'exhale') {
            if (curPattern.hold2 > 0) {
              nextPhase = 'hold2';
            } else {
              nextPhase = 'inhale';
              setCurrentRound((r) => Math.min(calculatedTotalRounds, r + 1));
            }
          } else if (curPhase === 'hold2') {
            nextPhase = 'inhale';
            setCurrentRound((r) => Math.min(calculatedTotalRounds, r + 1));
          }

          // Sound chime cues
          if (transitionBellEnabledRef.current) {
            audioEngine.playTransitionChime(
              nextPhase === 'inhale' ? 432 : nextPhase === 'hold1' ? 324 : 216
            );
          }

          setPhase(nextPhase);
          phaseRef.current = nextPhase;
          phaseStartTimeRef.current = now;
        }
      }

      animFrameId = requestAnimationFrame(loop);
    };

    animFrameId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animFrameId);
  }, [calculatedTotalRounds]);

  const toggleSound = () => {
    if (soundPlaying) {
      audioEngine.stopAmbient();
      setSoundPlaying(false);
    } else {
      audioEngine.playTrack(activeSoundName.toLowerCase().includes('chimes') ? 'aurora' : 'rain');
      setSoundPlaying(true);
    }
  };

  const formatSeconds = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const s = sec % 60;
    return `${mins.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const getPhaseDisplay = () => {
    switch (phase) {
      case 'inhale':
        return { label: 'INHALE', subtext: 'EXPAND GENTLY' };
      case 'hold1':
        return { label: 'HOLD', subtext: 'SUSTAIN SOFTLY' };
      case 'exhale':
        return { label: 'EXHALE', subtext: 'RELEASE FULLY' };
      case 'hold2':
        return { label: 'REST', subtext: 'STILLNESS' };
    }
  };

  const currentDisplay = getPhaseDisplay();

  // Circle Geometry
  const beadRadius = 142; // px
  const circumference = 2 * Math.PI * beadRadius; // ~892.21 px

  // Stroke Dashoffset:
  // At fillProgress = 0 -> offset = circumference (empty)
  // At fillProgress = 1 -> offset = 0 (full)
  // Inhale: fillProgress goes 0 -> 1 (clockwise fill)
  // Hold: fillProgress = 1 (held steady)
  // Exhale: fillProgress goes 1 -> 0 (anticlockwise empty)
  // Rest: fillProgress = 0 (held steady)
  const strokeDashoffset = circumference * (1 - fillProgress);

  // Orbiting Bead calculation tracking the stroke tip:
  // fillProgress = 0 -> angle = -90 deg (12 o'clock / top)
  // fillProgress = 1 -> angle = 270 deg (full 360 deg turn back to top)
  const beadAngleDeg = -90 + fillProgress * 360;
  const beadRad = (beadAngleDeg * Math.PI) / 180;
  const beadX = 160 + beadRadius * Math.cos(beadRad);
  const beadY = 160 + beadRadius * Math.sin(beadRad);

  return (
    <div className="flex flex-col items-center w-full max-w-md mx-auto px-4 pb-8 pt-1 relative select-none">
      {/* Background Ambience Glow */}
      <div
        className="absolute top-12 left-1/2 -translate-x-1/2 w-72 h-72 bg-primary/10 rounded-full blur-3xl pointer-events-none transition-transform duration-700 ease-out"
        style={{ transform: `translateX(-50%) scale(${orbScale * 1.1})` }}
      />

      {/* Top Breath Timing Pill: • 4 • 8 • 4 • 0 - clearly visible on iPhone 12 */}
      <div className="flex items-center gap-3 px-4 py-1.5 rounded-full bg-surface-container/60 backdrop-blur-xl border border-outline-variant/30 text-xs font-mono tracking-widest text-on-surface shadow-sm mb-3">
        <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
        <span className={phase === 'inhale' ? 'text-primary font-bold scale-110' : ''}>{pattern.inhale}</span>
        <span className="text-on-surface-variant">•</span>
        <span className={phase === 'hold1' ? 'text-tertiary font-bold scale-110' : ''}>{pattern.hold1}</span>
        <span className="text-on-surface-variant">•</span>
        <span className={phase === 'exhale' ? 'text-secondary font-bold scale-110' : ''}>{pattern.exhale}</span>
        <span className="text-on-surface-variant">•</span>
        <span className={phase === 'hold2' ? 'text-primary font-bold scale-110' : ''}>{pattern.hold2}</span>
      </div>

      {/* Center Breathing Orb Ring (Fitted for iPhone 12 390x844 viewport) */}
      <div className="relative w-72 h-72 sm:w-80 sm:h-80 flex items-center justify-center my-2">
        {/* Outer Dynamic Aura Glow synchronized with breath scale */}
        <div
          className="absolute inset-4 rounded-full bg-primary/15 blur-2xl pointer-events-none"
          style={{ transform: `scale(${orbScale})` }}
        />

        {/* SVG Circular Ring and Orbiting Bead */}
        <svg className="w-72 h-72 sm:w-80 sm:h-80 absolute inset-0 -rotate-90 pointer-events-none" viewBox="0 0 320 320">
          <defs>
            <linearGradient id="ringGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#7dd3fc" />
              <stop offset="50%" stopColor="#a78bfa" />
              <stop offset="100%" stopColor="#c8a0f0" />
            </linearGradient>
            <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="4" result="coloredBlur" />
              <feMerge>
                <feMergeNode in="coloredBlur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Background track circle */}
          <circle
            cx="160"
            cy="160"
            r={beadRadius}
            fill="none"
            stroke="rgba(125, 211, 252, 0.12)"
            strokeWidth="14"
          />

          {/* Active Glowing Circle Ring (Smooth 60fps fill & empty) */}
          <circle
            cx="160"
            cy="160"
            r={beadRadius}
            fill="none"
            stroke="url(#ringGradient)"
            strokeWidth="14"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            filter="url(#glow)"
          />

          {/* Orbiting Progress Bead tracking the stroke tip */}
          <circle
            cx={beadX}
            cy={beadY}
            r="6.5"
            fill="#ffffff"
            filter="url(#glow)"
            className="drop-shadow-[0_0_8px_rgba(255,255,255,0.9)]"
            opacity={fillProgress > 0.005 ? 1 : 0.4}
          />
        </svg>

        {/* Center Text Information synchronized with breathing expansion */}
        <div
          className="flex flex-col items-center justify-center text-center z-10 pointer-events-none"
          style={{ transform: `scale(${orbScale})` }}
        >
          {/* Pause / Flow indicator */}
          <div className="text-secondary mb-1">
            <span className="material-symbols-outlined text-xl">
              {isPaused ? 'play_arrow' : 'pause'}
            </span>
          </div>

          {/* Phase Name: INHALE / HOLD / EXHALE / REST */}
          <h2 className="text-xl font-headline font-bold tracking-widest text-on-surface">
            {currentDisplay.label}
          </h2>

          {/* Subtext: SUSTAIN SOFTLY */}
          <p className="text-[11px] font-medium tracking-wider uppercase text-on-surface-variant mt-0.5">
            {currentDisplay.subtext}
          </p>

          {/* Phase Digital Countdown */}
          <div className="text-3xl font-headline font-bold text-tertiary tracking-tight mt-2 drop-shadow-[0_0_12px_rgba(200,160,240,0.5)]">
            {formatSeconds(phaseSecRemaining)}
          </div>
        </div>
      </div>

      {/* 3 Status Cards underneath */}
      <div className="grid grid-cols-3 gap-2.5 w-full mt-4">
        {/* Card 1: ROUNDS */}
        <div className="bg-surface-container/60 backdrop-blur-xl rounded-xl p-3 flex flex-col justify-between items-center text-center shadow-md border border-outline-variant/30">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant">
            ROUNDS
          </span>
          <div className="text-lg font-headline font-bold text-on-surface mt-1">
            {currentRound} <span className="text-on-surface-variant font-normal">/ {calculatedTotalRounds}</span>
          </div>
          {/* 8 Dot Indicators */}
          <div className="flex items-center gap-1 mt-2">
            {Array.from({ length: Math.min(8, calculatedTotalRounds) }).map((_, i) => (
              <span
                key={i}
                className={`w-1.5 h-1.5 rounded-full transition-all ${
                  i < currentRound ? 'bg-primary shadow-[0_0_6px_rgba(125,211,252,0.8)]' : 'bg-outline-variant/40'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Card 2: Sound Toggle */}
        <button
          type="button"
          onClick={toggleSound}
          className="bg-surface-container/60 backdrop-blur-xl rounded-xl p-3 flex flex-col justify-between items-center text-center shadow-md border border-outline-variant/30 active:scale-95 transition-transform focus:outline-none cursor-pointer"
        >
          <span className="material-symbols-outlined text-primary text-base">water_drop</span>
          <span className="text-xs font-semibold text-on-surface truncate w-full mt-1">
            {activeSoundName}
          </span>
          <span className="text-[10px] font-bold tracking-wider text-primary uppercase mt-1">
            {soundPlaying ? 'PLAYING' : 'MUTED'}
          </span>
        </button>

        {/* Card 3: Aurora Chimes Preview */}
        <button
          type="button"
          onClick={() => audioEngine.playTransitionChime(432)}
          className="bg-surface-container/60 backdrop-blur-xl rounded-xl p-3 flex flex-col justify-between items-center text-center shadow-md border border-outline-variant/30 active:scale-95 transition-transform focus:outline-none cursor-pointer"
          title="Tap to preview chime"
        >
          <span className="material-symbols-outlined text-tertiary text-base">graphic_eq</span>
          <span className="text-xs font-semibold text-on-surface truncate w-full mt-1">
            Bell Chime
          </span>
          <span className="text-[10px] font-bold tracking-wider text-tertiary uppercase mt-1">
            {transitionBellEnabled ? 'ACTIVE' : 'MUTED'}
          </span>
        </button>
      </div>

      {/* Session Remaining Pill & Screen Awake Status */}
      <div className="flex flex-col items-center gap-1.5 mt-3">
        <div className="flex items-center justify-center gap-2 px-5 py-2 rounded-full bg-surface-container/60 backdrop-blur-xl border border-outline-variant/30 text-xs font-medium text-on-surface shadow-sm">
          <span className="material-symbols-outlined text-primary text-[16px]">schedule</span>
          <span>Session Remaining:</span>
          <span className="font-mono font-bold text-primary tracking-wide">
            {formatSeconds(sessionRemainingSec)}
          </span>
        </div>
        {wakeLockActive && (
          <div className="flex items-center gap-1.5 text-[10px] text-primary/80 font-medium tracking-wider uppercase">
            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
            <span>Screen Awake (No Timeout)</span>
          </div>
        )}
      </div>

      {/* Bottom Session Action Buttons */}
      <div className="grid grid-cols-2 gap-3 w-full mt-5">
        {/* End Session Button */}
        <button
          type="button"
          onClick={() => onEndSession(completedSecondsRef.current)}
          className="py-3 px-4 rounded-xl bg-surface-container-high/70 backdrop-blur-xl border border-outline-variant/40 text-on-surface text-xs font-semibold flex items-center justify-center gap-1.5 hover:bg-surface-container-highest/80 active:scale-95 transition-all cursor-pointer"
        >
          <span className="material-symbols-outlined text-sm text-on-surface-variant">close</span>
          <span>End Session</span>
        </button>

        {/* Pause / Resume Button */}
        <button
          type="button"
          onClick={() => setIsPaused(!isPaused)}
          className="py-3 px-4 rounded-xl bg-primary/20 hover:bg-primary/30 text-primary border border-primary/40 backdrop-blur-xl text-xs font-semibold flex items-center justify-center gap-1.5 shadow-[0_0_15px_rgba(125,211,252,0.2)] active:scale-95 transition-all cursor-pointer"
        >
          <span className="material-symbols-outlined text-base">
            {isPaused ? 'play_arrow' : 'pause'}
          </span>
          <span>{isPaused ? 'Resume' : 'Pause'}</span>
        </button>
      </div>

      {/* Celebration Modal on Session Complete */}
      {isCompleted && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-md p-4 animate-fade-in">
          <div className="w-full max-w-sm bg-surface-container/90 border border-primary/30 rounded-2xl p-6 shadow-2xl flex flex-col items-center text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center text-primary shadow-[0_0_20px_rgba(125,211,252,0.4)]">
              <span className="material-symbols-outlined text-3xl">spa</span>
            </div>
            <div className="space-y-1">
              <h3 className="text-xl font-headline font-bold text-on-surface">
                Session Complete
              </h3>
              <p className="text-xs text-on-surface-variant">
                You completed {Math.round(completedSecondsRef.current / 60)} mindful minutes of conscious breathwork.
              </p>
            </div>
            <div className="flex items-center gap-2 py-1.5 px-3 rounded-full bg-primary/15 text-primary text-xs font-semibold">
              <span className="material-symbols-outlined text-sm">local_fire_department</span>
              <span>Daily Streak Extended!</span>
            </div>
            <button
              type="button"
              onClick={() => onEndSession(completedSecondsRef.current)}
              className="w-full py-2.5 rounded-xl bg-primary text-on-primary font-semibold text-xs shadow-md active:scale-95 transition-all cursor-pointer"
            >
              Done & View Progress
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
