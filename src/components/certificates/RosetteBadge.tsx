import React from 'react';

interface RosetteBadgeProps {
  month?: string;
  year?: string;
  className?: string;
  primaryColor?: string;
  accentColor?: string;
}

export const RosetteBadge: React.FC<RosetteBadgeProps> = ({
  month = 'June',
  year = '2026',
  className = '',
  primaryColor = '#0b1b2d',
  accentColor = '#d5a32c'
}) => {
  // Generate 28 pleated radial points around the circle
  const pleatsCount = 28;
  const outerRadius = 78;
  const innerRadius = 66;
  const cx = 110;
  const cy = 95;

  const pleats = Array.from({ length: pleatsCount }).map((_, i) => {
    const angle1 = (i * 2 * Math.PI) / pleatsCount;
    const angle2 = ((i + 0.5) * 2 * Math.PI) / pleatsCount;
    const angle3 = ((i + 1) * 2 * Math.PI) / pleatsCount;

    const x1 = cx + innerRadius * Math.cos(angle1);
    const y1 = cy + innerRadius * Math.sin(angle1);
    const x2 = cx + outerRadius * Math.cos(angle2);
    const y2 = cy + outerRadius * Math.sin(angle2);
    const x3 = cx + innerRadius * Math.cos(angle3);
    const y3 = cy + innerRadius * Math.sin(angle3);

    return `M ${cx} ${cy} L ${x1} ${y1} L ${x2} ${y2} L ${x3} ${y3} Z`;
  });

  return (
    <div className={`relative flex flex-col items-center select-none ${className}`}>
      <svg
        viewBox="0 0 220 340"
        className="w-full h-full drop-shadow-md overflow-visible"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          {/* Radial metallic gold gradient for inner disk */}
          <radialGradient id="rosetteGoldDisk" cx="40%" cy="35%" r="65%">
            <stop offset="0%" stopColor="#fff2ba" />
            <stop offset="35%" stopColor="#f3cb65" />
            <stop offset="70%" stopColor="#d59f2a" />
            <stop offset="100%" stopColor="#a37213" />
          </radialGradient>

          {/* Linear gradient for pleated ribbon wedges */}
          <linearGradient id="pleatLight" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#fad77b" />
            <stop offset="100%" stopColor="#c59223" />
          </linearGradient>
          <linearGradient id="pleatDark" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#c59223" />
            <stop offset="100%" stopColor="#8d610c" />
          </linearGradient>

          {/* Ribbon tails gradient */}
          <linearGradient id="navyRibbon" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor={primaryColor} />
            <stop offset="45%" stopColor={primaryColor} stopOpacity="0.85" />
            <stop offset="100%" stopColor={primaryColor} />
          </linearGradient>
        </defs>

        {/* Hanging Ribbon Tails behind disk */}
        {/* Left Ribbon Tail */}
        <g>
          <path
            d="M 88 120 L 72 320 L 92 295 L 112 320 L 100 120 Z"
            fill="url(#navyRibbon)"
            stroke="#c89b2c"
            strokeWidth="2.2"
          />
          {/* Inner gold pinstripe on left ribbon */}
          <path
            d="M 88 140 L 78 300 L 92 284 L 106 300 L 96 140"
            fill="none"
            stroke="#f5d378"
            strokeWidth="1.2"
            opacity="0.85"
          />
        </g>

        {/* Right Ribbon Tail */}
        <g>
          <path
            d="M 120 120 L 108 320 L 128 295 L 148 320 L 132 120 Z"
            fill="url(#navyRibbon)"
            stroke="#c89b2c"
            strokeWidth="2.2"
          />
          {/* Inner gold pinstripe on right ribbon */}
          <path
            d="M 124 140 L 114 300 L 128 284 L 142 300 L 128 140"
            fill="none"
            stroke="#f5d378"
            strokeWidth="1.2"
            opacity="0.85"
          />
        </g>

        {/* Pleated Ruffled Outer Ring */}
        <g>
          {pleats.map((d, i) => (
            <path
              key={i}
              d={d}
              fill={i % 2 === 0 ? 'url(#pleatLight)' : 'url(#pleatDark)'}
              stroke="#8d610c"
              strokeWidth="0.5"
            />
          ))}
        </g>

        {/* Gold Outer Trim Ring */}
        <circle cx={cx} cy={cy} r={66} fill="#a37213" />
        <circle cx={cx} cy={cy} r={64} fill="#fad77b" />
        <circle cx={cx} cy={cy} r={61} fill="#8d610c" />

        {/* Center Metallic Gold Disc */}
        <circle
          cx={cx}
          cy={cy}
          r={58}
          fill="url(#rosetteGoldDisk)"
          stroke="#fff4cf"
          strokeWidth="2"
        />

        {/* Inner subtle embossed ring */}
        <circle
          cx={cx}
          cy={cy}
          r={51}
          fill="none"
          stroke="#976912"
          strokeWidth="1.5"
          strokeDasharray="3 2"
          opacity="0.6"
        />

        {/* Text inside gold disc */}
        <text
          x={cx}
          y={cy - 6}
          textAnchor="middle"
          dominantBaseline="central"
          fill="#0c1e33"
          fontFamily="'Cinzel', 'Playfair Display', Georgia, serif"
          fontWeight="700"
          fontSize="24"
          letterSpacing="0.5"
        >
          {month}
        </text>
        <text
          x={cx}
          y={cy + 22}
          textAnchor="middle"
          dominantBaseline="central"
          fill="#0c1e33"
          fontFamily="'Cinzel', 'Playfair Display', Georgia, serif"
          fontWeight="800"
          fontSize="25"
          letterSpacing="1"
        >
          {year}
        </text>
      </svg>
    </div>
  );
};
