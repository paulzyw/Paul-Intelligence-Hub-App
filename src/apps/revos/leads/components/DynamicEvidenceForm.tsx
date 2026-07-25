import React, { useState, useEffect } from 'react';
import { MQLConfigService } from '../services/mqlConfigLoader';

interface DynamicEvidenceFormProps {
  industryId: string;
  initialData?: any[];
  onChange?: (data: any[]) => void;
  readOnly?: boolean;
}

export const DynamicEvidenceForm: React.FC<DynamicEvidenceFormProps> = ({ industryId, initialData = [], onChange, readOnly = false }) => {
  const [config, setConfig] = useState<any>(null);
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [expanded, setExpanded] = useState<Record<string, boolean>>({
    fit: false,
    intent: false,
    engagement: false,
    timing: false
  });

  useEffect(() => {
    try {
      const combined = MQLConfigService.getCombinedEvidenceConfig(industryId);
      setConfig(combined);
      
      const initial: Record<string, any> = {};
      ['fit', 'intent', 'engagement', 'timing'].forEach(dim => {
        combined.evidence[dim].forEach((item: any) => {
          const existing = initialData.find(d => d.evidence_id === item.evidenceId);
          initial[item.evidenceId] = existing || {
            evidence_id: item.evidenceId,
            dimension: dim,
            is_present: false,
            evidence_value: '',
            notes: ''
          };
        });
      });
      setFormData(initial);
    } catch (err) {
      console.error("Failed to load industry configuration:", err);
    }
  }, [industryId, initialData]);

  const handleChange = (evidenceId: string, field: string, value: any) => {
    if (readOnly) return;
    const newData = {
      ...formData,
      [evidenceId]: {
        ...formData[evidenceId],
        [field]: value
      }
    };
    setFormData(newData);
    if (onChange) {
      onChange(Object.values(newData));
    }
  };

  const toggleSection = (dim: string) => {
    setExpanded(prev => ({ ...prev, [dim]: !prev[dim] }));
  };

  if (!config) return <div className="p-4 text-xs font-mono text-text-secondary uppercase">Loading Framework configurations...</div>;

  const renderDimension = (dimension: string, title: string, description: string) => {
    const items = config.evidence[dimension];
    if (!items || items.length === 0) return null;
    const isExpanded = expanded[dimension];

    return (
      <div className="mb-4 rounded-2xl border border-border bg-bg-surface overflow-hidden shadow-sm">
        <button 
          type="button"
          onClick={() => toggleSection(dimension)}
          className="w-full flex items-center justify-between px-5 py-4 bg-bg-primary/40 hover:bg-bg-primary/80 transition-colors"
        >
          <div className="flex flex-col items-start text-left">
            <span className="font-bold text-xs sm:text-sm text-text-primary uppercase tracking-wider">{title}</span>
            <span className="text-[10px] sm:text-xs text-text-secondary mt-0.5">{description}</span>
          </div>
          <svg className={`w-4 h-4 text-text-secondary transition-transform ${isExpanded ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        
        {isExpanded && (
          <div className="px-5 py-4 border-t border-border">
            <div className="space-y-4">
              {items.map((item: any) => {
                const data = formData[item.evidenceId];
                if (!data) return null;
                
                const isCritical = item.priority === 'Critical';
                
                return (
                  <div key={item.evidenceId} className="border border-border rounded-xl p-4 sm:p-5 bg-bg-primary/20 relative overflow-hidden transition-all">
                    {isCritical && <div className="absolute left-0 top-0 bottom-0 w-1 bg-red-500" />}
                    
                    <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex flex-wrap items-center gap-2 mb-1.5">
                          <label className="text-xs sm:text-sm font-black text-text-primary uppercase tracking-wider">{item.definition.evidenceName}</label>
                          {item.required && <span className="px-2 py-0.5 rounded-lg text-[9px] font-mono font-black uppercase bg-bg-primary border border-border text-text-secondary">Required</span>}
                          {isCritical && <span className="px-2 py-0.5 rounded-lg text-[9px] font-mono font-black uppercase bg-red-500/10 text-red-500 border border-red-500/20">Critical</span>}
                        </div>
                        <p className="text-xs text-text-secondary mt-1">{item.definition.definition}</p>
                      </div>
                      
                      <div className="flex items-center space-x-3 shrink-0">
                        <label className={`text-[10px] font-mono font-black uppercase tracking-wider ${data.is_present ? 'text-green-500' : 'text-text-secondary'}`}>
                          {data.is_present ? 'Observed' : 'Not Observed'}
                        </label>
                        <div 
                          className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full transition-colors ${readOnly ? 'opacity-50 cursor-not-allowed' : ''} ${data.is_present ? 'bg-green-500' : 'bg-bg-primary border border-border'}`}
                          onClick={() => !readOnly && handleChange(item.evidenceId, 'is_present', !data.is_present)}
                        >
                          <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${data.is_present ? 'translate-x-6' : 'translate-x-1'}`} />
                        </div>
                      </div>
                    </div>
                    
                    {data.is_present && (
                      <div className="mt-4 space-y-4 border-t border-border pt-4 animate-in fade-in slide-in-from-top-2 duration-200">
                        <div>
                          <label className="text-[10px] font-black text-text-secondary uppercase tracking-wider mb-1.5 block">Evidence Value / Details</label>
                          <textarea 
                            value={data.evidence_value}
                            onChange={(e) => handleChange(item.evidenceId, 'evidence_value', e.target.value)}
                            placeholder="e.g., specific job title, URL visited, meeting summary..."
                            className="w-full min-h-[80px] p-3 text-xs rounded-xl border border-border bg-bg-surface text-text-primary focus:outline-none focus:border-accent/40 transition-all font-sans"
                            disabled={readOnly}
                          />
                        </div>
                        <div>
                          <label className="text-[10px] font-black text-text-secondary uppercase tracking-wider mb-1.5 block">Internal Notes (Optional)</label>
                          <textarea 
                            value={data.notes}
                            onChange={(e) => handleChange(item.evidenceId, 'notes', e.target.value)}
                            placeholder="Add contextual notes..."
                            className="w-full min-h-[60px] p-3 text-xs rounded-xl border border-border bg-bg-surface text-text-primary focus:outline-none focus:border-accent/40 transition-all font-sans"
                            disabled={readOnly}
                          />
                        </div>
                      </div>
                    )}
                    
                    {!data.is_present && item.definition.interpretationGuidance && (
                      <div className="mt-3 p-3 bg-accent/5 border border-accent/15 rounded-xl text-[11px] text-text-secondary">
                        <span className="font-bold text-accent font-mono uppercase tracking-wider">AI Guidance: </span> {item.definition.interpretationGuidance}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="w-full">
      <div className="mb-6">
        <h3 className="text-sm font-black text-text-primary flex flex-wrap items-center gap-2 uppercase tracking-wider">
          {config.industry.name} Assessment
          <span className="px-2.5 py-0.5 bg-accent/10 text-accent text-[9px] font-mono font-black border border-accent/25 rounded-lg uppercase tracking-wider">
            {config.industry.revenueMotion.replace(/_/g, ' ')}
          </span>
        </h3>
        <p className="text-text-secondary text-xs mt-1.5">{config.industry.description}</p>
      </div>

      <div className="w-full space-y-4">
        {renderDimension('fit', '1. Fit Assessment', 'Evaluate firmographic and buyer alignment')}
        {renderDimension('intent', '2. Intent Signals', 'Evaluate active buying signals and research behaviors')}
        {renderDimension('engagement', '3. Engagement', 'Evaluate interactions with marketing and sales')}
        {renderDimension('timing', '4. Timing & Urgency', 'Evaluate compelling events and readiness')}
      </div>
    </div>
  );
};

