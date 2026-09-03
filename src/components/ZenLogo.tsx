import React from 'react';

interface ZenLogoProps {
  className?: string;
  size?: number;
  showText?: boolean;
}

export const ZenLogo: React.FC<ZenLogoProps> = ({
  className = '',
  size = 36,
  showText = true,
}) => {
  return (
    <div
      style={{ width: size, height: size }}
      className={`relative rounded-xl bg-gradient-to-b from-[#10192e] to-[#070b16] p-1 border border-cyan-400/40 shadow-[0_0_15px_rgba(34,211,238,0.25)] flex items-center justify-center flex-shrink-0 group overflow-hidden ${className}`}
    >
      {/* Ambient background glow inside the icon squircle */}
      <div className="absolute inset-0 bg-radial-gradient from-cyan-400/20 via-transparent to-transparent pointer-events-none" />

      <svg
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full drop-shadow-[0_0_6px_rgba(56,189,248,0.6)]"
      >
        <defs>
          <linearGradient id="lotusGlowGrad" x1="50%" y1="0%" x2="50%" y2="100%">
            <stop offset="0%" stopColor="#a5f3fc" />
            <stop offset="60%" stopColor="#38bdf8" />
            <stop offset="100%" stopColor="#0891b2" />
          </linearGradient>

          <linearGradient id="petalSideGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#67e8f9" />
            <stop offset="100%" stopColor="#0284c7" />
          </linearGradient>

          <filter id="bloomFilter" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="2.5" result="glow" />
            <feMerge>
              <feMergeNode in="glow" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Outer Left Leaf / Petal */}
        <path
          d="M 50 62 C 30 58 16 48 24 38 C 30 46 40 54 50 62 Z"
          fill="url(#petalSideGrad)"
          opacity="0.8"
          filter="url(#bloomFilter)"
        />

        {/* Outer Right Leaf / Petal */}
        <path
          d="M 50 62 C 70 58 84 48 76 38 C 70 46 60 54 50 62 Z"
          fill="url(#petalSideGrad)"
          opacity="0.8"
          filter="url(#bloomFilter)"
        />

        {/* Mid-Inner Left Petal */}
        <path
          d="M 50 62 C 34 50 30 32 42 22 C 45 34 47 48 50 62 Z"
          fill="url(#petalSideGrad)"
          opacity="0.9"
          filter="url(#bloomFilter)"
        />

        {/* Mid-Inner Right Petal */}
        <path
          d="M 50 62 C 66 50 70 32 58 22 C 55 34 53 48 50 62 Z"
          fill="url(#petalSideGrad)"
          opacity="0.9"
          filter="url(#bloomFilter)"
        />

        {/* Central Crown Petal */}
        <path
          d="M 50 14 C 43 28 43 45 50 62 C 57 45 57 28 50 14 Z"
          fill="url(#lotusGlowGrad)"
          filter="url(#bloomFilter)"
        />

        {/* Calyx / Lotus Base Ripple Crescent */}
        <path
          d="M 33 64 C 43 68 57 68 67 64 C 61 67 39 67 33 64 Z"
          fill="#a5f3fc"
          opacity="0.9"
        />
        <circle cx="50" cy="63" r="1.5" fill="#e0f2fe" />

        {/* ZEN Label below lotus */}
        {showText && (
          <text
            x="50"
            y="85"
            textAnchor="middle"
            fill="#a5f3fc"
            fontSize="12.5"
            fontWeight="700"
            fontFamily="system-ui, -apple-system, sans-serif"
            letterSpacing="3.5"
            style={{ filter: 'drop-shadow(0 0 4px rgba(34, 211, 238, 0.8))' }}
          >
            ZEN
          </text>
        )}
      </svg>
    </div>
  );
};
