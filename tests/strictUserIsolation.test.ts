import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import crypto from 'node:crypto';
import * as esbuild from 'esbuild';

type Row = Record<string, any>;

function createMockSupabaseAndHarness(
  edgeFileRelPath: string,
  options: {
    db?: Record<string, Row[]>;
    authUsers?: Record<string, { id: string; email: string }>;
    geminiText?: string;
  } = {}
) {
  const source = fs.readFileSync(path.resolve(process.cwd(), edgeFileRelPath), 'utf8');
  const transformed = esbuild.transformSync(source, {
    loader: 'ts',
    format: 'cjs',
    target: 'es2022'
  });

  const db: Record<string, Row[]> = {
    pipeline_opportunities: [],
    pipeline_form_records: [],
    pipeline_opportunity_handover_details: [],
    pipeline_inheritance: [],
    pipeline_evidence: [],
    pipeline_evidence_relationships: [],
    pipeline_assessments: [],
    pipeline_padf_results: [],
    pipeline_swot_results: [],
    pipeline_risks: [],
    pipeline_strategies: [],
    pipeline_actions: [],
    pipeline_assessment_snapshots: [],
    pipeline_revenue_intelligence_reports: [],
    profiles: [],
    mql_campaigns: [],
    mql_leads: [],
    mql_evidence_assessments: [],
    mql_qualification_results: [],
    opportunities: [],
    sql_assessments: [],
    sql_evidence_records: [],
    sql_dimension_results: [],
    sql_reasoning_sessions: [],
    sql_recommendations: [],
    opportunity_qualification_sessions: [],
    opportunity_qualification_evidence: [],
    opportunity_qualification_results: [],
    opportunity_qualification_history: [],
    qualification_executive_insights: [],
    ...(options.db || {})
  };

  const geminiCalls: any[] = [];
  let capturedHandler: ((req: Request) => Promise<Response>) | null = null;

  const makeBuilder = (table: string) => {
    const filters: Array<(row: Row) => boolean> = [];
    let action: 'select' | 'insert' | 'update' | 'upsert' | 'delete' = 'select';
    let payload: any = null;
    let conflictKey = 'id';
    let orderCol: string | null = null;
    let orderAsc = true;
    let limitNum: number | null = null;

    if (!db[table]) db[table] = [];

    const run = async (singleMode?: 'single' | 'maybeSingle') => {
      const rows = db[table];
      if (action === 'insert') {
        const list = (Array.isArray(payload) ? payload : [payload]).map((r) => ({
          id: r.id || crypto.randomUUID(),
          ...r
        }));
        rows.push(...list);
        return singleMode
          ? { data: list[0] || null, error: null }
          : { data: list, error: null };
      }
      if (action === 'upsert') {
        const list = Array.isArray(payload) ? payload : [payload];
        const out: Row[] = [];
        for (const item of list) {
          const idx = rows.findIndex(
            (r) => r[conflictKey] !== undefined && r[conflictKey] === item[conflictKey]
          );
          if (idx >= 0) {
            rows[idx] = { ...rows[idx], ...item };
            out.push(rows[idx]);
          } else {
            const created = { id: item.id || crypto.randomUUID(), ...item };
            rows.push(created);
            out.push(created);
          }
        }
        return singleMode
          ? { data: out[0] || null, error: null }
          : { data: out, error: null };
      }
      if (action === 'update') {
        const matched: Row[] = [];
        for (let i = 0; i < rows.length; i++) {
          if (filters.every((f) => f(rows[i]))) {
            rows[i] = { ...rows[i], ...payload };
            matched.push(rows[i]);
          }
        }
        if (singleMode === 'single') {
          return matched[0]
            ? { data: matched[0], error: null }
            : { data: null, error: { message: 'Row not found' } };
        }
        if (singleMode === 'maybeSingle') {
          return { data: matched[0] || null, error: null };
        }
        return { data: matched, error: null };
      }
      if (action === 'delete') {
        db[table] = rows.filter((r) => !filters.every((f) => f(r)));
        return { data: null, error: null };
      }

      let matched = rows.filter((r) => filters.every((f) => f(r)));
      if (table === 'sql_assessments') {
        matched = matched.map((r) => ({
          ...r,
          opportunities:
            db.opportunities.find((o) => o.id === r.opportunity_id) || null
        }));
      }
      if (table === 'opportunity_qualification_sessions') {
        matched = matched.map((r) => ({
          ...r,
          opportunities:
            db.opportunities.find((o) => o.id === r.opportunity_id) || null
        }));
      }
      if (table === 'mql_leads') {
        matched = matched.map((r) => ({
          ...r,
          mql_campaigns:
            db.mql_campaigns.find((c) => c.id === r.campaign_id) || null
        }));
      }
      if (orderCol) {
        matched = [...matched].sort((a, b) =>
          a[orderCol!] === b[orderCol!]
            ? 0
            : (a[orderCol!] < b[orderCol!] ? -1 : 1) * (orderAsc ? 1 : -1)
        );
      }
      if (limitNum !== null) {
        matched = matched.slice(0, limitNum);
      }
      if (singleMode === 'single') {
        return matched[0]
          ? { data: matched[0], error: null }
          : { data: null, error: { message: 'Row not found' } };
      }
      if (singleMode === 'maybeSingle') {
        return { data: matched[0] || null, error: null };
      }
      return { data: matched, error: null };
    };

    const builder: any = {
      select: () => builder,
      insert: (v: any) => {
        action = 'insert';
        payload = v;
        return builder;
      },
      update: (v: any) => {
        action = 'update';
        payload = v;
        return builder;
      },
      upsert: (v: any, opts?: { onConflict?: string }) => {
        action = 'upsert';
        payload = v;
        if (opts?.onConflict) conflictKey = opts.onConflict.split(',')[0].trim();
        return builder;
      },
      delete: () => {
        action = 'delete';
        return builder;
      },
      eq: (col: string, val: any) => {
        filters.push((r) => r[col] === val);
        return builder;
      },
      in: (col: string, vals: any[]) => {
        const s = new Set(vals || []);
        filters.push((r) => s.has(r[col]));
        return builder;
      },
      gte: (col: string, val: any) => {
        filters.push((r) => r[col] >= val);
        return builder;
      },
      lte: (col: string, val: any) => {
        filters.push((r) => r[col] <= val);
        return builder;
      },
      order: (col: string, opts?: { ascending?: boolean }) => {
        orderCol = col;
        orderAsc = opts?.ascending !== false;
        return builder;
      },
      limit: (n: number) => {
        limitNum = n;
        return builder;
      },
      single: () => run('single'),
      maybeSingle: () => run('maybeSingle'),
      then: (res: any, rej: any) => run().then(res, rej)
    };
    return builder;
  };

  const mockSupabase = {
    from: (t: string) => makeBuilder(t),
    auth: {
      getUser: async (token: string) => {
        const u = options.authUsers?.[token];
        if (!u) return { data: { user: null }, error: { message: 'Invalid JWT' } };
        return { data: { user: u }, error: null };
      }
    }
  };

  const envMap: Record<string, string> = {
    SUPABASE_URL: 'https://test-project.supabase.co',
    SUPABASE_ANON_KEY: 'test-anon-key',
    SUPABASE_SERVICE_ROLE_KEY: 'test-service-role-key',
    GEMINI_API_KEY: 'test-gemini-key'
  };

  const customRequire = (id: string) => {
    if (id.includes('std@') || id.includes('/http/server.ts')) {
      return {
        serve: (handler: (req: Request) => Promise<Response>) => {
          capturedHandler = handler;
        }
      };
    }
    if (id.includes('@supabase/supabase-js')) {
      return { createClient: () => mockSupabase };
    }
    if (id.includes('@google/genai')) {
      return {
        Type: {
          OBJECT: 'OBJECT',
          STRING: 'STRING',
          NUMBER: 'NUMBER',
          INTEGER: 'INTEGER',
          BOOLEAN: 'BOOLEAN',
          ARRAY: 'ARRAY'
        },
        GoogleGenAI: class {
          models = {
            generateContent: async (params: any) => {
              geminiCalls.push(params);
              return { text: options.geminiText || '{}' };
            }
          };
        }
      };
    }
    throw new Error(`Unexpected module in Edge harness: ${id}`);
  };

  const sandbox: any = {
    module: { exports: {} },
    exports: {},
    require: customRequire,
    Deno: {
      env: { get: (k: string) => envMap[k] || '' }
    },
    Request,
    Response,
    Headers,
    URL,
    AbortController,
    crypto: crypto.webcrypto || globalThis.crypto,
    TextEncoder,
    setTimeout,
    clearTimeout,
    console: { log: () => {}, warn: () => {}, error: () => {} }
  };

  vm.runInNewContext(transformed.code, sandbox, { filename: edgeFileRelPath });

  return {
    db,
    geminiCalls,
    invoke: async (body: Record<string, any>, headers?: Record<string, string>) => {
      assert.ok(capturedHandler, `Edge handler not registered for ${edgeFileRelPath}`);
      const req = new Request('https://edge.local/fn', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(headers || {}) },
        body: JSON.stringify(body)
      });
      const res = await capturedHandler!(req);
      const json = await res.json().catch(() => ({}));
      return { status: res.status, json };
    }
  };
}

// ============================================================================
// 1. PIPELINE ASSESSMENT: STRICT ISOLATION + ZERO SUPER_ADMIN BYPASS
// ============================================================================

test('Pipeline Assessment rejects super_admin and cross-user access across all opportunity actions', async () => {
  const pipeId = 'PIPE_USER_A';
  const assessId = 'ASSESS_USER_A';
  const harness = createMockSupabaseAndHarness('supabase/functions/pipeline-assessment/index.ts', {
    authUsers: {
      'userA.jwt.token': { id: 'uuid-paul-hotmail', email: 'paul.zy.wang@hotmail.com' },
      'superAdminB.jwt.token': { id: 'uuid-paul-qq', email: 'paulzyw@qq.com' }
    },
    db: {
      profiles: [
        { id: 'uuid-paul-qq', email: 'paulzyw@qq.com', role: 'super_admin' },
        { id: 'uuid-paul-qq-alt', email: 'admin@revos.io', role: 'Super Admin' }
      ],
      pipeline_opportunities: [
        {
          pipeline_id: pipeId,
          created_by: 'uuid-paul-hotmail',
          owner_email: 'paul.zy.wang@hotmail.com',
          customer_name: 'Acme Holdings',
          opportunity_name: 'Acme Enterprise Expansion',
          industry_id: 'IND_SaaS_Software',
          revenue_motion_id: 'RM01_Digital_Solution_Selling',
          deal_value: 250000,
          source: 'Created'
        }
      ],
      pipeline_assessments: [
        {
          assessment_id: assessId,
          pipeline_id: pipeId,
          assessment_sequence: 1,
          base_winability: 78,
          risk_adjusted_winability: 74
        }
      ]
    }
  });

  const actionsToTest: Array<Record<string, any>> = [
    { action: 'get-assessment-context', pipeline_id: pipeId },
    { action: 'query-evidence-questions', pipeline_id: pipeId },
    { action: 'submit-pipeline-evidence', pipeline_id: pipeId, evidence_records: [] },
    { action: 'validate-evidence', pipeline_id: pipeId },
    { action: 'run-pipeline-assessment', pipeline_id: pipeId },
    { action: 'retrieve-assessment', pipeline_id: pipeId },
    { action: 'retrieve-assessment', assessment_id: assessId },
    { action: 'save-assessment-result', pipeline_id: pipeId, assessment_id: assessId, executive_summary: { summary: 'tamper' } },
    { action: 'create-assessment-snapshot', pipeline_id: pipeId, assessment_id: assessId },
    { action: 'get-initial-opportunity-context-summary', pipeline_id: pipeId },
    { action: 'generate-initial-opportunity-context-summary', pipeline_id: pipeId }
  ];

  for (const payload of actionsToTest) {
    const crossRes = await harness.invoke(payload, { authorization: 'Bearer superAdminB.jwt.token' });
    assert.equal(
      crossRes.status,
      403,
      `Expected super_admin User B to receive 403 for ${payload.action}, got ${crossRes.status}`
    );

    const anonRes = await harness.invoke(payload, { authorization: 'Bearer test-anon-key' });
    assert.equal(
      anonRes.status,
      401,
      `Expected anon request to receive 401 for ${payload.action}, got ${anonRes.status}`
    );
  }

  // Verify User A (owner) can still retrieve & access their own records
  const ownerCtx = await harness.invoke(
    { action: 'get-assessment-context', pipeline_id: pipeId },
    { authorization: 'Bearer userA.jwt.token' }
  );
  assert.equal(ownerCtx.status, 200);
  const ownerRet = await harness.invoke(
    { action: 'retrieve-assessment', assessment_id: assessId },
    { authorization: 'Bearer userA.jwt.token' }
  );
  assert.equal(ownerRet.status, 200);
  assert.equal(harness.geminiCalls.length, 0);
});

test('Pipeline Assessment isolates Revenue Intelligence reports by verified JWT user.id and rejects workspace_default spoofing', async () => {
  const harness = createMockSupabaseAndHarness('supabase/functions/pipeline-assessment/index.ts', {
    authUsers: {
      'userA.jwt.token': { id: 'uuid-user-a', email: 'paul.zy.wang@hotmail.com' },
      'userB.jwt.token': { id: 'uuid-user-b', email: 'paulzyw@qq.com' }
    },
    db: {
      pipeline_revenue_intelligence_reports: [
        {
          report_id: 'REV_USER_A',
          scope_hash: 'scope-1',
          user_id: 'uuid-user-a',
          scope_label: 'User A Portfolio',
          is_saved: true,
          generated_at: '2026-11-25T00:00:00Z',
          report_payload: { analysis_status: 'ready', executive_summary: { headline: 'Private A' } }
        }
      ]
    }
  });

  // Unauthenticated blocked
  const unauthGet = await harness.invoke({ action: 'get-saved-revenue-intelligence', user_id: 'workspace_default' });
  assert.equal(unauthGet.status, 401);

  // User B spoofing workspace_default or User A's user_id blocked with 403
  const spoofDefault = await harness.invoke(
    { action: 'get-saved-revenue-intelligence', user_id: 'workspace_default' },
    { authorization: 'Bearer userB.jwt.token' }
  );
  assert.equal(spoofDefault.status, 403);

  const spoofUserA = await harness.invoke(
    { action: 'save-revenue-intelligence', user_id: 'uuid-user-a', scope_hash: 'scope-1', report_payload: { analysis_status: 'ready' } },
    { authorization: 'Bearer userB.jwt.token' }
  );
  assert.equal(spoofUserA.status, 403);

  const spoofGen = await harness.invoke(
    {
      action: 'generate-revenue-intelligence',
      user_id: 'uuid-user-a',
      scope_hash: 'scope-1',
      portfolio_context: { portfolio_context: { included_opportunity_count: 1, assessed_opportunity_count: 1 } }
    },
    { authorization: 'Bearer userB.jwt.token' }
  );
  assert.equal(spoofGen.status, 403);

  // User B querying with own JWT gets empty saved list (never sees User A's report)
  const userBGet = await harness.invoke(
    { action: 'get-saved-revenue-intelligence', scope_hash: 'scope-1' },
    { authorization: 'Bearer userB.jwt.token' }
  );
  assert.equal(userBGet.status, 200);
  assert.equal(userBGet.json.exact_match, null);
  assert.equal(userBGet.json.latest_saved, null);

  // User A gets their own saved report
  const userAGet = await harness.invoke(
    { action: 'get-saved-revenue-intelligence', scope_hash: 'scope-1' },
    { authorization: 'Bearer userA.jwt.token' }
  );
  assert.equal(userAGet.status, 200);
  assert.equal(userAGet.json.exact_match.report_id, 'REV_USER_A');
});

// ============================================================================
// 2. LEAD QUALIFICATION: JWT AUTHENTICATION & CROSS-USER OWNERSHIP CHECKS
// ============================================================================

test('Lead Qualification requires authentication and blocks cross-user MQL/SQL/OQ access', async () => {
  const oppId = 'opp-user-a';
  const assessId = 'sql-assess-user-a';
  const sessionId = 'oq-session-user-a';
  const leadId = 'lead-user-a';

  const harness = createMockSupabaseAndHarness('supabase/functions/lead-qualification/index.ts', {
    authUsers: {
      'userA.jwt.token': { id: 'uuid-user-a', email: 'paul.zy.wang@hotmail.com' },
      'userB.jwt.token': { id: 'uuid-user-b', email: 'paulzyw@qq.com' }
    },
    db: {
      mql_campaigns: [{ id: 'camp-a', name: 'Campaign A', created_by: 'uuid-user-a' }],
      mql_leads: [{ id: leadId, campaign_id: 'camp-a', created_by: 'uuid-user-a', first_name: 'Jane', last_name: 'Doe' }],
      opportunities: [{ id: oppId, created_by: 'uuid-user-a', company_name: 'Acme', opportunity_name: 'Acme Deal' }],
      sql_assessments: [{ id: assessId, opportunity_id: oppId }],
      opportunity_qualification_sessions: [{ id: sessionId, opportunity_id: oppId }]
    },
    geminiText: JSON.stringify({
      executive_summary: 'Summary',
      key_findings: [],
      qualification_risks: [],
      recommended_actions: [],
      limitations: []
    })
  });

  // Unauthenticated calls rejected with 401
  const unauthCreateSql = await harness.invoke({ action: 'create-sql-assessment', opportunity_id: oppId });
  assert.equal(unauthCreateSql.status, 401);

  const unauthMqlEval = await harness.invoke({ leadId });
  assert.equal(unauthMqlEval.status, 401);

  // User B cross-user actions rejected with 403
  const crossActions: Array<Record<string, any>> = [
    { action: 'create-sql-assessment', opportunity_id: oppId },
    { action: 'submit-sql-evidence', assessment_id: assessId, evidence: [] },
    { action: 'execute-sql-reasoning', assessment_id: assessId },
    { action: 'retrieve-sql-assessment-result', assessment_id: assessId },
    { action: 'create-opportunity-session', opportunity_id: oppId },
    { action: 'submit-opportunity-evidence', session_id: sessionId, evidence: [] },
    { action: 'generate-opportunity-suggested-answers', opportunity_id: oppId, evidence_questions: [] },
    { action: 'execute-opportunity-reasoning', session_id: sessionId },
    { action: 'retrieve-opportunity-qualification-result', session_id: sessionId },
    { action: 'promote-sql-to-opportunity', opportunity_id: oppId, session_id: sessionId },
    { action: 'generate-sales-handover', lead: { id: leadId } },
    { action: 'generate-sql-suggested-answers', opportunity_id: oppId, evidence_questions: [] },
    { leadId }
  ];

  for (const payload of crossActions) {
    const res = await harness.invoke(payload, { authorization: 'Bearer userB.jwt.token' });
    assert.equal(
      res.status,
      403,
      `Expected User B to get 403 on ${payload.action || 'mql-eval'}, got ${res.status}`
    );
  }
  assert.equal(harness.geminiCalls.length, 0);

  // User A can access own SQL assessment and stamp executive insight ownership
  const ownerSql = await harness.invoke(
    { action: 'retrieve-sql-assessment-result', assessment_id: assessId },
    { authorization: 'Bearer userA.jwt.token' }
  );
  assert.equal(ownerSql.status, 200);

  const ownerInsights = await harness.invoke(
    {
      action: 'generate-qualification-intelligence',
      analysis_scope: { campaign_id: 'all', campaign_name: 'All Campaigns' },
      analysis_metrics: { total_leads: 1, total_assessed: 1 }
    },
    { authorization: 'Bearer userA.jwt.token' }
  );
  assert.equal(ownerInsights.status, 200);
  assert.equal(harness.db.qualification_executive_insights[0]?.created_by, 'uuid-user-a');
});

// ============================================================================
// 3. GTMOS API: REJECTS UNAUTHENTICATED / ANON / INVALID JWT
// ============================================================================

test('GTMOS Edge Function rejects missing, anon, and invalid JWT tokens with 401', async () => {
  const harness = createMockSupabaseAndHarness('supabase/functions/gtmos-api/index.ts', {
    authUsers: {
      'userA.jwt.token': { id: 'uuid-user-a', email: 'paul.zy.wang@hotmail.com' }
    },
    geminiText: JSON.stringify({ enrichedFields: { companyName: 'Acme' } })
  });

  const noAuth = await harness.invoke({ action: 'enrich', currentFields: { companyName: 'Acme' } });
  assert.equal(noAuth.status, 401);

  const anonAuth = await harness.invoke(
    { action: 'enrich', currentFields: { companyName: 'Acme' } },
    { authorization: 'Bearer test-anon-key' }
  );
  assert.equal(anonAuth.status, 401);

  const badJwt = await harness.invoke(
    { action: 'enrich', currentFields: { companyName: 'Acme' } },
    { authorization: 'Bearer fake.jwt.token' }
  );
  assert.equal(badJwt.status, 401);
  assert.equal(harness.geminiCalls.length, 0);

  const validJwt = await harness.invoke(
    { action: 'enrich', currentFields: { companyName: 'Acme' } },
    { authorization: 'Bearer userA.jwt.token' }
  );
  assert.equal(validJwt.status, 200);
  assert.equal(harness.geminiCalls.length, 1);
});

// ============================================================================
// 4. CLIENT STORAGE ISOLATION HELPER: SCRUBS CACHE ON ACCOUNT SWITCH
// ============================================================================

test('userIsolation helper scopes localStorage keys by user UUID and scrubs cross-account caches on user switch', async () => {
  const store = new Map<string, string>();
  const listeners = new Map<string, Array<(e: any) => void>>();

  const mockWindow: any = {
    localStorage: {
      get length() {
        return store.size;
      },
      key: (idx: number) => Array.from(store.keys())[idx] ?? null,
      getItem: (k: string) => store.get(k) ?? null,
      setItem: (k: string, v: string) => {
        store.set(k, String(v));
      },
      removeItem: (k: string) => {
        store.delete(k);
      }
    },
    addEventListener: (type: string, fn: (e: any) => void) => {
      const arr = listeners.get(type) || [];
      arr.push(fn);
      listeners.set(type, arr);
    },
    removeEventListener: (type: string, fn: (e: any) => void) => {
      listeners.set(type, (listeners.get(type) || []).filter((x) => x !== fn));
    },
    dispatchEvent: (ev: any) => {
      for (const fn of listeners.get(ev.type) || []) fn(ev);
      return true;
    }
  };

  (globalThis as any).window = mockWindow;
  (globalThis as any).CustomEvent = class {
    type: string;
    detail: any;
    constructor(type: string, init?: { detail?: any }) {
      this.type = type;
      this.detail = init?.detail;
    }
  };

  const {
    setActiveRevOSUserId,
    scopedStorageKey,
    getScopedStorageItem,
    setScopedStorageItem
  } = await import('../src/apps/revos/utils/userIsolation');

  // Login as User A
  setActiveRevOSUserId('uuid-paul-hotmail');
  assert.equal(scopedStorageKey('mql_deleted_lead_ids'), 'revos_u_uuid-paul-hotmail__mql_deleted_lead_ids');
  setScopedStorageItem('mql_deleted_lead_ids', '["lead-1"]');
  mockWindow.localStorage.setItem('revos_latest_created_draft_id', 'PIPE_PRIVATE_A');
  assert.equal(getScopedStorageItem('mql_deleted_lead_ids'), '["lead-1"]');

  // Switch to User B -> User A keys and legacy draft keys scrubbed cleanly
  setActiveRevOSUserId('uuid-paul-qq');
  assert.equal(mockWindow.localStorage.getItem('revos_latest_created_draft_id'), null);
  assert.equal(mockWindow.localStorage.getItem('revos_u_uuid-paul-hotmail__mql_deleted_lead_ids'), null);
  assert.equal(getScopedStorageItem('mql_deleted_lead_ids'), null);
  assert.equal(scopedStorageKey('mql_deleted_lead_ids'), 'revos_u_uuid-paul-qq__mql_deleted_lead_ids');

  delete (globalThis as any).window;
});
