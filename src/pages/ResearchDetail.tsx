import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { supabase, type ResearchReport } from '../lib/supabase';
import { ArrowLeft, Calendar, FileText, BarChart3, Leaf, Gauge, Network, FlaskConical, HelpCircle, Share2, Download, ZoomIn, ZoomOut, Maximize2 } from 'lucide-react';

const ICON_MAP: Record<string, any> = {
  Leaf,
  Gauge,
  Network,
  FlaskConical,
  BarChart3,
};

export function ResearchDetail() {
  const { slug } = useParams<{ slug: string }>();
  const [report, setReport] = useState<ResearchReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [iframeUrl, setIframeUrl] = useState<string | null>(null);
  const [iframeContent, setIframeContent] = useState<string | null>(null);
  const [zoom, setZoom] = useState(100);

  const handleZoom = (delta: number) => {
    setZoom(prev => Math.min(Math.max(prev + delta, 50), 150));
  };

  useEffect(() => {
    async function fetchReport() {
      try {
        const { data, error } = await supabase
          .from('research_reports')
          .select('*, report_types(*)')
          .eq('slug', slug)
          .single();
        
        if (error) throw error;
        setReport(data);

        // Get public URL for the HTML report
        if (data.report_html_path) {
          const { data: urlData } = supabase.storage
            .from('research-reports')
            .getPublicUrl(data.report_html_path);
          
          setIframeUrl(urlData.publicUrl);

          // Attempt to fetch content for srcDoc to ensure correct rendering and isolation
          try {
            const response = await fetch(urlData.publicUrl);
            if (response.ok) {
              const html = await response.text();
              setIframeContent(html);
            }
          } catch (fetchErr) {
            console.error('CORS or Fetch error, falling back to src:', fetchErr);
          }
        }
      } catch (err) {
        console.error('Error fetching research report:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchReport();
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen bg-bg-primary flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-accent"></div>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="min-h-screen bg-bg-primary flex flex-col items-center justify-center px-4">
        <h1 className="text-2xl font-bold text-text-primary mb-4">Report Not Found</h1>
        <Link to="/research" className="text-accent hover:underline flex items-center gap-2">
          <ArrowLeft size={18} /> Back to Research
        </Link>
      </div>
    );
  }

  const IconComp = ICON_MAP[report.report_types?.icon_name || ''] || HelpCircle;

  return (
    <div className="min-h-screen bg-bg-primary transition-colors duration-400">
      {/* HEADER BANNER */}
      <div className="relative h-[40vh] md:h-[50vh] w-full overflow-hidden">
        {report.feature_image_url ? (
          <img 
            src={report.feature_image_url} 
            alt={report.title}
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
          />
        ) : (
          <div className="w-full h-full bg-bg-hero-primary flex items-center justify-center">
            <BarChart3 size={80} className="text-accent opacity-20" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-bg-primary via-bg-primary/50 to-transparent"></div>
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 -mt-32 relative z-10 pb-20">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="bg-bg-surface border border-border rounded-2xl shadow-2xl overflow-hidden"
        >
          {/* REPORT INFO */}
          <div className="p-8 md:p-12 border-b border-border">
            <div className="max-w-4xl mx-auto">
              <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
                <Link to="/research" className="inline-flex items-center gap-2 text-sm font-bold text-accent uppercase tracking-widest hover:gap-3 transition-all">
                  <ArrowLeft size={16} /> Research Feed
                </Link>
                <div className="flex items-center gap-3">
                  <div className="flex items-center bg-bg-primary border border-border rounded-lg px-2 py-1 mr-2">
                    <button 
                      onClick={() => handleZoom(-10)}
                      className="p-1 text-text-secondary hover:text-accent transition-colors"
                      title="Zoom Out"
                    >
                      <ZoomOut size={16} />
                    </button>
                    <span className="text-[10px] font-bold text-text-primary w-10 text-center uppercase tracking-tighter">
                      {zoom}%
                    </span>
                    <button 
                      onClick={() => handleZoom(10)}
                      className="p-1 text-text-secondary hover:text-accent transition-colors"
                      title="Zoom In"
                    >
                      <ZoomIn size={16} />
                    </button>
                  </div>
                  <button className="p-2 text-text-secondary hover:text-accent transition-colors" title="Share Report">
                    <Share2 size={20} />
                  </button>
                  <button className="p-2 text-text-secondary hover:text-accent transition-colors" title="Download PDF">
                    <Download size={20} />
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-bg-primary rounded border border-border">
                  <IconComp size={20} className="text-accent" />
                </div>
                <span className="text-xs font-bold text-text-secondary uppercase tracking-[0.2em]">
                  {report.report_types?.name || 'Technical Brief'}
                </span>
              </div>

              <h1 className="text-3xl md:text-5xl font-bold text-text-primary mb-6 leading-tight">
                {report.title}
              </h1>

              <div className="flex flex-wrap items-center gap-6 mb-8 text-sm text-text-secondary">
                <div className="flex items-center gap-2">
                  <Calendar size={16} />
                  {new Date(report.published_at || report.created_at).toLocaleDateString()}
                </div>
                <div className="flex items-center gap-2">
                  <FileText size={16} />
                  Technical Publication
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start">
                <div className="md:col-span-2">
                  <h3 className="text-xs font-bold text-text-secondary uppercase tracking-widest mb-4">Executive Summary</h3>
                  <p className="text-lg text-text-primary leading-relaxed font-light">
                    {report.summary}
                  </p>
                </div>
                {report.highlight_metric && (
                  <div className="bg-accent p-6 rounded-xl text-white shadow-xl shadow-accent/20">
                    <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] mb-2 opacity-80">Key Result Metric</h3>
                    <div className="text-3xl font-bold tracking-tight">
                      {report.highlight_metric}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* IFRAME VIEWER */}
          <div className="bg-[#F8F9FA]">
            <div className="bg-white overflow-hidden min-h-[1000px] relative">
              {iframeUrl || iframeContent ? (
                <iframe 
                  srcDoc={iframeContent ? `
                    <!DOCTYPE html>
                    <html>
                      <head>
                        <meta charset="utf-8">
                        <meta name="viewport" content="width=device-width, initial-scale=1">
                        <style>
                          html { 
                            background-color: white !important; 
                            color-scheme: light !important;
                            margin: 0;
                            padding: 0;
                            height: 100%;
                            overflow-x: hidden;
                          }
                          body { 
                            margin: 0;
                            padding: 0;
                            display: flex;
                            flex-direction: column;
                            align-items: center;
                            min-height: 100%;
                            box-sizing: border-box;
                            background-color: white !important;
                            overflow-x: hidden;
                          }
                          .report-container { 
                            background-color: white !important; 
                            color: black !important; 
                            display: flex;
                            flex-direction: column;
                            align-items: center;
                            zoom: ${zoom}%;
                            -moz-transform: scale(${zoom / 100});
                            -moz-transform-origin: top center;
                            width: ${10000 / zoom}%;
                            max-width: 100vw;
                            overflow-x: auto;
                            box-sizing: border-box;
                          }
                          /* Ensure all direct children of the report are centered */
                          .report-container > * {
                            max-width: 100%;
                            flex-shrink: 0;
                          }
                          /* Ensure images don't overflow */
                          img { max-width: 100%; height: auto; }
                          * { box-sizing: border-box; }
                        </style>
                      </head>
                      <body>
                        <div class="report-container">
                          ${iframeContent}
                        </div>
                      </body>
                    </html>
                  ` : undefined}
                  src={!iframeContent ? iframeUrl || undefined : undefined} 
                  title={report.title}
                  className="w-full min-h-[1000px] border-none"
                  sandbox="allow-scripts allow-same-origin"
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center text-gray-400">
                  <p>Loading report content...</p>
                </div>
              )}
            </div>
          </div>

          <div className="p-8 bg-bg-primary border-t border-border text-center">
            <p className="text-sm text-text-secondary mb-4 italic">
              This report was generated and published via the Paul Wang Digital Intelligence Hub.
            </p>
            <Link to="/contact" className="text-accent font-bold uppercase text-xs tracking-widest hover:underline">
              Discuss these findings with Paul
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
