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
  RuntimePolarityType,
  PipelineOpportunityHandoverDetail,
  PADIFEvidenceProvenanceItem,
  PADIFDimensionMappingItem,
  OpportunityHandoverQualificationContinuity,
  OpportunityHandoverCanonicalClassification,
  OpportunityHandoverUpstreamRisks,
  PipelineFormRecord
} from '../../types/pipeline';
import { PipelineConfigService } from './PipelineConfigService';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const isValidUuid = (id?: string | null): id is string => typeof id === 'string' && UUID_REGEX.test(id);

export class PipelineDataService {
  private static pendingGetOrCreate = new Map<
    string,
    Promise<{
      opportunity: PipelineOpportunity;
      inheritance: PipelineInheritance;
      isNew: boolean;
    }>
  >();

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
    const inflightKey = `${primaryId}::${leadIdHint || ''}`;

    const existingPromise = this.pendingGetOrCreate.get(inflightKey);
    if (existingPromise) {
      return existingPromise;
    }

    const runPromise = this.executeGetOrCreatePipelineOpportunity(primaryId, leadIdHint).finally(() => {
      this.pendingGetOrCreate.delete(inflightKey);
    });
    this.pendingGetOrCreate.set(inflightKey, runPromise);
    return runPromise;
  }

  private static async executeGetOrCreatePipelineOpportunity(
    primaryId: string,
    leadIdHint?: string
  ): Promise<{
    opportunity: PipelineOpportunity;
    inheritance: PipelineInheritance;
    isNew: boolean;
  }> {

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
      customer_name?: string;
      opportunity_name?: string;
      deal_value?: number;
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
    if (updates.customer_name !== undefined) payload.customer_name = updates.customer_name;
    if (updates.opportunity_name !== undefined) payload.opportunity_name = updates.opportunity_name;
    if (updates.deal_value !== undefined) payload.deal_value = updates.deal_value;
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
   * 8. Query Evidence Questions (Pure Static Frontend JSON Layers + Supabase existing_evidence)
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
    const existingEvidence = pipelineId ? await this.listEvidence(pipelineId) : [];
    const canonicalDims = PipelineConfigService.getCanonicalPADFDimensions();
    const kbGrouped = PipelineConfigService.getEvidenceObjectsByPADF();

    const staticGrouped: Record<string, any[]> = {};
    canonicalDims.forEach(dim => {
      const kbItems = kbGrouped[dim.id] || [];
      staticGrouped[dim.id] = kbItems.map((kbObj: any) => {
        const evId = kbObj.evidenceId;
        const contextualSignals = PipelineConfigService.getContextualEvidenceSignalsForObject(
          kbObj,
          revenueMotion,
          industry
        );
        const synthesizedAnswers = PipelineConfigService.synthesizeSuggestedAnswers(
          kbObj,
          revenueMotion,
          industry
        );

        const positiveSignals = [
          ...(Array.isArray(kbObj.strongEvidenceIndicators) ? kbObj.strongEvidenceIndicators : []),
          ...contextualSignals.motionHighValueSignals,
          ...contextualSignals.industryValidationRequirements
        ];
        const negativeSignals = [
          ...(Array.isArray(kbObj.weakEvidenceIndicators) ? kbObj.weakEvidenceIndicators : []),
          ...contextualSignals.motionWeakSignals,
          ...contextualSignals.industryNegativeSignals
        ];

        return {
          ...kbObj,
          id: evId,
          dimension: dim.id,
          question: kbObj.validationQuestions?.[0] || kbObj.definition,
          positiveSignals: [...new Set(positiveSignals)],
          negativeSignals: [...new Set(negativeSignals)],
          contextualSignals,
          suggestedAnswers: synthesizedAnswers
        };
      });
    });

    return {
      dimensions: canonicalDims,
      grouped_questions: staticGrouped,
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

    const preserveStage = Boolean(
      preOpp?.pipeline_stage &&
        preOpp.pipeline_stage !== 'Active Assessment'
    );

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
   * 12b. Save / Persist Full Assessment Result & Create Audit Snapshot in Supabase
   */
  static async saveAssessmentResult(
    pipelineId: string,
    assessmentId: string,
    payload: {
      executive_summary?: PipelineAssessment['executive_summary'];
      raw_reasoning_output?: PipelineAssessment['raw_reasoning_output'];
      pipeline_health?: PipelineAssessment['pipeline_health'];
      base_winability?: number;
      risk_adjusted_winability?: number;
      assessment_confidence?: number;
    }
  ): Promise<PipelineAssessment | null> {
    if (!pipelineId || !assessmentId) return null;

    try {
      const { data, error } = await supabase.functions.invoke('pipeline-assessment', {
        body: {
          action: 'save-assessment-result',
          pipeline_id: pipelineId,
          assessment_id: assessmentId,
          executive_summary: payload.executive_summary,
          raw_reasoning_output: payload.raw_reasoning_output
        }
      });
      if (!error && data?.assessment) {
        return data.assessment as PipelineAssessment;
      }
    } catch (err) {
      console.warn('Edge function save-assessment-result unavailable, persisting directly to Supabase:', err);
    }

    const nowIso = new Date().toISOString();
    const updateBody: Record<string, unknown> = {
      updated_at: nowIso
    };
    if (payload.executive_summary) updateBody.executive_summary = payload.executive_summary;
    if (payload.raw_reasoning_output) updateBody.raw_reasoning_output = payload.raw_reasoning_output;

    const { data: updatedAssessment, error: updError } = await supabase
      .from('pipeline_assessments')
      .update(updateBody)
      .eq('assessment_id', assessmentId)
      .select()
      .maybeSingle();

    if (updError) {
      console.error('Error saving assessment result to Supabase:', updError);
      throw updError;
    }

    if (updatedAssessment) {
      await supabase.from('pipeline_assessment_snapshots').insert({
        snapshot_id: `SNAP_${assessmentId}_SAVED_${Date.now()}`,
        pipeline_id: pipelineId,
        assessment_id: assessmentId,
        snapshot_sequence: (updatedAssessment as PipelineAssessment).assessment_sequence || 1,
        snapshot_timestamp: nowIso,
        full_snapshot_payload: { assessment: updatedAssessment }
      });
    }

    return (updatedAssessment as PipelineAssessment) || null;
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

  /**
   * 16. Isolated Opportunity Handover Detail (PADIF v1.0) Persistence & Read-Only Upstream Hydration
   * Reads upstream Opportunity Qualification records strictly read-only and persists the
   * Opportunity Handover Detail payload exclusively inside `pipeline_opportunity_handover_details`.
   */
  static async getOpportunityHandoverDetail(
    pipelineId: string
  ): Promise<PipelineOpportunityHandoverDetail | null> {
    if (!pipelineId) return null;

    try {
      const { data, error } = await supabase
        .from('pipeline_opportunity_handover_details')
        .select('*')
        .eq('pipeline_id', pipelineId)
        .maybeSingle();

      if (!error && data) {
        return {
          ...(data as PipelineOpportunityHandoverDetail),
          persisted_in_db: true
        };
      }
    } catch (e) {
      console.warn('pipeline_opportunity_handover_details read note:', e);
    }

    if (typeof window !== 'undefined') {
      try {
        const cached = localStorage.getItem(`pipeline_handover_detail_${pipelineId}`);
        if (cached) {
          return {
            ...(JSON.parse(cached) as PipelineOpportunityHandoverDetail),
            persisted_in_db: false
          };
        }
      } catch {}
    }

    return null;
  }

  static async getOrSyncOpportunityHandoverDetail(
    opportunity: PipelineOpportunity,
    inheritance?: PipelineInheritance | null,
    forceRefresh = false
  ): Promise<PipelineOpportunityHandoverDetail> {
    const existing = await this.getOpportunityHandoverDetail(opportunity.pipeline_id);
    const isObservedSupportingMode =
      (existing?.padif_package as any)?.evidence_source_mode === 'observed_supporting_evidence';
    if (
      existing &&
      !forceRefresh &&
      isObservedSupportingMode &&
      existing.qualification_continuity &&
      existing.canonical_classification &&
      existing.upstream_handover_risks
    ) {
      return existing;
    }

    const oppId =
      opportunity.opportunity_id ||
      inheritance?.opportunity_id ||
      (opportunity.metadata as any)?.original_opportunity_id ||
      '';
    const leadId =
      opportunity.lead_id ||
      inheritance?.lead_id ||
      (opportunity.metadata as any)?.original_lead_id ||
      '';

    const emptySingle = Promise.resolve({ data: null });
    const emptyList = Promise.resolve({ data: [] });

    // Read upstream Opportunity Qualification intelligence strictly read-only
    const [oppRes, formRes, sessionRes, handoverRes, historyRes, leadRes] =
      await Promise.all([
        isValidUuid(oppId)
          ? supabase.from('opportunities').select('*').eq('id', oppId).maybeSingle()
          : emptySingle,
        isValidUuid(oppId)
          ? supabase.from('opportunity_form_records').select('*').eq('opportunity_id', oppId).maybeSingle()
          : emptySingle,
        isValidUuid(oppId)
          ? supabase
              .from('opportunity_qualification_sessions')
              .select('*')
              .eq('opportunity_id', oppId)
              .order('created_at', { ascending: false })
              .limit(1)
              .maybeSingle()
          : emptySingle,
        isValidUuid(oppId)
          ? supabase
              .from('opportunity_sql_handover_details')
              .select('*')
              .eq('opportunity_id', oppId)
              .maybeSingle()
          : emptySingle,
        isValidUuid(oppId)
          ? supabase
              .from('opportunity_qualification_history')
              .select('*')
              .eq('opportunity_id', oppId)
              .order('created_at', { ascending: false })
              .limit(10)
          : emptyList,
        isValidUuid(leadId)
          ? supabase.from('mql_leads').select('*').eq('id', leadId).maybeSingle()
          : emptySingle
      ]);

    const upstreamOpp: any = oppRes.data || {};
    const formRecord: any = formRes.data || {};
    const session: any = sessionRes.data || {};
    const sqlHandover: any = handoverRes.data || {};
    const leadRow: any = leadRes.data || {};
    let oqResult: any = null;

    if (session?.id && isValidUuid(session.id)) {
      const { data: resBySession } = await supabase
        .from('opportunity_qualification_results')
        .select('*')
        .eq('session_id', session.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (resBySession) oqResult = resBySession;
    }

    if (!oqResult && typeof window !== 'undefined' && oppId) {
      try {
        const cachedOq = localStorage.getItem(`oq_result_${oppId}`);
        if (cachedOq) {
          oqResult = JSON.parse(cachedOq);
        }
      } catch {}
    }

    const inhPayload = (inheritance?.inherited_payload || {}) as any;
    const inhOq = inhPayload.opportunity_qualification || {};
    const inhLead = inhPayload.upstream_lead || {};
    const sqlQip = session?.sql_inheritance_data || sqlHandover?.sql_qip_package || inhPayload.sql_qip_package || {};

    let oppDesc: any = {};
    if (upstreamOpp?.description && typeof upstreamOpp.description === 'string' && upstreamOpp.description.trim().startsWith('{')) {
      try {
        oppDesc = JSON.parse(upstreamOpp.description);
      } catch {}
    }

    // --- Build Section 1: Qualification Continuity (I3 + I4) ---
    const finalDecisionSum = oqResult?.final_decision?.qualification_summary || {};
    const rawDimList: any[] = Array.isArray(oqResult?.dimension_results)
      ? oqResult.dimension_results
      : Array.isArray(inhOq.dimension_results)
        ? inhOq.dimension_results
        : [];

    const qDecision =
      oqResult?.qualification_status ||
      finalDecisionSum.qualification_status ||
      session?.qualification_status ||
      inheritance?.qualification_decision ||
      inhOq.qualification_status ||
      'QUALIFIED';

    const qScore = Number(
      oqResult?.overall_score ??
        finalDecisionSum.overall_score ??
        session?.overall_score ??
        inheritance?.qualification_score ??
        inhOq.overall_score ??
        82
    );

    const qConfidence = Number(
      oqResult?.confidence_score ??
        finalDecisionSum.confidence_score ??
        session?.confidence_score ??
        inheritance?.qualification_confidence ??
        inhOq.confidence_score ??
        85
    );

    const qDate =
      oqResult?.created_at ||
      session?.updated_at ||
      inheritance?.inherited_at ||
      opportunity.created_at ||
      new Date().toISOString();

    const lifecycleState: PipelineOpportunityHandoverDetail['handover_lifecycle_state'] =
      existing?.handover_lifecycle_state === 'REVALIDATED' || inheritance?.validation_status === 'VALIDATED' && existing?.revalidated_at
        ? 'REVALIDATED'
        : 'INHERITED';

    const oqDimensionResults = rawDimList.map((d: any, idx: number) => ({
      dimension_code: d.dimension_code || d.code || `OQ-D${idx + 1}`,
      dimension_name: d.dimension_name || d.name || `Qualification Dimension ${idx + 1}`,
      score: Number(d.score ?? 75),
      confidence: Number(d.confidence ?? qConfidence),
      assessment: d.assessment || d.status || (Number(d.score ?? 75) >= 75 ? 'Strong' : 'Moderate'),
      evidence_strength: d.evidence_strength || 'Direct Evidence',
      ai_reasoning: d.ai_reasoning || d.assessment_summary || d.summary || 'Evaluated in Opportunity Qualification.',
      key_evidence: d.key_evidence || '',
      evidence_gaps: d.evidence_gaps || ''
    }));

    const qHistory = ((historyRes.data || []) as any[]).map((h: any) => ({
      event: h.event_name || 'Opportunity Qualification Evaluation',
      date: h.created_at ? new Date(h.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Recorded',
      status: h.qualification_status || qDecision,
      score: Number(h.score ?? qScore),
      confidence: `${Number(h.confidence ?? qConfidence)}%`,
      user: h.user_name || opportunity.opportunity_owner || 'Sales Representative'
    }));

    const qualificationContinuity: OpportunityHandoverQualificationContinuity = {
      qualification_decision: qDecision,
      qualification_score: qScore,
      qualification_confidence: qConfidence,
      qualification_date: qDate,
      qualified_by: 'RevOS Opportunity Qualification Engine',
      qualification_model_version:
        oqResult?.configuration_versions?.rules_version ||
        oqResult?.configuration_versions?.qualification_rules_version ||
        'OQ Rules v3.0',
      framework_version: 'PADIF_v1.0',
      lifecycle_state: existing?.handover_lifecycle_state || 'INHERITED',
      health_indicator: finalDecisionSum.health_indicator || (qScore >= 75 ? 'Strong' : 'Moderate'),
      opportunity_readiness: finalDecisionSum.opportunity_readiness || 'Pipeline Ready',
      narrative_summary:
        oqResult?.qualification_explanation ||
        finalDecisionSum.summary ||
        inhOq.explanation ||
        sqlQip?.sql_summary?.narrative_summary ||
        'Validated Opportunity Qualification state inherited under PADIF v1.0 as baseline intelligence for Pipeline Assessment.',
      primary_reason:
        finalDecisionSum.primary_reason ||
        inhPayload.handover_notes ||
        formRecord?.strategic_note ||
        'Qualification thresholds satisfied across commercial legitimacy, stakeholder commitment, and solution fit.',
      promotion_recommendation:
        oqResult?.final_decision?.opportunity_promotion_recommendation || {
          should_promote: true,
          decision: 'YES',
          recommendation_rationale:
            'Opportunity passed upstream qualification gate and initialized its Pipeline Assessment Baseline Snapshot.'
        },
      oq_dimension_results: oqDimensionResults,
      non_inherited_truths: [
        'Prior win probability is NOT inherited — calculated fresh by PADF v1.1',
        'Current pipeline health & closeability must be verified with new pipeline evidence',
        'Upstream AI rationale is contextual intelligence (I3), never ground-truth evidence',
        'Qualification scores & decisions remain historically immutable in OQ'
      ],
      qualification_history: qHistory
    };

    // --- Build Section 2: Canonical Classification (I1 Context + PADIF -> PADF Mapping) ---
    const contacts: Array<{ name: string; title?: string; role?: string }> = [];
    if (leadRow?.first_name || inhLead?.contact_name) {
      contacts.push({
        name: leadRow?.first_name
          ? `${leadRow.first_name} ${leadRow.last_name || ''}`.trim()
          : inhLead.contact_name,
        title: leadRow?.job_title || inhLead?.job_title || 'Primary Stakeholder',
        role: 'Lead Origin Contact'
      });
    }
    const sqlContacts = sqlHandover?.stakeholder_context?.known_contacts || sqlQip?.stakeholder_context?.known_contacts;
    if (Array.isArray(sqlContacts)) {
      sqlContacts.forEach((c: any) => {
        if (c?.name && !contacts.some((x) => x.name === c.name)) {
          contacts.push({ name: c.name, title: c.title, role: c.influence });
        }
      });
    }

    const matchOqDims = (keywords: string[]) =>
      oqDimensionResults.filter((d) =>
        keywords.some((k) => `${d.dimension_name} ${d.dimension_code}`.toLowerCase().includes(k))
      );

    const padfDefinitions: Array<{
      code: string;
      name: string;
      scope: string;
      keywords: string[];
    }> = [
      {
        code: 'PA1',
        name: 'Customer Value & Urgency',
        scope: 'Business problem, pain, quantified impact, strategic initiative & urgency',
        keywords: ['problem', 'pain', 'value', 'metric', 'urgency']
      },
      {
        code: 'PA2',
        name: 'Buying Center & Influence',
        scope: 'Known stakeholders, economic buyer, champion & committee engagement',
        keywords: ['stakeholder', 'champion', 'buyer', 'alignment']
      },
      {
        code: 'PA3',
        name: 'Buying Process & Decision Control',
        scope: 'Decision criteria, procurement milestones, paper process & timeline',
        keywords: ['process', 'criteria', 'buying', 'governance']
      },
      {
        code: 'PA4',
        name: 'Solution & Value Proposition',
        scope: 'Customer requirements, solution fit & technical integration context',
        keywords: ['solution', 'fit', 'technical', 'scope']
      },
      {
        code: 'PA5',
        name: 'Competitive Position',
        scope: 'Competitors, incumbent baseline, differentiation & status quo friction',
        keywords: ['compet', 'different', 'position']
      },
      {
        code: 'PA6',
        name: 'Commercial & Deal Structure',
        scope: 'Budget envelope, deal value, ROI case & procurement structure',
        keywords: ['commercial', 'budget', 'value', 'roi']
      },
      {
        code: 'PA7',
        name: 'Sales Execution & Deal Readiness',
        scope: 'Qualification activities, workshops, POC readiness & multi-threading',
        keywords: ['readiness', 'execution', 'solution', 'engagement']
      },
      {
        code: 'PA8',
        name: 'Momentum, Risk & Closeability',
        scope: 'Qualification confidence, risk exposure, timeline & closeability blockers',
        keywords: ['momentum', 'risk', 'timeline', 'close']
      }
    ];

    const padfDimensionMapping: PADIFDimensionMappingItem[] = padfDefinitions.map((def) => {
      const matched = matchOqDims(def.keywords);
      const signals: string[] = matched.map(
        (m) => `${m.dimension_code} (${m.score}/100): ${m.ai_reasoning}`
      );
      if (def.code === 'PA1' && sqlHandover?.business_context?.business_problem && signals.length === 0) {
        signals.push(sqlHandover.business_context.business_problem);
      }
      if (def.code === 'PA6' && opportunity.deal_value > 0 && signals.length === 0) {
        signals.push(`Estimated commercial value: ${opportunity.currency || 'USD'} $${opportunity.deal_value.toLocaleString('en-US')}`);
      }
      return {
        padf_code: def.code,
        padf_dimension_name: def.name,
        padif_mapping_scope: def.scope,
        inherited_baseline_signals:
          signals.length > 0
            ? signals.slice(0, 2)
            : ['Baseline metadata mapped; capture current Pipeline Assessment evidence to score.'],
        upstream_source_dimensions: matched.map((m) => m.dimension_code),
        baseline_status:
          matched.length > 0
            ? 'Inherited Baseline'
            : signals.length > 0
              ? 'Partial Signal'
              : 'Requires Verification'
      };
    });

    const canonicalClassification: OpportunityHandoverCanonicalClassification = {
      opportunity_identity: {
        opportunity_id: oppId || opportunity.pipeline_id,
        pipeline_id: opportunity.pipeline_id,
        opportunity_name: opportunity.opportunity_name,
        account_name: opportunity.customer_name,
        contacts,
        opportunity_owner:
          formRecord?.opportunity_owner || oppDesc?.opportunity_owner || opportunity.opportunity_owner || 'Senior Enterprise AE',
        creation_date: upstreamOpp?.created_at || opportunity.created_at || new Date().toISOString(),
        qualification_date: qDate
      },
      commercial_context: {
        canonical_revenue_motion_id: opportunity.revenue_motion_id,
        revenue_motion_name: opportunity.revenue_motion_name,
        canonical_industry_id: opportunity.industry_id,
        industry_name: opportunity.industry_name,
        geography_region:
          leadRow?.location || sqlHandover?.customer_context?.location || sqlQip?.customer_context?.location || 'North America',
        estimated_value: opportunity.deal_value || 0,
        currency: opportunity.currency || 'USD',
        expected_close_date:
          formRecord?.expected_close_date || oppDesc?.expected_close_date || opportunity.expected_close_date || 'Not Set'
      },
      lifecycle_context: {
        current_opportunity_stage: formRecord?.opportunity_stage || opportunity.sales_stage || 'Validated Opportunity',
        pipeline_stage: formRecord?.pipeline_stage || opportunity.pipeline_stage || 'Qualification',
        source_system: opportunity.source_system || 'RevOS_Opportunity_Qualification',
        lead_origin: leadId || 'Direct',
        sql_origin: sqlHandover?.id || session?.id || 'SQL_Handover'
      },
      configuration_context: {
        revenue_motion_config_id: opportunity.revenue_motion_id,
        industry_config_id: opportunity.industry_id,
        qualification_framework_version: qualificationContinuity.qualification_model_version,
        assessment_framework_version: 'PADF_v1.1',
        inheritance_framework_version: 'PADIF_v1.0'
      },
      padf_dimension_mapping: padfDimensionMapping
    };

    // --- Build Section 3: Upstream Handover & Risks (I2 Observed Supporting Evidence from OQ Result + Risks + Gaps + Actions) ---
    const nowMs = Date.now();
    const rawEvAudits: any[] = Array.isArray(oqResult?.final_decision?.evidence_assessments)
      ? oqResult.final_decision.evidence_assessments
      : Array.isArray(oqResult?.evidence_assessments)
        ? oqResult.evidence_assessments
        : [];

    const observedSupportingItems = rawEvAudits
      .filter((ev: any) => {
        const score = typeof ev.signal_score === 'number' ? ev.signal_score : 50;
        const hasPositiveTag =
          Array.isArray(ev.tags) && ev.tags.some((t: any) => t.type === 'positive');
        return ev.matched_type === 'positive' || score >= 75 || hasPositiveTag;
      })
      .slice(0, 6);

    const validatedEvidence: PADIFEvidenceProvenanceItem[] = observedSupportingItems.map(
      (ev: any, idx: number) => {
        const dimCode =
          ev.dimension_code ||
          (typeof ev.evidence_object_id === 'string' && ev.evidence_object_id.includes('_OQ')
            ? ev.evidence_object_id.split('_').find((part: string) => part.startsWith('OQ'))
            : 'OQ01') ||
          'OQ01';
        const score = typeof ev.signal_score === 'number' ? ev.signal_score : 80;
        const freshnessDays = Math.max(
          0,
          Math.floor((nowMs - new Date(qDate).getTime()) / (1000 * 60 * 60 * 24))
        );
        return {
          evidence_id: ev.evidence_object_id || ev.evidence_id || `EV0${idx + 1}`,
          evidence_type: 'Observed Supporting Evidence',
          dimension_code: dimCode,
          question_text:
            ev.evidence_name || ev.question_text || ev.question || 'Qualification Evidence Finding',
          evidence_value:
            ev.identification_assessment ||
            ev.ai_reasoning ||
            ev.explanation ||
            'Semantic alignment validated against target indicators.',
          source_module: 'Opportunity Qualification (Observed Supporting Evidence)',
          source_assessment: session?.id || 'OQ Assessment',
          source_user:
            ev.evidence_source || canonicalClassification.opportunity_identity.opportunity_owner,
          captured_at: qDate,
          validated_at: qDate,
          confidence: score >= 75 ? 'High' : 'Medium',
          evidence_status:
            existing?.handover_lifecycle_state === 'REVALIDATED' ? 'Revalidated' : 'Validated',
          freshness_days: freshnessDays
        };
      }
    );

    const rawRisks: any[] = Array.isArray(oqResult?.risks)
      ? oqResult.risks
      : Array.isArray(inhOq.risks)
        ? inhOq.risks
        : [];
    const normalizedRisks: Array<{
      category: string;
      risk_name: string;
      severity: string;
      description: string;
    }> = [];

    rawRisks.forEach((r: any) => {
      if (Array.isArray(r.risks) && r.risks.length > 0) {
        r.risks.forEach((desc: string) => {
          normalizedRisks.push({
            category: r.category || 'Qualification Risk',
            risk_name: r.risk_name || r.category || 'Upstream Qualification Risk',
            severity: r.severity || 'Medium',
            description: desc
          });
        });
      } else {
        normalizedRisks.push({
          category: r.category || 'Qualification Risk',
          risk_name: r.risk_name || r.category || 'Upstream Qualification Risk',
          severity: r.severity || 'Medium',
          description: r.risk_description || r.description || r.risk || 'Risk identified during Opportunity Qualification.'
        });
      }
    });

    const evidenceGaps: string[] = [];
    oqDimensionResults.forEach((d) => {
      if (d.evidence_gaps && String(d.evidence_gaps).trim() && !String(d.evidence_gaps).toLowerCase().includes('none')) {
        evidenceGaps.push(`${d.dimension_code}: ${d.evidence_gaps}`);
      }
    });
    const handoverGaps = sqlHandover?.qualification_risks?.missing_information;
    if (Array.isArray(handoverGaps)) {
      handoverGaps.forEach((g: string) => {
        if (g && !evidenceGaps.includes(g)) evidenceGaps.push(g);
      });
    }

    const confidenceLimitations: string[] = Array.isArray(sqlHandover?.qualification_risks?.confidence_limitations)
      ? sqlHandover.qualification_risks.confidence_limitations
      : [
          'Inherited qualification evidence acts as baseline until confirmed in live Pipeline Assessment interactions.',
          'Deal execution & competitive risks require current buyer validation.'
        ];

    const rawActions: any[] = Array.isArray(oqResult?.recommended_actions)
      ? oqResult.recommended_actions
      : Array.isArray(inhOq.recommended_actions)
        ? inhOq.recommended_actions
        : [];
    const recommendedActions = rawActions.map((rc: any) => ({
      priority: rc.priority || 'High',
      action: rc.action || rc.recommendation || 'Verify stakeholder buying process & decision governance',
      related_dimension: rc.related_dimension || rc.dimension_id || 'Buying Process & Governance',
      expected_impact: rc.expected_impact || rc.reason || rc.focus || 'Reduce late-stage deal slippage and strengthen winability.'
    }));

    const upstreamHandoverRisks: OpportunityHandoverUpstreamRisks = {
      validated_evidence: validatedEvidence,
      evidence_strength_summary:
        validatedEvidence.length > 0
          ? `${validatedEvidence.length} Observed Supporting Evidence item(s) inherited from Opportunity Qualification Result.`
          : 'No significant positive evidence observed yet in Opportunity Qualification Result.',
      qualification_risks: normalizedRisks,
      evidence_gaps: evidenceGaps,
      confidence_limitations: confidenceLimitations,
      recommended_actions: recommendedActions,
      handover_notes:
        formRecord?.strategic_note ||
        sqlHandover?.editable_fields?.strategic_note ||
        inhPayload.handover_notes ||
        'Strategic handover context captured during Opportunity Qualification promotion.',
      inheritance_priority_order: [
        '1. Current Verified Pipeline Evidence',
        '2. Recent Pipeline Assessment Evidence',
        '3. Inherited Opportunity Qualification Evidence',
        '4. Historical / SQL Evidence',
        '5. Upstream AI Interpretation (Contextual Only)',
        '6. Assumption / Unknown'
      ]
    };

    const record: PipelineOpportunityHandoverDetail = {
      pipeline_id: opportunity.pipeline_id,
      opportunity_id: oppId || undefined,
      lead_id: leadId || undefined,
      source_session_id: session?.id || undefined,
      source_result_id: oqResult?.id || undefined,
      source_module: 'RevOS_Opportunity_Qualification',
      framework_version: 'PADIF_v1.0',
      handover_lifecycle_state: lifecycleState,
      qualification_continuity: qualificationContinuity,
      canonical_classification: canonicalClassification,
      upstream_handover_risks: upstreamHandoverRisks,
      padif_package: {
        framework: 'Pipeline_Assessment_Data_Inheritance_Framework_v1.0',
        evidence_source_mode: 'observed_supporting_evidence',
        generated_at: new Date().toISOString(),
        classes: {
          I1_opportunity_context: canonicalClassification,
          I2_validated_evidence: upstreamHandoverRisks.validated_evidence,
          I3_qualification_intelligence: {
            narrative_summary: qualificationContinuity.narrative_summary,
            oq_dimension_results: qualificationContinuity.oq_dimension_results,
            risks: upstreamHandoverRisks.qualification_risks,
            recommended_actions: upstreamHandoverRisks.recommended_actions
          },
          I4_qualification_state: {
            decision: qualificationContinuity.qualification_decision,
            score: qualificationContinuity.qualification_score,
            confidence: qualificationContinuity.qualification_confidence,
            date: qualificationContinuity.qualification_date,
            model_version: qualificationContinuity.qualification_model_version
          }
        }
      },
      owner_notes: existing?.owner_notes || upstreamHandoverRisks.handover_notes,
      inherited_at: existing?.inherited_at || new Date().toISOString(),
      revalidated_at: existing?.revalidated_at,
      updated_at: new Date().toISOString()
    };

    // Cache locally for immediate reactivity
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(`pipeline_handover_detail_${opportunity.pipeline_id}`, JSON.stringify(record));
      } catch {}
    }

    // Persist to dedicated isolated Supabase table: public.pipeline_opportunity_handover_details
    try {
      const dbPayload = {
        pipeline_id: record.pipeline_id,
        opportunity_id: record.opportunity_id || null,
        lead_id: record.lead_id || null,
        source_session_id: record.source_session_id || null,
        source_result_id: record.source_result_id || null,
        source_module: record.source_module,
        framework_version: record.framework_version,
        handover_lifecycle_state: record.handover_lifecycle_state,
        qualification_continuity: record.qualification_continuity,
        canonical_classification: record.canonical_classification,
        upstream_handover_risks: record.upstream_handover_risks,
        padif_package: record.padif_package,
        owner_notes: record.owner_notes || '',
        inherited_at: record.inherited_at,
        revalidated_at: record.revalidated_at || null,
        updated_at: record.updated_at
      };

      const { data: savedRow, error: upsertErr } = await supabase
        .from('pipeline_opportunity_handover_details')
        .upsert(dbPayload, { onConflict: 'pipeline_id' })
        .select()
        .maybeSingle();

      if (!upsertErr && savedRow) {
        return {
          ...(savedRow as PipelineOpportunityHandoverDetail),
          persisted_in_db: true
        };
      }
      if (upsertErr) {
        console.warn(
          'pipeline_opportunity_handover_details upsert note (run 20261116_pipeline_opportunity_handover.sql in Supabase):',
          upsertErr.message
        );
      }
    } catch (e) {
      console.warn('pipeline_opportunity_handover_details persistence note:', e);
    }

    return {
      ...record,
      persisted_in_db: false
    };
  }

  static async revalidateOpportunityHandover(
    pipelineId: string,
    notes?: string
  ): Promise<PipelineOpportunityHandoverDetail | null> {
    if (!pipelineId) return null;
    const nowIso = new Date().toISOString();

    const existing = await this.getOpportunityHandoverDetail(pipelineId);
    if (existing) {
      const updated: PipelineOpportunityHandoverDetail = {
        ...existing,
        handover_lifecycle_state: 'REVALIDATED',
        revalidated_at: nowIso,
        owner_notes: notes ?? existing.owner_notes,
        qualification_continuity: {
          ...existing.qualification_continuity,
          lifecycle_state: 'REVALIDATED'
        },
        upstream_handover_risks: {
          ...existing.upstream_handover_risks,
          validated_evidence: (existing.upstream_handover_risks?.validated_evidence || []).map((ev) => ({
            ...ev,
            evidence_status: 'Revalidated',
            validated_at: nowIso,
            freshness_days: 0
          }))
        },
        updated_at: nowIso
      };

      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem(`pipeline_handover_detail_${pipelineId}`, JSON.stringify(updated));
        } catch {}
      }

      try {
        const { data, error } = await supabase
          .from('pipeline_opportunity_handover_details')
          .update({
            handover_lifecycle_state: 'REVALIDATED',
            revalidated_at: nowIso,
            owner_notes: updated.owner_notes || '',
            qualification_continuity: updated.qualification_continuity,
            upstream_handover_risks: updated.upstream_handover_risks,
            updated_at: nowIso
          })
          .eq('pipeline_id', pipelineId)
          .select()
          .maybeSingle();

        // Also keep pipeline_inheritance validation_status synchronized
        await this.revalidateInheritance(`INH_${pipelineId}`, 'VALIDATED', notes);

        if (!error && data) {
          return {
            ...(data as PipelineOpportunityHandoverDetail),
            persisted_in_db: true
          };
        }
      } catch (e) {
        console.warn('revalidateOpportunityHandover db note:', e);
      }

      return updated;
    }

    return null;
  }

  /**
   * 13. Pipeline Form Persistence (Supabase Only — Dedicated public.pipeline_form_records + pipeline_opportunities sync)
   */
  static async getPipelineFormData(
    opportunity: PipelineOpportunity,
    handoverDetail?: PipelineOpportunityHandoverDetail | null
  ): Promise<PipelineFormRecord> {
    const oppId =
      opportunity.opportunity_id ||
      (opportunity.metadata as any)?.original_opportunity_id ||
      '';
    const leadId =
      opportunity.lead_id ||
      (opportunity.metadata as any)?.original_lead_id ||
      '';

    const currencyCodeToSymbol = (code?: string): string => {
      const c = String(code || '').toUpperCase();
      if (c === 'EUR' || c.startsWith('€')) return '€';
      if (c === 'GBP' || c.startsWith('£')) return '£';
      if (c === 'JPY' || c === 'CNY' || c.startsWith('¥')) return '¥';
      return '$';
    };

    const normalizeDateStr = (val?: string | null): string => {
      if (!val || val === 'Not Set') return '';
      const trimmed = String(val).trim();
      if (/^\d{4}-\d{2}-\d{2}/.test(trimmed)) return trimmed.slice(0, 10);
      const parsed = new Date(trimmed);
      return isNaN(parsed.getTime()) ? '' : parsed.toISOString().slice(0, 10);
    };

    // 1. Check dedicated pipeline_form_records table in Supabase first
    const { data: existingForm, error: formErr } = await supabase
      .from('pipeline_form_records')
      .select('*')
      .eq('pipeline_id', opportunity.pipeline_id)
      .maybeSingle();

    if (!formErr && existingForm) {
      const revNum =
        typeof existingForm.deal_value === 'number'
          ? existingForm.deal_value
          : parseFloat(String(existingForm.estimated_revenue || '0').replace(/[^0-9.]/g, '')) || 0;
      return {
        ...(existingForm as PipelineFormRecord),
        currency_symbol: existingForm.currency_symbol || currencyCodeToSymbol(existingForm.estimated_revenue),
        deal_value: revNum,
        expected_close_date: normalizeDateStr(existingForm.expected_close_date)
      };
    }

    // 2. Otherwise inherit initial baseline from Opportunity Qualification / SQL Qualification (read-only)
    const emptyRes = Promise.resolve({ data: null });
    const [oppFormRes, sqlHandoverRes] = await Promise.all([
      isValidUuid(oppId)
        ? supabase.from('opportunity_form_records').select('*').eq('opportunity_id', oppId).maybeSingle()
        : emptyRes,
      isValidUuid(oppId)
        ? supabase.from('opportunity_sql_handover_details').select('*').eq('opportunity_id', oppId).maybeSingle()
        : emptyRes
    ]);

    const upstreamForm: any = oppFormRes.data || {};
    const sqlEditable: any = (sqlHandoverRes.data as any)?.editable_fields || {};
    const cc = handoverDetail?.canonical_classification;

    const rawEstimated =
      upstreamForm.estimated_revenue ||
      sqlEditable.estimated_revenue ||
      '';
    const dealValue =
      Number(
        cc?.commercial_context?.estimated_value ??
          opportunity.deal_value ??
          (rawEstimated ? parseFloat(String(rawEstimated).replace(/[^0-9.]/g, '')) : 0)
      ) || 0;

    const currencySymbol =
      rawEstimated && /^[€£¥$]/.test(String(rawEstimated).trim())
        ? String(rawEstimated).trim().charAt(0)
        : currencyCodeToSymbol(cc?.commercial_context?.currency || opportunity.currency);

    const formattedRevenue = `${currencySymbol}${new Intl.NumberFormat('en-US').format(dealValue)}`;

    return {
      pipeline_id: opportunity.pipeline_id,
      opportunity_id: oppId || undefined,
      lead_id: leadId || undefined,
      company_name:
        cc?.opportunity_identity?.account_name ||
        opportunity.customer_name ||
        upstreamForm.company_name ||
        sqlEditable.company_name ||
        '',
      opportunity_name:
        cc?.opportunity_identity?.opportunity_name ||
        opportunity.opportunity_name ||
        upstreamForm.opportunity_name ||
        sqlEditable.opportunity_name ||
        '',
      opportunity_owner:
        cc?.opportunity_identity?.opportunity_owner ||
        opportunity.opportunity_owner ||
        upstreamForm.opportunity_owner ||
        sqlEditable.opportunity_owner ||
        'Senior Enterprise AE',
      opportunity_stage:
        upstreamForm.opportunity_stage ||
        cc?.lifecycle_context?.current_opportunity_stage ||
        opportunity.sales_stage ||
        sqlEditable.opportunity_stage ||
        'Emerging Opportunity',
      estimated_revenue: formattedRevenue,
      currency_symbol: currencySymbol,
      deal_value: dealValue,
      pipeline_stage:
        upstreamForm.pipeline_stage ||
        cc?.lifecycle_context?.pipeline_stage ||
        opportunity.pipeline_stage ||
        sqlEditable.pipeline_stage ||
        'Qualification',
      expected_close_date: normalizeDateStr(
        cc?.commercial_context?.expected_close_date ||
          opportunity.expected_close_date ||
          upstreamForm.expected_close_date ||
          sqlEditable.expected_close_date
      ),
      industry:
        cc?.commercial_context?.industry_name ||
        opportunity.industry_name ||
        upstreamForm.industry ||
        'Enterprise Software',
      revenue_motion:
        cc?.commercial_context?.revenue_motion_name ||
        opportunity.revenue_motion_name ||
        upstreamForm.revenue_motion ||
        'Digital Solution Selling',
      form_status: 'Saved'
    };
  }

  static async savePipelineFormData(
    opportunity: PipelineOpportunity,
    formInput: {
      company_name: string;
      opportunity_name: string;
      opportunity_owner: string;
      opportunity_stage: string;
      estimated_revenue: string;
      currency_symbol: string;
      deal_value: number;
      pipeline_stage: string;
      expected_close_date: string;
      industry: string;
      revenue_motion: string;
      form_status: 'Draft' | 'Saved';
    }
  ): Promise<{
    formRecord: PipelineFormRecord;
    updatedOpportunity: PipelineOpportunity;
  }> {
    const nowIso = new Date().toISOString();
    const oppId =
      opportunity.opportunity_id ||
      (opportunity.metadata as any)?.original_opportunity_id ||
      null;
    const leadId =
      opportunity.lead_id ||
      (opportunity.metadata as any)?.original_lead_id ||
      null;

    const dbFormPayload = {
      pipeline_id: opportunity.pipeline_id,
      opportunity_id: oppId,
      lead_id: leadId,
      company_name: formInput.company_name,
      opportunity_name: formInput.opportunity_name,
      opportunity_owner: formInput.opportunity_owner,
      opportunity_stage: formInput.opportunity_stage,
      estimated_revenue: formInput.estimated_revenue,
      currency_symbol: formInput.currency_symbol,
      deal_value: formInput.deal_value,
      pipeline_stage: formInput.pipeline_stage,
      expected_close_date: formInput.expected_close_date || null,
      industry: formInput.industry,
      revenue_motion: formInput.revenue_motion,
      form_status: formInput.form_status,
      updated_at: nowIso
    };

    // 1. Upsert into dedicated Supabase table public.pipeline_form_records
    const { data: savedForm, error: formError } = await supabase
      .from('pipeline_form_records')
      .upsert(dbFormPayload, { onConflict: 'pipeline_id' })
      .select()
      .single();

    if (formError) {
      throw new Error(
        `Failed to save Pipeline Form to Supabase (ensure migration 20261117_pipeline_form_records.sql has been executed): ${formError.message}`
      );
    }

    // 2. Synchronize isolated pipeline_opportunities row in Supabase
    const symbolToCurrency = (sym: string): string => {
      if (sym === '€') return 'EUR';
      if (sym === '£') return 'GBP';
      if (sym === '¥') return 'CNY';
      return 'USD';
    };
    const nextLifecycle: PipelineOpportunity['lifecycle_status'] =
      formInput.pipeline_stage === 'Closed Won'
        ? 'CLOSED_WON'
        : formInput.pipeline_stage === 'Closed Lost'
          ? 'CLOSED_LOST'
          : 'ACTIVE';

    const oppUpdatePayload: Record<string, unknown> = {
      customer_name: formInput.company_name,
      opportunity_name: formInput.opportunity_name,
      opportunity_owner: formInput.opportunity_owner,
      sales_stage: formInput.opportunity_stage,
      deal_value: formInput.deal_value,
      currency: symbolToCurrency(formInput.currency_symbol),
      pipeline_stage: formInput.pipeline_stage,
      expected_close_date: formInput.expected_close_date || null,
      lifecycle_status: nextLifecycle,
      updated_at: nowIso
    };

    const { data: updatedOppRow, error: oppUpdateError } = await supabase
      .from('pipeline_opportunities')
      .update(oppUpdatePayload)
      .eq('pipeline_id', opportunity.pipeline_id)
      .select()
      .maybeSingle();

    if (oppUpdateError) {
      console.warn('pipeline_opportunities sync warning:', oppUpdateError.message);
    }

    // 3. Synchronize canonical summary fields inside pipeline_opportunity_handover_details if present
    try {
      const { data: existingHandover } = await supabase
        .from('pipeline_opportunity_handover_details')
        .select('canonical_classification')
        .eq('pipeline_id', opportunity.pipeline_id)
        .maybeSingle();

      if (existingHandover?.canonical_classification) {
        const cc = existingHandover.canonical_classification as OpportunityHandoverCanonicalClassification;
        const updatedClassification: OpportunityHandoverCanonicalClassification = {
          ...cc,
          opportunity_identity: {
            ...cc.opportunity_identity,
            account_name: formInput.company_name,
            opportunity_name: formInput.opportunity_name,
            opportunity_owner: formInput.opportunity_owner
          },
          commercial_context: {
            ...cc.commercial_context,
            estimated_value: formInput.deal_value,
            currency: symbolToCurrency(formInput.currency_symbol),
            expected_close_date: formInput.expected_close_date || cc.commercial_context.expected_close_date
          },
          lifecycle_context: {
            ...cc.lifecycle_context,
            current_opportunity_stage: formInput.opportunity_stage,
            pipeline_stage: formInput.pipeline_stage
          }
        };

        await supabase
          .from('pipeline_opportunity_handover_details')
          .update({
            canonical_classification: updatedClassification,
            updated_at: nowIso
          })
          .eq('pipeline_id', opportunity.pipeline_id);
      }
    } catch (syncErr) {
      console.warn('Handover canonical classification sync warning:', syncErr);
    }

    const updatedOpportunity: PipelineOpportunity = (updatedOppRow as PipelineOpportunity) || {
      ...opportunity,
      customer_name: formInput.company_name,
      opportunity_name: formInput.opportunity_name,
      opportunity_owner: formInput.opportunity_owner,
      sales_stage: formInput.opportunity_stage,
      deal_value: formInput.deal_value,
      currency: symbolToCurrency(formInput.currency_symbol),
      pipeline_stage: formInput.pipeline_stage,
      expected_close_date: formInput.expected_close_date || opportunity.expected_close_date,
      lifecycle_status: nextLifecycle,
      updated_at: nowIso
    };

    return {
      formRecord: savedForm as PipelineFormRecord,
      updatedOpportunity
    };
  }
}

