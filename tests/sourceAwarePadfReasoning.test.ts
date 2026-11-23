import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import crypto from 'node:crypto';
import * as esbuild from 'esbuild';

// ============================================================================
// Source-Aware PADF Gemini Reasoning Verification Suite
// Compiles & executes the REAL `/supabase/functions/pipeline-assessment/index.ts`
// against in-memory Supabase + Gemini doubles covering Test Groups A - F.
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
  failAssessmentInsertWithSchemaError?: boolean;
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

const buildSampleEvidence = (pipelineId: string): Row[] => [
  {
    evidence_instance_id: `EVI_${pipelineId}_E01`,
    pipeline_id: pipelineId,
    evidence_object_id: 'E01_Customer_Business_Problem_Quantified',
    evidence_type: 'customer_statement',
    evidence_statement:
      'VP Operations confirmed $1.8M annual scrap & downtime losses in executive workshop notes.',
    source_type: 'ES01_Customer_Executive_Conversation',
    source_reference: 'Executive Workshop',
    verification_status: 'VERIFIED',
    evidence_quality: 'HIGH',
    evidence_confidence: 90,
    customer_confirmed: true,
    metadata: { dimension_code: 'PA1_Customer_Value_and_Urgency' }
  },
  {
    evidence_instance_id: `EVI_${pipelineId}_E07`,
    pipeline_id: pipelineId,
    evidence_object_id: 'E07_Economic_Buyer_Direct_Engagement',
    evidence_type: 'customer_statement',
    evidence_statement:
      'CFO scheduled direct architecture review and requested formal TCO model.',
    source_type: 'ES01_Customer_Executive_Conversation',
    source_reference: 'CFO Meeting',
    verification_status: 'VERIFIED',
    evidence_quality: 'HIGH',
    evidence_confidence: 88,
    customer_confirmed: true,
    metadata: { dimension_code: 'PA2_Buying_Center_and_Influence' }
  },
  {
    evidence_instance_id: `EVI_${pipelineId}_E13`,
    pipeline_id: pipelineId,
    evidence_object_id: 'E13_Formal_Buying_Process_Confirmed',
    evidence_type: 'customer_statement',
    evidence_statement:
      'Procurement outlined standard 3-week InfoSec and MSAs schedule without signed close plan.',
    source_type: 'ES03_Customer_Meeting_Notes',
    source_reference: 'Procurement Call',
    verification_status: 'UNVERIFIED',
    evidence_quality: 'MEDIUM',
    evidence_confidence: 65,
    customer_confirmed: false,
    metadata: { dimension_code: 'PA3_Buying_Process_and_Decision_Control' }
  },
  {
    evidence_instance_id: `EVI_${pipelineId}_E19`,
    pipeline_id: pipelineId,
    evidence_object_id: 'E19_Solution_Technical_Fit_Validated',
    evidence_type: 'customer_statement',
    evidence_statement:
      'Plant IT confirmed REST & OPC-UA integration compatibility during technical discovery.',
    source_type: 'ES04_Customer_Documentation',
    source_reference: 'Technical Architecture Signoff',
    verification_status: 'VERIFIED',
    evidence_quality: 'HIGH',
    evidence_confidence: 86,
    customer_confirmed: true,
    metadata: { dimension_code: 'PA4_Solution_and_Value_Proposition' }
  }
];

const buildReadySummaryPayload = (
  pipelineId: string,
  version: number,
  inputHash: string,
  overviewSuffix = ''
) => ({
  summary_metadata: {
    summary_type: 'initial_opportunity_context_summary',
    generation_status: 'ready',
    generated_at: `2026-11-22T10:0${version}:00.000Z`,
    source_category: 'Created',
    opportunity_id: pipelineId,
    version,
    prompt_version: 'v1.0',
    model_identifier: 'gemini-3.1-flash-lite',
    input_hash: inputHash,
    evidence_status: 'not_independent_verified_evidence',
    provenance_note:
      'AI-generated synthesis derived solely from user-provided direct opportunity creation inputs in Supabase. Not an independently verified customer evidence source.'
  },
  summary_sections: {
    opportunity_overview: `Initial Created overview v${version} for telemetry platform rollout.${overviewSuffix}`,
    customer_context: `Mid-market manufacturing enterprise in Singapore reported by owner (v${version}).`,
    business_problem_and_customer_needs: `User notes highlight plant downtime visibility gaps requiring real-time monitoring (v${version}).`,
    proposed_solution_and_value_proposition: `Proposed RevOS Industrial Telemetry Suite to unify plant KPIs (v${version}).`,
    expected_business_outcomes: `User projects 15% reduction in unplanned maintenance waiting times (unverified baseline, v${version}).`,
    commercial_context: `Target deal value USD 280,000, stage Discovery, budget sign-off unconfirmed (v${version}).`,
    customer_engagement_and_stakeholder_context: `User met Plant Director; formal Economic Buyer authority unconfirmed in creation notes (v${version}).`,
    competitive_context: `Legacy homegrown spreadsheet tracking noted; external vendors not named (v${version}).`,
    known_constraints_and_challenges: `IT bandwidth for OT gateway rollout requires coordination (v${version}).`,
    missing_or_unconfirmed_information: `Executive budget approval, formal procurement timeline, and verified ROI baselines require discovery (v${version}).`
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
  const tableQueries: Array<{ table: string; action: string }> = [];
  let capturedHandler: ((req: Request) => Promise<Response>) | null = null;

  const makeQueryBuilder = (tableName: keyof MockDbState) => {
    const filters: Array<(row: Row) => boolean> = [];
    let pendingAction: 'select' | 'insert' | 'update' | 'upsert' | 'delete' = 'select';
    let pendingPayload: any = null;
    let upsertConflictKey = 'pipeline_id';
    let orderCol: string | null = null;
    let orderAsc = true;
    let rowLimit: number | null = null;

    const exec = async (expectSingle?: 'single' | 'maybeSingle') => {
      tableQueries.push({ table: String(tableName), action: pendingAction });
      const rows = db[tableName];

      if (pendingAction === 'insert') {
        const items = Array.isArray(pendingPayload) ? pendingPayload : [pendingPayload];
        if (
          tableName === 'pipeline_assessments' &&
          options.failAssessmentInsertWithSchemaError &&
          items.some((it) => 'opportunity_source_category' in it)
        ) {
          return {
            data: null,
            error: {
              code: 'PGRST204',
              message:
                "Could not find the 'opportunity_source_category' column of 'pipeline_assessments'"
            }
          };
        }
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
        db[tableName] = rows.filter((r) => !filters.every((fn) => fn(r)));
        return { data: null, error: null };
      }

      let result = rows.filter((r) => filters.every((fn) => fn(r)));
      if (orderCol) {
        result = [...result].sort((a, b) => {
          const av = a[orderCol!];
          const bv = b[orderCol!];
          if (av === bv) return 0;
          return (av < bv ? -1 : 1) * (orderAsc ? 1 : -1);
        });
      }
      if (rowLimit !== null) result = result.slice(0, rowLimit);
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
      like: (col: string, pattern: string) => {
        const regex = new RegExp('^' + pattern.replace(/%/g, '.*') + '$');
        filters.push((r) => regex.test(String(r[col] || '')));
        return builder;
      },
      gte: (col: string, val: any) => {
        filters.push((r) => String(r[col] || '') >= String(val));
        return builder;
      },
      lte: (col: string, val: any) => {
        filters.push((r) => String(r[col] || '') <= String(val));
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

  class MockGoogleGenAI {
    models = {
      generateContent: async (params: any) => {
        geminiCalls.push(params);
        const sys = String(params?.config?.systemInstruction || '');
        const contents = String(params?.contents || '');

        // Call B: Evidence audit batch
        if (contents.includes('=== EVIDENCE ITEMS TO AUDIT')) {
          const idMatches = [...contents.matchAll(/ID:\s*([^\s|]+)/g)].map((m) => m[1]);
          return {
            text: JSON.stringify({
              evidence_assessments: idMatches.map((id) => ({
                evidence_object_id: id,
                signal_score: 76,
                matched_type: 'positive',
                identification_assessment:
                  'Customer documentation and workshop discussions substantiate strong urgency and alignment on core requirements.'
              }))
            })
          };
        }

        // Call C: Winning Strategy
        if (sys.includes('Winning Strategies') || contents.includes('RevOS Winning Strategy Engine')) {
          return {
            text: JSON.stringify({
              winning_strategy_summary: {
                customer_objectives_and_outcomes: 'Reduce unplanned plant downtime.',
                opportunity_business_conditions: 'Active discovery with CFO sponsorship.',
                competitive_circumstances: 'Facing status-quo manual workflows.',
                primary_winning_thesis: 'Anchor ROI with Economic Buyer and formalize MCP.',
                top_strategy_id: 'WS_1',
                winability_context_note: 'Directional risk reduction via mutual close plan.'
              },
              winning_strategies: [
                {
                  strategy_id: 'WS_1',
                  title: 'Formalize Mutual Close Plan with Procurement',
                  strategic_objective: 'Eliminate close-date variance via verified milestones.',
                  condition_to_change: 'Unsigned InfoSec & MSA schedule.',
                  why_condition_important: 'Protects target close window.',
                  tows_category: 'WO',
                  supporting_swot_factor_ids: ['U_S1'],
                  supporting_evidence_ids: ['E13_Formal_Buying_Process_Confirmed'],
                  related_risk_ids: [],
                  strategic_rationale: 'Aligns buyer procurement stages with technical validation.',
                  expected_impact: 'Directionally strengthens closing certainty.',
                  probability_and_quality_influence: 'Improves forecast quality and timeline confidence.',
                  feasibility: 'HIGH',
                  dependencies: ['Customer Procurement Lead'],
                  priority: 'HIGH',
                  recommended_actions: [
                    {
                      action_title: 'Send Mutual Close Plan Draft',
                      action_description: 'Share joint milestone dates with CFO and Procurement.',
                      owner_role: 'Account Executive',
                      timeframe: '7 Days',
                      expected_outcome: 'Customer confirms milestone schedule.'
                    }
                  ],
                  expected_evidence_of_improvement: ['Signed Mutual Close Plan timeline.'],
                  causal_chain: {
                    assessment_weakness_or_threat: 'Procurement milestones unconfirmed.',
                    evidence_and_business_implication: 'Timing slippage risk in PA3.',
                    strategic_objective: 'Confirm procurement schedule.',
                    tows_response: 'WO milestone alignment',
                    existing_risk_and_winability_context: 'Maintains deterministic baseline.',
                    recommended_action: 'Deliver MCP draft.',
                    expected_evidence_of_improvement: 'Signed MCP.'
                  }
                }
              ]
            })
          };
        }

        // Call A: Strategic PADF Assessment Reasoning
        return {
          text: JSON.stringify({
            primary_reason: 'Strong quantified business value anchors momentum alongside unconfirmed procurement milestones.',
            executive_summary: 'Opportunity shows viable path to Closed Won subject to formalizing procurement and buying-center milestones.',
            qualification_continuity_summary: 'Initial context provenance honored without extrapolating unverified assumptions.',
            why_this_assessment: {
              evidence: 'Submitted PA1, PA2, and PA4 customer-confirmed records support executive urgency.',
              interpretation: 'Buyer need and technical fit are substantiated while procurement schedule remains pending.',
              assessment: 'Deterministic scoring governs winability based strictly on evidence quality.',
              business_implication: 'Secure formal close milestones to protect target timeline.'
            },
            positive_drivers: ['Quantified annual operational problem', 'Direct CFO sponsorship'],
            critical_constraints: ['Procurement milestones remain unconfirmed'],
            priority_actions: ['Formalize mutual close plan with Procurement'],
            longitudinal_trend: 'Baseline established with source provenance tracked.',
            ai_cognitive_reasoning_summary: 'Evidence evaluated uniformly across all 8 PADF dimensions.',
            swot_evaluations: [
              {
                swot_factor_id: 'U_S1',
                factor_name: 'Quantified Business Urgency',
                classification: 'strength',
                category: 'Customer Value',
                layer: 'universal',
                strategic_impact: 4,
                evidence_confidence: 4,
                relevance: 5,
                urgency: 4,
                manageability: 4,
                winability_influence: 4,
                interpretation: 'Quantified pain recorded in workshop notes.',
                business_impact: 'Supports commercial ROI case.',
                uncertainty: 'Low',
                supporting_evidence_ids: ['E01_Customer_Business_Problem_Quantified']
              }
            ],
            padf_dimension_narratives: [
              'PA1_Customer_Value_and_Urgency',
              'PA2_Buying_Center_and_Influence',
              'PA3_Buying_Process_and_Decision_Control',
              'PA4_Solution_and_Value_Proposition',
              'PA5_Competitive_Position',
              'PA6_Commercial_and_Deal_Structure',
              'PA7_Sales_Execution_and_Deal_Readiness',
              'PA8_Deal_Momentum_Risk_and_Closeability'
            ].map((code) => ({
              dimension_code: code,
              dimension_name: code.replace(/_/g, ' '),
              short_interpretation: `Substantiated evaluation for ${code}.`,
              strengths: ['Evidence-backed observation'],
              weaknesses: [],
              contradictory_qualifying_evidence: [],
              related_swot_factors: ['U_S1'],
              evidence_gaps: [],
              risks: [],
              ai_reasoning: `Assessed ${code} strictly on evidence quality.`,
              business_impact: 'Governs winability trajectory.',
              improvement_direction: 'Continue milestone confirmation.',
              recommended_actions: ['Confirm buyer checkpoint']
            })),
            observed_supporting_evidence: [
              {
                evidence_object_id: 'E01_Customer_Business_Problem_Quantified',
                title: 'Customer Business Problem Quantified',
                dimension_code: 'PA1',
                source_type: 'Customer Executive Conversation',
                verification_status: 'VERIFIED',
                finding_summary:
                  'Executive stakeholders quantified $1.8M in annual operational downtime losses during structured workshop discussions, establishing strong urgency.'
              }
            ],
            tows_strategies: [
              {
                strategy_id: 'TOWS_WO_1',
                tows_type: 'WO',
                title: 'Align Procurement Timeline with Executive ROI Case',
                strategic_objective: 'Convert executive sponsorship into confirmed procurement milestones.',
                strategic_rationale: 'Use quantified ROI urgency to accelerate legal & InfoSec scheduling.',
                contributing_swot_factor_ids: ['U_S1'],
                supporting_evidence_ids: ['E01_Customer_Business_Problem_Quantified'],
                expected_winability_impact: 'Directionally strengthens closing certainty.',
                feasibility_considerations: 'Requires joint AE and customer sponsor scheduling.',
                priority: 'HIGH',
                execution_timeframe: '14 Days'
              }
            ],
            risks: [],
            actions: [
              {
                action_title: 'Confirm Mutual Close Plan',
                action_description: 'Document formal legal & InfoSec milestone dates with customer procurement.',
                priority: 'HIGH',
                related_dimension: 'PA3_Buying_Process_and_Decision_Control',
                expected_impact: 'Reduces timeline uncertainty.',
                owner_role: 'Account Executive',
                timeframe: '7 Days',
                success_criteria: 'Procurement confirms target milestone dates.',
                dependencies: 'Customer Procurement Lead'
              }
            ],
            evidence_gaps: []
          })
        };
      }
    };
  }

  const sandboxRequire = (specifier: string) => {
    if (specifier === 'https://deno.land/std@0.168.0/http/server.ts') {
      return {
        serve: (handler: (req: Request) => Promise<Response>) => {
          capturedHandler = handler;
        }
      };
    }
    if (specifier === 'https://esm.sh/@supabase/supabase-js@2') {
      return {
        createClient: () => ({
          auth: {
            getUser: async (token: string) => {
              const user = options.authUsers?.[token];
              if (!user) return { data: { user: null }, error: { message: 'Invalid JWT' } };
              return { data: { user }, error: null };
            }
          },
          from: (tableName: keyof MockDbState) => makeQueryBuilder(tableName)
        })
      };
    }
    if (specifier === 'npm:@google/genai') {
      return {
        GoogleGenAI: MockGoogleGenAI,
        Type: {
          OBJECT: 'OBJECT',
          STRING: 'STRING',
          ARRAY: 'ARRAY',
          INTEGER: 'INTEGER',
          NUMBER: 'NUMBER',
          BOOLEAN: 'BOOLEAN'
        }
      };
    }
    throw new Error(`Unexpected import: ${specifier}`);
  };

  const sandbox: any = {
    exports: {},
    module: { exports: {} },
    require: sandboxRequire,
    Deno: {
      env: {
        get: (k: string) => {
          if (k === 'SUPABASE_URL') return 'https://test.supabase.co';
          if (k === 'SUPABASE_ANON_KEY') return 'anon-test-key';
          if (k === 'SUPABASE_SERVICE_ROLE_KEY') return 'service-role-test-key';
          if (k === 'GEMINI_API_KEY') return 'test-gemini-key';
          return undefined;
        }
      }
    },
    console,
    crypto: crypto.webcrypto,
    TextEncoder,
    AbortController,
    Request,
    Response,
    Headers,
    setTimeout,
    clearTimeout,
    Date,
    Math,
    JSON,
    Promise
  };

  const compiled = getBundledEdgeFunctionCode();
  vm.runInNewContext(compiled, sandbox);

  const invoke = async (
    body: Record<string, any>,
    headers: Record<string, string> = {}
  ) => {
    assert.ok(capturedHandler, 'Edge function serve handler captured');
    const req = new Request('https://edge.local/pipeline-assessment', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        ...headers
      },
      body: JSON.stringify(body)
    });
    const res = await capturedHandler!(req);
    const json = await res.json();
    return { status: res.status, json };
  };

  return { db, geminiCalls, tableQueries, invoke };
}

// ============================================================================
// TEST GROUP A: INHERITED OPPORTUNITIES
// ============================================================================

test('Group A1/A4: Inherited opportunity retrieves pipeline_inheritance, ignores Created summary, preserves provenance', async () => {
  const pipeId = 'PIPE_INH_001';
  const harness = loadEdgeHarness({
    db: {
      pipeline_opportunities: [
        {
          pipeline_id: pipeId,
          source: 'Inherited',
          opportunity_name: 'Global ERP Modernization',
          customer_name: 'Meridian Logistics',
          industry_id: 'IND_Manufacturing',
          revenue_motion_id: 'RM01_Digital_Solution_Selling',
          deal_value: 450000,
          currency: 'USD',
          pipeline_stage: 'Discovery'
        }
      ],
      pipeline_inheritance: [
        {
          inheritance_id: 'INH_001',
          pipeline_id: pipeId,
          qualification_decision: 'QUALIFIED',
          qualification_score: 82,
          qualification_confidence: 80,
          framework_version: 'PADIF_v1.0',
          inherited_payload: {
            sql_trigger: 'Executive sponsorship + approved discovery scope',
            country: 'Germany'
          }
        }
      ],
      pipeline_evidence: buildSampleEvidence(pipeId)
    }
  });

  const { status, json } = await harness.invoke({
    action: 'run-pipeline-assessment',
    pipeline_id: pipeId
  });

  assert.equal(status, 200);
  assert.equal(json.opportunity_source_category, 'Inherited');
  assert.equal(
    json.initial_intelligence_provenance.initial_intelligence_source_type,
    'inherited_lead_qualification'
  );
  assert.equal(json.initial_intelligence_provenance.availability_status, 'AVAILABLE');
  assert.equal(json.initial_intelligence_provenance.source_record_id, 'INH_001');

  // Verify Gemini Layer 1 received Lead Qualification baseline, NOT Initial Context Summary
  const strategicCall = harness.geminiCalls.find((c) =>
    String(c.contents).includes('LAYER 1: INITIAL OPPORTUNITY INTELLIGENCE')
  );
  assert.ok(strategicCall);
  assert.match(strategicCall.contents, /SOURCE: INHERITED — LEAD QUALIFICATION/);
  assert.match(strategicCall.contents, /Qualification Decision: QUALIFIED/);
  assert.match(strategicCall.contents, /Qualification Score \(QIP\): 82\/100/);
  assert.doesNotMatch(
    strategicCall.contents,
    /INITIAL OPPORTUNITY CONTEXT SUMMARY/
  );
  // Handover details table should NOT be queried on Inherited path
  assert.equal(
    harness.tableQueries.some(
      (q) => q.table === 'pipeline_opportunity_handover_details'
    ),
    false
  );
});

test('Group A2/A3/A5: Inherited opportunity handles partial/missing optional inherited fields and preserves historical trajectory', async () => {
  const pipeId = 'PIPE_INH_HIST';
  const yesterday = new Date(Date.now() - 86400000 * 2).toISOString();
  const harness = loadEdgeHarness({
    db: {
      pipeline_opportunities: [
        {
          pipeline_id: pipeId,
          source: 'Inherited',
          opportunity_name: 'Plant Visibility Rollout',
          customer_name: 'Northstar Foods',
          industry_id: 'IND_Manufacturing',
          revenue_motion_id: 'RM01_Digital_Solution_Selling',
          deal_value: 220000,
          currency: 'USD'
        }
      ],
      pipeline_inheritance: [
        {
          inheritance_id: 'INH_PARTIAL',
          pipeline_id: pipeId,
          // Missing qualification_decision, qualification_score, qualification_confidence
          inherited_payload: { notes: 'Minimal qualification notes only.' }
        }
      ],
      pipeline_assessments: [
        {
          assessment_id: 'ASSESS_PRIOR_DAY',
          pipeline_id: pipeId,
          assessment_sequence: 1,
          completed_at: yesterday,
          created_at: yesterday,
          raw_reasoning_output: {
            initial_intelligence_provenance: {
              opportunity_source_category: 'Inherited',
              initial_intelligence_source_type: 'inherited_lead_qualification',
              availability_status: 'AVAILABLE'
            }
          }
        }
      ],
      pipeline_padf_results: [
        {
          assessment_id: 'ASSESS_PRIOR_DAY',
          pipeline_id: pipeId,
          dimension_id: 'PA1_Customer_Value_and_Urgency',
          dimension_score: 64
        }
      ],
      pipeline_evidence: buildSampleEvidence(pipeId)
    }
  });

  const { status, json } = await harness.invoke({
    action: 'run-pipeline-assessment',
    pipeline_id: pipeId
  });

  assert.equal(status, 200);
  assert.equal(json.sequence, 2);
  // Prior day assessment preserved
  assert.equal(harness.db.pipeline_assessments.length, 2);
  const strategicCall = harness.geminiCalls.find((c) =>
    String(c.contents).includes('LAYER 1: INITIAL OPPORTUNITY INTELLIGENCE')
  );
  // Does not fabricate 78/100 or 75% when qualification score/confidence are missing
  assert.match(strategicCall.contents, /Qualification Score \(QIP\): Not recorded/);
  assert.match(strategicCall.contents, /Inherited Confidence: Not recorded/);
  // Historical evolution layer included
  assert.match(strategicCall.contents, /LAYER 5: HISTORICAL EVOLUTION BASELINE/);
});

// ============================================================================
// TEST GROUP B: CREATED OPPORTUNITIES (SCENARIOS A - E)
// ============================================================================

test('Group B1 (Scenario A): Created opportunity uses READY Initial Context Summary, ignores pipeline_inheritance', async () => {
  const pipeId = 'PIPE_CRT_READY';
  const readySummary = buildReadySummaryPayload(pipeId, 1, 'hash-v1');
  const harness = loadEdgeHarness({
    db: {
      pipeline_opportunities: [
        {
          pipeline_id: pipeId,
          source: 'Created',
          opportunity_name: 'Smart Telemetry Rollout',
          customer_name: 'Kestrel Robotics',
          industry_id: 'IND_Manufacturing',
          revenue_motion_id: 'RM01_Digital_Solution_Selling',
          deal_value: 280000,
          currency: 'USD',
          country: 'Singapore',
          pipeline_stage: 'Discovery'
        }
      ],
      // Even if a stale/stray inheritance row existed in DB, Created MUST NOT consult it
      pipeline_inheritance: [
        {
          inheritance_id: 'STRAY_INH',
          pipeline_id: pipeId,
          qualification_decision: 'SHOULD_NEVER_APPEAR',
          qualification_score: 99,
          inherited_payload: { secret_leak: 'must_not_read_inheritance' }
        }
      ],
      pipeline_opportunity_handover_details: [
        {
          id: 'HND_001',
          pipeline_id: pipeId,
          source: 'Created',
          summary_status: 'READY',
          summary_version: 1,
          summary_generated_at: '2026-11-22T10:01:00.000Z',
          summary_input_hash: 'hash-v1',
          initial_opportunity_context_summary: readySummary
        }
      ],
      pipeline_evidence: buildSampleEvidence(pipeId)
    }
  });

  const { status, json } = await harness.invoke({
    action: 'run-pipeline-assessment',
    pipeline_id: pipeId
  });

  assert.equal(status, 200);
  assert.equal(json.opportunity_source_category, 'Created');
  assert.equal(
    json.initial_intelligence_provenance.initial_intelligence_source_type,
    'initial_opportunity_context_summary'
  );
  assert.equal(json.initial_intelligence_provenance.summary_version, 1);
  assert.equal(
    json.initial_intelligence_provenance.is_independently_verified_evidence,
    false
  );

  // Must NEVER query pipeline_inheritance for Created opportunities
  assert.equal(
    harness.tableQueries.some((q) => q.table === 'pipeline_inheritance'),
    false
  );

  const strategicCall = harness.geminiCalls.find((c) =>
    String(c.contents).includes('LAYER 1: INITIAL OPPORTUNITY INTELLIGENCE')
  );
  assert.match(strategicCall.contents, /SOURCE: CREATED — INITIAL OPPORTUNITY CONTEXT SUMMARY/);
  assert.match(strategicCall.contents, /Initial Created overview v1/);
  assert.doesNotMatch(strategicCall.contents, /must_not_read_inheritance/);
  assert.match(
    strategicCall.config.systemInstruction,
    /NOT as independently verified customer evidence/
  );
});

test('Group B2 (Scenario B): Created opportunity with GENERATING summary returns retryable 409 without unfinished reasoning', async () => {
  const pipeId = 'PIPE_CRT_GEN';
  const harness = loadEdgeHarness({
    db: {
      pipeline_opportunities: [
        {
          pipeline_id: pipeId,
          source: 'Created',
          opportunity_name: 'Edge Analytics Deal',
          customer_name: 'Helios Energy',
          industry_id: 'IND_Manufacturing',
          revenue_motion_id: 'RM01_Digital_Solution_Selling',
          deal_value: 190000,
          currency: 'USD'
        }
      ],
      pipeline_opportunity_handover_details: [
        {
          id: 'HND_GEN',
          pipeline_id: pipeId,
          source: 'Created',
          summary_status: 'GENERATING',
          initial_opportunity_context_summary: null
        }
      ],
      pipeline_evidence: buildSampleEvidence(pipeId)
    }
  });

  const { status, json } = await harness.invoke({
    action: 'run-pipeline-assessment',
    pipeline_id: pipeId
  });

  assert.equal(status, 409);
  assert.equal(json.code, 'INITIAL_CONTEXT_SUMMARY_GENERATING');
  assert.equal(json.retryable, true);
  assert.equal(json.summary_status, 'GENERATING');
  assert.equal(harness.geminiCalls.length, 0);
});

test('Group B3 (Scenario C): Created opportunity with FAILED summary continues with explicit unavailable provenance and zero Lead Qualification fallback', async () => {
  const pipeId = 'PIPE_CRT_FAIL';
  const harness = loadEdgeHarness({
    db: {
      pipeline_opportunities: [
        {
          pipeline_id: pipeId,
          source: 'Created',
          opportunity_name: 'Fleet Telemetry Cloud',
          customer_name: 'Apex Transit',
          industry_id: 'IND_Manufacturing',
          revenue_motion_id: 'RM01_Digital_Solution_Selling',
          deal_value: 310000,
          currency: 'USD'
        }
      ],
      pipeline_opportunity_handover_details: [
        {
          id: 'HND_FAIL',
          pipeline_id: pipeId,
          source: 'Created',
          summary_status: 'FAILED',
          summary_error: '[GEMINI_TIMEOUT] Upstream timed out',
          initial_opportunity_context_summary: null
        }
      ],
      pipeline_evidence: buildSampleEvidence(pipeId)
    }
  });

  const { status, json } = await harness.invoke({
    action: 'run-pipeline-assessment',
    pipeline_id: pipeId
  });

  assert.equal(status, 200);
  assert.equal(json.opportunity_source_category, 'Created');
  assert.equal(
    json.initial_intelligence_provenance.initial_intelligence_source_type,
    'unavailable'
  );
  assert.equal(
    json.initial_intelligence_provenance.availability_status,
    'UNAVAILABLE_FAILED'
  );

  const strategicCall = harness.geminiCalls.find((c) =>
    String(c.contents).includes('LAYER 1: INITIAL OPPORTUNITY INTELLIGENCE')
  );
  assert.match(strategicCall.contents, /INITIAL SUMMARY UNAVAILABLE/);
  assert.match(strategicCall.contents, /UNAVAILABLE_FAILED/);
  assert.match(strategicCall.contents, /GEMINI_TIMEOUT/);
  assert.equal(
    harness.tableQueries.some((q) => q.table === 'pipeline_inheritance'),
    false
  );
});

test('Group B4 (Scenario D): Created opportunity with missing summary handles UNAVAILABLE_MISSING without inventing summary or inferring Inherited', async () => {
  const pipeId = 'PIPE_CRT_MISSING';
  const harness = loadEdgeHarness({
    db: {
      pipeline_opportunities: [
        {
          pipeline_id: pipeId,
          source: 'Created',
          opportunity_name: 'Direct Logistics Modernization',
          customer_name: 'Harbor Freight Digital',
          industry_id: 'IND_Manufacturing',
          revenue_motion_id: 'RM01_Digital_Solution_Selling',
          deal_value: 165000,
          currency: 'USD'
        }
      ],
      pipeline_opportunity_handover_details: [],
      pipeline_evidence: buildSampleEvidence(pipeId)
    }
  });

  const { status, json } = await harness.invoke({
    action: 'run-pipeline-assessment',
    pipeline_id: pipeId
  });

  assert.equal(status, 200);
  assert.equal(json.opportunity_source_category, 'Created');
  assert.equal(
    json.initial_intelligence_provenance.initial_intelligence_source_type,
    'unavailable'
  );
  assert.equal(
    json.initial_intelligence_provenance.availability_status,
    'UNAVAILABLE_MISSING'
  );
  const strategicCall = harness.geminiCalls.find((c) =>
    String(c.contents).includes('LAYER 1: INITIAL OPPORTUNITY INTELLIGENCE')
  );
  assert.match(strategicCall.contents, /UNAVAILABLE_MISSING/);
  assert.doesNotMatch(strategicCall.contents, /Upstream Lead Qualification/);
});

test('Group B5 & E (Scenario E): Regenerated summary (v1 -> v2) selects latest valid v2 and preserves historical v1 assessment & snapshot', async () => {
  const pipeId = 'PIPE_CRT_REGEN';
  const v1Summary = buildReadySummaryPayload(pipeId, 1, 'hash-v1', ' [FIRST VERSION]');
  const v2Summary = buildReadySummaryPayload(pipeId, 2, 'hash-v2', ' [REGENERATED SECOND VERSION]');

  const harness = loadEdgeHarness({
    db: {
      pipeline_opportunities: [
        {
          pipeline_id: pipeId,
          source: 'Created',
          opportunity_name: 'Enterprise AI Operations',
          customer_name: 'Vertex Energy',
          industry_id: 'IND_Manufacturing',
          revenue_motion_id: 'RM01_Digital_Solution_Selling',
          deal_value: 520000,
          currency: 'USD'
        }
      ],
      pipeline_opportunity_handover_details: [
        {
          id: 'HND_REGEN',
          pipeline_id: pipeId,
          source: 'Created',
          summary_status: 'READY',
          summary_version: 1,
          summary_input_hash: 'hash-v1',
          initial_opportunity_context_summary: v1Summary,
          summary_history: []
        }
      ],
      pipeline_evidence: buildSampleEvidence(pipeId)
    }
  });

  // Assessment #1 with summary v1
  const res1 = await harness.invoke({
    action: 'run-pipeline-assessment',
    pipeline_id: pipeId
  });
  assert.equal(res1.status, 200);
  assert.equal(res1.json.sequence, 1);
  assert.equal(res1.json.initial_intelligence_provenance.summary_version, 1);
  const assessIdV1 = res1.json.assessment_id;

  // Now simulate summary regeneration to v2 on the SAME day
  harness.db.pipeline_opportunity_handover_details[0] = {
    ...harness.db.pipeline_opportunity_handover_details[0],
    summary_version: 2,
    summary_input_hash: 'hash-v2',
    initial_opportunity_context_summary: v2Summary,
    summary_history: [{ version: 1, input_hash: 'hash-v1', summary: v1Summary }]
  };

  // Assessment #2 with summary v2 (same calendar day!)
  const res2 = await harness.invoke({
    action: 'run-pipeline-assessment',
    pipeline_id: pipeId
  });
  assert.equal(res2.status, 200);
  assert.equal(res2.json.sequence, 2);
  assert.equal(res2.json.initial_intelligence_provenance.summary_version, 2);

  // Verify BOTH assessments and BOTH snapshots remain intact and distinguishable!
  assert.equal(harness.db.pipeline_assessments.length, 2);
  assert.equal(harness.db.pipeline_assessment_snapshots.length, 2);

  const v1Row = harness.db.pipeline_assessments.find((a) => a.assessment_id === assessIdV1);
  const v2Row = harness.db.pipeline_assessments.find((a) => a.assessment_id === res2.json.assessment_id);
  assert.ok(v1Row && v2Row);
  assert.equal(v1Row.initial_intelligence_summary_version, 1);
  assert.equal(v2Row.initial_intelligence_summary_version, 2);

  // Verify retrieve-assessment on v1 still works cleanly
  const retrievedV1 = await harness.invoke({
    action: 'retrieve-assessment',
    pipeline_id: pipeId,
    assessment_id: assessIdV1
  });
  assert.equal(retrievedV1.status, 200);
  assert.equal(retrievedV1.json.opportunity_source_category, 'Created');
  assert.equal(retrievedV1.json.initial_intelligence_provenance.summary_version, 1);

  // Latest Gemini prompt received v2 content
  const lastStrategic = [...harness.geminiCalls]
    .reverse()
    .find((c) => String(c.contents).includes('LAYER 1: INITIAL OPPORTUNITY INTELLIGENCE'));
  assert.match(lastStrategic.contents, /Summary Version: v2/);
  assert.match(lastStrategic.contents, /REGENERATED SECOND VERSION/);
});

// ============================================================================
// TEST GROUP C: SOURCE CATEGORY INTEGRITY & CLIENT OVERRIDE PREVENTION
// ============================================================================

test('Group C3/C4: Missing or unsupported source category returns 422 without guessing even when data exists', async () => {
  const pipeMissing = 'PIPE_MISSING_SRC';
  const pipeUnsupported = 'PIPE_BAD_SRC';

  const harness = loadEdgeHarness({
    db: {
      pipeline_opportunities: [
        {
          pipeline_id: pipeMissing,
          source: null,
          opportunity_name: 'Missing Source Deal',
          customer_name: 'NoSource Corp'
        },
        {
          pipeline_id: pipeUnsupported,
          source: 'External_Partner_Feed',
          opportunity_name: 'Bad Source Deal',
          customer_name: 'BadSource Corp'
        }
      ],
      pipeline_inheritance: [
        { inheritance_id: 'INH_M', pipeline_id: pipeMissing, qualification_score: 85 }
      ],
      pipeline_opportunity_handover_details: [
        {
          id: 'HND_U',
          pipeline_id: pipeUnsupported,
          summary_status: 'READY',
          initial_opportunity_context_summary: buildReadySummaryPayload(pipeUnsupported, 1, 'h')
        }
      ]
    }
  });

  const missingRes = await harness.invoke({
    action: 'run-pipeline-assessment',
    pipeline_id: pipeMissing,
    source: 'Inherited' // Client tries to supply source when DB is missing
  });
  assert.equal(missingRes.status, 422);
  assert.equal(missingRes.json.code, 'MISSING_SOURCE_CATEGORY');
  assert.equal(harness.geminiCalls.length, 0);

  const unsupportedRes = await harness.invoke({
    action: 'run-pipeline-assessment',
    pipeline_id: pipeUnsupported
  });
  assert.equal(unsupportedRes.status, 422);
  assert.equal(unsupportedRes.json.code, 'UNSUPPORTED_SOURCE_CATEGORY');
  assert.equal(harness.geminiCalls.length, 0);
});

test('Group C5: Client-supplied conflicting source category cannot override persisted DB source', async () => {
  const pipeInh = 'PIPE_GUARD_INH';
  const pipeCrt = 'PIPE_GUARD_CRT';

  const harness = loadEdgeHarness({
    db: {
      pipeline_opportunities: [
        {
          pipeline_id: pipeInh,
          source: 'Inherited',
          opportunity_name: 'Inherited Guard Deal',
          customer_name: 'GuardOne Inc',
          industry_id: 'IND_Manufacturing',
          revenue_motion_id: 'RM01_Digital_Solution_Selling',
          deal_value: 250000
        },
        {
          pipeline_id: pipeCrt,
          source: 'Created',
          opportunity_name: 'Created Guard Deal',
          customer_name: 'GuardTwo Inc',
          industry_id: 'IND_Manufacturing',
          revenue_motion_id: 'RM01_Digital_Solution_Selling',
          deal_value: 250000
        }
      ],
      pipeline_inheritance: [
        {
          inheritance_id: 'INH_GUARD',
          pipeline_id: pipeInh,
          qualification_decision: 'QUALIFIED',
          qualification_score: 81,
          qualification_confidence: 80,
          inherited_payload: { note: 'Authoritative Inherited Payload' }
        }
      ],
      pipeline_opportunity_handover_details: [
        {
          id: 'HND_GUARD',
          pipeline_id: pipeCrt,
          source: 'Created',
          summary_status: 'READY',
          summary_version: 1,
          initial_opportunity_context_summary: buildReadySummaryPayload(pipeCrt, 1, 'h-guard')
        }
      ],
      pipeline_evidence: [...buildSampleEvidence(pipeInh), ...buildSampleEvidence(pipeCrt)]
    }
  });

  // Client claims "Created" on persisted "Inherited" deal
  const resInh = await harness.invoke({
    action: 'run-pipeline-assessment',
    pipeline_id: pipeInh,
    source: 'Created',
    opportunity_source_category: 'Created'
  });
  assert.equal(resInh.status, 200);
  assert.equal(resInh.json.opportunity_source_category, 'Inherited');
  assert.equal(
    resInh.json.initial_intelligence_provenance.initial_intelligence_source_type,
    'inherited_lead_qualification'
  );
  assert.equal(resInh.json.initial_intelligence_provenance.client_override_ignored, true);

  // Client claims "Inherited" on persisted "Created" deal
  const resCrt = await harness.invoke({
    action: 'run-pipeline-assessment',
    pipeline_id: pipeCrt,
    source: 'Inherited',
    opportunity_source_category: 'Inherited'
  });
  assert.equal(resCrt.status, 200);
  assert.equal(resCrt.json.opportunity_source_category, 'Created');
  assert.equal(
    resCrt.json.initial_intelligence_provenance.initial_intelligence_source_type,
    'initial_opportunity_context_summary'
  );
  assert.equal(resCrt.json.initial_intelligence_provenance.client_override_ignored, true);
});

// ============================================================================
// TEST GROUP D: METHODOLOGY CONSISTENCY (ZERO SOURCE BIAS)
// ============================================================================

test('Group D: Identical evidence yields identical PADF scores, Winability, Risk Penalty, and Health across Inherited vs Created', async () => {
  const pipeInh = 'PIPE_EQ_INH';
  const pipeCrt = 'PIPE_EQ_CRT';

  const harness = loadEdgeHarness({
    db: {
      pipeline_opportunities: [
        {
          pipeline_id: pipeInh,
          source: 'Inherited',
          opportunity_name: 'Parity Assessment Deal',
          customer_name: 'Parity Corp',
          industry_id: 'IND_Manufacturing',
          revenue_motion_id: 'RM01_Digital_Solution_Selling',
          deal_value: 300000,
          currency: 'USD'
        },
        {
          pipeline_id: pipeCrt,
          source: 'Created',
          opportunity_name: 'Parity Assessment Deal',
          customer_name: 'Parity Corp',
          industry_id: 'IND_Manufacturing',
          revenue_motion_id: 'RM01_Digital_Solution_Selling',
          deal_value: 300000,
          currency: 'USD'
        }
      ],
      pipeline_inheritance: [
        {
          inheritance_id: 'INH_EQ',
          pipeline_id: pipeInh,
          qualification_decision: 'QUALIFIED',
          qualification_score: 88,
          qualification_confidence: 85,
          inherited_payload: { note: 'Qualified SQL' }
        }
      ],
      pipeline_opportunity_handover_details: [
        {
          id: 'HND_EQ',
          pipeline_id: pipeCrt,
          source: 'Created',
          summary_status: 'READY',
          summary_version: 1,
          initial_opportunity_context_summary: buildReadySummaryPayload(pipeCrt, 1, 'h-eq')
        }
      ],
      pipeline_evidence: [...buildSampleEvidence(pipeInh), ...buildSampleEvidence(pipeCrt)]
    }
  });

  const rInh = await harness.invoke({
    action: 'run-pipeline-assessment',
    pipeline_id: pipeInh
  });
  const rCrt = await harness.invoke({
    action: 'run-pipeline-assessment',
    pipeline_id: pipeCrt
  });

  assert.equal(rInh.status, 200);
  assert.equal(rCrt.status, 200);

  // Exact deterministic parity across all authoritative scores
  assert.equal(rInh.json.base_winability, rCrt.json.base_winability);
  assert.equal(rInh.json.risk_penalty, rCrt.json.risk_penalty);
  assert.equal(rInh.json.risk_adjusted_winability, rCrt.json.risk_adjusted_winability);
  assert.equal(rInh.json.pipeline_health, rCrt.json.pipeline_health);
  assert.equal(rInh.json.assessment_confidence, rCrt.json.assessment_confidence);

  const scoresInh = rInh.json.padf_results.map((p: any) => ({
    id: p.dimension_id,
    score: p.dimension_score,
    state: p.assessment_state
  }));
  const scoresCrt = rCrt.json.padf_results.map((p: any) => ({
    id: p.dimension_id,
    score: p.dimension_score,
    state: p.assessment_state
  }));
  assert.deepEqual(scoresInh, scoresCrt);
});

// ============================================================================
// TEST GROUP F: SECURITY AUTHORIZATION & PRE-MIGRATION FALLBACK REGRESSION
// ============================================================================

test('Group F: Ownership authorization (401/403/200) and pre-migration provenance fallback work cleanly', async () => {
  const pipeId = 'PIPE_AUTH_CRT';
  const harness = loadEdgeHarness({
    failAssessmentInsertWithSchemaError: true,
    authUsers: {
      'owner.jwt.token': { id: 'user-owner', email: 'owner@revos.io' },
      'other.jwt.token': { id: 'user-other', email: 'other@revos.io' }
    },
    db: {
      pipeline_opportunities: [
        {
          pipeline_id: pipeId,
          source: 'Created',
          created_by: 'user-owner',
          owner_email: 'owner@revos.io',
          opportunity_name: 'Secured Created Opp',
          customer_name: 'Shield Logistics',
          industry_id: 'IND_Manufacturing',
          revenue_motion_id: 'RM01_Digital_Solution_Selling',
          deal_value: 200000
        }
      ],
      pipeline_opportunity_handover_details: [
        {
          id: 'HND_AUTH',
          pipeline_id: pipeId,
          source: 'Created',
          summary_status: 'READY',
          summary_version: 1,
          initial_opportunity_context_summary: buildReadySummaryPayload(pipeId, 1, 'h-auth')
        }
      ],
      pipeline_evidence: buildSampleEvidence(pipeId)
    }
  });

  // Unauthenticated request blocked on user-owned opportunity
  const unauthRes = await harness.invoke({
    action: 'run-pipeline-assessment',
    pipeline_id: pipeId
  });
  assert.equal(unauthRes.status, 401);

  // Cross-user request blocked
  const crossRes = await harness.invoke(
    { action: 'run-pipeline-assessment', pipeline_id: pipeId },
    { authorization: 'Bearer other.jwt.token' }
  );
  assert.equal(crossRes.status, 403);

  // Owner succeeds even when SQL migration 20261122_pipeline_assessments_source_provenance hasn't been applied yet
  const okRes = await harness.invoke(
    { action: 'run-pipeline-assessment', pipeline_id: pipeId },
    { authorization: 'Bearer owner.jwt.token' }
  );
  assert.equal(okRes.status, 200);
  assert.equal(okRes.json.opportunity_source_category, 'Created');
  assert.equal(
    okRes.json.assessment.raw_reasoning_output.initial_intelligence_provenance
      .initial_intelligence_source_type,
    'initial_opportunity_context_summary'
  );
  assert.equal(
    harness.db.pipeline_assessment_snapshots[0].full_snapshot_payload.assessment
      .opportunity_source_category,
    'Created'
  );
});
