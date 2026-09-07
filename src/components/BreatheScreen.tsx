import React, { useState, useEffect, useRef } from 'react';
import { BreathPattern, BreathPhase, SoundscapeTrack, TransitionBell } from '../types';
import { SOUNDSCAPE_TRACKS } from '../data/mockData';
import { audioEngine } from '../utils/audioEngine';

interface BreatheScreenProps {
  pattern: BreathPattern;
  durationMinutes: number;
  onEndSession: (completedSeconds: number) => void;
  currentTrack: SoundscapeTrack;
  onChangeTrack?: (track: SoundscapeTrack) => void;
  selectedBell: TransitionBell;
  transitionBellEnabled?: boolean;
}

// Gentle biological sinusoidal easing for natural, organic breathing
const easeInOutSine = (x: number): number => -(Math.cos(Math.PI * x) - 1) / 2;

export const BreatheScreen: React.FC<BreatheScreenProps> = ({
  pattern,
  durationMinutes,
  onEndSession,
  currentTrack,
  onChangeTrack,
  selectedBell,
  transitionBellEnabled = true,
}) => {
  // 3-second Get Ready Countdown before session begins
  const [readyCountdown, setReadyCountdown] = useState<number>(3);
  const isSessionStarted = readyCountdown === 0;

  // Total session countdown in seconds
  const totalSessionSec = durationMinutes * 60;
  const [sessionRemainingSec, setSessionRemainingSec] = useState<number>(totalSessionSec);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [isCompleted, setIsCompleted] = useState<boolean>(false);
  const [isFinishingOnExhale, setIsFinishingOnExhale] = useState<boolean>(false);

  // Sound selection modal inside session
  const [showSoundModal, setShowSoundModal] = useState<boolean>(false);
  const [soundPlaying, setSoundPlaying] = useState<boolean>(true);

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

  // Screen Wake Lock API state to prevent screen timeout
  const [wakeLockActive, setWakeLockActive] = useState<boolean>(false);
  const wakeLockRef = useRef<any>(null);

  // High precision animation timestamp refs
  const phaseStartTimeRef = useRef<number>(performance.now());
  const pausedAtRef = useRef<number | null>(null);
  const phaseRef = useRef<BreathPhase>('inhale');
  const patternRef = useRef<BreathPattern>(pattern);
  const isPausedRef = useRef<boolean>(isPaused);
  const isCompletedRef = useRef<boolean>(isCompleted);
  const isSessionStartedRef = useRef<boolean>(isSessionStarted);
  const transitionBellEnabledRef = useRef<boolean>(transitionBellEnabled);
  const selectedBellRef = useRef<TransitionBell>(selectedBell);
  const sessionRemainingSecRef = useRef<number>(sessionRemainingSec);
  const isFinishingOnExhaleRef = useRef<boolean>(isFinishingOnExhale);

  // Keep refs synchronized
  useEffect(() => {
    phaseRef.current = phase;
  }, [phase]);

  useEffect(() => {
    patternRef.current = pattern;
  }, [pattern]);

  useEffect(() => {
    isSessionStartedRef.current = isSessionStarted;
  }, [isSessionStarted]);

  useEffect(() => {
    transitionBellEnabledRef.current = transitionBellEnabled;
  }, [transitionBellEnabled]);

  useEffect(() => {
    selectedBellRef.current = selectedBell;
  }, [selectedBell]);

  useEffect(() => {
    sessionRemainingSecRef.current = sessionRemainingSec;
  }, [sessionRemainingSec]);

  useEffect(() => {
    isFinishingOnExhaleRef.current = isFinishingOnExhale;
  }, [isFinishingOnExhale]);

  // 3-second Get Ready Countdown Timer
  useEffect(() => {
    if (readyCountdown <= 0) return;

    const timer = window.setInterval(() => {
      setReadyCountdown((prev) => {
        if (prev <= 1) {
          // Prep finished! Cue soft start chime
          if (transitionBellEnabledRef.current) {
            audioEngine.playTransitionCue(selectedBellRef.current.bellType || selectedBellRef.current.id, 432);
          }
          // Sync Energy track or breath-aligned mallet strike with initial inhale
          audioEngine.syncEnergyPhase('inhale', getPhaseDuration('inhale', patternRef.current));
          audioEngine.syncBreathTransition('inhale');
          phaseStartTimeRef.current = performance.now();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => window.clearInterval(timer);
  }, [readyCountdown]);

  // Play ambient audio immediately so user feels calm even during get-ready
  useEffect(() => {
    audioEngine.playTrack(currentTrack.audioType || currentTrack.title);
    audioEngine.syncEnergyPhase(phaseRef.current, getPhaseDuration(phaseRef.current, patternRef.current));
    setSoundPlaying(true);

    return () => {
      audioEngine.stopAmbient();
    };
  }, [currentTrack]);

  // Handle pause and resume: stops sound on pause, smoothly resumes on resume
  useEffect(() => {
    isPausedRef.current = isPaused;
    if (isPaused) {
      pausedAtRef.current = performance.now();
      audioEngine.pauseAmbient();
    } else if (pausedAtRef.current !== null) {
      const pauseDuration = performance.now() - pausedAtRef.current;
      phaseStartTimeRef.current += pauseDuration;
      pausedAtRef.current = null;
      audioEngine.resumeAmbient();

      // Recalculate remaining seconds of current phase and re-sync Energy track pitch
      const curPhase = phaseRef.current;
      const curPattern = patternRef.current;
      const durationSec = getPhaseDuration(curPhase, curPattern);
      const elapsedMs = performance.now() - phaseStartTimeRef.current;
      const remainingSec = Math.max(0.5, (durationSec * 1000 - elapsedMs) / 1000);
      audioEngine.syncEnergyPhase(curPhase, remainingSec);
    }
  }, [isPaused]);

  useEffect(() => {
    isCompletedRef.current = isCompleted;
  }, [isCompleted]);

  // Screen Wake Lock API
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

  // Session seconds countdown
  useEffect(() => {
    if (!isSessionStarted || isPaused || isCompleted) return;

    const interval = window.setInterval(() => {
      completedSecondsRef.current += 1;
      setSessionRemainingSec((prev) => {
        if (prev <= 1) {
          // Timer reached zero: Do NOT abruptly stop!
          // Extend slightly to cleanly complete the current breath through exhale (< 20s extension)
          setIsFinishingOnExhale(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => window.clearInterval(interval);
  }, [isSessionStarted, isPaused, isCompleted]);

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

  // Main 60 FPS animation & phase transition loop
  useEffect(() => {
    let animFrameId: number;

    const loop = (now: number) => {
      if (isSessionStartedRef.current && !isPausedRef.current && !isCompletedRef.current) {
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
          const eased = easeInOutSine(rawFraction);
          currentFill = eased;
          scale = 0.90 + 0.25 * eased;
        } else if (curPhase === 'hold1') {
          currentFill = 1.0;
          scale = 1.15 + 0.015 * Math.sin(now * 0.003);
        } else if (curPhase === 'exhale') {
          const eased = easeInOutSine(rawFraction);
          currentFill = 1.0 - eased;
          scale = 1.15 - 0.27 * eased;
        } else if (curPhase === 'hold2') {
          currentFill = 0.0;
          scale = 0.88;
        }

        setFillProgress(currentFill);
        setOrbScale(scale);

        // 2. Numerical countdown display
        const secRemaining = Math.max(0, Math.ceil(durationSec * (1 - rawFraction)));
        setPhaseSecRemaining(secRemaining);

        // 3. Handle phase completion and transition
        if (elapsedMs >= durationMs) {
          // EXHALE COMPLETION RULE:
          // A cycle completes after exhale (or after hold2 if hold2 > 0).
          const isCycleEndingPhase = (curPhase === 'exhale' && curPattern.hold2 === 0) || curPhase === 'hold2';

          if (isCycleEndingPhase) {
            // Check session ending conditions:
            // Condition A: <= 20 seconds remaining -> end session early on this exhale!
            // Condition B: Timer expired (< 20s extension used) -> complete on this exhale!
            const remaining = sessionRemainingSecRef.current;
            if (remaining <= 20 || isFinishingOnExhaleRef.current) {
              setIsCompleted(true);
              isCompletedRef.current = true;
              // Stop ambient sound and play unique calm session end wash!
              audioEngine.playSessionEndSound();
              return;
            }
          }

          let nextPhase: BreathPhase = 'inhale';

          if (curPhase === 'inhale') {
            nextPhase = curPattern.hold1 > 0 ? 'hold1' : 'exhale';
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

          const nextDurationSec = getPhaseDuration(nextPhase, curPattern);

          // 1. Sync procedural 'Energy' track frequency/filter/gain with closed-eyes breath guidance
          audioEngine.syncEnergyPhase(nextPhase, nextDurationSec);

          // 2. Sync Buddhist Singing Bowl wooden mallet strike with breathing style
          audioEngine.syncBreathTransition(nextPhase);

          // 3. Play resonant transition bell sound (with automatic ambient ducking for pristine clarity)
          if (transitionBellEnabledRef.current) {
            audioEngine.playTransitionCue(
              selectedBellRef.current.bellType || selectedBellRef.current.id,
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
      audioEngine.playTrack(currentTrack.audioType);
      audioEngine.syncEnergyPhase(phaseRef.current, getPhaseDuration(phaseRef.current, patternRef.current));
      setSoundPlaying(true);
    }
  };

  const handleSelectNewTrack = (track: SoundscapeTrack) => {
    if (onChangeTrack) {
      onChangeTrack(track);
    }
    audioEngine.playTrack(track.audioType);
    audioEngine.syncEnergyPhase(phaseRef.current, getPhaseDuration(phaseRef.current, patternRef.current));
    setSoundPlaying(true);
    setShowSoundModal(false);
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
  const strokeDashoffset = circumference * (1 - fillProgress);

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

      {/* Top Breath Timing Pill */}
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

      {/* Center Breathing Orb Ring */}
      <div className="relative w-72 h-72 sm:w-80 sm:h-80 flex items-center justify-center my-2">
        {/* Outer Dynamic Aura Glow */}
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

          {/* Active Glowing Circle Ring */}
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

          {/* Orbiting Progress Bead */}
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

        {/* 3-Second "Get Ready" Preparation Overlay */}
        {!isSessionStarted ? (
          <div className="flex flex-col items-center justify-center text-center z-20 space-y-2 p-6 animate-fade-in">
            <span className="text-xs uppercase tracking-widest text-primary font-semibold">
              Get Ready
            </span>
            <div className="w-20 h-20 rounded-full bg-primary/15 border border-primary/30 flex items-center justify-center shadow-[0_0_30px_rgba(125,211,252,0.3)] animate-pulse">
              <span className="text-4xl font-headline font-bold text-primary">
                {readyCountdown}
              </span>
            </div>
            <p className="text-[11px] text-on-surface-variant max-w-[180px]">
              Settle into your posture and relax your shoulders
            </p>
            <button
              type="button"
              onClick={() => {
                setReadyCountdown(0);
                phaseStartTimeRef.current = performance.now();
                if (transitionBellEnabledRef.current) {
                  audioEngine.playTransitionCue(selectedBellRef.current.bellType || selectedBellRef.current.id, 432);
                }
                audioEngine.syncEnergyPhase('inhale', getPhaseDuration('inhale', patternRef.current));
                audioEngine.syncBreathTransition('inhale');
              }}
              className="text-[10px] text-primary/80 hover:text-primary font-medium tracking-wider uppercase pt-1 cursor-pointer focus:outline-none"
            >
              Start Now ›
            </button>
          </div>
        ) : (
          /* Center Breathing Status Text */
          <div
            className="flex flex-col items-center justify-center text-center z-10 pointer-events-none"
            style={{ transform: `scale(${orbScale})` }}
          >
            <div className="text-secondary mb-1">
              <span className="material-symbols-outlined text-xl">
                {isPaused ? 'play_arrow' : 'pause'}
              </span>
            </div>

            <h2 className="text-xl font-headline font-bold tracking-widest text-on-surface">
              {currentDisplay.label}
            </h2>

            <p className="text-[11px] font-medium tracking-wider uppercase text-on-surface-variant mt-0.5">
              {currentDisplay.subtext}
            </p>

            <div className="text-3xl font-headline font-bold text-tertiary tracking-tight mt-2 drop-shadow-[0_0_12px_rgba(200,160,240,0.5)]">
              {formatSeconds(phaseSecRemaining)}
            </div>
          </div>
        )}
      </div>

      {/* Finishing on Exhale Notification Badge */}
      {(isFinishingOnExhale || (isSessionStarted && sessionRemainingSec <= 20)) && !isCompleted && (
        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-secondary-container/40 border border-secondary/30 text-secondary text-[11px] font-medium animate-pulse mb-2">
          <span className="material-symbols-outlined text-xs">south</span>
          <span>Concluding peacefully on exhale</span>
        </div>
      )}

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

        {/* Card 2: In-Session Sound Track Switcher */}
        <button
          type="button"
          onClick={() => setShowSoundModal(true)}
          className="bg-surface-container/60 backdrop-blur-xl rounded-xl p-3 flex flex-col justify-between items-center text-center shadow-md border border-outline-variant/30 active:scale-95 transition-transform focus:outline-none cursor-pointer group"
          title="Tap to change or toggle sound track"
        >
          <div className="flex items-center gap-1">
            <span className="material-symbols-outlined text-primary text-base">music_note</span>
            <span className="text-[9px] text-on-surface-variant uppercase font-semibold">Track</span>
          </div>
          <span className="text-xs font-semibold text-on-surface truncate w-full mt-1 group-hover:text-primary transition-colors">
            {currentTrack.title}
          </span>
          <span className="text-[10px] font-bold tracking-wider text-primary uppercase mt-1 flex items-center gap-0.5">
            <span>{soundPlaying ? 'PLAYING' : 'MUTED'}</span>
            <span className="material-symbols-outlined text-[12px]">expand_more</span>
          </span>
        </button>

        {/* Card 3: Transition Bell Indicator & Preview */}
        <button
          type="button"
          onClick={() => audioEngine.playTransitionCue(selectedBell.bellType || selectedBell.id, selectedBell.pitchHz)}
          className="bg-surface-container/60 backdrop-blur-xl rounded-xl p-3 flex flex-col justify-between items-center text-center shadow-md border border-outline-variant/30 active:scale-95 transition-transform focus:outline-none cursor-pointer"
          title="Tap to preview transition chime"
        >
          <div className="flex items-center gap-1">
            <span className="material-symbols-outlined text-tertiary text-base">notifications</span>
            <span className="text-[9px] text-on-surface-variant uppercase font-semibold">Cue</span>
          </div>
          <span className="text-xs font-semibold text-on-surface truncate w-full mt-1">
            {selectedBell.name}
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
        <button
          type="button"
          onClick={() => {
            audioEngine.stopAmbient();
            onEndSession(completedSecondsRef.current);
          }}
          className="py-3 px-4 rounded-xl bg-surface-container-high/70 backdrop-blur-xl border border-outline-variant/40 text-on-surface text-xs font-semibold flex items-center justify-center gap-1.5 hover:bg-surface-container-highest/80 active:scale-95 transition-all cursor-pointer"
        >
          <span className="material-symbols-outlined text-sm text-on-surface-variant">close</span>
          <span>End Session</span>
        </button>

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

      {/* In-Session Sound Track Switcher Modal */}
      {showSoundModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-md p-4 animate-fade-in">
          <div className="w-full max-w-sm bg-surface-container/95 border border-primary/30 rounded-2xl p-5 shadow-2xl space-y-4 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-headline font-semibold text-on-surface">
                  Change Ambient Sound
                </h4>
                <p className="text-[11px] text-on-surface-variant">
                  Select a calming soundscape for this session
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowSoundModal(false)}
                className="text-on-surface-variant hover:text-on-surface p-1"
              >
                <span className="material-symbols-outlined text-lg">close</span>
              </button>
            </div>

            {/* Mute/Play Quick Toggle Button */}
            <button
              type="button"
              onClick={toggleSound}
              className={`w-full py-2.5 px-3 rounded-xl flex items-center justify-center gap-2 text-xs font-semibold border transition-all ${
                soundPlaying
                  ? 'bg-primary/20 border-primary/40 text-primary'
                  : 'bg-surface-container-highest border-outline-variant text-on-surface-variant'
              }`}
            >
              <span className="material-symbols-outlined text-base">
                {soundPlaying ? 'volume_up' : 'volume_off'}
              </span>
              <span>{soundPlaying ? 'Audio Playing (Tap to Mute)' : 'Audio Muted (Tap to Play)'}</span>
            </button>

            {/* All 6 Soundscapes */}
            <div className="space-y-2">
              {SOUNDSCAPE_TRACKS.map((track) => {
                const isCurrent = currentTrack.id === track.id;
                return (
                  <div
                    key={track.id}
                    onClick={() => handleSelectNewTrack(track)}
                    className={`p-2.5 rounded-xl border flex items-center justify-between gap-3 cursor-pointer transition-all ${
                      isCurrent
                        ? 'bg-primary/20 border-primary/50 shadow-[0_0_12px_rgba(125,211,252,0.2)]'
                        : 'bg-surface-container-high/50 border-outline-variant/30 hover:bg-surface-container-high'
                    }`}
                  >
                    <div className="w-10 h-10 rounded-lg overflow-hidden flex-shrink-0">
                      <img src={track.imageUrl} alt={track.title} className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-semibold text-on-surface truncate">
                          {track.title}
                        </span>
                        <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-primary/15 text-primary">
                          {track.tag}
                        </span>
                      </div>
                      <p className="text-[10px] text-on-surface-variant truncate">
                        {track.subtitle}
                      </p>
                    </div>
                    {isCurrent && (
                      <span className="material-symbols-outlined text-primary text-base">
                        check_circle
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

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
                You completed {Math.max(1, Math.round(completedSecondsRef.current / 60))} mindful minutes of conscious breathwork.
              </p>
            </div>
            <div className="flex items-center gap-2 py-1.5 px-3 rounded-full bg-primary/15 text-primary text-xs font-semibold">
              <span className="material-symbols-outlined text-sm">local_fire_department</span>
              <span>Session Concluded On Exhale!</span>
            </div>
            <button
              type="button"
              onClick={() => {
                audioEngine.stopAmbient();
                onEndSession(completedSecondsRef.current);
              }}
              className="w-full py-2.5 rounded-xl bg-primary text-on-primary font-semibold text-xs shadow-md active:scale-95 transition-all cursor-pointer"
            >
              Done &amp; View Progress
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
