import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();
const supabase = createClient(process.env.VITE_SUPABASE_URL!, process.env.VITE_SUPABASE_ANON_KEY!);

async function main() {
  const { data, error } = await supabase.rpc('get_mql_leads_columns'); // If that doesn't exist, we just select limit 1
  if (error) {
    const { data: d2, error: e2 } = await supabase.from('mql_leads').select('*').limit(1);
    console.log(d2, e2);
  }
}
main();
