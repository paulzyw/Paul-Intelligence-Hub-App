import { useState, useEffect, useRef } from 'react';
import { motion, useInView, animate } from 'motion/react';
import { Link } from 'react-router-dom';
import { Database, Lightbulb, Target, Settings, TrendingUp, Users, HeartHandshake, Briefcase, Zap, RefreshCw, ArrowRight, FileText, BarChart3, Calendar, Leaf, Gauge, Network, FlaskConical, HelpCircle } from 'lucide-react';
import { MeteorBackground } from '../components/MeteorBackground';
import { TrustBar } from '../components/TrustBar';
import { ImpactTeaser } from '../components/ImpactTeaser';
import { supabase, type Post, type ResearchReport } from '../lib/supabase';

function Counter({ value, duration = 2, prefix = '', suffix = '', decimals = 0 }: { value: number, duration?: number, prefix?: string, suffix?: string, decimals?: number }) {
  const [displayValue, setDisplayValue] = useState(0);
  const nodeRef = useRef<HTMLSpanElement>(null);
  const isInView = useInView(nodeRef, { once: true, margin: "-50px" });

  useEffect(() => {
    if (isInView) {
      const controls = animate(0, value, {
        duration,
        ease: "easeOut",
        onUpdate(latest) {
          setDisplayValue(latest);
        },
      });
      return () => controls.stop();
    }
  }, [isInView, value, duration]);

  return (
    <span ref={nodeRef}>
      {prefix}{displayValue.toFixed(decimals)}{suffix}
    </span>
  );
}

export function Home() {
  const [latestPosts, setLatestPosts] = useState<Post[]>([]);
  const [loadingPosts, setLoadingPosts] = useState(true);
  const [latestReports, setLatestReports] = useState<ResearchReport[]>([]);
  const [loadingReports, setLoadingReports] = useState(true);
  const [metrics, setMetrics] = useState({
    revenue: 1.3,
    revenueSuffix: 'B',
    revenueDecimals: 1,
    opex: 855,
    co2: 10
  });

  useEffect(() => {
    async function fetchLatestPosts() {
      try {
        const { data, error } = await supabase
          .from('posts')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(3);
        
        if (!error && data) {
          setLatestPosts(data);
        }
      } catch (err) {
        console.error('Error fetching latest posts:', err);
      } finally {
        setLoadingPosts(false);
      }
    }

    async function fetchLatestReports() {
      try {
        const { data, error } = await supabase
          .from('research_reports')
          .select('*, report_types(*)')
          .eq('status', 'published')
          .order('published_at', { ascending: false })
          .limit(3);
        
        if (!error && data) {
          setLatestReports(data);
        }
      } catch (err) {
        console.error('Error fetching latest reports:', err);
      } finally {
        setLoadingReports(false);
      }
    }

    async function fetchProjectMetrics() {
      try {
        const res = await fetch('/impact-master-table.json');
        if (!res.ok) return;
        const projects = await res.json();
        if (!Array.isArray(projects)) return;

        const totalRevenue = projects.reduce((sum, p) => sum + (p.revenue || 0), 0);
        const totalSavings = projects.reduce((sum, p) => sum + (p.costSaving || 0), 0);
        const totalProfit = projects.reduce((sum, p) => sum + (p.profitGenerated || 0), 0);
        const totalCO2 = projects.reduce((sum, p) => sum + (p.co2Reduction || 0), 0);

        // Revenue: Check if it's Billions or Millions
        let revenueVal = totalRevenue;
        let revenueSuffix = 'M';
        let revenueDecimals = 0;
        
        if (totalRevenue >= 1000000000) {
          revenueVal = totalRevenue / 1000000000;
          revenueSuffix = 'B';
          revenueDecimals = 1;
        } else {
          revenueVal = totalRevenue / 1000000;
        }

        setMetrics({
          revenue: revenueVal,
          revenueSuffix,
          revenueDecimals,
          opex: Math.round((totalSavings + totalProfit) / 1000000), // Integer M$
          co2: Math.round(totalCO2 / 1000000) // Integer M Ton
        });
      } catch (err) {
        console.error('Error fetching project metrics:', err);
      }
    }

    fetchLatestPosts();
    fetchLatestReports();
    fetchProjectMetrics();
  }, []);

  return (
    <div className="flex flex-col w-full">
      {/* HERO SECTION */}
      <section className="relative w-full bg-bg-hero-primary py-24 lg:py-32 overflow-hidden flex items-center justify-center min-h-[80vh] transition-colors duration-400">
        <div className="absolute inset-0 opacity-20 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>
        <div className="absolute inset-0 bg-gradient-to-t from-bg-hero-primary to-transparent"></div>
        <MeteorBackground />
        
        <div className="relative z-10 mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 text-center">
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight text-text-hero-primary mb-6"
          >
            Turning Data and Technology Into Measurable Business Growth
          </motion.h1>
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-xl md:text-2xl text-text-hero-secondary mb-10 font-medium"
          >
            Paul Wang | Data-Driven Business Growth Leader | SaaS & Digital Transformation
          </motion.h2>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            <Link 
              to="/contact" 
              className="group inline-flex items-center justify-center px-8 py-4 bg-accent hover:opacity-90 text-white rounded-md transition-all duration-300 active:scale-95 shadow-lg shadow-accent/20"
            >
              <span className="text-base font-bold transition-transform duration-300 inline-block group-hover:scale-110">
                Contact Paul
              </span>
            </Link>
          </motion.div>
        </div>

        {/* SCROLL INDICATOR */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2, duration: 1 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 flex justify-center pointer-events-none z-10"
        >
          <div className="w-5 h-8 border-2 border-text-hero-secondary/30 rounded-full flex justify-center p-1">
            <motion.div
              animate={{
                y: [0, 12, 0],
                opacity: [1, 0.2, 1]
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut"
              }}
              className="w-1 h-1.5 bg-accent rounded-full"
            />
          </div>
        </motion.div>
      </section>

      {/* METRICS STRIP */}
      <section className="w-full bg-bg-hero-primary border-y border-border-hero py-8 transition-colors duration-400">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-6 text-center">
            <div className="flex flex-col">
              <span className="text-3xl font-bold text-text-hero-primary">
                <Counter value={10} suffix="+" />
              </span>
              <span className="text-sm text-text-hero-secondary mt-1 uppercase tracking-wider">Years Experience</span>
            </div>
            <div className="flex flex-col">
              <span className="text-3xl font-bold text-text-hero-primary">
                <Counter value={35} suffix="%" />
              </span>
              <span className="text-sm text-text-hero-secondary mt-1 uppercase tracking-wider">Revenue CAGR</span>
            </div>
            <div className="flex flex-col">
              <span className="text-3xl font-bold text-text-hero-primary">
                <Counter value={metrics.revenue} prefix="$" suffix={metrics.revenueSuffix} decimals={metrics.revenueDecimals} />
              </span>
              <span className="text-sm text-text-hero-secondary mt-1 uppercase tracking-wider">Delivered Revenue</span>
            </div>
            <div className="flex flex-col">
              <span className="text-3xl font-bold text-text-hero-primary">
                <Counter value={metrics.opex} prefix="$" suffix="M" decimals={0} />
              </span>
              <span className="text-sm text-text-hero-secondary mt-1 uppercase tracking-wider">OpEx Saved</span>
            </div>
            <div className="flex flex-col col-span-2 md:col-span-1 pt-6 md:pt-0">
              <span className="text-3xl font-bold text-text-hero-primary">
                <Counter value={metrics.co2} suffix="M Ton" decimals={0} />
              </span>
              <span className="text-sm text-text-hero-secondary mt-1 uppercase tracking-wider">CO2 Reduced</span>
            </div>
          </div>
        </div>
      </section>

      {/* TRUST BAR / LOGOS */}
      <TrustBar />

      {/* ABOUT ME & WHAT I DO */}
      <section className="py-24 bg-bg-surface">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
            {/* Left: About */}
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <h2 className="text-3xl font-bold mb-6 text-text-primary">About Me</h2>
              <div className="space-y-4 text-text-secondary text-lg leading-relaxed">
                <p>
                  Business growth leader with over 10 years of experience driving SaaS subscription revenue and digital transformation across APAC and China.
                </p>
                <p>
                  Specialized in building scalable go-to-market strategies, driving product strategy, developing high-impact partner ecosystems, and delivering measurable business outcomes for enterprise customers in oil & gas, petrochemical, chemical, electric power, manufacturing, and public utilities sectors.
                </p>
                <p>
                  Known for combining strategic thinking with execution excellence to unlock growth, improve profitability, and scale regional businesses.
                </p>
              </div>
            </motion.div>

            {/* Right: What I Do */}
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <h2 className="text-3xl font-bold mb-6 text-text-primary">What I Do</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {[
                  { icon: TrendingUp, title: "Revenue Strategy", desc: "Drive sustainable SaaS revenue growth through market expansion" },
                  { icon: Target, title: "GTM Execution", desc: "Design scalable GTM strategies to accelerate acquisition" },
                  { icon: Briefcase, title: "Commercial Leadership", desc: "Drive profitability improvement and maximize business impact" },
                  { icon: HeartHandshake, title: "Partner Ecosystem", desc: "Build partner networks generating significant pipeline" },
                  { icon: Settings, title: "Operations Excellence", desc: "Utilize data-driven solutions to drive operational efficiency" },
                  { icon: Zap, title: "Digital Transformation", desc: "Drive digital transformation to gain financial benefit" }
                ].map((item, i) => (
                  <div key={i} className="flex gap-4 items-start p-4 rounded-xl bg-bg-primary border border-border/50">
                    <div className="mt-1 p-2 rounded-lg bg-accent/10 text-accent">
                      <item.icon size={24} />
                    </div>
                    <div>
                      <h3 className="font-semibold text-text-primary">{item.title}</h3>
                      <p className="text-sm text-text-secondary mt-1">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* IMPACT-BASED PROFESSIONAL EXPERIENCE */}
      <section className="py-24 bg-bg-primary transition-colors duration-400">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-text-primary">Impact-Based Professional Experience</h2>
            <p className="text-text-secondary max-w-2xl mx-auto">Showcasing the 'How' behind the measurable business growth.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {[
              {
                title: "Driving SaaS Growth",
                summary: "Driving enterprise SaaS adoption across complex industrial environments by combining strategic sales execution, ecosystem leverage, and value-based engagement.",
                bullets: [
                  "Led complex enterprise SaaS sales engagements with large industrial organizations",
                  "Built long-term relationships with C-level stakeholders",
                  "Developed partner ecosystem strategies enabling co-sell",
                  "Delivered advanced analytics platforms improving operational visibility",
                  "Drove revenue growth through value-based selling"
                ]
              },
              {
                title: "Digital Transformation",
                summary: "Enabling industrial organizations to accelerate digital transformation by turning operational data into actionable insights and measurable performance improvements.",
                bullets: [
                  "Improved production planning and supply chain efficiency",
                  "Enhanced asset reliability and equipment performance",
                  "Increased operational visibility across complex environments",
                  "Enabled cross-team collaboration across distributed operations",
                  "Strengthened decision-making through data-driven insights"
                ]
              },
              {
                title: "Scaling Digital Business",
                summary: "Building and scaling digital and SaaS-driven business models that create sustainable growth and long-term enterprise value.",
                bullets: [
                  "Developed and executed regional digital business strategies",
                  "Launched analytics and optimization-focused portfolios",
                  "Created new revenue streams through SaaS offerings",
                  "Led cross-functional teams to deliver transformation initiatives",
                  "Designed and scaled partner ecosystems and co-sell models"
                ]
              },
              {
                title: "Turning Data into Value",
                summary: "Transforming data into measurable business outcomes by aligning analytics capabilities with real operational and strategic objectives.",
                bullets: [
                  "Delivered data-driven solutions improving efficiency",
                  "Enabled smarter decision-making through advanced analytics",
                  "Integrated data into business processes for tangible impact",
                  "Collaborated with ecosystem partners for end-to-end solutions",
                  "Focused on measurable outcomes and value creation"
                ]
              }
            ].map((exp, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className="bg-bg-surface border border-border p-8 rounded-xl transition-all duration-300 hover:-translate-y-2 hover:border-accent hover:shadow-xl group"
              >
                <h3 className="text-2xl font-bold mb-3 text-accent transition-colors">{exp.title}</h3>
                <p className="text-text-secondary mb-6 text-sm leading-relaxed">{exp.summary}</p>
                <ul className="space-y-2">
                  {exp.bullets.map((bullet, j) => (
                    <li key={j} className="flex items-start gap-2 text-sm text-text-secondary">
                      <span className="text-accent mt-1">•</span>
                      <span>{bullet}</span>
                    </li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* MY VALUE CREATION FRAMEWORK */}
      <section className="py-24 bg-bg-primary">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-text-primary inline-block relative">
              My Value Creation Framework
              <span className="absolute -bottom-2 left-0 w-1/2 h-1 bg-accent rounded-full"></span>
            </h2>
            <p className="text-text-secondary mt-6 max-w-2xl">
              Transforming data and technology into measurable business outcomes using a clear, structured approach.
            </p>
          </div>

          <div className="flex flex-col lg:flex-row gap-6 relative">
            {/* Connecting line for desktop */}
            <div className="hidden lg:block absolute top-1/2 left-0 w-full h-0.5 bg-border -translate-y-1/2 z-0"></div>
            
            {[
              { icon: Database, title: "Data", desc: "Collect and integrate operational data to create a solid foundation." },
              { icon: Lightbulb, title: "Insight", desc: "Turn accessible data into actionable insights using analytics." },
              { icon: Target, title: "Strategy", desc: "Translate insights into clear actions aligned with priorities." },
              { icon: Settings, title: "Execution", desc: "Implement digital platforms into daily decision-making." },
              { icon: TrendingUp, title: "Business Value", desc: "Deliver tangible outcomes like improved efficiency and growth." }
            ].map((step, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.15 }}
                className="flex-1 relative z-10"
              >
                <div className="bg-bg-surface border border-border p-6 rounded-xl h-full transition-all duration-300 hover:-translate-y-2 hover:shadow-lg group">
                  <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center text-accent mb-4 group-hover:scale-110 transition-transform">
                    <step.icon size={24} />
                  </div>
                  <h3 className="text-xl font-bold mb-2 text-text-primary">{step.title}</h3>
                  <p className="text-sm text-text-secondary">{step.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* MY LEADERSHIP PHILOSOPHY */}
      <section className="py-24 bg-bg-surface border-t border-border">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-text-primary mb-4">My Leadership Philosophy</h2>
            <p className="text-text-secondary max-w-2xl mx-auto">
              A Six-Pillar framework guiding high-performing teams, customer-centric solutions, operational excellence, innovation, and adaptability.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { title: "People", desc: "Build and empower high-performing teams through vision, alignment, and accountability.", icon: Users },
              { title: "Customer", desc: "Focus on delivering value by understanding customer needs and building trust-based partnerships.", icon: HeartHandshake },
              { title: "Offerings", desc: "Develop tailored, differentiated solutions that solve real-world problems and expand market share.", icon: Briefcase },
              { title: "Operations", desc: "Drive efficiency and scalability across the revenue engine to improve profitability and performance.", icon: Settings },
              { title: "Innovation", desc: "Embed creativity into models, processes, and go-to-market strategies to unlock new value.", icon: Lightbulb },
              { title: "Adaptation", desc: "Lead with agility to thrive in changing markets and capture opportunities ahead of competitors.", icon: RefreshCw }
            ].map((pillar, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.1 }}
                className="p-6 rounded-xl border border-border bg-bg-primary hover:bg-accent/5 transition-colors group"
              >
                <div className="flex items-center gap-4 mb-3">
                  <pillar.icon className="text-accent" size={24} />
                  <h3 className="text-xl font-bold text-text-primary group-hover:text-accent transition-colors">{pillar.title}</h3>
                </div>
                <p className="text-text-secondary text-sm">{pillar.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* STRATEGIC IMPACT TEASER */}
      <ImpactTeaser />

      {/* INDUSTRIES MARQUEE */}
      <section className="py-12 bg-bg-surface text-text-primary overflow-hidden border-y border-border transition-colors duration-400">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap justify-center gap-4 md:gap-8 lg:gap-12 items-center text-sm md:text-base lg:text-lg font-medium text-text-secondary uppercase tracking-widest">
            <span>Energy</span>
            <span className="text-accent">•</span>
            <span>Oil & Gas</span>
            <span className="text-accent">•</span>
            <span>Electric Power</span>
            <span className="text-accent">•</span>
            <span>Chemical</span>
            <span className="text-accent">•</span>
            <span>Manufacturing</span>
            <span className="text-accent">•</span>
            <span>Technology / Software / SaaS</span>
            <span className="text-accent">•</span>
          </div>
        </div>
      </section>

      {/* LATEST INSIGHTS (Preview) */}
      <section className="py-24 bg-bg-primary">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-end mb-12">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-text-primary mb-4">Latest Insights</h2>
              <p className="text-text-secondary">Data-driven perspectives on scaling software solutions.</p>
            </div>
            <Link to="/insights" className="hidden md:flex items-center gap-2 text-accent font-medium hover:underline">
              View All <ArrowRight size={16} />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {loadingPosts ? (
              // Skeleton Loaders
              [1, 2, 3].map((i) => (
                <div key={i} className="flex flex-col h-full bg-bg-surface border border-border rounded-xl overflow-hidden animate-pulse">
                  <div className="h-48 bg-border/50 w-full"></div>
                  <div className="p-6 flex flex-col flex-grow">
                    <div className="h-6 bg-border/50 rounded w-3/4 mb-3"></div>
                    <div className="h-4 bg-border/50 rounded w-full mb-2"></div>
                    <div className="h-4 bg-border/50 rounded w-5/6 mb-6"></div>
                    <div className="h-4 bg-border/50 rounded w-1/3 mt-auto"></div>
                  </div>
                </div>
              ))
            ) : latestPosts.length > 0 ? (
              latestPosts.map((post) => (
                <Link 
                  to={`/post/${post.slug}`} 
                  key={post.id} 
                  className="group cursor-pointer flex flex-col h-full bg-bg-surface border border-border rounded-xl overflow-hidden hover:border-accent hover:shadow-[0_0_25px_rgba(237,137,54,0.15)] transition-all duration-500 hover:-translate-y-1"
                >
                  <div className="relative h-48 overflow-hidden">
                    <img 
                      src={post.thumbnail_url} 
                      alt={post.title} 
                      className="w-full h-full object-cover scale-100 group-hover:scale-110 transition-transform duration-700 ease-out will-change-transform"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute top-4 left-4 bg-obsidian/90 border border-accent text-ivory text-xs font-bold px-3 py-1 rounded-full">
                      {post.category || 'Uncategorized'}
                    </div>
                    <div className="absolute bottom-4 right-4 bg-obsidian/80 backdrop-blur text-ivory text-xs px-2 py-1 rounded flex items-center gap-1">
                      {post.read_time} Min Read
                    </div>
                  </div>
                  <div className="p-6 flex flex-col flex-grow">
                    <h3 className="text-xl font-bold text-text-primary mb-3 line-clamp-2 group-hover:text-accent transition-colors">
                      {post.title}
                    </h3>
                    <p className="text-text-secondary text-sm mb-6 line-clamp-2 flex-grow">
                      {post.summary}
                    </p>
                    <span className="text-accent font-medium text-sm flex items-center gap-1 group/link mt-auto">
                      Read Article <ArrowRight size={14} className="transition-transform group-hover/link:translate-x-1" />
                    </span>
                  </div>
                </Link>
              ))
            ) : (
              <div className="col-span-3 text-center text-text-secondary py-12 border border-border rounded-xl">
                No insights published yet. Check back soon.
              </div>
            )}
          </div>
          
          <div className="mt-8 text-center md:hidden">
            <Link to="/insights" className="inline-flex items-center gap-2 text-accent font-medium hover:underline">
              View All Insights <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </section>

      {/* LATEST RESEARCH SECTION */}
      <section className="py-24 bg-bg-surface transition-colors duration-400">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-12 gap-4">
            <div>
              <span className="inline-block px-3 py-1 bg-accent/10 text-accent text-[10px] font-bold rounded-full uppercase tracking-widest mb-4">
                Technical Briefs
              </span>
              <h2 className="text-3xl md:text-4xl font-bold text-text-primary mb-4 tracking-tight">Latest Research</h2>
              <p className="text-text-secondary max-w-xl">
                Data-driven analysis and quantitative research on operational efficiency and digital transformation.
              </p>
            </div>
            <Link to="/research" className="flex items-center gap-2 text-accent font-bold uppercase text-xs tracking-widest hover:gap-3 transition-all">
              Explore Research <ArrowRight size={16} />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {loadingReports ? (
              [1, 2, 3].map((i) => (
                <div key={i} className="h-80 bg-bg-primary border border-border rounded-xl animate-pulse" />
              ))
            ) : latestReports.length > 0 ? (
              latestReports.map((report) => {
                const ICON_MAP: Record<string, any> = { Leaf, Gauge, Network, FlaskConical, BarChart3 };
                const IconComp = ICON_MAP[report.report_types?.icon_name || ''] || HelpCircle;
                
                return (
                  <Link 
                    to={`/research/${report.slug}`} 
                    key={report.id} 
                    className="group flex flex-col bg-bg-primary border border-border rounded-xl overflow-hidden hover:border-accent hover:shadow-[0_0_20px_rgba(0,163,224,0.08)] transition-all duration-500"
                  >
                    <div className="p-6 flex flex-col h-full">
                      <div className="flex items-center justify-between mb-4">
                        <div className="p-2 bg-bg-surface rounded border border-border">
                          <IconComp size={16} className="text-accent" />
                        </div>
                        {report.highlight_metric && (
                          <div className="bg-accent text-white px-2 py-0.5 rounded text-[9px] font-bold uppercase">
                            {report.highlight_metric}
                          </div>
                        )}
                      </div>
                      
                      <h3 className="text-lg font-bold text-text-primary mb-3 group-hover:text-accent transition-colors line-clamp-2">
                        {report.title}
                      </h3>
                      
                      <p className="text-xs text-text-secondary mb-6 line-clamp-3 leading-relaxed">
                        {report.summary}
                      </p>
                      
                      <div className="mt-auto pt-4 border-t border-border/50 flex items-center justify-between">
                        <span className="text-[9px] font-bold text-text-secondary uppercase tracking-widest">
                          {report.report_types?.name || 'Report'}
                        </span>
                        <span className="text-[9px] text-text-secondary flex items-center gap-1">
                          <Calendar size={10} />
                          {new Date(report.published_at || report.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </Link>
                );
              })
            ) : (
              <div className="col-span-3 text-center text-text-secondary py-12 border border-border rounded-xl">
                No research reports published yet.
              </div>
            )}
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="py-32 bg-bg-primary text-center relative overflow-hidden transition-colors duration-400">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(0,163,224,0.05)_0,transparent_50%)]"></div>
        <div className="relative z-10 mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl md:text-5xl font-bold text-text-primary mb-6">Let’s build scalable growth together.</h2>
          <p className="text-xl text-text-secondary mb-10">
            Whether you are exploring collaboration, partnership opportunities, or simply exchanging ideas, feel free to reach out.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
            <a 
              href="mailto:paul.zy.wang@hotmail.com"
              className="inline-flex items-center justify-center px-8 py-4 text-base font-bold text-white bg-accent hover:opacity-90 rounded-md transition-all hover:scale-[1.03] active:scale-[0.97] w-full sm:w-auto shadow-lg shadow-accent/20"
            >
              EMAIL ME
            </a>
            <a 
              href="https://www.linkedin.com/in/paulzyw" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-text-secondary hover:text-accent transition-colors flex items-center gap-2 font-medium"
            >
              Find me on LinkedIn <ArrowRight size={16} />
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
