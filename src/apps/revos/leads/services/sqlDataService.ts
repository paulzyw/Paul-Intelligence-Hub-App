import { supabase } from '@/src/lib/supabase';
import { SQLOpportunity, SQLAssessment, SQLEvidenceRecord, SQLDimensionResult, SQLRecommendation } from '../../types/sql';
import { resolveAuthenticatedRevOSUserId } from '../../utils/userIsolation';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const isValidUuid = (id?: string | null): id is string => typeof id === 'string' && UUID_REGEX.test(id);

export class SQLDataService {
  // Opportunity management
  static async getOpportunities() {
    const userId = await resolveAuthenticatedRevOSUserId();
    if (!userId) return [];
    const { data, error } = await supabase
      .from('opportunities')
      .select('*')
      .eq('created_by', userId)
      .order('created_at', { ascending: false });
    if (error) {
      console.error(error);
      return [];
    }
    return (data || []) as SQLOpportunity[];
  }

  static async getOpportunityByMqlId(mqlId: string) {
    if (!isValidUuid(mqlId)) return null;
    const userId = await resolveAuthenticatedRevOSUserId();
    if (!userId) return null;
    const { data, error } = await supabase
      .from('opportunities')
      .select('*')
      .eq('mql_reference_id', mqlId)
      .eq('created_by', userId)
      .order('created_at', { ascending: false })
      .limit(1);
    if (error) {
      console.error(error);
      return null;
    }
    return data && data.length > 0 ? (data[0] as SQLOpportunity) : null;
  }

  static async getOpportunity(id: string) {
    if (!isValidUuid(id)) {
      throw new Error(`Invalid opportunity UUID: ${id}`);
    }
    const userId = await resolveAuthenticatedRevOSUserId();
    if (!userId) throw new Error('Authentication required to read opportunity.');
    const { data, error } = await supabase
      .from('opportunities')
      .select('*')
      .eq('id', id)
      .eq('created_by', userId)
      .single();
    if (error) throw error;
    return data as SQLOpportunity;
  }

  static async createOpportunity(opportunity: Partial<SQLOpportunity>) {
    const userId = await resolveAuthenticatedRevOSUserId();
    if (!userId) throw new Error('Authentication required to create opportunity.');
    const scopedOpp = { ...opportunity, created_by: userId };
    const { data, error } = await supabase
      .from('opportunities')
      .insert([scopedOpp])
      .select()
      .single();
    if (error) {
      const msg = String(error?.message || '').toLowerCase();
      if (
        error?.code === 'PGRST204' ||
        msg.includes('country') ||
        msg.includes('campaign_assignment') ||
        msg.includes('business_segment') ||
        msg.includes('product_solution')
      ) {
        const {
          country: _c,
          campaign_assignment: _ca,
          business_segment: _bs,
          product_solution: _ps,
          ...legacyOpp
        } = scopedOpp;
        const retry = await supabase
          .from('opportunities')
          .insert([legacyOpp])
          .select()
          .single();
        if (retry.error) throw retry.error;
        return {
          ...(retry.data as SQLOpportunity),
          country: _c,
          campaign_assignment: _ca,
          business_segment: _bs,
          product_solution: _ps
        };
      }
      throw error;
    }
    return data as SQLOpportunity;
  }

  static async updateOpportunity(id: string, opportunity: Partial<SQLOpportunity>) {
    const userId = await resolveAuthenticatedRevOSUserId();
    if (!userId) throw new Error('Authentication required to update opportunity.');
    const { created_by: _ignored, ...safeFields } = opportunity as any;
    const { data, error } = await supabase
      .from('opportunities')
      .update(safeFields)
      .eq('id', id)
      .eq('created_by', userId)
      .select()
      .single();
    if (error) {
      const msg = String(error?.message || '').toLowerCase();
      if (
        error?.code === 'PGRST204' ||
        msg.includes('country') ||
        msg.includes('campaign_assignment') ||
        msg.includes('business_segment') ||
        msg.includes('product_solution')
      ) {
        const {
          country: _c,
          campaign_assignment: _ca,
          business_segment: _bs,
          product_solution: _ps,
          ...legacyOpp
        } = safeFields;
        const retry = await supabase
          .from('opportunities')
          .update(legacyOpp)
          .eq('id', id)
          .eq('created_by', userId)
          .select()
          .single();
        if (retry.error) throw retry.error;
        return {
          ...(retry.data as SQLOpportunity),
          country: _c,
          campaign_assignment: _ca,
          business_segment: _bs,
          product_solution: _ps
        };
      }
      throw error;
    }
    return data as SQLOpportunity;
  }

  static async deleteOpportunity(id: string) {
    const userId = await resolveAuthenticatedRevOSUserId();
    if (!userId) throw new Error('Authentication required to delete opportunity.');
    const { error } = await supabase
      .from('opportunities')
      .delete()
      .eq('id', id)
      .eq('created_by', userId);
    if (error) throw error;
    return true;
  }

  private static async verifyOwnedOpportunity(opportunityId: string): Promise<boolean> {
    if (!isValidUuid(opportunityId)) return false;
    const userId = await resolveAuthenticatedRevOSUserId();
    if (!userId) return false;
    const { data } = await supabase
      .from('opportunities')
      .select('id')
      .eq('id', opportunityId)
      .eq('created_by', userId)
      .maybeSingle();
    return Boolean(data?.id);
  }

  // SQL Assessment management
  static async saveFullQualificationResult(opportunityId: string, result: any) {
    const owned = await this.verifyOwnedOpportunity(opportunityId);
    if (!owned) throw new Error('Opportunity not found or access denied.');

    let assessment = await this.getAssessmentByOpportunity(opportunityId);
    let assessmentId = assessment?.id;

    if (!assessment) {
      const created = await this.createAssessment(opportunityId);
      assessmentId = created.assessment_id;
    }

    await supabase
      .from('sql_assessments')
      .update({
        assessment_status: 'completed',
        qualification_status: result.qualification_summary?.qualification_status,
        overall_score: result.qualification_summary?.overall_score,
        confidence_score: result.qualification_summary?.confidence_score,
        completed_at: new Date().toISOString()
      })
      .eq('id', assessmentId);

    const { error } = await supabase.from('sql_reasoning_sessions').insert({
      assessment_id: assessmentId,
      model_name: 'gemini-3.1-pro',
      prompt_version: '1.0',
      execution_status: 'success',
      output_response: result
    });

    if (error) {
      console.error('Error saving full qualification result:', error);
      throw error;
    }

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('sql_qualification_updated', { detail: { opportunityId } }));
    }

    return true;
  }

  static async getSavedQualificationResult(opportunityId: string) {
    if (!isValidUuid(opportunityId)) return null;
    const owned = await this.verifyOwnedOpportunity(opportunityId);
    if (!owned) return null;
    const assessment = await this.getAssessmentByOpportunity(opportunityId);
    if (!assessment) return null;

    const { data, error } = await supabase
      .from('sql_reasoning_sessions')
      .select('output_response')
      .eq('assessment_id', assessment.id)
      .order('created_at', { ascending: false })
      .limit(1);

    if (error || !data || data.length === 0) return null;
    return data[0].output_response;
  }

  static async getAssessmentByOpportunity(opportunityId: string) {
    if (!isValidUuid(opportunityId)) return null;
    const owned = await this.verifyOwnedOpportunity(opportunityId);
    if (!owned) return null;
    const { data, error } = await supabase
      .from('sql_assessments')
      .select('*')
      .eq('opportunity_id', opportunityId)
      .order('created_at', { ascending: false });
    if (error) {
      console.error(error);
      return null;
    }
    if (!data || data.length === 0) return null;
    const completed = data.find(
      (a) => (a.assessment_status === 'completed' || a.overall_score !== null) && a.overall_score !== undefined
    );
    return (completed || data[0]) as SQLAssessment;
  }

  static async createAssessment(opportunityId: string) {
    const owned = await this.verifyOwnedOpportunity(opportunityId);
    if (!owned) throw new Error('Opportunity not found or access denied.');
    const { data, error } = await supabase
      .from('sql_assessments')
      .insert({
        opportunity_id: opportunityId,
        assessment_status: 'created'
      })
      .select()
      .single();
    if (error) throw error;
    return { assessment_id: data.id, status: 'created' };
  }

  static async getEvidenceRecords(assessmentId: string) {
    const userId = await resolveAuthenticatedRevOSUserId();
    if (!userId) return [];
    const { data: assessment } = await supabase
      .from('sql_assessments')
      .select('id, opportunities!inner(created_by)')
      .eq('id', assessmentId)
      .eq('opportunities.created_by', userId)
      .maybeSingle();
    if (!assessment) return [];
    const { data, error } = await supabase
      .from('sql_evidence_records')
      .select('*')
      .eq('assessment_id', assessmentId);
    if (error) {
      console.error(error);
      return [];
    }
    return data as SQLEvidenceRecord[];
  }

  static async submitEvidence(assessmentId: string, evidence: Partial<SQLEvidenceRecord>[]) {
    const userId = await resolveAuthenticatedRevOSUserId();
    if (!userId) throw new Error('Authentication required to submit evidence.');
    const { data: assessment } = await supabase
      .from('sql_assessments')
      .select('id, opportunities!inner(created_by)')
      .eq('id', assessmentId)
      .eq('opportunities.created_by', userId)
      .maybeSingle();
    if (!assessment) throw new Error('Assessment not found or access denied.');

    await supabase.from('sql_evidence_records').delete().eq('assessment_id', assessmentId);

    if (evidence.length > 0) {
      const recordsToInsert = evidence.map((e) => ({
        ...e,
        assessment_id: assessmentId,
        validation_status: e.validation_status || 'unverified'
      }));
      const { error: insertError } = await supabase.from('sql_evidence_records').insert(recordsToInsert);
      if (insertError) throw insertError;
    }

    await supabase
      .from('sql_assessments')
      .update({ assessment_status: 'collecting_evidence' })
      .eq('id', assessmentId);

    return { success: true };
  }

  static async executeReasoning(
    assessmentId: string,
    contexts: { industry_context: any; evidence_context: any; qualification_policy: any }
  ) {
    const { data, error } = await supabase.functions.invoke('lead-qualification', {
      body: {
        action: 'execute-sql-reasoning',
        assessment_id: assessmentId,
        ...contexts
      }
    });
    if (error) throw error;
    return data;
  }

  static async generateSuggestedAnswers(
    opportunityId?: string,
    revenueMotion?: string,
    industry?: string,
    evidenceQuestions?: any[]
  ) {
    const { data, error } = await supabase.functions.invoke('lead-qualification', {
      body: {
        action: 'generate-sql-suggested-answers',
        opportunity_id: opportunityId,
        revenue_motion: revenueMotion,
        industry: industry,
        evidence_questions: evidenceQuestions
      }
    });
    if (error) {
      console.error('Error generating suggested answers:', error);
      throw error;
    }
    return data?.suggested_answers || [];
  }

  static async retrieveAssessmentResult(assessmentId: string) {
    const userId = await resolveAuthenticatedRevOSUserId();
    if (!userId) throw new Error('Authentication required to retrieve SQL assessment.');
    const { data: assessment, error: assessError } = await supabase
      .from('sql_assessments')
      .select('*, opportunities!inner(*)')
      .eq('id', assessmentId)
      .eq('opportunities.created_by', userId)
      .single();
    if (assessError) throw assessError;

    const { data: dimensions, error: dimError } = await supabase
      .from('sql_dimension_results')
      .select('*')
      .eq('assessment_id', assessmentId);
    if (dimError) throw dimError;

    const { data: recommendations, error: recError } = await supabase
      .from('sql_recommendations')
      .select('*')
      .eq('assessment_id', assessmentId);
    if (recError) throw recError;

    const { data: evidence, error: evError } = await supabase
      .from('sql_evidence_records')
      .select('*')
      .eq('assessment_id', assessmentId);
    if (evError) throw evError;

    return {
      assessment: assessment as SQLAssessment,
      dimensions: dimensions as SQLDimensionResult[],
      recommendations: recommendations as SQLRecommendation[],
      evidence: evidence as SQLEvidenceRecord[]
    };
  }
}
