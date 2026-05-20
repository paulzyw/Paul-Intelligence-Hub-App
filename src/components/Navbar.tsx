import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Menu, X, LogOut, User, Settings, Shield } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { cn } from '../lib/utils';
import { ThemeToggle } from './ThemeToggle';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../lib/supabase';

export function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const { theme } = useTheme();
  const { user, profile } = useAuth();

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setIsUserMenuOpen(false);
    navigate('/');
  };

  const links = [
    { name: 'Home', path: '/' },
    { name: 'About', path: '/about' },
    { name: 'Insights', path: '/insights' },
    { name: 'Impact', path: '/impact' },
    { name: 'Research', path: '/research' },
    { name: 'Solutions', path: '/solutions' },
    { name: 'Contact', path: '/contact' },
  ];

  const isActive = (path: string) => {
    if (path === '/' && location.pathname !== '/') return false;
    return location.pathname.startsWith(path);
  };

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-border bg-bg-surface/80 backdrop-blur-md">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <div className="flex-shrink-0">
            <Link to="/" className="flex items-center gap-2">
              <img 
                src={theme === 'dark' ? "/paul wang_dark mode.svg" : "/paul wang_light mode.svg"} 
                alt="Paul Wang Logo" 
                className="h-6 w-auto transition-opacity duration-300" 
              />
            </Link>
          </div>
          
          <div className="hidden md:flex items-center gap-8">
            <div className="flex items-center space-x-8">
              {links.map((link) => (
                <Link
                  key={link.name}
                  to={link.path}
                  className={cn(
                    "text-sm font-medium transition-colors hover:text-accent",
                    isActive(link.path) ? "text-accent" : "text-text-secondary"
                  )}
                >
                  {link.name}
                </Link>
              ))}
            </div>
            
            <div className="flex items-center gap-4">
              <ThemeToggle />
              
              {user ? (
                <div className="relative" ref={userMenuRef}>
                  <button
                    onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                    className="flex items-center gap-2 p-1 rounded-full hover:bg-bg-primary transition-colors border border-transparent hover:border-border"
                  >
                    <div className="w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center text-accent">
                      <User size={18} />
                    </div>
                  </button>

                  {isUserMenuOpen && (
                    <div className="absolute right-0 mt-2 w-48 rounded-md bg-bg-surface border border-border shadow-lg py-1 z-50">
                      <div className="px-4 py-2 border-b border-border">
                        <p className="text-xs text-text-secondary truncate">{user.email}</p>
                        <p className="text-xs font-semibold text-accent capitalize">{profile?.role?.replace('_', ' ') || 'User'}</p>
                      </div>
                      
                      {profile?.role === 'super_admin' && (
                        <Link
                          to="/admin"
                          onClick={() => setIsUserMenuOpen(false)}
                          className="flex items-center gap-2 px-4 py-2 text-sm text-text-primary hover:bg-bg-primary transition-colors"
                        >
                          <Shield size={16} />
                          Admin Panel
                        </Link>
                      )}

                      {(profile?.role === 'revos_admin' || profile?.role === 'free_user') && (
                        <Link
                          to="/auth"
                          onClick={() => setIsUserMenuOpen(false)}
                          className="flex items-center gap-2 px-4 py-2 text-sm text-text-primary hover:bg-bg-primary transition-colors"
                        >
                          <Settings size={16} />
                          Workplace
                        </Link>
                      )}
                      
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-500 hover:bg-red-500/10 transition-colors"
                      >
                        <LogOut size={16} />
                        Sign Out
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <Link
                  to="/auth"
                  className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-accent hover:bg-accent/90 transition-colors"
                >
                  Sign In
                </Link>
              )}
            </div>
          </div>

          <div className="flex md:hidden items-center gap-4">
            <ThemeToggle />
            {user && (
              <button
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                className="p-1 rounded-full text-text-secondary"
              >
                <User size={20} />
              </button>
            )}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="text-text-secondary hover:text-accent p-2"
            >
              {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden border-t border-border bg-bg-surface">
          <div className="space-y-1 px-2 pb-3 pt-2 sm:px-3">
            {links.map((link) => (
              <Link
                key={link.name}
                to={link.path}
                onClick={() => setIsMobileMenuOpen(false)}
                className={cn(
                  "block rounded-md px-3 py-2 text-base font-medium",
                  isActive(link.path)
                    ? "bg-bg-primary text-accent"
                    : "text-text-secondary hover:bg-bg-primary hover:text-accent"
                )}
              >
                {link.name}
              </Link>
            ))}
            {user && (
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-2 px-3 py-2 text-base font-medium text-red-500 hover:bg-red-500/10 rounded-md"
              >
                <LogOut size={18} />
                Sign Out
              </button>
            )}
          </div>
        </div>
      )}
      
      {/* Mobile User Dropdown Overlay */}
      {isMobileMenuOpen === false && isUserMenuOpen && (
        <div className="md:hidden border-t border-border bg-bg-surface px-4 py-4 space-y-4">
           <div className="flex items-center gap-3 pb-4 border-b border-border">
              <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center text-accent">
                <User size={24} />
              </div>
              <div>
                <p className="text-sm font-medium text-text-primary truncate">{user?.email}</p>
                <p className="text-xs text-accent capitalize">{profile?.role?.replace('_', ' ') || 'User'}</p>
              </div>
           </div>
           <div className="space-y-2">
              {profile?.role === 'super_admin' && (
                <Link
                  to="/admin"
                  onClick={() => setIsUserMenuOpen(false)}
                  className="flex items-center gap-3 p-2 rounded-md hover:bg-bg-primary"
                >
                  <Shield size={20} className="text-text-secondary" />
                  <span className="text-sm font-medium">Admin Panel</span>
                </Link>
              )}
              <Link
                to="/auth"
                onClick={() => setIsUserMenuOpen(false)}
                className="flex items-center gap-3 p-2 rounded-md hover:bg-bg-primary"
              >
                <Settings size={20} className="text-text-secondary" />
                <span className="text-sm font-medium">Workplace</span>
              </Link>
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 p-2 rounded-md hover:bg-red-500/10 text-red-500"
              >
                <LogOut size={20} />
                <span className="text-sm font-medium">Sign Out</span>
              </button>
           </div>
        </div>
      )}
    </nav>
  );
}
