import React, { useEffect, useRef, useState } from 'react';

/**
 * MouseEffect Component
 * Provides a subtle, luxurious primary-brand cursor ambient glow (Fuchsia / Plum)
 * across the entire application without intercepting any pointer events.
 */
export const MouseEffect: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);
  const spotlightRef = useRef<HTMLDivElement | null>(null);
  const dotRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    // Only enable if device supports hover / fine pointing
    const mediaQuery = window.matchMedia('(hover: hover) and (pointer: fine)');
    if (!mediaQuery.matches) return;

    let targetX = -100;
    let targetY = -100;
    let currentX = -100;
    let currentY = -100;
    let rafId: number | null = null;

    const handleMouseMove = (e: MouseEvent) => {
      targetX = e.clientX;
      targetY = e.clientY;
      if (!isVisible) setIsVisible(true);
    };

    const handleMouseLeave = () => {
      setIsVisible(false);
    };

    const handleMouseEnter = () => {
      setIsVisible(true);
    };

    const animate = () => {
      // Smooth linear interpolation for gentle fluid motion
      const ease = 0.15;
      currentX += (targetX - currentX) * ease;
      currentY += (targetY - currentY) * ease;

      if (spotlightRef.current) {
        spotlightRef.current.style.transform = `translate3d(${currentX}px, ${currentY}px, 0)`;
      }
      if (dotRef.current) {
        // Direct snappy tracking for the subtle inner focal core
        dotRef.current.style.transform = `translate3d(${targetX}px, ${targetY}px, 0)`;
      }

      rafId = requestAnimationFrame(animate);
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    document.addEventListener('mouseleave', handleMouseLeave);
    document.addEventListener('mouseenter', handleMouseEnter);
    rafId = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseleave', handleMouseLeave);
      document.removeEventListener('mouseenter', handleMouseEnter);
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, [isVisible]);

  return (
    <div
      aria-hidden="true"
      className={`pointer-events-none fixed inset-0 z-50 overflow-hidden transition-opacity duration-500 ${
        isVisible ? 'opacity-100' : 'opacity-0'
      }`}
    >
      {/* Soft Ambient Primary Radial Glow */}
      <div
        ref={spotlightRef}
        className="will-change-transform -top-[175px] -left-[175px] absolute w-[350px] h-[350px] rounded-full"
        style={{
          background:
            'radial-gradient(circle, rgba(223, 85, 247, 0.12) 0%, rgba(162, 28, 175, 0.06) 45%, rgba(94, 30, 108, 0) 75%)',
          filter: 'blur(18px)',
        }}
      />

      {/* Tiny Subtle Primary Core Indicator */}
      <div
        ref={dotRef}
        className="will-change-transform -top-1.5 -left-1.5 absolute w-3 h-3 rounded-full bg-fuchsia-500/25 blur-[1px] mix-blend-screen dark:bg-fuchsia-400/35 transition-opacity"
      />
    </div>
  );
};
