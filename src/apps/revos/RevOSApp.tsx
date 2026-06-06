import { useState } from 'react';
import { Routes, Route, Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { 
  LayoutDashboard, 
  Target, 
  UserCheck, 
  PieChart, 
  Settings, 
  ChevronRight,
  ChevronLeft,
  ShieldAlert,
  Loader2,
  Lock,
  Command,
  Shield
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { RevOSProvider, useRevOS } from './context/RevOSContext';
import { RevOSConsole } from '../../pages/RevOSConsole';
import { GTMOSModule } from './gtmos/GTMOSModule';

// Placeholder sub-pages for now
const RevOSDashboard = () => {
  const { profile, org } = useRevOS();
  
  return (
    <div className="p-4 sm:p-6 md:p-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 sm:mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold mb-1 sm:mb-2 tracking-tight">RevOS Intelligence Dashboard</h1>
          <p className="text-text-secondary text-xs sm:text-sm">
            {org ? `Enterprise Layer: ${org.name}` : 'Personal Workspace'}
          </p>
        </div>
        <div className="flex flex-col items-start sm:items-end gap-2 shrink-0">
          <div className="flex items-center gap-2 px-3 py-1 sm:px-4 sm:py-2 rounded-full bg-accent/10 border border-accent/20">
            <div className="h-1.5 w-1.5 rounded-full bg-accent animate-pulse" />
            <span className="text-[10px] font-bold uppercase tracking-widest text-accent">
              Role: {profile?.role || 'Guest'}
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6">
        {[ 'Strategic GTM', 'Lead Quality', 'Win Probability' ].map((item) => (
          <div key={item} className="p-5 sm:p-6 rounded-2xl border border-border bg-bg-surface group hover:border-accent/30 transition-all">
            <div className="text-accent text-xs sm:text-sm font-medium mb-1.5 sm:mb-2">{item}</div>
            <div className="text-xl sm:text-2xl font-bold">-- %</div>
            <div className="text-[10px] sm:text-xs text-text-secondary mt-1 italic">Initializing Intelligence Layer...</div>
          </div>
        ))}
      </div>
    </div>
  );
};

const RevOSModulePlaceholder = ({ title }: { title: string }) => (
  <div className="p-6 sm:p-8 flex flex-col items-center justify-center min-h-[50vh] sm:h-[60vh] text-center">
    <ShieldAlert className="h-10 w-10 sm:h-12 sm:w-12 text-accent mb-4 animate-pulse" />
    <h1 className="text-xl sm:text-2xl font-bold mb-2">{title} Module</h1>
    <p className="text-text-secondary text-xs sm:text-sm max-w-md">
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
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(false);

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
      <div className="flex-1 flex flex-col items-center justify-center min-h-[60vh] p-4 sm:p-6 md:p-8 text-center animate-in fade-in zoom-in-95 duration-700">
        <div className="relative mb-6 sm:mb-10">
          <div className="absolute -inset-4 bg-accent/20 rounded-full blur-2xl animate-pulse" />
          <div className="relative p-6 sm:p-8 rounded-[2rem] bg-bg-surface border border-border/50 shadow-2xl">
            <Command className="h-10 w-10 sm:h-12 sm:w-12 text-accent" />
          </div>
        </div>
        
        <h2 className="text-2xl sm:text-3xl font-bold mb-4 tracking-tight px-2">Intelligence Access Restricted</h2>
        <p className="text-text-secondary text-xs sm:text-sm max-w-md mb-6 sm:mb-10 mx-auto leading-relaxed px-4">
          RevOS requires an authenticated commercial identity to access the intelligence graph. 
          Please sign in with your enterprise account to continue.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center items-center w-full max-w-xs sm:max-w-none px-4">
          <Link 
            to="/auth" 
            state={{ from: location }}
            className="w-full sm:w-auto px-6 py-3 sm:px-10 sm:py-4 bg-accent text-black font-bold rounded-2xl hover:scale-105 active:scale-95 transition-all shadow-xl shadow-accent/20 flex items-center justify-center gap-2 group text-sm"
          >
            Sign In to revOS
            <ChevronRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
          </Link>
          <button 
            onClick={() => signOut()}
            className="w-full sm:w-auto px-6 py-3 sm:px-8 sm:py-4 text-text-secondary hover:text-accent font-bold uppercase tracking-[0.2em] text-[10px] transition-colors"
          >
            Clear Stale Session
          </button>
        </div>
        
        <div className="mt-12 sm:mt-16 pt-6 sm:pt-8 border-t border-border/50 w-full max-w-xs mx-auto">
          <p className="text-[9px] sm:text-[10px] uppercase tracking-[0.3em] font-extrabold text-text-secondary/50 mb-3 sm:mb-4">Security Protocol</p>
          <div className="flex justify-center gap-4 opacity-30">
            <div className="h-1 w-8 bg-border rounded-full" />
            <div className="h-1 w-8 bg-border rounded-full" />
            <div className="h-1 w-8 bg-border rounded-full" />
          </div>
        </div>
      </div>
    );
  }

  const isConsole = location.pathname.includes('/solutions/revos/console');

  return (
    <div className="flex flex-col md:flex-row min-h-[60vh] md:min-h-[80vh] md:overflow-hidden w-full">
      {/* RevOS Desktop Sidebar */}
      {!isConsole && (
        <aside className={cn(
          "border-r border-border bg-bg-primary/50 hidden md:block shrink-0 transition-all duration-300 ease-in-out select-none",
          isSidebarExpanded ? "w-64" : "w-18"
        )}>
          <div className={cn("transition-all duration-300", isSidebarExpanded ? "p-6" : "p-3")}>
            {/* Header / Logo */}
            {isSidebarExpanded ? (
              <div className="flex items-center justify-between px-2 py-4 border-b border-border mb-6">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-lg bg-accent flex items-center justify-center text-black font-extrabold shadow-md shadow-accent/10 shrink-0">
                    R
                  </div>
                  <span className="font-bold tracking-tight text-sm animate-in fade-in duration-300">
                    RevOS <span className="text-[9px] bg-accent/20 text-accent px-1.5 py-0.5 rounded ml-1">BETA</span>
                  </span>
                </div>
                <button 
                  onClick={() => setIsSidebarExpanded(false)}
                  className="p-1 rounded-lg hover:bg-bg-primary text-text-secondary hover:text-text-primary transition-all cursor-pointer mr-1"
                  title="Collapse Sidebar"
                >
                  <ChevronLeft size={16} />
                </button>
              </div>
            ) : (
              <div className="flex flex-col items-center py-4 border-b border-border mb-6 gap-3">
                <div className="h-8 w-8 rounded-lg bg-accent flex items-center justify-center text-black font-extrabold shadow-md shadow-accent/15 shrink-0">
                  R
                </div>
                <button 
                  onClick={() => setIsSidebarExpanded(true)}
                  className="p-1 rounded-lg hover:bg-bg-primary text-text-secondary hover:text-text-primary transition-all cursor-pointer"
                  title="Expand Sidebar"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            )}
            
            <nav className="space-y-1">
              {navigation.map((item) => {
                const isActive = (item.path === '' && (currentPath === 'revos' || currentPath === '')) || currentPath === item.path;
                return (
                  <Link
                    key={item.name}
                    to={item.path === '' ? '/solutions/revos' : `/solutions/revos/${item.path}`}
                    title={!isSidebarExpanded ? item.name : undefined}
                    className={cn(
                      "flex items-center rounded-xl transition-all",
                      isSidebarExpanded ? "gap-3 px-3 py-2 text-sm font-medium" : "justify-center p-3 text-sm",
                      isActive 
                        ? "bg-accent text-black shadow-lg shadow-accent/20" 
                        : "text-text-secondary hover:text-text-primary hover:bg-bg-primary"
                    )}
                  >
                    <item.icon className="h-4 w-4 shrink-0" />
                    {isSidebarExpanded && (
                      <span className="animate-in fade-in duration-200 truncate">{item.name}</span>
                    )}
                    {isSidebarExpanded && isActive && <ChevronRight className="ml-auto h-4 w-4 shrink-0" />}
                  </Link>
                );
              })}

              {profile?.role === 'super_admin' && (
                <div className={cn("pt-4 border-t border-border/60", isSidebarExpanded ? "mt-6" : "mt-4")}>
                  {isSidebarExpanded ? (
                    <p className="text-[9px] uppercase tracking-[0.2em] font-extrabold text-accent/60 mb-2 px-3 truncate">
                      Administration
                    </p>
                  ) : (
                    <div className="h-px bg-border/20 my-2" />
                  )}
                  <Link
                    to="/solutions/revos/console"
                    title={!isSidebarExpanded ? "Governance Console" : undefined}
                    className={cn(
                      "flex items-center font-extrabold rounded-xl transition-all border",
                      isSidebarExpanded ? "gap-3 px-3 py-2.5 text-xs sm:text-sm" : "justify-center p-3",
                      currentPath === 'console' 
                        ? "bg-accent border-accent text-black shadow-lg shadow-accent/20" 
                        : "text-accent border-accent/20 bg-accent/5 hover:bg-accent/15 hover:text-text-primary"
                    )}
                  >
                    <Shield size={14} className="shrink-0 text-accent" />
                    {isSidebarExpanded && (
                      <span className="animate-in fade-in duration-200 truncate">Governance Console</span>
                    )}
                  </Link>
                </div>
              )}
            </nav>
          </div>
        </aside>
      )}

      {/* RevOS Mobile Sub-Navigation Header Bar */}
      {!isConsole && (
        <div className="md:hidden border-b border-border bg-bg-primary/40 backdrop-blur-md relative w-full shrink-0">
          {/* Elegant horizontal gradient mask cued to show horizontal scrolling indicator */}
          <div className="absolute right-0 top-0 bottom-0 w-12 bg-gradient-to-l from-bg-surface via-bg-surface/70 to-transparent pointer-events-none z-10" />
          
          <div 
            className="overflow-x-auto touch-pan-x scrollbar-none w-full"
            style={{ WebkitOverflowScrolling: 'touch' }}
          >
            <div className="flex px-4 py-3 min-w-max gap-2 items-center pr-12">
              <div className="h-6 w-6 rounded bg-accent flex items-center justify-center text-black font-bold text-xs mr-1 shrink-0">R</div>
              {navigation.map((item) => {
                const isActive = (item.path === '' && (currentPath === 'revos' || currentPath === '')) || currentPath === item.path;
                return (
                  <Link
                    key={item.name}
                    to={item.path === '' ? '/solutions/revos' : `/solutions/revos/${item.path}`}
                    className={cn(
                      "flex items-center gap-1.5 px-3 py-1.5 text-[10px] sm:text-xs font-bold uppercase tracking-wider rounded-lg transition-all border shrink-0",
                      isActive 
                        ? "bg-accent border-accent text-black shadow-md shadow-accent/10" 
                        : "text-text-secondary border-transparent hover:text-text-primary hover:bg-bg-primary"
                    )}
                  >
                    <item.icon className="h-3.5 w-3.5 shrink-0" />
                    <span>{item.name}</span>
                  </Link>
                );
              })}

              {profile?.role === 'super_admin' && (
                <Link
                  to="/solutions/revos/console"
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-1.5 text-[10px] sm:text-xs font-bold uppercase tracking-wider rounded-lg transition-all border shrink-0",
                    currentPath === 'console' 
                      ? "bg-accent border-accent text-black shadow-md shadow-accent/10" 
                      : "text-accent border-accent/20 bg-accent/5"
                  )}
                >
                  <Shield className="h-3.5 w-3.5 shrink-0 text-accent" />
                  <span>Console</span>
                </Link>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 overflow-x-hidden md:overflow-y-auto relative bg-bg-surface/30 backdrop-blur-sm w-full min-w-0">
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            transition={{ duration: 0.2 }}
            className="h-full w-full min-w-0"
          >
            <Routes>
              <Route index element={<RevOSDashboard />} />
              <Route path="gtmos" element={<GTMOSModule />} />
              <Route path="leads" element={<RevOSModulePlaceholder title="Lead Qualification" />} />
              <Route path="pipeline" element={<RevOSModulePlaceholder title="Pipeline Assessment" />} />
              <Route path="settings" element={<RevOSModulePlaceholder title="Settings" />} />
              <Route 
                path="console/*" 
                element={
                  profile?.role === 'super_admin' ? (
                    <RevOSConsole />
                  ) : (
                    <div className="p-8 sm:p-12 text-center bg-bg-surface border border-red-500/20 rounded-2xl max-w-md mx-auto my-12 animate-in fade-in">
                      <Lock className="h-10 w-10 text-red-500 mx-auto mb-4 animate-bounce" />
                      <h3 className="text-lg font-black text-red-200">System Elevation Required</h3>
                      <p className="text-xs text-text-secondary mt-1.5 max-w-sm mx-auto leading-relaxed">
                        This controller is exclusively restricted to super administrators of the system directory.
                      </p>
                    </div>
                  )
                } 
              />
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
      <div className="max-w-7xl mx-auto px-1.5 sm:px-6 lg:px-8 w-full my-3 sm:my-8 md:my-10">
        <div className="rounded-2xl sm:rounded-3xl border border-border bg-bg-surface overflow-hidden shadow-2xl relative w-full">
          <div className="absolute inset-0 bg-gradient-to-tr from-accent/5 via-transparent to-blue-500/5 pointer-events-none" />
          <RevOSContent />
        </div>
      </div>
    </RevOSProvider>
  );
}

