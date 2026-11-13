import React, { useMemo, useState } from 'react';
import {
  AlertTriangle,
  ShieldAlert,
  CheckCircle2,
  User,
  Save,
  RefreshCw
} from 'lucide-react';
import { PipelineRisk } from '../../types/pipeline';
import { PipelineDataService } from '../services/PipelineDataService';

export interface RiskIntelligenceRegisterProps {
  risks: PipelineRisk[];
  onRiskUpdated?: (updatedRisk: PipelineRisk) => void;
}

export const RiskIntelligenceRegister: React.FC<RiskIntelligenceRegisterProps> = ({
  risks,
  onRiskUpdated
}) => {
  const [severityFilter, setSeverityFilter] = useState<'ALL' | PipelineRisk['severity']>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | PipelineRisk['risk_status']>('ALL');
  const [ownerDrafts, setOwnerDrafts] = useState<Record<string, string>>({});
  const [savingId, setSavingId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  const filteredRisks = useMemo(() => {
    return risks.filter((r) => {
      if (severityFilter !== 'ALL' && r.severity !== severityFilter) return false;
      if (statusFilter !== 'ALL' && r.risk_status !== statusFilter) return false;
      return true;
    });
  }, [risks, severityFilter, statusFilter]);

  const counts = useMemo(() => {
    return {
      total: risks.length,
      critical: risks.filter((r) => r.severity === 'CRITICAL').length,
      high: risks.filter((r) => r.severity === 'HIGH').length,
      active: risks.filter((r) => r.risk_status === 'ACTIVE' || r.risk_status === 'MITIGATING').length,
      resolved: risks.filter((r) => r.risk_status === 'RESOLVED').length
    };
  }, [risks]);

  const severityColor = (sev: PipelineRisk['severity']) => {
    switch (sev) {
      case 'CRITICAL':
        return 'text-red-400';
      case 'HIGH':
        return 'text-amber-400';
      case 'MEDIUM':
        return 'text-sky-400';
      default:
        return 'text-text-secondary';
    }
  };

  const handleStatusChange = async (risk: PipelineRisk, newStatus: PipelineRisk['risk_status']) => {
    setSavingId(risk.risk_instance_id);
    setFeedback(null);
    const ownerVal = ownerDrafts[risk.risk_instance_id] ?? risk.owner;
    const ok = await PipelineDataService.updateRiskStatus(
      risk.risk_instance_id,
      newStatus,
      ownerVal
    );
    setSavingId(null);

    if (ok && onRiskUpdated) {
      onRiskUpdated({ ...risk, risk_status: newStatus, owner: ownerVal });
      setFeedback(`Updated ${risk.risk_id} status to ${newStatus}.`);
    }
  };

  const handleOwnerSave = async (risk: PipelineRisk) => {
    const draftOwner = (ownerDrafts[risk.risk_instance_id] ?? risk.owner ?? '').trim();
    setSavingId(risk.risk_instance_id);
    setFeedback(null);
    const ok = await PipelineDataService.updateRiskStatus(
      risk.risk_instance_id,
      risk.risk_status,
      draftOwner
    );
    setSavingId(null);
    if (ok && onRiskUpdated) {
      onRiskUpdated({ ...risk, owner: draftOwner });
      setFeedback(`Saved mitigation owner for ${risk.risk_id}.`);
    }
  };

  return (
    <div className="space-y-5">
      {/* Portfolio Risk Summary & Filters */}
      <div className="bg-bg-surface border border-border rounded-2xl p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-6 font-mono tabular-nums text-xs">
          <div>
            <span className="text-text-secondary">Total Formal Risks: </span>
            <strong className="text-text-primary">{counts.total}</strong>
          </div>
          <div>
            <span className="text-text-secondary">Critical: </span>
            <strong className="text-red-400">{counts.critical}</strong>
          </div>
          <div>
            <span className="text-text-secondary">High: </span>
            <strong className="text-amber-400">{counts.high}</strong>
          </div>
          <div>
            <span className="text-text-secondary">Open / Mitigating: </span>
            <strong className="text-text-primary">{counts.active}</strong>
          </div>
          <div>
            <span className="text-text-secondary">Resolved: </span>
            <strong className="text-emerald-400">{counts.resolved}</strong>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <select
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value as any)}
            className="px-3 py-1.5 bg-bg-primary border border-border rounded-xl text-xs text-text-primary focus:outline-none focus:border-accent"
          >
            <option value="ALL">All Severities</option>
            <option value="CRITICAL">Critical</option>
            <option value="HIGH">High</option>
            <option value="MEDIUM">Medium</option>
            <option value="LOW">Low</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="px-3 py-1.5 bg-bg-primary border border-border rounded-xl text-xs text-text-primary focus:outline-none focus:border-accent"
          >
            <option value="ALL">All Statuses</option>
            <option value="ACTIVE">Active</option>
            <option value="MITIGATING">Mitigating</option>
            <option value="RESOLVED">Resolved</option>
            <option value="ACCEPTED">Accepted</option>
          </select>
        </div>
      </div>

      {feedback && (
        <div className="px-4 py-2.5 bg-bg-surface border border-emerald-500/40 rounded-xl text-xs text-emerald-400 flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          <span>{feedback}</span>
        </div>
      )}

      {/* Risk Register List */}
      {filteredRisks.length === 0 ? (
        <div className="bg-bg-surface border border-border rounded-2xl p-10 text-center space-y-2">
          <ShieldAlert className="h-8 w-8 text-text-secondary/50 mx-auto" />
          <div className="text-sm font-bold text-text-primary">No Formal Risks Match Filters</div>
          <p className="text-xs text-text-secondary">
            {risks.length === 0
              ? 'No formal deal risks were flagged in the latest assessment.'
              : 'Adjust severity or status filters to inspect other registered risks.'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredRisks.map((risk) => {
            const isSaving = savingId === risk.risk_instance_id;
            const ownerVal = ownerDrafts[risk.risk_instance_id] ?? risk.owner ?? 'Deal Owner';

            return (
              <div
                key={risk.risk_instance_id}
                className="bg-bg-surface border border-border rounded-2xl p-5 space-y-4"
              >
                <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                  <div className="space-y-1.5 flex-1">
                    <div className="flex flex-wrap items-center gap-2.5 text-xs font-mono">
                      <span className={`font-bold flex items-center gap-1 ${severityColor(risk.severity)}`}>
                        <AlertTriangle className="h-3.5 w-3.5" />
                        {risk.severity}
                      </span>
                      <span className="text-text-secondary" aria-hidden="true">·</span>
                      <span className="text-text-secondary">{risk.risk_id}</span>
                      <span className="text-text-secondary" aria-hidden="true">·</span>
                      <span className="text-text-primary font-semibold">{risk.risk_category}</span>
                      <span className="text-text-secondary" aria-hidden="true">·</span>
                      <span className="text-text-secondary">
                        Likelihood: {risk.likelihood} / Impact: {risk.impact}
                      </span>
                    </div>

                    <h4 className="text-sm font-bold text-text-primary leading-snug">
                      {risk.risk_description}
                    </h4>
                  </div>

                  {/* Interactive Risk Controls */}
                  <div className="flex flex-wrap items-center gap-2.5 shrink-0">
                    <div className="flex items-center gap-1.5 bg-bg-primary border border-border rounded-xl px-2.5 py-1">
                      <User className="h-3.5 w-3.5 text-text-secondary" />
                      <input
                        type="text"
                        value={ownerVal}
                        onChange={(e) =>
                          setOwnerDrafts((prev) => ({
                            ...prev,
                            [risk.risk_instance_id]: e.target.value
                          }))
                        }
                        className="bg-transparent text-xs text-text-primary focus:outline-none w-32"
                        placeholder="Owner..."
                      />
                      <button
                        type="button"
                        onClick={() => handleOwnerSave(risk)}
                        disabled={isSaving}
                        title="Save owner"
                        className="text-text-secondary hover:text-accent cursor-pointer"
                      >
                        <Save className="h-3.5 w-3.5" />
                      </button>
                    </div>

                    <select
                      value={risk.risk_status}
                      disabled={isSaving}
                      onChange={(e) =>
                        handleStatusChange(risk, e.target.value as PipelineRisk['risk_status'])
                      }
                      className="px-3 py-1.5 bg-bg-primary border border-border rounded-xl text-xs font-mono font-semibold text-text-primary focus:outline-none focus:border-accent cursor-pointer"
                    >
                      <option value="ACTIVE">ACTIVE</option>
                      <option value="MITIGATING">MITIGATING</option>
                      <option value="RESOLVED">RESOLVED</option>
                      <option value="ACCEPTED">ACCEPTED</option>
                    </select>

                    {isSaving && <RefreshCw className="h-3.5 w-3.5 text-accent animate-spin" />}
                  </div>
                </div>

                {/* Mitigation Details & Triggering Evidence */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-3 border-t border-border/60 text-xs">
                  <div className="space-y-1.5">
                    <div className="font-semibold text-text-primary">Mitigation Strategy</div>
                    <p className="text-text-secondary leading-relaxed">
                      {risk.mitigation_strategy || 'Assign risk containment owner and confirm evidence validation.'}
                    </p>
                    {(risk.mitigation_actions || []).length > 0 && (
                      <ul className="space-y-1 text-text-secondary pt-1">
                        {(risk.mitigation_actions || []).map((act, idx) => (
                          <li key={idx}>• {act}</li>
                        ))}
                      </ul>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <div className="font-semibold text-text-primary">Triggering Evidence & Audit Signals</div>
                    {(risk.triggering_evidence || []).length > 0 ? (
                      <ul className="space-y-1 text-text-secondary font-mono text-[11px]">
                        {(risk.triggering_evidence || []).map((t, idx) => (
                          <li key={idx}>• {t}</li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-text-secondary italic">
                        Triggered from deterministic PADF threshold or evidence contradiction check.
                      </p>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default RiskIntelligenceRegister;
