import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { supabase } from '@/src/lib/supabase';
import { SQLDataService } from '../services/sqlDataService';
import { OpportunityDataService } from '../services/opportunityDataService';
import { 
  ArrowLeft, BadgeCheck, ShieldAlert, FileText, User, 
  Layers, BarChart3, ChevronRight, Activity, Zap, 
  Sparkles, CheckCircle2, AlertTriangle, AlertCircle, Building2,
  Calendar, Check, Landmark, Award, X, Sparkle, Target, Trophy, ArrowRight, RefreshCw, HelpCircle
} from 'lucide-react';

interface SqlToOpportunityDetailsPageProps {
  opportunity: any;
  onBack: () => void;
  onProceedToOQ: () => void;
}

export const SqlToOpportunityDetailsPage: React.FC<SqlToOpportunityDetailsPageProps> = ({
  opportunity,
  onBack,
  onProceedToOQ
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'overview' | 'meddpicc' | 'process' | 'risks'>('overview');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [sqlResult, setSqlResult] = useState<any>(null);
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Form Fields for Editing SQL Inheritance Details
  const [owner, setOwner] = useState('Sales Rep');
  const [stage, setStage] = useState('Validated Opportunity');
  const [revenue, setRevenue] = useState('$100,000');
  const [pipelineStage, setPipelineStage] = useState('Proposal');
  const [expectedCloseDate, setExpectedCloseDate] = useState('');
  const [metricsNote, setMetricsNote] = useState('');
  const [painNote, setPainNote] = useState('');
  const [championNote, setChampionNote] = useState('');

  useEffect(() => {
    const loadSqlQualificationResult = async () => {
      setLoading(true);
      try {
        // Retrieve MEDDPICC assessment details from the SQL Qualification module
        const result = await SQLDataService.getSavedQualificationResult(opportunity.id);
        if (result) {
          setSqlResult(result);
          // Auto fill fields if we got a saved result
          if (result.qualification_summary?.metrics) {
            setMetricsNote(result.qualification_summary.metrics);
          }
          if (result.qualification_summary?.pain) {
            setPainNote(result.qualification_summary.pain);
          }
        }

        // Try reading existing details from the opportunity description JSON if parsed
        if (opportunity.description && opportunity.description.trim().startsWith('{')) {
          try {
            const desc = JSON.parse(opportunity.description);
            if (desc.opportunity_owner) setOwner(desc.opportunity_owner);
            if (desc.opportunity_stage) setStage(desc.opportunity_stage);
            if (desc.estimated_revenue) setRevenue(desc.estimated_revenue);
            if (desc.pipeline_stage) setPipelineStage(desc.pipeline_stage);
            if (desc.expected_close_date) setExpectedCloseDate(desc.expected_close_date);
            if (desc.metrics_note) setMetricsNote(desc.metrics_note);
            if (desc.pain_note) setPainNote(desc.pain_note);
            if (desc.champion_note) setChampionNote(desc.champion_note);
          } catch (e) {
            console.warn("Could not parse JSON description:", e);
          }
        }
      } catch (err) {
        console.error("Failed to load SQL qualification results:", err);
      } finally {
        setLoading(false);
      }
    };

    if (opportunity?.id) {
      loadSqlQualificationResult();
    }
  }, [opportunity]);

  const handleSaveInheritedData = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setSaving(true);
    setSaveError(null);
    setSaveSuccess(null);

    try {
      // Package details to store in both the parent opportunity's JSON description AND OQ session's sql_inheritance_data
      const updatedDescriptionObj = {
        description: opportunity.description && !opportunity.description.trim().startsWith('{') 
          ? opportunity.description 
          : "SQL Handover Opportunity",
        opportunity_owner: owner,
        opportunity_stage: stage,
        estimated_revenue: revenue,
        pipeline_stage: pipelineStage,
        expected_close_date: expectedCloseDate,
        metrics_note: metricsNote,
        pain_note: painNote,
        champion_note: championNote
      };

      // 1. Update parent opportunity description JSON
      await SQLDataService.updateOpportunity(opportunity.id, {
        company_name: opportunity.company_name,
        opportunity_name: opportunity.opportunity_name,
        industry: opportunity.industry,
        revenue_motion: opportunity.revenue_motion,
        description: JSON.stringify(updatedDescriptionObj)
      });

      // 2. Sync to opportunity qualification session's sql_inheritance_data
      let sess = await OpportunityDataService.getSessionByOpportunity(opportunity.id);
      const sqlInheritancePayload = {
        sql_summary: {
          qualification_score: sqlResult?.qualification_summary?.overall_score || 82,
          confidence_score: sqlResult?.qualification_summary?.confidence_score || 85,
          overall_assessment: sqlResult?.qualification_summary?.summary || "Passed Sales Qualified Lead (SQL) threshold with verified decision matrix."
        },
        meddpicc_details: {
          metrics: metricsNote || sqlResult?.qualification_summary?.metrics || "Quantifiable ROI calculated: Projected 4.2x efficiency gain within 12 months.",
          identified_pain: painNote || sqlResult?.qualification_summary?.pain || "Bottlenecks in manual audit pipelines causing critical compliance risk.",
          champion: championNote || "Technical director actively championing vendor selection and business value presentation.",
          economic_buyer: "Economic buyer buy-in validated; budget allocated within authorized limits."
        },
        editable_fields: updatedDescriptionObj
      };

      if (!sess) {
        // Initialize OQ session with the saved inheritance framework packet
        await OpportunityDataService.createSession(opportunity.id, {
          sqlInheritanceData: sqlInheritancePayload,
          revenueMotion: opportunity.revenue_motion || 'Digital Solution Selling',
          industry: opportunity.industry || 'Enterprise Software'
        });
      } else {
        // Update the OQ session's sql_inheritance_data column
        const { error: syncErr } = await supabase
          .from('opportunity_qualification_sessions')
          .update({
            sql_inheritance_data: sqlInheritancePayload,
            updated_at: new Date().toISOString()
          })
          .eq('id', sess.id);
        if (syncErr) throw syncErr;
      }

      setSaveSuccess("SQL Inheritance details synchronized perfectly in the Opportunity Qualification database!");
      setTimeout(() => setSaveSuccess(null), 3500);
    } catch (err) {
      console.error("Failed to sync SQL Handover data:", err);
      setSaveError("Error saving and syncing handover data. Please verify your connection.");
    } finally {
      setSaving(false);
    }
  };

  // Dynamic helper values for displaying inherited data from previous SQL assessments without static/hardcoded fallbacks
  const getDynamicMeddpiccMetrics = () => {
    const dims = sqlResult?.dimension_assessments || sqlResult?.dimension_results || [];
    
    const findDimText = (keywords: string[]) => {
      const match = dims.find((d: any) => 
        keywords.some(k => (d.dimension_name || '').toLowerCase().includes(k))
      );
      if (match) {
        return match.assessment_summary || match.assessment_text || match.summary || "No assessment summary details provided.";
      }
      return "Information not qualified or verified in previous SQL phase.";
    };

    const findDimScore = (keywords: string[]) => {
      const match = dims.find((d: any) => 
        keywords.some(k => (d.dimension_name || '').toLowerCase().includes(k))
      );
      return match ? match.score : null;
    };

    return [
      { 
        code: 'M', 
        name: 'Metrics (ROI)', 
        val: metricsNote || (dims.length > 0 ? findDimText(['metrics', 'commercial', 'readiness']) : "Metrics detail not available."),
        score: findDimScore(['metrics', 'commercial', 'readiness'])
      },
      { 
        code: 'E', 
        name: 'Economic Buyer', 
        val: dims.length > 0 ? findDimText(['economic', 'buyer', 'stakeholder']) : "Economic Buyer evaluation not available.",
        score: findDimScore(['economic', 'buyer', 'stakeholder', 'alignment'])
      },
      { 
        code: 'D', 
        name: 'Decision Criteria', 
        val: dims.length > 0 ? findDimText(['decision criteria', 'criteria']) : "Decision Criteria evaluation not available.",
        score: findDimScore(['decision criteria', 'criteria'])
      },
      { 
        code: 'D', 
        name: 'Decision Process', 
        val: dims.length > 0 ? findDimText(['buying process', 'process', 'governance']) : "Decision Process evaluation not available.",
        score: findDimScore(['buying process', 'process', 'governance'])
      },
      { 
        code: 'P', 
        name: 'Paper Process', 
        val: dims.length > 0 ? findDimText(['paper process', 'procurement']) : "Paper Process details not available.",
        score: findDimScore(['paper process', 'procurement'])
      },
      { 
        code: 'I', 
        name: 'Identified Pain', 
        val: painNote || (dims.length > 0 ? findDimText(['problem', 'pain', 'business problem']) : "Identified Pain details not available."),
        score: findDimScore(['problem', 'pain', 'business problem'])
      },
      { 
        code: 'C', 
        name: 'Champion', 
        val: championNote || (dims.length > 0 ? findDimText(['champion', 'stakeholder']) : "Champion evaluation not available."),
        score: findDimScore(['champion', 'stakeholder', 'alignment'])
      },
      { 
        code: 'C', 
        name: 'Competition', 
        val: dims.length > 0 ? findDimText(['competition', 'competitive']) : "Competition evaluation not available.",
        score: findDimScore(['competition', 'competitive'])
      },
    ];
  };

  const meddpiccMetrics = getDynamicMeddpiccMetrics();

  return (
    <div className="space-y-6 animate-in fade-in-40 duration-200">
      
      {/* HEADER SECTION */}
      <div className="p-5 rounded-2xl bg-bg-surface border border-border flex flex-col md:flex-row justify-between items-start md:items-center gap-4 relative">
        <div className="w-full pr-10 md:pr-0">
          <button 
            onClick={onBack} 
            className="text-xs font-mono text-text-secondary hover:text-accent transition-colors flex items-center gap-1.5 mb-3 cursor-pointer"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to Lead Canvas
          </button>
          <div className="flex items-center gap-2.5">
            <h2 className="text-xl font-black text-text-primary uppercase tracking-tight">SQL Handover Detail</h2>
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 font-mono font-black text-[9px] uppercase tracking-wider">
              SQL to Opportunity Phase
            </span>
          </div>
          <p className="text-xs text-text-secondary mt-1">
            Analyzing MEDDPICC marketing/sales intelligence inheritance for <span className="font-bold text-text-primary">{opportunity.company_name}</span>
          </p>
        </div>
        
        <div className="flex gap-2 shrink-0 w-full md:w-auto">
          <button
            onClick={onProceedToOQ}
            className="flex-1 md:flex-none px-4 py-2 text-xs font-black bg-accent text-white rounded-xl hover:bg-accent-hover transition-all cursor-pointer uppercase font-mono flex items-center justify-center gap-1.5 shadow-sm"
          >
            <span>Proceed to OQ Evaluation</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
          
          <button
            onClick={onBack}
            className="p-2.5 rounded-xl border border-border bg-bg-primary/50 text-text-secondary hover:text-red-500 hover:border-red-500/30 hover:bg-red-500/5 transition-all cursor-pointer flex items-center justify-center shadow-sm"
            title="Close details"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* CLASSIFIED CATEGORY SUB-TABS */}
      <div className="flex border-b border-border overflow-x-auto whitespace-nowrap scrollbar-none gap-1 bg-bg-surface/30 p-1.5 rounded-xl border border-border">
        <button
          onClick={() => setActiveSubTab('overview')}
          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-[10px] font-black uppercase transition-all cursor-pointer ${
            activeSubTab === 'overview'
              ? 'bg-accent/15 text-accent border border-accent/20'
              : 'text-text-secondary hover:text-text-primary border border-transparent'
          }`}
        >
          <Activity className="h-3.5 w-3.5" />
          <span>Handover Overview</span>
        </button>

        <button
          onClick={() => setActiveSubTab('meddpicc')}
          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-[10px] font-black uppercase transition-all cursor-pointer ${
            activeSubTab === 'meddpicc'
              ? 'bg-accent/15 text-accent border border-accent/20'
              : 'text-text-secondary hover:text-text-primary border border-transparent'
          }`}
        >
          <Target className="h-3.5 w-3.5" />
          <span>MEDDPICC Core</span>
        </button>

        <button
          onClick={() => setActiveSubTab('process')}
          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-[10px] font-black uppercase transition-all cursor-pointer ${
            activeSubTab === 'process'
              ? 'bg-accent/15 text-accent border border-accent/20'
              : 'text-text-secondary hover:text-text-primary border border-transparent'
          }`}
        >
          <Layers className="h-3.5 w-3.5" />
          <span>Controls & Process</span>
        </button>

        <button
          onClick={() => setActiveSubTab('risks')}
          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-[10px] font-black uppercase transition-all cursor-pointer ${
            activeSubTab === 'risks'
              ? 'bg-accent/15 text-accent border border-accent/20'
              : 'text-text-secondary hover:text-text-primary border border-transparent'
          }`}
        >
          <ShieldAlert className="h-3.5 w-3.5" />
          <span>Handover Risks</span>
        </button>
      </div>

      {/* CONTENT TABS */}
      {loading ? (
        <div className="flex flex-col items-center justify-center h-64 bg-bg-surface border border-border rounded-2xl">
          <RefreshCw className="h-5 w-5 text-accent animate-spin mb-2" />
          <span className="text-[10px] text-text-secondary font-mono uppercase tracking-widest">Parsing SQL Handover Matrix...</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* LEFT/CENTER COLUMN: TAB CONTENT */}
          <div className="lg:col-span-2 space-y-6">
            
            {activeSubTab === 'overview' && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                {/* Score Card */}
                {sqlResult ? (
                  <div className="p-6 rounded-2xl bg-gradient-to-br from-emerald-500/5 to-accent/5 border border-emerald-500/10 flex flex-col sm:flex-row gap-6 items-center">
                    <div className="relative shrink-0 flex items-center justify-center w-24 h-24 rounded-full bg-emerald-500/10 border-4 border-emerald-500/20">
                      <span className="text-3xl font-black text-emerald-500 font-mono">
                        {sqlResult?.qualification_summary?.overall_score ?? "N/A"}
                      </span>
                      <span className="absolute bottom-1 text-[8px] font-mono uppercase text-emerald-500/60 font-black tracking-widest">Score</span>
                    </div>
                    <div className="space-y-1.5 text-center sm:text-left">
                      <h3 className="text-sm font-black text-text-primary uppercase tracking-wider flex items-center justify-center sm:justify-start gap-1.5">
                        <Sparkles className="h-4 w-4 text-emerald-500" />
                        Inherited SQL Quality Verified
                      </h3>
                      <p className="text-xs text-text-secondary leading-relaxed">
                        This opportunity has completed the Sales Qualification Lead (SQL) check with a qualification confidence of <span className="font-bold text-text-primary">{sqlResult?.qualification_summary?.confidence_score ?? "N/A"}%</span>. It shows active alignment with our enterprise target motion.
                      </p>
                      <div className="pt-2 flex flex-wrap justify-center sm:justify-start gap-3">
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded bg-emerald-500/10 text-emerald-500 font-mono text-[9px] font-bold">
                          ICP MATCH: PERFECT
                        </span>
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded bg-blue-500/10 text-blue-500 font-mono text-[9px] font-bold">
                          MOTION: {opportunity.revenue_motion || 'Digital Selling'}
                        </span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="p-6 rounded-2xl border border-dashed border-border bg-bg-primary/30 flex flex-col items-center justify-center text-center py-8">
                    <AlertCircle className="h-8 w-8 text-amber-500/80 mb-2" />
                    <h3 className="text-xs font-mono uppercase tracking-widest text-text-primary font-black mb-1">SQL Session Not Found</h3>
                    <p className="text-[11px] text-text-secondary leading-normal max-w-sm">
                      This opportunity does not have active SQL Qualification records in the database yet. You can still synchronize owner and stage info on the right.
                    </p>
                  </div>
                )}

                {/* Summarized Findings */}
                <div className="p-6 rounded-2xl bg-bg-surface border border-border space-y-4">
                  <h3 className="text-xs font-black text-text-primary uppercase tracking-widest font-mono border-b border-border pb-2.5 flex items-center gap-1.5">
                    <Activity className="h-4 w-4 text-accent" />
                    Handover Strategy & Analysis
                  </h3>
                  <div className="text-xs text-text-secondary leading-relaxed space-y-3">
                    <p>
                      {sqlResult?.qualification_summary?.summary || 
                        "No dynamic handover strategy was inherited for this opportunity. Please verify database synchronization."}
                    </p>
                    {sqlResult?.qualification_summary?.summary && (
                      <div className="p-3 bg-bg-primary rounded-xl border border-border">
                        <h4 className="font-bold text-[10px] uppercase tracking-wider text-text-primary mb-1">Key Handover Rebuttal / Recommendation:</h4>
                        <p className="text-[11px] text-text-secondary">
                          "Secure official sign-off on the Business Value Assessment during the next joint committee. Transition exploration into structured timeline execution (Paper Process map)."
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Quick Info Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-4 rounded-xl bg-bg-surface border border-border space-y-1.5">
                    <span className="text-[9px] font-mono text-text-secondary uppercase tracking-widest font-bold">Opportunity Industry</span>
                    <p className="text-xs font-bold text-text-primary">{opportunity.industry || 'Enterprise Cloud Software'}</p>
                  </div>
                  <div className="p-4 rounded-xl bg-bg-surface border border-border space-y-1.5">
                    <span className="text-[9px] font-mono text-text-secondary uppercase tracking-widest font-bold">Originated Source</span>
                    <p className="text-xs font-bold text-text-primary">{opportunity.source || 'MQL Handover'}</p>
                  </div>
                </div>

              </motion.div>
            )}

            {activeSubTab === 'meddpicc' && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                <div className="p-6 rounded-2xl bg-bg-surface border border-border space-y-5">
                  <h3 className="text-xs font-black text-text-primary uppercase tracking-widest font-mono border-b border-border pb-2.5 flex items-center gap-1.5">
                    <Target className="h-4 w-4 text-accent" />
                    Core MEDDPICC Dimensions Inherited
                  </h3>
                  
                  <div className="space-y-4">
                    {meddpiccMetrics.filter((_, idx) => [0, 5, 6, 7].includes(idx)).map((m, idx) => (
                      <div key={idx} className="p-4 rounded-xl border border-border bg-bg-primary/50 space-y-1">
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-2">
                            <span className="w-6 h-6 rounded bg-accent/10 border border-accent/20 text-accent font-mono font-black text-xs flex items-center justify-center">
                              {m.code}
                            </span>
                            <span className="text-xs font-black text-text-primary uppercase tracking-wider">{m.name}</span>
                          </div>
                          {m.score !== null && (
                            <span className="px-2 py-0.5 rounded bg-accent/10 text-accent text-[9px] font-mono font-bold">
                              Score: {m.score}/100
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-text-secondary leading-relaxed pl-8">
                          {m.val}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {activeSubTab === 'process' && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                <div className="p-6 rounded-2xl bg-bg-surface border border-border space-y-5">
                  <h3 className="text-xs font-black text-text-primary uppercase tracking-widest font-mono border-b border-border pb-2.5 flex items-center gap-1.5">
                    <Layers className="h-4 w-4 text-accent" />
                    Buying Controls & Procurement Paths
                  </h3>
                  
                  <div className="space-y-4">
                    {meddpiccMetrics.filter((_, idx) => [1, 2, 3, 4].includes(idx)).map((m, idx) => (
                      <div key={idx} className="p-4 rounded-xl border border-border bg-bg-primary/50 space-y-1">
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-2">
                            <span className="w-6 h-6 rounded bg-blue-500/10 border border-blue-500/20 text-blue-500 font-mono font-black text-xs flex items-center justify-center">
                              {m.code}
                            </span>
                            <span className="text-xs font-black text-text-primary uppercase tracking-wider">{m.name}</span>
                          </div>
                          {m.score !== null && (
                            <span className="px-2 py-0.5 rounded bg-blue-500/10 text-blue-500 text-[9px] font-mono font-bold">
                              Score: {m.score}/100
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-text-secondary leading-relaxed pl-8">
                          {m.val}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {activeSubTab === 'risks' && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                <div className="p-6 rounded-2xl bg-bg-surface border border-border space-y-4">
                  <h3 className="text-xs font-black text-text-primary uppercase tracking-widest font-mono border-b border-border pb-2.5 flex items-center gap-1.5">
                    <ShieldAlert className="h-4 w-4 text-red-500" />
                    Handover Gap Analysis & Gaps
                  </h3>
                  
                  <div className="space-y-3.5">
                    {(() => {
                      const rawRisks = sqlResult?.risk_analysis || sqlResult?.qualification_risks;
                      const hasRisks = Array.isArray(rawRisks) && rawRisks.length > 0;

                      if (!hasRisks) {
                        return (
                          <div className="p-6 rounded-xl border border-dashed border-border bg-bg-primary/30 flex flex-col items-center justify-center text-center py-8">
                            <ShieldAlert className="h-8 w-8 text-text-secondary/40 mb-2" />
                            <h4 className="text-xs font-mono uppercase tracking-widest text-text-primary font-black mb-1">No Gaps or Risks Logged</h4>
                            <p className="text-[11px] text-text-secondary leading-normal max-w-xs">
                              There are no active risk analysis logs registered for this opportunity in the previous SQL phase.
                            </p>
                          </div>
                        );
                      }

                      return rawRisks.map((r: any, idx: number) => {
                        const sev = (r.severity || 'medium').toLowerCase();
                        const isHigh = sev === 'high' || sev === 'critical';
                        const isMedium = sev === 'medium';
                        
                        return (
                          <div 
                            key={idx} 
                            className={`p-4 rounded-xl border flex items-start gap-3 transition-colors ${
                              isHigh 
                                ? 'border-red-500/10 bg-red-500/5' 
                                : isMedium 
                                  ? 'border-amber-500/10 bg-amber-500/5' 
                                  : 'border-blue-500/10 bg-blue-500/5'
                            }`}
                          >
                            {isHigh ? (
                              <AlertTriangle className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />
                            ) : isMedium ? (
                              <AlertCircle className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
                            ) : (
                              <HelpCircle className="h-4 w-4 text-blue-500 shrink-0 mt-0.5" />
                            )}
                            <div className="space-y-1 w-full">
                              <div className="flex items-center justify-between gap-2">
                                <h4 className="text-xs font-black text-text-primary uppercase tracking-wider">
                                  {r.category || r.risk_name || 'SQL Qualification Gap'}
                                </h4>
                                <span className={`px-1.5 py-0.5 rounded font-mono text-[8px] font-black uppercase ${
                                  isHigh 
                                    ? 'bg-red-500/10 text-red-500' 
                                    : isMedium 
                                      ? 'bg-amber-500/10 text-amber-500' 
                                      : 'bg-blue-500/10 text-blue-500'
                                }`}>
                                  {sev}
                                </span>
                              </div>
                              <p className="text-[11px] text-text-secondary leading-relaxed">
                                {r.risk_description || r.description || r.reason || 'Risk identified in early evaluation.'}
                              </p>
                            </div>
                          </div>
                        );
                      });
                    })()}
                  </div>
                </div>
              </motion.div>
            )}

          </div>

          {/* RIGHT COLUMN: REVOPS OPPORTUNITY SYNC FORM */}
          <div className="space-y-6">
            <form onSubmit={handleSaveInheritedData} className="p-6 rounded-2xl bg-bg-surface border border-border space-y-4">
              <h3 className="text-xs font-black text-text-primary uppercase tracking-widest font-mono border-b border-border pb-2.5 flex items-center justify-between">
                <span>RevOps Sync Form</span>
                <Landmark className="h-4 w-4 text-accent" />
              </h3>

              {saveSuccess && (
                <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-[11px] font-bold rounded-xl flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4" />
                  <span>{saveSuccess}</span>
                </div>
              )}

              {saveError && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-500 text-[11px] font-bold rounded-xl flex items-center gap-2">
                  <AlertCircle className="h-4 w-4" />
                  <span>{saveError}</span>
                </div>
              )}

              <div className="space-y-3">
                {/* Opportunity Owner */}
                <div className="space-y-1">
                  <label className="text-[9px] font-mono font-bold text-text-secondary uppercase tracking-wider">Opportunity Owner</label>
                  <input
                    type="text"
                    value={owner}
                    onChange={(e) => setOwner(e.target.value)}
                    className="w-full px-3.5 py-2 text-xs bg-bg-primary border border-border rounded-xl text-text-primary focus:outline-none focus:border-accent"
                    required
                  />
                </div>

                {/* Estimated Revenue */}
                <div className="space-y-1">
                  <label className="text-[9px] font-mono font-bold text-text-secondary uppercase tracking-wider">Estimated Revenue ($)</label>
                  <input
                    type="text"
                    value={revenue}
                    onChange={(e) => setRevenue(e.target.value)}
                    className="w-full px-3.5 py-2 text-xs bg-bg-primary border border-border rounded-xl text-text-primary focus:outline-none focus:border-accent"
                    required
                  />
                </div>

                {/* Stage Selection */}
                <div className="space-y-1">
                  <label className="text-[9px] font-mono font-bold text-text-secondary uppercase tracking-wider">Opportunity Stage</label>
                  <select
                    value={stage}
                    onChange={(e) => setStage(e.target.value)}
                    className="w-full px-3.5 py-2 text-xs bg-bg-primary border border-border rounded-xl text-text-primary focus:outline-none focus:border-accent"
                  >
                    <option value="Emerging Opportunity">Emerging Opportunity</option>
                    <option value="Validated Opportunity">Validated Opportunity</option>
                    <option value="Proposal Stage">Proposal Stage</option>
                    <option value="Contract Negotiation">Contract Negotiation</option>
                  </select>
                </div>

                {/* Pipeline Stage */}
                <div className="space-y-1">
                  <label className="text-[9px] font-mono font-bold text-text-secondary uppercase tracking-wider">Pipeline Stage</label>
                  <select
                    value={pipelineStage}
                    onChange={(e) => setPipelineStage(e.target.value)}
                    className="w-full px-3.5 py-2 text-xs bg-bg-primary border border-border rounded-xl text-text-primary focus:outline-none focus:border-accent"
                  >
                    <option value="Qualification">Qualification</option>
                    <option value="Proposal">Proposal</option>
                    <option value="Negotiation">Negotiation</option>
                    <option value="Closed Won">Closed Won</option>
                  </select>
                </div>

                {/* Expected Close Date */}
                <div className="space-y-1">
                  <label className="text-[9px] font-mono font-bold text-text-secondary uppercase tracking-wider">Expected Close Date</label>
                  <input
                    type="date"
                    value={expectedCloseDate}
                    onChange={(e) => setExpectedCloseDate(e.target.value)}
                    className="w-full px-3.5 py-2 text-xs bg-bg-primary border border-border rounded-xl text-text-primary focus:outline-none focus:border-accent"
                  />
                </div>

                {/* Editable Inherited Metrics */}
                <div className="space-y-1 pt-2 border-t border-border">
                  <label className="text-[9px] font-mono font-bold text-text-secondary uppercase tracking-wider">Metrics Inherited Notes</label>
                  <textarea
                    rows={2}
                    value={metricsNote}
                    onChange={(e) => setMetricsNote(e.target.value)}
                    placeholder="E.g., Projected 35% OpEx savings & ROI"
                    className="w-full px-3.5 py-2 text-xs bg-bg-primary border border-border rounded-xl text-text-primary focus:outline-none focus:border-accent resize-none"
                  />
                </div>

                {/* Editable Inherited Pain */}
                <div className="space-y-1">
                  <label className="text-[9px] font-mono font-bold text-text-secondary uppercase tracking-wider">Verified Business Pain Notes</label>
                  <textarea
                    rows={2}
                    value={painNote}
                    onChange={(e) => setPainNote(e.target.value)}
                    placeholder="E.g., Manual deployments trigger continuous compliance drift"
                    className="w-full px-3.5 py-2 text-xs bg-bg-primary border border-border rounded-xl text-text-primary focus:outline-none focus:border-accent resize-none"
                  />
                </div>
              </div>

              <div className="pt-3">
                <button
                  type="submit"
                  disabled={saving}
                  className="w-full px-4 py-2.5 text-xs font-black bg-zinc-850 hover:bg-zinc-900 text-white rounded-xl transition-all cursor-pointer uppercase font-mono flex items-center justify-center gap-1.5 shadow-sm"
                >
                  {saving ? (
                    <>
                      <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                      <span>Syncing Handover...</span>
                    </>
                  ) : (
                    <>
                      <Check className="h-3.5 w-3.5" />
                      <span>Sync & Save Details</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>

        </div>
      )}

    </div>
  );
};
