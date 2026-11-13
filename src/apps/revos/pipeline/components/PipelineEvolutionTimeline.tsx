import React, { useMemo, useState, useEffect } from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend
} from 'recharts';
import {
  History,
  ArrowRight,
  TrendingUp,
  TrendingDown,
  Minus,
  ShieldCheck
} from 'lucide-react';
import { PipelineAssessmentSnapshot } from '../../types/pipeline';
import { PipelineConfigService } from '../services/PipelineConfigService';

export interface PipelineEvolutionTimelineProps {
  snapshots: PipelineAssessmentSnapshot[];
}

export const PipelineEvolutionTimeline: React.FC<PipelineEvolutionTimelineProps> = ({
  snapshots
}) => {
  const canonicalDims = useMemo(() => PipelineConfigService.getCanonicalPADFDimensions(), []);

  const ordered = useMemo(
    () => [...snapshots].sort((a, b) => a.snapshot_sequence - b.snapshot_sequence),
    [snapshots]
  );

  const [baselineSeq, setBaselineSeq] = useState<number>(
    ordered.length >= 2 ? ordered[ordered.length - 2].snapshot_sequence : ordered[0]?.snapshot_sequence || 1
  );
  const [targetSeq, setTargetSeq] = useState<number>(
    ordered[ordered.length - 1]?.snapshot_sequence || 1
  );

  useEffect(() => {
    if (ordered.length >= 2) {
      setBaselineSeq(ordered[ordered.length - 2].snapshot_sequence);
      setTargetSeq(ordered[ordered.length - 1].snapshot_sequence);
    } else if (ordered.length === 1) {
      setBaselineSeq(ordered[0].snapshot_sequence);
      setTargetSeq(ordered[0].snapshot_sequence);
    }
  }, [ordered]);

  const chartData = useMemo(
    () =>
      ordered.map((snap) => {
        const assess = snap.full_snapshot_payload?.assessment;
        return {
          name: `#${snap.snapshot_sequence}`,
          dateLabel: snap.snapshot_timestamp
            ? new Date(snap.snapshot_timestamp).toLocaleDateString()
            : `Run ${snap.snapshot_sequence}`,
          baseWinability: assess?.base_winability ?? 0,
          riskAdjustedWinability: assess?.risk_adjusted_winability ?? 0,
          confidence: assess?.assessment_confidence ?? 0,
          health: assess?.pipeline_health || 'MODERATE'
        };
      }),
    [ordered]
  );

  const baselineSnap = ordered.find((s) => s.snapshot_sequence === baselineSeq) || ordered[0];
  const targetSnap =
    ordered.find((s) => s.snapshot_sequence === targetSeq) || ordered[ordered.length - 1];

  const padfComparison = useMemo(() => {
    if (!baselineSnap || !targetSnap) return [];
    const baseMap = new Map<string, number>();
    (baselineSnap.full_snapshot_payload?.padf_results || []).forEach((r) => {
      baseMap.set(PipelineConfigService.normalizePADFDimensionId(r.dimension_id), r.dimension_score);
    });
    const targetMap = new Map<string, number>();
    (targetSnap.full_snapshot_payload?.padf_results || []).forEach((r) => {
      targetMap.set(PipelineConfigService.normalizePADFDimensionId(r.dimension_id), r.dimension_score);
    });

    return canonicalDims.map((dim) => {
      const s1 = baseMap.get(dim.id) ?? 0;
      const s2 = targetMap.get(dim.id) ?? 0;
      return {
        ...dim,
        scoreA: s1,
        scoreB: s2,
        delta: s2 - s1
      };
    });
  }, [baselineSnap, targetSnap, canonicalDims]);

  if (ordered.length === 0) {
    return (
      <div className="bg-bg-surface border border-border rounded-2xl p-10 text-center space-y-2">
        <History className="h-8 w-8 text-text-secondary/50 mx-auto" />
        <div className="text-sm font-bold text-text-primary">No Historical Snapshots Yet</div>
        <p className="text-xs text-text-secondary">
          Execute an assessment or reassessment to generate immutable point-in-time pipeline snapshots.
        </p>
      </div>
    );
  }

  const assessA = baselineSnap?.full_snapshot_payload?.assessment;
  const assessB = targetSnap?.full_snapshot_payload?.assessment;
  const baseDelta = (assessB?.base_winability ?? 0) - (assessA?.base_winability ?? 0);
  const riskAdjDelta =
    (assessB?.risk_adjusted_winability ?? 0) - (assessA?.risk_adjusted_winability ?? 0);

  const DeltaBadge = ({ val }: { val: number }) => {
    if (val > 0) {
      return (
        <span className="inline-flex items-center gap-0.5 text-emerald-400 font-mono tabular-nums font-bold">
          <TrendingUp className="h-3.5 w-3.5" />+{val}
        </span>
      );
    }
    if (val < 0) {
      return (
        <span className="inline-flex items-center gap-0.5 text-red-400 font-mono tabular-nums font-bold">
          <TrendingDown className="h-3.5 w-3.5" />
          {val}
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-0.5 text-text-secondary font-mono tabular-nums">
        <Minus className="h-3 w-3" />0
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Winability Trajectory Line Chart */}
      <div className="bg-bg-surface border border-border rounded-2xl p-5 sm:p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-sm font-bold text-text-primary flex items-center gap-2">
              <History className="h-4 w-4 text-accent" />
              <span>Winability Trajectory ({ordered.length} Assessment Snapshots)</span>
            </h3>
            <p className="text-xs text-text-secondary">
              Tracks Base Winability vs. Risk-Adjusted Winability momentum across reassessment cycles.
            </p>
          </div>
        </div>

        <div className="h-[260px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 5 }}>
              <CartesianGrid stroke="rgba(148,163,184,0.14)" strokeDasharray="3 3" />
              <XAxis
                dataKey="name"
                tick={{ fill: '#94a3b8', fontSize: 11, fontFamily: 'monospace' }}
              />
              <YAxis
                domain={[0, 100]}
                tick={{ fill: '#94a3b8', fontSize: 11, fontFamily: 'monospace' }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#0f172a',
                  borderColor: 'rgba(148,163,184,0.25)',
                  borderRadius: '0.75rem',
                  fontSize: '12px',
                  color: '#f8fafc'
                }}
              />
              <Legend wrapperStyle={{ fontSize: '12px' }} />
              <Line
                type="monotone"
                dataKey="baseWinability"
                name="Base Winability (%)"
                stroke="#38bdf8"
                strokeWidth={2}
                dot={{ r: 4 }}
              />
              <Line
                type="monotone"
                dataKey="riskAdjustedWinability"
                name="Risk-Adjusted Winability (%)"
                stroke="#10b981"
                strokeWidth={2.5}
                dot={{ r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Point-in-Time Snapshot Delta Comparison */}
      <div className="bg-bg-surface border border-border rounded-2xl p-5 sm:p-6 space-y-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-border/60">
          <div>
            <h3 className="text-sm font-bold text-text-primary">
              Point-in-Time Snapshot Comparison
            </h3>
            <p className="text-xs text-text-secondary">
              Compare PADF scores, risk pressure, and governance version trace across two snapshots.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs">
            <select
              value={baselineSeq}
              onChange={(e) => setBaselineSeq(Number(e.target.value))}
              className="px-3 py-1.5 bg-bg-primary border border-border rounded-xl font-mono text-text-primary focus:outline-none focus:border-accent"
            >
              {ordered.map((s) => (
                <option key={s.snapshot_id} value={s.snapshot_sequence}>
                  Baseline #{s.snapshot_sequence} (
                  {new Date(s.snapshot_timestamp).toLocaleDateString()})
                </option>
              ))}
            </select>
            <ArrowRight className="h-3.5 w-3.5 text-text-secondary" />
            <select
              value={targetSeq}
              onChange={(e) => setTargetSeq(Number(e.target.value))}
              className="px-3 py-1.5 bg-bg-primary border border-border rounded-xl font-mono text-text-primary focus:outline-none focus:border-accent"
            >
              {ordered.map((s) => (
                <option key={s.snapshot_id} value={s.snapshot_sequence}>
                  Target #{s.snapshot_sequence} (
                  {new Date(s.snapshot_timestamp).toLocaleDateString()})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Top Delta Strip */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 bg-bg-primary border border-border/70 rounded-xl space-y-1">
            <div className="text-[11px] text-text-secondary">Base Winability Delta</div>
            <div className="flex items-center justify-between font-mono tabular-nums text-sm">
              <span className="text-text-primary">
                {assessA?.base_winability ?? '--'}% → {assessB?.base_winability ?? '--'}%
              </span>
              <DeltaBadge val={baseDelta} />
            </div>
          </div>

          <div className="p-4 bg-bg-primary border border-border/70 rounded-xl space-y-1">
            <div className="text-[11px] text-text-secondary">Risk-Adjusted Winability Delta</div>
            <div className="flex items-center justify-between font-mono tabular-nums text-sm">
              <span className="text-text-primary">
                {assessA?.risk_adjusted_winability ?? '--'}% →{' '}
                {assessB?.risk_adjusted_winability ?? '--'}%
              </span>
              <DeltaBadge val={riskAdjDelta} />
            </div>
          </div>

          <div className="p-4 bg-bg-primary border border-border/70 rounded-xl space-y-1">
            <div className="text-[11px] text-text-secondary">Health Status Shift</div>
            <div className="font-mono text-sm text-text-primary">
              {assessA?.pipeline_health || '--'} →{' '}
              <span className="text-accent font-bold">{assessB?.pipeline_health || '--'}</span>
            </div>
          </div>
        </div>

        {/* PADF Dimension Delta Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-border/70 text-text-secondary font-mono">
                <th className="py-2.5 pr-4">Dimension</th>
                <th className="py-2.5 px-3 text-right">Baseline (#{baselineSeq})</th>
                <th className="py-2.5 px-3 text-right">Target (#{targetSeq})</th>
                <th className="py-2.5 pl-3 text-right">Delta</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40">
              {padfComparison.map((row) => (
                <tr key={row.id}>
                  <td className="py-2.5 pr-4 text-text-primary font-medium">
                    <span className="font-mono text-accent mr-2">{row.shortCode}</span>
                    {row.name}
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono tabular-nums text-text-secondary">
                    {row.scoreA}
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono tabular-nums text-text-primary font-semibold">
                    {row.scoreB}
                  </td>
                  <td className="py-2.5 pl-3 text-right">
                    <DeltaBadge val={row.delta} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Governance Version Traceability */}
        {assessB && (
          <div className="p-3.5 bg-bg-primary border border-border/60 rounded-xl flex flex-wrap items-center gap-x-5 gap-y-1.5 text-[11px] font-mono text-text-secondary">
            <span className="inline-flex items-center gap-1 text-text-primary font-semibold">
              <ShieldCheck className="h-3.5 w-3.5 text-accent" />
              Audit Trace (#{targetSeq}):
            </span>
            <span>Config v{assessB.configuration_version}</span>
            <span>KB v{assessB.evidence_kb_version}</span>
            <span>Rules v{assessB.rules_version}</span>
            <span>Model: {assessB.model_identifier}</span>
            <span>Trigger: {assessB.trigger_type}</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default PipelineEvolutionTimeline;
