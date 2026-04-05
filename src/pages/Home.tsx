import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Link } from 'react-router-dom';
import { Database, Lightbulb, Target, Settings, TrendingUp, Users, HeartHandshake, Briefcase, Zap, RefreshCw, ArrowRight } from 'lucide-react';
import { MeteorBackground } from '../components/MeteorBackground';
import { supabase, type Post } from '../lib/supabase';

export function Home() {
  const [latestPosts, setLatestPosts] = useState<Post[]>([]);
  const [loadingPosts, setLoadingPosts] = useState(true);

  useEffect(() => {
    async function fetchLatestPosts() {
      try {
        const { data, error } = await supabase
          .from('posts')
          .select('*, categories(*)')
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
    fetchLatestPosts();
  }, []);

  return (
    <div className="flex flex-col w-full">
      {/* HERO SECTION */}
      <section className="relative w-full bg-obsidian py-24 lg:py-32 overflow-hidden flex items-center justify-center min-h-[80vh]">
        <div className="absolute inset-0 opacity-20 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>
        <div className="absolute inset-0 bg-gradient-to-t from-obsidian to-transparent"></div>
        <MeteorBackground />
        
        <div className="relative z-10 mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 text-center">
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight text-ivory mb-6"
          >
            Turning Data and Technology Into Measurable Business Growth
          </motion.h1>
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-xl md:text-2xl text-gray-400 mb-10 font-medium"
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
              className="group inline-flex items-center justify-center px-8 py-4 bg-[#ED8936] hover:bg-[#DD6B20] text-obsidian rounded-md transition-colors duration-300 active:scale-95"
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
          <div className="w-5 h-8 border-2 border-gray-500/50 rounded-full flex justify-center p-1">
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
              className="w-1 h-1.5 bg-gray-400 rounded-full"
            />
          </div>
        </motion.div>
      </section>

      {/* METRICS STRIP */}
      <section className="w-full bg-obsidian border-y border-border py-8">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-6 text-center divide-x divide-border/50">
            <div className="flex flex-col">
              <span className="text-3xl font-bold text-text-primary">10+</span>
              <span className="text-sm text-gray-400 mt-1 uppercase tracking-wider">Years Experience</span>
            </div>
            <div className="flex flex-col">
              <span className="text-3xl font-bold text-text-primary">35%</span>
              <span className="text-sm text-gray-400 mt-1 uppercase tracking-wider">Revenue CAGR</span>
            </div>
            <div className="flex flex-col">
              <span className="text-3xl font-bold text-text-primary">$1.1B</span>
              <span className="text-sm text-gray-400 mt-1 uppercase tracking-wider">Delivered Revenue</span>
            </div>
            <div className="flex flex-col">
              <span className="text-3xl font-bold text-text-primary">$650M</span>
              <span className="text-sm text-gray-400 mt-1 uppercase tracking-wider">OpEx Saved</span>
            </div>
            <div className="flex flex-col col-span-2 md:col-span-1 border-l-0 md:border-l border-border/50 pt-6 md:pt-0">
              <span className="text-3xl font-bold text-text-primary">10M Ton</span>
              <span className="text-sm text-gray-400 mt-1 uppercase tracking-wider">CO2 Reduced</span>
            </div>
          </div>
        </div>
      </section>

      {/* ABOUT ME & WHAT I DO */}
      <section className="py-24 bg-bg-primary">
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
                  Business growth leader with over 10 years of experience driving SaaS revenue and digital transformation across APAC and China.
                </p>
                <p>
                  Specialized in building scalable go-to-market strategies, developing high-impact partner ecosystems, and delivering measurable business outcomes for enterprise customers in oil & gas, petrochemical, chemical, electric power, manufacturing, and public utilities sectors.
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
                  { icon: Briefcase, title: "Commercial Leadership", desc: "Drive profitability improvement and maximize business impact globally" },
                  { icon: HeartHandshake, title: "Partner Ecosystem", desc: "Build partner networks generating significant pipeline" },
                  { icon: Settings, title: "Operations Excellence", desc: "Utilize data-driven solutions to drive operational efficiency" },
                  { icon: Zap, title: "Digital Transformation", desc: "Drive digital transformation to gain financial benefit" }
                ].map((item, i) => (
                  <div key={i} className="flex gap-4 items-start p-4 rounded-xl dark:bg-[#1E2124]">
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
      <section className="py-24 bg-obsidian text-ivory">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Impact-Based Professional Experience</h2>
            <p className="text-gray-400 max-w-2xl mx-auto">Showcasing the 'How' behind the measurable business growth.</p>
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
                className="bg-bg-surface border border-border/20 p-8 rounded-xl transition-all duration-300 hover:-translate-y-2 hover:border-amber hover:shadow-[0_10px_30px_-15px_rgba(237,137,54,0.3)] group"
              >
                <h3 className="text-2xl font-bold mb-3 text-[#DD6B20] dark:text-[#ED8936] transition-colors">{exp.title}</h3>
                <p className="text-gray-400 mb-6 text-sm leading-relaxed">{exp.summary}</p>
                <ul className="space-y-2">
                  {exp.bullets.map((bullet, j) => (
                    <li key={j} className="flex items-start gap-2 text-sm text-gray-300">
                      <span className="text-amber mt-1">•</span>
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

      {/* INDUSTRIES MARQUEE */}
      <section className="py-12 bg-obsidian text-ivory overflow-hidden border-y border-border/20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap justify-center gap-4 md:gap-8 lg:gap-12 items-center text-sm md:text-base lg:text-lg font-medium text-gray-400 uppercase tracking-widest">
            <span>Energy</span>
            <span className="text-amber">•</span>
            <span>Oil & Gas</span>
            <span className="text-amber">•</span>
            <span>Electric Power</span>
            <span className="text-amber">•</span>
            <span>Chemical</span>
            <span className="text-amber">•</span>
            <span>Manufacturing</span>
            <span className="text-amber">•</span>
            <span>Technology / SaaS</span>
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
                <Link to={`/post/${post.slug}`} key={post.id} className="group cursor-pointer flex flex-col h-full bg-bg-surface border border-border rounded-xl overflow-hidden hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                  <div className="relative h-48 overflow-hidden">
                    <img 
                      src={post.thumbnail_url} 
                      alt={post.title} 
                      className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-500"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute top-4 left-4 bg-obsidian/90 border border-amber text-ivory text-xs font-bold px-3 py-1 rounded-full">
                      {post.categories?.name || 'Uncategorized'}
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

      {/* FINAL CTA */}
      <section className="py-32 bg-obsidian text-center relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(237,137,54,0.1)_0,transparent_50%)]"></div>
        <div className="relative z-10 mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl md:text-5xl font-bold text-ivory mb-6">Let’s build scalable growth together.</h2>
          <p className="text-xl text-gray-400 mb-10">
            Whether you are exploring collaboration, partnership opportunities, or simply exchanging ideas, feel free to reach out.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
            <a 
              href="mailto:paul.zy.wang@hotmail.com"
              className="inline-flex items-center justify-center px-8 py-4 text-base font-bold text-obsidian bg-amber hover:bg-amber/90 rounded-md transition-all hover:scale-[1.03] active:scale-[0.97] w-full sm:w-auto"
            >
              EMAIL ME
            </a>
            <a 
              href="https://www.linkedin.com/in/paulzyw" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-gray-400 hover:text-ivory transition-colors flex items-center gap-2 font-medium"
            >
              Find me on LinkedIn <ArrowRight size={16} />
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
