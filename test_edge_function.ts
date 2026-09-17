import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.VITE_SUPABASE_ANON_KEY!
);

async function run() {
  const { data: opps } = await supabase.from('opportunities').select('id').limit(1);
  if (!opps || opps.length === 0) {
    console.log("No opportunities found to test!");
    return;
  }
  const oppId = opps[0].id;
  console.log(`Testing with opportunity_id: ${oppId}`);

  try {
    const { data, error } = await supabase.functions.invoke('lead-qualification', {
      body: {
        action: 'create-opportunity-session',
        opportunity_id: oppId,
        sql_inheritance_data: {},
        revenue_motion: 'Digital Solution Selling',
        industry: 'Enterprise Software'
      }
    });

    if (error) {
      console.error("Invoke error:", error);
    } else {
      console.log("Invoke success! Data:", data);
    }
  } catch (err: any) {
    console.error("Caught error invoking:", err);
  }
}

run();
