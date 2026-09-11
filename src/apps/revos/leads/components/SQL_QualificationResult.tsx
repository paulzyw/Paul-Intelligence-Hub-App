import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { SQLDataService } from '../services/sqlDataService';
import { 
  ShieldCheck, 
  ChevronDown, 
  ChevronUp, 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  Activity, 
  Target, 
  Users, 
  Zap, 
  Briefcase, 
  Clock, 
  FileText, 
  Scale, 
  BarChart, 
  Award,
  ArrowRight,
  AlertCircle
} from 'lucide-react';

export interface SQLQualificationResultData {
  qualification_summary: {
    qualification_status: string;
    overall_score: number;
    confidence_score: number;
    summary: string;
  };
  dimension_assessments: Array<{
    dimension_code: string;
    dimension_name: string;
    score: number;
    confidence: number;
    assessment_summary: string;
    strengths: string[];
    weaknesses: string[];
    risks: string[];
    recommendations: string[];
  }>;
  evidence_assessments: Array<{
    evidence_object_id: string;
    evidence_name: string;
    tags: Array<{ label: string; type: 'positive' | 'negative' | 'neutral' | 'timing' | 'fit' | 'intent' | 'dimension' }>;
    identification_assessment: string;
    signal_score: number;
  }>;
  risk_analysis: Array<{
    category: string;
    risks: string[];
  }>;
  recommendations: Array<{
    priority: 'High' | 'Medium' | 'Low';
    action: string;
    related_dimension: string;
    expected_impact: string;
    status: string;
  }>;
  explainability: {
    decision_summary: string;
  };
  sql_promotion_recommendation?: {
    should_promote: boolean;
    decision: string;
    recommendation_rationale: string;
  };
}

interface SQLQualificationResultProps {
  data: SQLQualificationResultData;
  opportunityId?: string;
  leadId?: string;
  onPromote?: () => Promise<boolean> | boolean;
}

export const SQLQualificationResult: React.FC<SQLQualificationResultProps> = ({ 
  data, 
  opportunityId,
  leadId,
  onPromote
}) => {
  const [isAuditsExpanded, setIsAuditsExpanded] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [isSuccessfullyPromoted, setIsSuccessfullyPromoted] = useState(() => {
    if (leadId) {
      try {
        const promotedList = JSON.parse(localStorage.getItem('mql_promoted_leads') || '[]');
        return promotedList.includes(leadId);
      } catch (e) {
        return false;
      }
    }
    return false;
  });

  // Safe data wrapper to avoid undefined errors
  const safeData = {
    qualification_summary: data?.qualification_summary || {
      qualification_status: 'Needs More Evidence',
      overall_score: 0,
      confidence_score: 0,
      summary: ''
    },
    dimension_assessments: data?.dimension_assessments || [],
    evidence_assessments: data?.evidence_assessments || [],
    risk_analysis: data?.risk_analysis || [],
    recommendations: data?.recommendations || [],
    explainability: data?.explainability || {
      decision_summary: ''
    },
    sql_promotion_recommendation: data?.sql_promotion_recommendation
  };

  useEffect(() => {
    if (leadId) {
      try {
        const promotedList = JSON.parse(localStorage.getItem('mql_promoted_leads') || '[]');
        setIsSuccessfullyPromoted(promotedList.includes(leadId));
      } catch (e) {
        setIsSuccessfullyPromoted(false);
      }
    } else {
      setIsSuccessfullyPromoted(false);
    }
  }, [leadId]);

  const handleSave = async () => {
    if (!opportunityId) return;
    setIsSaving(true);
    try {
      await SQLDataService.saveFullQualificationResult(opportunityId, data);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (e) {
      console.error(e);
    } finally {
      setIsSaving(false);
    }
  };

  const renderCircularScore = (score: number) => {
    const r = 16;
    const circ = 2 * Math.PI * r;
    const strokeDashoffset = circ * (1 - (score || 0) / 100);
    let strokeClass = "stroke-emerald-500";
    if (score < 50) strokeClass = "stroke-red-500";
    else if (score < 80) strokeClass = "stroke-amber-500";

    return (
      <div className="relative w-10 h-10 shrink-0">
        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 40 40">
          <circle
            cx="20"
            cy="20"
            r={r}
            className="stroke-border/40"
            strokeWidth="3.5"
            fill="transparent"
          />
          <circle
            cx="20"
            cy="20"
            r={r}
            className={strokeClass}
            strokeWidth="3.5"
            fill="transparent"
            strokeDasharray={circ}
            strokeDashoffset={strokeDashoffset}
          />
        </svg>
        <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold font-mono text-text-primary">
          {score}
        </span>
      </div>
    );
  };

  const getDimensionIcon = (name: string) => {
    if (!name) return <Award className="w-4 h-4" />;
    if (name.includes('Business Problem')) return <AlertTriangle className="w-4 h-4" />;
    if (name.includes('Metrics')) return <BarChart className="w-4 h-4" />;
    if (name.includes('Business Value')) return <Zap className="w-4 h-4" />;
    if (name.includes('Solution')) return <Target className="w-4 h-4" />;
    if (name.includes('Stakeholder')) return <Users className="w-4 h-4" />;
    if (name.includes('Decision Criteria')) return <Scale className="w-4 h-4" />;
    if (name.includes('Buying Process')) return <FileText className="w-4 h-4" />;
    if (name.includes('Commercial')) return <Briefcase className="w-4 h-4" />;
    if (name.includes('Momentum')) return <Activity className="w-4 h-4" />;
    return <Award className="w-4 h-4" />;
  };

  const bannerStatus = safeData.qualification_summary?.qualification_status;
  const bannerNormStatus = bannerStatus ? bannerStatus.toLowerCase().replace(/_/g, ' ') : '';

  let bannerBg = "bg-sky-500/5";
  let bannerBorder = "border-sky-500/20";
  let bannerAccent = "bg-sky-500";
  let bannerIconText = "text-sky-500";
  let bannerIconBg = "bg-sky-500/10";
  let bannerIconBorder = "border-sky-500/20";

  if (bannerNormStatus.includes('disqualified') || bannerNormStatus.includes('unqualified')) {
    bannerBg = "bg-red-500/5";
    bannerBorder = "border-red-500/20";
    bannerAccent = "bg-red-500";
    bannerIconText = "text-red-500";
    bannerIconBg = "bg-red-500/10";
    bannerIconBorder = "border-red-500/20";
  } else if (bannerNormStatus.includes('conditional') || bannerNormStatus.includes('borderline')) {
    bannerBg = "bg-amber-500/5";
    bannerBorder = "border-amber-500/20";
    bannerAccent = "bg-amber-500";
    bannerIconText = "text-amber-500";
    bannerIconBg = "bg-amber-500/10";
    bannerIconBorder = "border-amber-500/20";
  } else if (bannerNormStatus.includes('qualified')) {
    bannerBg = "bg-emerald-500/5";
    bannerBorder = "border-emerald-500/20";
    bannerAccent = "bg-emerald-500";
    bannerIconText = "text-emerald-500";
    bannerIconBg = "bg-emerald-500/10";
    bannerIconBorder = "border-emerald-500/20";
  }

  return (
    <div className="w-full space-y-6 mt-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Top Header - Qualification Status */}
      <div className={`border rounded-2xl p-6 md:p-8 shadow-xl relative overflow-hidden ${bannerBg} ${bannerBorder}`}>
        <div className={`absolute top-0 left-0 w-1 h-full ${bannerAccent}`}></div>
        
        {/* Top Row: Status Title & Score on left, Save button on right */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-border/30">
          <div className="flex items-center gap-4">
            <div className={`w-14 h-14 rounded-xl border flex items-center justify-center shrink-0 ${bannerIconBg} ${bannerIconBorder}`}>
              <ShieldCheck className={`w-7 h-7 ${bannerIconText}`} />
            </div>
            <div>
              <span className="text-[10px] font-mono font-bold tracking-widest text-text-secondary uppercase">
                AI Core Evaluation Status
              </span>
              <h2 className={`text-2xl font-black uppercase tracking-tight mt-0.5 ${bannerIconText}`}>
                {safeData.qualification_summary.qualification_status}
              </h2>
              <div className="flex items-center gap-3 mt-2 text-xs font-mono">
                <div className="flex items-center gap-1.5 text-text-secondary">
                  <span className="uppercase font-bold">SQL Score:</span>
                  <span className={`${bannerIconText} font-black`}>{safeData.qualification_summary.overall_score}/100</span>
                </div>
                <div className="w-1 h-1 rounded-full bg-border"></div>
                <div className="flex items-center gap-1.5 text-text-secondary">
                  <span className="uppercase font-bold">AI Confidence:</span>
                  <span className={`${bannerIconText} font-black`}>{safeData.qualification_summary.confidence_score}%</span>
                </div>
              </div>
            </div>
          </div>

          {opportunityId && (
            <button 
              onClick={handleSave}
              disabled={isSaving || saveSuccess}
              className={`flex items-center gap-2 px-5 py-2.5 border rounded-xl text-xs font-black uppercase tracking-wider transition-all shrink-0 ${
                saveSuccess 
                  ? 'border-green-500/30 bg-green-500/10 text-green-500'
                  : 'border-accent/40 bg-accent/10 text-accent hover:bg-accent hover:text-black shadow-sm shadow-accent/10'
              }`}
            >
              {isSaving ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  <span>Saving...</span>
                </>
              ) : saveSuccess ? (
                <>
                  <CheckCircle className="w-4 h-4" />
                  <span>Saved</span>
                </>
              ) : (
                <>
                  <Activity className="w-4 h-4" />
                  <span>Save</span>
                </>
              )}
            </button>
          )}
        </div>

        {/* Bottom Row: Full-width Primary Reason */}
        <div className="mt-5 pt-1">
          <div className="bg-bg-primary/60 border border-border/50 rounded-xl p-4 sm:p-5 w-full">
            <span className="text-text-primary uppercase font-mono font-bold text-[11px] tracking-wider block mb-1.5">
              Primary Reason
            </span>
            <p className="text-xs sm:text-sm text-text-secondary leading-relaxed font-medium">
              {safeData.qualification_summary.summary}
            </p>
          </div>
        </div>
      </div>

      {/* Dimensions Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3">
        {safeData.dimension_assessments.map((dim, idx) => (
          <div key={idx} className="bg-bg-surface border border-border/40 rounded-xl p-4 shadow-sm hover:border-accent/40 transition-colors">
            <div className="flex items-center justify-between mb-3 text-text-secondary">
              <span className="text-[9px] font-mono font-bold uppercase tracking-wider truncate mr-2">
                {dim.dimension_name}
              </span>
              {getDimensionIcon(dim.dimension_name)}
            </div>
            <div className="flex items-end gap-1 mb-2">
              <span className="text-2xl font-black text-text-primary leading-none">{dim.score}</span>
              <span className="text-[10px] font-mono text-text-secondary mb-0.5">/100</span>
            </div>
            <div className="w-full h-1 bg-bg-primary rounded-full overflow-hidden">
              <div 
                className="h-full bg-accent rounded-full" 
                style={{ width: `${dim.score}%` }}
              ></div>
            </div>
          </div>
        ))}
      </div>

      {/* Detailed Question-Level AI Signal Audits */}
      <div className="bg-bg-surface border border-border/40 rounded-2xl overflow-hidden shadow-sm">
        <div 
          className="p-6 flex items-center justify-between cursor-pointer hover:bg-bg-primary/30 transition-colors"
          onClick={() => setIsAuditsExpanded(!isAuditsExpanded)}
        >
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Zap className="w-4 h-4 text-accent" />
              <h3 className="text-sm font-black text-text-primary uppercase tracking-tight">
                Detailed Question-Level AI Signal Audits
              </h3>
            </div>
            <p className="text-xs text-text-secondary">
              A comprehensive evaluation of user findings comparing semantic evidence directly against Expected Positive/Negative Indicators.
            </p>
          </div>
          <button className="flex items-center gap-2 px-4 py-2 border border-border rounded-lg text-[10px] font-bold uppercase tracking-wider text-text-secondary hover:text-text-primary hover:bg-bg-primary transition-all">
            {isAuditsExpanded ? 'Fold Section' : 'Unfold Section'}
            {isAuditsExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>

        <AnimatePresence>
          {isAuditsExpanded && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden border-t border-border/40"
            >
              <div className="p-6 divide-y divide-border/60">
                {safeData.evidence_assessments.map((audit, idx) => (
                  <div key={idx} className="py-4 first:pt-0 last:pb-0 flex flex-col md:flex-row md:items-start justify-between gap-4">
                    <div className="space-y-1.5 max-w-2xl flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xs font-black text-text-primary font-sans">
                          {audit.evidence_name}
                        </span>
                        {(audit.tags || []).map((tag, tIdx) => {
                          let tagColor = "bg-bg-surface text-text-secondary border-border";
                          if (tag.type === 'positive') tagColor = "bg-emerald-500/10 text-emerald-500 border-emerald-500/20";
                          if (tag.type === 'negative') tagColor = "bg-red-500/10 text-red-500 border-red-500/20";
                          if (tag.type === 'neutral') tagColor = "bg-amber-500/10 text-amber-500 border-amber-500/20";
                          if (tag.type === 'timing') tagColor = "bg-orange-500/10 text-orange-500 border-orange-500/20";
                          if (tag.type === 'fit' || tag.type === 'intent' || tag.type === 'dimension') tagColor = "bg-blue-500/10 text-blue-500 border-blue-500/20";

                          return (
                            <span key={tIdx} className={`px-2 py-0.5 rounded-md border font-black text-[9px] uppercase font-mono tracking-wider ${tagColor}`}>
                              {tag.label}
                            </span>
                          );
                        })}
                      </div>
                      <p className="text-xs text-text-secondary leading-relaxed">
                        {audit.identification_assessment || "No AI audit assessment provided by reasoning engine."}
                      </p>
                    </div>
                    <div className="shrink-0 flex items-center gap-3 self-end md:self-center">
                      <div className="text-right">
                        <span className="text-[10px] font-mono text-text-secondary uppercase block">Signal Score</span>
                        <span className="text-sm font-black font-mono text-text-primary">
                          {audit.signal_score}
                          <span className="text-[10px] font-normal text-text-secondary">/100</span>
                        </span>
                      </div>
                      {renderCircularScore(audit.signal_score)}
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Two Column Layout for Risks & Recommendations */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Left Column: Positive Evidence & Risk Dashboard */}
        <div className="space-y-6">
          {/* SQL Dimension Radar Profile */}
          {(() => {
            const defaultDimensions = [
              "Business Problem",
              "Metrics & Success Criteria",
              "Business Value",
              "Solution Alignment",
              "Stakeholder Alignment",
              "Decision Criteria",
              "Buying Process & Governance",
              "Commercial Readiness",
              "Opportunity Momentum",
              "Competitive Position"
            ];

            const radarData = defaultDimensions.map((name, index) => {
              // 1. Try exact/lowercase match
              let existing = safeData.dimension_assessments.find(
                d => d.dimension_name.toLowerCase().trim() === name.toLowerCase().trim()
              );

              // 2. Try clean alphanumeric match (removes spaces, symbols, &, etc.)
              if (!existing) {
                const clean = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, "");
                existing = safeData.dimension_assessments.find(
                  d => clean(d.dimension_name) === clean(name)
                );
              }

              // 3. Try partial substring matching
              if (!existing) {
                existing = safeData.dimension_assessments.find(
                  d => {
                    const dn = d.dimension_name.toLowerCase();
                    const n = name.toLowerCase();
                    return dn.includes(n) || n.includes(dn);
                  }
                );
              }

              // 4. Try matching standard keywords
              if (!existing) {
                const keywordsMap: Record<string, string> = {
                  "problem": "Business Problem",
                  "metrics": "Metrics & Success Criteria",
                  "value": "Business Value",
                  "solution": "Solution Alignment",
                  "stakeholder": "Stakeholder Alignment",
                  "decision": "Decision Criteria",
                  "buying": "Buying Process & Governance",
                  "commercial": "Commercial Readiness",
                  "momentum": "Opportunity Momentum",
                  "competitive": "Competitive Position"
                };
                
                const targetKeyword = Object.keys(keywordsMap).find(k => name.toLowerCase().includes(k));
                if (targetKeyword) {
                  existing = safeData.dimension_assessments.find(
                    d => d.dimension_name.toLowerCase().includes(targetKeyword)
                  );
                }
              }

              // 5. Fallback to indexing if lengths match (safety net)
              if (!existing && safeData.dimension_assessments.length === defaultDimensions.length) {
                existing = safeData.dimension_assessments[index];
              }

              return {
                name,
                score: existing ? existing.score : 0
              };
            });

            const numDimensions = radarData.length || 10;
            const maxRadius = 136;
            const center = 200;
            const labelRadius = 151;

            const getGridPoints = (level: number) => {
              const r = (level / 100) * maxRadius;
              return radarData.map((_, i) => {
                const angle = (2 * Math.PI * i) / numDimensions - Math.PI / 2;
                const x = center + r * Math.cos(angle);
                const y = center + r * Math.sin(angle);
                return `${x.toFixed(2)},${y.toFixed(2)}`;
              }).join(" ");
            };

            const getSpokePoints = (i: number) => {
              const angle = (2 * Math.PI * i) / numDimensions - Math.PI / 2;
              const xOuter = center + maxRadius * Math.cos(angle);
              const yOuter = center + maxRadius * Math.sin(angle);
              return { x1: center, y1: center, x2: xOuter, y2: yOuter };
            };

            const dataPoints = radarData.map((dim, i) => {
              const r = (dim.score / 100) * maxRadius;
              const angle = (2 * Math.PI * i) / numDimensions - Math.PI / 2;
              const x = center + r * Math.cos(angle);
              const y = center + r * Math.sin(angle);
              return `${x.toFixed(2)},${y.toFixed(2)}`;
            }).join(" ");

            const markers = radarData.map((dim, i) => {
              const r = (dim.score / 100) * maxRadius;
              const angle = (2 * Math.PI * i) / numDimensions - Math.PI / 2;
              const x = center + r * Math.cos(angle);
              const y = center + r * Math.sin(angle);
              return { x, y, score: dim.score };
            });

            const splitLabel = (name: string): string[] => {
              const explicitSplits: Record<string, string[]> = {
                "Business Problem": ["Business", "Problem"],
                "Metrics & Success Criteria": ["Metrics &", "Success Criteria"],
                "Business Value": ["Business", "Value"],
                "Solution Alignment": ["Solution", "Alignment"],
                "Stakeholder Alignment": ["Stakeholder", "Alignment"],
                "Decision Criteria": ["Decision", "Criteria"],
                "Buying Process & Governance": ["Buying Process", "& Governance"],
                "Commercial Readiness": ["Commercial", "Readiness"],
                "Opportunity Momentum": ["Opportunity", "Momentum"],
                "Competitive Position": ["Competitive", "Position"]
              };
              
              // Normalize lookup
              const cleanKey = name.toLowerCase().trim();
              for (const [key, value] of Object.entries(explicitSplits)) {
                if (key.toLowerCase().trim() === cleanKey || cleanKey.includes(key.toLowerCase()) || key.toLowerCase().includes(cleanKey)) {
                  return value;
                }
              }
              
              const words = name.split(" ");
              if (words.length <= 1) return [name, ""];
              const mid = Math.ceil(words.length / 2);
              return [words.slice(0, mid).join(" "), words.slice(mid).join(" ")];
            };

            const getLabelPlacement = (i: number) => {
              const angle = (2 * Math.PI * i) / numDimensions - Math.PI / 2;
              const x = center + labelRadius * Math.cos(angle);
              const y = center + labelRadius * Math.sin(angle);
              
              let textAnchor: "inherit" | "end" | "start" | "middle" = "middle";
              const cos = Math.cos(angle);
              if (cos > 0.15) {
                textAnchor = "start";
              } else if (cos < -0.15) {
                textAnchor = "end";
              }
              
              let dy1 = "0em";
              let dy2 = "1.15em";
              let adjustedY = y;
              
              if (i === 0) {
                adjustedY = y - 8;
              } else if (i === Math.floor(numDimensions / 2)) {
                adjustedY = y + 5;
              } else {
                adjustedY = y - 2;
              }
              
              return { x, y: adjustedY, textAnchor, dy1, dy2 };
            };

            return (
              <div className="bg-bg-surface border border-border/40 rounded-2xl p-4 sm:p-5 shadow-sm">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
                  <div className="flex items-center gap-2">
                    <BarChart className="w-4 h-4 text-accent" />
                    <h3 className="text-sm font-black text-text-primary uppercase tracking-tight">
                      SQL Dimension Radar Profile
                    </h3>
                  </div>
                  <div className="flex items-center gap-3 text-[9px] font-mono">
                    <div className="flex items-center gap-1">
                      <span className="w-2 h-2 rounded bg-red-500/80"></span>
                      <span className="text-text-secondary">Disqualified</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="w-2 h-2 rounded bg-amber-500/85"></span>
                      <span className="text-text-secondary">Borderline</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="w-2 h-2 rounded bg-emerald-500"></span>
                      <span className="text-text-secondary">Qualified</span>
                    </div>
                  </div>
                </div>
                
                <div className="w-full aspect-square flex items-center justify-center bg-bg-primary/20 rounded-xl border border-border/20 p-1 overflow-visible">
                  <svg className="w-full h-full max-w-full max-h-full overflow-visible" viewBox="0 0 400 400">
                    {/* 1. Concentric Threshold Grid Decagons */}
                    {/* Level 30 - Disqualified Inner Grid */}
                    <polygon 
                      points={getGridPoints(30)} 
                      fill="none" 
                      stroke="rgba(239, 68, 68, 0.35)" 
                      strokeWidth="1" 
                      strokeDasharray="3 3" 
                    />
                    <text x="202" y={Math.round(center - maxRadius * 0.30 + 3)} className="fill-red-500/40 font-mono text-[8px] font-bold">30</text>

                    {/* Level 55 - Borderline Grid */}
                    <polygon 
                      points={getGridPoints(55)} 
                      fill="none" 
                      stroke="rgba(245, 158, 11, 0.45)" 
                      strokeWidth="1.25" 
                      strokeDasharray="4 4" 
                    />
                    <text x="202" y={Math.round(center - maxRadius * 0.55 + 3)} className="fill-amber-500/60 font-mono text-[8px] font-bold">55</text>

                    {/* Level 75 - Qualified Threshold Grid (Mid-opacity dashed green line) */}
                    <polygon 
                      points={getGridPoints(75)} 
                      fill="none" 
                      stroke="rgba(16, 185, 129, 0.55)" 
                      strokeWidth="1.5" 
                      strokeDasharray="4 4"
                    />
                    <text x="202" y={Math.round(center - maxRadius * 0.75 + 3)} className="fill-emerald-500 font-mono text-[9px] font-black">75</text>

                    {/* Level 100 - Peak Score Grid */}
                    <polygon 
                      points={getGridPoints(100)} 
                      fill="none" 
                      stroke="rgba(156, 163, 175, 0.35)" 
                      strokeWidth="1" 
                    />
                    <text x="202" y={Math.round(center - maxRadius * 1.0 + 3)} className="fill-text-secondary/40 font-mono text-[8px] font-bold">100</text>

                    {/* 2. Axis Spoke Lines */}
                    {radarData.map((_, i) => {
                      const spokes = getSpokePoints(i);
                      return (
                        <line
                          key={`spoke-${i}`}
                          x1={spokes.x1}
                          y1={spokes.y1}
                          x2={spokes.x2}
                          y2={spokes.y2}
                          stroke="rgba(156, 163, 175, 0.2)"
                          strokeWidth="1"
                        />
                      );
                    })}

                    {/* 3. Radar Active Filled Area & Boundary (Accent Color) */}
                    <polygon
                      points={dataPoints}
                      fill="var(--accent)"
                      fillOpacity="0.22"
                      stroke="var(--accent)"
                      strokeWidth="2.5"
                      className="transition-all duration-300"
                    />

                    {/* 4. Interactive Dots / Markers */}
                    {markers.map((marker, i) => {
                      let markerColor = "fill-emerald-500 stroke-emerald-100 dark:stroke-emerald-950";
                      if (marker.score < 50) {
                        markerColor = "fill-red-500 stroke-red-100 dark:stroke-red-950";
                      } else if (marker.score < 75) {
                        markerColor = "fill-amber-500 stroke-amber-100 dark:stroke-amber-950";
                      }
                      
                      return (
                        <circle
                          key={`marker-${i}`}
                          cx={marker.x}
                          cy={marker.y}
                          r="4.5"
                          className={`${markerColor} stroke-2 transition-all duration-300`}
                        />
                      );
                    })}

                    {/* 5. Axis Labels with Two wrapped lines and dynamic alignments */}
                    {radarData.map((dim, i) => {
                      const placement = getLabelPlacement(i);
                      const [line1, line2] = splitLabel(dim.name);
                      
                      return (
                        <g key={`label-group-${i}`}>
                          <text
                            x={placement.x}
                            y={placement.y}
                            textAnchor={placement.textAnchor}
                            className="fill-text-primary font-bold text-[9px] select-none"
                          >
                            <tspan x={placement.x} dy={placement.dy1}>
                              {line1}
                            </tspan>
                            <tspan 
                              x={placement.x} 
                              dy={placement.dy2}
                              className="fill-text-secondary font-semibold font-mono text-[8px]"
                            >
                              {line2 ? `${line2} (${dim.score})` : `(${dim.score})`}
                            </tspan>
                          </text>
                        </g>
                      );
                    })}
                  </svg>
                </div>
              </div>
            );
          })()}

          {/* Observed Supporting Evidence */}
          <div className="bg-bg-surface border border-border/40 rounded-2xl p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-6">
              <CheckCircle className="w-4 h-4 text-emerald-500" />
              <h3 className="text-sm font-black text-text-primary uppercase tracking-tight">
                Observed Supporting Evidence
              </h3>
            </div>
            <div className="space-y-5">
              {(() => {
                // Select only the top 6 most significant positive evidence items based on signal score
                const positiveEvidences = safeData.evidence_assessments
                  .filter(e => e && e.tags && Array.isArray(e.tags) && e.tags.some(t => t && t.type === 'positive'))
                  .sort((a, b) => (b.signal_score || 0) - (a.signal_score || 0))
                  .slice(0, 6);

                if (positiveEvidences.length === 0) {
                  return <p className="text-xs text-text-secondary italic">No significant positive evidence observed yet.</p>;
                }
                const grouped = positiveEvidences.reduce((acc, curr) => {
                  const dim = curr.tags?.find(t => t && t.type === 'dimension')?.label || 'General';
                  if (!acc[dim]) acc[dim] = [];
                  acc[dim].push(curr);
                  return acc;
                }, {} as Record<string, typeof positiveEvidences>);

                return Object.entries(grouped).map(([dim, items], idx) => (
                  <div key={idx}>
                    <h4 className="text-[10px] font-mono font-bold text-emerald-500 uppercase tracking-widest mb-2 pb-1 border-b border-border/40">
                      {dim}
                    </h4>
                    <ul className="space-y-2.5">
                      {items.map((item, iIdx) => (
                        <li key={iIdx} className="flex items-start gap-2.5 text-xs text-text-secondary">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0"></span>
                          <div className="leading-relaxed">
                            <span className="font-semibold text-text-primary mr-1">{item.evidence_name}:</span>
                            <span>{item.identification_assessment || "No AI audit assessment provided by reasoning engine."}</span>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                ));
              })()}
            </div>
          </div>

          {/* Risk Dashboard */}
          <div className="bg-bg-surface border border-border/40 rounded-2xl p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-6">
              <XCircle className="w-4 h-4 text-red-500" />
              <h3 className="text-sm font-black text-text-primary uppercase tracking-tight">
                Risk Dashboard
              </h3>
            </div>
            <div className="space-y-5">
              {safeData.risk_analysis.map((riskCat, idx) => (
                <div key={idx}>
                  <h4 className="text-[10px] font-mono font-bold text-red-500 uppercase tracking-widest mb-2 pb-1 border-b border-border/40">
                    {riskCat.category}
                  </h4>
                  <ul className="space-y-2">
                    {riskCat.risks && riskCat.risks.length > 0 ? (
                      riskCat.risks.map((risk, rIdx) => (
                        <li key={rIdx} className="flex items-start gap-2 text-xs text-text-secondary">
                          <span className="w-1.5 h-1.5 rounded-full bg-red-500/50 mt-1.5 shrink-0"></span>
                          <span className="leading-relaxed">{risk}</span>
                        </li>
                      ))
                    ) : (
                      <li className="text-xs text-text-secondary italic opacity-60">No significant risks identified in this category.</li>
                    )}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* AI Cognitive Reasoning & Recommendations */}
        <div className="space-y-6">
          <div className="bg-bg-surface border border-border/40 rounded-2xl p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <Zap className="w-4 h-4 text-accent" />
              <h3 className="text-sm font-black text-text-primary uppercase tracking-tight">
                AI Cognitive Reasoning
              </h3>
            </div>
            <p className="text-xs text-text-secondary leading-relaxed p-4 bg-bg-primary border border-border/40 rounded-xl mb-4">
              {safeData.explainability.decision_summary}
            </p>

            <div className="space-y-3 mt-4 border-t border-border/40 pt-4">
              <h4 className="text-[10px] font-mono font-bold text-accent uppercase tracking-widest mb-2">
                Dimensional Diagnostics
              </h4>
              <div className="space-y-2.5">
                {safeData.dimension_assessments.map((dim, idx) => (
                  <div key={idx} className="text-xs leading-relaxed flex items-start gap-1">
                    <span className="w-1 h-1 rounded-full bg-accent/60 mt-1.5 shrink-0"></span>
                    <div>
                      <strong className="text-text-primary font-bold">{dim.dimension_name}:</strong>{" "}
                      <span className="text-text-secondary">{dim.assessment_summary}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="bg-bg-surface border border-border/40 rounded-2xl p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-6">
              <Target className="w-4 h-4 text-accent" />
              <h3 className="text-sm font-black text-text-primary uppercase tracking-tight">
                Recommended Next Actions
              </h3>
            </div>
            <div className="space-y-3">
              {safeData.recommendations.map((rec, idx) => {
                let prioColor = "bg-border text-text-secondary";
                if (rec.priority === 'High') prioColor = "bg-red-500/10 text-red-500 border border-red-500/20";
                if (rec.priority === 'Medium') prioColor = "bg-amber-500/10 text-amber-500 border border-amber-500/20";
                
                return (
                  <div key={idx} className="flex items-start gap-3 p-4 bg-bg-primary border border-border/40 rounded-xl">
                    <div className={`shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black border ${prioColor}`}>
                      {idx + 1}
                    </div>
                    <div>
                      <p className="text-xs font-bold text-text-primary mb-1">
                        {rec.action}
                      </p>
                      <div className="flex items-center gap-3 text-[10px] text-text-secondary font-mono mt-2 flex-wrap">
                        <span className="flex items-center gap-1 uppercase">
                          <strong className="text-text-primary opacity-60">Dimension:</strong> {rec.related_dimension}
                        </span>
                        <span className="flex items-center gap-1 uppercase">
                          <strong className="text-text-primary opacity-60">Impact:</strong> {rec.expected_impact}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

      </div>

      {/* Qualification Summary Card at the bottom */}
      {(() => {
        const status = safeData.qualification_summary.qualification_status;
        const normalizedStatus = status ? status.toLowerCase().replace(/_/g, ' ') : '';
        let bannerBg = "bg-emerald-500/5 border-emerald-500/20";
        let bannerText = "text-emerald-500";
        let iconColor = "text-emerald-500";
        
        if (normalizedStatus.includes('conditional') || normalizedStatus.includes('borderline')) {
          bannerBg = "bg-amber-500/5 border-amber-500/20";
          bannerText = "text-amber-500";
          iconColor = "text-amber-500";
        } else if (normalizedStatus.includes('needs more evidence') || normalizedStatus.includes('nurture')) {
          bannerBg = "bg-sky-500/5 border-sky-500/20";
          bannerText = "text-sky-400";
          iconColor = "text-sky-500";
        } else if (normalizedStatus.includes('unqualified') || normalizedStatus.includes('disqualified')) {
          bannerBg = "bg-red-500/5 border-red-500/20";
          bannerText = "text-red-500";
          iconColor = "text-red-500";
        }

        return (
          <div className={`mt-6 border rounded-2xl p-6 shadow-sm ${bannerBg}`}>
            <div className="flex items-center gap-2 mb-3">
              <CheckCircle className={`w-4 h-4 ${iconColor}`} />
              <h3 className="text-sm font-black text-text-primary uppercase tracking-tight">
                Qualification Summary &mdash; <span className={bannerText}>{status}</span>
              </h3>
            </div>
            <p className="text-xs text-text-secondary leading-relaxed font-medium">
              {safeData.qualification_summary.summary}
            </p>
          </div>
        );
      })()}

      {/* SQL Promotion Recommendation section */}
      {(() => {
        const status = safeData.qualification_summary.qualification_status;
        const normalizedStatus = status ? status.toLowerCase().replace(/_/g, ' ') : '';
        
        const promo = safeData.sql_promotion_recommendation;
        const isRecommendYes = promo && typeof promo.should_promote === 'boolean' 
          ? promo.should_promote 
          : (normalizedStatus.includes('qualified') || normalizedStatus.includes('borderline'));
        const recommendationText = promo?.decision || (isRecommendYes ? "YES" : "NO");
        const recommendationDetails = promo?.recommendation_rationale || (isRecommendYes 
          ? "All core MEDDPICC dimensions show strong alignment. The opportunity is cleared for standard pipeline promotion and executive resource allocation."
          : "Do not promote yet. Critical business problems, metrics, or stakeholder inputs are missing. Re-engage in active discovery before promoting.");
        
        let recBg = "";
        let recBorder = "";
        let recText = "";
        let IconComponent = CheckCircle;

        if (isRecommendYes) {
          if (normalizedStatus.includes('conditional') || normalizedStatus.includes('borderline')) {
            recBg = "bg-amber-500/5";
            recBorder = "border-amber-500/20";
            recText = "text-amber-500";
            IconComponent = AlertTriangle;
          } else {
            recBg = "bg-emerald-500/5";
            recBorder = "border-emerald-500/20";
            recText = "text-emerald-500";
            IconComponent = CheckCircle;
          }
        } else {
          if (normalizedStatus.includes('disqualified') || normalizedStatus.includes('unqualified')) {
            recBg = "bg-red-500/5";
            recBorder = "border-red-500/20";
            recText = "text-red-500";
            IconComponent = XCircle;
          } else {
            recBg = "bg-sky-500/5";
            recBorder = "border-sky-500/20";
            recText = "text-sky-500";
            IconComponent = AlertCircle;
          }
        }

        return (
          <div className={`mt-6 border rounded-2xl p-6 shadow-sm ${recBg} ${recBorder}`}>
            <div className="flex items-start justify-between gap-4 flex-col sm:flex-row">
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <IconComponent className={`w-4 h-4 ${recText}`} />
                  <h3 className="text-sm font-black text-text-primary uppercase tracking-tight">
                    SQL Promotion Recommendation
                  </h3>
                </div>
                <p className="text-xs text-text-secondary leading-relaxed font-medium max-w-2xl">
                  {recommendationDetails}
                </p>
              </div>
              <div className="flex flex-col items-center sm:items-end shrink-0">
                <span className="text-[9px] font-mono uppercase tracking-widest text-text-secondary mb-1">Promote to SQL</span>
                <span className={`text-2xl font-black ${recText} font-mono tracking-tighter`}>
                  {recommendationText}
                </span>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Promote to SQL Action Button */}
      {(() => {
        const status = safeData.qualification_summary.qualification_status;
        const normalizedStatus = status ? status.toLowerCase().replace(/_/g, ' ') : '';
        const promo = safeData.sql_promotion_recommendation;
        const isRecommendYes = promo && typeof promo.should_promote === 'boolean' 
          ? promo.should_promote 
          : ((normalizedStatus.includes('qualified') && !normalizedStatus.includes('unqualified') && !normalizedStatus.includes('disqualified')) || normalizedStatus.includes('borderline'));

        const handlePromoteClick = async () => {
          if (onPromote) {
            const success = await onPromote();
            if (success) {
              setIsSuccessfullyPromoted(true);
            }
          } else if (leadId) {
            try {
              const promotedList = JSON.parse(localStorage.getItem('mql_promoted_leads') || '[]');
              if (!promotedList.includes(leadId)) {
                promotedList.push(leadId);
                localStorage.setItem('mql_promoted_leads', JSON.stringify(promotedList));
              }
              setIsSuccessfullyPromoted(true);
            } catch (e) {
              console.error(e);
            }
          } else {
            setIsSuccessfullyPromoted(true);
          }
        };

        return (
          <div className="mt-8 flex items-center justify-between gap-4">
            <div>
              {isSuccessfullyPromoted && (
                <div className="flex items-center gap-2 text-emerald-500 dark:text-emerald-400 font-bold text-xs font-sans animate-fade-in">
                  <CheckCircle className="w-4 h-4 fill-current text-emerald-500" />
                  <span>Successfully promoted this opportunity to SQL.</span>
                </div>
              )}
            </div>
            <button 
              onClick={handlePromoteClick}
              disabled={!isRecommendYes || isSuccessfullyPromoted}
              className={`px-6 py-3 font-sans font-bold text-xs uppercase tracking-wider transition-all duration-150 flex items-center gap-2 rounded-xl shadow-lg ${
                isSuccessfullyPromoted
                  ? "bg-emerald-500 text-white shadow-emerald-500/25 cursor-not-allowed"
                  : isRecommendYes
                  ? "bg-accent hover:opacity-90 active:scale-[0.98] text-white shadow-accent/25 cursor-pointer"
                  : "bg-neutral-300 dark:bg-neutral-800 text-neutral-400 dark:text-neutral-500 cursor-not-allowed shadow-none border-none"
              }`}
            >
              <Zap className="w-3.5 h-3.5 fill-current" />
              {isSuccessfullyPromoted ? "Promoted to SQL" : "Promote to SQL"}
            </button>
          </div>
        );
      })()}
    </div>
  );
};
