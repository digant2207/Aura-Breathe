import React from 'react';
import { TabType } from '../types';
import { ZenLogo } from './ZenLogo';

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
    <header
      className="fixed top-0 inset-x-0 z-50 bg-[#0f1524]/90 backdrop-blur-2xl shadow-[0_4px_20px_rgba(0,0,0,0.35)] border-b border-[#7dd3fc]/10 transition-all"
      style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}
    >
      <div className="max-w-md mx-auto h-14 px-4 flex items-center justify-between">
        {/* Left: Brand Logo & Wordmark matching the 2nd uploaded icon image */}
        <button
          onClick={() => onNavigate('daily-zen')}
          className="flex items-center gap-2 hover:opacity-90 transition-opacity focus:outline-none group"
          title="Go to Daily Zen"
        >
          <ZenLogo size={36} showText={true} />
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
