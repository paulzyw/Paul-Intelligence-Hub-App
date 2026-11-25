import { supabase } from '@/src/lib/supabase';
import {
  OpportunitySession,
  OpportunityEvidenceRecord,
  OpportunityQualificationResult
} from '../../types/opportunity_qualification';
import {
  getActiveRevOSUserId,
  getScopedStorageItem,
  removeScopedStorageItem,
  resolveAuthenticatedRevOSUserId,
  setScopedStorageItem,
  subscribeRevOSUserChange
} from '../../utils/userIsolation';

let memoryOppRevenueMap: { userId: string; data: Record<string, number> } | null = null;
let memoryOppNameMap: { userId: string; data: Record<string, string> } | null = null;

subscribeRevOSUserChange(() => {
  memoryOppRevenueMap = null;
  memoryOppNameMap = null;
});

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const isValidUuid = (id?: string | null): id is string => typeof id === 'string' && UUID_REGEX.test(id);

export class OpportunityDataService {
  private static async verifyOwnedOpportunity(
    opportunityId: string
  ): Promise<{ userId: string; opp: any } | null> {
    if (!isValidUuid(opportunityId)) return null;
    const userId = await resolveAuthenticatedRevOSUserId();
    if (!userId) return null;
    const { data, error } = await supabase
      .from('opportunities')
      .select('*')
      .eq('id', opportunityId)
      .eq('created_by', userId)
      .maybeSingle();
    if (error || !data) return null;
    return { userId, opp: data };
  }

  private static async verifyOwnedSession(
    sessionId: string
  ): Promise<{ userId: string; session: OpportunitySession } | null> {
    if (!isValidUuid(sessionId)) return null;
    const userId = await resolveAuthenticatedRevOSUserId();
    if (!userId) return null;
    const { data, error } = await supabase
      .from('opportunity_qualification_sessions')
      .select('*, opportunities!inner(created_by)')
      .eq('id', sessionId)
      .eq('opportunities.created_by', userId)
      .maybeSingle();
    if (error || !data) return null;
    return { userId, session: data as OpportunitySession };
  }

  // Session Management
  static async createSession(
    opportunityId: string,
    options: { sqlInheritanceData?: any; revenueMotion?: string; industry?: string }
  ) {
    if (!isValidUuid(opportunityId)) {
      throw new Error(`Invalid opportunity UUID: ${opportunityId}`);
    }
    const owned = await this.verifyOwnedOpportunity(opportunityId);
    if (!owned) {
      throw new Error('Opportunity not found or access denied.');
    }
    const { data, error } = await supabase.functions.invoke('lead-qualification', {
      body: {
        action: 'create-opportunity-session',
        opportunity_id: opportunityId,
        sql_inheritance_data: options.sqlInheritanceData || {},
        revenue_motion: options.revenueMotion || 'Digital Solution Selling',
        industry: options.industry || 'Enterprise Software'
      }
    });
    if (error) throw error;
    return data as OpportunitySession;
  }

  static async getSessionByOpportunity(opportunityId: string) {
    if (!isValidUuid(opportunityId)) return null;
    const owned = await this.verifyOwnedOpportunity(opportunityId);
    if (!owned) return null;
    const { data, error } = await supabase
      .from('opportunity_qualification_sessions')
      .select('*')
      .eq('opportunity_id', opportunityId)
      .maybeSingle();
    if (error) {
      console.error('Error fetching session by opportunity:', error);
      return null;
    }
    return data as OpportunitySession | null;
  }

  // Dedicated SQL Handover Intelligence Storage
  static async getSqlHandoverData(opportunityId: string) {
    if (!isValidUuid(opportunityId)) return null;
    const owned = await this.verifyOwnedOpportunity(opportunityId);
    if (!owned) return null;

    try {
      const { data, error } = await supabase
        .from('opportunity_sql_handover_details')
        .select('*')
        .eq('opportunity_id', opportunityId)
        .maybeSingle();

      if (!error && data) {
        return data;
      }
    } catch (e) {
      console.warn('Dedicated opportunity_sql_handover_details table not yet initialized, checking session fallback:', e);
    }

    try {
      const session = await this.getSessionByOpportunity(opportunityId);
      if (session && session.sql_inheritance_data && Object.keys(session.sql_inheritance_data).length > 0) {
        return {
          opportunity_id: opportunityId,
          session_id: session.id,
          sql_qip_package: session.sql_inheritance_data,
          ...session.sql_inheritance_data
        };
      }
    } catch (e) {
      console.warn('Error fetching session fallback:', e);
    }

    return null;
  }

  static async saveSqlHandoverData(
    opportunityId: string,
    payload: {
      sqlQipPackage: any;
      editableFields?: any;
      revenueMotion?: string;
      industry?: string;
    }
  ) {
    const owned = await this.verifyOwnedOpportunity(opportunityId);
    if (!owned) throw new Error('Opportunity not found or access denied.');

    const { sqlQipPackage, editableFields, revenueMotion, industry } = payload;

    let session = await this.getSessionByOpportunity(opportunityId);
    if (!session) {
      session = await this.createSession(opportunityId, {
        sqlInheritanceData: sqlQipPackage,
        revenueMotion: revenueMotion || 'Digital Solution Selling',
        industry: industry || 'Enterprise Software'
      });
    } else {
      await supabase
        .from('opportunity_qualification_sessions')
        .update({
          sql_inheritance_data: sqlQipPackage,
          updated_at: new Date().toISOString()
        })
        .eq('id', session.id);
    }

    try {
      const record = {
        opportunity_id: opportunityId,
        session_id: session?.id,
        sql_qip_package: sqlQipPackage,
        customer_context: sqlQipPackage.customer_context || {},
        revenue_motion_context: sqlQipPackage.revenue_motion_context || {},
        business_context: sqlQipPackage.business_context || {},
        business_value_context: sqlQipPackage.business_value_context || {},
        solution_context: sqlQipPackage.solution_context || {},
        stakeholder_context: sqlQipPackage.stakeholder_context || {},
        engagement_context: sqlQipPackage.engagement_context || {},
        dimension_results: sqlQipPackage.qualification_dimension_results || {},
        qualification_evidence: sqlQipPackage.qualification_evidence || {},
        qualification_risks: sqlQipPackage.qualification_risks || {},
        qualification_recommendations: sqlQipPackage.qualification_recommendations || {},
        editable_fields: editableFields || {},
        handover_status: 'Synchronized',
        synced_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const { data: existingRecord } = await supabase
        .from('opportunity_sql_handover_details')
        .select('id')
        .eq('opportunity_id', opportunityId)
        .maybeSingle();

      if (existingRecord) {
        await supabase
          .from('opportunity_sql_handover_details')
          .update(record)
          .eq('id', existingRecord.id);
      } else {
        await supabase.from('opportunity_sql_handover_details').insert([record]);
      }
    } catch (err) {
      console.info(
        'Dedicated opportunity_sql_handover_details upsert bypassed (pending Supabase SQL migration execution):',
        err
      );
    }

    return true;
  }

  // Evidence Submission
  static async submitEvidence(sessionId: string, evidence: Partial<OpportunityEvidenceRecord>[]) {
    const ownedSession = await this.verifyOwnedSession(sessionId);
    if (!ownedSession) throw new Error('Qualification session not found or access denied.');

    try {
      if (evidence && evidence.length > 0) {
        const records = evidence.map((e) => ({
          session_id: sessionId,
          dimension_code: e.dimension_code || '',
          evidence_id: e.evidence_id || '',
          question_text: e.question_text || '',
          answer_value: e.answer_value || '',
          evidence_source: e.evidence_source || 'Sales Rep Interview',
          evidence_strength: e.evidence_strength || 'customer_confirmed',
          updated_at: new Date().toISOString()
        }));

        const { error: upsertErr } = await supabase
          .from('opportunity_qualification_evidence')
          .upsert(records, { onConflict: 'session_id,evidence_id' });

        if (upsertErr) {
          console.warn('Direct upsert to opportunity_qualification_evidence error, checking function:', upsertErr);
        }
      }
    } catch (dbErr) {
      console.warn('Direct database error in submitEvidence:', dbErr);
    }

    try {
      const { data, error } = await supabase.functions.invoke('lead-qualification', {
        body: {
          action: 'submit-opportunity-evidence',
          session_id: sessionId,
          evidence
        }
      });
      if (!error && data) return data;
    } catch {}

    return true;
  }

  static async getEvidenceRecords(sessionId: string) {
    if (!isValidUuid(sessionId)) return [];
    const ownedSession = await this.verifyOwnedSession(sessionId);
    if (!ownedSession) return [];

    const { data, error } = await supabase
      .from('opportunity_qualification_evidence')
      .select('*')
      .eq('session_id', sessionId);
    if (error) {
      console.error('Error fetching evidence records:', error);
      return [];
    }
    return data as OpportunityEvidenceRecord[];
  }

  static async getOrCreateSession(
    opportunityId: string,
    options?: {
      revenueMotion?: string;
      industry?: string;
      sqlInheritanceData?: any;
    }
  ) {
    const owned = await this.verifyOwnedOpportunity(opportunityId);
    if (!owned) throw new Error('Opportunity not found or access denied.');

    let session = await this.getSessionByOpportunity(opportunityId);
    if (!session) {
      try {
        const { data, error } = await supabase
          .from('opportunity_qualification_sessions')
          .insert([
            {
              opportunity_id: opportunityId,
              revenue_motion: options?.revenueMotion || 'Digital Solution Selling',
              industry: options?.industry || 'SaaS / Software',
              sql_inheritance_data: options?.sqlInheritanceData || {}
            }
          ])
          .select()
          .maybeSingle();

        if (!error && data) {
          session = data as OpportunitySession;
        }
      } catch (e) {
        console.warn('Direct session insert failed, trying Edge Function:', e);
      }

      if (!session) {
        session = await this.createSession(opportunityId, options || {});
      }
    }
    return session;
  }

  // Dynamic Suggestion Answers
  static async generateSuggestedAnswers(
    opportunityId: string,
    revenueMotion: string,
    industry: string,
    evidenceQuestions: any[]
  ) {
    const { data, error } = await supabase.functions.invoke('lead-qualification', {
      body: {
        action: 'generate-opportunity-suggested-answers',
        opportunity_id: opportunityId,
        revenue_motion: revenueMotion,
        industry: industry,
        evidence_questions: evidenceQuestions
      }
    });
    if (error) throw error;
    return data?.suggested_answers || [];
  }

  // Reasoning Execution
  static async executeReasoning(
    sessionId: string,
    contexts: {
      sql_inheritance_context?: any;
      all_defined_questions?: any[];
      opportunity_assessment_context?: any;
      industry_config?: any;
      evidence_kb?: any;
      qualification_rules?: any;
    }
  ) {
    const { data, error } = await supabase.functions.invoke('lead-qualification', {
      body: {
        action: 'execute-opportunity-reasoning',
        session_id: sessionId,
        ...contexts
      }
    });

    if (error) {
      console.error('Error invoking lead-qualification edge function:', error);
      throw error;
    }

    if (!data) {
      throw new Error('Empty response from edge function');
    }

    const evalResult = data.result || data;

    const definedQuestions =
      contexts.all_defined_questions || contexts.opportunity_assessment_context?.all_defined_questions;
    if (Array.isArray(definedQuestions) && definedQuestions.length > 0) {
      const eaMap = new Map<string, any>();
      if (Array.isArray(evalResult.evidence_assessments)) {
        evalResult.evidence_assessments.forEach((ea: any) => {
          if (ea && (ea.evidence_object_id || ea.evidence_id)) {
            eaMap.set(ea.evidence_object_id || ea.evidence_id, ea);
          }
        });
      }

      const evRecordsMap = new Map<string, any>();
      if (Array.isArray(contexts.opportunity_assessment_context?.evidence)) {
        contexts.opportunity_assessment_context.evidence.forEach((rec: any) => {
          evRecordsMap.set(rec.evidence_id, rec);
        });
      }

      evalResult.evidence_assessments = definedQuestions.map((q: any) => {
        const ea = eaMap.get(q.evidence_id);
        const userRec = evRecordsMap.get(q.evidence_id);
        const userAnswer = userRec?.answer_value || q.user_answer || '';
        const isBlank =
          !userAnswer || userAnswer.trim() === '' || userAnswer.toLowerCase() === '[unanswered]';

        const score = typeof ea?.signal_score === 'number' ? ea.signal_score : isBlank ? 30 : 80;
        const matchType =
          ea?.matched_type === 'positive' ||
          (typeof ea?.signal_score === 'number' && ea.signal_score >= 75) ||
          score >= 75
            ? 'positive'
            : ea?.matched_type === 'negative' ||
                (typeof ea?.signal_score === 'number' && ea.signal_score < 50) ||
                score < 50
              ? 'negative'
              : 'neutral';

        const matchLabel =
          matchType === 'positive'
            ? 'POSITIVE MATCH'
            : matchType === 'negative'
              ? 'NEGATIVE MATCH'
              : 'NEUTRAL MATCH';

        const dimName = q.dimension_name || ea?.dimension_name || q.dimension_code || 'Dimension';

        return {
          evidence_object_id: q.evidence_id,
          evidence_name:
            q.question_text || q.evidence_name || ea?.evidence_name || 'Opportunity Evidence Finding',
          dimension_code: q.dimension_code,
          dimension_name: dimName,
          user_answer: userAnswer,
          evidence_source: userRec?.evidence_source || ea?.evidence_source || 'Customer Stakeholder',
          validation_strength: userRec?.evidence_strength || ea?.validation_strength || 'verified',
          signal_score: score,
          identification_assessment:
            ea?.identification_assessment ||
            (isBlank
              ? `No customer evidence collected for this question. Creates an information gap in ${dimName}.`
              : `Customer evidence evaluated: "${userAnswer}". Tested against target criteria for ${dimName}.`),
          tags: [
            { label: dimName, type: 'dimension' },
            { label: matchLabel, type: matchType }
          ]
        };
      });
    }

    return evalResult;
  }

  // Retrieve Saved Assessment Results
  static async retrieveResult(sessionId: string) {
    const { data, error } = await supabase.functions.invoke('lead-qualification', {
      body: {
        action: 'retrieve-opportunity-qualification-result',
        session_id: sessionId
      }
    });
    if (error) throw error;
    return data as {
      session: OpportunitySession;
      evidence: OpportunityEvidenceRecord[];
      results: OpportunityQualificationResult;
    };
  }

  // Promotion/Qualification Pipeline Execution
  static async promoteToOpportunity(opportunityId: string, sessionId: string) {
    const { data, error } = await supabase.functions.invoke('lead-qualification', {
      body: {
        action: 'promote-sql-to-opportunity',
        opportunity_id: opportunityId,
        session_id: sessionId
      }
    });
    if (error) throw error;
    return data;
  }

  // Opportunity Form Data Management (Supabase-Persisted, User-Isolated)
  static async getOpportunityFormData(opportunityId: string) {
    if (!isValidUuid(opportunityId)) return null;
    const owned = await this.verifyOwnedOpportunity(opportunityId);
    if (!owned) return null;

    let formRecord: any = null;
    let handoverEditable: any = null;
    const oppRecord: any = owned.opp;
    let parsedDesc: any = {};

    try {
      const { data, error } = await supabase
        .from('opportunity_form_records')
        .select('*')
        .eq('opportunity_id', opportunityId)
        .maybeSingle();

      if (!error && data) {
        formRecord = data;
      }
    } catch {}

    try {
      const handover = await this.getSqlHandoverData(opportunityId);
      if (handover?.editable_fields && Object.keys(handover.editable_fields).length > 0) {
        handoverEditable = handover.editable_fields;
      }
    } catch {}

    if (oppRecord?.description && oppRecord.description.trim().startsWith('{')) {
      try {
        parsedDesc = JSON.parse(oppRecord.description);
      } catch {}
    }

    if (!formRecord && !handoverEditable && !oppRecord) {
      return null;
    }

    const base = formRecord || handoverEditable || {};
    const mergedCountry =
      formRecord?.country ||
      handoverEditable?.country ||
      oppRecord?.country ||
      parsedDesc?.country ||
      '';
    const mergedCampaign =
      formRecord?.campaign_assignment ||
      handoverEditable?.campaign_assignment ||
      oppRecord?.campaign_assignment ||
      parsedDesc?.campaign_assignment ||
      '';
    const mergedSegment =
      formRecord?.business_segment ||
      handoverEditable?.business_segment ||
      oppRecord?.business_segment ||
      parsedDesc?.business_segment ||
      '';
    const mergedProduct =
      formRecord?.product_solution ||
      handoverEditable?.product_solution ||
      oppRecord?.product_solution ||
      parsedDesc?.product_solution ||
      '';

    if (formRecord || handoverEditable) {
      return {
        ...parsedDesc,
        ...handoverEditable,
        ...base,
        company_name: base.company_name || oppRecord?.company_name || '',
        opportunity_name: base.opportunity_name || oppRecord?.opportunity_name || '',
        industry: base.industry || oppRecord?.industry || '',
        revenue_motion: base.revenue_motion || oppRecord?.revenue_motion || '',
        country: mergedCountry,
        campaign_assignment: mergedCampaign,
        business_segment: mergedSegment,
        product_solution: mergedProduct
      };
    }

    return {
      company_name: oppRecord.company_name,
      opportunity_name: oppRecord.opportunity_name,
      industry: oppRecord.industry,
      revenue_motion: oppRecord.revenue_motion,
      opportunity_owner: parsedDesc.opportunity_owner || 'Senior Enterprise AE',
      opportunity_stage: parsedDesc.opportunity_stage || 'Emerging Opportunity',
      estimated_revenue: parsedDesc.estimated_revenue || '$150,000',
      pipeline_stage: parsedDesc.pipeline_stage || 'Qualification',
      expected_close_date: parsedDesc.expected_close_date || '',
      ...parsedDesc,
      country: mergedCountry,
      campaign_assignment: mergedCampaign,
      business_segment: mergedSegment,
      product_solution: mergedProduct
    };
  }

  /**
   * Synchronous cached getters scoped to the active user ID
   */
  static getCachedOpportunityEstimatedRevenuesMap(explicitUserId?: string | null): Record<string, number> {
    const uid = explicitUserId ?? getActiveRevOSUserId();
    if (!uid) return {};
    if (memoryOppRevenueMap && memoryOppRevenueMap.userId === uid) {
      return memoryOppRevenueMap.data;
    }
    try {
      const stored = getScopedStorageItem('revos_cached_opp_revenue_map', uid);
      if (stored) {
        const parsed = JSON.parse(stored);
        memoryOppRevenueMap = { userId: uid, data: parsed };
        return parsed;
      }
    } catch {}
    return {};
  }

  static getCachedOpportunityNamesMap(explicitUserId?: string | null): Record<string, string> {
    const uid = explicitUserId ?? getActiveRevOSUserId();
    if (!uid) return {};
    if (memoryOppNameMap && memoryOppNameMap.userId === uid) {
      return memoryOppNameMap.data;
    }
    try {
      const stored = getScopedStorageItem('revos_cached_opp_name_map', uid);
      if (stored) {
        const parsed = JSON.parse(stored);
        memoryOppNameMap = { userId: uid, data: parsed };
        return parsed;
      }
    } catch {}
    return {};
  }

  /**
   * Get Estimated Revenue map strictly for the authenticated user's opportunities
   */
  static async getOpportunityEstimatedRevenuesMap(): Promise<Record<string, number>> {
    const userId = await resolveAuthenticatedRevOSUserId();
    if (!userId) return {};

    const revenueMap: Record<string, number> = {};

    const parseNum = (val: any): number => {
      if (!val) return 0;
      const clean = String(val).replace(/[^0-9.]/g, '');
      const num = parseFloat(clean);
      return isNaN(num) ? 0 : num;
    };

    try {
      const [oppsRes, sqlPromosRes, mqlPromosRes] = await Promise.all([
        supabase
          .from('opportunities')
          .select('id, mql_reference_id, description')
          .eq('created_by', userId),
        supabase
          .from('sql_opportunity_promotions')
          .select('lead_id, opportunity_id')
          .eq('created_by', userId),
        supabase
          .from('mql_sql_promotions')
          .select('lead_id, opportunity_id')
          .eq('created_by', userId)
      ]);

      const ownedOppIds = (oppsRes.data || []).map((o: any) => o.id).filter(Boolean);
      const [handoversRes, formRecordsRes] = ownedOppIds.length > 0
        ? await Promise.all([
            supabase
              .from('opportunity_sql_handover_details')
              .select('opportunity_id, editable_fields')
              .in('opportunity_id', ownedOppIds),
            supabase
              .from('opportunity_form_records')
              .select('opportunity_id, estimated_revenue')
              .in('opportunity_id', ownedOppIds)
          ])
        : [{ data: [] }, { data: [] }];

      (oppsRes.data || []).forEach((opp: any) => {
        let rev: string | null = null;
        if (opp.description && opp.description.trim().startsWith('{')) {
          try {
            const desc = JSON.parse(opp.description);
            if (desc.estimated_revenue) rev = desc.estimated_revenue;
          } catch {}
        }
        if (rev) {
          const num = parseNum(rev);
          revenueMap[opp.id] = num;
          if (opp.mql_reference_id) {
            revenueMap[opp.mql_reference_id] = num;
          }
        }
      });

      (handoversRes.data || []).forEach((h: any) => {
        const rev = h.editable_fields?.estimated_revenue;
        if (rev) {
          revenueMap[h.opportunity_id] = parseNum(rev);
        }
      });

      (formRecordsRes.data || []).forEach((f: any) => {
        if (f.estimated_revenue) {
          revenueMap[f.opportunity_id] = parseNum(f.estimated_revenue);
        }
      });

      (sqlPromosRes.data || []).forEach((p: any) => {
        if (p.opportunity_id && revenueMap[p.opportunity_id] && p.lead_id) {
          revenueMap[p.lead_id] = revenueMap[p.opportunity_id];
        }
      });

      (mqlPromosRes.data || []).forEach((p: any) => {
        if (p.opportunity_id && revenueMap[p.opportunity_id] && p.lead_id) {
          revenueMap[p.lead_id] = revenueMap[p.opportunity_id];
        }
      });

      memoryOppRevenueMap = { userId, data: revenueMap };
      setScopedStorageItem('revos_cached_opp_revenue_map', JSON.stringify(revenueMap), userId);
    } catch (e) {
      console.warn('Error fetching opportunity estimated revenues map:', e);
    }

    return revenueMap;
  }

  /**
   * Fetches opportunity names map strictly for the authenticated user's opportunities
   */
  static async getOpportunityNamesMap(): Promise<Record<string, string>> {
    const userId = await resolveAuthenticatedRevOSUserId();
    if (!userId) return {};

    const nameMap: Record<string, string> = {};

    try {
      const [oppsRes, sqlPromosRes, mqlPromosRes] = await Promise.all([
        supabase
          .from('opportunities')
          .select('id, mql_reference_id, opportunity_name, description, company_name')
          .eq('created_by', userId),
        supabase
          .from('sql_opportunity_promotions')
          .select('lead_id, opportunity_id')
          .eq('created_by', userId),
        supabase
          .from('mql_sql_promotions')
          .select('lead_id, opportunity_id')
          .eq('created_by', userId)
      ]);

      const ownedOppIds = (oppsRes.data || []).map((o: any) => o.id).filter(Boolean);
      const [handoversRes, formRecordsRes] = ownedOppIds.length > 0
        ? await Promise.all([
            supabase
              .from('opportunity_sql_handover_details')
              .select('opportunity_id, editable_fields')
              .in('opportunity_id', ownedOppIds),
            supabase
              .from('opportunity_form_records')
              .select('opportunity_id, opportunity_name')
              .in('opportunity_id', ownedOppIds)
          ])
        : [{ data: [] }, { data: [] }];

      (oppsRes.data || []).forEach((opp: any) => {
        let name = opp.opportunity_name;
        if (!name && opp.description && opp.description.trim().startsWith('{')) {
          try {
            const desc = JSON.parse(opp.description);
            if (desc.opportunity_name) name = desc.opportunity_name;
          } catch {}
        }
        if (!name && opp.company_name) {
          name = `${opp.company_name} Opportunity`;
        }
        if (name) {
          nameMap[opp.id] = name;
          if (opp.mql_reference_id) {
            nameMap[opp.mql_reference_id] = name;
          }
        }
      });

      (handoversRes.data || []).forEach((h: any) => {
        const name = h.editable_fields?.opportunity_name;
        if (name) {
          nameMap[h.opportunity_id] = name;
        }
      });

      (formRecordsRes.data || []).forEach((f: any) => {
        if (f.opportunity_name) {
          nameMap[f.opportunity_id] = f.opportunity_name;
        }
      });

      (sqlPromosRes.data || []).forEach((p: any) => {
        if (p.opportunity_id && nameMap[p.opportunity_id] && p.lead_id) {
          nameMap[p.lead_id] = nameMap[p.opportunity_id];
        }
      });

      (mqlPromosRes.data || []).forEach((p: any) => {
        if (p.opportunity_id && nameMap[p.opportunity_id] && p.lead_id) {
          nameMap[p.lead_id] = nameMap[p.opportunity_id];
        }
      });

      memoryOppNameMap = { userId, data: nameMap };
      setScopedStorageItem('revos_cached_opp_name_map', JSON.stringify(nameMap), userId);
    } catch (e) {
      console.warn('Error fetching opportunity names map:', e);
    }

    return nameMap;
  }

  static async saveOpportunityFormData(
    opportunityId: string,
    formData: {
      company_name: string;
      opportunity_name: string;
      opportunity_owner: string;
      opportunity_stage: string;
      estimated_revenue: string;
      pipeline_stage: string;
      expected_close_date: string;
      industry: string;
      revenue_motion: string;
      country?: string;
      campaign_assignment?: string;
      business_segment?: string;
      product_solution?: string;
      strategic_note?: string;
    }
  ) {
    const owned = await this.verifyOwnedOpportunity(opportunityId);
    if (!owned) throw new Error('Opportunity not found or access denied.');
    const userId = owned.userId;

    const isMissingColumnError = (err: any) =>
      err &&
      (err.code === 'PGRST204' ||
        /column .* does not exist/i.test(err.message || '') ||
        /could not find the .* column/i.test(err.message || ''));

    const baseOppUpdate = {
      company_name: formData.company_name,
      opportunity_name: formData.opportunity_name,
      industry: formData.industry,
      revenue_motion: formData.revenue_motion,
      description: JSON.stringify(formData),
      updated_at: new Date().toISOString()
    };

    const { error: oppError } = await supabase
      .from('opportunities')
      .update({
        ...baseOppUpdate,
        country: formData.country ?? null,
        campaign_assignment: formData.campaign_assignment ?? null,
        business_segment: formData.business_segment ?? null,
        product_solution: formData.product_solution ?? null
      })
      .eq('id', opportunityId)
      .eq('created_by', userId);

    if (oppError) {
      if (isMissingColumnError(oppError)) {
        const { error: fallbackOppError } = await supabase
          .from('opportunities')
          .update(baseOppUpdate)
          .eq('id', opportunityId)
          .eq('created_by', userId);
        if (fallbackOppError) {
          console.error('Error updating opportunities record (fallback):', fallbackOppError);
        }
      } else {
        console.error('Error updating opportunities record:', oppError);
      }
    }

    try {
      await this.saveSqlHandoverData(opportunityId, {
        sqlQipPackage: {},
        editableFields: formData,
        revenueMotion: formData.revenue_motion,
        industry: formData.industry
      });
    } catch (e) {
      console.warn('saveSqlHandoverData fallback:', e);
    }

    try {
      const baseRecord = {
        opportunity_id: opportunityId,
        company_name: formData.company_name,
        opportunity_name: formData.opportunity_name,
        opportunity_owner: formData.opportunity_owner,
        opportunity_stage: formData.opportunity_stage,
        estimated_revenue: formData.estimated_revenue,
        pipeline_stage: formData.pipeline_stage,
        expected_close_date: formData.expected_close_date ? formData.expected_close_date : null,
        industry: formData.industry,
        revenue_motion: formData.revenue_motion,
        strategic_note: formData.strategic_note || '',
        updated_at: new Date().toISOString()
      };

      const fullRecord = {
        ...baseRecord,
        country: formData.country || null,
        campaign_assignment: formData.campaign_assignment || null,
        business_segment: formData.business_segment || null,
        product_solution: formData.product_solution || null
      };

      const { data: existing } = await supabase
        .from('opportunity_form_records')
        .select('id')
        .eq('opportunity_id', opportunityId)
        .maybeSingle();

      if (existing) {
        const { error: recUpdateError } = await supabase
          .from('opportunity_form_records')
          .update(fullRecord)
          .eq('id', existing.id);

        if (recUpdateError && isMissingColumnError(recUpdateError)) {
          await supabase.from('opportunity_form_records').update(baseRecord).eq('id', existing.id);
        }
      } else {
        const { error: recInsertError } = await supabase
          .from('opportunity_form_records')
          .insert([fullRecord]);

        if (recInsertError && isMissingColumnError(recInsertError)) {
          await supabase.from('opportunity_form_records').insert([baseRecord]);
        }
      }
    } catch (e) {
      console.info('opportunity_form_records upsert note (will succeed once migration runs):', e);
    }

    try {
      const cleanNum = parseFloat(String(formData.estimated_revenue || '').replace(/[^0-9.]/g, ''));
      if (!isNaN(cleanNum) && cleanNum > 0) {
        if (!memoryOppRevenueMap || memoryOppRevenueMap.userId !== userId) {
          memoryOppRevenueMap = { userId, data: {} };
        }
        memoryOppRevenueMap.data[opportunityId] = cleanNum;
        const stored = getScopedStorageItem('revos_cached_opp_revenue_map', userId);
        const map = stored ? JSON.parse(stored) : {};
        map[opportunityId] = cleanNum;
        setScopedStorageItem('revos_cached_opp_revenue_map', JSON.stringify(map), userId);
      }
      if (formData.opportunity_name) {
        if (!memoryOppNameMap || memoryOppNameMap.userId !== userId) {
          memoryOppNameMap = { userId, data: {} };
        }
        memoryOppNameMap.data[opportunityId] = formData.opportunity_name;
        const stored = getScopedStorageItem('revos_cached_opp_name_map', userId);
        const map = stored ? JSON.parse(stored) : {};
        map[opportunityId] = formData.opportunity_name;
        setScopedStorageItem('revos_cached_opp_name_map', JSON.stringify(map), userId);
      }
    } catch {}

    return true;
  }

  /**
   * Records that the user clicked "Start Opportunity Qualification" in Opportunity Form
   */
  static async recordStartQualification(
    opportunityId: string,
    options?: { revenueMotion?: string; industry?: string }
  ) {
    if (!opportunityId) return;
    const userId = await resolveAuthenticatedRevOSUserId();
    if (!userId) return;
    try {
      setScopedStorageItem(`oq_started_${opportunityId}`, 'true', userId);

      let session = await this.getSessionByOpportunity(opportunityId);
      if (!session) {
        session = await this.getOrCreateSession(opportunityId, {
          revenueMotion: options?.revenueMotion || 'Digital Solution Selling',
          industry: options?.industry || 'Enterprise Software',
          sqlInheritanceData: { qualification_started: true, started_at: new Date().toISOString() }
        });
      } else {
        const currentData = session.sql_inheritance_data || {};
        await supabase
          .from('opportunity_qualification_sessions')
          .update({
            sql_inheritance_data: {
              ...currentData,
              qualification_started: true,
              started_at: new Date().toISOString()
            },
            qualification_status:
              session.qualification_status && session.qualification_status !== 'NOT_STARTED'
                ? session.qualification_status
                : 'IN_PROGRESS',
            updated_at: new Date().toISOString()
          })
          .eq('id', session.id);
      }

      try {
        await supabase
          .from('opportunity_form_records')
          .update({
            form_status: 'Qualification Started',
            updated_at: new Date().toISOString()
          })
          .eq('opportunity_id', opportunityId);
      } catch {}
    } catch (err) {
      console.warn('Error recording qualification start in database:', err);
    }
  }

  /**
   * Records that evidence answers were saved in Supabase
   */
  static async recordEvidenceSaved(opportunityId: string, sessionId: string, savedCount: number) {
    if (!opportunityId) return;
    const owned = await this.verifyOwnedOpportunity(opportunityId);
    if (!owned) return;
    const userId = owned.userId;

    try {
      setScopedStorageItem(`oq_started_${opportunityId}`, 'true', userId);
      setScopedStorageItem(`oq_has_saved_evidence_${opportunityId}`, 'true', userId);
      setScopedStorageItem(`oq_evidence_count_${opportunityId}`, String(savedCount), userId);

      if (sessionId) {
        const session = await this.getSessionByOpportunity(opportunityId);
        const currentData = session?.sql_inheritance_data || {};
        await supabase
          .from('opportunity_qualification_sessions')
          .update({
            sql_inheritance_data: {
              ...currentData,
              qualification_started: true,
              has_saved_evidence: true,
              saved_evidence_count: savedCount,
              last_evidence_saved_at: new Date().toISOString()
            },
            qualification_status:
              session?.qualification_status && session.qualification_status !== 'NOT_STARTED'
                ? session.qualification_status
                : 'IN_PROGRESS',
            updated_at: new Date().toISOString()
          })
          .eq('id', sessionId);
      }
    } catch (err) {
      console.warn('Error recording evidence saved in database:', err);
    }
  }

  /**
   * Checks whether the Opportunity Qualification Form should be displayed by default for this opportunity
   */
  static async checkShouldDefaultToQualificationForm(opportunityId: string): Promise<boolean> {
    if (!opportunityId) return false;
    const userId = await resolveAuthenticatedRevOSUserId();
    if (!userId) return false;

    const localStarted = getScopedStorageItem(`oq_started_${opportunityId}`, userId) === 'true';
    const localSaved = getScopedStorageItem(`oq_has_saved_evidence_${opportunityId}`, userId) === 'true';

    if (!isValidUuid(opportunityId)) {
      return localStarted && localSaved;
    }

    try {
      const session = await this.getSessionByOpportunity(opportunityId);
      if (!session) {
        return localStarted && localSaved;
      }

      const startedInDb =
        session.sql_inheritance_data?.qualification_started === true ||
        (session.qualification_status && session.qualification_status !== 'NOT_STARTED');

      const isStarted = localStarted || startedInDb;
      if (!isStarted) {
        const { data: formRec } = await supabase
          .from('opportunity_form_records')
          .select('form_status')
          .eq('opportunity_id', opportunityId)
          .maybeSingle();

        if (formRec?.form_status !== 'Qualification Started') {
          return false;
        }
      }

      const { data: evidenceRows, error } = await supabase
        .from('opportunity_qualification_evidence')
        .select('answer_value')
        .eq('session_id', session.id);

      if (error) {
        return (localStarted || isStarted) && localSaved;
      }

      const hasAnswer = (evidenceRows || []).some(
        (row: any) =>
          row.answer_value && typeof row.answer_value === 'string' && row.answer_value.trim().length > 0
      );

      if (hasAnswer) {
        setScopedStorageItem(`oq_started_${opportunityId}`, 'true', userId);
        setScopedStorageItem(`oq_has_saved_evidence_${opportunityId}`, 'true', userId);
        return true;
      }

      return false;
    } catch (err) {
      console.warn('Error checking qualification form default status:', err);
      return localStarted && localSaved;
    }
  }

  /**
   * Pre-loads default qualification form display status for a list of owned opportunities
   */
  static async getQualificationFormDefaultsMap(opportunityIds: string[]): Promise<Record<string, boolean>> {
    const result: Record<string, boolean> = {};
    if (!opportunityIds || opportunityIds.length === 0) return result;

    await Promise.all(
      opportunityIds.map(async (id) => {
        try {
          result[id] = await this.checkShouldDefaultToQualificationForm(id);
        } catch {
          result[id] = false;
        }
      })
    );
    return result;
  }

  /**
   * Save the full qualification result to Supabase opportunity_qualification_results
   */
  static async saveFullQualificationResult(
    opportunityId: string,
    sessionId: string,
    result: any
  ): Promise<boolean> {
    if (!opportunityId || !result) return false;
    const owned = await this.verifyOwnedOpportunity(opportunityId);
    if (!owned) throw new Error('Opportunity not found or access denied.');
    const userId = owned.userId;

    const actualResult = result.result || result;

    const status =
      actualResult.qualification_summary?.qualification_status ||
      actualResult.qualification_status ||
      'QUALIFIED';
    const score = Number(
      actualResult.qualification_summary?.overall_score ?? actualResult.overall_score ?? 0
    );
    const confidence = Number(
      actualResult.qualification_summary?.confidence_score ?? actualResult.confidence_score ?? 0
    );

    setScopedStorageItem(`oq_has_result_${opportunityId}`, 'true', userId);
    try {
      setScopedStorageItem(`oq_result_${opportunityId}`, JSON.stringify(actualResult), userId);
    } catch {}

    try {
      if (sessionId) {
        await supabase
          .from('opportunity_qualification_sessions')
          .update({
            qualification_status: status,
            overall_score: score,
            confidence_score: confidence,
            updated_at: new Date().toISOString()
          })
          .eq('id', sessionId)
          .eq('opportunity_id', opportunityId);
      }
    } catch (err) {
      console.warn('Session update in saveFullQualificationResult:', err);
    }

    try {
      if (sessionId) {
        const payload = {
          opportunity_id: opportunityId,
          session_id: sessionId,
          qualification_status: status,
          overall_score: score,
          confidence_score: confidence,
          dimension_results: actualResult.dimension_assessments || actualResult.dimension_results || [],
          qualification_explanation:
            actualResult.qualification_summary?.summary || actualResult.qualification_explanation || '',
          risks: actualResult.risk_analysis || actualResult.risks || [],
          contradictions: actualResult.contradictions || [],
          recommended_actions: actualResult.recommendations || actualResult.recommended_actions || [],
          next_best_questions: actualResult.next_best_questions || [],
          final_decision: {
            qualification_summary: actualResult.qualification_summary,
            evidence_assessments: actualResult.evidence_assessments,
            explainability: actualResult.explainability,
            opportunity_promotion_recommendation: actualResult.opportunity_promotion_recommendation
          },
          configuration_versions: {
            Opportunity_industry_configuration_JSON_version: '3.0',
            evidence_kb_version: '3.0',
            qualification_rules_version: '3.0',
            reasoning_strategy_version: '3.0',
            gemini_prompt_version: '3.0'
          }
        };

        const { error } = await supabase
          .from('opportunity_qualification_results')
          .upsert(payload, { onConflict: 'session_id' });

        if (error) {
          console.warn('opportunity_qualification_results upsert note:', error.message);
        }
      }
    } catch (e) {
      console.warn('Results upsert exception:', e);
    }

    removeScopedStorageItem(`oq_result_${opportunityId}`, userId);

    let dynamicOwner = 'Sales Representative';
    try {
      const formData = await this.getOpportunityFormData(opportunityId);
      if (formData?.opportunity_owner?.trim()) {
        dynamicOwner = formData.opportunity_owner.trim();
      }
    } catch {}

    try {
      await this.saveQualificationHistory({
        opportunity_id: opportunityId,
        session_id: sessionId || null,
        event_name: 'Opportunity Assessment Run',
        qualification_status: status,
        score,
        confidence,
        evidence_changes: `${(actualResult.evidence_assessments || []).length} evidence items evaluated`,
        reasoning_version: 'Gemini 3.1 Flash Lite - v3.0',
        rules_version: 'OQ Rules v3.0',
        user_name: dynamicOwner,
        raw_result: actualResult
      });
    } catch {}

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('opportunity_qualification_updated', { detail: { opportunityId } }));
    }

    return true;
  }

  /**
   * Check if a qualification result exists for this owned opportunity
   */
  static async checkHasQualificationResult(opportunityId: string): Promise<boolean> {
    if (!opportunityId) return false;
    const userId = await resolveAuthenticatedRevOSUserId();
    if (!userId) return false;

    if (getScopedStorageItem(`oq_has_result_${opportunityId}`, userId) === 'true') {
      return true;
    }

    if (!isValidUuid(opportunityId)) {
      return false;
    }

    try {
      const session = await this.getSessionByOpportunity(opportunityId);
      if (session) {
        if (
          session.overall_score &&
          session.overall_score > 0 &&
          session.qualification_status &&
          session.qualification_status !== 'NOT_STARTED'
        ) {
          setScopedStorageItem(`oq_has_result_${opportunityId}`, 'true', userId);
          return true;
        }

        const { data, error } = await supabase
          .from('opportunity_qualification_results')
          .select('id')
          .eq('session_id', session.id)
          .maybeSingle();

        if (!error && data) {
          setScopedStorageItem(`oq_has_result_${opportunityId}`, 'true', userId);
          return true;
        }
      }
    } catch (err) {
      console.warn('checkHasQualificationResult error:', err);
    }

    return false;
  }

  /**
   * Pre-load qualification results map for a list of opportunities
   */
  static async getQualificationResultsMap(opportunityIds: string[]): Promise<Record<string, boolean>> {
    const result: Record<string, boolean> = {};
    if (!opportunityIds || opportunityIds.length === 0) return result;

    await Promise.all(
      opportunityIds.map(async (id) => {
        try {
          result[id] = await this.checkHasQualificationResult(id);
        } catch {
          result[id] = false;
        }
      })
    );
    return result;
  }

  /**
   * Retrieve saved qualification result strictly for owned opportunity/session
   */
  static async getSavedQualificationResult(opportunityId: string, sessionId?: string): Promise<any | null> {
    if (!opportunityId) return null;
    if (!isValidUuid(opportunityId) && !isValidUuid(sessionId)) return null;

    if (isValidUuid(opportunityId)) {
      const owned = await this.verifyOwnedOpportunity(opportunityId);
      if (!owned) return null;

      try {
        const { data, error } = await supabase
          .from('opportunity_qualification_results')
          .select('*')
          .eq('opportunity_id', opportunityId)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (!error && data) {
          return {
            qualification_summary: {
              qualification_status: data.qualification_status,
              overall_score: Number(data.overall_score || 0),
              confidence_score: Number(data.confidence_score || 0),
              summary:
                data.qualification_explanation || data.final_decision?.qualification_summary?.summary || '',
              primary_reason:
                data.qualification_explanation ||
                data.final_decision?.qualification_summary?.primary_reason ||
                '',
              health_indicator: data.final_decision?.qualification_summary?.health_indicator,
              opportunity_readiness: data.final_decision?.qualification_summary?.opportunity_readiness
            },
            dimension_assessments: data.dimension_results || [],
            evidence_assessments: data.final_decision?.evidence_assessments || [],
            risk_analysis: data.risks || [],
            recommendations: data.recommended_actions || [],
            explainability: data.final_decision?.explainability || {
              decision_summary: data.qualification_explanation || ''
            },
            opportunity_promotion_recommendation: data.final_decision?.opportunity_promotion_recommendation
          };
        }
      } catch {}
    }

    let targetSessionId = isValidUuid(sessionId) ? sessionId : undefined;
    if (!targetSessionId && isValidUuid(opportunityId)) {
      const session = await this.getSessionByOpportunity(opportunityId);
      targetSessionId = session?.id;
    }

    if (isValidUuid(targetSessionId)) {
      const ownedSession = await this.verifyOwnedSession(targetSessionId);
      if (!ownedSession) return null;

      try {
        const { data, error } = await supabase
          .from('opportunity_qualification_results')
          .select('*')
          .eq('session_id', targetSessionId)
          .maybeSingle();

        if (!error && data) {
          return {
            qualification_summary: {
              qualification_status: data.qualification_status,
              overall_score: Number(data.overall_score || 0),
              confidence_score: Number(data.confidence_score || 0),
              summary:
                data.qualification_explanation || data.final_decision?.qualification_summary?.summary || '',
              primary_reason:
                data.qualification_explanation ||
                data.final_decision?.qualification_summary?.primary_reason ||
                '',
              health_indicator: data.final_decision?.qualification_summary?.health_indicator,
              opportunity_readiness: data.final_decision?.qualification_summary?.opportunity_readiness
            },
            dimension_assessments: data.dimension_results || [],
            evidence_assessments: data.final_decision?.evidence_assessments || [],
            risk_analysis: data.risks || [],
            recommendations: data.recommended_actions || [],
            explainability: data.final_decision?.explainability || {
              decision_summary: data.qualification_explanation || ''
            },
            opportunity_promotion_recommendation: data.final_decision?.opportunity_promotion_recommendation
          };
        }
      } catch {}
    }

    return null;
  }

  /**
   * Save entry to opportunity_qualification_history strictly for owned opportunity
   */
  static async saveQualificationHistory(historyItem: {
    opportunity_id: string;
    session_id?: string | null;
    event_name: string;
    qualification_status: string;
    score: number;
    confidence: number;
    evidence_changes?: string;
    reasoning_version?: string;
    rules_version?: string;
    user_name?: string;
    raw_result?: any;
  }): Promise<boolean> {
    const owned = await this.verifyOwnedOpportunity(historyItem.opportunity_id);
    if (!owned) return false;
    const userId = owned.userId;

    try {
      const todayStart = new Date();
      todayStart.setUTCHours(0, 0, 0, 0);
      const todayEnd = new Date();
      todayEnd.setUTCHours(23, 59, 59, 999);

      const { data: existingToday } = await supabase
        .from('opportunity_qualification_history')
        .select('id')
        .eq('opportunity_id', historyItem.opportunity_id)
        .gte('created_at', todayStart.toISOString())
        .lte('created_at', todayEnd.toISOString())
        .order('created_at', { ascending: false });

      const payload = {
        ...historyItem,
        created_at: new Date().toISOString()
      };

      if (existingToday && existingToday.length > 0) {
        const primaryId = existingToday[0].id;
        const { error } = await supabase
          .from('opportunity_qualification_history')
          .update(payload)
          .eq('id', primaryId);

        if (error) {
          console.warn('opportunity_qualification_history update note:', error.message);
        }

        if (existingToday.length > 1) {
          const extraIds = existingToday.slice(1).map((r: any) => r.id);
          await supabase.from('opportunity_qualification_history').delete().in('id', extraIds);
        }
      } else {
        const { error } = await supabase.from('opportunity_qualification_history').insert([payload]);

        if (error) {
          console.warn('opportunity_qualification_history insert note:', error.message);
        }
      }
    } catch (e) {
      console.warn('saveQualificationHistory error:', e);
    }

    if (historyItem.opportunity_id) {
      const key = `oq_history_${historyItem.opportunity_id}`;
      const todayLabel = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      const existingStr = getScopedStorageItem(key, userId);
      let list: any[] = [];
      try {
        list = existingStr ? JSON.parse(existingStr) : [];
      } catch {}

      const newEntry = {
        event: historyItem.event_name,
        date: todayLabel,
        status: historyItem.qualification_status,
        score: historyItem.score,
        confidence: `${historyItem.confidence}%`,
        evidence_changes: historyItem.evidence_changes || 'Evaluation run',
        reasoning_version: historyItem.reasoning_version || 'Gemini 3.1 Flash Lite - v3.0',
        rules_version: historyItem.rules_version || 'OQ Rules v3.0',
        user: historyItem.user_name || 'Sales Representative'
      };

      list = [newEntry, ...list.filter((item: any) => item.date !== todayLabel)];
      setScopedStorageItem(key, JSON.stringify(list.slice(0, 15)), userId);
    }

    return true;
  }

  /**
   * Get qualification history strictly for an owned opportunity
   */
  static async getQualificationHistory(opportunityId: string): Promise<any[]> {
    if (!opportunityId) return [];
    const userId = await resolveAuthenticatedRevOSUserId();
    if (!userId) return [];

    if (isValidUuid(opportunityId)) {
      const owned = await this.verifyOwnedOpportunity(opportunityId);
      if (!owned) return [];

      try {
        let dynamicOwner = 'Sales Representative';
        try {
          const formData = await this.getOpportunityFormData(opportunityId);
          if (formData?.opportunity_owner?.trim()) {
            dynamicOwner = formData.opportunity_owner.trim();
          }
        } catch {}

        const { data, error } = await supabase
          .from('opportunity_qualification_history')
          .select('*')
          .eq('opportunity_id', opportunityId)
          .order('created_at', { ascending: false });

        if (!error && data && data.length > 0) {
          const dayMap = new Map<string, any>();
          for (const d of data) {
            const dateObj = new Date(d.event_date || d.created_at);
            const dateKey = dateObj.toISOString().split('T')[0];
            if (!dayMap.has(dateKey)) {
              dayMap.set(dateKey, {
                event: d.event_name,
                date: dateObj.toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric'
                }),
                status: d.qualification_status,
                score: Number(d.score || 0),
                confidence: `${d.confidence}%`,
                evidence_changes: d.evidence_changes || 'Evaluation run',
                reasoning_version: d.reasoning_version || 'v3.0',
                rules_version: d.rules_version || 'v3.0',
                user:
                  d.user_name && d.user_name !== 'Sales Representative' ? d.user_name : dynamicOwner
              });
            }
          }

          return Array.from(dayMap.values());
        }
      } catch (e) {
        console.warn('Error fetching opportunity_qualification_history:', e);
      }
    }

    const cached = getScopedStorageItem(`oq_history_${opportunityId}`, userId);
    if (cached) {
      try {
        return JSON.parse(cached);
      } catch {}
    }

    return [];
  }

  static async getAllSessions(): Promise<OpportunitySession[]> {
    try {
      const userId = await resolveAuthenticatedRevOSUserId();
      if (!userId) return [];

      const { data: opps, error: oppsErr } = await supabase
        .from('opportunities')
        .select('id')
        .eq('created_by', userId);
      if (oppsErr || !opps || opps.length === 0) return [];

      const ownedOppIds = opps.map((o: any) => o.id).filter(Boolean);
      const { data, error } = await supabase
        .from('opportunity_qualification_sessions')
        .select('*')
        .in('opportunity_id', ownedOppIds)
        .order('created_at', { ascending: false });
      if (error) {
        console.warn('Error fetching all opportunity qualification sessions:', error);
        return [];
      }
      return (data || []) as OpportunitySession[];
    } catch (e) {
      console.warn('getAllSessions error:', e);
      return [];
    }
  }
}
