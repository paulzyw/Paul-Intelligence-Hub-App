const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(
  'https://yfonihlpdvelssfmzokp.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inlmb25paGxwZHZlbHNzZm16b2twIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUyNzIwODcsImV4cCI6MjA5MDg0ODA4N30.CMDWSUSfFm1esCuZA19sgR_HHh7PVuOfm-OzM8cSf60'
);

async function run() {
  const { data, error } = await supabase.from('opportunities').delete().eq('opportunity_name', null);
  const { data: data2, error: error2 } = await supabase.from('opportunities').delete().eq('company_name', 'Test');
  console.log('Cleaned up bad records');
}

run();
