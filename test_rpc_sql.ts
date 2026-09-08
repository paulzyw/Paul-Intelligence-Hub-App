import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.VITE_SUPABASE_ANON_KEY!
);

async function test() {
  const rpcs = ['exec_sql', 'execute_sql', 'run_sql', 'sql'];
  for (const rpc of rpcs) {
    try {
      const { data, error } = await supabase.rpc(rpc, { sql: 'SELECT 1;' });
      console.log(`RPC ${rpc} (arg: sql):`, error ? `Error: ${error.message}` : `Success! Result: ${JSON.stringify(data)}`);
    } catch (e: any) {
      console.log(`RPC ${rpc} throw:`, e.message);
    }

    try {
      const { data, error } = await supabase.rpc(rpc, { query: 'SELECT 1;' });
      console.log(`RPC ${rpc} (arg: query):`, error ? `Error: ${error.message}` : `Success! Result: ${JSON.stringify(data)}`);
    } catch (e: any) {
      console.log(`RPC ${rpc} throw:`, e.message);
    }
  }
}

test();
