import { useState, useEffect, useMemo } from 'react';
import { motion } from 'motion/react';
import { Link } from 'react-router-dom';
import { TrendingUp, Gauge, Leaf, LockKeyhole, ArrowRight } from 'lucide-react';
import { cn } from '../lib/utils';

interface ImpactProject {
  revenue?: number;
  costSaving?: number;
  co2Reduction?: number;
}

const formatCurrency = (val: number) => {
  if (val >= 1000000000) return `$${(val / 1000000000).toFixed(1)}B+`;
  if (val >= 1000000) return `$${(val / 1000000).toFixed(1)}M+`;
  return `$${val.toLocaleString()}`;
};

const formatNumber = (val: number) => {
  if (val >= 1000000) return `${(val / 1000000).toFixed(1)}M`;
  if (val >= 1000) return `${(val / 1000).toFixed(1)}K`;
  return val.toLocaleString();
};

export function ImpactTeaser() {
  const [data, setData] = useState<{ revenue: number; savings: number; co2: number } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchImpactData() {
      try {
        const response = await fetch('/impact-master-table.json');
        if (!response.ok) throw new Error('Data source unreachable');
        const projects: ImpactProject[] = await response.json();
        
        const totals = projects.reduce((acc, p) => ({
          revenue: acc.revenue + (p.revenue || 0),
          savings: acc.savings + (p.costSaving || 0),
          co2: acc.co2 + (p.co2Reduction || 0)
        }), { revenue: 0, savings: 0, co2: 0 });

        setData(totals);
      } catch (err) {
        console.error('Error fetching impact data:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchImpactData();
  }, []);

  const metrics = useMemo(() => [
    { 
      label: "Total Revenue Generated", 
      value: data ? formatCurrency(data.revenue) : "$1.15B+", 
      icon: TrendingUp, 
      color: "#ED8936",
      delay: 0.4
    },
    { 
      label: "Operational Cost Savings", 
      value: data ? formatCurrency(data.savings) : "$83.4M+", 
      icon: Gauge, 
      color: "#10B981",
      delay: 0.5
    },
    { 
      label: "CO2 Emissions Mitigated", 
      value: data ? `${formatNumber(data.co2)} Tons` : "10.3M Tons", 
      icon: Leaf, 
      color: "#00a3e0",
      delay: 0.6
    }
  ], [data]);

  return (
    <section className="w-full bg-bg-hero-primary py-24 relative overflow-hidden transition-colors duration-400">
      {/* Background Decorative Details */}
      <div className="absolute inset-0 opacity-10 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:32px_32px]"></div>
      <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-border-hero to-transparent"></div>
      <div className="absolute bottom-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-border-hero to-transparent"></div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative z-10">
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="bg-bg-hero-surface border border-border-hero rounded-2xl overflow-hidden shadow-2xl"
        >
          <div className="p-8 md:p-12 lg:p-16">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-16">
              <div className="max-w-2xl">
                <motion.span 
                  initial={{ opacity: 0, x: -10 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.3 }}
                  className="inline-block py-1 px-3 rounded-full bg-accent/10 border border-accent/20 text-accent text-[10px] font-bold uppercase tracking-[0.2em] mb-6"
                >
                  Quantitative Proof
                </motion.span>
                <h2 className="text-3xl md:text-5xl font-bold text-text-hero-primary mb-6 tracking-tight leading-tight">
                  Quantified Impact & <br className="hidden md:block" />
                  <span className="text-accent">Strategic Value</span> (2008–2026)
                </h2>
                <p className="text-lg md:text-xl text-text-hero-secondary leading-relaxed max-w-xl">
                  Translating complex industrial operations into measurable financial and environmental outcomes.
                </p>
              </div>
              
              <div className="hidden lg:block">
                <div className="flex items-center gap-2 text-text-hero-secondary/40 text-[10px] font-mono uppercase tracking-widest border border-border-hero/50 rounded-lg p-3 bg-white/5">
                  <div className="w-2 h-2 rounded-full bg-accent animate-pulse"></div>
                  Verified Performance Ledger
                </div>
              </div>
            </div>

            {/* METRIC GRID */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
              {metrics.map((metric, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: metric.delay, duration: 0.6 }}
                  className="flex flex-col group"
                >
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 rounded-lg bg-white/5 border border-border-hero group-hover:border-accent/30 transition-colors">
                      <metric.icon size={20} style={{ color: metric.color }} />
                    </div>
                    <span className="text-[10px] md:text-[11px] font-bold text-text-hero-secondary uppercase tracking-widest">
                      {metric.label}
                    </span>
                  </div>
                  <div 
                    className={cn(
                      "text-4xl md:text-5xl font-mono font-bold tracking-tight",
                      loading && "animate-pulse opacity-50"
                    )}
                    style={{ color: metric.color }}
                  >
                    {metric.value}
                  </div>
                </motion.div>
              ))}
            </div>

            <div className="h-px w-full bg-gradient-to-r from-transparent via-border-hero to-transparent mb-12"></div>

            <div className="flex flex-col items-center text-center">
              <p className="text-sm text-text-hero-secondary/70 italic mb-8 max-w-lg">
                &quot;This dashboard contains protected performance data from served companies.&quot;
              </p>
              
              <Link to="/impact" className="group relative">
                <div className="absolute -inset-1 bg-accent/30 rounded-lg blur opacity-25 group-hover:opacity-60 transition duration-500"></div>
                <button className="relative px-10 py-5 bg-accent text-white rounded-lg flex items-center justify-center gap-3 font-bold transition-all duration-300 transform group-hover:scale-[1.02] active:scale-[0.98]">
                  <LockKeyhole size={20} />
                  Request Access to Impact Dashboard
                  <ArrowRight size={18} className="transition-transform duration-300 group-hover:translate-x-1" />
                </button>
              </Link>
              
              <p className="mt-4 text-[10px] text-text-hero-secondary/50 uppercase tracking-[0.2em]">
                Access is granted to verified visitors and strategic partners via the Contact page.
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
