import { motion, Variants } from 'motion/react';
import { Target, Zap, Eye, Leaf } from 'lucide-react';

export function About() {
  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.5
      }
    }
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.8, ease: "easeOut" }
    }
  };

  return (
    <div className="flex flex-col w-full bg-bg-primary text-text-primary min-h-screen">
      <motion.div 
        initial="hidden"
        animate="visible"
        variants={containerVariants}
        className="w-full"
      >
        {/* Section A: The Vision (Hero) */}
        <motion.section variants={itemVariants} className="w-full py-24 lg:py-32 px-4 sm:px-6 lg:px-8 border-b border-border">
          <div className="max-w-5xl mx-auto text-center">
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight mb-8 leading-tight text-text-primary">
              To architect a world where industrial legacy and digital intelligence converge to drive exponential, sustainable growth.
            </h1>
            <p className="text-xl md:text-2xl text-text-secondary max-w-4xl mx-auto leading-relaxed">
              I see a future where the most complex global industries are transformed into agile, data-first ecosystems that balance high-velocity profitability with environmental stewardship.
            </p>
          </div>
        </motion.section>

        {/* Section B: Purpose & Mission (The Dual Core) */}
        <motion.section variants={itemVariants} className="w-full py-20 px-4 sm:px-6 lg:px-8 border-b border-border">
          <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-12 lg:gap-20">
            <div>
              <h2 className="text-sm font-bold mb-6 text-accent uppercase tracking-wider">The Purpose</h2>
              <p className="text-lg md:text-xl text-text-secondary leading-relaxed">
                To prove that technology is the most powerful lever for human and economic progress. My 'Why' is rooted in the belief that data is a wasted resource unless it is translated into human value.
              </p>
            </div>
            <div>
              <h2 className="text-sm font-bold mb-6 text-accent uppercase tracking-wider">The Mission</h2>
              <p className="text-lg md:text-xl text-text-secondary leading-relaxed">
                To deliver measurable business outcomes through strategic SaaS leadership and disciplined digital transformation. I bridge the gap between strategy and realized revenue.
              </p>
            </div>
          </div>
        </motion.section>

        {/* Section C: Core Values (The 2x2 Grid) */}
        <motion.section variants={itemVariants} className="w-full py-20 px-4 sm:px-6 lg:px-8 border-b border-border">
          <div className="max-w-6xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Card 1 */}
              <div className="p-8 rounded-xl border border-border bg-bg-surface hover:border-accent transition-colors group">
                <Target className="w-10 h-10 text-accent mb-6 group-hover:scale-110 transition-transform" />
                <h3 className="text-xl font-bold mb-4 text-text-primary">Outcome Obsession</h3>
                <p className="text-text-secondary text-lg">
                  Success is measured by the bottom line: revenue growth and carbon mitigation.
                </p>
              </div>
              {/* Card 2 */}
              <div className="p-8 rounded-xl border border-border bg-bg-surface hover:border-accent transition-colors group">
                <Zap className="w-10 h-10 text-accent mb-6 group-hover:scale-110 transition-transform" />
                <h3 className="text-xl font-bold mb-4 text-text-primary">Strategic Velocity</h3>
                <p className="text-text-secondary text-lg">
                  Moving from data to execution with precision and pace.
                </p>
              </div>
              {/* Card 3 */}
              <div className="p-8 rounded-xl border border-border bg-bg-surface hover:border-accent transition-colors group">
                <Eye className="w-10 h-10 text-accent mb-6 group-hover:scale-110 transition-transform" />
                <h3 className="text-xl font-bold mb-4 text-text-primary">Radical Transparency</h3>
                <p className="text-text-secondary text-lg">
                  High-integrity communication for complex regional markets (APAC/China).
                </p>
              </div>
              {/* Card 4 */}
              <div className="p-8 rounded-xl border border-border bg-bg-surface hover:border-accent transition-colors group">
                <Leaf className="w-10 h-10 text-accent mb-6 group-hover:scale-110 transition-transform" />
                <h3 className="text-xl font-bold mb-4 text-text-primary">Sustainable Impact</h3>
                <p className="text-text-secondary text-lg">
                  Proving commercial success and 10M ton CO2 reduction are the same goal.
                </p>
              </div>
            </div>
          </div>
        </motion.section>

        {/* Section D: About This Website (The Digital Hub) */}
        <motion.section variants={itemVariants} className="w-full py-24 px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto">
            <div className="p-10 md:p-16 rounded-2xl border border-accent bg-bg-surface/40 backdrop-blur-lg shadow-[0_8px_32px_0_rgba(237,137,54,0.1)]">
              <h2 className="text-3xl font-bold mb-6 text-center text-text-primary">The Digital Intelligence Hub</h2>
              <p className="text-lg md:text-xl text-text-secondary text-center leading-relaxed">
                This platform is more than a portfolio; it is a live demonstration of Data-Driven Commercial Leadership. It serves as a consolidated resource for partners looking for proven SaaS growth frameworks and industrial transformation insights.
              </p>
            </div>
          </div>
        </motion.section>
      </motion.div>
    </div>
  );
}
