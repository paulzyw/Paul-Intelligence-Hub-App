import { Link } from 'react-router-dom';
import { Linkedin, Mail } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

export function Footer() {
  const { theme } = useTheme();

  return (
    <footer className="border-t border-border-hero bg-bg-hero-surface py-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Left Column */}
          <div className="flex flex-col space-y-4">
            <Link to="/" className="flex items-center gap-2">
              <img 
                src={theme === 'dark' ? "/paul wang_dark mode.svg" : "/paul wang_dark mode.svg"} 
                alt="Paul Wang Logo" 
                className="h-8 w-auto transition-opacity duration-300" 
              />
            </Link>
            <p className="text-sm text-text-hero-secondary max-w-xs">
              Turning Data and Technology Into Measurable Business Growth
            </p>
            <p className="text-xs text-text-hero-secondary mt-4">
              © {new Date().getFullYear()} Paul Wang. All rights reserved.
            </p>
          </div>

          {/* Middle Column */}
          <div className="flex flex-col space-y-4">
            <h3 className="font-semibold text-text-hero-primary">Quick Links</h3>
            <nav className="flex flex-col space-y-2">
              <Link to="/" className="text-sm text-text-hero-secondary hover:text-accent transition-colors">Home</Link>
              <Link to="/about" className="text-sm text-text-hero-secondary hover:text-accent transition-colors">About</Link>
              <Link to="/insights" className="text-sm text-text-hero-secondary hover:text-accent transition-colors">Insights</Link>
              <Link to="/impact" className="text-sm text-text-hero-secondary hover:text-accent transition-colors">Impact & Value</Link>
              <Link to="/research" className="text-sm text-text-hero-secondary hover:text-accent transition-colors">Research</Link>
              <Link to="/contact" className="text-sm text-text-hero-secondary hover:text-accent transition-colors">Contact</Link>
            </nav>
          </div>

          {/* Right Column */}
          <div className="flex flex-col space-y-4">
            <h3 className="font-semibold text-text-hero-primary">Connect</h3>
            <div className="flex space-x-4">
              <a 
                href="https://www.linkedin.com/in/paulzyw" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-text-hero-secondary hover:text-accent transition-colors"
                aria-label="LinkedIn"
              >
                <Linkedin size={20} />
              </a>
              <a 
                href="mailto:paul.zy.wang@hotmail.com" 
                className="text-text-hero-secondary hover:text-accent transition-colors"
                aria-label="Email"
              >
                <Mail size={20} />
              </a>
            </div>
            <a 
              href="mailto:paul.zy.wang@hotmail.com"
              className="inline-flex items-center justify-center rounded-md bg-accent px-4 py-2 text-sm font-medium text-white transition-transform hover:scale-105 active:scale-95 w-fit mt-2"
            >
              Let's Connect
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
