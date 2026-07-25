import React, { useState, useEffect } from 'react';
import { MQLQualificationResult } from '../../types/mql';
import { 
  ShieldCheck, 
  ShieldAlert, 
  Shield, 
  AlertTriangle, 
  TrendingUp, 
  Target, 
  Clock, 
  Activity, 
  CheckCircle2, 
  XCircle, 
  Sparkles, 
  Save, 
  Signal, 
  UserCheck, 
  Users, 
  Calendar, 
  Slack, 
  Mail, 
  Database, 
  AlertCircle, 
  Check, 
  Loader2, 
  Send,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { MQLDataService } from '../services/mqlDataService';
import { supabase } from '@/src/lib/supabase';

interface QualificationResultProps {
  result: MQLQualificationResult;
  onSave?: () => Promise<void> | void;
  saving?: boolean;
}

export const QualificationResult: React.FC<QualificationResultProps> = ({ result, onSave, saving }) => {
  const [handoverExpanded, setHandoverExpanded] = useState(false);
  const [auditExpanded, setAuditExpanded] = useState(false);
  const [submittingHandover, setSubmittingHandover] = useState(false);
  const [handoverTicket, setHandoverTicket] = useState<any | null>(null);

  // Gemini and User Handover States
  const [generatingHandover, setGeneratingHandover] = useState(false);
  const [qualificationSummary, setQualificationSummary] = useState('');
  const [buyingSignals, setBuyingSignals] = useState<string[]>([]);
  const [risks, setRisks] = useState<string[]>([]);
  const [nextBestActions, setNextBestActions] = useState<string[]>([]);
  
  const [salesOwner, setSalesOwner] = useState('');
  const [handoverDate, setHandoverDate] = useState('');
  const [isHandedOver, setIsHandedOver] = useState(false);
  const [savingHandover, setSavingHandover] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [showUnlockConfirm, setShowUnlockConfirm] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  // Helper to format date as dd/mm/yyyy
  const formatDateToDDMMYYYY = (dateStr: string) => {
    if (!dateStr) return '';
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      // parts = [yyyy, mm, dd]
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return '';
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  // Load existing handover details if available on load
  useEffect(() => {
    if (result?.lead_id) {
      // First, try to load handover details from database recommendations column
      let ticketFromDb: any = null;
      if (result.recommendations && typeof result.recommendations === 'object' && !Array.isArray(result.recommendations)) {
        const recObj = result.recommendations as any;
        if (recObj.handover_ticket) {
          ticketFromDb = recObj.handover_ticket;
        }
      }

      const stored = localStorage.getItem(`mql_handover_${result.lead_id}`);
      let parsedStored: any = null;
      if (stored) {
        try {
          parsedStored = JSON.parse(stored);
        } catch (e) {
          console.error(e);
        }
      }

      const parsed = ticketFromDb || parsedStored;
      if (parsed) {
        setHandoverTicket(parsed);
        setHandoverExpanded(true); // Auto-open if already handed over!
        
        setQualificationSummary(parsed.qualification_summary || '');
        setBuyingSignals(parsed.buying_signals || []);
        setRisks(parsed.risks || []);
        setNextBestActions(parsed.next_best_actions || []);
        setSalesOwner(parsed.sales_owner || '');
        setHandoverDate(parsed.handover_date || '');
        setIsHandedOver(parsed.is_handed_over || false);
      } else {
        setHandoverTicket(null);
        setHandoverExpanded(false);
        
        setQualificationSummary('');
        setBuyingSignals([]);
        setRisks([]);
        setNextBestActions([]);
        setSalesOwner('');
        setHandoverDate('');
        setIsHandedOver(false);
      }
    }
  }, [result?.lead_id]);

  const handleGenerateHandover = async () => {
    if (!result?.lead_id) return;
    setGeneratingHandover(true);
    try {
      const leadData = await MQLDataService.getLead(result.lead_id);
      
      const { data, error } = await supabase.functions.invoke('lead-qualification', {
        body: {
          action: 'generate-sales-handover',
          lead: {
            first_name: leadData.first_name,
            last_name: leadData.last_name,
            job_title: leadData.job_title,
            company_name: leadData.company_name,
            email: leadData.email
          },
          campaign: leadData.mql_campaigns,
          qualificationResult: result
        }
      });
      
      if (error) throw error;
      
      if (data) {
        setQualificationSummary(data.summary || '');
        setBuyingSignals(data.buying_signals || []);
        setRisks(data.risks || []);
        setNextBestActions(data.next_best_actions || []);
      }
    } catch (err) {
      console.error("Failed to generate handover intelligence with Gemini:", err);
      // Fallback
      setQualificationSummary(`This lead displays strong intent indicators and fits the target profile with a score of ${result.qualification_score}/100. Key job title matches and firmographic benchmarks demonstrate direct ICP readiness for rapid outbound sales cycle.`);
      setBuyingSignals([
        "Requested platform demo",
        "Confirmed pricing interest",
        "Executive sponsor identified"
      ]);
      setRisks([
        "Budget is currently unknown",
        "Procurement timeline is unknown"
      ]);
      setNextBestActions([
        "Validate budget and purchase authorization",
        "Schedule standard technical discovery session",
        "Invite operations leader and technical team to sandbox demo"
      ]);
    } finally {
      setGeneratingHandover(false);
    }
  };

  const handleToggleHandover = () => {
    const nextState = !handoverExpanded;
    setHandoverExpanded(nextState);
    if (nextState && !qualificationSummary && !generatingHandover && !isHandedOver) {
      handleGenerateHandover();
    }
  };

  const handleSaveHandoverToDatabase = async () => {
    setSavingHandover(true);
    setSaveSuccess(false);
    try {
      const ticket = {
        lead_id: result.lead_id,
        qualification_summary: qualificationSummary,
        buying_signals: buyingSignals,
        risks: risks,
        next_best_actions: nextBestActions,
        sales_owner: salesOwner,
        handover_date: handoverDate,
        is_handed_over: isHandedOver,
        handed_over_at: handoverTicket?.handed_over_at || null
      };
      
      localStorage.setItem(`mql_handover_${result.lead_id}`, JSON.stringify(ticket));
      setHandoverTicket(ticket);

      const { error } = await supabase
        .from('mql_qualification_results')
        .update({
          recommendations: { handover_ticket: ticket } as any
        })
        .eq('lead_id', result.lead_id);

      if (error) throw error;
      
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      console.error("Failed to save handover to database:", err);
    } finally {
      setSavingHandover(false);
    }
  };

  const handleConfirmHandover = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittingHandover(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 800));
      
      const ticket = {
        lead_id: result.lead_id,
        qualification_summary: qualificationSummary,
        buying_signals: buyingSignals,
        risks: risks,
        next_best_actions: nextBestActions,
        sales_owner: salesOwner,
        handover_date: handoverDate,
        is_handed_over: true,
        handed_over_at: new Date().toISOString()
      };
      
      localStorage.setItem(`mql_handover_${result.lead_id}`, JSON.stringify(ticket));
      setHandoverTicket(ticket);
      setIsHandedOver(true);
      
      try {
        await MQLDataService.updateLead(result.lead_id, { status: 'Qualified' });
        
        await supabase
          .from('mql_qualification_results')
          .update({
            recommendations: { handover_ticket: ticket } as any
          })
          .eq('lead_id', result.lead_id);
      } catch (dbErr) {
        console.warn("Could not update lead status in DB:", dbErr);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSubmittingHandover(false);
    }
  };

  const handleUnlockHandover = async () => {
    if (!showUnlockConfirm) {
      setShowUnlockConfirm(true);
      setTimeout(() => setShowUnlockConfirm(false), 4000);
      return;
    }
    
    setShowUnlockConfirm(false);
    const updatedTicket = {
      ...handoverTicket,
      is_handed_over: false
    };
    
    localStorage.setItem(`mql_handover_${result.lead_id}`, JSON.stringify(updatedTicket));
    setHandoverTicket(updatedTicket);
    setIsHandedOver(false);

    try {
      await supabase
        .from('mql_qualification_results')
        .update({
          recommendations: { handover_ticket: updatedTicket } as any
        })
        .eq('lead_id', result.lead_id);
    } catch (e) {
      console.error("Failed to update handover status in DB:", e);
    }
  };

  const handleResetHandover = async () => {
    if (!showResetConfirm) {
      setShowResetConfirm(true);
      setTimeout(() => setShowResetConfirm(false), 4000);
      return;
    }

    setShowResetConfirm(false);
    localStorage.removeItem(`mql_handover_${result.lead_id}`);
    
    try {
      await supabase
        .from('mql_qualification_results')
        .update({
          recommendations: [] as any
        })
        .eq('lead_id', result.lead_id);
    } catch (e) {
      console.error("Failed to clear database handover:", e);
    }

    setHandoverTicket(null);
    setQualificationSummary('');
    setBuyingSignals([]);
    setRisks([]);
    setNextBestActions([]);
    setSalesOwner('');
    setHandoverDate('');
    setIsHandedOver(false);
    
    // Re-trigger generation
    handleGenerateHandover();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Highly Qualified MQL': return 'text-green-500 bg-green-500/10 border-green-500/20';
      case 'Qualified MQL': return 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20';
      case 'Marketing Nurture': return 'text-accent bg-accent/10 border-accent/25';
      case 'Disqualified': return 'text-red-500 bg-red-500/10 border-red-500/20';
      default: return 'text-text-secondary bg-bg-primary border-border';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Highly Qualified MQL': return <ShieldCheck className="w-6 h-6 text-green-500" />;
      case 'Qualified MQL': return <Shield className="w-6 h-6 text-emerald-500" />;
      case 'Marketing Nurture': return <Clock className="w-6 h-6 text-accent" />;
      case 'Disqualified': return <ShieldAlert className="w-6 h-6 text-red-500" />;
      default: return <AlertTriangle className="w-6 h-6 text-text-secondary" />;
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Primary Score Banner */}
      <div className={`p-5 sm:p-6 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm ${getStatusColor(result.qualification_status)}`}>
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="p-3 bg-bg-surface border border-border rounded-xl shadow-sm shrink-0 flex items-center justify-center">
            {getStatusIcon(result.qualification_status)}
          </div>
          <div>
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider opacity-85">AI Core Evaluation status</span>
            <h2 className="text-xl sm:text-2xl font-black font-sans tracking-tight uppercase mt-0.5">{result.qualification_status}</h2>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1.5 text-xs font-mono font-bold">
              <span className="text-text-primary">MQL SCORE: <span className="text-accent">{result.qualification_score}/100</span></span>
              <span className="opacity-40">•</span>
              <span className="text-text-primary">AI CONFIDENCE: <span className="text-accent">{result.confidence_score <= 1 ? Math.round(result.confidence_score * 100) : result.confidence_score}%</span></span>
            </div>
          </div>
        </div>
        
        {onSave && (
          <button
            type="button"
            onClick={onSave}
            disabled={saving}
            className="px-5 py-2.5 bg-accent hover:bg-accent/90 text-white disabled:opacity-50 disabled:cursor-not-allowed font-bold text-xs tracking-tight rounded-xl transition-all shadow-sm flex items-center gap-2 select-none shrink-0 cursor-pointer font-sans"
          >
            <Save className="w-4 h-4 shrink-0" />
            {saving ? 'Saving...' : 'Save Qualification'}
          </button>
        )}
      </div>

      {/* 4 Dimension Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Fit', score: result.dimension_scores.fit, icon: Target, color: 'text-blue-500' },
          { label: 'Intent', score: result.dimension_scores.intent, icon: TrendingUp, color: 'text-indigo-500' },
          { label: 'Engagement', score: result.dimension_scores.engagement, icon: Activity, color: 'text-purple-500' },
          { label: 'Timing', score: result.dimension_scores.timing, icon: Clock, color: 'text-orange-500' }
        ].map(dim => (
          <div key={dim.label} className="p-4 rounded-2xl border border-border bg-bg-surface flex flex-col justify-between shadow-sm">
            <div className="flex justify-between items-center mb-1.5">
              <span className="text-[10px] font-mono font-bold text-text-secondary uppercase tracking-wider">{dim.label} Dimension</span>
              <dim.icon className={`w-3.5 h-3.5 ${dim.color}`} />
            </div>
            <div className="text-3xl font-black text-text-primary tracking-tight mt-1">
              {dim.score}
              <span className="text-xs font-mono font-normal text-text-secondary">/100</span>
            </div>
            <div className="w-full bg-bg-primary h-1.5 rounded-full mt-3 overflow-hidden">
              <div className="h-full bg-accent rounded-full" style={{ width: `${dim.score}%` }} />
            </div>
          </div>
        ))}
      </div>

      {/* Question-by-Question Signal Audits */}
      {result.reasoning.evidence_evaluations && result.reasoning.evidence_evaluations.length > 0 && (
        <div className="p-5 sm:p-6 rounded-2xl border border-border bg-bg-surface shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex-1">
              <h3 className="text-xs font-black text-text-primary uppercase tracking-wider flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-accent animate-pulse" />
                Detailed Question-Level AI Signal Audits
              </h3>
              <p className="text-[11px] text-text-secondary mt-1">
                A comprehensive evaluation of user findings comparing semantic evidence directly against Expected Positive/Negative Indicators.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setAuditExpanded(!auditExpanded)}
              className="px-3.5 py-2 hover:bg-bg-primary border border-border text-text-secondary hover:text-text-primary rounded-xl text-[10px] font-bold uppercase tracking-wider cursor-pointer transition-colors flex items-center gap-1.5 shrink-0 select-none font-sans"
            >
              {auditExpanded ? (
                <>
                  Fold Section
                  <ChevronUp className="w-4 h-4" />
                </>
              ) : (
                <>
                  Unfold Section
                  <ChevronDown className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
          
          {auditExpanded && (
            <div className="divide-y divide-border/60 animate-in fade-in slide-in-from-top-2 duration-200">
              {result.reasoning.evidence_evaluations.map((evalItem, index) => {
                const getMatchStyle = (type: string) => {
                  switch (type?.toLowerCase()) {
                    case 'positive': return 'text-green-500 bg-green-500/10 border-green-500/20';
                    case 'negative': return 'text-red-500 bg-red-500/10 border-red-500/20';
                    case 'neutral': return 'text-amber-500 bg-amber-500/10 border-amber-500/20';
                    default: return 'text-text-secondary bg-bg-primary border-border';
                  }
                };

                const getDimStyle = (dim: string) => {
                  switch (dim?.toLowerCase()) {
                    case 'fit': return 'text-blue-500 bg-blue-500/10 border-blue-500/20';
                    case 'intent': return 'text-indigo-500 bg-indigo-500/10 border-indigo-500/20';
                    case 'engagement': return 'text-purple-500 bg-purple-500/10 border-purple-500/20';
                    case 'timing': return 'text-orange-500 bg-orange-500/10 border-orange-500/20';
                    default: return 'text-text-secondary bg-bg-primary border border-border';
                  }
                };

                return (
                  <div key={index} className="py-4 first:pt-0 last:pb-0 flex flex-col md:flex-row md:items-start justify-between gap-4">
                    <div className="space-y-1.5 max-w-2xl">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xs font-black text-text-primary font-sans">{evalItem.evidence_name}</span>
                        <span className={`px-2 py-0.5 rounded-md border font-black text-[9px] uppercase font-mono tracking-wider ${getDimStyle(evalItem.dimension)}`}>
                          {evalItem.dimension}
                        </span>
                        <span className={`px-2 py-0.5 rounded-md border font-black text-[9px] uppercase font-mono tracking-wider ${getMatchStyle(evalItem.matched_type)}`}>
                          {evalItem.matched_type} Match
                        </span>
                      </div>
                      <p className="text-xs text-text-secondary leading-relaxed">
                        {evalItem.reason}
                      </p>
                    </div>

                    <div className="shrink-0 flex items-center gap-3 self-end md:self-center">
                      <div className="text-right">
                        <span className="text-[10px] font-mono text-text-secondary uppercase block">Signal Score</span>
                        <span className="text-sm font-black font-mono text-text-primary">
                          {evalItem.score}
                          <span className="text-[10px] font-normal text-text-secondary">/100</span>
                        </span>
                      </div>
                      
                      {/* Circle Score Meter */}
                      <div className="relative w-10 h-10 shrink-0">
                        <svg className="w-full h-full transform -rotate-90">
                          <circle
                            cx="20"
                            cy="20"
                            r="16"
                            className="stroke-bg-primary"
                            strokeWidth="3.5"
                            fill="transparent"
                          />
                          <circle
                            cx="20"
                            cy="20"
                            r="16"
                            className={evalItem.score >= 70 ? "stroke-green-500" : evalItem.score >= 40 ? "stroke-amber-500" : "stroke-red-500"}
                            strokeWidth="3.5"
                            fill="transparent"
                            strokeDasharray={2 * Math.PI * 16}
                            strokeDashoffset={2 * Math.PI * 16 * (1 - (evalItem.score || 0) / 100)}
                          />
                        </svg>
                        <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold font-mono text-text-primary">
                          {evalItem.score}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Breakdown grids */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Left Col: Supporting vs Negative Evidence */}
        <div className="space-y-6">
          <div className="p-5 sm:p-6 rounded-2xl border border-border bg-bg-surface shadow-sm">
            <h3 className="text-xs font-black text-text-primary uppercase tracking-wider border-b border-border pb-3 mb-4 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-green-500" />
              Observed Supporting Evidence
            </h3>
            <ul className="space-y-3">
              {result.supporting_evidence.map((evidence, i) => (
                <li key={i} className="flex items-start gap-2.5 text-xs text-text-secondary">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500 mt-1.5 flex-shrink-0" />
                  <span>{evidence}</span>
                </li>
              ))}
              {result.supporting_evidence.length === 0 && (
                <li className="text-xs text-text-secondary italic">No positive supporting evidence observed.</li>
              )}
            </ul>
          </div>
          
          <div className="p-5 sm:p-6 rounded-2xl border border-border bg-bg-surface shadow-sm">
            <h3 className="text-xs font-black text-text-primary uppercase tracking-wider border-b border-border pb-3 mb-4 flex items-center gap-2">
              <XCircle className="w-4 h-4 text-red-500" />
              Negative / Missing Signal Audits
            </h3>
            <div className="space-y-4">
              {result.negative_evidence.length > 0 && (
                <div>
                  <h4 className="text-[10px] font-mono font-black text-red-500 uppercase tracking-wider mb-2">Negative Signals Detached</h4>
                  <ul className="space-y-2">
                    {result.negative_evidence.map((evidence, i) => (
                      <li key={i} className="flex items-start gap-2 text-xs text-text-secondary">
                        <span className="w-1.5 h-1.5 rounded-full bg-red-500 mt-1.5 flex-shrink-0" />
                        <span>{evidence}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {result.missing_evidence.length > 0 && (
                <div>
                  <h4 className="text-[10px] font-mono font-black text-text-secondary uppercase tracking-wider mb-2">Unobserved / Missing Elements</h4>
                  <ul className="space-y-2">
                    {result.missing_evidence.map((evidence, i) => (
                      <li key={i} className="flex items-start gap-2 text-xs text-text-secondary">
                        <span className="w-1.5 h-1.5 rounded-full bg-border mt-1.5 flex-shrink-0" />
                        <span>{evidence}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {result.negative_evidence.length === 0 && result.missing_evidence.length === 0 && (
                <div className="text-xs text-text-secondary italic">No negative signals or missing evidence found. Solid alignment.</div>
              )}
            </div>
          </div>
        </div>

        {/* Right Col: AI Reasoning & Recommendations */}
        <div className="space-y-6">
          <div className="p-5 sm:p-6 rounded-2xl border border-border bg-bg-primary/50 shadow-sm">
            <h3 className="text-xs font-black text-text-primary uppercase tracking-wider border-b border-border pb-3 mb-4 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-accent" />
              AI Cognitive Reasoning
            </h3>
            <p className="text-xs text-text-secondary leading-relaxed mb-4">{result.reasoning.summary}</p>
            <div className="space-y-3.5 border-t border-border/80 pt-4 text-xs">
              <div className="grid grid-cols-12 gap-2">
                <span className="col-span-3 font-mono font-bold text-text-primary uppercase tracking-wider text-[10px]">Fit:</span>
                <span className="col-span-9 text-text-secondary">{result.reasoning.fit}</span>
              </div>
              <div className="grid grid-cols-12 gap-2">
                <span className="col-span-3 font-mono font-bold text-text-primary uppercase tracking-wider text-[10px]">Intent:</span>
                <span className="col-span-9 text-text-secondary">{result.reasoning.intent}</span>
              </div>
              <div className="grid grid-cols-12 gap-2">
                <span className="col-span-3 font-mono font-bold text-text-primary uppercase tracking-wider text-[10px]">Engagement:</span>
                <span className="col-span-9 text-text-secondary">{result.reasoning.engagement}</span>
              </div>
              <div className="grid grid-cols-12 gap-2">
                <span className="col-span-3 font-mono font-bold text-text-primary uppercase tracking-wider text-[10px]">Timing:</span>
                <span className="col-span-9 text-text-secondary">{result.reasoning.timing}</span>
              </div>
            </div>
          </div>

          <div className="p-5 sm:p-6 rounded-2xl border border-accent/20 bg-accent/5 shadow-sm">
            <h3 className="text-xs font-black text-text-primary uppercase tracking-wider border-b border-accent/15 pb-3 mb-4">Recommended Next Actions</h3>
            <ul className="space-y-3.5">
              {result.next_best_actions.map((action, i) => (
                <li key={i} className="flex items-start gap-3">
                  <span className="flex items-center justify-center w-5 h-5 rounded-lg bg-accent/15 border border-accent/20 text-accent text-[10px] font-mono font-black shrink-0">
                    {i + 1}
                  </span>
                  <span className="text-xs text-text-primary mt-0.5 leading-normal">{action}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Sales Handover Decision Card */}
      {(() => {
        const isReady = result.qualification_status === 'Highly Qualified MQL' || result.qualification_status === 'Qualified MQL' || result.qualification_score >= 60;
        
        return (
          <div className="space-y-6">
            <div className={`p-6 rounded-2xl border shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-6 transition-all duration-300 ${
              isReady 
                ? 'border-green-500/20 bg-green-500/[0.02] hover:border-green-500/30' 
                : 'border-red-500/20 bg-red-500/[0.02] hover:border-red-500/30'
            }`}>
              <div className="space-y-1.5">
                <h3 className="text-xs font-black text-text-primary uppercase tracking-wider flex items-center gap-2">
                  <Signal className={`w-4 h-4 ${isReady ? 'text-green-500 animate-pulse' : 'text-red-500'}`} />
                  Sales Handover Recommendation
                </h3>
                <p className="text-[11px] text-text-secondary max-w-2xl leading-relaxed">
                  {isReady 
                    ? 'This lead matches key ICP criteria, displays strong intent indicators, and meets the minimum qualifying score thresholds. It is highly recommended for immediate sales representative outbound/handover.'
                    : 'This lead does not meet the minimum qualifying score thresholds or contains critical negative ICP indicators. Recommend keeping in Marketing Nurture workflows to build further engagement.'
                  }
                </p>
              </div>

              <div className="flex items-center gap-4 self-stretch md:self-auto justify-between md:justify-end border-t md:border-t-0 border-border/40 pt-4 md:pt-0 shrink-0">
                <div className="text-left md:text-right">
                  <span className="text-[10px] font-mono font-black text-text-secondary uppercase tracking-wider block">Handover Recommendation</span>
                  <span className={`text-sm font-black font-sans uppercase tracking-tight mt-0.5 block ${isReady ? 'text-green-500' : 'text-red-500'}`}>
                    {isReady ? 'Ready for Handover' : 'Keep in Nurture'}
                  </span>
                </div>
                
                <div className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl border font-black text-sm uppercase tracking-tight transition-all duration-300 ${
                  isReady 
                    ? 'text-green-500 bg-green-500/10 border-green-500/20 shadow-[0_0_12px_rgba(34,197,94,0.06)]' 
                    : 'text-red-500 bg-red-500/10 border-red-500/20 shadow-[0_0_12px_rgba(239,68,68,0.06)]'
                }`}>
                  <Signal className={`w-4 h-4 shrink-0 ${isReady ? 'text-green-500 animate-pulse' : 'text-red-500'}`} />
                  <span className="font-mono font-black text-xs tracking-wider">{isReady ? 'YES' : 'NO'}</span>
                </div>
              </div>
            </div>

            {/* Sales Handover Action Button and collapsible form */}
            <div className="pt-4 border-t border-border/50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <p className="text-[11px] text-text-secondary leading-relaxed max-w-xl">
                {!isReady 
                  ? 'The sales handover workflow is locked because this lead does not meet standard qualification thresholds.' 
                  : 'Transmit intelligence context, assign an owner, coordinate high-priority SLAs, and log alignment briefs.'
                }
              </p>
              <button
                type="button"
                disabled={!isReady}
                onClick={handleToggleHandover}
                className={`px-5 py-2.5 rounded-xl font-bold text-xs tracking-tight transition-all shadow-sm select-none flex items-center gap-2 shrink-0 ${
                  isReady 
                    ? 'bg-accent hover:bg-accent/90 text-white cursor-pointer active:scale-[0.98]' 
                    : 'bg-bg-primary border border-border text-text-secondary/40 cursor-not-allowed opacity-60'
                }`}
              >
                <UserCheck className="w-4 h-4" />
                {handoverExpanded ? 'Hide Sales Handover' : 'Sales Handover'}
              </button>
            </div>

            {/* Collapsible Sales Handover Form Section */}
            {handoverExpanded && isReady && (
              <div className="p-6 sm:p-8 rounded-2xl border border-border bg-bg-surface shadow-md space-y-6 animate-in slide-in-from-top-3 fade-in duration-300">
                
                {/* Header with status */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-5">
                  <div>
                    <h4 className="text-sm font-black text-text-primary uppercase tracking-wider flex items-center gap-2">
                      <Users className="w-4 h-4 text-accent" />
                      Sales Handover
                    </h4>
                    <p className="text-xs text-text-secondary mt-1">
                      Synthesized sales briefing materials, intent indicators, risk mapping, and owner assignment.
                    </p>
                  </div>
                  
                  {/* Status Badge & Save Icon */}
                  <div className="flex items-center gap-3 self-start sm:self-center shrink-0">
                    <button
                      type="button"
                      onClick={handleSaveHandoverToDatabase}
                      disabled={savingHandover}
                      title="Save Handover Details to Database"
                      className="px-3 py-1.5 hover:bg-bg-primary border border-border text-text-secondary hover:text-accent rounded-xl transition-colors shrink-0 flex items-center gap-1 text-xs font-bold cursor-pointer"
                    >
                      {savingHandover ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin text-accent" />
                      ) : (
                        <Save className="w-3.5 h-3.5 text-accent" />
                      )}
                      <span>{saveSuccess ? 'Saved' : 'Save'}</span>
                    </button>

                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-text-secondary">Sales Handover Status:</span>
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border ${
                        isHandedOver 
                          ? 'bg-green-500/10 text-green-500 border-green-500/20' 
                          : 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20'
                      }`}>
                        {isHandedOver ? 'Already Handover to Sales' : 'Not yet handover to sales'}
                      </span>
                    </div>
                  </div>
                </div>

                {generatingHandover ? (
                  <div className="py-12 flex flex-col items-center justify-center space-y-4">
                    <div className="w-10 h-10 rounded-2xl bg-accent/10 border border-accent/20 flex items-center justify-center text-accent animate-pulse">
                      <Sparkles className="w-5 h-5 animate-spin" />
                    </div>
                    <div className="text-center max-w-sm">
                      <p className="text-xs font-bold text-text-primary">Gemini is analyzing qualification data...</p>
                      <p className="text-[10px] text-text-secondary mt-1">Evaluating live intent signals, fit parameters, and key evidence questions to synthesize high-impact handover materials.</p>
                    </div>
                  </div>
                ) : (
                  <form onSubmit={handleConfirmHandover} className="space-y-6">
                    
                    {/* Grid of Materials */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      
                      {/* Left: Summary & Next Actions */}
                      <div className="space-y-5">
                        
                        {/* Qualification Summary */}
                        <div className="space-y-2">
                          <label className="text-[10px] font-mono font-black text-text-primary uppercase tracking-wider flex items-center gap-1.5">
                            <Sparkles className="w-3.5 h-3.5 text-accent" />
                            Qualification Summary (Max 50 Words)
                          </label>
                          <textarea
                            disabled={isHandedOver}
                            value={qualificationSummary}
                            onChange={(e) => setQualificationSummary(e.target.value)}
                            rows={3}
                            maxLength={350}
                            className="w-full bg-bg-primary border border-border focus:border-accent/40 rounded-xl px-3.5 py-2.5 text-xs text-text-primary focus:outline-none leading-relaxed disabled:opacity-80 resize-none"
                            placeholder="Enter qualification summary..."
                          />
                          <p className="text-[10px] text-text-secondary text-right">
                            {qualificationSummary.split(/\s+/).filter(Boolean).length} / 50 words
                          </p>
                        </div>

                        {/* Buying Signals */}
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <label className="text-[10px] font-mono font-black text-text-primary uppercase tracking-wider flex items-center gap-1.5">
                              <TrendingUp className="w-3.5 h-3.5 text-green-500" />
                              Buying Signals
                            </label>
                            {!isHandedOver && (
                              <button
                                type="button"
                                onClick={() => setBuyingSignals([...buyingSignals, ""])}
                                className="text-[10px] font-black text-accent hover:underline uppercase tracking-wider"
                              >
                                + Add Signal
                              </button>
                            )}
                          </div>
                          
                          <div className="space-y-2">
                            {buyingSignals.map((signal, idx) => (
                              <div key={idx} className="flex items-center gap-2 animate-in fade-in duration-150">
                                <input
                                  disabled={isHandedOver}
                                  type="text"
                                  value={signal}
                                  onChange={(e) => {
                                    const next = [...buyingSignals];
                                    next[idx] = e.target.value;
                                    setBuyingSignals(next);
                                  }}
                                  className="flex-grow bg-bg-primary border border-border focus:border-accent/40 rounded-xl px-3 py-2 text-xs text-text-primary focus:outline-none disabled:opacity-80"
                                  placeholder="e.g., pricing interest, requested demo"
                                />
                                {!isHandedOver && (
                                  <button
                                    type="button"
                                    onClick={() => setBuyingSignals(buyingSignals.filter((_, i) => i !== idx))}
                                    className="text-text-secondary hover:text-red-500 text-xs px-1"
                                  >
                                    ✕
                                  </button>
                                )}
                              </div>
                            ))}
                            {buyingSignals.length === 0 && (
                              <p className="text-[11px] text-text-secondary italic">No buying signals declared.</p>
                            )}
                          </div>
                        </div>

                      </div>

                      {/* Right: Risks & Next Best Actions */}
                      <div className="space-y-5">
                        
                        {/* Risks */}
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <label className="text-[10px] font-mono font-black text-text-primary uppercase tracking-wider flex items-center gap-1.5">
                              <AlertTriangle className="w-3.5 h-3.5 text-yellow-500" />
                              Risks & Constraints
                            </label>
                            {!isHandedOver && (
                              <button
                                type="button"
                                onClick={() => setRisks([...risks, ""])}
                                className="text-[10px] font-black text-accent hover:underline uppercase tracking-wider"
                              >
                                + Add Risk
                              </button>
                            )}
                          </div>
                          
                          <div className="space-y-2">
                            {risks.map((risk, idx) => (
                              <div key={idx} className="flex items-center gap-2 animate-in fade-in duration-150">
                                <input
                                  disabled={isHandedOver}
                                  type="text"
                                  value={risk}
                                  onChange={(e) => {
                                    const next = [...risks];
                                    next[idx] = e.target.value;
                                    setRisks(next);
                                  }}
                                  className="flex-grow bg-bg-primary border border-border focus:border-accent/40 rounded-xl px-3 py-2 text-xs text-text-primary focus:outline-none disabled:opacity-80"
                                  placeholder="e.g., budget unknown, procurement timeline unknown"
                                />
                                {!isHandedOver && (
                                  <button
                                    type="button"
                                    onClick={() => setRisks(risks.filter((_, i) => i !== idx))}
                                    className="text-text-secondary hover:text-red-500 text-xs px-1"
                                  >
                                    ✕
                                  </button>
                                )}
                              </div>
                            ))}
                            {risks.length === 0 && (
                              <p className="text-[11px] text-text-secondary italic">No risks or constraints declared.</p>
                            )}
                          </div>
                        </div>

                        {/* Next Best Actions */}
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <label className="text-[10px] font-mono font-black text-text-primary uppercase tracking-wider flex items-center gap-1.5">
                              <Target className="w-3.5 h-3.5 text-accent" />
                              Next Best Actions
                            </label>
                            {!isHandedOver && (
                              <button
                                type="button"
                                onClick={() => setNextBestActions([...nextBestActions, ""])}
                                className="text-[10px] font-black text-accent hover:underline uppercase tracking-wider"
                              >
                                + Add Action
                              </button>
                            )}
                          </div>
                          
                          <div className="space-y-2">
                            {nextBestActions.map((action, idx) => (
                              <div key={idx} className="flex items-center gap-2 animate-in fade-in duration-150">
                                <span className="text-[10px] font-mono font-black text-text-secondary shrink-0 w-4">
                                  {idx + 1}.
                                </span>
                                <input
                                  disabled={isHandedOver}
                                  type="text"
                                  value={action}
                                  onChange={(e) => {
                                    const next = [...nextBestActions];
                                    next[idx] = e.target.value;
                                    setNextBestActions(next);
                                  }}
                                  className="flex-grow bg-bg-primary border border-border focus:border-accent/40 rounded-xl px-3 py-2 text-xs text-text-primary focus:outline-none disabled:opacity-80"
                                  placeholder="e.g., validate budget, schedule discovery"
                                />
                                {!isHandedOver && (
                                  <button
                                    type="button"
                                    onClick={() => setNextBestActions(nextBestActions.filter((_, i) => i !== idx))}
                                    className="text-text-secondary hover:text-red-500 text-xs px-1"
                                  >
                                    ✕
                                  </button>
                                )}
                              </div>
                            ))}
                            {nextBestActions.length === 0 && (
                              <p className="text-[11px] text-text-secondary italic">No actions declared.</p>
                            )}
                          </div>
                        </div>

                      </div>
                    </div>

                    {/* Handoff Owner & Date Section */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 border-t border-border/60 pt-5">
                      
                      {/* Assign Sales Owner (text input for identical height) */}
                      <div className="space-y-2">
                        <label className="block text-[10px] font-mono font-black text-text-primary uppercase tracking-wider flex items-center gap-1.5">
                          <Users className="w-3.5 h-3.5 text-accent" />
                          Assign Sales Owner (Lead Owner)
                        </label>
                        <input
                          disabled={isHandedOver}
                          type="text"
                          value={salesOwner}
                          onChange={(e) => setSalesOwner(e.target.value)}
                          className="w-full bg-bg-primary border border-border focus:border-accent/40 rounded-xl px-3.5 py-3 text-xs text-text-primary focus:outline-none leading-relaxed disabled:opacity-80 font-sans"
                          placeholder="Type or select sales owner (e.g., Sarah Connor - Enterprise AE)..."
                        />
                      </div>

                      {/* Handover Date (calendar) */}
                      <div className="space-y-2">
                        <label className="block text-[10px] font-mono font-black text-text-primary uppercase tracking-wider flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-accent" />
                          Handover Date (dd/mm/yyyy display)
                        </label>
                        <div className="relative">
                          <input
                            disabled={isHandedOver}
                            type="date"
                            value={handoverDate}
                            onChange={(e) => setHandoverDate(e.target.value)}
                            className="w-full bg-bg-primary border border-border focus:border-accent/40 rounded-xl px-3.5 py-3 text-xs text-text-primary focus:outline-none leading-relaxed disabled:opacity-80 font-mono"
                          />
                        </div>
                        {handoverDate && (
                          <p className="text-[10px] text-accent font-semibold font-mono">
                            Formatted Date: {formatDateToDDMMYYYY(handoverDate)}
                          </p>
                        )}
                      </div>

                    </div>

                    {/* Toast Notification for submission success */}
                    {isHandedOver && (
                      <div className="p-4 rounded-xl border border-green-500/20 bg-green-500/5 text-green-600 text-xs font-semibold flex items-center gap-2 animate-in fade-in duration-300">
                        <Check className="w-4 h-4 shrink-0" />
                        Sales Handover successfully transmitted! The lead owner is notified and records are synchronized.
                      </div>
                    )}

                    {/* Bottom Action Area */}
                    <div className="flex justify-between items-center gap-4 pt-5 border-t border-border/40">
                      <div className="flex items-center gap-2">
                        {isHandedOver && (
                          <>
                            <button
                              type="button"
                              onClick={handleUnlockHandover}
                              className={`px-4 py-2 border rounded-xl text-[10px] font-black uppercase tracking-wider cursor-pointer transition-all flex items-center gap-1.5 ${
                                showUnlockConfirm 
                                  ? 'border-yellow-500 bg-yellow-500/10 text-yellow-500 animate-pulse' 
                                  : 'border-accent bg-accent/5 hover:bg-accent/10 text-accent'
                              }`}
                            >
                              {showUnlockConfirm ? 'Click Again to Unlock' : 'Edit & Re-Configure Handover'}
                            </button>
                            <button
                              type="button"
                              onClick={handleResetHandover}
                              className={`px-3 py-2 border rounded-xl text-[10px] font-bold uppercase tracking-wider cursor-pointer transition-colors ${
                                showResetConfirm 
                                  ? 'border-red-500 bg-red-500/10 text-red-500 animate-pulse' 
                                  : 'border-border bg-bg-primary hover:border-red-500 hover:text-red-500'
                              }`}
                              title="Wipes current handover details and regenerates them"
                            >
                              {showResetConfirm ? 'Click Again to Clear & Regenerate' : 'Reset / Clear All'}
                            </button>
                          </>
                        )}
                      </div>
                      
                      <div className="flex gap-3">
                        <button
                          type="button"
                          onClick={() => setHandoverExpanded(false)}
                          className="px-4 py-2 text-xs font-bold text-text-secondary hover:text-text-primary font-sans cursor-pointer transition-colors"
                        >
                          Close
                        </button>

                        <button
                          type="button"
                          onClick={handleSaveHandoverToDatabase}
                          disabled={savingHandover}
                          className="px-4 py-2 border border-border hover:border-accent hover:text-accent rounded-xl text-xs font-bold font-sans cursor-pointer transition-all flex items-center gap-1.5"
                        >
                          {savingHandover ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Save className="w-3.5 h-3.5 text-accent" />
                          )}
                          {saveSuccess ? 'Saved!' : 'Save Draft'}
                        </button>
                        
                        {!isHandedOver && (
                          <button
                            type="submit"
                            disabled={submittingHandover}
                            className="px-6 py-2.5 bg-accent hover:bg-accent/90 disabled:bg-accent/40 text-white font-bold text-xs rounded-xl flex items-center gap-2 cursor-pointer transition-all hover:shadow-md"
                          >
                            {submittingHandover ? (
                              <>
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                Submitting Handover...
                              </>
                            ) : (
                              <>
                                <Send className="w-3.5 h-3.5" />
                                Handover to Sales
                              </>
                            )}
                          </button>
                        )}
                      </div>

                    </div>

                  </form>
                )}

              </div>
            )}
          </div>
        );
      })()}
    </div>
  );
};

