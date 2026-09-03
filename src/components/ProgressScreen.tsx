import React, { useState } from 'react';
import { USER_STATS, WEEKLY_DAYS, BADGES } from '../data/mockData';
import { UserStats, DayActivity } from '../types';

interface ProgressScreenProps {
  userStats?: UserStats;
}

export const ProgressScreen: React.FC<ProgressScreenProps> = ({
  userStats = USER_STATS,
}) => {
  const [stats] = useState<UserStats>(userStats);
  const [dailyReminder, setDailyReminder] = useState<boolean>(true);
  const [hapticGuidance, setHapticGuidance] = useState<boolean>(true);
  const [audioQuality, setAudioQuality] = useState<string>('Lossless Spatial Audio (48kHz)');
  const [showQualityModal, setShowQualityModal] = useState<boolean>(false);
  const [showBadgeModal, setShowBadgeModal] = useState<boolean>(false);
  const [showInsightModal, setShowInsightModal] = useState<boolean>(false);
  const [selectedDay, setSelectedDay] = useState<DayActivity | null>(null);

  return (
    <div className="flex flex-col w-full max-w-md mx-auto px-4 pb-28 space-y-6">
      {/* Ambient Light Orbs */}
      <div className="relative w-full">
        <div className="absolute -top-10 -left-12 w-48 h-48 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-24 -right-10 w-44 h-44 bg-tertiary/10 rounded-full blur-3xl pointer-events-none" />

        {/* Top Status Summary Card */}
        <div className="relative bg-surface-container/60 backdrop-blur-xl rounded-xl p-3.5 shadow-lg overflow-hidden border border-outline-variant/30">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-surface-container-high/80 text-secondary-fixed text-xs font-medium border border-outline-variant/20">
              <span
                className="material-symbols-outlined text-secondary text-sm animate-pulse"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                local_fire_department
              </span>
              <span>14-Day Streak</span>
            </div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary-container/40 text-on-primary-container text-xs font-medium border border-primary/20">
              <span className="material-symbols-outlined text-primary text-sm">favorite</span>
              <span>Apple Health Synced</span>
              <span className="material-symbols-outlined text-primary text-xs font-bold">
                check
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Daily Momentum Section */}
      <div className="flex flex-col space-y-3 w-full">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-base">bolt</span>
            <h3 className="text-sm font-headline font-semibold text-on-surface">Daily Momentum</h3>
          </div>
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-surface-container-high/80 text-[10px] text-on-surface-variant font-medium border border-outline-variant/30">
            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
            <span>Synced just now</span>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2.5 w-full">
          {/* Card 1: 7-Day Active Streak */}
          <div className="bg-surface-container/60 backdrop-blur-xl rounded-xl p-3 flex flex-col justify-between shadow-md relative overflow-hidden group border border-outline-variant/30">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] font-medium text-on-surface-variant truncate">
                Streak
              </span>
              <div className="w-6 h-6 rounded-lg bg-secondary/15 flex items-center justify-center text-secondary shadow-[0_0_12px_rgba(136,180,204,0.25)]">
                <span
                  className="material-symbols-outlined text-xs"
                  style={{ fontVariationSettings: "'FILL' 1" }}
                >
                  local_fire_department
                </span>
              </div>
            </div>
            <div className="flex flex-col mt-0.5">
              <span className="text-lg font-headline font-bold text-on-surface tracking-tight">
                {stats.streakDays} Days
              </span>
              <span className="text-[9px] text-secondary font-medium mt-0.5">Personal best</span>
            </div>
          </div>

          {/* Card 2: 18 Min Today */}
          <div className="bg-surface-container/60 backdrop-blur-xl rounded-xl p-3 flex flex-col justify-between shadow-md relative overflow-hidden group border border-outline-variant/30">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] font-medium text-on-surface-variant truncate">Today</span>
              <div className="w-6 h-6 rounded-lg bg-primary/15 flex items-center justify-center text-primary shadow-[0_0_12px_rgba(125,211,252,0.25)]">
                <span className="material-symbols-outlined text-xs">timer</span>
              </div>
            </div>
            <div className="flex flex-col mt-0.5">
              <span className="text-lg font-headline font-bold text-primary tracking-tight">
                {stats.todayMinutes} Min
              </span>
              <span className="text-[9px] text-on-surface-variant font-medium mt-0.5">
                Goal: {stats.dailyGoalMinutes}m (90%)
              </span>
            </div>
          </div>

          {/* Card 3: 62 BPM Resting HR */}
          <div className="bg-surface-container/60 backdrop-blur-xl rounded-xl p-3 flex flex-col justify-between shadow-md relative overflow-hidden group border border-outline-variant/30">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] font-medium text-on-surface-variant truncate">
                Resting HR
              </span>
              <div className="w-6 h-6 rounded-lg bg-tertiary/15 flex items-center justify-center text-tertiary shadow-[0_0_12px_rgba(200,160,240,0.25)]">
                <span
                  className="material-symbols-outlined text-xs"
                  style={{ fontVariationSettings: "'FILL' 1" }}
                >
                  favorite
                </span>
              </div>
            </div>
            <div className="flex flex-col mt-0.5">
              <span className="text-lg font-headline font-bold text-on-surface tracking-tight">
                {stats.restingHr}{' '}
                <span className="text-[10px] font-normal text-on-surface-variant">bpm</span>
              </span>
              <span className="text-[9px] text-primary font-medium mt-0.5">
                {stats.restingHrDelta} bpm vs yest.
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Weekly Mindful Minutes Chart */}
      <div className="relative bg-surface-container/60 backdrop-blur-xl rounded-xl p-5 shadow-lg flex flex-col border border-outline-variant/30">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-xs font-medium tracking-wider uppercase text-on-surface-variant">
              Weekly Rhythm
            </p>
            <div className="flex items-baseline gap-2 mt-0.5">
              <span className="text-2xl font-headline font-bold text-on-surface">
                {stats.weeklyTotalMinutes} Mins
              </span>
              <span className="inline-flex items-center text-xs font-semibold text-primary">
                <span className="material-symbols-outlined text-sm">trending_up</span>
                +{stats.weeklyGrowthPercent}%
              </span>
            </div>
          </div>
          <div className="flex items-center gap-1.5 bg-surface-container-highest/50 px-2.5 py-1 rounded-lg border border-outline-variant/20">
            <span className="w-2 h-2 rounded-full bg-primary animate-ping" />
            <span className="text-[11px] text-on-surface-variant font-medium">
              Goal: {stats.weeklyGoalMinutes}m
            </span>
          </div>
        </div>

        {/* Chart Visualization */}
        <div className="pt-2 pb-1">
          <div className="h-36 w-full flex items-end justify-between gap-2 px-1">
            {WEEKLY_DAYS.map((d, index) => {
              const isPeak = d.isPeak;
              return (
                <div
                  key={index}
                  onClick={() => setSelectedDay(d)}
                  className="flex flex-col items-center flex-1 h-full justify-end group cursor-pointer"
                >
                  {/* Floating Peak Indicator for Wednesday or hover */}
                  {isPeak ? (
                    <div className="flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-primary/20 text-primary text-[9px] font-bold mb-1 shadow-[0_0_12px_rgba(125,211,252,0.4)]">
                      <span>{d.minutes}m</span>
                      <span
                        className="material-symbols-outlined text-[10px]"
                        style={{ fontVariationSettings: "'FILL' 1" }}
                      >
                        star
                      </span>
                    </div>
                  ) : (
                    <span className="text-[10px] text-on-surface-variant opacity-0 group-hover:opacity-100 transition-opacity mb-1 font-mono">
                      {d.minutes}m
                    </span>
                  )}

                  {/* The Bar */}
                  <div
                    className={`w-full max-w-[28px] rounded-t-md transition-all duration-300 ${
                      isPeak
                        ? 'bg-gradient-to-t from-primary/80 to-primary shadow-[0_0_18px_rgba(125,211,252,0.5)]'
                        : index === WEEKLY_DAYS.length - 1
                        ? 'bg-secondary group-hover:bg-primary'
                        : 'bg-surface-container-highest group-hover:bg-secondary'
                    }`}
                    style={{ height: `${d.percentage}%` }}
                  />

                  {/* Day Label */}
                  <span
                    className={`text-[11px] mt-2 ${
                      isPeak
                        ? 'font-semibold text-primary'
                        : 'font-medium text-on-surface-variant group-hover:text-on-surface'
                    }`}
                  >
                    {d.day}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Motivational Insight Banner */}
        <div className="mt-4 pt-3 bg-surface-container-low/70 rounded-lg px-3 py-2.5 flex items-center justify-between border border-outline-variant/20">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-tertiary text-lg">spa</span>
            <span className="text-xs text-on-surface-variant">
              Wednesday was your calmest session this month
            </span>
          </div>
          <button
            type="button"
            onClick={() => setShowInsightModal(true)}
            className="text-[10px] font-medium text-tertiary underline cursor-pointer hover:text-tertiary-fixed focus:outline-none"
          >
            Details
          </button>
        </div>
      </div>

      {/* Key Stats Grid (2x2 Frosted Glass Cards) */}
      <div className="grid grid-cols-2 gap-3 w-full">
        {/* Card 1: Total Sessions */}
        <div className="bg-surface-container/60 backdrop-blur-xl rounded-xl p-4 flex flex-col justify-between shadow-md relative overflow-hidden group border border-outline-variant/30">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-on-surface-variant">Total Sessions</span>
            <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
              <span className="material-symbols-outlined text-sm">timer</span>
            </div>
          </div>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="text-2xl font-headline font-bold text-on-surface">
              {stats.totalSessions}
            </span>
            <span className="text-[10px] text-on-surface-variant font-medium">completed</span>
          </div>
          <div className="w-full bg-surface-container-highest rounded-full h-1.5 mt-3 overflow-hidden">
            <div className="bg-primary h-full rounded-full" style={{ width: '71%' }} />
          </div>
        </div>

        {/* Card 2: Avg. Heart Rate Drop */}
        <div className="bg-surface-container/60 backdrop-blur-xl rounded-xl p-4 flex flex-col justify-between shadow-md relative overflow-hidden group border border-outline-variant/30">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-on-surface-variant">HR Reduction</span>
            <div className="w-7 h-7 rounded-lg bg-tertiary/10 flex items-center justify-center text-tertiary">
              <span
                className="material-symbols-outlined text-sm"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                favorite
              </span>
            </div>
          </div>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="text-2xl font-headline font-bold text-tertiary">
              {stats.hrReductionBpm}
            </span>
            <span className="text-xs font-headline font-medium text-on-surface-variant">BPM</span>
          </div>
          <p className="text-[10px] text-on-surface-variant mt-3 truncate">
            Measured across all flows
          </p>
        </div>

        {/* Card 3: Longest Streak */}
        <div className="bg-surface-container/60 backdrop-blur-xl rounded-xl p-4 flex flex-col justify-between shadow-md relative overflow-hidden group border border-outline-variant/30">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-on-surface-variant">Longest Streak</span>
            <div className="w-7 h-7 rounded-lg bg-secondary/15 flex items-center justify-center text-secondary">
              <span className="material-symbols-outlined text-sm">emoji_events</span>
            </div>
          </div>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="text-2xl font-headline font-bold text-on-surface">
              {stats.longestStreakDays}
            </span>
            <span className="text-xs font-headline font-medium text-on-surface-variant">Days</span>
          </div>
          <p className="text-[10px] text-on-surface-variant mt-3 truncate">
            Personal record: October
          </p>
        </div>

        {/* Card 4: Mindful Breath Cycles */}
        <div className="bg-surface-container/60 backdrop-blur-xl rounded-xl p-4 flex flex-col justify-between shadow-md relative overflow-hidden group border border-outline-variant/30">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-on-surface-variant">Breath Cycles</span>
            <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
              <span className="material-symbols-outlined text-sm">air</span>
            </div>
          </div>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="text-2xl font-headline font-bold text-on-surface">
              {stats.breathCycles.toLocaleString()}
            </span>
          </div>
          <p className="text-[10px] text-primary mt-3 truncate">{stats.pacerLevel}</p>
        </div>
      </div>

      {/* Milestones & Badges Horizontal Carousel */}
      <div className="flex flex-col space-y-3 w-full">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-headline font-semibold text-on-surface">
            Milestones &amp; Badges
          </h3>
          <button
            type="button"
            onClick={() => setShowBadgeModal(true)}
            className="text-xs text-primary font-medium cursor-pointer hover:underline focus:outline-none"
          >
            View All ({BADGES.length})
          </button>
        </div>

        <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-none snap-x">
          {BADGES.map((b) => (
            <div
              key={b.id}
              onClick={() => setShowBadgeModal(true)}
              className="flex-shrink-0 w-36 bg-surface-container/60 backdrop-blur-xl rounded-xl p-3.5 flex flex-col items-center text-center shadow-md relative group cursor-pointer hover:bg-surface-container-high/70 transition-all border border-outline-variant/30"
            >
              <div
                className={`w-12 h-12 rounded-full flex items-center justify-center mb-2 ${
                  b.color === 'tertiary'
                    ? 'bg-gradient-to-tr from-tertiary/30 to-tertiary/10 text-tertiary shadow-[0_0_12px_rgba(200,160,240,0.25)]'
                    : b.color === 'secondary'
                    ? 'bg-gradient-to-tr from-secondary/30 to-secondary/10 text-secondary shadow-[0_0_12px_rgba(136,180,204,0.25)]'
                    : 'bg-gradient-to-tr from-primary/30 to-primary/10 text-primary shadow-[0_0_12px_rgba(125,211,252,0.25)]'
                }`}
              >
                <span
                  className="material-symbols-outlined text-2xl"
                  style={{ fontVariationSettings: "'FILL' 1" }}
                >
                  {b.icon}
                </span>
              </div>
              <span className="text-xs font-semibold text-on-surface truncate w-full">
                {b.name}
              </span>
              <span className="text-[10px] text-on-surface-variant mt-0.5">{b.requirement}</span>

              {b.status === 'unlocked' ? (
                <span
                  className={`mt-2 text-[9px] font-bold px-2 py-0.5 rounded-full ${
                    b.color === 'tertiary'
                      ? 'text-tertiary bg-tertiary-container/40'
                      : b.color === 'secondary'
                      ? 'text-secondary bg-secondary-container/40'
                      : 'text-primary bg-primary-container/40'
                  }`}
                >
                  UNLOCKED
                </span>
              ) : (
                <div className="w-full bg-surface-container-highest rounded-full h-1 mt-2.5 overflow-hidden">
                  <div
                    className="bg-primary h-full rounded-full"
                    style={{ width: `${b.progress || 0}%` }}
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Preferences & Rituals */}
      <div className="flex flex-col space-y-3 w-full">
        <h3 className="text-sm font-headline font-semibold text-on-surface">
          Preferences &amp; Rituals
        </h3>
        <div className="bg-surface-container/60 backdrop-blur-xl rounded-xl overflow-hidden shadow-lg border border-outline-variant/30 divide-y divide-outline-variant/20">
          {/* Setting 1: Daily Breathe Reminder */}
          <div className="flex items-center justify-between p-4 hover:bg-surface-container-high/40 transition-colors">
            <div className="flex items-center gap-3.5">
              <div className="w-9 h-9 rounded-lg bg-primary-container/30 flex items-center justify-center text-primary">
                <span className="material-symbols-outlined text-lg">alarm</span>
              </div>
              <div>
                <h4 className="text-sm font-medium text-on-surface">Daily Breathe Reminder</h4>
                <p className="text-xs text-on-surface-variant">Scheduled for 8:00 AM</p>
              </div>
            </div>
            {/* Interactive Toggle */}
            <button
              type="button"
              onClick={() => setDailyReminder(!dailyReminder)}
              aria-label="Toggle daily reminder"
              className={`w-11 h-6 rounded-full relative p-0.5 transition-colors duration-300 focus:outline-none ${
                dailyReminder ? 'bg-primary' : 'bg-surface-container-highest'
              }`}
            >
              <span
                className={`block w-5 h-5 bg-surface-dim rounded-full transition-transform duration-300 shadow ${
                  dailyReminder ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Setting 2: Haptic Guidance */}
          <div className="flex items-center justify-between p-4 hover:bg-surface-container-high/40 transition-colors">
            <div className="flex items-center gap-3.5">
              <div className="w-9 h-9 rounded-lg bg-secondary-container/40 flex items-center justify-center text-secondary">
                <span className="material-symbols-outlined text-lg">vibration</span>
              </div>
              <div>
                <h4 className="text-sm font-medium text-on-surface">Haptic Guidance</h4>
                <p className="text-xs text-on-surface-variant">Tactile breath cues on inhale/hold</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                const next = !hapticGuidance;
                setHapticGuidance(next);
                if (next && typeof navigator !== 'undefined' && 'vibrate' in navigator) {
                  navigator.vibrate(50);
                }
              }}
              aria-label="Toggle haptic feedback"
              className={`w-11 h-6 rounded-full relative p-0.5 transition-colors duration-300 focus:outline-none ${
                hapticGuidance ? 'bg-primary' : 'bg-surface-container-highest'
              }`}
            >
              <span
                className={`block w-5 h-5 bg-surface-dim rounded-full transition-transform duration-300 shadow ${
                  hapticGuidance ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Setting 3: Audio Quality */}
          <div
            onClick={() => setShowQualityModal(true)}
            className="flex items-center justify-between p-4 hover:bg-surface-container-high/40 transition-colors cursor-pointer group"
          >
            <div className="flex items-center gap-3.5">
              <div className="w-9 h-9 rounded-lg bg-tertiary-container/30 flex items-center justify-center text-tertiary">
                <span className="material-symbols-outlined text-lg">graphic_eq</span>
              </div>
              <div>
                <h4 className="text-sm font-medium text-on-surface group-hover:text-primary transition-colors">
                  Audio Quality
                </h4>
                <p className="text-xs text-on-surface-variant">{audioQuality}</p>
              </div>
            </div>
            <span className="material-symbols-outlined text-on-surface-variant text-lg group-hover:translate-x-0.5 transition-transform">
              chevron_right
            </span>
          </div>
        </div>
      </div>

      {/* Calming Quote Prompt Card */}
      <div className="relative bg-gradient-to-r from-surface-container-high/70 via-surface-container/50 to-surface-container-high/70 backdrop-blur-xl rounded-xl p-4 shadow-sm text-center overflow-hidden border border-outline-variant/30">
        <div className="absolute -right-6 -bottom-6 w-20 h-20 bg-primary/10 rounded-full blur-xl" />
        <span className="text-xs italic text-on-surface-variant font-serif">
          "Feelings come and go like clouds in a windy sky. Conscious breathing is my anchor."
        </span>
        <p className="text-[10px] font-medium tracking-wider text-primary/80 uppercase mt-1.5">
          — THICH NHAT HANH
        </p>
      </div>

      {/* Audio Quality Modal */}
      {showQualityModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-md p-4 animate-fade-in">
          <div className="w-full max-w-xs bg-surface-container/95 border border-primary/30 rounded-2xl p-5 shadow-2xl space-y-3">
            <h4 className="text-sm font-headline font-semibold text-on-surface">
              Select Soundscape Quality
            </h4>
            <div className="space-y-2">
              {[
                'Lossless Spatial Audio (48kHz)',
                'Studio Master 3D (96kHz)',
                'Standard Eco Mode (44.1kHz)',
              ].map((opt) => (
                <button
                  key={opt}
                  type="button"
                  onClick={() => {
                    setAudioQuality(opt);
                    setShowQualityModal(false);
                  }}
                  className={`w-full p-2.5 rounded-xl text-left text-xs transition-colors flex items-center justify-between ${
                    audioQuality === opt
                      ? 'bg-primary/20 text-primary font-semibold border border-primary/40'
                      : 'bg-surface-container-highest/60 text-on-surface hover:bg-surface-container-highest'
                  }`}
                >
                  <span>{opt}</span>
                  {audioQuality === opt && (
                    <span className="material-symbols-outlined text-sm">check</span>
                  )}
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={() => setShowQualityModal(false)}
              className="w-full py-2 rounded-xl text-xs text-on-surface-variant hover:text-on-surface text-center"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Insight Details Modal */}
      {showInsightModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-md p-4 animate-fade-in">
          <div className="w-full max-w-xs bg-surface-container/95 border border-tertiary/30 rounded-2xl p-5 shadow-2xl space-y-3 text-left">
            <div className="flex items-center gap-2 text-tertiary">
              <span className="material-symbols-outlined text-lg">spa</span>
              <h4 className="text-sm font-headline font-semibold">Wednesday Calm Metrics</h4>
            </div>
            <p className="text-xs text-on-surface-variant leading-relaxed">
              On Wednesday, you logged 42 mindful minutes using the 4-7-8 Relax pattern. Your heart rate variability (HRV) rose by +24ms, yielding your lowest resting pulse of 59 bpm.
            </p>
            <button
              type="button"
              onClick={() => setShowInsightModal(false)}
              className="w-full py-2 bg-tertiary/20 text-tertiary rounded-xl text-xs font-semibold hover:bg-tertiary/30 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Day Details Tooltip/Modal */}
      {selectedDay && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/70 backdrop-blur-sm p-4 animate-fade-in">
          <div className="w-full max-w-xs bg-surface-container/95 border border-primary/30 rounded-2xl p-4 shadow-xl space-y-2">
            <h4 className="text-sm font-semibold text-on-surface">
              {selectedDay.fullDay} Activity
            </h4>
            <p className="text-xs text-on-surface-variant">
              Total conscious breathing: <strong className="text-primary">{selectedDay.minutes} minutes</strong>
              {selectedDay.isPeak && ' (Peak Day ⭐)'}
            </p>
            <button
              type="button"
              onClick={() => setSelectedDay(null)}
              className="w-full py-1.5 bg-surface-container-highest rounded-lg text-xs text-on-surface hover:text-primary mt-2"
            >
              Done
            </button>
          </div>
        </div>
      )}

      {/* Badges Modal */}
      {showBadgeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-md p-4 animate-fade-in">
          <div className="w-full max-w-sm bg-surface-container/95 border border-primary/30 rounded-2xl p-5 shadow-2xl space-y-4 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-headline font-semibold text-on-surface">
                All Milestones & Badges
              </h4>
              <button
                type="button"
                onClick={() => setShowBadgeModal(false)}
                className="text-on-surface-variant hover:text-on-surface"
              >
                <span className="material-symbols-outlined text-lg">close</span>
              </button>
            </div>
            <div className="grid grid-cols-2 gap-2.5">
              {BADGES.map((b) => (
                <div
                  key={b.id}
                  className="p-3 rounded-xl bg-surface-container-high/50 border border-outline-variant/30 flex flex-col items-center text-center space-y-1"
                >
                  <span className="material-symbols-outlined text-xl text-primary">{b.icon}</span>
                  <span className="text-xs font-semibold text-on-surface truncate w-full">
                    {b.name}
                  </span>
                  <span className="text-[10px] text-on-surface-variant">{b.requirement}</span>
                  <span className="text-[9px] font-bold text-primary bg-primary/10 px-1.5 py-0.5 rounded">
                    {b.status.toUpperCase()}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
