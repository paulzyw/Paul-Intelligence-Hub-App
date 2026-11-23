import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const readWorkspaceFile = (relPath: string) =>
  fs.readFileSync(path.resolve(process.cwd(), relPath), 'utf8');

test('OpportunityCreationForm provides Close button in header and footer wired to handleCloseForm', () => {
  const formSrc = readWorkspaceFile('src/apps/revos/pipeline/components/OpportunityCreationForm.tsx');

  assert.ok(
    formSrc.includes('const handleCloseForm = () =>'),
    'Expected handleCloseForm handler in OpportunityCreationForm'
  );
  const closeClicks = (formSrc.match(/onClick=\{handleCloseForm\}/g) || []).length;
  assert.ok(
    closeClicks >= 2,
    `Expected at least 2 Close button triggers (header and footer), found ${closeClicks}`
  );
  assert.ok(
    formSrc.includes("localStorage.setItem('revos_latest_created_draft_id', savedPipelineId)"),
    'Closing form with an unsubmitted draft preserves latest draft pointer for resume'
  );
});

test('OpportunityCreationForm enables section-by-section Save on partial input while keeping Submit strictly gated', () => {
  const formSrc = readWorkspaceFile('src/apps/revos/pipeline/components/OpportunityCreationForm.tsx');

  assert.ok(
    formSrc.includes('const isSaveEnabled = hasAnySaveableInput && !saving && !submittingSummary;'),
    'Save button should allow saving any entered section without forcing all 14 required fields first'
  );
  assert.ok(
    formSrc.includes('Save Section ${activeSection}'),
    'Save button label reflects saving the active section when form is still incomplete'
  );
  assert.ok(
    formSrc.includes(
      'const isSubmitEnabled =\n    validation.allComplete &&\n    Boolean(savedPipelineId) &&\n    !hasUnsavedChanges'
    ),
    'Submit button remains gated until all required sections are completed and saved'
  );
  assert.ok(
    formSrc.includes('savedSections.includes(sec.key)'),
    'Section tabs render saved indicator badge for sections already persisted'
  );
});

test('OpportunityCreationForm waits for authLoading and hydrates saved drafts without clobbering blank fields', () => {
  const formSrc = readWorkspaceFile('src/apps/revos/pipeline/components/OpportunityCreationForm.tsx');

  assert.ok(
    formSrc.includes('const { user, profile, loading: authLoading } = useAuth();'),
    'Destructures authLoading from useAuth()'
  );
  assert.ok(
    formSrc.includes('if (authLoading || draftBootstrappedRef.current) return;'),
    'Draft auto-resumption waits until authLoading finishes'
  );
  assert.ok(
    formSrc.includes("setIndustry(nextIndustry);") &&
      formSrc.includes("const nextIndustry = ctx.industry || '';"),
    'Hydration restores blank fields as empty strings so user can continue completing them'
  );
  assert.ok(
    formSrc.includes('setActiveSection(draft.last_saved_section || \'E\')'),
    'Hydration navigates to first incomplete section or last saved section'
  );
});

test('PipelineModule cleans create and draftId query params when closing OpportunityCreationForm', () => {
  const moduleSrc = readWorkspaceFile('src/apps/revos/pipeline/PipelineModule.tsx');

  assert.ok(
    moduleSrc.includes("nextParams.delete('create');") &&
      moduleSrc.includes("nextParams.delete('draftId');"),
    'Closing creation form clears create and draftId URL search params'
  );
});

test('PipelineDataService supports partial section-by-section draft persistence and READY filtering', () => {
  const serviceSrc = readWorkspaceFile('src/apps/revos/pipeline/services/PipelineDataService.ts');

  assert.ok(
    serviceSrc.includes("const dbCompanyName = initialContextPayload.company_name || 'Draft Account';") &&
      serviceSrc.includes(
        "const dbOpportunityName = initialContextPayload.opportunity_name || 'Draft Opportunity';"
      ),
    'Database NOT NULL columns fall back cleanly for partial section saves while keeping initial_context strings intact'
  );
  assert.ok(
    serviceSrc.includes("form_status: isDraftSave ? 'Draft' : 'Saved'"),
    'Persists Draft form_status when saving incomplete sections'
  );
  assert.ok(
    serviceSrc.includes('static async listCreatedOpportunityDrafts(') &&
      serviceSrc.includes('static async getCreatedOpportunityDraft(') &&
      serviceSrc.includes('static clearCreatedOpportunityDraftCache('),
    'Exposes draft listing, retrieval, and cleanup methods on PipelineDataService'
  );
  assert.ok(
    serviceSrc.includes('const excludedPipelineIds = new Set<string>();') &&
      serviceSrc.includes("parsed.summary_status !== 'READY'"),
    'Excludes already-READY or non-owned drafts from localStorage fallback merge'
  );
});
