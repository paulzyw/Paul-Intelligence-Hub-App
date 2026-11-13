import React, { useMemo, useState } from 'react';
import {
  ShieldCheck,
  AlertTriangle,
  RefreshCw,
  CheckCircle2,
  GitBranch,
  Database,
  Link2
} from 'lucide-react';
import {
  PipelineOpportunity,
  PipelineInheritance,
  PipelineAssessment,
  PipelineEvidence,
  PipelineEvidenceRelationship,
  PipelinePADFResult,
  PipelineSWOTResult,
  PipelineRisk,
  PipelineStrategy,
  PipelineAction,
  PipelineAssessmentSnapshot
} from '../../types/pipeline';
import { PipelineConfigService } from '../services/PipelineConfigService';
import { PipelineDataService } from '../services/PipelineDataService';

export interface PipelineGovernanceAuditPanelProps {
  opportunity: PipelineOpportunity;
  inheritance: PipelineInheritance | null;
  assessment: PipelineAssessment | null;
  evidence: PipelineEvidence[];
  evidenceRelationships: PipelineEvidenceRelationship[];
  padfResults: PipelinePADFResult[];
  swotResults: PipelineSWOTResult[];
  risks: PipelineRisk[];
  strategies: PipelineStrategy[];
  actions: PipelineAction[];
  snapshots: PipelineAssessmentSnapshot[];
  reassessmentAudit: {
    reassessmentRequired: boolean;
    reasons: string[];
    staleEvidenceIds: string[];
    updatedEvidenceCount: number;
    updatedRiskCount: number;
    updatedActionCount: number;
    unconfirmedEvidenceCount: number;
  };
  onInheritanceRevalidated?: (updated: PipelineInheritance) => void;
  onTriggerReassessment?: () => void;
}

export const PipelineGovernanceAuditPanel: React.FC<PipelineGovernanceAuditPanelProps> = ({
  opportunity,
  inheritance,
  assessment,
  evidence,
  evidenceRelationships,
  padfResults,
  swotResults,
  risks,
  strategies,
  actions,
  snapshots,
  reassessmentAudit,
  onInheritanceRevalidated,
  onTriggerReassessment
}) => {
  const [relFilter, setRelFilter] = useState<'ALL' | 'SUPPORTS' | 'CONTRADICT_GAP' | 'QUALIFIES'>('ALL');
  const [revalidating, setRevalidating] = useState(false);
  const [syncingRels, setSyncingRels] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const frameworkVersions = useMemo(() => PipelineConfigService.getFrameworkVersions(), []);
  const swotResolution = useMemo(
    () =>
      PipelineConfigService.resolveActiveSWOTFactors(
        opportunity.revenue_motion_id || opportunity.revenue_motion_name,
        opportunity.industry_id || opportunity.industry_name
      ),
    [opportunity]
  );

  const confirmedCount = useMemo(
    () => evidence.filter((ev) => ev.customer_confirmed).length,
    [evidence]
  );

  const filteredRelationships = useMemo(() => {
    return evidenceRelationships.filter((r) => {
      if (relFilter === 'SUPPORTS') return r.runtime_relationship === 'SUPPORTS';
      if (relFilter === 'CONTRADICT_GAP') {
        return r.runtime_relationship === 'CONTRADICTS' || r.runtime_relationship === 'GAP_SIGNAL';
      }
      if (relFilter === 'QUALIFIES') {
        return r.runtime_relationship === 'QUALIFIES' || r.runtime_relationship === 'CONTEXTUALIZES';
      }
      return true;
    });
  }, [evidenceRelationships, relFilter]);

  const handleRevalidateInheritance = async () => {
    if (!inheritance?.inheritance_id) return;
    setRevalidating(true);
    setStatusMessage(null);
    const updated = await PipelineDataService.revalidateInheritance(
      inheritance.inheritance_id,
      'VALIDATED',
      `Revalidated at Pipeline stage (${opportunity.pipeline_stage})`
    );
    setRevalidating(false);
    if (updated) {
      setStatusMessage('Upstream PADIF v1.0 inheritance record revalidated and timestamped.');
      if (onInheritanceRevalidated) onInheritanceRevalidated(updated);
    }
  };

  const handleRebuildRelationships = async () => {
    setSyncingRels(true);
    setStatusMessage(null);
    const synced = await PipelineDataService.syncEvidenceRelationships(
      opportunity.pipeline_id,
      evidence
    );
    setSyncingRels(false);
    setStatusMessage(`Synchronized ${synced.length} approved evidence-to-SWOT/PADF relationship links.`);
  };

  const persistenceMatrix = [
    { table: 'pipeline_opportunities', count: 1, required: true },
    { table: 'pipeline_inheritance', count: inheritance ? 1 : 0, required: true },
    { table: 'pipeline_evidence', count: evidence.length, required: true },
    { table: 'pipeline_evidence_relationships', count: evidenceRelationships.length, required: false },
    { table: 'pipeline_assessments', count: assessment ? 1 : 0, required: true },
    { table: 'pipeline_padf_results', count: padfResults.length, required: true },
    { table: 'pipeline_swot_results', count: swotResults.length, required: true },
    { table: 'pipeline_risks', count: risks.length, required: false },
    { table: 'pipeline_strategies', count: strategies.length, required: false },
    { table: 'pipeline_actions', count: actions.length, required: false },
    { table: 'pipeline_assessment_snapshots', count: snapshots.length, required: true }
  ];

  return (
    <div className="space-y-6">
      {statusMessage && (
        <div className="px-4 py-2.5 bg-bg-surface border border-emerald-500/40 rounded-xl text-xs text-emerald-400 flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          <span>{statusMessage}</span>
        </div>
      )}

      {/* Continuous Reassessment Status Card */}
      <div className="bg-bg-surface border border-border rounded-2xl p-5 sm:p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border/60">
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-text-primary flex items-center gap-2">
              {reassessmentAudit.reassessmentRequired ? (
                <AlertTriangle className="h-4 w-4 text-amber-400" />
              ) : (
                <ShieldCheck className="h-4 w-4 text-emerald-400" />
              )}
              <span>
                Continuous Reassessment State:{' '}
                <span
                  className={
                    reassessmentAudit.reassessmentRequired ? 'text-amber-400' : 'text-emerald-400'
                  }
                >
                  {reassessmentAudit.reassessmentRequired ? 'REASSESSMENT RECOMMENDED' : 'CURRENT & SYNCHRONIZED'}
                </span>
              </span>
            </h3>
            <p className="text-xs text-text-secondary">
              Monitors evidence updates, stale proof thresholds (&gt;30d), risk changes, and action progress since the last snapshot.
            </p>
          </div>

          {onTriggerReassessment && (
            <button
              type="button"
              onClick={onTriggerReassessment}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-accent hover:bg-accent-hover text-black font-bold text-xs rounded-xl transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              <span>Open Evidence Intake & Reassess</span>
            </button>
          )}
        </div>

        {reassessmentAudit.reasons.length > 0 ? (
          <ul className="space-y-1.5 text-xs text-amber-300">
            {reassessmentAudit.reasons.map((r, i) => (
              <li key={i}>• {r}</li>
            ))}
          </ul>
        ) : (
          <div className="text-xs text-text-secondary">
            Latest Assessment #{assessment?.assessment_sequence ?? '--'} reflects all persisted evidence, risk statuses, and action updates.
          </div>
        )}
      </div>

      {/* Authoritative Boundary & PADIF / Config Governance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* PADIF Provenance & Revalidation */}
        <div className="bg-bg-surface border border-border rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between gap-2 pb-3 border-b border-border/60">
            <h3 className="text-sm font-bold text-text-primary flex items-center gap-2">
              <GitBranch className="h-4 w-4 text-accent" />
              <span>PADIF v1.0 Qualification Inheritance</span>
            </h3>
            {inheritance && (
              <button
                type="button"
                onClick={handleRevalidateInheritance}
                disabled={revalidating}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-bg-primary border border-border hover:border-accent/50 rounded-xl text-[11px] font-semibold text-text-primary cursor-pointer whitespace-nowrap"
              >
                <RefreshCw className={`h-3 w-3 ${revalidating ? 'animate-spin text-accent' : ''}`} />
                <span>Revalidate Baseline</span>
              </button>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs font-mono tabular-nums">
            <div className="p-3 bg-bg-primary border border-border/70 rounded-xl">
              <div className="text-[10px] text-text-secondary">Validation Status</div>
              <div className="font-bold text-emerald-400 mt-0.5">
                {inheritance?.validation_status || 'MISSING'}
              </div>
            </div>
            <div className="p-3 bg-bg-primary border border-border/70 rounded-xl">
              <div className="text-[10px] text-text-secondary">Upstream OQ Score</div>
              <div className="font-bold text-text-primary mt-0.5">
                {inheritance?.qualification_score ?? '--'}/100 ({inheritance?.qualification_decision || '--'})
              </div>
            </div>
            <div className="p-3 bg-bg-primary border border-border/70 rounded-xl">
              <div className="text-[10px] text-text-secondary">Canonical Motion</div>
              <div className="text-[11px] font-semibold text-text-primary mt-0.5 truncate">
                {swotResolution.canonicalRevenueMotionId}
              </div>
            </div>
            <div className="p-3 bg-bg-primary border border-border/70 rounded-xl">
              <div className="text-[10px] text-text-secondary">Canonical Industry</div>
              <div className="text-[11px] font-semibold text-text-primary mt-0.5 truncate">
                {swotResolution.canonicalIndustryId}
              </div>
            </div>
          </div>

          <div className="text-[11px] font-mono text-text-secondary space-y-1">
            <div>
              Active SWOT Resolution: {swotResolution.universalFactors.length} Universal +{' '}
              {swotResolution.revenueMotionFactors.length} Motion +{' '}
              {swotResolution.industryFactors.length} Industry ={' '}
              <strong className="text-text-primary">{swotResolution.active16Factors.length} Factors</strong>
            </div>
            <div>
              Evidence Provenance: {confirmedCount} Customer Confirmed ·{' '}
              {reassessmentAudit.unconfirmedEvidenceCount} Unconfirmed ·{' '}
              {reassessmentAudit.staleEvidenceIds.length} Stale
            </div>
            {inheritance?.revalidated_at && (
              <div>Last Revalidated: {new Date(inheritance.revalidated_at).toLocaleString()}</div>
            )}
          </div>
        </div>

        {/* 11-Table Supabase Persistence & Asset Version Audit */}
        <div className="bg-bg-surface border border-border rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between gap-2 pb-3 border-b border-border/60">
            <h3 className="text-sm font-bold text-text-primary flex items-center gap-2">
              <Database className="h-4 w-4 text-accent" />
              <span>11-Table Ledger & Version Governance</span>
            </h3>
            <span className="text-[11px] font-mono text-text-secondary">
              Config v{frameworkVersions.industry_configuration_version} · KB v{frameworkVersions.evidence_kb_version} · Rules v{frameworkVersions.rules_version}
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-[11px] font-mono tabular-nums">
            {persistenceMatrix.map((row) => {
              const healthy = !row.required || row.count > 0;
              return (
                <div
                  key={row.table}
                  className="p-2.5 bg-bg-primary border border-border/70 rounded-xl flex items-center justify-between gap-2"
                >
                  <span className="text-text-secondary truncate" title={row.table}>
                    {row.table.replace('pipeline_', '')}
                  </span>
                  <span className={`font-bold ${healthy ? 'text-emerald-400' : 'text-amber-400'}`}>
                    {row.count}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Persisted Evidence-to-SWOT/PADF Relationship Ledger */}
      <div className="bg-bg-surface border border-border rounded-2xl p-5 sm:p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border/60">
          <div>
            <h3 className="text-sm font-bold text-text-primary flex items-center gap-2">
              <Link2 className="h-4 w-4 text-accent" />
              <span>Evidence Relationship & Lineage Audit ({evidenceRelationships.length})</span>
            </h3>
            <p className="text-xs text-text-secondary">
              Runtime Evidence-to-SWOT/PADF links governed by Evidence KB v1.1 approved mappings.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <select
              value={relFilter}
              onChange={(e) => setRelFilter(e.target.value as any)}
              className="px-3 py-1.5 bg-bg-primary border border-border rounded-xl text-xs text-text-primary focus:outline-none focus:border-accent"
            >
              <option value="ALL">All Relationships</option>
              <option value="SUPPORTS">SUPPORTS</option>
              <option value="QUALIFIES">QUALIFIES / CONTEXTUALIZES</option>
              <option value="CONTRADICT_GAP">CONTRADICTS / GAP_SIGNAL</option>
            </select>

            <button
              type="button"
              onClick={handleRebuildRelationships}
              disabled={syncingRels || evidence.length === 0}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-bg-primary border border-border hover:border-accent/50 rounded-xl text-xs font-semibold text-text-primary cursor-pointer whitespace-nowrap disabled:opacity-50"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${syncingRels ? 'animate-spin text-accent' : ''}`} />
              <span>Sync Links</span>
            </button>
          </div>
        </div>

        {filteredRelationships.length === 0 ? (
          <div className="py-6 text-center text-xs text-text-secondary">
            No persisted evidence relationships match the active filter. Click &quot;Sync Links&quot; after saving evidence.
          </div>
        ) : (
          <div className="overflow-x-auto max-h-72">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-border/70 text-text-secondary font-mono">
                  <th className="py-2 pr-3">Evidence Instance</th>
                  <th className="py-2 px-3">Target Factor / PADF</th>
                  <th className="py-2 px-3">Strength</th>
                  <th className="py-2 px-3">Relationship</th>
                  <th className="py-2 pl-3">Polarity</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40 font-mono text-[11px]">
                {filteredRelationships.slice(0, 60).map((rel) => (
                  <tr key={rel.relationship_id}>
                    <td className="py-2 pr-3 text-text-primary truncate max-w-[190px]">
                      {rel.evidence_instance_id}
                    </td>
                    <td className="py-2 px-3 text-text-secondary">
                      {rel.target_factor_id || rel.target_dimension_id || '--'}
                    </td>
                    <td className="py-2 px-3 text-text-secondary">{rel.mapping_relevance}</td>
                    <td className="py-2 px-3 font-semibold text-accent">{rel.runtime_relationship}</td>
                    <td
                      className={`py-2 pl-3 font-semibold ${
                        rel.runtime_polarity === 'POSITIVE'
                          ? 'text-emerald-400'
                          : rel.runtime_polarity === 'NEGATIVE'
                            ? 'text-red-400'
                            : 'text-amber-400'
                      }`}
                    >
                      {rel.runtime_polarity}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default PipelineGovernanceAuditPanel;
