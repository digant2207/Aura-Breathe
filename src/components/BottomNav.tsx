import React from 'react';
import { TabType } from '../types';

interface BottomNavProps {
  activeTab: TabType;
  onNavigate: (tab: TabType) => void;
  isBreathingActive?: boolean;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  activeTab,
  onNavigate,
  isBreathingActive = false,
}) => {
  const navItems: { id: TabType; label: string; icon: string }[] = [
    { id: 'daily-zen', label: 'Daily Zen', icon: 'spa' },
    { id: 'breathe', label: 'Breathe', icon: 'air' },
    { id: 'soundscapes', label: 'Sounds', icon: 'graphic_eq' },
    { id: 'progress', label: 'Progress', icon: 'equalizer' },
  ];

  return (
    <nav className="fixed bottom-0 inset-x-0 z-50 pb-safe bg-[#0f1524]/85 backdrop-blur-2xl shadow-[0_-4px_24px_rgba(0,0,0,0.5)] border-t border-[#7dd3fc]/10">
      <div className="max-w-md mx-auto flex justify-around items-center h-16 px-2">
        {navItems.map((item) => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`flex flex-col items-center justify-center min-w-[68px] h-13 transition-all duration-200 focus:outline-none relative ${
                isActive
                  ? 'text-primary scale-105 drop-shadow-[0_0_8px_rgba(125,211,252,0.4)]'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              {/* Active pulse dot on Breathe if session is running in background */}
              {item.id === 'breathe' && isBreathingActive && !isActive && (
                <span className="absolute top-1.5 right-4 w-2 h-2 rounded-full bg-primary animate-ping" />
              )}
              <span
                className={`material-symbols-outlined text-[24px] transition-transform ${
                  isActive ? 'scale-110' : ''
                }`}
                style={{ fontVariationSettings: isActive ? "'FILL' 1" : "'FILL' 0" }}
              >
                {item.icon}
              </span>
              <span className="text-[10px] font-medium tracking-tight mt-0.5">
                {item.label}
              </span>
              {isActive && (
                <span className="w-1 h-1 rounded-full bg-primary mt-0.5 shadow-[0_0_6px_rgba(125,211,252,0.8)]" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};
