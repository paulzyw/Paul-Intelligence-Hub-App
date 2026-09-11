import { supabase } from '@/src/lib/supabase';
import { SQLOpportunity, SQLAssessment, SQLEvidenceRecord, SQLDimensionResult, SQLRecommendation } from '../../types/sql';

export class SQLDataService {
  // Opportunity management
  static async getOpportunities() {
    const { data, error } = await supabase
      .from('opportunities')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) {
      console.error(error);
      return [];
    }
    return data as SQLOpportunity[];
  }

  static async getOpportunityByMqlId(mqlId: string) {
    const { data, error } = await supabase
      .from('opportunities')
      .select('*')
      .eq('mql_reference_id', mqlId)
      .order('created_at', { ascending: false })
      .limit(1);
    if (error) {
      console.error(error);
      return null;
    }
    return (data && data.length > 0) ? (data[0] as SQLOpportunity) : null;
  }

  static async getOpportunity(id: string) {
    const { data, error } = await supabase
      .from('opportunities')
      .select('*')
      .eq('id', id)
      .single();
    if (error) throw error;
    return data as SQLOpportunity;
  }

  static async createOpportunity(opportunity: Partial<SQLOpportunity>) {
    const { data, error } = await supabase
      .from('opportunities')
      .insert([opportunity])
      .select()
      .single();
    if (error) throw error;
    return data as SQLOpportunity;
  }

  static async updateOpportunity(id: string, opportunity: Partial<SQLOpportunity>) {
    const { data, error } = await supabase
      .from('opportunities')
      .update(opportunity)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data as SQLOpportunity;
  }

  static async deleteOpportunity(id: string) {
    const { error } = await supabase
      .from('opportunities')
      .delete()
      .eq('id', id);
    if (error) throw error;
    return true;
  }

  // SQL Assessment management
  static async saveFullQualificationResult(opportunityId: string, result: any) {
    let assessment = await this.getAssessmentByOpportunity(opportunityId);
    let assessmentId = assessment?.id;
    
    if (!assessment) {
      const created = await this.createAssessment(opportunityId);
      assessmentId = created.assessment_id;
    }
    
    // Update assessment status
    await supabase.from('sql_assessments').update({
      assessment_status: 'completed',
      qualification_status: result.qualification_summary?.qualification_status,
      overall_score: result.qualification_summary?.overall_score,
      confidence_score: result.qualification_summary?.confidence_score
    }).eq('id', assessmentId);

    // Save full JSON in reasoning sessions
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
    return true;
  }

  static async getSavedQualificationResult(opportunityId: string) {
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
    const { data, error } = await supabase
      .from('sql_assessments')
      .select('*')
      .eq('opportunity_id', opportunityId)
      .order('created_at', { ascending: false })
      .limit(1);
    if (error) {
      console.error(error);
      return null;
    }
    return (data && data.length > 0) ? (data[0] as SQLAssessment) : null;
  }

  static async createAssessment(opportunityId: string) {
    const { data, error } = await supabase.from('sql_assessments').insert({
      opportunity_id: opportunityId,
      assessment_status: 'created'
    }).select().single();
    if (error) throw error;
    return { assessment_id: data.id, status: 'created' };
  }

  static async getEvidenceRecords(assessmentId: string) {
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
    // Delete existing evidence for this assessment first
    await supabase.from('sql_evidence_records').delete().eq('assessment_id', assessmentId);
    
    if (evidence.length > 0) {
      const recordsToInsert = evidence.map(e => ({
        ...e,
        assessment_id: assessmentId,
        validation_status: e.validation_status || 'unverified'
      }));
      const { error: insertError } = await supabase.from('sql_evidence_records').insert(recordsToInsert);
      if (insertError) throw insertError;
    }
    
    // Update assessment status
    await supabase.from('sql_assessments').update({ assessment_status: 'collecting_evidence' }).eq('id', assessmentId);
    
    return { success: true };
  }

  static async executeReasoning(assessmentId: string, contexts: { industry_context: any; evidence_context: any; qualification_policy: any }) {
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
    const { data: assessment, error: assessError } = await supabase.from('sql_assessments').select('*, opportunities(*)').eq('id', assessmentId).single();
    if (assessError) throw assessError;

    const { data: dimensions, error: dimError } = await supabase.from('sql_dimension_results').select('*').eq('assessment_id', assessmentId);
    if (dimError) throw dimError;

    const { data: recommendations, error: recError } = await supabase.from('sql_recommendations').select('*').eq('assessment_id', assessmentId);
    if (recError) throw recError;

    const { data: evidence, error: evError } = await supabase.from('sql_evidence_records').select('*').eq('assessment_id', assessmentId);
    if (evError) throw evError;

    return {
      assessment: assessment as SQLAssessment,
      dimensions: dimensions as SQLDimensionResult[],
      recommendations: recommendations as SQLRecommendation[],
      evidence: evidence as SQLEvidenceRecord[]
    };
  }
}
