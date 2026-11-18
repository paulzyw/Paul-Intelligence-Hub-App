import React, { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import {
  ShieldCheck,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  CheckCircle,
  Activity,
  Target,
  Users,
  Zap,
  Briefcase,
  Clock,
  Scale,
  BarChart,
  Award,
  ArrowRight,
  ArrowUpRight,
  X,
  Sparkles,
  BookmarkCheck,
  TrendingUp,
  TrendingDown,
  Minus,
  Layers,
  ShieldAlert,
  FileSearch
} from 'lucide-react';
import {
  PipelineAssessment,
  PipelineAssessmentSnapshot,
  PipelineAction,
  PipelineEvidence,
  PipelineEvidenceRelationship,
  PipelineOpportunity,
  PipelinePADFDimensionAudit,
  PipelinePADFResult,
  PipelineQuestionSignalAudit,
  PipelineRisk,
  PipelineSWOTResult
} from '../../types/pipeline';
import { PipelineConfigService } from '../services/PipelineConfigService';
import { PipelineDataService } from '../services/PipelineDataService';

export interface PADFDimensionHealthViewProps {
  opportunity: PipelineOpportunity;
  assessment?: PipelineAssessment | null;
  padfResults: PipelinePADFResult[];
  swotResults?: PipelineSWOTResult[];
  risks?: PipelineRisk[];
  actions?: PipelineAction[];
  evidence: PipelineEvidence[];
  evidenceRelationships?: PipelineEvidenceRelationship[];
  snapshots?: PipelineAssessmentSnapshot[];
  onEditDimensionEvidence?: (dimensionId: string) => void;
  onRiskUpdated?: (updatedRisk: PipelineRisk) => void;
  onAssessmentSaved?: (updatedAssessment: PipelineAssessment) => void;
}

export const PADFDimensionHealthView: React.FC<PADFDimensionHealthViewProps> = ({
  opportunity,
  assessment,
  padfResults,
  swotResults = [],
  risks = [],
  actions = [],
  evidence,
  evidenceRelationships = [],
  snapshots = [],
  onEditDimensionEvidence,
  onAssessmentSaved
}) => {
  const canonicalDims = useMemo(() => PipelineConfigService.getCanonicalPADFDimensions(), []);
  const kbGrouped = useMemo(() => PipelineConfigService.getEvidenceObjectsByPADF(), []);
  const rulesConfig = useMemo(() => PipelineConfigService.getAssessmentRulesConfig(), []);

  const [isAuditsExpanded, setIsAuditsExpanded] = useState(false);
  const [selectedToolkitDim, setSelectedToolkitDim] = useState<PipelinePADFDimensionAudit | null>(null);
  const [healthLegendPos, setHealthLegendPos] = useState<{ top: number; left: number; placeBelow: boolean } | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const openHealthLegend = (el: HTMLElement) => {
    if (typeof window === 'undefined') return;
    const rect = el.getBoundingClientRect();
    const tooltipWidth = 420;
    const placeBelow = rect.top < 190;
    const clampedLeft = Math.max(16, Math.min(window.innerWidth - tooltipWidth - 16, rect.left));
    setHealthLegendPos({
      top: placeBelow ? rect.bottom + 10 : rect.top - 10,
      left: clampedLeft,
      placeBelow
    });
  };

  const closeHealthLegend = () => setHealthLegendPos(null);

  // Prevent background scrolling and support ESC key to close Diagnostic Toolkit Modal
  useEffect(() => {
    if (!selectedToolkitDim) return;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setSelectedToolkitDim(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [selectedToolkitDim]);

  // Extract structured reasoning outputs from assessment record
  const rawOutput = (assessment?.raw_reasoning_output || {}) as NonNullable<
    PipelineAssessment['raw_reasoning_output']
  >;
  const execSummary = useMemo(
    () => ({
      ...(rawOutput.executive_summary_v2 || {}),
      ...(assessment?.executive_summary || {})
    }),
    [rawOutput, assessment]
  );

  // Determine prior snapshot scores if more than 1 assessment snapshot exists
  const priorPadfScoreMap = useMemo(() => {
    const map = new Map<string, number>();
    if (!snapshots || snapshots.length < 2) return map;
    const currentSeq = assessment?.assessment_sequence;
    const priorSnap = [...snapshots]
      .reverse()
      .find((s) =>
        currentSeq
          ? s.snapshot_sequence < currentSeq && Array.isArray(s.full_snapshot_payload?.padf_results)
          : Array.isArray(s.full_snapshot_payload?.padf_results)
      );
    const prevPadf = priorSnap?.full_snapshot_payload?.padf_results || [];
    prevPadf.forEach((p: PipelinePADFResult) => {
      const norm = PipelineConfigService.normalizePADFDimensionId(p.dimension_id);
      map.set(norm, p.dimension_score);
    });
    return map;
  }, [snapshots, assessment?.assessment_sequence]);

  // Build normalized 8 PADF dimension audits merging DB rows + raw_reasoning_output + evidence + KB
  const mergedDimensions: PipelinePADFDimensionAudit[] = useMemo(() => {
    const dbByDim = new Map<string, PipelinePADFResult>();
    padfResults.forEach((r) => {
      dbByDim.set(PipelineConfigService.normalizePADFDimensionId(r.dimension_id), r);
    });

    const aiNarratives: any[] = Array.isArray(rawOutput.padf_dimension_narratives)
      ? rawOutput.padf_dimension_narratives
      : [];

    return canonicalDims.map((dim) => {
      const dbRow = dbByDim.get(dim.id);
      const aiNarr = aiNarratives.find(
        (n) =>
          n.dimension_code === dim.id ||
          n.dimension_code === dim.shortCode ||
          String(n.dimension_code || '').startsWith(dim.shortCode)
      );

      const dimKbList = kbGrouped[dim.id] || [];
      const kbIdsForDim = new Set(dimKbList.map((k: any) => k.evidenceId));
      const matchingEvidence = evidence.filter((ev) => {
        const metaDim = (ev.metadata as any)?.dimension_code;
        if (metaDim && (metaDim === dim.shortCode || metaDim === dim.id)) return true;
        if (ev.evidence_object_id && kbIdsForDim.has(ev.evidence_object_id)) return true;
        if (dbRow?.evidence_references?.includes(ev.evidence_instance_id)) return true;
        return false;
      });

      const score = Number(dbRow?.dimension_score ?? aiNarr?.score ?? 0);
      const avgEvConf =
        matchingEvidence.length > 0
          ? Math.round(
              matchingEvidence.reduce((acc, ev) => acc + Number(ev.evidence_confidence ?? 70), 0) /
                matchingEvidence.length
            )
          : score > 0
            ? 50
            : 0;
      const confidence = Number(aiNarr?.confidence ?? avgEvConf);
      const meta = PipelineConfigService.resolveDimensionAssessmentMeta(score);

      const confirmedCount = matchingEvidence.filter((ev) => ev.customer_confirmed).length;
      const derivedStrength =
        aiNarr?.evidence_strength ||
        (matchingEvidence.length === 0
          ? 'Unverified'
          : confirmedCount >= Math.ceil(matchingEvidence.length / 2)
            ? 'Customer Confirmed'
            : confidence >= 70
              ? 'Direct Evidence'
              : 'Sales Rep Inferred');

      const linkedSwots =
        Array.isArray(aiNarr?.related_swot_factors) && aiNarr.related_swot_factors.length > 0
          ? aiNarr.related_swot_factors
          : swotResults
              .filter(
                (sf) =>
                  Array.isArray(sf.related_padf_dimensions) &&
                  sf.related_padf_dimensions.some((d) => d.includes(dim.shortCode))
              )
              .map((sf) => `${sf.factor_id}: ${sf.factor_name}`);

      const priorScore =
        typeof aiNarr?.historical_score === 'number'
          ? aiNarr.historical_score
          : priorPadfScoreMap.get(dim.id);
      const scoreDelta =
        typeof aiNarr?.score_delta === 'number'
          ? aiNarr.score_delta
          : typeof priorScore === 'number'
            ? score - priorScore
            : undefined;

      const strengths =
        dbRow?.key_strengths && dbRow.key_strengths.length > 0
          ? dbRow.key_strengths
          : Array.isArray(aiNarr?.strengths)
            ? aiNarr.strengths
            : [];
      const weaknesses =
        dbRow?.key_weaknesses && dbRow.key_weaknesses.length > 0
          ? dbRow.key_weaknesses
          : Array.isArray(aiNarr?.weaknesses)
            ? aiNarr.weaknesses
            : [];

      const recommendedActions =
        dbRow?.recommended_actions && dbRow.recommended_actions.length > 0
          ? dbRow.recommended_actions
          : Array.isArray(aiNarr?.recommended_actions)
            ? aiNarr.recommended_actions
            : aiNarr?.improvement_direction
              ? [aiNarr.improvement_direction]
              : [];

      const relatedRisks =
        Array.isArray(aiNarr?.risks) && aiNarr.risks.length > 0
          ? aiNarr.risks
          : risks
              .filter(
                (r) =>
                  r.risk_id.includes(dim.shortCode) ||
                  r.risk_description.toLowerCase().includes(dim.name.toLowerCase().split(' ')[0])
              )
              .map((r) => `[${r.severity}] ${r.risk_description}`);

      return {
        dimension_code: dim.shortCode,
        dimension_name: dim.name,
        score,
        confidence,
        assessment: aiNarr?.assessment || meta.label,
        evidence_strength: derivedStrength,
        short_interpretation:
          aiNarr?.short_interpretation ||
          dbRow?.business_implications ||
          dim.description,
        strengths,
        weaknesses,
        contradictory_qualifying_evidence: Array.isArray(aiNarr?.contradictory_qualifying_evidence)
          ? aiNarr.contradictory_qualifying_evidence
          : [],
        related_swot_factors: linkedSwots,
        evidence_gaps: Array.isArray(aiNarr?.evidence_gaps) ? aiNarr.evidence_gaps : [],
        business_impact:
          aiNarr?.business_impact || dbRow?.business_implications || dim.description,
        risks: relatedRisks,
        ai_reasoning:
          aiNarr?.ai_reasoning ||
          aiNarr?.short_interpretation ||
          dbRow?.business_implications ||
          '',
        improvement_direction: aiNarr?.improvement_direction || '',
        recommended_actions: recommendedActions,
        historical_score: priorScore,
        score_delta: scoreDelta
      };
    });
  }, [canonicalDims, kbGrouped, padfResults, rawOutput, evidence, swotResults, risks, priorPadfScoreMap]);

  // Build Question-Level AI Signal Audits dynamically (zero hardcoded mocks)
  const evidenceAudits: PipelineQuestionSignalAudit[] = useMemo(() => {
    const rawAudits: any[] = Array.isArray(rawOutput.evidence_assessments)
      ? rawOutput.evidence_assessments
      : [];

    const evByObjId = new Map<string, PipelineEvidence>();
    evidence.forEach((ev) => {
      if (ev.evidence_object_id) evByObjId.set(ev.evidence_object_id, ev);
    });

    const relByInstId = new Map<string, PipelineEvidenceRelationship[]>();
    evidenceRelationships.forEach((rel) => {
      const arr = relByInstId.get(rel.evidence_instance_id) || [];
      arr.push(rel);
      relByInstId.set(rel.evidence_instance_id, arr);
    });

    const allKbObjects = PipelineConfigService.getAllEvidenceObjects();
    const kbById = new Map<string, any>();
    allKbObjects.forEach((obj: any) => {
      if (obj.evidenceId) kbById.set(obj.evidenceId, obj);
    });

    const dimScoreByShortCode = new Map<string, number>();
    mergedDimensions.forEach((d) => {
      dimScoreByShortCode.set(d.dimension_code, d.score);
    });

    const computeDeterministicSignalScore = (
      aiItem: any,
      evRow: PipelineEvidence | undefined,
      kbObj: any,
      kbConf: number
    ): number => {
      let itemScore = 50;
      const rawStmt = aiItem?.evidence_statement ?? evRow?.evidence_statement ?? '';
      const lowerContent = String(rawStmt).toLowerCase();

      const posSignals: string[] = Array.isArray(kbObj?.strongEvidenceIndicators)
        ? kbObj.strongEvidenceIndicators
        : Array.isArray(kbObj?.positiveSignals)
          ? kbObj.positiveSignals
          : [];
      const negSignals: string[] = Array.isArray(kbObj?.weakEvidenceIndicators)
        ? kbObj.weakEvidenceIndicators
        : Array.isArray(kbObj?.negativeSignals)
          ? kbObj.negativeSignals
          : [];

      const hasPositiveMatch = posSignals.some(
        (sig: string) =>
          lowerContent.includes(sig.slice(0, 15).toLowerCase()) ||
          lowerContent.includes('verified') ||
          lowerContent.includes('approved') ||
          lowerContent.includes('signed')
      );
      const hasNegativeMatch = negSignals.some(
        (sig: string) =>
          lowerContent.includes(sig.slice(0, 15).toLowerCase()) ||
          lowerContent.includes('unanswered') ||
          lowerContent.includes('blocker') ||
          lowerContent.includes('unknown')
      );

      if (
        lowerContent.includes('customer verified') ||
        lowerContent.includes('formally approved') ||
        lowerContent.includes('signed off') ||
        lowerContent.includes('100%') ||
        hasPositiveMatch
      ) {
        itemScore = 88;
      } else if (
        lowerContent.includes('in progress') ||
        lowerContent.includes('aligned') ||
        lowerContent.includes('reviewed')
      ) {
        itemScore = 65;
      } else if (
        lowerContent.includes('unanswered') ||
        lowerContent.includes('no evidence') ||
        lowerContent.includes('unknown') ||
        hasNegativeMatch
      ) {
        itemScore = 25;
      }

      if (Number.isFinite(kbConf)) {
        itemScore = Math.round(itemScore * 0.55 + kbConf * 0.45);
      }

      const isConfirmed = Boolean(aiItem?.customer_confirmed ?? evRow?.customer_confirmed);
      const srcVal = String(aiItem?.source_type || evRow?.source_type || '');
      if (isConfirmed) {
        itemScore = Math.min(100, itemScore + 8);
      } else if (
        srcVal === 'Seller Assumption' ||
        srcVal === 'Sales Representative Input' ||
        srcVal.includes('ES06')
      ) {
        itemScore = Math.max(15, itemScore - 12);
      }

      return Math.max(0, Math.min(100, Math.round(itemScore)));
    };

    const rawEntries =
      rawAudits.length > 0
        ? rawAudits.map((aiItem) => ({
            aiItem,
            evRow: evByObjId.get(aiItem.evidence_object_id)
          }))
        : evidence.map((evRow) => ({ aiItem: null, evRow }));

    // Prepare base & deterministic per-item scores, then calibrate per dimension if uncalibrated or stale
    const prepared = rawEntries.map(({ aiItem, evRow }) => {
      const objId = aiItem?.evidence_object_id || evRow?.evidence_object_id || 'EV_ITEM';
      const kbObj = kbById.get(objId) || {};
      const canonDimId = PipelineConfigService.normalizePADFDimensionId(
        aiItem?.dimension_code ||
          (evRow?.metadata as any)?.dimension_code ||
          kbObj?.primaryPADFDimension ||
          'PA1'
      );
      const canonDim = canonicalDims.find((d) => d.id === canonDimId) || canonicalDims[0];
      const kbConf = Number(aiItem?.evidence_confidence ?? evRow?.evidence_confidence ?? 70);
      const detScore = computeDeterministicSignalScore(aiItem, evRow, kbObj, kbConf);
      const hasAiScore = typeof aiItem?.signal_score === 'number';
      const aiScore = hasAiScore
        ? Math.max(0, Math.min(100, Math.round(aiItem.signal_score)))
        : null;

      return { aiItem, evRow, objId, kbObj, canonDim, kbConf, detScore, aiScore };
    });

    // Group indices by PADF shortCode to align per-evidence Signal Scores with each PADF Dimension Score
    const indicesByDim = new Map<string, number[]>();
    prepared.forEach((p, idx) => {
      const list = indicesByDim.get(p.canonDim.shortCode) || [];
      list.push(idx);
      indicesByDim.set(p.canonDim.shortCode, list);
    });

    const calibratedScores = new Array<number>(prepared.length);
    indicesByDim.forEach((idxs, shortCode) => {
      const targetDimScore = dimScoreByShortCode.get(shortCode);
      const allHaveAi = idxs.every((i) => prepared[i].aiScore !== null);
      const aiAvg = allHaveAi
        ? idxs.reduce((acc, i) => acc + (prepared[i].aiScore as number), 0) / idxs.length
        : null;

      // Preserve Edge Function's calibrated AI scores when already aligned with the dimension score
      const aiAlreadyAligned =
        aiAvg !== null &&
        typeof targetDimScore === 'number' &&
        targetDimScore > 0 &&
        Math.abs(aiAvg - targetDimScore) < 2;

      if (aiAlreadyAligned) {
        idxs.forEach((i) => {
          calibratedScores[i] = prepared[i].aiScore as number;
        });
        return;
      }

      // Otherwise derive from deterministic item scores (blending lightly if AI gave a distinct score) and calibrate to targetDimScore
      const baseScores = idxs.map((i) => {
        const p = prepared[i];
        if (p.aiScore !== null && p.aiScore !== p.kbConf) {
          return Math.round(p.detScore * 0.65 + p.aiScore * 0.35);
        }
        return p.detScore;
      });

      if (typeof targetDimScore === 'number' && targetDimScore > 0 && baseScores.length > 0) {
        const currentAvg = baseScores.reduce((a, b) => a + b, 0) / baseScores.length;
        const delta = targetDimScore - currentAvg;
        const adjusted =
          Math.abs(delta) >= 0.5
            ? baseScores.map((s) => Math.max(0, Math.min(100, Math.round(s + delta))))
            : [...baseScores];

        const desiredSum = Math.round(targetDimScore) * adjusted.length;
        let currentSum = adjusted.reduce((a, b) => a + b, 0);
        let guard = 0;
        while (currentSum !== desiredSum && guard < adjusted.length * 4) {
          const step = currentSum < desiredSum ? 1 : -1;
          for (let k = 0; k < adjusted.length && currentSum !== desiredSum; k++) {
            const next = adjusted[k] + step;
            if (next >= 0 && next <= 100) {
              adjusted[k] = next;
              currentSum += step;
            }
          }
          guard++;
        }

        idxs.forEach((origIdx, pos) => {
          calibratedScores[origIdx] = adjusted[pos];
        });
      } else {
        idxs.forEach((origIdx, pos) => {
          calibratedScores[origIdx] = baseScores[pos];
        });
      }
    });

    const formatHumanSourceLabel = (rawSource?: string): string => {
      const s = String(rawSource || '').trim();
      if (!s) return 'customer meeting notes';
      const lower = s.toLowerCase();
      if (lower.includes('es01') || lower.includes('executive conversation')) return 'executive conversation';
      if (lower.includes('es02') || lower.includes('workshop')) return 'customer workshop';
      if (lower.includes('es03') || lower.includes('meeting notes')) return 'customer meeting notes';
      if (lower.includes('es04') || lower.includes('documentation')) return 'customer documentation';
      if (lower.includes('es05') || lower.includes('crm')) return 'CRM activity data';
      if (lower.includes('es06') || lower.includes('sales rep') || lower.includes('assumption')) return 'sales representative input';
      if (lower.includes('es07') || lower.includes('external')) return 'external intelligence';
      return s.replace(/^ES\d+_?/i, '').replace(/_/g, ' ').toLowerCase();
    };

    const isSubstantiveReasoning = (text?: string) => {
      const cleaned = String(text || '').trim();
      if (cleaned.length < 24) return false;
      if (/^Submitted\s+(customer-confirmed|unconfirmed)\s+evidence/i.test(cleaned)) return false;
      return !/^(verified|unverified|confirmed|supported|supports|positive|negative|neutral|n\/a)\.?$/i.test(cleaned);
    };

    return prepared.map(({ aiItem, evRow, objId, kbObj, canonDim, kbConf }, idx): PipelineQuestionSignalAudit => {
      const rels = evRow ? relByInstId.get(evRow.evidence_instance_id) || [] : [];
      const approvedMappings = PipelineConfigService.getMappingsForEvidenceObject(objId);

      const signalScore = calibratedScores[idx] ?? 50;

      const matchedType: 'positive' | 'negative' | 'neutral' =
        signalScore >= 70
          ? 'positive'
          : signalScore < 45
            ? 'negative'
            : aiItem?.matched_type === 'positive'
              ? 'positive'
              : aiItem?.matched_type === 'negative'
                ? 'negative'
                : 'neutral';

      const swotLinks =
        Array.isArray(aiItem?.linked_swot_factors) && aiItem.linked_swot_factors.length > 0
          ? aiItem.linked_swot_factors
          : rels.length > 0
            ? [...new Set(rels.map((r) => r.target_factor_id).filter(Boolean) as string[])]
            : [...new Set(approvedMappings.map((m) => m.factorId).filter(Boolean))];

      const padfLinks =
        Array.isArray(aiItem?.linked_padf_dimensions) && aiItem.linked_padf_dimensions.length > 0
          ? aiItem.linked_padf_dimensions
          : [...new Set([canonDim.id, ...rels.map((r) => r.target_dimension_id).filter(Boolean) as string[]])];

      const matchLabel =
        matchedType === 'positive'
          ? 'POSITIVE MATCH'
          : matchedType === 'negative'
            ? 'NEGATIVE MATCH'
            : 'NEUTRAL MATCH';

      const sourceLabel = aiItem?.source_type || evRow?.source_type || 'Customer Meeting Notes';
      const humanSource = formatHumanSourceLabel(sourceLabel);
      const stmtText = String(aiItem?.evidence_statement || evRow?.evidence_statement || '').trim();
      const stmtPreview = stmtText.slice(0, 180);
      const isConfirmed = aiItem?.customer_confirmed ?? evRow?.customer_confirmed ?? false;
      const candidateReason = isSubstantiveReasoning(aiItem?.identification_assessment)
        ? String(aiItem.identification_assessment).trim()
        : isSubstantiveReasoning(rels[0]?.runtime_interpretation)
          ? String(rels[0].runtime_interpretation).trim()
          : stmtPreview
            ? isConfirmed
              ? `Customer evidence confirms "${stmtPreview}${stmtText.length > 180 ? '...' : ''}". This ${matchedType === 'positive' ? 'substantiates' : matchedType === 'negative' ? 'exposes risk within' : 'informs'} ${canonDim.name} and is supported by ${humanSource}.`
              : `Initial findings indicate "${stmtPreview}${stmtText.length > 180 ? '...' : ''}" based on ${humanSource}. Formal customer confirmation is still needed to strengthen confidence in ${canonDim.name}.`
            : `No substantive evidence has been captured yet for ${kbObj?.evidenceName || objId}, leaving an unvalidated gap in ${canonDim.name}.`;

      return {
        evidence_instance_id: aiItem?.evidence_instance_id || evRow?.evidence_instance_id,
        evidence_object_id: objId,
        evidence_name: aiItem?.evidence_name || kbObj?.evidenceName || objId,
        question_text: aiItem?.question_text || kbObj?.validationQuestions?.[0] || '',
        dimension_code: canonDim.shortCode,
        dimension_name: canonDim.name,
        signal_score: signalScore,
        matched_type: matchedType,
        identification_assessment: candidateReason,
        evidence_statement: aiItem?.evidence_statement || evRow?.evidence_statement || '',
        evidence_type: aiItem?.evidence_type || evRow?.evidence_type || kbObj?.evidenceType || 'customer_statement',
        source_type: sourceLabel,
        verification_status:
          aiItem?.verification_status ||
          evRow?.verification_status ||
          (evRow?.customer_confirmed ? 'VERIFIED' : 'UNVERIFIED'),
        evidence_quality:
          aiItem?.evidence_quality ||
          evRow?.evidence_quality ||
          (kbConf >= 80 ? 'HIGH' : kbConf >= 55 ? 'MEDIUM' : 'LOW'),
        evidence_confidence: kbConf,
        customer_confirmed: isConfirmed,
        mapping_relevance: aiItem?.mapping_relevance || rels[0]?.mapping_relevance || approvedMappings[0]?.mappingStrength || 'DIRECT',
        runtime_relationship:
          aiItem?.runtime_relationship ||
          rels[0]?.runtime_relationship ||
          (matchedType === 'positive' ? 'SUPPORTS' : matchedType === 'negative' ? 'GAP_SIGNAL' : 'QUALIFIES'),
        runtime_polarity:
          aiItem?.runtime_polarity ||
          rels[0]?.runtime_polarity ||
          (matchedType === 'positive' ? 'POSITIVE' : matchedType === 'negative' ? 'NEGATIVE' : 'MIXED'),
        linked_swot_factors: swotLinks,
        linked_padf_dimensions: padfLinks,
        tags: [
          { label: `${canonDim.shortCode}: ${canonDim.name}`, type: 'dimension' },
          { label: matchLabel, type: matchedType }
        ]
      };
    });
  }, [rawOutput.evidence_assessments, evidence, evidenceRelationships, canonicalDims, mergedDimensions]);

  // Observed Supporting Evidence (Section F)
  const observedSupportingEvidence = useMemo(() => {
    const isSubstantiveFinding = (text?: string) => {
      const cleaned = String(text || '').trim();
      if (cleaned.length < 24) return false;
      return !/^(verified|unverified|confirmed|supported|supports|positive|negative|neutral|n\/a)\.?$/i.test(cleaned);
    };

    const auditById = new Map<string, PipelineQuestionSignalAudit>();
    evidenceAudits.forEach((a) => auditById.set(a.evidence_object_id, a));

    if (Array.isArray(rawOutput.observed_supporting_evidence) && rawOutput.observed_supporting_evidence.length > 0) {
      return rawOutput.observed_supporting_evidence.map((item) => {
        const audit = auditById.get(item.evidence_object_id);
        const dimAudit = mergedDimensions.find(
          (d) =>
            d.dimension_code === (item.dimension_code || audit?.dimension_code) ||
            d.dimension_code.startsWith(String(item.dimension_code || audit?.dimension_code || '').slice(0, 3))
        );
        const finding = isSubstantiveFinding(item.finding_summary)
          ? String(item.finding_summary).trim()
          : audit?.identification_assessment ||
            dimAudit?.ai_reasoning ||
            dimAudit?.short_interpretation ||
            'Positive supporting signal corroborated by submitted deal evidence.';

        return {
          ...item,
          title: item.title || audit?.evidence_name || item.evidence_object_id,
          dimension_code: item.dimension_code || audit?.dimension_code,
          source_type: item.source_type || audit?.source_type,
          verification_status: item.verification_status || audit?.verification_status,
          finding_summary: finding
        };
      });
    }

    return evidenceAudits
      .filter((a) => a.matched_type === 'positive' || a.signal_score >= 70)
      .slice(0, 6)
      .map((a) => ({
        evidence_object_id: a.evidence_object_id,
        title: a.evidence_name,
        dimension_code: a.dimension_code,
        source_type: a.source_type,
        verification_status: a.verification_status,
        finding_summary: a.identification_assessment
      }));
  }, [rawOutput.observed_supporting_evidence, evidenceAudits, mergedDimensions]);

  // Recommended Next Actions (Section I)
  const recommendedNextActions = useMemo(() => {
    if (Array.isArray(rawOutput.recommended_next_actions) && rawOutput.recommended_next_actions.length > 0) {
      return rawOutput.recommended_next_actions;
    }
    return actions.map((act) => ({
      priority: act.priority,
      action: act.action_description,
      related_dimension: act.strategic_objective || 'Pipeline Execution',
      expected_impact: act.completion_notes || 'Strengthen deal execution & closeability',
      owner: act.action_owner
    }));
  }, [rawOutput.recommended_next_actions, actions]);

  // Classifications resolved dynamically from Pipeline_Assessment_Rules_v1.1.json
  const baseWin = assessment?.base_winability ?? 0;
  const riskAdjWin = assessment?.risk_adjusted_winability ?? 0;
  const riskPenalty = Math.max(0, baseWin - riskAdjWin);
  const confidenceScore = assessment?.assessment_confidence ?? 0;
  const criticalRisksCount = risks.filter((r) => r.severity === 'CRITICAL').length;

  const classifications = useMemo(
    () =>
      PipelineConfigService.resolvePipelineAssessmentClassifications({
        riskAdjustedWinability: riskAdjWin,
        baseWinability: baseWin,
        assessmentConfidence: confidenceScore,
        pipelineHealth: assessment?.pipeline_health,
        criticalRisksCount,
        padfScores: mergedDimensions.map((d) => d.score)
      }),
    [riskAdjWin, baseWin, confidenceScore, assessment?.pipeline_health, criticalRisksCount, mergedDimensions]
  );

  const healthIndicator = rawOutput.health_indicator || classifications.healthIndicator;
  const primaryReason =
    rawOutput.primary_reason ||
    execSummary.primary_reason ||
    execSummary.overall_assessment ||
    'Assessment computed from deterministic PADF scoring and Gemini strategic reasoning.';

  // Dynamic banner styling matching Opportunity_QualificaitonResult.tsx driven by Pipeline Health & rules
  let bannerBg = 'bg-sky-500/5';
  let bannerBorder = 'border-sky-500/20';
  let bannerAccent = 'bg-sky-500';
  let bannerIconText = 'text-sky-400';
  let bannerIconBg = 'bg-sky-500/10';
  let bannerIconBorder = 'border-sky-500/20';

  if (healthIndicator === 'Critical' || classifications.pipelineHealthLabel === 'CRITICAL') {
    bannerBg = 'bg-red-500/5';
    bannerBorder = 'border-red-500/25';
    bannerAccent = 'bg-red-500';
    bannerIconText = 'text-red-400';
    bannerIconBg = 'bg-red-500/10';
    bannerIconBorder = 'border-red-500/25';
  } else if (healthIndicator === 'Weak' || classifications.pipelineHealthLabel === 'AT_RISK') {
    bannerBg = 'bg-amber-500/5';
    bannerBorder = 'border-amber-500/25';
    bannerAccent = 'bg-amber-500';
    bannerIconText = 'text-amber-400';
    bannerIconBg = 'bg-amber-500/10';
    bannerIconBorder = 'border-amber-500/25';
  } else if (healthIndicator === 'Moderate') {
    bannerBg = 'bg-amber-500/5';
    bannerBorder = 'border-amber-500/25';
    bannerAccent = 'bg-amber-500';
    bannerIconText = 'text-amber-400';
    bannerIconBg = 'bg-amber-500/10';
    bannerIconBorder = 'border-amber-500/25';
  } else if (healthIndicator === 'Strong') {
    bannerBg = 'bg-emerald-500/5';
    bannerBorder = 'border-emerald-500/25';
    bannerAccent = 'bg-emerald-500';
    bannerIconText = 'text-emerald-400';
    bannerIconBg = 'bg-emerald-500/10';
    bannerIconBorder = 'border-emerald-500/25';
  }

  const handleSave = async () => {
    if (!assessment?.assessment_id || !opportunity?.pipeline_id) return;
    setIsSaving(true);
    try {
      const updated = await PipelineDataService.saveAssessmentResult(
        opportunity.pipeline_id,
        assessment.assessment_id,
        {
          executive_summary: execSummary,
          raw_reasoning_output: {
            ...rawOutput,
            primary_reason: primaryReason,
            health_indicator: healthIndicator,
            executive_summary_v2: execSummary,
            padf_dimension_narratives: mergedDimensions,
            evidence_assessments: evidenceAudits,
            observed_supporting_evidence: observedSupportingEvidence,
            recommended_next_actions: recommendedNextActions
          }
        }
      );
      setSaveSuccess(true);
      if (updated && onAssessmentSaved) onAssessmentSaved(updated);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      console.error('Error saving pipeline assessment result:', err);
    } finally {
      setIsSaving(false);
    }
  };

  // Circular SVG score helper matching Opportunity_QualificaitonResult.tsx
  const renderCircularScore = (score: number) => {
    const r = 16;
    const circ = 2 * Math.PI * r;
    const strokeDashoffset = circ * (1 - (score || 0) / 100);
    let strokeClass = 'stroke-emerald-500';
    if (score < rulesConfig.radarThresholds.moderate) strokeClass = 'stroke-red-500';
    else if (score < rulesConfig.radarThresholds.healthy) strokeClass = 'stroke-amber-500';

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
        <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold font-mono tabular-nums text-text-primary">
          {score}
        </span>
      </div>
    );
  };

  const getDimensionIcon = (code: string) => {
    switch (code) {
      case 'PA1':
        return <Target className="w-4 h-4 text-accent shrink-0" />;
      case 'PA2':
        return <Users className="w-4 h-4 text-accent shrink-0" />;
      case 'PA3':
        return <Scale className="w-4 h-4 text-accent shrink-0" />;
      case 'PA4':
        return <Zap className="w-4 h-4 text-accent shrink-0" />;
      case 'PA5':
        return <Award className="w-4 h-4 text-accent shrink-0" />;
      case 'PA6':
        return <Briefcase className="w-4 h-4 text-accent shrink-0" />;
      case 'PA7':
        return <Activity className="w-4 h-4 text-accent shrink-0" />;
      default:
        return <Clock className="w-4 h-4 text-accent shrink-0" />;
    }
  };

  const formalRisksForExecSummary: string[] = useMemo(() => {
    if (Array.isArray(execSummary.key_risks) && execSummary.key_risks.length > 0) {
      return execSummary.key_risks;
    }
    return risks.slice(0, 5).map((r) => `[${r.severity}] ${r.risk_description}`);
  }, [execSummary.key_risks, risks]);

  const priorityActionsForExecSummary: string[] = useMemo(() => {
    if (Array.isArray(execSummary.priority_actions) && execSummary.priority_actions.length > 0) {
      return execSummary.priority_actions;
    }
    return recommendedNextActions.slice(0, 4).map((a) => a.action);
  }, [execSummary.priority_actions, recommendedNextActions]);

  const whyChain = execSummary.why_this_assessment || {
    evidence: `Synthesized ${evidence.length} submitted pipeline evidence records across PADF dimensions PA1–PA8.`,
    interpretation:
      execSummary.overall_assessment ||
      'Deterministic dimension weights and formal risk triggers evaluated against customer confirmation quality.',
    assessment: `${riskAdjWin}% Risk-Adjusted Winability (${classifications.pipelineHealthLabel} · Health: ${healthIndicator}).`,
    business_implication:
      priorityActionsForExecSummary[0] ||
      'Address open evidence gaps and risk mitigations to advance deal closeability.'
  };

  const decisionReasoningSummary =
    rawOutput.ai_cognitive_reasoning?.decision_summary ||
    execSummary.overall_assessment ||
    primaryReason;

  return (
    <div className="w-full space-y-6">
      {/* =================================================================== */}
      {/* A. PRIMARY ASSESSMENT SUMMARY CARD                                  */}
      {/* =================================================================== */}
      <div className={`border rounded-2xl p-6 md:p-8 shadow-xl relative overflow-hidden ${bannerBg} ${bannerBorder}`}>
        <div className={`absolute top-0 left-0 w-1 h-full ${bannerAccent}`} />

        {/* Top Row: Distinct Winability, Pipeline Health + Health Indicator, Confidence & Top-Right Save */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5 pb-6 border-b border-border/30">
          <div className="flex items-start sm:items-center gap-4">
            <div className={`w-14 h-14 rounded-xl border flex items-center justify-center shrink-0 ${bannerIconBg} ${bannerIconBorder}`}>
              <ShieldCheck className={`w-7 h-7 ${bannerIconText}`} />
            </div>

            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[10px] font-mono font-bold tracking-widest text-text-secondary uppercase">
                  Pipeline Health Status · Rules v{rulesConfig.version}
                </span>
                {/* Visual Health Indicator Badge derived from Rules Engine */}
                <span
                  tabIndex={0}
                  onMouseEnter={(e) => openHealthLegend(e.currentTarget)}
                  onMouseLeave={closeHealthLegend}
                  onFocus={(e) => openHealthLegend(e.currentTarget)}
                  onBlur={closeHealthLegend}
                  className={`text-[10px] font-mono font-black uppercase px-2 py-0.5 rounded border cursor-help ${
                    healthIndicator === 'Strong'
                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                      : healthIndicator === 'Moderate'
                        ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                        : 'bg-red-500/10 text-red-400 border-red-500/30'
                  }`}
                >
                  Health: {healthIndicator}
                </span>
                {assessment?.assessment_sequence && (
                  <span className="text-[10px] font-mono text-text-secondary">
                    Run #{assessment.assessment_sequence}
                  </span>
                )}
              </div>

              <h2
                tabIndex={0}
                onMouseEnter={(e) => openHealthLegend(e.currentTarget)}
                onMouseLeave={closeHealthLegend}
                onFocus={(e) => openHealthLegend(e.currentTarget)}
                onBlur={closeHealthLegend}
                className={`inline-block text-2xl font-black uppercase tracking-tight cursor-help ${bannerIconText}`}
              >
                {classifications.pipelineHealthLabel.replace(/_/g, ' ')}
              </h2>

              {/* Strictly Separated Metrics: Winability Score vs Pipeline Health vs Assessment Confidence */}
              <div className="flex flex-wrap items-center gap-x-4 gap-y-2 pt-1 text-xs font-mono tabular-nums">
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-bg-primary/70 border border-border/50">
                  <span className="uppercase font-bold text-text-secondary">Winability Score:</span>
                  <span className="text-accent font-black text-sm">{riskAdjWin}%</span>
                  <span className="text-[10px] text-text-secondary">
                    (Base {baseWin}%{riskPenalty > 0 ? ` − ${riskPenalty}% Risk` : ''})
                  </span>
                </div>

                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-bg-primary/70 border border-border/50">
                  <span className="uppercase font-bold text-text-secondary">Classification:</span>
                  <span className="text-text-primary font-bold">{classifications.winabilityLabel}</span>
                </div>

                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-bg-primary/70 border border-border/50">
                  <span className="uppercase font-bold text-text-secondary">Assessment Confidence:</span>
                  <span className={`${bannerIconText} font-black text-sm`}>{confidenceScore}%</span>
                  <span className="text-[10px] text-text-secondary">
                    ({classifications.confidenceLabel} · {evidence.length}/48)
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Top-Right Save Button */}
          {assessment?.assessment_id && (
            <button
              type="button"
              onClick={handleSave}
              disabled={isSaving || saveSuccess}
              className={`flex items-center gap-2 px-5 py-2.5 border rounded-xl text-xs font-black uppercase tracking-wider transition-all shrink-0 self-start lg:self-center cursor-pointer ${
                saveSuccess
                  ? 'border-emerald-500/40 bg-emerald-500/15 text-emerald-400'
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
                  <BookmarkCheck className="w-4 h-4" />
                  <span>Save</span>
                </>
              )}
            </button>
          )}
        </div>

        {/* Full-Width Primary Reason (AI generated) */}
        <div className="mt-5">
          <div className="bg-bg-primary/65 border border-border/50 rounded-xl p-4 sm:p-5 w-full">
            <span className="text-text-primary uppercase font-mono font-bold text-[11px] tracking-wider mb-1.5 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-accent" />
              Primary Reason (AI Generated)
            </span>
            <p className="text-xs sm:text-sm text-text-secondary leading-relaxed font-medium">
              {primaryReason}
            </p>
          </div>
        </div>
      </div>

      {/* Hover Tooltip: Pipeline Health Status Threshold Legend */}
      {typeof document !== 'undefined' &&
        healthLegendPos &&
        createPortal(
          <div
            style={{
              position: 'fixed',
              top: healthLegendPos.top,
              left: healthLegendPos.left,
              transform: healthLegendPos.placeBelow ? 'translateY(0)' : 'translateY(-100%)',
              zIndex: 99999
            }}
            className="w-[420px] max-w-[calc(100vw-32px)] bg-bg-surface border border-border rounded-xl p-4 shadow-2xl pointer-events-none"
            role="tooltip"
          >
            {(() => {
              const critMax = rulesConfig.radarThresholds.critical; // 35
              const modMin = rulesConfig.radarThresholds.moderate;  // 55
              const strongMin = rulesConfig.radarThresholds.healthy; // 75
              const critWidth = critMax;
              const weakWidth = modMin - critMax;
              const modWidth = strongMin - modMin;
              const strongWidth = 100 - strongMin;
              const clampedScore = Math.max(0, Math.min(100, riskAdjWin));

              return (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-[10px] font-mono uppercase tracking-wider text-text-secondary">
                    <span>Pipeline Health Threshold Legend</span>
                    <span className="text-text-primary font-bold">Score: {clampedScore}%</span>
                  </div>

                  {/* Labels row aligned to exact segment widths */}
                  <div className="flex items-center text-[11px] font-bold">
                    <div
                      style={{ width: `${critWidth}%` }}
                      className={`text-center ${healthIndicator === 'Critical' ? 'text-red-400' : 'text-text-primary'}`}
                    >
                      Critical
                    </div>
                    <div
                      style={{ width: `${weakWidth}%` }}
                      className={`text-center ${healthIndicator === 'Weak' ? 'text-red-400' : 'text-text-primary'}`}
                    >
                      Weak
                    </div>
                    <div
                      style={{ width: `${modWidth}%` }}
                      className={`text-center ${healthIndicator === 'Moderate' ? 'text-amber-400' : 'text-text-primary'}`}
                    >
                      Moderate
                    </div>
                    <div
                      style={{ width: `${strongWidth}%` }}
                      className={`text-center ${healthIndicator === 'Strong' ? 'text-emerald-400' : 'text-text-primary'}`}
                    >
                      Strong
                    </div>
                  </div>

                  {/* Proportional 4-segment color bar */}
                  <div className="relative h-4 w-full flex rounded-sm overflow-hidden border border-border/40">
                    <div style={{ width: `${critWidth}%` }} className="bg-red-700 h-full" />
                    <div style={{ width: `${weakWidth}%` }} className="bg-red-500 h-full" />
                    <div style={{ width: `${modWidth}%` }} className="bg-amber-500 h-full" />
                    <div style={{ width: `${strongWidth}%` }} className="bg-emerald-500 h-full" />
                    {/* Current score marker line */}
                    <div
                      style={{ left: `${clampedScore}%` }}
                      className="absolute top-0 bottom-0 w-0.5 bg-white shadow-[0_0_4px_rgba(0,0,0,0.8)] -translate-x-1/2"
                    />
                  </div>

                  {/* Threshold scale ticks */}
                  <div className="relative h-4 text-[11px] font-mono tabular-nums text-text-primary">
                    <span className="absolute left-0">0</span>
                    <span style={{ left: `${critMax}%` }} className="absolute -translate-x-1/2">
                      {critMax}
                    </span>
                    <span style={{ left: `${modMin}%` }} className="absolute -translate-x-1/2">
                      {modMin}
                    </span>
                    <span style={{ left: `${strongMin}%` }} className="absolute -translate-x-1/2">
                      {strongMin}
                    </span>
                    <span className="absolute right-0">100</span>
                  </div>

                  <div className="flex items-center justify-between gap-2 text-[10px] text-text-secondary pt-0.5">
                    <span>Risk-Adj Winability</span>
                    <span>Strong requires Conf &ge; 65% &amp; 0 Critical Risks</span>
                  </div>
                </div>
              );
            })()}
          </div>,
          document.body
        )}

      {/* =================================================================== */}
      {/* B. EXECUTIVE SUMMARY (ANSWERING ALL 5 BUSINESS QUESTIONS)           */}
      {/* =================================================================== */}
      <div className="bg-bg-surface border border-border rounded-2xl overflow-hidden shadow-sm">
        <div className="px-6 py-4 border-b border-border/60 flex flex-wrap items-center justify-between gap-2 bg-bg-primary/40">
          <div className="flex items-center gap-2">
            <FileSearch className="w-4 h-4 text-accent" />
            <h3 className="text-xs sm:text-sm font-black uppercase tracking-wider text-text-primary font-mono">
              Executive Summary
            </h3>
          </div>
          <span className="text-[11px] font-mono text-text-secondary">
            {assessment?.model_identifier || 'gemini-3.1-flash-lite'} · Rules v{rulesConfig.version}
          </span>
        </div>

        <div className="divide-y divide-border/60">
          {/* Overall Assessment */}
          <div className="p-6 space-y-2">
            <div className="text-[11px] font-mono font-bold uppercase tracking-wider text-accent">
              Overall Assessment
            </div>
            <p className="text-xs sm:text-sm text-text-primary leading-relaxed">
              {execSummary.overall_assessment ||
                'Deterministic PADF scoring and Gemini strategic evaluation completed and persisted.'}
            </p>
          </div>

          {/* KEY ASSESSMENT DRIVERS: [Strengths] | [Constraints] */}
          <div className="p-6 space-y-3">
            <div className="text-[11px] font-mono font-bold uppercase tracking-wider text-text-secondary">
              Key Assessment Drivers
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-bg-primary/70 border border-emerald-500/20 rounded-xl space-y-2">
                <div className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                  <CheckCircle className="w-3.5 h-3.5" />
                  <span>Strengths</span>
                </div>
                {(execSummary.current_strengths || []).length > 0 ? (
                  <ul className="space-y-1.5 text-xs text-text-secondary">
                    {(execSummary.current_strengths || []).map((item, idx) => (
                      <li key={idx} className="flex items-start gap-2 leading-relaxed">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1.5 shrink-0" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-xs text-text-secondary italic">No positive drivers recorded yet.</p>
                )}
              </div>

              <div className="p-4 bg-bg-primary/70 border border-amber-500/20 rounded-xl space-y-2">
                <div className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span>Constraints</span>
                </div>
                {(execSummary.key_constraints || []).length > 0 ? (
                  <ul className="space-y-1.5 text-xs text-text-secondary">
                    {(execSummary.key_constraints || []).map((item, idx) => (
                      <li key={idx} className="flex items-start gap-2 leading-relaxed">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-1.5 shrink-0" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-xs text-text-secondary italic">No structural constraints flagged.</p>
                )}
              </div>
            </div>
          </div>

          {/* RISK AND UNCERTAINTY: [Formal Risks] | [Evidence Gaps] */}
          <div className="p-6 space-y-3">
            <div className="text-[11px] font-mono font-bold uppercase tracking-wider text-text-secondary">
              Risk and Uncertainty
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-bg-primary/70 border border-red-500/20 rounded-xl space-y-2">
                <div className="text-xs font-bold text-red-400 flex items-center gap-1.5">
                  <ShieldAlert className="w-3.5 h-3.5" />
                  <span>Formal Risks</span>
                </div>
                {formalRisksForExecSummary.length > 0 ? (
                  <ul className="space-y-1.5 text-xs text-text-secondary">
                    {formalRisksForExecSummary.map((r, idx) => (
                      <li key={idx} className="flex items-start gap-2 leading-relaxed">
                        <span className="w-1.5 h-1.5 rounded-full bg-red-400 mt-1.5 shrink-0" />
                        <span>{r}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-xs text-text-secondary italic">No formal risks triggered.</p>
                )}
              </div>

              <div className="p-4 bg-bg-primary/70 border border-border/70 rounded-xl space-y-2">
                <div className="text-xs font-bold text-sky-400 flex items-center gap-1.5">
                  <Activity className="w-3.5 h-3.5" />
                  <span>Evidence Gaps</span>
                </div>
                {(execSummary.evidence_gaps || []).length > 0 ? (
                  <ul className="space-y-1.5 text-xs text-text-secondary">
                    {(execSummary.evidence_gaps || []).map((gap, idx) => (
                      <li key={idx} className="flex items-start gap-2 leading-relaxed">
                        <span className="w-1.5 h-1.5 rounded-full bg-sky-400 mt-1.5 shrink-0" />
                        <span>{gap}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-xs text-text-secondary italic">No material evidence gaps flagged.</p>
                )}
              </div>
            </div>
          </div>

          {/* PRIORITY ACTIONS: 1. 2. 3. */}
          <div className="p-6 space-y-3">
            <div className="text-[11px] font-mono font-bold uppercase tracking-wider text-text-secondary">
              Priority Actions
            </div>
            {priorityActionsForExecSummary.length > 0 ? (
              <ol className="space-y-2">
                {priorityActionsForExecSummary.map((act, idx) => (
                  <li
                    key={idx}
                    className="flex items-start gap-3 p-3 bg-bg-primary/60 border border-border/50 rounded-xl text-xs text-text-primary leading-relaxed"
                  >
                    <span className="font-mono font-black text-accent shrink-0">{idx + 1}.</span>
                    <span>{act}</span>
                  </li>
                ))}
              </ol>
            ) : (
              <p className="text-xs text-text-secondary italic">No priority actions generated yet.</p>
            )}
          </div>

          {/* WHY THIS ASSESSMENT?: Evidence -> Interpretation -> Assessment -> Business Implication */}
          <div className="p-6 space-y-3 bg-bg-primary/25">
            <div className="text-[11px] font-mono font-bold uppercase tracking-wider text-accent">
              Why This Assessment?
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3 items-stretch">
              {[
                { label: '1. Evidence', text: whyChain.evidence },
                { label: '2. Interpretation', text: whyChain.interpretation },
                { label: '3. Assessment', text: whyChain.assessment },
                { label: '4. Business Implication', text: whyChain.business_implication }
              ].map((step, idx, arr) => (
                <div key={step.label} className="flex items-stretch gap-2">
                  <div className="flex-1 p-3.5 bg-bg-surface border border-border/70 rounded-xl space-y-1">
                    <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-accent">
                      {step.label}
                    </div>
                    <p className="text-xs text-text-secondary leading-relaxed">{step.text}</p>
                  </div>
                  {idx < arr.length - 1 && (
                    <div className="hidden md:flex items-center justify-center text-accent/60 shrink-0">
                      <ArrowRight className="w-4 h-4" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* =================================================================== */}
      {/* C. PADF ASSESSMENT (8 CLICKABLE SCORECARDS + TOOLKIT MODAL)         */}
      {/* =================================================================== */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs font-bold text-text-secondary px-1">
          <span className="text-[11px] uppercase tracking-wider font-mono">
            PADF Assessment (8 Dimensions &mdash; Click Card to Open Diagnostic Toolkit)
          </span>
          <span className="text-[10px] text-text-secondary/70">Single-click to inspect</span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
          {mergedDimensions.map((dim) => (
            <button
              key={dim.dimension_code}
              type="button"
              onClick={() => setSelectedToolkitDim(dim)}
              className="text-left bg-bg-surface border border-border/60 hover:border-accent/60 rounded-xl p-4 shadow-sm transition-all cursor-pointer group hover:bg-bg-primary/40 relative overflow-hidden"
            >
              <div className="flex items-center justify-between gap-2 mb-2 text-text-secondary">
                <span
                  className="text-[10px] font-mono font-bold uppercase tracking-wider truncate group-hover:text-accent transition-colors"
                  title={`${dim.dimension_code}: ${dim.dimension_name}`}
                >
                  {dim.dimension_code} · {dim.dimension_name}
                </span>
                {getDimensionIcon(dim.dimension_code)}
              </div>

              <div className="flex items-baseline justify-between mb-2">
                <div className="flex items-end gap-1 font-mono tabular-nums">
                  <span className="text-2xl font-black text-text-primary leading-none">{dim.score}</span>
                  <span className="text-[10px] text-text-secondary mb-0.5">/100</span>
                </div>
                <span
                  className={`text-[9px] font-black uppercase px-1.5 py-0.5 rounded border ${
                    dim.assessment === 'Strong'
                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/25'
                      : dim.assessment === 'Moderate'
                        ? 'bg-amber-500/10 text-amber-400 border-amber-500/25'
                        : 'bg-red-500/10 text-red-400 border-red-500/25'
                  }`}
                >
                  {dim.assessment}
                </span>
              </div>

              <div className="w-full h-1.5 bg-bg-primary rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${
                    dim.score >= rulesConfig.radarThresholds.healthy
                      ? 'bg-emerald-500'
                      : dim.score >= rulesConfig.radarThresholds.moderate
                        ? 'bg-accent'
                        : 'bg-red-500'
                  }`}
                  style={{ width: `${Math.max(4, Math.min(100, dim.score))}%` }}
                />
              </div>

              <div className="mt-2.5 pt-1.5 border-t border-border/40 flex items-center justify-between text-[9px] font-mono tabular-nums text-text-secondary">
                <span>Conf: {dim.confidence}%</span>
                {typeof dim.score_delta === 'number' && dim.score_delta !== 0 ? (
                  <span className={dim.score_delta > 0 ? 'text-emerald-400 font-bold' : 'text-red-400 font-bold'}>
                    {dim.score_delta > 0 ? `+${dim.score_delta}` : dim.score_delta} vs prior
                  </span>
                ) : (
                  <span className="text-accent underline opacity-75 group-hover:opacity-100">View Audit</span>
                )}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Portal Diagnostic Toolkit Modal for Single-Clicked PADF Dimension */}
      {typeof document !== 'undefined' &&
        createPortal(
          <AnimatePresence>
            {selectedToolkitDim && (
              <div
                className="fixed inset-0 z-[99999] flex items-center justify-center p-4 sm:p-6 bg-black/75 backdrop-blur-xs"
                onClick={(e) => {
                  if (e.target === e.currentTarget) setSelectedToolkitDim(null);
                }}
              >
                <motion.div
                  initial={{ scale: 0.95, opacity: 0, y: 10 }}
                  animate={{ scale: 1, opacity: 1, y: 0 }}
                  exit={{ scale: 0.95, opacity: 0, y: 10 }}
                  transition={{ duration: 0.18, ease: 'easeOut' }}
                  className="bg-bg-surface border border-border/80 rounded-2xl max-w-2xl w-full max-h-[85vh] p-6 sm:p-7 shadow-2xl relative flex flex-col my-auto"
                  onClick={(e) => e.stopPropagation()}
                >
                  {/* Modal Header */}
                  <div className="flex items-start justify-between border-b border-border/60 pb-4 shrink-0">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-mono font-black uppercase px-2 py-0.5 rounded bg-accent/20 text-accent border border-accent/30">
                          {selectedToolkitDim.dimension_code}
                        </span>
                        <span className="text-xs font-mono text-text-secondary">
                          PADF Diagnostic Dimension Toolkit
                        </span>
                      </div>
                      <h3 className="text-lg font-black text-text-primary uppercase tracking-tight">
                        {selectedToolkitDim.dimension_name}
                      </h3>
                    </div>

                    <button
                      type="button"
                      onClick={() => setSelectedToolkitDim(null)}
                      className="p-1.5 rounded-lg border border-border text-text-secondary hover:text-text-primary hover:bg-bg-primary transition-all cursor-pointer"
                      title="Close Toolkit"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  {/* Scrollable Toolkit Body */}
                  <div className="flex-1 overflow-y-auto space-y-4 pr-1.5 mt-4">
                    {/* CURRENT ASSESSMENT */}
                    <div className="space-y-2">
                      <div className="text-[10px] font-mono font-bold uppercase tracking-widest text-text-secondary">
                        Current Assessment
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        <div className="p-3 bg-bg-primary rounded-xl border border-border/40">
                          <span className="text-[9px] font-mono uppercase text-text-secondary block">Status</span>
                          <span
                            className={`text-sm font-black uppercase mt-0.5 block ${
                              selectedToolkitDim.assessment === 'Strong'
                                ? 'text-emerald-400'
                                : selectedToolkitDim.assessment === 'Moderate'
                                  ? 'text-amber-400'
                                  : 'text-red-400'
                            }`}
                          >
                            {selectedToolkitDim.assessment}
                          </span>
                        </div>

                        <div className="p-3 bg-bg-primary rounded-xl border border-border/40">
                          <span className="text-[9px] font-mono uppercase text-text-secondary block">Score</span>
                          <span className="text-sm font-black font-mono tabular-nums text-text-primary mt-0.5 block">
                            {selectedToolkitDim.score} <span className="text-[10px] text-text-secondary">/100</span>
                          </span>
                        </div>

                        <div className="p-3 bg-bg-primary rounded-xl border border-border/40">
                          <span className="text-[9px] font-mono uppercase text-text-secondary block">Confidence</span>
                          <span className="text-sm font-black font-mono tabular-nums text-text-primary mt-0.5 block">
                            {selectedToolkitDim.confidence}%
                          </span>
                        </div>

                        <div className="p-3 bg-bg-primary rounded-xl border border-border/40">
                          <span className="text-[9px] font-mono uppercase text-text-secondary block">
                            Evidence Strength
                          </span>
                          <span
                            className="text-xs font-bold text-accent mt-0.5 block truncate"
                            title={selectedToolkitDim.evidence_strength}
                          >
                            {selectedToolkitDim.evidence_strength}
                          </span>
                        </div>
                      </div>

                      {typeof selectedToolkitDim.historical_score === 'number' && (
                        <div className="p-2.5 bg-bg-primary/60 border border-border/40 rounded-xl flex items-center justify-between text-xs font-mono tabular-nums">
                          <span className="text-text-secondary">
                            Historical Movement (Prior Assessment: {selectedToolkitDim.historical_score}/100)
                          </span>
                          <span
                            className={`inline-flex items-center gap-1 font-bold ${
                              (selectedToolkitDim.score_delta || 0) > 0
                                ? 'text-emerald-400'
                                : (selectedToolkitDim.score_delta || 0) < 0
                                  ? 'text-red-400'
                                  : 'text-text-secondary'
                            }`}
                          >
                            {(selectedToolkitDim.score_delta || 0) > 0 ? (
                              <TrendingUp className="w-3.5 h-3.5" />
                            ) : (selectedToolkitDim.score_delta || 0) < 0 ? (
                              <TrendingDown className="w-3.5 h-3.5" />
                            ) : (
                              <Minus className="w-3.5 h-3.5" />
                            )}
                            {(selectedToolkitDim.score_delta || 0) > 0
                              ? `+${selectedToolkitDim.score_delta} pts`
                              : `${selectedToolkitDim.score_delta || 0} pts`}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* AI EXPLANATION */}
                    <div className="space-y-3 text-xs">
                      <div className="text-[10px] font-mono font-bold uppercase tracking-widest text-text-secondary">
                        AI Explanation
                      </div>

                      <div className="p-3.5 rounded-xl bg-bg-primary/70 border border-border/40">
                        <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-accent block mb-1">
                          Short Assessment Interpretation:
                        </span>
                        <p className="text-text-primary font-medium leading-relaxed">
                          {selectedToolkitDim.short_interpretation || 'No dimension interpretation available.'}
                        </p>
                      </div>

                      <div className="p-3.5 rounded-xl bg-bg-primary/70 border border-border/40">
                        <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-emerald-400 block mb-1">
                          Key Supporting Evidence:
                        </span>
                        {selectedToolkitDim.strengths.length > 0 ? (
                          <ul className="space-y-1 text-text-primary leading-relaxed">
                            {selectedToolkitDim.strengths.map((s, i) => (
                              <li key={i}>• {s}</li>
                            ))}
                          </ul>
                        ) : (
                          <p className="text-text-secondary italic">No key supporting evidence captured yet.</p>
                        )}
                      </div>

                      <div className="p-3.5 rounded-xl bg-bg-primary/70 border border-border/40">
                        <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-amber-400 block mb-1">
                          Key Weaknesses or Gaps:
                        </span>
                        {selectedToolkitDim.weaknesses.length > 0 ? (
                          <ul className="space-y-1 text-text-secondary leading-relaxed">
                            {selectedToolkitDim.weaknesses.map((w, i) => (
                              <li key={i}>• {w}</li>
                            ))}
                          </ul>
                        ) : (
                          <p className="text-text-secondary italic">No critical weaknesses logged.</p>
                        )}
                      </div>

                      {/* CONTRADICTORY / QUALIFYING EVIDENCE */}
                      <div className="p-3.5 rounded-xl bg-bg-primary/70 border border-border/40">
                        <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-sky-400 block mb-1">
                          Contradictory / Qualifying Evidence:
                        </span>
                        {(selectedToolkitDim.contradictory_qualifying_evidence || []).length > 0 ? (
                          <ul className="space-y-1 text-text-secondary leading-relaxed">
                            {(selectedToolkitDim.contradictory_qualifying_evidence || []).map((c, i) => (
                              <li key={i}>• {c}</li>
                            ))}
                          </ul>
                        ) : (
                          <p className="text-text-secondary italic">No contradictory or qualifying evidence detected.</p>
                        )}
                      </div>

                      {/* Related SWOT Factors & Evidence Gaps */}
                      {(selectedToolkitDim.related_swot_factors || []).length > 0 && (
                        <div className="p-3.5 rounded-xl bg-bg-primary/70 border border-border/40">
                          <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-text-primary block mb-1.5">
                            Related SWOT Factors:
                          </span>
                          <div className="flex flex-wrap gap-1.5">
                            {(selectedToolkitDim.related_swot_factors || []).map((sf, i) => (
                              <span
                                key={i}
                                className="px-2 py-0.5 rounded-md bg-bg-surface border border-border text-[10px] font-mono text-text-secondary"
                              >
                                {sf}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {(selectedToolkitDim.evidence_gaps || []).length > 0 && (
                        <div className="p-3.5 rounded-xl bg-bg-primary/70 border border-border/40">
                          <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-amber-400 block mb-1">
                            Evidence Gaps:
                          </span>
                          <ul className="space-y-1 text-text-secondary leading-relaxed">
                            {(selectedToolkitDim.evidence_gaps || []).map((g, i) => (
                              <li key={i}>• {g}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      <div className="p-3.5 rounded-xl bg-bg-primary/70 border border-border/40">
                        <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-red-400 block mb-1">
                          Risks:
                        </span>
                        {(selectedToolkitDim.risks || []).length > 0 ? (
                          <ul className="space-y-1 text-text-secondary leading-relaxed">
                            {(selectedToolkitDim.risks || []).map((r, i) => (
                              <li key={i}>• {r}</li>
                            ))}
                          </ul>
                        ) : (
                          <p className="text-text-secondary italic">Low immediate dimension risk.</p>
                        )}
                      </div>

                      <div className="p-3.5 rounded-xl bg-bg-primary/70 border border-border/40">
                        <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-accent block mb-1">
                          AI Reasoning &amp; Business Impact:
                        </span>
                        <p className="text-text-secondary font-medium leading-relaxed">
                          {selectedToolkitDim.ai_reasoning || selectedToolkitDim.business_impact}
                        </p>
                      </div>

                      <div className="p-3.5 rounded-xl bg-accent/5 border border-accent/25">
                        <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-accent block mb-1">
                          Recommended Actions:
                        </span>
                        {(selectedToolkitDim.recommended_actions || []).length > 0 ? (
                          <ul className="space-y-1 text-text-primary font-semibold leading-relaxed">
                            {(selectedToolkitDim.recommended_actions || []).map((act, i) => (
                              <li key={i}>• {act}</li>
                            ))}
                          </ul>
                        ) : (
                          <p className="text-text-primary font-semibold leading-relaxed">
                            {selectedToolkitDim.improvement_direction || 'Confirm stakeholder validation in next milestone.'}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Modal Footer */}
                  <div className="flex items-center justify-between gap-3 pt-4 mt-2 border-t border-border/40 shrink-0">
                    {onEditDimensionEvidence ? (
                      <button
                        type="button"
                        onClick={() => {
                          const code = selectedToolkitDim.dimension_code;
                          const matched = canonicalDims.find((d) => d.shortCode === code);
                          setSelectedToolkitDim(null);
                          onEditDimensionEvidence(matched?.id || code);
                        }}
                        className="inline-flex items-center gap-1.5 text-xs font-semibold text-accent hover:underline cursor-pointer"
                      >
                        <span>Update {selectedToolkitDim.dimension_code} Evidence</span>
                        <ArrowUpRight className="w-3.5 h-3.5" />
                      </button>
                    ) : (
                      <span />
                    )}

                    <button
                      type="button"
                      onClick={() => setSelectedToolkitDim(null)}
                      className="px-5 py-2 bg-accent hover:bg-accent-hover text-black font-black uppercase text-xs rounded-xl transition-all cursor-pointer"
                    >
                      Close Toolkit
                    </button>
                  </div>
                </motion.div>
              </div>
            )}
          </AnimatePresence>,
          document.body
        )}

      {/* =================================================================== */}
      {/* D. DETAILED QUESTION-LEVEL AI SIGNAL AUDITS (FOLDED BY DEFAULT)     */}
      {/* =================================================================== */}
      <div className="bg-bg-surface border border-border/50 rounded-2xl overflow-hidden shadow-sm">
        <div
          className="p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 cursor-pointer hover:bg-bg-primary/30 transition-colors"
          onClick={() => setIsAuditsExpanded((prev) => !prev)}
        >
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Zap className="w-4 h-4 text-accent" />
              <h3 className="text-sm font-black text-text-primary uppercase tracking-tight">
                Detailed Question-Level AI Signal Audits ({evidenceAudits.length})
              </h3>
            </div>
            <p className="text-xs text-text-secondary">
              Comprehensive evaluation of customer evidence findings comparing statements, source reliability, validation strength, runtime relationships, and SWOT/PADF links.
            </p>
          </div>
          <button
            type="button"
            className="flex items-center gap-2 px-4 py-2 border border-border rounded-lg text-[10px] font-bold uppercase tracking-wider text-text-secondary hover:text-text-primary hover:bg-bg-primary transition-all cursor-pointer shrink-0 self-start sm:self-center"
          >
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
                {evidenceAudits.length === 0 ? (
                  <p className="text-xs text-text-secondary italic">
                    No evidence records have been submitted yet for this pipeline opportunity.
                  </p>
                ) : (
                  evidenceAudits.map((audit, idx) => (
                    <div
                      key={`${audit.evidence_object_id}-${idx}`}
                      className="py-5 first:pt-0 last:pb-0 flex flex-col md:flex-row md:items-start justify-between gap-4"
                    >
                      <div className="space-y-2.5 flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-xs font-black text-text-primary font-sans">
                            {audit.evidence_name}
                          </span>
                          {(audit.tags || []).map((tag, tIdx) => {
                            let tagColor = 'bg-bg-surface text-text-secondary border-border';
                            if (tag.type === 'positive') tagColor = 'bg-emerald-500/10 text-emerald-400 border-emerald-500/25';
                            if (tag.type === 'negative') tagColor = 'bg-red-500/10 text-red-400 border-red-500/25';
                            if (tag.type === 'neutral') tagColor = 'bg-amber-500/10 text-amber-400 border-amber-500/25';
                            if (tag.type === 'dimension') tagColor = 'bg-sky-500/10 text-sky-400 border-sky-500/25';
                            return (
                              <span
                                key={tIdx}
                                className={`px-2 py-0.5 rounded-md border font-black text-[9px] uppercase font-mono tracking-wider ${tagColor}`}
                              >
                                {tag.label}
                              </span>
                            );
                          })}
                        </div>

                        <p className="text-xs text-text-secondary leading-relaxed">
                          {audit.identification_assessment}
                        </p>
                      </div>

                      <div className="shrink-0 flex items-center gap-3 self-end md:self-center">
                        <div className="text-right">
                          <span className="text-[10px] font-mono text-text-secondary uppercase block">
                            Signal Score
                          </span>
                          <span className="text-sm font-black font-mono tabular-nums text-text-primary">
                            {audit.signal_score}
                            <span className="text-[10px] font-normal text-text-secondary">/100</span>
                          </span>
                        </div>
                        {renderCircularScore(audit.signal_score)}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* =================================================================== */}
      {/* E–I. TWO-COLUMN INTELLIGENCE LAYOUT                                 */}
      {/* =================================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* LEFT COLUMN: E. Radar Profile, F. Observed Supporting Evidence, G. Risk Intelligence Dashboard */}
        <div className="space-y-6">
          {/* E. Assessment Dimension Radar Profile (8 PADF Dimensions) */}
          {(() => {
            const radarData = mergedDimensions.map((d) => ({
              code: d.dimension_code,
              name: d.dimension_name,
              score: d.score
            }));

            const numDimensions = radarData.length || 8;
            const maxRadius = 136;
            const center = 200;
            const labelRadius = 152;
            const { critical: critThreshold, moderate: modThreshold, healthy: healthyThreshold } =
              rulesConfig.radarThresholds;

            const getGridPoints = (level: number) => {
              const r = (level / 100) * maxRadius;
              return radarData
                .map((_, i) => {
                  const angle = (2 * Math.PI * i) / numDimensions - Math.PI / 2;
                  const x = center + r * Math.cos(angle);
                  const y = center + r * Math.sin(angle);
                  return `${x.toFixed(2)},${y.toFixed(2)}`;
                })
                .join(' ');
            };

            const getSpokePoints = (i: number) => {
              const angle = (2 * Math.PI * i) / numDimensions - Math.PI / 2;
              return {
                x1: center,
                y1: center,
                x2: center + maxRadius * Math.cos(angle),
                y2: center + maxRadius * Math.sin(angle)
              };
            };

            const dataPoints = radarData
              .map((dim, i) => {
                const r = (dim.score / 100) * maxRadius;
                const angle = (2 * Math.PI * i) / numDimensions - Math.PI / 2;
                const x = center + r * Math.cos(angle);
                const y = center + r * Math.sin(angle);
                return `${x.toFixed(2)},${y.toFixed(2)}`;
              })
              .join(' ');

            const markers = radarData.map((dim, i) => {
              const r = (dim.score / 100) * maxRadius;
              const angle = (2 * Math.PI * i) / numDimensions - Math.PI / 2;
              return {
                x: center + r * Math.cos(angle),
                y: center + r * Math.sin(angle),
                score: dim.score
              };
            });

            const splitLabel = (name: string): string[] => {
              const words = name.split(' ');
              if (words.length <= 2) return [name, ''];
              const mid = Math.ceil(words.length / 2);
              return [words.slice(0, mid).join(' '), words.slice(mid).join(' ')];
            };

            const getLabelPlacement = (i: number) => {
              const angle = (2 * Math.PI * i) / numDimensions - Math.PI / 2;
              const x = center + labelRadius * Math.cos(angle);
              const y = center + labelRadius * Math.sin(angle);

              let textAnchor: 'inherit' | 'end' | 'start' | 'middle' = 'middle';
              const cos = Math.cos(angle);
              if (cos > 0.15) textAnchor = 'start';
              else if (cos < -0.15) textAnchor = 'end';

              let adjustedY = y - 2;
              if (i === 0) adjustedY = y - 8;
              else if (i === Math.floor(numDimensions / 2)) adjustedY = y + 6;

              return { x, y: adjustedY, textAnchor, dy1: '0em', dy2: '1.15em' };
            };

            return (
              <div className="bg-bg-surface border border-border/50 rounded-2xl p-4 sm:p-5 shadow-sm">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
                  <div className="flex items-center gap-2">
                    <BarChart className="w-4 h-4 text-accent" />
                    <h3 className="text-sm font-black text-text-primary uppercase tracking-tight">
                      Assessment Dimension Radar Profile
                    </h3>
                  </div>
                  <div className="flex items-center gap-3 text-[9px] font-mono">
                    <div className="flex items-center gap-1">
                      <span className="w-2 h-2 rounded bg-red-500/80" />
                      <span className="text-text-secondary">Critical ({critThreshold})</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="w-2 h-2 rounded bg-amber-500/85" />
                      <span className="text-text-secondary">Moderate ({modThreshold})</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="w-2 h-2 rounded bg-emerald-500" />
                      <span className="text-text-secondary">Healthy ({healthyThreshold})</span>
                    </div>
                  </div>
                </div>

                <div className="w-full aspect-square flex items-center justify-center bg-bg-primary/20 rounded-xl border border-border/20 p-2 overflow-visible">
                  <svg className="w-full h-full max-w-full max-h-full overflow-visible" viewBox="0 0 400 400">
                    {/* Rules-driven Critical Threshold Grid */}
                    <polygon
                      points={getGridPoints(critThreshold)}
                      fill="none"
                      stroke="rgba(239, 68, 68, 0.35)"
                      strokeWidth="1"
                      strokeDasharray="3 3"
                    />
                    <text
                      x="202"
                      y={Math.round(center - maxRadius * (critThreshold / 100) + 3)}
                      className="fill-red-500/50 font-mono text-[8px] font-bold"
                    >
                      {critThreshold}
                    </text>

                    {/* Rules-driven Moderate Threshold Grid */}
                    <polygon
                      points={getGridPoints(modThreshold)}
                      fill="none"
                      stroke="rgba(245, 158, 11, 0.45)"
                      strokeWidth="1.25"
                      strokeDasharray="4 4"
                    />
                    <text
                      x="202"
                      y={Math.round(center - maxRadius * (modThreshold / 100) + 3)}
                      className="fill-amber-500/70 font-mono text-[8px] font-bold"
                    >
                      {modThreshold}
                    </text>

                    {/* Rules-driven Healthy Threshold Grid */}
                    <polygon
                      points={getGridPoints(healthyThreshold)}
                      fill="none"
                      stroke="rgba(16, 185, 129, 0.55)"
                      strokeWidth="1.5"
                      strokeDasharray="4 4"
                    />
                    <text
                      x="202"
                      y={Math.round(center - maxRadius * (healthyThreshold / 100) + 3)}
                      className="fill-emerald-500 font-mono text-[9px] font-black"
                    >
                      {healthyThreshold}
                    </text>

                    {/* Peak 100 Grid */}
                    <polygon
                      points={getGridPoints(100)}
                      fill="none"
                      stroke="rgba(156, 163, 175, 0.35)"
                      strokeWidth="1"
                    />
                    <text
                      x="202"
                      y={Math.round(center - maxRadius + 3)}
                      className="fill-text-secondary/45 font-mono text-[8px] font-bold"
                    >
                      100
                    </text>

                    {/* Spokes */}
                    {radarData.map((_, i) => {
                      const spoke = getSpokePoints(i);
                      return (
                        <line
                          key={`spoke-${i}`}
                          x1={spoke.x1}
                          y1={spoke.y1}
                          x2={spoke.x2}
                          y2={spoke.y2}
                          stroke="rgba(156, 163, 175, 0.2)"
                          strokeWidth="1"
                        />
                      );
                    })}

                    {/* Radar Filled Area */}
                    <polygon
                      points={dataPoints}
                      fill="var(--accent)"
                      fillOpacity="0.22"
                      stroke="var(--accent)"
                      strokeWidth="2.5"
                      className="transition-all duration-300"
                    />

                    {/* Score Markers */}
                    {markers.map((marker, i) => {
                      let markerColor = 'fill-emerald-500 stroke-emerald-100';
                      if (marker.score < modThreshold) markerColor = 'fill-red-500 stroke-red-100';
                      else if (marker.score < healthyThreshold) markerColor = 'fill-amber-500 stroke-amber-100';

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

                    {/* Dimension Axis Labels */}
                    {radarData.map((dim, i) => {
                      const placement = getLabelPlacement(i);
                      const [line1, line2] = splitLabel(dim.name);

                      return (
                        <g key={`label-${i}`}>
                          <text
                            x={placement.x}
                            y={placement.y}
                            textAnchor={placement.textAnchor}
                            className="fill-text-primary font-bold text-[8.5px] select-none"
                          >
                            <tspan x={placement.x} dy={placement.dy1}>
                              {line1}
                            </tspan>
                            <tspan
                              x={placement.x}
                              dy={placement.dy2}
                              className="fill-text-secondary font-semibold font-mono text-[7.5px]"
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

          {/* F. Observed Supporting Evidence */}
          <div className="bg-bg-surface border border-border/50 rounded-2xl p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-5">
              <CheckCircle className="w-4 h-4 text-emerald-400" />
              <h3 className="text-sm font-black text-text-primary uppercase tracking-tight">
                Observed Supporting Evidence
              </h3>
            </div>
            <div className="space-y-3">
              {observedSupportingEvidence.length === 0 ? (
                <p className="text-xs text-text-secondary italic">
                  No verified positive supporting evidence highlighted yet.
                </p>
              ) : (
                observedSupportingEvidence.map((item, idx) => (
                  <div
                    key={`${item.evidence_object_id || idx}`}
                    className="flex items-start gap-2.5 text-xs text-text-secondary bg-bg-primary/50 p-3.5 rounded-xl border border-border/50"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1.5 shrink-0" />
                    <div className="space-y-1 flex-1 min-w-0">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="font-bold text-text-primary">{item.title}</span>
                        {item.dimension_code && (
                          <span className="text-[10px] font-mono text-accent">{item.dimension_code}</span>
                        )}
                      </div>
                      <p className="leading-relaxed">{item.finding_summary}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: H. AI Cognitive Reasoning + Dimensional Diagnostics, I. Recommended Next Actions */}
        <div className="space-y-6">
          {/* H. AI Cognitive Reasoning */}
          <div className="bg-bg-surface border border-border/50 rounded-2xl p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <Zap className="w-4 h-4 text-accent" />
              <h3 className="text-sm font-black text-text-primary uppercase tracking-tight">
                AI Cognitive Reasoning
              </h3>
            </div>
            <p className="text-xs text-text-secondary leading-relaxed p-4 bg-bg-primary border border-border/50 rounded-xl mb-4 font-medium">
              {decisionReasoningSummary}
            </p>

            <div className="space-y-3 mt-4 border-t border-border/50 pt-4">
              <h4 className="text-[10px] font-mono font-bold text-accent uppercase tracking-widest mb-2">
                Dimensional Diagnostics (8 Dimensions)
              </h4>
              <div className="space-y-2.5">
                {mergedDimensions.map((dim) => (
                  <div
                    key={dim.dimension_code}
                    className="text-xs leading-relaxed flex items-start gap-2.5 bg-bg-primary/45 p-3 rounded-lg border border-border/30"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-accent mt-1.5 shrink-0" />
                    <div className="space-y-0.5">
                      <div className="font-bold text-text-primary">
                        {dim.dimension_code}: {dim.dimension_name}{' '}
                        <span className="font-mono text-accent ml-1">({dim.score}/100)</span>
                      </div>
                      <p className="text-text-secondary">
                        {dim.ai_reasoning || dim.short_interpretation || dim.business_impact}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* I. Recommended Next Actions */}
          <div className="bg-bg-surface border border-border/50 rounded-2xl p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-5">
              <Layers className="w-4 h-4 text-accent" />
              <h3 className="text-sm font-black text-text-primary uppercase tracking-tight">
                Recommended Next Actions
              </h3>
            </div>

            {recommendedNextActions.length === 0 ? (
              <p className="text-xs text-text-secondary italic">
                No prioritized next actions generated yet.
              </p>
            ) : (
              <div className="space-y-3">
                {recommendedNextActions.map((rec, idx) => {
                  const pUpper = String(rec.priority || 'MEDIUM').toUpperCase();
                  let prioColor = 'bg-bg-surface text-text-secondary border-border';
                  if (pUpper === 'CRITICAL' || pUpper === 'HIGH') {
                    prioColor = 'bg-red-500/10 text-red-400 border border-red-500/25';
                  } else if (pUpper === 'MEDIUM') {
                    prioColor = 'bg-amber-500/10 text-amber-400 border border-amber-500/25';
                  }

                  return (
                    <div
                      key={idx}
                      className="flex items-start gap-3 p-4 bg-bg-primary border border-border/50 rounded-xl"
                    >
                      <div
                        className={`shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black border ${prioColor}`}
                      >
                        {idx + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-text-primary mb-1 leading-relaxed">
                          {rec.action}
                        </p>
                        <div className="flex items-center gap-x-3 gap-y-1 text-[10px] text-text-secondary font-mono mt-2 flex-wrap">
                          <span className="uppercase">
                            <strong className="text-text-primary opacity-70">Priority:</strong> {rec.priority}
                          </span>
                          <span className="uppercase">
                            <strong className="text-text-primary opacity-70">Dimension:</strong>{' '}
                            {rec.related_dimension}
                          </span>
                          <span className="uppercase">
                            <strong className="text-text-primary opacity-70">Impact:</strong>{' '}
                            {rec.expected_impact}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PADFDimensionHealthView;
