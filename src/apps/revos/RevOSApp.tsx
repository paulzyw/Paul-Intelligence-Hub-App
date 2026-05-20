import { Routes, Route, Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { 
  LayoutDashboard, 
  Target, 
  UserCheck, 
  PieChart, 
  Settings, 
  ChevronRight,
  ShieldAlert,
  Loader2,
  Lock,
  LogOut,
  Command
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { RevOSProvider, useRevOS } from './context/RevOSContext';

// Placeholder sub-pages for now
const RevOSDashboard = () => {
  const { profile, org, signOut } = useRevOS();
  
  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">RevOS Intelligence Dashboard</h1>
          <p className="text-text-secondary">
            {org ? `Enterprise Layer: ${org.name}` : 'Personal Workspace'}
          </p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-accent/10 border border-accent/20">
            <div className="h-2 w-2 rounded-full bg-accent animate-pulse" />
            <span className="text-[10px] font-bold uppercase tracking-widest text-accent">
              Role: {profile?.role || 'Guest'}
            </span>
          </div>
          <button 
            onClick={() => signOut()}
            className="text-[10px] uppercase tracking-widest font-bold text-text-secondary hover:text-red-400 transition-colors flex items-center gap-1 px-1"
          >
            <LogOut className="h-3 w-3" /> Sign Out
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[ 'Strategic GTM', 'Lead Quality', 'Win Probability' ].map((item) => (
          <div key={item} className="p-6 rounded-2xl border border-border bg-bg-surface group hover:border-accent/30 transition-all">
            <div className="text-accent text-sm font-medium mb-2">{item}</div>
            <div className="text-2xl font-bold">-- %</div>
            <div className="text-xs text-text-secondary mt-1 italic">Initializing Intelligence Layer...</div>
          </div>
        ))}
      </div>
    </div>
  );
};

const RevOSModulePlaceholder = ({ title }: { title: string }) => (
  <div className="p-8 flex flex-col items-center justify-center h-[60vh] text-center">
    <ShieldAlert className="h-12 w-12 text-accent mb-4 animate-pulse" />
    <h1 className="text-2xl font-bold mb-2">{title} Module</h1>
    <p className="text-text-secondary max-w-md">
      This commercial intelligence layer is currently being structured in the RevOS sandbox. 
      AI Reasoning Layer (L2) configuration in progress.
    </p>
  </div>
);

const navigation = [
  { name: 'Dashboard', path: '', icon: LayoutDashboard },
  { name: 'GTMOS', path: 'gtmos', icon: Target },
  { name: 'Lead Qual', path: 'leads', icon: UserCheck },
  { name: 'Pipeline', path: 'pipeline', icon: PieChart },
  { name: 'Settings', path: 'settings', icon: Settings },
];

function RevOSContent() {
  const location = useLocation();
  const { isLoading, profile, error, signOut } = useRevOS();
  const currentPath = location.pathname.split('/').pop();

  if (isLoading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center h-[70vh]">
        <Loader2 className="h-8 w-8 text-accent animate-spin mb-4" />
        <p className="text-text-secondary font-medium uppercase tracking-[0.2em] text-xs">Calibrating Reasoners...</p>
      </div>
    );
  }

  // Display error if one exists
  if (error) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center h-[70vh] p-8 text-center animate-in fade-in duration-500">
        <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20 mb-8 max-w-md mx-auto">
          <ShieldAlert className="h-8 w-8 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-red-200 mb-2">Intelligence Sync Error</h3>
          <p className="text-sm text-red-200/80 mb-4">{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-200 text-xs font-bold rounded-lg transition-all"
          >
            Retry Connection
          </button>
        </div>
        <button 
          onClick={() => signOut()}
          className="text-text-secondary hover:text-accent transition-colors text-xs font-bold uppercase tracking-widest"
        >
          Clear Session
        </button>
      </div>
    );
  }

  // Basic access check for the sandbox
  if (!profile && !isLoading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center min-h-[60vh] p-8 text-center animate-in fade-in zoom-in-95 duration-700">
        <div className="relative mb-10">
          <div className="absolute -inset-4 bg-accent/20 rounded-full blur-2xl animate-pulse" />
          <div className="relative p-8 rounded-[2rem] bg-bg-surface border border-border/50 shadow-2xl">
            <Command className="h-12 w-12 text-accent" />
          </div>
        </div>
        
        <h2 className="text-3xl font-bold mb-4 tracking-tight">Intelligence Access Restricted</h2>
        <p className="text-text-secondary max-w-md mb-10 mx-auto leading-relaxed">
          RevOS requires an authenticated commercial identity to access the intelligence graph. 
          Please sign in with your enterprise account to continue.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <Link 
            to="/auth" 
            state={{ from: location }}
            className="px-10 py-4 bg-accent text-black font-bold rounded-2xl hover:scale-105 active:scale-95 transition-all shadow-xl shadow-accent/20 flex items-center gap-2 group"
          >
            Sign In to revOS
            <ChevronRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
          </Link>
          <button 
            onClick={() => signOut()}
            className="px-8 py-4 text-text-secondary hover:text-accent font-bold uppercase tracking-[0.2em] text-[10px] transition-colors"
          >
            Clear Stale Session
          </button>
        </div>
        
        <div className="mt-16 pt-8 border-t border-border/50 w-full max-w-xs mx-auto">
          <p className="text-[10px] uppercase tracking-[0.3em] font-extrabold text-text-secondary/50 mb-4">Security Protocol</p>
          <div className="flex justify-center gap-4 opacity-30">
            <div className="h-1 w-8 bg-border rounded-full" />
            <div className="h-1 w-8 bg-border rounded-full" />
            <div className="h-1 w-8 bg-border rounded-full" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-[80vh] overflow-hidden">
      {/* RevOS Sidebar */}
      <aside className="w-64 border-r border-border bg-bg-primary/50 hidden md:block">
        <div className="p-6">
          <div className="flex items-center gap-2 px-2 py-4 border-b border-border mb-6">
            <div className="h-8 w-8 rounded-lg bg-accent flex items-center justify-center text-black font-bold">R</div>
            <span className="font-bold tracking-tight">RevOS <span className="text-[10px] bg-accent/20 text-accent px-1.5 py-0.5 rounded ml-1">BETA</span></span>
          </div>
          
          <nav className="space-y-1">
            {navigation.map((item) => {
              const isActive = (item.path === '' && (currentPath === 'revos' || currentPath === '')) || currentPath === item.path;
              return (
                <Link
                  key={item.name}
                  to={item.path === '' ? '/solutions/revos' : `/solutions/revos/${item.path}`}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-xl transition-all",
                    isActive 
                      ? "bg-accent text-black shadow-lg shadow-accent/20" 
                      : "text-text-secondary hover:text-text-primary hover:bg-bg-primary"
                  )}
                >
                  <item.icon className="h-4 w-4" />
                  {item.name}
                  {isActive && <ChevronRight className="ml-auto h-4 w-4" />}
                </Link>
              );
            })}
          </nav>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto relative bg-bg-surface/30 backdrop-blur-sm">
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            transition={{ duration: 0.2 }}
            className="h-full"
          >
            <Routes>
              <Route index element={<RevOSDashboard />} />
              <Route path="gtmos" element={<RevOSModulePlaceholder title="GTMOS" />} />
              <Route path="leads" element={<RevOSModulePlaceholder title="Lead Qualification" />} />
              <Route path="pipeline" element={<RevOSModulePlaceholder title="Pipeline Assessment" />} />
              <Route path="settings" element={<RevOSModulePlaceholder title="Settings" />} />
            </Routes>
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
}

export function RevOSApp() {
  return (
    <RevOSProvider>
      <div className="rounded-3xl border border-border bg-bg-surface overflow-hidden my-8 mx-4 sm:mx-0 shadow-2xl relative">
        <div className="absolute inset-0 bg-gradient-to-tr from-accent/5 via-transparent to-blue-500/5 pointer-events-none" />
        <RevOSContent />
      </div>
    </RevOSProvider>
  );
}

