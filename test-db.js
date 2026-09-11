const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function check() {
  const { data, error } = await supabase.from('opportunities').select('*').limit(1);
  console.log(data, error);
  const { data: aData, error: aError } = await supabase.from('sql_assessments').select('*').limit(1);
  console.log(aData, aError);
}
check();
