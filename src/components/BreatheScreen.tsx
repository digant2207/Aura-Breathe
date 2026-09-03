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
  const [cycleProgress, setCycleProgress] = useState<number>(0); // 0 to 1

  // Rounds
  const totalCycleSeconds = Math.max(1, pattern.inhale + pattern.hold1 + pattern.exhale + pattern.hold2);
  const calculatedTotalRounds = Math.max(1, Math.round(totalSessionSec / totalCycleSeconds));
  const [currentRound, setCurrentRound] = useState<number>(1);
  const completedSecondsRef = useRef<number>(0);

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

  // Main session timer interval
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

      // Breath phase step countdown
      setPhaseSecRemaining((prevSec) => {
        if (prevSec <= 1) {
          // Transition to next phase
          let nextPhase: BreathPhase = 'inhale';
          let nextSec = 4;

          if (phase === 'inhale') {
            if (pattern.hold1 > 0) {
              nextPhase = 'hold1';
              nextSec = pattern.hold1;
            } else {
              nextPhase = 'exhale';
              nextSec = pattern.exhale;
            }
          } else if (phase === 'hold1') {
            nextPhase = 'exhale';
            nextSec = pattern.exhale;
          } else if (phase === 'exhale') {
            if (pattern.hold2 > 0) {
              nextPhase = 'hold2';
              nextSec = pattern.hold2;
            } else {
              nextPhase = 'inhale';
              nextSec = pattern.inhale;
              setCurrentRound((r) => Math.min(calculatedTotalRounds, r + 1));
            }
          } else if (phase === 'hold2') {
            nextPhase = 'inhale';
            nextSec = pattern.inhale;
            setCurrentRound((r) => Math.min(calculatedTotalRounds, r + 1));
          }

          setPhase(nextPhase);
          if (transitionBellEnabled) {
            audioEngine.playTransitionChime(nextPhase === 'inhale' ? 432 : nextPhase === 'hold1' ? 324 : 216);
          }
          return nextSec;
        }
        return prevSec - 1;
      });
    }, 1000);

    return () => window.clearInterval(interval);
  }, [isPaused, isCompleted, phase, pattern, calculatedTotalRounds, transitionBellEnabled]);

  // Smooth sub-second cycle progress animation
  useEffect(() => {
    let animFrame: number;
    const updateProgress = () => {
      const currentPhaseDuration =
        phase === 'inhale'
          ? pattern.inhale
          : phase === 'hold1'
          ? pattern.hold1
          : phase === 'exhale'
          ? pattern.exhale
          : pattern.hold2;

      const progressFraction = Math.max(0, Math.min(1, 1 - phaseSecRemaining / Math.max(1, currentPhaseDuration)));
      setCycleProgress(progressFraction);
      animFrame = requestAnimationFrame(updateProgress);
    };

    animFrame = requestAnimationFrame(updateProgress);
    return () => cancelAnimationFrame(animFrame);
  }, [phase, phaseSecRemaining, pattern]);

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
        return { label: 'INHALE', subtext: 'EXPAND GENTLY', scale: 1.15 };
      case 'hold1':
        return { label: 'HOLD', subtext: 'SUSTAIN SOFTLY', scale: 1.15 };
      case 'exhale':
        return { label: 'EXHALE', subtext: 'RELEASE FULLY', scale: 0.88 };
      case 'hold2':
        return { label: 'REST', subtext: 'STILLNESS', scale: 0.88 };
    }
  };

  const currentDisplay = getPhaseDisplay();

  // Angle for circular bead indicator
  const beadAngle = cycleProgress * 360;
  const beadRadius = 142; // px
  const beadX = 160 + beadRadius * Math.cos(((beadAngle - 90) * Math.PI) / 180);
  const beadY = 160 + beadRadius * Math.sin(((beadAngle - 90) * Math.PI) / 180);

  return (
    <div className="flex flex-col items-center w-full max-w-md mx-auto px-4 pb-28 pt-2 relative select-none">
      {/* Background Ambience Glow */}
      <div className="absolute top-20 left-1/2 -translate-x-1/2 w-72 h-72 bg-primary/10 rounded-full blur-3xl pointer-events-none" />

      {/* Top Breath Timing Pill: • 4 • 8 • 4 • 0 */}
      <div className="flex items-center gap-3 px-4 py-1.5 rounded-full bg-surface-container/60 backdrop-blur-xl border border-outline-variant/30 text-xs font-mono tracking-widest text-on-surface shadow-sm mb-6">
        <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
        <span>{pattern.inhale}</span>
        <span className="text-on-surface-variant">•</span>
        <span>{pattern.hold1}</span>
        <span className="text-on-surface-variant">•</span>
        <span>{pattern.exhale}</span>
        <span className="text-on-surface-variant">•</span>
        <span>{pattern.hold2}</span>
      </div>

      {/* Center Breathing Orb Ring */}
      <div className="relative w-80 h-80 flex items-center justify-center my-3">
        {/* Outer Aura Glow */}
        <div
          className="absolute inset-4 rounded-full bg-primary/15 blur-2xl transition-transform duration-1000 ease-in-out"
          style={{ transform: `scale(${currentDisplay.scale})` }}
        />

        {/* SVG Circular Ring and Orbiting Bead */}
        <svg className="w-80 h-80 absolute inset-0 -rotate-90 pointer-events-none" viewBox="0 0 320 320">
          <defs>
            <linearGradient id="ringGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#7dd3fc" />
              <stop offset="50%" stopColor="#88b4cc" />
              <stop offset="100%" stopColor="#c8a0f0" />
            </linearGradient>
            <filter id="glow">
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
            stroke="rgba(125, 211, 252, 0.15)"
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
            strokeDasharray={2 * Math.PI * beadRadius}
            strokeDashoffset={2 * Math.PI * beadRadius * (1 - cycleProgress)}
            filter="url(#glow)"
            className="transition-[stroke-dashoffset] duration-300"
          />

          {/* Progress Bead */}
          <circle
            cx={beadX}
            cy={beadY}
            r="6"
            fill="#ffffff"
            className="shadow-[0_0_12px_#ffffff]"
            filter="url(#glow)"
          />
        </svg>

        {/* Center Text Information */}
        <div
          className="flex flex-col items-center justify-center text-center z-10 transition-transform duration-1000 ease-in-out"
          style={{ transform: `scale(${currentDisplay.scale})` }}
        >
          {/* Pause / Flow indicator */}
          <div className="text-secondary mb-1">
            <span className="material-symbols-outlined text-xl">
              {isPaused ? 'play_arrow' : 'pause'}
            </span>
          </div>

          {/* Phase Name: INHALE / HOLD / EXHALE / REST */}
          <h2 className="text-lg font-headline font-bold tracking-widest text-on-surface">
            {currentDisplay.label}
          </h2>

          {/* Subtext: SUSTAIN SOFTLY */}
          <p className="text-[11px] font-medium tracking-wider uppercase text-on-surface-variant mt-0.5">
            {currentDisplay.subtext}
          </p>

          {/* Phase Digital Countdown */}
          <div className="text-3xl font-headline font-bold text-tertiary tracking-tight mt-2 drop-shadow-[0_0_10px_rgba(200,160,240,0.4)]">
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

        {/* Card 2: Glacial Rain */}
        <button
          type="button"
          onClick={toggleSound}
          className="bg-surface-container/60 backdrop-blur-xl rounded-xl p-3 flex flex-col justify-between items-center text-center shadow-md border border-outline-variant/30 active:scale-95 transition-transform focus:outline-none"
        >
          <span className="material-symbols-outlined text-primary text-base">water_drop</span>
          <span className="text-xs font-semibold text-on-surface truncate w-full mt-1">
            {activeSoundName}
          </span>
          <span className="text-[10px] font-bold tracking-wider text-primary uppercase mt-1">
            {soundPlaying ? 'PLAYING' : 'MUTED'}
          </span>
        </button>

        {/* Card 3: Aurora Chimes */}
        <button
          type="button"
          onClick={() => audioEngine.playTransitionChime(432)}
          className="bg-surface-container/60 backdrop-blur-xl rounded-xl p-3 flex flex-col justify-between items-center text-center shadow-md border border-outline-variant/30 active:scale-95 transition-transform focus:outline-none"
          title="Tap to preview chime"
        >
          <span className="material-symbols-outlined text-tertiary text-base">graphic_eq</span>
          <span className="text-xs font-semibold text-on-surface truncate w-full mt-1">
            Aurora Chimes
          </span>
          <span className="text-[10px] font-bold tracking-wider text-tertiary uppercase mt-1">
            432HZ
          </span>
        </button>
      </div>

      {/* Session Remaining Pill */}
      <div className="flex items-center justify-center gap-2 px-5 py-2 rounded-full bg-surface-container/60 backdrop-blur-xl border border-outline-variant/30 text-xs font-medium text-on-surface mt-5 shadow-sm">
        <span className="material-symbols-outlined text-primary text-[16px]">schedule</span>
        <span>Session Remaining:</span>
        <span className="font-mono font-bold text-primary tracking-wide">
          {formatSeconds(sessionRemainingSec)}
        </span>
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
