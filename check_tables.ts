import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.VITE_SUPABASE_ANON_KEY!
);

async function check() {
  const tables = ['organizations', 'users', 'opportunities', 'sql_assessments', 'sql_evidence_records', 'sql_dimension_results', 'sql_reasoning_sessions', 'sql_recommendations', 'knowledge_asset_versions', 'audit_logs'];
  for (const table of tables) {
    const { data, error } = await supabase.from(table).select('*').limit(1);
    console.log(`Table ${table}:`, error ? `Error: ${error.message}` : 'Exists!');
  }
}

check();
