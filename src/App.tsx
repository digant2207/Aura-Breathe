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

export default function App() {
  const [activeTab, setActiveTab] = useState<TabType>('daily-zen');
  const [selectedDuration, setSelectedDuration] = useState<number>(10);
  const [activePattern, setActivePattern] = useState<BreathPattern>(DEFAULT_PATTERNS[0]);
  const [customSlots, setCustomSlots] = useState<BreathPattern[]>(INITIAL_CUSTOM_PATTERNS);

  const [currentTrack, setCurrentTrack] = useState<SoundscapeTrack>(SOUNDSCAPE_TRACKS[0]);
  const [selectedBell, setSelectedBell] = useState<TransitionBell>(TRANSITION_BELLS[0]);
  const [bellEnabled, setBellEnabled] = useState<boolean>(true);

  const [userStats, setUserStats] = useState<UserStats>(USER_STATS);
  const [isBreathingSessionRunning, setIsBreathingSessionRunning] = useState<boolean>(false);

  const handleStartSession = (durationMin: number, pattern: BreathPattern, soundName?: string) => {
    setSelectedDuration(durationMin);
    setActivePattern(pattern);
    if (soundName) {
      const match = SOUNDSCAPE_TRACKS.find((t) =>
        t.title.toLowerCase().includes(soundName.toLowerCase())
      );
      if (match) {
        setCurrentTrack(match);
      }
    }
    setIsBreathingSessionRunning(true);
    setActiveTab('breathe');
  };

  const handleEndSession = (completedSeconds: number) => {
    setIsBreathingSessionRunning(false);
    const addedMinutes = Math.max(1, Math.round(completedSeconds / 60));
    const cycleTime = Math.max(1, activePattern.inhale + activePattern.hold1 + activePattern.exhale + activePattern.hold2);
    const addedCycles = Math.round(completedSeconds / cycleTime);

    setUserStats((prev) => ({
      ...prev,
      todayMinutes: prev.todayMinutes + addedMinutes,
      weeklyTotalMinutes: prev.weeklyTotalMinutes + addedMinutes,
      totalSessions: prev.totalSessions + 1,
      breathCycles: prev.breathCycles + addedCycles,
    }));

    setActiveTab('progress');
  };

  const handleSaveCustomSlot = (pattern: BreathPattern, slotIndex: number) => {
    setCustomSlots((prev) => {
      const copy = [...prev];
      copy[slotIndex] = pattern;
      return copy;
    });
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
        onNavigate={(tab) => setActiveTab(tab)}
      />

      {/* Main Content Area */}
      <main className="flex-1 w-full pt-16 relative z-10">
        {activeTab === 'daily-zen' && (
          <DailyZenScreen
            onStartSession={handleStartSession}
            onNavigate={(tab) => setActiveTab(tab)}
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
            activeSoundName={currentTrack.title}
            transitionBellEnabled={bellEnabled}
          />
        )}

        {activeTab === 'soundscapes' && (
          <SoundscapesScreen
            currentTrack={currentTrack}
            onSelectTrack={setCurrentTrack}
            selectedBell={selectedBell}
            onSelectBell={setSelectedBell}
            bellEnabled={bellEnabled}
            onToggleBell={() => setBellEnabled(!bellEnabled)}
          />
        )}

        {activeTab === 'progress' && (
          <ProgressScreen userStats={userStats} />
        )}
      </main>

      {/* Persistent Bottom Navigation Bar */}
      <BottomNav
        activeTab={activeTab}
        onNavigate={(tab) => setActiveTab(tab)}
        isBreathingActive={isBreathingSessionRunning}
      />
    </div>
  );
}
