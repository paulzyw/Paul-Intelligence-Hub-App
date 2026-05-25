import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Menu, X, LogOut, User, Settings, Shield, Key, Eye, EyeOff, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
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

  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [changePasswordLoading, setChangePasswordLoading] = useState(false);
  const [changePasswordError, setChangePasswordError] = useState<string | null>(null);
  const [changePasswordSuccess, setChangePasswordSuccess] = useState<string | null>(null);

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setChangePasswordLoading(true);
    setChangePasswordError(null);
    setChangePasswordSuccess(null);

    try {
      if (newPassword.length < 6) {
        throw new Error('New password must be at least 6 characters long.');
      }
      if (newPassword !== confirmPassword) {
        throw new Error('Passwords do not match.');
      }

      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (updateError) throw updateError;

      setChangePasswordSuccess('Password updated successfully!');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => {
        setIsChangePasswordOpen(false);
        setChangePasswordSuccess(null);
      }, 2000);
    } catch (err: any) {
      setChangePasswordError(err.message || 'Failed to update password.');
    } finally {
      setChangePasswordLoading(false);
    }
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
                        type="button"
                        onClick={() => {
                          setIsChangePasswordOpen(true);
                          setIsUserMenuOpen(false);
                        }}
                        className="w-full flex items-center gap-2 px-4 py-2 text-sm text-text-primary hover:bg-bg-primary transition-colors text-left"
                        id="desktop-change-password-link"
                      >
                        <Key size={16} />
                        Change Password
                      </button>
                      
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
                type="button"
                onClick={() => {
                  setIsChangePasswordOpen(true);
                  setIsUserMenuOpen(false);
                }}
                className="w-full flex items-center gap-3 p-2 rounded-md hover:bg-bg-primary text-text-primary text-left"
                id="mobile-change-password-link"
              >
                <Key size={20} className="text-text-secondary" />
                <span className="text-sm font-medium">Change Password</span>
              </button>
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

      {/* Change Password Modal */}
      <AnimatePresence>
        {isChangePasswordOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 overflow-y-auto w-screen h-screen">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                if (!changePasswordLoading) {
                  setIsChangePasswordOpen(false);
                  setNewPassword('');
                  setConfirmPassword('');
                  setChangePasswordError(null);
                  setChangePasswordSuccess(null);
                }
              }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-0"
              id="change-password-backdrop"
            />

            {/* Modal Body */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ type: 'spring', duration: 0.3 }}
              className="relative w-full max-w-md bg-bg-surface border border-border rounded-2xl shadow-2xl p-6 my-auto max-h-[calc(100vh-2rem)] overflow-y-auto z-10"
              id="change-password-modal"
            >
              <button
                type="button"
                onClick={() => {
                  setIsChangePasswordOpen(false);
                  setNewPassword('');
                  setConfirmPassword('');
                  setChangePasswordError(null);
                  setChangePasswordSuccess(null);
                }}
                disabled={changePasswordLoading}
                className="absolute top-4 right-4 p-1.5 rounded-lg text-text-secondary hover:text-text-primary hover:bg-bg-primary transition-colors disabled:opacity-50"
                id="close-change-password-btn"
              >
                <X size={18} />
              </button>

              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center text-accent">
                  <Key size={20} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-text-primary">Change Password</h3>
                  <p className="text-xs text-text-secondary">Update your access credentials securely</p>
                </div>
              </div>

              <form onSubmit={handleUpdatePassword} className="space-y-4">
                {/* New Password */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-text-secondary uppercase tracking-wider block" htmlFor="new-password-input">
                    New Password
                  </label>
                  <div className="relative group">
                    <input
                      id="new-password-input"
                      type={showNewPassword ? "text" : "password"}
                      required
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="At least 6 characters"
                      className="block w-full px-4 pr-11 py-3 bg-bg-primary/50 border border-border rounded-xl text-text-primary placeholder-text-secondary/50 focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all font-medium text-sm"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute inset-y-0 right-0 pr-4 flex items-center text-text-secondary hover:text-text-primary focus:outline-none transition-colors"
                      aria-label={showNewPassword ? "Hide password" : "Show password"}
                    >
                      {showNewPassword ? (
                        <EyeOff size={16} />
                      ) : (
                        <Eye size={16} />
                      )}
                    </button>
                  </div>
                </div>

                {/* Confirm Password */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-text-secondary uppercase tracking-wider block" htmlFor="confirm-password-input">
                    Confirm New Password
                  </label>
                  <div className="relative group">
                    <input
                      id="confirm-password-input"
                      type={showConfirmPassword ? "text" : "password"}
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Repeat new password"
                      className="block w-full px-4 pr-11 py-3 bg-bg-primary/50 border border-border rounded-xl text-text-primary placeholder-text-secondary/50 focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all font-medium text-sm"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute inset-y-0 right-0 pr-4 flex items-center text-text-secondary hover:text-text-primary focus:outline-none transition-colors"
                      aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                    >
                      {showConfirmPassword ? (
                        <EyeOff size={16} />
                      ) : (
                        <Eye size={16} />
                      )}
                    </button>
                  </div>
                </div>

                {/* Messages / Alerts */}
                {changePasswordError && (
                  <div 
                    className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/20 flex items-start gap-2.5 animate-fadeIn"
                    id="change-password-error-alert"
                  >
                    <AlertCircle className="h-4.5 w-4.5 text-red-500 shrink-0" />
                    <span className="text-xs text-red-200 font-medium">{changePasswordError}</span>
                  </div>
                )}
                {changePasswordSuccess && (
                  <div 
                    className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-start gap-2.5 animate-fadeIn"
                    id="change-password-success-alert"
                  >
                    <CheckCircle2 className="h-4.5 w-4.5 text-emerald-500 shrink-0" />
                    <span className="text-xs text-emerald-200 font-medium">{changePasswordSuccess}</span>
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setIsChangePasswordOpen(false);
                      setNewPassword('');
                      setConfirmPassword('');
                      setChangePasswordError(null);
                      setChangePasswordSuccess(null);
                    }}
                    disabled={changePasswordLoading}
                    className="flex-1 py-3 border border-border rounded-xl text-text-primary font-bold text-xs uppercase tracking-widest hover:bg-bg-primary/50 transition-all disabled:opacity-50"
                    id="cancel-change-password-btn"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={changePasswordLoading}
                    className="flex-1 py-3 bg-accent hover:bg-accent/90 disabled:bg-accent/50 text-white rounded-xl font-bold text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-2"
                    id="submit-change-password-btn"
                  >
                    {changePasswordLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      'Change Password'
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </nav>
  );
}
