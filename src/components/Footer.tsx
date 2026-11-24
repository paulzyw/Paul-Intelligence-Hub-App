import { useRef, useState, type PointerEvent } from 'react';
import { Link } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { Cookie } from 'lucide-react';
import { useCookieConsent } from '../context/CookieConsentContext';

import apprevosLogoDark from '../../my_asset/apprevos_logo_dark.svg';
import apprevosLogoLight from '../../my_asset/apprevos_logo_light.svg';

const FOOTER_LOGO_PATHS = [
  {
    id: 'a',
    d: 'M108.185,185.018c-7.456,1.532 -14.487,2.511 -21.518,2.511c-56.035,0 -86.667,-42.96 -86.667,-90.403c0,-58.276 38.851,-97.127 88.908,-97.127c6.731,0 13.167,0.524 19.277,1.53l0,49.661c-5.761,-2.196 -12.489,-3.375 -20.024,-3.375c-22.787,0 -40.345,20.92 -40.345,47.443c0,24.282 17.558,43.707 41.839,43.707c6.969,0 12.777,-0.995 18.53,-2.654l-0,48.706Zm22.078,-177.221c30.278,12.716 48.301,39.919 48.301,73.64l0,104.598l-47.816,0l0,-102.357c0,-2.163 -0.164,-4.252 -0.485,-6.259l0,-69.623Z',
  },
  {
    id: 'p',
    d: 'M260.161,266.725l-47.229,0l0,-171.093c0,-37.274 18.076,-69.384 47.229,-85.183l0,256.275Zm22.078,-264.518c6.457,-1.446 13.256,-2.207 20.349,-2.207c52.299,0 88.908,42.586 88.908,95.633c0,48.937 -35.489,94.885 -86.667,94.885c-7.589,0 -15.179,-1.597 -22.59,-3.542l-0,-49.664c5.721,1.954 11.965,3.148 19.602,3.148c24.282,0 41.839,-18.678 41.839,-45.201c0,-26.523 -17.558,-45.201 -40.345,-45.201c-7.877,0 -15.013,1.85 -21.096,5.212l-0,-53.062Z',
  },
  {
    id: 'p1',
    d: 'M468.614,90.869c-0.109,1.437 -0.164,2.901 -0.164,4.39l0,171.466l-47.816,0l0,-171.093c0,-37.593 18.387,-69.933 47.98,-85.585l0,80.821Zm22.078,-88.826c6.232,-1.339 12.779,-2.043 19.597,-2.043c52.299,0 88.908,42.586 88.908,95.633c0,48.937 -35.489,94.885 -86.667,94.885c-7.333,0 -14.666,-1.491 -21.839,-3.346l-0,-49.609c5.517,1.804 11.546,2.897 18.85,2.897c24.282,0 41.839,-18.678 41.839,-45.201c0,-26.523 -17.558,-45.201 -40.345,-45.201c-7.555,0 -14.429,1.702 -20.345,4.807l0,-52.822Z',
  },
  {
    id: 'r',
    d: 'M679.141,186.035l0,-88.908c0,-27.644 15.69,-44.081 39.598,-44.081l11.581,0l0,-50.805l-10.086,0c-20.172,0 -37.73,13.075 -45.948,36.609l-0.747,0l0,-34.368l-45.201,0l0,181.552l50.805,0Z',
  },
  {
    id: 'e',
    d: 'M771.349,164.505c-17.203,-17.475 -26.835,-42.195 -26.835,-69.246c0,-51.925 35.489,-95.259 91.897,-95.259c46.007,0 73.239,23.469 86.142,49.443l-92.564,70.438l-20.848,-27.238l47.443,-36.609c-4.856,-5.603 -13.448,-8.218 -23.535,-8.218c-23.535,0 -40.719,21.293 -40.719,47.443c0,14.143 6.99,29.327 19.282,38.607l-40.263,30.639Zm115.987,-60.519l46.949,5.095c-8.966,48.937 -46.696,81.437 -97.874,81.437c-17.933,0 -33.752,-4.38 -46.989,-12.023l47.079,-35.826c0.588,0.022 1.18,0.033 1.777,0.033c23.494,0 43.021,-14.069 47.589,-37.599l1.468,-1.117Z',
  },
  {
    id: 'v',
    d: 'M1014.957,189.438c-17.107,-4.086 -24.338,-19.162 -29.119,-34.783l-44.081,-150.173l53.046,0l20.154,80.118l0,104.838Zm22.078,-108.749l19.407,-76.207l53.793,0l-46.696,150.173c-4.531,14.8 -11.259,29.112 -26.504,34.049l0,-108.016Z',
  },
  {
    id: 'o',
    d: 'M1201.926,189.946c-49.96,-5.266 -80.858,-46.237 -80.858,-94.687c0,-48.451 30.898,-89.421 80.858,-94.687l0,48.335c-20.246,4.217 -33.042,20.52 -33.042,46.352c0,25.832 12.796,42.135 33.042,46.352l0,48.335Zm22.078,-189.374c49.96,5.266 80.858,46.237 80.858,94.687c0,48.451 -30.898,89.421 -80.858,94.687l0,-48.335c20.246,-4.217 33.042,-20.52 33.042,-46.352c0,-25.832 -12.796,-42.135 -33.042,-46.352l0,-48.335Z',
  },
  {
    id: 's',
    d: 'M1325.407,186.035l66.868,0c34.368,0 61.265,-19.052 61.265,-55.288c0,-47.816 -76.954,-56.782 -76.954,-73.219c0,-7.471 5.977,-8.218 11.954,-8.218l55.288,0l0,-44.828l-57.529,0c-31.379,0 -59.023,14.195 -59.023,53.42c0,45.201 73.219,50.431 73.219,73.219c0,5.603 -4.483,10.086 -13.448,10.086l-61.638,0l0,44.828Z',
  },
] as const;

export function Footer() {
  const { theme } = useTheme();
  const { openPreferences } = useCookieConsent();
  const logoSvgRef = useRef<SVGSVGElement>(null);
  const spotlightFillRef = useRef<SVGRadialGradientElement>(null);
  const spotlightStrokeRef = useRef<SVGRadialGradientElement>(null);
  const [hoveredLetter, setHoveredLetter] = useState<string | null>(null);
  const [isLogoHovered, setIsLogoHovered] = useState(false);

  const updateSpotlightPosition = (e: PointerEvent<HTMLElement | SVGElement>) => {
    const svg = logoSvgRef.current;
    if (!svg) return;

    let svgX: number;
    let svgY: number;
    const ctm = svg.getScreenCTM();
    if (ctm) {
      const point = new DOMPoint(e.clientX, e.clientY).matrixTransform(ctm.inverse());
      svgX = point.x;
      svgY = point.y;
    } else {
      const rect = svg.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return;
      svgX = ((e.clientX - rect.left) / rect.width) * 1454;
      svgY = ((e.clientY - rect.top) / rect.height) * 267;
    }

    const cx = svgX.toFixed(2);
    const cy = svgY.toFixed(2);

    if (spotlightFillRef.current) {
      spotlightFillRef.current.setAttribute('cx', cx);
      spotlightFillRef.current.setAttribute('cy', cy);
      spotlightFillRef.current.setAttribute('fx', cx);
      spotlightFillRef.current.setAttribute('fy', cy);
    }

    if (spotlightStrokeRef.current) {
      spotlightStrokeRef.current.setAttribute('cx', cx);
      spotlightStrokeRef.current.setAttribute('cy', cy);
      spotlightStrokeRef.current.setAttribute('fx', cx);
      spotlightStrokeRef.current.setAttribute('fy', cy);
    }
  };

  return (
    <footer className="border-t border-border-hero bg-bg-hero-surface py-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-[350px_repeat(4,1fr)] gap-8 lg:gap-8">
          {/* First Column: Brand & Company Info */}
          <div className="flex flex-col space-y-4">
            <Link to="/" className="flex items-center gap-2">
              <img 
                src={theme === 'dark' ? apprevosLogoDark : apprevosLogoDark} 
                alt="Prevos Logo" 
                className="h-10 w-auto transition-opacity duration-300" 
              />
            </Link>
            <h2 className="text-2xl font-medium mt-2.5 mb-1 text-text-hero-primary">
              Apprevos Technology
            </h2>
            <p className="text-sm text-text-hero-secondary max-w-xs">
              Turn Revenue Challenges Into Clearer Paths to Growth
            </p>
            {/*}
            <p className="text-xs text-text-hero-secondary mt-4 whitespace-nowrap">
              © {new Date().getFullYear()} Apprevos Technology. All rights reserved.
            </p>*/}
          </div>

          {/* Column 2: Product */}
          <div className="flex flex-col space-y-4">
            <h3 className="font-semibold text-text-hero-primary">Product</h3>
            <nav className="flex flex-col space-y-2">
              <Link to="/product/overview/revos" className="text-xs text-text-hero-secondary hover:text-accent transition-colors">
                RevOS
              </Link>
              <Link to="#" onClick={(e) => e.preventDefault()} className="text-xs text-text-hero-secondary hover:text-accent transition-colors">
                GTMOS
              </Link>
              <Link to="#" onClick={(e) => e.preventDefault()} className="text-xs text-text-hero-secondary hover:text-accent transition-colors">
                Lead Qualification
              </Link>
              <Link to="#" onClick={(e) => e.preventDefault()} className="text-xs text-text-hero-secondary hover:text-accent transition-colors">
                Pipeline Qualification
              </Link>
              <Link to="#" onClick={(e) => e.preventDefault()} className="text-xs text-text-hero-secondary hover:text-accent transition-colors">
                Structured Methodologies
              </Link>
              <Link to="#" onClick={(e) => e.preventDefault()} className="text-xs text-text-hero-secondary hover:text-accent transition-colors">
                AI Reasoning
              </Link>
              <Link to="/product/revos" className="text-xs text-text-hero-secondary hover:text-accent transition-colors">
                RevOS Dashboard
              </Link>
              <Link to="#" onClick={(e) => e.preventDefault()} className="text-xs text-text-hero-secondary hover:text-accent transition-colors">
                RevOS Workflow
              </Link>
            </nav>
          </div>

          {/* Column 3: Solutions */}
          <div className="flex flex-col space-y-4">
            <h3 className="font-semibold text-text-hero-primary">Solutions</h3>
            <nav className="flex flex-col space-y-2">
              <Link to="#" onClick={(e) => e.preventDefault()} className="text-xs text-text-hero-secondary hover:text-accent transition-colors">
                Win More Deals
              </Link>
              <Link to="#" onClick={(e) => e.preventDefault()} className="text-xs text-text-hero-secondary hover:text-accent transition-colors">
                Accelerate Sales
              </Link>
              <Link to="#" onClick={(e) => e.preventDefault()} className="text-xs text-text-hero-secondary hover:text-accent transition-colors">
                Prioritize Opportunities
              </Link>
              <Link to="#" onClick={(e) => e.preventDefault()} className="text-xs text-text-hero-secondary hover:text-accent transition-colors">
                Improve Forecast Confidence
              </Link>
              <Link to="#" onClick={(e) => e.preventDefault()} className="text-xs text-text-hero-secondary hover:text-accent transition-colors">
                Build Profitable Growth
              </Link>
              <Link to="#" onClick={(e) => e.preventDefault()} className="text-xs text-text-hero-secondary hover:text-accent transition-colors">
                Go-to-Market Strategy
              </Link>
              <Link to="#" onClick={(e) => e.preventDefault()} className="text-xs text-text-hero-secondary hover:text-accent transition-colors">
                Lead Qualification
              </Link>
              <Link to="#" onClick={(e) => e.preventDefault()} className="text-xs text-text-hero-secondary hover:text-accent transition-colors">
                Pipeline Assessment
              </Link>
              <Link to="#" onClick={(e) => e.preventDefault()} className="text-xs text-text-hero-secondary hover:text-accent transition-colors">
                Improve Winning Possibility
              </Link>
            </nav>
          </div>

          {/* Column 4: Resources */}
          <div className="flex flex-col space-y-4">
            <h3 className="font-semibold text-text-hero-primary">Resources</h3>
            <nav className="flex flex-col space-y-2">
              <Link to="#" onClick={(e) => e.preventDefault()} className="text-xs text-text-hero-secondary hover:text-accent transition-colors">
                Getting Started
              </Link>
              <Link to="#" onClick={(e) => e.preventDefault()} className="text-xs text-text-hero-secondary hover:text-accent transition-colors">
                GTMOS
              </Link>
              <Link to="#" onClick={(e) => e.preventDefault()} className="text-xs text-text-hero-secondary hover:text-accent transition-colors">
                Lead Qualification
              </Link>
              <Link to="#" onClick={(e) => e.preventDefault()} className="text-xs text-text-hero-secondary hover:text-accent transition-colors">
                Pipeline Assessment
              </Link>
              <Link to="/resources/insights" className="text-xs text-text-hero-secondary hover:text-accent transition-colors">
                Revenue Insights
              </Link>
              <Link to="#" onClick={(e) => e.preventDefault()} className="text-xs text-text-hero-secondary hover:text-accent transition-colors">
                Playbook & Framework
              </Link>
            </nav>
          </div>

          {/* Column 5: About */}
          <div className="flex flex-col space-y-4">
            <h3 className="font-semibold text-text-hero-primary">About</h3>
            <nav className="flex flex-col space-y-2">
              <Link to="/about/aboutRevos" className="text-xs text-text-hero-secondary hover:text-accent transition-colors">
                About RevOS
              </Link>
              <Link to="/about/aboutFounder" className="text-xs text-text-hero-secondary hover:text-accent transition-colors">
                About Founder
              </Link>
              <Link to="/about/founderProfile" className="text-xs text-text-hero-secondary hover:text-accent transition-colors">
                Founder Profile
              </Link>
              <Link to="/about/founderImpact" className="text-xs text-text-hero-secondary hover:text-accent transition-colors">
                Business Impact
              </Link>
              <Link to="/about/founderInsights" className="text-xs text-text-hero-secondary hover:text-accent transition-colors">
                Insights
              </Link>
              <Link to="/about/founderResearch" className="text-xs text-text-hero-secondary hover:text-accent transition-colors">
                Research
              </Link>
              <Link to="/about/contact" className="text-xs text-text-hero-secondary hover:text-accent transition-colors">
                Contact
              </Link>
            </nav>
          </div>
        </div>



        {/* Bottom Full-Width Transparent Brand Cutout Section */}
        <div
          className="mt-4 pt-12 mb-0 w-full bg-transparent"
          aria-hidden="true"
          onPointerEnter={(e) => {
            updateSpotlightPosition(e);
            setIsLogoHovered(true);
          }}
          onPointerMove={(e) => {
            updateSpotlightPosition(e);
            if (!isLogoHovered) setIsLogoHovered(true);
          }}
          onPointerLeave={() => {
            setIsLogoHovered(false);
            setHoveredLetter(null);
          }}
        >
          <svg
            ref={logoSvgRef}
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 1454 267"
            className="block w-full h-auto overflow-visible"
            fillRule="evenodd"
            clipRule="evenodd"
            strokeLinejoin="round"
            strokeMiterlimit={2}
          >
            <g id="logo_text">
              {FOOTER_LOGO_PATHS.map(({ id, d }, idx) => (
                <path
                  key={id}
                  id={id}
                  d={d}
                  fill={`url(#_footer_Linear${idx + 1})`}
                  onPointerEnter={(e) => {
                    updateSpotlightPosition(e);
                    setIsLogoHovered(true);
                    setHoveredLetter(id);
                  }}
                  onPointerLeave={() =>
                    setHoveredLetter((prev) => (prev === id ? null : prev))
                  }
                />
              ))}
            </g>

            {/* Per-letter cursor-tracking spotlight beam & border with proximity & soft neighbor spill */}
            <g className="pointer-events-none" aria-hidden="true">
              {FOOTER_LOGO_PATHS.map(({ id, d }) => (
                <path
                  key={`${id}-spotlight`}
                  d={d}
                  fill="url(#_footer_spotlight_fill)"
                  stroke="url(#_footer_spotlight_stroke)"
                  strokeWidth={1.75}
                  vectorEffect="non-scaling-stroke"
                  className={
                    !isLogoHovered
                      ? 'opacity-0 transition-opacity duration-300'
                      : hoveredLetter === id
                        ? 'opacity-100 transition-opacity duration-200'
                        : hoveredLetter === null
                          ? 'opacity-55 transition-opacity duration-200'
                          : 'opacity-35 transition-opacity duration-200'
                  }
                />
              ))}
            </g>

            <defs>
              {[1, 2, 3, 4, 5, 6, 7, 8].map((idx) => (
                <linearGradient
                  key={idx}
                  id={`_footer_Linear${idx}`}
                  x1="0"
                  y1="0"
                  x2="1"
                  y2="0"
                  gradientUnits="userSpaceOnUse"
                  gradientTransform="matrix(-1.416763,261.53727,-261.53727,-1.416763,720.23265,2.241388)"
                >
                  <stop offset="0" stopColor="var(--bg-hero-primary)" stopOpacity={1} />
                  <stop offset="1" stopColor="var(--bg-hero-surface)" stopOpacity={1} />
                </linearGradient>
              ))}

              <radialGradient
                ref={spotlightFillRef}
                id="_footer_spotlight_fill"
                cx="727"
                cy="133"
                fx="727"
                fy="133"
                r="240"
                gradientUnits="userSpaceOnUse"
              >
                <stop offset="0%" stopColor="var(--accent)" stopOpacity={0.36} />
                <stop offset="45%" stopColor="var(--accent)" stopOpacity={0.15} />
                <stop offset="100%" stopColor="var(--accent)" stopOpacity={0} />
              </radialGradient>

              <radialGradient
                ref={spotlightStrokeRef}
                id="_footer_spotlight_stroke"
                cx="727"
                cy="133"
                fx="727"
                fy="133"
                r="230"
                gradientUnits="userSpaceOnUse"
              >
                <stop offset="0%" stopColor="var(--accent)" stopOpacity={1} />
                <stop offset="50%" stopColor="var(--accent)" stopOpacity={0.45} />
                <stop offset="100%" stopColor="var(--accent)" stopOpacity={0} />
              </radialGradient>
            </defs>
          </svg>
        </div>

        {/* Bottom Legal & Preferences Row */}
        <div className="mt-2 pt-6 border-t border-border-hero/60 flex flex-col lg:flex-row items-center justify-between gap-4 lg:gap-6 text-xs text-text-hero-secondary">
          <p className="order-2 lg:order-1 text-center lg:text-left">
            © {new Date().getFullYear()} Apprevos Technology. All rights reserved.
          </p>
          <div className="order-1 lg:order-2 flex flex-wrap items-center justify-center lg:justify-end gap-x-4 sm:gap-x-6 gap-y-2.5">
            <Link
              to="/privacy-policy"
              className="text-xs text-text-hero-secondary hover:text-accent transition-colors py-1 px-1 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent rounded"
            >
              Privacy Policy
            </Link>

            <Link
              to="/terms-of-service"
              className="text-xs text-text-hero-secondary hover:text-accent transition-colors py-1 px-1 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent rounded"
            >
              Terms of Service
            </Link>

            <Link
              to="/cookie-policy"
              className="text-xs text-text-hero-secondary hover:text-accent transition-colors py-1 px-1 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent rounded"
            >
              Cookie Policy
            </Link>
            
            <button
              type="button"
              onClick={openPreferences}
              className="text-xs text-text-hero-secondary hover:text-accent transition-colors inline-flex items-center gap-1.5 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent rounded py-1 px-1 cursor-pointer"
            >
              <Cookie className="h-3.5 w-3.5 text-accent" aria-hidden="true" />
              <span>Cookie Settings</span>
            </button>

            <Link
              to="/ai-disclaimer"
              className="text-xs text-text-hero-secondary hover:text-accent transition-colors py-1 px-1 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent rounded"
            >
              AI Disclaimer
            </Link>
          </div>
        </div>

      </div>
    </footer>
  );
}

