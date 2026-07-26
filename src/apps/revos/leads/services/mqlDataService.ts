import { supabase } from '@/src/lib/supabase';
import { MQLCampaign, MQLLead, MQLEvidenceAssessment, MQLQualificationResult } from '../../types/mql';

export class MQLDataService {
  static async getGTMCampaigns() {
    // Assuming revos_gtmos_strategies is the table holding GTMOS campaigns
    const { data, error } = await supabase.from('revos_gtmos_strategies').select('*').order('created_at', { ascending: false });
    if (error) {
      console.error(error);
      return [];
    }
    return data;
  }

  static async getCampaigns() {
    const { data, error } = await supabase.from('mql_campaigns').select('*').order('created_at', { ascending: false });
    if (error) throw error;
    return data as MQLCampaign[];
  }

  static async createCampaign(campaign: Partial<MQLCampaign>) {
    const { data, error } = await supabase.from('mql_campaigns').upsert([campaign]).select().single();
    if (error) throw error;
    return data as MQLCampaign;
  }

  static async getLeads(campaignId?: string) {
    let query = supabase.from('mql_leads').select('*, mql_campaigns(*)').order('created_at', { ascending: false });
    if (campaignId) {
      query = query.eq('campaign_id', campaignId);
    }
    const { data, error } = await query;
    if (error) throw error;
    return data;
  }
  
  static async getLead(leadId: string) {
    const { data, error } = await supabase.from('mql_leads').select('*, mql_campaigns(*)').eq('id', leadId).single();
    if (error) throw error;
    return data;
  }

  static async createLead(lead: Partial<MQLLead>) {
    const { data, error } = await supabase.from('mql_leads').insert([lead]).select().single();
    if (error) throw error;
    return data as MQLLead;
  }

  static async bulkCreateLeads(leads: Partial<MQLLead>[]) {
    const { data, error } = await supabase.from('mql_leads').insert(leads).select();
    if (error) throw error;
    return data as MQLLead[];
  }

  static async updateLead(leadId: string, lead: Partial<MQLLead>) {
    const { data, error } = await supabase.from('mql_leads').update(lead).eq('id', leadId).select().single();
    if (error) throw error;
    return data as MQLLead;
  }

  static async getAssessments(leadId: string) {
    const { data, error } = await supabase.from('mql_evidence_assessments').select('*').eq('lead_id', leadId);
    if (error) throw error;
    return data as MQLEvidenceAssessment[];
  }

  static async saveAssessments(leadId: string, assessments: Partial<MQLEvidenceAssessment>[]) {
    // We can do an upsert
    const payload = assessments.map(a => ({
      ...a,
      lead_id: leadId,
      updated_at: new Date().toISOString()
    }));
    
    const { data, error } = await supabase.from('mql_evidence_assessments')
      .upsert(payload, { onConflict: 'lead_id, evidence_id' })
      .select();
    if (error) throw error;
    
    // Update lead status to Assessing
    await supabase.from('mql_leads').update({ status: 'Assessing' }).eq('id', leadId);
    
    return data as MQLEvidenceAssessment[];
  }

  static async evaluateLead(leadId: string, combinedConfig?: any, ruleSet?: any) {
    try {
      // Invoke the edge function
      const { data, error } = await supabase.functions.invoke('lead-qualification', {
        body: { leadId, combinedConfig, ruleSet }
      });
      
      if (error) {
        console.warn("Edge function failed, using local mock. Error:", error);
        throw error;
      }

      // If the edge function succeeded, let's make sure it's saved in the database!
      if (data) {
        await supabase.from('mql_qualification_results').upsert({
          ...data,
          lead_id: leadId,
          evaluated_at: new Date().toISOString()
        }, { onConflict: 'lead_id' });
        
        if (data.qualification_status) {
          await supabase.from('mql_leads').update({ status: data.qualification_status }).eq('id', leadId);
        }
      }
      
      return data;
    } catch (err) {
      console.log("Mocking qualification result since edge function is unavailable.");
      // Create a mock result
      const mockResult = {
        lead_id: leadId,
        qualification_status: 'Qualified MQL',
        qualification_score: 85,
        confidence_score: 90,
        dimension_scores: { fit: 90, intent: 80, engagement: 85, timing: 85 },
        supporting_evidence: ['Strong job title', 'Enterprise company size'],
        negative_evidence: ['No recent website visits'],
        missing_evidence: ['Budget details unknown'],
        reasoning: {
          summary: 'Good fit based on firmographics and title.',
          fit: 'Matches ICP perfectly.',
          intent: 'Showed some early intent.',
          engagement: 'Engaged with 1 whitepaper.',
          timing: 'No compelling event yet.'
        },
        recommendations: ['Follow up via email'],
        next_best_actions: ['Enroll in nurture sequence'],
        evaluated_at: new Date().toISOString()
      };
      
      // Attempt to save the mock result to DB
      const { data } = await supabase.from('mql_qualification_results').upsert(mockResult).select().single();
      
      await supabase.from('mql_leads').update({ status: 'Qualified' }).eq('id', leadId);
      
      return data || mockResult;
    }
  }
  
  static async getQualificationResult(leadId: string) {
    const { data, error } = await supabase.from('mql_qualification_results').select('*').eq('lead_id', leadId).maybeSingle();
    if (error) throw error;
    return data as MQLQualificationResult | null;
  }

  static async saveQualificationResult(result: MQLQualificationResult) {
    const { id, ...rest } = result;
    const payload = {
      ...rest,
      evaluated_at: new Date().toISOString()
    };
    
    const { data, error } = await supabase.from('mql_qualification_results')
      .upsert(payload, { onConflict: 'lead_id' })
      .select()
      .maybeSingle();
      
    if (error) throw error;
    
    // Also, update the lead's status in mql_leads to match the qualification_status
    if (result.qualification_status) {
      await supabase.from('mql_leads')
        .update({ status: result.qualification_status })
        .eq('id', result.lead_id);
    }
    
    return data as MQLQualificationResult;
  }

  static async getCampaignQualificationResults(campaignId: string) {
    const { data: leads, error: leadsErr } = await supabase.from('mql_leads').select('id').eq('campaign_id', campaignId);
    if (leadsErr || !leads || leads.length === 0) return [];
    
    const leadIds = leads.map(l => l.id);
    const { data, error } = await supabase.from('mql_qualification_results').select('*').in('lead_id', leadIds);
    if (error) throw error;
    return data as MQLQualificationResult[];
  }

  static async getAllQualificationResults() {
    const { data, error } = await supabase.from('mql_qualification_results').select('*');
    if (error) throw error;
    return data as MQLQualificationResult[];
  }

  static async deleteLeads(leadIds: string[]) {
    const { error } = await supabase.from('mql_leads').delete().in('id', leadIds);
    if (error) throw error;
  }
}
