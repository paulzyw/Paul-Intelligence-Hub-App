import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { SQLDataService } from '../services/sqlDataService';
import { OpportunityDataService } from '../services/opportunityDataService';
import { SQLOpportunity } from '../../types/sql';
import { OpportunitySession } from '../../types/opportunity_qualification';
import { SqlToOpportunityTable } from './SqlToOpportunityTable';
import { SQLtoOpportunity } from './SQLtoOpportunity';
import { SqlToOpportunityDetailsPage } from './SqlToOpportunityDetailsPage';
import { Bot, Sparkles, Check, Play, AlertCircle, RefreshCw, Layers, Clock, TrendingUp, ShieldAlert, Award, FileText } from 'lucide-react';

export const OpportunityQualificaitonModule: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [opportunities, setOpportunities] = useState<SQLOpportunity[]>([]);
  const [sessions, setSessions] = useState<Record<string, OpportunitySession>>({});
  const [selectedOpportunity, setSelectedOpportunity] = useState<SQLOpportunity | null>(null);
  const [activeDetailView, setActiveDetailView] = useState<'handover' | 'canvas'>('handover');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadPipelineData();
  }, []);

  const loadPipelineData = async () => {
    setLoading(true);
    try {
      // 1. Fetch opportunities
      const opps = await SQLDataService.getOpportunities();
      setOpportunities(opps);

      // 2. Fetch OQ Session state for each opportunity to display status badges
      const sessionsMap: Record<string, OpportunitySession> = {};
      await Promise.all(
        opps.map(async (opp) => {
          try {
            const sess = await OpportunityDataService.getSessionByOpportunity(opp.id);
            if (sess) {
              sessionsMap[opp.id] = sess;
            }
          } catch (e) {
            console.error("Failed to load OQ session for opp:", opp.id, e);
          }
        })
      );
      setSessions(sessionsMap);
    } catch (e) {
      console.error("Failed to load pipeline data:", e);
    } finally {
      setLoading(false);
    }
  };

  // Stats calculation
  const getStats = () => {
    const total = opportunities.length;
    let qualified = 0;
    let assessing = 0;
    let gaps = 0;
    let disqualified = 0;

    Object.values(sessions).forEach((s) => {
      if (s.qualification_status === 'QUALIFIED' || s.qualification_status === 'CONDITIONALLY_QUALIFIED') qualified++;
      else if (s.qualification_status === 'IN_PROGRESS') assessing++;
      else if (s.qualification_status === 'EVIDENCE_INSUFFICIENT') gaps++;
      else if (s.qualification_status === 'DISQUALIFIED') disqualified++;
    });

    const ready = total - Object.keys(sessions).length;

    return { total, qualified, assessing, gaps, disqualified, ready };
  };

  const stats = getStats();

  return (
    <div className="space-y-6">
      <AnimatePresence mode="wait">
        {!selectedOpportunity ? (
          <motion.div
            key="dashboard"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
          >
            {/* Elegant Header */}
            <div className="border-b border-zinc-200/60 pb-5">
              <h1 className="text-xl font-black text-zinc-800 uppercase tracking-tight flex items-center gap-2">
                <Layers className="h-5 w-5 text-zinc-700" />
                Opportunity Qualification Module
              </h1>
              <p className="text-xs text-zinc-500 mt-1 font-medium leading-relaxed">
                Conduct structured, AI-assisted verification to promote enterprise Sales Qualified Leads (SQLs) into validated active pipeline opportunities.
              </p>
            </div>

            {/* Stats Dashboard */}
            {loading ? (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 animate-pulse">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="h-24 bg-zinc-100 border border-zinc-200 rounded-2xl" />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-4 bg-white border border-zinc-200 rounded-2xl shadow-xs space-y-1">
                  <span className="text-[10px] font-bold uppercase text-zinc-400 block tracking-wider">Total Pipeline Scope</span>
                  <div className="flex justify-between items-baseline mt-2">
                    <span className="text-2xl font-black text-zinc-800 font-mono">{stats.total}</span>
                    <TrendingUp className="h-4 w-4 text-zinc-400" />
                  </div>
                </div>

                <div className="p-4 bg-white border border-zinc-200 rounded-2xl shadow-xs space-y-1">
                  <span className="text-[10px] font-bold uppercase text-zinc-400 block tracking-wider">Qualified & Promoted</span>
                  <div className="flex justify-between items-baseline mt-2">
                    <span className="text-2xl font-black text-emerald-600 font-mono">{stats.qualified}</span>
                    <Award className="h-4 w-4 text-emerald-400" />
                  </div>
                </div>

                <div className="p-4 bg-white border border-zinc-200 rounded-2xl shadow-xs space-y-1">
                  <span className="text-[10px] font-bold uppercase text-zinc-400 block tracking-wider">Gaps Active (OQ01-10)</span>
                  <div className="flex justify-between items-baseline mt-2">
                    <span className="text-2xl font-black text-amber-600 font-mono">{stats.gaps}</span>
                    <ShieldAlert className="h-4 w-4 text-amber-400" />
                  </div>
                </div>

                <div className="p-4 bg-white border border-zinc-200 rounded-2xl shadow-xs space-y-1">
                  <span className="text-[10px] font-bold uppercase text-zinc-400 block tracking-wider">OQ Assessments Pending</span>
                  <div className="flex justify-between items-baseline mt-2">
                    <span className="text-2xl font-black text-zinc-600 font-mono">{stats.ready}</span>
                    <Clock className="h-4 w-4 text-zinc-400" />
                  </div>
                </div>
              </div>
            )}

            {/* List Table */}
            {loading ? (
              <div className="flex flex-col items-center justify-center h-48 bg-zinc-50 border border-zinc-200 rounded-2xl">
                <RefreshCw className="h-5 w-5 text-zinc-500 animate-spin mb-2" />
                <span className="text-xs text-zinc-400 font-mono uppercase tracking-widest">Calibrating pipeline matrix...</span>
              </div>
            ) : (
              <SqlToOpportunityTable
                opportunities={opportunities}
                sessions={sessions}
                onSelect={(opp) => {
                  setSelectedOpportunity(opp);
                  setActiveDetailView('handover');
                }}
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
              />
            )}
          </motion.div>
        ) : (
          <motion.div
            key="details"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-4"
          >
            {/* View Mode Switcher Header */}
            <div className="flex items-center justify-between bg-bg-surface border border-border p-2.5 rounded-2xl">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setActiveDetailView('handover')}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                    activeDetailView === 'handover'
                      ? 'bg-accent text-black font-black shadow-sm'
                      : 'bg-transparent text-text-secondary hover:text-text-primary hover:bg-bg-primary/50'
                  }`}
                >
                  <FileText className="h-3.5 w-3.5" />
                  <span>SQL Handover &amp; Opportunity Form</span>
                </button>

                <button
                  onClick={() => setActiveDetailView('canvas')}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                    activeDetailView === 'canvas'
                      ? 'bg-accent text-black font-black shadow-sm'
                      : 'bg-transparent text-text-secondary hover:text-text-primary hover:bg-bg-primary/50'
                  }`}
                >
                  <Layers className="h-3.5 w-3.5" />
                  <span>OQ Evaluation Canvas</span>
                </button>
              </div>

              <span className="text-[10px] font-mono text-text-secondary hidden sm:inline px-3">
                {selectedOpportunity.company_name} • {selectedOpportunity.opportunity_name}
              </span>
            </div>

            {/* Active View Component */}
            {activeDetailView === 'handover' ? (
              <SqlToOpportunityDetailsPage
                opportunity={selectedOpportunity}
                onBack={() => {
                  setSelectedOpportunity(null);
                  loadPipelineData();
                }}
                onProceedToOQ={() => setActiveDetailView('canvas')}
              />
            ) : (
              <SQLtoOpportunity
                opportunity={selectedOpportunity}
                onBack={() => setActiveDetailView('handover')}
                onPromotedStatusChanged={loadPipelineData}
              />
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
export default OpportunityQualificaitonModule;
