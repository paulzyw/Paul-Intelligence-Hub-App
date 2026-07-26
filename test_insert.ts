import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();
const supabase = createClient(process.env.VITE_SUPABASE_URL!, process.env.VITE_SUPABASE_ANON_KEY!);

async function main() {
  const { data, error } = await supabase.from('mql_leads').insert([
    {
      campaign_id: 'b9c04586-9e02-49a9-9fbf-477354ed2fd5',
      org_id: '',
      company_name: 'Test',
      first_name: 'Test',
      last_name: 'Test',
      email: 'test@test.com',
      status: 'New'
    }
  ]);
  console.log('Error:', error);
}
main();
