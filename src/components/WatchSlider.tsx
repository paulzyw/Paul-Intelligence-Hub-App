import React, { useEffect, useRef } from 'react';

export interface WatchSliderRef {
  setValue(p: number): void;
  setDragged(dragged: boolean): void;
}

interface WatchSliderProps {
  onValueChange: (p: number) => void;
  onDragStart: () => void;
  onDragEnd: () => void;
  sliderRef: React.MutableRefObject<WatchSliderRef | null>;
}

export default function WatchSlider({
  onValueChange,
  onDragStart,
  onDragEnd,
  sliderRef,
}: WatchSliderProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const fillRef = useRef<HTMLDivElement>(null);
  const knobRef = useRef<HTMLButtonElement>(null);

  const dragInfo = useRef({
    isDragging: false,
    startX: 0,
    startPercent: 0,
    currentPercent: 0,
  });

  // Expose control methods to parent via sliderRef
  useEffect(() => {
    sliderRef.current = {
      setValue: (p: number) => {
        // Clamp and update slider DOM directly for 60fps performance
        const percent = Math.max(0, Math.min(1, p));
        if (!dragInfo.current.isDragging) {
          dragInfo.current.currentPercent = percent;
          updateDOM(percent);
        }
      },
      setDragged: (dragged: boolean) => {
        dragInfo.current.isDragging = dragged;
      },
    };
    return () => {
      sliderRef.current = null;
    };
  }, [sliderRef]);

  const updateDOM = (percent: number) => {
    const l = `${percent * 100}%`;
    if (fillRef.current) {
      fillRef.current.style.width = l;
    }
    if (knobRef.current) {
      knobRef.current.style.left = l;
    }
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    
    // Set pointer capture to track drag outside boundaries
    const container = containerRef.current;
    container.setPointerCapture(e.pointerId);

    const rect = container.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const initialPercent = Math.max(0, Math.min(1, x / rect.width));

    dragInfo.current.isDragging = true;
    dragInfo.current.startX = e.clientX;
    dragInfo.current.startPercent = initialPercent;
    dragInfo.current.currentPercent = initialPercent;

    updateDOM(initialPercent);
    onDragStart();
    onValueChange(initialPercent);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragInfo.current.isDragging || !containerRef.current) return;

    const container = containerRef.current;
    const rect = container.getBoundingClientRect();
    const deltaX = e.clientX - dragInfo.current.startX;
    const percentDelta = deltaX / rect.width;
    
    const newPercent = Math.max(0, Math.min(1, dragInfo.current.startPercent + percentDelta));
    dragInfo.current.currentPercent = newPercent;

    updateDOM(newPercent);
    onValueChange(newPercent);
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragInfo.current.isDragging) return;
    
    dragInfo.current.isDragging = false;
    if (containerRef.current) {
      try {
        containerRef.current.releasePointerCapture(e.pointerId);
      } catch (err) {
        // Safe fallback if pointer capture is already released
      }
    }
    onDragEnd();
  };

  return (
    <div 
      ref={containerRef}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      className="flex-1 h-8 flex items-center relative cursor-pointer select-none touch-none"
      id="custom-watch-slider"
    >
      {/* Background Track */}
      <div className="absolute w-full h-1.5 bg-[#1c2331] rounded-full" />
      
      {/* Dynamic Colored Fill Gutter */}
      <div 
        ref={fillRef}
        className="absolute h-1.5 bg-gradient-to-r from-[#00e5ff] to-[#00aaff] rounded-full pointer-events-none"
        style={{ width: '0%' }}
      />
      
      {/* Interactive Knob with cyan high-contrast outline & neon glow */}
      <button
        ref={knobRef}
        type="button"
        className="absolute w-4.5 h-4.5 bg-[#121416] border-2 border-[#00e5ff] rounded-full shadow-[0_0_8px_rgba(0,229,255,0.5)] -translate-x-1/2 cursor-grab active:cursor-grabbing hover:scale-115 active:scale-95 transition-transform duration-100 outline-none focus:ring-1 focus:ring-[#00e5ff]"
        style={{ left: '0%' }}
        aria-label="Animation Timeline Scrubber"
      />
    </div>
  );
}
