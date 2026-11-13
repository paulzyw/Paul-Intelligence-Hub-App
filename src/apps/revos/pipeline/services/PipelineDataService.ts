import { supabase } from '../../../../lib/supabase';
import { 
  PipelineOpportunity, 
  PipelineInheritance, 
  PipelineEvidence, 
  PipelineEvidenceRelationship,
  PipelineAssessment,
  PipelineAssessmentSnapshot,
  PipelinePADFResult,
  PipelineSWOTResult,
  PipelineRisk,
  PipelineStrategy,
  PipelineAction,
  RuntimeRelationshipType,
  RuntimePolarityType
} from '../../types/pipeline';
import { PipelineConfigService } from './PipelineConfigService';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const isValidUuid = (id?: string | null): id is string => typeof id === 'string' && UUID_REGEX.test(id);

export class PipelineDataService {
  /**
   * 1. Retrieve or Initialize Pipeline Opportunity from Upstream Opportunity Record
   * Implements PADIF v1.0 (Pipeline Assessment Data Inheritance Framework)
   */
  static async getOrCreatePipelineOpportunity(
    opportunityOrLeadId: string,
    leadIdHint?: string
  ): Promise<{
    opportunity: PipelineOpportunity;
    inheritance: PipelineInheritance;
    isNew: boolean;
  }> {
    if (!opportunityOrLeadId && !leadIdHint) {
      throw new Error('Opportunity ID or Lead ID is required to initialize Pipeline Assessment.');
    }

    const rawPrimary = opportunityOrLeadId || leadIdHint || '';
    const primaryId = rawPrimary.startsWith('virtual_opp_') ? rawPrimary.replace('virtual_opp_', '') : rawPrimary;

    // 1. Check if pipeline_opportunities already has this record by pipeline_id, opportunity_id, or lead_id
    let existingPipe: any = null;
    const lookupFilters = [`pipeline_id.eq.${primaryId}`, `opportunity_id.eq.${primaryId}`];
    if (leadIdHint) {
      lookupFilters.push(`lead_id.eq.${leadIdHint}`);
    } else {
      lookupFilters.push(`lead_id.eq.${primaryId}`);
    }

    const { data: pipeMatches, error: pipeErr } = await supabase
      .from('pipeline_opportunities')
      .select('*')
      .or(lookupFilters.join(','))
      .order('created_at', { ascending: false })
      .limit(1);

    if (!pipeErr && pipeMatches && pipeMatches.length > 0) {
      existingPipe = pipeMatches[0];
    }

    if (existingPipe) {
      const { data: inheritance } = await supabase
        .from('pipeline_inheritance')
        .select('*')
        .eq('pipeline_id', existingPipe.pipeline_id)
        .maybeSingle();

      return {
        opportunity: existingPipe as PipelineOpportunity,
        inheritance: inheritance as PipelineInheritance,
        isNew: false
      };
    }

    // 2. Resolve true opportunities row (primaryId might be opportunities.id OR mql_leads.id)
    let oppDb: any = null;
    if (isValidUuid(primaryId)) {
      const { data: directOpp } = await supabase
        .from('opportunities')
        .select('*')
        .eq('id', primaryId)
        .maybeSingle();

      if (directOpp) {
        oppDb = directOpp;
      }
    }
    if (!oppDb) {
      const candidateLeadId = leadIdHint || primaryId;
      if (isValidUuid(candidateLeadId)) {
        const { data: byMqlOpp } = await supabase
          .from('opportunities')
          .select('*')
          .eq('mql_reference_id', candidateLeadId)
          .order('created_at', { ascending: false })
          .limit(1);

        if (byMqlOpp && byMqlOpp.length > 0) {
          oppDb = byMqlOpp[0];
        }
      }
    }

    const resolvedOppId = oppDb?.id || primaryId;
    const resolvedLeadId = leadIdHint || oppDb?.mql_reference_id || (oppDb ? null : primaryId);

    // Stage 7 Deduplication Guard: Re-check pipeline_opportunities using resolved opportunity_id / lead_id
    const resolvedFilters = [`opportunity_id.eq.${resolvedOppId}`];
    if (resolvedLeadId) {
      resolvedFilters.push(`lead_id.eq.${resolvedLeadId}`);
    }
    const { data: dedupeMatches } = await supabase
      .from('pipeline_opportunities')
      .select('*')
      .or(resolvedFilters.join(','))
      .order('created_at', { ascending: false })
      .limit(1);

    if (dedupeMatches && dedupeMatches.length > 0) {
      const matchedPipe = dedupeMatches[0];
      const { data: matchedInh } = await supabase
        .from('pipeline_inheritance')
        .select('*')
        .eq('pipeline_id', matchedPipe.pipeline_id)
        .maybeSingle();

      return {
        opportunity: matchedPipe as PipelineOpportunity,
        inheritance: matchedInh as PipelineInheritance,
        isNew: false
      };
    }

    // 3. Fetch upstream qualification & handover records in parallel (UUID columns guarded)
    const emptyRes = { data: null };
    const [oppFormRes, sessionRes, handoverRes, oppResultRes, mqlLeadRes] = await Promise.all([
      isValidUuid(resolvedOppId)
        ? supabase.from('opportunity_form_records').select('*').eq('opportunity_id', resolvedOppId).maybeSingle()
        : Promise.resolve(emptyRes),
      isValidUuid(resolvedOppId)
        ? supabase.from('opportunity_qualification_sessions').select('*').eq('opportunity_id', resolvedOppId).maybeSingle()
        : Promise.resolve(emptyRes),
      isValidUuid(resolvedOppId)
        ? supabase.from('opportunity_sql_handover_details').select('*').eq('opportunity_id', resolvedOppId).maybeSingle()
        : Promise.resolve(emptyRes),
      isValidUuid(resolvedOppId)
        ? supabase
            .from('opportunity_qualification_results')
            .select('*')
            .eq('opportunity_id', resolvedOppId)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle()
        : Promise.resolve(emptyRes),
      isValidUuid(resolvedLeadId)
        ? supabase.from('mql_leads').select('*').eq('id', resolvedLeadId).maybeSingle()
        : Promise.resolve(emptyRes)
    ]);

    const formRecord = oppFormRes.data || {};
    const session = sessionRes.data || {};
    const handover = handoverRes.data || {};
    const oqResult = oppResultRes.data || {};
    const mqlLead = mqlLeadRes.data || {};

    let oppDesc: any = {};
    if (oppDb?.description && typeof oppDb.description === 'string' && oppDb.description.trim().startsWith('{')) {
      try {
        oppDesc = JSON.parse(oppDb.description);
      } catch (_e) {}
    }

    // 4. Extract normalized company, opportunity name, revenue motion, industry, deal value
    const customerName =
      formRecord.company_name ||
      oppDb?.company_name ||
      handover?.editable_fields?.company_name ||
      mqlLead?.company_name ||
      'Enterprise Customer';

    const opportunityName =
      formRecord.opportunity_name ||
      oppDb?.opportunity_name ||
      handover?.editable_fields?.opportunity_name ||
      oppDesc?.opportunity_name ||
      `${customerName} Opportunity`;

    const rawRevenueMotion =
      formRecord.revenue_motion ||
      oppDb?.revenue_motion ||
      session.revenue_motion ||
      handover?.revenue_motion_context?.revenue_motion ||
      'Digital Solution Selling';

    const rawIndustry =
      formRecord.industry ||
      oppDb?.industry ||
      session.industry ||
      mqlLead?.lead_industry ||
      'Enterprise Software';

    const canonicalMotion = PipelineConfigService.normalizeRevenueMotionId(rawRevenueMotion);
    const { canonicalId: canonicalIndustry, name: industryDisplayName } = PipelineConfigService.normalizeIndustryId(rawIndustry);

    const revCandidate =
      formRecord.estimated_revenue ||
      handover?.editable_fields?.estimated_revenue ||
      oppDesc?.estimated_revenue ||
      oppDb?.expected_revenue ||
      '150000';
    let dealValue = 0;
    if (revCandidate !== null && revCandidate !== undefined) {
      const cleaned = String(revCandidate).replace(/[^0-9.]/g, '');
      if (cleaned) dealValue = parseFloat(cleaned) || 0;
    }

    const shortSlug = resolvedOppId.replace(/[^a-zA-Z0-9]/g, '').slice(0, 8) || 'OPP';
    const pipelineId = `PIPE_${shortSlug}_${Date.now()}`;

    const newOpportunity: PipelineOpportunity = {
      pipeline_id: pipelineId,
      opportunity_id: resolvedOppId,
      lead_id: resolvedLeadId || undefined,
      customer_name: customerName,
      opportunity_name: opportunityName,
      industry_id: canonicalIndustry,
      industry_name: industryDisplayName,
      revenue_motion_id: canonicalMotion,
      revenue_motion_name: rawRevenueMotion,
      deal_value: dealValue,
      currency: 'USD',
      sales_stage: formRecord.opportunity_stage || oppDesc?.opportunity_stage || 'Discovery & Solutioning',
      pipeline_stage: formRecord.pipeline_stage || 'Active Assessment',
      forecast_category: 'Pipeline',
      expected_close_date: formRecord.expected_close_date || oppDesc?.expected_close_date || undefined,
      opportunity_owner: formRecord.opportunity_owner || oppDesc?.opportunity_owner || oppDb?.owner_id || 'Senior Enterprise AE',
      lifecycle_status: 'ACTIVE',
      source_system: 'RevOS_Opportunity_Qualification',
      metadata: {
        upstream_source: 'PADIF_v1.0_Inheritance',
        original_opportunity_id: resolvedOppId,
        original_lead_id: resolvedLeadId,
        original_created_at: oppDb?.created_at || new Date().toISOString()
      }
    };

    const { data: savedOpp, error: insertOppErr } = await supabase
      .from('pipeline_opportunities')
      .insert([newOpportunity])
      .select()
      .single();

    if (insertOppErr) {
      console.error('Failed to insert pipeline_opportunity:', insertOppErr);
    }

    // 5. Build PADIF v1.0 Inheritance Baseline Package
    const activePipeId = savedOpp?.pipeline_id || pipelineId;
    const inheritanceId = `INH_${activePipeId}`;

    const oqDecision =
      oqResult.qualification_status ||
      session.qualification_status ||
      session.status ||
      'QUALIFIED';

    const oqScore = Number(
      oqResult.overall_score ??
      session.overall_score ??
      session.score ??
      82
    );

    const oqConfidence = Number(
      oqResult.confidence_score ??
      session.confidence_score ??
      session.confidence ??
      85
    );

    const inheritedPayload: Record<string, unknown> = {
      sql_qip_package: session.sql_inheritance_data || handover.sql_qip_package || {},
      opportunity_qualification: {
        session_id: session.id || null,
        qualification_status: oqDecision,
        overall_score: oqScore,
        confidence_score: oqConfidence,
        explanation: oqResult.qualification_explanation || '',
        dimension_results: oqResult.dimension_results || [],
        risks: oqResult.risks || [],
        recommended_actions: oqResult.recommended_actions || []
      },
      handover_notes: formRecord.strategic_note || handover.editable_fields?.strategic_note || '',
      upstream_lead: {
        lead_id: resolvedLeadId,
        contact_name: mqlLead?.first_name ? `${mqlLead.first_name} ${mqlLead.last_name || ''}`.trim() : undefined,
        job_title: mqlLead?.job_title,
        company: customerName,
        industry: rawIndustry,
        canonical_industry_id: canonicalIndustry,
        revenue_motion: rawRevenueMotion,
        canonical_revenue_motion_id: canonicalMotion
      }
    };

    const newInheritance: PipelineInheritance = {
      inheritance_id: inheritanceId,
      pipeline_id: activePipeId,
      opportunity_id: resolvedOppId,
      lead_id: resolvedLeadId || undefined,
      source_qualification_id: oqResult.id || session.id || resolvedOppId,
      source_module: 'Opportunity_Qualification_SQL_QIP',
      framework_version: 'PADIF_v1.0',
      qualification_decision: oqDecision,
      qualification_score: oqScore,
      qualification_confidence: oqConfidence,
      inherited_payload: inheritedPayload,
      validation_status: 'VALIDATED',
      inherited_at: new Date().toISOString()
    };

    const { data: savedInh, error: insertInhErr } = await supabase
      .from('pipeline_inheritance')
      .insert([newInheritance])
      .select()
      .single();

    if (insertInhErr) {
      console.error('Failed to insert pipeline_inheritance:', insertInhErr);
    }

    return {
      opportunity: (savedOpp || newOpportunity) as PipelineOpportunity,
      inheritance: (savedInh || newInheritance) as PipelineInheritance,
      isNew: true
    };
  }

  /**
   * 2. List All Pipeline Opportunities with Latest Assessment Summary
   */
  static async listPipelineOpportunities(): Promise<Array<PipelineOpportunity & {
    latest_assessment?: PipelineAssessment;
  }>> {
    const { data: opportunities, error } = await supabase
      .from('pipeline_opportunities')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching pipeline opportunities:', error);
      return [];
    }

    if (!opportunities || opportunities.length === 0) {
      return [];
    }

    const pipeIds = opportunities.map(o => o.pipeline_id);
    const { data: assessments } = await supabase
      .from('pipeline_assessments')
      .select('*')
      .in('pipeline_id', pipeIds)
      .order('assessment_sequence', { ascending: false });

    const assessmentMap = new Map<string, PipelineAssessment>();
    (assessments || []).forEach(a => {
      if (!assessmentMap.has(a.pipeline_id)) {
        assessmentMap.set(a.pipeline_id, a as PipelineAssessment);
      }
    });

    return opportunities.map(opp => ({
      ...opp,
      latest_assessment: assessmentMap.get(opp.pipeline_id)
    }));
  }

  /**
   * 3. Get Pipeline Assessment by Pipeline ID
   */
  static async getLatestAssessment(pipelineId: string): Promise<{
    assessment: PipelineAssessment | null;
    padf_results: PipelinePADFResult[];
    swot_results: PipelineSWOTResult[];
    risks: PipelineRisk[];
    strategies: PipelineStrategy[];
    actions: PipelineAction[];
  }> {
    const { data: assessment } = await supabase
      .from('pipeline_assessments')
      .select('*')
      .eq('pipeline_id', pipelineId)
      .order('assessment_sequence', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!assessment) {
      return {
        assessment: null,
        padf_results: [],
        swot_results: [],
        risks: [],
        strategies: [],
        actions: []
      };
    }

    const assessmentId = assessment.assessment_id;

    const [padfRes, swotRes, risksRes, stratRes, actRes] = await Promise.all([
      supabase.from('pipeline_padf_results').select('*').eq('assessment_id', assessmentId),
      supabase.from('pipeline_swot_results').select('*').eq('assessment_id', assessmentId),
      supabase.from('pipeline_risks').select('*').eq('assessment_id', assessmentId),
      supabase.from('pipeline_strategies').select('*').eq('assessment_id', assessmentId),
      supabase.from('pipeline_actions').select('*').eq('pipeline_id', pipelineId)
    ]);

    return {
      assessment: assessment as PipelineAssessment,
      padf_results: (padfRes.data || []) as PipelinePADFResult[],
      swot_results: (swotRes.data || []) as PipelineSWOTResult[],
      risks: (risksRes.data || []) as PipelineRisk[],
      strategies: (stratRes.data || []) as PipelineStrategy[],
      actions: (actRes.data || []) as PipelineAction[]
    };
  }

  /**
   * 4. Evidence Management: Add Single Evidence Record
   */
  static async addEvidence(evidence: Omit<PipelineEvidence, 'id' | 'created_at' | 'updated_at'>): Promise<PipelineEvidence> {
    const { data, error } = await supabase
      .from('pipeline_evidence')
      .insert([evidence])
      .select()
      .single();

    if (error) {
      console.error('Error inserting pipeline_evidence:', error);
      throw error;
    }
    return data as PipelineEvidence;
  }

  /**
   * 5. Evidence Management: List Evidence for Pipeline Opportunity
   */
  static async listEvidence(pipelineId: string): Promise<PipelineEvidence[]> {
    const { data, error } = await supabase
      .from('pipeline_evidence')
      .select('*')
      .eq('pipeline_id', pipelineId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching pipeline_evidence:', error);
      return [];
    }
    return (data || []) as PipelineEvidence[];
  }

  /**
   * 6. Historical Assessment Snapshots Retrieval
   */
  static async getAssessmentSnapshots(pipelineId: string): Promise<PipelineAssessmentSnapshot[]> {
    const { data, error } = await supabase
      .from('pipeline_assessment_snapshots')
      .select('*')
      .eq('pipeline_id', pipelineId)
      .order('snapshot_sequence', { ascending: true });

    if (error) {
      console.error('Error fetching pipeline_assessment_snapshots:', error);
      return [];
    }
    return (data || []) as PipelineAssessmentSnapshot[];
  }

  /**
   * 7. Update Action Status
   */
  static async updateActionStatus(actionId: string, status: PipelineAction['action_status'], notes?: string): Promise<boolean> {
    const { error } = await supabase
      .from('pipeline_actions')
      .update({
        action_status: status,
        completion_notes: notes || null,
        updated_at: new Date().toISOString()
      })
      .eq('action_id', actionId);

    if (error) {
      console.error('Error updating pipeline_action status:', error);
      return false;
    }
    return true;
  }

  /**
   * 7b. Update Pipeline Opportunity Stage & Lifecycle Outcome (Closed Won / Closed Lost)
   */
  static async updatePipelineStage(
    pipelineId: string,
    updates: {
      pipeline_stage?: string;
      sales_stage?: string;
      lifecycle_status?: PipelineOpportunity['lifecycle_status'];
      closure_outcome?: {
        outcome: 'CLOSED_WON' | 'CLOSED_LOST' | 'ACTIVE';
        primary_reason?: string;
        competitor?: string;
        lessons_learned?: string;
        closed_at?: string;
      };
    }
  ): Promise<PipelineOpportunity | null> {
    const { data: currentRow } = await supabase
      .from('pipeline_opportunities')
      .select('metadata')
      .eq('pipeline_id', pipelineId)
      .maybeSingle();

    const mergedMetadata = {
      ...((currentRow?.metadata as Record<string, unknown>) || {}),
      ...(updates.closure_outcome ? { closure_outcome: updates.closure_outcome } : {})
    };

    const payload: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
      metadata: mergedMetadata
    };

    if (updates.pipeline_stage !== undefined) payload.pipeline_stage = updates.pipeline_stage;
    if (updates.sales_stage !== undefined) payload.sales_stage = updates.sales_stage;
    if (updates.lifecycle_status !== undefined) payload.lifecycle_status = updates.lifecycle_status;

    const { data, error } = await supabase
      .from('pipeline_opportunities')
      .update(payload)
      .eq('pipeline_id', pipelineId)
      .select()
      .maybeSingle();

    if (error) {
      console.error('Error updating pipeline_opportunity stage:', error);
      return null;
    }
    return (data as PipelineOpportunity) || null;
  }

  /**
   * 7c. Update Risk Status & Owner
   */
  static async updateRiskStatus(
    riskInstanceId: string,
    riskStatus: PipelineRisk['risk_status'],
    owner?: string
  ): Promise<boolean> {
    const payload: Record<string, unknown> = {
      risk_status: riskStatus,
      updated_at: new Date().toISOString()
    };
    if (owner !== undefined) {
      payload.owner = owner;
    }

    const { error } = await supabase
      .from('pipeline_risks')
      .update(payload)
      .eq('risk_instance_id', riskInstanceId);

    if (error) {
      console.error('Error updating pipeline_risk status:', error);
      return false;
    }
    return true;
  }

  /**
   * 7d. Update TOWS Strategy Status
   */
  static async updateStrategyStatus(
    strategyInstanceId: string,
    strategyStatus: PipelineStrategy['strategy_status']
  ): Promise<boolean> {
    const { error } = await supabase
      .from('pipeline_strategies')
      .update({
        strategy_status: strategyStatus,
        updated_at: new Date().toISOString()
      })
      .eq('strategy_instance_id', strategyInstanceId);

    if (error) {
      console.error('Error updating pipeline_strategy status:', error);
      return false;
    }
    return true;
  }

  /**
   * 8. Query Evidence Questions (Backend KB via Edge Function + Local Static Registry Merge)
   */
  static async queryEvidenceQuestions(
    pipelineId?: string,
    revenueMotion?: string,
    industry?: string
  ): Promise<{
    dimensions: any[];
    grouped_questions: Record<string, any[]>;
    existing_evidence: PipelineEvidence[];
  }> {
    let remoteData: any = null;
    try {
      const { data, error } = await supabase.functions.invoke('pipeline-assessment', {
        body: {
          action: 'query-evidence-questions',
          pipeline_id: pipelineId,
          pipeline_opportunity_id: pipelineId,
          revenue_motion: revenueMotion,
          industry: industry
        }
      });
      if (!error && data) {
        remoteData = data;
      }
    } catch (err) {
      console.warn('Edge function query-evidence-questions fallback to local registry:', err);
    }

    const existingEvidence = pipelineId
      ? (remoteData?.existing_evidence?.length ? remoteData.existing_evidence : await this.listEvidence(pipelineId))
      : [];

    const canonicalDims = PipelineConfigService.getCanonicalPADFDimensions();
    const kbGrouped = PipelineConfigService.getEvidenceObjectsByPADF();
    const remoteGrouped: Record<string, any[]> = remoteData?.grouped_questions || {};

    // Merge remote suggested answers / questions cleanly with full KB Phase 3 definitions
    const mergedGrouped: Record<string, any[]> = {};
    canonicalDims.forEach(dim => {
      const kbItems = kbGrouped[dim.id] || [];
      const remoteItems = remoteGrouped[dim.id] || [];
      const remoteById = new Map<string, any>();
      remoteItems.forEach((r: any) => {
        if (r?.id || r?.evidenceId) {
          remoteById.set(r.id || r.evidenceId, r);
        }
      });

      mergedGrouped[dim.id] = kbItems.map((kbObj: any) => {
        const evId = kbObj.evidenceId;
        const r = remoteById.get(evId) || {};
        return {
          ...kbObj,
          id: evId,
          dimension: dim.id,
          question: r.question || kbObj.validationQuestions?.[0] || kbObj.definition,
          positiveSignals: r.positiveSignals || kbObj.strongEvidenceIndicators || [],
          negativeSignals: r.negativeSignals || kbObj.weakEvidenceIndicators || [],
          suggestedAnswers: r.suggestedAnswers || []
        };
      });
    });

    return {
      dimensions: canonicalDims,
      grouped_questions: mergedGrouped,
      existing_evidence: existingEvidence
    };
  }

  /**
   * 9. Submit Evidence Batch (Edge Function + Resilient Direct SQL Fallback)
   */
  static async submitEvidenceBatch(pipelineId: string, evidenceRecords: any[]): Promise<{
    status: string;
    pipeline_id: string;
    evidence_count: number;
    evidence: PipelineEvidence[];
  }> {
    const { data: preOpp } = await supabase
      .from('pipeline_opportunities')
      .select('pipeline_stage')
      .eq('pipeline_id', pipelineId)
      .maybeSingle();

    const preserveStage =
      preOpp?.pipeline_stage === 'Discovery & Solutioning' ||
      preOpp?.pipeline_stage === 'Proposal & Negotiation';

    try {
      const { data, error } = await supabase.functions.invoke('pipeline-assessment', {
        body: {
          action: 'submit-pipeline-evidence',
          pipeline_id: pipelineId,
          pipeline_opportunity_id: pipelineId,
          evidence_records: evidenceRecords
        }
      });
      if (!error && data?.status === 'success') {
        if (preserveStage && preOpp?.pipeline_stage) {
          await supabase
            .from('pipeline_opportunities')
            .update({ pipeline_stage: preOpp.pipeline_stage })
            .eq('pipeline_id', pipelineId);
        }
        try {
          await this.syncEvidenceRelationships(pipelineId, (data.evidence || []) as PipelineEvidence[]);
        } catch (_relErr) {}
        return data;
      }
    } catch (err) {
      console.warn('Edge function submit-pipeline-evidence unavailable, persisting directly to Supabase:', err);
    }

    // Direct Supabase Data API fallback preserving exact SQL column contract
    const rowsToInsert = evidenceRecords.map((ev: any) => {
      const statement = String(ev.evidence_statement || ev.content || '').trim();
      const confidence = Number(ev.evidence_confidence ?? ev.confidence_score ?? 85);
      const quality: 'HIGH' | 'MEDIUM' | 'LOW' = confidence >= 80 ? 'HIGH' : confidence >= 55 ? 'MEDIUM' : 'LOW';
      const instanceId = ev.evidence_instance_id || `EVI_${pipelineId}_${ev.evidence_object_id}`;

      return {
        evidence_instance_id: instanceId,
        pipeline_id: pipelineId,
        evidence_object_id: ev.evidence_object_id,
        evidence_type: ev.evidence_type || 'customer_statement',
        evidence_statement: statement,
        source_type: ev.source_type || 'ES03_Customer_Meeting_Notes',
        source_reference: ev.source_reference || 'Pipeline Assessment Form',
        recorded_by: ev.recorded_by || 'Sales Representative',
        verification_status: ev.customer_confirmed ? 'VERIFIED' : 'UNVERIFIED',
        evidence_quality: quality,
        evidence_confidence: confidence,
        customer_confirmed: Boolean(ev.customer_confirmed),
        freshness_days: 0,
        notes: ev.notes || null,
        metadata: {
          ...(ev.metadata || {}),
          dimension_code: ev.dimension_code,
          suggested_selection: ev.suggested_selection || null
        },
        updated_at: new Date().toISOString()
      };
    });

    const objectIds = rowsToInsert.map(r => r.evidence_object_id).filter(Boolean);
    if (objectIds.length > 0) {
      await supabase
        .from('pipeline_evidence')
        .delete()
        .eq('pipeline_id', pipelineId)
        .in('evidence_object_id', objectIds);
    }

    const { data: inserted, error: insertError } = await supabase
      .from('pipeline_evidence')
      .insert(rowsToInsert)
      .select();

    if (insertError) throw insertError;

    if (!preserveStage) {
      await supabase
        .from('pipeline_opportunities')
        .update({
          pipeline_stage: 'Evidence Populated',
          updated_at: new Date().toISOString()
        })
        .eq('pipeline_id', pipelineId);
    }

    const persistedEvidence = (inserted || []) as PipelineEvidence[];
    try {
      await this.syncEvidenceRelationships(pipelineId, persistedEvidence);
    } catch (_relErr) {}

    return {
      status: 'success',
      pipeline_id: pipelineId,
      evidence_count: persistedEvidence.length,
      evidence: persistedEvidence
    };
  }

  /**
   * 10. Validate Evidence Readiness (Gemini Validation via Edge Function + Local Coverage Audit Fallback)
   */
  static async validateEvidence(pipelineId: string, evidenceRecords: any[]): Promise<{
    status: 'VALIDATED' | 'NEEDS_ATTENTION';
    ready_for_assessment: boolean;
    populated_count: number;
    total_questions: number;
    unconfirmed_count: number;
    missing_mandatory_dimensions: string[];
    dimension_coverage: Record<string, { answered: number; total: number; status: string }>;
    ai_validation_verdict: string;
  }> {
    try {
      const { data, error } = await supabase.functions.invoke('pipeline-assessment', {
        body: {
          action: 'validate-evidence',
          pipeline_id: pipelineId,
          pipeline_opportunity_id: pipelineId,
          evidence_records: evidenceRecords
        }
      });
      if (!error && data && data.dimension_coverage) {
        return data;
      }
    } catch (err) {
      console.warn('Edge function validate-evidence fallback to local deterministic check:', err);
    }

    const dims = PipelineConfigService.getCanonicalPADFDimensions();
    const grouped = PipelineConfigService.getEvidenceObjectsByPADF();
    const populatedSet = new Set(
      (evidenceRecords || [])
        .filter((r: any) => String(r.evidence_statement || '').trim().length > 0)
        .map((r: any) => r.evidence_object_id)
    );

    const dimensionCoverage: Record<string, { answered: number; total: number; status: string }> = {};
    let totalQuestions = 0;
    dims.forEach(d => {
      const items = grouped[d.id] || [];
      totalQuestions += items.length;
      const answered = items.filter((i: any) => populatedSet.has(i.evidenceId)).length;
      dimensionCoverage[d.id] = {
        answered,
        total: items.length,
        status: answered === items.length ? 'COMPLETE' : answered > 0 ? 'PARTIAL' : 'MISSING'
      };
    });

    const missingMandatory = dims
      .filter(d => d.mandatory && (dimensionCoverage[d.id]?.answered || 0) === 0)
      .map(d => `${d.shortCode}: ${d.name}`);

    const unconfirmedCount = (evidenceRecords || []).filter((r: any) => !r.customer_confirmed).length;
    const ready = populatedSet.size >= 8 && missingMandatory.length === 0;

    return {
      status: ready ? 'VALIDATED' : 'NEEDS_ATTENTION',
      ready_for_assessment: ready,
      populated_count: populatedSet.size,
      total_questions: totalQuestions || 48,
      unconfirmed_count: unconfirmedCount,
      missing_mandatory_dimensions: missingMandatory,
      dimension_coverage: dimensionCoverage,
      ai_validation_verdict: ready
        ? `Validated ${populatedSet.size} of ${totalQuestions || 48} evidence points across all mandatory PADF dimensions (PA1–PA4). Ready to execute Gemini Pipeline Assessment.`
        : `Collected ${populatedSet.size} of ${totalQuestions || 48} evidence items. Mandatory dimension coverage gaps: ${missingMandatory.join(', ') || 'Populate at least 8 evidence responses across PA1–PA4'}.`
    };
  }

  /**
   * 11. Edge Function: Run Pipeline Assessment (Deterministic + Gemini Reasoning)
   * Stage 7 Enhancement: Preserves active commercial Kanban stage and syncs pipeline_evidence_relationships
   */
  static async runPipelineAssessment(pipelineId: string): Promise<any> {
    // Capture prior commercial stage before Edge Function executes
    const { data: preOpp } = await supabase
      .from('pipeline_opportunities')
      .select('pipeline_stage, lifecycle_status')
      .eq('pipeline_id', pipelineId)
      .maybeSingle();

    const { data, error } = await supabase.functions.invoke('pipeline-assessment', {
      body: {
        action: 'run-pipeline-assessment',
        pipeline_id: pipelineId,
        pipeline_opportunity_id: pipelineId
      }
    });
    if (error) throw error;

    // Preserve advanced Kanban stage so reassessment does not regress Discovery / Proposal deals
    if (
      preOpp &&
      (preOpp.pipeline_stage === 'Discovery & Solutioning' ||
        preOpp.pipeline_stage === 'Proposal & Negotiation')
    ) {
      await supabase
        .from('pipeline_opportunities')
        .update({ pipeline_stage: preOpp.pipeline_stage })
        .eq('pipeline_id', pipelineId);
    }

    // Materialize evidence-to-SWOT relationships cleanly for full 11-table lineage
    try {
      const evList = await this.listEvidence(pipelineId);
      await this.syncEvidenceRelationships(pipelineId, evList);
    } catch (relErr) {
      console.warn('Non-blocking warning syncing pipeline_evidence_relationships:', relErr);
    }

    return data;
  }

  /**
   * 12. Edge Function: Retrieve Assessment Result
   */
  static async retrieveAssessmentResult(pipelineId: string, assessmentId?: string): Promise<any> {
    const { data, error } = await supabase.functions.invoke('pipeline-assessment', {
      body: {
        action: 'retrieve-assessment',
        pipeline_id: pipelineId,
        pipeline_opportunity_id: pipelineId,
        assessment_id: assessmentId
      }
    });
    if (error) throw error;
    return data;
  }

  /**
   * 13. Stage 7: Revalidate Upstream PADIF Inheritance Record
   */
  static async revalidateInheritance(
    inheritanceId: string,
    status: PipelineInheritance['validation_status'] = 'VALIDATED',
    notes?: string
  ): Promise<PipelineInheritance | null> {
    const { data, error } = await supabase
      .from('pipeline_inheritance')
      .update({
        validation_status: status,
        revalidated_at: new Date().toISOString(),
        notes: notes || 'Revalidated by Deal Owner during Pipeline Governance Audit',
        updated_at: new Date().toISOString()
      })
      .eq('inheritance_id', inheritanceId)
      .select()
      .maybeSingle();

    if (error) {
      console.error('Error revalidating pipeline_inheritance:', error);
      return null;
    }
    return (data as PipelineInheritance) || null;
  }

  /**
   * 14. Stage 7: List & Sync Evidence Relationships (pipeline_evidence_relationships)
   */
  static async listEvidenceRelationships(pipelineId: string): Promise<PipelineEvidenceRelationship[]> {
    const { data, error } = await supabase
      .from('pipeline_evidence_relationships')
      .select('*')
      .eq('pipeline_id', pipelineId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching pipeline_evidence_relationships:', error);
      return [];
    }
    return (data || []) as PipelineEvidenceRelationship[];
  }

  static async syncEvidenceRelationships(
    pipelineId: string,
    evidenceList: PipelineEvidence[]
  ): Promise<PipelineEvidenceRelationship[]> {
    if (!evidenceList || evidenceList.length === 0) return [];

    const allKbObjs = PipelineConfigService.getAllEvidenceObjects();
    const kbDimMap = new Map<string, string>();
    allKbObjs.forEach((obj: any) => {
      if (obj.evidenceId) {
        kbDimMap.set(
          obj.evidenceId,
          PipelineConfigService.normalizePADFDimensionId(obj.primaryPADFDimension || 'PA1')
        );
      }
    });

    const relRows: Array<Omit<PipelineEvidenceRelationship, 'id' | 'created_at'>> = [];

    evidenceList.forEach((ev) => {
      if (!ev.evidence_object_id) return;
      const approvedMappings = PipelineConfigService.getMappingsForEvidenceObject(ev.evidence_object_id);
      const primaryDim =
        kbDimMap.get(ev.evidence_object_id) ||
        PipelineConfigService.normalizePADFDimensionId(
          String((ev.metadata as any)?.dimension_code || 'PA1')
        );

      const lowerStmt = (ev.evidence_statement || '').toLowerCase();
      const conf = Number(ev.evidence_confidence ?? 70);

      let runtimeRel: RuntimeRelationshipType = 'CONTEXTUALIZES';
      let runtimePol: RuntimePolarityType = 'NEUTRAL';

      if (lowerStmt.includes('gap') || lowerStmt.includes('unknown') || lowerStmt.includes('not yet') || conf <= 40) {
        runtimeRel = 'GAP_SIGNAL';
        runtimePol = 'NEGATIVE';
      } else if (lowerStmt.includes('rejected') || lowerStmt.includes('veto') || lowerStmt.includes('competitor') || conf < 55) {
        runtimeRel = 'CONTRADICTS';
        runtimePol = 'NEGATIVE';
      } else if (ev.customer_confirmed || conf >= 75) {
        runtimeRel = 'SUPPORTS';
        runtimePol = 'POSITIVE';
      } else {
        runtimeRel = 'QUALIFIES';
        runtimePol = 'MIXED';
      }

      if (approvedMappings.length > 0) {
        approvedMappings.forEach((m) => {
          relRows.push({
            relationship_id: `REL_${pipelineId}_${ev.evidence_object_id}_${m.factorId}`,
            evidence_instance_id: ev.evidence_instance_id,
            pipeline_id: pipelineId,
            target_factor_id: m.factorId,
            target_dimension_id: primaryDim,
            mapping_source: `EvidenceKB_v1.1:${m.mappingId}`,
            mapping_relevance: m.mappingStrength,
            runtime_relationship: runtimeRel,
            runtime_polarity: runtimePol,
            runtime_interpretation: `${ev.customer_confirmed ? 'Confirmed' : 'Unconfirmed'} (${conf}% KB confidence) via ${ev.source_type}`
          });
        });
      } else {
        // Explicit PADF dimension link even when factor mapping is intentionally unmapped
        relRows.push({
          relationship_id: `REL_${pipelineId}_${ev.evidence_object_id}_${primaryDim}`,
          evidence_instance_id: ev.evidence_instance_id,
          pipeline_id: pipelineId,
          target_factor_id: undefined,
          target_dimension_id: primaryDim,
          mapping_source: 'PADF_Dimension_Registry',
          mapping_relevance: 'DIRECT',
          runtime_relationship: runtimeRel,
          runtime_polarity: runtimePol,
          runtime_interpretation: `${ev.customer_confirmed ? 'Confirmed' : 'Unconfirmed'} (${conf}% KB confidence)`
        });
      }
    });

    if (relRows.length === 0) return [];

    await supabase.from('pipeline_evidence_relationships').delete().eq('pipeline_id', pipelineId);
    const { data, error } = await supabase
      .from('pipeline_evidence_relationships')
      .insert(relRows)
      .select();

    if (error) {
      console.error('Error syncing pipeline_evidence_relationships:', error);
      return [];
    }
    return (data || []) as PipelineEvidenceRelationship[];
  }

  /**
   * 15. Stage 7: Continuous Monitoring & Material Change Reassessment Audit
   */
  static evaluateReassessmentNeeds(params: {
    opportunity: PipelineOpportunity;
    inheritance: PipelineInheritance | null;
    assessment: PipelineAssessment | null;
    evidence: PipelineEvidence[];
    risks: PipelineRisk[];
    actions: PipelineAction[];
  }): {
    reassessmentRequired: boolean;
    reasons: string[];
    staleEvidenceIds: string[];
    updatedEvidenceCount: number;
    updatedRiskCount: number;
    updatedActionCount: number;
    unconfirmedEvidenceCount: number;
  } {
    const { inheritance, assessment, evidence, risks, actions } = params;
    const reasons: string[] = [];

    const nowMs = Date.now();
    const staleThresholdMs = 30 * 24 * 60 * 60 * 1000;
    const staleEvidenceIds = evidence
      .filter((ev) => {
        if (ev.verification_status === 'STALE') return true;
        const ts = ev.updated_at || ev.created_at;
        return ts ? nowMs - new Date(ts).getTime() > staleThresholdMs : false;
      })
      .map((ev) => ev.evidence_instance_id);

    const unconfirmedEvidenceCount = evidence.filter((ev) => !ev.customer_confirmed).length;

    if (!assessment) {
      return {
        reassessmentRequired: evidence.length > 0,
        reasons: evidence.length > 0 ? ['Evidence collected — initial Pipeline Assessment has not been run yet.'] : [],
        staleEvidenceIds,
        updatedEvidenceCount: evidence.length,
        updatedRiskCount: 0,
        updatedActionCount: 0,
        unconfirmedEvidenceCount
      };
    }

    const assessTimeMs = new Date(assessment.completed_at || assessment.created_at || 0).getTime();

    const updatedEvidenceCount = evidence.filter((ev) => {
      const ts = new Date(ev.updated_at || ev.created_at || 0).getTime();
      return ts > assessTimeMs + 5000;
    }).length;

    const updatedRiskCount = risks.filter((r) => {
      const ts = new Date(r.updated_at || r.created_at || 0).getTime();
      return ts > assessTimeMs + 5000;
    }).length;

    const updatedActionCount = actions.filter((a) => {
      const ts = new Date(a.updated_at || a.created_at || 0).getTime();
      return ts > assessTimeMs + 5000;
    }).length;

    if (updatedEvidenceCount > 0) {
      reasons.push(`${updatedEvidenceCount} evidence record(s) added or updated since Assessment #${assessment.assessment_sequence}.`);
    }
    if (updatedRiskCount > 0) {
      reasons.push(`${updatedRiskCount} formal risk status/mitigation change(s) logged since last assessment.`);
    }
    if (updatedActionCount > 0) {
      reasons.push(`${updatedActionCount} execution action(s) progressed since last assessment.`);
    }
    if (staleEvidenceIds.length > 0) {
      reasons.push(`${staleEvidenceIds.length} evidence item(s) exceed 30-day freshness threshold.`);
    }
    if (inheritance?.validation_status === 'REQUIRES_REVALIDATION') {
      reasons.push('Upstream PADIF qualification context requires owner revalidation.');
    }

    return {
      reassessmentRequired: reasons.length > 0,
      reasons,
      staleEvidenceIds,
      updatedEvidenceCount,
      updatedRiskCount,
      updatedActionCount,
      unconfirmedEvidenceCount
    };
  }
}

