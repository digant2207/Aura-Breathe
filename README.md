# Aura Breathe 🧘‍♂️✨

A modern, glassmorphic mindfulness and conscious breathing web application designed with the **Glacier — Glassmorphism** design system. Features an interactive guided breathing pacer, procedural Web Audio soundscapes, customizable pranayama breath rhythms, and comprehensive wellness progress tracking.

![Aura Breathe Favicon](public/zen-icon.svg)

---

## 🌟 Key Features

### 1. 🫁 Guided Breathing Pacer
- **Dynamic Luminous Orb & Ring**: Expanding and contracting visual pacer synchronized with distinct breath phases (*Inhale*, *Hold*, *Exhale*, *Rest*).
- **Orbiting Progress Bead**: Smooth circular orbit indicating exact phase completion.
- **Phase Timer & Total Session Clock**: Real-time numerical countdowns for each phase and remaining session time.
- **Cycle Counter**: Visual illuminated round dots tracking total completed cycles.
- **In-Session Audio Controls**: Instant sound mute/unmute and pause/resume capabilities.

### 2. ☀️ Daily Zen (Home Screen)
- **Time-Adaptive Greeting**: Dynamic context awareness (*Good morning*, *Good afternoon*, *Good evening*).
- **Session Duration Presets**: Quick select 5, 10, 15, or 30 minutes, or enter custom session lengths (up to 120 minutes).
- **Preconfigured Breathing Techniques**:
  - **Box Breathing (4-4-4-4)**: Focus, stress management, and autonomic nervous system regulation.
  - **4-7-8 Relax**: Parasympathetic activation, anxiety reduction, and sleep preparation.
  - **Coherence (5.5-0-5.5-0)**: Heart rate variability (HRV) optimization and cardiac coherence.
  - **Awake (2-0-1-0)**: Energizing hyper-oxygenation flow.
  - **Nadi Shodhan (4-4-4-2)**: Traditional alternate nostril balancing rhythm.
- **Custom Rhythm Builder**: Granular second-by-second steppers for Inhale, Hold 1, Exhale, and Hold 2 with 3 savable custom pattern slots.
- **Curated Recommended Sessions**: Quick-launch cards for *Stress Relief*, *Morning Clarity*, and *Deep Sleep Prep*.

### 3. 🎧 Procedural Web Audio Soundscapes & Chimes
- **Zero-Dependency Audio Synthesis**: Pure Web Audio API procedural synthesizers generating rich ambient soundscapes without external audio files:
  - 🌧️ *Gentle Rainfall* (Pink noise + multi-pole bandpass filtering)
  - 🧘 *432Hz Theta Waves* (Binaural beat oscillator pair for deep meditation)
  - 🌊 *Alpine Stream* (Dynamic multi-layer resonant bubbling filter)
  - 🔥 *Warm Embers* (Sub-bass rumble + randomized crackle nodes)
  - 🔔 *Tibetan Singing Bowl* (Dual harmonic sine wave drone at 216Hz)
- **Phase Transition Bells**:
  - *Tibetan Singing Bowl (216Hz)*
  - *Zen Temple Chime (528Hz)*
  - *Koshi Wind Chime (432Hz)*
- **Interactive Equalizer & Visualizer**: Animated waveform equalizer responding to playback state.

### 4. 📊 Wellness & Progress Analytics
- **Daily Momentum**: Real-time tracking of active streaks, mindful minutes against daily targets, and resting heart rate trends.
- **Weekly Rhythm Visualizer**: 7-day interactive bar graph displaying mindful minutes per day, identifying peak calm days, and measuring weekly growth percentages.
- **Metrics Grid**: Total sessions completed, heart rate reduction averages, longest historical streak, and lifetime breath cycles.
- **Milestones & Badges**: Achievement system rewarding consistency, nocturnal breathing, and deep mastery.
- **Preferences & Rituals**: Configurable daily reminder toggles, haptic guidance cues, and spatial audio fidelity settings.

---

## 🎨 Design Philosophy: Glacier Glassmorphism

- **Obsidian Dark Canvas**: Deep navy-black `#0a0e1a` base layer with radial ambient ice-blue (`#7dd3fc`) and lavender (`#c8a0f0`) light orbs.
- **Layered Frosted Glass**: `backdrop-blur-xl` translucent surfaces with subtle border reflections (`border-outline-variant/30`).
- **Typography & Motion**: Modern geometric hierarchy with fluid breathing animations and high-contrast accessibility.

---

## 🛠️ Tech Stack

- **Framework**: [React 19](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/)
- **Build Tool**: [Vite 6](https://vitejs.dev/)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/)
- **Animation**: [Motion](https://motion.dev/)
- **Audio**: Web Audio API (Synthesized oscillators, biquad filters, and noise buffers)
- **Icons**: [Lucide React](https://lucide.dev/) & Material Symbols

---

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (version 18.0 or higher)
- [npm](https://www.npmjs.com/) or [bun](https://bun.sh/)

### Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/your-username/aura-breathe.git
   cd aura-breathe
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Start development server**:
   ```bash
   npm run dev
   ```

4. **Open in browser**:
   Visit `http://localhost:3000` (or the port specified in terminal).

### Available Scripts

- `npm run dev`: Starts the Vite development server.
- `npm run build`: Bundles the application for production.
- `npm run preview`: Locally previews the production build.
- `npm run lint`: Runs TypeScript type checking (`tsc --noEmit`).

---

## 📁 Project Structure

```text
├── public/
│   ├── zen-icon.svg          # Vector Zen Lotus application icon & favicon
│   └── assets/               # Static visual media assets
├── src/
│   ├── components/
│   │   ├── Header.tsx        # Persistent frosted top header
│   │   ├── BottomNav.tsx     # Floating glassmorphic bottom navigation
│   │   ├── ZenLogo.tsx       # Neon geometric blooming lotus vector logo
│   │   ├── DailyZenScreen.tsx# Home screen with duration & rhythm customizer
│   │   ├── BreatheScreen.tsx # Interactive visual & audio breathing pacer
│   │   ├── SoundscapesScreen.tsx # Procedural audio biomes & transition bells
│   │   └── ProgressScreen.tsx# Analytics, streaks, weekly chart, and badges
│   ├── data/
│   │   └── mockData.ts       # Presets, badges, tracks, and initial statistics
│   ├── utils/
│   │   └── soundEngine.ts    # Web Audio API soundscape synthesizer
│   ├── types.ts              # Global TypeScript interfaces and types
│   ├── App.tsx               # Root application state and navigation controller
│   ├── main.tsx              # React application DOM entry point
│   └── index.css             # Tailwind CSS imports and theme configurations
├── index.html                # HTML entry point and metadata tags
├── metadata.json             # Application metadata and capability declarations
├── package.json              # Project dependencies and build scripts
├── tsconfig.json             # TypeScript compiler configuration
└── vite.config.ts            # Vite bundler configuration
```

---

## 📄 License

This project is licensed under the [Apache-2.0 License](LICENSE).
