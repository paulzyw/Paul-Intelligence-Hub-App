import { supabase } from '@/src/lib/supabase';
import { MQLCampaign, MQLLead, MQLEvidenceAssessment, MQLQualificationResult } from '../../types/mql';
import { resolveAuthenticatedRevOSUserId } from '../../utils/userIsolation';

const isTransientFetchError = (err: any): boolean => {
  const msg = String(err?.message || err || '').toLowerCase();
  return (
    msg.includes('failed to fetch') ||
    msg.includes('networkerror') ||
    msg.includes('load failed') ||
    msg.includes('fetch')
  );
};

async function withTransientRetry<T>(
  fn: () => PromiseLike<{ data: T | null; error: any }>,
  retries = 2
): Promise<{ data: T | null; error: any }> {
  let attempt = 0;
  while (true) {
    try {
      const res = await fn();
      if (!res.error || attempt >= retries || !isTransientFetchError(res.error)) {
        return res;
      }
    } catch (err) {
      if (attempt >= retries || !isTransientFetchError(err)) {
        return { data: null, error: err };
      }
    }
    attempt += 1;
    await new Promise((resolve) => setTimeout(resolve, 350 * attempt));
  }
}

export class MQLDataService {
  static async getGTMCampaigns() {
    try {
      const userId = await resolveAuthenticatedRevOSUserId();
      if (!userId) return [];
      const { data, error } = await withTransientRetry(() =>
        supabase
          .from('revos_gtmos_strategies')
          .select('*')
          .eq('creator_id', userId)
          .order('created_at', { ascending: false })
      );
      if (error) {
        console.warn('Non-blocking warning fetching GTM campaigns:', error?.message || error);
        return [];
      }
      return data || [];
    } catch (err: any) {
      console.warn('Non-blocking warning fetching GTM campaigns:', err?.message || err);
      return [];
    }
  }

  static async getCampaigns() {
    const userId = await resolveAuthenticatedRevOSUserId();
    if (!userId) return [] as MQLCampaign[];
    const { data, error } = await withTransientRetry(() =>
      supabase
        .from('mql_campaigns')
        .select('*')
        .eq('created_by', userId)
        .order('created_at', { ascending: false })
    );
    if (error) throw error;
    return (data || []) as MQLCampaign[];
  }

  static async createCampaign(campaign: Partial<MQLCampaign>) {
    const userId = await resolveAuthenticatedRevOSUserId();
    if (!userId) throw new Error('Authentication required to create MQL campaign.');
    const payload = { ...campaign, created_by: userId };
    const { data, error } = await supabase.from('mql_campaigns').upsert([payload]).select().single();
    if (error) throw error;
    return data as MQLCampaign;
  }

  static async getLeads(campaignId?: string) {
    const userId = await resolveAuthenticatedRevOSUserId();
    if (!userId) return [];
    const { data, error } = await withTransientRetry(() => {
      let query = supabase
        .from('mql_leads')
        .select('*, mql_campaigns(*)')
        .eq('created_by', userId)
        .order('created_at', { ascending: false });
      if (campaignId) {
        query = query.eq('campaign_id', campaignId);
      }
      return query;
    });
    if (error) throw error;
    return data || [];
  }

  static async getLead(leadId: string) {
    const userId = await resolveAuthenticatedRevOSUserId();
    if (!userId) throw new Error('Authentication required to read lead.');
    const { data, error } = await supabase
      .from('mql_leads')
      .select('*, mql_campaigns(*)')
      .eq('id', leadId)
      .eq('created_by', userId)
      .single();
    if (error) throw error;
    return data;
  }

  static async createLead(lead: Partial<MQLLead>) {
    const userId = await resolveAuthenticatedRevOSUserId();
    if (!userId) throw new Error('Authentication required to create lead.');
    const scopedLead = { ...lead, created_by: userId };
    const { data, error } = await supabase.from('mql_leads').insert([scopedLead]).select().single();
    if (error) {
      const msg = String(error?.message || '').toLowerCase();
      if (
        error?.code === 'PGRST204' ||
        msg.includes('country') ||
        msg.includes('state_province') ||
        msg.includes('product_solution')
      ) {
        const { country: _c, state_province: _s, product_solution: _p, ...legacyLead } = scopedLead;
        const retry = await supabase.from('mql_leads').insert([legacyLead]).select().single();
        if (retry.error) throw retry.error;
        return { ...(retry.data as MQLLead), country: _c, state_province: _s, product_solution: _p };
      }
      throw error;
    }
    return data as MQLLead;
  }

  static async bulkCreateLeads(leads: Partial<MQLLead>[]) {
    const userId = await resolveAuthenticatedRevOSUserId();
    if (!userId) throw new Error('Authentication required to import leads.');
    const scopedLeads = leads.map((lead) => ({ ...lead, created_by: userId }));
    const { data, error } = await supabase.from('mql_leads').insert(scopedLeads).select();
    if (error) throw error;
    return data as MQLLead[];
  }

  static async updateLead(leadId: string, lead: Partial<MQLLead>) {
    const userId = await resolveAuthenticatedRevOSUserId();
    if (!userId) throw new Error('Authentication required to update lead.');
    const { created_by: _ignored, ...safeFields } = lead as any;
    const { data, error } = await supabase
      .from('mql_leads')
      .update(safeFields)
      .eq('id', leadId)
      .eq('created_by', userId)
      .select()
      .single();
    if (error) {
      const msg = String(error?.message || '').toLowerCase();
      if (
        error?.code === 'PGRST204' ||
        msg.includes('country') ||
        msg.includes('state_province') ||
        msg.includes('product_solution')
      ) {
        const { country: _c, state_province: _s, product_solution: _p, ...legacyLead } = safeFields;
        const retry = await supabase
          .from('mql_leads')
          .update(legacyLead)
          .eq('id', leadId)
          .eq('created_by', userId)
          .select()
          .single();
        if (retry.error) throw retry.error;
        return { ...(retry.data as MQLLead), country: _c, state_province: _s, product_solution: _p };
      }
      throw error;
    }
    return data as MQLLead;
  }

  static async getAssessments(leadId: string) {
    const userId = await resolveAuthenticatedRevOSUserId();
    if (!userId) return [];
    const { data: lead } = await supabase
      .from('mql_leads')
      .select('id')
      .eq('id', leadId)
      .eq('created_by', userId)
      .maybeSingle();
    if (!lead) return [];
    const { data, error } = await supabase
      .from('mql_evidence_assessments')
      .select('*')
      .eq('lead_id', leadId);
    if (error) throw error;
    return (data || []) as MQLEvidenceAssessment[];
  }

  static async saveAssessments(leadId: string, assessments: Partial<MQLEvidenceAssessment>[]) {
    const userId = await resolveAuthenticatedRevOSUserId();
    if (!userId) throw new Error('Authentication required to save lead assessments.');
    const { data: lead } = await supabase
      .from('mql_leads')
      .select('id')
      .eq('id', leadId)
      .eq('created_by', userId)
      .maybeSingle();
    if (!lead) throw new Error('Lead not found or access denied.');

    const payload = assessments.map((a) => ({
      ...a,
      lead_id: leadId,
      updated_at: new Date().toISOString()
    }));

    const { data, error } = await supabase
      .from('mql_evidence_assessments')
      .upsert(payload, { onConflict: 'lead_id, evidence_id' })
      .select();
    if (error) throw error;

    await supabase
      .from('mql_leads')
      .update({ status: 'Assessing' })
      .eq('id', leadId)
      .eq('created_by', userId);

    return data as MQLEvidenceAssessment[];
  }

  static async evaluateLead(leadId: string, combinedConfig?: any, ruleSet?: any) {
    const userId = await resolveAuthenticatedRevOSUserId();
    if (!userId) throw new Error('Authentication required to evaluate lead.');

    const { data, error } = await supabase.functions.invoke('lead-qualification', {
      body: { leadId, combinedConfig, ruleSet }
    });

    if (error) {
      throw error;
    }

    if (data) {
      await supabase
        .from('mql_qualification_results')
        .upsert(
          {
            ...data,
            lead_id: leadId,
            evaluated_at: new Date().toISOString()
          },
          { onConflict: 'lead_id' }
        );

      if (data.qualification_status) {
        await supabase
          .from('mql_leads')
          .update({ status: data.qualification_status })
          .eq('id', leadId)
          .eq('created_by', userId);
      }
    }

    return data;
  }

  static async getQualificationResult(leadId: string) {
    const userId = await resolveAuthenticatedRevOSUserId();
    if (!userId) return null;
    const { data: lead } = await supabase
      .from('mql_leads')
      .select('id')
      .eq('id', leadId)
      .eq('created_by', userId)
      .maybeSingle();
    if (!lead) return null;
    const { data, error } = await supabase
      .from('mql_qualification_results')
      .select('*')
      .eq('lead_id', leadId)
      .maybeSingle();
    if (error) throw error;
    return data as MQLQualificationResult | null;
  }

  static async saveQualificationResult(result: MQLQualificationResult) {
    const userId = await resolveAuthenticatedRevOSUserId();
    if (!userId) throw new Error('Authentication required to save qualification result.');
    const { data: lead } = await supabase
      .from('mql_leads')
      .select('id')
      .eq('id', result.lead_id)
      .eq('created_by', userId)
      .maybeSingle();
    if (!lead) throw new Error('Lead not found or access denied.');

    const { id: _id, ...rest } = result;
    const payload = {
      ...rest,
      evaluated_at: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('mql_qualification_results')
      .upsert(payload, { onConflict: 'lead_id' })
      .select()
      .maybeSingle();

    if (error) throw error;

    if (result.qualification_status) {
      await supabase
        .from('mql_leads')
        .update({ status: result.qualification_status })
        .eq('id', result.lead_id)
        .eq('created_by', userId);
    }

    return data as MQLQualificationResult;
  }

  static async getCampaignQualificationResults(campaignId: string) {
    const userId = await resolveAuthenticatedRevOSUserId();
    if (!userId) return [];
    const { data: leads, error: leadsErr } = await supabase
      .from('mql_leads')
      .select('id')
      .eq('campaign_id', campaignId)
      .eq('created_by', userId);
    if (leadsErr || !leads || leads.length === 0) return [];

    const leadIds = leads.map((l) => l.id);
    const { data, error } = await supabase
      .from('mql_qualification_results')
      .select('*')
      .in('lead_id', leadIds);
    if (error) throw error;
    return (data || []) as MQLQualificationResult[];
  }

  static async getAllQualificationResults() {
    try {
      const userId = await resolveAuthenticatedRevOSUserId();
      if (!userId) return [];
      const { data: leads, error: leadsErr } = await supabase
        .from('mql_leads')
        .select('id')
        .eq('created_by', userId);
      if (leadsErr || !leads || leads.length === 0) return [];
      const leadIds = leads.map((l) => l.id);
      const { data, error } = await supabase
        .from('mql_qualification_results')
        .select('*')
        .in('lead_id', leadIds);
      if (error) throw error;
      return (data as MQLQualificationResult[]) || [];
    } catch (error) {
      console.warn('Error fetching all qualification results:', error);
      return [];
    }
  }

  static async deleteLeads(leadIds: string[]) {
    const userId = await resolveAuthenticatedRevOSUserId();
    if (!userId) throw new Error('Authentication required to delete leads.');
    const { error } = await supabase
      .from('mql_leads')
      .delete()
      .in('id', leadIds)
      .eq('created_by', userId);
    if (error) throw error;
  }
}
