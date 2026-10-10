import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { SQLDataService } from '../services/sqlDataService';
import { OpportunityDataService } from '../services/opportunityDataService';
import { SQLOpportunity } from '../../types/sql';
import { OpportunitySession } from '../../types/opportunity_qualification';
import { SqlToOpportunityTable } from './SqlToOpportunityTable';
import { SQLtoOpportunity } from './SQLtoOpportunity';
import { SqlToOpportunityDetailsPage } from './SqlToOpportunityDetailsPage';
import { OpportunityDynamicEvidenceForm } from './Opportunity_DynamicEvidenceForm';
import { OpportunityQualificaitonResult } from './Opportunity_QualificaitonResult';
import { Bot, Sparkles, Check, Play, AlertCircle, RefreshCw, Layers, Clock, TrendingUp, ShieldAlert, Award, FileText, ClipboardList, ShieldCheck } from 'lucide-react';

export const OpportunityQualificaitonModule: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [opportunities, setOpportunities] = useState<SQLOpportunity[]>([]);
  const [sessions, setSessions] = useState<Record<string, OpportunitySession>>({});
  const [selectedOpportunity, setSelectedOpportunity] = useState<SQLOpportunity | null>(null);
  const [activeDetailView, setActiveDetailView] = useState<'handover' | 'qualification_form' | 'canvas'>('handover');
  const [defaultToFormMap, setDefaultToFormMap] = useState<Record<string, boolean>>({});
  const [hasResultMap, setHasResultMap] = useState<Record<string, boolean>>({});
  const [activeOqResult, setActiveOqResult] = useState<any>(null);
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

      // 3. Pre-load default qualification form criteria map & result existence map
      try {
        const [formDefaults, resultsMap] = await Promise.all([
          OpportunityDataService.getQualificationFormDefaultsMap(opps.map(o => o.id)),
          OpportunityDataService.getQualificationResultsMap(opps.map(o => o.id))
        ]);
        setDefaultToFormMap(formDefaults);
        setHasResultMap(resultsMap);
      } catch (e) {
        console.warn("Could not pre-load defaults maps:", e);
      }
    } catch (e) {
      console.error("Failed to load pipeline data:", e);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectOpportunity = async (opp: SQLOpportunity) => {
    setSelectedOpportunity(opp);

    // 1. Check if qualification result already exists (highest priority for default display)
    const hasResultCached = hasResultMap[opp.id] ?? (
      (typeof window !== 'undefined' && localStorage.getItem('oq_has_result_' + opp.id) === 'true') ||
      (sessions[opp.id]?.qualification_status && sessions[opp.id]?.qualification_status !== 'NOT_STARTED' && (sessions[opp.id]?.overall_score || 0) > 0)
    );

    // 2. Check if qualification form criteria met (started + >= 1 evidence saved)
    const isFormDefault = defaultToFormMap[opp.id] ?? (
      (typeof window !== 'undefined' && localStorage.getItem('oq_started_' + opp.id) === 'true') &&
      (typeof window !== 'undefined' && localStorage.getItem('oq_has_saved_evidence_' + opp.id) === 'true')
    );

    if (hasResultCached) {
      setActiveDetailView('canvas'); // 3. Opportunity Qualification Result
    } else if (isFormDefault) {
      setActiveDetailView('qualification_form'); // 2. Opportunity Qualification Form
    } else {
      setActiveDetailView('handover'); // 1. SQL Handover & Opportunity Form
    }

    // 3. Async verify against Supabase database
    try {
      const verifiedResult = await OpportunityDataService.checkHasQualificationResult(opp.id);
      if (verifiedResult) {
        setActiveDetailView('canvas');
        setHasResultMap(prev => ({ ...prev, [opp.id]: true }));
      } else {
        const verifiedForm = await OpportunityDataService.checkShouldDefaultToQualificationForm(opp.id);
        setActiveDetailView(verifiedForm ? 'qualification_form' : 'handover');
        setDefaultToFormMap(prev => ({ ...prev, [opp.id]: verifiedForm }));
      }
    } catch (err) {
      console.warn('Async default view verification note:', err);
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
                onSelect={handleSelectOpportunity}
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
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between bg-bg-surface border border-border p-2.5 rounded-2xl gap-3">
              <div className="flex items-center gap-2 overflow-x-auto">
                <button
                  type="button"
                  onClick={() => setActiveDetailView('handover')}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shrink-0 ${
                    activeDetailView === 'handover'
                      ? 'bg-accent text-black font-black shadow-sm'
                      : 'bg-transparent text-text-secondary hover:text-text-primary hover:bg-bg-primary/50'
                  }`}
                >
                  <FileText className="h-3.5 w-3.5" />
                  <span>1. SQL Handover &amp; Opportunity Form</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveDetailView('qualification_form')}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shrink-0 ${
                    activeDetailView === 'qualification_form'
                      ? 'bg-accent text-black font-black shadow-sm'
                      : 'bg-transparent text-text-secondary hover:text-text-primary hover:bg-bg-primary/50'
                  }`}
                >
                  <ClipboardList className="h-3.5 w-3.5" />
                  <span>2. Opportunity Qualification Form</span>
                  <span className={`text-[9px] font-mono px-1.5 py-0.2 rounded ${
                    activeDetailView === 'qualification_form' ? 'bg-black/20 text-black font-black' : 'bg-bg-primary text-accent font-bold'
                  }`}>
                    10 Dims
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveDetailView('canvas')}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shrink-0 ${
                    activeDetailView === 'canvas'
                      ? 'bg-accent text-black font-black shadow-sm'
                      : 'bg-transparent text-text-secondary hover:text-text-primary hover:bg-bg-primary/50'
                  }`}
                >
                  <ShieldCheck className="h-3.5 w-3.5" />
                  <span>3. Opportunity Qualification Result</span>
                </button>
              </div>

              <div className="flex items-center justify-between sm:justify-end gap-2 px-2">
                <span className="text-[10px] font-mono text-text-secondary hidden md:inline">
                  {selectedOpportunity.company_name} • {selectedOpportunity.opportunity_name}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedOpportunity(null);
                    loadPipelineData();
                  }}
                  className="text-[11px] font-bold text-text-secondary hover:text-text-primary px-2 py-1 rounded-lg hover:bg-bg-primary/50 cursor-pointer"
                >
                  Exit To List
                </button>
              </div>
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
                onStartQualification={() => {
                  if (selectedOpportunity?.id) {
                    OpportunityDataService.recordStartQualification(selectedOpportunity.id);
                  }
                }}
              />
            ) : activeDetailView === 'qualification_form' ? (
              <OpportunityDynamicEvidenceForm
                opportunity={selectedOpportunity}
                onBack={() => setActiveDetailView('handover')}
                onProceedToAssessment={(evalResult?: any) => {
                  if (evalResult) setActiveOqResult(evalResult);
                  setActiveDetailView('canvas');
                }}
                onEvidenceSaved={() => {
                  if (selectedOpportunity?.id) {
                    setDefaultToFormMap(prev => ({ ...prev, [selectedOpportunity.id]: true }));
                  }
                  loadPipelineData();
                }}
              />
            ) : (
              <OpportunityQualificaitonResult
                opportunityId={selectedOpportunity.id}
                opportunity={selectedOpportunity}
                session={sessions[selectedOpportunity.id]}
                result={activeOqResult}
                onNavigateToEvidence={() => setActiveDetailView('qualification_form')}
                onPromote={async () => {
                  await loadPipelineData();
                  return true;
                }}
              />
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
export default OpportunityQualificaitonModule;
