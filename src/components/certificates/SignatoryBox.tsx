import React from 'react';
import { PenTool } from 'lucide-react';

interface SignatoryBoxProps {
  title: string;
  name?: string;
  signatureUrl?: string;
  lineColor?: string;
  textColor?: string;
  className?: string;
  onSignClick?: () => void;
  width?: string;
}

export const SignatoryBox: React.FC<SignatoryBoxProps> = ({
  title,
  name,
  signatureUrl,
  lineColor = '#0b1b2d',
  textColor = '#0b1b2d',
  className = '',
  onSignClick,
  width = '200px'
}) => {
  return (
    <div
      className={`text-center relative group select-none ${className}`}
      style={{ width }}
    >
      {/* Signature Graphic Area (Height ~56px) */}
      <div className="h-14 flex items-end justify-center mb-1 relative">
        {signatureUrl ? (
          <img
            src={signatureUrl}
            alt={`${title} Signature`}
            className="max-h-14 max-w-[200px] object-contain filter drop-shadow-2xs"
          />
        ) : name ? (
          <div
            className="font-serif italic text-[16px] leading-tight select-none"
            style={{ color: textColor }}
          >
            {name}
          </div>
        ) : (
          <div className="h-6" />
        )}

        {/* Hover quick sign prompt if interactive callback provided */}
        {onSignClick && (
          <button
            type="button"
            onClick={onSignClick}
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-2xs text-white rounded opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1 text-[11px] font-medium cursor-pointer"
            title="Click to sign with pen canvas"
          >
            <PenTool className="w-3.5 h-3.5" />
            <span>{signatureUrl ? 'Change Signature' : 'Draw Signature'}</span>
          </button>
        )}
      </div>

      {/* Signature Baseline Line */}
      <div
        className="w-full h-[1.5px] mb-1.5"
        style={{ backgroundColor: lineColor }}
      />

      {/* Official Signatory Title */}
      <div
        className="text-[12.5px] font-bold uppercase tracking-wider leading-tight"
        style={{ color: textColor }}
      >
        {title}
      </div>

      {/* Signatory Name beneath title if signature graphic is present */}
      {signatureUrl && name && (
        <div
          className="text-[10px] text-slate-500 font-medium tracking-wide mt-0.5 truncate"
          style={{ opacity: 0.85 }}
        >
          {name}
        </div>
      )}
    </div>
  );
};
