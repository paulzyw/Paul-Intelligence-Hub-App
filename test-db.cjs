const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);
async function check() {
  const { data, error } = await supabase.from('sql_reasoning_sessions').insert({
    assessment_id: '00000000-0000-0000-0000-000000000000',
    model_name: 'test',
    prompt_version: '1.0',
    execution_status: 'success',
    output_response: { testing: true }
  }).select();
  console.log("sql_reasoning_sessions insert error:", error);
}
check();
