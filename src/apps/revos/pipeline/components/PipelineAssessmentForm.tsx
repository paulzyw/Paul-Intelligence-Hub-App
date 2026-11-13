import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  FileText,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  HelpCircle,
  ChevronDown,
  Save,
  Bot,
  ShieldCheck,
  Check,
  Info,
  TrendingUp,
  ArrowLeft
} from 'lucide-react';
import {
  PipelineOpportunity,
  PipelineInheritance,
  PipelineEvidence,
  PADFDimensionId
} from '../../types/pipeline';
import { PipelineDataService } from '../services/PipelineDataService';
import { PipelineConfigService } from '../services/PipelineConfigService';

export interface PipelineAssessmentFormProps {
  opportunity: PipelineOpportunity;
  inheritance?: PipelineInheritance | null;
  initialDimension?: PADFDimensionId;
  onAssessmentComplete?: (result: any) => void;
  onEvidenceSaved?: (count: number) => void;
  onBack?: () => void;
}

interface FormEntryState {
  evidence_statement: string;
  suggested_selection: string;
  source_type: string;
  evidence_confidence: number;
  customer_confirmed: boolean;
  notes: string;
}

interface ValidationResultState {
  status: 'VALIDATED' | 'NEEDS_ATTENTION';
  ready_for_assessment: boolean;
  populated_count: number;
  total_questions: number;
  unconfirmed_count: number;
  missing_mandatory_dimensions: string[];
  dimension_coverage: Record<string, { answered: number; total: number; status: string }>;
  ai_validation_verdict: string;
}

export const PipelineAssessmentForm: React.FC<PipelineAssessmentFormProps> = ({
  opportunity,
  inheritance,
  initialDimension,
  onAssessmentComplete,
  onEvidenceSaved,
  onBack
}) => {
  const dimensions = useMemo(() => PipelineConfigService.getCanonicalPADFDimensions(), []);
  const evidenceSources = useMemo(() => PipelineConfigService.getEvidenceSources(), []);
  const tabsContainerRef = useRef<HTMLDivElement>(null);

  const [activeDimension, setActiveDimension] = useState<PADFDimensionId>(
    initialDimension || 'PA1_Customer_Value_and_Urgency'
  );

  useEffect(() => {
    if (initialDimension) {
      setActiveDimension(initialDimension);
    }
  }, [initialDimension]);
  const [groupedQuestions, setGroupedQuestions] = useState<Record<string, any[]>>({});
  const [formData, setFormData] = useState<Record<string, FormEntryState>>({});
  const [filterMode, setFilterMode] = useState<'all' | 'unanswered' | 'populated'>('all');

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [validating, setValidating] = useState(false);
  const [runningAssessment, setRunningAssessment] = useState(false);

  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [validationResult, setValidationResult] = useState<ValidationResultState | null>(null);
  const [activeTooltipId, setActiveTooltipId] = useState<string | null>(null);

  const industryLabel = opportunity.industry_name || 'Enterprise Software';
  const motionLabel = opportunity.revenue_motion_name || 'Digital Solution Selling';

  // Load 48 dynamic evidence questions across PA1–PA8 & hydrate existing saved evidence
  useEffect(() => {
    let mounted = true;

    const loadFormContext = async () => {
      setLoading(true);
      setActionError(null);
      try {
        const res = await PipelineDataService.queryEvidenceQuestions(
          opportunity.pipeline_id,
          motionLabel,
          industryLabel
        );

        if (!mounted) return;
        setGroupedQuestions(res.grouped_questions || {});

        // Hydrate form state from previously persisted pipeline_evidence rows
        const existingMap: Record<string, FormEntryState> = {};
        const existingList: PipelineEvidence[] = res.existing_evidence || [];

        existingList.forEach((ev) => {
          if (!ev.evidence_object_id) return;
          existingMap[ev.evidence_object_id] = {
            evidence_statement: ev.evidence_statement || '',
            suggested_selection: String((ev.metadata as any)?.suggested_selection || ''),
            source_type: ev.source_type || 'ES03_Customer_Meeting_Notes',
            evidence_confidence: Number(ev.evidence_confidence ?? 85),
            customer_confirmed: Boolean(ev.customer_confirmed),
            notes: ev.notes || ''
          };
        });

        setFormData(existingMap);
      } catch (err: any) {
        console.error('Failed to load pipeline evidence questions:', err);
        if (mounted) {
          setActionError(err.message || 'Unable to load Pipeline Assessment evidence catalog.');
        }
      } finally {
        if (mounted) setLoading(false);
      }
    };

    if (opportunity?.pipeline_id) {
      loadFormContext();
    }

    return () => {
      mounted = false;
    };
  }, [opportunity.pipeline_id, motionLabel, industryLabel]);

  // Helper: Generate contextualized Suggested Answer options from Backend + JSON Knowledge Base
  const getSuggestedOptions = (questionObj: any): Array<{ label: string; text: string; confidence: number; confirmed: boolean }> => {
    const backendSuggestions: string[] = Array.isArray(questionObj.suggestedAnswers) ? questionObj.suggestedAnswers : [];

    if (backendSuggestions.length > 0) {
      return backendSuggestions.map((text, idx) => {
        const tierLabel = idx === 0 ? 'Strong Verified' : idx === 1 ? 'Substantiated' : idx === 2 ? 'Partial / Pending' : 'Risk / Gap';
        const confidence = idx === 0 ? 95 : idx === 1 ? 82 : idx === 2 ? 60 : 35;
        return {
          label: `${tierLabel} — ${text.length > 82 ? text.slice(0, 79) + '...' : text}`,
          text,
          confidence,
          confirmed: idx <= 1
        };
      });
    }

    // Contextual fallback derived directly from KB Phase 3 indicators + Industry + Revenue Motion
    const strongIndicators: string[] = Array.isArray(questionObj.strongEvidenceIndicators)
      ? questionObj.strongEvidenceIndicators
      : Array.isArray(questionObj.positiveSignals)
        ? questionObj.positiveSignals
        : [];
    const weakIndicators: string[] = Array.isArray(questionObj.weakEvidenceIndicators)
      ? questionObj.weakEvidenceIndicators
      : Array.isArray(questionObj.negativeSignals)
        ? questionObj.negativeSignals
        : [];

    const options: Array<{ label: string; text: string; confidence: number; confirmed: boolean }> = [];

    if (strongIndicators[0]) {
      const text = `[${industryLabel} / ${motionLabel}] Confirmed directly with customer stakeholders: ${strongIndicators[0]}${strongIndicators[1] ? ` ${strongIndicators[1]}` : ''}`;
      options.push({
        label: `Strong Verified — ${strongIndicators[0]}`,
        text,
        confidence: 92,
        confirmed: true
      });
    }

    if (strongIndicators[1]) {
      const text = `Substantiated during ${motionLabel} discovery: ${strongIndicators[1]}`;
      options.push({
        label: `Substantiated — ${strongIndicators[1]}`,
        text,
        confidence: 80,
        confirmed: true
      });
    }

    options.push({
      label: `Partial / Pending Verification — ${questionObj.evidenceName} partially observed`,
      text: `Initial signals observed for ${questionObj.evidenceName} within ${industryLabel} context, awaiting formal customer documentation or executive verification.`,
      confidence: 60,
      confirmed: false
    });

    if (weakIndicators[0]) {
      options.push({
        label: `Gap / Risk — ${weakIndicators[0]}`,
        text: `Gap identified: ${weakIndicators[0]} Requires targeted discovery action to remediate risk in ${questionObj.evidenceName}.`,
        confidence: 35,
        confirmed: false
      });
    }

    return options;
  };

  // Compute completion metrics across PA1–PA8
  const progressStats = useMemo(() => {
    let totalQuestions = 0;
    let completedQuestions = 0;
    const perDimension: Record<string, { completed: number; total: number; isComplete: boolean }> = {};

    dimensions.forEach((dim) => {
      const questions = groupedQuestions[dim.id] || [];
      const total = questions.length;
      const completed = questions.filter((q) => {
        const id = q.evidenceId || q.id;
        return Boolean(formData[id]?.evidence_statement?.trim());
      }).length;

      totalQuestions += total;
      completedQuestions += completed;
      perDimension[dim.id] = {
        completed,
        total,
        isComplete: total > 0 && completed === total
      };
    });

    return {
      totalQuestions,
      completedQuestions,
      percentage: totalQuestions > 0 ? Math.round((completedQuestions / totalQuestions) * 100) : 0,
      perDimension
    };
  }, [dimensions, groupedQuestions, formData]);

  const handleFieldChange = (
    evidenceId: string,
    updates: Partial<FormEntryState>
  ) => {
    setFormData((prev) => {
      const current = prev[evidenceId] || {
        evidence_statement: '',
        suggested_selection: '',
        source_type: 'ES03_Customer_Meeting_Notes',
        evidence_confidence: 85,
        customer_confirmed: false,
        notes: ''
      };
      return {
        ...prev,
        [evidenceId]: {
          ...current,
          ...updates
        }
      };
    });
    // Clear stale validation banner when user edits
    if (validationResult) {
      setValidationResult(null);
    }
  };

  // Build normalized payload of populated evidence items
  const buildPopulatedEvidencePayload = () => {
    const records: any[] = [];
    dimensions.forEach((dim) => {
      const qs = groupedQuestions[dim.id] || [];
      qs.forEach((q) => {
        const evId = q.evidenceId || q.id;
        const entry = formData[evId];
        if (entry && entry.evidence_statement?.trim()) {
          records.push({
            evidence_object_id: evId,
            dimension_code: dim.id,
            evidence_type: q.evidenceType || 'customer_statement',
            evidence_statement: entry.evidence_statement.trim(),
            source_type: entry.source_type || 'ES03_Customer_Meeting_Notes',
            source_reference: 'Pipeline Assessment Form',
            evidence_confidence: Number(entry.evidence_confidence ?? 85),
            customer_confirmed: Boolean(entry.customer_confirmed),
            notes: entry.notes || '',
            suggested_selection: entry.suggested_selection || null,
            metadata: {
              dimension_code: dim.id,
              dimension_short: dim.shortCode,
              evidence_name: q.evidenceName || q.name,
              suggested_selection: entry.suggested_selection || null
            }
          });
        }
      });
    });
    return records;
  };

  const handleSaveEvidence = async (showBanner = true): Promise<any[] | null> => {
    const payload = buildPopulatedEvidencePayload();
    if (payload.length === 0) {
      setActionError('Please provide or select an answer for at least one evidence question before saving.');
      return null;
    }

    setSaving(true);
    setActionError(null);
    if (showBanner) setSaveSuccess(null);

    try {
      const res = await PipelineDataService.submitEvidenceBatch(opportunity.pipeline_id, payload);
      if (showBanner) {
        setSaveSuccess(`Saved ${res.evidence_count} evidence items to Pipeline Assessment ledger.`);
        setTimeout(() => setSaveSuccess(null), 4500);
      }
      if (onEvidenceSaved) {
        onEvidenceSaved(res.evidence_count);
      }
      return payload;
    } catch (err: any) {
      console.error('Error saving pipeline evidence:', err);
      setActionError(err.message || 'Failed to save evidence answers.');
      return null;
    } finally {
      setSaving(false);
    }
  };

  const handleValidateAnswers = async () => {
    const payload = buildPopulatedEvidencePayload();
    setValidating(true);
    setActionError(null);

    try {
      const result = await PipelineDataService.validateEvidence(opportunity.pipeline_id, payload);
      setValidationResult(result);
    } catch (err: any) {
      console.error('Failed to validate evidence:', err);
      setActionError(err.message || 'Evidence validation failed.');
    } finally {
      setValidating(false);
    }
  };

  const handleRunAssessment = async () => {
    setRunningAssessment(true);
    setActionError(null);
    setSaveSuccess(null);

    try {
      const payload = buildPopulatedEvidencePayload();
      if (payload.length === 0) {
        setActionError('Populate evidence answers across PADF dimensions before running Pipeline Assessment.');
        setRunningAssessment(false);
        return;
      }

      // 1. Save latest evidence edits to Supabase
      await PipelineDataService.submitEvidenceBatch(opportunity.pipeline_id, payload);

      // 2. Execute Gemini + Deterministic Pipeline Assessment
      const assessmentResponse = await PipelineDataService.runPipelineAssessment(opportunity.pipeline_id);

      setSaveSuccess(
        `Assessment #${assessmentResponse.sequence || 1} completed — Risk-Adjusted Winability: ${assessmentResponse.risk_adjusted_winability}% (${assessmentResponse.pipeline_health}).`
      );

      if (onAssessmentComplete) {
        onAssessmentComplete(assessmentResponse);
      }
    } catch (err: any) {
      console.error('Failed to run Pipeline Assessment:', err);
      setActionError(
        err.message ||
          'Unable to execute Gemini Pipeline Assessment. Ensure the pipeline-assessment Edge Function and GEMINI_API_KEY are deployed.'
      );
    } finally {
      setRunningAssessment(false);
    }
  };

  const currentDimMeta = dimensions.find((d) => d.id === activeDimension) || dimensions[0];
  const currentQuestions = groupedQuestions[activeDimension] || [];
  const filteredQuestions = currentQuestions.filter((q) => {
    const id = q.evidenceId || q.id;
    const isPop = Boolean(formData[id]?.evidence_statement?.trim());
    if (filterMode === 'unanswered') return !isPop;
    if (filterMode === 'populated') return isPop;
    return true;
  });

  const activeDimExpectation = PipelineConfigService.getDimensionExpectation(
    currentDimMeta.shortCode,
    motionLabel,
    industryLabel
  );

  return (
    <div className="w-full bg-bg-surface rounded-2xl p-5 sm:p-7 font-sans border border-border space-y-6">
      {/* Form Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-border/70">
        <div>
          <div className="flex items-center gap-2 text-xs text-text-secondary mb-1.5">
            {onBack && (
              <button
                type="button"
                onClick={onBack}
                className="p-1.5 rounded-lg bg-bg-primary hover:bg-bg-primary/80 text-text-secondary hover:text-text-primary border border-border transition-colors cursor-pointer mr-1"
                title="Back to Opportunity Context"
              >
                <ArrowLeft className="h-4 w-4" />
              </button>
            )}
            <span className="font-medium text-accent">Pipeline Assessment Evidence Engine</span>
            <span aria-hidden="true">·</span>
            <span className="font-mono">{opportunity.pipeline_id}</span>
            {inheritance?.qualification_decision && (
              <>
                <span aria-hidden="true">·</span>
                <span>Upstream SQL Status: {inheritance.qualification_decision}</span>
              </>
            )}
          </div>

          <h2 className="text-xl sm:text-2xl font-bold text-text-primary tracking-tight flex items-center gap-2.5">
            <FileText className="h-5 w-5 text-accent shrink-0" />
            <span>Pipeline Assessment Form</span>
          </h2>

          <p className="text-xs text-text-secondary mt-1 max-w-3xl leading-relaxed">
            Collect verified evidence across the 8 canonical PADF dimensions (PA1–PA8) calibrated for{' '}
            <span className="font-semibold text-text-primary">{industryLabel}</span> under{' '}
            <span className="font-semibold text-text-primary">{motionLabel}</span>.
          </p>
        </div>

        {/* Completion Meter */}
        <div className="bg-bg-primary px-4 py-3 rounded-xl border border-border/80 shrink-0 min-w-[210px]">
          <div className="flex items-center justify-between gap-4 text-xs mb-1.5">
            <span className="text-text-secondary font-medium">Evidence Coverage</span>
            <span className="text-accent font-mono font-bold tabular-nums">
              {progressStats.completedQuestions} / {progressStats.totalQuestions || 48}
            </span>
          </div>
          <div className="w-full h-2 bg-bg-surface rounded-full overflow-hidden border border-border/50">
            <div
              className="h-full bg-accent transition-all duration-300 rounded-full"
              style={{ width: `${progressStats.percentage}%` }}
            />
          </div>
          <div className="flex items-center justify-between text-[11px] text-text-secondary mt-1.5 tabular-nums">
            <span>8 PADF Dimensions</span>
            <span className="font-mono">{progressStats.percentage}%</span>
          </div>
        </div>
      </div>

      {/* Horizontal 8-Dimension PADF Navigation Bar */}
      <div
        ref={tabsContainerRef}
        className="flex overflow-x-auto border-b border-border/70 pb-2 gap-1.5 [&::-webkit-scrollbar]:h-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-border/60 [&::-webkit-scrollbar-thumb]:rounded-full"
      >
        {dimensions.map((dim) => {
          const stat = progressStats.perDimension[dim.id] || { completed: 0, total: 6, isComplete: false };
          const isActive = activeDimension === dim.id;
          return (
            <button
              key={dim.id}
              type="button"
              onClick={() => setActiveDimension(dim.id)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-t-xl text-xs font-semibold transition-all whitespace-nowrap shrink-0 cursor-pointer select-none ${
                isActive
                  ? 'bg-bg-primary text-accent border-b-2 border-accent'
                  : 'text-text-secondary hover:text-text-primary hover:bg-bg-primary/50'
              }`}
            >
              <CheckCircle2 className={`h-3.5 w-3.5 shrink-0 ${stat.isComplete ? 'text-emerald-500' : 'text-text-secondary/40'}`} />
              <span>{dim.shortCode}: {dim.name}</span>
              <span className="font-mono text-[11px] tabular-nums opacity-80">
                {stat.completed}/{stat.total}
              </span>
            </button>
          );
        })}
      </div>

      {/* Active Dimension Context Bar + Filter Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 p-4 bg-bg-primary/70 border border-border/70 rounded-xl">
        <div className="space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-sm font-bold text-text-primary">
              {currentDimMeta.shortCode}. {currentDimMeta.name}
            </h3>
            <span className="text-xs text-text-secondary font-mono tabular-nums">
              · Weight {Math.round(currentDimMeta.weight * 100)}%
            </span>
            <span className="text-xs text-text-secondary">
              · {currentDimMeta.mandatory ? 'Mandatory Dimension' : 'Supporting Dimension'}
            </span>
            <span className="text-xs text-accent font-medium">
              · Min Coverage: {activeDimExpectation.minimumCoverageLevel}
            </span>
          </div>
          <p className="text-xs text-text-secondary leading-relaxed">
            {currentDimMeta.description}
          </p>
        </div>

        {/* Filter Segmented Control */}
        <div className="flex items-center gap-1 p-1 bg-bg-surface border border-border rounded-lg shrink-0 self-start lg:self-auto">
          {(['all', 'unanswered', 'populated'] as const).map((mode) => (
            <button
              key={mode}
              type="button"
              onClick={() => setFilterMode(mode)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap cursor-pointer capitalize ${
                filterMode === mode
                  ? 'bg-accent text-black font-semibold'
                  : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              {mode}
            </button>
          ))}
        </div>
      </div>

      {/* Notifications */}
      {saveSuccess && (
        <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-medium rounded-xl flex items-center gap-2.5">
          <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
          <span>{saveSuccess}</span>
        </div>
      )}

      {actionError && (
        <div className="p-3.5 bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-medium rounded-xl flex items-center gap-2.5">
          <AlertCircle className="h-4 w-4 shrink-0 text-red-400" />
          <span>{actionError}</span>
        </div>
      )}

      {/* Validation Verdict Banner */}
      {validationResult && (
        <div
          className={`p-4 rounded-xl border text-xs space-y-2.5 ${
            validationResult.ready_for_assessment
              ? 'bg-emerald-500/10 border-emerald-500/30 text-text-primary'
              : 'bg-amber-500/10 border-amber-500/30 text-text-primary'
          }`}
        >
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-2 font-semibold">
              <ShieldCheck
                className={`h-4 w-4 shrink-0 ${
                  validationResult.ready_for_assessment ? 'text-emerald-400' : 'text-amber-400'
                }`}
              />
              <span>
                Evidence Validation: {validationResult.ready_for_assessment ? 'Ready for Assessment' : 'Needs Attention'}
              </span>
            </div>
            <div className="text-text-secondary font-mono tabular-nums">
              {validationResult.populated_count}/{validationResult.total_questions} Populated ·{' '}
              {validationResult.unconfirmed_count} Unconfirmed
            </div>
          </div>

          <p className="text-text-secondary leading-relaxed">{validationResult.ai_validation_verdict}</p>

          {validationResult.missing_mandatory_dimensions.length > 0 && (
            <div className="text-amber-400 font-medium">
              Missing mandatory coverage: {validationResult.missing_mandatory_dimensions.join(', ')}
            </div>
          )}
        </div>
      )}

      {/* Evidence Objects Grid */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-16 text-text-secondary space-y-3">
          <RefreshCw className="h-6 w-6 animate-spin text-accent" />
          <span className="text-xs font-mono">Loading 48 Pipeline Evidence Objects...</span>
        </div>
      ) : filteredQuestions.length === 0 ? (
        <div className="p-10 text-center bg-bg-primary border border-border rounded-2xl space-y-2">
          <HelpCircle className="h-7 w-7 mx-auto text-text-secondary/50" />
          <h4 className="text-sm font-semibold text-text-primary">No Matching Evidence Questions</h4>
          <p className="text-xs text-text-secondary">
            Switch the filter to "All" or select another PADF dimension tab.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filteredQuestions.map((q) => {
            const evId = q.evidenceId || q.id;
            const entry = formData[evId] || {
              evidence_statement: '',
              suggested_selection: '',
              source_type: 'ES03_Customer_Meeting_Notes',
              evidence_confidence: 85,
              customer_confirmed: false,
              notes: ''
            };

            const isPopulated = Boolean(entry.evidence_statement?.trim());
            const isTooltipOpen = activeTooltipId === evId;
            const suggestedOptions = getSuggestedOptions(q);
            const swotFactors: string[] = Array.isArray(q.swotMappings)
              ? q.swotMappings.map((m: any) => m.factorId).slice(0, 3)
              : [];

            return (
              <motion.div
                key={evId}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.16 }}
                className={`bg-bg-primary border rounded-2xl p-5 flex flex-col justify-between relative transition-colors ${
                  isTooltipOpen ? 'z-30' : 'z-0'
                } ${
                  isPopulated ? 'border-accent/50' : 'border-border hover:border-border/90'
                }`}
              >
                <div className="space-y-3.5">
                  {/* Question Header */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1.5 flex-1 min-w-0">
                      <div className="flex items-center gap-2 text-[11px] text-text-secondary flex-wrap">
                        <span className="font-mono font-semibold text-text-primary">{evId}</span>
                        <span aria-hidden="true">·</span>
                        <span>{String(q.evidenceCategory || 'EVIDENCE').replace(/_/g, ' ')}</span>
                        {swotFactors.length > 0 && (
                          <>
                            <span aria-hidden="true">·</span>
                            <span className="font-mono text-accent truncate max-w-[190px]" title={swotFactors.join(', ')}>
                              SWOT: {swotFactors.join(', ')}
                            </span>
                          </>
                        )}

                        {/* Guidance Popover Button */}
                        <div className="relative inline-block">
                          <button
                            type="button"
                            onClick={() => setActiveTooltipId(isTooltipOpen ? null : evId)}
                            onMouseEnter={() => setActiveTooltipId(evId)}
                            onMouseLeave={() => setActiveTooltipId(null)}
                            className="p-1 text-text-secondary hover:text-accent transition-colors cursor-help rounded-md hover:bg-bg-surface"
                            aria-label="Inspect KB definition and validation guidance"
                          >
                            <HelpCircle className="h-3.5 w-3.5" />
                          </button>

                          <AnimatePresence>
                            {isTooltipOpen && (
                              <motion.div
                                initial={{ opacity: 0, y: -4, scale: 0.98 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: -4, scale: 0.98 }}
                                className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 w-80 sm:w-96 max-w-[calc(100vw-2rem)] p-4 bg-bg-surface border border-border rounded-xl shadow-2xl z-50 text-xs space-y-2.5 pointer-events-auto"
                              >
                                <div className="flex items-center justify-between border-b border-border/70 pb-2">
                                  <span className="font-semibold text-accent flex items-center gap-1.5">
                                    <Info className="h-3.5 w-3.5" />
                                    {q.evidenceName || evId}
                                  </span>
                                  <span className="font-mono text-[11px] text-text-secondary">{evId}</span>
                                </div>

                                <div>
                                  <div className="text-[11px] font-semibold text-text-primary mb-0.5">Definition</div>
                                  <p className="text-[11px] text-text-secondary leading-relaxed">{q.definition}</p>
                                </div>

                                {q.whyItMatters && (
                                  <div>
                                    <div className="text-[11px] font-semibold text-text-primary flex items-center gap-1 mb-0.5">
                                      <TrendingUp className="h-3 w-3 text-accent" />
                                      Why It Matters
                                    </div>
                                    <p className="text-[11px] text-text-secondary leading-relaxed">{q.whyItMatters}</p>
                                  </div>
                                )}

                                {Array.isArray(q.strongEvidenceIndicators) && q.strongEvidenceIndicators.length > 0 && (
                                  <div>
                                    <div className="text-[11px] font-semibold text-emerald-400 mb-0.5">Strong Indicators</div>
                                    <ul className="list-disc pl-4 text-[11px] text-text-secondary space-y-0.5">
                                      {q.strongEvidenceIndicators.slice(0, 3).map((s: string, i: number) => (
                                        <li key={i}>{s}</li>
                                      ))}
                                    </ul>
                                  </div>
                                )}

                                {Array.isArray(q.weakEvidenceIndicators) && q.weakEvidenceIndicators.length > 0 && (
                                  <div>
                                    <div className="text-[11px] font-semibold text-red-400 mb-0.5">Weak / Risk Indicators</div>
                                    <ul className="list-disc pl-4 text-[11px] text-text-secondary space-y-0.5">
                                      {q.weakEvidenceIndicators.slice(0, 2).map((w: string, i: number) => (
                                        <li key={i}>{w}</li>
                                      ))}
                                    </ul>
                                  </div>
                                )}
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      </div>

                      <h4 className="text-sm font-semibold text-text-primary leading-snug">
                        {q.question || q.evidenceName}
                      </h4>
                      <p className="text-xs text-text-secondary leading-relaxed line-clamp-2">
                        {q.evidenceName && q.question !== q.evidenceName ? `${q.evidenceName}: ${q.definition}` : q.definition}
                      </p>
                    </div>

                    {isPopulated && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-400 shrink-0">
                        <Check className="h-3.5 w-3.5" />
                        Ready
                      </span>
                    )}
                  </div>

                  {/* Evidence Statement Textarea */}
                  <div>
                    <label className="block text-[11px] font-medium text-text-secondary mb-1.5">
                      Verified Evidence Statement
                    </label>
                    <textarea
                      value={entry.evidence_statement}
                      onChange={(e) => handleFieldChange(evId, { evidence_statement: e.target.value })}
                      placeholder="Document verified customer evidence, executive statements, or procurement milestones..."
                      rows={2}
                      className="w-full bg-bg-surface border border-border focus:border-accent focus:outline-none rounded-xl p-3 text-xs leading-relaxed text-text-primary transition-colors placeholder-text-secondary/45 font-sans resize-y"
                    />
                  </div>

                  {/* Suggested Answer Dropdown */}
                  <div>
                    <label className="block text-[11px] font-medium text-text-secondary mb-1.5 flex items-center gap-1.5">
                      <Bot className="h-3.5 w-3.5 text-accent" />
                      <span>Suggested Answer ({industryLabel} · {motionLabel})</span>
                    </label>
                    <div className="relative">
                      <select
                        value={entry.suggested_selection}
                        onChange={(e) => {
                          const val = e.target.value;
                          const matched = suggestedOptions.find((o) => o.text === val);
                          handleFieldChange(evId, {
                            suggested_selection: val,
                            evidence_statement: matched ? matched.text : val || entry.evidence_statement,
                            evidence_confidence: matched ? matched.confidence : entry.evidence_confidence,
                            customer_confirmed: matched ? matched.confirmed : entry.customer_confirmed
                          });
                        }}
                        className="w-full bg-bg-surface border border-border rounded-xl px-3 py-2 text-xs text-text-primary appearance-none focus:outline-none focus:border-accent transition-colors cursor-pointer pr-9 font-sans"
                      >
                        <option value="">Select suggested evidence pattern from Knowledge Base...</option>
                        {suggestedOptions.map((opt, idx) => (
                          <option key={idx} value={opt.text}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-text-secondary pointer-events-none" />
                    </div>
                  </div>

                  {/* Source, Confidence & Customer Confirmed Controls */}
                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 pt-1 items-end">
                    <div className="sm:col-span-6">
                      <label className="block text-[11px] font-medium text-text-secondary mb-1">
                        Evidence Source
                      </label>
                      <select
                        value={entry.source_type}
                        onChange={(e) => handleFieldChange(evId, { source_type: e.target.value })}
                        className="w-full bg-bg-surface border border-border focus:border-accent focus:outline-none rounded-xl px-2.5 py-2 text-xs text-text-primary font-sans cursor-pointer"
                      >
                        {evidenceSources.map((src) => (
                          <option key={src.sourceId} value={`${src.sourceId}_${src.sourceName.replace(/\s+/g, '_')}`}>
                            {src.sourceId} · {src.sourceName}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="sm:col-span-3">
                      <label className="block text-[11px] font-medium text-text-secondary mb-1">
                        Confidence ({entry.evidence_confidence}%)
                      </label>
                      <select
                        value={entry.evidence_confidence}
                        onChange={(e) => handleFieldChange(evId, { evidence_confidence: Number(e.target.value) })}
                        className="w-full bg-bg-surface border border-border focus:border-accent focus:outline-none rounded-xl px-2.5 py-2 text-xs font-mono tabular-nums text-text-primary cursor-pointer"
                      >
                        <option value={95}>95% High</option>
                        <option value={85}>85% Strong</option>
                        <option value={70}>70% Moderate</option>
                        <option value={50}>50% Low</option>
                        <option value={30}>30% Gap</option>
                      </select>
                    </div>

                    <div className="sm:col-span-3 flex items-center h-[34px]">
                      <label className="inline-flex items-center gap-2 text-xs text-text-primary cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={entry.customer_confirmed}
                          onChange={(e) => handleFieldChange(evId, { customer_confirmed: e.target.checked })}
                          className="h-4 w-4 rounded border-border accent-accent cursor-pointer"
                        />
                        <span className="truncate">Confirmed</span>
                      </label>
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Action Footer */}
      <div className="mt-6 border border-border rounded-2xl p-4 sm:p-5 bg-bg-primary flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="text-xs text-text-secondary">
          {progressStats.completedQuestions === 0 ? (
            <span>Select suggested answers or enter verified findings across PADF dimensions to begin.</span>
          ) : (
            <span>
              <strong className="text-text-primary font-mono tabular-nums">
                {progressStats.completedQuestions} of {progressStats.totalQuestions || 48}
              </strong>{' '}
              evidence objects populated across 8 PADF dimensions.
            </span>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <button
            type="button"
            onClick={() => handleSaveEvidence(true)}
            disabled={saving || validating || runningAssessment}
            className="flex-1 sm:flex-none px-4 py-2.5 bg-bg-surface hover:bg-bg-surface/80 text-text-primary border border-border font-semibold text-xs rounded-xl transition-colors flex items-center justify-center gap-2 whitespace-nowrap cursor-pointer disabled:opacity-50"
          >
            {saving ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
            <span>{saving ? 'Saving...' : 'Save Evidence'}</span>
          </button>

          <button
            type="button"
            onClick={handleValidateAnswers}
            disabled={saving || validating || runningAssessment}
            className="flex-1 sm:flex-none px-4 py-2.5 bg-accent/15 hover:bg-accent/25 text-accent border border-accent/35 font-semibold text-xs rounded-xl transition-colors flex items-center justify-center gap-2 whitespace-nowrap cursor-pointer disabled:opacity-50"
          >
            {validating ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <ShieldCheck className="h-3.5 w-3.5" />}
            <span>{validating ? 'Validating...' : 'Validate Answers'}</span>
          </button>

          <button
            type="button"
            onClick={handleRunAssessment}
            disabled={saving || validating || runningAssessment}
            className="flex-1 sm:flex-none px-5 py-2.5 bg-accent hover:bg-accent-hover text-black font-bold text-xs rounded-xl transition-colors flex items-center justify-center gap-2 whitespace-nowrap cursor-pointer disabled:opacity-50"
          >
            {runningAssessment ? (
              <RefreshCw className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Bot className="h-4 w-4" />
            )}
            <span>{runningAssessment ? 'Running Assessment...' : 'Run Assessment'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default PipelineAssessmentForm;
