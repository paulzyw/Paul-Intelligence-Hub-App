import { useEffect, useRef, useState } from 'react';

export function GtmosProductCard() {
  const cardRef = useRef<HTMLDivElement>(null);
  const [hasAnimated, setHasAnimated] = useState<boolean>(false);

  // Trigger animations once when the card enters the visible viewport or on mount/tab change
  useEffect(() => {
    const el = cardRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry.isIntersecting) {
          setHasAnimated(true);
          observer.unobserve(el);
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={cardRef} className="w-full flex flex-col">
      {/* 1. GTMOS PRODUCT CARD */}
      <div 
        className="w-full rounded-2xl sm:rounded-3xl lg:rounded-[36px] p-4 sm:p-7 md:p-9 lg:p-12 shadow-2xl border border-white/20 backdrop-blur-sm overflow-hidden transition-all duration-300"
        style={{
          background: 'linear-gradient(135deg, rgba(238, 241, 178, 0.60) 0%, rgba(197, 215, 4, 0.60) 100%)',
        }}
      >
        <div className="flex flex-col lg:flex-row items-stretch gap-6 sm:gap-8 lg:gap-10 xl:gap-12 w-full">
          
          {/* LEFT COLUMN: Text Information */}
          <div className="w-full lg:w-[28%] shrink-0 flex flex-col justify-start lg:justify-end text-left pb-1 sm:pb-2 lg:pb-4">
            <h3 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-[#F4F4F9] tracking-tight leading-none mb-2 sm:mb-3 lg:mb-4 drop-shadow-xs">
              GTMOS
            </h3>
            <h4 className="text-[15px] sm:text-[16px] md:text-[17px] lg:text-[18px] font-bold text-[#051c2c] tracking-tight leading-snug mb-1">
              Go-to-Market Operating System
            </h4>
            <p className="text-[13px] sm:text-[14px] md:text-[15px] lg:text-[16px] text-[#051c2c]/85 font-light leading-relaxed sm:leading-tight max-w-xl lg:max-w-md">
              Strategic market focus and GTM effectiveness
            </p>
          </div>

          {/* RIGHT COLUMN: General Workflow & GTMOS Workflow Charts */}
          <div className="lg:flex-1 w-full min-w-0 flex flex-col gap-4 sm:gap-6 lg:gap-8">
            
            {/* TOP: GENERAL WORKFLOW CHART (Sequence S1 -> S8) */}
            <div className="w-full flex justify-end pb-1">
              <div className="w-full max-w-[720px]">
                <svg
                  width="100%"
                  height="100%"
                  viewBox="0 0 3728 86"
                  version="1.1"
                  xmlns="http://www.w3.org/2000/svg"
                  xmlnsXlink="http://www.w3.org/1999/xlink"
                  xmlSpace="preserve"
                  style={{ fillRule: 'evenodd', clipRule: 'evenodd' }}
                  className={`w-full h-auto block select-none ${hasAnimated ? 'workflow-chart-running' : 'workflow-chart-paused'}`}
                >
                  {/* S1: Evidence Intelligence */}
                  <g 
                    id="S1"
                    style={{
                      opacity: 0,
                      animation: 'gtmStepFadeSlide 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards 0.05s',
                    }}
                  >
                    <clipPath id="_gtm_clip1">
                      <rect id="EI" x="0" y="13.2" width="65.204" height="65.204" />
                    </clipPath>
                    <g clipPath="url(#_gtm_clip1)">
                      <g>
                        <path
                          d="M65.215,45.851c0.001,0.092 0.001,0.184 0.001,0.276c0,17.886 -14.718,32.603 -32.603,32.603c-17.886,0 -32.603,-14.718 -32.603,-32.603c0,-0.092 0,-0.184 0.001,-0.276c-0.001,-0.092 -0.001,-0.184 -0.001,-0.276c0,-17.886 14.718,-32.603 32.603,-32.603c17.886,0 32.603,14.718 32.603,32.603c0,0.092 -0,0.184 -0.001,0.276Z"
                          style={{ fill: '#cada16', fillRule: 'nonzero' }}
                        />
                        <path
                          d="M17.99,39.605c-0.189,0 -0.5,0.114 -0.637,0.257l-6.113,6.24c-0.274,0.277 -0.274,0.618 0,0.892l9.609,9.126l6.24,6.241c0.139,0.139 0.32,0.253 0.509,0.253c0.14,0 0.272,-0.147 0.382,-0.253l6.24,-6.113l19.74,-19.74c0.278,-0.273 0.277,-0.745 0,-1.019l-6.24,-6.24c-0.277,-0.273 -0.618,-0.277 -0.891,0l-19.23,19.23l-9.099,-8.616c-0.137,-0.139 -0.32,-0.257 -0.509,-0.257l0.001,0Z"
                          style={{ fill: 'url(#_gtm_Linear2)', fillRule: 'nonzero' }}
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
                      animation: 'gtmArrowSlideIn 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards 0.35s',
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

                  {/* S3: Structured Workflow */}
                  <g 
                    id="S3"
                    style={{
                      opacity: 0,
                      animation: 'gtmStepFadeSlide 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards 0.65s',
                    }}
                  >
                    <text
                      x="1133.15px"
                      y="65.342px"
                      style={{
                        fontFamily: "'Inter', ui-sans-serif, system-ui, sans-serif",
                        fontWeight: 700,
                        fontSize: '62.5px',
                        fill: '#051c2c',
                      }}
                    >
                      Structured Workflow
                    </text>
                    <clipPath id="_gtm_clip3">
                      <rect id="Workflow" x="1043.98" y="13.2" width="65.204" height="65.204" />
                    </clipPath>
                    <g clipPath="url(#_gtm_clip3)">
                      <g>
                        <path
                          d="M1109.19,45.851c0.001,0.092 0.001,0.184 0.001,0.276c0,17.886 -14.717,32.603 -32.603,32.603c-17.885,0 -32.602,-14.718 -32.602,-32.603c0,-0.092 0,-0.184 0,-0.276c0,-0.092 0,-0.184 0,-0.276c0,-17.886 14.717,-32.603 32.602,-32.603c17.886,0 32.603,14.718 32.603,32.603c0,0.092 0,0.184 -0.001,0.276Z"
                          style={{ fill: '#73bd18', fillRule: 'nonzero' }}
                        />
                        <path
                          d="M1061.97,39.605c-0.19,0 -0.5,0.114 -0.64,0.257l-6.11,6.24c-0.28,0.277 -0.28,0.618 0,0.892l9.61,9.126l6.24,6.241c0.14,0.139 0.32,0.253 0.51,0.253c0.14,0 0.27,-0.147 0.38,-0.253l6.24,-6.113l19.74,-19.74c0.28,-0.273 0.28,-0.745 0,-1.019l-6.24,-6.24c-0.27,-0.273 -0.62,-0.277 -0.89,0l-19.23,19.23l-9.1,-8.616c-0.14,-0.139 -0.32,-0.257 -0.51,-0.257l0,0Z"
                          style={{ fill: 'url(#_gtm_Linear4)', fillRule: 'nonzero' }}
                        />
                      </g>
                    </g>
                  </g>

                  {/* S4: Arrow to S5 */}
                  <g 
                    id="S4"
                    style={{
                      opacity: 0,
                      animation: 'gtmArrowSlideIn 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards 0.95s',
                    }}
                  >
                    <path d="M1809.52,42.949l227.24,0" style={{ fill: 'none' }} />
                    <path
                      d="M2010.5,30.449l18.75,12.5l-18.75,12.5"
                      style={{
                        fill: 'none',
                        stroke: '#F4F4F9',
                        strokeWidth: '8.33px',
                        strokeLinecap: 'round',
                        strokeMiterlimit: 10,
                      }}
                    />
                    <path
                      d="M1809.52,42.949l219.73,0"
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

                  {/* S5: Action Intelligence */}
                  <g 
                    id="S5"
                    style={{
                      opacity: 0,
                      animation: 'gtmStepFadeSlide 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards 1.25s',
                    }}
                  >
                    <clipPath id="_gtm_clip5">
                      <rect id="Action" x="2068.79" y="13.2" width="65.204" height="65.204" />
                    </clipPath>
                    <g clipPath="url(#_gtm_clip5)">
                      <g>
                        <path
                          d="M2134,45.851c0.001,0.092 0.001,0.184 0.001,0.276c0,17.886 -14.718,32.603 -32.603,32.603c-17.886,0 -32.603,-14.718 -32.603,-32.603c0,-0.092 0,-0.184 0.001,-0.276c-0.001,-0.092 -0.001,-0.184 -0.001,-0.276c0,-17.886 14.718,-32.603 32.603,-32.603c17.886,0 32.603,14.718 32.603,32.603c0,0.092 -0,0.184 -0.001,0.276Z"
                          style={{ fill: '#1ca5bb', fillRule: 'nonzero' }}
                        />
                        <path
                          d="M2086.78,39.605c-0.19,0 -0.5,0.114 -0.64,0.257l-6.11,6.24c-0.27,0.277 -0.27,0.618 0,0.892l9.61,9.126l6.24,6.241c0.14,0.139 0.32,0.253 0.51,0.253c0.14,0 0.27,-0.147 0.38,-0.253l6.24,-6.113l19.74,-19.74c0.28,-0.273 0.28,-0.745 0,-1.019l-6.24,-6.24c-0.28,-0.273 -0.62,-0.277 -0.89,0l-19.23,19.23l-9.1,-8.616c-0.14,-0.139 -0.32,-0.257 -0.51,-0.257l0.01,0Z"
                          style={{ fill: 'url(#_gtm_Linear6)', fillRule: 'nonzero' }}
                        />
                      </g>
                    </g>
                    <text
                      x="2158.14px"
                      y="65.342px"
                      style={{
                        fontFamily: "'Inter', ui-sans-serif, system-ui, sans-serif",
                        fontWeight: 700,
                        fontSize: '62.5px',
                        fill: '#051c2c',
                      }}
                    >
                      Action Intelligence
                    </text>
                  </g>

                  {/* S6: Arrow to S7 */}
                  <g 
                    id="S6"
                    style={{
                      opacity: 0,
                      animation: 'gtmArrowSlideIn 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards 1.45s',
                    }}
                  >
                    <path d="M2753.8,42.949l227.24,0" style={{ fill: 'none' }} />
                    <path
                      d="M2954.78,30.449l18.75,12.5l-18.75,12.5"
                      style={{
                        fill: 'none',
                        stroke: '#F4F4F9',
                        strokeWidth: '8.33px',
                        strokeLinecap: 'round',
                        strokeMiterlimit: 10,
                      }}
                    />
                    <path
                      d="M2753.8,42.949l219.73,0"
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
                      animation: 'gtmStepFadeSlide 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards 1.70s',
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
                    <clipPath id="_gtm_clip7">
                      <rect x="3031.795" y="13.206" width="65.192" height="65.192" />
                    </clipPath>
                    <g clipPath="url(#_gtm_clip7)">
                      <g>
                        <path
                          d="M3096.998,45.851c0.001,0.092 0.001,0.184 0.001,0.276c0,17.882 -14.715,32.597 -32.597,32.597c-17.882,0 -32.597,-14.715 -32.597,-32.597c0,-0.092 0,-0.184 0.001,-0.276c-0.001,-0.092 -0.001,-0.184 -0.001,-0.276c0,-17.882 14.715,-32.597 32.597,-32.597c17.882,0 32.597,14.715 32.597,32.597c0,0.092 -0,0.184 -0.001,0.276Z"
                          style={{ fill: '#0d345e', fillRule: 'nonzero' }}
                        />
                        <path
                          d="M3094.136,45.831c0.001,0.084 0.001,0.168 0.001,0.252c0,16.327 -13.435,29.763 -29.763,29.763c-16.327,0 -29.763,-13.435 -29.763,-29.763c0,-0.084 0,-0.168 0.001,-0.252c-0.001,-0.084 -0.001,-0.168 -0.001,-0.252c0,-16.327 13.435,-29.763 29.763,-29.763c16.327,0 29.763,13.435 29.763,29.763c0,0.084 -0,0.168 -0.001,0.252Z"
                          style={{ fill: 'url(#_gtm_Linear8)', fillRule: 'nonzero', stroke: '#fff', strokeWidth: '0.69px' }}
                        />
                        <path
                          d="M3049.782,39.606c-0.189,0 -0.5,0.114 -0.637,0.257l-6.112,6.239c-0.274,0.277 -0.274,0.618 0,0.892l9.607,9.124l6.239,6.239c0.139,0.139 0.32,0.253 0.509,0.253c0.14,0 0.272,-0.147 0.382,-0.253l6.239,-6.112l19.736,-19.736c0.278,-0.273 0.277,-0.744 0,-1.019l-6.239,-6.239c-0.277,-0.273 -0.618,-0.277 -0.891,0l-19.227,19.226l-9.097,-8.615c-0.137,-0.139 -0.32,-0.257 -0.509,-0.257l0.001,0Z"
                          style={{ fill: 'url(#_gtm_Linear9)', fillRule: 'nonzero' }}
                        />
                        <path
                          d="M3064.371,16.082c-16.428,0 -29.757,13.329 -29.757,29.757c0,7.893 3.221,14.946 8.241,20.275c2.608,-21.541 20.789,-38.29 43.031,-38.29c0.6,0 1.157,0.122 1.75,0.147c-5.442,-7.079 -13.653,-11.888 -23.266,-11.888l-0,-0.001Z"
                          style={{ fill: 'url(#_gtm_Linear10)', fillRule: 'nonzero' }}
                        />
                      </g>
                    </g>
                  </g>

                  {/* S8: Defs & Gradients */}
                  <defs id="S8">
                    <linearGradient
                      id="_gtm_Linear2"
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
                      id="_gtm_Linear4"
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
                      id="_gtm_Linear6"
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
                      id="_gtm_Linear8"
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
                      id="_gtm_Linear9"
                      x1="0"
                      y1="0"
                      x2="1"
                      y2="0"
                      gradientUnits="userSpaceOnUse"
                      gradientTransform="matrix(15.31836,17.656795,-17.656795,15.31836,3038.395159,32.406939)"
                    >
                      <stop offset="0" style={{ stopColor: '#fff', stopOpacity: 0.73 }} />
                      <stop offset="1" style={{ stopColor: '#fff', stopOpacity: 1 }} />
                    </linearGradient>

                    <linearGradient
                      id="_gtm_Linear10"
                      x1="0"
                      y1="0"
                      x2="1"
                      y2="0"
                      gradientUnits="userSpaceOnUse"
                      gradientTransform="matrix(29.756775,0,0,29.756775,3034.614565,45.839218)"
                    >
                      <stop offset="0" style={{ stopColor: '#fff', stopOpacity: 0 }} />
                      <stop offset="1" style={{ stopColor: '#fff', stopOpacity: 0.28 }} />
                    </linearGradient>
                  </defs>
                </svg>
              </div>
            </div>

            {/* BELOW: GTMOS WORKFLOW CHART (Sequence gtm-step1 -> gtm-step11) */}
            <div className="w-full">
              <svg
                  width="100%"
                  height="100%"
                  viewBox="0 0 3385 1747"
                  version="1.1"
                  xmlns="http://www.w3.org/2000/svg"
                  xmlnsXlink="http://www.w3.org/1999/xlink"
                  xmlSpace="preserve"
                  className={`w-full h-auto block select-none ${hasAnimated ? 'workflow-chart-running' : 'workflow-chart-paused'}`}
                  style={{ fillRule: 'evenodd', clipRule: 'evenodd', strokeLinecap: 'round', strokeLinejoin: 'round' }}
                >
                  
                  {/* gtm-step1: 1. Data Collection & Enrichment */}
                  <g 
                    id="gtm-step1"
                    style={{
                      opacity: 0,
                      animation: 'gtmStepFadeSlide 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards 1.85s',
                    }}
                  >
                    <path
                      d="M948.595,21.766l0,174.127c0,12.013 -9.753,21.766 -21.766,21.766l-905.063,0c-12.013,0 -21.766,-9.753 -21.766,-21.766l0,-174.127c0,-12.013 9.753,-21.766 21.766,-21.766l905.063,0c12.013,0 21.766,9.753 21.766,21.766Z"
                      style={{ fill: '#f4f4f9' }}
                    />
                    <g transform="matrix(1,0,0,1,-264.904623,-709.405082)">
                      <text
                        x="518.985px"
                        y="806.029px"
                        style={{
                          fontFamily: "'Inter', ui-sans-serif, system-ui, sans-serif",
                          fontWeight: 700,
                          fontSize: '75px',
                          fill: '#051c2c',
                        }}
                      >
                        1. Data Collection
                      </text>
                      <text
                        x="518.985px"
                        y="892.272px"
                        style={{
                          fontFamily: "'Inter', ui-sans-serif, system-ui, sans-serif",
                          fontWeight: 700,
                          fontSize: '75px',
                          fill: '#051c2c',
                        }}
                      >
                        &amp; Enrichment
                      </text>
                    </g>
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

                  {/* gtm-step2: Arrow downward from Step 1 to Step 2 */}
                  <g 
                    id="gtm-step2"
                    style={{
                      opacity: 0,
                      animation: 'gtmArrowSlideIn 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards 2.15s',
                    }}
                  >
                    <path d="M474.298,217.659l0,186.43" style={{ fill: 'none' }} />
                    <path
                      d="M489.923,233.284c0,-8.624 -7.001,-15.625 -15.625,-15.625c-8.624,0 -15.625,7.001 -15.625,15.625c0,8.624 7.001,15.625 15.625,15.625c8.624,0 15.625,-7.001 15.625,-15.625Z"
                      style={{ fill: '#4c697c' }}
                    />
                    <path
                      d="M489.923,371.262l-15.625,23.438l-15.625,-23.438"
                      style={{ fill: 'none', stroke: '#4c697c', strokeWidth: '10.42px', strokeLinejoin: 'miter', strokeMiterlimit: 10 }}
                    />
                    <path
                      d="M474.298,242.659l0,152.04"
                      style={{ fill: 'none', stroke: '#4c697c', strokeWidth: '10.42px', strokeMiterlimit: 1.5 }}
                    />
                  </g>

                  {/* gtm-step3: 2. Context & Evidence Analysis */}
                  <g 
                    id="gtm-step3"
                    style={{
                      opacity: 0,
                      animation: 'gtmStepFadeSlide 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards 2.40s',
                    }}
                  >
                    <path
                      d="M952.875,425.855l0,174.127c0,12.013 -9.753,21.766 -21.766,21.766l-905.063,0c-12.013,0 -21.766,-9.753 -21.766,-21.766l0,-174.127c0,-12.013 9.753,-21.766 21.766,-21.766l905.063,0c12.013,0 21.766,9.753 21.766,21.766Z"
                      style={{ fill: '#f4f4f9' }}
                    />
                    <g transform="matrix(1,0,0,1,-260.625145,-305.316064)">
                      <text
                        x="518.985px"
                        y="806.029px"
                        style={{
                          fontFamily: "'Inter', ui-sans-serif, system-ui, sans-serif",
                          fontWeight: 700,
                          fontSize: '75px',
                          fill: '#051c2c',
                        }}
                      >
                        2. Context &amp;
                      </text>
                      <text
                        x="518.985px"
                        y="892.272px"
                        style={{
                          fontFamily: "'Inter', ui-sans-serif, system-ui, sans-serif",
                          fontWeight: 700,
                          fontSize: '75px',
                          fill: '#051c2c',
                        }}
                      >
                        Evidence Analysis
                      </text>
                    </g>
                    <path
                      id="zoom"
                      d="M110.673,451.5c-23.425,0 -42.53,19.106 -42.53,42.53c0,23.425 19.106,42.53 42.53,42.53c9.595,0 18.438,-3.243 25.567,-8.638c0.139,0.172 0.288,0.336 0.445,0.491l44.102,44.102c1.116,1.164 2.661,1.822 4.273,1.822c3.248,0 5.921,-2.673 5.921,-5.921c0,-1.612 -0.659,-3.157 -1.822,-4.273l-44.102,-44.102c-0.155,-0.157 -0.319,-0.306 -0.491,-0.445c5.395,-7.13 8.638,-15.972 8.638,-25.567c0,-23.425 -19.106,-42.53 -42.53,-42.53l-0.001,0.001Zm0,10.627c17.682,0 31.903,14.222 31.903,31.903c0,17.682 -14.222,31.903 -31.903,31.903c-17.681,0 -31.903,-14.222 -31.903,-31.903c0,-17.682 14.222,-31.903 31.903,-31.903Z"
                      style={{ fill: '#4c697c', fillRule: 'nonzero' }}
                    />
                  </g>

                  {/* gtm-step4: Arrow rightward from Step 2 to Step 3 */}
                  <g 
                    id="gtm-step4"
                    style={{
                      opacity: 0,
                      animation: 'gtmArrowSlideIn 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards 2.70s',
                    }}
                  >
                    <path d="M952.875,512.919l228.671,0" style={{ fill: 'none' }} />
                    <circle cx="968.5" cy="512.919" r="15.625" style={{ fill: '#4c697c' }} />
                    <path
                      d="M1148.719,497.294l23.438,15.625l-23.438,15.625"
                      style={{ fill: 'none', stroke: '#4c697c', strokeWidth: '10.42px', strokeLinejoin: 'miter', strokeMiterlimit: 10 }}
                    />
                    <path
                      d="M977.875,512.919l194.282,0"
                      style={{ fill: 'none', stroke: '#4c697c', strokeWidth: '10.42px', strokeMiterlimit: 1.5 }}
                    />
                  </g>

                  {/* gtm-step5: 3. AI Reasoning */}
                  <g 
                    id="gtm-step5"
                    style={{
                      opacity: 0,
                      animation: 'gtmStepFadeSlide 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards 2.95s',
                    }}
                  >
                    <path
                      d="M2130.141,425.971l0,175.052c0,12.077 -9.805,21.882 -21.882,21.882l-904.832,0c-12.077,0 -21.882,-9.805 -21.882,-21.882l0,-175.052c0,-12.077 9.805,-21.882 21.882,-21.882l904.832,0c12.077,0 21.882,9.805 21.882,21.882Z"
                      style={{ fill: '#f4f4f9' }}
                    />
                    <text
                      x="1434.674px"
                      y="533.306px"
                      style={{
                        fontFamily: "'Inter', ui-sans-serif, system-ui, sans-serif",
                        fontWeight: 700,
                        fontSize: '75px',
                        fill: '#051c2c',
                      }}
                    >
                      3. AI Reasoning
                    </text>
                    <g id="AI">
                      <path d="M1329.694,475.523l0,-15.489" style={{ fill: 'none', fillRule: 'nonzero', stroke: '#4c697c', strokeWidth: '5.81px', strokeLinecap: 'butt' }} />
                      <path d="M1310.334,475.523l-0,-15.489" style={{ fill: 'none', fillRule: 'nonzero', stroke: '#4c697c', strokeWidth: '5.81px', strokeLinecap: 'butt' }} />
                      <path d="M1290.973,475.523l0,-15.489" style={{ fill: 'none', fillRule: 'nonzero', stroke: '#4c697c', strokeWidth: '5.81px', strokeLinecap: 'butt' }} />
                      <path d="M1290.973,552.967l0,15.489" style={{ fill: 'none', fillRule: 'nonzero', stroke: '#4c697c', strokeWidth: '5.81px', strokeLinecap: 'butt' }} />
                      <path d="M1329.694,552.967l0,15.489" style={{ fill: 'none', fillRule: 'nonzero', stroke: '#4c697c', strokeWidth: '5.81px', strokeLinecap: 'butt' }} />
                      <path d="M1310.334,552.967l0,15.489" style={{ fill: 'none', fillRule: 'nonzero', stroke: '#4c697c', strokeWidth: '5.81px', strokeLinecap: 'butt' }} />
                      <path d="M1349.055,494.884l15.489,-0" style={{ fill: 'none', fillRule: 'nonzero', stroke: '#4c697c', strokeWidth: '5.81px', strokeLinecap: 'butt' }} />
                      <path d="M1349.055,514.245l15.489,0" style={{ fill: 'none', fillRule: 'nonzero', stroke: '#4c697c', strokeWidth: '5.81px', strokeLinecap: 'butt' }} />
                      <path d="M1349.055,533.606l15.489,0" style={{ fill: 'none', fillRule: 'nonzero', stroke: '#4c697c', strokeWidth: '5.81px', strokeLinecap: 'butt' }} />
                      <path d="M1271.612,533.606l-15.489,0" style={{ fill: 'none', fillRule: 'nonzero', stroke: '#4c697c', strokeWidth: '5.81px', strokeLinecap: 'butt' }} />
                      <path d="M1271.612,494.884l-15.489,-0" style={{ fill: 'none', fillRule: 'nonzero', stroke: '#4c697c', strokeWidth: '5.81px', strokeLinecap: 'butt' }} />
                      <path d="M1271.612,514.245l-15.489,0" style={{ fill: 'none', fillRule: 'nonzero', stroke: '#4c697c', strokeWidth: '5.81px', strokeLinecap: 'butt' }} />
                      <path d="M1335.503,456.162c0,3.206 -2.603,5.808 -5.808,5.808c-3.206,0 -5.808,-2.603 -5.808,-5.808c0,-3.206 2.603,-5.808 5.808,-5.808c3.206,0 5.808,2.603 5.808,5.808Z" style={{ fill: '#4c697c', stroke: '#4c697c', strokeWidth: '4.17px', strokeLinecap: 'butt', strokeMiterlimit: 2 }} />
                      <path d="M1310.334,459.066c-1.593,0 -2.904,-1.311 -2.904,-2.904c0,-1.593 1.311,-2.904 2.904,-2.904c1.593,0 2.904,1.311 2.904,2.904c0,1.593 -1.311,2.904 -2.904,2.904Zm0,2.904c-3.186,0 -5.808,-2.622 -5.808,-5.808c0,-3.186 2.622,-5.808 5.808,-5.808c3.186,0 5.808,2.622 5.808,5.808c0,3.186 -2.622,5.808 -5.808,5.808Z" style={{ fill: '#4c697c', stroke: '#4c697c', strokeWidth: '4.17px', strokeLinecap: 'butt', strokeMiterlimit: 2 }} />
                      <path d="M1296.781,456.162c0,3.206 -2.603,5.808 -5.808,5.808c-3.206,0 -5.808,-2.603 -5.808,-5.808c0,-3.206 2.603,-5.808 5.808,-5.808c3.206,0 5.808,2.603 5.808,5.808Z" style={{ fill: '#4c697c', stroke: '#4c697c', strokeWidth: '4.17px', strokeLinecap: 'butt', strokeMiterlimit: 2 }} />
                      <path d="M1290.973,569.423c-1.593,-0 -2.904,1.311 -2.904,2.904c0,1.593 1.311,2.904 2.904,2.904c1.593,0 2.904,-1.311 2.904,-2.904c0,-1.593 -1.311,-2.904 -2.904,-2.904Zm0,-2.904c-3.186,0 -5.808,2.622 -5.808,5.808c0,3.186 2.622,5.808 5.808,5.808c3.186,0 5.808,-2.622 5.808,-5.808c0,-3.186 -2.622,-5.808 -5.808,-5.808Z" style={{ fill: '#4c697c', stroke: '#4c697c', strokeWidth: '4.17px', strokeLinecap: 'butt', strokeMiterlimit: 2 }} />
                      <path d="M1329.694,569.423c-1.593,0 -2.904,1.311 -2.904,2.904c0,1.593 1.311,2.904 2.904,2.904c1.593,0 2.904,-1.311 2.904,-2.904c0,-1.593 -1.311,-2.904 -2.904,-2.904Zm0,-2.904c-3.186,0 -5.808,2.622 -5.808,5.808c0,3.186 2.622,5.808 5.808,5.808c3.186,0 5.808,-2.622 5.808,-5.808c0,-3.186 -2.622,-5.808 -5.808,-5.808Z" style={{ fill: '#4c697c', stroke: '#4c697c', strokeWidth: '4.17px', strokeLinecap: 'butt', strokeMiterlimit: 2 }} />
                      <path d="M1316.142,572.328c0,-3.206 -2.603,-5.808 -5.808,-5.808c-3.206,0 -5.808,2.603 -5.808,5.808c0,3.206 2.603,5.808 5.808,5.808c3.206,0 5.808,-2.603 5.808,-5.808Z" style={{ fill: '#4c697c', stroke: '#4c697c', strokeWidth: '4.17px', strokeLinecap: 'butt', strokeMiterlimit: 2 }} />
                      <circle cx="1368.416" cy="494.884" r="5.808" style={{ fill: '#4c697c', stroke: '#4c697c', strokeWidth: '4.17px', strokeLinecap: 'butt', strokeMiterlimit: 2 }} />
                      <path d="M1365.512,514.245c0,1.593 1.311,2.904 2.904,2.904c1.593,0 2.904,-1.311 2.904,-2.904c0,-1.593 -1.311,-2.904 -2.904,-2.904c-1.593,0 -2.904,1.311 -2.904,2.904Zm-2.904,0c0,3.186 2.622,5.808 5.808,5.808c3.186,0 5.808,-2.622 5.808,-5.808c0,-3.186 -2.622,-5.808 -5.808,-5.808c-3.186,0 -5.808,2.622 -5.808,5.808Z" style={{ fill: '#4c697c', stroke: '#4c697c', strokeWidth: '4.17px', strokeLinecap: 'butt', strokeMiterlimit: 2 }} />
                      <circle cx="1368.416" cy="533.606" r="5.808" style={{ fill: '#4c697c', stroke: '#4c697c', strokeWidth: '4.17px', strokeLinecap: 'butt', strokeMiterlimit: 2 }} />
                      <path d="M1255.155,533.606c0,1.593 -1.311,2.904 -2.904,2.904c-1.593,0 -2.904,-1.311 -2.904,-2.904c-0,-1.593 1.311,-2.904 2.904,-2.904c0,-0 0,-0 0,-0c1.593,0 2.904,1.311 2.904,2.904Zm2.904,0c0,3.186 -2.622,5.808 -5.808,5.808c-3.186,0 -5.808,-2.622 -5.808,-5.808c0,-3.186 2.622,-5.808 5.808,-5.808c3.186,0 5.808,2.622 5.808,5.808Z" style={{ fill: '#4c697c', stroke: '#4c697c', strokeWidth: '4.17px', strokeLinecap: 'butt', strokeMiterlimit: 2 }} />
                      <path d="M1255.155,494.884c0,0 0,0 0,0c0,1.593 -1.311,2.904 -2.904,2.904c-1.593,0 -2.904,-1.311 -2.904,-2.904c-0,-0 -0,-0 -0,-0c0,-1.593 1.311,-2.904 2.904,-2.904c1.593,0 2.904,1.311 2.904,2.904Zm2.904,0c0,3.186 -2.622,5.808 -5.808,5.808c-3.186,0 -5.808,-2.622 -5.808,-5.808c0,-3.186 2.622,-5.808 5.808,-5.808c3.186,0 5.808,2.622 5.808,5.808Z" style={{ fill: '#4c697c', stroke: '#4c697c', strokeWidth: '4.17px', strokeLinecap: 'butt', strokeMiterlimit: 2 }} />
                      <circle cx="1252.251" cy="514.245" r="5.808" style={{ fill: '#4c697c', stroke: '#4c697c', strokeWidth: '4.17px', strokeLinecap: 'butt', strokeMiterlimit: 2 }} />
                      <path d="M1349.055,505.523l0,17.444c0,16.557 -13.443,30 -30,30l-17.444,0c-16.557,0 -30,-13.443 -30,-30l0,-17.444c0,-16.557 13.443,-30 30,-30l17.444,0c16.557,0 30,13.443 30,30Z" style={{ fill: 'none', stroke: '#4c697c', strokeWidth: '9.68px' }} />
                      <text
                        x="1283.164px"
                        y="533.606px"
                        style={{
                          fontFamily: "'Inter', ui-sans-serif, system-ui, sans-serif",
                          fontWeight: 700,
                          fontSize: '54.856px',
                          fill: '#4c697c',
                        }}
                      >
                        AI
                      </text>
                    </g>
                  </g>

                  {/* gtm-step6: Arrow rightward from Step 3 to Step 4 */}
                  <g 
                    id="gtm-step6"
                    style={{
                      opacity: 0,
                      animation: 'gtmArrowSlideIn 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards 3.25s',
                    }}
                  >
                    <path d="M2130.141,513.497l228.671,0" style={{ fill: 'none' }} />
                    <circle cx="2145.766" cy="513.497" r="15.625" style={{ fill: '#4c697c' }} />
                    <path
                      d="M2325.985,497.872l23.438,15.625l-23.438,15.625"
                      style={{ fill: 'none', stroke: '#4c697c', strokeWidth: '10.42px', strokeLinejoin: 'miter', strokeMiterlimit: 10 }}
                    />
                    <path
                      d="M2155.141,513.497l194.282,-0"
                      style={{ fill: 'none', stroke: '#4c697c', strokeWidth: '10.42px', strokeMiterlimit: 1.5 }}
                    />
                  </g>

                  {/* gtm-step7: 4. Strategy Sythesis & Validation */}
                  <g 
                    id="gtm-step7"
                    style={{
                      opacity: 0,
                      animation: 'gtmStepFadeSlide 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards 3.50s',
                    }}
                  >
                    <path
                      d="M3384.067,425.855l0,174.127c0,12.013 -9.753,21.766 -21.766,21.766l-981.723,0c-12.013,0 -21.766,-9.753 -21.766,-21.766l0,-174.127c0,-12.013 9.753,-21.766 21.766,-21.766l981.723,0c12.013,0 21.766,9.753 21.766,21.766Z"
                      style={{ fill: '#f4f4f9' }}
                    />
                    <g id="target">
                      <path
                        d="M2543.715,517.229c0,32.983 -26.74,59.72 -59.72,59.72c-32.985,0 -59.72,-26.74 -59.72,-59.72c0,-32.983 26.737,-59.72 59.72,-59.72c22.816,0 42.641,12.797 52.698,31.604l-9.026,4.121c-8.477,-15.394 -24.855,-25.826 -43.671,-25.826c-27.517,0 -49.823,22.306 -49.823,49.823c0,27.517 22.306,49.823 49.823,49.823c27.517,0 49.823,-22.307 49.823,-49.823c0,-4.882 -0.705,-9.6 -2.015,-14.058l9.21,-3.756c1.757,5.626 2.703,11.61 2.703,17.814l-0.003,-0.003Z"
                        style={{ fill: '#4c697c', fillRule: 'nonzero' }}
                      />
                      <path
                        d="M2525.675,517.229c0,23.021 -18.662,41.683 -41.683,41.683c-23.021,0 -41.683,-18.662 -41.683,-41.683c0,-23.02 18.661,-41.683 41.683,-41.683c15.467,0 28.967,8.425 36.161,20.936l-8.794,4.015c-5.638,-9.201 -15.785,-15.34 -27.366,-15.34c-17.713,0 -32.072,14.36 -32.072,32.072c0,17.713 14.359,32.072 32.072,32.072c17.713,0 32.072,-14.36 32.072,-32.072c0,-2.433 -0.272,-4.802 -0.786,-7.08l8.995,-3.668c0.913,3.43 1.402,7.032 1.402,10.749l-0,0Z"
                        style={{ fill: '#4c697c', fillRule: 'nonzero' }}
                      />
                      <path
                        d="M2505.051,517.229c0,11.63 -9.428,21.058 -21.058,21.058c-11.63,0 -21.058,-9.428 -21.058,-21.058c0,-11.63 9.428,-21.058 21.058,-21.058c7.557,0 14.184,3.981 17.899,9.961l-4.465,2.038c-2.912,-4.31 -7.842,-7.144 -13.435,-7.144c-8.949,0 -16.203,7.255 -16.203,16.203c0,8.948 7.254,16.203 16.203,16.203c8.948,0 16.203,-7.255 16.203,-16.203c0,-0.758 -0.052,-1.503 -0.153,-2.233l4.606,-1.878c0.264,1.33 0.402,2.704 0.402,4.112l-0,-0Z"
                        style={{ fill: '#4c697c', fillRule: 'nonzero' }}
                      />
                      <path
                        d="M2483.866,515.731l65.801,-30.043l0.289,-3.884l17.62,-7.613l-4.614,9.947l10.407,3.463l-17.626,7.61l-3.026,-2.454l-66.974,27.312l-1.877,-4.337Z"
                        style={{ fill: '#4c697c' }}
                      />
                    </g>
                    <g transform="matrix(1,0,0,1,2093.907179,-305.316064)">
                      <text
                        x="518.985px"
                        y="806.029px"
                        style={{
                          fontFamily: "'Inter', ui-sans-serif, system-ui, sans-serif",
                          fontWeight: 700,
                          fontSize: '75px',
                          fill: '#051c2c',
                        }}
                      >
                        4. Strategy Sythesis
                      </text>
                      <text
                        x="518.985px"
                        y="892.272px"
                        style={{
                          fontFamily: "'Inter', ui-sans-serif, system-ui, sans-serif",
                          fontWeight: 700,
                          fontSize: '75px',
                          fill: '#051c2c',
                        }}
                      >
                        &amp; Validation
                      </text>
                    </g>
                  </g>

                  {/* gtm-step8: Connector wrapping down and leftward to Step 5 */}
                  <g 
                    id="gtm-step8"
                    style={{
                      opacity: 0,
                      animation: 'gtmArrowSlideIn 0.35s cubic-bezier(0.16, 1, 0.3, 1) forwards 3.85s',
                    }}
                  >
                    <path
                      d="M2887.064,637.373c0,-8.624 -7.001,-15.625 -15.625,-15.625c-8.624,0 -15.625,7.001 -15.625,15.625c0,8.624 7.001,15.625 15.625,15.625c8.624,0 15.625,-7.001 15.625,-15.625Z"
                      style={{ fill: '#4c697c' }}
                    />
                    <path
                      d="M995.795,932.633l-23.438,-15.625l23.438,-15.625"
                      style={{ fill: 'none', stroke: '#4c697c', strokeWidth: '10.42px', strokeLinejoin: 'miter', strokeMiterlimit: 10 }}
                    />
                    <path
                      d="M2871.439,646.748l-0,270.259l-1899.082,0"
                      style={{ fill: 'none', stroke: '#4c697c', strokeWidth: '10.42px', strokeMiterlimit: 1.5 }}
                    />
                  </g>

                  {/* gtm-step9: 5. Execution Plan & Monitoring */}
                  <g 
                    id="gtm-step9"
                    style={{
                      opacity: 0,
                      animation: 'gtmStepFadeSlide 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards 4.15s',
                    }}
                  >
                    <path
                      d="M962.968,829.944l0,174.127c0,12.013 -9.753,21.766 -21.766,21.766l-905.063,0c-12.013,0 -21.766,-9.753 -21.766,-21.766l0,-174.127c0,-12.013 9.753,-21.766 21.766,-21.766l905.063,0c12.013,0 21.766,9.753 21.766,21.766Z"
                      style={{ fill: '#f4f4f9' }}
                    />
                    <g transform="matrix(1,0,0,1,-250.531857,98.772954)">
                      <text
                        x="518.985px"
                        y="806.029px"
                        style={{
                          fontFamily: "'Inter', ui-sans-serif, system-ui, sans-serif",
                          fontWeight: 700,
                          fontSize: '75px',
                          fill: '#051c2c',
                        }}
                      >
                        5. Execution Plan
                      </text>
                      <text
                        x="518.985px"
                        y="892.272px"
                        style={{
                          fontFamily: "'Inter', ui-sans-serif, system-ui, sans-serif",
                          fontWeight: 700,
                          fontSize: '75px',
                          fill: '#051c2c',
                        }}
                      >
                        &amp; Monitoring
                      </text>
                    </g>
                    <g id="growth">
                      <rect x="89.929" y="938.466" width="16.575" height="33.169" style={{ fill: '#4c697c' }} />
                      <rect x="119.768" y="915.244" width="16.575" height="56.387" style={{ fill: '#4c697c' }} />
                      <rect x="149.607" y="931.838" width="16.575" height="39.803" style={{ fill: '#4c697c' }} />
                      <rect x="179.435" y="905.302" width="16.575" height="66.337" style={{ fill: '#4c697c' }} />
                      <g>
                        <path
                          d="M91.589,911.52l30.169,-22.172c1.132,-0.832 2.699,-0.943 3.953,-0.281l27.887,14.722c1.238,0.653 2.796,0.495 3.853,-0.391l30.269,-25.378"
                          style={{ fill: 'none', fillRule: 'nonzero', stroke: '#4c697c', strokeWidth: '11.3px', strokeLinecap: 'square', strokeLinejoin: 'miter' }}
                        />
                        <path
                          d="M195.09,892.593l-22.414,-21.593l29.897,-8.625l-7.482,30.218Z"
                          style={{ fill: '#4c697c', fillRule: 'nonzero' }}
                        />
                      </g>
                    </g>
                  </g>

                  {/* gtm-step10: Arrow downward from Step 5 to Key Outputs */}
                  <g 
                    id="gtm-step10"
                    style={{
                      opacity: 0,
                      animation: 'gtmArrowSlideIn 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards 4.50s',
                    }}
                  >
                    <path d="M488.67,1025.837l0,186.43" style={{ fill: 'none' }} />
                    <path
                      d="M504.295,1041.462c0,-8.624 -7.001,-15.625 -15.625,-15.625c-8.624,0 -15.625,7.001 -15.625,15.625c0,8.624 7.001,15.625 15.625,15.625c8.624,0 15.625,-7.001 15.625,-15.625Z"
                      style={{ fill: '#4c697c' }}
                    />
                    <path
                      d="M504.295,1179.44l-15.625,23.438l-15.625,-23.438"
                      style={{ fill: 'none', stroke: '#4c697c', strokeWidth: '10.42px', strokeLinejoin: 'miter', strokeMiterlimit: 10 }}
                    />
                    <path
                      d="M488.67,1050.837l0,152.04"
                      style={{ fill: 'none', stroke: '#4c697c', strokeWidth: '10.42px', strokeMiterlimit: 1.5 }}
                    />
                  </g>

                  {/* gtm-step11: Key Outputs with 5 output pills */}
                  <g 
                    id="gtm-step11"
                    style={{
                      opacity: 0,
                      animation: 'gtmStepFadeSlide 0.45s cubic-bezier(0.16, 1, 0.3, 1) forwards 4.80s',
                    }}
                  >
                    <path
                      d="M2454.674,1265.714l0,427.579c0,29.498 -23.949,53.447 -53.447,53.447l-2343.5,0c-29.498,0 -53.447,-23.949 -53.447,-53.447l0,-427.579c0,-29.498 23.949,-53.447 53.447,-53.447l2343.5,0c29.498,0 53.447,23.949 53.447,53.447Z"
                      style={{ fill: '#f4f4f9' }}
                    />
                    <text
                      x="258.36px"
                      y="1334.442px"
                      style={{
                        fontFamily: "'Inter', ui-sans-serif, system-ui, sans-serif",
                        fontWeight: 700,
                        fontSize: '75px',
                        fill: '#051c2c',
                      }}
                    >
                      Key Outputs
                    </text>

                    {/* Five Output Pills */}
                    <g id="gtm-outputs">
                      {/* Pill 1: GTM Strategy & Playbook */}
                      <g>
                        <path
                          d="M516.007,1458.586l0,162.277c0,11.195 -9.089,20.285 -20.285,20.285l-401.319,0c-11.195,0 -20.285,-9.089 -20.285,-20.285l0,-162.277c0,-11.195 9.089,-20.285 20.285,-20.285l401.319,0c11.195,0 20.285,9.089 20.285,20.285Z"
                          style={{ fill: '#f4f4f9', stroke: '#99999b', strokeWidth: '4.17px', strokeMiterlimit: 1.5 }}
                        />
                        <text
                          x="305px"
                          y="1530px"
                          textAnchor="middle"
                          style={{
                            fontFamily: "'Inter', ui-sans-serif, system-ui, sans-serif",
                            fontWeight: 600,
                            fontSize: '48px',
                            fill: '#334155',
                          }}
                        >
                          GTM Strategy
                        </text>
                        <text
                          x="305px"
                          y="1588px"
                          textAnchor="middle"
                          style={{
                            fontFamily: "'Inter', ui-sans-serif, system-ui, sans-serif",
                            fontWeight: 600,
                            fontSize: '48px',
                            fill: '#334155',
                          }}
                        >
                          &amp; Playbook
                        </text>
                      </g>

                      {/* Pill 2: ICP & Personas */}
                      <g>
                        <path
                          d="M980.862,1458.586l0,162.277c0,11.195 -9.089,20.285 -20.285,20.285l-401.319,0c-11.195,0 -20.285,-9.089 -20.285,-20.285l0,-162.277c0,-11.195 9.089,-20.285 20.285,-20.285l401.319,0c11.195,0 20.285,9.089 20.285,20.285Z"
                          style={{ fill: '#f4f4f9', stroke: '#99999b', strokeWidth: '4.17px', strokeMiterlimit: 1.5 }}
                        />
                        <text
                          x="770px"
                          y="1530px"
                          textAnchor="middle"
                          style={{
                            fontFamily: "'Inter', ui-sans-serif, system-ui, sans-serif",
                            fontWeight: 600,
                            fontSize: '48px',
                            fill: '#334155',
                          }}
                        >
                          ICP &amp;
                        </text>
                        <text
                          x="770px"
                          y="1588px"
                          textAnchor="middle"
                          style={{
                            fontFamily: "'Inter', ui-sans-serif, system-ui, sans-serif",
                            fontWeight: 600,
                            fontSize: '48px',
                            fill: '#334155',
                          }}
                        >
                          Personas
                        </text>
                      </g>

                      {/* Pill 3: Value Proposition & Messaging */}
                      <g>
                        <path
                          d="M1445.717,1458.586l0,162.277c0,11.195 -9.089,20.285 -20.285,20.285l-401.319,0c-11.195,0 -20.285,-9.089 -20.285,-20.285l0,-162.277c0,-11.195 9.089,-20.285 20.285,-20.285l401.319,0c11.195,0 20.285,9.089 20.285,20.285Z"
                          style={{ fill: '#f4f4f9', stroke: '#99999b', strokeWidth: '4.17px', strokeMiterlimit: 1.5 }}
                        />
                        <text
                          x="1235px"
                          y="1530px"
                          textAnchor="middle"
                          style={{
                            fontFamily: "'Inter', ui-sans-serif, system-ui, sans-serif",
                            fontWeight: 600,
                            fontSize: '46px',
                            fill: '#334155',
                          }}
                        >
                          Value Proposition
                        </text>
                        <text
                          x="1235px"
                          y="1588px"
                          textAnchor="middle"
                          style={{
                            fontFamily: "'Inter', ui-sans-serif, system-ui, sans-serif",
                            fontWeight: 600,
                            fontSize: '46px',
                            fill: '#334155',
                          }}
                        >
                          &amp; Messaging
                        </text>
                      </g>

                      {/* Pill 4: Revenue Motion Plan */}
                      <g>
                        <path
                          d="M1910.573,1458.586l0,162.277c0,11.195 -9.089,20.285 -20.285,20.285l-401.319,0c-11.195,0 -20.285,-9.089 -20.285,-20.285l0,-162.277c0,-11.195 9.089,-20.285 20.285,-20.285l401.319,0c11.195,0 20.285,9.089 20.285,20.285Z"
                          style={{ fill: '#f4f4f9', stroke: '#99999b', strokeWidth: '4.17px', strokeMiterlimit: 1.5 }}
                        />
                        <text
                          x="1700px"
                          y="1530px"
                          textAnchor="middle"
                          style={{
                            fontFamily: "'Inter', ui-sans-serif, system-ui, sans-serif",
                            fontWeight: 600,
                            fontSize: '48px',
                            fill: '#334155',
                          }}
                        >
                          Revenue Motion
                        </text>
                        <text
                          x="1700px"
                          y="1588px"
                          textAnchor="middle"
                          style={{
                            fontFamily: "'Inter', ui-sans-serif, system-ui, sans-serif",
                            fontWeight: 600,
                            fontSize: '48px',
                            fill: '#334155',
                          }}
                        >
                          Plan
                        </text>
                      </g>

                      {/* Pill 5: Performance Dashboard */}
                      <g>
                        <path
                          d="M2375.428,1458.586l0,162.277c0,11.195 -9.089,20.285 -20.285,20.285l-401.319,0c-11.195,0 -20.285,-9.089 -20.285,-20.285l0,-162.277c0,-11.195 9.089,-20.285 20.285,-20.285l401.319,0c11.195,0 20.285,9.089 20.285,20.285Z"
                          style={{ fill: '#f4f4f9', stroke: '#99999b', strokeWidth: '4.17px', strokeMiterlimit: 1.5 }}
                        />
                        <text
                          x="2165px"
                          y="1530px"
                          textAnchor="middle"
                          style={{
                            fontFamily: "'Inter', ui-sans-serif, system-ui, sans-serif",
                            fontWeight: 600,
                            fontSize: '48px',
                            fill: '#334155',
                          }}
                        >
                          Performance
                        </text>
                        <text
                          x="2165px"
                          y="1588px"
                          textAnchor="middle"
                          style={{
                            fontFamily: "'Inter', ui-sans-serif, system-ui, sans-serif",
                            fontWeight: 600,
                            fontSize: '48px',
                            fill: '#334155',
                          }}
                        >
                          Dashboard
                        </text>
                      </g>
                    </g>
                    
                    {/* Notepad Icon */}
                    <g id="notepad">
                      <g>
                        <g>
                          <path
                            d="M100.524,1257.789c-0.359,0 -0.648,0.293 -0.648,0.658l0,113.173c0,0.365 0.289,0.658 0.648,0.658l79.113,0c0.359,0 0.648,-0.293 0.648,-0.658l0,-85.539l-27.883,-28.293l-51.879,0.001Z"
                            style={{ fill: 'none', fillRule: 'nonzero', stroke: '#4c697c', strokeWidth: '8.52px', strokeLinecap: 'square', strokeLinejoin: 'miter' }}
                          />
                          <path
                            d="M178.425,1286.739l-26.026,0c-0.359,0 -0.648,-0.293 -0.648,-0.658l0,-26.409"
                            style={{ fill: 'none', fillRule: 'nonzero', stroke: '#4c697c', strokeWidth: '8.52px', strokeLinecap: 'square', strokeLinejoin: 'miter' }}
                          />
                        </g>
                        <path d="M118.161,1314.601l43.836,0" style={{ fill: 'none', fillRule: 'nonzero', stroke: '#4c697c', strokeWidth: '7.1px', strokeLinecap: 'butt', strokeLinejoin: 'miter' }} />
                        <path d="M118.161,1330.26l43.836,0" style={{ fill: 'none', fillRule: 'nonzero', stroke: '#4c697c', strokeWidth: '7.1px', strokeLinecap: 'butt', strokeLinejoin: 'miter' }} />
                        <path d="M118.161,1345.917l43.836,0" style={{ fill: 'none', fillRule: 'nonzero', stroke: '#4c697c', strokeWidth: '7.1px', strokeLinecap: 'butt', strokeLinejoin: 'miter' }} />
                      </g>
                      <path
                        d="M161.781,1382.927l0,7.064c0,0.675 -0.542,1.218 -1.214,1.218l-77.71,0c-0.673,0 -1.214,-0.543 -1.214,-1.218l0,-112.051c0,-0.675 0.542,-1.218 1.214,-1.218l6.394,0"
                        style={{ fill: 'none', fillRule: 'nonzero', stroke: '#4c697c', strokeWidth: '8.52px', strokeLinecap: 'butt', strokeLinejoin: 'miter' }}
                      />
                    </g>
                  </g>
                </svg>
            </div>

          </div>
        </div>
      </div>

      {/* 2. FOUR COLUMN TEXT AREA BELOW CARD */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 sm:gap-6 lg:gap-8 pt-8 sm:pt-12 lg:pt-14 text-left">
        {/* Column 1: What is GTMOS */}
        <div className="flex flex-col border-t border-white/10 pt-4 sm:border-t-0 sm:pt-0">
          <h4 className="text-[14px] sm:text-[16px] lg:text-[18px] font-bold text-white tracking-tight mb-1.5 sm:mb-2">
            What is GTMOS
          </h4>
          <p className="text-[13px] sm:text-[13px] lg:text-[14px] text-text-hero-secondary leading-relaxed sm:leading-normal">
            GTMOS helps B2B companies build and execute a coherent, customer-centric go-to-market strategy.
          </p>
        </div>

        {/* Column 2: Product Capabilities */}
        <div className="flex flex-col border-t border-white/10 pt-4 sm:border-t-0 sm:pt-0">
          <h4 className="text-[14px] sm:text-[16px] lg:text-[18px] font-bold text-white tracking-tight mb-1.5 sm:mb-2">
            Product Capabilities
          </h4>
          <p className="text-[13px] sm:text-[13px] lg:text-[14px] text-text-hero-secondary leading-relaxed sm:leading-normal">
            It addresses fragmented market positioning, unclear ideal customer profiles, ineffective messaging, disconnected demand generation, and misaligned sales execution.
          </p>
        </div>

        {/* Column 3: Operating Approach */}
        <div className="flex flex-col border-t border-white/10 pt-4 sm:border-t-0 sm:pt-0">
          <h4 className="text-[14px] sm:text-[16px] lg:text-[18px] font-bold text-white tracking-tight mb-1.5 sm:mb-2">
            Operating Approach
          </h4>
          <p className="text-[13px] sm:text-[13px] lg:text-[14px] text-text-hero-secondary leading-relaxed sm:leading-normal">
            By integrating ICP definition, buyer personas, value propositions, messaging, revenue motions, demand generation, sales enablement, and performance metrics, GTMOS connects market strategy with practical revenue execution.
          </p>
        </div>

        {/* Column 4: Value Delivery */}
        <div className="flex flex-col border-t border-white/10 pt-4 sm:border-t-0 sm:pt-0">
          <h4 className="text-[14px] sm:text-[16px] lg:text-[18px] font-bold text-white tracking-tight mb-1.5 sm:mb-2">
            Value Delivery
          </h4>
          <p className="text-[13px] sm:text-[13px] lg:text-[14px] text-text-hero-secondary leading-relaxed sm:leading-normal">
            AI-powered analysis helps businesses identify high-value customer segments, articulate differentiated value, align commercial activities with customer needs.
          </p>
        </div>
      </div>
    </div>
  );
}

export default GtmosProductCard;
