/**
 * Helper to generate consistent, modern Vector Avatars (PNG/SVG) for staff and users.
 * Uses reliable public vector avatar generators (DiceBear personas / adventurer / bottts / initials)
 * based on the user's name/email/ID so every user gets a unique, attractive avatar.
 */

export const AVATAR_STYLES = [
  'adventurer',
  'avataaars',
  'bottts',
  'fun-emoji',
  'lorelei',
  'micah',
  'notionists',
  'personas'
] as const;

export type AvatarStyle = typeof AVATAR_STYLES[number];

/**
 * Returns a high-res vector avatar URL for a given identifier (name, email, or id)
 * Default style: 'personas' / 'adventurer' for clean, modern hotel staff avatars.
 */
export function getVectorAvatarUrl(
  identifier?: string | null,
  options?: {
    style?: AvatarStyle;
    size?: number;
    backgroundColor?: string;
  }
): string {
  if (!identifier || !identifier.trim()) {
    return `https://api.dicebear.com/7.x/personas/svg?seed=warwick-staff&backgroundColor=e0e7ff`;
  }

  const cleanSeed = encodeURIComponent(identifier.trim().toLowerCase());
  const style = options?.style || 'personas';
  const size = options?.size || 128;
  const bg = options?.backgroundColor || 'b6e3f4,c0aede,d1d4f9,ffd5dc,ffdfbf';

  return `https://api.dicebear.com/7.x/${style}/svg?seed=${cleanSeed}&backgroundColor=${bg}&size=${size}`;
}

/**
 * Helper component that renders the vector avatar with graceful initials fallback
 */
import React, { useState } from 'react';

interface UserAvatarProps {
  name?: string | null;
  avatarUrl?: string | null;
  className?: string;
  sizeClassName?: string;
  alt?: string;
  styleVariant?: AvatarStyle;
}

export const UserAvatar: React.FC<UserAvatarProps> = ({
  name = 'Staff Member',
  avatarUrl,
  className = '',
  sizeClassName = 'w-9 h-9',
  alt,
  styleVariant = 'personas'
}) => {
  const [hasError, setHasError] = useState(false);

  // If user provided custom image/avatar in database, use it. Otherwise use generated vector avatar.
  const resolvedUrl = avatarUrl || getVectorAvatarUrl(name, { style: styleVariant });

  const getInitials = (str?: string | null) => {
    if (!str) return 'U';
    const parts = str.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return str.substring(0, 2).toUpperCase();
  };

  if (hasError) {
    return (
      <div
        className={`${sizeClassName} rounded-xl bg-gradient-to-tr from-indigo-600 to-indigo-500 text-white font-bold text-xs flex items-center justify-center shadow-2xs shrink-0 select-none ${className}`}
        title={name || 'User'}
      >
        {getInitials(name)}
      </div>
    );
  }

  return (
    <div
      className={`relative ${sizeClassName} rounded-xl overflow-hidden bg-slate-100 border border-slate-200/80 shadow-2xs shrink-0 ${className}`}
      title={name || 'User'}
    >
      <img
        src={resolvedUrl}
        alt={alt || name || 'Avatar'}
        className="w-full h-full object-cover rounded-xl"
        loading="lazy"
        onError={() => setHasError(true)}
      />
    </div>
  );
};
