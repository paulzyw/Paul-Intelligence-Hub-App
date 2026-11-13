import React, { useMemo, useState } from 'react';
import {
  Search,
  Layers,
  AlertCircle,
  CheckCircle2,
  X,
  FileText,
  ShieldAlert
} from 'lucide-react';
import {
  PipelineSWOTResult,
  PipelineEvidence,
  PipelineEvidenceRelationship,
  SWOTCategory
} from '../../types/pipeline';
import { PipelineConfigService } from '../services/PipelineConfigService';

export interface SWOTIntelligenceBoardProps {
  swotResults: PipelineSWOTResult[];
  evidence: PipelineEvidence[];
  evidenceRelationships?: PipelineEvidenceRelationship[];
  revenueMotionId: string;
  industryId: string;
}

const QUADRANT_CONFIG: Array<{
  type: SWOTCategory;
  title: string;
  subtitle: string;
  accentText: string;
  dotColor: string;
}> = [
  {
    type: 'strength',
    title: 'Strengths',
    subtitle: 'Internal deal advantages supported by verified proof',
    accentText: 'text-emerald-400',
    dotColor: 'bg-emerald-400'
  },
  {
    type: 'weakness',
    title: 'Weaknesses',
    subtitle: 'Internal gaps, missing proof, or execution constraints',
    accentText: 'text-amber-400',
    dotColor: 'bg-amber-400'
  },
  {
    type: 'opportunity',
    title: 'Opportunities',
    subtitle: 'External catalysts, urgency drivers, and expansion levers',
    accentText: 'text-sky-400',
    dotColor: 'bg-sky-400'
  },
  {
    type: 'threat',
    title: 'Threats',
    subtitle: 'External blockers, competitor moves, or procurement friction',
    accentText: 'text-red-400',
    dotColor: 'bg-red-400'
  }
];

export const SWOTIntelligenceBoard: React.FC<SWOTIntelligenceBoardProps> = ({
  swotResults,
  evidence,
  evidenceRelationships = [],
  revenueMotionId,
  industryId
}) => {
  const [layerFilter, setLayerFilter] = useState<
    'all' | 'universal_baseline' | 'revenue_motion_override' | 'industry_override'
  >('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFactor, setSelectedFactor] = useState<PipelineSWOTResult | null>(null);

  // Merge active 16 resolution baseline in case any factor didn't return in swotResults
  const resolvedBaseline = useMemo(
    () => PipelineConfigService.resolveActiveSWOTFactors(revenueMotionId, industryId),
    [revenueMotionId, industryId]
  );

  const normalizedFactors = useMemo(() => {
    if (swotResults.length > 0) return swotResults;
    return resolvedBaseline.active16Factors.map((f) => ({
      assessment_id: '',
      pipeline_id: '',
      factor_id: f.factor_type_id,
      factor_name: f.factor_name,
      factor_type: f.factor_classification,
      factor_layer: f.layer,
      strategic_impact: 3,
      evidence_confidence: 1,
      relevance: 3,
      urgency: 3,
      manageability: 3,
      winability_influence: 3,
      priority_level: 'medium' as const,
      assessment_state: 'INSUFFICIENT_EVIDENCE' as const,
      evaluation_rationale: f.factor_description,
      supporting_evidence_ids: [],
      contradicting_evidence_ids: [],
      related_padf_dimensions: f.related_padf_dimensions || []
    }));
  }, [swotResults, resolvedBaseline]);

  const filteredFactors = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return normalizedFactors.filter((f) => {
      if (layerFilter !== 'all' && f.factor_layer !== layerFilter) return false;
      if (q) {
        return (
          f.factor_name.toLowerCase().includes(q) ||
          f.factor_id.toLowerCase().includes(q) ||
          (f.evaluation_rationale || '').toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [normalizedFactors, layerFilter, searchQuery]);

  const evidenceMap = useMemo(() => {
    const map = new Map<string, PipelineEvidence>();
    evidence.forEach((ev) => {
      map.set(ev.evidence_instance_id, ev);
      if (ev.evidence_object_id) map.set(ev.evidence_object_id, ev);
    });
    return map;
  }, [evidence]);

  const layerLabel = (layer: PipelineSWOTResult['factor_layer']) => {
    if (layer === 'universal_baseline') return 'Universal';
    if (layer === 'revenue_motion_override') return 'Motion';
    return 'Industry';
  };

  const stateLabel = (state: PipelineSWOTResult['assessment_state']) => {
    switch (state) {
      case 'EVALUATED':
        return { text: 'Evaluated', color: 'text-emerald-400' };
      case 'PARTIALLY_SUPPORTED':
        return { text: 'Partial Support', color: 'text-sky-400' };
      case 'CONTRADICTED':
        return { text: 'Contradicted', color: 'text-red-400' };
      default:
        return { text: 'Insufficient Evidence', color: 'text-amber-400' };
    }
  };

  const selectedApprovedMappings = useMemo(() => {
    if (!selectedFactor) return [];
    return PipelineConfigService.getApprovedMappingsForFactor(selectedFactor.factor_id);
  }, [selectedFactor]);

  const selectedRuntimeRelationships = useMemo(() => {
    if (!selectedFactor) return [];
    return evidenceRelationships.filter((r) => r.target_factor_id === selectedFactor.factor_id);
  }, [selectedFactor, evidenceRelationships]);

  return (
    <div className="space-y-5">
      {/* Header Filter Strip */}
      <div className="bg-bg-surface border border-border rounded-2xl p-4 sm:p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2 text-xs font-mono text-text-secondary">
            <Layers className="h-3.5 w-3.5 text-accent" />
            <span>
              16 Active Factor Hierarchy · {resolvedBaseline.canonicalRevenueMotionId} ·{' '}
              {resolvedBaseline.canonicalIndustryId}
            </span>
          </div>
          <p className="text-xs text-text-secondary">
            Ordinal 1–5 evaluation axes (Strategic Impact, Evidence Confidence, Urgency, Manageability, Winability Influence). Zero fabricated composite scores.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filter factors..."
              className="pl-8 pr-3 py-1.5 bg-bg-primary border border-border rounded-xl text-xs text-text-primary focus:outline-none focus:border-accent w-44"
            />
          </div>

          <div className="flex items-center gap-1 p-1 bg-bg-primary border border-border rounded-xl">
            {[
              { key: 'all', label: `All (${normalizedFactors.length})` },
              { key: 'universal_baseline', label: 'Universal (8)' },
              { key: 'revenue_motion_override', label: 'Motion (4)' },
              { key: 'industry_override', label: 'Industry (4)' }
            ].map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => setLayerFilter(tab.key as any)}
                className={`px-2.5 py-1 text-[11px] font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  layerFilter === tab.key
                    ? 'bg-accent text-black font-semibold'
                    : 'text-text-secondary hover:text-text-primary'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 4-Quadrant Active Factor Board */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {QUADRANT_CONFIG.map((quad) => {
          const items = filteredFactors.filter((f) => f.factor_type === quad.type);
          return (
            <div
              key={quad.type}
              className="bg-bg-surface border border-border rounded-2xl p-5 flex flex-col gap-3.5"
            >
              <div className="flex items-center justify-between gap-2 pb-3 border-b border-border/60">
                <div className="flex items-center gap-2.5">
                  <span className={`h-2.5 w-2.5 rounded-full ${quad.dotColor}`} />
                  <div>
                    <h3 className={`text-sm font-bold ${quad.accentText}`}>
                      {quad.title} ({items.length})
                    </h3>
                    <p className="text-[11px] text-text-secondary">{quad.subtitle}</p>
                  </div>
                </div>
              </div>

              {items.length === 0 ? (
                <div className="py-8 text-center text-xs text-text-secondary">
                  No factors match the active filter in this quadrant.
                </div>
              ) : (
                <div className="space-y-3">
                  {items.map((factor) => {
                    const st = stateLabel(factor.assessment_state);
                    const isGap =
                      factor.assessment_state === 'INSUFFICIENT_EVIDENCE' ||
                      factor.evidence_confidence <= 2;

                    return (
                      <button
                        key={factor.factor_id}
                        type="button"
                        onClick={() => setSelectedFactor(factor)}
                        className="w-full text-left p-4 bg-bg-primary border border-border/80 hover:border-accent/50 rounded-xl transition-colors cursor-pointer space-y-2.5"
                      >
                        <div className="flex items-center justify-between gap-2 text-[11px] font-mono">
                          <span className="text-text-secondary truncate">
                            {factor.factor_id} · {layerLabel(factor.factor_layer)}
                          </span>
                          <span className={`font-semibold shrink-0 ${st.color}`}>
                            {st.text}
                          </span>
                        </div>

                        <div className="flex items-start justify-between gap-2">
                          <div className="text-sm font-bold text-text-primary leading-snug">
                            {factor.factor_name}
                          </div>
                          {isGap && (
                            <span
                              title="Evidence gap or low ordinal confidence"
                              className="inline-flex items-center gap-1 text-[10px] font-mono text-amber-400 shrink-0"
                            >
                              <AlertCircle className="h-3.5 w-3.5" />
                              Gap
                            </span>
                          )}
                        </div>

                        {factor.evaluation_rationale && (
                          <p className="text-xs text-text-secondary leading-relaxed line-clamp-2">
                            {factor.evaluation_rationale}
                          </p>
                        )}

                        {/* Discrete Ordinal 1-5 Strip (never summed into fake composite) */}
                        <div className="pt-2 border-t border-border/50 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] font-mono tabular-nums text-text-secondary">
                          <span>
                            Impact: <strong className="text-text-primary">{factor.strategic_impact}/5</strong>
                          </span>
                          <span>
                            Conf:{' '}
                            <strong
                              className={
                                factor.evidence_confidence >= 4
                                  ? 'text-emerald-400'
                                  : factor.evidence_confidence <= 2
                                    ? 'text-amber-400'
                                    : 'text-text-primary'
                              }
                            >
                              {factor.evidence_confidence}/5
                            </strong>
                          </span>
                          <span>
                            Urgency: <strong className="text-text-primary">{factor.urgency}/5</strong>
                          </span>
                          <span className="uppercase text-[10px]">
                            Priority: {factor.priority_level}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Factor Evaluation & Evidence Drawer */}
      {selectedFactor && (
        <div className="fixed inset-0 z-50 bg-black/70 flex justify-end">
          <div className="w-full max-w-xl bg-bg-surface border-l border-border h-full overflow-y-auto p-6 space-y-6">
            <div className="flex items-start justify-between gap-4 pb-4 border-b border-border">
              <div className="space-y-1">
                <div className="text-xs font-mono text-accent">
                  {selectedFactor.factor_id} · {layerLabel(selectedFactor.factor_layer)} ·{' '}
                  {selectedFactor.factor_type.toUpperCase()}
                </div>
                <h3 className="text-lg font-bold text-text-primary">{selectedFactor.factor_name}</h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedFactor(null)}
                className="p-2 rounded-xl bg-bg-primary border border-border text-text-secondary hover:text-text-primary cursor-pointer"
                aria-label="Close factor detail drawer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* 6 Ordinal Evaluation Axes (1-5 Scale) */}
            <div className="space-y-3">
              <div className="text-xs font-semibold text-text-primary">
                Six-Axis Ordinal Assessment (1–5 Scale)
              </div>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: 'Strategic Impact', val: selectedFactor.strategic_impact },
                  { label: 'Evidence Confidence', val: selectedFactor.evidence_confidence },
                  { label: 'Relevance', val: selectedFactor.relevance },
                  { label: 'Urgency', val: selectedFactor.urgency },
                  { label: 'Manageability', val: selectedFactor.manageability },
                  { label: 'Winability Influence', val: selectedFactor.winability_influence }
                ].map((axis) => (
                  <div
                    key={axis.label}
                    className="p-3 bg-bg-primary border border-border/70 rounded-xl space-y-1.5"
                  >
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-text-secondary">{axis.label}</span>
                      <span className="font-mono font-bold tabular-nums text-text-primary">
                        {axis.val}/5
                      </span>
                    </div>
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map((n) => (
                        <div
                          key={n}
                          className={`h-1.5 flex-1 rounded-full ${
                            n <= axis.val ? 'bg-accent' : 'bg-border/60'
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Evaluation Rationale */}
            {selectedFactor.evaluation_rationale && (
              <div className="space-y-1.5">
                <div className="text-xs font-semibold text-text-primary">Gemini Factor Rationale</div>
                <p className="text-xs text-text-secondary leading-relaxed bg-bg-primary border border-border/70 rounded-xl p-3.5">
                  {selectedFactor.evaluation_rationale}
                </p>
              </div>
            )}

            {/* Supporting & Contradicting Evidence */}
            <div className="space-y-2.5">
              <div className="text-xs font-semibold text-text-primary flex items-center gap-1.5">
                <FileText className="h-3.5 w-3.5 text-emerald-400" />
                <span>
                  Supporting Evidence ({selectedFactor.supporting_evidence_ids?.length || 0})
                </span>
              </div>
              {(selectedFactor.supporting_evidence_ids || []).length === 0 ? (
                <p className="text-xs text-text-secondary italic">
                  No direct supporting evidence records linked yet.
                </p>
              ) : (
                <div className="space-y-2">
                  {(selectedFactor.supporting_evidence_ids || []).map((id) => {
                    const ev = evidenceMap.get(id);
                    return (
                      <div
                        key={id}
                        className="p-3 bg-bg-primary border border-border/70 rounded-xl space-y-1"
                      >
                        <div className="flex items-center justify-between text-[11px] font-mono text-emerald-400">
                          <span className="inline-flex items-center gap-1">
                            <CheckCircle2 className="h-3 w-3" />
                            {ev?.evidence_object_id || id}
                          </span>
                          {ev && <span>KB Conf: {ev.evidence_confidence}%</span>}
                        </div>
                        <p className="text-xs text-text-primary leading-relaxed">
                          {ev?.evidence_statement || `Linked evidence ID: ${id}`}
                        </p>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {(selectedFactor.contradicting_evidence_ids || []).length > 0 && (
              <div className="space-y-2.5">
                <div className="text-xs font-semibold text-red-400 flex items-center gap-1.5">
                  <ShieldAlert className="h-3.5 w-3.5" />
                  <span>
                    Contradicting Evidence ({selectedFactor.contradicting_evidence_ids?.length})
                  </span>
                </div>
                <div className="space-y-2">
                  {(selectedFactor.contradicting_evidence_ids || []).map((id) => {
                    const ev = evidenceMap.get(id);
                    return (
                      <div
                        key={id}
                        className="p-3 bg-bg-primary border border-red-500/30 rounded-xl space-y-1"
                      >
                        <div className="text-[11px] font-mono text-red-400">
                          {ev?.evidence_object_id || id}
                        </div>
                        <p className="text-xs text-text-primary leading-relaxed">
                          {ev?.evidence_statement || `Contradicting record: ${id}`}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Runtime Evidence Relationships & Approved KB Mappings */}
            {selectedRuntimeRelationships.length > 0 && (
              <div className="space-y-2">
                <div className="text-xs font-semibold text-text-primary">
                  Runtime Evidence Relationships ({selectedRuntimeRelationships.length})
                </div>
                <div className="space-y-1.5">
                  {selectedRuntimeRelationships.map((rel) => {
                    const ev = evidenceMap.get(rel.evidence_instance_id);
                    return (
                      <div
                        key={rel.relationship_id}
                        className="text-[11px] bg-bg-primary border border-border/70 rounded-xl px-3 py-2 space-y-1"
                      >
                        <div className="flex items-center justify-between font-mono">
                          <span className="text-accent font-semibold">
                            {ev?.evidence_object_id || rel.evidence_instance_id}
                          </span>
                          <span className="text-text-secondary">
                            {rel.mapping_relevance} · {rel.runtime_relationship} ({rel.runtime_polarity})
                          </span>
                        </div>
                        {ev?.evidence_statement && (
                          <p className="text-xs text-text-primary line-clamp-2">{ev.evidence_statement}</p>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {selectedApprovedMappings.length > 0 && (
              <div className="space-y-2">
                <div className="text-xs font-semibold text-text-primary">
                  Approved KB Evidence Mappings ({selectedApprovedMappings.length})
                </div>
                <div className="space-y-1.5">
                  {selectedApprovedMappings.map((m) => (
                    <div
                      key={m.mappingId}
                      className="text-[11px] font-mono text-text-secondary bg-bg-primary border border-border/60 rounded-lg px-3 py-2 flex items-center justify-between"
                    >
                      <span>{m.evidenceObjectId}</span>
                      <span>
                        {m.mappingStrength} · {m.evidenceRole}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default SWOTIntelligenceBoard;
