import React, { useState, useEffect, useRef } from 'react';
import { MQLConfigService } from '../services/mqlConfigLoader';
import { MQLLead, MQLCampaign, MQLEvidenceAssessment } from '../../types/mql';
import { Save, Bot, AlertTriangle, CheckCircle, Info, Sparkles, AlertCircle, HelpCircle } from 'lucide-react';

interface LeadQualificationFormProps {
  campaign: MQLCampaign;
  lead: MQLLead;
  initialData?: MQLEvidenceAssessment[];
  onChange?: (data: any[]) => void;
  onSave?: () => Promise<void>;
  onRun?: () => Promise<void>;
  loading?: boolean;
}


interface EvidenceCardProps {
  item: any;
  state: any;
  quickOptions: string[];
  handleFieldChange: (evidenceId: string, field: string, value: any) => void;
}

const EvidenceCard: React.FC<EvidenceCardProps> = ({
  item,
  state,
  quickOptions,
  handleFieldChange,
}) => {
  const [showTooltip, setShowTooltip] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const isCritical = item.priority === 'Critical' || item.definition?.evidenceStrength === 'Critical';
  const isRequired = item.required;

  useEffect(() => {
    if (!showTooltip) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setShowTooltip(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showTooltip]);

  return (
    <div
      className={`p-4 rounded-xl border relative transition-all duration-200 hover:border-border/100 ${
        state.is_present 
          ? 'bg-bg-surface border-accent/30 shadow-sm' 
          : 'bg-bg-surface/50 border-border'
      }`}
    >
      {/* Question Info Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start gap-2 mb-3">
        <div 
          className="relative"
          ref={containerRef}
          onMouseEnter={() => setShowTooltip(true)}
          onMouseLeave={() => setShowTooltip(false)}
        >
          <div className="flex flex-wrap items-center gap-1.5">
            <div 
              className="flex items-center gap-1.5 cursor-help select-none group"
              onClick={() => setShowTooltip(!showTooltip)}
            >
              <span className="text-xs font-black text-text-primary uppercase tracking-wide group-hover:text-accent transition-colors">
                {item.definition?.evidenceName || item.evidenceId}
              </span>
              <HelpCircle className="w-3.5 h-3.5 text-text-secondary group-hover:text-accent transition-colors shrink-0" />
            </div>

            {isRequired && (
              <span className="px-1.5 py-0.5 rounded text-[8px] font-mono uppercase bg-bg-primary border border-border text-text-secondary">
                Required
              </span>
            )}
            {isCritical && (
              <span className="px-1.5 py-0.5 rounded text-[8px] font-mono uppercase bg-red-500/10 text-red-500 border border-red-500/20 font-black">
                Critical
              </span>
            )}
          </div>

          {/* Interactive Tooltip popup */}
          {showTooltip && (
            <div className="absolute bottom-full left-0 mb-2 z-50 w-72 max-w-[calc(100vw-3rem)] p-3.5 bg-bg-surface border border-border rounded-xl shadow-xl animate-in fade-in slide-in-from-bottom-1 duration-150 text-left">
              {/* Tooltip Arrow */}
              <div className="absolute top-full left-4 -mt-1 border-4 border-transparent border-t-border" />
              <div className="absolute top-full left-4 -mt-[3px] border-4 border-transparent border-t-bg-surface" />
              
              <div className="space-y-3">
                <div>
                  <span className="text-[9px] font-mono font-bold text-accent uppercase tracking-widest block mb-1">
                    Definition &amp; Purpose
                  </span>
                  <p className="text-xs text-text-primary leading-normal font-sans font-medium">
                    {item.definition?.definition || "No definition available."}
                  </p>
                </div>
                
                {item.definition?.interpretationGuidance && (
                  <div className="pt-2.5 border-t border-border/50">
                    <span className="text-[9px] font-mono font-bold text-accent uppercase tracking-widest block mb-1">
                      Interpretation Guidance
                    </span>
                    <p className="text-xs text-text-secondary leading-normal font-sans font-medium">
                      {item.definition.interpretationGuidance}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Answer Status Badge */}
        <div className="flex items-center gap-2 shrink-0 self-end sm:self-start">
          <span className={`px-2 py-0.5 rounded-full text-[9px] font-mono font-bold uppercase tracking-wider border ${
            state.is_present 
              ? 'bg-green-500/10 text-green-500 border-green-500/20' 
              : 'bg-bg-primary text-text-secondary border-border'
          }`}>
            {state.is_present ? 'Populated' : 'Pending'}
          </span>
        </div>
      </div>

      {/* Input Elements always visible */}
      <div className="space-y-3 pt-1">
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="flex-1">
            <label className="block text-[9px] font-mono font-bold uppercase tracking-wider text-text-secondary mb-1">
              Answer / Response Text
            </label>
            <input
              type="text"
              value={state.evidence_value || ''}
              onChange={(e) => handleFieldChange(item.evidenceId, 'evidence_value', e.target.value)}
              placeholder="Type custom answer or select suggestion..."
              className="w-full px-3 py-2 text-xs rounded-lg border border-border bg-bg-primary text-text-primary focus:outline-none focus:border-accent/40 transition-all font-sans"
            />
          </div>
          <div className="w-full sm:w-56">
            <label className="block text-[9px] font-mono font-bold uppercase tracking-wider text-text-secondary mb-1">
              Suggested Answers
            </label>
            <select
              value={quickOptions.includes(state.evidence_value || '') ? (state.evidence_value || '') : 'Select response...'}
              onChange={(e) => {
                handleFieldChange(item.evidenceId, 'evidence_value', e.target.value);
              }}
              className="w-full px-2 py-2 text-xs rounded-lg border border-border bg-bg-primary text-text-secondary focus:outline-none cursor-pointer font-sans"
            >
              {quickOptions.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </div>
        </div>
        
        <div>
          <label className="block text-[9px] font-mono font-bold uppercase tracking-wider text-text-secondary mb-1">
            Internal Contextual Notes (Optional)
          </label>
          <input
            type="text"
            value={state.notes || ''}
            onChange={(e) => handleFieldChange(item.evidenceId, 'notes', e.target.value)}
            placeholder="Add any internal evidence details, source, or reference notes..."
            className="w-full px-3 py-1.5 text-[11px] rounded-lg border border-border/55 bg-bg-primary text-text-primary focus:outline-none placeholder-text-secondary/40 font-sans"
          />
        </div>
      </div>
    </div>
  );
};

export const LeadQualificationForm: React.FC<LeadQualificationFormProps> = ({
  campaign,
  lead,
  initialData = [],
  onChange,
  onSave,
  onRun,
  loading = false,
}) => {
  const [config, setConfig] = useState<any>(null);
  const [formData, setFormData] = useState<Record<string, Partial<MQLEvidenceAssessment>>>({});
  const [validationMessages, setValidationMessages] = useState<Array<{ type: 'error' | 'warning' | 'success'; text: string }>>([]);

  useEffect(() => {
    try {
      if (!campaign.industry) return;
      const combined = MQLConfigService.getCombinedEvidenceConfig(campaign.industry);
      setConfig(combined);

      const initial: Record<string, Partial<MQLEvidenceAssessment>> = {};
      ['fit', 'intent', 'engagement', 'timing'].forEach((dim) => {
        const items = combined.evidence[dim] || [];
        items.forEach((item: any) => {
          const existing = initialData.find((d) => d.evidence_id === item.evidenceId);
          initial[item.evidenceId] = existing || {
            evidence_id: item.evidenceId,
            dimension: dim as any,
            is_present: false,
            evidence_value: '',
            notes: '',
          };
        });
      });
      setFormData(initial);
    } catch (err) {
      console.error('Failed to load campaign evidence config:', err);
    }
  }, [campaign.industry, initialData]);

  const handleFieldChange = (evidenceId: string, field: string, value: any) => {
    let nextValue = value;
    let nextIsPresent = formData[evidenceId]?.is_present ?? false;

    if (field === 'evidence_value') {
      nextValue = value;
      if (
        nextValue && 
        nextValue !== 'Select response...' && 
        nextValue !== 'Not Specified / Unknown' && 
        nextValue.trim() !== ''
      ) {
        nextIsPresent = true;
      } else {
        nextIsPresent = false;
        if (nextValue === 'Select response...' || nextValue === 'Not Specified / Unknown') {
          nextValue = '';
        }
      }
    }

    const updatedItem = {
      ...formData[evidenceId],
      [field]: nextValue,
      is_present: nextIsPresent,
    };

    const nextState = {
      ...formData,
      [evidenceId]: updatedItem,
    };

    setFormData(nextState);
    if (onChange) {
      onChange(Object.values(nextState));
    }
  };

  // Perform Real-Time validation
  useEffect(() => {
    if (!config) return;
    const errors: Array<{ type: 'error' | 'warning' | 'success'; text: string }> = [];

    // Check all configured items
    const allItems: any[] = [];
    ['fit', 'intent', 'engagement', 'timing'].forEach((dim) => {
      if (config.evidence[dim]) {
        allItems.push(...config.evidence[dim]);
      }
    });

    let missingCriticalCount = 0;
    let missingRequiredCount = 0;
    let incompleteObservedCount = 0;

    allItems.forEach((item) => {
      const state = formData[item.evidenceId];
      const isCritical = item.priority === 'Critical' || item.definition?.evidenceStrength === 'Critical';
      const isRequired = item.required;

      if (!state) return;

      if (!state.is_present) {
        if (isCritical) {
          missingCriticalCount++;
        } else if (isRequired) {
          missingRequiredCount++;
        }
      } else {
        // Is present but detail text is blank
        if (!state.evidence_value || !state.evidence_value.trim()) {
          incompleteObservedCount++;
        }
      }
    });

    // Format validation messages
    if (missingCriticalCount > 0) {
      errors.push({
        type: 'error',
        text: `Missing ${missingCriticalCount} critical evidence item(s) (e.g. Industry/Title match)`,
      });
    }

    if (missingRequiredCount > 0) {
      errors.push({
        type: 'warning',
        text: `Missing ${missingRequiredCount} required evidence element(s)`,
      });
    }

    if (incompleteObservedCount > 0) {
      errors.push({
        type: 'warning',
        text: `observed items need supporting descriptions/values`,
      });
    }

    // Dynamic conflict rules check
    const fitIndustry = formData['fit_industry_match'];
    const fitTitle = formData['fit_job_title'];
    const fitSize = formData['fit_company_size'];

    // If company size or job title is observed but industry is not matched
    if (fitIndustry && !fitIndustry.is_present && ((fitTitle && fitTitle.is_present) || (fitSize && fitSize.is_present))) {
      errors.push({
        type: 'warning',
        text: 'Conflict: Job title or size verified, but target Industry Match is unverified.',
      });
    }

    // Timing timeline with no budget
    const timingTimeline = formData['timing_purchase_timeline'];
    const timingBudget = formData['timing_budget_allocated'];
    if (timingTimeline?.is_present && timingBudget && !timingBudget.is_present) {
      errors.push({
        type: 'warning',
        text: 'Conflict: Active buying timeline claimed, but Budget has not been allocated.',
      });
    }

    // If everything is satisfied
    if (errors.length === 0) {
      errors.push({
        type: 'success',
        text: 'Validation Passed: Evidence profile is complete and consistent.',
      });
    }

    setValidationMessages(errors);
  }, [formData, config]);

  if (!config) {
    return (
      <div className="p-8 text-center text-xs font-mono text-text-secondary uppercase">
        Loading Evidence Framework...
      </div>
    );
  }

  const renderEvidenceCategory = (dimension: string, title: string, subtitle: string) => {
    const items = config.evidence[dimension] || [];
    if (items.length === 0) return null;

    return (
      <div className="space-y-4">
        <div className="border-b border-border pb-2">
          <h3 className="text-xs font-black text-text-primary uppercase tracking-wider flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-accent" />
            {title}
          </h3>
          <p className="text-[10px] text-text-secondary">{subtitle}</p>
        </div>

        <div className="space-y-4">
          {items.map((item: any) => {
            const state = formData[item.evidenceId] || {};
            const positiveSignals = item.definition?.positiveSignals || [];
            const negativeSignals = item.definition?.negativeSignals || [];
            
            const quickOptions = [
              'Select response...',
              ...positiveSignals,
              ...negativeSignals,
              'Not Specified / Unknown'
            ];

            return (
              <EvidenceCard
                key={item.evidenceId}
                item={item}
                state={state}
                quickOptions={quickOptions}
                handleFieldChange={handleFieldChange}
              />
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Title block */}
      <div className="flex items-center justify-between border-b border-border pb-3">
        <div>
          <span className="text-[10px] font-mono text-text-secondary uppercase">Unified Diagnostic Suite</span>
          <h2 className="text-base font-black text-text-primary uppercase tracking-wide mt-0.5">
            Lead Qualification Form
          </h2>
          <p className="text-xs text-text-secondary mt-1">
            Populate evidence points retrieved matching <span className="font-bold text-text-primary">{config.industry.name}</span> configurations under <span className="font-bold text-text-primary">{config.industry.revenueMotion.replace(/_/g, ' ')}</span> motion.
          </p>
        </div>
      </div>

      {/* Grid containing 2 main columns */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Column 1: Fit and Engagement */}
        <div className="space-y-8">
          {renderEvidenceCategory(
            'fit',
            'Fit Evidence',
            'Verification of organization scale, industry alignment, and decision structure'
          )}
          {renderEvidenceCategory(
            'engagement',
            'Engagement Evidence',
            'Observations of marketing touchpoints, whitepapers, and sales calls'
          )}
        </div>

        {/* Column 2: Intent and Timing */}
        <div className="space-y-8">
          {renderEvidenceCategory(
            'intent',
            'Intent Evidence',
            'Observations of active buyer search, competitive comparison, and trigger behaviors'
          )}
          {renderEvidenceCategory(
            'timing',
            'Timing Evidence',
            'Verification of budgets, timeline parameters, and compelling trigger events'
          )}
        </div>
      </div>

      {/* Validation and Execution Controls card */}
      <div className="p-5 rounded-2xl bg-bg-surface border border-border mt-8 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-md relative overflow-hidden">
        
        {/* Left Side: Validation */}
        <div className="flex-1 space-y-2">
          <h4 className="text-[10px] font-mono font-black text-text-secondary uppercase tracking-widest flex items-center gap-1.5">
            <AlertCircle className="w-4 h-4 text-accent" />
            Validation Suite
          </h4>
          
          <div className="space-y-1.5">
            {validationMessages.map((msg, i) => {
              const textStyle =
                msg.type === 'error'
                  ? 'text-red-500 font-bold'
                  : msg.type === 'warning'
                  ? 'text-orange-500'
                  : 'text-green-500 font-bold';

              return (
                <div key={i} className="flex items-center gap-2 text-xs">
                  {msg.type === 'error' && <AlertTriangle className="w-3.5 h-3.5 text-red-500 shrink-0" />}
                  {msg.type === 'warning' && <AlertCircle className="w-3.5 h-3.5 text-orange-500 shrink-0" />}
                  {msg.type === 'success' && <CheckCircle className="w-3.5 h-3.5 text-green-500 shrink-0" />}
                  <span className={textStyle}>{msg.text}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Side: Action buttons */}
        <div className="flex items-center gap-3 shrink-0">
          {onSave && (
            <button
              type="button"
              onClick={onSave}
              disabled={loading}
              className="px-5 py-2.5 bg-accent hover:bg-accent/90 text-white rounded-xl transition-all shadow-sm flex items-center justify-center gap-2 text-xs font-bold tracking-tight cursor-pointer select-none font-sans"
              title="Save Evidence Draft"
            >
              <Save className="w-4 h-4 shrink-0" />
              Save Draft
            </button>
          )}

          {onRun && (
            <button
              type="button"
              onClick={onRun}
              disabled={loading}
              className="px-5 py-2.5 bg-accent hover:bg-accent/90 text-white font-bold text-xs tracking-tight rounded-xl transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer select-none font-sans"
            >
              <Bot className="w-4 h-4 shrink-0" />
              {loading ? 'Analyzing...' : 'Run Qualification'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
