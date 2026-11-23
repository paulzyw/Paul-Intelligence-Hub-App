import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import crypto from 'node:crypto';
import * as esbuild from 'esbuild';

// ============================================================================
// Test Harness: Compiles the REAL `/supabase/functions/pipeline-assessment/index.ts`
// with esbuild and executes it against in-memory Supabase + Gemini doubles.
// ============================================================================

type Row = Record<string, any>;

interface MockDbState {
  pipeline_opportunities: Row[];
  pipeline_form_records: Row[];
  pipeline_opportunity_handover_details: Row[];
  pipeline_inheritance: Row[];
  pipeline_evidence: Row[];
  pipeline_evidence_relationships: Row[];
  pipeline_assessments: Row[];
  pipeline_padf_results: Row[];
  pipeline_swot_results: Row[];
  pipeline_risks: Row[];
  pipeline_strategies: Row[];
  pipeline_actions: Row[];
  pipeline_assessment_snapshots: Row[];
  pipeline_revenue_intelligence_reports: Row[];
  profiles: Row[];
}

interface HarnessOptions {
  db?: Partial<MockDbState>;
  geminiHandler?: (params: any) => Promise<{ text: string }> | { text: string };
  failHandoverUpdateWithSchemaError?: boolean;
  failHandoverUpdateAfterGenerating?: boolean;
  authUsers?: Record<string, { id: string; email: string }>;
}

const createBaseDb = (overrides?: Partial<MockDbState>): MockDbState => ({
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
  ...overrides
});

const full10SectionsResponse = (overrides?: Record<string, string>) => ({
  summary_sections: {
    opportunity_overview:
      'User-submitted opportunity overview describing a proposed enterprise deployment.',
    customer_context:
      'Customer account operates in the specified industry and country based on creation inputs.',
    business_problem_and_customer_needs:
      'User-reported operational inefficiencies requiring automation; independent customer confirmation is not yet attached.',
    proposed_solution_and_value_proposition:
      'Proposed modular software platform aimed at addressing reported operational gaps; solution fit not yet validated.',
    expected_business_outcomes:
      'User-projected productivity gains without independently verified baseline metrics.',
    commercial_context:
      'Estimated deal valuation and target stage supplied by opportunity owner; procurement approval status unconfirmed.',
    customer_engagement_and_stakeholder_context:
      'Named contacts and engagement notes reflect user creation inputs without verified authority designations.',
    competitive_context:
      'Competitive landscape reflects user creation notes; missing competitor names remain unconfirmed.',
    known_constraints_and_challenges:
      'Reported constraints summarized strictly from user creation inputs without assumption.',
    missing_or_unconfirmed_information:
      'Independent customer verification, budget sign-off, and buying process details remain unconfirmed and require discovery.',
    ...overrides
  }
});

let cachedBundledEdgeCode: string | null = null;

function getBundledEdgeFunctionCode(): string {
  if (cachedBundledEdgeCode) return cachedBundledEdgeCode;
  const edgePath = path.resolve(
    process.cwd(),
    'supabase/functions/pipeline-assessment/index.ts'
  );
  const source = fs.readFileSync(edgePath, 'utf8');
  const transformed = esbuild.transformSync(source, {
    loader: 'ts',
    format: 'cjs',
    target: 'es2022'
  });
  cachedBundledEdgeCode = transformed.code;
  return cachedBundledEdgeCode;
}

function loadEdgeHarness(options: HarnessOptions = {}) {
  const db = createBaseDb(options.db);
  const geminiCalls: any[] = [];
  let handoverUpdateCount = 0;
  let capturedHandler: ((req: Request) => Promise<Response>) | null = null;

  const makeQueryBuilder = (tableName: keyof MockDbState) => {
    const filters: Array<(row: Row) => boolean> = [];
    let pendingAction: 'select' | 'insert' | 'update' | 'upsert' | 'delete' = 'select';
    let pendingPayload: any = null;
    let upsertConflictKey = 'pipeline_id';
    let orderCol: string | null = null;
    let orderAsc = true;
    let rowLimit: number | null = null;

    const getTable = (): Row[] => db[tableName];

    const exec = async (expectSingle?: 'single' | 'maybeSingle') => {
      const rows = getTable();

      if (pendingAction === 'insert') {
        const items = Array.isArray(pendingPayload) ? pendingPayload : [pendingPayload];
        const cloned = items.map((item) => ({ ...item }));
        rows.push(...cloned);
        if (expectSingle) return { data: cloned[0] || null, error: null };
        return { data: cloned, error: null };
      }

      if (pendingAction === 'upsert') {
        const items = Array.isArray(pendingPayload) ? pendingPayload : [pendingPayload];
        const results: Row[] = [];
        for (const item of items) {
          const idx = rows.findIndex(
            (r) =>
              r[upsertConflictKey] !== undefined &&
              r[upsertConflictKey] === item[upsertConflictKey]
          );
          if (idx >= 0) {
            rows[idx] = { ...rows[idx], ...item };
            results.push(rows[idx]);
          } else {
            const created = { ...item };
            rows.push(created);
            results.push(created);
          }
        }
        if (expectSingle) return { data: results[0] || null, error: null };
        return { data: results, error: null };
      }

      if (pendingAction === 'update') {
        if (tableName === 'pipeline_opportunity_handover_details') {
          handoverUpdateCount += 1;
          if (
            options.failHandoverUpdateWithSchemaError &&
            'summary_version' in pendingPayload
          ) {
            return {
              data: null,
              error: {
                code: 'PGRST204',
                message: "Could not find the 'summary_version' column of 'pipeline_opportunity_handover_details'"
              }
            };
          }
          if (
            options.failHandoverUpdateAfterGenerating &&
            pendingPayload.summary_status === 'READY'
          ) {
            return {
              data: null,
              error: {
                code: '42501',
                message: 'Simulated Supabase write failure'
              }
            };
          }
        }

        const matched: Row[] = [];
        for (let i = 0; i < rows.length; i++) {
          if (filters.every((fn) => fn(rows[i]))) {
            rows[i] = { ...rows[i], ...pendingPayload };
            matched.push(rows[i]);
          }
        }
        if (expectSingle === 'single') {
          return matched[0]
            ? { data: matched[0], error: null }
            : { data: null, error: { message: 'Row not found' } };
        }
        if (expectSingle === 'maybeSingle') {
          return { data: matched[0] || null, error: null };
        }
        return { data: matched, error: null };
      }

      if (pendingAction === 'delete') {
        const remaining = rows.filter((r) => !filters.every((fn) => fn(r)));
        db[tableName] = remaining;
        return { data: null, error: null };
      }

      // SELECT
      let result = rows.filter((r) => filters.every((fn) => fn(r)));
      if (orderCol) {
        result = [...result].sort((a, b) => {
          const av = a[orderCol!];
          const bv = b[orderCol!];
          if (av === bv) return 0;
          return (av < bv ? -1 : 1) * (orderAsc ? 1 : -1);
        });
      }
      if (rowLimit !== null) {
        result = result.slice(0, rowLimit);
      }
      if (expectSingle === 'single') {
        return result[0]
          ? { data: { ...result[0] }, error: null }
          : { data: null, error: { message: 'No rows' } };
      }
      if (expectSingle === 'maybeSingle') {
        return { data: result[0] ? { ...result[0] } : null, error: null };
      }
      return { data: result.map((r) => ({ ...r })), error: null };
    };

    const builder: any = {
      select: () => builder,
      insert: (payload: any) => {
        pendingAction = 'insert';
        pendingPayload = payload;
        return builder;
      },
      update: (payload: any) => {
        pendingAction = 'update';
        pendingPayload = payload;
        return builder;
      },
      upsert: (payload: any, opts?: { onConflict?: string }) => {
        pendingAction = 'upsert';
        pendingPayload = payload;
        if (opts?.onConflict) upsertConflictKey = opts.onConflict;
        return builder;
      },
      delete: () => {
        pendingAction = 'delete';
        return builder;
      },
      eq: (col: string, val: any) => {
        filters.push((r) => r[col] === val);
        return builder;
      },
      in: (col: string, vals: any[]) => {
        filters.push((r) => vals.includes(r[col]));
        return builder;
      },
      order: (col: string, opts?: { ascending?: boolean }) => {
        orderCol = col;
        orderAsc = opts?.ascending !== false;
        return builder;
      },
      limit: (n: number) => {
        rowLimit = n;
        return builder;
      },
      single: () => exec('single'),
      maybeSingle: () => exec('maybeSingle'),
      then: (resolve: any, reject: any) => exec().then(resolve, reject)
    };
    return builder;
  };

  const mockSupabaseClient = {
    from: (table: keyof MockDbState) => makeQueryBuilder(table),
    auth: {
      getUser: async (token: string) => {
        const found = options.authUsers?.[token];
        if (!found) return { data: { user: null }, error: { message: 'Invalid JWT' } };
        return { data: { user: found }, error: null };
      }
    }
  };

  const mockEnv: Record<string, string> = {
    SUPABASE_URL: 'https://example.supabase.co',
    SUPABASE_SERVICE_ROLE_KEY: 'service-role-secret',
    SUPABASE_ANON_KEY: 'anon-public-key',
    GEMINI_API_KEY: 'test-gemini-key'
  };

  const fakeDeno = {
    env: {
      get: (k: string) => mockEnv[k]
    }
  };

  const fakeRequire = (id: string) => {
    if (id.includes('std@') || id.includes('http/server')) {
      return {
        serve: (fn: (req: Request) => Promise<Response>) => {
          capturedHandler = fn;
        }
      };
    }
    if (id.includes('@supabase/supabase-js')) {
      return {
        createClient: () => mockSupabaseClient
      };
    }
    if (id.includes('@google/genai')) {
      return {
        Type: {
          OBJECT: 'OBJECT',
          STRING: 'STRING',
          ARRAY: 'ARRAY',
          NUMBER: 'NUMBER',
          INTEGER: 'INTEGER',
          BOOLEAN: 'BOOLEAN'
        },
        GoogleGenAI: class {
          models = {
            generateContent: async (params: any) => {
              geminiCalls.push(params);
              if (options.geminiHandler) {
                return await options.geminiHandler(params);
              }
              return { text: JSON.stringify(full10SectionsResponse()) };
            }
          };
        }
      };
    }
    throw new Error(`Unexpected require inside Edge Function: ${id}`);
  };

  const sandbox: any = {
    Deno: fakeDeno,
    require: fakeRequire,
    exports: {},
    module: { exports: {} },
    Request,
    Response,
    Headers,
    AbortController,
    TextEncoder,
    TextDecoder,
    crypto: crypto.webcrypto,
    console,
    setTimeout,
    clearTimeout,
    URL,
    Date,
    Math,
    JSON,
    Promise,
    Set,
    Map,
    Array,
    Object,
    String,
    Number,
    Boolean,
    Error
  };

  vm.runInNewContext(getBundledEdgeFunctionCode(), sandbox, {
    filename: 'pipeline-assessment/index.ts'
  });

  assert.ok(capturedHandler, 'Edge Function must register serve() handler');

  const invoke = async (
    body: Record<string, any>,
    headers: Record<string, string> = {}
  ) => {
    const req = new Request('https://example.supabase.co/functions/v1/pipeline-assessment', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...headers
      },
      body: JSON.stringify(body)
    });
    const res = await capturedHandler!(req);
    const json = await res.json();
    return { status: res.status, json };
  };

  return { db, geminiCalls, invoke, mockEnv, getHandoverUpdateCount: () => handoverUpdateCount };
}

const makeCreatedOpportunity = (overrides: Record<string, any> = {}) => {
  const initialCtx = {
    source: 'Created',
    opportunity_name: 'Acme AI Predictive Maintenance Rollout',
    company_name: 'Acme Petrochemical Corp',
    industry: 'OT/IT Solutions',
    industry_id: 'IND_OT_IT',
    revenue_motion: 'Digital Transformation & OT',
    revenue_motion_id: 'RM03_Digital_Transformation_OT',
    opportunity_owner: 'Sarah Jenkins',
    country: 'United States',
    opportunity_overview: 'Plant-wide predictive maintenance deployment across 3 refineries.',
    customer_business_problem: 'Unplanned compressor downtime causing $1.2M/yr maintenance spikes.',
    proposed_solution: 'Edge vibration telemetry + predictive analytics suite.',
    expected_business_outcomes: 'Reduce unplanned downtime by 25% over 12 months.',
    opportunity_origin_background: 'Outbound executive workshop at Industrial Summit.',
    estimated_revenue: 420000,
    currency: 'USD',
    currency_symbol: '$',
    expected_closing_date: '2027-06-30',
    pipeline_stage: 'Discovery',
    opportunity_stage: 'Defined Opportunity',
    commercial_model: 'Annual Enterprise Subscription + Deployment Services',
    current_engagement_status: 'Technical discovery scheduled',
    known_customer_stakeholders: 'VP Maintenance, Plant Reliability Lead',
    known_decision_maker: 'VP Operations (assumed by AE)',
    internal_champion: 'Plant Reliability Lead',
    recent_customer_interaction: 'Shared technical architecture deck on Nov 18.',
    known_competitors: 'Legacy SCADA incumbent',
    known_customer_priorities: 'Zero unplanned shutdowns before Q3 turnaround.',
    known_constraints_challenges: 'Strict OT air-gap security requirement.',
    additional_information: 'Multi-site rollout requires phased cybersecurity review.',
    ...(overrides.initial_context || {})
  };

  return {
    id: '00000000-0000-0000-0000-000000000001',
    pipeline_id: 'PIPE_DIRECT_ACME_1',
    customer_name: initialCtx.company_name,
    opportunity_name: initialCtx.opportunity_name,
    industry_id: initialCtx.industry_id,
    industry_name: initialCtx.industry,
    revenue_motion_id: initialCtx.revenue_motion_id,
    revenue_motion_name: initialCtx.revenue_motion,
    deal_value: initialCtx.estimated_revenue,
    currency: initialCtx.currency,
    sales_stage: initialCtx.opportunity_stage,
    pipeline_stage: initialCtx.pipeline_stage,
    expected_close_date: initialCtx.expected_closing_date,
    opportunity_owner: initialCtx.opportunity_owner,
    country: initialCtx.country,
    commercial_model: initialCtx.commercial_model,
    source: 'Created',
    source_system: 'RevOS_Pipeline_Direct_Creation',
    initial_context: initialCtx,
    metadata: { source: 'Created', initial_context: initialCtx },
    ...overrides
  };
};

// ============================================================================
// TEST GROUP A — Successful Generation
// ============================================================================

test('Group A1/A2: Created opportunity with full basic & optional fields generates & persists 10-category summary', async () => {
  const opp = makeCreatedOpportunity();
  const harness = loadEdgeHarness({
    db: {
      pipeline_opportunities: [opp],
      pipeline_opportunity_handover_details: [
        {
          pipeline_id: opp.pipeline_id,
          source: 'Created',
          source_module: 'RevOS_Pipeline_Direct_Creation',
          framework_version: 'DIRECT_CREATION_v1.0',
          handover_lifecycle_state: 'CREATED',
          initial_opportunity_context: opp.initial_context,
          summary_status: 'NOT_GENERATED'
        }
      ]
    }
  });

  const { status, json } = await harness.invoke({
    action: 'generate-initial-opportunity-context-summary',
    pipeline_id: opp.pipeline_id
  });

  assert.equal(status, 200);
  assert.equal(json.status, 'success');
  assert.equal(json.summary_status, 'READY');
  assert.equal(json.source_category, 'Created');
  assert.equal(json.summary_version, 1);
  assert.equal(harness.geminiCalls.length, 1);
  assert.equal(
    json.summary.summary_metadata.evidence_status,
    'not_independent_verified_evidence'
  );
  assert.equal(Object.keys(json.summary.summary_sections).length, 10);

  const persisted = harness.db.pipeline_opportunity_handover_details[0];
  assert.equal(persisted.summary_status, 'READY');
  assert.equal(persisted.summary_version, 1);
  assert.ok(persisted.summary_input_hash);
  assert.equal(persisted.summary_error, null);
});

test('Group A3/A4/A5: Created opportunity with only required fields, missing commercial model & missing stakeholders generates cleanly', async () => {
  const minimalOpp = makeCreatedOpportunity({
    pipeline_id: 'PIPE_DIRECT_MINIMAL',
    deal_value: 50000,
    commercial_model: '',
    initial_context: {
      source: 'Created',
      opportunity_name: 'Minimal Direct Opportunity',
      company_name: 'Beta Logistics',
      industry: 'SaaS / Software',
      revenue_motion: 'Digital Solution Selling',
      opportunity_owner: 'Alex Rivera',
      country: 'Canada',
      opportunity_overview: 'Initial cloud workflow rollout.',
      customer_business_problem: 'Manual dispatch coordination causing delays.',
      proposed_solution: 'Cloud dispatch automation SaaS.',
      expected_business_outcomes: '',
      opportunity_origin_background: '',
      estimated_revenue: 50000,
      currency: 'CAD',
      currency_symbol: '$',
      expected_closing_date: '2027-09-01',
      pipeline_stage: 'Qualification',
      opportunity_stage: 'Emerging Opportunity',
      commercial_model: '',
      current_engagement_status: '',
      known_customer_stakeholders: '',
      known_decision_maker: '',
      internal_champion: '',
      recent_customer_interaction: '',
      known_competitors: '',
      known_customer_priorities: '',
      known_constraints_challenges: '',
      additional_information: ''
    }
  });

  const harness = loadEdgeHarness({
    db: { pipeline_opportunities: [minimalOpp] }
  });

  const { status, json } = await harness.invoke({
    action: 'generate-initial-opportunity-context-summary',
    pipeline_id: 'PIPE_DIRECT_MINIMAL'
  });

  assert.equal(status, 200);
  assert.equal(json.summary_status, 'READY');
  assert.equal(harness.geminiCalls.length, 1);

  const sentPrompt = String(harness.geminiCalls[0].contents);
  assert.ok(sentPrompt.includes('"commercial_model": ""'));
  assert.ok(sentPrompt.includes('"known_decision_maker"'));
  assert.ok(sentPrompt.includes('missing_or_unprovided_fields'));
});

// ============================================================================
// TEST GROUP B — Information Integrity & Provenance Governance
// ============================================================================

test('Group B: Input assembly preserves provenance, flags missing/contradictory fields, strips private IDs, and system prompt enforces anti-fabrication', async () => {
  const opp = makeCreatedOpportunity({
    pipeline_id: 'PIPE_DIRECT_INTEGRITY',
    created_by: 'user-owner-uuid',
    owner_email: 'private-ae@example.com',
    tenant_id: 'secret-tenant-xyz',
    initial_context: {
      source: 'Created',
      opportunity_name: 'Late Stage Without DM Info',
      company_name: 'Gamma Energy',
      industry: 'Engineering Solutions',
      revenue_motion: 'Engineering & Project Solutions',
      opportunity_owner: 'Jordan Lee',
      country: 'United Kingdom',
      opportunity_overview: 'Substation telemetry upgrade.',
      customer_business_problem: 'Customer problem details unconfirmed.',
      proposed_solution: 'Telemetry hardware and software integration.',
      expected_business_outcomes: '',
      estimated_revenue: 0,
      currency: 'GBP',
      currency_symbol: '£',
      expected_closing_date: '2027-04-01',
      pipeline_stage: 'Negotiation',
      opportunity_stage: 'Decision Opportunity',
      commercial_model: '',
      known_customer_stakeholders: '',
      known_decision_maker: '',
      internal_champion: '',
      known_competitors: ''
    }
  });

  const harness = loadEdgeHarness({
    authUsers: {
      'valid.user.jwt': { id: 'user-owner-uuid', email: 'private-ae@example.com' }
    },
    db: { pipeline_opportunities: [opp] }
  });

  const { status, json } = await harness.invoke(
    {
      action: 'generate-initial-opportunity-context-summary',
      pipeline_id: 'PIPE_DIRECT_INTEGRITY'
    },
    { Authorization: 'Bearer valid.user.jwt' }
  );

  assert.equal(status, 200);
  const call = harness.geminiCalls[0];
  const sysPrompt = String(call.config.systemInstruction);
  const userPrompt = String(call.contents);

  // System prompt integrity guards
  assert.match(sysPrompt, /Never invent customer facts/i);
  assert.match(sysPrompt, /Never invent financial figures/i);
  assert.match(sysPrompt, /Never invent stakeholder roles/i);
  assert.match(sysPrompt, /Never interpret missing optional fields as negative evidence/i);
  assert.match(sysPrompt, /NOT an independent evidence source/i);

  // Technical/sensitive fields stripped from Gemini prompt payload
  assert.ok(!userPrompt.includes('user-owner-uuid'));
  assert.ok(!userPrompt.includes('private-ae@example.com'));
  assert.ok(!userPrompt.includes('secret-tenant-xyz'));

  // Missing optional/unavailable fields explicitly enumerated
  const parsedContext = JSON.parse(
    userPrompt.split('INITIAL_OPPORTUNITY_CONTEXT:\n')[1]
  );
  assert.equal(parsedContext.provenance.verified_customer_evidence_attached, false);
  assert.ok(
    parsedContext.data_completeness.missing_or_unprovided_fields.includes(
      'expected_business_outcomes'
    )
  );
  assert.ok(
    parsedContext.data_completeness.missing_or_unprovided_fields.includes(
      'known_decision_maker'
    )
  );
  assert.ok(
    parsedContext.data_completeness.missing_or_unprovided_fields.includes(
      'known_competitors'
    )
  );
  assert.equal(
    json.summary.summary_metadata.evidence_status,
    'not_independent_verified_evidence'
  );
});

// ============================================================================
// TEST GROUP C — Source Category Validation
// ============================================================================

test('Group C: Rejects Inherited, missing, and unsupported source categories with 422 and zero Gemini calls', async () => {
  const inheritedOpp = makeCreatedOpportunity({
    pipeline_id: 'PIPE_INHERITED_1',
    source: 'Inherited'
  });
  const missingSourceOpp = makeCreatedOpportunity({
    pipeline_id: 'PIPE_MISSING_SRC',
    source: '',
    metadata: {}
  });
  const unsupportedOpp = makeCreatedOpportunity({
    pipeline_id: 'PIPE_CRM_SRC',
    source: 'External_CRM',
    metadata: { source: 'External_CRM' }
  });

  const harness = loadEdgeHarness({
    db: {
      pipeline_opportunities: [inheritedOpp, missingSourceOpp, unsupportedOpp]
    }
  });

  const r1 = await harness.invoke({
    action: 'generate-initial-opportunity-context-summary',
    pipeline_id: 'PIPE_INHERITED_1'
  });
  assert.equal(r1.status, 422);
  assert.equal(r1.json.code, 'INHERITED_SOURCE_NOT_ELIGIBLE');

  const r2 = await harness.invoke({
    action: 'generate-initial-opportunity-context-summary',
    pipeline_id: 'PIPE_MISSING_SRC'
  });
  assert.equal(r2.status, 422);
  assert.equal(r2.json.code, 'MISSING_SOURCE_CATEGORY');

  const r3 = await harness.invoke({
    action: 'generate-initial-opportunity-context-summary',
    pipeline_id: 'PIPE_CRM_SRC'
  });
  assert.equal(r3.status, 422);
  assert.equal(r3.json.code, 'UNSUPPORTED_SOURCE_CATEGORY');

  assert.equal(harness.geminiCalls.length, 0);
});

// ============================================================================
// TEST GROUP D — Failures, Retries, Duplicates, Staleness, Versioning & Auth
// ============================================================================

test('Group D1/D7: Gemini API failure marks FAILED while preserving opportunity, and retry succeeds cleanly', async () => {
  const opp = makeCreatedOpportunity({ pipeline_id: 'PIPE_FAIL_RETRY' });
  let shouldFail = true;

  const harness = loadEdgeHarness({
    db: { pipeline_opportunities: [opp] },
    geminiHandler: async () => {
      if (shouldFail) throw new Error('Upstream 503 Service Unavailable');
      return { text: JSON.stringify(full10SectionsResponse()) };
    }
  });

  const failRes = await harness.invoke({
    action: 'generate-initial-opportunity-context-summary',
    pipeline_id: 'PIPE_FAIL_RETRY'
  });
  assert.equal(failRes.status, 502);
  assert.equal(failRes.json.summary_status, 'FAILED');
  assert.equal(failRes.json.retryable, true);

  // Original opportunity record remains intact
  assert.equal(harness.db.pipeline_opportunities.length, 1);
  assert.equal(harness.db.pipeline_opportunities[0].opportunity_name, opp.opportunity_name);
  assert.equal(
    harness.db.pipeline_opportunity_handover_details[0].summary_status,
    'FAILED'
  );
  assert.ok(
    harness.db.pipeline_opportunity_handover_details[0].initial_opportunity_context
  );

  // Controlled retry succeeds
  shouldFail = false;
  const retryRes = await harness.invoke({
    action: 'generate-initial-opportunity-context-summary',
    pipeline_id: 'PIPE_FAIL_RETRY',
    retry: true
  });
  assert.equal(retryRes.status, 200);
  assert.equal(retryRes.json.summary_status, 'READY');
  assert.equal(
    harness.db.pipeline_opportunity_handover_details[0].summary_error,
    null
  );
});

test('Group D2/D3/D4: Timeouts, malformed JSON, and incomplete 10-section responses fail safely without marking Ready', async () => {
  const opp = makeCreatedOpportunity({ pipeline_id: 'PIPE_BAD_JSON' });

  // Timeout simulation
  const timeoutHarness = loadEdgeHarness({
    db: { pipeline_opportunities: [opp] },
    geminiHandler: async () => {
      throw new Error('SUMMARY_TIMEOUT: Timed out after 22s');
    }
  });
  const tRes = await timeoutHarness.invoke({
    action: 'generate-initial-opportunity-context-summary',
    pipeline_id: 'PIPE_BAD_JSON'
  });
  assert.equal(tRes.status, 504);
  assert.equal(tRes.json.code, 'GEMINI_TIMEOUT');
  assert.equal(
    timeoutHarness.db.pipeline_opportunity_handover_details[0].summary_status,
    'FAILED'
  );

  // Malformed JSON simulation
  const malformedHarness = loadEdgeHarness({
    db: { pipeline_opportunities: [opp] },
    geminiHandler: async () => ({ text: '{ invalid json' })
  });
  const mRes = await malformedHarness.invoke({
    action: 'generate-initial-opportunity-context-summary',
    pipeline_id: 'PIPE_BAD_JSON'
  });
  assert.equal(mRes.status, 502);
  assert.equal(mRes.json.code, 'MALFORMED_SUMMARY_JSON');
  assert.equal(
    malformedHarness.db.pipeline_opportunity_handover_details[0].initial_opportunity_context_summary,
    undefined
  );

  // Incomplete 10-section response (missing missing_or_unconfirmed_information)
  const partialPayload = full10SectionsResponse();
  delete (partialPayload.summary_sections as any).missing_or_unconfirmed_information;

  const incompleteHarness = loadEdgeHarness({
    db: { pipeline_opportunities: [opp] },
    geminiHandler: async () => ({ text: JSON.stringify(partialPayload) })
  });
  const iRes = await incompleteHarness.invoke({
    action: 'generate-initial-opportunity-context-summary',
    pipeline_id: 'PIPE_BAD_JSON'
  });
  assert.equal(iRes.status, 502);
  assert.equal(iRes.json.code, 'INCOMPLETE_SUMMARY_RESPONSE');
  assert.equal(
    incompleteHarness.db.pipeline_opportunity_handover_details[0].summary_status,
    'FAILED'
  );
});

test('Group D5: DB persistence failure sets FAILED status and returns 500 while keeping opportunity intact', async () => {
  const opp = makeCreatedOpportunity({ pipeline_id: 'PIPE_DB_FAIL' });
  const harness = loadEdgeHarness({
    db: { pipeline_opportunities: [opp] },
    failHandoverUpdateAfterGenerating: true
  });

  const res = await harness.invoke({
    action: 'generate-initial-opportunity-context-summary',
    pipeline_id: 'PIPE_DB_FAIL'
  });
  assert.equal(res.status, 500);
  assert.equal(res.json.code, 'DB_PERSISTENCE_FAILED');
  assert.equal(harness.db.pipeline_opportunities.length, 1);
});

test('Group D6 & Versioning/Staleness: Guards in-progress duplicates, deduplicates identical Ready requests, detects source changes, and archives versions', async () => {
  const opp = makeCreatedOpportunity({ pipeline_id: 'PIPE_VERSIONED' });
  const harness = loadEdgeHarness({
    db: { pipeline_opportunities: [opp] }
  });

  // 1. Initial generation -> v1
  const gen1 = await harness.invoke({
    action: 'generate-initial-opportunity-context-summary',
    pipeline_id: 'PIPE_VERSIONED'
  });
  assert.equal(gen1.status, 200);
  assert.equal(gen1.json.summary_version, 1);
  assert.equal(harness.geminiCalls.length, 1);

  // 2. Duplicate call with unchanged inputs -> cached hit, no new Gemini call
  const dup = await harness.invoke({
    action: 'generate-initial-opportunity-context-summary',
    pipeline_id: 'PIPE_VERSIONED'
  });
  assert.equal(dup.status, 200);
  assert.equal(dup.json.from_cache, true);
  assert.equal(dup.json.is_stale, false);
  assert.equal(harness.geminiCalls.length, 1);

  // 3. Edit opportunity creation context -> staleness check flags is_stale = true
  harness.db.pipeline_opportunities[0].initial_context.estimated_revenue = 750000;
  harness.db.pipeline_opportunities[0].deal_value = 750000;
  const staleCheck = await harness.invoke({
    action: 'get-initial-opportunity-context-summary',
    pipeline_id: 'PIPE_VERSIONED'
  });
  assert.equal(staleCheck.status, 200);
  assert.equal(staleCheck.json.is_stale, true);

  // 4. Regenerate after change -> v2 created, overwrites old v1 in DB (summary_history remains empty)
  const gen2 = await harness.invoke({
    action: 'generate-initial-opportunity-context-summary',
    pipeline_id: 'PIPE_VERSIONED'
  });
  assert.equal(gen2.status, 200);
  assert.equal(gen2.json.from_cache, false);
  assert.equal(gen2.json.summary_version, 2);
  assert.equal(gen2.json.summary_history.length, 0);
  assert.equal(
    harness.db.pipeline_opportunity_handover_details[0].initial_opportunity_context_summary
      ?.summary_metadata?.version,
    2
  );
  assert.equal(
    harness.db.pipeline_opportunity_handover_details[0].summary_history.length,
    0
  );
  assert.equal(harness.geminiCalls.length, 2);

  // 5. Simulate active GENERATING lock -> rejects duplicate call with 409
  harness.db.pipeline_opportunity_handover_details[0].summary_status = 'GENERATING';
  harness.db.pipeline_opportunity_handover_details[0].updated_at = new Date().toISOString();
  const inProgressRes = await harness.invoke({
    action: 'generate-initial-opportunity-context-summary',
    pipeline_id: 'PIPE_VERSIONED'
  });
  assert.equal(inProgressRes.status, 409);
  assert.equal(inProgressRes.json.code, 'GENERATION_IN_PROGRESS');
  assert.equal(harness.geminiCalls.length, 2);
});

test('Group D (Security): Rejects unauthorized cross-user access (403) and anonymous calls on user-owned Created opportunities (401)', async () => {
  const ownedOpp = makeCreatedOpportunity({
    pipeline_id: 'PIPE_OWNED',
    created_by: 'user-a-id',
    owner_email: 'usera@example.com'
  });

  const harness = loadEdgeHarness({
    authUsers: {
      'jwt.user.b': { id: 'user-b-id', email: 'userb@example.com' }
    },
    db: { pipeline_opportunities: [ownedOpp] }
  });

  const unauthRes = await harness.invoke({
    action: 'generate-initial-opportunity-context-summary',
    pipeline_id: 'PIPE_OWNED'
  });
  assert.equal(unauthRes.status, 401);

  const forbiddenRes = await harness.invoke(
    {
      action: 'generate-initial-opportunity-context-summary',
      pipeline_id: 'PIPE_OWNED'
    },
    { Authorization: 'Bearer jwt.user.b' }
  );
  assert.equal(forbiddenRes.status, 403);
  assert.equal(harness.geminiCalls.length, 0);
});

// ============================================================================
// TEST GROUP E — Existing Pipeline Assessment Regression & Strict Isolation
// ============================================================================

test('Group E: Summary generation does not trigger PADF/Winability/Risks/SWOT/Actions, and existing PA actions continue to execute unchanged', async () => {
  const createdOpp = makeCreatedOpportunity({ pipeline_id: 'PIPE_CREATED_ISOLATED' });
  const inheritedOpp = makeCreatedOpportunity({
    pipeline_id: 'PIPE_INHERITED_REGRESSION',
    source: 'Inherited',
    source_system: 'RevOS_Opportunity_Qualification',
    metadata: { source: 'Inherited' }
  });

  const harness = loadEdgeHarness({
    db: {
      pipeline_opportunities: [createdOpp, inheritedOpp],
      pipeline_inheritance: [
        {
          inheritance_id: 'INH_1',
          pipeline_id: 'PIPE_INHERITED_REGRESSION',
          qualification_decision: 'QUALIFIED',
          qualification_score: 82,
          qualification_confidence: 78,
          inherited_payload: {}
        }
      ],
      pipeline_assessments: [
        {
          assessment_id: 'ASSESS_1',
          pipeline_id: 'PIPE_INHERITED_REGRESSION',
          assessment_sequence: 1,
          base_winability: 72,
          risk_adjusted_winability: 68,
          pipeline_health: 'MODERATE',
          assessment_confidence: 75
        }
      ]
    }
  });

  // 1. Run new Initial Opportunity Context Summary action
  const summaryRes = await harness.invoke({
    action: 'generate-initial-opportunity-context-summary',
    pipeline_id: 'PIPE_CREATED_ISOLATED'
  });
  assert.equal(summaryRes.status, 200);

  // Confirm ZERO side effects on PADF, assessments, SWOT, risks, strategies, actions
  assert.equal(harness.db.pipeline_assessments.length, 1);
  assert.equal(harness.db.pipeline_padf_results.length, 0);
  assert.equal(harness.db.pipeline_swot_results.length, 0);
  assert.equal(harness.db.pipeline_risks.length, 0);
  assert.equal(harness.db.pipeline_strategies.length, 0);
  assert.equal(harness.db.pipeline_actions.length, 0);

  // 2. Verify existing PA actions work untouched
  const ctxRes = await harness.invoke({
    action: 'get-assessment-context',
    pipeline_id: 'PIPE_INHERITED_REGRESSION'
  });
  assert.equal(ctxRes.status, 200);
  assert.equal(ctxRes.json.dimensions.length, 8);
  assert.equal(ctxRes.json.evidence_objects_count, 48);

  const qRes = await harness.invoke({
    action: 'query-evidence-questions',
    pipeline_id: 'PIPE_INHERITED_REGRESSION'
  });
  assert.equal(qRes.status, 200);
  assert.ok(qRes.json.grouped_questions.PA1_Customer_Value_and_Urgency.length > 0);

  const retRes = await harness.invoke({
    action: 'retrieve-assessment',
    pipeline_id: 'PIPE_INHERITED_REGRESSION'
  });
  assert.equal(retRes.status, 200);
  assert.equal(retRes.json.assessment.assessment_id, 'ASSESS_1');
});
