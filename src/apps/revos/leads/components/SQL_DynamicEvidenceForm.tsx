import React, { useState, useMemo, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { HelpCircle, CheckCircle2, ChevronDown, Check, Save, Zap, AlertCircle, Bot } from 'lucide-react';
import UREKB_Config from '../../../../config/SQL_evidence_knowledge_base.json';
import { SQLDataService } from '../services/sqlDataService';

interface SQLDynamicEvidenceFormProps {
  industry?: string;
  revenueMotion?: string;
  opportunityId?: string;
}

export const SQLDynamicEvidenceForm: React.FC<SQLDynamicEvidenceFormProps> = ({
  industry = "SaaS / Software",
  revenueMotion = "Digital Solution Selling",
  opportunityId
}) => {
  const library = UREKB_Config.UREKB_SQL.revenue_motion_library;
  const motionData = library[revenueMotion as keyof typeof library];
  
  const dimensions = useMemo(() => {
    return motionData ? Object.keys(motionData) : [];
  }, [motionData]);

  const [activeDimension, setActiveDimension] = useState<string>(dimensions[0] || "");
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [isSaving, setIsSaving] = useState(false);
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
  }, [opportunityId]);

  if (!motionData) {
    return <div className="p-8 text-text-primary">Configuration not found for the selected revenue motion.</div>;
  }

  const currentEvidences = motionData[activeDimension as keyof typeof motionData] || [];

  const handleInputChange = (id: string, field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [id]: {
        ...prev[id],
        [field]: value
      }
    }));
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
              evidence_source: 'Manual Input',
              validation_status: 'unverified'
            });
          }
        });
      });

      await SQLDataService.submitEvidence(assessment.id || assessment.assessment_id, evidenceArray);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err: any) {
      console.error(err);
      setSaveError(err.message || "Failed to save evidence.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleRunQualification = () => {
    const isValid = validateForm();
    if (isValid) {
      // Placeholder for next step
      console.log("Form is valid, running qualification...");
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
      <div className="mb-6">
        <h3 className="text-sm font-black text-text-primary uppercase tracking-wider flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-accent block"></span>
          {activeDimension} EVIDENCE
        </h3>
        <p className="text-xs text-text-secondary mt-1 ml-3.5">
          Validation of {activeDimension.toLowerCase()} parameters aligned with standard ICP requirements.
        </p>
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
                {evidence.accepted_values && evidence.accepted_values.length > 0 && (
                  <div>
                    <label className="block text-[9px] font-mono uppercase tracking-widest text-text-secondary mb-1.5">
                      Suggested Answers
                    </label>
                    <div className="relative">
                      <select
                        value={formData[evidence.evidence_id]?.suggested || ''}
                        onChange={(e) => {
                          handleInputChange(evidence.evidence_id, 'suggested', e.target.value);
                          if (e.target.value && !formData[evidence.evidence_id]?.response) {
                             handleInputChange(evidence.evidence_id, 'response', e.target.value);
                          }
                        }}
                        className="w-full bg-bg-surface/50 border border-border/60 rounded-lg px-3 py-2.5 text-xs text-text-primary appearance-none focus:outline-none focus:border-accent transition-colors cursor-pointer"
                      >
                        <option value="">Select response...</option>
                        {evidence.accepted_values.map((val: string) => (
                          <option key={val} value={val}>{val}</option>
                        ))}
                      </select>
                      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-text-secondary pointer-events-none" />
                    </div>
                  </div>
                )}
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
            className="px-6 py-2.5 bg-accent hover:bg-accent/90 text-white font-black uppercase text-xs rounded-xl transition-all shadow-md shadow-accent/20 flex items-center gap-2"
          >
            <Bot className="h-4 w-4" />
            <span>Run Qualification</span>
          </button>
        </div>
      </div>

    </div>
  );
};
