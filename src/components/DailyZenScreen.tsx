import React, { useState } from 'react';
import { BreathPattern, TabType } from '../types';
import { ASSETS, DEFAULT_PATTERNS } from '../data/mockData';

interface DailyZenScreenProps {
  onStartSession: (durationMin: number, pattern: BreathPattern, soundName?: string) => void;
  onNavigate: (tab: TabType) => void;
  selectedDuration: number;
  setSelectedDuration: (min: number) => void;
  activePattern: BreathPattern;
  setActivePattern: (pattern: BreathPattern) => void;
  customSlots: BreathPattern[];
  onSaveCustomSlot: (pattern: BreathPattern, slotIndex: number) => void;
}

export const DailyZenScreen: React.FC<DailyZenScreenProps> = ({
  onStartSession,
  onNavigate,
  selectedDuration,
  setSelectedDuration,
  activePattern,
  setActivePattern,
  customSlots,
  onSaveCustomSlot,
}) => {
  const [customMinutesInput, setCustomMinutesInput] = useState<string>('');
  const [activeSlotIndex, setActiveSlotIndex] = useState<number>(0);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);

  // Time-of-day greeting
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) return 'Good morning';
    if (hour >= 12 && hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const handleSelectPresetDuration = (mins: number) => {
    setSelectedDuration(mins);
    setCustomMinutesInput('');
  };

  const handleCustomDurationChange = (val: string) => {
    setCustomMinutesInput(val);
    const parsed = parseInt(val, 10);
    if (!isNaN(parsed) && parsed >= 1 && parsed <= 120) {
      setSelectedDuration(parsed);
    }
  };

  const handleStepPhase = (phaseKey: 'inhale' | 'hold1' | 'exhale' | 'hold2', delta: number) => {
    const updated = {
      ...activePattern,
      [phaseKey]: Math.max(0, Math.min(30, (activePattern[phaseKey] || 0) + delta)),
      name: 'Custom Flow',
    };
    setActivePattern(updated);
  };

  const handleSaveCurrentSlot = () => {
    onSaveCustomSlot(
      {
        ...activePattern,
        name: `Custom ${activePattern.inhale}-${activePattern.hold1}-${activePattern.exhale}-${activePattern.hold2}`,
      },
      activeSlotIndex
    );
    setSaveSuccessMsg(`Saved to Slot ${activeSlotIndex === 0 ? 'A' : activeSlotIndex === 1 ? 'B' : 'C'}!`);
    setTimeout(() => setSaveSuccessMsg(null), 2500);
  };

  return (
    <div className="flex flex-col w-full max-w-md mx-auto px-4 pb-28 space-y-6">
      {/* Ambient Light Orbs (Background Glows) */}
      <div className="relative w-full">
        <div className="absolute -top-12 left-1/4 w-48 h-48 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-24 -right-8 w-40 h-40 bg-tertiary/10 rounded-full blur-3xl pointer-events-none" />

        {/* Top Greeting Section */}
        <div className="relative pt-3 pb-1 flex flex-col space-y-1">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs uppercase tracking-widest text-primary font-medium">
                Breathe · Release
              </span>
              <h2 className="text-2xl font-headline font-semibold text-on-surface tracking-tight">
                {getGreeting()}
              </h2>
            </div>
            <div className="flex items-center space-x-1.5 px-3 py-1.5 rounded-full bg-surface-container-high/80 backdrop-blur-md shadow-sm border border-outline-variant/30">
              <span className="inline-block w-2 h-2 rounded-full bg-primary animate-pulse" />
              <span className="text-xs font-medium text-on-surface-variant">Zen State</span>
            </div>
          </div>
          <p className="text-sm text-on-surface-variant/90 italic flex items-center gap-1.5 pt-0.5">
            <span className="material-symbols-outlined text-[16px] text-primary">format_quote</span>
            “Inhale peace, exhale noise”
          </p>
        </div>
      </div>

      {/* Featured Quick Start Duration Glass Card */}
      <div className="relative rounded-2xl p-4 bg-surface-container/60 backdrop-blur-xl shadow-lg space-y-3.5 border border-outline-variant/30">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <div className="flex items-center gap-1.5">
              <span className="material-symbols-outlined text-primary text-[18px]">timer</span>
              <h3 className="text-sm font-headline font-semibold text-on-surface tracking-tight">
                How much time do you have to relax?
              </h3>
            </div>
            <p className="text-[11px] text-on-surface-variant">
              Select or enter your meditation duration (1–60 min)
            </p>
          </div>
        </div>

        {/* 4 Preset Duration Buttons */}
        <div className="grid grid-cols-4 gap-2">
          {[5, 10, 15, 30].map((mins) => {
            const isSelected = selectedDuration === mins && !customMinutesInput;
            return (
              <button
                key={mins}
                type="button"
                onClick={() => handleSelectPresetDuration(mins)}
                className={`py-2 px-1 rounded-xl text-center text-xs transition-all active:scale-95 focus:outline-none ${
                  isSelected
                    ? 'font-semibold bg-primary text-on-primary shadow-[0_0_15px_rgba(125,211,252,0.3)]'
                    : 'font-medium bg-surface-container-high/60 text-on-surface-variant hover:text-on-surface'
                }`}
              >
                {mins} min
              </button>
            );
          })}
        </div>

        {/* Custom Length Input */}
        <div className="flex items-center justify-between p-2.5 rounded-xl bg-surface-container-high/50 border border-outline-variant/40">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px] text-secondary-fixed-dim">tune</span>
            <span className="text-xs font-medium text-on-surface-variant">Custom length:</span>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="number"
              min="1"
              max="60"
              placeholder="e.g. 20"
              value={customMinutesInput}
              onChange={(e) => handleCustomDurationChange(e.target.value)}
              className="w-20 px-2.5 py-1 text-xs text-center rounded-lg bg-surface-container-lowest border border-outline-variant/50 text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:border-primary"
            />
            <span className="text-xs font-medium text-secondary-fixed-dim">min</span>
          </div>
        </div>
      </div>

      {/* Breathing Rhythm & Style Card */}
      <div className="relative rounded-2xl p-4 bg-surface-container/60 backdrop-blur-xl shadow-lg space-y-4 border border-outline-variant/30">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <div className="flex items-center gap-1.5">
              <span className="material-symbols-outlined text-primary text-[18px]">air</span>
              <h3 className="text-sm font-headline font-semibold text-on-surface tracking-tight">
                Breathing Rhythm & Style
              </h3>
            </div>
            <p className="text-[11px] text-on-surface-variant">
              Customize your cycle timings (in seconds) or choose a pattern
            </p>
          </div>
          <span className="px-2 py-0.5 rounded-full bg-primary/10 border border-primary/20 text-[10px] font-medium text-primary uppercase tracking-wider">
            Customizer
          </span>
        </div>

        {/* Preset Pattern Pills */}
        <div className="flex space-x-2 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-none snap-x">
          {DEFAULT_PATTERNS.map((p) => {
            const isPatternActive =
              activePattern.inhale === p.inhale &&
              activePattern.hold1 === p.hold1 &&
              activePattern.exhale === p.exhale &&
              activePattern.hold2 === p.hold2;
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => setActivePattern(p)}
                className={`snap-start flex-shrink-0 px-3 py-1.5 rounded-xl text-xs transition-all active:scale-95 focus:outline-none ${
                  isPatternActive
                    ? 'font-semibold bg-primary text-on-primary shadow-[0_0_15px_rgba(125,211,252,0.25)]'
                    : 'font-medium bg-surface-container-high/60 text-on-surface-variant hover:text-on-surface'
                }`}
              >
                {p.name}
              </button>
            );
          })}
        </div>

        {/* 4 Interactive Phase Counters */}
        <div className="grid grid-cols-4 gap-2">
          {/* INHALE */}
          <div className="flex flex-col items-center justify-between p-2.5 rounded-xl bg-surface-container-high/50 border border-outline-variant/40 space-y-1.5">
            <div className="flex items-center gap-1 text-[10px] font-semibold text-primary uppercase tracking-wider">
              <span className="material-symbols-outlined text-[14px]">north</span>
              <span>Inhale</span>
            </div>
            <div className="text-base font-headline font-semibold text-on-surface">
              {activePattern.inhale}
              <span className="text-[11px] font-normal text-secondary-fixed-dim">s</span>
            </div>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => handleStepPhase('inhale', -1)}
                className="w-6 h-6 rounded-lg bg-surface-container-lowest border border-outline-variant/50 text-on-surface flex items-center justify-center text-xs active:scale-90 hover:border-primary"
                title="Decrease Inhale"
              >
                <span className="material-symbols-outlined text-[12px]">remove</span>
              </button>
              <button
                type="button"
                onClick={() => handleStepPhase('inhale', 1)}
                className="w-6 h-6 rounded-lg bg-surface-container-lowest border border-outline-variant/50 text-on-surface flex items-center justify-center text-xs active:scale-90 hover:border-primary"
                title="Increase Inhale"
              >
                <span className="material-symbols-outlined text-[12px]">add</span>
              </button>
            </div>
          </div>

          {/* HOLD 1 */}
          <div className="flex flex-col items-center justify-between p-2.5 rounded-xl bg-surface-container-high/50 border border-outline-variant/40 space-y-1.5">
            <div className="flex items-center gap-1 text-[10px] font-semibold text-secondary-fixed uppercase tracking-wider">
              <span className="material-symbols-outlined text-[14px]">pause</span>
              <span>Hold</span>
            </div>
            <div className="text-base font-headline font-semibold text-on-surface">
              {activePattern.hold1}
              <span className="text-[11px] font-normal text-secondary-fixed-dim">s</span>
            </div>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => handleStepPhase('hold1', -1)}
                className="w-6 h-6 rounded-lg bg-surface-container-lowest border border-outline-variant/50 text-on-surface flex items-center justify-center text-xs active:scale-90 hover:border-primary"
                title="Decrease Hold"
              >
                <span className="material-symbols-outlined text-[12px]">remove</span>
              </button>
              <button
                type="button"
                onClick={() => handleStepPhase('hold1', 1)}
                className="w-6 h-6 rounded-lg bg-surface-container-lowest border border-outline-variant/50 text-on-surface flex items-center justify-center text-xs active:scale-90 hover:border-primary"
                title="Increase Hold"
              >
                <span className="material-symbols-outlined text-[12px]">add</span>
              </button>
            </div>
          </div>

          {/* EXHALE */}
          <div className="flex flex-col items-center justify-between p-2.5 rounded-xl bg-surface-container-high/50 border border-outline-variant/40 space-y-1.5">
            <div className="flex items-center gap-1 text-[10px] font-semibold text-primary uppercase tracking-wider">
              <span className="material-symbols-outlined text-[14px]">south</span>
              <span>Exhale</span>
            </div>
            <div className="text-base font-headline font-semibold text-on-surface">
              {activePattern.exhale}
              <span className="text-[11px] font-normal text-secondary-fixed-dim">s</span>
            </div>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => handleStepPhase('exhale', -1)}
                className="w-6 h-6 rounded-lg bg-surface-container-lowest border border-outline-variant/50 text-on-surface flex items-center justify-center text-xs active:scale-90 hover:border-primary"
                title="Decrease Exhale"
              >
                <span className="material-symbols-outlined text-[12px]">remove</span>
              </button>
              <button
                type="button"
                onClick={() => handleStepPhase('exhale', 1)}
                className="w-6 h-6 rounded-lg bg-surface-container-lowest border border-outline-variant/50 text-on-surface flex items-center justify-center text-xs active:scale-90 hover:border-primary"
                title="Increase Exhale"
              >
                <span className="material-symbols-outlined text-[12px]">add</span>
              </button>
            </div>
          </div>

          {/* REST / HOLD 2 */}
          <div className="flex flex-col items-center justify-between p-2.5 rounded-xl bg-surface-container-high/50 border border-outline-variant/40 space-y-1.5">
            <div className="flex items-center gap-1 text-[10px] font-semibold text-tertiary uppercase tracking-wider">
              <span className="material-symbols-outlined text-[14px]">hourglass_empty</span>
              <span>Rest</span>
            </div>
            <div className="text-base font-headline font-semibold text-on-surface">
              {activePattern.hold2}
              <span className="text-[11px] font-normal text-secondary-fixed-dim">s</span>
            </div>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => handleStepPhase('hold2', -1)}
                className="w-6 h-6 rounded-lg bg-surface-container-lowest border border-outline-variant/50 text-on-surface flex items-center justify-center text-xs active:scale-90 hover:border-primary"
                title="Decrease Rest"
              >
                <span className="material-symbols-outlined text-[12px]">remove</span>
              </button>
              <button
                type="button"
                onClick={() => handleStepPhase('hold2', 1)}
                className="w-6 h-6 rounded-lg bg-surface-container-lowest border border-outline-variant/50 text-on-surface flex items-center justify-center text-xs active:scale-90 hover:border-primary"
                title="Increase Rest"
              >
                <span className="material-symbols-outlined text-[12px]">add</span>
              </button>
            </div>
          </div>
        </div>

        {/* Custom Patterns Slots (A, B, C) */}
        <div className="space-y-2 pt-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-on-surface-variant">
              My Custom Patterns (Slots A, B, C)
            </span>
            <button
              type="button"
              onClick={handleSaveCurrentSlot}
              className="text-[11px] font-medium text-primary flex items-center gap-1 hover:underline focus:outline-none"
            >
              <span className="material-symbols-outlined text-[13px]">bookmark</span>
              <span>Save current</span>
            </button>
          </div>

          {saveSuccessMsg && (
            <div className="text-[11px] text-primary font-medium bg-primary/10 border border-primary/20 px-2.5 py-1 rounded-lg animate-fade-in">
              {saveSuccessMsg}
            </div>
          )}

          <div className="grid grid-cols-3 gap-2">
            {customSlots.map((slot, index) => {
              const isSelected = activeSlotIndex === index;
              return (
                <div
                  key={slot.id}
                  onClick={() => {
                    setActiveSlotIndex(index);
                    setActivePattern(slot);
                  }}
                  className={`p-2.5 rounded-xl border flex flex-col justify-between space-y-1 cursor-pointer transition-all active:scale-95 ${
                    isSelected
                      ? 'bg-surface-container-high/60 border-primary/40 shadow-[0_0_12px_rgba(125,211,252,0.15)]'
                      : 'bg-surface-container-high/40 border-outline-variant/30 hover:border-outline-variant/60'
                  }`}
                >
                  <div className="text-xs font-semibold text-on-surface truncate">
                    {slot.name}
                  </div>
                  <div className="text-[10px] text-secondary-fixed-dim font-mono">
                    {slot.inhale}-{slot.hold1}-{slot.exhale}-{slot.hold2}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Prominent CTA to Start Session */}
        <button
          type="button"
          onClick={() => onStartSession(selectedDuration, activePattern)}
          className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-primary via-primary to-secondary text-on-primary font-headline font-semibold text-sm flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(125,211,252,0.35)] hover:shadow-[0_0_28px_rgba(125,211,252,0.5)] transition-all active:scale-[0.98] cursor-pointer"
        >
          <span className="material-symbols-outlined text-[18px]">play_circle</span>
          <span>Start Breathe Session ({selectedDuration} Min)</span>
        </button>
      </div>

      {/* Recommended For You Carousel */}
      <div className="space-y-3 pb-2">
        <div className="flex items-center justify-between px-1">
          <div>
            <h3 className="text-sm font-headline font-semibold text-on-surface">Recommended For You</h3>
            <p className="text-[11px] text-on-surface-variant">Tailored to your evening stillness</p>
          </div>
          <button
            onClick={() => onNavigate('soundscapes')}
            className="text-xs font-medium text-primary flex items-center gap-0.5 hover:underline"
          >
            <span>View all</span>
            <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
          </button>
        </div>

        {/* Horizontal scroll cards */}
        <div className="flex space-x-3.5 overflow-x-auto pb-2 pt-1 -mx-4 px-4 scrollbar-none snap-x snap-mandatory">
          {/* Card 1: Stress Relief */}
          <div
            onClick={() => {
              const pattern = {
                id: 'stress-relief',
                name: 'Stress Relief (4-4-6-2)',
                inhale: 4,
                hold1: 4,
                exhale: 6,
                hold2: 2,
                description: 'Vagus nerve reset',
              };
              onStartSession(3, pattern, 'Glacial Rain');
            }}
            className="min-w-[210px] w-[210px] snap-start rounded-2xl bg-surface-container/60 backdrop-blur-xl shadow-lg p-3.5 flex flex-col justify-between space-y-3 transition-transform active:scale-[0.98] cursor-pointer border border-outline-variant/30 hover:border-primary/40"
          >
            <div className="relative h-28 w-full rounded-xl overflow-hidden">
              <img
                src={ASSETS.stressRelief}
                alt="Stress Relief"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-surface-dim via-transparent to-transparent" />
              <div className="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-surface-dim/80 backdrop-blur-md flex items-center gap-1">
                <span className="material-symbols-outlined text-primary text-[12px]">schedule</span>
                <span className="text-[10px] font-semibold text-on-surface">3 min</span>
              </div>
              <div className="absolute bottom-2 right-2 w-7 h-7 rounded-full bg-primary/90 text-on-primary flex items-center justify-center shadow-md">
                <span
                  className="material-symbols-outlined text-[16px]"
                  style={{ fontVariationSettings: "'FILL' 1" }}
                >
                  play_arrow
                </span>
              </div>
            </div>
            <div className="space-y-1">
              <span className="text-[10px] font-semibold text-primary uppercase tracking-wider">
                Tension Reset
              </span>
              <h4 className="text-sm font-semibold text-on-surface truncate">Stress Relief</h4>
              <p className="text-[11px] text-on-surface-variant line-clamp-1">
                Quick vagus nerve reset
              </p>
            </div>
          </div>

          {/* Card 2: Morning Clarity */}
          <div
            onClick={() => {
              const pattern = {
                id: 'morning-clarity',
                name: 'Morning Clarity (4-4-4-4)',
                inhale: 4,
                hold1: 4,
                exhale: 4,
                hold2: 4,
                description: 'Box breathing wave',
              };
              onStartSession(5, pattern, 'Aurora Chimes');
            }}
            className="min-w-[210px] w-[210px] snap-start rounded-2xl bg-surface-container/60 backdrop-blur-xl shadow-lg p-3.5 flex flex-col justify-between space-y-3 transition-transform active:scale-[0.98] cursor-pointer border border-outline-variant/30 hover:border-primary/40"
          >
            <div className="relative h-28 w-full rounded-xl overflow-hidden">
              <img
                src={ASSETS.morningClarity}
                alt="Morning Clarity"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-surface-dim via-transparent to-transparent" />
              <div className="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-surface-dim/80 backdrop-blur-md flex items-center gap-1">
                <span className="material-symbols-outlined text-primary text-[12px]">schedule</span>
                <span className="text-[10px] font-semibold text-on-surface">5 min</span>
              </div>
              <div className="absolute bottom-2 right-2 w-7 h-7 rounded-full bg-primary/90 text-on-primary flex items-center justify-center shadow-md">
                <span
                  className="material-symbols-outlined text-[16px]"
                  style={{ fontVariationSettings: "'FILL' 1" }}
                >
                  play_arrow
                </span>
              </div>
            </div>
            <div className="space-y-1">
              <span className="text-[10px] font-semibold text-secondary-fixed uppercase tracking-wider">
                Awaken Mind
              </span>
              <h4 className="text-sm font-semibold text-on-surface truncate">Morning Clarity</h4>
              <p className="text-[11px] text-on-surface-variant line-clamp-1">
                Box breathing focus wave
              </p>
            </div>
          </div>

          {/* Card 3: Sleep Prep */}
          <div
            onClick={() => {
              const pattern = {
                id: 'sleep-prep',
                name: 'Sleep Prep (4-7-8-0)',
                inhale: 4,
                hold1: 7,
                exhale: 8,
                hold2: 0,
                description: 'Extended out-breath slow down',
              };
              onStartSession(10, pattern, 'Glacial Rain');
            }}
            className="min-w-[210px] w-[210px] snap-start rounded-2xl bg-surface-container/60 backdrop-blur-xl shadow-lg p-3.5 flex flex-col justify-between space-y-3 transition-transform active:scale-[0.98] cursor-pointer border border-outline-variant/30 hover:border-primary/40"
          >
            <div className="relative h-28 w-full rounded-xl overflow-hidden">
              <img
                src={ASSETS.sleepPrep}
                alt="Sleep Prep"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-surface-dim via-transparent to-transparent" />
              <div className="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-surface-dim/80 backdrop-blur-md flex items-center gap-1">
                <span className="material-symbols-outlined text-tertiary text-[12px]">schedule</span>
                <span className="text-[10px] font-semibold text-on-surface">10 min</span>
              </div>
              <div className="absolute bottom-2 right-2 w-7 h-7 rounded-full bg-tertiary text-on-tertiary flex items-center justify-center shadow-md">
                <span
                  className="material-symbols-outlined text-[16px]"
                  style={{ fontVariationSettings: "'FILL' 1" }}
                >
                  play_arrow
                </span>
              </div>
            </div>
            <div className="space-y-1">
              <span className="text-[10px] font-semibold text-tertiary uppercase tracking-wider">
                Deep Rest
              </span>
              <h4 className="text-sm font-semibold text-on-surface truncate">Sleep Prep</h4>
              <p className="text-[11px] text-on-surface-variant line-clamp-1">
                Extended out-breath slow down
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
