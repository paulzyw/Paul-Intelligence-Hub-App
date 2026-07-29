import { useEffect, useRef } from 'react';

export interface MeteorBackgroundProps {
  density?: number;
  speed?: number;
}

export function MeteorBackground({ density = 1.0, speed = 1.0 }: MeteorBackgroundProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Check for reduced motion preference
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) return;

    let animationFrameId: number;
    let timeoutId: number;

    // Responsive canvas resizing
    const resizeCanvas = () => {
      const parent = canvas.parentElement;
      if (parent) {
        canvas.width = parent.clientWidth;
        canvas.height = parent.clientHeight;
      }
    };
    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();

    class Meteor {
      x: number;
      y: number;
      length: number;
      speedVal: number;
      thickness: number;
      active: boolean;

      constructor() {
        this.active = false;
        this.x = 0;
        this.y = 0;
        this.length = 0;
        this.speedVal = 0;
        this.thickness = 0;
      }

      spawn(startX?: number, startY?: number) {
        this.active = true;
        if (startX !== undefined && startY !== undefined) {
          this.x = startX;
          this.y = startY;
        } else {
          // Start from top or right edge
          if (Math.random() > 0.5) {
            this.x = Math.random() * canvas.width;
            this.y = -200; // Start above screen
          } else {
            this.x = canvas.width + 200; // Start right of screen
            this.y = Math.random() * canvas.height;
          }
        }
        
        // Length between 150px and 300px
        this.length = Math.random() * 150 + 150;
        // Speed for the meteor (multiplied by speed prop)
        this.speedVal = ((Math.random() * 10 + 15) / 1.3) * speed;
        // Thickness between 2px and 4px
        this.thickness = Math.random() * 2 + 2;
      }

      update() {
        if (!this.active) return;
        
        // Move diagonally from top-right to bottom-left (45 degrees)
        this.x -= this.speedVal;
        this.y += this.speedVal;

        // Deactivate if it goes off screen
        if (this.x < -this.length || this.y > canvas.height + this.length) {
          this.active = false;
        }
      }

      draw(ctx: CanvasRenderingContext2D) {
        if (!this.active) return;
        
        ctx.save();
        ctx.beginPath();
        // Head of the meteor
        ctx.moveTo(this.x, this.y);
        // Tail of the meteor (trailing up and right)
        ctx.lineTo(this.x + this.length, this.y - this.length);
        
        // Linear gradient from transparent to Theme Accent
        const gradient = ctx.createLinearGradient(this.x, this.y, this.x + this.length, this.y - this.length);
        const accentColor = getComputedStyle(document.documentElement).getPropertyValue('--accent').trim();
        gradient.addColorStop(0, `${accentColor}cc`); // Head (80% opacity)
        gradient.addColorStop(1, 'transparent'); // Tail

        ctx.strokeStyle = gradient;
        ctx.lineWidth = this.thickness;
        ctx.stroke();
        ctx.restore();
      }
    }

    // Number of active meteors in pool scales with density
    const meteorCount = Math.max(1, Math.round(10 * density));
    const meteors = Array.from({ length: meteorCount }, () => new Meteor());
    let currentMeteor = 0;

    let isFirst = true;
    const scheduleNextMeteor = () => {
      // Delay inversely proportional to density
      const safeDensity = Math.max(0.1, density);
      const delay = isFirst ? (1000 / speed) : (1500 / safeDensity);
      isFirst = false;
      timeoutId = window.setTimeout(() => {
        if (meteors[currentMeteor]) {
          meteors[currentMeteor].spawn();
          currentMeteor = (currentMeteor + 1) % meteors.length;
        }
        scheduleNextMeteor();
      }, delay);
    };

    // Start the first meteor schedule
    scheduleNextMeteor();

    // Mouse click event listener
    const section = canvas.closest('section');
    const handleSectionClick = (e: MouseEvent) => {
      if (e.button !== 0) return; // Only respond to left clicks
      
      // Do not trigger when clicking buttons or other interactive elements
      if ((e.target as HTMLElement).closest('a, button, input, select, textarea')) {
        return;
      }

      const rect = canvas.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const clickY = e.clientY - rect.top;

      // Spawn 6 extra meteors shooting from click position, beautifully distributed in a parallel meteor shower array
      const numToSpawn = 6;
      for (let i = 0; i < numToSpawn; i++) {
        // Distribute parallel paths across a perpendicular axis (px, py) = (1, 1)
        const pDist = (i - 2.5) * 80; 
        // Stagger their trigger positions along the travel direction (dx, dy) = (-1, 1)
        const travelDist = (Math.random() - 0.5) * 120;

        const offsetX = clickX + pDist - travelDist;
        const offsetY = clickY + pDist + travelDist;
        
        const newMeteor = new Meteor();
        newMeteor.spawn(offsetX, offsetY);
        // Ensure variations in speeds and lengths for a more dynamic and organic cluster feel
        newMeteor.speedVal = ((Math.random() * 8 + 14) / 1.3) * speed;
        newMeteor.length = Math.random() * 120 + 140;
        meteors.push(newMeteor);
      }

      // Limit total meteors in list to prevent memory growth
      if (meteors.length > 150) {
        meteors.splice(0, meteors.length - 150);
      }
    };

    if (section) {
      section.addEventListener('mousedown', handleSectionClick);
    }

    // Main render loop
    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      meteors.forEach(m => {
        m.update();
        m.draw(ctx);
      });
      animationFrameId = requestAnimationFrame(render);
    };
    render();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      if (section) {
        section.removeEventListener('mousedown', handleSectionClick);
      }
      cancelAnimationFrame(animationFrameId);
      clearTimeout(timeoutId);
    };
  }, [density, speed]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 z-0 pointer-events-none"
      style={{ width: '100%', height: '100%' }}
    />
  );
}
