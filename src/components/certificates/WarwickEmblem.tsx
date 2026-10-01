import React from 'react';

interface WarwickEmblemProps {
  className?: string;
  color?: string;
  size?: number | string;
  strokeWidth?: number;
}

export const WarwickEmblem: React.FC<WarwickEmblemProps> = ({
  className = 'w-16 h-12',
  color = '#c59b27',
  strokeWidth = 4.2
}) => {
  return (
    <svg
      viewBox="0 0 120 90"
      className={className}
      fill="none"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id="warwickGoldGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#f3d77d" />
          <stop offset="50%" stopColor="#c59b27" />
          <stop offset="100%" stopColor="#9a731b" />
        </linearGradient>
      </defs>
      {/* Crown arches forming the Warwick monogram */}
      <path
        d="M 22 62 C 12 36, 18 16, 28 16 C 38 16, 42 46, 48 46 C 51 46, 48 22, 60 22 C 72 22, 69 46, 72 46 C 78 46, 82 16, 92 16 C 102 16, 108 36, 98 62"
        stroke={color === 'gold' ? 'url(#warwickGoldGradient)' : color}
      />
      {/* Bottom base chevron */}
      <path
        d="M 24 64 L 60 76 L 96 64"
        stroke={color === 'gold' ? 'url(#warwickGoldGradient)' : color}
      />
    </svg>
  );
};
