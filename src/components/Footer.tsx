import { Link } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { Cookie } from 'lucide-react';
import { useCookieConsent } from '../context/CookieConsentContext';

import apprevosLogoDark from '../../my_asset/apprevos_logo_dark.svg';
import apprevosLogoLight from '../../my_asset/apprevos_logo_light.svg';

export function Footer() {
  const { theme } = useTheme();
  const { openPreferences } = useCookieConsent();

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
        <div className="mt-26 w-full bg-transparent" aria-hidden="true">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 1452 120"
            className="block w-full h-auto overflow-visible"
            fillRule="evenodd"
            clipRule="evenodd"
            strokeLinejoin="round"
            strokeMiterlimit={2}
          >
            <g id="logo_light_cut">
              <path
                id="a"
                d="M2.059,118.091c-1.367,-6.799 -2.059,-13.831 -2.059,-20.964c0,-58.276 38.851,-97.127 88.908,-97.127c6.731,0 13.167,0.524 19.277,1.53l0,49.661c-5.761,-2.196 -12.489,-3.375 -20.024,-3.375c-22.787,0 -40.345,20.92 -40.345,47.443c0,8.391 2.097,16.202 5.843,22.832l-51.6,0Zm128.688,0l0,-34.412c0,-2.163 -0.164,-4.252 -0.485,-6.259l0,-69.623c30.278,12.716 48.301,39.919 48.301,73.64l0,36.654l-47.816,0Z"
                fill="url(#_footer_Linear1)"
                strokeWidth={1.5}
                vectorEffect="non-scaling-stroke"
                className="stroke-transparent hover:stroke-accent transition-colors duration-300"
              />
              <path
                id="p"
                d="M212.932,118.091l0,-22.458c0,-37.274 18.076,-69.384 47.229,-85.183l0,107.641l-47.229,0Zm125.642,0c3.283,-6.555 5.106,-14.286 5.106,-22.832c0,-26.523 -17.558,-45.201 -40.345,-45.201c-7.877,0 -15.013,1.85 -21.096,5.212l-0,-53.062c6.457,-1.446 13.256,-2.207 20.349,-2.207c52.299,0 88.908,42.586 88.908,95.633c0,7.612 -0.859,15.152 -2.502,22.458l-50.42,0Z"
                fill="url(#_footer_Linear2)"
                strokeWidth={1.5}
                vectorEffect="non-scaling-stroke"
                className="stroke-transparent hover:stroke-accent transition-colors duration-300"
              />
              <path
                id="p1"
                d="M420.634,118.091l0,-22.458c0,-37.593 18.387,-69.933 47.98,-85.585l0,80.821c-0.109,1.437 -0.164,2.901 -0.164,4.39l0,22.832l-47.816,0Zm125.642,0c3.283,-6.555 5.106,-14.286 5.106,-22.832c0,-26.523 -17.558,-45.201 -40.345,-45.201c-7.555,0 -14.429,1.702 -20.345,4.807l0,-52.822c6.232,-1.339 12.779,-2.043 19.597,-2.043c52.299,0 88.908,42.586 88.908,95.633c-0,7.612 -0.859,15.152 -2.502,22.458l-50.42,0Z"
                fill="url(#_footer_Linear3)"
                strokeWidth={1.5}
                vectorEffect="non-scaling-stroke"
                className="stroke-transparent hover:stroke-accent transition-colors duration-300"
              />
              <path
                id="r"
                d="M679.141,118.091l-50.805,0l0,-113.608l45.201,0l0,34.368l0.747,0c8.218,-23.535 25.776,-36.609 45.948,-36.609l10.086,0l0,50.805l-11.581,0c-23.908,0 -39.598,16.437 -39.598,44.081l0,20.964Z"
                fill="url(#_footer_Linear4)"
                fillRule="nonzero"
                strokeWidth={1.5}
                vectorEffect="non-scaling-stroke"
                className="stroke-transparent hover:stroke-accent transition-colors duration-300"
              />
              <path
                id="e"
                d="M746.895,118.091c-1.571,-7.334 -2.381,-14.985 -2.381,-22.832c0,-51.925 35.489,-95.259 91.897,-95.259c46.007,0 73.239,23.469 86.142,49.443l-92.564,70.438l-20.848,-27.238l47.443,-36.609c-4.856,-5.603 -13.448,-8.218 -23.535,-8.218c-23.535,0 -40.719,21.293 -40.719,47.443c0,7.674 2.058,15.654 5.904,22.832l-51.34,0Zm134.503,0c2.033,-3.923 3.553,-8.265 4.47,-12.988l1.468,-1.117l46.949,5.095c-0.562,3.069 -1.238,6.074 -2.023,9.01l-50.864,0Z"
                fill="url(#_footer_Linear5)"
                strokeWidth={1.5}
                vectorEffect="non-scaling-stroke"
                className="stroke-transparent hover:stroke-accent transition-colors duration-300"
              />
              <path
                id="v"
                d="M975.104,118.091l-33.348,-113.608l53.046,0l20.154,80.118l0,33.49l-39.852,0Zm61.93,0l0,-37.401l19.407,-76.207l53.793,0l-35.326,113.608l-37.874,0Z"
                fill="url(#_footer_Linear6)"
                strokeWidth={1.5}
                vectorEffect="non-scaling-stroke"
                className="stroke-transparent hover:stroke-accent transition-colors duration-300"
              />
              <path
                id="o"
                d="M1123.448,118.091c-1.571,-7.334 -2.381,-14.985 -2.381,-22.832c0,-48.451 30.898,-89.421 80.858,-94.687l0,48.335c-20.246,4.217 -33.042,20.52 -33.042,46.352c0,8.732 1.462,16.376 4.18,22.832l-49.616,0Zm129.416,0c2.718,-6.456 4.18,-14.099 4.18,-22.832c0,-25.832 -12.796,-42.135 -33.042,-46.352l0,-48.335c49.96,5.266 80.858,46.237 80.858,94.687c0,7.847 -0.81,15.497 -2.381,22.832l-49.616,0Z"
                fill="url(#_footer_Linear7)"
                strokeWidth={1.5}
                vectorEffect="non-scaling-stroke"
                className="stroke-transparent hover:stroke-accent transition-colors duration-300"
              />
              <path
                id="s"
                d="M1451.575,118.091l-60.051,0c-19.547,-13.955 -64.248,-24.87 -64.248,-60.188c0,-39.224 27.644,-53.42 59.023,-53.42l57.529,0l0,44.828l-55.288,0c-5.977,0 -11.954,0.747 -11.954,8.218c0,14.87 62.98,23.625 74.989,60.562Z"
                fill="url(#_footer_Linear8)"
                fillRule="nonzero"
                strokeWidth={1.5}
                vectorEffect="non-scaling-stroke"
                className="stroke-transparent hover:stroke-accent transition-colors duration-300"
              />
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
                  gradientTransform="matrix(-0.285083,117.640186,-117.640186,-0.285083,720.23265,2.241388)"
                >
                  <stop offset="0" stopColor="var(--bg-hero-primary)" stopOpacity={1} />
                  <stop offset="1" stopColor="var(--bg-hero-surface)" stopOpacity={1} />
                </linearGradient>
              ))}
            </defs>
          </svg>
        </div>

        {/* Bottom Legal & Preferences Row */}
        <div className="mt-10 pt-6 border-t border-border-hero/60 flex flex-col lg:flex-row items-center justify-between gap-4 lg:gap-6 text-xs text-text-hero-secondary">
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

