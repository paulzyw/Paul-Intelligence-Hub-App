import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import { X, Printer, Check } from 'lucide-react';
import { GTMOSProject } from '../types';
import { GTMReportPrintLayout } from './GTMReportPrintLayout';

interface Props {
  project: GTMOSProject;
  onClose: () => void;
}

const REPORT_ITEMS = [
  { id: 'workspaceConfig', label: 'Workspace Config' },
  { id: 'onboardingData', label: 'Onboarding Input Data' },
  { id: 'gtmStrategy', label: 'GTM Strategy' },
  { id: 'revenueDecomposition', label: 'Revenue Decomposition' },
  { id: 'executionPipeline', label: 'Execution Actions Pipeline' },
  { id: 'executionSufficiency', label: 'Execution Sufficiency Assessment' },
  { id: 'executionStatus', label: 'Execution Status' },
  { id: 'risksAndActions', label: 'Risks & Pivotal Actions' },
  { id: 'executiveInsights', label: 'Executive Insights' }
];

export const GTMReportReviewModal: React.FC<Props> = ({ project, onClose }) => {
  const [selectedItems, setSelectedItems] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    REPORT_ITEMS.forEach(item => {
      initial[item.id] = true; // All selected by default
    });
    return initial;
  });

  const [isInIframe, setIsInIframe] = useState(false);

  React.useEffect(() => {
    try {
      setIsInIframe(window.self !== window.top);
    } catch (e) {
      setIsInIframe(true);
    }
  }, []);

  const toggleItem = (id: string) => {
    setSelectedItems(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handlePrint = () => {
    try {
      window.print();
    } catch (e) {
      console.error("Print failed:", e);
    }
  };

  useEffect(() => {
    document.body.classList.add('print-mode-active');
    return () => {
      document.body.classList.remove('print-mode-active');
    };
  }, []);

  const modalContent = (
    <AnimatePresence>
      <div id="gtmos-print-root" className="fixed inset-0 z-50 flex bg-bg-primary/95 backdrop-blur-sm print:static print:block print:bg-white print:z-auto print:inset-auto print:w-full print:h-auto">
        
        {/* Configuration Sidebar (Hidden on Print) */}
        <div className="w-80 bg-bg-surface border-r border-border/50 flex flex-col print:hidden h-full">
          <div className="p-6 border-b border-border/50 flex items-center justify-between">
            <h2 className="text-lg font-black text-text-primary">Report Config</h2>
            <button onClick={onClose} className="p-2 hover:bg-bg-primary rounded-full transition-colors">
              <X className="h-5 w-5 text-text-secondary" />
            </button>
          </div>
          <div className="flex-grow overflow-y-auto p-6 space-y-4">
            <h3 className="text-xs font-bold text-text-secondary uppercase tracking-wider mb-2">Sections to Include</h3>
            {REPORT_ITEMS.map(item => (
              <div key={item.id} onClick={() => toggleItem(item.id)} className="flex items-center gap-3 p-3 rounded-lg border border-border/40 hover:bg-accent/5 cursor-pointer transition-colors group">
                <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${
                  selectedItems[item.id] ? 'bg-accent border-accent text-black' : 'border-border/60 bg-bg-primary group-hover:border-accent/50'
                }`}>
                  {selectedItems[item.id] && <Check className="h-3 w-3" />}
                </div>
                <span className="text-sm font-medium text-text-primary group-hover:text-accent transition-colors">{item.label}</span>
              </div>
            ))}
          </div>
          <div className="p-6 border-t border-border/50">
            {isInIframe && (
              <div className="mb-4 p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg">
                <p className="text-xs text-amber-500/90 leading-relaxed font-medium">
                  <strong>Preview Note:</strong> Browsers restrict printing inside embedded previews. To export the PDF, please click the <strong>"Open in new tab"</strong> icon at the top right of this preview window.
                </p>
              </div>
            )}
            <button
              onClick={handlePrint}
              className="w-full py-3 bg-accent text-black font-black text-sm rounded-xl hover:bg-accent/90 transition-colors flex items-center justify-center gap-2"
            >
              <Printer className="h-4 w-4" />
              Save as PDF / Print
            </button>
          </div>
        </div>

        {/* Print Preview Area */}
        <div className="flex-grow overflow-y-auto bg-black/5 p-8 flex justify-center print:p-0 print:bg-white print:block print:overflow-visible print:h-auto print:w-full">
          <div className="shadow-2xl print:shadow-none bg-white rounded-sm overflow-hidden print:overflow-visible print:w-full print:bg-white print:m-0 print:p-0">
            {/* Running Footer for Print */}
            <div className="hidden print:flex print-fixed-footer">
              <span className="text-[9px] font-mono text-slate-400 uppercase tracking-widest font-bold flex-1 text-left">RevOS GTMOS Report System</span>
              <span className="text-[9px] font-mono text-slate-400 uppercase tracking-widest font-bold flex-1 text-right">Internal / Confidential</span>
            </div>
            
            <table className="w-full hidden print:table">
              <thead className="table-header-group">
                <tr><td><div className="h-4"></div></td></tr>
              </thead>
              <tbody className="table-row-group">
                <tr>
                  <td>
                    <GTMReportPrintLayout project={project} selectedItems={selectedItems} />
                  </td>
                </tr>
              </tbody>
              <tfoot className="table-footer-group">
                <tr><td><div className="h-12"></div></td></tr>
              </tfoot>
            </table>
            
            <div className="print:hidden">
              <GTMReportPrintLayout project={project} selectedItems={selectedItems} />
            </div>
          </div>
        </div>
      </div>
    </AnimatePresence>
  );

  return createPortal(modalContent, document.body);
};
