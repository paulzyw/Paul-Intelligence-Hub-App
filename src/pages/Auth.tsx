import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { supabase } from '../lib/supabase';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { 
  Mail, 
  Lock, 
  ArrowRight, 
  Github, 
  Chrome, 
  AlertCircle,
  Loader2,
  CheckCircle2,
  UserPlus,
  LogIn
} from 'lucide-react';
import { cn } from '../lib/utils';

export function Auth() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as any)?.from?.pathname || '/solutions/revos';

  // Check if user is already logged in with a valid session
  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        navigate(from, { replace: true });
      }
    });
  }, [navigate, from]);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      if (isSignUp) {
        const { data, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/auth`,
          }
        });
        
        if (signUpError) throw signUpError;

        // If email confirmation is disabled, Supabase returns a session immediately
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
        if (signInError) throw signInError;
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
    <div className="min-h-screen pt-24 pb-12 flex flex-col justify-center bg-bg-primary relative overflow-hidden">
      {/* Background Orbs */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full -z-10 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-accent/5 rounded-full blur-[120px]" />
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <div className="inline-flex items-center justify-center p-3 rounded-2xl bg-bg-surface border border-border mb-6">
            <div className="h-10 w-10 rounded-lg bg-accent flex items-center justify-center text-black font-bold text-xl">R</div>
          </div>
          <h2 className="text-3xl font-extrabold text-text-primary tracking-tight">
            {isSignUp ? 'Create your commercial identity' : 'Sign in to RevOS'}
          </h2>
          <p className="mt-2 text-sm text-text-secondary">
            {isSignUp 
              ? 'Join the intelligence ecosystem' 
              : 'Access your revenue operating system'}
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="mt-10 sm:mx-auto sm:w-full sm:max-w-md"
        >
          <div className="bg-bg-surface py-8 px-6 shadow-2xl border border-border sm:rounded-[2.5rem] rounded-3xl backdrop-blur-xl relative overflow-hidden ring-1 ring-white/5">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-accent to-transparent opacity-50" />
            
            <form className="space-y-6" onSubmit={handleAuth}>
              <div>
                <label className="block text-xs font-bold text-text-secondary uppercase tracking-widest mb-2 px-1">
                  Email Address
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-text-secondary group-focus-within:text-accent transition-colors">
                    <Mail className="h-5 w-5" />
                  </div>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="block w-full pl-11 pr-4 py-3 bg-bg-primary border border-border rounded-2xl text-text-primary placeholder-text-secondary focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all"
                    placeholder="paul@revos.ai"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-text-secondary uppercase tracking-widest mb-2 px-1">
                  Password
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-text-secondary group-focus-within:text-accent transition-colors">
                    <Lock className="h-5 w-5" />
                  </div>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="block w-full pl-11 pr-4 py-3 bg-bg-primary border border-border rounded-2xl text-text-primary placeholder-text-secondary focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              <AnimatePresence mode="wait">
                {error && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-start gap-3"
                  >
                    <AlertCircle className="h-5 w-5 text-red-500 shrink-0" />
                    <p className="text-sm text-red-200">{error}</p>
                  </motion.div>
                )}
                {message && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-start gap-3"
                  >
                    <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0" />
                    <p className="text-sm text-emerald-200">{message}</p>
                  </motion.div>
                )}
              </AnimatePresence>

              <div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex justify-center items-center gap-2 py-4 px-4 border border-transparent rounded-2xl shadow-sm text-sm font-bold text-black bg-accent hover:scale-[1.02] active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-accent transition-all disabled:opacity-50 disabled:hover:scale-100"
                >
                  {loading ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <>
                      {isSignUp ? 'Create Account' : 'Sign In'} 
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </button>
              </div>
            </form>

            <div className="mt-8">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-border" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-4 bg-bg-surface text-text-secondary font-bold uppercase tracking-widest text-[10px]">
                    Or continue with
                  </span>
                </div>
              </div>

              <div className="mt-6">
                <button
                  onClick={handleGoogleLogin}
                  className="w-full flex justify-center items-center gap-3 py-3 px-4 bg-bg-primary border border-border rounded-2xl text-sm font-bold text-text-primary hover:bg-bg-primary/50 transition-all border-white/5 shadow-inner"
                >
                  <Chrome className="h-5 w-5 text-accent" />
                  Google Workspace
                </button>
              </div>
            </div>

            <div className="mt-8 text-center">
              <button
                onClick={() => {
                  setIsSignUp(!isSignUp);
                  setError(null);
                  setMessage(null);
                }}
                className="text-sm font-bold text-text-secondary hover:text-accent transition-colors inline-flex items-center gap-2 group"
              >
                {isSignUp ? (
                  <>
                    <LogIn className="h-4 w-4 group-hover:-translate-x-1 transition-transform" /> 
                    Already have an account? Sign in
                  </>
                ) : (
                  <>
                    <UserPlus className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
                    New to RevOS? Create your identity
                  </>
                )}
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
