const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://yfonihlpdvelssfmzokp.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inlmb25paGxwZHZlbHNzZm16b2twIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUyNzIwODcsImV4cCI6MjA5MDg0ODA4N30.CMDWSUSfFm1esCuZA19sgR_HHh7PVuOfm-OzM8cSf60'
);

async function fix() {
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

  console.log('Found leads:', leads.map(l => ({ id: l.id, company_name: l.company_name, status: l.status })));

  for (const lead of leads) {
    console.log('Updating lead:', lead.id);
    const { error: updateError } = await supabase
      .from('mql_leads')
      .update({ status: 'Highly Qualified MQL', handover_status: null })
      .eq('id', lead.id);

    if (updateError) console.error(updateError);

    // Delete opportunity
    const { data: opps } = await supabase.from('opportunities').select('*').eq('lead_id', lead.id);
    if (opps && opps.length > 0) {
      for (const opp of opps) {
        console.log('Deleting opportunity:', opp.id);
        await supabase.from('opportunities').delete().eq('id', opp.id);
      }
    }
    
    // Check local storage? Local storage is in the browser, so we can't clear it from here. But the backend status is what moves it.
  }
}

fix();
