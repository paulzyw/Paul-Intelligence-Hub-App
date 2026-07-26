import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();
const supabase = createClient(process.env.VITE_SUPABASE_URL!, process.env.VITE_SUPABASE_ANON_KEY!);

async function main() {
  const lead: any = {
    campaign_id: 'b9c04586-9e02-49a9-9fbf-477354ed2fd5',
    company_name: 'ABC Company',
    first_name: 'John',
    last_name: 'Ni',
    email: 'john.ni2@abc.com',
    lead_industry: 'Refineries',
    job_title: 'VP',
    lead_date: new Date().toISOString(),
    status: 'New'
  };

  const { data, error } = await supabase.from('mql_leads').insert([lead]).select();
  console.log('Error:', error);
  console.log('Data:', data);
}
main();
