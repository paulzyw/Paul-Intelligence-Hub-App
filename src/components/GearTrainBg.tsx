import { useEffect, useRef, useState } from 'react';

interface GearNode {
  name: string;
  cx: number;
  cy: number;
  radius: number;
  teeth: number;
  color: string;
  spokeCount: number;
  isRatchet?: boolean;
  hasInnerDashed?: boolean;
  isDashedOuter?: boolean;
  hubStyle?: 'flower' | 'cpu' | 'concentric' | 'simple';
}

export function GearTrainBg() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [speedMultiplier, setSpeedMultiplier] = useState<number>(1.0);

  // Core mechanical configurations (Independent, fully relocatable coordinates)
  // Designed in 400x400 space, auto-scales to canvas dimensions
  const layout = {
    // Large Mainspring Barrel (bottom-left)
    firstWheel: { 
      name: 'First Wheel (Barrel)', 
      cx: 135, 
      cy: 260, 
      radius: 95, 
      teeth: 20, 
      spokeCount: 4, 
      hasInnerDashed: true, 
      hubStyle: 'concentric' as const,
      color: 'rgba(110, 120, 130, 0.5)' 
    },
    // Coaxial winding ratchet wheel stacked on top
    ratchetWheel: { 
      name: 'Ratchet Wheel', 
      cx: 135, 
      cy: 260, 
      radius: 62, 
      teeth: 16, 
      spokeCount: 0, 
      isDashedOuter: true, 
      hubStyle: 'simple' as const,
      color: 'rgba(100, 110, 120, 0.5)' 
    },
    // Center wheel containing the teeth mesh
    secondWheel: { 
      name: 'Second Wheel', 
      cx: 235, 
      cy: 290, 
      radius: 50, 
      teeth: 12, 
      spokeCount: 4, 
      hasInnerDashed: true, 
      hubStyle: 'flower' as const,
      color: 'rgba(115, 125, 135, 0.5)' 
    },
    // Intermediate third wheel
    thirdWheel: { 
      name: 'Third Wheel', 
      cx: 220, 
      cy: 180, 
      radius: 48, 
      teeth: 10, 
      spokeCount: 4, 
      hubStyle: 'simple' as const,
      color: 'rgba(115, 125, 135, 0.5)' 
    },
    // Fourth wheel (normally rotating at 1 RPM)
    fourthWheel: { 
      name: 'Fourth Wheel', 
      cx: 305, 
      cy: 165, 
      radius: 62, 
      teeth: 12, 
      spokeCount: 4, 
      hubStyle: 'cpu' as const,
      color: 'rgba(115, 125, 135, 0.5)' 
    },
    // Escapement wheels
    escapeWheel: { name: 'Escape Wheel', cx: 310, cy: 85, radius: 36, teeth: 15, color: 'rgba(120, 130, 140, 0.5)' },
    palletFork: { name: 'Pallet Fork', cx: 254, cy: 85, length: 42, color: 'rgba(120, 130, 140, 0.5)' },
    balanceWheel: { name: 'Balance Wheel', cx: 194, cy: 85, radius: 75, color: 'rgba(130, 140, 150, 0.5)' },
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId: number;
    let lastTime = performance.now();
    let accumulatedTime = 0;

    // Synchronous drawing helpers to make layout perfectly clean and blueprint-style
    const drawGear = (c: CanvasRenderingContext2D, gear: GearNode, angle: number) => {
      c.save();
      c.translate(gear.cx, gear.cy);
      c.rotate(angle);

      c.strokeStyle = gear.color;
      c.lineWidth = 1.2;

      // 1. Draw Outer Circle (Dashed or Solid)
      if (gear.isDashedOuter) {
        c.save();
        c.setLineDash([4, 4]);
        c.beginPath();
        c.arc(0, 0, gear.radius, 0, 2 * Math.PI);
        c.stroke();
        c.restore();
      } else {
        c.beginPath();
        c.arc(0, 0, gear.radius, 0, 2 * Math.PI);
        c.stroke();
      }

      // 2. Draw Rectangular Radial Ticks (Hash-Mark Teeth) astride the circle
      const teeth = gear.teeth;
      for (let i = 0; i < teeth; i++) {
        const theta = (i * 2 * Math.PI) / teeth;
        const tx = Math.cos(theta) * gear.radius;
        const ty = Math.sin(theta) * gear.radius;

        c.save();
        c.translate(tx, ty);
        c.rotate(theta);
        // Draw the exact solid rectangular tick mark astride the rim line
        c.strokeRect(-1.2, -3.5, 2.4, 7);
        c.restore();
      }

      // 3. Draw Concentric Inner Dashed Circle
      if (gear.hasInnerDashed) {
        c.save();
        c.setLineDash([3, 4]);
        c.beginPath();
        c.arc(0, 0, gear.radius * 0.72, 0, 2 * Math.PI);
        c.stroke();
        c.restore();
      }

      // 4. Draw Spoke Crosshairs
      if (gear.spokeCount > 0) {
        c.save();
        c.lineWidth = 0.8;
        // Draw elegant thin spoke lines extending all the way to the rim
        for (let s = 0; s < gear.spokeCount; s++) {
          const spokeAngle = (s * 2 * Math.PI) / gear.spokeCount;
          c.beginPath();
          c.moveTo(0, 0);
          c.lineTo(Math.cos(spokeAngle) * gear.radius, Math.sin(spokeAngle) * gear.radius);
          c.stroke();
        }
        c.restore();
      }

      // 5. Draw Custom High-Tech Center Hub Style (Flower, CPU, Concentric, or Simple)
      c.save();
      c.fillStyle = gear.color;
      if (gear.hubStyle === 'flower') {
        // Draw a gears/flower-like symbol or icon at the center hub
        c.beginPath();
        for (let k = 0; k < 6; k++) {
          const fa = (k * 2 * Math.PI) / 6;
          const fx = Math.cos(fa) * 5.5;
          const fy = Math.sin(fa) * 5.5;
          c.arc(fx, fy, 2.5, 0, 2 * Math.PI);
        }
        c.stroke();
        c.beginPath();
        c.arc(0, 0, 3, 0, 2 * Math.PI);
        c.stroke();
      } else if (gear.hubStyle === 'cpu') {
        // Draw square CPU microchip icon
        c.strokeRect(-5, -5, 10, 10);
        c.strokeRect(-2.5, -2.5, 5, 5);
        // Miniature pin leads
        c.lineWidth = 0.8;
        for (let d = -3; d <= 3; d += 3) {
          c.beginPath(); c.moveTo(d, -5); c.lineTo(d, -7.5); c.stroke();
          c.beginPath(); c.moveTo(d, 5); c.lineTo(d, 7.5); c.stroke();
          c.beginPath(); c.moveTo(-5, d); c.lineTo(-7.5, d); c.stroke();
          c.beginPath(); c.moveTo(5, d); c.lineTo(7.5, d); c.stroke();
        }
      } else if (gear.hubStyle === 'concentric') {
        // Concentric circles with center dot
        c.beginPath();
        c.arc(0, 0, 8, 0, 2 * Math.PI);
        c.stroke();
        c.beginPath();
        c.arc(0, 0, 2.5, 0, 2 * Math.PI);
        c.stroke();
        c.beginPath();
        c.arc(0, 0, 0.8, 0, 2 * Math.PI);
        c.fill();
      } else {
        // Simple elegant center circle
        c.beginPath();
        c.arc(0, 0, 5, 0, 2 * Math.PI);
        c.stroke();
      }
      c.restore();

      c.restore();
    };

    const drawEscapeWheel = (c: CanvasRenderingContext2D, x: number, y: number, radius: number, teeth: number, angle: number, color: string) => {
      c.save();
      c.translate(x, y);
      c.rotate(angle);

      c.strokeStyle = color;
      c.lineWidth = 1.2;

      c.beginPath();
      for (let i = 0; i < teeth; i++) {
        const theta = (i * 2 * Math.PI) / teeth;
        const nextTheta = ((i + 1) * 2 * Math.PI) / teeth;

        const toeRadius = radius;
        const heelRadius = radius - 7;
        const rootRadius = radius - 12;

        const toeAng = theta;
        const lockAng = theta + (2 * Math.PI / teeth) * 0.15;
        const impulseAng = theta + (2 * Math.PI / teeth) * 0.32;
        const heelAng = theta + (2 * Math.PI / teeth) * 0.42;
        const rootAng = theta + (2 * Math.PI / teeth) * 0.55;

        c.lineTo(Math.cos(toeAng) * toeRadius, Math.sin(toeAng) * toeRadius);
        c.quadraticCurveTo(
          Math.cos(lockAng) * (toeRadius + 1), Math.sin(lockAng) * (toeRadius + 1),
          Math.cos(impulseAng) * heelRadius, Math.sin(impulseAng) * heelRadius
        );
        c.lineTo(Math.cos(heelAng) * rootRadius, Math.sin(heelAng) * rootRadius);
        c.lineTo(Math.cos(rootAng) * rootRadius, Math.sin(rootAng) * rootRadius);
        c.quadraticCurveTo(
          Math.cos(nextTheta - 0.04) * rootRadius, Math.sin(nextTheta - 0.04) * rootRadius,
          Math.cos(nextTheta) * toeRadius, Math.sin(nextTheta) * toeRadius
        );
      }
      c.closePath();
      c.stroke();

      // Dynamic lightweight spoking
      c.beginPath();
      c.arc(0, 0, 5, 0, 2 * Math.PI);
      c.stroke();

      for (let s = 0; s < 4; s++) {
        const spokeAngle = (s * 2 * Math.PI) / 4;
        c.beginPath();
        c.moveTo(Math.cos(spokeAngle) * 5, Math.sin(spokeAngle) * 5);
        c.lineTo(Math.cos(spokeAngle) * (radius - 12), Math.sin(spokeAngle) * (radius - 12));
        c.stroke();
      }

      c.restore();
    };

    const drawPalletFork = (c: CanvasRenderingContext2D, x: number, y: number, angle: number, color: string) => {
      c.save();
      c.translate(x, y);
      c.rotate(angle);

      c.strokeStyle = color;
      c.lineWidth = 1.2;

      // Base pivot
      c.beginPath();
      c.arc(0, 0, 4, 0, 2 * Math.PI);
      c.stroke();

      // Pallet anchor arms
      c.beginPath();
      c.moveTo(0, 0);
      c.quadraticCurveTo(-14, -8, -22, -13);
      c.lineTo(-24, -8);
      c.lineTo(-20, -4);
      c.quadraticCurveTo(-9, -2, 0, 0);
      c.quadraticCurveTo(14, -8, 22, -13);
      c.lineTo(24, -8);
      c.lineTo(20, -4);
      c.quadraticCurveTo(9, -2, 0, 0);
      c.stroke();

      // Jewel highlighting (orange brand accent boxes)
      c.strokeStyle = 'rgba(237, 137, 54, 0.4)';
      c.strokeRect(-25, -12, 4, 5);
      c.strokeRect(21, -12, 4, 5);
      c.strokeStyle = color;

      // Long tail pointing to balance staff roller pin
      c.beginPath();
      c.moveTo(0, 0);
      c.lineTo(-42, 0); // pointing left towards balance wheel
      c.stroke();

      // Safety slot/horn details
      c.beginPath();
      c.moveTo(-42, -3);
      c.lineTo(-47, -3);
      c.lineTo(-47, 3);
      c.lineTo(-42, 3);
      c.stroke();

      c.restore();
    };

    const drawBalanceWheel = (c: CanvasRenderingContext2D, x: number, y: number, radius: number, angle: number, color: string, swingAngle: number) => {
      c.save();
      c.translate(x, y);
      c.rotate(angle);

      c.strokeStyle = color;
      c.lineWidth = 1.2;

      // Heavy premium balance rim
      c.beginPath();
      c.arc(0, 0, radius, 0, 2 * Math.PI);
      c.stroke();
      c.beginPath();
      c.arc(0, 0, radius - 3, 0, 2 * Math.PI);
      c.stroke();

      // Hub setting
      c.beginPath();
      c.arc(0, 0, 5, 0, 2 * Math.PI);
      c.stroke();

      // Distinctive 3-spoke design
      for (let s = 0; s < 3; s++) {
        const spokeAngle = (s * 2 * Math.PI) / 3;
        c.beginPath();
        c.moveTo(Math.cos(spokeAngle) * 5, Math.sin(spokeAngle) * 5);
        c.lineTo(Math.cos(spokeAngle) * (radius - 3), Math.sin(spokeAngle) * (radius - 3));
        c.stroke();
      }

      // Decorative peripheral tuning screws
      for (let s = 0; s < 12; s++) {
        const screwAngle = (s * 2 * Math.PI) / 12;
        c.save();
        c.rotate(screwAngle);
        c.strokeRect(radius - 1, -1.5, 3, 3);
        c.restore();
      }

      // Roller disk and impulse ruby pin
      c.beginPath();
      c.arc(0, 0, 13, 0, 2 * Math.PI);
      c.stroke();

      // Ruby impulse pin - aligns right to meet the pallet fork tail
      c.beginPath();
      c.arc(13, 0, 2, 0, 2 * Math.PI);
      c.strokeStyle = '#ED8936';
      c.stroke();
      c.strokeStyle = color;

      c.restore();

      // Archimedean Spiral Hairspring (rendered statically anchored with dynamic expansion/contraction)
      c.save();
      c.translate(x, y);
      c.strokeStyle = 'rgba(237, 137, 54, 0.42)';
      c.lineWidth = 1.0;
      c.beginPath();

      const turns = 7.0;
      const steps = 140;
      const maxSpringRadius = radius * 0.45;
      const tightness = (maxSpringRadius / (turns * 2 * Math.PI)) * (1.0 + (swingAngle * 0.055));

      for (let i = 0; i <= steps; i++) {
        const theta = (i * turns * 2 * Math.PI) / steps;
        const r = tightness * theta;
        const sx = Math.cos(theta) * r;
        const sy = Math.sin(theta) * r;
        if (i === 0) {
          c.moveTo(sx, sy);
        } else {
          c.lineTo(sx, sy);
        }
      }
      c.stroke();

      // Outer hairspring stud block
      const outerT = turns * 2 * Math.PI;
      const studX = Math.cos(outerT) * (tightness * outerT);
      const studY = Math.sin(outerT) * (tightness * outerT);
      c.strokeRect(studX - 1.5, studY - 1.5, 3, 3);

      c.restore();
    };

    const drawSecondsHand = (c: CanvasRenderingContext2D, x: number, y: number, angle: number, radius: number) => {
      c.save();
      c.translate(x, y);
      c.rotate(angle);

      // Main second-hand pointer (colored with high contrast brand orange-amber)
      c.strokeStyle = '#ED8936';
      c.lineWidth = 1.6;

      // Pointer line
      c.beginPath();
      c.moveTo(0, 15); // counterweight tail
      c.lineTo(0, -radius);
      c.stroke();

      // Arrowhead arrow pointer
      c.beginPath();
      c.moveTo(-3, -radius + 8);
      c.lineTo(0, -radius);
      c.lineTo(3, -radius + 8);
      c.stroke();

      // Counterweight round loop
      c.beginPath();
      c.arc(0, 15, 3, 0, 2 * Math.PI);
      c.stroke();

      // Center cap
      c.fillStyle = '#ED8936';
      c.beginPath();
      c.arc(0, 0, 3.5, 0, 2 * Math.PI);
      c.fill();

      c.restore();
    };

    // The high-performance mathematical layout cycle
    const loop = (currentTime: number) => {
      const dt = (currentTime - lastTime) / 1000;
      lastTime = currentTime;

      // Scale time by our adjustable speed multiplier
      accumulatedTime += dt * speedMultiplier;

      // Clear Canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Normalize canvas size coordinate ratios (designed on a 400x400 stage)
      const scale = Math.min(canvas.width, canvas.height) / 400;
      ctx.save();
      ctx.scale(scale, scale);

      // ----------------------------------------------------
      // Escapement Mechanics Loop
      // ----------------------------------------------------
      const freq = 2.4; // 2.4 Hz ticking rate
      const balanceAngle = 0.95 * Math.sin(accumulatedTime * freq * 2 * Math.PI);

      // The Pallet Fork snaps back and forth as the balance pin passes center zero
      const palletAngle = 0.12 * Math.tanh(10 * Math.sin(accumulatedTime * freq * 2 * Math.PI));

      // The Escape Wheel progresses in snap steps (discrete ticks)
      const tickPhase = (accumulatedTime * freq * 2);
      const tickIndex = Math.floor(tickPhase);
      const tickProgress = tickPhase - tickIndex;
      const snapProgress = Math.pow(tickProgress, 4); // Quick snap physics
      const escapeWheelAngle = (tickIndex + snapProgress) * (2 * Math.PI / 30); // 12 deg per tick

      // ----------------------------------------------------
      // Driven Gear Train angles
      // ----------------------------------------------------
      const fourthAngle = -escapeWheelAngle * (layout.escapeWheel.teeth / layout.fourthWheel.teeth);
      const thirdAngle = -fourthAngle * (layout.fourthWheel.teeth / layout.thirdWheel.teeth);
      const secondAngle = -thirdAngle * (layout.thirdWheel.teeth / layout.secondWheel.teeth);
      const firstAngle = -secondAngle * (layout.secondWheel.teeth / layout.firstWheel.teeth);

      // ----------------------------------------------------
      // Draw everything in correct stack order (Back to Front)
      // ----------------------------------------------------

      // 1. Mainspring Barrel and Ratchet Wheel
      drawGear(ctx, layout.firstWheel, firstAngle);
      drawGear(ctx, layout.ratchetWheel, -firstAngle * 0.4); // winding feedback

      // 2. Second, Third, and Fourth Wheels
      drawGear(ctx, layout.secondWheel, secondAngle);
      drawGear(ctx, layout.thirdWheel, thirdAngle);
      drawGear(ctx, layout.fourthWheel, fourthAngle);

      // 3. Escapement assembly
      drawEscapeWheel(ctx, layout.escapeWheel.cx, layout.escapeWheel.cy, layout.escapeWheel.radius, layout.escapeWheel.teeth, escapeWheelAngle, layout.escapeWheel.color);
      drawPalletFork(ctx, layout.palletFork.cx, layout.palletFork.cy, palletAngle, layout.palletFork.color);
      drawBalanceWheel(ctx, layout.balanceWheel.cx, layout.balanceWheel.cy, layout.balanceWheel.radius, balanceAngle, layout.balanceWheel.color, balanceAngle);

      ctx.restore();

      animationId = requestAnimationFrame(loop);
    };

    // Auto-resizing setup using a robust ResizeObserver to handle container-level flex layout changes
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width } = entry.contentRect;
        if (width > 0) {
          canvas.width = width;
          canvas.height = width; // Keep 1:1 aspect ratio
        }
      }
    });

    const container = containerRef.current;
    if (container) {
      resizeObserver.observe(container);
    }

    animationId = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(animationId);
      if (container) {
        resizeObserver.unobserve(container);
      }
      resizeObserver.disconnect();
    };
  }, [speedMultiplier]);

  return (
    <div ref={containerRef} className="relative w-full max-w-full aspect-square flex items-center justify-center p-0 m-0">
      <canvas ref={canvasRef} className="w-full h-full block" />
    </div>
  );
}
