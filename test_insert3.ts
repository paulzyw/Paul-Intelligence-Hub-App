import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();
const supabase = createClient(process.env.VITE_SUPABASE_URL!, process.env.VITE_SUPABASE_ANON_KEY!);

async function main() {
  // try inserting via REST with prefer: return=minimal
  // using fetch to see actual postgres error
  const url = `${process.env.VITE_SUPABASE_URL}/rest/v1/mql_leads`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'apikey': process.env.VITE_SUPABASE_ANON_KEY!,
      'Authorization': `Bearer ${process.env.VITE_SUPABASE_ANON_KEY!}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation'
    },
    body: JSON.stringify({
      campaign_id: 'b9c04586-9e02-49a9-9fbf-477354ed2fd5',
      company_name: 'Test',
      first_name: 'Test',
      last_name: 'Test',
      email: 'test@test.com',
      status: 'New'
    })
  });
  console.log(res.status, await res.text());
}
main();
