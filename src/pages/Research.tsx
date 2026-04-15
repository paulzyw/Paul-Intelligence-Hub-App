import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Link } from 'react-router-dom';
import { supabase, type ResearchReport } from '../lib/supabase';
import { BarChart3, FileText, ArrowRight, Leaf, Gauge, Network, FlaskConical, HelpCircle, Calendar } from 'lucide-react';
import { cn } from '../lib/utils';

const ICON_MAP: Record<string, any> = {
  Leaf,
  Gauge,
  Network,
  FlaskConical,
  BarChart3,
};

export function Research() {
  const [reports, setReports] = useState<ResearchReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const reportsPerPage = 6;

  useEffect(() => {
    async function fetchReports() {
      try {
        const { data, error } = await supabase
          .from('research_reports')
          .select('*, report_types(*)')
          .eq('status', 'published')
          .order('published_at', { ascending: false });
        
        if (error) throw error;
        setReports(data || []);
      } catch (err) {
        console.error('Error fetching research reports:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchReports();
  }, []);

  const totalPages = Math.ceil(reports.length / reportsPerPage);
  const indexOfLastReport = currentPage * reportsPerPage;
  const indexOfFirstReport = indexOfLastReport - reportsPerPage;
  const currentReports = reports.slice(indexOfFirstReport, indexOfLastReport);

  return (
    <div className="min-h-screen bg-bg-primary py-20 transition-colors duration-400">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* HEADER */}
        <div className="mb-16 max-w-3xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <span className="inline-block px-3 py-1 bg-accent/10 text-accent text-xs font-bold rounded-full uppercase tracking-widest mb-4">
              Technical Briefs
            </span>
            <h1 className="text-4xl md:text-5xl font-bold text-text-primary mb-6 tracking-tight">
              Research & Analysis
            </h1>
            <p className="text-lg text-text-secondary leading-relaxed">
              In-depth technical reports, data-driven case studies, and strategic analysis 
              focused on SaaS growth, digital transformation, and operational excellence.
            </p>
          </motion.div>
        </div>

        {/* FEED */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="bg-bg-surface border border-border rounded-xl h-96 animate-pulse" />
            ))}
          </div>
        ) : reports.length === 0 ? (
          <div className="text-center py-20 bg-bg-surface border border-border rounded-2xl">
            <FileText size={48} className="mx-auto text-text-secondary mb-4 opacity-20" />
            <p className="text-text-secondary">No research reports published yet.</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {currentReports.map((report, index) => {
                const IconComp = ICON_MAP[report.report_types?.icon_name || ''] || HelpCircle;
                
                return (
                  <motion.div
                    key={report.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                    className="group flex flex-col bg-bg-surface border border-border rounded-xl overflow-hidden hover:border-accent hover:shadow-[0_0_30px_rgba(0,163,224,0.1)] transition-all duration-500"
                  >
                    <Link to={`/research/${report.slug}`} className="flex flex-col h-full">
                      {/* Feature Image */}
                      <div className="relative h-48 overflow-hidden bg-bg-primary">
                        {report.feature_image_url ? (
                          <img 
                            src={report.feature_image_url} 
                            alt={report.title}
                            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                            referrerPolicy="no-referrer"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-text-secondary/20">
                            <FileText size={48} />
                          </div>
                        )}
                        
                        {/* Data Badge */}
                        {report.highlight_metric && (
                          <div className="absolute top-4 right-4 bg-accent text-white px-3 py-1 rounded-full text-[10px] font-bold uppercase shadow-lg">
                            {report.highlight_metric}
                          </div>
                        )}
                      </div>

                      {/* Content */}
                      <div className="p-6 flex flex-col flex-grow">
                        <div className="flex items-center gap-2 mb-3">
                          <div className="p-1.5 bg-bg-primary rounded border border-border">
                            <IconComp size={14} className="text-accent" />
                          </div>
                          <span className="text-[10px] font-bold text-text-secondary uppercase tracking-widest">
                            {report.report_types?.name || 'Technical Report'}
                          </span>
                        </div>

                        <h3 className="text-xl font-bold text-text-primary mb-3 group-hover:text-accent transition-colors line-clamp-2">
                          {report.title}
                        </h3>

                        <p className="text-sm text-text-secondary mb-6 line-clamp-3 flex-grow leading-relaxed">
                          {report.summary}
                        </p>

                        <div className="flex items-center justify-between pt-4 border-t border-border">
                          <div className="flex items-center gap-2 text-[10px] text-text-secondary uppercase font-medium">
                            <Calendar size={12} />
                            {new Date(report.published_at || report.created_at).toLocaleDateString()}
                          </div>
                          <div className="flex items-center gap-1 text-xs font-bold text-accent uppercase tracking-wider group-hover:gap-2 transition-all">
                            Access Data Brief <ArrowRight size={14} />
                          </div>
                        </div>
                      </div>
                    </Link>
                  </motion.div>
                );
              })}
            </div>

            {/* PAGINATION */}
            <div className="flex justify-center items-center gap-2 mt-16">
              <button 
                onClick={() => {
                  setCurrentPage(prev => Math.max(prev - 1, 1));
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                disabled={currentPage === 1}
                className="px-4 py-2 rounded-full text-sm font-medium text-text-secondary hover:text-accent disabled:opacity-50 disabled:hover:text-text-secondary transition-colors"
              >
                Previous
              </button>
              
              {Array.from({ length: Math.max(totalPages, 1) }, (_, i) => i + 1).map(page => (
                <button
                  key={page}
                  onClick={() => {
                    setCurrentPage(page);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center font-bold transition-colors",
                    currentPage === page
                      ? "bg-accent text-white"
                      : "text-text-secondary hover:text-accent hover:bg-border"
                  )}
                >
                  {page}
                </button>
              ))}

              <button 
                onClick={() => {
                  setCurrentPage(prev => Math.min(prev + 1, totalPages));
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                disabled={currentPage === totalPages || totalPages === 0}
                className="px-4 py-2 rounded-full text-sm font-medium text-text-secondary hover:text-accent disabled:opacity-50 disabled:hover:text-text-secondary transition-colors"
              >
                Next
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
