import { supabase } from './src/lib/supabase';

async function fix() {
  // Find lead by company name
  const { data: leads, error } = await supabase
    .from('mql_leads')
    .select('*')
    .ilike('company_name', '%Birty%');

  if (error) {
    console.error('Error finding lead:', error);
    return;
  }

  if (!leads || leads.length === 0) {
    console.log('No lead found for Birty Technology');
    return;
  }

  console.log('Found leads:', leads);

  for (const lead of leads) {
    console.log('Updating lead:', lead.id, lead.company_name);
    const { error: updateError } = await supabase
      .from('mql_leads')
      .update({ status: 'Highly Qualified MQL', handover_status: null })
      .eq('id', lead.id);

    if (updateError) {
      console.error('Error updating lead:', updateError);
    } else {
      console.log('Successfully updated lead status to Highly Qualified MQL');
    }

    // Also let's check if there's a handover ticket to delete in mql_qualification_results recommendations?
    // And what about the opportunities table?
    const { data: opps, error: oppError } = await supabase
      .from('opportunities')
      .select('*')
      .eq('lead_id', lead.id);

    if (oppError) {
      console.log('Error checking opportunities:', oppError);
    } else if (opps && opps.length > 0) {
      console.log('Found associated opportunities:', opps);
      for (const opp of opps) {
        console.log('Deleting opportunity:', opp.id);
        await supabase.from('opportunities').delete().eq('id', opp.id);
      }
    }
  }
}

fix();
