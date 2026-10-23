import { useEffect, useRef, useState } from 'react';

export function RevosProductCard() {
  const cardRef = useRef<HTMLDivElement>(null);
  const [animKey, setAnimKey] = useState<number>(0);

  // Re-run animations whenever the card enters the viewport
  useEffect(() => {
    const el = cardRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setAnimKey((k) => k + 1);
          }
        });
      },
      { threshold: 0.15 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={cardRef} className="w-full flex flex-col">
      {/* Dynamic Keyframes for Step-by-Step Sequences */}
      <style>{`
        @keyframes stepFadeSlide {
          0% {
            opacity: 0;
            transform: translateY(14px) scale(0.98);
          }
          100% {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
        @keyframes arrowSlideIn {
          0% {
            opacity: 0;
            transform: scale(0.92);
          }
          100% {
            opacity: 1;
            transform: scale(1);
          }
        }
      `}</style>

      {/* 1. REVOS PRODUCT CARD */}
      <div 
        className="w-full rounded-2xl sm:rounded-3xl lg:rounded-[36px] p-6 sm:p-10 lg:p-12 shadow-2xl border border-white/20 backdrop-blur-md overflow-hidden transition-all duration-300 bg-gradient-to-br from-gtm/60 via-lead/60 to-pipeline/60"
        style={{
          background: 'linear-gradient(135deg, rgba(197, 215, 4, 0.60) 0%, rgba(10, 159, 222, 0.60) 48%, rgba(4, 43, 87, 0.60) 100%)',
        }}
      >
        <div className="flex flex-col lg:flex-row items-stretch lg:items-stretch gap-8 lg:gap-12 w-full">
          
          {/* LEFT COLUMN: Text Information */}
          <div className="lg:w-[28%] shrink-0 flex flex-col justify-end text-left pb-2 sm:pb-4">
            <h3 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-[#F4F4F9] tracking-tight leading-none mb-3 lg:mb-4">
              RevOS
            </h3>
            <h4 className="text-[16px] sm:text-[16px] lg:text-[18px] font-bold text-[#051c2c] tracking-tight leading-snug mb-0.5">
              AI-Native Revenue Operating System
            </h4>
            <p className="text-[14px] sm:text-[16px] text-[#051c2c]/85 font-light leading-tight max-w-md">
              Integrated revenue intelligence and execution
            </p>
          </div>

          {/* RIGHT COLUMN: General Workflow & RevOS Workflow Charts */}
          <div className="lg:flex-1 w-full min-w-0 flex flex-col gap-4 sm:gap-6">
            
            {/* GENERAL WORKFLOW CHART (Sequence S1 -> S7) */}
            <div className="w-full flex justify-end overflow-x-auto pb-1">
              <div className="w-full max-w-[720px]">
                <svg
                  key={`general-${animKey}`}
                  width="100%"
                  height="100%"
                  viewBox="0 0 3728 86"
                  version="1.1"
                  xmlns="http://www.w3.org/2000/svg"
                  xmlnsXlink="http://www.w3.org/1999/xlink"
                  xmlSpace="preserve"
                  style={{ fillRule: 'evenodd', clipRule: 'evenodd' }}
                  className="w-full h-auto block select-none"
                >
                  {/* S1: Evidence Intelligence */}
                  <g 
                    id="S1"
                    style={{
                      opacity: 0,
                      animation: 'stepFadeSlide 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards 0.05s',
                    }}
                  >
                    <clipPath id="_clip1">
                      <rect id="EI" x="0" y="13.2" width="65.204" height="65.204" />
                    </clipPath>
                    <g clipPath="url(#_clip1)">
                      <g>
                        <path
                          d="M65.215,45.851c0.001,0.092 0.001,0.184 0.001,0.276c0,17.886 -14.718,32.603 -32.603,32.603c-17.886,0 -32.603,-14.718 -32.603,-32.603c0,-0.092 0,-0.184 0.001,-0.276c-0.001,-0.092 -0.001,-0.184 -0.001,-0.276c0,-17.886 14.718,-32.603 32.603,-32.603c17.886,0 32.603,14.718 32.603,32.603c0,0.092 -0,0.184 -0.001,0.276Z"
                          style={{ fill: '#cada16', fillRule: 'nonzero' }}
                        />
                        <path
                          d="M17.99,39.605c-0.189,0 -0.5,0.114 -0.637,0.257l-6.113,6.24c-0.274,0.277 -0.274,0.618 0,0.892l9.609,9.126l6.24,6.241c0.139,0.139 0.32,0.253 0.509,0.253c0.14,0 0.272,-0.147 0.382,-0.253l6.24,-6.113l19.74,-19.74c0.278,-0.273 0.277,-0.745 0,-1.019l-6.24,-6.24c-0.277,-0.273 -0.618,-0.277 -0.891,0l-19.23,19.23l-9.099,-8.616c-0.137,-0.139 -0.32,-0.257 -0.509,-0.257l0.001,0Z"
                          style={{ fill: 'url(#_Linear2)', fillRule: 'nonzero' }}
                        />
                      </g>
                    </g>
                    <text
                      x="89.347px"
                      y="63.091px"
                      style={{
                        fontFamily: "'Inter', ui-sans-serif, system-ui, sans-serif",
                        fontWeight: 700,
                        fontSize: '62.5px',
                        fill: '#051c2c',
                      }}
                    >
                      Evidence Intelligence
                    </text>
                  </g>

                  {/* S2: Arrow to S3 */}
                  <g 
                    id="S2"
                    style={{
                      opacity: 0,
                      animation: 'arrowSlideIn 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards 0.35s',
                    }}
                  >
                    <path d="M784.794,42.949l227.242,0" style={{ fill: 'none' }} />
                    <path
                      d="M985.775,30.449l18.75,12.5l-18.75,12.5"
                      style={{
                        fill: 'none',
                        stroke: '#F4F4F9',
                        strokeWidth: '8.33px',
                        strokeLinecap: 'round',
                        strokeMiterlimit: 10,
                      }}
                    />
                    <path
                      d="M784.794,42.949l219.73,0"
                      style={{
                        fill: 'none',
                        stroke: '#F4F4F9',
                        strokeWidth: '8.33px',
                        strokeLinecap: 'round',
                        strokeLinejoin: 'round',
                        strokeMiterlimit: 1.5,
                      }}
                    />
                  </g>

                  {/* S3: AI Assessment */}
                  <g 
                    id="S3"
                    style={{
                      opacity: 0,
                      animation: 'stepFadeSlide 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards 0.60s',
                    }}
                  >
                    <text
                      x="1137.329px"
                      y="68.111px"
                      style={{
                        fontFamily: "'Inter', ui-sans-serif, system-ui, sans-serif",
                        fontWeight: 700,
                        fontSize: '62.5px',
                        fill: '#051c2c',
                      }}
                    >
                      AI Assessment
                    </text>
                    <clipPath id="_clip3">
                      <rect x="1044.045" y="13.513" width="64.578" height="64.578" />
                    </clipPath>
                    <g clipPath="url(#_clip3)">
                      <g>
                        <path
                          d="M1108.634,45.85c0.001,0.091 0.001,0.182 0.001,0.273c0,17.714 -14.576,32.29 -32.29,32.29c-17.714,0 -32.29,-14.576 -32.29,-32.29c0,-0.091 0,-0.182 0.001,-0.273c-0.001,-0.091 -0.001,-0.182 -0.001,-0.273c0,-17.714 14.576,-32.29 32.29,-32.29c17.714,0 32.29,14.576 32.29,32.29c0,0.091 -0,0.182 -0.001,0.273Z"
                          style={{ fill: '#15a4e0', fillRule: 'nonzero' }}
                        />
                        <path
                          d="M1061.863,39.665c-0.187,0 -0.495,0.113 -0.631,0.254l-6.054,6.18c-0.272,0.274 -0.271,0.612 0,0.883l9.516,9.038l6.18,6.181c0.137,0.137 0.317,0.25 0.505,0.25c0.138,0 0.27,-0.145 0.378,-0.25l6.18,-6.054l19.55,-19.55c0.275,-0.27 0.274,-0.737 0,-1.009l-6.18,-6.18c-0.274,-0.27 -0.612,-0.274 -0.883,0l-19.046,19.045l-9.012,-8.534c-0.136,-0.137 -0.317,-0.254 -0.505,-0.254l0.001,0Z"
                          style={{ fill: 'url(#_Linear4)', fillRule: 'nonzero' }}
                        />
                      </g>
                    </g>
                  </g>

                  {/* S4: Arrow to S5 */}
                  <g 
                    id="S4"
                    style={{
                      opacity: 0,
                      animation: 'arrowSlideIn 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards 0.90s',
                    }}
                  >
                    <path d="M1636.267,42.949l227.242,0" style={{ fill: 'none' }} />
                    <path
                      d="M1837.247,30.449l18.75,12.5l-18.75,12.5"
                      style={{
                        fill: 'none',
                        stroke: '#F4F4F9',
                        strokeWidth: '8.33px',
                        strokeLinecap: 'round',
                        strokeMiterlimit: 10,
                      }}
                    />
                    <path
                      d="M1636.267,42.949l219.73,0"
                      style={{
                        fill: 'none',
                        stroke: '#F4F4F9',
                        strokeWidth: '8.33px',
                        strokeLinecap: 'round',
                        strokeLinejoin: 'round',
                        strokeMiterlimit: 1.5,
                      }}
                    />
                  </g>

                  {/* S5: Action Recommendation */}
                  <g 
                    id="S5"
                    style={{
                      opacity: 0,
                      animation: 'stepFadeSlide 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards 1.15s',
                    }}
                  >
                    <text
                      x="1984.994px"
                      y="69.072px"
                      style={{
                        fontFamily: "'Inter', ui-sans-serif, system-ui, sans-serif",
                        fontWeight: 700,
                        fontSize: '62.5px',
                        fill: '#051c2c',
                      }}
                    >
                      Action Recommendation
                    </text>
                    <clipPath id="_clip5">
                      <rect x="1891.375" y="13.233" width="65.139" height="65.139" />
                    </clipPath>
                    <g clipPath="url(#_clip5)">
                      <g>
                        <path
                          d="M1956.524,45.85c0.001,0.092 0.001,0.184 0.001,0.276c0,17.868 -14.703,32.57 -32.57,32.57c-17.868,0 -32.57,-14.703 -32.57,-32.57c0,-0.092 0,-0.184 0.001,-0.276c-0.001,-0.092 -0.001,-0.184 -0.001,-0.276c0,-17.868 14.703,-32.57 32.57,-32.57c17.868,0 32.57,14.703 32.57,32.57c0,0.092 -0,0.184 -0.001,0.276Z"
                          style={{ fill: '#0b325d', fillRule: 'nonzero' }}
                        />
                        <path
                          d="M1909.347,39.612c-0.189,0 -0.499,0.114 -0.636,0.256l-6.107,6.234c-0.274,0.277 -0.274,0.618 0,0.891l9.599,9.117l6.234,6.234c0.138,0.138 0.32,0.252 0.509,0.252c0.14,0 0.272,-0.147 0.381,-0.252l6.234,-6.107l19.72,-19.72c0.278,-0.273 0.277,-0.744 0,-1.018l-6.234,-6.234c-0.277,-0.273 -0.617,-0.277 -0.891,0l-19.211,19.211l-9.09,-8.608c-0.137,-0.138 -0.32,-0.256 -0.509,-0.256l0.001,0Z"
                          style={{ fill: 'url(#_Linear6)', fillRule: 'nonzero' }}
                        />
                      </g>
                    </g>
                  </g>

                  {/* S6: Arrow to S7 */}
                  <g 
                    id="S6"
                    style={{
                      opacity: 0,
                      animation: 'arrowSlideIn 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards 1.45s',
                    }}
                  >
                    <path d="M2788.553,42.949l227.242,0" style={{ fill: 'none' }} />
                    <path
                      d="M2989.533,30.449l18.75,12.5l-18.75,12.5"
                      style={{
                        fill: 'none',
                        stroke: '#F4F4F9',
                        strokeWidth: '8.33px',
                        strokeLinecap: 'round',
                        strokeMiterlimit: 10,
                      }}
                    />
                    <path
                      d="M2788.553,42.949l219.73,0"
                      style={{
                        fill: 'none',
                        stroke: '#F4F4F9',
                        strokeWidth: '8.33px',
                        strokeLinecap: 'round',
                        strokeLinejoin: 'round',
                        strokeMiterlimit: 1.5,
                      }}
                    />
                  </g>

                  {/* S7: Business Outcomes */}
                  <g 
                    id="S7"
                    style={{
                      opacity: 0,
                      animation: 'stepFadeSlide 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards 1.70s',
                    }}
                  >
                    <text
                      x="3120.041px"
                      y="68.523px"
                      style={{
                        fontFamily: "'Inter', ui-sans-serif, system-ui, sans-serif",
                        fontWeight: 700,
                        fontSize: '62.5px',
                        fill: '#051c2c',
                      }}
                    >
                      Business Outcomes
                    </text>
                    <clipPath id="_clip7">
                      <rect x="3031.795" y="13.206" width="65.192" height="65.192" />
                    </clipPath>
                    <g clipPath="url(#_clip7)">
                      <g>
                        <path
                          d="M3096.998,45.851c0.001,0.092 0.001,0.184 0.001,0.276c0,17.882 -14.715,32.597 -32.597,32.597c-17.882,0 -32.597,-14.715 -32.597,-32.597c0,-0.092 0,-0.184 0.001,-0.276c-0.001,-0.092 -0.001,-0.184 -0.001,-0.276c0,-17.882 14.715,-32.597 32.597,-32.597c17.882,0 32.597,14.715 32.597,32.597c0,0.092 -0,0.184 -0.001,0.276Z"
                          style={{ fill: '#0d345e', fillRule: 'nonzero' }}
                        />
                        <path
                          d="M3094.136,45.831c0.001,0.084 0.001,0.168 0.001,0.252c0,16.327 -13.435,29.763 -29.763,29.763c-16.327,0 -29.763,-13.435 -29.763,-29.763c0,-0.084 0,-0.168 0.001,-0.252c-0.001,-0.084 -0.001,-0.168 -0.001,-0.252c0,-16.327 13.435,-29.763 29.763,-29.763c16.327,0 29.763,13.435 29.763,29.763c0,0.084 -0,0.168 -0.001,0.252Z"
                          style={{ fill: 'url(#_Linear8)', fillRule: 'nonzero', stroke: '#fff', strokeWidth: '0.69px' }}
                        />
                        <path
                          d="M3049.782,39.606c-0.189,0 -0.5,0.114 -0.637,0.257l-6.112,6.239c-0.274,0.277 -0.274,0.618 0,0.892l9.607,9.124l6.239,6.239c0.139,0.139 0.32,0.253 0.509,0.253c0.14,0 0.272,-0.147 0.382,-0.253l6.239,-6.112l19.736,-19.736c0.278,-0.273 0.277,-0.744 0,-1.019l-6.239,-6.239c-0.277,-0.273 -0.618,-0.277 -0.891,0l-19.227,19.226l-9.097,-8.615c-0.137,-0.139 -0.32,-0.257 -0.509,-0.257l0.001,0Z"
                          style={{ fill: 'url(#_Linear9)', fillRule: 'nonzero' }}
                        />
                        <path
                          d="M3064.371,16.082c-16.428,0 -29.757,13.329 -29.757,29.757c0,7.893 3.221,14.946 8.241,20.275c2.608,-21.541 20.789,-38.29 43.031,-38.29c0.6,0 1.157,0.122 1.75,0.147c-5.442,-7.079 -13.653,-11.888 -23.266,-11.888l-0,-0.001Z"
                          style={{ fill: 'url(#_Linear10)', fillRule: 'nonzero' }}
                        />
                      </g>
                    </g>
                  </g>

                  {/* S8: Defs & Gradients */}
                  <defs id="S8">
                    <linearGradient
                      id="_Linear2"
                      x1="0"
                      y1="0"
                      x2="1"
                      y2="0"
                      gradientUnits="userSpaceOnUse"
                      gradientTransform="matrix(15.333849,17.674649,-17.674649,15.333849,6.60317,32.405892)"
                    >
                      <stop offset="0" style={{ stopColor: '#fff', stopOpacity: 0.73 }} />
                      <stop offset="1" style={{ stopColor: '#fff', stopOpacity: 1 }} />
                    </linearGradient>

                    <linearGradient
                      id="_Linear4"
                      x1="0"
                      y1="0"
                      x2="1"
                      y2="0"
                      gradientUnits="userSpaceOnUse"
                      gradientTransform="matrix(15.186506,17.504813,-17.504813,15.186506,1050.584994,32.534619)"
                    >
                      <stop offset="0" style={{ stopColor: '#fff', stopOpacity: 0.73 }} />
                      <stop offset="1" style={{ stopColor: '#fff', stopOpacity: 1 }} />
                    </linearGradient>

                    <linearGradient
                      id="_Linear6"
                      x1="0"
                      y1="0"
                      x2="1"
                      y2="0"
                      gradientUnits="userSpaceOnUse"
                      gradientTransform="matrix(15.31836,17.656795,-17.656795,15.31836,1897.971378,32.419424)"
                    >
                      <stop offset="0" style={{ stopColor: '#fff', stopOpacity: 0.73 }} />
                      <stop offset="1" style={{ stopColor: '#fff', stopOpacity: 1 }} />
                    </linearGradient>

                    <linearGradient
                      id="_Linear8"
                      x1="0"
                      y1="0"
                      x2="1"
                      y2="0"
                      gradientUnits="userSpaceOnUse"
                      gradientTransform="matrix(37.184506,37.205816,-37.205816,37.184506,3040.926739,28.612731)"
                    >
                      <stop offset="0" style={{ stopColor: '#c7d80c', stopOpacity: 1 }} />
                      <stop offset="1" style={{ stopColor: '#13a3df', stopOpacity: 1 }} />
                    </linearGradient>

                    <linearGradient
                      id="_Linear9"
                      x1="0"
                      y1="0"
                      x2="1"
                      y2="0"
                      gradientUnits="userSpaceOnUse"
                      gradientTransform="matrix(15.331009,17.671375,-17.671375,15.331009,3038.396902,32.408373)"
                    >
                      <stop offset="0" style={{ stopColor: '#fff', stopOpacity: 0.73 }} />
                      <stop offset="1" style={{ stopColor: '#fff', stopOpacity: 1 }} />
                    </linearGradient>

                    <linearGradient
                      id="_Linear10"
                      x1="0"
                      y1="0"
                      x2="1"
                      y2="0"
                      gradientUnits="userSpaceOnUse"
                      gradientTransform="matrix(20.494234,29.086921,-29.086921,20.494234,3031.918178,20.355476)"
                    >
                      <stop offset="0" style={{ stopColor: '#fff', stopOpacity: 1 }} />
                      <stop offset="1" style={{ stopColor: '#fff', stopOpacity: 0 }} />
                    </linearGradient>
                  </defs>
                </svg>
              </div>
            </div>

            {/* REVOS WORKFLOW CHART (Sequence revos-step1 -> revos-step9) */}
            <div className="w-full">
              <svg
                key={`revos-${animKey}`}
                width="100%"
                height="100%"
                viewBox="0 0 3189 1511"
                version="1.1"
                xmlns="http://www.w3.org/2000/svg"
                xmlnsXlink="http://www.w3.org/1999/xlink"
                xmlSpace="preserve"
                style={{
                  fillRule: 'evenodd',
                  clipRule: 'evenodd',
                  strokeLinecap: 'round',
                  strokeLinejoin: 'round',
                  fontFamily: "'Inter', ui-sans-serif, system-ui, sans-serif",
                }}
                className="w-full h-auto block select-none drop-shadow-sm"
              >
                {/* revos-step1: 1. Data & Input */}
                <g 
                  id="revos-step1"
                  style={{
                    opacity: 0,
                    animation: 'stepFadeSlide 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards 2.05s',
                  }}
                >
                  <path
                    d="M948.595,21.766l0,174.127c0,12.013 -9.753,21.766 -21.766,21.766l-905.063,0c-12.013,0 -21.766,-9.753 -21.766,-21.766l0,-174.127c0,-12.013 9.753,-21.766 21.766,-21.766l905.063,0c12.013,0 21.766,9.753 21.766,21.766Z"
                    style={{ fill: '#f4f4f9' }}
                  />
                  <text
                    x="254.081px"
                    y="96.624px"
                    style={{
                      fontFamily: "'Inter', sans-serif",
                      fontWeight: 700,
                      fontSize: '75px',
                      fill: '#051c2c',
                    }}
                  >
                    1. Data &amp; Input
                  </text>
                  <text
                    x="256.302px"
                    y="164.016px"
                    style={{
                      fontFamily: "'Inter', sans-serif",
                      fontSize: '50px',
                      fill: '#4c697c',
                    }}
                  >
                    Multi-source data ingestion
                  </text>
                  <g id="data">
                    <path
                      d="M65.464,124.845l0,33.129c0,9.087 26.171,16.564 57.976,16.564c31.805,0 57.976,-7.477 57.976,-16.564l0,-33.129"
                      style={{ fill: '#4c697c', fillRule: 'nonzero', stroke: '#fefef9', strokeWidth: '6.63px' }}
                    />
                    <path
                      d="M65.464,91.716l0,33.129c0,9.087 26.171,16.564 57.976,16.564c31.805,0 57.976,-7.477 57.976,-16.564l0,-33.129"
                      style={{ fill: '#4c697c', fillRule: 'nonzero', stroke: '#f4f4f9', strokeWidth: '6.63px' }}
                    />
                    <path
                      d="M65.464,58.587l0,33.129c0,9.087 26.171,16.564 57.976,16.564c31.805,0 57.976,-7.477 57.976,-16.564l0,-33.129"
                      style={{ fill: '#4c697c', fillRule: 'nonzero', stroke: '#f4f4f9', strokeWidth: '6.63px' }}
                    />
                    <path
                      d="M123.44,42.022c-31.805,0 -57.976,7.477 -57.976,16.564c0,9.087 26.171,16.564 57.976,16.564c31.805,0 57.976,-7.477 57.976,-16.564c0,-9.087 -26.171,-16.564 -57.976,-16.564Z"
                      style={{ fill: '#4c697c', fillRule: 'nonzero', stroke: '#f4f4f9', strokeWidth: '6.63px' }}
                    />
                  </g>
                </g>

                {/* revos-step2: Connector Arrow 1 -> 2 */}
                <g 
                  id="revos-step2"
                  style={{
                    opacity: 0,
                    animation: 'arrowSlideIn 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards 2.45s',
                  }}
                >
                  <path d="M474.298,217.659l0,164.277" style={{ fill: 'none' }} />
                  <path
                    d="M489.923,233.284c0,-8.624 -7.001,-15.625 -15.625,-15.625c-8.624,0 -15.625,7.001 -15.625,15.625c0,8.624 7.001,15.625 15.625,15.625c8.624,0 15.625,-7.001 15.625,-15.625Z"
                    style={{ fill: '#4c697c' }}
                  />
                  <path
                    d="M489.923,349.109l-15.625,23.438l-15.625,-23.438"
                    style={{
                      fill: 'none',
                      stroke: '#4c697c',
                      strokeWidth: '10.42px',
                      strokeLinejoin: 'miter',
                      strokeMiterlimit: 10,
                    }}
                  />
                  <path
                    d="M474.298,242.659l0,129.887"
                    style={{ fill: 'none', stroke: '#4c697c', strokeWidth: '10.42px', strokeMiterlimit: 1.5 }}
                  />
                </g>

                {/* revos-step3: 2. RevOS Core */}
                <g 
                  id="revos-step3"
                  style={{
                    opacity: 0,
                    animation: 'stepFadeSlide 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards 2.75s',
                  }}
                >
                  <path
                    d="M948.595,405.75l0,174.127c0,12.013 -9.753,21.766 -21.766,21.766l-905.063,0c-12.013,0 -21.766,-9.753 -21.766,-21.766l0,-174.127c0,-12.013 9.753,-21.766 21.766,-21.766l905.063,0c12.013,0 21.766,9.753 21.766,21.766Z"
                    style={{ fill: '#f4f4f9' }}
                  />
                  <text
                    x="254.081px"
                    y="480.608px"
                    style={{
                      fontFamily: "'Inter', sans-serif",
                      fontWeight: 700,
                      fontSize: '75px',
                      fill: '#051c2c',
                    }}
                  >
                    2. RevOS Core
                  </text>
                  <text
                    x="256.302px"
                    y="548px"
                    style={{
                      fontFamily: "'Inter', sans-serif",
                      fontSize: '50px',
                      fill: '#4c697c',
                    }}
                  >
                    Data Integration &amp; Validation
                  </text>
                  <g id="AI">
                    <circle cx="130.598" cy="492.814" r="65.377" style={{ fill: '#4c697c' }} />
                    <g>
                      <path
                        d="M138.615,540.507c-0.034,-0.033 -0.053,-0.092 -0.077,-0.095c-0.479,-0.049 -0.936,-0.223 -1.326,-0.505c-0.235,-0.174 -0.438,-0.398 -0.637,-0.615c-0.2,-0.217 -0.383,-0.342 -0.686,-0.226c-0.32,0.121 -0.605,-0.071 -0.86,-0.205c-0.449,-0.245 -0.881,-0.521 -1.293,-0.826c-0.634,-0.454 -1.052,-1.074 -1.324,-1.795c-0.283,-0.76 -0.399,-1.573 -0.341,-2.382c0.026,-0.404 0.131,-0.804 0.189,-1.206c0.037,-0.214 0.053,-0.431 0.045,-0.648c-0.017,-0.264 0.158,-0.395 0.313,-0.54c0.106,-0.097 0.137,-0.198 0.144,-0.34c0.032,-0.644 -0.139,-1.259 -0.26,-1.878c-0.134,-0.689 -0.317,-1.368 -0.49,-2.05c-0.129,-0.515 -0.283,-1.024 -0.405,-1.54c-0.081,-0.342 -0.142,-0.689 -0.183,-1.038c-0.045,-0.329 -0.061,-0.662 -0.048,-0.994c0.04,-0.671 0.071,-1.355 0.398,-1.962c0.198,-0.37 0.475,-0.694 0.69,-1.053c0.2,-0.33 0.416,-0.674 0.383,-1.074c-0.028,-0.284 -0.103,-0.562 -0.221,-0.821c-0.247,-0.559 -0.556,-1.091 -0.789,-1.655c-0.139,-0.338 -0.204,-0.714 -0.264,-1.079c-0.066,-0.379 -0.099,-0.762 -0.099,-1.147c0.014,-0.936 0.032,-1.874 0.101,-2.807c0.068,-0.796 0.192,-1.587 0.37,-2.366c0.277,-1.275 0.664,-2.513 1.06,-3.748c0.106,-0.332 0.035,-0.613 -0.145,-0.892c-0.222,-0.344 -0.48,-0.675 -0.638,-1.048c-0.218,-0.515 -0.192,-1.071 -0.124,-1.626c0.075,-0.613 0.268,-1.183 0.5,-1.751c0.223,-0.535 0.516,-1.039 0.873,-1.496c0.145,-0.2 0.304,-0.39 0.475,-0.568c0.118,-0.117 0.087,-0.168 -0.012,-0.264c-0.499,-0.496 -0.918,-1.066 -1.244,-1.689c-0.221,-0.427 -0.351,-0.896 -0.38,-1.377c-0.031,-0.471 -0.053,-0.944 -0.05,-1.416c0.009,-1.694 0.026,-3.388 0.05,-5.082c0.01,-0.598 0.018,-1.201 0.106,-1.79c0.096,-0.683 0.248,-1.357 0.455,-2.015c0.257,-0.789 0.591,-1.554 0.92,-2.318c0.347,-0.806 0.727,-1.598 1.09,-2.396c0.067,-0.146 0.099,-0.234 -0.124,-0.33c-0.594,-0.253 -1.02,-0.717 -1.363,-1.261c-0.441,-0.702 -0.713,-1.475 -0.929,-2.264c-0.106,-0.393 -0.136,-0.814 -0.154,-1.224c-0.035,-0.826 -0.071,-1.655 -0.046,-2.481c0.02,-0.834 0.088,-1.666 0.203,-2.492c0.083,-0.574 0.297,-1.129 0.446,-1.694c0.084,-0.321 0.162,-0.644 0.233,-0.969c0.077,-0.355 -0.097,-0.616 -0.363,-0.813c-0.515,-0.38 -0.634,-0.683 -0.467,-1.286c0.078,-0.281 0.128,-0.577 0.252,-0.836c0.229,-0.475 0.617,-0.824 1.056,-1.109c0.058,-0.037 0.109,-0.084 0.163,-0.127c-0.05,-0.038 -0.102,-0.073 -0.155,-0.106c-0.512,-0.269 -0.874,-0.703 -1.223,-1.142c-0.254,-0.315 -0.478,-0.653 -0.67,-1.009c-0.291,-0.554 -0.313,-1.149 -0.237,-1.772c0.115,-0.936 0.622,-1.679 1.084,-2.447c0.277,-0.462 0.55,-0.927 0.854,-1.373c0.286,-0.419 0.239,-0.824 0.026,-1.244c-0.339,-0.668 -0.572,-1.37 -0.615,-2.122c-0.03,-0.521 -0.08,-1.046 -0.041,-1.564c0.053,-0.719 0.155,-1.437 0.483,-2.1c0.435,-0.881 1.179,-1.399 2.042,-1.795c0.573,-0.264 1.161,-0.495 1.663,-0.893c0.125,-0.104 0.277,-0.168 0.438,-0.185c0.39,-0.015 0.782,0.017 1.173,0.029c0.18,0.006 0.363,-0.009 0.54,0.015c0.545,0.073 1.089,0.152 1.631,0.247c0.487,0.086 0.835,0.436 1.214,0.709c0.264,0.191 0.555,0.25 0.853,0.274c0.812,0.071 1.608,0.27 2.358,0.59c0.541,0.224 1.085,0.442 1.546,0.808c0.299,0.238 0.558,0.528 0.84,0.788c0.1,0.089 0.206,0.171 0.317,0.247c0.331,0.233 0.666,0.139 0.981,-0.021c0.418,-0.211 0.805,-0.49 1.234,-0.669c0.527,-0.229 1.073,-0.408 1.633,-0.534c0.548,-0.118 1.109,-0.168 1.669,-0.149c1.017,0.042 1.997,0.292 2.855,0.865c0.511,0.341 1.037,0.686 1.46,1.126c0.838,0.868 1.534,1.848 1.863,3.036c0.114,0.412 0.17,0.84 0.242,1.262c0.117,0.679 -0.211,1.287 -0.317,1.93c-0.063,0.399 -0.158,0.845 0.231,1.17c0.258,0.216 0.574,0.249 0.884,0.252c0.606,0.006 1.192,0.037 1.764,0.294c0.522,0.228 0.959,0.613 1.252,1.102c0.385,0.627 0.598,1.316 0.693,2.041c0.074,0.566 0.133,1.134 0.2,1.701c0.106,0.898 0.106,1.808 0.446,2.664c0.233,0.584 0.561,1.092 1.072,1.488c0.528,0.409 1.003,0.881 1.519,1.304c0.556,0.457 1.003,1.003 1.395,1.6c0.528,0.811 0.941,1.674 1.115,2.634c0.097,0.533 0.204,1.068 0.241,1.607c0.06,0.742 0.075,1.488 0.045,2.232c-0.032,0.625 -0.163,1.245 -0.276,1.864c-0.119,0.648 -0.264,1.292 -0.406,1.937c-0.062,0.282 0.099,0.458 0.296,0.594c0.463,0.32 0.901,0.67 1.191,1.157c0.241,0.407 0.432,0.845 0.645,1.267c0.484,0.965 0.403,2.004 0.392,3.031c-0.003,0.309 -0.08,0.617 -0.084,0.925c0,0.106 0.096,0.254 0.19,0.308c0.621,0.356 0.937,0.974 1.333,1.522c0.581,0.806 0.923,1.729 1.203,2.67c0.152,0.512 0.225,1.047 0.337,1.571c0.006,0.026 0.047,0.045 0.084,0.068c0.012,0.322 0.012,0.644 0,0.979c-0.037,0.033 -0.081,0.053 -0.084,0.077c-0.073,0.568 -0.3,1.073 -0.719,1.456c-0.378,0.333 -0.781,0.637 -1.205,0.909c-0.211,0.138 -0.173,0.23 -0.049,0.385c0.217,0.271 0.452,0.533 0.626,0.83c0.55,0.939 1.109,1.878 1.304,2.974c0.012,0.063 0.091,0.114 0.139,0.169c0,0.851 0,1.701 -0.012,2.564c-0.037,0.034 -0.08,0.053 -0.084,0.077c-0.099,0.688 -0.35,1.345 -0.735,1.924c-0.264,0.392 -0.571,0.758 -0.872,1.125c-0.542,0.659 -1.175,1.223 -1.841,1.755c-0.251,0.201 -0.463,0.458 -0.667,0.712c-0.356,0.442 -0.164,0.933 -0.071,1.401c0.095,0.48 0.172,0.938 -0.061,1.409c-0.295,0.595 -0.375,1.207 -0.072,1.842c0.114,0.239 0.152,0.516 0.207,0.779c0.102,0.487 0.196,0.975 0.273,1.467c0.071,0.455 0.149,0.914 0.158,1.373c0.006,0.408 -0.08,0.818 -0.137,1.226c-0.089,0.578 -0.263,1.14 -0.518,1.667c-0.521,1.119 -1.241,2.118 -1.91,3.146c-0.403,0.62 -0.858,1.196 -1.425,1.689c-0.828,0.72 -1.795,1.132 -2.835,1.415c-0.313,0.085 -0.638,0.147 -0.848,0.462c-0.302,0.454 -0.349,0.969 -0.44,1.478c-0.062,0.346 -0.097,0.7 -0.191,1.036c-0.111,0.381 -0.247,0.755 -0.408,1.118c-0.233,0.54 -0.468,1.081 -0.746,1.597c-0.272,0.506 -0.597,0.991 -1.112,1.287c-0.47,0.271 -0.956,0.518 -1.446,0.753c-0.49,0.235 -0.992,0.479 -1.508,0.66c-0.659,0.232 -1.352,0.357 -2.051,0.37c-0.448,0.01 -0.895,-0.008 -1.341,-0.053c-0.442,-0.054 -0.881,-0.13 -1.315,-0.23c-0.775,-0.165 -1.534,-0.415 -2.346,-0.357c-0.251,0.02 -0.485,0.132 -0.658,0.314c-0.354,0.37 -0.704,0.739 -1.059,1.109c-0.375,0.389 -0.799,0.739 -1.12,1.17c-0.528,0.707 -1.146,1.291 -1.935,1.686c-0.533,0.264 -1.073,0.518 -1.61,0.777c-0.779,0.376 -1.584,0.675 -2.445,0.797c-0.025,0.003 -0.043,0.062 -0.064,0.095l-3.455,0"
                        style={{
                          fill: '#f4f4f9',
                          fillRule: 'nonzero',
                          stroke: '#f4f4f9',
                          strokeWidth: '2.82px',
                          strokeMiterlimit: 10,
                        }}
                      />
                    </g>
                  </g>
                </g>

                {/* revos-step4: Connector Arrow 2 -> 3 */}
                <g 
                  id="revos-step4"
                  style={{
                    opacity: 0,
                    animation: 'arrowSlideIn 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards 3.15s',
                  }}
                >
                  <circle cx="964.22" cy="492.814" r="15.625" style={{ fill: '#4c697c' }} />
                  <path
                    d="M1086.5,361.358l23.438,15.625l-23.438,15.625"
                    style={{
                      fill: 'none',
                      stroke: '#4c697c',
                      strokeWidth: '10.42px',
                      strokeLinejoin: 'miter',
                      strokeMiterlimit: 10,
                    }}
                  />
                  <path
                    d="M973.595,492.814l46.306,0l0,-115.831l90.037,0"
                    style={{ fill: 'none', stroke: '#4c697c', strokeWidth: '10.42px', strokeMiterlimit: 1.5 }}
                  />
                </g>

                {/* revos-step5: 3. AI Reasoning */}
                <g 
                  id="revos-step5"
                  style={{
                    opacity: 0,
                    animation: 'stepFadeSlide 0.45s cubic-bezier(0.16, 1, 0.3, 1) forwards 3.45s',
                  }}
                >
                  <path
                    d="M3087.38,30.082l0,541.479c0,16.603 -13.479,30.082 -30.082,30.082l-1907.889,0c-16.603,0 -30.082,-13.479 -30.082,-30.082l0,-541.479c0,-16.603 13.479,-30.082 30.082,-30.082l1907.889,0c16.603,0 30.082,13.479 30.082,30.082Z"
                    style={{ fill: '#f4f4f9' }}
                  />
                  <text
                    x="1362.464px"
                    y="106.741px"
                    style={{
                      fontFamily: "'Inter', sans-serif",
                      fontWeight: 700,
                      fontSize: '75px',
                      fill: '#051c2c',
                    }}
                  >
                    3. AI Reasoning
                  </text>
                  <text
                    x="1364.112px"
                    y="174.218px"
                    style={{
                      fontFamily: "'Inter', sans-serif",
                      fontSize: '50px',
                      fill: '#4c697c',
                    }}
                  >
                    Turn evidence into insights, decisions and actions
                  </text>

                  {/* AI Chip Icon */}
                  <g id="AI1">
                    <path d="M1267.476,79.434l0,-15.489" style={{ fill: 'none', stroke: '#4c697c', strokeWidth: '5.81px' }} />
                    <path d="M1248.115,79.434l-0,-15.489" style={{ fill: 'none', stroke: '#4c697c', strokeWidth: '5.81px' }} />
                    <path d="M1228.754,79.434l0,-15.489" style={{ fill: 'none', stroke: '#4c697c', strokeWidth: '5.81px' }} />
                    <path d="M1228.754,156.878l0,15.489" style={{ fill: 'none', stroke: '#4c697c', strokeWidth: '5.81px' }} />
                    <path d="M1267.476,156.878l0,15.489" style={{ fill: 'none', stroke: '#4c697c', strokeWidth: '5.81px' }} />
                    <path d="M1248.115,156.878l0,15.489" style={{ fill: 'none', stroke: '#4c697c', strokeWidth: '5.81px' }} />
                    <path d="M1286.837,98.795l15.489,-0" style={{ fill: 'none', stroke: '#4c697c', strokeWidth: '5.81px' }} />
                    <path d="M1286.837,118.156l15.489,0" style={{ fill: 'none', stroke: '#4c697c', strokeWidth: '5.81px' }} />
                    <path d="M1286.837,137.517l15.489,0" style={{ fill: 'none', stroke: '#4c697c', strokeWidth: '5.81px' }} />
                    <path d="M1209.393,137.517l-15.489,0" style={{ fill: 'none', stroke: '#4c697c', strokeWidth: '5.81px' }} />
                    <path d="M1209.393,98.795l-15.489,-0" style={{ fill: 'none', stroke: '#4c697c', strokeWidth: '5.81px' }} />
                    <path d="M1209.393,118.156l-15.489,0" style={{ fill: 'none', stroke: '#4c697c', strokeWidth: '5.81px' }} />
                    <circle cx="1267.476" cy="60.073" r="5.808" style={{ fill: '#4c697c' }} />
                    <circle cx="1248.115" cy="60.073" r="5.808" style={{ fill: '#4c697c' }} />
                    <circle cx="1228.754" cy="60.073" r="5.808" style={{ fill: '#4c697c' }} />
                    <circle cx="1228.754" cy="176.239" r="5.808" style={{ fill: '#4c697c' }} />
                    <circle cx="1267.476" cy="176.239" r="5.808" style={{ fill: '#4c697c' }} />
                    <circle cx="1248.115" cy="176.239" r="5.808" style={{ fill: '#4c697c' }} />
                    <circle cx="1306.198" cy="98.795" r="5.808" style={{ fill: '#4c697c' }} />
                    <circle cx="1306.198" cy="118.156" r="5.808" style={{ fill: '#4c697c' }} />
                    <circle cx="1306.198" cy="137.517" r="5.808" style={{ fill: '#4c697c' }} />
                    <circle cx="1190.032" cy="137.517" r="5.808" style={{ fill: '#4c697c' }} />
                    <circle cx="1190.032" cy="98.795" r="5.808" style={{ fill: '#4c697c' }} />
                    <circle cx="1190.032" cy="118.156" r="5.808" style={{ fill: '#4c697c' }} />
                    <path
                      d="M1286.837,109.434l0,17.444c0,16.557 -13.443,30 -30,30l-17.444,0c-16.557,0 -30,-13.443 -30,-30l0,-17.444c0,-16.557 13.443,-30 30,-30l17.444,0c16.557,0 30,13.443 30,30Z"
                      style={{ fill: 'none', stroke: '#4c697c', strokeWidth: '9.68px' }}
                    />
                    <text
                      x="1220.946px"
                      y="137.517px"
                      style={{
                        fontFamily: "'Inter', sans-serif",
                        fontWeight: 700,
                        fontSize: '54.856px',
                        fill: '#4c697c',
                      }}
                    >
                      AI
                    </text>
                  </g>

                  {/* Six Sequential Chevrons */}
                  <g id="AI-Steps">
                    <path
                      d="M1193.905,470.07l0,-186.174l269.059,0l32.104,93.087l-32.104,93.087l-269.059,-0Z"
                      style={{ fill: 'none', stroke: '#4c697c', strokeWidth: '8.33px', strokeMiterlimit: 1.5 }}
                    />
                    <path
                      d="M1524.856,376.983l-29.788,-93.087l269.059,0l32.104,93.087l-32.104,93.087l-269.059,-0l29.788,-93.087Z"
                      style={{ fill: 'none', stroke: '#4c697c', strokeWidth: '8.33px', strokeMiterlimit: 1.5 }}
                    />
                    <path
                      d="M1826.019,376.983l-29.788,-93.087l269.059,0l32.104,93.087l-32.104,93.087l-269.059,-0l29.788,-93.087Z"
                      style={{ fill: 'none', stroke: '#4c697c', strokeWidth: '8.33px', strokeMiterlimit: 1.5 }}
                    />
                    <path
                      d="M2127.182,376.983l-29.788,-93.087l269.059,0l32.104,93.087l-32.104,93.087l-269.059,-0l29.788,-93.087Z"
                      style={{ fill: 'none', stroke: '#4c697c', strokeWidth: '8.33px', strokeMiterlimit: 1.5 }}
                    />
                    <path
                      d="M2428.345,376.983l-29.788,-93.087l269.059,0l32.104,93.087l-32.104,93.087l-269.059,-0l29.788,-93.087Z"
                      style={{ fill: 'none', stroke: '#4c697c', strokeWidth: '8.33px', strokeMiterlimit: 1.5 }}
                    />
                    <path
                      d="M2729.508,376.983l-29.788,-93.087l269.059,0l32.104,93.087l-32.104,93.087l-269.059,-0l29.788,-93.087Z"
                      style={{ fill: 'none', stroke: '#4c697c', strokeWidth: '8.33px', strokeMiterlimit: 1.5 }}
                    />

                    {/* Step 1: Context Understanding */}
                    <g transform="matrix(1,0,0,1,41.828698,-1099.522234)">
                      <text x="1228.468px" y="1464.649px" style={{ fontFamily: "'Inter', sans-serif", fontWeight: 700, fontSize: '37.5px', fill: '#4c697c' }}>Context</text>
                      <text x="1165.965px" y="1507.771px" style={{ fontFamily: "'Inter', sans-serif", fontWeight: 700, fontSize: '37.5px', fill: '#4c697c' }}>Understanding</text>
                    </g>
                    {/* Step 2: Evidence Analysis */}
                    <g transform="matrix(1,0,0,1,360.761804,-1099.522234)">
                      <text x="1215.926px" y="1464.649px" style={{ fontFamily: "'Inter', sans-serif", fontWeight: 700, fontSize: '37.5px', fill: '#4c697c' }}>Evidence</text>
                      <text x="1221.135px" y="1507.771px" style={{ fontFamily: "'Inter', sans-serif", fontWeight: 700, fontSize: '37.5px', fill: '#4c697c' }}>Analysis</text>
                    </g>
                    {/* Step 3: Reasoning & Analysis */}
                    <g transform="matrix(1,0,0,1,661.303219,-1099.522234)">
                      <text x="1184.688px" y="1464.649px" style={{ fontFamily: "'Inter', sans-serif", fontWeight: 700, fontSize: '37.5px', fill: '#4c697c' }}>Reasoning &amp;</text>
                      <text x="1221.135px" y="1507.771px" style={{ fontFamily: "'Inter', sans-serif", fontWeight: 700, fontSize: '37.5px', fill: '#4c697c' }}>Analysis</text>
                    </g>
                    {/* Step 4: Decision Evaluation */}
                    <g transform="matrix(1,0,0,1,955.564691,-1099.522234)">
                      <text x="1220.11px" y="1464.649px" style={{ fontFamily: "'Inter', sans-serif", fontWeight: 700, fontSize: '37.5px', fill: '#4c697c' }}>Decision</text>
                      <text x="1203.447px" y="1507.771px" style={{ fontFamily: "'Inter', sans-serif", fontWeight: 700, fontSize: '37.5px', fill: '#4c697c' }}>Evaluation</text>
                    </g>
                    {/* Step 5: Advice Generation */}
                    <g transform="matrix(1,0,0,1,1260.591799,-1099.522234)">
                      <text x="1236.772px" y="1464.649px" style={{ fontFamily: "'Inter', sans-serif", fontWeight: 700, fontSize: '37.5px', fill: '#4c697c' }}>Advice</text>
                      <text x="1199.281px" y="1507.771px" style={{ fontFamily: "'Inter', sans-serif", fontWeight: 700, fontSize: '37.5px', fill: '#4c697c' }}>Generation</text>
                    </g>
                    {/* Step 6: Validation & Uncertainty Check */}
                    <g transform="matrix(1,0,0,1,1558.441908,-1120.863177)">
                      <text x="1190.95px" y="1464.649px" style={{ fontFamily: "'Inter', sans-serif", fontWeight: 700, fontSize: '37.5px', fill: '#4c697c' }}>Validation &amp;</text>
                      <text x="1195.107px" y="1507.771px" style={{ fontFamily: "'Inter', sans-serif", fontWeight: 700, fontSize: '37.5px', fill: '#4c697c' }}>Uncertainty</text>
                      <text x="1241.982px" y="1550.892px" style={{ fontFamily: "'Inter', sans-serif", fontWeight: 700, fontSize: '37.5px', fill: '#4c697c' }}>Check</text>
                    </g>
                  </g>
                </g>

                {/* revos-step6: Connector Arrow 3 -> 4 */}
                <g 
                  id="revos-step6"
                  style={{
                    opacity: 0,
                    animation: 'arrowSlideIn 0.35s cubic-bezier(0.16, 1, 0.3, 1) forwards 4.05s',
                  }}
                >
                  <circle cx="3103.005" cy="376.983" r="15.625" style={{ fill: '#4c697c' }} />
                  <path
                    d="M1075.716,686.46l-15.625,23.438l-15.625,-23.438"
                    style={{
                      fill: 'none',
                      stroke: '#4c697c',
                      strokeWidth: '10.42px',
                      strokeLinejoin: 'miter',
                      strokeMiterlimit: 10,
                    }}
                  />
                  <path
                    d="M3112.38,376.983l22.346,0l0,266.358l-2074.635,0l0,66.557"
                    style={{ fill: 'none', stroke: '#4c697c', strokeWidth: '10.42px', strokeMiterlimit: 1.5 }}
                  />
                </g>

                {/* revos-step7: 4. Three Engines */}
                <g 
                  id="revos-step7"
                  style={{
                    opacity: 0,
                    animation: 'stepFadeSlide 0.45s cubic-bezier(0.16, 1, 0.3, 1) forwards 4.45s',
                  }}
                >
                  <path
                    d="M1712.707,758.843l0,712.006c0,21.831 -17.724,39.556 -39.556,39.556l-1633.596,0c-21.831,0 -39.556,-17.724 -39.556,-39.556l0,-712.006c0,-21.831 17.724,-39.556 39.556,-39.556l1633.596,0c21.831,0 39.556,17.724 39.556,39.556Z"
                    style={{ fill: '#f4f4f9' }}
                  />
                  <text
                    x="279.039px"
                    y="810.109px"
                    style={{
                      fontFamily: "'Inter', sans-serif",
                      fontWeight: 700,
                      fontSize: '75px',
                      fill: '#051c2c',
                    }}
                  >
                    4. Three Engines
                  </text>
                  <text
                    x="280.504px"
                    y="890.684px"
                    style={{
                      fontFamily: "'Inter', sans-serif",
                      fontSize: '50px',
                      fill: '#4c697c',
                    }}
                  >
                    Apply AI reasoning to business problems
                  </text>

                  {/* Engine 1: GTMOS Engine */}
                  <g id="GTM">
                    <path
                      d="M541.71,1005.023l0,440.229c0,12.689 -10.302,22.99 -22.99,22.99l-413.827,0c-12.689,0 -22.99,-10.302 -22.99,-22.99l0,-440.229c0,-12.689 10.302,-22.99 22.99,-22.99l413.827,0c12.689,0 22.99,10.302 22.99,22.99Z"
                      style={{ fill: '#c5d704' }}
                    />
                    <text
                      x="197.265px"
                      y="1306.65px"
                      style={{ fontFamily: "'Inter', sans-serif", fontWeight: 700, fontSize: '62.5px', fill: '#051c2c' }}
                    >
                      GTMOS
                    </text>
                    <text
                      x="214.538px"
                      y="1373.317px"
                      style={{ fontFamily: "'Inter', sans-serif", fontWeight: 600, fontSize: '62.5px', fill: '#051c2c' }}
                    >
                      Engine
                    </text>
                    <path
                      id="earth"
                      d="M317.011,1015.228c-48.006,-3.069 -87.749,36.671 -84.679,84.679c2.536,39.681 34.589,71.732 74.269,74.269c48.006,3.069 87.749,-36.671 84.679,-84.679c-2.538,-39.681 -34.59,-71.733 -74.269,-74.269Zm30.855,118.991c3.132,-10.761 5.002,-23.139 5.253,-36.454l32.124,0c-0.705,17.072 -7.258,32.651 -17.706,44.799c-4.794,-3.359 -11.494,-6.198 -19.671,-8.345Zm-91.79,8.345c-10.448,-12.148 -17.003,-27.727 -17.706,-44.799l32.124,0c0.25,13.315 2.12,25.693 5.253,36.454c-8.18,2.149 -14.881,4.987 -19.671,8.345Zm19.654,-87.326c-3.124,10.75 -4.988,23.108 -5.238,36.4l-32.123,0c0.7,-16.991 7.195,-32.503 17.556,-44.626c4.875,3.304 11.623,6.103 19.804,8.226Zm33.013,36.4l-32.124,0c0.263,-12.677 2.149,-24.643 5.229,-34.993c8.28,1.669 17.461,2.62 26.896,2.792l0,32.201Zm0,6.126l0,32.202c-9.454,0.172 -18.634,1.136 -26.883,2.827c-3.088,-10.359 -4.976,-22.338 -5.241,-35.03l32.124,0Zm6.126,0l32.124,0c-0.263,12.692 -2.153,24.67 -5.239,35.03c-8.254,-1.691 -17.432,-2.656 -26.885,-2.827l0,-32.202Zm0,-6.126l0,-32.202c9.434,-0.17 18.616,-1.123 26.896,-2.792c3.08,10.352 4.965,22.318 5.229,34.994l-32.124,0Zm0,-38.327l0,-31.815c10.061,1.91 19.062,13.083 24.964,29.295c-7.698,1.501 -16.211,2.356 -24.964,2.519Zm-6.126,-31.815l0,31.815c-8.753,-0.164 -17.267,-1.018 -24.964,-2.519c5.903,-16.213 14.904,-27.387 24.964,-29.295Zm0,114.597l0,31.815c-10.055,-1.908 -19.049,-13.067 -24.952,-29.262c7.672,-1.522 16.182,-2.388 24.952,-2.553Zm6.126,31.813l0,-31.813c8.768,0.165 17.277,1.031 24.952,2.553c-5.903,16.193 -14.897,27.353 -24.952,29.26Zm38.25,-76.268c-0.25,-13.292 -2.114,-25.65 -5.236,-36.4c8.182,-2.124 14.93,-4.922 19.803,-8.226c10.361,12.122 16.856,27.635 17.556,44.626l-32.123,0Zm10.332,-49.195c-4.288,2.717 -10.289,5.114 -17.44,6.949c-3.844,-10.868 -9.062,-19.711 -15.21,-25.704c12.502,3.348 23.701,9.912 32.65,18.755Zm-85.85,6.95c-7.151,-1.835 -13.151,-4.232 -17.44,-6.949c8.947,-8.845 20.148,-15.407 32.651,-18.755c-6.149,5.991 -11.369,14.836 -15.211,25.704Zm-17.285,97.714c4.196,-2.757 10.151,-5.187 17.303,-7.045c3.841,10.843 9.053,19.668 15.191,25.652c-12.432,-3.33 -23.572,-9.84 -32.495,-18.607Zm85.675,-7.045c7.151,1.858 13.107,4.288 17.303,7.045c-8.923,8.768 -20.062,15.279 -32.495,18.607c6.138,-5.984 11.349,-14.809 15.191,-25.652Z"
                      style={{ fill: '#051c2c', stroke: '#051c2c', strokeWidth: '2.92px' }}
                    />
                  </g>

                  {/* Engine 2: Lead Qualification Engine */}
                  <g id="Lead">
                    <path
                      d="M1077.789,1005.023l0,440.229c0,12.689 -10.302,22.99 -22.99,22.99l-413.827,0c-12.689,0 -22.99,-10.302 -22.99,-22.99l0,-440.229c0,-12.689 10.302,-22.99 22.99,-22.99l413.827,0c12.689,0 22.99,10.302 22.99,22.99Z"
                      style={{ fill: '#0a9fde' }}
                    />
                    <text
                      x="779.163px"
                      y="1272.86px"
                      style={{ fontFamily: "'Inter', sans-serif", fontWeight: 700, fontSize: '62.5px', fill: '#f4f4f9' }}
                    >
                      Lead
                    </text>
                    <text
                      x="676.716px"
                      y="1339.526px"
                      style={{ fontFamily: "'Inter', sans-serif", fontWeight: 700, fontSize: '62.5px', fill: '#f4f4f9' }}
                    >
                      Qualification
                    </text>
                    <text
                      x="751.377px"
                      y="1406.193px"
                      style={{ fontFamily: "'Inter', sans-serif", fontWeight: 600, fontSize: '62.5px', fill: '#f4f4f9' }}
                    >
                      Engine
                    </text>
                    <path
                      d="M909.624,1162.313c0,-42.504 -27.664,-76.94 -61.739,-76.94c-34.075,0 -61.739,34.435 -61.739,76.94c0,6.628 27.664,12.031 61.739,12.031c34.075,0 61.739,-5.403 61.739,-12.031Zm-61.739,-147.251c18.587,0 33.643,15.057 33.643,33.643c0,18.587 -15.057,33.643 -33.643,33.643c-18.587,0 -33.643,-15.057 -33.643,-33.643c0,-18.587 15.057,-33.643 33.643,-33.643Z"
                      style={{ fill: '#f4f4f9' }}
                    />
                  </g>

                  {/* Engine 3: Pipeline Assessment Engine */}
                  <g id="Pipeline">
                    <path
                      d="M1613.867,1005.023l0,440.229c0,12.689 -10.302,22.99 -22.99,22.99l-413.827,0c-12.689,0 -22.99,-10.302 -22.99,-22.99l0,-440.229c0,-12.689 10.302,-22.99 22.99,-22.99l413.827,0c12.689,0 22.99,10.302 22.99,22.99Z"
                      style={{ fill: '#042b57' }}
                    />
                    <text
                      x="1273.179px"
                      y="1272.86px"
                      style={{ fontFamily: "'Inter', sans-serif", fontWeight: 700, fontSize: '62.5px', fill: '#f4f4f9' }}
                    >
                      Pipeline
                    </text>
                    <text
                      x="1214.174px"
                      y="1339.526px"
                      style={{ fontFamily: "'Inter', sans-serif", fontWeight: 700, fontSize: '62.5px', fill: '#f4f4f9' }}
                    >
                      Assessment
                    </text>
                    <text
                      x="1287.065px"
                      y="1406.193px"
                      style={{ fontFamily: "'Inter', sans-serif", fontWeight: 600, fontSize: '62.5px', fill: '#f4f4f9' }}
                    >
                      Engine
                    </text>
                    <g id="growth">
                      <rect x="1302.389" y="1125.268" width="24.007" height="48.04" style={{ fill: '#f4f4f9' }} />
                      <rect x="1345.607" y="1091.635" width="24.007" height="81.669" style={{ fill: '#f4f4f9' }} />
                      <rect x="1388.824" y="1115.668" width="24.007" height="57.648" style={{ fill: '#f4f4f9' }} />
                      <rect x="1432.026" y="1077.234" width="24.007" height="96.08" style={{ fill: '#f4f4f9' }} />
                      <g>
                        <path
                          d="M1304.794,1086.242l43.695,-32.113c1.639,-1.204 3.91,-1.366 5.726,-0.407l40.391,21.322c1.793,0.946 4.049,0.717 5.581,-0.567l43.84,-36.757"
                          style={{
                            fill: 'none',
                            stroke: '#f4f4f9',
                            strokeWidth: '16.36px',
                            strokeLinecap: 'square',
                            strokeLinejoin: 'miter',
                          }}
                        />
                        <path
                          d="M1454.7,1058.828l-32.464,-31.274l43.301,-12.492l-10.837,43.766Z"
                          style={{ fill: '#f4f4f9', fillRule: 'nonzero' }}
                        />
                      </g>
                    </g>
                  </g>

                  {/* Gear Icon beside Three Engines title */}
                  <g>
                    <path
                      d="M137.121,763.467c-3.38,0 -6.767,0.431 -10.009,0.927c-0.515,8.311 -1.821,16.423 -8.712,19.277c-6.906,2.861 -13.394,-2.072 -19.647,-7.6c-5.468,3.991 -10.462,8.808 -14.458,14.273c5.549,6.271 10.655,12.719 7.785,19.647c-2.867,6.921 -11.114,8.2 -19.463,8.712c-0.507,3.279 -0.741,6.588 -0.741,10.009c0,3.465 0.222,6.876 0.741,10.194c8.348,0.511 16.595,1.42 19.463,8.341c2.87,6.929 -2.236,13.747 -7.785,20.019c3.975,5.423 9.029,10.118 14.458,14.087c6.234,-5.503 12.766,-10.265 19.647,-7.414c6.921,2.867 8.2,10.929 8.712,19.277c3.242,0.496 6.629,0.741 10.009,0.741c3.38,0 6.582,-0.246 9.824,-0.741c0.511,-8.348 1.791,-16.411 8.712,-19.277c6.882,-2.851 13.414,1.911 19.647,7.414c5.428,-3.969 10.482,-8.664 14.458,-14.087c-5.549,-6.271 -10.655,-13.09 -7.785,-20.019c2.867,-6.921 11.299,-7.829 19.647,-8.341c0.52,-3.319 0.741,-6.73 0.741,-10.194c0,-3.421 -0.235,-6.73 -0.741,-10.009c-8.348,-0.511 -16.781,-1.791 -19.647,-8.712c-2.87,-6.929 2.236,-13.377 7.785,-19.647c-3.995,-5.464 -8.99,-10.282 -14.458,-14.273c-6.253,5.527 -12.742,10.46 -19.647,7.6c-6.891,-2.854 -8.196,-10.966 -8.712,-19.277c-3.242,-0.496 -6.444,-0.927 -9.824,-0.927Zm0,43.929c11.788,0 21.315,9.527 21.315,21.315c0,11.788 -9.527,21.315 -21.315,21.315c-11.788,0 -21.501,-9.527 -21.501,-21.315c0,-11.788 9.713,-21.315 21.501,-21.315Z"
                      style={{
                        fill: '#4c697c',
                        fillRule: 'nonzero',
                        stroke: '#4c697c',
                        strokeWidth: '7.25px',
                        strokeLinecap: 'square',
                      }}
                    />
                  </g>
                </g>

                {/* revos-step8: Connector Arrow 4 -> 5 */}
                <g 
                  id="revos-step8"
                  style={{
                    opacity: 0,
                    animation: 'arrowSlideIn 0.35s cubic-bezier(0.16, 1, 0.3, 1) forwards 5.00s',
                  }}
                >
                  <circle cx="1728.332" cy="1114.846" r="15.625" style={{ fill: '#4c697c' }} />
                  <path
                    d="M1935.742,1099.221l23.438,15.625l-23.438,15.625"
                    style={{
                      fill: 'none',
                      stroke: '#4c697c',
                      strokeWidth: '10.42px',
                      strokeLinejoin: 'miter',
                      strokeMiterlimit: 10,
                    }}
                  />
                  <path
                    d="M1737.707,1114.846l221.472,0"
                    style={{ fill: 'none', stroke: '#4c697c', strokeWidth: '10.42px', strokeMiterlimit: 1.5 }}
                  />
                </g>

                {/* revos-step9: 5. Business Outcomes */}
                <g 
                  id="revos-step9"
                  style={{
                    opacity: 0,
                    animation: 'stepFadeSlide 0.45s cubic-bezier(0.16, 1, 0.3, 1) forwards 5.35s',
                  }}
                >
                  <path
                    d="M3087.38,765.758l0,681.564c0,25.648 -20.823,46.47 -46.47,46.47l-1025.871,0c-25.648,0 -46.47,-20.823 -46.47,-46.47l0,-681.564c0,-25.648 20.823,-46.47 46.47,-46.47l1025.871,0c25.648,0 46.47,20.823 46.47,46.47Z"
                    style={{ fill: '#f4f4f9' }}
                  />
                  <text
                    x="2222.65px"
                    y="815.912px"
                    style={{
                      fontFamily: "'Inter', sans-serif",
                      fontWeight: 700,
                      fontSize: '75px',
                      fill: '#051c2c',
                    }}
                  >
                    5. Business Outcomes
                  </text>
                  <text
                    x="2224.87px"
                    y="883.302px"
                    style={{
                      fontFamily: "'Inter', sans-serif",
                      fontSize: '50px',
                      fill: '#4c697c',
                    }}
                  >
                    <tspan x="2224.87px">More quality opportunities,</tspan>
                    <tspan x="2224.87px" dy="1.2em">more deals, higher revenue</tspan>
                  </text>

                  {/* Bullet points */}
                  <g transform="matrix(1,0,0,1,1523.375087,256.212059)">
                    <text x="518.985px" y="806.029px" style={{ fontFamily: "'Inter', sans-serif", fontSize: '66.667px', fill: '#051c2c' }}>
                      • <tspan fontWeight="bold">H</tspan>igher win rate
                    </text>
                    <text x="518.985px" y="897.696px" style={{ fontFamily: "'Inter', sans-serif", fontSize: '66.667px', fill: '#051c2c' }}>
                      • <tspan fontWeight="bold">S</tspan>horter sales cycle
                    </text>
                    <text x="518.985px" y="989.363px" style={{ fontFamily: "'Inter', sans-serif", fontSize: '66.667px', fill: '#051c2c' }}>
                      • <tspan fontWeight="bold">B</tspan>etter resource allocation
                    </text>
                    <text x="518.985px" y="1081.029px" style={{ fontFamily: "'Inter', sans-serif", fontSize: '66.667px', fill: '#051c2c' }}>
                      • <tspan fontWeight="bold">I</tspan>mproved forecast accuracy
                    </text>
                    <text x="518.985px" y="1172.696px" style={{ fontFamily: "'Inter', sans-serif", fontSize: '66.667px', fill: '#051c2c' }}>
                      • <tspan fontWeight="bold">S</tspan>ustainable revenue growth
                    </text>
                  </g>

                  {/* Bar Chart Icon for Business Outcomes */}
                  <g id="growth1">
                    <rect x="2033.121" y="844.965" width="16.575" height="33.169" style={{ fill: '#4c697c' }} />
                    <rect x="2062.96" y="821.743" width="16.575" height="56.387" style={{ fill: '#4c697c' }} />
                    <rect x="2092.799" y="838.337" width="16.575" height="39.803" style={{ fill: '#4c697c' }} />
                    <rect x="2122.627" y="811.801" width="16.575" height="66.337" style={{ fill: '#4c697c' }} />
                    <g>
                      <path
                        d="M2034.781,818.019l30.169,-22.172c1.132,-0.832 2.699,-0.943 3.953,-0.281l27.887,14.722c1.238,0.653 2.796,0.495 3.853,-0.391l30.269,-25.378"
                        style={{
                          fill: 'none',
                          stroke: '#4c697c',
                          strokeWidth: '11.3px',
                          strokeLinecap: 'square',
                          strokeLinejoin: 'miter',
                        }}
                      />
                      <path
                        d="M2138.282,799.092l-22.414,-21.593l29.897,-8.625l-7.482,30.218Z"
                        style={{ fill: '#4c697c', fillRule: 'nonzero' }}
                      />
                    </g>
                  </g>
                </g>
              </svg>
            </div>

          </div>
        </div>
      </div>

      {/* 2. FOUR COLUMN TEXT AREAS BELOW THE CARD */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-10 pt-10 sm:pt-14 text-left">
        {/* Column 1: What is RevOS */}
        <div className="flex flex-col">
          <h4 className="text-[14px] sm:text-[18px] font-bold text-white tracking-tight mb-2">
            What is RevOS
          </h4>
          <p className="text-[12px] sm:text-[14px] text-text-hero-secondary leading-tight">
            RevOS is an AI-native Revenue Operating System that helps B2B sales professionals and enterprises turn market opportunities into predictable revenue growth.
          </p>
        </div>

        {/* Column 2: Product Capabilities */}
        <div className="flex flex-col">
          <h4 className="text-[14px] sm:text-[18px] font-bold text-white tracking-tight mb-2">
            Product Capabilities
          </h4>
          <p className="text-[12px] sm:text-[14px] text-text-hero-secondary leading-tight">
            It addresses fragmented go-to-market strategies, inconsistent lead qualification, weak pipeline visibility, and unreliable revenue forecasts.
          </p>
        </div>

        {/* Column 3: Operating Approach */}
        <div className="flex flex-col">
          <h4 className="text-[14px] sm:text-[18px] font-bold text-white tracking-tight mb-2">
            Operating Approach
          </h4>
          <p className="text-[12px] sm:text-[14px] text-text-hero-secondary leading-tight">
            By integrating go-to-market strategy, evidence-driven lead qualification, and pipeline assessment into a unified operating framework, RevOS connects customer needs, business value, buying signals, and sales execution.
          </p>
        </div>

        {/* Column 4: Value Delivery */}
        <div className="flex flex-col">
          <h4 className="text-[14px] sm:text-[18px] font-bold text-white tracking-tight mb-2">
            Value Delivery
          </h4>
          <p className="text-[12px] sm:text-[14px] text-text-hero-secondary leading-tight">
            Powered by AI reasoning and structured business intelligence, improving sales productivity, resource allocation, pipeline quality, winning possibility, and revenue predictability.
          </p>
        </div>
      </div>
    </div>
  );
}

export default RevosProductCard;
