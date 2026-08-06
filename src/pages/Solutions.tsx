import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ArrowRight, 
  Brain, 
  Target, 
  UserCheck, 
  PieChart, 
  Zap, 
  CheckCircle2, 
  ShieldCheck, 
  Cpu, 
  Network, 
  BarChart3,
  Layers,
  Repeat,
  Workflow
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { cn } from '../lib/utils';
import Threads from '../components/Threads';

const challenges = [
  "Fragmented GTM execution",
  "Disconnected sales intelligence",
  "Weak qualification systems",
  "Unreliable forecasting",
  "Siloed execution",
  "Lack of organizational learning"
];

const modules = [
  {
    id: 'gtmos',
    title: 'GTMOS',
    subtitle: 'AI-Native Go-To-Market Operating System',
    description: 'Design, simulate, and optimize enterprise go-to-market strategies with AI-native intelligence.',
    role: 'Transforms strategic inputs into structured GTM intelligence, execution plans, and adaptive recommendations.',
    outcomes: ['Stronger GTM alignment', 'Better pipeline generation', 'Faster strategic execution', 'Improved revenue operations'],
    icon: Target,
    color: 'from-blue-500/20 to-indigo-500/20',
    link: '/solutions/revos/gtmos'
  },
  {
    id: 'leads',
    title: 'Leads Qualification',
    subtitle: 'AI-Powered Qualification Intelligence',
    description: 'Assess, score, and prioritize marketing leads using AI-driven commercial intelligence.',
    role: 'Evaluates business fit, buying intent, stakeholder engagement, and qualification readiness.',
    outcomes: ['Higher-quality opportunities', 'Better conversion rates', 'Stronger sales prioritization', 'Improved pipeline quality'],
    icon: UserCheck,
    color: 'from-emerald-500/20 to-teal-500/20',
    link: '/solutions/revos/leads'
  },
  {
    id: 'pipeline',
    title: 'Pipeline Intelligence',
    subtitle: 'AI-Native Opportunity Intelligence & Winning Strategy',
    description: 'Assess enterprise opportunities, optimize pursuit strategy, and improve win probability.',
    role: 'Combines commercial, stakeholder, delivery, procurement, and forecasting intelligence into one decision system.',
    outcomes: ['Higher win rates', 'Better forecast accuracy', 'Reduced opportunity risk', 'Improved executive visibility'],
    icon: PieChart,
    color: 'from-purple-500/20 to-pink-500/20',
    link: '/solutions/revos/pipeline'
  }
];

const row1 = [
  "SaaS / Software", "Enterprise Software", "Consulting", "AI Solutions", 
  "Cloud Transformation", "System Integration", "Managed Services", 
  "Engineering Solutions"
];

const row2 = [
  "Infrastructure Projects", "EPC / EP Projects", "Digital Transformation", 
  "OT/IT Solutions", "Professional Services", "Enterprise Procurement", 
  "Solution-Selling Organizations"
];

const capabilities = [
  "GTM Strategy Generation", "GTM Scenario Simulation", "GTM Plan Generation", 
  "GTM Execution Intelligence", "GTM Performance Improvement", 
  "Marketing Leads Qualification Modeling", "Leads Qualification Intelligence", 
  "Pipeline Assessment Modeling", "Pipeline Intelligence", 
  "Pipeline Winning Strategy Generation", "Organizational Learning", "Adaptive Intelligence"
];

const differences = [
  { title: "AI-Native Reasoning Architecture", icon: Brain },
  { title: "Adaptive Learning Systems", icon: Repeat },
  { title: "Organizational Intelligence", icon: Network },
  { title: "Pattern Recognition", icon: ShieldCheck },
  { title: "Intelligence Graph Architecture", icon: Workflow },
  { title: "Delivery-Aware Intelligence", icon: Cpu },
  { title: "Cross-Functional Orchestration", icon: Layers },
  { title: "Strategic Workflow Intelligence", icon: BarChart3 },
];

const matrixData = [
  // Customer & Sales Operations
  { domain: 'Customer & Sales Operations', capability: 'Customer Account Management', revos: '🔗', crm: '✅', isDomainStart: true, domainSpan: 7 },
  { domain: 'Customer & Sales Operations', capability: 'Contact Management', revos: '🔗', crm: '✅' },
  { domain: 'Customer & Sales Operations', capability: 'Opportunity Tracking', revos: '🔗', crm: '✅' },
  { domain: 'Customer & Sales Operations', capability: 'Sales Activity Management', revos: '🔗', crm: '✅' },
  { domain: 'Customer & Sales Operations', capability: 'Customer Interaction History', revos: '🔗', crm: '✅' },
  { domain: 'Customer & Sales Operations', capability: 'Pipeline Visualization', revos: '✅', crm: '✅' },
  { domain: 'Customer & Sales Operations', capability: 'Forecast Reporting', revos: '✅', crm: '✅' },

  // Go-to-Market Strategy
  { domain: 'Go-to-Market Strategy', capability: 'AI-powered GTM Strategy Design', revos: '✅', crm: '❌', isDomainStart: true, domainSpan: 9 },
  { domain: 'Go-to-Market Strategy', capability: 'Market Segmentation Intelligence', revos: '✅', crm: '❌' },
  { domain: 'Go-to-Market Strategy', capability: 'Ideal Customer Profile (ICP) Design', revos: '✅', crm: '❌' },
  { domain: 'Go-to-Market Strategy', capability: 'Buyer Persona Development', revos: '✅', crm: '❌' },
  { domain: 'Go-to-Market Strategy', capability: 'Value Proposition Design', revos: '✅', crm: '❌' },
  { domain: 'Go-to-Market Strategy', capability: 'Messaging & Positioning Framework', revos: '✅', crm: '❌' },
  { domain: 'Go-to-Market Strategy', capability: 'Revenue Motion Recommendation', revos: '✅', crm: '❌' },
  { domain: 'Go-to-Market Strategy', capability: 'GTM Execution Planning', revos: '✅', crm: '❌' },
  { domain: 'Go-to-Market Strategy', capability: 'Revenue Capacity Planning', revos: '✅', crm: '❌' },

  // Marketing & Lead Intelligence
  { domain: 'Marketing & Lead Intelligence', capability: 'AI Campaign Planning', revos: '✅', crm: '🟡', isDomainStart: true, domainSpan: 6 },
  { domain: 'Marketing & Lead Intelligence', capability: 'Revenue Evidence-based Lead Qualification', revos: '✅', crm: '❌' },
  { domain: 'Marketing & Lead Intelligence', capability: 'Buying Intent Assessment', revos: '✅', crm: '🟡' },
  { domain: 'Marketing & Lead Intelligence', capability: 'Engagement Intelligence', revos: '✅', crm: '🟡' },
  { domain: 'Marketing & Lead Intelligence', capability: 'Qualification Confidence Scoring', revos: '✅', crm: '❌' },
  { domain: 'Marketing & Lead Intelligence', capability: 'AI Qualification Recommendation', revos: '✅', crm: '❌' },

  // Opportunity Intelligence
  { domain: 'Opportunity Intelligence', capability: 'Opportunity Health Assessment', revos: '✅', crm: '🟡', isDomainStart: true, domainSpan: 8 },
  { domain: 'Opportunity Intelligence', capability: 'Win Probability Assessment', revos: '✅', crm: '🟡' },
  { domain: 'Opportunity Intelligence', capability: 'AI Winning Strategy Recommendation', revos: '✅', crm: '❌' },
  { domain: 'Opportunity Intelligence', capability: 'Stakeholder Influence Analysis', revos: '✅', crm: '❌' },
  { domain: 'Opportunity Intelligence', capability: 'Buying Committee Assessment', revos: '✅', crm: '❌' },
  { domain: 'Opportunity Intelligence', capability: 'Competitive Position Analysis', revos: '✅', crm: '❌' },
  { domain: 'Opportunity Intelligence', capability: 'Opportunity Risk Identification', revos: '✅', crm: '🟡' },
  { domain: 'Opportunity Intelligence', capability: 'Opportunity Action Recommendations', revos: '✅', crm: '❌' },

  // Revenue Intelligence
  { domain: 'Revenue Intelligence', capability: 'Revenue Pattern Recognition', revos: '✅', crm: '❌', isDomainStart: true, domainSpan: 6 },
  { domain: 'Revenue Intelligence', capability: 'Pipeline Quality Assessment', revos: '✅', crm: '🟡' },
  { domain: 'Revenue Intelligence', capability: 'Revenue Scenario Simulation', revos: '✅', crm: '❌' },
  { domain: 'Revenue Intelligence', capability: 'Revenue Forecast Intelligence', revos: '✅', crm: '🟡' },
  { domain: 'Revenue Intelligence', capability: 'AI Decision Support', revos: '✅', crm: '❌' },
  { domain: 'Revenue Intelligence', capability: 'Executive Revenue Insights', revos: '✅', crm: '🟡' },

  // Continuous Revenue Optimization
  { domain: 'Continuous Revenue Optimization', capability: 'Closed-loop Learning from Revenue Outcomes', revos: '✅', crm: '❌', isDomainStart: true, domainSpan: 5 },
  { domain: 'Continuous Revenue Optimization', capability: 'AI Recommendation Engine', revos: '✅', crm: '❌' },
  { domain: 'Continuous Revenue Optimization', capability: 'Revenue Process Optimization', revos: '✅', crm: '❌' },
  { domain: 'Continuous Revenue Optimization', capability: 'Cross-functional Revenue Orchestration', revos: '✅', crm: '❌' },
  { domain: 'Continuous Revenue Optimization', capability: 'Strategy → Execution → Learning Feedback Loop', revos: '✅', crm: '❌' }
];

const renderMatrixIcon = (value: string) => {
  if (value === '✅') {
    return (
      <div className="inline-flex items-center justify-center w-[18px] h-[18px] rounded-full border border-[#00F090] bg-[#00F090]/10 text-[#00F090] shrink-0" title="Full Capability">
        <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="3.5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
      </div>
    );
  }
  if (value === '❌') {
    return (
      <div className="inline-flex items-center justify-center w-[18px] h-[18px] rounded-full border border-[#ef4444] bg-[#ef4444]/10 text-[#ef4444] shrink-0" title="No Capability">
        <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="3.5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </div>
    );
  }
  if (value === '🟡') {
    return (
      <div className="inline-flex items-center justify-center w-[18px] h-[18px] rounded-full border border-[#f59e0b] bg-[#f59e0b]/10 text-[#f59e0b] shrink-0" title="Partial Capability">
        <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="3.5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M18 12H6" />
        </svg>
      </div>
    );
  }
  if (value === '🔗') {
    return (
      <div className="inline-flex items-center justify-center w-[18px] h-[18px] rounded-full border border-[#6366f1] bg-[#6366f1]/10 text-[#6366f1] shrink-0" title="Integrated CRM Link">
        <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="3">
          <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
        </svg>
      </div>
    );
  }
  return null;
};

export function Solutions() {
  const [activeTab, setActiveTab] = useState<'differences' | 'comparisons'>('differences');
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [isScrolled, setIsScrolled] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [scrollPosition, setScrollPosition] = useState({
    showTopGradient: false,
    showBottomGradient: true,
  });

  const [explanations, setExplanations] = useState<any[]>([]);
  const [hoveredCapability, setHoveredCapability] = useState<string | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState<{ top: number; left: number; placement: 'left' | 'right' }>({ top: 0, left: 0, placement: 'right' });
  const [hoveredIcon, setHoveredIcon] = useState<{ value: string; top: number; left: number } | null>(null);

  useEffect(() => {
    fetch('/business_capability_explanation.json')
      .then(res => {
        if (!res.ok) throw new Error('Network response was not ok');
        return res.json();
      })
      .then(data => setExplanations(data))
      .catch(err => console.error('Error fetching explanations:', err));
  }, []);

  const handleIconMouseEnter = (e: React.MouseEvent<HTMLElement>, value: string) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const left = rect.left + (rect.width / 2);
    const top = rect.top - 42;
    setHoveredIcon({ value, top, left });
  };

  const handleIconMouseLeave = () => {
    setHoveredIcon(null);
  };

  const handleMouseEnter = (e: React.MouseEvent<HTMLTableCellElement>, capabilityName: string) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    
    const tooltipWidth = 380;
    const tooltipHeight = 310; // estimate based on contents
    
    let left = rect.right + 12;
    let placement: 'left' | 'right' = 'right';
    
    // Check if there is enough space on the right of the viewport
    if (rect.right + tooltipWidth + 24 > viewportWidth) {
      if (rect.left - tooltipWidth - 12 > 0) {
        left = rect.left - tooltipWidth - 12;
        placement = 'left';
      } else {
        left = Math.max(12, viewportWidth - tooltipWidth - 12);
        placement = 'right';
      }
    }
    
    // Align vertical center
    let top = rect.top + (rect.height / 2) - (tooltipHeight / 2);
    
    // Keep fully visible within viewport
    if (top < 12) {
      top = 12;
    } else if (top + tooltipHeight + 12 > viewportHeight) {
      top = viewportHeight - tooltipHeight - 12;
    }
    
    setTooltipPosition({ top, left, placement });
    setHoveredCapability(capabilityName);
  };

  const handleMouseLeave = () => {
    setHoveredCapability(null);
  };

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    setIsScrolled(scrollTop > 10);
    
    const progress = scrollHeight - clientHeight > 0 ? (scrollTop / (scrollHeight - clientHeight)) * 100 : 0;
    setScrollProgress(progress);
    
    setScrollPosition({
      showTopGradient: scrollTop > 10,
      showBottomGradient: scrollTop + clientHeight < scrollHeight - 15,
    });

    // Dismiss tooltip on scroll to prevent orphaned floating tooltips
    setHoveredCapability(null);
    setHoveredIcon(null);
  };
  return (
    <div className="bg-bg-primary min-h-screen selection:bg-accent selection:text-black">
      {/* SECTION 1: Hero Section */}
      <section className="relative pt-32 pb-20 overflow-hidden">
        <div className="mx-auto max-w-7xl px-6 lg:px-8 text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-sm font-bold tracking-[0.2em] uppercase text-accent mb-4">
              Intelligence System
            </h2>
            <h1 className="text-4xl md:text-7xl font-extrabold tracking-tight text-text-primary mb-6 max-w-4xl mx-auto leading-[1.1]">
              AI-Native Revenue Intelligence for <br className="hidden md:block" /> 
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-text-primary via-accent to-text-primary bg-[length:200%_auto] animate-gradient">
                Complex B2B Growth
              </span>
            </h1>
            
            {/* Paragraph with background Threads animation positioned relative to it */}
            <div className="relative mb-10">
              {/* Animated Background Element centered vertically behind the paragraph */}
              <div className="absolute left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2 w-screen h-[500px] md:h-[600px] z-0 pointer-events-none overflow-hidden">
                <Threads 
                  amplitude={1.2}                // Controls wave wave movement height
                  distance={0.1}                 // Adjusts spacing/spread between fiber lines
                  enableMouseInteraction={true}  // Set to true so lines warp near cursor
                />
                {/* Subtle dark gradient overlay to ensure text contrast and legibility */}
                <div className="absolute inset-0 bg-gradient-to-b from-bg-primary/20 via-transparent to-bg-primary/40 pointer-events-none" />
              </div>
              
              <p className="relative z-10 text-lg md:text-xl text-text-secondary max-w-2xl mx-auto leading-relaxed font-medium">
                RevOS transforms go-to-market strategy, qualification intelligence, and enterprise opportunity execution into one adaptive intelligence system.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link 
                to="/solutions/revos" 
                className="group relative px-8 py-4 bg-accent text-black font-bold rounded-full overflow-hidden transition-all hover:scale-105 active:scale-95"
              >
                <div className="relative z-10 flex items-center gap-2">
                  Explore RevOS <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </div>
              </Link>
            </div>
          </motion.div>

          {/* Intelligence Visual: The 7-Layer Stack Preview */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3, duration: 0.8 }}
            className="mt-16 relative mx-auto max-w-6xl px-4 lg:px-0"
          >
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 rounded-[1.2rem] border border-border bg-bg-surface/30 backdrop-blur-3xl ring-1 ring-white/10 shadow-2xl relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-tr from-accent/5 via-transparent to-blue-500/5 pointer-events-none" />
              
              {/* Layer 1-2: Strategic Intelligence */}
              <div className="p-6 rounded-2xl bg-bg-primary/50 border border-border/50 hover:border-accent/40 transition-all group backdrop-blur-md">
                <div className="flex items-center gap-2 mb-4 text-accent">
                  <Brain className="h-4 w-4" />
                  <span className="text-[10px] font-bold tracking-widest uppercase">Layer 01-02</span>
                </div>
                <h4 className="text-sm font-bold text-text-primary mb-2">Cognitive Structuring</h4>
                <div className="space-y-1">
                  <div className="h-1 w-full bg-border rounded-full overflow-hidden">
                    <motion.div 
                      animate={{ x: ['-100%', '100%'] }} 
                      transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                      className="h-full w-1/2 bg-accent/40" 
                    />
                  </div>
                  <p className="text-[10px] text-text-secondary leading-tight italic">Normalizing raw GTM inputs into structured logic objects...</p>
                </div>
              </div>

              {/* Layer 3: Execution Intelligence */}
              <div className="p-6 rounded-2xl bg-bg-primary/50 border border-border/50 hover:border-accent/40 transition-all group backdrop-blur-md">
                <div className="flex items-center gap-2 mb-4 text-blue-400">
                  <Workflow className="h-4 w-4" />
                  <span className="text-[10px] font-bold tracking-widest uppercase">Layer 03</span>
                </div>
                <h4 className="text-sm font-bold text-text-primary mb-2">Live Execution</h4>
                <div className="flex gap-1 items-end h-6">
                  {[40, 70, 45, 90, 60].map((h, i) => (
                    <motion.div 
                      key={i}
                      initial={{ height: 0 }}
                      animate={{ height: `${h}%` }}
                      transition={{ duration: 1, delay: i * 0.1, repeat: Infinity, repeatType: 'reverse' }}
                      className="flex-1 bg-blue-500/20 rounded-t-sm border-t border-blue-500/40"
                    />
                  ))}
                </div>
                <p className="text-[10px] text-text-secondary leading-tight mt-2 italic">Tracking commercial momentum across unified workstreams.</p>
              </div>

              {/* Layer 4-5: Pattern Recognition */}
              <div className="p-6 rounded-2xl bg-bg-primary/50 border border-border/50 hover:border-accent/40 transition-all group backdrop-blur-md">
                <div className="flex items-center gap-2 mb-4 text-emerald-400">
                  <Network className="h-4 w-4" />
                  <span className="text-[10px] font-bold tracking-widest uppercase">Layer 04-05</span>
                </div>
                <h4 className="text-sm font-bold text-text-primary mb-2">Pattern Attribution</h4>
                <div className="relative h-6 flex items-center justify-center">
                  <div className="absolute inset-x-0 h-px bg-emerald-500/20" />
                  <div className="flex justify-between w-full relative">
                    {[1, 2, 3].map(i => (
                      <div key={i} className="h-2 w-2 rounded-full bg-emerald-500/40 animate-ping" />
                    ))}
                  </div>
                </div>
                <p className="text-[10px] text-text-secondary leading-tight mt-2 italic">Connecting business outcomes to strategic success patterns.</p>
              </div>

              {/* Layer 6-7: Adaptive Recommendations */}
              <div className="p-6 rounded-2xl bg-bg-primary/50 border border-border/50 hover:border-accent/40 transition-all group backdrop-blur-md">
                <div className="flex items-center gap-2 mb-4 text-purple-400">
                  <Zap className="h-4 w-4" />
                  <span className="text-[10px] font-bold tracking-widest uppercase">Layer 06-07</span>
                </div>
                <h4 className="text-sm font-bold text-text-primary mb-2">Strategic Feedback</h4>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-3 w-3 text-accent" />
                  <span className="text-[9px] font-medium text-accent uppercase tracking-tighter">Optimization Ready</span>
                </div>
                <p className="text-[10px] text-text-secondary leading-tight mt-2 italic">Proactive intelligence delivery for commercial decision makers.</p>
              </div>
            </div>

            {/* Bottom Status Bar */}
            <div className="mt-4 flex flex-wrap items-center justify-center gap-x-8 gap-y-2 opacity-50">
              <div className="flex items-center gap-2">
                <div className="h-1.5 w-1.5 rounded-full bg-accent animate-pulse" />
                <span className="text-[10px] tracking-[0.2em] font-bold uppercase">Reasoning Engine: Active</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-1.5 w-1.5 rounded-full bg-blue-500 animate-pulse" />
                <span className="text-[10px] tracking-[0.2em] font-bold uppercase">Data Graph: Synced</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-1.5 w-1.5 rounded-full bg-purple-500 animate-pulse" />
                <span className="text-[10px] tracking-[0.2em] font-bold uppercase">Pattern Node: Optimized</span>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* SECTION 2: Challenges */}
      <section className="py-24 bg-bg-surface/30 border-y border-border">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h3 className="text-3xl font-bold tracking-tight text-text-primary mb-6">
                Overcoming the Infrastructure of Inefficiency
              </h3>
              <p className="text-text-secondary leading-relaxed mb-8">
                Traditional commercial systems fail because they treat revenue as a series of disconnected events. RevOS introduces a unified intelligence layer to address core fragmentation.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {challenges.map((challenge, idx) => (
                  <motion.div 
                    key={challenge}
                    initial={{ opacity: 0, x: -10 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.1 }}
                    viewport={{ once: true }}
                    className="flex items-center gap-3 p-4 rounded-2xl bg-bg-primary border border-border group hover:border-accent/30 transition-colors"
                  >
                    <div className="h-2 w-2 rounded-full bg-accent animate-pulse" />
                    <span className="text-sm font-medium text-text-primary">{challenge}</span>
                  </motion.div>
                ))}
              </div>
            </div>
            <div className="hidden lg:block relative h-full">
              <div className="absolute -inset-10 bg-accent/10 rounded-full blur-[100px] opacity-20" />
              <div className="relative h-full rounded-[1.2rem] border border-border bg-bg-surface p-10 overflow-hidden flex flex-col justify-between shadow-2xl backdrop-blur-sm">
                <div className="absolute top-0 right-0 p-8 opacity-5">
                  <Network className="w-64 h-64 -mr-20 -mt-20" />
                </div>

                <div>
                  <div className="flex items-center gap-2 mb-6">
                    <div className="h-1.5 w-6 bg-accent rounded-full" />
                    <span className="text-[10px] font-extrabold tracking-[0.3em] uppercase text-accent">Memory Architecture</span>
                  </div>
                  <h4 className="text-3xl font-bold text-text-primary mb-4 leading-tight">Architectural Integrity</h4>
                  <p className="text-base text-text-secondary leading-relaxed max-w-sm mb-8">
                    RevOS doesn't just manage data; it builds an organizational memory of what wins. 
                    Complexity is abstracted into a unified intelligence graph.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4 mt-auto">
                  {[
                    { label: 'Signal Acquisition', icon: Cpu, desc: 'Layer 01' },
                    { label: 'Pattern Storage', icon: Layers, desc: 'Layer 02' },
                    { label: 'Attribution Logic', icon: Target, desc: 'Layer 04' },
                    { label: 'Strategic Recall', icon: Brain, desc: 'Layer 07' }
                  ].map((item, i) => (
                    <motion.div 
                      key={i}
                      initial={{ opacity: 0, y: 10 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.1 }}
                      className="p-5 rounded-2xl bg-bg-primary border border-border group hover:border-accent/40 transition-all cursor-default"
                    >
                      <div className="flex items-center gap-3 mb-3">
                        <item.icon className="h-4 w-4 text-accent" />
                        <span className="text-[10px] font-bold text-text-secondary uppercase tracking-tighter group-hover:text-accent transition-colors">{item.desc}</span>
                      </div>
                      <p className="text-sm font-bold text-text-primary group-hover:translate-x-1 transition-transform">{item.label}</p>
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 3: Ecosystem Overview */}
      <section className="py-32">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="text-center mb-20">
            <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight text-text-primary mb-4">
              The Commercial Intelligence Ecosystem
            </h2>
            <p className="text-text-secondary max-w-2xl mx-auto">
              Three specialized modules integrated into one autonomous operating system.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {modules.map((module, index) => (
              <motion.div
                key={module.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                viewport={{ once: true }}
                className="group relative flex flex-col bg-bg-surface rounded-[1.2rem] border border-border p-8 ring-1 ring-white/5 overflow-hidden hover:ring-accent/40 transition-all duration-500"
              >
                <div className={cn("absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-100 transition-opacity duration-500", module.color)} />
                
                <div className="relative h-full flex flex-col">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="p-3 rounded-2xl bg-bg-primary border border-border group-hover:bg-accent group-hover:text-black transition-all">
                      <module.icon className="h-6 w-6" />
                    </div>
                    <div>
                      <h3 className="font-bold text-xl group-hover:text-text-primary transition-colors">{module.title}</h3>
                      <p className="text-[10px] uppercase tracking-widest font-bold text-accent">{module.subtitle}</p>
                    </div>
                  </div>

                  <div className="space-y-6 flex-grow">
                    <div>
                      <p className="text-sm font-semibold text-text-primary mb-2">Strategic Description</p>
                      <p className="text-sm text-text-secondary leading-relaxed">{module.description}</p>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-text-primary mb-2">Intelligence Role</p>
                      <p className="text-sm text-text-secondary leading-relaxed border-l-2 border-accent/20 pl-4 py-1 italic">{module.role}</p>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-text-primary mb-3">Business Outcomes</p>
                      <div className="grid grid-cols-1 gap-2">
                        {module.outcomes.map(outcome => (
                          <div key={outcome} className="flex items-center gap-2 text-xs text-text-secondary">
                            <CheckCircle2 className="h-3 w-3 text-accent" />
                            {outcome}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <Link 
                    to={module.link}
                    className="mt-10 flex items-center justify-center gap-2 w-full py-4 rounded-2xl bg-bg-primary border border-border text-sm font-bold hover:bg-accent hover:text-black hover:border-accent transition-all group/btn"
                  >
                    Explore {module.title} <ArrowRight className="h-4 w-4 group-hover/btn:translate-x-1 transition-transform" />
                  </Link>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* SECTION 4: Industries */}
      <section className="py-24 bg-bg-surface/50 border-t border-border verticals-marquee-section overflow-hidden">
        <style>{`
          @keyframes marquee-left {
            0% { transform: translateX(0); }
            100% { transform: translateX(-50%); }
          }
          @keyframes marquee-right {
            0% { transform: translateX(-50%); }
            100% { transform: translateX(0); }
          }
          .animate-marquee-left {
            display: flex;
            width: max-content;
            animation: marquee-left 40s linear infinite;
          }
          .animate-marquee-right {
            display: flex;
            width: max-content;
            animation: marquee-right 40s linear infinite;
          }
          .verticals-marquee-section:hover .animate-marquee-left,
          .verticals-marquee-section:hover .animate-marquee-right {
            animation-play-state: paused;
          }
          .marquee-mask {
            mask-image: linear-gradient(to right, transparent, black 15%, black 85%, transparent);
            -webkit-mask-image: linear-gradient(to right, transparent, black 15%, black 85%, transparent);
          }
          @keyframes sweep-right {
            0% { transform: translateX(-110%); }
            100% { transform: translateX(260%); }
          }
          @keyframes sweep-left {
            0% { transform: translateX(260%); }
            100% { transform: translateX(-110%); }
          }
          .sweep-border-wrapper {
            position: relative;
            display: inline-flex;
            padding: 1px;
            border-radius: 9999px;
            overflow: hidden;
            background: rgba(128, 128, 128, 0.08);
            border: 1px solid rgba(128, 128, 128, 0.12);
            z-index: 10;
          }
          .sweep-line-container-top {
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            height: 1px;
            overflow: hidden;
            pointer-events: none;
            z-index: 5;
          }
          .sweep-line-container-bottom {
            position: absolute;
            bottom: 0;
            left: 0;
            right: 0;
            height: 1px;
            overflow: hidden;
            pointer-events: none;
            z-index: 5;
          }
          .sweep-line-top-active {
            position: absolute;
            top: 0;
            left: 0;
            width: 40%;
            height: 100%;
            background: linear-gradient(to right, transparent, var(--accent) 50%, transparent);
            animation: sweep-right 4s cubic-bezier(0.4, 0, 0.2, 1) infinite;
          }
          .sweep-line-bottom-active {
            position: absolute;
            bottom: 0;
            left: 0;
            width: 40%;
            height: 100%;
            background: linear-gradient(to right, transparent, var(--accent) 50%, transparent);
            animation: sweep-left 4s cubic-bezier(0.4, 0, 0.2, 1) infinite;
          }
          .sweep-line-top-glow {
            position: absolute;
            top: 0;
            left: 0;
            width: 40%;
            height: 100%;
            background: linear-gradient(to right, transparent, var(--accent) 50%, transparent);
            filter: blur(4px);
            opacity: 0.6;
            animation: sweep-right 4s cubic-bezier(0.4, 0, 0.2, 1) infinite;
          }
          .sweep-line-bottom-glow {
            position: absolute;
            bottom: 0;
            left: 0;
            width: 40%;
            height: 100%;
            background: linear-gradient(to right, transparent, var(--accent) 50%, transparent);
            filter: blur(4px);
            opacity: 0.6;
            animation: sweep-left 4s cubic-bezier(0.4, 0, 0.2, 1) infinite;
          }
        `}</style>
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="text-center mb-16">
            <h3 className="text-2xl font-bold text-text-primary uppercase tracking-widest mb-4">Target Verticals</h3>
            <p className="text-text-secondary">Optimized for high-complexity B2B environments.</p>
          </div>
          
          <div className="space-y-3.5 marquee-mask">
            {/* Row 1: Left to Right */}
            <div className="overflow-hidden py-1">
              <div className="animate-marquee-right flex gap-3">
                {[...row1, ...row1].map((industry, idx) => (
                  <span 
                    key={`row1-${industry}-${idx}`}
                    className="px-5 py-2.5 rounded-full border border-border bg-bg-primary text-xs font-semibold text-text-secondary hover:text-accent hover:border-accent/40 transition-all cursor-default whitespace-nowrap shrink-0"
                  >
                    {industry}
                  </span>
                ))}
              </div>
            </div>

            {/* Row 2: Right to Left */}
            <div className="overflow-hidden py-1">
              <div className="animate-marquee-left flex gap-3">
                {[...row2, ...row2].map((industry, idx) => (
                  <span 
                    key={`row2-${industry}-${idx}`}
                    className="px-5 py-2.5 rounded-full border border-border bg-bg-primary text-xs font-semibold text-text-secondary hover:text-accent hover:border-accent/40 transition-all cursor-default whitespace-nowrap shrink-0"
                  >
                    {industry}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 5: Capabilities */}
      <section className="py-32">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mb-20">
            <h2 className="text-3xl md:text-5xl font-bold tracking-tight text-text-primary text-center mb-4">Platform Capabilities</h2>
            <div className="w-24 h-1 bg-accent mx-auto rounded-full" />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {capabilities.map((cap, idx) => (
              <motion.div 
                key={cap}
                initial={{ opacity: 0, x: -10 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.05 }}
                viewport={{ once: true }}
                className="p-6 rounded-2xl bg-bg-surface border border-border hover:border-accent/30 transition-all group"
              >
                <div className="flex items-center gap-3">
                  <Zap className="h-4 w-4 text-accent animate-pulse" />
                  <span className="text-sm font-bold text-text-primary group-hover:text-accent transition-colors">{cap}</span>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* SECTION 6: Why RevOS is Different */}
      <section className="py-32 bg-accent/5 backdrop-blur-3xl overflow-hidden relative">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-accent/10 rounded-full blur-[120px] -z-10" />
        
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mb-12 text-center">
            <h2 className="text-3xl md:text-5xl font-bold tracking-tight text-text-primary mb-4">Why RevOS is Different</h2>
            <p className="text-text-secondary">Designing the future of organizational reasoning.</p>
          </div>

          {/* Slider Switch Button */}
          <div className="flex justify-center mb-16 relative">
            <div className="relative inline-flex items-center justify-center">
              
              <div className="sweep-border-wrapper">
                {/* Animating top line */}
                <div className="sweep-line-container-top">
                  <div className="sweep-line-top-glow" />
                  <div className="sweep-line-top-active" />
                </div>

                <div className="inline-flex p-1 rounded-full bg-bg-surface dark:bg-[#0c101b] shadow-inner relative z-10">
                  <button
                    onClick={() => setActiveTab('differences')}
                    className={cn(
                      "px-6 py-2 rounded-full text-xs font-extrabold tracking-wider uppercase transition-all duration-300 relative z-20",
                      activeTab === 'differences'
                        ? "text-black font-black"
                        : "text-text-secondary hover:text-text-primary"
                    )}
                  >
                    {activeTab === 'differences' && (
                      <motion.div
                        layoutId="activeTabBackground"
                        className="absolute inset-0 bg-accent rounded-full -z-10"
                        transition={{ type: "spring", stiffness: 380, damping: 30 }}
                      />
                    )}
                    Differences
                  </button>
                  <button
                    onClick={() => setActiveTab('comparisons')}
                    className={cn(
                      "px-6 py-2 rounded-full text-xs font-extrabold tracking-wider uppercase transition-all duration-300 relative z-20",
                      activeTab === 'comparisons'
                        ? "text-black font-black"
                        : "text-text-secondary hover:text-text-primary"
                    )}
                  >
                    {activeTab === 'comparisons' && (
                      <motion.div
                        layoutId="activeTabBackground"
                        className="absolute inset-0 bg-accent rounded-full -z-10"
                        transition={{ type: "spring", stiffness: 380, damping: 30 }}
                      />
                    )}
                    Comparisons
                  </button>
                </div>

                {/* Animating bottom line */}
                <div className="sweep-line-container-bottom">
                  <div className="sweep-line-bottom-glow" />
                  <div className="sweep-line-bottom-active" />
                </div>
              </div>
            </div>
          </div>

          <div className="min-h-[480px] relative flex items-center justify-center w-full">
            {activeTab === 'differences' ? (
              <motion.div
                key="differences"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4 }}
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 w-full"
              >
                {differences.map((diff, index) => (
                  <motion.div
                    key={diff.title}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    viewport={{ once: true }}
                    className="flex flex-col items-center text-center group"
                  >
                    <div className="mb-6 p-5 rounded-3xl bg-bg-primary border border-border ring-1 ring-white/5 group-hover:scale-110 group-hover:border-accent group-hover:shadow-[0_0_30px_rgba(var(--accent-rgb),0.2)] transition-all duration-500">
                      <diff.icon className="h-8 w-8 text-accent" />
                    </div>
                    <h4 className="text-sm font-bold tracking-wide uppercase text-text-primary leading-snug">
                      {diff.title}
                    </h4>
                  </motion.div>
                ))}
              </motion.div>
            ) : (
              <motion.div
                key="comparisons"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4 }}
                className="w-full flex flex-col gap-8"
              >
                {/* Summary Text Area */}
                <div className="border-l border-border dark:border-accent/20 pl-6 py-1 w-full text-left">
                  <h4 className="text-[10px] font-bold tracking-widest uppercase text-accent font-mono mb-2">
                    Summary
                  </h4>
                  <div className="flex flex-col gap-[2px] text-[9px] md:text-[9.5px] text-text-secondary/70 font-light leading-relaxed">
                    <p>
                      RevOS is designed to orchestrate, optimize, and continuously improve revenue growth through AI-powered intelligence.
                    </p>
                    <p>
                      Traditional CRM platforms are designed to record and manage customer relationships and sales activities.
                    </p>
                    <p>
                      Rather than replacing your CRM, RevOS sits above it as the Revenue Intelligence & Decision Layer, helping leadership teams make better strategic and operational decisions.
                    </p>
                  </div>
                </div>

                <div className="border border-border rounded-2xl bg-bg-surface/50 backdrop-blur-md overflow-hidden shadow-xl ring-1 ring-white/5 w-full relative">
                  {/* Scroll Progress Indicator */}
                  <div className="absolute top-0 left-0 right-0 h-[2px] bg-border/20 z-40 overflow-hidden">
                    <motion.div
                      className="h-full bg-accent"
                      style={{ width: `${scrollProgress}%` }}
                      transition={{ type: "tween", ease: "easeOut", duration: 0.1 }}
                    />
                  </div>

                  {/* Top fade indicator (just below sticky header) */}
                  <AnimatePresence>
                    {scrollPosition.showTopGradient && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute left-0 right-0 h-8 bg-gradient-to-b from-bg-surface to-transparent pointer-events-none z-20 top-[45px]"
                        transition={{ duration: 0.2 }}
                      />
                    )}
                  </AnimatePresence>

                  {/* Bottom fade indicator */}
                  <AnimatePresence>
                    {scrollPosition.showBottomGradient && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute left-0 right-0 bottom-0 h-10 bg-gradient-to-t from-bg-surface/90 to-transparent pointer-events-none z-20"
                        transition={{ duration: 0.2 }}
                      />
                    )}
                  </AnimatePresence>

                  <div
                    ref={scrollContainerRef}
                    onScroll={handleScroll}
                    className="max-h-[480px] overflow-y-auto overflow-x-auto pr-1 [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar]:h-2 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-border/60 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-accent/40 scroll-smooth"
                  >
                    <table className="w-full min-w-[750px] border-collapse text-left">
                      <thead className={cn(
                        "sticky top-0 z-30 border-b bg-bg-surface transition-all duration-300",
                        isScrolled ? "border-accent/30 shadow-[0_4px_16px_rgba(0,0,0,0.2)]" : "border-border shadow-sm"
                      )}>
                        <tr>
                          <th className="py-[11px] px-4 text-xs font-bold tracking-wider uppercase text-text-secondary w-[180px]">Capability Domain</th>
                          <th className="py-[11px] px-4 text-xs font-bold tracking-wider uppercase text-text-secondary w-[240px]">Business Capability</th>
                          <th className="py-[11px] px-4 text-center text-xs font-bold tracking-wider uppercase text-text-secondary w-48 whitespace-nowrap">RevOS</th>
                          <th className="py-[11px] px-4 text-center text-xs font-bold tracking-wider uppercase text-text-secondary w-48 whitespace-nowrap">Traditional CRM</th>
                        </tr>
                      </thead>
                      <tbody>
                        {matrixData.map((row, index) => (
                          <motion.tr
                            key={row.capability}
                            initial={{ opacity: 0.3, y: 12, scale: 0.99 }}
                            whileInView={{ opacity: 1, y: 0, scale: 1 }}
                            viewport={{ root: scrollContainerRef, once: true, margin: "0px 0px -15px 0px" }}
                            transition={{ duration: 0.35, ease: "easeOut" }}
                            className="border-b border-border/40 hover:bg-accent/15 transition-colors duration-150"
                          >
                            {row.isDomainStart && (
                              <td
                                rowSpan={row.domainSpan}
                                className="py-[9px] px-4 font-bold text-text-primary border-r border-border/40 bg-bg-surface/30 align-top text-left text-xs md:text-sm w-[180px] max-w-[180px] break-words"
                              >
                                {row.domain}
                              </td>
                            )}
                            <td 
                              onMouseEnter={(e) => handleMouseEnter(e, row.capability)}
                              onMouseLeave={handleMouseLeave}
                              className={cn(
                                "py-[9px] px-4 text-xs md:text-sm font-medium text-text-secondary w-[240px] max-w-[240px] break-words transition-all duration-150 cursor-help select-none",
                                hoveredCapability === row.capability 
                                  ? "text-accent bg-accent/10 font-bold border-l-2 border-accent pl-[14px]" 
                                  : "hover:text-text-primary"
                              )}
                            >
                              {row.capability}
                            </td>
                            <td className="py-[9px] px-4 text-center w-48">
                              <span 
                                onMouseEnter={(e) => handleIconMouseEnter(e, row.revos)}
                                onMouseLeave={handleIconMouseLeave}
                                className="inline-flex items-center justify-center hover:scale-110 transition-transform duration-200 cursor-help"
                              >
                                {renderMatrixIcon(row.revos)}
                              </span>
                            </td>
                            <td className="py-[9px] px-4 text-center w-48">
                              <span 
                                onMouseEnter={(e) => handleIconMouseEnter(e, row.crm)}
                                onMouseLeave={handleIconMouseLeave}
                                className="inline-flex items-center justify-center hover:scale-110 transition-transform duration-200 cursor-help"
                              >
                                {renderMatrixIcon(row.crm)}
                              </span>
                            </td>
                          </motion.tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="py-32">
        <div className="mx-auto max-w-4xl px-6 lg:px-8 text-center bg-bg-surface rounded-[1.2rem] border border-border p-16 relative overflow-hidden ring-1 ring-white/5">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-accent to-transparent" />
          <h2 className="text-3xl md:text-5xl font-bold tracking-tight mb-8">Ready to Architect Your Growth?</h2>
          <p className="text-text-secondary mb-12 text-lg max-w-xl mx-auto">
            Join the ecosystem of organizations building a resilient, AI-native commercial operating model.
          </p>
          <Link
            to="/solutions/revos"
            className="inline-block px-10 py-5 bg-accent text-black font-extrabold rounded-full hover:scale-105 active:scale-95 transition-all text-center"
          >
            Get Started with RevOS
          </Link>
        </div>
      </section>

      {/* Tooltip Render */}
      <AnimatePresence>
        {hoveredCapability && (
          explanations.find((e: any) => e.capability_name === hoveredCapability) ? (
            (() => {
              const currentExplanation = explanations.find((e: any) => e.capability_name === hoveredCapability);
              return (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: 10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: 10 }}
                  transition={{ duration: 0.15, ease: "easeOut" }}
                  className="fixed z-50 w-[380px] bg-bg-surface/95 backdrop-blur-md border border-border/80 dark:border-accent/30 rounded-2xl shadow-[0_15px_40px_rgba(0,0,0,0.12)] dark:shadow-[0_25px_60px_rgba(0,0,0,0.85)] overflow-hidden pointer-events-none"
                  style={{
                    top: tooltipPosition.top,
                    left: tooltipPosition.left,
                  }}
                >
                  {/* Top Indicator Gradient Accent Line */}
                  <div className="h-[3px] bg-gradient-to-r from-accent/30 via-accent to-accent/30" />
                  
                  <div className="p-5 flex flex-col gap-4">
                    {/* Header */}
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center justify-between">
                        <span className="text-[9px] font-black tracking-widest text-accent uppercase font-mono bg-accent/10 px-2 py-0.5 rounded">
                          {currentExplanation.revos_module || "REVENUE ENGINE"}
                        </span>
                        <span className="text-[9px] font-bold text-text-secondary font-mono">
                          {currentExplanation.capability_id}
                        </span>
                      </div>
                      <h3 className="text-sm font-black text-text-primary mt-1">
                        {currentExplanation.capability_name}
                      </h3>
                    </div>

                    <div className="h-px bg-border/20" />

                    {/* Details List */}
                    <div className="flex flex-col gap-3.5 text-xs">
                      {/* What it is */}
                      <div className="flex flex-col gap-0.5">
                        <span className="text-[9px] font-black tracking-wider text-text-secondary/80 uppercase font-mono">
                          What it is
                        </span>
                        <p className="text-text-secondary/90 leading-relaxed text-[11px]">
                          {currentExplanation.explanation.what_it_is}
                        </p>
                      </div>

                      {/* Why it matters */}
                      <div className="flex flex-col gap-0.5">
                        <span className="text-[9px] font-black tracking-wider text-text-secondary/80 uppercase font-mono">
                          Why it matters
                        </span>
                        <p className="text-text-secondary/90 leading-relaxed text-[11px]">
                          {currentExplanation.explanation.why_it_matters}
                        </p>
                      </div>

                      {/* How RevOS delivers it */}
                      <div className="flex flex-col gap-0.5">
                        <span className="text-[9px] font-black tracking-wider text-accent/90 uppercase font-mono">
                          How RevOS delivers it
                        </span>
                        <p className="text-text-primary leading-relaxed text-[11px] font-medium">
                          {currentExplanation.explanation.how_revos_delivers_it}
                        </p>
                      </div>

                      {/* CRM Comparison */}
                      <div className="flex flex-col gap-0.5 bg-bg-primary/50 dark:bg-bg-primary/30 p-2.5 rounded-xl border border-border/40 dark:border-border/10">
                        <span className="text-[9px] font-black tracking-wider text-text-secondary/80 uppercase font-mono">
                          CRM Comparison
                        </span>
                        <p className="text-text-secondary leading-relaxed text-[11px]">
                          {currentExplanation.explanation.crm_comparison}
                        </p>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })()
          ) : null
        )}
      </AnimatePresence>

      {/* Legend Tooltip Render */}
      <AnimatePresence>
        {hoveredIcon && (
          (() => {
            let label = "";
            let colorHex = "";
            let pulseColor = "";
            
            if (hoveredIcon.value === '✅') {
              label = "Native Capability";
              colorHex = "#00F090";
              pulseColor = "bg-[#00F090]/20";
            } else if (hoveredIcon.value === '❌') {
              label = "Not Supported";
              colorHex = "#ef4444";
              pulseColor = "bg-[#ef4444]/20";
            } else if (hoveredIcon.value === '🟡') {
              label = "Limited";
              colorHex = "#f59e0b";
              pulseColor = "bg-[#f59e0b]/20";
            } else if (hoveredIcon.value === '🔗') {
              label = "Delivered through integration with CRM";
              colorHex = "#6366f1";
              pulseColor = "bg-[#6366f1]/20";
            }

            return (
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 6 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 6 }}
                transition={{ duration: 0.12, ease: "easeOut" }}
                className="fixed z-50 px-3 py-2 rounded-xl bg-bg-surface/95 dark:bg-[#0c101b]/95 backdrop-blur-md border border-border/80 dark:border-accent/20 shadow-[0_8px_24px_rgba(0,0,0,0.12)] dark:shadow-[0_16px_36px_rgba(0,0,0,0.6)] pointer-events-none flex items-center gap-2.5 max-w-[280px]"
                style={{
                  top: hoveredIcon.top,
                  left: hoveredIcon.left,
                  x: "-50%",
                }}
              >
                {/* Custom Pulsing Status Dot */}
                <div className="relative flex h-2 w-2 shrink-0">
                  <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${pulseColor}`}></span>
                  <span className="relative inline-flex rounded-full h-2 w-2" style={{ backgroundColor: colorHex }}></span>
                </div>
                <span className="text-[11px] font-bold text-text-primary dark:text-text-primary leading-tight select-none">
                  {label}
                </span>
              </motion.div>
            );
          })()
        )}
      </AnimatePresence>
    </div>
  );
}

