import { useEffect, useRef } from 'react';
import { useTheme } from '@/hooks/useTheme';

/**
 * Premium Animated Background System - Enhanced Visuals
 */

const THEME_CONFIG = {
  dark: {
    particleColors: ['#6366f1', '#3b82f6', '#8b5cf6', '#06b6d4'],
    lineColor: (dist: number, max: number) => `rgba(99, 102, 241, ${0.35 * (1 - dist / max)})`,
    particleOpacity: 0.7,
    blendMode: 'screen' as GlobalCompositeOperation,
    parallaxFactor: 0.04,
    maxLineDist: 150,
  },
  light: {
    particleColors: ['#6366f1', '#3b82f6', '#8b5cf6', '#06b6d4'],
    lineColor: (dist: number, max: number) => `rgba(99, 102, 241, ${0.2 * (1 - dist / max)})`,
    particleOpacity: 0.6,
    blendMode: 'multiply' as GlobalCompositeOperation,
    parallaxFactor: 0.02,
    maxLineDist: 140,
  },
};

export default function ParticleNetwork({ isDark: isDarkProp }: { isDark?: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { isDark: isDarkHook } = useTheme();
  const isDark = isDarkProp !== undefined ? isDarkProp : isDarkHook;
  const currentTheme = isDark ? THEME_CONFIG.dark : THEME_CONFIG.light;
  const mouseRef = useRef({ x: window.innerWidth / 2, y: window.innerHeight / 2 });
  const isVisibleRef = useRef(true);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) return;

    let particlesArray: Particle[] = [];
    let shootingStars: ShootingStar[] = [];
    let animationFrameId: number;
    let time = 0;

    const observer = new IntersectionObserver(
      ([entry]) => {
        isVisibleRef.current = entry.isIntersecting;
      },
      { threshold: 0.05 }
    );
    observer.observe(canvas);

    const getResponsiveConfig = () => {
      const width = window.innerWidth;
      if (width < 640) return { count: 20, parallax: 0 };
      if (width < 1024) return { count: 40, parallax: 0.3 };
      return { count: 65, parallax: 0.7 };
    };

    class ShootingStar {
      x: number;
      y: number;
      length: number;
      speed: number;
      opacity: number;

      constructor(w: number, h: number) {
        this.x = Math.random() * w;
        this.y = Math.random() * h;
        this.length = Math.random() * 80 + 40;
        this.speed = Math.random() * 10 + 5;
        this.opacity = 0;
      }

      update(w: number, h: number) {
        this.x += this.speed;
        this.y += this.speed * 0.5;
        if (this.x > w || this.y > h) {
          this.x = -this.length;
          this.y = Math.random() * h;
        }
      }

      draw() {
        if (!ctx) return;
        const grad = ctx.createLinearGradient(this.x, this.y, this.x + this.length, this.y + this.length * 0.5);
        grad.addColorStop(0, `rgba(99, 102, 241, 0)`);
        grad.addColorStop(1, `rgba(99, 102, 241, ${isDark ? 0.3 : 0.15})`);
        ctx.beginPath();
        ctx.strokeStyle = grad;
        ctx.lineWidth = 1.5;
        ctx.moveTo(this.x, this.y);
        ctx.lineTo(this.x + this.length, this.y + this.length * 0.5);
        ctx.stroke();
      }
    }

    class Particle {
      x: number;
      y: number;
      baseX: number;
      baseY: number;
      size: number;
      speedX: number;
      speedY: number;
      color: string;
      pulse: number;
      pulseSpeed: number;
      depth: number;

      constructor(w: number, h: number) {
        this.x = Math.random() * w;
        this.y = Math.random() * h;
        this.baseX = this.x;
        this.baseY = this.y;
        this.depth = Math.random();
        this.size = (Math.random() * 1.2 + 0.8) * (0.8 + this.depth * 0.4);
        this.speedX = (Math.random() - 0.5) * 0.4 * (0.5 + this.depth);
        this.speedY = (Math.random() - 0.5) * 0.4 * (0.5 + this.depth);
        this.color = currentTheme.particleColors[Math.floor(Math.random() * currentTheme.particleColors.length)];
        this.pulse = Math.random() * Math.PI;
        this.pulseSpeed = 0.01 + Math.random() * 0.02;
      }

      update(w: number, h: number, parallax: number) {
        this.baseX += this.speedX;
        this.baseY += this.speedY;
        if (this.baseX > w) this.baseX = 0; else if (this.baseX < 0) this.baseX = w;
        if (this.baseY > h) this.baseY = 0; else if (this.baseY < 0) this.baseY = h;

        const dx = (mouseRef.current.x - w / 2) * currentTheme.parallaxFactor * parallax * (0.5 + this.depth);
        const dy = (mouseRef.current.y - h / 2) * currentTheme.parallaxFactor * parallax * (0.5 + this.depth);
        this.x = this.baseX + dx;
        this.y = this.baseY + dy;
        this.pulse += this.pulseSpeed;
      }

      draw() {
        if (!ctx) return;
        const pulseVal = Math.sin(this.pulse);
        const opacity = currentTheme.particleOpacity * (0.7 + pulseVal * 0.3);
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size * 2, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.globalAlpha = opacity * 0.25;
        ctx.fill();
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fillStyle = isDark ? '#ffffff' : this.color;
        ctx.globalAlpha = opacity;
        ctx.fill();
      }
    }

    const init = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      const { count } = getResponsiveConfig();
      particlesArray = Array.from({ length: count }, () => new Particle(canvas.width, canvas.height));
      shootingStars = Array.from({ length: 3 }, () => new ShootingStar(canvas.width, canvas.height));
    };

    const drawGrid = () => {
      if (!ctx || isDark) return;
      const step = 60;
      ctx.beginPath();
      ctx.strokeStyle = 'rgba(99, 102, 241, 0.03)';
      ctx.lineWidth = 0.5;
      for (let x = 0; x < canvas.width; x += step) {
        ctx.moveTo(x, 0); ctx.lineTo(x, canvas.height);
      }
      for (let y = 0; y < canvas.height; y += step) {
        ctx.moveTo(0, y); ctx.lineTo(canvas.width, y);
      }
      ctx.stroke();
    };

    const drawGradientFog = () => {
      if (!ctx) return;
      const w = canvas.width, h = canvas.height;
      ctx.globalAlpha = 1;
      const timeShiftX = Math.sin(time * 0.0004) * 80;
      const timeShiftY = Math.cos(time * 0.0004) * 80;
      const grad1 = ctx.createRadialGradient(w * 0.2 + timeShiftX, h * 0.2 + timeShiftY, 0, w * 0.2 + timeShiftX, h * 0.2 + timeShiftY, w * 0.7);
      grad1.addColorStop(0, isDark ? 'rgba(99, 102, 241, 0.05)' : 'rgba(99, 102, 241, 0.03)');
      grad1.addColorStop(1, 'rgba(0,0,0,0)');
      const grad2 = ctx.createRadialGradient(w * 0.8 - timeShiftX, h * 0.8 - timeShiftY, 0, w * 0.8 - timeShiftX, h * 0.8 - timeShiftY, w * 0.8);
      grad2.addColorStop(0, isDark ? 'rgba(139, 92, 246, 0.05)' : 'rgba(139, 92, 246, 0.03)');
      grad2.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = grad1; ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = grad2; ctx.fillRect(0, 0, w, h);
    };

    const animate = () => {
      if (!isVisibleRef.current) { animationFrameId = requestAnimationFrame(animate); return; }
      if (!ctx) return;
      time += 16;
      ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = 1;
      ctx.fillStyle = isDark ? '#050505' : '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      drawGrid();
      drawGradientFog();
      const { parallax } = getResponsiveConfig();
      const maxDist = currentTheme.maxLineDist;
      ctx.globalCompositeOperation = currentTheme.blendMode;
      shootingStars.forEach(s => { s.update(canvas.width, canvas.height); s.draw(); });
      particlesArray.forEach((p1, i) => {
        p1.update(canvas.width, canvas.height, parallax); p1.draw();
        for (let j = i + 1; j < particlesArray.length; j++) {
          const p2 = particlesArray[j];
          const dx = p1.x - p2.x, dy = p1.y - p2.y, distSq = dx * dx + dy * dy;
          if (distSq < maxDist * maxDist) {
            const distance = Math.sqrt(distSq);
            ctx.beginPath();
            ctx.strokeStyle = currentTheme.lineColor(distance, maxDist);
            ctx.globalAlpha = 1; ctx.lineWidth = 0.5 * (1 - distance / maxDist);
            ctx.moveTo(p1.x, p1.y); ctx.lineTo(p2.x, p2.y); ctx.stroke();
          }
        }
      });
      animationFrameId = requestAnimationFrame(animate);
    };

    init(); animate();
    const handleResize = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight; init(); };
    const handleMouseMove = (e: MouseEvent) => { mouseRef.current = { x: e.clientX, y: e.clientY }; };
    window.addEventListener('resize', handleResize); window.addEventListener('mousemove', handleMouseMove);
    return () => { observer.disconnect(); window.removeEventListener('resize', handleResize); window.removeEventListener('mousemove', handleMouseMove); cancelAnimationFrame(animationFrameId); };
  }, [isDark]);

  return (
    <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
      <div 
        className={`absolute inset-0 transition-opacity duration-1000 ${isDark ? 'opacity-0' : 'opacity-100'}`}
        style={{
          background: 'radial-gradient(circle at 50% 50%, rgba(248, 250, 252, 0) 0%, rgba(238, 244, 255, 0.4) 100%)'
        }}
      />
      <canvas ref={canvasRef} className="w-full h-full" />
    </div>
  );
}
