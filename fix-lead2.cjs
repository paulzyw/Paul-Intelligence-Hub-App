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
  console.log(leads.map(l => ({ id: l.id, status: l.status, name: l.first_name + ' ' + l.last_name })));

  for (const lead of leads) {
    console.log('Updating lead:', lead.id);
    const { error: updateError } = await supabase
      .from('mql_leads')
      .update({ status: 'Highly Qualified MQL', handover_status: null })
      .eq('id', lead.id);

    if (updateError) console.error(updateError);
  }
}

fix();
