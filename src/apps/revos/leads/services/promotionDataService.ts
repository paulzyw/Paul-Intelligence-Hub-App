import { supabase } from '@/src/lib/supabase';

export interface MQLSQLPromotion {
  id?: string;
  lead_id: string;
  opportunity_id?: string;
  status?: string;
  promoted_at?: string;
  promoted_by?: string;
}

export class PromotionDataService {
  /**
   * Get all promoted lead IDs from Supabase table mql_sql_promotions.
   */
  static async getPromotedLeadIds(): Promise<string[]> {
    try {
      const { data, error } = await supabase
        .from('mql_sql_promotions')
        .select('lead_id');

      if (error) {
        console.warn('mql_sql_promotions table fetch:', error.message);
        return [];
      }
      return (data || []).map((row: any) => row.lead_id).filter(Boolean);
    } catch (err) {
      console.error('Failed to fetch promoted lead IDs from Supabase:', err);
      return [];
    }
  }

  /**
   * Check if a specific lead ID is promoted in Supabase.
   */
  static async isLeadPromoted(leadId: string): Promise<boolean> {
    if (!leadId) return false;
    try {
      const { data, error } = await supabase
        .from('mql_sql_promotions')
        .select('id')
        .eq('lead_id', leadId)
        .limit(1);

      if (error) {
        return false;
      }
      return Boolean(data && data.length > 0);
    } catch (err) {
      return false;
    }
  }

  /**
   * Promote a lead to SQL in Supabase mql_sql_promotions table.
   */
  static async promoteLead(leadId: string, opportunityId?: string): Promise<boolean> {
    if (!leadId) return false;
    try {
      const { error } = await supabase
        .from('mql_sql_promotions')
        .upsert(
          [{ lead_id: leadId, opportunity_id: opportunityId, status: 'Promoted' }],
          { onConflict: 'lead_id' }
        );

      if (error) {
        console.error('Error promoting lead in Supabase:', error);
        return false;
      }
      return true;
    } catch (err) {
      console.error('Failed to promote lead in Supabase:', err);
      return false;
    }
  }

  /**
   * Remove promotion record from Supabase mql_sql_promotions table.
   */
  static async unpromoteLead(leadId: string): Promise<boolean> {
    if (!leadId) return false;
    try {
      const { error } = await supabase
        .from('mql_sql_promotions')
        .delete()
        .eq('lead_id', leadId);

      if (error) {
        console.error('Error unpromoting lead in Supabase:', error);
        return false;
      }
      return true;
    } catch (err) {
      console.error('Failed to unpromote lead in Supabase:', err);
      return false;
    }
  }
}
