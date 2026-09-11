import React, { useState, useMemo, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { HelpCircle, CheckCircle2, ChevronDown, Check, Save, Zap, AlertCircle, Bot, Sparkles, Loader2 } from 'lucide-react';
import UREKB_Config from '../../../../config/SQL_evidence_knowledge_base.json';
import sqlRulesJson from '../../../../config/SQL_qualification_rules.json';
import sqlConfigJson from '../../../../config/SQL_industry_configuration_JSON.json';
import { SQLDataService } from '../services/sqlDataService';

const SQL_RULES = (sqlRulesJson as any).SQL_Qualification_Rules;
const SQL_CONFIG = sqlConfigJson as any;

export const ensureUICompatibleResult = (rawResult: any, motionData: any): any => {
  if (!rawResult) return null;

  // Clone to avoid mutation
  const result = JSON.parse(JSON.stringify(rawResult));

  // Initialize arrays if missing
  if (!result.evidence_assessments) result.evidence_assessments = [];
  if (!result.dimension_assessments) result.dimension_assessments = [];
  if (!result.risk_analysis) result.risk_analysis = [];
  if (!result.recommendations) result.recommendations = [];

  // Create a mapping of evidence_object_id to its metadata from motionData
  const evidenceMeta: Record<string, { name: string; dimension: string }> = {};
  if (motionData) {
    Object.entries(motionData).forEach(([dimName, dimEv]: [string, any]) => {
      const evs = Array.isArray(dimEv) ? dimEv : dimEv?.evidence_objects || [];
      if (Array.isArray(evs)) {
        evs.forEach((eo: any) => {
          evidenceMeta[eo.evidence_id] = {
            name: eo.evidence_name || eo.question,
            dimension: dimName
          };
        });
      }
    });
  }

  // Map each evidence assessment to match UI requirements and ensure ALL defined questions are included
  const assessmentMap = new Map();
  if (Array.isArray(result.evidence_assessments)) {
    result.evidence_assessments.forEach((ea: any) => {
      if (ea && ea.evidence_object_id) {
        assessmentMap.set(ea.evidence_object_id, ea);
      }
    });
  }

  const completeEvidenceAssessments: any[] = [];
  if (motionData) {
    Object.entries(motionData).forEach(([dimName, dimEv]: [string, any]) => {
      const evs = Array.isArray(dimEv) ? dimEv : dimEv?.evidence_objects || [];
      if (Array.isArray(evs)) {
        evs.forEach((eo: any) => {
          const ea = assessmentMap.get(eo.evidence_id);
          
          const signalScore = ea && typeof ea.signal_score === 'number' 
            ? ea.signal_score 
            : 0;

          const matchType = ea?.matched_type || 'neutral';

          const tags = ea?.tags || [
            { label: dimName, type: 'dimension' },
            { label: matchType === 'positive' ? 'POSITIVE MATCH' : matchType === 'negative' ? 'NEGATIVE MATCH' : 'NEUTRAL MATCH', type: matchType }
          ];

          // Strictly use Gemini's authentic reasoning context from the Edge Function without frontend modification or synthetic template replacement
          const identificationAssessment = ea?.identification_assessment || "";

          completeEvidenceAssessments.push({
            evidence_object_id: eo.evidence_id,
            evidence_name: ea?.evidence_name || eo.evidence_name || eo.question,
            tags: tags,
            identification_assessment: identificationAssessment,
            signal_score: signalScore
          });
        });
      }
    });
  }

  result.evidence_assessments = completeEvidenceAssessments;

  // Ensure dimension assessments have correct fields
  result.dimension_assessments = result.dimension_assessments.map((da: any) => {
    return {
      dimension_code: da.dimension_code,
      dimension_name: da.dimension_name,
      score: typeof da.score === 'number' ? da.score : 70,
      confidence: typeof da.confidence === 'number' ? da.confidence : 80,
      assessment_summary: da.assessment_summary || 'Analysis complete.',
      strengths: Array.isArray(da.strengths) ? da.strengths : [],
      weaknesses: Array.isArray(da.weaknesses) ? da.weaknesses : [],
      risks: Array.isArray(da.risks) ? da.risks : []
    };
  });

  // Ensure risk_analysis matches array structure
  result.risk_analysis = result.risk_analysis.map((ra: any) => {
    if (Array.isArray(ra.risks)) {
      return ra;
    }
    return {
      category: ra.category || 'General Risk',
      risks: [ra.risk_description || ra.description || 'General risk identified.']
    };
  });

  // Ensure recommendations map correctly
  result.recommendations = result.recommendations.map((rec: any) => {
    return {
      priority: rec.priority || 'Medium',
      action: rec.action || rec.recommendation || 'Further validation.',
      related_dimension: rec.related_dimension || rec.dimension_code || 'General',
      expected_impact: rec.expected_impact || rec.expected_business_impact || 'Lower qualification friction.',
      status: rec.status || 'Pending'
    };
  });

  if (!result.explainability) {
    result.explainability = {
      decision_summary: result.qualification_summary?.summary || 'Analysis complete.'
    };
  } else if (!result.explainability.decision_summary) {
    result.explainability.decision_summary = result.explainability.decision_reasoning || result.qualification_summary?.summary || 'Analysis complete.';
  }

  return result;
};

interface SQLDynamicEvidenceFormProps {
  industry?: string;
  revenueMotion?: string;
  opportunityId?: string;
  onQualificationComplete?: (data: any) => void;
}

export const SQLDynamicEvidenceForm: React.FC<SQLDynamicEvidenceFormProps> = ({
  industry = "SaaS / Software",
  revenueMotion = "Digital Solution Selling",
  opportunityId,
  onQualificationComplete
}) => {
  const library = UREKB_Config.UREKB_SQL.revenue_motion_library;
  const motionData = library[revenueMotion as keyof typeof library];
  
  const dimensions = useMemo(() => {
    return motionData ? Object.keys(motionData) : [];
  }, [motionData]);

  const [activeDimension, setActiveDimension] = useState<string>(dimensions[0] || "");
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [isQualifying, setIsQualifying] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);
  const tabsContainerRef = useRef<HTMLDivElement>(null);

  const handleTabClick = (e: React.MouseEvent<HTMLButtonElement>, dim: string) => {
    setActiveDimension(dim);
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

  // Load existing evidence if we have an assessment
  useEffect(() => {
    const loadExistingEvidence = async () => {
      if (!opportunityId) return;
      try {
        const assessment = await SQLDataService.getAssessmentByOpportunity(opportunityId);
        if (assessment) {
          const evidenceRecords = await SQLDataService.getEvidenceRecords(assessment.id);
          const initialData: Record<string, any> = {};
          evidenceRecords.forEach(record => {
            try {
              initialData[record.evidence_object_id] = JSON.parse(record.evidence_content);
            } catch (e) {
              console.error("Failed to parse evidence content", e);
            }
          });
          setFormData(initialData);
        }
      } catch (err) {
        console.error("Failed to load evidence:", err);
      }
    };
    loadExistingEvidence();
  }, [opportunityId, motionData]);

  if (!motionData) {
    return <div className="p-8 text-text-primary">Configuration not found for the selected revenue motion.</div>;
  }

  const currentEvidences = motionData[activeDimension as keyof typeof motionData] || [];

  const getOptionsForEvidence = (evidence: any) => {
    if (!evidence) return [];
    
    const options: Array<{ tier: string; label: string; text: string }> = [];
    
    const positiveSignals = evidence.positive_signals || [];
    const negativeSignals = evidence.negative_signals || [];
    
    positiveSignals.forEach((sig: string) => {
      options.push({
        tier: 'positive',
        label: `[Positive Match] ${sig}`,
        text: sig
      });
    });
    
    negativeSignals.forEach((sig: string) => {
      options.push({
        tier: 'negative',
        label: `[Negative/Adverse] ${sig}`,
        text: sig
      });
    });

    options.push({
      tier: 'neutral',
      label: '[Neutral] Information not yet fully verified or unknown.',
      text: 'Information not yet fully verified or unknown.'
    });

    return options;
  };

  const handleInputChange = (id: string, field: string, value: string, updates?: Record<string, string>) => {
    setFormData(prev => {
      const currentObj = prev[id] || {};
      const newObj = { ...currentObj, [field]: value };
      if (updates) {
        Object.entries(updates).forEach(([k, v]) => {
          newObj[k] = v;
        });
      }
      const updatedFormData = {
        ...prev,
        [id]: newObj
      };

      return updatedFormData;
    });
  };

  const getDimensionProgress = (dim: string) => {
    const evs = motionData[dim as keyof typeof motionData] || [];
    const required = evs.filter((e: any) => e.required);
    const completed = required.filter((e: any) => formData[e.evidence_id]?.response);
    return {
      completed: completed.length,
      total: required.length,
      isComplete: completed.length === required.length && required.length > 0
    };
  };

  const { isFormValid, missingDimensions } = useMemo(() => {
    let isValid = true;
    const missing: string[] = [];

    if (motionData) {
      Object.keys(motionData).forEach(dim => {
        const evs = motionData[dim as keyof typeof motionData] || [];
        const requiredEvs = evs.filter((e: any) => e.required);
        const isDimValid = requiredEvs.every((e: any) => !!formData[e.evidence_id]?.response);
        
        if (!isDimValid) {
          isValid = false;
          missing.push(dim);
        }
      });
    }

    return { isFormValid: isValid, missingDimensions: missing };
  }, [formData, motionData]);

  const validateForm = () => {
    if (!isFormValid) {
      setValidationError(`Please complete all REQUIRED fields in: ${missingDimensions.join(', ')}`);
    } else {
      setValidationError(null);
    }
    return isFormValid;
  };

  const handleSaveDraft = async () => {
    if (!opportunityId) {
      setSaveError("Cannot save: No opportunity context found.");
      return;
    }
    
    setIsSaving(true);
    setSaveError(null);
    setSaveSuccess(false);

    try {
      // Get or create assessment
      let assessment = await SQLDataService.getAssessmentByOpportunity(opportunityId);
      if (!assessment) {
        assessment = (await SQLDataService.createAssessment(opportunityId)) as any;
      }

      if (!assessment) throw new Error("Could not initialize assessment record");

      const evidenceArray: any[] = [];
      Object.keys(motionData).forEach(dim => {
        const evs = motionData[dim as keyof typeof motionData] || [];
        evs.forEach((ev: any) => {
          if (formData[ev.evidence_id] && formData[ev.evidence_id].response) {
            evidenceArray.push({
              dimension_code: dim,
              evidence_object_id: ev.evidence_id,
              evidence_content: JSON.stringify(formData[ev.evidence_id]),
              evidence_source: 'Discovery Findings',
              validation_status: 'collected'
            });
          }
        });
      });

      await SQLDataService.submitEvidence(assessment.id, evidenceArray);

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err: any) {
      console.error(err);
      setSaveError(err.message || "Failed to save evidence.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleRunQualification = async () => {
    const isValid = validateForm();
    if (!isValid) return;

    setIsQualifying(true);
    setValidationError(null);

    try {
      // 1. Get or create assessment
      let assessment = await SQLDataService.getAssessmentByOpportunity(opportunityId);
      if (!assessment && opportunityId) {
        const created = await SQLDataService.createAssessment(opportunityId);
        assessment = { id: created.assessment_id } as any;
      }

      if (!assessment) throw new Error("Could not initialize assessment record");

      // 2. Submit evidence first
      const evidenceArray: any[] = [];
      Object.keys(motionData).forEach(dim => {
        const evs = motionData[dim as keyof typeof motionData] || [];
        evs.forEach((ev: any) => {
          if (formData[ev.evidence_id] && formData[ev.evidence_id].response) {
            evidenceArray.push({
              dimension_code: dim,
              evidence_object_id: ev.evidence_id,
              evidence_content: JSON.stringify(formData[ev.evidence_id]),
              evidence_source: 'Discovery Findings',
              validation_status: 'collected'
            });
          }
        });
      });

      await SQLDataService.submitEvidence(assessment.id, evidenceArray);

      // 3. Assemble contexts
      const idSearch = industry.toLowerCase().replace(/[^a-z0-9]+/g, '_');
      const contexts = {
        industry_context: SQL_CONFIG.industries?.find((ind: any) => ind.id === idSearch || ind.id?.replace(/_/g, ' ') === industry.toLowerCase()) || {},
        evidence_context: UREKB_Config.UREKB_SQL.revenue_motion_library?.[revenueMotion] || {},
        qualification_policy: SQL_RULES || {}
      };

      // 4. Run Edge Function reasoning
      const response = await SQLDataService.executeReasoning(assessment.id, contexts);
      
      // 5. Ensure it is compatible and complete
      const uiResult = ensureUICompatibleResult(response.result, motionData);
      
      if (onQualificationComplete) {
        onQualificationComplete(uiResult);
      }
    } catch (err: any) {
      console.error("Edge Function qualification failed:", err);
      setValidationError(`AI reasoning engine failed: ${err.message || "Failed to execute reasoning in Edge Function"}. Please retry or check database connection.`);
    } finally {
      setIsQualifying(false);
    }
  };

  return (
    <div className="w-full bg-bg-surface rounded-2xl p-6 sm:p-8 font-sans border border-border/40 mt-8 shadow-xl">
      <div className="mb-8">
        <span className="text-[10px] font-mono text-text-secondary/60 uppercase tracking-widest block mb-1">
          Unified Diagnostic Suite
        </span>
        <h2 className="text-2xl font-black text-text-primary uppercase tracking-tight">
          SQL Qualification Form
        </h2>
        <p className="text-sm text-text-secondary mt-1">
          Populate evidence points retrieved matching <span className="font-bold text-text-primary">{industry}</span> configurations under <span className="font-bold text-text-primary">{revenueMotion}</span> motion.
        </p>
      </div>

      {/* Tabs */}
      <div 
        ref={tabsContainerRef}
        className="flex overflow-x-auto border-b border-border/40 mb-8 pb-2 gap-2 [&::-webkit-scrollbar]:h-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-border/50 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-border/80"
      >
        {dimensions.map(dim => {
          const { completed, total, isComplete } = getDimensionProgress(dim);
          const isActive = activeDimension === dim;
          return (
            <button
              key={dim}
              onClick={(e) => handleTabClick(e, dim)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-t-lg font-bold text-xs uppercase tracking-wide transition-all whitespace-nowrap ${
                isActive 
                  ? 'bg-bg-surface text-accent border-b-2 border-accent' 
                  : 'text-text-secondary hover:text-text-primary hover:bg-bg-surface/50'
              }`}
            >
              <CheckCircle2 className={`h-4 w-4 ${isComplete ? 'text-green-500' : 'text-text-secondary/40'}`} />
              {dim}
              <span className={`px-1.5 py-0.5 rounded text-[9px] font-mono ml-1 ${
                isActive ? 'bg-accent/15 text-accent' : 'bg-bg-primary text-text-secondary'
              }`}>
                {completed}/{total}
              </span>
            </button>
          );
        })}
      </div>

      {/* Content */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-black text-text-primary uppercase tracking-wider flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-accent block"></span>
            {activeDimension} EVIDENCE
          </h3>
          <p className="text-xs text-text-secondary mt-1 ml-3.5">
            Validation of {activeDimension.toLowerCase()} parameters aligned with standard ICP requirements.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {currentEvidences.map((evidence: any) => {
          const isPopulated = !!formData[evidence.evidence_id]?.response;
          const industryGuidance = evidence.industry_variations && evidence.industry_variations[industry];

          return (
            <motion.div 
              key={evidence.evidence_id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`bg-bg-primary border rounded-xl p-5 transition-all duration-300 ${
                isPopulated ? 'border-accent/50 shadow-[0_0_15px_rgba(0,0,0,0.1)] shadow-accent/10' : 'border-border/50 shadow-sm'
              }`}
            >
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-2 flex-wrap">
                  <h4 className="text-xs font-black text-text-primary uppercase tracking-wider">
                    {evidence.evidence_name}
                  </h4>
                  <div className="group relative">
                    <HelpCircle className="h-3.5 w-3.5 text-text-secondary/50 cursor-help" />
                    <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 w-64 p-3 bg-bg-primary border border-border rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10 text-xs font-normal normal-case">
                      <div className="space-y-2">
                        <p><strong className="text-text-primary block mb-0.5">Definition:</strong> <span className="text-text-secondary">{evidence.question}</span></p>
                        <p><strong className="text-text-primary block mb-0.5">Why it matters:</strong> <span className="text-text-secondary">{evidence.qualification_impact?.impact}</span></p>
                        <p><strong className="text-accent block mb-0.5">AI Guidance:</strong> <span className="text-text-secondary">{evidence.gemini_interpretation?.evaluation_logic} {industryGuidance}</span></p>
                      </div>
                    </div>
                  </div>
                  {evidence.required && (
                    <span className="text-[8px] font-mono font-bold tracking-wider px-1.5 py-0.5 rounded border border-text-secondary/20 text-text-secondary">
                      REQUIRED
                    </span>
                  )}
                  {evidence.qualification_impact?.weight === 'Critical' && (
                    <span className="text-[8px] font-mono font-bold tracking-wider px-1.5 py-0.5 rounded bg-red-500/10 border border-red-500/20 text-red-500">
                      CRITICAL
                    </span>
                  )}
                </div>
                {isPopulated && (
                  <span className="flex items-center gap-1 text-[9px] font-mono font-bold uppercase tracking-wider text-green-500 bg-green-500/10 px-2 py-0.5 rounded-full border border-green-500/20">
                    POPULATED
                  </span>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-[9px] font-mono uppercase tracking-widest text-text-secondary mb-1.5">
                    Answer / Response Text
                  </label>
                  <input
                    type="text"
                    value={formData[evidence.evidence_id]?.response || ''}
                    onChange={(e) => handleInputChange(evidence.evidence_id, 'response', e.target.value)}
                    placeholder="Enter evidence details..."
                    className="w-full bg-bg-surface/50 border border-border/60 rounded-lg px-3 py-2.5 text-xs text-text-primary placeholder-text-secondary/30 focus:outline-none focus:border-accent transition-colors"
                  />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-[9px] font-mono uppercase tracking-widest text-text-secondary">
                      Suggested Answers
                    </label>
                  </div>
                  <div className="relative">
                    <select
                      value={formData[evidence.evidence_id]?.suggested || ''}
                      onChange={(e) => {
                        const val = e.target.value;
                        const opts = getOptionsForEvidence(evidence);
                        const selectedOption = opts.find((o: any) => o.text === val || o.label === val);
                        const textVal = selectedOption?.text || val;
                        handleInputChange(evidence.evidence_id, 'suggested', val, { response: textVal });
                      }}
                      className="w-full bg-bg-surface/50 border border-border/60 rounded-lg px-3 py-2.5 text-xs text-text-primary appearance-none focus:outline-none focus:border-accent transition-colors cursor-pointer"
                    >
                      <option value="">
                        Select static evidence response...
                      </option>
                      {getOptionsForEvidence(evidence).map((opt: any, idx: number) => (
                        <option key={idx} value={opt.text}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-text-secondary pointer-events-none" />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-[9px] font-mono uppercase tracking-widest text-text-secondary mb-1.5">
                  Internal Contextual Notes (Optional)
                </label>
                <textarea
                  value={formData[evidence.evidence_id]?.notes || ''}
                  onChange={(e) => handleInputChange(evidence.evidence_id, 'notes', e.target.value)}
                  placeholder="Add any internal evidence details, source, or reference notes..."
                  rows={2}
                  className="w-full bg-bg-surface/50 border border-border/60 rounded-lg px-3 py-2 text-xs text-text-primary placeholder-text-secondary/30 focus:outline-none focus:border-accent transition-colors resize-none"
                />
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Validation Suite & Form Action Buttons */}
      <div className="mt-8 border border-border/50 rounded-xl p-5 bg-bg-primary flex flex-col md:flex-row md:items-center justify-between gap-4">
        
        {/* Left Side: Validation Status */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-3.5 h-3.5 text-accent" />
            <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-text-secondary">Validation Suite</span>
          </div>
          
          <div className="mt-1">
            {saveSuccess ? (
              <div className="flex items-center gap-2 text-green-500">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span className="text-sm font-bold">Evidence Saved Successfully</span>
              </div>
            ) : saveError ? (
              <div className="flex items-center gap-2 text-red-500">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span className="text-sm font-bold">Failed to Save Evidence: {saveError}</span>
              </div>
            ) : validationError ? (
              <div className="flex items-start gap-2 text-red-500">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span className="text-sm font-bold">Validation Error: <span className="font-normal">{validationError}</span></span>
              </div>
            ) : isFormValid ? (
              <div className="flex items-center gap-2 text-green-500">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span className="text-sm font-bold">Validation Passed: Evidence profile is complete and consistent.</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-red-500">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span className="text-sm font-bold">Validation Incomplete: Please fill all required fields.</span>
              </div>
            )}
          </div>
        </div>

        {/* Right Side: Action Buttons */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={handleSaveDraft}
            disabled={isSaving}
            className="px-6 py-2.5 bg-accent hover:bg-accent/90 text-white font-black uppercase text-xs rounded-xl transition-all shadow-md shadow-accent/20 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSaving ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            <span>{isSaving ? 'Saving...' : 'Save Draft'}</span>
          </button>
          
          <button
            type="button"
            onClick={handleRunQualification}
            disabled={isQualifying}
            className="px-6 py-2.5 bg-accent hover:bg-accent/90 text-white font-black uppercase text-xs rounded-xl transition-all shadow-md shadow-accent/20 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isQualifying ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <Bot className="h-4 w-4" />
            )}
            <span>{isQualifying ? 'Analyzing...' : 'Run Qualification'}</span>
          </button>
        </div>
      </div>

    </div>
  );
};
