import React from 'react';
import { OpportunityQualificationResult, OpportunitySession } from '../../types/opportunity_qualification';
import { Bot, Sparkles, Check, AlertTriangle, AlertCircle, Play, ChevronRight, FileText, Landmark, RefreshCw, BadgeCheck, CheckCircle, ArrowUpRight, HelpCircle } from 'lucide-react';

interface OpportunityQualificaitonResultProps {
  session: OpportunitySession;
  result: OpportunityQualificationResult;
  onPromote: () => void;
  promoting: boolean;
  onNavigateToEvidence: (dimensionId: string) => void;
}

export const OpportunityQualificaitonResult: React.FC<OpportunityQualificaitonResultProps> = ({
  session,
  result,
  onPromote,
  promoting,
  onNavigateToEvidence
}) => {
  const getStatusBadge = (status: string) => {
    const defaultClasses = "bg-zinc-100 text-zinc-800 border-zinc-200/50";
    const statusMap: Record<string, { label: string; cls: string }> = {
      QUALIFIED: {
        label: 'OQ Qualified',
        cls: 'bg-emerald-50 text-emerald-800 border-emerald-200'
      },
      CONDITIONALLY_QUALIFIED: {
        label: 'Conditionally Qualified',
        cls: 'bg-emerald-50/60 text-emerald-700 border-emerald-200/40'
      },
      EVIDENCE_INSUFFICIENT: {
        label: 'Gaps Active',
        cls: 'bg-yellow-50 text-yellow-800 border-yellow-200'
      },
      DISQUALIFIED: {
        label: 'Disqualified',
        cls: 'bg-red-50 text-red-800 border-red-200'
      },
      ON_HOLD: {
        label: 'On Hold',
        cls: 'bg-zinc-100 text-zinc-700 border-zinc-200'
      }
    };

    const config = statusMap[status] || { label: status, cls: defaultClasses };
    return (
      <span className={`inline-flex items-center px-3 py-1 text-xs font-black rounded-lg border uppercase tracking-wider ${config.cls}`}>
        {config.label}
      </span>
    );
  };

  const getSeverityBadge = (severity: string) => {
    const colors: Record<string, string> = {
      Critical: 'bg-red-100 text-red-800 border-red-200',
      High: 'bg-red-50 text-red-700 border-red-150',
      Medium: 'bg-amber-50 text-amber-700 border-amber-150',
      Low: 'bg-zinc-100 text-zinc-700 border-zinc-200'
    };
    return (
      <span className={`text-[9px] font-black px-2 py-0.5 rounded border uppercase ${colors[severity] || colors.Low}`}>
        {severity}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* 3-Column Metrics Dashboard */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="p-5 rounded-2xl bg-white border border-zinc-200 shadow-xs flex flex-col justify-between h-28">
          <div className="text-[10px] uppercase tracking-wider font-extrabold text-zinc-400">Pipeline Status</div>
          <div className="text-sm font-black text-zinc-800 uppercase tracking-tight flex items-center gap-2 mt-2">
            <BadgeCheck className={`h-5 w-5 ${
              result.qualification_status === 'QUALIFIED' ? 'text-emerald-500' : 'text-amber-500'
            }`} />
            {getStatusBadge(result.qualification_status)}
          </div>
          <div className="text-[10px] text-zinc-400 italic mt-auto font-sans font-medium">Determined by policy evaluation loop</div>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-zinc-200 shadow-xs flex flex-col justify-between h-28">
          <div className="text-[10px] uppercase tracking-wider font-extrabold text-zinc-400">OQ Weighted Score</div>
          <div className="flex items-baseline gap-1 mt-2">
            <span className="text-4xl font-black text-zinc-800 font-mono">{result.overall_score || 0}</span>
            <span className="text-xs font-bold text-zinc-400">/100</span>
          </div>
          <div className="text-[10px] text-zinc-400 italic mt-auto font-sans font-medium">Standard thresholds and logic verified</div>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-zinc-200 shadow-xs flex flex-col justify-between h-28">
          <div className="text-[10px] uppercase tracking-wider font-extrabold text-zinc-400">Evidence Confidence</div>
          <div className="flex items-baseline gap-1 mt-2">
            <span className="text-4xl font-black text-zinc-800 font-mono">{result.confidence_score || 0}</span>
            <span className="text-xs font-bold text-zinc-400">%</span>
          </div>
          <div className="text-[10px] text-zinc-400 italic mt-auto font-sans font-medium">Impacted by missing required gates</div>
        </div>
      </div>

      {/* Synthesis Summary */}
      <div className="p-5 rounded-2xl bg-white border border-zinc-200 shadow-xs space-y-3">
        <h3 className="font-black text-xs uppercase text-zinc-800 tracking-wider">AI Reasoning Synthesis</h3>
        <p className="text-xs text-zinc-600 leading-relaxed font-medium">
          {result.qualification_explanation || "No assessment explanation was recorded."}
        </p>
      </div>

      {/* 10-Dimension Score Breakdown */}
      <div className="space-y-4">
        <h3 className="text-xs font-black uppercase text-zinc-800 tracking-wider">OQ Dimension Scorecards</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {result.dimension_results?.map((dr) => (
            <div
              key={dr.dimension_id}
              onClick={() => onNavigateToEvidence(dr.dimension_id)}
              className="p-5 rounded-2xl bg-white border border-zinc-200 hover:border-zinc-400 cursor-pointer transition-all flex flex-col justify-between shadow-xs relative overflow-hidden group"
            >
              <div>
                <div className="flex items-center justify-between border-b border-zinc-100 pb-2.5 mb-3">
                  <div className="space-y-0.5">
                    <span className="text-[9px] font-black font-mono text-zinc-400">{dr.dimension_id}</span>
                    <h4 className="text-xs font-extrabold text-zinc-800 leading-tight group-hover:text-zinc-600 transition-colors">
                      {dr.dimension_name}
                    </h4>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-zinc-400 font-mono">Conf: {dr.confidence}%</span>
                    <span className="px-2 py-0.5 text-[10px] font-mono font-black rounded-lg bg-zinc-100 text-zinc-800 border border-zinc-200">
                      {dr.score}/100
                    </span>
                  </div>
                </div>

                <p className="text-xs text-zinc-500 leading-relaxed font-medium mb-4">
                  {dr.reasoning}
                </p>
              </div>

              {/* Progress Bar */}
              <div className="w-full bg-zinc-100 h-1.5 rounded-full overflow-hidden mb-4">
                <div
                  className="bg-zinc-800 h-full rounded-full transition-all duration-500"
                  style={{ width: `${dr.score}%` }}
                />
              </div>

              {/* Signals */}
              <div className="space-y-2.5 pt-3 border-t border-zinc-100/80">
                {dr.positive_signals && dr.positive_signals.length > 0 && (
                  <div>
                    <span className="text-[9px] uppercase font-black text-emerald-600 tracking-wider block mb-1">Observed Positive Signals</span>
                    <div className="space-y-1">
                      {dr.positive_signals.slice(0, 3).map((sig, i) => (
                        <div key={i} className="text-xs text-zinc-500 flex items-start gap-1.5 leading-relaxed font-sans font-medium">
                          <span className="text-emerald-500">•</span>
                          <span>{sig}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {dr.negative_signals && dr.negative_signals.length > 0 && (
                  <div>
                    <span className="text-[9px] uppercase font-black text-red-500 tracking-wider block mb-1">Observed Risk Signals</span>
                    <div className="space-y-1">
                      {dr.negative_signals.slice(0, 3).map((sig, i) => (
                        <div key={i} className="text-xs text-zinc-500 flex items-start gap-1.5 leading-relaxed font-sans font-medium">
                          <span className="text-red-500">•</span>
                          <span>{sig}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Risks & Contradictions Panel */}
      {(result.risks?.length > 0 || result.contradictions?.length > 0) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Active Risks */}
          {result.risks?.length > 0 && (
            <div className="p-5 rounded-2xl bg-white border border-zinc-200 shadow-xs space-y-4">
              <h3 className="font-black text-xs uppercase text-zinc-800 tracking-wider flex items-center gap-1.5">
                <AlertTriangle className="h-4 w-4 text-red-500" />
                Detected Qualification Risks
              </h3>
              <div className="space-y-3">
                {result.risks.map((risk, i) => (
                  <div key={i} className="p-3.5 bg-zinc-50 border border-zinc-200 rounded-xl flex items-start gap-3">
                    <div className="shrink-0 mt-0.5">
                      {getSeverityBadge(risk.severity)}
                    </div>
                    <div>
                      <div className="text-[10px] font-black uppercase text-zinc-400 font-mono">
                        {risk.dimension_id} • {risk.category}
                      </div>
                      <p className="text-xs font-bold text-zinc-700 leading-snug mt-1">{risk.risk_description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Contradictions */}
          {result.contradictions?.length > 0 && (
            <div className="p-5 rounded-2xl bg-white border border-zinc-200 shadow-xs space-y-4">
              <h3 className="font-black text-xs uppercase text-zinc-800 tracking-wider flex items-center gap-1.5">
                <AlertCircle className="h-4 w-4 text-amber-500" />
                SQL-to-OQ Contradictions Detected
              </h3>
              <div className="space-y-3">
                {result.contradictions.map((c, i) => (
                  <div key={i} className="p-3.5 bg-amber-50/20 border border-amber-200 rounded-xl space-y-2">
                    <div className="flex justify-between items-center gap-3">
                      <span className="text-[10px] font-black font-mono text-amber-700 uppercase">{c.evidence_id}</span>
                      <span className="text-[9px] font-black px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 border border-amber-200 uppercase">
                        {c.contradiction_severity} Severity
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-3 text-[11px] leading-relaxed">
                      <div className="p-2 bg-white rounded border border-zinc-200/60">
                        <span className="text-[9px] font-black text-zinc-400 uppercase tracking-wider block">Inherited SQL Fact:</span>
                        <span className="text-zinc-600 font-medium mt-0.5 block">{c.inherited_value}</span>
                      </div>
                      <div className="p-2 bg-zinc-850 rounded text-white border border-zinc-800">
                        <span className="text-[9px] font-black text-zinc-400 uppercase tracking-wider block">New Opportunity Input:</span>
                        <span className="text-zinc-100 font-medium mt-0.5 block">{c.new_value}</span>
                      </div>
                    </div>
                    {c.resolution && (
                      <p className="text-[11px] text-zinc-600 leading-snug pt-1">
                        <span className="font-bold text-zinc-700">Mitigation: </span>
                        {c.resolution}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Recommendations & Action Plans */}
      <div className="p-5 rounded-2xl bg-white border border-zinc-200 shadow-xs space-y-4">
        <h3 className="font-black text-xs uppercase text-zinc-800 tracking-wider flex items-center gap-1.5">
          <Sparkles className="h-4 w-4 text-zinc-700" />
          Recommended Next Best Actions
        </h3>
        {result.recommended_actions?.length === 0 ? (
          <p className="text-xs text-zinc-500">No action plans recommended.</p>
        ) : (
          <div className="space-y-3.5">
            {result.recommended_actions?.map((rec, i) => (
              <div key={i} className="p-4 bg-zinc-50 border border-zinc-200 rounded-xl flex items-start gap-3">
                <span className={`inline-flex items-center justify-center text-[9px] font-black font-mono px-2 py-0.5 rounded-lg border uppercase shrink-0 mt-0.5 ${
                  rec.priority === 'High' 
                    ? 'bg-red-50 text-red-800 border-red-200' 
                    : rec.priority === 'Medium'
                    ? 'bg-amber-50 text-amber-800 border-amber-200'
                    : 'bg-zinc-100 text-zinc-800 border-zinc-200'
                }`}>
                  {rec.priority}
                </span>
                <div>
                  <div className="text-[10px] font-black uppercase text-zinc-400 font-mono">
                    {rec.dimension_id}
                  </div>
                  <p className="text-xs font-bold text-zinc-800 mt-1">{rec.action}</p>
                  {rec.reason && (
                    <p className="text-[11px] text-zinc-500 mt-1 font-medium">
                      Reason: <span className="text-zinc-600 italic font-normal">{rec.reason}</span>
                    </p>
                  )}
                  {rec.risk_addressed && (
                    <p className="text-[11px] text-zinc-500 mt-1 font-medium">
                      Risk Addressed: <span className="text-zinc-600 italic font-normal">{rec.risk_addressed}</span>
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Next Best Questions Panel */}
      {result.next_best_questions?.length > 0 && (
        <div className="p-5 rounded-2xl bg-white border border-zinc-200 shadow-xs space-y-4">
          <h3 className="font-black text-xs uppercase text-zinc-800 tracking-wider flex items-center gap-1.5">
            <HelpCircle className="h-4 w-4 text-zinc-700" />
            Critical Missing Evidence: Next Best Questions
          </h3>
          <div className="space-y-3.5">
            {result.next_best_questions.map((q, i) => (
              <div key={i} className="p-4 bg-zinc-50 border border-zinc-200 rounded-xl flex items-start gap-3">
                <span className={`inline-flex items-center justify-center text-[9px] font-black font-mono px-2 py-0.5 rounded-lg border uppercase shrink-0 mt-0.5 ${
                  q.priority === 'High' 
                    ? 'bg-red-50 text-red-800 border-red-200' 
                    : q.priority === 'Medium'
                    ? 'bg-amber-50 text-amber-800 border-amber-200'
                    : 'bg-zinc-100 text-zinc-800 border-zinc-200'
                }`}>
                  {q.priority}
                </span>
                <div>
                  <div className="text-[10px] font-black uppercase text-zinc-400 font-mono">
                    {q.dimension_id} • Question ID: {q.question_id}
                  </div>
                  <p className="text-xs font-bold text-zinc-800 mt-1 italic">"{q.question}"</p>
                  {q.reason && (
                    <p className="text-[11px] text-zinc-500 mt-1 font-medium">
                      Target Insight: <span className="text-zinc-600 font-normal">{q.reason}</span>
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Pipeline Promotion Section */}
      <div className="p-6 rounded-2xl bg-zinc-50 border border-zinc-300 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h4 className="font-black text-xs uppercase text-zinc-800 tracking-tight">Promote to Opportunity Pipeline</h4>
          <p className="text-[11px] text-zinc-500 mt-1 font-medium">
            Finalizes evaluation results, updates CRM, and marks the account as officially qualified inside the active pipeline.
          </p>
        </div>

        <button
          onClick={onPromote}
          disabled={promoting || session.is_promoted || result.qualification_status === 'DISQUALIFIED'}
          className="w-full sm:w-auto px-6 py-3 bg-zinc-850 hover:bg-zinc-800 text-white font-black uppercase text-xs rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md disabled:opacity-40"
        >
          {promoting ? (
            <>
              <RefreshCw className="h-4 w-4 animate-spin text-white" />
              Promoting Pipeline...
            </>
          ) : session.is_promoted ? (
            <>
              <CheckCircle className="h-4 w-4 text-emerald-400" />
              Promoted successfully
            </>
          ) : (
            <>
              <ArrowUpRight className="h-4 w-4" />
              Promote to active pipeline
            </>
          )}
        </button>
      </div>
    </div>
  );
};
