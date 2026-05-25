import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { supabase } from '../lib/supabase';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { 
  Command,
  Mail, 
  Lock, 
  User,
  Chrome, 
  AlertCircle,
  Loader2,
  CheckCircle2,
  ChevronLeft,
  Eye,
  EyeOff
} from 'lucide-react';
import { cn } from '../lib/utils';

export function Auth() {
  const [view, setView] = useState<'signin' | 'signup' | 'forgot' | 'reset'>('signin');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<React.ReactNode | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [rememberMe, setRememberMe] = useState(false);
  
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as any)?.from?.pathname || '/solutions/revos';
  const isRecoveringRef = useRef(false);

  // Check if user is already logged in or handling a redirect
  useEffect(() => {
    let mounted = true;

    // Check for PKCE code or errors in URL
    const handleAuthRedirect = async () => {
      const searchParams = new URLSearchParams(window.location.search);
      const code = searchParams.get('code');
      const tokenHash = searchParams.get('token_hash');
      const type = searchParams.get('type');
      const errorParam = searchParams.get('error');
      const errorDesc = searchParams.get('error_description');

      if (!mounted) return;

      if (errorParam) {
        setError(errorDesc || errorParam);
        return;
      }

      if (code) {
        setLoading(true);
        setMessage('Exchanging code for session...');
        try {
          const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
          if (exchangeError) throw exchangeError;
        } catch (err: any) {
          if (mounted) setError(`Authentication failed: ${err.message}`);
        } finally {
          if (mounted) setLoading(false);
        }
      } else if (tokenHash && type) {
        setLoading(true);
        setMessage('Verifying your email...');
        try {
          const { error: verifyError } = await supabase.auth.verifyOtp({
            token_hash: tokenHash,
            type: type as any,
          });
          if (verifyError) throw verifyError;
          if (mounted) setMessage('Email confirmed! Signing you in...');
        } catch (err: any) {
          if (mounted) setError(`Verification failed: ${err.message}`);
        } finally {
          if (mounted) setLoading(false);
        }
      }
    };

    handleAuthRedirect();

    // Check URL or hash manually for recovery parameters as fallback
    const isUrlRecovery = 
      window.location.href.includes('type=recovery') || 
      window.location.hash.includes('type=recovery') || 
      window.location.search.includes('type=recovery');

    if (isUrlRecovery) {
      isRecoveringRef.current = true;
      setView('reset');
      setMessage('Password recovery link detected. Please enter your new password.');
    }

    // Listen for auth state changes (crucial for catching redirects with tokens)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!mounted) return;
      
      if (event === 'PASSWORD_RECOVERY') {
        isRecoveringRef.current = true;
        setView('reset');
        setMessage('Reset link verified. Please enter your new password below.');
        setError(null);
        return;
      }

      if (session?.user) {
        if (event === 'SIGNED_IN') {
          // If we are recovering password, prevent immediate redirect
          const urlHasRecovery = 
            window.location.href.includes('type=recovery') || 
            window.location.hash.includes('type=recovery') || 
            window.location.search.includes('type=recovery');

          if (isRecoveringRef.current || urlHasRecovery) {
            isRecoveringRef.current = true;
            setView('reset');
            return;
          }

          setMessage('Successfully authenticated. Redirecting...');
          setTimeout(() => {
            if (mounted) navigate(from, { replace: true });
          }, 1000);
        } else if (event === 'INITIAL_SESSION' && !window.location.search.includes('code')) {
          const urlHasRecovery = 
            window.location.href.includes('type=recovery') || 
            window.location.hash.includes('type=recovery') || 
            window.location.search.includes('type=recovery');

          if (!isRecoveringRef.current && !urlHasRecovery) {
            navigate(from, { replace: true });
          }
        }
      }
    });

    // Load remembered email
    const savedEmail = localStorage.getItem('revos_remembered_email');
    if (savedEmail) {
      setEmail(savedEmail);
      setRememberMe(true);
    }

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [navigate, from]);

  // Reset password visibility when view changes
  useEffect(() => {
    setShowPassword(false);
  }, [view]);

  const handleResendConfirmation = async () => {
    if (!email) {
      setError('Please enter your email address first.');
      return;
    }
    setLoading(true);
    try {
      const { error: resendError } = await supabase.auth.resend({
        type: 'signup',
        email: email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth`,
        }
      });
      if (resendError) throw resendError;
      setMessage('Confirmation email resent. Please check your inbox.');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    // Save or clear remembered email
    if (rememberMe) {
      localStorage.setItem('revos_remembered_email', email);
    } else {
      localStorage.removeItem('revos_remembered_email');
    }

    try {
      if (view === 'signup') {
        const { data, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { full_name: fullName },
            emailRedirectTo: `${window.location.origin}/auth`,
          }
        });
        
        if (signUpError) throw signUpError;

        if (data.session) {
          navigate(from, { replace: true });
        } else {
          setMessage('Account created! Please check your email to confirm your identity.');
        }
      } else {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        
        if (signInError) {
          if (signInError.message.includes('Email not confirmed')) {
            setError(
              <div className="flex flex-col gap-2">
                <p>Your email is not confirmed yet.</p>
                <button 
                  onClick={handleResendConfirmation}
                  className="text-white underline font-bold hover:text-white/80 transition-colors text-left"
                >
                  Resend confirmation email?
                </button>
              </div>
            );
            return;
          }
          throw signInError;
        }
        navigate(from, { replace: true });
      }
    } catch (err: any) {
      if (err.message === 'Failed to fetch') {
        setError('Connection failed. Please check your Supabase URL in AI Studio settings.');
      } else {
        setError(err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      if (!email) {
        throw new Error('Please enter your email address.');
      }

      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth?type=recovery`,
      });

      if (resetError) throw resetError;

      setMessage('Password recovery link sent! Please check your email inbox.');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      if (password.length < 6) {
        throw new Error('Password must be at least 6 characters long.');
      }

      const { error: updateError } = await supabase.auth.updateUser({
        password: password,
      });

      if (updateError) throw updateError;

      setMessage('Password updated successfully! Redirecting to workspace...');
      isRecoveringRef.current = false;
      setTimeout(() => {
        navigate(from, { replace: true });
      }, 1500);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (view === 'signin' || view === 'signup') {
      handleAuth(e);
    } else if (view === 'forgot') {
      handleForgotPassword(e);
    } else if (view === 'reset') {
      handleUpdatePassword(e);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      const { error: googleError } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}${from}`,
        },
      });
      if (googleError) throw googleError;
    } catch (err: any) {
      setError(err.message);
    }
  };

  const getHeaderContent = () => {
    switch (view) {
      case 'signup':
        return {
          title: 'Create Account',
          subtitle: 'Join the future of intelligence.'
        };
      case 'forgot':
        return {
          title: 'Reset Password',
          subtitle: 'Enter your email address to receive a secure recovery link.'
        };
      case 'reset':
        return {
          title: 'Update Password',
          subtitle: 'Create a strong, secure new password for your account.'
        };
      case 'signin':
      default:
        return {
          title: 'Welcome Back',
          subtitle: 'Enter your credentials to access your AI workspace.'
        };
    }
  };

  const header = getHeaderContent();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-bg-primary py-12 px-4 xs:px-6 sm:p-6 relative overflow-hidden">
      {/* Background Orbs (matching site aesthetic) */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full -z-10 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-accent/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-1/4 left-1/4 w-[400px] h-[400px] bg-blue-500/5 rounded-full blur-[100px]" />
      </div>

      <Link 
        to="/" 
        className="sm:absolute top-4 left-4 sm:top-6 sm:left-6 md:top-8 md:left-8 flex items-center gap-2 text-text-secondary hover:text-text-primary transition-colors font-bold text-xs sm:text-sm tracking-tight mb-8 sm:mb-0"
      >
        <ChevronLeft className="h-4 w-4" />
        BACK TO HOME
      </Link>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-[440px]"
      >
        <div className="bg-bg-surface/80 backdrop-blur-xl p-6 xs:p-8 sm:p-10 rounded-2xl shadow-2xl border border-border/50 relative overflow-hidden ring-1 ring-white/5">
          {/* Top accent line */}
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-accent to-transparent opacity-50" />
          
          {/* Logo */}
          <div className="flex justify-center mb-6 sm:mb-8">
            <div className="h-14 w-14 sm:h-16 sm:w-16 rounded-xl bg-accent flex items-center justify-center text-black shadow-lg shadow-accent/20">
              <Command className="h-7 w-7 sm:h-8 sm:w-8" />
            </div>
          </div>

          {/* Header */}
          <div className="text-center mb-8 sm:mb-10">
            <h1 className="text-2xl sm:text-3xl font-bold text-text-primary tracking-tight leading-tight mb-2 sm:mb-3">
              {header.title}
            </h1>
            <p className="text-text-secondary font-medium text-xs sm:text-sm leading-relaxed">
              {header.subtitle}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {view === 'signup' && (
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none text-text-secondary group-focus-within:text-accent transition-colors">
                  <User className="h-5 w-5" />
                </div>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Full Name"
                  className="block w-full pl-14 pr-4 py-3.5 sm:py-4 bg-bg-primary/50 border border-border rounded-xl text-text-primary placeholder-text-secondary/50 focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all font-medium text-sm sm:text-base"
                />
              </div>
            )}

            {(view === 'signin' || view === 'signup' || view === 'forgot') && (
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none text-text-secondary group-focus-within:text-accent transition-colors">
                  <Mail className="h-5 w-5" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="block w-full pl-14 pr-4 py-3.5 sm:py-4 bg-bg-primary/50 border border-border rounded-xl text-text-primary placeholder-text-secondary/50 focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all font-medium text-sm sm:text-base"
                />
              </div>
            )}

            {(view === 'signin' || view === 'signup' || view === 'reset') && (
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none text-text-secondary group-focus-within:text-accent transition-colors">
                  <Lock className="h-5 w-5" />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={
                    view === 'reset' 
                      ? "Enter new password" 
                      : view === 'signup' 
                        ? "Create a password" 
                        : "Enter your password"
                  }
                  className="block w-full pl-14 pr-12 py-3.5 sm:py-4 bg-bg-primary/50 border border-border rounded-xl text-text-primary placeholder-text-secondary/50 focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all font-medium text-sm sm:text-base"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-5 flex items-center text-text-secondary hover:text-text-primary focus:outline-none transition-colors"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
            )}

            {view === 'signin' && (
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-1">
                <label className="flex items-center gap-2 cursor-pointer group">
                  <input 
                    type="checkbox" 
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="h-4 w-4 rounded border-border bg-bg-primary text-accent focus:ring-accent cursor-pointer transition-all"
                  />
                  <span className="text-xs text-text-secondary font-bold uppercase tracking-widest group-hover:text-text-primary transition-colors">Remember me</span>
                </label>
                <button 
                  type="button" 
                  onClick={() => {
                    setView('forgot');
                    setError(null);
                    setMessage(null);
                  }}
                  className="text-xs font-bold text-accent hover:text-accent/80 transition-colors uppercase tracking-widest text-left"
                >
                  Forgot password?
                </button>
              </div>
            )}

            <AnimatePresence mode="wait">
              {error && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 flex items-start gap-3"
                >
                  <AlertCircle className="h-5 w-5 text-red-500 shrink-0" />
                  <div className="text-sm text-red-200 font-medium">{error}</div>
                </motion.div>
              )}
              {message && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-start gap-3"
                >
                  <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0" />
                  <p className="text-sm text-emerald-200 font-medium">{message}</p>
                </motion.div>
              )}
            </AnimatePresence>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center items-center py-4 px-4 bg-accent text-black rounded-xl font-bold text-sm tracking-widest uppercase hover:scale-[1.02] active:scale-[0.98] transition-all shadow-lg shadow-accent/20 disabled:opacity-50 disabled:hover:scale-100"
            >
              {loading ? (
                <Loader2 className="h-6 w-6 animate-spin" />
              ) : (
                view === 'signup' 
                  ? 'Create Account' 
                  : view === 'forgot'
                    ? 'Send Recovery Link'
                    : view === 'reset'
                      ? 'Update Password'
                      : 'Sign In'
              )}
            </button>
          </form>

          {view === 'signin' && (
            <>
              <div className="mt-8 relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-border/50" />
                </div>
                <div className="relative flex justify-center">
                  <span className="px-4 bg-bg-surface text-text-secondary font-extrabold text-[10px] uppercase tracking-[0.3em]">
                    OR
                  </span>
                </div>
              </div>

              <button
                onClick={handleGoogleLogin}
                className="mt-8 w-full flex justify-center items-center gap-3 py-4 border border-border rounded-xl text-text-primary font-bold text-xs uppercase tracking-widest hover:bg-bg-primary/50 transition-all group"
              >
                <Chrome className="h-4 w-4 text-accent" />
                Google Workspace
              </button>
            </>
          )}

          <div className="mt-10 text-center">
            <p className="text-text-secondary font-bold text-xs">
              {view === 'forgot' ? (
                <button
                  type="button"
                  onClick={() => {
                    setView('signin');
                    setError(null);
                    setMessage(null);
                  }}
                  className="text-accent font-black hover:underline"
                >
                  Back to Sign In
                </button>
              ) : view === 'reset' ? (
                <span className="text-text-secondary/50">Resetting access credentials</span>
              ) : (
                <>
                  {view === 'signup' ? 'Already have an account?' : "Don't have an account?"}{' '}
                  <button
                    type="button"
                    onClick={() => {
                      setView(view === 'signup' ? 'signin' : 'signup');
                      setError(null);
                      setMessage(null);
                    }}
                    className="text-accent font-black hover:underline ml-1"
                  >
                    {view === 'signup' ? 'Sign in' : 'Sign up'}
                  </button>
                </>
              )}
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
