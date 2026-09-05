import React, { useState, useEffect } from 'react';
import { SoundscapeTrack, TransitionBell } from '../types';
import { SOUNDSCAPE_TRACKS, TRANSITION_BELLS } from '../data/mockData';
import { audioEngine } from '../utils/audioEngine';

interface SoundscapesScreenProps {
  currentTrack: SoundscapeTrack;
  onSelectTrack: (track: SoundscapeTrack) => void;
  selectedBell: TransitionBell;
  onSelectBell: (bell: TransitionBell) => void;
  bellEnabled: boolean;
  onToggleBell: () => void;
}

export const SoundscapesScreen: React.FC<SoundscapesScreenProps> = ({
  currentTrack,
  onSelectTrack,
  selectedBell,
  onSelectBell,
  bellEnabled,
  onToggleBell,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('All');
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [tracks, setTracks] = useState<SoundscapeTrack[]>(SOUNDSCAPE_TRACKS);
  const [bellVolume, setBellVolume] = useState<number>(75);

  const filterTabs = ['All', 'Rain & Storm', 'Deep Sleep', 'Binaural Beats', 'Zen Harmony'];

  // Sync isPlaying with audioEngine
  useEffect(() => {
    setIsPlaying(audioEngine.getIsPlaying());
  }, [currentTrack]);

  const handleTogglePlay = (track?: SoundscapeTrack) => {
    const target = track || currentTrack;
    if (target.id !== currentTrack.id) {
      onSelectTrack(target);
      audioEngine.playTrack(target.audioType);
      setIsPlaying(true);
    } else {
      const active = audioEngine.toggleAmbient(target.audioType);
      setIsPlaying(active);
    }
  };

  const handleToggleFavorite = (e: React.MouseEvent, trackId: string) => {
    e.stopPropagation();
    setTracks((prev) =>
      prev.map((t) => (t.id === trackId ? { ...t, isFavorite: !t.isFavorite } : t))
    );
  };

  const handleTestBell = (e: React.MouseEvent, bell: TransitionBell) => {
    e.stopPropagation();
    onSelectBell(bell);
    audioEngine.playTransitionCue(bell.bellType || bell.id, bell.pitchHz);
  };

  const filteredTracks = tracks.filter((t) => {
    const matchesSearch =
      t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.subtitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.tag.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;
    if (selectedFilter === 'All') return true;
    if (selectedFilter === 'Rain & Storm') return t.category === 'rain';
    if (selectedFilter === 'Deep Sleep') return t.category === 'sleep' || t.tag.includes('Delta');
    if (selectedFilter === 'Binaural Beats') return t.category === 'binaural';
    if (selectedFilter === 'Zen Harmony') return t.category === 'zen';
    return true;
  });

  return (
    <div className="flex flex-col w-full max-w-md mx-auto px-4 pb-28 space-y-5">
      {/* Search Bar with Filter Icon */}
      <div className="relative pt-2">
        <div className="relative flex items-center w-full">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search frequency, biome, duration..."
            className="w-full h-11 pl-4 pr-11 text-xs rounded-xl bg-surface-container/60 backdrop-blur-xl border border-outline-variant/30 text-on-surface placeholder:text-on-surface-variant/60 focus:outline-none focus:border-primary/60 transition-colors shadow-sm"
          />
          <button
            type="button"
            className="absolute right-3 text-on-surface-variant hover:text-primary transition-colors focus:outline-none"
            title="Filter Soundscapes"
          >
            <span className="material-symbols-outlined text-[20px]">tune</span>
          </button>
        </div>
      </div>

      {/* Horizontal Filter Tabs */}
      <div className="flex space-x-2 overflow-x-auto pb-1 -mx-4 px-4 scrollbar-none snap-x">
        {filterTabs.map((tab) => {
          const isActive = selectedFilter === tab;
          return (
            <button
              key={tab}
              type="button"
              onClick={() => setSelectedFilter(tab)}
              className={`snap-start flex-shrink-0 px-3.5 py-1.5 rounded-full text-xs transition-all active:scale-95 focus:outline-none whitespace-nowrap ${
                isActive
                  ? 'font-semibold bg-primary text-on-primary shadow-[0_0_15px_rgba(125,211,252,0.25)]'
                  : 'font-medium bg-surface-container/60 backdrop-blur-xl border border-outline-variant/30 text-on-surface-variant hover:text-on-surface'
              }`}
            >
              {tab}
            </button>
          );
        })}
      </div>

      {/* Hero "NOW PLAYING" Card */}
      <div className="relative rounded-2xl p-4 bg-surface-container/60 backdrop-blur-xl shadow-lg border border-outline-variant/30 space-y-3.5 overflow-hidden group">
        {/* Background glow orb */}
        <div className="absolute -right-8 -top-8 w-32 h-32 bg-primary/10 rounded-full blur-2xl pointer-events-none" />

        {/* Top Header inside Now Playing */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold tracking-widest text-primary uppercase flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
              NOW PLAYING
            </span>
            <span className="px-2 py-0.5 rounded-full bg-tertiary/15 text-tertiary border border-tertiary/20 text-[10px] font-semibold">
              {currentTrack.tag}
            </span>
          </div>

          <button
            type="button"
            onClick={(e) => handleToggleFavorite(e, currentTrack.id)}
            className="text-on-surface-variant hover:text-red-400 transition-colors focus:outline-none"
          >
            <span
              className={`material-symbols-outlined text-lg ${
                currentTrack.isFavorite ? 'text-red-400' : ''
              }`}
              style={{ fontVariationSettings: currentTrack.isFavorite ? "'FILL' 1" : "'FILL' 0" }}
            >
              favorite
            </span>
          </button>
        </div>

        {/* Middle Track Info + Art + Big Play/Pause Button */}
        <div className="flex items-center gap-3.5">
          <div className="relative w-16 h-16 rounded-xl overflow-hidden shadow-md flex-shrink-0 border border-outline-variant/30">
            <img
              src={currentTrack.imageUrl}
              alt={currentTrack.title}
              className="w-full h-full object-cover"
            />
          </div>

          <div className="flex flex-col min-w-0 flex-1">
            <h3 className="text-base font-headline font-semibold text-on-surface truncate">
              {currentTrack.title}
            </h3>
            <p className="text-xs text-on-surface-variant truncate mt-0.5">
              {currentTrack.subtitle}
            </p>
            <div className="flex items-center gap-1.5 text-[10px] text-secondary-fixed-dim mt-1">
              <span className="material-symbols-outlined text-[12px]">group</span>
              <span>Immersive 3D Field</span>
              <span>•</span>
              <span>Looping</span>
            </div>
          </div>

          {/* Glowing Play/Pause Circle Button */}
          <button
            type="button"
            onClick={() => handleTogglePlay()}
            className="w-11 h-11 rounded-full bg-primary text-on-primary flex items-center justify-center shadow-[0_0_18px_rgba(125,211,252,0.4)] hover:scale-105 active:scale-95 transition-all flex-shrink-0 focus:outline-none"
            title={isPlaying ? 'Pause Audio' : 'Play Audio'}
          >
            <span
              className="material-symbols-outlined text-2xl"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              {isPlaying ? 'pause' : 'play_arrow'}
            </span>
          </button>
        </div>

        {/* Live Equalizer Audio Waveform Bars */}
        <div className="flex items-end justify-between gap-1.5 h-6 pt-1 px-1">
          {[25, 60, 40, 85, 55, 95, 30, 75, 45, 90, 65, 35, 80, 50, 70, 40].map((h, i) => (
            <div
              key={i}
              className={`w-1 rounded-full bg-primary/70 transition-all duration-300 ${
                isPlaying ? 'animate-pulse' : 'opacity-40'
              }`}
              style={{
                height: isPlaying ? `${Math.max(15, (h + (i % 3) * 15) % 100)}%` : '20%',
                animationDelay: `${(i * 70) % 600}ms`,
              }}
            />
          ))}
        </div>
      </div>

      {/* RECOMMENDED FREQUENCIES (5 Elements) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-0.5">
          <h3 className="text-xs font-semibold tracking-wider uppercase text-on-surface-variant">
            RECOMMENDED FREQUENCIES
          </h3>
          <span className="text-xs font-semibold text-primary">5 Elements</span>
        </div>

        <div className="space-y-2">
          {filteredTracks.map((track) => {
            const isThisTrackPlaying = currentTrack.id === track.id && isPlaying;
            const isSelected = currentTrack.id === track.id;

            return (
              <div
                key={track.id}
                onClick={() => handleTogglePlay(track)}
                className={`p-3 rounded-xl backdrop-blur-xl border flex items-center justify-between gap-3 cursor-pointer transition-all active:scale-[0.99] ${
                  isSelected
                    ? 'bg-surface-container-high/70 border-primary/40 shadow-[0_0_15px_rgba(125,211,252,0.12)]'
                    : 'bg-surface-container/60 border-outline-variant/30 hover:border-outline-variant/60'
                }`}
              >
                {/* Thumbnail Image */}
                <div className="w-12 h-12 rounded-lg overflow-hidden flex-shrink-0 border border-outline-variant/30">
                  <img
                    src={track.imageUrl}
                    alt={track.title}
                    className="w-full h-full object-cover"
                  />
                </div>

                {/* Title and Info */}
                <div className="flex flex-col min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h4 className="text-xs font-semibold text-on-surface truncate">
                      {track.title}
                    </h4>
                    <span
                      className={`text-[9px] font-semibold px-1.5 py-0.5 rounded-full ${
                        track.tagColor === 'tertiary'
                          ? 'bg-tertiary/15 text-tertiary'
                          : track.tagColor === 'secondary'
                          ? 'bg-secondary/15 text-secondary'
                          : 'bg-primary/15 text-primary'
                      }`}
                    >
                      {track.tag}
                    </span>
                  </div>
                  <p className="text-[11px] text-on-surface-variant truncate mt-0.5">
                    {track.subtitle}
                  </p>
                </div>

                {/* Duration */}
                <span className="text-[11px] text-on-surface-variant font-mono flex-shrink-0">
                  {track.duration}
                </span>

                {/* Favorite Heart Button */}
                <button
                  type="button"
                  onClick={(e) => handleToggleFavorite(e, track.id)}
                  className="text-on-surface-variant hover:text-red-400 transition-colors p-1 focus:outline-none"
                >
                  <span
                    className={`material-symbols-outlined text-base ${
                      track.isFavorite ? 'text-red-400' : ''
                    }`}
                    style={{ fontVariationSettings: track.isFavorite ? "'FILL' 1" : "'FILL' 0" }}
                  >
                    favorite
                  </span>
                </button>

                {/* Play Button Icon */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleTogglePlay(track);
                  }}
                  className={`w-8 h-8 rounded-full flex items-center justify-center transition-all flex-shrink-0 ${
                    isThisTrackPlaying
                      ? 'bg-primary text-on-primary shadow-[0_0_12px_rgba(125,211,252,0.5)]'
                      : 'bg-surface-container-highest text-on-surface-variant hover:text-on-surface'
                  }`}
                >
                  <span
                    className="material-symbols-outlined text-base"
                    style={{ fontVariationSettings: "'FILL' 1" }}
                  >
                    {isThisTrackPlaying ? 'pause' : 'play_arrow'}
                  </span>
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Transition Bell Section */}
      <div className="space-y-3 pt-1">
        {/* Header with Volume and Toggle */}
        <div className="bg-surface-container/60 backdrop-blur-xl rounded-xl p-3.5 border border-outline-variant/30 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                <span className="material-symbols-outlined text-base">notifications</span>
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h4 className="text-xs font-semibold text-on-surface">Transition Bell</h4>
                  <span
                    className={`text-[9px] font-bold px-1.5 py-0.2 rounded-full ${
                      bellEnabled
                        ? 'bg-primary/20 text-primary'
                        : 'bg-surface-container-highest text-on-surface-variant'
                    }`}
                  >
                    {bellEnabled ? 'Enabled' : 'Disabled'}
                  </span>
                </div>
                <p className="text-[10px] text-on-surface-variant">
                  Gentle chime marking phase transitions
                </p>
              </div>
            </div>

            {/* Volume indicator & Bell Enabled Toggle */}
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono text-on-surface-variant">{bellVolume}%</span>
              <button
                type="button"
                onClick={() => {
                  const newVol = bellVolume >= 100 ? 0 : bellVolume + 25;
                  setBellVolume(newVol);
                  audioEngine.setVolume(newVol / 100);
                  if (newVol > 0) audioEngine.playTransitionCue(selectedBell.bellType || selectedBell.id, selectedBell.pitchHz);
                }}
                className="text-on-surface-variant hover:text-primary transition-colors focus:outline-none"
                title="Change Chime Volume"
              >
                <span className="material-symbols-outlined text-base">volume_up</span>
              </button>
              <button
                type="button"
                onClick={onToggleBell}
                aria-label="Toggle Transition Bell"
                className={`w-9 h-5 rounded-full relative p-0.5 transition-colors focus:outline-none ${
                  bellEnabled ? 'bg-primary' : 'bg-surface-container-highest'
                }`}
              >
                <span
                  className={`block w-4 h-4 rounded-full bg-surface-dim transition-transform shadow ${
                    bellEnabled ? 'translate-x-4' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          </div>
        </div>

        {/* List of 5 Transition Bells */}
        <div className="space-y-2">
          {TRANSITION_BELLS.map((bell) => {
            const isSelected = selectedBell.id === bell.id;
            return (
              <div
                key={bell.id}
                onClick={(e) => handleTestBell(e, bell)}
                className={`p-3 rounded-xl backdrop-blur-xl border flex items-center justify-between gap-3 cursor-pointer transition-all active:scale-[0.99] ${
                  isSelected
                    ? 'bg-surface-container-high/80 border-primary/40 shadow-[0_0_12px_rgba(125,211,252,0.12)]'
                    : 'bg-surface-container/60 border-outline-variant/30 hover:border-outline-variant/60'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className={`w-9 h-9 rounded-lg flex items-center justify-center ${
                      isSelected ? 'bg-primary/20 text-primary' : 'bg-surface-container-highest text-on-surface-variant'
                    }`}
                  >
                    <span className="material-symbols-outlined text-base">
                      {bell.bellType === 'water-drop'
                        ? 'water_drop'
                        : bell.bellType === 'temple-bell'
                        ? 'notifications_active'
                        : bell.bellType === 'tibetan-bowl'
                        ? 'radio_button_checked'
                        : bell.bellType === 'wood-block'
                        ? 'straighten'
                        : 'air'}
                    </span>
                  </div>
                  <div className="flex flex-col min-w-0">
                    <div className="flex items-center gap-1.5">
                      <h5 className="text-xs font-semibold text-on-surface truncate">
                        {bell.name}
                      </h5>
                      <span className="text-[10px] font-mono text-secondary-fixed-dim">
                        {bell.freq}
                      </span>
                    </div>
                    <p className="text-[10px] text-on-surface-variant truncate">
                      {bell.description}
                    </p>
                  </div>
                </div>

                {/* Preview chime play button */}
                <button
                  type="button"
                  onClick={(e) => handleTestBell(e, bell)}
                  className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ${
                    isSelected
                      ? 'bg-primary text-on-primary shadow-[0_0_10px_rgba(125,211,252,0.4)]'
                      : 'bg-surface-container-highest text-on-surface-variant hover:text-on-surface'
                  }`}
                  title="Test chime sound"
                >
                  <span
                    className="material-symbols-outlined text-sm"
                    style={{ fontVariationSettings: "'FILL' 1" }}
                  >
                    play_arrow
                  </span>
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
