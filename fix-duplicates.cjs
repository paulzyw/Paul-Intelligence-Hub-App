const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(
  'https://yfonihlpdvelssfmzokp.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inlmb25paGxwZHZlbHNzZm16b2twIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUyNzIwODcsImV4cCI6MjA5MDg0ODA4N30.CMDWSUSfFm1esCuZA19sgR_HHh7PVuOfm-OzM8cSf60'
);

async function run() {
  // Find all opportunities with an mql_reference_id
  const { data, error } = await supabase.from('opportunities').select('id, mql_reference_id, created_at, description').not('mql_reference_id', 'is', null);
  
  if (error) {
    console.error(error);
    return;
  }
  
  // Group by mql_reference_id
  const grouped = {};
  for (const opp of data) {
    if (!grouped[opp.mql_reference_id]) {
      grouped[opp.mql_reference_id] = [];
    }
    grouped[opp.mql_reference_id].push(opp);
  }
  
  // For each group, keep the most recent one (or one with the longest description)
  for (const mqlId in grouped) {
    const opps = grouped[mqlId];
    if (opps.length > 1) {
      console.log(`Found ${opps.length} duplicates for MQL ${mqlId}`);
      // Sort by created_at desc (newest first)
      opps.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      
      const toKeep = opps[0];
      const toDelete = opps.slice(1).map(o => o.id);
      
      console.log(`Keeping ${toKeep.id}, deleting ${toDelete.join(', ')}`);
      await supabase.from('opportunities').delete().in('id', toDelete);
    }
  }
  console.log('Cleanup complete.');
}

run();
