import React, { useMemo, useState } from 'react';
import {
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Tooltip
} from 'recharts';
import {
  CheckCircle2,
  AlertTriangle,
  FileText,
  ArrowUpRight,
  ShieldCheck,
  Clock
} from 'lucide-react';
import {
  PipelinePADFResult,
  PipelineEvidence,
  PipelineOpportunity
} from '../../types/pipeline';
import { PipelineConfigService } from '../services/PipelineConfigService';

export interface PADFDimensionHealthViewProps {
  opportunity: PipelineOpportunity;
  padfResults: PipelinePADFResult[];
  evidence: PipelineEvidence[];
  onEditDimensionEvidence?: (dimensionId: string) => void;
}

export const PADFDimensionHealthView: React.FC<PADFDimensionHealthViewProps> = ({
  opportunity,
  padfResults,
  evidence,
  onEditDimensionEvidence
}) => {
  const canonicalDims = useMemo(() => PipelineConfigService.getCanonicalPADFDimensions(), []);
  const kbGrouped = useMemo(() => PipelineConfigService.getEvidenceObjectsByPADF(), []);

  const [selectedDimId, setSelectedDimId] = useState<string>(canonicalDims[0].id);

  // Merge canonical dimension metadata with scored DB rows cleanly
  const mergedDimensions = useMemo(() => {
    const resultById = new Map<string, PipelinePADFResult>();
    padfResults.forEach((r) => {
      const normalizedId = PipelineConfigService.normalizePADFDimensionId(r.dimension_id);
      resultById.set(normalizedId, r);
    });

    return canonicalDims.map((dim) => {
      const scored = resultById.get(dim.id);
      const expectation = PipelineConfigService.getDimensionExpectation(
        dim.shortCode,
        opportunity.revenue_motion_id || opportunity.revenue_motion_name,
        opportunity.industry_id || opportunity.industry_name
      );

      // Find matching evidence objects in this PADF dimension
      const dimKbList = kbGrouped[dim.id] || [];
      const kbIdsForDim = new Set(dimKbList.map((k: any) => k.evidenceId));
      const matchingEvidence = evidence.filter((ev) => {
        const metaDim = (ev.metadata as any)?.dimension_code;
        if (metaDim && (metaDim === dim.shortCode || metaDim === dim.id)) return true;
        if (ev.evidence_object_id && kbIdsForDim.has(ev.evidence_object_id)) return true;
        if (scored?.evidence_references?.includes(ev.evidence_instance_id)) return true;
        return false;
      });

      const liveCoverage: PipelinePADFResult['evidence_coverage'] =
        matchingEvidence.length === 0
          ? 'NONE'
          : dimKbList.length > 0 && matchingEvidence.length >= dimKbList.length
            ? 'COMPLETE'
            : matchingEvidence.length >= 2
              ? 'PARTIAL'
              : 'MINIMAL';

      return {
        ...dim,
        score: scored?.dimension_score ?? 0,
        assessment_state: scored?.assessment_state || 'UNKNOWN',
        evidence_coverage: evidence.length > 0 ? liveCoverage : (scored?.evidence_coverage || 'NONE'),
        key_strengths: scored?.key_strengths || [],
        key_weaknesses: scored?.key_weaknesses || [],
        business_implications: scored?.business_implications || '',
        recommended_actions: scored?.recommended_actions || [],
        expectation,
        matchingEvidence
      };
    });
  }, [canonicalDims, kbGrouped, padfResults, evidence, opportunity]);

  const radarData = useMemo(
    () =>
      mergedDimensions.map((d) => ({
        subject: d.shortCode,
        fullName: d.name,
        score: d.score,
        weightPct: Math.round(d.weight * 100),
        fullMark: 100
      })),
    [mergedDimensions]
  );

  const selectedDimension =
    mergedDimensions.find((d) => d.id === selectedDimId) || mergedDimensions[0];

  const stateColor = (state: string) => {
    switch (state) {
      case 'STRONG':
        return 'text-emerald-400';
      case 'HEALTHY':
        return 'text-sky-400';
      case 'MODERATE':
        return 'text-amber-400';
      case 'VULNERABLE':
        return 'text-red-400';
      default:
        return 'text-text-secondary';
    }
  };

  const barFill = (score: number) => {
    if (score >= 80) return 'bg-emerald-400';
    if (score >= 65) return 'bg-sky-400';
    if (score >= 45) return 'bg-amber-400';
    return 'bg-red-400';
  };

  return (
    <div className="space-y-6">
      {/* Top Grid: 8-Dimension Radar Chart + Selected Dimension Drill-Down */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Radar Panel */}
        <div className="lg:col-span-5 bg-bg-surface border border-border rounded-2xl p-5 sm:p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-sm font-bold text-text-primary">
                PADF 8-Dimension Health Geometry
              </h3>
              <span className="text-[11px] font-mono tabular-nums text-text-secondary">
                PA1–PA8 · 0–100
              </span>
            </div>
            <p className="text-xs text-text-secondary mt-1">
              Deterministic weighted profile across customer value, buying center, competitive fit, and closeability.
            </p>
          </div>

          <div className="h-[310px] w-full mt-2">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="50%" outerRadius="74%" data={radarData}>
                <PolarGrid stroke="rgba(148,163,184,0.22)" />
                <PolarAngleAxis
                  dataKey="subject"
                  tick={{ fill: '#94a3b8', fontSize: 11, fontFamily: 'monospace' }}
                />
                <PolarRadiusAxis
                  angle={30}
                  domain={[0, 100]}
                  tick={{ fill: '#64748b', fontSize: 10 }}
                  axisLine={false}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderColor: 'rgba(148,163,184,0.25)',
                    borderRadius: '0.75rem',
                    fontSize: '12px',
                    color: '#f8fafc'
                  }}
                  formatter={(value: any, _name: any, item: any) => [
                    `${value}/100 (Weight ${item?.payload?.weightPct ?? 10}%)`,
                    item?.payload?.fullName || 'PADF Score'
                  ]}
                />
                <Radar
                  name="PADF Score"
                  dataKey="score"
                  stroke="#10b981"
                  strokeWidth={2}
                  fill="#10b981"
                  fillOpacity={0.2}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>

          <div className="pt-3 border-t border-border/60 flex items-center justify-between text-[11px] text-text-secondary font-mono tabular-nums">
            <span>Mandatory Gate: PA1–PA4 (60% weight)</span>
            <span>Execution: PA5–PA8 (40% weight)</span>
          </div>
        </div>

        {/* Interactive Dimension Detail & Evidence Drill-Down */}
        <div className="lg:col-span-7 bg-bg-surface border border-border rounded-2xl p-5 sm:p-6 space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 pb-4 border-b border-border/60">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-xs font-mono text-text-secondary">
                <span className="text-accent font-bold">{selectedDimension.shortCode}</span>
                <span aria-hidden="true">·</span>
                <span>Weight {Math.round(selectedDimension.weight * 100)}%</span>
                <span aria-hidden="true">·</span>
                <span>{selectedDimension.mandatory ? 'Mandatory Gate' : 'Secondary Dimension'}</span>
              </div>
              <h3 className="text-lg font-bold text-text-primary">{selectedDimension.name}</h3>
              <p className="text-xs text-text-secondary">{selectedDimension.description}</p>
            </div>

            <div className="flex items-center gap-4 shrink-0 font-mono tabular-nums">
              <div className="text-right">
                <div className="text-[10px] text-text-secondary uppercase">Score</div>
                <div className={`text-2xl font-bold ${stateColor(selectedDimension.assessment_state)}`}>
                  {selectedDimension.score}
                  <span className="text-xs text-text-secondary font-normal">/100</span>
                </div>
              </div>
              <div className="text-right">
                <div className="text-[10px] text-text-secondary uppercase">State</div>
                <div className={`text-xs font-bold ${stateColor(selectedDimension.assessment_state)}`}>
                  {selectedDimension.assessment_state}
                </div>
                <div className="text-[10px] text-text-secondary">
                  Coverage: {selectedDimension.evidence_coverage}
                </div>
              </div>
            </div>
          </div>

          {/* Governance Expectation Strip */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs bg-bg-primary border border-border/70 rounded-xl p-3.5">
            <div>
              <div className="text-[10px] text-text-secondary uppercase">Min Coverage Level</div>
              <div className="font-mono font-semibold text-text-primary mt-0.5">
                {selectedDimension.expectation.minimumCoverageLevel}
              </div>
            </div>
            <div>
              <div className="text-[10px] text-text-secondary uppercase">Freshness Standard</div>
              <div className="font-mono font-semibold text-text-primary mt-0.5">
                {selectedDimension.expectation.freshnessRequirement}
              </div>
            </div>
            <div>
              <div className="text-[10px] text-text-secondary uppercase">Captured Evidence</div>
              <div className="font-mono tabular-nums font-semibold text-accent mt-0.5">
                {selectedDimension.matchingEvidence.length} / {(kbGrouped[selectedDimension.id] || []).length} items
              </div>
            </div>
          </div>

          {/* Strengths / Weaknesses & Business Implications */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="text-xs font-semibold text-emerald-400 flex items-center gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5" />
                <span>Verified Strengths</span>
              </div>
              {selectedDimension.key_strengths.length > 0 ? (
                <ul className="space-y-1.5 text-xs text-text-secondary">
                  {selectedDimension.key_strengths.map((s, idx) => (
                    <li key={idx} className="leading-relaxed">
                      • {s}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-xs text-text-secondary italic">No strengths logged for this dimension yet.</p>
              )}
            </div>

            <div className="space-y-2">
              <div className="text-xs font-semibold text-amber-400 flex items-center gap-1.5">
                <AlertTriangle className="h-3.5 w-3.5" />
                <span>Gaps & Vulnerabilities</span>
              </div>
              {selectedDimension.key_weaknesses.length > 0 ? (
                <ul className="space-y-1.5 text-xs text-text-secondary">
                  {selectedDimension.key_weaknesses.map((w, idx) => (
                    <li key={idx} className="leading-relaxed">
                      • {w}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-xs text-text-secondary italic">No critical weaknesses identified.</p>
              )}
            </div>
          </div>

          {selectedDimension.business_implications && (
            <div className="text-xs text-text-secondary bg-bg-primary border border-border/60 rounded-xl p-3.5 leading-relaxed">
              <span className="font-semibold text-text-primary">Business Implication: </span>
              {selectedDimension.business_implications}
            </div>
          )}

          {/* Supporting Evidence Records List */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between gap-2">
              <div className="text-xs font-semibold text-text-primary flex items-center gap-1.5">
                <FileText className="h-3.5 w-3.5 text-accent" />
                <span>Supporting Evidence Records ({selectedDimension.matchingEvidence.length})</span>
              </div>
              {onEditDimensionEvidence && (
                <button
                  type="button"
                  onClick={() => onEditDimensionEvidence(selectedDimension.id)}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-accent hover:underline whitespace-nowrap shrink-0 cursor-pointer"
                >
                  <span>Update {selectedDimension.shortCode} Evidence</span>
                  <ArrowUpRight className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            {selectedDimension.matchingEvidence.length === 0 ? (
              <div className="p-4 bg-bg-primary border border-border/60 rounded-xl text-xs text-text-secondary">
                No evidence recorded yet for {selectedDimension.shortCode}. Add evidence in the intake form to improve assessment confidence.
              </div>
            ) : (
              <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                {selectedDimension.matchingEvidence.map((ev) => (
                  <div
                    key={ev.evidence_instance_id}
                    className="p-3 bg-bg-primary border border-border/70 rounded-xl space-y-1.5"
                  >
                    <div className="flex items-center justify-between gap-2 text-[11px] font-mono">
                      <span className="text-accent font-semibold">
                        {ev.evidence_object_id || ev.evidence_type}
                      </span>
                      <div className="flex items-center gap-2.5 text-text-secondary tabular-nums">
                        <span className="inline-flex items-center gap-1">
                          {ev.customer_confirmed ? (
                            <ShieldCheck className="h-3 w-3 text-emerald-400" />
                          ) : (
                            <Clock className="h-3 w-3 text-amber-400" />
                          )}
                          {ev.customer_confirmed ? 'Confirmed' : 'Unconfirmed'}
                        </span>
                        <span aria-hidden="true">·</span>
                        <span>KB Conf: {ev.evidence_confidence}%</span>
                        <span aria-hidden="true">·</span>
                        <span>{ev.source_type}</span>
                      </div>
                    </div>
                    <p className="text-xs text-text-primary leading-relaxed">
                      {ev.evidence_statement}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* All 8 Clickable Dimension Scorecards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {mergedDimensions.map((dim) => {
          const isSelected = dim.id === selectedDimension.id;
          return (
            <button
              key={dim.id}
              type="button"
              onClick={() => setSelectedDimId(dim.id)}
              className={`text-left p-4 rounded-2xl border transition-colors cursor-pointer space-y-2.5 ${
                isSelected
                  ? 'bg-bg-surface border-accent'
                  : 'bg-bg-surface border-border hover:border-accent/50'
              }`}
            >
              <div className="flex items-center justify-between gap-2 text-xs font-mono">
                <span className="font-bold text-text-primary">
                  {dim.shortCode} · {Math.round(dim.weight * 100)}%
                </span>
                <span className={`font-bold tabular-nums ${stateColor(dim.assessment_state)}`}>
                  {dim.score}/100
                </span>
              </div>

              <div className="text-xs font-semibold text-text-primary line-clamp-1">
                {dim.name}
              </div>

              {/* Clean Score Progress Bar */}
              <div className="h-1.5 w-full bg-bg-primary rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${barFill(dim.score)}`}
                  style={{ width: `${Math.max(4, Math.min(100, dim.score))}%` }}
                />
              </div>

              <div className="flex items-center justify-between text-[11px] text-text-secondary font-mono tabular-nums">
                <span>{dim.assessment_state}</span>
                <span>{dim.matchingEvidence.length} evidence</span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default PADFDimensionHealthView;
