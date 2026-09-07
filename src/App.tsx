/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { TabType, BreathPattern, SoundscapeTrack, TransitionBell, UserStats } from './types';
import {
  DEFAULT_PATTERNS,
  INITIAL_CUSTOM_PATTERNS,
  SOUNDSCAPE_TRACKS,
  TRANSITION_BELLS,
  USER_STATS,
} from './data/mockData';
import { Header } from './components/Header';
import { BottomNav } from './components/BottomNav';
import { DailyZenScreen } from './components/DailyZenScreen';
import { BreatheScreen } from './components/BreatheScreen';
import { SoundscapesScreen } from './components/SoundscapesScreen';
import { ProgressScreen } from './components/ProgressScreen';
import { audioEngine } from './utils/audioEngine';

export default function App() {
  const [activeTab, setActiveTab] = useState<TabType>('daily-zen');
  const [selectedDuration, setSelectedDuration] = useState<number>(10);
  const [activePattern, setActivePattern] = useState<BreathPattern>(DEFAULT_PATTERNS[0]);

  // Persistent Custom Patterns in localStorage
  const [customSlots, setCustomSlots] = useState<BreathPattern[]>(() => {
    try {
      const saved = localStorage.getItem('aura_custom_patterns');
      return saved ? JSON.parse(saved) : INITIAL_CUSTOM_PATTERNS;
    } catch {
      return INITIAL_CUSTOM_PATTERNS;
    }
  });

  // Persistent Current Soundscape Track in localStorage
  const [currentTrack, setCurrentTrack] = useState<SoundscapeTrack>(() => {
    try {
      const saved = localStorage.getItem('aura_current_track');
      if (saved) {
        const parsed = JSON.parse(saved);
        const match = SOUNDSCAPE_TRACKS.find((t) => t.id === parsed.id);
        if (match) return match;
      }
      return SOUNDSCAPE_TRACKS[0];
    } catch {
      return SOUNDSCAPE_TRACKS[0];
    }
  });

  // Persistent Selected Bell in localStorage
  const [selectedBell, setSelectedBell] = useState<TransitionBell>(() => {
    try {
      const saved = localStorage.getItem('aura_selected_bell');
      if (saved) {
        const parsed = JSON.parse(saved);
        const match = TRANSITION_BELLS.find((b) => b.id === parsed.id);
        if (match) return match;
      }
      return TRANSITION_BELLS[0];
    } catch {
      return TRANSITION_BELLS[0];
    }
  });

  const [bellEnabled, setBellEnabled] = useState<boolean>(true);

  // Persistent User Stats in localStorage starting from zero
  const [userStats, setUserStats] = useState<UserStats>(() => {
    try {
      const saved = localStorage.getItem('aura_user_stats');
      return saved ? JSON.parse(saved) : USER_STATS;
    } catch {
      return USER_STATS;
    }
  });

  const [isBreathingSessionRunning, setIsBreathingSessionRunning] = useState<boolean>(false);

  const handleSelectTrack = (track: SoundscapeTrack) => {
    setCurrentTrack(track);
    try {
      localStorage.setItem('aura_current_track', JSON.stringify(track));
    } catch (_) {}
  };

  const handleSelectBell = (bell: TransitionBell) => {
    setSelectedBell(bell);
    try {
      localStorage.setItem('aura_selected_bell', JSON.stringify(bell));
    } catch (_) {}
  };

  const handleStartSession = (durationMin: number, pattern: BreathPattern, soundName?: string) => {
    setSelectedDuration(durationMin);
    setActivePattern(pattern);
    if (soundName) {
      const match = SOUNDSCAPE_TRACKS.find((t) =>
        t.title.toLowerCase().includes(soundName.toLowerCase())
      );
      if (match) {
        handleSelectTrack(match);
      }
    }
    setIsBreathingSessionRunning(true);
    setActiveTab('breathe');
  };

  const handleEndSession = (completedSeconds: number) => {
    audioEngine.stopAmbient();
    setIsBreathingSessionRunning(false);
    const addedMinutes = Math.max(1, Math.round(completedSeconds / 60));
    const cycleTime = Math.max(1, activePattern.inhale + activePattern.hold1 + activePattern.exhale + activePattern.hold2);
    const addedCycles = Math.max(1, Math.round(completedSeconds / cycleTime));

    setUserStats((prev) => {
      const newStreak = prev.streakDays === 0 ? 1 : prev.streakDays;
      const updated: UserStats = {
        ...prev,
        todayMinutes: prev.todayMinutes + addedMinutes,
        weeklyTotalMinutes: prev.weeklyTotalMinutes + addedMinutes,
        totalSessions: prev.totalSessions + 1,
        breathCycles: prev.breathCycles + addedCycles,
        streakDays: newStreak,
        personalBestStreak: Math.max(prev.personalBestStreak, newStreak),
        longestStreakDays: Math.max(prev.longestStreakDays, newStreak),
        restingHrDelta: -1,
        hrReductionBpm: Math.min(-2, prev.hrReductionBpm - 1),
      };
      try {
        localStorage.setItem('aura_user_stats', JSON.stringify(updated));
      } catch (_) {}
      return updated;
    });

    setActiveTab('progress');
  };

  const handleSaveCustomSlot = (pattern: BreathPattern, slotIndex: number) => {
    setCustomSlots((prev) => {
      const copy = [...prev];
      copy[slotIndex] = pattern;
      try {
        localStorage.setItem('aura_custom_patterns', JSON.stringify(copy));
      } catch (_) {}
      return copy;
    });
  };

  const handleResetStats = () => {
    setUserStats(USER_STATS);
    try {
      localStorage.setItem('aura_user_stats', JSON.stringify(USER_STATS));
    } catch (_) {}
  };

  const handleNavigate = (tab: TabType) => {
    if (activeTab === 'breathe' && tab !== 'breathe') {
      audioEngine.stopAmbient();
      setIsBreathingSessionRunning(false);
    }
    setActiveTab(tab);
  };

  return (
    <div className="min-h-screen w-full bg-[#0a0e1a] text-on-surface flex flex-col relative overflow-x-hidden selection:bg-primary/30">
      {/* Subtle Background Radial Ambient Glows for Glacier Atmosphere */}
      <div className="fixed -top-32 -left-32 w-96 h-96 bg-primary/10 rounded-full blur-3xl pointer-events-none z-0" />
      <div className="fixed top-1/3 -right-32 w-96 h-96 bg-tertiary/10 rounded-full blur-3xl pointer-events-none z-0" />
      <div className="fixed -bottom-32 left-1/4 w-96 h-96 bg-secondary/10 rounded-full blur-3xl pointer-events-none z-0" />

      {/* Persistent App Header */}
      <Header
        activeTab={activeTab}
        onNavigate={handleNavigate}
      />

      {/* Main Content Area with iPhone 12+ Notch and Home Indicator Safe Area Insets */}
      <main
        className="flex-1 w-full relative z-10 overflow-x-hidden"
        style={{
          paddingTop: 'calc(3.75rem + env(safe-area-inset-top, 0px))',
          paddingBottom: 'calc(4.75rem + env(safe-area-inset-bottom, 0px))'
        }}
      >
        {activeTab === 'daily-zen' && (
          <DailyZenScreen
            onStartSession={handleStartSession}
            onNavigate={handleNavigate}
            selectedDuration={selectedDuration}
            setSelectedDuration={setSelectedDuration}
            activePattern={activePattern}
            setActivePattern={setActivePattern}
            customSlots={customSlots}
            onSaveCustomSlot={handleSaveCustomSlot}
          />
        )}

        {activeTab === 'breathe' && (
          <BreatheScreen
            pattern={activePattern}
            durationMinutes={selectedDuration}
            onEndSession={handleEndSession}
            currentTrack={currentTrack}
            onChangeTrack={handleSelectTrack}
            selectedBell={selectedBell}
            transitionBellEnabled={bellEnabled}
          />
        )}

        {activeTab === 'soundscapes' && (
          <SoundscapesScreen
            currentTrack={currentTrack}
            onSelectTrack={handleSelectTrack}
            selectedBell={selectedBell}
            onSelectBell={handleSelectBell}
            bellEnabled={bellEnabled}
            onToggleBell={() => setBellEnabled(!bellEnabled)}
          />
        )}

        {activeTab === 'progress' && (
          <ProgressScreen
            userStats={userStats}
            onResetStats={handleResetStats}
          />
        )}
      </main>

      {/* Persistent Bottom Navigation Bar */}
      <BottomNav
        activeTab={activeTab}
        onNavigate={handleNavigate}
        isBreathingActive={isBreathingSessionRunning}
      />
    </div>
  );
}
