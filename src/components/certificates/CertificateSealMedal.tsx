import React from 'react';
import { CertificateBadgeStyle } from '../../types';
import { RosetteBadge } from './RosetteBadge';

interface CertificateSealMedalProps {
  style?: CertificateBadgeStyle;
  badgeText?: string;
  badgeSubtext?: string;
  awardPeriod?: string;
  primaryColor?: string;
  accentColor?: string;
  className?: string;
}

export const CertificateSealMedal: React.FC<CertificateSealMedalProps> = ({
  style = 'rosette',
  badgeText = 'SEAL OF EXCELLENCE',
  badgeSubtext = '5-STAR LUXURY',
  awardPeriod = 'June 2026',
  primaryColor = '#0b1b2d',
  accentColor = '#d5a32c',
  className = ''
}) => {
  // Parse month and year from awardPeriod if possible
  const parts = (awardPeriod || '').split(' ');
  const month = parts[0] || 'June';
  const year = parts[1] || '2026';

  // 1. Rosette Badge (Pleated Navy & Gold ribbon)
  if (style === 'rosette') {
    return (
      <RosetteBadge
        month={month}
        year={year}
        className={className}
        primaryColor={primaryColor}
        accentColor={accentColor}
      />
    );
  }

  // 2. Royal Gold Foil Wax Stamp with Serrated Star Points
  if (style === 'gold_seal') {
    const pointsCount = 36;
    const outerR = 64;
    const innerR = 56;
    const cx = 80;
    const cy = 80;

    const points = Array.from({ length: pointsCount }).map((_, i) => {
      const a1 = (i * 2 * Math.PI) / pointsCount;
      const a2 = ((i + 0.5) * 2 * Math.PI) / pointsCount;
      const x1 = cx + innerR * Math.cos(a1);
      const y1 = cy + innerR * Math.sin(a1);
      const x2 = cx + outerR * Math.cos(a2);
      const y2 = cy + outerR * Math.sin(a2);
      return `${i === 0 ? 'M' : 'L'} ${x1} ${y1} L ${x2} ${y2}`;
    }).join(' ') + ' Z';

    return (
      <div className={`relative flex flex-col items-center select-none ${className}`}>
        <svg viewBox="0 0 160 220" className="w-full h-full drop-shadow-md overflow-visible" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <radialGradient id="goldSealGrad" cx="35%" cy="30%" r="70%">
              <stop offset="0%" stopColor="#fff6c8" />
              <stop offset="40%" stopColor="#f3cb65" />
              <stop offset="80%" stopColor={accentColor} />
              <stop offset="100%" stopColor="#875e0c" />
            </radialGradient>
            <linearGradient id="goldRibbonGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={accentColor} />
              <stop offset="50%" stopColor="#fad77b" />
              <stop offset="100%" stopColor="#875e0c" />
            </linearGradient>
          </defs>

          {/* Ribbons hanging below seal */}
          <g>
            <path d="M 64 90 L 48 200 L 68 180 L 84 200 L 76 90 Z" fill="url(#goldRibbonGrad)" stroke="#74510a" strokeWidth="1.5" />
            <path d="M 96 90 L 88 200 L 104 180 L 124 200 L 108 90 Z" fill="url(#goldRibbonGrad)" stroke="#74510a" strokeWidth="1.5" />
          </g>

          {/* Serrated Starburst Edge */}
          <path d={points} fill="url(#goldSealGrad)" stroke="#875e0c" strokeWidth="1.5" filter="drop-shadow(0 2px 4px rgba(0,0,0,0.18))" />

          {/* Inner Golden Ring */}
          <circle cx={cx} cy={cy} r="46" fill="none" stroke="#ffffff" strokeWidth="2.5" opacity="0.8" strokeDasharray="3 2" />
          <circle cx={cx} cy={cy} r="42" fill="none" stroke="#74510a" strokeWidth="1.2" />

          {/* Text in Center */}
          <text x={cx} y="58" textAnchor="middle" fill="#583c07" fontSize="7.5" fontWeight="900" fontFamily="serif" letterSpacing="1.5">
            ★ ★ ★ ★ ★
          </text>
          <text x={cx} y="74" textAnchor="middle" fill="#382502" fontSize="9" fontWeight="900" fontFamily="serif" letterSpacing="0.8">
            {badgeText.length > 16 ? badgeText.slice(0, 16) : badgeText}
          </text>
          <text x={cx} y="88" textAnchor="middle" fill="#583c07" fontSize="6.5" fontWeight="800" fontFamily="serif" letterSpacing="1">
            {badgeSubtext.length > 18 ? badgeSubtext.slice(0, 18) : badgeSubtext}
          </text>
          <text x={cx} y="100" textAnchor="middle" fill="#74510a" fontSize="7" fontWeight="bold" fontFamily="sans-serif">
            {year}
          </text>
        </svg>
      </div>
    );
  }

  // 3. Laurel Crest Wreath Medallion
  if (style === 'laurel_crest') {
    return (
      <div className={`relative flex flex-col items-center select-none ${className}`}>
        <svg viewBox="0 0 160 160" className="w-full h-full drop-shadow-md overflow-visible" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <radialGradient id="laurelDiskGrad" cx="35%" cy="30%" r="70%">
              <stop offset="0%" stopColor="#fff9d8" />
              <stop offset="60%" stopColor={accentColor} />
              <stop offset="100%" stopColor="#7a540a" />
            </radialGradient>
          </defs>

          {/* Golden Center Coin */}
          <circle cx="80" cy="80" r="50" fill="url(#laurelDiskGrad)" stroke="#7a540a" strokeWidth="2.5" />
          <circle cx="80" cy="80" r="44" fill="none" stroke="#ffffff" strokeWidth="1.5" opacity="0.75" />

          {/* Laurel Leaves Arcs (Left and Right) */}
          <path
            d="M 46 96 C 30 75, 34 45, 52 28 C 50 38, 52 48, 58 56 C 54 44, 60 34, 70 26 C 68 36, 72 46, 78 52"
            fill="none"
            stroke={accentColor}
            strokeWidth="3.2"
            strokeLinecap="round"
          />
          <path
            d="M 114 96 C 130 75, 126 45, 108 28 C 110 38, 108 48, 102 56 C 106 44, 100 34, 90 26 C 92 36, 88 46, 82 52"
            fill="none"
            stroke={accentColor}
            strokeWidth="3.2"
            strokeLinecap="round"
          />

          {/* Central Star Crown */}
          <path
            d="M 72 64 L 66 48 L 76 56 L 80 44 L 84 56 L 94 48 L 88 64 Z"
            fill="#523805"
          />
          <text x="80" y="78" textAnchor="middle" fill="#382502" fontSize="8" fontWeight="900" fontFamily="serif" letterSpacing="1">
            DISTINCTION
          </text>
          <text x="80" y="90" textAnchor="middle" fill="#664606" fontSize="6.5" fontWeight="bold" fontFamily="sans-serif" letterSpacing="0.8">
            5-STAR SERVICE
          </text>
          <text x="80" y="102" textAnchor="middle" fill="#523805" fontSize="7" fontWeight="bold">
            ★ {year} ★
          </text>
        </svg>
      </div>
    );
  }

  // 4. Imperial Crown Crest
  if (style === 'crown_crest') {
    return (
      <div className={`relative flex flex-col items-center select-none ${className}`}>
        <svg viewBox="0 0 160 160" className="w-full h-full drop-shadow-lg overflow-visible" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <radialGradient id="crownDiskGrad" cx="30%" cy="30%" r="70%">
              <stop offset="0%" stopColor="#fffbeb" />
              <stop offset="40%" stopColor="#fde047" />
              <stop offset="85%" stopColor={accentColor} />
              <stop offset="100%" stopColor="#854d0e" />
            </radialGradient>
          </defs>
          <circle cx="80" cy="80" r="54" fill="url(#crownDiskGrad)" stroke="#78350f" strokeWidth="2.5" />
          <circle cx="80" cy="80" r="48" fill={primaryColor} stroke={accentColor} strokeWidth="1.8" />
          {/* Royal 5-point Crown */}
          <path
            d="M 52 92 L 56 68 L 68 80 L 80 58 L 92 80 L 104 68 L 108 92 Z"
            fill={accentColor}
            stroke="#ffffff"
            strokeWidth="1.2"
          />
          <circle cx="56" cy="65" r="2.5" fill="#ffffff" />
          <circle cx="80" cy="55" r="3.2" fill="#ffffff" />
          <circle cx="104" cy="65" r="2.5" fill="#ffffff" />
          <text x="80" y="104" textAnchor="middle" fill="#ffffff" fontSize="7.5" fontWeight="900" letterSpacing="1.2">
            IMPERIAL
          </text>
          <text x="80" y="115" textAnchor="middle" fill={accentColor} fontSize="6" fontWeight="bold">
            ★ {year} ★
          </text>
        </svg>
      </div>
    );
  }

  // 5. Shield of Honor & Integrity Crest
  if (style === 'shield_crest') {
    return (
      <div className={`relative flex flex-col items-center select-none ${className}`}>
        <svg viewBox="0 0 160 160" className="w-full h-full drop-shadow-lg overflow-visible" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="shieldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#fef08a" />
              <stop offset="50%" stopColor={accentColor} />
              <stop offset="100%" stopColor="#854d0e" />
            </linearGradient>
          </defs>
          {/* Shield Outline */}
          <path
            d="M 80 24 L 122 40 C 122 84 104 116 80 138 C 56 116 38 84 38 40 Z"
            fill="url(#shieldGrad)"
            stroke="#78350f"
            strokeWidth="2.5"
          />
          <path
            d="M 80 32 L 114 45 C 114 80 99 108 80 126 C 61 108 46 80 46 45 Z"
            fill={primaryColor}
            stroke={accentColor}
            strokeWidth="1.5"
          />
          {/* Star in Center */}
          <polygon
            points="80,50 85,65 101,65 88,75 93,90 80,81 67,90 72,75 59,65 75,65"
            fill={accentColor}
            stroke="#ffffff"
            strokeWidth="0.8"
          />
          <text x="80" y="103" textAnchor="middle" fill="#ffffff" fontSize="7" fontWeight="900" letterSpacing="1">
            PROTECTION
          </text>
          <text x="80" y="113" textAnchor="middle" fill={accentColor} fontSize="5.8" fontWeight="bold">
            WARWICK HOTEL
          </text>
        </svg>
      </div>
    );
  }

  // 6. Star Medallion
  return (
    <div className={`relative flex flex-col items-center select-none ${className}`}>
      <svg viewBox="0 0 160 160" className="w-full h-full drop-shadow-md overflow-visible" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <radialGradient id="starMedalGrad" cx="30%" cy="30%" r="70%">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="35%" stopColor="#f7d477" />
            <stop offset="85%" stopColor={accentColor} />
            <stop offset="100%" stopColor="#694706" />
          </radialGradient>
        </defs>
        {/* Octagram star */}
        <polygon
          points="80,18 96,52 134,52 105,76 116,112 80,90 44,112 55,76 26,52 64,52"
          fill="url(#starMedalGrad)"
          stroke="#74510a"
          strokeWidth="2.5"
          strokeLinejoin="round"
        />
        <circle cx="80" cy="74" r="26" fill={primaryColor} stroke={accentColor} strokeWidth="2" />
        <text x="80" y="72" textAnchor="middle" fill="#ffffff" fontSize="8" fontWeight="bold" fontFamily="serif">
          EXCELLENCE
        </text>
        <text x="80" y="82" textAnchor="middle" fill={accentColor} fontSize="6" fontWeight="bold">
          WARWICK
        </text>
      </svg>
    </div>
  );
};
