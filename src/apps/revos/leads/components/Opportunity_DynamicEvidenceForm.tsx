import React, { useState, useEffect } from 'react';
import { OpportunityEvidenceRecord } from '../../types/opportunity_qualification';
import { OpportunityDataService } from '../services/opportunityDataService';
import { Bot, Sparkles, Check, Play, AlertCircle, RefreshCw, HelpCircle, User, ShieldAlert } from 'lucide-react';

interface OpportunityDynamicEvidenceFormProps {
  sessionId: string;
  opportunityId: string;
  revenueMotion: string;
  industry: string;
  activeDimensionCode: string;
  evidenceKb: any;
  savedEvidence: OpportunityEvidenceRecord[];
  onEvidenceSaved: () => void;
}

export const OpportunityDynamicEvidenceForm: React.FC<OpportunityDynamicEvidenceFormProps> = ({
  sessionId,
  opportunityId,
  revenueMotion,
  industry,
  activeDimensionCode,
  evidenceKb,
  savedEvidence,
  onEvidenceSaved
}) => {
  const [questions, setQuestions] = useState<any[]>([]);
  const [answers, setAnswers] = useState<Record<string, { answer: string; source: string; strength: string }>>({});
  const [suggestedAnswers, setSuggestedAnswers] = useState<Record<string, Array<{ tier: string; label: string; text: string }>>>({});
  const [generatingSuggestions, setGeneratingSuggestions] = useState<Record<string, boolean>>({});
  const [saving, setSaving] = useState(false);

  // Extract questions from Knowledge Base based on revenue motion and industry
  useEffect(() => {
    if (!evidenceKb) return;

    // Resolve Phase Configuration
    // e.g. RM01 -> "phase_01_digital_solution_selling"
    const motionRegistry = evidenceKb.revenue_motion_registry || {};
    let phaseKey = '';
    for (const [rmCode, info] of Object.entries(motionRegistry)) {
      if ((info as any).revenue_motion_name === revenueMotion || rmCode === revenueMotion) {
        phaseKey = (info as any).phase_reference;
        break;
      }
    }

    if (!phaseKey) {
      // Default fallback key
      phaseKey = 'phase_06_generic_solution_selling';
    }

    const phaseConfig = evidenceKb.phase_configurations?.[phaseKey] || {};
    const industryConfigs = phaseConfig.industry_configurations || {};

    // Resolve Industry
    let selectedIndustryConfig: any = null;
    const cleanIndustryQuery = industry.toLowerCase().replace(/[^a-z0-9]+/g, '_');
    
    for (const [indKey, indVal] of Object.entries(industryConfigs)) {
      const indName = (indVal as any).industry_context_reference?.industry_name || '';
      if (indName.toLowerCase() === industry.toLowerCase() || indKey.toLowerCase() === cleanIndustryQuery) {
        selectedIndustryConfig = indVal;
        break;
      }
    }

    // Fallback to first configuration if none matches exactly
    if (!selectedIndustryConfig) {
      const keys = Object.keys(industryConfigs);
      if (keys.length > 0) {
        selectedIndustryConfig = industryConfigs[keys[0]];
      }
    }

    if (selectedIndustryConfig && selectedIndustryConfig.qualification_dimensions) {
      const dimensionData = selectedIndustryConfig.qualification_dimensions[activeDimensionCode] || {};
      const dimensionQuestions = dimensionData.evidence_questions || [];
      setQuestions(dimensionQuestions);

      // Pre-populate with saved answers
      const initialAnswers: Record<string, { answer: string; source: string; strength: string }> = {};
      dimensionQuestions.forEach((q: any) => {
        const saved = savedEvidence.find(e => e.evidence_id === q.id && e.dimension_code === activeDimensionCode);
        initialAnswers[q.id] = {
          answer: saved?.answer_value || '',
          source: saved?.evidence_source || 'Sales Rep',
          strength: saved?.evidence_strength || 'unverified'
        };
      });
      setAnswers(initialAnswers);
    } else {
      setQuestions([]);
    }
  }, [evidenceKb, activeDimensionCode, revenueMotion, industry, savedEvidence]);

  const handleTextChange = (qId: string, value: string) => {
    setAnswers(prev => ({
      ...prev,
      [qId]: {
        ...prev[qId],
        answer: value
      }
    }));
  };

  const handleSourceChange = (qId: string, value: string) => {
    setAnswers(prev => ({
      ...prev,
      [qId]: {
        ...prev[qId],
        source: value
      }
    }));
  };

  const handleStrengthChange = (qId: string, value: string) => {
    setAnswers(prev => ({
      ...prev,
      [qId]: {
        ...prev[qId],
        strength: value
      }
    }));
  };

  const generateAIOptions = async (qId: string, question: any) => {
    setGeneratingSuggestions(prev => ({ ...prev, [qId]: true }));
    try {
      const singleQuestionPayload = [{
        id: qId,
        dimension_code: activeDimensionCode,
        question_text: question.question_text || question.question,
        required: question.required || false,
        expected_evidence: question.expected_evidence || '',
        positive_signals: question.positive_signals || [],
        negative_signals: question.negative_signals || []
      }];

      const result = await OpportunityDataService.generateSuggestedAnswers(
        opportunityId,
        revenueMotion,
        industry,
        singleQuestionPayload
      );

      const matched = result.find((r: any) => r.evidence_id === qId);
      if (matched && matched.options) {
        setSuggestedAnswers(prev => ({
          ...prev,
          [qId]: matched.options
        }));
      }
    } catch (e) {
      console.error("Failed to generate suggested answers:", e);
    } finally {
      setGeneratingSuggestions(prev => ({ ...prev, [qId]: false }));
    }
  };

  const handleSelectSuggestion = (qId: string, text: string, strength: string) => {
    setAnswers(prev => ({
      ...prev,
      [qId]: {
        answer: text,
        source: 'AI Co-Pilot Suggested Option',
        strength: strength === 'strong' ? 'customer_confirmed' : 'unverified'
      }
    }));
  };

  const handleSaveAll = async () => {
    setSaving(true);
    try {
      const evidencePayload = Object.entries(answers)
        .filter(([_, data]) => data.answer.trim() !== '')
        .map(([qId, data]) => {
          const qText = questions.find(q => q.id === qId)?.question_text || '';
          return {
            dimension_code: activeDimensionCode,
            evidence_id: qId,
            question_text: qText,
            answer_value: data.answer,
            evidence_source: data.source,
            evidence_strength: data.strength
          };
        });

      // We should preserve saved evidence from other dimensions
      const otherDimensionsEvidence = savedEvidence.filter(e => e.dimension_code !== activeDimensionCode);
      const combinedPayload = [
        ...otherDimensionsEvidence,
        ...evidencePayload
      ];

      await OpportunityDataService.submitEvidence(sessionId, combinedPayload);
      onEvidenceSaved();
    } catch (e) {
      console.error("Failed to submit evidence:", e);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-zinc-200/60 shadow-xs">
        <h3 className="font-black text-xs uppercase text-zinc-800 tracking-wider">
          Evidence Collection Forms ({questions.length} Questions)
        </h3>
        <span className="text-[10px] text-zinc-400 font-mono">
          Dimension: {activeDimensionCode}
        </span>
      </div>

      {questions.length === 0 ? (
        <div className="p-12 text-center bg-zinc-50 border border-zinc-200 rounded-2xl">
          <HelpCircle className="h-8 w-8 mx-auto mb-3 text-zinc-300" />
          <p className="text-xs text-zinc-500 font-medium">No custom evidence requirements found for this dimension configuration.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {questions.map((q) => {
            const current = answers[q.id] || { answer: '', source: 'Sales Rep', strength: 'unverified' };
            const suggestions = suggestedAnswers[q.id];
            const isGen = generatingSuggestions[q.id];

            return (
              <div key={q.id} className="bg-white rounded-2xl border border-zinc-200 p-5 shadow-xs space-y-4">
                <div className="border-b border-zinc-100 pb-3 flex justify-between items-start gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-[9px] font-black font-mono uppercase px-2 py-0.5 rounded-lg bg-zinc-100 text-zinc-600 border border-zinc-200">
                        {q.id}
                      </span>
                      {q.required && (
                        <span className="text-[9px] font-black uppercase text-red-500 bg-red-50 px-2 py-0.5 rounded-lg border border-red-200/60">
                          Required Gate
                        </span>
                      )}
                    </div>
                    <h4 className="text-sm font-extrabold text-zinc-800 leading-snug mt-1.5">
                      {q.question_text || q.question}
                    </h4>
                    {q.expected_evidence && (
                      <p className="text-[11px] text-zinc-500 font-medium">
                        Expected evidence: <span className="text-zinc-600 italic font-normal">{q.expected_evidence}</span>
                      </p>
                    )}
                  </div>

                  <button
                    onClick={() => generateAIOptions(q.id, q)}
                    disabled={isGen}
                    className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 bg-zinc-50 hover:bg-zinc-100 active:scale-[0.98] border border-zinc-200 hover:border-zinc-300 rounded-lg text-[11px] font-bold text-zinc-700 cursor-pointer transition-all disabled:opacity-50 h-8"
                  >
                    {isGen ? (
                      <>
                        <RefreshCw className="h-3 w-3 animate-spin text-zinc-600" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-3.5 w-3.5 text-zinc-600" />
                        AI Discovery Suggestions
                      </>
                    )}
                  </button>
                </div>

                {/* AI Suggestions Accordion */}
                {suggestions && suggestions.length > 0 && (
                  <div className="bg-zinc-50 p-4 rounded-xl border border-zinc-200/70 space-y-2.5">
                    <span className="text-[10px] uppercase font-black text-zinc-500 tracking-wider flex items-center gap-1.5">
                      <Bot className="h-3.5 w-3.5" />
                      Suggested Enterprise Response Options:
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {suggestions.map((opt, idx) => {
                        const isSelected = current.answer === opt.text;
                        const badgeColors: Record<string, string> = {
                          strong: 'bg-emerald-50 text-emerald-800 border-emerald-200',
                          moderate: 'bg-amber-50 text-amber-800 border-amber-200',
                          weak: 'bg-zinc-100 text-zinc-800 border-zinc-200',
                          negative: 'bg-red-50 text-red-800 border-red-200'
                        };

                        return (
                          <div
                            key={idx}
                            onClick={() => handleSelectSuggestion(q.id, opt.text, opt.tier)}
                            className={`p-3 rounded-lg border text-left cursor-pointer transition-all hover:scale-[1.01] ${
                              isSelected
                                ? 'bg-zinc-800 text-white border-zinc-800 shadow-xs'
                                : 'bg-white hover:bg-zinc-50 border-zinc-200 text-zinc-700'
                            }`}
                          >
                            <div className="flex justify-between items-center gap-2 mb-1.5">
                              <span className={`text-[9px] font-black px-2 py-0.5 rounded-md border uppercase ${
                                isSelected ? 'bg-zinc-700 text-white border-zinc-600' : badgeColors[opt.tier]
                              }`}>
                                {opt.tier}
                              </span>
                              {isSelected && <Check className="h-3.5 w-3.5 text-emerald-400" />}
                            </div>
                            <p className="text-[11px] font-medium leading-relaxed">{opt.text}</p>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Manual Text Input Area */}
                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase font-black tracking-wider text-zinc-500 block">Discovery Response/Observation</label>
                  <textarea
                    value={current.answer}
                    onChange={(e) => handleTextChange(q.id, e.target.value)}
                    placeholder="Enter customer verification statements, transaction records, or notes collected during sales meeting..."
                    className="w-full h-24 bg-zinc-50 border border-zinc-200 focus:border-zinc-500 focus:outline-none focus:bg-white rounded-xl p-3 text-xs leading-relaxed transition-all placeholder-zinc-400 font-sans"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] uppercase font-black tracking-wider text-zinc-500 block">Information Source</label>
                    <select
                      value={current.source}
                      onChange={(e) => handleSourceChange(q.id, e.target.value)}
                      className="w-full bg-zinc-50 border border-zinc-200 focus:border-zinc-500 focus:outline-none rounded-xl px-3 py-2 text-xs font-sans cursor-pointer"
                    >
                      <option value="Sales Rep">Sales Representative Interview</option>
                      <option value="Customer Call Transcript">Verified Call Transcript</option>
                      <option value="Email thread">Email Thread Correspondence</option>
                      <option value="Board Deck">Board/Corporate Presentation Doc</option>
                      <option value="Procurement sheet">Procurement Guideline Sheet</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] uppercase font-black tracking-wider text-zinc-500 block">Evidence Validation Strength</label>
                    <select
                      value={current.strength}
                      onChange={(e) => handleStrengthChange(q.id, e.target.value)}
                      className="w-full bg-zinc-50 border border-zinc-200 focus:border-zinc-500 focus:outline-none rounded-xl px-3 py-2 text-xs font-sans cursor-pointer"
                    >
                      <option value="unverified">Unverified/Unconfirmed Account</option>
                      <option value="customer_confirmed">Customer Confirmed Statement</option>
                      <option value="verified">Verified Financial/Contractual Fact</option>
                    </select>
                  </div>
                </div>
              </div>
            );
          })}

          <div className="p-5 rounded-2xl bg-zinc-50 border border-zinc-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <span className="text-[11px] text-zinc-500 italic">
              Saving saves current answers on this tab. You must execute evaluation to run model reasoning.
            </span>
            <button
              onClick={handleSaveAll}
              disabled={saving}
              className="w-full sm:w-auto px-5 py-2.5 bg-zinc-800 hover:scale-[1.01] active:scale-[0.99] text-white font-black uppercase text-xs rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-md shadow-zinc-800/10 disabled:opacity-40"
            >
              {saving ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin text-white" />
                  Saving...
                </>
              ) : (
                <>
                  <Check className="h-4 w-4" />
                  Save Dimension Evidence
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
