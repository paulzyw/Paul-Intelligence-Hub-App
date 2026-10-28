import { Link } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';

import apprevosLogoDark from '../../my_asset/apprevos_logo_dark.svg';
import apprevosLogoLight from '../../my_asset/apprevos_logo_light.svg';

export function Footer() {
  const { theme } = useTheme();

  return (
    <footer className="border-t border-border-hero bg-bg-hero-surface py-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-[280px_repeat(4,1fr)] gap-8 lg:gap-8">
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
            <p className="text-xs text-text-hero-secondary mt-4 whitespace-nowrap">
              © {new Date().getFullYear()} Apprevos Technology. All rights reserved.
            </p>
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
              <Link to="#" onClick={(e) => e.preventDefault()} className="text-xs text-text-hero-secondary hover:text-accent transition-colors">
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
              <Link to="/product/overview/revos" className="text-xs text-text-hero-secondary hover:text-accent transition-colors">
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
      </div>
    </footer>
  );
}

