import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {
  resolveCanvasColumn,
  isCreatedOpportunityReadyForCanvas,
  normalizePipelineStage,
  resolveStrictPipelineStageCandidate,
  resolveSnapshotContributionPipelineStage
} from '../src/apps/revos/pipeline/services/pipelinePortfolioLoader';

test('resolveCanvasColumn maps every Pipeline Stage option across the 4 Pipeline Canvas columns', () => {
  // Column 1: Initial Pipeline
  assert.equal(resolveCanvasColumn({ pipeline_stage: 'Qualification' }), 'Initial Pipeline');
  assert.equal(resolveCanvasColumn({ pipeline_stage: 'Discovery' }), 'Initial Pipeline');
  assert.equal(resolveCanvasColumn({ pipeline_stage: 'Solution Development' }), 'Initial Pipeline');

  // Column 2: Proposal/Evaluation
  assert.equal(resolveCanvasColumn({ pipeline_stage: 'Proposal' }), 'Proposal/Evaluation');
  assert.equal(resolveCanvasColumn({ pipeline_stage: 'Evaluation' }), 'Proposal/Evaluation');

  // Column 3: Negotiation/Commit
  assert.equal(resolveCanvasColumn({ pipeline_stage: 'Negotiation' }), 'Negotiation/Commit');
  assert.equal(resolveCanvasColumn({ pipeline_stage: 'Commit' }), 'Negotiation/Commit');

  // Column 4: Closed (both stage string and lifecycle status)
  assert.equal(resolveCanvasColumn({ pipeline_stage: 'Closed Won' }), 'Closed');
  assert.equal(resolveCanvasColumn({ pipeline_stage: 'Closed Lost' }), 'Closed');
  assert.equal(
    resolveCanvasColumn({
      pipeline_stage: 'Proposal',
      pipeline_opp: { lifecycle_status: 'CLOSED_WON' } as any
    }),
    'Closed'
  );
  assert.equal(
    resolveCanvasColumn({
      pipeline_stage: 'Negotiation',
      pipeline_opp: { lifecycle_status: 'CLOSED_LOST' } as any
    }),
    'Closed'
  );
});

test('normalizePipelineStage preserves Created opportunity stage values cleanly', () => {
  assert.equal(normalizePipelineStage('Proposal', 'ACTIVE'), 'Proposal');
  assert.equal(normalizePipelineStage('Evaluation', 'ACTIVE'), 'Evaluation');
  assert.equal(normalizePipelineStage('Negotiation', 'ACTIVE'), 'Negotiation');
  assert.equal(normalizePipelineStage('Commit', 'ACTIVE'), 'Commit');
  assert.equal(normalizePipelineStage('Closed Won', 'CLOSED_WON'), 'Closed Won');
  assert.equal(normalizePipelineStage('Closed Lost', 'CLOSED_LOST'), 'Closed Lost');
  assert.equal(normalizePipelineStage(undefined, 'ACTIVE', 'Negotiation'), 'Negotiation');
});

test('isCreatedOpportunityReadyForCanvas hides drafts/failed summaries and reveals opportunities once summary is READY', () => {
  const opp = { pipeline_id: 'PIPE_DIRECT_TEST_1' };

  assert.equal(
    isCreatedOpportunityReadyForCanvas(opp, { summary_status: 'NOT_GENERATED' }),
    false
  );
  assert.equal(
    isCreatedOpportunityReadyForCanvas(opp, { summary_status: 'GENERATING' }),
    false
  );
  assert.equal(
    isCreatedOpportunityReadyForCanvas(opp, { summary_status: 'FAILED' }),
    false
  );

  // Ready when summary generation succeeds
  assert.equal(
    isCreatedOpportunityReadyForCanvas(opp, { summary_status: 'READY' }),
    true
  );

  // Ready when summary payload exists even if legacy schema omitted summary_status
  assert.equal(
    isCreatedOpportunityReadyForCanvas(opp, {
      summary_status: 'NOT_GENERATED',
      initial_opportunity_context_summary: {
        summary_sections: { opportunity_overview: 'Generated summary text' }
      }
    }),
    true
  );

  // Ready when assessed or when no handover row exists (legacy rows / fallback)
  assert.equal(isCreatedOpportunityReadyForCanvas(opp, null), true);
  assert.equal(
    isCreatedOpportunityReadyForCanvas(
      { ...opp, latest_assessment: { assessment_id: 'ASSESS_1' } as any },
      { summary_status: 'FAILED' }
    ),
    true
  );
});

test('OpportunityCreationForm renders InitialOpportunityContextSummary directly below the form card and refreshes canvas on READY', () => {
  const formPath = path.resolve(
    process.cwd(),
    'src/apps/revos/pipeline/components/OpportunityCreationForm.tsx'
  );
  const summaryPath = path.resolve(
    process.cwd(),
    'src/apps/revos/pipeline/components/InitialOpportunityContextSummary.tsx'
  );

  const formSrc = fs.readFileSync(formPath, 'utf8');
  const summarySrc = fs.readFileSync(summaryPath, 'utf8');

  assert.ok(summarySrc.includes('SUMMARY_CATEGORY_ORDER'), 'Summary component defines 10 categories');
  assert.ok(
    summarySrc.includes('resolveCanvasColumn'),
    'Summary component resolves target Pipeline Canvas column from pipeline stage'
  );
  assert.ok(
    formSrc.includes('<InitialOpportunityContextSummary'),
    'OpportunityCreationForm renders InitialOpportunityContextSummary component'
  );
  assert.ok(
    formSrc.includes('invalidatePipelinePortfolioCache()') &&
      formSrc.includes('PipelineDataService.emitPortfolioUpdated()'),
    'OpportunityCreationForm invalidates and emits portfolio update after summary generation'
  );
  // Ensure summary is placed below the Section E block and Form Actions Footer (not trapped inside activeSection === 'E')
  const sectionEIdx = formSrc.indexOf("activeSection === 'E'");
  const footerIdx = formSrc.indexOf('Form Actions Footer');
  const summaryMountIdx = formSrc.indexOf('ref={summarySectionRef}');
  assert.ok(
    sectionEIdx > 0 && footerIdx > sectionEIdx && summaryMountIdx > footerIdx,
    `Expected summary mount (${summaryMountIdx}) below footer (${footerIdx}) and Section E (${sectionEIdx})`
  );
  assert.ok(
    summarySrc.includes('onClick={() => onSaveSummary(activeSummary, activeVersionNumber)}') &&
      summarySrc.includes('<span>Save</span>'),
    'InitialOpportunityContextSummary renders manual Save button wired to onSaveSummary'
  );

  const servicePath = path.resolve(
    process.cwd(),
    'src/apps/revos/pipeline/services/PipelineDataService.ts'
  );
  const serviceSrc = fs.readFileSync(servicePath, 'utf8');
  assert.ok(
    serviceSrc.includes('static async saveInitialOpportunityContextSummary(') &&
      formSrc.includes('onSaveSummary={handleSaveSummary}'),
    'PipelineDataService and OpportunityCreationForm expose manual summary Save persistence'
  );

  // Locked Industry & Revenue Motion displayed above summary content and synced to Assessment reasoning & SQL
  assert.ok(
    summarySrc.includes('Locked Assessment Classification Context') &&
      summarySrc.includes('aria-label="Locked Industry"') &&
      summarySrc.includes('aria-label="Locked Revenue Motion"') &&
      summarySrc.includes('readOnly') &&
      summarySrc.includes('disabled'),
    'InitialOpportunityContextSummary displays locked Industry and Revenue Motion retrieved from OpportunityCreationForm'
  );
  assert.ok(
    formSrc.includes('industry={industry}') && formSrc.includes('revenueMotion={revenueMotion}'),
    'OpportunityCreationForm passes Industry and Revenue Motion props to InitialOpportunityContextSummary'
  );

  const edgeSrc = fs.readFileSync(
    path.resolve(process.cwd(), 'supabase/functions/pipeline-assessment/index.ts'),
    'utf8'
  );
  assert.ok(
    edgeSrc.includes('Locked Industry Classification:') &&
      edgeSrc.includes('Locked Revenue Motion Classification:') &&
      edgeSrc.includes('summaryMetaForClassification'),
    'Pipeline Assessment Gemini reasoning consumes locked Industry and Revenue Motion from Initial Opportunity Context Summary'
  );

  const sqlSrc = fs.readFileSync(
    path.resolve(
      process.cwd(),
      'supabase/migrations/20261123_pipeline_summary_industry_revenue_motion.sql'
    ),
    'utf8'
  );
  assert.ok(
    sqlSrc.includes('ADD COLUMN IF NOT EXISTS industry TEXT') &&
      sqlSrc.includes('ADD COLUMN IF NOT EXISTS revenue_motion TEXT') &&
      sqlSrc.includes('ENABLE ROW LEVEL SECURITY') &&
      sqlSrc.includes('GRANT SELECT, INSERT, UPDATE, DELETE ON public.pipeline_opportunity_handover_details'),
    'SQL migration adds Industry and Revenue Motion columns with Post-May 2026 GRANTs and RLS'
  );
});

test('Assessment Workspace renders InitialOpportunityContextSummary for Created source and hides OpportunityHandoverDetail & SWOT Factor Matrix while keeping Inherited unchanged', () => {
  const workspacePath = path.resolve(
    process.cwd(),
    'src/apps/revos/pipeline/components/opportunity-to-pipeline.tsx'
  );
  const summaryPath = path.resolve(
    process.cwd(),
    'src/apps/revos/pipeline/components/InitialOpportunityContextSummary.tsx'
  );

  const workspaceSrc = fs.readFileSync(workspacePath, 'utf8');
  const summarySrc = fs.readFileSync(summaryPath, 'utf8');

  assert.ok(
    workspaceSrc.includes('const resolveIsCreatedSource =') &&
      workspaceSrc.includes("rawSource === 'created'") &&
      workspaceSrc.includes("opp?.source_system === 'RevOS_Pipeline_Direct_Creation'"),
    'OpportunityToPipeline derives Created vs Inherited source consistently'
  );

  const branchIdx = workspaceSrc.indexOf('{isCreatedSource ? (');
  const elseIdx = workspaceSrc.indexOf(') : (', branchIdx);
  const pipelineFormIdx = workspaceSrc.indexOf('<PipelineForm', elseIdx);

  assert.ok(
    branchIdx > 0 && elseIdx > branchIdx && pipelineFormIdx > elseIdx,
    'Expected {isCreatedSource ? ... : ...} conditional block directly before <PipelineForm />'
  );

  const createdBranch = workspaceSrc.slice(branchIdx, elseIdx);
  const inheritedBranch = workspaceSrc.slice(elseIdx, pipelineFormIdx);

  assert.ok(
    createdBranch.includes('<InitialOpportunityContextSummary') &&
      !createdBranch.includes('<OpportunityHandoverDetail') &&
      !createdBranch.includes('SWOT Factor Matrix'),
    'Created branch renders InitialOpportunityContextSummary and does NOT render OpportunityHandoverDetail or SWOT Factor Matrix'
  );

  assert.ok(
    inheritedBranch.includes('<OpportunityHandoverDetail') &&
      inheritedBranch.includes('SWOT Factor Matrix') &&
      !inheritedBranch.includes('<InitialOpportunityContextSummary'),
    'Inherited branch preserves OpportunityHandoverDetail and SWOT Factor Matrix unchanged'
  );

  assert.ok(
    summarySrc.includes("summaryStatus === 'NOT_GENERATED'") &&
      summarySrc.includes('Generate Summary'),
    'InitialOpportunityContextSummary gracefully handles NOT_GENERATED status if opened in workspace'
  );
});

test('Pipeline Form Item 11 retrieves Product/Solution by source and Assessment Workspace has no Opportunity Register tab', () => {
  const serviceSrc = fs.readFileSync(
    path.resolve(process.cwd(), 'src/apps/revos/pipeline/services/PipelineDataService.ts'),
    'utf8'
  );
  const pipelineFormSrc = fs.readFileSync(
    path.resolve(process.cwd(), 'src/apps/revos/pipeline/components/PipelineForm.tsx'),
    'utf8'
  );
  const summarySrc = fs.readFileSync(
    path.resolve(
      process.cwd(),
      'src/apps/revos/pipeline/components/InitialOpportunityContextSummary.tsx'
    ),
    'utf8'
  );
  const workspaceSrc = fs.readFileSync(
    path.resolve(process.cwd(), 'src/apps/revos/pipeline/components/opportunity-to-pipeline.tsx'),
    'utf8'
  );

  // 1. Item 11 Product/Solution retrieval for Inherited vs Created
  assert.ok(
    serviceSrc.includes('upstreamForm.product_solution') &&
      serviceSrc.includes('sqlEditable.product_solution') &&
      serviceSrc.includes('if (isCreatedSource && !resolvedProduct)') &&
      serviceSrc.includes('initial_opportunity_context?.proposed_solution') &&
      serviceSrc.includes('product_solution: initialContextPayload.proposed_solution || null'),
    'PipelineDataService resolves Item 11 Product/Solution from upstream Product/Solution (Inherited) and Proposed Solution / Offering (Created)'
  );
  assert.ok(
    pipelineFormSrc.includes('Retrieved from Proposed Solution / Offering (Opportunity Creation Form)') &&
      pipelineFormSrc.includes('opportunity.updated_at') &&
      pipelineFormSrc.includes(
        'Update and calibrate deal parameters inherited from Opportunity Creation. All changes are stored directly in the Supabase database.'
      ) &&
      pipelineFormSrc.includes('Inherited from Opportunity Creation') &&
      pipelineFormSrc.includes('Inherited from Opportunity Qualification'),
    'PipelineForm refreshes on opportunity updates and renders Source-aware header copy and Item 11 provenance'
  );

  // 2. Opportunity Register tab & embedded form removed from Assessment Workspace
  assert.ok(
    !summarySrc.includes('Opportunity Register') &&
      !summarySrc.includes('enableOpportunityRegisterTab'),
    'InitialOpportunityContextSummary does not render Opportunity Register tab'
  );
  assert.ok(
    !workspaceSrc.includes('OpportunityCreationForm') &&
      !workspaceSrc.includes('enableOpportunityRegisterTab'),
    'Assessment Workspace does not embed Opportunity Register tab or OpportunityCreationForm'
  );
});

test('Historical Portfolio Snapshot Section C stage resolution strictly sticks to Pipeline Stage and rejects Assessment Completed / Opportunity Stage values', () => {
  // Rejects non-Pipeline-Stage placeholders and Opportunity Stage values
  assert.equal(resolveStrictPipelineStageCandidate('Assessment Completed'), undefined);
  assert.equal(resolveStrictPipelineStageCandidate('Evidence Populated'), undefined);
  assert.equal(resolveStrictPipelineStageCandidate('Active Assessment'), undefined);
  assert.equal(resolveStrictPipelineStageCandidate('Emerging Opportunity'), undefined);
  assert.equal(resolveStrictPipelineStageCandidate('Validated Opportunity'), undefined);
  assert.equal(resolveStrictPipelineStageCandidate(''), undefined);

  // Accepts canonical Pipeline Stages and normalizes legacy compound labels
  assert.equal(resolveStrictPipelineStageCandidate('Solution Development'), 'Solution Development');
  assert.equal(resolveStrictPipelineStageCandidate('Discovery'), 'Discovery');
  assert.equal(resolveStrictPipelineStageCandidate('Negotiation'), 'Negotiation');
  assert.equal(resolveStrictPipelineStageCandidate('Discovery & Solutioning'), 'Discovery');
  assert.equal(resolveStrictPipelineStageCandidate('Proposal & Negotiation'), 'Proposal');

  // Legacy snapshot containing 'Assessment Completed' falls back to canonical item pipeline_stage
  assert.equal(
    resolveSnapshotContributionPipelineStage('Assessment Completed', 'Negotiation', 'ACTIVE'),
    'Negotiation'
  );
  // Valid historical snapshot stage is preserved at observation point
  assert.equal(
    resolveSnapshotContributionPipelineStage('Proposal', 'Negotiation', 'ACTIVE'),
    'Proposal'
  );
  // Never leaks Opportunity Stage if both snapshot and item stage are invalid
  assert.equal(
    resolveSnapshotContributionPipelineStage('Assessment Completed', 'Emerging Opportunity', 'ACTIVE'),
    'Qualification'
  );

  const evolutionSrc = fs.readFileSync(
    path.resolve(
      process.cwd(),
      'src/apps/revos/pipeline/components/PipelineWinabilityEvolutionSection.tsx'
    ),
    'utf8'
  );
  assert.ok(
    !evolutionSrc.includes('snapOpp?.sales_stage') &&
      !evolutionSrc.includes('ol.item.opportunity_stage') &&
      evolutionSrc.includes('resolveStrictPipelineStageCandidate(snapOpp?.pipeline_stage)') &&
      evolutionSrc.includes('resolveSnapshotContributionPipelineStage('),
    'PipelineWinabilityEvolutionSection strictly enforces Pipeline Stage without sales_stage/opportunity_stage fallback'
  );
});
