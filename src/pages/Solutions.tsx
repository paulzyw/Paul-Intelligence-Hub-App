import { motion } from 'motion/react';
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
    title: 'Pipeline Assessment & Winning Strategy',
    subtitle: 'AI-Native Opportunity Intelligence & Winning Motion',
    description: 'Assess enterprise opportunities, optimize pursuit strategy, and improve win probability.',
    role: 'Combines commercial, stakeholder, delivery, procurement, and forecasting intelligence into one decision system.',
    outcomes: ['Higher win rates', 'Better forecast accuracy', 'Reduced opportunity risk', 'Improved executive visibility'],
    icon: PieChart,
    color: 'from-purple-500/20 to-pink-500/20',
    link: '/solutions/revos/pipeline'
  }
];

const industries = [
  "SaaS / Software", "Enterprise Software", "Consulting", "AI Solutions", 
  "Cloud Transformation", "System Integration", "Managed Services", 
  "Engineering Solutions", "Infrastructure Projects", "EPC / EP Projects", 
  "Digital Transformation", "OT/IT Solutions", "Professional Services", 
  "Enterprise Procurement", "Solution-Selling Organizations"
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

export function Solutions() {
  return (
    <div className="bg-bg-primary min-h-screen selection:bg-accent selection:text-black">
      {/* SECTION 1: Hero Section */}
      <section className="relative pt-32 pb-20 overflow-hidden">
        {/* Animated Background Element */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full -z-10 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-accent/5 rounded-full blur-[120px] animate-pulse" />
          <div className="absolute bottom-1/4 left-1/3 w-[600px] h-[600px] bg-blue-500/5 rounded-full blur-[100px]" />
        </div>

        <div className="mx-auto max-w-7xl px-6 lg:px-8 text-center">
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
            <p className="text-lg md:text-xl text-text-secondary max-w-2xl mx-auto mb-10 leading-relaxed font-medium">
              RevOS transforms go-to-market strategy, qualification intelligence, and enterprise opportunity execution into one adaptive intelligence system.
            </p>
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
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 rounded-[3rem] border border-border bg-bg-surface/30 backdrop-blur-3xl ring-1 ring-white/10 shadow-2xl relative overflow-hidden">
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
              <div className="relative h-full rounded-[2.5rem] border border-border bg-bg-surface p-10 overflow-hidden flex flex-col justify-between shadow-2xl backdrop-blur-sm">
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
                className="group relative flex flex-col bg-bg-surface rounded-[2.5rem] border border-border p-8 ring-1 ring-white/5 overflow-hidden hover:ring-accent/40 transition-all duration-500"
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
      <section className="py-24 bg-bg-surface/50 border-t border-border">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="text-center mb-16">
            <h3 className="text-2xl font-bold text-text-primary uppercase tracking-widest mb-4">Target Verticals</h3>
            <p className="text-text-secondary">Optimized for high-complexity B2B environments.</p>
          </div>
          <div className="flex flex-wrap justify-center gap-3">
            {industries.map((industry, idx) => (
              <motion.span 
                key={industry}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ delay: idx * 0.05 }}
                viewport={{ once: true }}
                className="px-5 py-2.5 rounded-full border border-border bg-bg-primary text-xs font-semibold text-text-secondary hover:text-accent hover:border-accent/40 transition-all cursor-default"
              >
                {industry}
              </motion.span>
            ))}
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
          <div className="mb-20 text-center">
            <h2 className="text-3xl md:text-5xl font-bold tracking-tight text-text-primary mb-4">Why RevOS is Different</h2>
            <p className="text-text-secondary">Designing the future of organizational reasoning.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {differences.map((diff, index) => (
              <motion.div
                key={diff.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
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
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="py-32">
        <div className="mx-auto max-w-4xl px-6 lg:px-8 text-center bg-bg-surface rounded-[3rem] border border-border p-16 relative overflow-hidden ring-1 ring-white/5">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-accent to-transparent" />
          <h2 className="text-3xl md:text-5xl font-bold tracking-tight mb-8">Ready to Architect Your Growth?</h2>
          <p className="text-text-secondary mb-12 text-lg max-w-xl mx-auto">
            Join the ecosystem of organizations building a resilient, AI-native commercial operating model.
          </p>
          <button className="px-10 py-5 bg-accent text-black font-extrabold rounded-full hover:scale-105 active:scale-95 transition-all">
            Get Started with RevOS
          </button>
        </div>
      </section>
    </div>
  );
}

