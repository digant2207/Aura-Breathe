export type TabType = 'daily-zen' | 'breathe' | 'soundscapes' | 'progress';

export type BreathPhase = 'inhale' | 'hold1' | 'exhale' | 'hold2';

export interface BreathPattern {
  id: string;
  name: string;
  inhale: number;
  hold1: number;
  exhale: number;
  hold2: number;
  description: string;
  category?: string;
}

export interface SoundscapeTrack {
  id: string;
  title: string;
  subtitle: string;
  category: 'rain' | 'sleep' | 'binaural' | 'zen' | 'nature';
  tag: string;
  tagColor?: string;
  duration: string;
  isFavorite: boolean;
  imageUrl: string;
  frequency?: string;
  audioType: 'rain' | 'theta' | 'singing-bowl' | 'aurora' | 'fire' | 'stream' | 'energy' | 'auto-bowl' | 'universe-888';
}

export interface TransitionBell {
  id: string;
  name: string;
  freq: string;
  description: string;
  pitchHz: number;
  bellType: 'temple-bell' | 'tibetan-bowl' | 'koshi-chime' | 'wood-block' | 'auto-528-bowl';
}

export interface Badge {
  id: string;
  name: string;
  requirement: string;
  status: 'unlocked' | 'locked' | 'in_progress';
  icon: string;
  progress?: number;
  color: 'primary' | 'secondary' | 'tertiary';
}

export interface DayActivity {
  day: string;
  fullDay: string;
  minutes: number;
  percentage: number;
  isPeak?: boolean;
}

export interface UserStats {
  name: string;
  streakDays: number;
  personalBestStreak: number;
  todayMinutes: number;
  dailyGoalMinutes: number;
  restingHr: number;
  restingHrDelta: number;
  weeklyTotalMinutes: number;
  weeklyGoalMinutes: number;
  weeklyGrowthPercent: number;
  totalSessions: number;
  hrReductionBpm: number;
  longestStreakDays: number;
  breathCycles: number;
  pacerLevel: string;
}
