// Lightweight, high-performance canvas confetti celebration utility

export function triggerConfetti(options?: { count?: number; duration?: number }) {
  if (typeof window === 'undefined' || typeof document === 'undefined') return;

  const count = options?.count ?? 60;
  const duration = options?.duration ?? 2500;

  const canvas = document.createElement('canvas');
  canvas.style.position = 'fixed';
  canvas.style.top = '0';
  canvas.style.left = '0';
  canvas.style.width = '100vw';
  canvas.style.height = '100vh';
  canvas.style.pointerEvents = 'none';
  canvas.style.zIndex = '99999';
  document.body.appendChild(canvas);

  const ctx = canvas.getContext('2d');
  if (!ctx) {
    canvas.remove();
    return;
  }

  const dpr = window.devicePixelRatio || 1;
  canvas.width = window.innerWidth * dpr;
  canvas.height = window.innerHeight * dpr;
  ctx.scale(dpr, dpr);

  const colors = [
    '#4F46E5', '#6366F1', '#818CF8', // Indigo
    '#F59E0B', '#FBBF24', '#D97706', // Gold/Amber
    '#10B981', '#34D399', '#059669', // Emerald
    '#EC4899', '#F43F5E', '#3B82F6'  // Rose / Blue
  ];

  interface Particle {
    x: number;
    y: number;
    vx: number;
    vy: number;
    size: number;
    color: string;
    rotation: number;
    rotationSpeed: number;
    opacity: number;
    shape: 'rect' | 'circle';
  }

  const particles: Particle[] = [];
  const originX = window.innerWidth / 2;
  const originY = window.innerHeight * 0.45;

  for (let i = 0; i < count; i++) {
    const angle = (Math.PI * 2 * i) / count + (Math.random() * 0.4 - 0.2);
    const speed = 4 + Math.random() * 9;
    particles.push({
      x: originX,
      y: originY,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - 3.5,
      size: 5 + Math.random() * 6,
      color: colors[Math.floor(Math.random() * colors.length)],
      rotation: Math.random() * Math.PI * 2,
      rotationSpeed: (Math.random() - 0.5) * 0.2,
      opacity: 1,
      shape: Math.random() > 0.4 ? 'rect' : 'circle'
    });
  }

  const startTime = performance.now();

  function animate(now: number) {
    const elapsed = now - startTime;
    const progress = elapsed / duration;

    if (progress >= 1 || !ctx) {
      canvas.remove();
      return;
    }

    ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);

    particles.forEach(p => {
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.22; // gravity
      p.vx *= 0.98; // air resistance
      p.rotation += p.rotationSpeed;
      p.opacity = Math.max(0, 1 - progress);

      ctx.save();
      ctx.globalAlpha = p.opacity;
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rotation);
      ctx.fillStyle = p.color;

      if (p.shape === 'rect') {
        ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6);
      } else {
        ctx.beginPath();
        ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    });

    requestAnimationFrame(animate);
  }

  requestAnimationFrame(animate);
}
