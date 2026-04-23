import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { motion, AnimatePresence, useInView } from 'motion/react';
import { supabase } from '../lib/supabase';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  Cell, PieChart, Pie, ComposedChart, Line, Area, AreaChart, Legend, Label
} from 'recharts';
import { 
  TrendingUp, TrendingDown, Users, Target, Globe, Award, DollarSign, 
  Zap, Recycle, BarChart3, Filter, ChevronDown, ChevronUp, 
  ArrowRight, Search, Activity, Briefcase, ZapOff, CheckCircle2, Lock, ShieldAlert, Key as KeyIcon, Mail, Clock, RefreshCw
} from 'lucide-react';
import { cn } from '../lib/utils';
import { Link } from 'react-router-dom';
import { logUnlockEvent } from '../hooks/useTrafficTracking';

// Static Value Palette
const PALETTE = {
  profitGold: '#ED8936',
  savingsEmerald: '#10B981',
  co2Green: '#059669',
  energyBlue: '#00a3e0',
  uiNavy: '#051c2c',
  uiDeepBlue: '#002b5c',
  alertRed: '#E53E3E',
};

interface ImpactProject {
  sn: number;
  projectName: string;
  company: string;
  category: 'For Employer' | 'For Customer';
  industry: string;
  region: string;
  timePeriod: string;
  role: string;
  customerType?: string;
  initialSituation: string;
  keyChallenge: string;
  strategy: string;
  solution: string;
  dataAIApproach?: string;
  revenue?: number;
  revenueGrowthPercent?: number;
  pipeline?: number;
  dealSizeIncreasePercent?: number;
  marginImprovementPercent?: number;
  ebitdaImpact?: string;
  costToRevenueImprovementPercent?: number;
  productivityIncreasePercent?: number;
  cycleTimeReductionPercent?: number;
  forecastAccuracyImprovementPercent?: number;
  systemImplemented?: string;
  modelsBuilt?: string;
  decisionSpeedImprovementPercent?: number;
  timeRecurrence?: string;
  regionCovered?: string;
  impactSummary: string;
  co2Reduction?: number;
  energySavings?: number;
  costSaving?: number;
  profitGenerated?: number;
  sites?: number;
}

interface RevenueTimelineEntry {
  year: number;
  company: string;
  revenueM: number;
}

const formatCurrency = (val: number) => {
  if (val >= 1000000000) return `$${(val / 1000000000).toFixed(1)}B`;
  if (val >= 1000000) return `$${(val / 1000000).toFixed(1)}M`;
  return `$${val.toLocaleString()}`;
};

const formatNumber = (val: number) => {
  if (val >= 1000000) return `${(val / 1000000).toFixed(1)}M`;
  if (val >= 1000) return `${(val / 1000).toFixed(1)}K`;
  return val.toLocaleString();
};

// ===============================================================
// 1. GATE COMPONENT
// ===============================================================
function ImpactGate({ onAuthorized }: { onAuthorized: () => void }) {
  const [inputCode, setInputCode] = useState('');
  const [showInput, setShowInput] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [isLocked, setIsLocked] = useState(false);
  const [lockoutTime, setLockoutTime] = useState(0);
  
  // Backdoor state
  const [clickCount, setClickCount] = useState(0);
  const [lastClickTime, setLastClickTime] = useState(0);

  useEffect(() => {
    let timer: any;
    if (isLocked && lockoutTime > 0) {
      timer = setInterval(() => {
        setLockoutTime(prev => {
          if (prev <= 1) {
            setIsLocked(false);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [isLocked, lockoutTime]);

  const handleBackdoor = () => {
    const now = Date.now();
    if (now - lastClickTime < 1000) {
      const newCount = clickCount + 1;
      setClickCount(newCount);
      if (newCount === 5) {
        logUnlockEvent('/impact');
        onAuthorized();
      }
    } else {
      setClickCount(1);
    }
    setLastClickTime(now);
  };

  const validateCode = async () => {
    if (isLocked) return;
    setError(null);
    
    try {
      const { data, error: supabaseError } = await supabase
        .from('temp_access_codes')
        .select('*')
        .eq('code', inputCode)
        .gt('expires_at', new Date().toISOString())
        .maybeSingle();
        
      if (data) {
        logUnlockEvent('/impact');
        onAuthorized();
      } else {
        const newAttempts = failedAttempts + 1;
        setFailedAttempts(newAttempts);
        setError('Invalid or expired access code.');
        if (newAttempts >= 3) {
          setIsLocked(true);
          setLockoutTime(60);
          setFailedAttempts(0);
        }
      }
    } catch (err) {
      console.error('Validation error:', err);
      setError('An error occurred during validation.');
    }
  };

  return (
    <div className="min-h-screen bg-[#051c2c] flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-md w-full bg-bg-surface p-8 rounded-2xl border border-border shadow-2xl relative overflow-hidden"
      >
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-accent via-energyBlue to-accent"></div>
        
        <div className="mb-8 text-center">
          <div className="w-16 h-16 bg-accent/10 text-accent rounded-full flex items-center justify-center mx-auto mb-4">
            <Lock size={32} />
          </div>
          <h1 
            onClick={handleBackdoor}
            className="text-2xl font-black tracking-tight text-text-primary mb-2 select-none cursor-default"
          >
            PROTECTED CONTENT
          </h1>
          <p className="text-sm text-text-secondary leading-relaxed">
            Confidential strategic intelligence. Authorized access only.
          </p>
        </div>

        <div className="space-y-4">
          <Link 
            to="/contact"
            className="w-full py-4 px-6 border border-border rounded-xl flex items-center justify-between group hover:border-accent transition-all bg-bg-primary/30"
          >
            <div className="flex items-center gap-3">
              <Mail size={18} className="text-text-secondary group-hover:text-accent" />
              <span className="text-sm font-bold text-text-primary">Request Access Code</span>
            </div>
            <ArrowRight size={16} className="text-text-secondary opacity-0 group-hover:opacity-100 transition-all" />
          </Link>

          {!showInput ? (
            <button 
              onClick={() => setShowInput(true)}
              className="w-full py-4 px-6 bg-accent text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-accent/90 shadow-lg shadow-accent/20 transition-all"
            >
              <KeyIcon size={18} /> Enter Access Code
            </button>
          ) : (
            <div className="space-y-4 animate-in fade-in zoom-in duration-300">
              <div className="relative">
                <input 
                  type="text" 
                  maxLength={6}
                  placeholder="000000"
                  value={inputCode}
                  onChange={(e) => setInputCode(e.target.value.replace(/[^0-9]/g, ''))}
                  disabled={isLocked}
                  className="w-full px-4 py-4 bg-bg-primary border border-border rounded-xl text-center text-2xl font-mono tracking-[0.5em] font-black focus:outline-none focus:border-accent disabled:opacity-50"
                />
                {isLocked && (
                  <div className="absolute inset-0 bg-bg-surface/90 rounded-xl flex items-center justify-center gap-2 text-alertRed font-bold text-sm">
                    <Clock size={16} /> Locked: {lockoutTime}s
                  </div>
                )}
              </div>

              {error && <div className="text-xs text-alertRed font-bold text-center flex items-center justify-center gap-1"><ShieldAlert size={14}/> {error}</div>}

              <div className="flex gap-3">
                <button 
                  onClick={() => setShowInput(false)}
                  className="flex-1 py-4 px-6 border border-border rounded-xl font-bold text-xs hover:bg-bg-primary transition-all"
                >
                  Cancel
                </button>
                <button 
                  onClick={validateCode}
                  disabled={isLocked || inputCode.length !== 6}
                  className="flex-[2] py-4 px-6 bg-accent text-white rounded-xl font-bold hover:bg-accent/90 transition-all disabled:opacity-50"
                >
                  Verify
                </button>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}

// ===============================================================
// 2. DASHBOARD DATA LAYER
// ===============================================================
// 1.5 CUSTOM TOOLTIP FOR TIMELINE
// ===============================================================
const CustomTimelineTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-white p-4 rounded-xl shadow-2xl border border-slate-100 min-w-[220px]">
        <p className="text-ui-navy font-bold text-lg mb-2 border-b border-slate-100 pb-2">{label}</p>
        <div className="space-y-3">
          {payload.map((entry: any, index: number) => {
            // Handle Total Cumulative separately (it's always there if payload is present)
            if (entry.dataKey === 'totalCumulative') {
              return (
                <div key={`tooltip-total-${index}`} className="flex justify-between items-center gap-4 text-xs font-bold pt-2 mt-2 border-t border-slate-100">
                  <span className="text-slate-600 uppercase tracking-tight">Total Portfolio Impact:</span>
                  <span className="text-slate-600 font-black">{entry.value.toFixed(1)} M$</span>
                </div>
              );
            }
            
            // Check if it's one of the stacked company bars
            const companyName = entry.dataKey;
            const companyValue = entry.value;
            const companyCumulative = data[`${companyName}Cumulative`];
            
            if (companyCumulative !== undefined) {
              return (
                <div key={`tooltip-company-${index}`} className="space-y-1">
                  <div className="flex justify-between items-baseline gap-4">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }}></div>
                      <span className="text-ui-navy font-bold text-sm">{companyName}:</span>
                    </div>
                    <span className="font-mono font-bold text-sm text-ui-navy">{companyValue.toFixed(1)} M$</span>
                  </div>
                  <div className="flex justify-between items-baseline gap-4 pl-4">
                    <span className="text-[10px] text-slate-600 uppercase tracking-widest font-medium">Phase Cumulative:</span>
                    <span className="text-[10px] font-bold text-slate-600">{companyCumulative.toFixed(1)} M$</span>
                  </div>
                </div>
              );
            }
            
            return null; // Don't show redundant Area entries
          })}
        </div>
      </div>
    );
  }
  return null;
};

// ===============================================================
// 2. DASHBOARD CONTAINER
// ===============================================================
function ImpactDashboardContainer() {
  const [projects, setProjects] = useState<ImpactProject[]>([]);
  const [timeline, setTimeline] = useState<RevenueTimelineEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const fetchInitiatedRef = useRef(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      console.log('Fetching intelligence clusters...');
      const [projectsRes, timelineRes] = await Promise.all([
        fetch('/impact-master-table.json').then(async (res) => {
          if (!res.ok) throw new Error(`Status ${res.status}: Projects source unreachable`);
          const text = await res.text();
          return JSON.parse(text);
        }),
        fetch('/revenue-timeline.json').then(async (res) => {
          if (!res.ok) throw new Error(`Status ${res.status}: Timeline source unreachable`);
          const text = await res.text();
          return JSON.parse(text);
        })
      ]);

      if (!Array.isArray(projectsRes)) throw new Error('Malformed project intelligence data');

      const normalizedProjects = projectsRes.map((p: any) => ({
        ...p,
        dataAIApproach: p.dataAIApproach || p['data-AI-Approach'],
        category: p.category || 'For Employer'
      }));

      setProjects(normalizedProjects);
      setTimeline(Array.isArray(timelineRes) ? timelineRes : []);
    } catch (err) {
      console.error('Data layer fault:', err);
      setError(err instanceof Error ? err.message : 'Strategic connection reset.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!fetchInitiatedRef.current) {
      fetchInitiatedRef.current = true;
      fetchData();
    }
  }, [fetchData]);

  if (loading) {
    return (
      <div className="min-h-screen bg-bg-primary flex flex-col items-center justify-center p-4">
        <div className="flex flex-col items-center gap-8 text-center max-w-sm">
          <div className="relative">
            <RefreshCw className="animate-spin text-accent" size={56} />
            <div className="absolute inset-0 flex items-center justify-center">
              <Activity size={20} className="text-accent/30" />
            </div>
          </div>
          <div>
            <div className="text-xs uppercase font-black tracking-[0.4em] text-accent mb-3 text-glow">Protocol Verified</div>
            <p className="text-[10px] uppercase font-bold text-text-secondary tracking-[0.2em] leading-relaxed">
              Decrypting Strategic Impact Clusters...
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (error || projects.length === 0) {
    return (
      <div className="min-h-screen bg-bg-primary flex flex-col items-center justify-center p-4">
        <div className="max-w-md w-full bg-bg-surface p-8 rounded-2xl border border-border text-center shadow-xl">
          <ShieldAlert className="mx-auto text-alertRed mb-4" size={48} />
          <h2 className="text-xl font-bold mb-2">Decryption Incomplete</h2>
          <p className="text-sm text-text-secondary mb-6">{error || 'Project data synchronization failed.'}</p>
          <button 
            onClick={() => {
              fetchInitiatedRef.current = false;
              fetchData();
            }}
            className="w-full py-4 bg-accent text-white rounded-xl font-bold hover:bg-accent/90 transition-all"
          >
            Retry Connection
          </button>
        </div>
      </div>
    );
  }

  return <ImpactDashboardUI projects={projects} timeline={timeline} />;
}

// ===============================================================
// 3. DASHBOARD UI COMPONENT
// ===============================================================
function ImpactDashboardUI({ projects, timeline }: { projects: ImpactProject[], timeline: RevenueTimelineEntry[] }) {
  const [activeView, setActiveView] = useState<'Financial' | 'ESG'>('Financial');
  const [filterCategory, setFilterCategory] = useState<string>('All');
  const [filterIndustry, setFilterIndustry] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedProjectId, setExpandedProjectId] = useState<number | null>(null);

  // Aggregated KPIs
  const kpis = useMemo(() => {
    const totalRevenue = projects.reduce((sum, p) => sum + (p.revenue || 0), 0);
    const totalSavings = projects.reduce((sum, p) => sum + (p.costSaving || 0), 0);
    const totalProfit = projects.reduce((sum, p) => sum + (p.profitGenerated || 0), 0);
    const totalCO2 = projects.reduce((sum, p) => sum + (p.co2Reduction || 0), 0);
    const totalEnergy = projects.reduce((sum, p) => sum + (p.energySavings || 0), 0);
    const householdEquivalent = Math.floor(totalEnergy / 5000);

    return {
      revenue: totalRevenue,
      savings: totalSavings,
      profit: totalProfit,
      co2: totalCO2,
      energy: totalEnergy,
      projectsCount: projects.length,
      households: householdEquivalent
    };
  }, [projects]);

  // Data transformations
  const industryData = useMemo(() => {
    const targetSn = [7, 8, 9, 10, 11, 15];
    const targetProjects = projects.filter(p => targetSn.includes(p.sn));
    const totals: Record<string, number> = {};
    targetProjects.forEach(p => {
      const val = (p.costSaving || 0) + (p.profitGenerated || 0);
      totals[p.industry] = (totals[p.industry] || 0) + val;
    });
    return Object.entries(totals)
      .map(([name, value]) => ({ name, value: value / 1000000 }))
      .sort((a, b) => b.value - a.value);
  }, [projects]);

  const totalIndustryImpact = useMemo(() => industryData.reduce((sum, item) => sum + item.value, 0), [industryData]);

  const revenueByCompany = useMemo(() => {
    const employerProjects = projects.filter(p => p.category === 'For Employer');
    const totals: Record<string, number> = {};
    employerProjects.forEach(p => {
      totals[p.company] = (totals[p.company] || 0) + (p.revenue || 0);
    });
    return Object.entries(totals)
      .map(([name, value]) => ({ name, value: value / 1000000 }))
      .sort((a, b) => b.value - a.value);
  }, [projects]);

  const timelineChartData = useMemo(() => {
    const years = [...new Set(timeline.map(t => t.year))].sort();
    let totalCumulative = 0;
    const companyCumulatives: Record<string, number> = {};
    
    return years.map(year => {
      const yearEntries = timeline.filter(t => t.year === year);
      const yearRevenue = yearEntries.reduce((sum, t) => sum + t.revenueM, 0);
      totalCumulative += yearRevenue;
      
      const item: any = { 
        year, 
        totalCumulative: totalCumulative / 1000000 
      };
      
      yearEntries.forEach(entry => {
        companyCumulatives[entry.company] = (companyCumulatives[entry.company] || 0) + entry.revenueM;
        item[entry.company] = entry.revenueM / 1000000;
        item[`${entry.company}Cumulative`] = companyCumulatives[entry.company] / 1000000;
      });
      
      return item;
    });
  }, [timeline]);

  const filteredProjects = useMemo(() => {
    return projects.filter(p => {
      const matchesSearch = p.projectName.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            p.impactSummary.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            p.company.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = filterCategory === 'All' || p.category === filterCategory;
      const matchesIndustry = filterIndustry === 'All' || p.industry === filterIndustry;
      return matchesSearch && matchesCategory && matchesIndustry;
    });
  }, [projects, searchQuery, filterCategory, filterIndustry]);

  const industries = useMemo(() => {
    const uniqueIndustries = [...new Set(projects.map(p => p.industry))];
    return ['All', ...uniqueIndustries.filter(ind => ind !== 'All')];
  }, [projects]);

  return (
    <div className="min-h-screen bg-bg-primary pt-24 pb-24 text-text-primary transition-colors duration-400">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        
        {/* HERO SECTION */}
        <div className="mb-16">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-12">
            <span className="inline-block px-3 py-1 bg-accent/10 text-accent text-xs font-bold rounded-full uppercase tracking-[0.2em] mb-4">
              Impact Analytics
            </span>
            <h1 className="text-4xl md:text-6xl font-black mb-6 tracking-tight">
              Impact & <span className="text-accent underline decoration-4 underline-offset-8">Value.</span>
            </h1>
            <p className="text-xl text-text-secondary max-w-3xl font-light leading-relaxed">
              Driving measurable business impact through data, AI, and strategic transformation. 
              A 15-year retrospective on high-stakes enterprise value creation.
            </p>
          </motion.div>

          {/* KPI GRID */}
          <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
            <KPIItem label="Revenue Delivered" value={formatCurrency(kpis.revenue)} icon={<DollarSign size={20} />} color={PALETTE.profitGold} />
            <KPIItem label="Customer Savings" value={formatCurrency(kpis.savings)} icon={<ZapOff size={20} />} color={PALETTE.savingsEmerald} />
            <KPIItem label="Profit Generated" value={formatCurrency(kpis.profit)} icon={<TrendingUp size={20} />} color={PALETTE.profitGold} />
            <KPIItem label="CO₂ Reduced" value={`${formatNumber(kpis.co2)} Tons`} icon={<Recycle size={20} />} color={PALETTE.co2Green} />
            <KPIItem label="Energy Savings" value={`${formatNumber(kpis.energy)} kWh`} icon={<Zap size={20} />} color={PALETTE.energyBlue} />
            <KPIItem label="Key Projects" value={kpis.projectsCount.toString()} icon={<Briefcase size={20} />} color={PALETTE.uiDeepBlue} />
          </div>
        </div>

        {/* VIEW TOGGLE */}
        <div className="flex justify-center mb-12">
          <div className="bg-bg-surface border border-border p-1 rounded-full flex gap-1 shadow-lg">
            {(['Financial', 'ESG'] as const).map(view => (
              <button
                key={view}
                onClick={() => setActiveView(view)}
                className={cn(
                  "px-6 py-2 rounded-full text-xs font-bold uppercase tracking-widest transition-all",
                  activeView === view ? "bg-accent text-white" : "text-text-secondary hover:text-text-primary"
                )}
              >
                {view} Impact
              </button>
            ))}
          </div>
        </div>

        <AnimatePresence mode="wait">
          {activeView === 'Financial' ? (
            <motion.div key="financial" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="space-y-12">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <ChartCard title="Revenue Growth Delivered (M$)" subtitle="Employer-side absolute impact">
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={revenueByCompany} layout="vertical" margin={{ left: 40, right: 40 }}>
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E2E8F0" opacity={0.5} />
                      <XAxis type="number" hide />
                      <YAxis dataKey="name" type="category" width={80} axisLine={false} tickLine={false} style={{ fontSize: '10px', fontWeight: 'bold' }} />
                      <Tooltip 
                        cursor={{ fill: 'transparent' }}
                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', backgroundColor: '#ffffff' }}
                        labelStyle={{ fontWeight: 'bold', color: '#051c2c', marginBottom: '4px' }}
                        itemStyle={{ color: '#051c2c' }}
                        formatter={(value: number) => [`$${value}M`, 'Revenue Impact']}
                      />
                      <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={45}>
                        {revenueByCompany.map((entry, idx) => (
                           <Cell key={`revenue-cell-${entry.name}-${idx}`} fill={idx === 0 ? PALETTE.profitGold : PALETTE.uiDeepBlue} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </ChartCard>

                <ChartCard title="Impact Distribution by Industry" subtitle="Customer Value Created-segment footprint">
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie data={industryData} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={5} dataKey="value">
                        {industryData.map((entry, idx) => (
                          <Cell 
                            key={`industry-cell-${entry.name}-${idx}`} 
                            fill={
                              entry.name === 'Electric Power' ? PALETTE.profitGold :
                              entry.name === 'Oil & Gas' ? PALETTE.uiDeepBlue :
                              entry.name === 'Petrochemical' ? PALETTE.energyBlue :
                              entry.name === 'Pharmaceutical' ? PALETTE.savingsEmerald :
                              PALETTE.uiNavy
                            } 
                          />
                        ))}
                        <Label value={`$${Math.round(totalIndustryImpact)}M`} position="center" style={{ fontSize: '24px', fontWeight: 'bold', fill: 'var(--text-primary)' }} />
                      </Pie>
                      <Tooltip 
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            const { name, value } = payload[0];
                            return (
                              <div className="bg-white p-3 rounded-lg shadow-xl border-none">
                                <p className="text-ui-navy font-bold text-sm mb-1">{name}</p>
                                <p className="text-ui-navy text-sm">Value Impact: ${Number(value).toFixed(1)}M</p>
                                <p className="text-ui-navy text-sm mt-1 pt-1 border-t border-slate-100">Contribution: {((Number(value) / totalIndustryImpact) * 100).toFixed(1)}%</p>
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                      <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '10px', textTransform: 'uppercase', fontWeight: 'bold' }} />
                    </PieChart>
                  </ResponsiveContainer>
                </ChartCard>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <MetricRing metric={0.35} label="Avg Productivity Improvement" color={PALETTE.savingsEmerald} icon={<Activity size={16} />} />
                <MetricRing metric={-0.2} label="Avg Cycle Time Reduction" color={PALETTE.alertRed} icon={<BarChart3 size={16} />} />
                <MetricRing metric={0.25} label="Avg Forecast Accuracy Gain" color={PALETTE.energyBlue} icon={<Target size={16} />} />
              </div>

              <div className="bg-bg-surface border border-border rounded-2xl overflow-hidden shadow-xl">
                <div className="p-6 bg-ui-navy text-white">
                  <h3 className="text-sm font-bold uppercase tracking-widest flex items-center gap-2">
                    <Award size={16} className="text-profitGold" /> Top 5 Strategic Value Realization Projects
                  </h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead className="bg-bg-primary text-[10px] font-bold uppercase tracking-wider text-text-secondary border-b border-border">
                      <tr>
                        <th className="px-6 py-4">Project</th>
                        <th className="px-6 py-4">Company</th>
                        <th className="px-6 py-4 text-center">Growth Trend</th>
                        <th className="px-6 py-4 text-right">Value Delivered</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {[...projects].sort((a, b) => ((b.revenue || 0) + (b.costSaving || 0)) - ((a.revenue || 0) + (a.costSaving || 0))).slice(0, 5).map((project, idx) => (
                        <tr key={`top-project-${project.sn}-${idx}`} className="hover:bg-accent/5 transition-colors text-sm">
                          <td className="px-6 py-4 font-bold">{project.projectName}</td>
                          <td className="px-6 py-4 text-text-secondary">{project.company}</td>
                          <td className="px-6 py-4">
                            <div className="flex items-center justify-center gap-3">
                              {['Alstom', 'Hamon', 'AspenTech'].includes(project.company) && (
                                <div className="h-8 w-16">
                                  <Sparkline data={timeline.filter(t => t.company === project.company)} color="var(--accent)" />
                                </div>
                              )}
                              {project.revenueGrowthPercent !== undefined && project.category === 'For Employer' && (
                                <div className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black shrink-0" 
                                  style={{ backgroundColor: project.revenueGrowthPercent >= 0 ? `${PALETTE.savingsEmerald}15` : `${PALETTE.alertRed}15`, color: project.revenueGrowthPercent >= 0 ? PALETTE.savingsEmerald : PALETTE.alertRed }}>
                                  {Math.abs(project.revenueGrowthPercent)}% {project.revenueGrowthPercent >= 0 ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 text-right font-mono font-bold text-accent">
                            {formatCurrency((project.revenue || 0) + (project.costSaving || 0) + (project.profitGenerated || 0))}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* VALUE DELIVERY SECTION - Internal to Financial for immediate proximity per request */}
              <ValueDeliverySection projects={projects} />
            </motion.div>
          ) : (
            <motion.div key="esg" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-12">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <ChartCard title="CO₂ Reduction by Key Site (Tons)" subtitle="Environmental mitigation impact">
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={[...projects].filter(p => p.co2Reduction).sort((a, b) => b.co2Reduction! - a.co2Reduction!).slice(0, 6)}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" opacity={0.5} />
                      <XAxis dataKey="projectName" hide />
                      <YAxis style={{ fontSize: '10px' }} />
                      <Tooltip 
                        contentStyle={{ 
                          borderRadius: '12px', 
                          border: 'none', 
                          boxShadow: '0 10px 25px rgba(0,0,0,0.1)', 
                          backgroundColor: '#ffffff',
                          color: '#051c2c'
                        }} 
                        itemStyle={{ color: '#051c2c', fontSize: '12px' }}
                        labelStyle={{ color: '#051c2c', fontWeight: 'bold', marginBottom: '4px' }}
                      />
                      <Bar dataKey="co2Reduction" fill={PALETTE.co2Green} radius={[4, 4, 0, 0]} barSize={40} />
                    </BarChart>
                  </ResponsiveContainer>
                </ChartCard>

                <div className="bg-ui-navy rounded-2xl p-8 text-white flex flex-col justify-center relative overflow-hidden">
                   <div className="absolute -top-12 -right-12 w-48 h-48 bg-co2Green/20 rounded-full blur-3xl"></div>
                   <div className="absolute -bottom-12 -left-12 w-48 h-48 bg-energyBlue/20 rounded-full blur-3xl"></div>
                   <h3 className="text-xl font-bold mb-6 flex items-center gap-2"><Globe className="text-co2Green" /> Sustainability Footprint</h3>
                   <div className="space-y-8">
                     <div>
                       <p className="text-text-hero-secondary text-xs uppercase font-bold tracking-widest mb-1">CO₂ Mitigation Equivalent</p>
                       <p className="text-4xl font-black font-mono text-co2Green">2.2M+</p>
                       <p className="text-sm text-text-hero-secondary">Cars removed from the road annually.</p>
                     </div>
                     <div>
                       <p className="text-text-hero-secondary text-xs uppercase font-bold tracking-widest mb-1">Energy Impact</p>
                       <p className="text-4xl font-black font-mono text-energyBlue">{kpis.households.toLocaleString()}</p>
                       <p className="text-sm text-text-hero-secondary">Households powered for one year.</p>
                     </div>
                   </div>
                </div>
              </div>
              
              {/* Also showing Value Delivery Section here as it contains CO2 metrics and general methodology */}
              <ValueDeliverySection projects={projects} />
            </motion.div>
          )}
        </AnimatePresence>

        <section className="mt-24 mb-24">
          <div className="mb-8">
            <h2 className="text-2xl font-bold tracking-tight mb-2">Career Evolution Timeline</h2>
            <p className="text-sm text-text-secondary">Growth trajectory and strategic phase transition (2008—2026)(M$)</p>
          </div>
          <div className="bg-bg-surface border border-border rounded-2xl p-6 shadow-xl relative">
            <ResponsiveContainer width="100%" height={450}>
              <ComposedChart data={timelineChartData}>
                <defs>
                  <linearGradient id="colorCumulative" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={PALETTE.profitGold} stopOpacity={0.1}/><stop offset="95%" stopColor={PALETTE.profitGold} stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" opacity={0.3} />
                <XAxis dataKey="year" axisLine={false} tickLine={false} style={{ fontSize: '12px', fontWeight: 'bold' }} />
                <YAxis yAxisId="left" axisLine={false} tickLine={false} style={{ fontSize: '10px' }} />
                <YAxis yAxisId="right" orientation="right" axisLine={false} tickLine={false} style={{ fontSize: '10px' }} />
                <Tooltip content={<CustomTimelineTooltip />} />
                <Area yAxisId="right" type="monotone" dataKey="totalCumulative" stroke={PALETTE.profitGold} fillOpacity={1} fill="url(#colorCumulative)" tooltipType="none" />
                <Bar yAxisId="left" dataKey="Alstom" stackId="a" fill={PALETTE.uiNavy} />
                <Bar yAxisId="left" dataKey="Hamon" stackId="a" fill={PALETTE.uiDeepBlue} />
                <Bar yAxisId="left" dataKey="AspenTech" stackId="a" fill={PALETTE.profitGold} />
                <Line yAxisId="right" type="monotone" dataKey="totalCumulative" stroke={PALETTE.profitGold} strokeWidth={3} dot={{ r: 4, fill: '#fff', strokeWidth: 2 }} />
              </ComposedChart>
            </ResponsiveContainer>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
              <PhaseAnnotation label="Industrial Scale Phase" period="2008—2015" color={PALETTE.uiNavy} />
              <PhaseAnnotation label="Digital Transformation Phase" period="2016—2020" color={PALETTE.uiDeepBlue} />
              <PhaseAnnotation label="SaaS Growth Phase" period="2021—2026" color={PALETTE.profitGold} />
            </div>
          </div>
        </section>

        <section id="explorer">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
            <div>
              <h2 className="text-2xl font-bold tracking-tight mb-2">Project Intelligence Explorer</h2>
              <p className="text-sm text-text-secondary">Granular technical-commercial breakdown of strategic engagements.</p>
            </div>
            <div className="flex flex-wrap gap-4">
              <div className="relative">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" />
                <input type="text" placeholder="Query projects..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-10 pr-4 py-2 bg-bg-surface border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-accent transition-all" />
              </div>
              <select value={filterIndustry} onChange={(e) => setFilterIndustry(e.target.value)} className="bg-bg-surface border border-border px-4 py-2 rounded-lg text-sm font-medium">
                {industries.map((ind, idx) => <option key={`${ind}-${idx}`} value={ind}>{ind}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-1 gap-6">
             {filteredProjects.map((project, idx) => (
               <ProjectCard key={`project-card-${project.sn}-${idx}`} project={project} isExpanded={expandedProjectId === project.sn} toggleExpand={() => setExpandedProjectId(expandedProjectId === project.sn ? null : project.sn)} />
             ))}
          </div>
        </section>
      </div>
    </div>
  );
}

// ===============================================================
// 4. MAIN EXPORT - TERNARY SWITCHER
// ===============================================================
export function Impact() {
  const [isAuthorized, setIsAuthorized] = useState(() => {
    try {
      return sessionStorage.getItem('impact_authorized') === 'true';
    } catch (e) {
      return false;
    }
  });

  const handleAuthorized = () => {
    try {
      sessionStorage.setItem('impact_authorized', 'true');
    } catch (e) {
      console.warn('SessionStorage blocked.');
    }
    setIsAuthorized(true);
  };

  // CLEAN TERNARY RENDERING: Unmounts the Gate when authorized
  return (
    <AnimatePresence mode="wait">
      {isAuthorized ? (
        <motion.div key="dashboard" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <ImpactDashboardContainer />
        </motion.div>
      ) : (
        <motion.div key="gate" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <ImpactGate onAuthorized={handleAuthorized} />
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function CountUp({ value, suffix = "", prefix = "", duration = 2, decimals = 0 }: { value: number | string, suffix?: string, prefix?: string, duration?: number, decimals?: number }) {
  const [displayValue, setDisplayValue] = useState(0);
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-20px" });
  const targetValue = typeof value === 'string' ? parseFloat(value.replace(/[^0-9.]/g, '')) : value;
  
  useEffect(() => {
    if (!isInView) return;

    let startTime: number;
    let animationFrame: number;

    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / (duration * 1000), 1);
      
      const easeOutQuad = (t: number) => t * (2 - t);
      const currentVal = (easeOutQuad(progress) * targetValue);
      
      setDisplayValue(currentVal);

      if (progress < 1) {
        animationFrame = requestAnimationFrame(animate);
      }
    };

    animationFrame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationFrame);
  }, [targetValue, duration, isInView]);

  return (
    <motion.span
      ref={ref}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={isInView ? { opacity: 1, scale: 1 } : {}}
      transition={{ type: "spring", stiffness: 100 }}
    >
      {prefix}{displayValue.toLocaleString(undefined, { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}{suffix}
    </motion.span>
  );
}

function ValueDeliverySection({ projects }: { projects: ImpactProject[] }) {
  const [hoveredSide, setHoveredSide] = useState<'employer' | 'customer' | null>(null);

  const metrics = useMemo(() => {
    // Employer Metrics
    const aspenTech = projects.find(p => p.company === 'AspenTech' && p.category === 'For Employer');
    const revenueGrowth = aspenTech?.revenueGrowthPercent || 280;
    
    const projectsWithForecast = projects.filter(p => p.forecastAccuracyImprovementPercent);
    const avgForecast = projectsWithForecast.length > 0 
      ? Math.round(projectsWithForecast.reduce((sum, p) => sum + p.forecastAccuracyImprovementPercent!, 0) / projectsWithForecast.length) 
      : 25;

    const projectsWithCycle = projects.filter(p => p.cycleTimeReductionPercent);
    const avgCycle = projectsWithCycle.length > 0 
      ? Math.round(Math.abs(projectsWithCycle.reduce((sum, p) => sum + p.cycleTimeReductionPercent!, 0) / projectsWithCycle.length)) 
      : 20;

    // Customer Metrics
    const customerProjects = projects.filter(p => p.category === 'For Customer');
    const costSaving = customerProjects.reduce((sum, p) => sum + (p.costSaving || 0), 0);
    const profitIncrease = customerProjects.reduce((sum, p) => sum + (p.profitGenerated || 0), 0);
    const co2Reduced = projects.reduce((sum, p) => sum + (p.co2Reduction || 0), 0);

    return {
      revenueGrowth,
      avgForecast,
      avgCycle,
      costSaving,
      profitIncrease,
      co2Reduced
    };
  }, [projects]);

  // Hierarchy Animation Variants
  const containerVariants: any = {
    hidden: { opacity: 0, y: 30 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { 
        duration: 0.8,
        ease: "easeOut",
        staggerChildren: 0.2,
        when: "beforeChildren"
      }
    }
  };

  const panelVariants = (side: 'left' | 'right'): any => ({
    hidden: { 
      opacity: 0, 
      x: side === 'left' ? -40 : 40 
    },
    visible: { 
      opacity: 1, 
      x: 0,
      transition: { 
        duration: 0.7, 
        ease: [0.22, 1, 0.36, 1], // easeOutQuart
        staggerChildren: 0.15 
      }
    }
  });

  const layerVariants: any = {
    hidden: { opacity: 0, y: 15 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.5, ease: "easeOut" } 
    }
  };

  const connectorVariants: any = {
    hidden: { opacity: 0, scale: 0.85 },
    visible: { 
      opacity: 1, 
      scale: 1,
      transition: { 
        delay: 1.2,
        duration: 0.6,
        type: "spring",
        stiffness: 100
      }
    }
  };

  return (
    <motion.section 
      variants={containerVariants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.1 }}
      className="mt-24 mb-32"
    >
      <motion.div variants={layerVariants} className="mb-8 pl-0">
        <h2 className="text-2xl font-bold tracking-tight mb-2 text-text-primary">How Value Is Delivered</h2>
        <p className="text-sm text-text-secondary">
          From internal transformation to external impact, driven by data and AI
        </p>
      </motion.div>

      <div className="relative">
        {/* 1. CONTENT MAPPING AREA */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* EMPLOYER MAPPING */}
          <motion.div 
            variants={panelVariants('left')}
            onHoverStart={() => setHoveredSide('employer')}
            onHoverEnd={() => setHoveredSide(null)}
            className={cn(
              "bg-bg-surface border border-border border-b-0 rounded-t-3xl p-8 pb-20 shadow-sm transition-all duration-500 group flex flex-col relative overflow-hidden",
              hoveredSide === 'employer' ? "shadow-2xl -translate-y-1 border-accent/30 bg-accent/[0.02]" : "hover:border-accent/20",
              hoveredSide === 'customer' && "opacity-60 grayscale-[0.5]"
            )}
          >
            {/* Background Glow */}
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-accent/50 to-transparent"></div>
            
            <div className="mb-8 border-b border-border pb-6">
              <h3 className="text-xl font-bold flex items-center gap-3 text-text-primary">
                <TrendingUp className="text-accent" size={24} />
                Driving Internal Growth & Transformation
              </h3>
            </div>

            <div className="space-y-6 flex-grow">
              {[
                { label: 'Strategy', points: ['Structured GTM model', 'Framework to drive competitiveness', 'Strategic partnering', 'Commercial transformation', 'Operational excellence'] },
                { label: 'Systems', points: ['Lead scoring', 'Pipeline scoring and assessment', 'Partner performance systems'] },
                { label: 'Execution', points: ['Sales productivity improvement', 'Forecast accuracy increase', 'Cycle time reduction'] },
                { label: 'Outcomes', points: ['Revenue growth', 'Margin improvement', 'Pipeline expansion'] }
              ].map((layer, idx) => (
                <motion.div 
                  key={`employer-layer-${idx}`} 
                  variants={layerVariants}
                  whileHover={{ x: 4 }}
                  className="relative pl-6 border-l-2 border-accent/20 group-hover:border-accent transition-colors"
                >
                  <div className="absolute -left-[5px] top-0 w-2 h-2 rounded-full bg-accent"></div>
                  <h4 className="text-[10px] font-black uppercase tracking-widest text-accent mb-2">{layer.label}</h4>
                  <ul className="grid grid-cols-1 gap-y-1">
                    {layer.points.map((pt, pIdx) => (
                      <li key={`employer-pt-${idx}-${pIdx}`} className="text-sm text-text-secondary flex items-start gap-2">
                         <div className="w-1.5 h-1.5 rounded-full bg-accent/30 mt-1.5 shrink-0"></div>
                         <span>{pt}</span>
                      </li>
                    ))}
                  </ul>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* CUSTOMER MAPPING */}
          <motion.div 
            variants={panelVariants('right')}
            onHoverStart={() => setHoveredSide('customer')}
            onHoverEnd={() => setHoveredSide(null)}
            className={cn(
              "bg-bg-surface border border-border border-b-0 rounded-t-3xl p-8 pb-20 shadow-sm transition-all duration-500 group flex flex-col relative overflow-hidden",
              hoveredSide === 'customer' ? "shadow-2xl -translate-y-1 border-savingsEmerald/30 bg-savingsEmerald/[0.02]" : "hover:border-savingsEmerald/20",
              hoveredSide === 'employer' && "opacity-60 grayscale-[0.5]"
            )}
          >
            {/* Background Glow */}
            <div className="absolute top-0 right-0 w-full h-1 bg-gradient-to-l from-savingsEmerald/50 to-transparent"></div>

            <div className="mb-8 border-b border-border pb-6">
              <h3 className="text-xl font-bold flex items-center gap-3 text-text-primary">
                <Target className="text-savingsEmerald" size={24} />
                Delivering Measurable Customer Impact
              </h3>
            </div>

            <div className="space-y-6 flex-grow">
              {[
                { label: 'Problem', points: ['High energy consumption', 'Inefficient operations', 'Unplanned downtime'] },
                { label: 'Data', points: ['Operational data', 'Equipment data', 'Market data'] },
                { label: 'AI / Models', points: ['Optimization models', 'Predictive maintenance', 'Planning optimization algorithms'] },
                { label: 'Deployment', points: ['Industrial systems', 'Monitoring platforms'] },
                { label: 'Outcomes', points: ['Cost saving', 'Profit increase', 'CO₂ reduction'] }
              ].map((layer, idx) => (
                <motion.div 
                  key={`customer-layer-${idx}`} 
                  variants={layerVariants} 
                  whileHover={{ x: -4 }}
                  className="relative pl-6 border-l-2 border-savingsEmerald/20 group-hover:border-savingsEmerald transition-colors"
                >
                  <div className="absolute -left-[5px] top-0 w-2 h-2 rounded-full bg-savingsEmerald"></div>
                  <h4 className="text-[10px] font-black uppercase tracking-widest text-savingsEmerald mb-2">{layer.label}</h4>
                  <ul className="grid grid-cols-1 gap-y-1">
                    {layer.points.map((pt, pIdx) => (
                      <li key={`customer-pt-${idx}-${pIdx}`} className="text-sm text-text-secondary flex items-start gap-2">
                         <div className="w-1.5 h-1.5 rounded-full bg-savingsEmerald/30 mt-1.5 shrink-0"></div>
                         <span>{pt}</span>
                      </li>
                    ))}
                  </ul>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* 2. CENTRAL CONNECTOR (FLOATING AT JOINT) */}
        <div className="flex justify-center items-center h-0 z-20 relative">
          <motion.div 
            variants={connectorVariants}
            className="bg-ui-navy border border-accent/40 text-white px-8 py-3.5 rounded-full flex items-center gap-4 shadow-[0_20px_50px_rgba(0,0,0,0.3)] backdrop-blur-md group/connector"
          >
            <motion.div 
              animate={{ scale: [1, 1.3, 1], opacity: [0.6, 1, 0.6] }}
              transition={{ repeat: Infinity, duration: 2 }}
              className="w-3 h-3 rounded-full bg-accent shadow-[0_0_15px_theme(colors.orange.500)]"
            />
            <span className="text-[10px] font-black uppercase tracking-[0.3em] whitespace-nowrap bg-gradient-to-r from-white via-accent/50 to-white bg-[length:200%_100%] animate-[shimmer_3s_infinite_linear] bg-clip-text">
              Data & AI as the Core Value Engine
            </span>
            <motion.div 
              animate={{ scale: [1, 1.3, 1], opacity: [0.6, 1, 0.6] }}
              transition={{ repeat: Infinity, duration: 2, delay: 0.5 }}
              className="w-3 h-3 rounded-full bg-white shadow-[0_0_15px_rgba(255,255,255,0.8)]"
            />
          </motion.div>
        </div>

        {/* 3. METRICS AREA (ALIGNED & INTEGRATED) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* EMPLOYER METRICS */}
          <motion.div 
            variants={layerVariants}
            className={cn(
              "bg-bg-surface border border-border border-t-0 rounded-b-3xl p-8 pt-10 shadow-sm transition-opacity duration-500",
              hoveredSide === 'customer' && "opacity-60"
            )}
          >
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-2xl font-black text-accent">
                  <CountUp value={metrics.revenueGrowth} suffix="%" />
                </div>
                <div className="text-[9px] uppercase font-bold text-text-secondary">Revenue Growth</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-black text-accent">
                  <CountUp value={metrics.avgForecast} prefix="+" suffix="%" />
                </div>
                <div className="text-[9px] uppercase font-bold text-text-secondary">Forecast Accuracy</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-black text-accent">
                  <CountUp value={metrics.avgCycle} suffix="%" />
                </div>
                <div className="text-[9px] uppercase font-bold text-text-secondary">Cycle Reduction</div>
              </div>
            </div>
          </motion.div>

          {/* CUSTOMER METRICS */}
          <motion.div 
            variants={layerVariants}
            className={cn(
              "bg-bg-surface border border-border border-t-0 rounded-b-3xl p-8 pt-10 shadow-sm transition-opacity duration-500",
              hoveredSide === 'employer' && "opacity-60"
            )}
          >
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-2xl font-black text-savingsEmerald">
                  <CountUp value={metrics.costSaving / 1000000} prefix="$" suffix="M" />
                </div>
                <div className="text-[9px] uppercase font-bold text-text-secondary">Cost Saving</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-black text-savingsEmerald">
                  <CountUp value={metrics.profitIncrease / 1000000} prefix="$" suffix="M" />
                </div>
                <div className="text-[9px] uppercase font-bold text-text-secondary">Profit Increase</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-black text-savingsEmerald">
                  <CountUp value={metrics.co2Reduced / 1000000} suffix="M Tons" decimals={1} />
                </div>
                <div className="text-[9px] uppercase font-bold text-text-secondary">CO₂ Reduced</div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </motion.section>
  );
}

// ===============================================================
// UI COMPONENTS
// ===============================================================
function KPIItem({ label, value, icon, color }: { label: string, value: string, icon: React.ReactNode, color: string }) {
  return (
    <div className="bg-bg-surface border border-border p-4 rounded-2xl shadow-sm hover:shadow-md transition-shadow flex flex-col items-center text-center">
      <div className="flex items-center gap-2 mb-3 justify-center">
        <div style={{ backgroundColor: `${color}15`, color }} className="p-2 rounded-lg">{icon}</div>
        <span className="text-[9px] font-black uppercase tracking-widest text-text-secondary">{label}</span>
      </div>
      <div className="text-xl font-black tracking-tight font-mono text-text-primary">{value}</div>
    </div>
  );
}

function Sparkline({ data, color }: { data: any[], color: string }) {
  if (!data || data.length === 0) return null;
  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={data}>
        <Area type="monotone" dataKey="revenueM" stroke={color} fill={color} fillOpacity={0.1} strokeWidth={2} isAnimationActive={false} />
      </AreaChart>
    </ResponsiveContainer>
  );
}

function ChartCard({ title, subtitle, children }: { title: string, subtitle: string, children: React.ReactNode }) {
  return (
    <div className="bg-bg-surface border border-border rounded-2xl p-6 shadow-sm">
      <div className="mb-6">
        <h3 className="text-base font-bold text-text-primary tracking-tight">{title}</h3>
        <p className="text-xs text-text-secondary uppercase tracking-widest font-medium mt-1">{subtitle}</p>
      </div>
      {children}
    </div>
  );
}

function MetricRing({ metric, label, color, icon }: { metric: number, label: string, color: string, icon: React.ReactNode }) {
  const isPositive = metric > 0;
  return (
    <div className="bg-bg-surface border border-border p-6 rounded-2xl flex items-center gap-6">
      <div className="relative w-16 h-16 flex items-center justify-center">
        <svg className="w-full h-full -rotate-90">
          <circle cx="32" cy="32" r="28" stroke="currentColor" strokeWidth="4" fill="transparent" className="text-border" />
          <circle cx="32" cy="32" r="28" stroke="currentColor" strokeWidth="4" fill="transparent" 
            strokeDasharray={175.9} strokeDashoffset={175.9 * (1 - Math.abs(metric))} style={{ color }} />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center font-mono font-bold text-sm" style={{ color }}>
          {isPositive ? '+' : ''}{Math.round(metric * 100)}%
        </div>
      </div>
      <div>
        <div className="flex items-center gap-2 text-text-secondary mb-1">
          <span style={{ color }}>{icon}</span>
          <span className="text-[10px] font-bold uppercase tracking-widest leading-none text-glow">{label}</span>
        </div>
        <div className="text-[10px] text-text-secondary italic">Performance Delta</div>
      </div>
    </div>
  );
}

function PhaseAnnotation({ label, period, color }: { label: string, period: string, color: string }) {
  return (
    <div className="flex items-center gap-4 p-4 border border-border rounded-xl">
      <div className="w-2 h-8 rounded-full" style={{ backgroundColor: color }}></div>
      <div>
        <div className="text-xs font-black uppercase tracking-widest text-text-primary">{label}</div>
        <div className="text-[10px] font-bold text-text-secondary font-mono">{period}</div>
      </div>
    </div>
  );
}

function ProjectCard({ project, isExpanded, toggleExpand }: { project: ImpactProject, isExpanded: boolean, toggleExpand: () => void }) {
  const formatValue = (p: ImpactProject) => {
    const val = (p.revenue || 0) + (p.costSaving || 0) + (p.profitGenerated || 0);
    if (val === 0) return null;
    if (val >= 1000000) return `$${(val / 1000000).toFixed(1)}M`;
    return `$${val.toLocaleString()}`;
  };

  return (
    <div className={cn("bg-bg-surface border border-border rounded-2xl transition-all duration-300", isExpanded ? "ring-2 ring-accent shadow-2xl" : "hover:border-accent/40")}>
      <div className="p-6 cursor-pointer flex items-center justify-between gap-4" onClick={toggleExpand}>
        <div className="flex-grow flex flex-col md:flex-row md:items-center gap-4">
          <div className="flex items-center gap-3">
             <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold", project.category === 'For Employer' ? "bg-accent/10 text-accent" : "bg-savingsEmerald/10 text-savingsEmerald")}>
               {project.category === 'For Employer' ? 'E' : 'C'}
             </div>
             <div>
               <h4 className="text-base font-bold text-text-primary leading-none mb-3">{project.projectName}</h4>
               <div className="flex items-center gap-2 text-[9px] uppercase font-black tracking-widest mt-2">
                 <span className="px-2 py-0.5 rounded-md" style={{ color: ['Alstom', 'AspenTech', 'Hamon'].includes(project.company) ? PALETTE.uiDeepBlue : '#64748b', backgroundColor: ['Alstom', 'AspenTech', 'Hamon'].includes(project.company) ? `${PALETTE.uiDeepBlue}15` : '#64748b15' }}>{project.company}</span>
                 <span className="px-2 py-0.5 rounded-md" style={{ color: project.industry === 'Software/SaaS' ? PALETTE.profitGold : project.industry === 'Electric Power' ? PALETTE.energyBlue : project.industry === 'Oil & Gas' ? PALETTE.alertRed : project.industry === 'Petrochemical' ? PALETTE.co2Green : project.industry === 'Pharmaceutical' ? PALETTE.savingsEmerald : PALETTE.uiNavy, backgroundColor: project.industry === 'Software/SaaS' ? `${PALETTE.profitGold}15` : project.industry === 'Electric Power' ? `${PALETTE.energyBlue}15` : project.industry === 'Oil & Gas' ? `${PALETTE.alertRed}15` : project.industry === 'Petrochemical' ? `${PALETTE.co2Green}15` : project.industry === 'Pharmaceutical' ? `${PALETTE.savingsEmerald}15` : `${PALETTE.uiNavy}15` }}>{project.industry}</span>
               </div>
             </div>
          </div>
        </div>
        <div className="flex items-center gap-6">
          <div className="hidden sm:flex flex-col items-end">
            <span className="text-[9px] uppercase font-black text-text-secondary tracking-widest">Realized Value</span>
            <span className="font-mono font-bold text-accent text-lg">{formatValue(project) || '—'}</span>
          </div>
          <button className="text-text-secondary hover:text-accent group"><ChevronDown className={cn("transition-transform duration-300", isExpanded && "rotate-180")} size={20} /></button>
        </div>
      </div>
      <AnimatePresence>
        {isExpanded && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden border-t border-border">
            <div className="p-8 grid grid-cols-1 lg:grid-cols-2 gap-12 bg-bg-primary/50">
              <div className="space-y-6">
                <div>
                  <h5 className="text-[10px] font-black uppercase tracking-widest text-text-secondary mb-3">Context & Challenge</h5>
                  <div className="bg-bg-surface border border-border p-4 rounded-xl text-sm leading-relaxed"><p className="mb-4"><strong>Situation:</strong> {project.initialSituation}</p><p><strong>Primary Challenge:</strong> {project.keyChallenge}</p></div>
                </div>
                <div>
                  <h5 className="text-[10px] font-black uppercase tracking-widest text-text-secondary mb-3">Strategy & System</h5>
                  <div className="bg-bg-surface border border-border p-4 rounded-xl text-sm leading-relaxed"><p className="mb-4"><strong>Strategy:</strong> {project.strategy}</p><p><strong>Solution:</strong> {project.solution}</p>{project.dataAIApproach && <p className="mt-4 pt-4 border-t border-border text-accent"><strong>Data/AI Approach:</strong> {project.dataAIApproach}</p>}</div>
                </div>
              </div>
              <div className="space-y-6">
                <div>
                  <h5 className="text-[10px] font-black uppercase tracking-widest text-text-secondary mb-3">Verified Impact Metrics</h5>
                  <div className="grid grid-cols-2 gap-3">
                    {project.revenue && <MetricTag label="Revenue Created" value={formatCurrency(project.revenue)} />}
                    {project.costSaving && <MetricTag label="Cost Realized" value={formatCurrency(project.costSaving)} />}
                    {project.profitGenerated && <MetricTag label="Profit Alpha" value={formatCurrency(project.profitGenerated)} />}
                    {project.co2Reduction && <MetricTag label="CO₂ Reduction" value={`${project.co2Reduction.toLocaleString()} T`} />}
                    {project.revenueGrowthPercent && <MetricTag label="Rev Growth" value={`+${project.revenueGrowthPercent}%`} />}
                    {project.productivityIncreasePercent && <MetricTag label="Productivity" value={`+${project.productivityIncreasePercent}%`} />}
                    {project.cycleTimeReductionPercent && <MetricTag label="Cycle Reduction" value={`${project.cycleTimeReductionPercent}%`} />}
                    {project.forecastAccuracyImprovementPercent && <MetricTag label="Forecast Acc" value={`+${project.forecastAccuracyImprovementPercent}%`} />}
                  </div>
                </div>
                <div>
                  <h5 className="text-[10px] font-black uppercase tracking-widest text-text-secondary mb-3">Storyline Summary</h5>
                  <p className="text-lg font-light text-text-primary italic leading-relaxed">"{project.impactSummary}"</p>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function MetricTag({ label, value }: { label: string, value: string }) {
  return (
    <div className="bg-bg-surface border border-border p-3 rounded-lg flex flex-col">
      <span className="text-[8px] uppercase font-black text-text-secondary tracking-widest mb-1">{label}</span>
      <span className="font-mono font-bold text-sm text-text-primary">{value}</span>
    </div>
  );
}
