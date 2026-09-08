const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(
  'https://yfonihlpdvelssfmzokp.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inlmb25paGxwZHZlbHNzZm16b2twIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUyNzIwODcsImV4cCI6MjA5MDg0ODA4N30.CMDWSUSfFm1esCuZA19sgR_HHh7PVuOfm-OzM8cSf60'
);

async function run() {
  const { data, error } = await supabase
    .from('opportunities')
    .insert([{
      company_name: 'Test',
      opportunity_name: 'Test Opp',
      industry: 'Enterprise Software',
      revenue_motion: 'Digital Solution Selling',
      description: 'Test',
      source: 'Direct'
    }])
    .select()
    .single();
    
  console.log('Result:', data, error);
}

run();
