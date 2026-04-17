import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  Cell, PieChart, Pie, ComposedChart, Line, Area, Legend
} from 'recharts';
import { 
  TrendingUp, Users, Target, Globe, Award, DollarSign, 
  Zap, Recycle, BarChart3, Filter, ChevronDown, ChevronUp, 
  ArrowRight, Search, Activity, Briefcase, ZapOff, CheckCircle2
} from 'lucide-react';
import { cn } from '../lib/utils';

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

export function Impact() {
  const [projects, setProjects] = useState<ImpactProject[]>([]);
  const [timeline, setTimeline] = useState<RevenueTimelineEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeView, setActiveView] = useState<'Financial' | 'ESG'>('Financial');
  const [filterCategory, setFilterCategory] = useState<string>('All');
  const [filterIndustry, setFilterIndustry] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedProjectId, setExpandedProjectId] = useState<number | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        const [projectsRes, timelineRes] = await Promise.all([
          fetch('/impact-master-table.json').then(res => res.json()),
          fetch('/revenue-timeline.json').then(res => res.json())
        ]);
        
        // Normalize keys and avoid passing non-standard props to Recharts/DOM
        const normalizedProjects = projectsRes.map((p: any) => {
          const { 'data-AI-Approach': dataAIOld, ...rest } = p;
          return {
            ...rest,
            dataAIApproach: p.dataAIApproach || dataAIOld
          };
        });

        setProjects(normalizedProjects);
        setTimeline(timelineRes);
      } catch (err) {
        console.error('Error loading impact data:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  // Aggregated KPIs
  const kpis = useMemo(() => {
    const totalRevenue = projects.reduce((sum, p) => sum + (p.revenue || 0), 0);
    const totalSavings = projects.reduce((sum, p) => sum + (p.costSaving || 0), 0);
    const totalProfit = projects.reduce((sum, p) => sum + (p.profitGenerated || 0), 0);
    const totalCO2 = projects.reduce((sum, p) => sum + (p.co2Reduction || 0), 0);
    const totalEnergy = projects.reduce((sum, p) => sum + (p.energySavings || 0), 0);
    const householdEquivalent = Math.floor(totalEnergy / 5000); // Rough estimate: 5MWh per household

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

  // Industry Distribution
  const industryData = useMemo(() => {
    const customerProjects = projects.filter(p => p.category === 'For Customer');
    const counts: Record<string, number> = {};
    customerProjects.forEach(p => {
      counts[p.industry] = (counts[p.industry] || 0) + 1;
    });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [projects]);

  // Revenue by Company (Employer)
  const revenueByCompany = useMemo(() => {
    const employerProjects = projects.filter(p => p.category === 'For Employer');
    const totals: Record<string, number> = {};
    employerProjects.forEach(p => {
      totals[p.company] = (totals[p.company] || 0) + (p.revenue || 0);
    });
    return Object.entries(totals)
      .map(([name, value]) => ({ name, value: value / 1000000 })) // Show in Millions
      .sort((a, b) => b.value - a.value);
  }, [projects]);

  // Timeline Data
  const timelineChartData = useMemo(() => {
    const years = [...new Set(timeline.map(t => t.year))].sort();
    let cumulative = 0;
    return years.map(year => {
      const yearEntries = timeline.filter(t => t.year === year);
      const yearRevenue = yearEntries.reduce((sum, t) => sum + t.revenueM, 0);
      cumulative += yearRevenue;
      
      const item: any = { year, cumulative: cumulative / 1000000 };
      yearEntries.forEach(entry => {
        item[entry.company] = entry.revenueM / 1000000;
      });
      return item;
    });
  }, [timeline]);

  // Filtered Projects
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

  const categories = ['All', 'For Employer', 'For Customer'];

  if (loading) {
    return (
      <div className="min-h-screen bg-bg-primary flex items-center justify-center">
        <motion.div 
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          className="w-12 h-12 border-4 border-accent border-t-transparent rounded-full"
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg-primary pt-24 pb-24 text-text-primary transition-colors duration-400">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        
        {/* HERO SECTION */}
        <div className="mb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-12"
          >
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
            <KPIItem 
              label="Revenue Delivered" 
              value={formatCurrency(kpis.revenue)} 
              icon={<DollarSign size={20} />} 
              color={PALETTE.profitGold}
            />
            <KPIItem 
              label="Customer Savings" 
              value={formatCurrency(kpis.savings)} 
              icon={<ZapOff size={20} />} 
              color={PALETTE.savingsEmerald}
            />
            <KPIItem 
              label="Profit Generated" 
              value={formatCurrency(kpis.profit)} 
              icon={<TrendingUp size={20} />} 
              color={PALETTE.profitGold}
            />
            <KPIItem 
              label="CO₂ Reduced" 
              value={`${formatNumber(kpis.co2)} Tons`} 
              icon={<Recycle size={20} />} 
              color={PALETTE.co2Green}
            />
            <KPIItem 
              label="Energy Savings" 
              value={`${formatNumber(kpis.energy)} kWh`} 
              icon={<Zap size={20} />} 
              color={PALETTE.energyBlue}
            />
            <KPIItem 
              label="Key Projects" 
              value={kpis.projectsCount.toString()} 
              icon={<Briefcase size={20} />} 
              color={PALETTE.uiDeepBlue}
            />
          </div>
        </div>

        {/* VIEW TOGGLE */}
        <div className="flex justify-center mb-12">
          <div className="bg-bg-surface border border-border p-1 rounded-full flex gap-1 shadow-lg">
            <button
              onClick={() => setActiveView('Financial')}
              className={cn(
                "px-6 py-2 rounded-full text-xs font-bold uppercase tracking-widest transition-all",
                activeView === 'Financial' ? "bg-accent text-white" : "text-text-secondary hover:text-text-primary"
              )}
            >
              Financial Impact
            </button>
            <button
              onClick={() => setActiveView('ESG')}
              className={cn(
                "px-6 py-2 rounded-full text-xs font-bold uppercase tracking-widest transition-all",
                activeView === 'ESG' ? "bg-accent text-white" : "text-text-secondary hover:text-text-primary"
              )}
            >
              ESG Impact
            </button>
          </div>
        </div>

        <AnimatePresence mode="wait">
          {activeView === 'Financial' ? (
            <motion.div
              key="financial"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="space-y-12"
            >
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Revenue by Company Chart */}
                <ChartCard title="Revenue Growth Delivered (M$)" subtitle="Employer-side absolute impact">
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={revenueByCompany} layout="vertical" margin={{ left: 40, right: 40 }}>
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E2E8F0" opacity={0.5} />
                      <XAxis type="number" hide />
                      <YAxis dataKey="name" type="category" width={80} axisLine={false} tickLine={false} style={{ fontSize: '10px', fontWeight: 'bold' }} />
                      <Tooltip 
                        cursor={{ fill: 'transparent' }}
                        contentStyle={{ 
                          borderRadius: '8px', 
                          border: 'none', 
                          boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                          backgroundColor: '#ffffff'
                        }}
                        labelStyle={{ 
                          fontWeight: 'bold', 
                          color: '#051c2c',
                          marginBottom: '4px'
                        }}
                        itemStyle={{
                          color: '#051c2c'
                        }}
                        formatter={(value: number) => [`$${value}M`, 'Revenue Impact']}
                      />
                      <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={45}>
                        {revenueByCompany.map((entry, idx) => (
                           <Cell key={`revenue-cell-${entry.name}-${idx}`} fill={entry.name === revenueByCompany[0].name ? PALETTE.profitGold : PALETTE.uiDeepBlue} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </ChartCard>

                {/* Profit by Key Industry */}
                <ChartCard title="Impact Distribution by Industry" subtitle="Customer-segment footprint">
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={industryData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {industryData.map((entry, idx) => (
                          <Cell 
                            key={`industry-cell-${entry.name}-${idx}`} 
                            fill={
                              entry.name === industryData[0].name ? PALETTE.profitGold :
                              entry.name === industryData[1].name ? PALETTE.uiDeepBlue :
                              entry.name === industryData[2].name ? PALETTE.energyBlue :
                              entry.name === industryData[3].name ? PALETTE.savingsEmerald :
                              '#CBD5E0'
                            } 
                          />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={{ borderRadius: '8px', border: 'none' }} />
                      <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '10px', textTransform: 'uppercase', fontWeight: 'bold' }} />
                    </PieChart>
                  </ResponsiveContainer>
                </ChartCard>
              </div>

              {/* Operational Excellence Section */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <MetricRing metric={0.35} label="Avg Productivity Improvement" color={PALETTE.savingsEmerald} icon={<Activity size={16} />} />
                <MetricRing metric={-0.2} label="Avg Cycle Time Reduction" color={PALETTE.alertRed} icon={<BarChart3 size={16} />} />
                <MetricRing metric={0.25} label="Avg Forecast Accuracy Gain" color={PALETTE.energyBlue} icon={<Target size={16} />} />
              </div>

              {/* Top Projects Table */}
              <div className="bg-bg-surface border border-border rounded-2xl overflow-hidden shadow-xl">
                <div className="p-6 bg-ui-navy text-white">
                  <h3 className="text-sm font-bold uppercase tracking-widest flex items-center gap-2">
                    <Award size={16} className="text-profitGold" />
                    Top 5 Strategic Value Realization Projects
                  </h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead className="bg-bg-primary text-[10px] font-bold uppercase tracking-wider text-text-secondary border-b border-border">
                      <tr>
                        <th className="px-6 py-4">Project</th>
                        <th className="px-6 py-4">Company</th>
                        <th className="px-6 py-4 text-right">Value Delivered</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {[...projects].sort((a, b) => ((b.revenue || 0) + (b.costSaving || 0)) - ((a.revenue || 0) + (a.costSaving || 0))).slice(0, 5).map((project, idx) => (
                        <tr key={`top-project-${project.sn}-${idx}`} className="hover:bg-accent/5 transition-colors">
                          <td className="px-6 py-4 font-bold text-sm">{project.projectName}</td>
                          <td className="px-6 py-4 text-sm text-text-secondary">{project.company}</td>
                          <td className="px-6 py-4 text-right font-mono font-bold text-accent">
                            {formatCurrency((project.revenue || 0) + (project.costSaving || 0) + (project.profitGenerated || 0))}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="esg"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-12"
            >
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* CO2 Chart */}
                <ChartCard title="CO₂ Reduction by Key Site (Tons)" subtitle="Environmental mitigation impact">
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={[...projects].filter(p => p.co2Reduction).sort((a, b) => b.co2Reduction! - a.co2Reduction!).slice(0, 6)}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" opacity={0.5} />
                      <XAxis dataKey="projectName" hide />
                      <YAxis style={{ fontSize: '10px' }} />
                      <Tooltip contentStyle={{ borderRadius: '8px', border: 'none' }} />
                      <Bar dataKey="co2Reduction" fill={PALETTE.co2Green} radius={[4, 4, 0, 0]} barSize={40} />
                    </BarChart>
                  </ResponsiveContainer>
                </ChartCard>

                {/* Sustainability Insight */}
                <div className="bg-ui-navy rounded-2xl p-8 text-white flex flex-col justify-center relative overflow-hidden">
                   <div className="absolute -top-12 -right-12 w-48 h-48 bg-co2Green/20 rounded-full blur-3xl"></div>
                   <div className="absolute -bottom-12 -left-12 w-48 h-48 bg-energyBlue/20 rounded-full blur-3xl"></div>
                   
                   <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                     <Globe className="text-co2Green" /> Sustainability Footprint
                   </h3>
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
            </motion.div>
          )}
        </AnimatePresence>

        {/* CAREER TIMELINE */}
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
                    <stop offset="5%" stopColor={PALETTE.profitGold} stopOpacity={0.1}/>
                    <stop offset="95%" stopColor={PALETTE.profitGold} stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" opacity={0.3} />
                <XAxis dataKey="year" axisLine={false} tickLine={false} style={{ fontSize: '12px', fontWeight: 'bold' }} />
                <YAxis yAxisId="left" axisLine={false} tickLine={false} style={{ fontSize: '10px' }} />
                <YAxis yAxisId="right" orientation="right" axisLine={false} tickLine={false} style={{ fontSize: '10px' }} />
                <Tooltip 
                  contentStyle={{ 
                    borderRadius: '12px', 
                    border: 'none', 
                    boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
                    backgroundColor: '#ffffff'
                  }}
                  labelStyle={{ 
                    fontWeight: 'bold', 
                    marginBottom: '8px',
                    color: '#051c2c' 
                  }}
                  formatter={(value: number, name: string) => [`${value.toFixed(1)} M$`, name]}
                />
                <Area yAxisId="right" type="monotone" dataKey="cumulative" stroke={PALETTE.profitGold} fillOpacity={1} fill="url(#colorCumulative)" />
                <Bar yAxisId="left" dataKey="Alstom" stackId="a" fill={PALETTE.uiNavy} />
                <Bar yAxisId="left" dataKey="Hamon" stackId="a" fill={PALETTE.uiDeepBlue} />
                <Bar yAxisId="left" dataKey="AspenTech" stackId="a" fill={PALETTE.profitGold} />
                <Line yAxisId="right" type="monotone" dataKey="cumulative" stroke={PALETTE.profitGold} strokeWidth={3} dot={{ r: 4, fill: '#fff', strokeWidth: 2 }} />
              </ComposedChart>
            </ResponsiveContainer>

            {/* Phase Annotations */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
              <PhaseAnnotation label="Industrial Scale Phase" period="2008—2015" color={PALETTE.uiNavy} />
              <PhaseAnnotation label="Digital Transformation Phase" period="2016—2020" color={PALETTE.uiDeepBlue} />
              <PhaseAnnotation label="SaaS Growth Phase" period="2021—2026" color={PALETTE.profitGold} />
            </div>
          </div>
        </section>

        {/* PROJECT INTELLIGENCE EXPLORER */}
        <section id="explorer">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
            <div>
              <h2 className="text-2xl font-bold tracking-tight mb-2">Project Intelligence Explorer</h2>
              <p className="text-sm text-text-secondary">Granular technical-commercial breakdown of strategic engagements.</p>
            </div>
            
            <div className="flex flex-wrap gap-4">
              <div className="relative">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" />
                <input 
                  type="text" 
                  placeholder="Query projects..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-4 py-2 bg-bg-surface border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-accent transition-all"
                />
              </div>
              <select 
                value={filterIndustry} 
                onChange={(e) => setFilterIndustry(e.target.value)}
                className="bg-bg-surface border border-border px-4 py-2 rounded-lg text-sm font-medium"
              >
                {industries.map((ind, idx) => <option key={`${ind}-${idx}`} value={ind}>{ind}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6">
             {filteredProjects.map((project, idx) => (
               <ProjectCard 
                key={`project-card-${project.sn}-${idx}`} 
                project={project} 
                isExpanded={expandedProjectId === project.sn}
                toggleExpand={() => setExpandedProjectId(expandedProjectId === project.sn ? null : project.sn)}
               />
             ))}
          </div>
        </section>

      </div>
    </div>
  );
}

// UI HELPERS
function KPIItem({ label, value, icon, color }: { label: string, value: string, icon: React.ReactNode, color: string }) {
  return (
    <div className="bg-bg-surface border border-border p-4 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-center gap-2 mb-3">
        <div style={{ backgroundColor: `${color}15`, color }} className="p-2 rounded-lg">
          {icon}
        </div>
        <span className="text-[9px] font-black uppercase tracking-widest text-text-secondary">{label}</span>
      </div>
      <div className="text-2xl font-black tracking-tight font-mono text-text-primary">
        {value}
      </div>
    </div>
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
            strokeDasharray={175.9} 
            strokeDashoffset={175.9 * (1 - Math.abs(metric))} 
            style={{ color }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center font-mono font-bold text-sm" style={{ color }}>
          {isPositive ? '+' : ''}{Math.round(metric * 100)}%
        </div>
      </div>
      <div>
        <div className="flex items-center gap-2 text-text-secondary mb-1">
          <span style={{ color }}>{icon}</span>
          <span className="text-[10px] font-bold uppercase tracking-widest leading-none">{label}</span>
        </div>
        <div className="text-xs text-text-secondary">Measured Performance Delta</div>
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
    <div className={cn(
      "bg-bg-surface border border-border rounded-2xl transition-all duration-300 hover:shadow-lg",
      isExpanded ? "ring-2 ring-accent shadow-2xl" : "hover:border-accent/40"
    )}>
      <div 
        className="p-6 cursor-pointer flex items-center justify-between gap-4"
        onClick={toggleExpand}
      >
        <div className="flex-grow flex flex-col md:flex-row md:items-center gap-4">
          <div className="flex items-center gap-3">
             <div className={cn(
               "w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold",
               project.category === 'For Employer' ? "bg-accent/10 text-accent" : "bg-savingsEmerald/10 text-savingsEmerald"
             )}>
               {project.category === 'For Employer' ? 'E' : 'C'}
             </div>
             <div>
               <h4 className="text-base font-bold text-text-primary leading-none mb-1">{project.projectName}</h4>
               <div className="flex items-center gap-3 text-[10px] uppercase font-bold text-text-secondary tracking-widest">
                 <span>{project.company}</span>
                 <span className="w-1 h-1 bg-border rounded-full"></span>
                 <span>{project.industry}</span>
               </div>
             </div>
          </div>
        </div>
        
        <div className="flex items-center gap-6">
          <div className="hidden sm:flex flex-col items-end">
            <span className="text-[9px] uppercase font-black text-text-secondary tracking-widest">Realized Value</span>
            <span className="font-mono font-bold text-accent text-lg">{formatValue(project) || '—'}</span>
          </div>
          <button className="text-text-secondary hover:text-accent transition-colors">
            {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden border-t border-border"
          >
            <div className="p-8 grid grid-cols-1 lg:grid-cols-2 gap-12 bg-bg-primary/50">
              <div className="space-y-6">
                <div>
                  <h5 className="text-[10px] font-black uppercase tracking-widest text-text-secondary mb-3">Context & Challenge</h5>
                  <div className="bg-bg-surface border border-border p-4 rounded-xl text-sm leading-relaxed">
                    <p className="mb-4"><strong>Situation:</strong> {project.initialSituation}</p>
                    <p><strong>Primary Challenge:</strong> {project.keyChallenge}</p>
                  </div>
                </div>
                <div>
                  <h5 className="text-[10px] font-black uppercase tracking-widest text-text-secondary mb-3">Strategy & System</h5>
                  <div className="bg-bg-surface border border-border p-4 rounded-xl text-sm leading-relaxed">
                    <p className="mb-4"><strong>Strategy:</strong> {project.strategy}</p>
                    <p><strong>Solution:</strong> {project.solution}</p>
                    {project.dataAIApproach && <p className="mt-4 pt-4 border-t border-border text-accent"><strong>Data/AI Approach:</strong> {project.dataAIApproach}</p>}
                  </div>
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
                  <p className="text-lg font-light text-text-primary italic leading-relaxed">
                    "{project.impactSummary}"
                  </p>
                </div>
              </div>
            </div>
            <div className="p-4 bg-ui-navy flex items-center justify-between">
               <span className="text-[9px] text-text-hero-secondary uppercase tracking-[0.2em] font-bold">Source: Verified Professional Performance Records (2008-2026)</span>
               <div className="flex items-center gap-2 text-xs font-bold text-white">
                 <CheckCircle2 size={14} className="text-savingsEmerald" />
                 Validated Result
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
