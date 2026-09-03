import React from 'react';
import { ASSETS } from '../data/mockData';
import { TabType } from '../types';

interface HeaderProps {
  activeTab: TabType;
  onNavigate: (tab: TabType) => void;
}

export const Header: React.FC<HeaderProps> = ({ activeTab, onNavigate }) => {
  const getTitle = () => {
    switch (activeTab) {
      case 'daily-zen':
        return 'Daily Zen';
      case 'breathe':
        return 'Breathe';
      case 'soundscapes':
        return 'Soundscapes';
      case 'progress':
        return 'Progress Profile';
      default:
        return 'Aura';
    }
  };

  return (
    <header className="fixed top-0 inset-x-0 z-50 bg-[#0f1524]/75 backdrop-blur-2xl pt-safe shadow-[0_4px_20px_rgba(0,0,0,0.35)] border-b border-[#7dd3fc]/10">
      <div className="max-w-md mx-auto h-16 px-4 flex items-center justify-between">
        {/* Left: Brand Logo & Wordmark */}
        <button
          onClick={() => onNavigate('daily-zen')}
          className="flex items-center gap-2.5 hover:opacity-90 transition-opacity focus:outline-none"
          title="Go to Daily Zen"
        >
          <img
            src={ASSETS.logo}
            alt="Aura Breathe Logo"
            className="h-8 w-auto object-contain drop-shadow-[0_0_8px_rgba(125,211,252,0.3)]"
          />
          <span className="text-xs font-semibold tracking-widest text-primary uppercase drop-shadow-[0_0_10px_rgba(125,211,252,0.4)]">
            AURA
          </span>
        </button>

        {/* Center: Current Screen Title */}
        <h1 className="text-sm font-headline font-medium tracking-wide text-on-surface/90">
          {getTitle()}
        </h1>

        {/* Right: Spacer to keep title centered */}
        <div className="w-16" aria-hidden="true" />
      </div>
    </header>
  );
};
