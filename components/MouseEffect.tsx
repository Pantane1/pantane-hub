
import React, { useEffect, useRef } from 'react';

interface Particle {
  x: number;
  y: number;
  size: number;
  speedX: number;
  speedY: number;
  color: string;
  alpha: number;
}

const MouseEffect: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particles = useRef<Particle[]>([]);
  const mouse = useRef({ x: 0, y: 0, isActive: false });

  const colors = [
    'rgba(182, 126, 125, ', // Muted Rose
    'rgba(100, 0, 0, ',     // Deep Rouge
    'rgba(182, 126, 125, ', // Muted Rose
    'rgba(66, 0, 1, ',      // Dark Burgundy
  ];

  const createParticle = (x: number, y: number, isBurst = false) => {
    const count = isBurst ? 20 : 1;
    for (let i = 0; i < count; i++) {
      const colorBase = colors[Math.floor(Math.random() * colors.length)];
      particles.current.push({
        x,
        y,
        size: Math.random() * (isBurst ? 8 : 4) + 2,
        speedX: (Math.random() - 0.5) * (isBurst ? 10 : 2),
        speedY: (Math.random() - 0.5) * (isBurst ? 10 : 2) - (isBurst ? 0 : 1), // Drift up
        color: colorBase,
        alpha: 1,
      });
    }
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    const handleMouseMove = (e: MouseEvent) => {
      mouse.current.x = e.clientX;
      mouse.current.y = e.clientY;
      createParticle(e.clientX, e.clientY);
    };

    const handleMouseDown = (e: MouseEvent) => {
      createParticle(e.clientX, e.clientY, true);
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mousedown', handleMouseDown);
    handleResize();

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      for (let i = 0; i < particles.current.length; i++) {
        const p = particles.current[i];
        p.x += p.speedX;
        p.y += p.speedY;
        p.alpha -= 0.015;
        p.size *= 0.96;

        if (p.alpha <= 0 || p.size <= 0.5) {
          particles.current.splice(i, 1);
          i--;
          continue;
        }

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = `${p.color}${p.alpha})`;
        ctx.fill();
        
        // Add a subtle glow
        ctx.shadowBlur = 10;
        ctx.shadowColor = `${p.color}${p.alpha * 0.5})`;
      }

      requestAnimationFrame(animate);
    };

    const animationId = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mousedown', handleMouseDown);
      cancelAnimationFrame(animationId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-0"
      style={{ mixBlendMode: 'multiply', opacity: 0.6 }}
    />
  );
};

export default MouseEffect;
