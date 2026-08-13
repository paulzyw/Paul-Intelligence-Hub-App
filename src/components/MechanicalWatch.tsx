import { useEffect, useState, useRef } from 'react';
import { RotateCcw, Sliders } from 'lucide-react';
import WatchSlider, { WatchSliderRef } from './WatchSlider';

export default function MechanicalWatch() {
  const [isExpanded, setIsExpanded] = useState(false);
  const toolSectionRef = useRef<HTMLDivElement>(null);
  const canvasContainerRef = useRef<HTMLDivElement>(null);
  const sliderRef = useRef<WatchSliderRef | null>(null);
  const drawerRef = useRef<any>(null);

  // High-performance bridge connecting React Slider events with WebGL Drawer
  const sliderBridgeRef = useRef({
    dragged: false,
    set_value: (p: number) => {
      if (sliderRef.current) {
        sliderRef.current.setValue(p);
      }
    }
  });

  const handleResetPose = () => {
    if (drawerRef.current && typeof drawerRef.current.reset_pose === 'function') {
      drawerRef.current.reset_pose();
    }
    if (sliderRef.current) {
      sliderRef.current.setValue(0);
    }
  };

  const handleSetPoseX = (degX: number) => {
    if (drawerRef.current && typeof drawerRef.current.set_pose_x === 'function') {
      drawerRef.current.set_pose_x(degX);
    }
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (toolSectionRef.current && !toolSectionRef.current.contains(event.target as Node)) {
        setIsExpanded(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  useEffect(() => {
    (window as any).autoInitializeWatch = false;

    const initEngine = () => {
      if (!canvasContainerRef.current || !(window as any).createWatchWithSliders) return;

      const results = (window as any).createWatchWithSliders(canvasContainerRef.current, "hero", []);
      if (results && results[0]) {
        const drawer = results[0];
        drawer.f_draw = true; // Force first draw to bypass loading lock
        drawerRef.current = drawer;
        drawer.set_sim_slider(sliderBridgeRef.current);
        
        // Kickstart the simulation loop (it starts paused by default in the legacy code)
        drawer.set_paused(false);
        drawer.set_visible(true);
      }
    };

    const loadScripts = async () => {
      if ((window as any).createWatchWithSliders) {
        initEngine();
        return;
      }

      if (!(window as any)._watchScriptPromise) {
        (window as any)._watchScriptPromise = new Promise<void>((resolve) => {
          const origin = window.location.origin;
          
          const baseScript = document.createElement('script');
          baseScript.src = `${origin}/js/base.js?v=5`;
          document.body.appendChild(baseScript);

          baseScript.onload = () => {
            const watchScript = document.createElement('script');
            watchScript.src = `${origin}/js/watch.js?v=5`;
            document.body.appendChild(watchScript);

            watchScript.onload = () => {
              resolve();
            };
          };
        });
      }

      await (window as any)._watchScriptPromise;
      
      // Ensure the container still exists before initializing
      if (canvasContainerRef.current) {
        initEngine();
      }
    };

    loadScripts();

    return () => {
      if (drawerRef.current && typeof drawerRef.current.destroy === 'function') {
        drawerRef.current.destroy();
      }
    };
  }, []);

  const handleSliderChange = (p: number) => {
    if (drawerRef.current && typeof drawerRef.current.set_arg0 === 'function') {
      drawerRef.current.set_arg0(p);
    }
  };

  const handleSliderDragStart = () => {
    sliderBridgeRef.current.dragged = true;
  };

  const handleSliderDragEnd = () => {
    sliderBridgeRef.current.dragged = false;
  };

  return (
    <div className="w-full max-w-4xl flex flex-col items-center gap-[8px]">
      <div 
        ref={canvasContainerRef}
        id="hero" 
        className="w-full max-w-[800px] aspect-square relative rounded-2xl shadow-2xl bg-[#121416] overflow-hidden border border-white/5"
      ></div>
      
      {/* Tool Section Container matching Dial Color with subtle outline */}
      <div className="w-full max-w-[640px] flex flex-col items-center relative min-h-[50px] justify-center">
        <style>{`
          @keyframes breathing-glow {
            0%, 100% {
              transform: scale(1);
              box-shadow: 0 0 0 2px rgba(237, 137, 54, 0.25), 0 0 8px rgba(237, 137, 54, 0.15);
            }
            50% {
              transform: scale(1.06);
              box-shadow: 0 0 0 4px rgba(237, 137, 54, 0.55), 0 0 16px rgba(237, 137, 54, 0.35);
            }
          }
          .animate-breathing {
            animation: breathing-glow 2.5s ease-in-out infinite;
          }
        `}</style>

        {/* Breathing Unfold Toggle Button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            setIsExpanded(true);
          }}
          className={`w-11 h-11 bg-[#121416] border border-[#ed8936]/50 text-[#ed8936] rounded-full flex items-center justify-center cursor-pointer transition-all duration-300 hover:bg-[#1c1e21] absolute ${
            isExpanded 
              ? "opacity-0 scale-50 pointer-events-none" 
              : "opacity-100 scale-100 pointer-events-auto animate-breathing"
          }`}
          title="Click me to manipulate watch"
        >
          <Sliders className="w-4.5 h-4.5 text-[#ed8936]" />
        </button>

        {/* Tool Section Container with smooth toggle height & opacity */}
        <div 
          ref={toolSectionRef}
          id="tool-section"
          className={`w-full bg-[#272A2D] border rounded-2xl shadow-2xl flex flex-col transition-all duration-300 ease-in-out origin-center ${
            isExpanded
              ? "border-white/10 py-3.5 px-5 gap-2.0 h-auto opacity-100 scale-100 pointer-events-auto"
              : "border-white/0 py-0 px-5 gap-0 h-0 overflow-hidden opacity-0 scale-95 pointer-events-none"
          }`}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Tool Buttons Section - Slot for future tool buttons */}
          <div 
            id="tool-buttons-container" 
            className="flex items-center justify-between border-b border-white/5 pb-2.5"
          >
            <div className="text-[11px] font-normal uppercase tracking-wider text-[#00e5ff] select-none">
              Tools & Actions
            </div>
            
            <div className="flex items-center gap-3">
              <button
                onClick={handleResetPose}
                className="w-8 h-8 bg-[#121416] text-[#00e5ff] rounded-full flex items-center justify-center shadow-[0_0_0_2px_#00e5ff,0_0_8px_rgba(0,229,255,0.35)] transition-all hover:scale-110 active:scale-95 hover:bg-[#1c1e21] cursor-pointer"
                title="Reset pose & slider to 0%"
              >
                <RotateCcw className="w-4 h-4 text-[#00e5ff]" />
              </button>

              <button
                onClick={() => handleSetPoseX(-90)}
                className="w-8 h-8 bg-[#121416] text-[#00e5ff] rounded-full flex items-center justify-center shadow-[0_0_0_2px_#00e5ff,0_0_8px_rgba(0,229,255,0.35)] transition-all hover:scale-110 active:scale-95 hover:bg-[#1c1e21] cursor-pointer text-[10px] font-bold"
                title="Set Pitch to -90°"
              >
                -90°
              </button>

              <button
                onClick={() => handleSetPoseX(-180)}
                className="w-8 h-8 bg-[#121416] text-[#00e5ff] rounded-full flex items-center justify-center shadow-[0_0_0_2px_#00e5ff,0_0_8px_rgba(0,229,255,0.35)] transition-all hover:scale-110 active:scale-95 hover:bg-[#1c1e21] cursor-pointer text-[10px] font-bold"
                title="Set Pitch to -180°"
              >
                -180°
              </button>
            </div>
          </div>

          {/* Pure React + Tailwind Slider Component */}
          <div className="flex items-center gap-4 w-full">
            <span className="text-[11px] font-normal text-[#00e5ff] select-none min-w-[28px] tracking-wide">
              0%
            </span>
            <WatchSlider
              sliderRef={sliderRef}
              onValueChange={handleSliderChange}
              onDragStart={handleSliderDragStart}
              onDragEnd={handleSliderDragEnd}
            />
            <span className="text-[11px] font-normal text-[#00e5ff] select-none min-w-[36px] text-right tracking-wide">
              100%
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
