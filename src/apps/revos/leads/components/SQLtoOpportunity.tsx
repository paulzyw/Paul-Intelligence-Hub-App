import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { SQLOpportunity } from '../../types/sql';
import { OpportunitySession, OpportunityEvidenceRecord, OpportunityQualificationResult } from '../../types/opportunity_qualification';
import { OpportunityDataService } from '../services/opportunityDataService';
import { SQLDataService } from '../services/sqlDataService';
import { OpportunityDynamicEvidenceForm } from './Opportunity_DynamicEvidenceForm';
import { OpportunityQualificaitonResult } from './Opportunity_QualificaitonResult';
import { Bot, Sparkles, Check, Play, AlertCircle, ArrowLeft, Landmark, RefreshCw, Calendar, Layers, Clock, HelpCircle } from 'lucide-react';

// Import local JSON config files directly (frozen assets in /src/config/)
import oqEvidenceKbJson from '../../../../config/Opportunity_evidence_knowledge_base.json';
import oqRulesJson from '../../../../config/Opportunity_qualification_rules.json';
import oqIndustryConfigJson from '../../../../config/Opportunity_industry_configuration_JSON.json';

const OQ_KB = (oqEvidenceKbJson as any).opportunity_evidence_knowledge_base;
const OQ_RULES = (oqRulesJson as any).opportunity_qualification_rules;
const OQ_CONFIG = oqIndustryConfigJson as any;

interface SQLtoOpportunityProps {
  opportunity: SQLOpportunity;
  onBack: () => void;
  onPromotedStatusChanged: () => void;
}

export const SQLtoOpportunity: React.FC<SQLtoOpportunityProps> = ({
  opportunity,
  onBack,
  onPromotedStatusChanged
}) => {
  const [view, setView] = useState<'intake' | 'result'>('intake');
  const [loading, setLoading] = useState(true);
  const [evaluating, setEvaluating] = useState(false);
  const [promoting, setPromoting] = useState(false);

  // States
  const [session, setSession] = useState<OpportunitySession | null>(null);
  const [savedEvidence, setSavedEvidence] = useState<OpportunityEvidenceRecord[]>([]);
  const [qualificationResult, setQualificationResult] = useState<OpportunityQualificationResult | null>(null);

  // Dimension details
  const OQ_DIMENSIONS = [
    { code: 'OQ01', name: 'Opp Definition & Context', desc: 'Enterprise boundaries & metadata definition' },
    { code: 'OQ02', name: 'Problem & Impact Validation', desc: 'Validate current business challenges' },
    { code: 'OQ03', name: 'Solution Relevance & Fit', desc: 'Assess technical applicability' },
    { code: 'OQ04', name: 'Engagement & Commitment', desc: 'Customer meeting engagement' },
    { code: 'OQ05', name: 'Stakeholder ID & Access', desc: 'Check economic buyers & champions' },
    { code: 'OQ06', name: 'Buying Process Map', desc: 'Understand procurement and law gates' },
    { code: 'OQ07', name: 'Commercial & Funding Path', desc: 'Validate active budget allocation' },
    { code: 'OQ08', name: 'Timeline & Urgency', desc: 'Establish exact Q4 milestones' },
    { code: 'OQ09', name: 'Advancement Evidence', desc: 'Concrete action-based commitment' },
    { code: 'OQ10', name: 'Opportunity Risk Audit', desc: 'Flag potential deal breakers & risks' }
  ];

  const [activeDimension, setActiveDimension] = useState<string>('OQ01');

  useEffect(() => {
    if (opportunity?.id) {
      initSession();
    }
  }, [opportunity?.id]);

  const initSession = async () => {
    if (!opportunity?.id) return;
    setLoading(true);
    try {
      // 1. Fetch SQL QIP inheritance details from existing SQL qualification runs
      let sqlQip: any = {};
      try {
        const result = await SQLDataService.getSavedQualificationResult(opportunity.id);
        if (result) {
          sqlQip = result;
        }
      } catch (e) {
        console.warn("Could not load SQL QIP inheritance details:", e);
      }

      // 2. Fetch or create session
      let sess = await OpportunityDataService.getSessionByOpportunity(opportunity.id);
      if (!sess) {
        sess = await OpportunityDataService.createSession(opportunity.id, {
          sqlInheritanceData: sqlQip,
          revenueMotion: opportunity.revenue_motion || 'Digital Solution Selling',
          industry: opportunity.industry || 'Enterprise Software'
        });
      }
      setSession(sess);

      // 3. Load evidence records
      const evRecords = await OpportunityDataService.getEvidenceRecords(sess.id);
      setSavedEvidence(evRecords);

      // 4. Load qualification results if available
      try {
        const fullResult = await OpportunityDataService.retrieveResult(sess.id);
        if (fullResult && fullResult.results) {
          setQualificationResult(fullResult.results);
          setView('result');
        }
      } catch (err) {
        // No results computed yet, keep intake view
      }
    } catch (error) {
      console.error("Failed to initialize OQ Session:", error);
    } finally {
      setLoading(false);
    }
  };

  if (!opportunity) return null;

  const handleEvidenceSaved = async () => {
    if (!session) return;
    const evRecords = await OpportunityDataService.getEvidenceRecords(session.id);
    setSavedEvidence(evRecords);
  };

  const executeOQReasoning = async () => {
    if (!session) return;
    setEvaluating(true);
    try {
      // Execute REST AI evaluation using the Edge Function
      const res = await OpportunityDataService.executeReasoning(session.id, {
        sql_inheritance_context: session.sql_inheritance_data || {},
        opportunity_assessment_context: {},
        industry_config: OQ_CONFIG,
        evidence_kb: OQ_KB,
        qualification_rules: OQ_RULES
      });

      // Reload
      await initSession();
      setView('result');
    } catch (e) {
      console.error("OQ evaluation execution failed:", e);
      alert("AI Evaluation failed. Please make sure that you saved some evidence and try again.");
    } finally {
      setEvaluating(false);
    }
  };

  const handlePromoteToPipeline = async () => {
    if (!session || !qualificationResult) return;
    setPromoting(true);
    try {
      await OpportunityDataService.promoteToOpportunity(opportunity.id, session.id);
      // Reload session
      const updatedSess = await OpportunityDataService.getSessionByOpportunity(opportunity.id);
      setSession(updatedSess);
      onPromotedStatusChanged();
    } catch (e) {
      console.error("Pipeline promotion failed:", e);
    } finally {
      setPromoting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-96 bg-zinc-50 border border-zinc-200 rounded-2xl p-6">
        <RefreshCw className="h-6 w-6 text-zinc-600 animate-spin mb-2" />
        <span className="text-xs text-zinc-500 font-mono">LOADING OQ PIPELINE AGENT...</span>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="flex flex-col items-center justify-center h-96 bg-zinc-50 border border-zinc-200 rounded-2xl p-6 text-center max-w-md mx-auto my-12">
        <AlertCircle className="h-10 w-10 text-red-500 mb-4 animate-bounce" />
        <h3 className="text-sm font-black text-zinc-800 uppercase tracking-wider mb-2">Failed to Initialize OQ Session</h3>
        <p className="text-xs text-zinc-500 mb-6 leading-relaxed">
          The pipeline evaluation agent could not establish a session with the qualification server. This usually happens if the Supabase Edge Function returned an error.
        </p>
        <div className="flex gap-3 w-full">
          <button
            onClick={onBack}
            className="flex-1 px-4 py-2.5 text-xs font-bold border border-zinc-200 text-zinc-700 bg-white rounded-xl hover:bg-zinc-50 transition-all cursor-pointer uppercase font-mono shadow-xs"
          >
            Cancel
          </button>
          <button
            onClick={initSession}
            className="flex-1 px-4 py-2.5 text-xs font-bold bg-zinc-850 text-white rounded-xl hover:bg-zinc-900 transition-all cursor-pointer uppercase font-mono flex items-center justify-center gap-1.5 shadow-sm"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Back Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={onBack}
          className="p-1.5 rounded-lg border border-zinc-200 bg-white hover:border-zinc-400 hover:text-zinc-800 transition-all cursor-pointer shadow-xs"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <div>
          <span className="text-[10px] font-black font-mono uppercase tracking-widest text-zinc-400">
            {opportunity.company_name} • SQL Opportunity Canvas
          </span>
          <h1 className="text-lg font-black text-zinc-800 tracking-tight">
            {opportunity.opportunity_name}
          </h1>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Dimensions Navigation Sidebar */}
        <div className="lg:col-span-4 bg-white p-4 rounded-2xl border border-zinc-200 shadow-xs space-y-1.5">
          <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider block px-2 mb-3">OQ Dimensions</span>
          {OQ_DIMENSIONS.map((d) => {
            const hasValue = savedEvidence.some(e => e.dimension_code === d.code && e.answer_value.trim() !== '');
            const isActive = activeDimension === d.code;
            return (
              <button
                key={d.code}
                onClick={() => {
                  setActiveDimension(d.code);
                  setView('intake');
                }}
                className={`w-full text-left p-3 rounded-xl border flex items-center justify-between transition-all cursor-pointer ${
                  isActive
                    ? 'bg-zinc-850 text-white border-zinc-800 font-bold'
                    : 'bg-transparent border-transparent text-zinc-500 hover:bg-zinc-50 hover:text-zinc-800'
                }`}
              >
                <div className="min-w-0 pr-2">
                  <div className="text-xs font-bold truncate">{d.name}</div>
                  <div className="text-[10px] text-zinc-400 truncate mt-0.5 font-medium">{d.desc}</div>
                </div>
                {hasValue && (
                  <Check className={`h-4 w-4 shrink-0 ml-2 ${isActive ? 'text-white' : 'text-emerald-500'}`} />
                )}
              </button>
            );
          })}

          <div className="pt-4 border-t border-zinc-100 mt-4 space-y-2">
            {qualificationResult && (
              <button
                onClick={() => setView('result')}
                className={`w-full px-4 py-2 text-xs font-bold uppercase rounded-xl border transition-all cursor-pointer text-center ${
                  view === 'result'
                    ? 'bg-zinc-800 text-white border-zinc-800'
                    : 'bg-zinc-50 hover:bg-zinc-100 text-zinc-700 border-zinc-200'
                }`}
              >
                View Assessment Result
              </button>
            )}

            <button
              onClick={executeOQReasoning}
              disabled={evaluating || savedEvidence.length === 0}
              className="w-full px-4 py-2.5 bg-zinc-850 hover:scale-[1.01] active:scale-[0.99] text-white font-black uppercase text-xs rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-md shadow-zinc-800/15 disabled:opacity-40"
            >
              {evaluating ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin text-white" />
                  Analyzing pipeline...
                </>
              ) : (
                <>
                  <Bot className="h-4 w-4 text-white" />
                  Evaluate OQ Decision
                </>
              )}
            </button>
          </div>
        </div>

        {/* Right Active Assessment Panel */}
        <div className="lg:col-span-8">
          <AnimatePresence mode="wait">
            {view === 'intake' ? (
              <motion.div
                key="intake"
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
              >
                <OpportunityDynamicEvidenceForm
                  sessionId={session!.id}
                  opportunityId={opportunity.id}
                  revenueMotion={session!.revenue_motion}
                  industry={session!.industry}
                  activeDimensionCode={activeDimension}
                  evidenceKb={OQ_KB}
                  savedEvidence={savedEvidence}
                  onEvidenceSaved={handleEvidenceSaved}
                />
              </motion.div>
            ) : (
              <motion.div
                key="result"
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
              >
                <OpportunityQualificaitonResult
                  opportunityId={opportunity.id}
                  opportunity={opportunity}
                  session={session!}
                  result={qualificationResult!}
                  onPromote={async () => {
                    await handlePromoteToPipeline();
                    return true;
                  }}
                  promoting={promoting}
                  onNavigateToEvidence={(dimId) => {
                    setActiveDimension(dimId);
                    setView('intake');
                  }}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};
