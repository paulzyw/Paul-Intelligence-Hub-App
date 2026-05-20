import { useState, useEffect } from 'react';
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
  ChevronLeft
} from 'lucide-react';
import { cn } from '../lib/utils';

export function Auth() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<React.ReactNode | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [rememberMe, setRememberMe] = useState(false);
  
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as any)?.from?.pathname || '/solutions/revos';

  // Check if user is already logged in or handling a redirect
  useEffect(() => {
    // Initial check
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        navigate(from, { replace: true });
      }
    });

    // Listen for auth state changes (crucial for catching redirects with tokens)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user) {
        if (event === 'SIGNED_IN') {
          setMessage('Successfully authenticated. Redirecting...');
          setTimeout(() => {
            navigate(from, { replace: true });
          }, 1500);
        } else if (event === 'INITIAL_SESSION') {
          navigate(from, { replace: true });
        }
      }

      // Handle password recovery or email confirmation failure
      if (event === 'PASSWORD_RECOVERY') {
        // Handle if needed
      }
    });

    // Load remembered email
    const savedEmail = localStorage.getItem('revos_remembered_email');
    if (savedEmail) {
      setEmail(savedEmail);
      setRememberMe(true);
    }

    return () => {
      subscription.unsubscribe();
    };
  }, [navigate, from]);

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
      if (isSignUp) {
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

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-bg-primary p-6 relative overflow-hidden">
      {/* Background Orbs (matching site aesthetic) */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full -z-10 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-accent/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-1/4 left-1/4 w-[400px] h-[400px] bg-blue-500/5 rounded-full blur-[100px]" />
      </div>

      <Link 
        to="/" 
        className="absolute top-8 left-8 flex items-center gap-2 text-text-secondary hover:text-text-primary transition-colors font-bold text-sm tracking-tight"
      >
        <ChevronLeft className="h-4 w-4" />
        BACK TO HOME
      </Link>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-[440px]"
      >
        <div className="bg-bg-surface/80 backdrop-blur-xl p-10 rounded-2xl shadow-2xl border border-border/50 relative overflow-hidden ring-1 ring-white/5">
          {/* Top accent line */}
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-accent to-transparent opacity-50" />
          
          {/* Logo */}
          <div className="flex justify-center mb-8">
            <div className="h-16 w-16 rounded-xl bg-accent flex items-center justify-center text-black shadow-lg shadow-accent/20">
              <Command className="h-8 w-8" />
            </div>
          </div>

          {/* Header */}
          <div className="text-center mb-10">
            <h1 className="text-3xl font-bold text-text-primary tracking-tight leading-tight mb-3">
              {isSignUp ? 'Create Account' : 'Welcome Back'}
            </h1>
            <p className="text-text-secondary font-medium text-sm leading-relaxed">
              {isSignUp 
                ? 'Join the future of intelligence.' 
                : 'Enter your credentials to access your AI workspace.'}
            </p>
          </div>

          <form onSubmit={handleAuth} className="space-y-4">
            {isSignUp && (
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
                  className="block w-full pl-14 pr-4 py-4 bg-bg-primary/50 border border-border rounded-xl text-text-primary placeholder-text-secondary/50 focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all font-medium"
                />
              </div>
            )}

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
                className="block w-full pl-14 pr-4 py-4 bg-bg-primary/50 border border-border rounded-xl text-text-primary placeholder-text-secondary/50 focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all font-medium"
              />
            </div>

            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none text-text-secondary group-focus-within:text-accent transition-colors">
                <Lock className="h-5 w-5" />
              </div>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={isSignUp ? "Create a password" : "Enter your password"}
                className="block w-full pl-14 pr-4 py-4 bg-bg-primary/50 border border-border rounded-xl text-text-primary placeholder-text-secondary/50 focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all font-medium"
              />
            </div>

            {!isSignUp && (
              <div className="flex items-center justify-between px-1">
                <label className="flex items-center gap-2 cursor-pointer group">
                  <input 
                    type="checkbox" 
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="h-4 w-4 rounded border-border bg-bg-primary text-accent focus:ring-accent cursor-pointer transition-all"
                  />
                  <span className="text-xs text-text-secondary font-bold uppercase tracking-widest group-hover:text-text-primary transition-colors">Remember me</span>
                </label>
                <button type="button" className="text-xs font-bold text-accent hover:text-accent/80 transition-colors uppercase tracking-widest">
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
                  <p className="text-sm text-red-200 font-medium">{error}</p>
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
                isSignUp ? 'Create Account' : 'Sign In'
              )}
            </button>
          </form>

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

          <div className="mt-10 text-center">
            <p className="text-text-secondary font-bold text-xs">
              {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
              <button
                onClick={() => {
                  setIsSignUp(!isSignUp);
                  setError(null);
                  setMessage(null);
                }}
                className="text-accent font-black hover:underline ml-1"
              >
                {isSignUp ? 'Sign in' : 'Sign up'}
              </button>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
