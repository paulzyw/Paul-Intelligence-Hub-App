import React, { useState, useMemo, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  HelpCircle, 
  CheckCircle2, 
  ChevronDown, 
  Check, 
  Save, 
  AlertCircle, 
  Bot, 
  Sparkles, 
  RefreshCw, 
  ArrowLeft, 
  ArrowRight,
  Play,
  ShieldAlert, 
  FileText, 
  Layers, 
  Clock, 
  TrendingUp, 
  Building2, 
  Briefcase,
  Users,
  Award,
  Zap,
  Info
} from 'lucide-react';
import { supabase } from '@/src/lib/supabase';
import { OpportunityEvidenceRecord } from '../../types/opportunity_qualification';
import { OpportunityDataService } from '../services/opportunityDataService';

// Import static knowledge base and configurations directly
import oqEvidenceKbJson from '../../../../config/Opportunity_evidence_knowledge_base.json';
import oqIndustryConfigJson from '../../../../config/Opportunity_industry_configuration_JSON.json';
import oqRulesJson from '../../../../config/Opportunity_qualification_rules.json';

const OQ_KB = (oqEvidenceKbJson as any).opportunity_evidence_knowledge_base;
const OQ_INDUSTRY_CONFIG = oqIndustryConfigJson as any;
const OQ_RULES = (oqRulesJson as any).opportunity_qualification_rules;

// The 10 canonical qualification dimensions
export const OQ_10_DIMENSIONS = [
  { code: 'OQ01', name: 'Opportunity Definition & Business Context', shortTitle: 'Opportunity Definition' },
  { code: 'OQ02', name: 'Business Problem & Impact Validation', shortTitle: 'Problem & Impact' },
  { code: 'OQ03', name: 'Solution Relevance & Customer Fit', shortTitle: 'Solution & Customer Fit' },
  { code: 'OQ04', name: 'Customer Engagement & Commitment', shortTitle: 'Engagement & Commitment' },
  { code: 'OQ05', name: 'Stakeholder Identification & Access', shortTitle: 'Stakeholder Access' },
  { code: 'OQ06', name: 'Buying Process Understanding', shortTitle: 'Buying Process' },
  { code: 'OQ07', name: 'Commercial Potential & Funding', shortTitle: 'Commercial & Funding' },
  { code: 'OQ08', name: 'Timeline & Business Urgency', shortTitle: 'Timeline & Urgency' },
  { code: 'OQ09', name: 'Opportunity Advancement Evidence', shortTitle: 'Advancement Evidence' },
  { code: 'OQ10', name: 'Opportunity Risk Assessment', shortTitle: 'Risk Assessment' }
];

export interface OpportunityDynamicEvidenceFormProps {
  opportunity?: any;
  opportunityId?: string;
  sessionId?: string;
  revenueMotion?: string;
  industry?: string;
  activeDimensionCode?: string;
  evidenceKb?: any;
  savedEvidence?: OpportunityEvidenceRecord[];
  onEvidenceSaved?: () => void;
  onProceedToAssessment?: (resultData?: any) => void;
  onBack?: () => void;
}

export const OpportunityDynamicEvidenceForm: React.FC<OpportunityDynamicEvidenceFormProps> = ({
  opportunity,
  opportunityId: propOppId,
  sessionId: propSessionId,
  revenueMotion: propRevenueMotion,
  industry: propIndustry,
  activeDimensionCode: initialDimensionCode,
  savedEvidence: propSavedEvidence,
  onEvidenceSaved,
  onProceedToAssessment,
  onBack
}) => {
  // Resolve core identifiers
  const oppId = opportunity?.id || propOppId || '';
  const resolvedMotion = (opportunity?.revenue_motion || propRevenueMotion || 'Digital Solution Selling').trim();
  const resolvedIndustry = (opportunity?.industry || propIndustry || 'SaaS / Software').trim();

  // Internal state
  const [activeDimension, setActiveDimension] = useState<string>(initialDimensionCode || 'OQ01');
  const [sessionId, setSessionId] = useState<string>(propSessionId || '');
  const [formData, setFormData] = useState<Record<string, {
    response: string;
    suggested: string;
    notes: string;
    source: string;
    strength: string;
  }>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [runningQualification, setRunningQualification] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [activeTooltipId, setActiveTooltipId] = useState<string | null>(null);

  const tabsContainerRef = useRef<HTMLDivElement>(null);

  // 1. Resolve phase and industry configuration from static knowledge base
  const resolvedConfiguration = useMemo(() => {
    const kb = OQ_KB || {};
    const motionRegistry = kb.revenue_motion_registry || {};
    let phaseKey = '';

    for (const [rmCode, info] of Object.entries(motionRegistry)) {
      const rmName = (info as any).revenue_motion_name || '';
      if (
        rmName.toLowerCase() === resolvedMotion.toLowerCase() ||
        rmCode.toLowerCase() === resolvedMotion.toLowerCase() ||
        resolvedMotion.toLowerCase().includes(rmName.toLowerCase())
      ) {
        phaseKey = (info as any).phase_reference;
        break;
      }
    }

    if (!phaseKey) {
      phaseKey = 'phase_01_digital_solution_selling';
    }

    const phaseConfig = kb.phase_configurations?.[phaseKey] || {};
    const indConfigs = phaseConfig.industry_configurations || {};

    let selectedIndConfig: any = null;
    const cleanIndustry = resolvedIndustry.toLowerCase().replace(/[^a-z0-9]+/g, '_');

    for (const [indKey, indVal] of Object.entries(indConfigs)) {
      const indName = (indVal as any).industry_context_reference?.industry_name || '';
      if (
        indName.toLowerCase() === resolvedIndustry.toLowerCase() ||
        indKey.toLowerCase() === cleanIndustry ||
        cleanIndustry.includes(indKey.toLowerCase().replace(/^ind\d+_/, ''))
      ) {
        selectedIndConfig = indVal;
        break;
      }
    }

    if (!selectedIndConfig) {
      const keys = Object.keys(indConfigs);
      if (keys.length > 0) {
        selectedIndConfig = indConfigs[keys[0]];
      }
    }

    // Also look up industry details from Opportunity_industry_configuration_JSON
    let indSpecificInfo: any = null;
    const revenueMotionsInd = OQ_INDUSTRY_CONFIG?.revenue_motions || {};
    for (const [rmKey, rmVal] of Object.entries(revenueMotionsInd)) {
      const rmFam = (rmVal as any).revenue_motion_family || '';
      if (rmFam.toLowerCase() === resolvedMotion.toLowerCase() || rmKey.toLowerCase().includes(resolvedMotion.toLowerCase().replace(/[^a-z0-9]/g, '_'))) {
        const indMap = (rmVal as any).industries || {};
        for (const [iKey, iVal] of Object.entries(indMap)) {
          if (iKey.toLowerCase() === resolvedIndustry.toLowerCase() || (iVal as any).industry_name?.toLowerCase() === resolvedIndustry.toLowerCase()) {
            indSpecificInfo = iVal;
            break;
          }
        }
      }
    }

    return {
      phaseKey,
      phaseConfig,
      industryConfig: selectedIndConfig,
      indSpecificInfo
    };
  }, [resolvedMotion, resolvedIndustry]);

  // 2. Extract evidence objects for all 10 dimensions from static JSON
  const allDimensionQuestions = useMemo(() => {
    const qualConfig = resolvedConfiguration.industryConfig?.qualification_configuration || {};
    const mapping: Record<string, {
      dimensionName: string;
      questions: any[];
      categories: any[];
    }> = {};

    OQ_10_DIMENSIONS.forEach(dim => {
      const dimData = qualConfig[dim.code] || {};
      const questions = Array.isArray(dimData.evidence_questions) ? dimData.evidence_questions : [];
      const categories = Array.isArray(dimData.evidence_categories) ? dimData.evidence_categories : [];

      mapping[dim.code] = {
        dimensionName: dimData.dimension_name || dim.name,
        questions,
        categories
      };
    });

    return mapping;
  }, [resolvedConfiguration]);

  // 3. Initialize session and load existing evidence from Supabase
  useEffect(() => {
    let isMounted = true;

    const initFormAndEvidence = async () => {
      if (!oppId) {
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        // Resolve or create session
        const session = await OpportunityDataService.getOrCreateSession(oppId, {
          revenueMotion: resolvedMotion,
          industry: resolvedIndustry
        });

        if (isMounted && session?.id) {
          setSessionId(session.id);
          // Fetch existing evidence records for this session
          const records = await OpportunityDataService.getEvidenceRecords(session.id);
          
          const initialFormState: Record<string, any> = {};
          let hasAnsweredAny = false;
          records.forEach((rec: OpportunityEvidenceRecord) => {
            if (rec.answer_value && rec.answer_value.trim() !== '') {
              hasAnsweredAny = true;
            }
            initialFormState[rec.evidence_id] = {
              response: rec.answer_value || '',
              suggested: '',
              notes: '',
              source: rec.evidence_source || 'Sales Rep Interview',
              strength: rec.evidence_strength || 'customer_confirmed'
            };
          });

          if (hasAnsweredAny && oppId && typeof window !== 'undefined') {
            localStorage.setItem(`oq_started_${oppId}`, 'true');
            localStorage.setItem(`oq_has_saved_evidence_${oppId}`, 'true');
          }

          setFormData(prev => ({ ...initialFormState, ...prev }));
        }
      } catch (err) {
        console.warn('Error loading opportunity qualification evidence:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    initFormAndEvidence();

    return () => {
      isMounted = false;
    };
  }, [oppId, resolvedMotion, resolvedIndustry]);

  // Horizontal Tab Scroll Navigation
  const handleTabClick = (e: React.MouseEvent<HTMLButtonElement>, dimCode: string) => {
    setActiveDimension(dimCode);
    const tab = e.currentTarget;
    const container = tabsContainerRef.current;
    if (!container) return;

    const tabRect = tab.getBoundingClientRect();
    const containerRect = container.getBoundingClientRect();
    const scrollThreshold = 100;

    if (tabRect.right > containerRect.right - scrollThreshold) {
      container.scrollBy({ left: container.clientWidth / 2, behavior: 'smooth' });
    } else if (tabRect.left < containerRect.left + scrollThreshold) {
      container.scrollBy({ left: -container.clientWidth / 2, behavior: 'smooth' });
    }
  };

  // Form field update handler
  const handleInputChange = (
    qId: string, 
    field: 'response' | 'suggested' | 'notes' | 'source' | 'strength', 
    value: string, 
    extraUpdates?: Record<string, string>
  ) => {
    setFormData(prev => {
      const current = prev[qId] || {
        response: '',
        suggested: '',
        notes: '',
        source: 'Sales Rep Interview',
        strength: 'customer_confirmed'
      };
      const updated = { ...current, [field]: value };
      if (extraUpdates) {
        Object.entries(extraUpdates).forEach(([k, v]) => {
          (updated as any)[k] = v;
        });
      }
      return {
        ...prev,
        [qId]: updated
      };
    });
  };

  // Static suggested answers generated purely from JSON knowledge base
  const getStaticSuggestedOptions = (question: any) => {
    if (!question) return [];
    const options: Array<{ tier: string; label: string; text: string }> = [];

    // Positive signals
    if (Array.isArray(question.positive_signals)) {
      question.positive_signals.forEach((sig: string) => {
        options.push({
          tier: 'positive',
          label: `[Positive Match] ${sig}`,
          text: sig
        });
      });
    }

    // Expected evidence criteria
    if (question.expected_evidence) {
      options.push({
        tier: 'verified',
        label: `[Target Criteria] ${question.expected_evidence}`,
        text: question.expected_evidence
      });
    }

    // Negative / Risk signals
    if (Array.isArray(question.negative_signals)) {
      question.negative_signals.forEach((sig: string) => {
        options.push({
          tier: 'negative',
          label: `[Risk Flag] ${sig}`,
          text: sig
        });
      });
    }

    // Neutral baseline option
    options.push({
      tier: 'neutral',
      label: '[Neutral / Exploration] Evidence exploratory; customer validation in progress with stakeholders.',
      text: 'Evidence exploratory; customer validation in progress with stakeholders.'
    });

    return options;
  };

  // Progress metrics
  const getDimensionProgress = (dimCode: string) => {
    const questions = allDimensionQuestions[dimCode]?.questions || [];
    const completed = questions.filter(q => !!formData[q.question_id]?.response?.trim());
    const required = questions.filter(q => q.question_priority === 'Critical' || q.required);
    const requiredCompleted = required.filter(q => !!formData[q.question_id]?.response?.trim());

    return {
      completed: completed.length,
      total: questions.length,
      requiredTotal: required.length,
      requiredCompleted: requiredCompleted.length,
      isComplete: (required.length > 0 ? requiredCompleted.length === required.length : completed.length > 0) && questions.length > 0
    };
  };

  const totalProgress = useMemo(() => {
    let totalQuestions = 0;
    let completedQuestions = 0;
    let totalRequired = 0;
    let completedRequired = 0;

    OQ_10_DIMENSIONS.forEach(dim => {
      const p = getDimensionProgress(dim.code);
      totalQuestions += p.total;
      completedQuestions += p.completed;
      totalRequired += p.requiredTotal;
      completedRequired += p.requiredCompleted;
    });

    return {
      totalQuestions,
      completedQuestions,
      totalRequired,
      completedRequired,
      percentage: totalQuestions > 0 ? Math.round((completedQuestions / totalQuestions) * 100) : 0
    };
  }, [allDimensionQuestions, formData]);

  // Save evidence to Supabase
  const handleSaveEvidence = async (isDraft = false) => {
    if (!oppId) {
      setSaveError('No opportunity context found.');
      return;
    }

    setSaving(true);
    setSaveError(null);
    setSaveSuccess(null);
    setValidationError(null);

    try {
      // 1. Ensure session
      const session = await OpportunityDataService.getOrCreateSession(oppId, {
        revenueMotion: resolvedMotion,
        industry: resolvedIndustry
      });

      const currentSessionId = session?.id || sessionId;
      if (!currentSessionId) throw new Error('Could not establish qualification session in Supabase.');

      // 2. Format evidence payload for all populated answers
      const evidencePayload: any[] = [];
      Object.entries(allDimensionQuestions).forEach(([dimCode, dimData]) => {
        dimData.questions.forEach(q => {
          const entry = formData[q.question_id];
          if (entry && entry.response && entry.response.trim() !== '') {
            evidencePayload.push({
              dimension_code: dimCode,
              evidence_id: q.question_id,
              question_text: q.question_text,
              answer_value: entry.response.trim(),
              evidence_source: entry.source || 'Sales Rep Interview',
              evidence_strength: entry.strength || 'customer_confirmed'
            });
          }
        });
      });

      if (evidencePayload.length === 0 && !isDraft) {
        setValidationError('Please input evidence responses or select suggested answers before saving.');
        setSaving(false);
        return;
      }

      // 3. Submit evidence to Supabase
      if (evidencePayload.length > 0) {
        await OpportunityDataService.submitEvidence(currentSessionId, evidencePayload);
        await OpportunityDataService.recordEvidenceSaved(oppId, currentSessionId, evidencePayload.length);
      }

      setSaveSuccess(
        isDraft 
          ? `Evidence draft saved (${evidencePayload.length} objects updated) in Supabase!`
          : `Opportunity evidence successfully persisted (${evidencePayload.length} objects) in Supabase!`
      );

      if (onEvidenceSaved) {
        onEvidenceSaved();
      }

      setTimeout(() => setSaveSuccess(null), 4000);
    } catch (err: any) {
      console.error('Failed to save opportunity qualification evidence:', err);
      setSaveError(err.message || 'Failed to save evidence to Supabase database.');
    } finally {
      setSaving(false);
    }
  };

  const handleRunQualification = async () => {
    setRunningQualification(true);
    setSaveError(null);
    setValidationError(null);

    try {
      // 1. Ensure any evidence on the form is saved
      await handleSaveEvidence(false);

      const currentOppId = opportunity?.id || propOppId;
      let currentSessionId = sessionId || propSessionId;
      if (!currentSessionId && currentOppId) {
        const sess = await OpportunityDataService.getSessionByOpportunity(currentOppId);
        currentSessionId = sess?.id;
      }

      if (!currentSessionId && currentOppId) {
        const sess = await OpportunityDataService.getOrCreateSession(currentOppId, {
          revenueMotion: resolvedMotion,
          industry: resolvedIndustry
        });
        currentSessionId = sess.id;
        setSessionId(sess.id);
      }

      // 2. Fetch all collected evidence
      const evRecords = currentSessionId ? await OpportunityDataService.getEvidenceRecords(currentSessionId) : [];

      // 3. Trigger Gemini assessment reasoning
      const allDefinedQuestionsList: any[] = [];
      Object.entries(allDimensionQuestions).forEach(([dimCode, dimData]) => {
        dimData.questions.forEach((q: any) => {
          allDefinedQuestionsList.push({
            evidence_id: q.question_id,
            dimension_code: dimCode,
            dimension_name: dimData.dimensionName,
            question_text: q.question_text,
            expected_evidence: q.expected_evidence,
            positive_signals: q.positive_signals || [],
            negative_signals: q.negative_signals || [],
            ai_reasoning_logic: q.ai_reasoning_logic,
            question_priority: q.question_priority || 'Standard'
          });
        });
      });

      const reasoningContext = {
        sql_inheritance_context: opportunity?.sql_qip_package || {},
        all_defined_questions: allDefinedQuestionsList,
        opportunity_assessment_context: {
          all_defined_questions: allDefinedQuestionsList,
          evidence: evRecords.map(r => ({
            dimension_code: r.dimension_code,
            evidence_id: r.evidence_id,
            question_text: r.question_text,
            answer_value: r.answer_value,
            evidence_source: r.evidence_source,
            evidence_strength: r.evidence_strength
          }))
        },
        industry_config: resolvedConfiguration.industryConfig,
        evidence_kb: OQ_KB,
        qualification_rules: OQ_RULES
      };

      let result: any = null;
      if (currentSessionId) {
        const rawRes = await OpportunityDataService.executeReasoning(currentSessionId, reasoningContext);
        result = rawRes?.result || rawRes;
      }

      // 4. Save the full result in Supabase and sync local state
      if (currentOppId && currentSessionId && result) {
        await OpportunityDataService.saveFullQualificationResult(currentOppId, currentSessionId, result);
        if (typeof window !== 'undefined') {
          localStorage.setItem(`oq_has_result_${currentOppId}`, 'true');
        }
      }

      // 5. Trigger transition to the Opportunity Qualification Result view with live calculated data
      if (onProceedToAssessment) {
        onProceedToAssessment(result);
      }
    } catch (err: any) {
      console.error('Failed to run qualification assessment:', err);
      setSaveError(err.message || 'Failed to complete AI qualification reasoning.');
    } finally {
      setRunningQualification(false);
    }
  };

  const currentDimensionData = allDimensionQuestions[activeDimension] || {
    dimensionName: '',
    questions: [],
    categories: []
  };

  // Typical buyers and stakeholders from static config
  const typicalBuyers = resolvedConfiguration.industryConfig?.industry_context_reference?.qualification_context?.typical_buyers || [
    'CIO',
    'CTO',
    'VP Engineering',
    'Business Function Leader',
    'Procurement & Security Evaluator'
  ];

  return (
    <div className="w-full bg-bg-surface rounded-2xl p-6 sm:p-8 font-sans border border-border/60 shadow-xl space-y-7">
      
      {/* Header Diagnostic Suite (Ref: SQL Qualification Form typography & style) */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-border/60">
        <div>
          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
            {onBack && (
              <button
                type="button"
                onClick={onBack}
                className="p-1.5 rounded-lg bg-bg-primary hover:bg-bg-primary/80 text-text-secondary hover:text-text-primary border border-border transition-all cursor-pointer mr-1"
                title="Back to SQL Handover & Opportunity Form"
              >
                <ArrowLeft className="h-4 w-4" />
              </button>
            )}
            <span className="text-[10px] font-mono font-bold text-accent uppercase tracking-widest bg-accent/10 px-2.5 py-0.5 rounded-md border border-accent/20">
              RevOS Opportunity Qualification Engine
            </span>
            <span className="text-[10px] font-mono text-text-secondary">
              Stage: SQL-to-Opportunity Evidence Intake
            </span>
          </div>

          <h2 className="text-2xl font-black text-text-primary uppercase tracking-tight flex items-center gap-2.5">
            <FileText className="h-6 w-6 text-accent" />
            <span>Opportunity Qualification Form</span>
          </h2>

          <p className="text-xs text-text-secondary mt-1 max-w-3xl leading-relaxed">
            Create structured qualification evidence objects for <span className="font-bold text-text-primary">{resolvedIndustry}</span> industry under <span className="font-bold text-text-primary">{resolvedMotion}</span> revenue motion. These evidence objects supply the diagnostic inputs for Gemini strategic qualification in the Assessment phase.
          </p>
        </div>

        {/* Diagnostic Progress Summary */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 bg-bg-primary p-3.5 rounded-xl border border-border/80 shrink-0">
          <div className="space-y-1">
            <div className="flex items-center justify-between gap-4 text-[11px] font-mono">
              <span className="text-text-secondary font-bold uppercase">Evidence Progress</span>
              <span className="text-accent font-black">{totalProgress.completedQuestions} / {totalProgress.totalQuestions}</span>
            </div>
            <div className="w-44 h-2 bg-bg-surface rounded-full overflow-hidden border border-border/50">
              <div 
                className="h-full bg-accent transition-all duration-300 rounded-full"
                style={{ width: `${totalProgress.percentage}%` }}
              />
            </div>
            <span className="text-[9px] font-mono text-text-secondary/70 block">
              10 Qualification Dimensions Active
            </span>
          </div>
        </div>
      </div>

      {/* Horizontal Category Tab Bar (All 10 Canonical Qualification Dimensions) */}
      <div 
        ref={tabsContainerRef}
        className="flex overflow-x-auto border-b border-border/60 pb-2 gap-2 [&::-webkit-scrollbar]:h-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-border/50 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-border/80"
      >
        {OQ_10_DIMENSIONS.map(dim => {
          const { completed, total, isComplete } = getDimensionProgress(dim.code);
          const isActive = activeDimension === dim.code;

          return (
            <button
              key={dim.code}
              type="button"
              onClick={(e) => handleTabClick(e, dim.code)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-t-xl font-black text-xs uppercase tracking-wide transition-all whitespace-nowrap cursor-pointer select-none ${
                isActive 
                  ? 'bg-bg-primary text-accent border-b-2 border-accent shadow-xs' 
                  : 'text-text-secondary hover:text-text-primary hover:bg-bg-primary/50'
              }`}
            >
              <CheckCircle2 className={`h-4 w-4 ${isComplete ? 'text-emerald-500' : 'text-text-secondary/40'}`} />
              <span>{dim.shortTitle}</span>
              <span className={`px-1.5 py-0.5 rounded text-[9px] font-mono ml-1 font-bold ${
                isActive ? 'bg-accent/20 text-accent border border-accent/30' : 'bg-bg-surface text-text-secondary border border-border/60'
              }`}>
                {completed}/{total}
              </span>
            </button>
          );
        })}
      </div>

      {/* Active Dimension Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-bg-primary/60 border border-border/60 rounded-xl">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-accent block" />
            <h3 className="text-sm font-black text-text-primary uppercase tracking-wider">
              {currentDimensionData.dimensionName}
            </h3>
          </div>
          <p className="text-xs text-text-secondary pl-4">
            Validation of enterprise qualification evidence criteria tailored to {resolvedIndustry} solution selling.
          </p>
        </div>

        <div className="flex items-center gap-2 text-[10px] font-mono text-text-secondary shrink-0 pl-4 sm:pl-0">
          <span className="px-2 py-0.5 rounded bg-bg-surface border border-border">
            {currentDimensionData.questions.length} Evidence Objects
          </span>
          <span className="px-2 py-0.5 rounded bg-bg-surface border border-border">
            Static KB: Integrated
          </span>
        </div>
      </div>

      {/* Notifications */}
      {saveSuccess && (
        <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold rounded-xl flex items-center gap-2.5 animate-in fade-in duration-200">
          <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
          <span>{saveSuccess}</span>
        </div>
      )}

      {saveError && (
        <div className="p-3.5 bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-medium rounded-xl flex items-center gap-2.5 animate-in fade-in duration-200">
          <AlertCircle className="h-4 w-4 shrink-0 text-red-400" />
          <span>{saveError}</span>
        </div>
      )}

      {validationError && (
        <div className="p-3.5 bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-medium rounded-xl flex items-center gap-2.5 animate-in fade-in duration-200">
          <AlertCircle className="h-4 w-4 shrink-0 text-amber-400" />
          <span>{validationError}</span>
        </div>
      )}

      {/* Evidence Objects Grid (Ref: SQL Qualification Form 2-Column Responsive Grid) */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-16 text-text-secondary space-y-2">
          <RefreshCw className="h-6 w-6 animate-spin text-accent" />
          <span className="text-xs font-mono uppercase tracking-wider">Loading Qualification Evidence Catalog...</span>
        </div>
      ) : currentDimensionData.questions.length === 0 ? (
        <div className="p-12 text-center bg-bg-primary border border-border/70 rounded-2xl space-y-2">
          <HelpCircle className="h-8 w-8 mx-auto text-text-secondary/50" />
          <h4 className="text-sm font-bold text-text-primary">No Questions Defined For Dimension</h4>
          <p className="text-xs text-text-secondary">
            No specific evidence objects found in knowledge base for {currentDimensionData.dimensionName || 'this dimension'} under {resolvedIndustry}.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4.5">
          {currentDimensionData.questions.map((question: any) => {
            const currentEntry = formData[question.question_id] || {
              response: '',
              suggested: '',
              notes: '',
              source: 'Sales Rep Interview',
              strength: 'customer_confirmed'
            };

            const isPopulated = !!currentEntry.response?.trim();
            const isCritical = question.question_priority === 'Critical';
            const isRequired = isCritical || question.required;
            const suggestedOptions = getStaticSuggestedOptions(question);

            // Construct rich AI Guidance components for Tooltip:
            // 1. Evidence definition
            const evidenceDefinition = question.expected_evidence || question.question_text || 'Standard commercial verification evidence.';
            
            // 2. Why it matters
            const whyItMatters = question.ai_reasoning_logic || 'Critical validation parameter to substantiate deal viability, customer budget allocation, and technical fit.';
            
            // 3. AI Guidance:
            // - Business Consequence
            const negativeImpactSummary = Array.isArray(question.negative_signals) && question.negative_signals.length > 0
              ? question.negative_signals.join('; ')
              : 'Unvalidated parameters risk deal stalling, exploratory dead-ends, misallocated presales engineering, or procurement rejection.';
            
            // - Urgency
            const urgencyDescription = isCritical
              ? 'Immediate Gate: Mandatory qualification threshold required prior to advancing opportunity into Solution Development & Commercial Proposal.'
              : question.question_priority === 'Recommended'
                ? 'High Urgency: Key milestone required to calibrate competitive positioning and pipeline commit velocity.'
                : 'Strategic Priority: Executive-level alignment required for contract structuring and commercial funding authorization.';
            
            // - Affected Stakeholders
            const affectedStakeholdersList = typicalBuyers.slice(0, 4).join(', ');

            const isTooltipOpen = activeTooltipId === question.question_id;

            return (
              <motion.div
                key={question.question_id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className={`bg-bg-primary border rounded-2xl p-5 transition-all duration-200 flex flex-col justify-between ${
                  isPopulated 
                    ? 'border-accent/50 shadow-md shadow-accent/5 bg-gradient-to-b from-bg-primary to-bg-surface/40' 
                    : 'border-border/60 hover:border-border shadow-xs'
                }`}
              >
                <div>
                  
                  {/* Card Header */}
                  <div className="flex items-start justify-between gap-3 mb-3.5">
                    <div className="space-y-1.5 flex-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-[9px] font-mono font-bold uppercase px-2 py-0.5 rounded-md bg-bg-surface text-text-secondary border border-border">
                          {question.question_id}
                        </span>

                        {/* Tabs / Badges: Required, Critical */}
                        {isRequired && (
                          <span className="text-[8px] font-mono font-black uppercase tracking-wider px-1.5 py-0.5 rounded border border-accent/40 text-accent bg-accent/10">
                            REQUIRED
                          </span>
                        )}

                        {isCritical && (
                          <span className="text-[8px] font-mono font-black tracking-wider px-1.5 py-0.5 rounded bg-red-500/15 border border-red-500/30 text-red-400">
                            CRITICAL
                          </span>
                        )}

                        {question.question_priority && !isCritical && (
                          <span className="text-[8px] font-mono font-bold tracking-wider px-1.5 py-0.5 rounded bg-bg-surface border border-border/80 text-text-secondary">
                            {question.question_priority.toUpperCase()}
                          </span>
                        )}

                        {/* Tooltip Icon with Interactive Popover */}
                        <div className="relative inline-block">
                          <button
                            type="button"
                            onClick={() => setActiveTooltipId(isTooltipOpen ? null : question.question_id)}
                            onMouseEnter={() => setActiveTooltipId(question.question_id)}
                            onMouseLeave={() => setActiveTooltipId(null)}
                            className="p-1 text-text-secondary hover:text-accent transition-colors cursor-help rounded-md hover:bg-bg-surface"
                            aria-label="View Evidence Details and AI Guidance"
                          >
                            <HelpCircle className="h-3.5 w-3.5" />
                          </button>

                          {/* Tooltip Popover (1. Evidence Definition, 2. Why It Matters, 3. AI Guidance with Consequence, Urgency, Stakeholders) */}
                          <AnimatePresence>
                            {isTooltipOpen && (
                              <motion.div
                                initial={{ opacity: 0, y: -4, scale: 0.98 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: -4, scale: 0.98 }}
                                className="absolute left-0 bottom-full mb-2 w-80 sm:w-96 p-4 bg-bg-surface/98 backdrop-blur-md border border-border rounded-xl shadow-2xl z-30 text-xs font-normal normal-case space-y-3 pointer-events-auto"
                              >
                                <div className="flex items-center justify-between border-b border-border/60 pb-2">
                                  <span className="font-mono text-[10px] uppercase font-black text-accent flex items-center gap-1.5">
                                    <Sparkles className="h-3 w-3" />
                                    Qualification Intelligence
                                  </span>
                                  <span className="text-[9px] font-mono text-text-secondary">
                                    {question.question_id}
                                  </span>
                                </div>

                                {/* 1. Evidence Definition */}
                                <div className="space-y-1">
                                  <span className="text-[10px] uppercase font-mono font-bold text-text-primary block flex items-center gap-1">
                                    <Info className="h-3 w-3 text-accent" />
                                    1. Evidence Definition
                                  </span>
                                  <p className="text-text-secondary text-[11px] leading-relaxed pl-4 border-l border-border/60">
                                    {evidenceDefinition}
                                  </p>
                                </div>

                                {/* 2. Why It Matters */}
                                <div className="space-y-1">
                                  <span className="text-[10px] uppercase font-mono font-bold text-text-primary block flex items-center gap-1">
                                    <TrendingUp className="h-3 w-3 text-accent" />
                                    2. Why It Matters
                                  </span>
                                  <p className="text-text-secondary text-[11px] leading-relaxed pl-4 border-l border-border/60">
                                    {whyItMatters}
                                  </p>
                                </div>

                                {/* 3. AI Guidance (Business Consequence, Urgency, Affected Stakeholders) */}
                                <div className="p-3 bg-bg-primary rounded-lg border border-border/80 space-y-2">
                                  <span className="text-[10px] uppercase font-mono font-black text-accent flex items-center gap-1.5">
                                    <Bot className="h-3 w-3" />
                                    3. AI Guidance
                                  </span>

                                  <div className="space-y-1.5 text-[11px]">
                                    <div>
                                      <strong className="text-red-400 font-bold block text-[10px] uppercase tracking-wide">
                                        • Business Consequence:
                                      </strong>
                                      <span className="text-text-secondary block pl-2 mt-0.5 leading-relaxed">
                                        {negativeImpactSummary}
                                      </span>
                                    </div>

                                    <div>
                                      <strong className="text-amber-400 font-bold block text-[10px] uppercase tracking-wide">
                                        • Urgency &amp; Gating:
                                      </strong>
                                      <span className="text-text-secondary block pl-2 mt-0.5 leading-relaxed">
                                        {urgencyDescription}
                                      </span>
                                    </div>

                                    <div>
                                      <strong className="text-sky-400 font-bold block text-[10px] uppercase tracking-wide">
                                        • Affected Stakeholders:
                                      </strong>
                                      <span className="text-text-secondary block pl-2 mt-0.5 leading-relaxed font-mono text-[10px]">
                                        {affectedStakeholdersList}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      </div>

                      <h4 className="text-xs font-black text-text-primary leading-snug">
                        {question.question_text}
                      </h4>
                    </div>

                    {isPopulated && (
                      <span className="flex items-center gap-1 text-[9px] font-mono font-bold uppercase tracking-wider text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20 shrink-0">
                        <Check className="h-3 w-3" />
                        POPULATED
                      </span>
                    )}
                  </div>

                  {/* Input Fields */}
                  <div className="space-y-3.5">
                    
                    {/* User Input Area for Evidence Question */}
                    <div>
                      <label className="block text-[9px] font-mono uppercase tracking-widest text-text-secondary mb-1.5">
                        Discovery Evidence / Response Text
                      </label>
                      <textarea
                        value={currentEntry.response}
                        onChange={(e) => handleInputChange(question.question_id, 'response', e.target.value)}
                        placeholder="Enter verified customer responses, call notes, or architectural findings collected during discovery..."
                        rows={2}
                        className="w-full bg-bg-surface border border-border/80 focus:border-accent focus:outline-none rounded-xl p-3 text-xs leading-relaxed text-text-primary transition-all placeholder-text-secondary/40 font-sans resize-y"
                      />
                    </div>

                    {/* Suggested Answer Dropdown List (Populated purely from static JSON configuration databases) */}
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="block text-[9px] font-mono uppercase tracking-widest text-text-secondary flex items-center gap-1">
                          <Bot className="h-3 w-3 text-accent" />
                          <span>Suggested Answer (Static Knowledge Base)</span>
                        </label>
                      </div>

                      <div className="relative">
                        <select
                          value={currentEntry.suggested || ''}
                          onChange={(e) => {
                            const val = e.target.value;
                            const matched = suggestedOptions.find(o => o.text === val || o.label === val);
                            const textVal = matched?.text || val;
                            handleInputChange(question.question_id, 'suggested', val, {
                              response: textVal
                            });
                          }}
                          className="w-full bg-bg-surface border border-border/80 rounded-xl px-3 py-2.5 text-xs text-text-primary appearance-none focus:outline-none focus:border-accent transition-colors cursor-pointer pr-9 font-sans"
                        >
                          <option value="">
                            Select static response pattern from knowledge base...
                          </option>
                          {suggestedOptions.map((opt, idx) => (
                            <option key={idx} value={opt.text}>
                              {opt.label}
                            </option>
                          ))}
                        </select>
                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-text-secondary pointer-events-none" />
                      </div>
                    </div>

                    {/* Contextual Notes & Verification Selectors */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                      <div>
                        <label className="block text-[9px] font-mono uppercase tracking-widest text-text-secondary mb-1">
                          Evidence Source
                        </label>
                        <select
                          value={currentEntry.source}
                          onChange={(e) => handleInputChange(question.question_id, 'source', e.target.value)}
                          className="w-full bg-bg-surface border border-border/70 focus:border-accent focus:outline-none rounded-xl px-2.5 py-1.5 text-[11px] text-text-primary font-sans cursor-pointer"
                        >
                          <option value="Customer Call Transcript">Verified Call Transcript</option>
                          <option value="Sales Rep Interview">Sales Rep Discovery Interview</option>
                          <option value="Email thread">Email Thread Correspondence</option>
                          <option value="Executive Meeting">Executive Sponsor Briefing</option>
                          <option value="Procurement sheet">Procurement Guideline Sheet</option>
                          <option value="RFP Response">RFP / RFI Official Document</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-[9px] font-mono uppercase tracking-widest text-text-secondary mb-1">
                          Validation Strength
                        </label>
                        <select
                          value={currentEntry.strength}
                          onChange={(e) => handleInputChange(question.question_id, 'strength', e.target.value)}
                          className="w-full bg-bg-surface border border-border/70 focus:border-accent focus:outline-none rounded-xl px-2.5 py-1.5 text-[11px] text-text-primary font-sans cursor-pointer"
                        >
                          <option value="customer_confirmed">Customer Confirmed Statement</option>
                          <option value="verified">Verified Contractual / Financial Fact</option>
                          <option value="unverified">Unverified Account Representative Guess</option>
                        </select>
                      </div>
                    </div>

                  </div>
                </div>

              </motion.div>
            );
          })}
        </div>
      )}

      {/* Form Action Suite (Validation Suite & Actions Ref: SQL Qualification Form) */}
      <div className="mt-8 border border-border/70 rounded-2xl p-5 bg-bg-primary flex flex-col md:flex-row md:items-center justify-between gap-4">
        
        {/* Left: Validation Status */}
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[10px] font-mono font-black uppercase tracking-widest text-text-secondary">
              Database Sync: Supabase Cloud (Data API Compliant)
            </span>
          </div>

          <div className="text-xs text-text-secondary">
            {totalProgress.completedQuestions === 0 ? (
              <span>No evidence inputted yet. Select suggested answers or enter discovery findings.</span>
            ) : (
              <span className="font-medium">
                <span className="font-bold text-text-primary">{totalProgress.completedQuestions} of {totalProgress.totalQuestions}</span> questions populated across 10 qualification dimensions.
              </span>
            )}
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-3 w-full md:w-auto">
          {/* Save Button */}
          <button
            type="button"
            onClick={() => handleSaveEvidence(true)}
            disabled={saving}
            className="flex-1 md:flex-none px-5 py-2.5 bg-accent/20 hover:bg-accent/30 text-accent border border-accent/40 font-black uppercase text-xs rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            {saving ? (
              <>
                <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                <span>Saving...</span>
              </>
            ) : (
              <>
                <Save className="h-3.5 w-3.5" />
                <span>Save</span>
              </>
            )}
          </button>

          {/* Run Qualification Button */}
          <button
            type="button"
            onClick={handleRunQualification}
            disabled={saving || runningQualification}
            className="flex-1 md:flex-none px-6 py-2.5 bg-accent hover:bg-accent-hover text-black font-black uppercase text-xs rounded-xl transition-all shadow-md shadow-accent/15 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {runningQualification ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              
            ) : (
              <Bot className="h-4 w-4" />
              
            )}
            <span>{runningQualification ? 'Analyzing...' : 'Run Qualification'}</span>
          </button>
        </div>

      </div>

    </div>
  );
};

export default OpportunityDynamicEvidenceForm;
