import { useEffect, useRef } from 'react';

export function MeteorBackground() {
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
      speed: number;
      thickness: number;
      active: boolean;

      constructor() {
        this.active = false;
        this.x = 0;
        this.y = 0;
        this.length = 0;
        this.speed = 0;
        this.thickness = 0;
      }

      spawn() {
        this.active = true;
        // Start from top or right edge
        if (Math.random() > 0.5) {
          this.x = Math.random() * canvas.width;
          this.y = -200; // Start above screen
        } else {
          this.x = canvas.width + 200; // Start right of screen
          this.y = Math.random() * canvas.height;
        }
        
        // Length between 150px and 300px
        this.length = Math.random() * 150 + 150;
        // Speed for the meteor (reduced by ~30% to make it fly 30% longer)
        this.speed = (Math.random() * 10 + 15) / 1.3;
        // Thickness between 2px and 4px
        this.thickness = Math.random() * 2 + 2;
      }

      update() {
        if (!this.active) return;
        
        // Move diagonally from top-right to bottom-left (45 degrees)
        this.x -= this.speed;
        this.y += this.speed;

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
        
        // Linear gradient from transparent to Energetic Amber
        const gradient = ctx.createLinearGradient(this.x, this.y, this.x + this.length, this.y - this.length);
        gradient.addColorStop(0, 'rgba(237, 137, 54, 0.8)'); // Head
        gradient.addColorStop(1, 'transparent'); // Tail

        ctx.strokeStyle = gradient;
        ctx.lineWidth = this.thickness;
        ctx.stroke();
        ctx.restore();
      }
    }

    const meteors = [new Meteor(), new Meteor(), new Meteor(), new Meteor(), new Meteor()];
    let currentMeteor = 0;

    let isFirst = true;
    const scheduleNextMeteor = () => {
      // First meteor spawns quickly (1s), subsequent ones every 1.5 seconds (2 stars every 3 seconds)
      const delay = isFirst ? 1000 : 1500;
      isFirst = false;
      timeoutId = window.setTimeout(() => {
        meteors[currentMeteor].spawn();
        currentMeteor = (currentMeteor + 1) % meteors.length;
        scheduleNextMeteor();
      }, delay);
    };

    // Start the first meteor schedule
    scheduleNextMeteor();

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
      cancelAnimationFrame(animationFrameId);
      clearTimeout(timeoutId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 z-0 pointer-events-none"
      style={{ width: '100%', height: '100%' }}
    />
  );
}
