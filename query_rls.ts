import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();
const supabase = createClient(process.env.VITE_SUPABASE_URL!, process.env.VITE_SUPABASE_ANON_KEY!);

async function main() {
  const { data, error } = await supabase.rpc('get_mql_leads_columns'); // just a dummy
  const { data: policies, error: err } = await supabase.from('mql_leads').select('*').limit(1);
  console.log(policies, err);
}
main();
