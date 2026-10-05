import React from 'react';
import { ItemStatus } from '../types';
import { useLanguage } from '../context/LanguageContext';

export interface BadgeProps {
  status?: ItemStatus | string;
  variant?: 'found' | 'pending' | 'dispatched' | 'archived' | 'stored' | 'handedOver' | 'default';
  size?: 'xs' | 'sm' | 'md';
  dot?: boolean;
  pulse?: boolean;
  icon?: React.ReactNode;
  children?: React.ReactNode;
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  status,
  variant,
  size = 'sm',
  dot = true,
  pulse = false,
  icon,
  children,
  className = ''
}) => {
  const { translateStatus } = useLanguage();
  const normalizedStatus = (status || '').toLowerCase().trim();

  // Determine styling based on explicit variant or status text
  let styleClasses = 'bg-slate-100 text-slate-700 border-slate-200';
  let dotColor = 'bg-slate-400';

  if (
    variant === 'found' ||
    normalizedStatus === 'found' ||
    normalizedStatus === 'logged' ||
    normalizedStatus === 'discovered'
  ) {
    styleClasses = 'bg-indigo-50 text-indigo-700 border-indigo-200/80';
    dotColor = 'bg-indigo-500';
  } else if (
    variant === 'stored' ||
    normalizedStatus === 'stored' ||
    normalizedStatus === 'in custody' ||
    normalizedStatus === 'safe custody'
  ) {
    styleClasses = 'bg-amber-50 text-amber-700 border-amber-200';
    dotColor = 'bg-amber-500';
  } else if (
    variant === 'pending' ||
    normalizedStatus.includes('pending') ||
    normalizedStatus === 'under review' ||
    normalizedStatus === 'unclaimed'
  ) {
    styleClasses = 'bg-orange-50 text-orange-700 border-orange-200';
    dotColor = 'bg-orange-500';
  } else if (
    variant === 'dispatched' ||
    normalizedStatus === 'dispatched' ||
    normalizedStatus === 'in transit' ||
    normalizedStatus === 'courier'
  ) {
    styleClasses = 'bg-sky-50 text-sky-700 border-sky-200';
    dotColor = 'bg-sky-500';
  } else if (
    variant === 'handedOver' ||
    normalizedStatus === 'handed over' ||
    normalizedStatus === 'returned' ||
    normalizedStatus === 'claimed'
  ) {
    styleClasses = 'bg-emerald-50 text-emerald-700 border-emerald-200';
    dotColor = 'bg-emerald-500';
  } else if (
    normalizedStatus === 'rejected' ||
    normalizedStatus.includes('reject')
  ) {
    styleClasses = 'bg-rose-50 text-rose-700 border-rose-200';
    dotColor = 'bg-rose-500';
  } else if (
    variant === 'archived' ||
    normalizedStatus === 'archived' ||
    normalizedStatus === 'donated' ||
    normalizedStatus === 'disposed' ||
    normalizedStatus === 'closed'
  ) {
    styleClasses = 'bg-slate-100 text-slate-600 border-slate-200';
    dotColor = 'bg-slate-400';
  }

  // Size variations
  const sizeClasses = {
    xs: 'px-2 py-0.5 text-[10px]',
    sm: 'px-2.5 py-1 text-[11px]',
    md: 'px-3 py-1.5 text-xs'
  }[size];

  const dotSizeClasses = {
    xs: 'w-1.5 h-1.5',
    sm: 'w-2 h-2',
    md: 'w-2.5 h-2.5'
  }[size];

  const content = children || (status ? translateStatus(status) : 'Unknown');

  return (
    <span
      className={`inline-flex items-center space-x-1.5 rtl:space-x-reverse font-semibold uppercase tracking-wider rounded-lg border whitespace-nowrap transition-colors ${sizeClasses} ${styleClasses} ${className}`}
    >
      {dot && (
        <span className="relative flex items-center justify-center">
          {pulse && (
            <span
              className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${dotColor}`}
            />
          )}
          <span className={`inline-block rounded-full ${dotSizeClasses} ${dotColor}`} />
        </span>
      )}
      {icon && <span className="flex-shrink-0">{icon}</span>}
      <span>{content}</span>
    </span>
  );
};

