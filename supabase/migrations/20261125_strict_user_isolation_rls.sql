-- ==============================================================================
-- Migration: 20261125_strict_user_isolation_rls.sql
-- Purpose: Enforce strict per-user multi-tenant ownership & Row Level Security
--          across GTMOS, Lead Qualification (MQL/SQL/OQ), and Pipeline Assessment.
--          - No privileged role / super_admin cross-user bypass.
--          - Revokes anonymous access to all private RevOS business tables.
--          - Backfills existing unowned records to paul.zy.wang@hotmail.com via
--            dynamic auth.users lookup; future rows default to auth.uid().
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. ADD OWNERSHIP COLUMNS & DEFAULTS ON ROOT / STANDALONE TABLES
-- ------------------------------------------------------------------------------

DO $$
BEGIN
  IF to_regclass('public.revos_gtmos_strategies') IS NOT NULL THEN
    ALTER TABLE public.revos_gtmos_strategies
      ADD COLUMN IF NOT EXISTS creator_id UUID REFERENCES auth.users(id) ON DELETE CASCADE DEFAULT auth.uid();
    ALTER TABLE public.revos_gtmos_strategies
      ALTER COLUMN creator_id SET DEFAULT auth.uid();
    CREATE INDEX IF NOT EXISTS idx_revos_gtmos_strategies_creator_id
      ON public.revos_gtmos_strategies(creator_id);
  END IF;
END $$;

ALTER TABLE public.mql_campaigns
  ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id) ON DELETE CASCADE DEFAULT auth.uid();
CREATE INDEX IF NOT EXISTS idx_mql_campaigns_created_by ON public.mql_campaigns(created_by);

ALTER TABLE public.mql_leads
  ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id) ON DELETE CASCADE DEFAULT auth.uid();
CREATE INDEX IF NOT EXISTS idx_mql_leads_created_by ON public.mql_leads(created_by);

DO $$
BEGIN
  IF to_regclass('public.mql_sql_promotions') IS NOT NULL THEN
    ALTER TABLE public.mql_sql_promotions
      ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id) ON DELETE CASCADE DEFAULT auth.uid();
    CREATE INDEX IF NOT EXISTS idx_mql_sql_promotions_created_by
      ON public.mql_sql_promotions(created_by);
  END IF;
END $$;

ALTER TABLE public.opportunities
  ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id) ON DELETE CASCADE DEFAULT auth.uid();
ALTER TABLE public.opportunities
  ALTER COLUMN created_by SET DEFAULT auth.uid();
CREATE INDEX IF NOT EXISTS idx_opportunities_created_by ON public.opportunities(created_by);

ALTER TABLE public.sql_opportunity_promotions
  ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id) ON DELETE CASCADE DEFAULT auth.uid();
CREATE INDEX IF NOT EXISTS idx_sql_opp_promotions_created_by ON public.sql_opportunity_promotions(created_by);

ALTER TABLE public.opportunity_promotions
  ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id) ON DELETE CASCADE DEFAULT auth.uid();
CREATE INDEX IF NOT EXISTS idx_opportunity_promotions_created_by ON public.opportunity_promotions(created_by);

ALTER TABLE public.qualification_executive_insights
  ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id) ON DELETE CASCADE DEFAULT auth.uid();
CREATE INDEX IF NOT EXISTS idx_qual_exec_insights_created_by ON public.qualification_executive_insights(created_by);

ALTER TABLE public.pipeline_opportunities
  ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id) ON DELETE CASCADE DEFAULT auth.uid();
CREATE INDEX IF NOT EXISTS idx_pipeline_opportunities_created_by ON public.pipeline_opportunities(created_by);

ALTER TABLE public.pipeline_form_records
  ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id) ON DELETE CASCADE DEFAULT auth.uid();
CREATE INDEX IF NOT EXISTS idx_pipeline_form_records_created_by ON public.pipeline_form_records(created_by);

ALTER TABLE public.pipeline_opportunity_handover_details
  ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id) ON DELETE CASCADE DEFAULT auth.uid();
CREATE INDEX IF NOT EXISTS idx_pipeline_handover_created_by ON public.pipeline_opportunity_handover_details(created_by);

ALTER TABLE public.pipeline_revenue_intelligence_reports
  ALTER COLUMN user_id SET DEFAULT auth.uid()::text;

-- ------------------------------------------------------------------------------
-- 2. BACKFILL EXISTING UNOWNED DATA TO paul.zy.wang@hotmail.com
-- ------------------------------------------------------------------------------

DO $$
DECLARE
  v_backfill_user_id UUID;
BEGIN
  SELECT id INTO v_backfill_user_id
  FROM auth.users
  WHERE LOWER(email) = 'paul.zy.wang@hotmail.com'
  ORDER BY created_at ASC
  LIMIT 1;

  IF v_backfill_user_id IS NULL THEN
    RAISE NOTICE 'Backfill target user paul.zy.wang@hotmail.com not found in auth.users; skipping existing-row ownership backfill.';
    RETURN;
  END IF;

  IF to_regclass('public.revos_gtmos_strategies') IS NOT NULL THEN
    UPDATE public.revos_gtmos_strategies
      SET creator_id = v_backfill_user_id
      WHERE creator_id IS NULL;
  END IF;

  UPDATE public.mql_campaigns
    SET created_by = v_backfill_user_id
    WHERE created_by IS NULL;

  UPDATE public.mql_leads
    SET created_by = v_backfill_user_id
    WHERE created_by IS NULL;

  IF to_regclass('public.mql_sql_promotions') IS NOT NULL THEN
    UPDATE public.mql_sql_promotions
      SET created_by = v_backfill_user_id
      WHERE created_by IS NULL;
  END IF;

  UPDATE public.opportunities
    SET created_by = v_backfill_user_id
    WHERE created_by IS NULL;

  UPDATE public.sql_opportunity_promotions
    SET created_by = v_backfill_user_id
    WHERE created_by IS NULL;

  UPDATE public.opportunity_promotions
    SET created_by = v_backfill_user_id
    WHERE created_by IS NULL;

  UPDATE public.qualification_executive_insights
    SET created_by = v_backfill_user_id
    WHERE created_by IS NULL;

  UPDATE public.pipeline_opportunities
    SET created_by = v_backfill_user_id
    WHERE created_by IS NULL;

  UPDATE public.pipeline_form_records
    SET created_by = v_backfill_user_id
    WHERE created_by IS NULL;

  UPDATE public.pipeline_opportunity_handover_details
    SET created_by = v_backfill_user_id
    WHERE created_by IS NULL;

  UPDATE public.pipeline_revenue_intelligence_reports
    SET user_id = v_backfill_user_id::text
    WHERE user_id IS NULL OR user_id = '' OR user_id = 'workspace_default';
END $$;

-- ------------------------------------------------------------------------------
-- 3. REVOKE ANON ACCESS, DROP PERMISSIVE POLICIES & ENABLE RLS ACROSS ALL TABLES
-- ------------------------------------------------------------------------------

DO $$
DECLARE
  v_tables TEXT[] := ARRAY[
    'revos_gtmos_strategies',
    'mql_campaigns',
    'mql_leads',
    'mql_evidence_assessments',
    'mql_qualification_results',
    'mql_sql_promotions',
    'opportunities',
    'sql_assessments',
    'sql_evidence_records',
    'sql_dimension_results',
    'sql_reasoning_sessions',
    'sql_recommendations',
    'sql_opportunity_promotions',
    'opportunity_form_records',
    'opportunity_sql_handover_details',
    'opportunity_qualification_sessions',
    'opportunity_qualification_evidence',
    'opportunity_qualification_results',
    'opportunity_promotions',
    'opportunity_qualification_history',
    'qualification_executive_insights',
    'pipeline_opportunities',
    'pipeline_form_records',
    'pipeline_opportunity_handover_details',
    'pipeline_inheritance',
    'pipeline_evidence',
    'pipeline_evidence_relationships',
    'pipeline_assessments',
    'pipeline_padf_results',
    'pipeline_swot_results',
    'pipeline_risks',
    'pipeline_strategies',
    'pipeline_actions',
    'pipeline_assessment_snapshots',
    'pipeline_revenue_intelligence_reports'
  ];
  v_tbl TEXT;
  v_pol RECORD;
BEGIN
  FOREACH v_tbl IN ARRAY v_tables LOOP
    IF to_regclass('public.' || v_tbl) IS NOT NULL THEN
      EXECUTE format('REVOKE ALL ON TABLE public.%I FROM anon;', v_tbl);
      EXECUTE format('GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.%I TO authenticated;', v_tbl);
      EXECUTE format('GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.%I TO service_role;', v_tbl);
      EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY;', v_tbl);

      FOR v_pol IN
        SELECT policyname
        FROM pg_policies
        WHERE schemaname = 'public' AND tablename = v_tbl
      LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I;', v_pol.policyname, v_tbl);
      END LOOP;

      EXECUTE format(
        'CREATE POLICY "Service role full access" ON public.%I FOR ALL TO service_role USING (true) WITH CHECK (true);',
        v_tbl
      );
    END IF;
  END LOOP;
END $$;

-- ------------------------------------------------------------------------------
-- 4. STRICT OWNER-ONLY AUTHENTICATED RLS POLICIES (ZERO ROLE BYPASS)
-- ------------------------------------------------------------------------------

-- GTMOS Strategies
DO $$
BEGIN
  IF to_regclass('public.revos_gtmos_strategies') IS NOT NULL THEN
    CREATE POLICY "Strict owner access on revos_gtmos_strategies"
      ON public.revos_gtmos_strategies
      FOR ALL TO authenticated
      USING (creator_id = auth.uid())
      WITH CHECK (creator_id = auth.uid());
  END IF;
END $$;

-- MQL Campaigns & Leads
CREATE POLICY "Strict owner access on mql_campaigns"
  ON public.mql_campaigns
  FOR ALL TO authenticated
  USING (created_by = auth.uid())
  WITH CHECK (created_by = auth.uid());

CREATE POLICY "Strict owner access on mql_leads"
  ON public.mql_leads
  FOR ALL TO authenticated
  USING (created_by = auth.uid())
  WITH CHECK (created_by = auth.uid());

CREATE POLICY "Strict owner access on mql_evidence_assessments"
  ON public.mql_evidence_assessments
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.mql_leads l
      WHERE l.id = mql_evidence_assessments.lead_id
        AND l.created_by = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.mql_leads l
      WHERE l.id = mql_evidence_assessments.lead_id
        AND l.created_by = auth.uid()
    )
  );

CREATE POLICY "Strict owner access on mql_qualification_results"
  ON public.mql_qualification_results
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.mql_leads l
      WHERE l.id = mql_qualification_results.lead_id
        AND l.created_by = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.mql_leads l
      WHERE l.id = mql_qualification_results.lead_id
        AND l.created_by = auth.uid()
    )
  );

DO $$
BEGIN
  IF to_regclass('public.mql_sql_promotions') IS NOT NULL THEN
    CREATE POLICY "Strict owner access on mql_sql_promotions"
      ON public.mql_sql_promotions
      FOR ALL TO authenticated
      USING (created_by = auth.uid())
      WITH CHECK (created_by = auth.uid());
  END IF;
END $$;

-- SQL & Opportunity Qualification Root + Children
CREATE POLICY "Strict owner access on opportunities"
  ON public.opportunities
  FOR ALL TO authenticated
  USING (created_by = auth.uid())
  WITH CHECK (created_by = auth.uid());

CREATE POLICY "Strict owner access on sql_assessments"
  ON public.sql_assessments
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.opportunities o
      WHERE o.id = sql_assessments.opportunity_id
        AND o.created_by = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.opportunities o
      WHERE o.id = sql_assessments.opportunity_id
        AND o.created_by = auth.uid()
    )
  );

CREATE POLICY "Strict owner access on sql_evidence_records"
  ON public.sql_evidence_records
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.sql_assessments sa
      JOIN public.opportunities o ON o.id = sa.opportunity_id
      WHERE sa.id = sql_evidence_records.assessment_id
        AND o.created_by = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.sql_assessments sa
      JOIN public.opportunities o ON o.id = sa.opportunity_id
      WHERE sa.id = sql_evidence_records.assessment_id
        AND o.created_by = auth.uid()
    )
  );

CREATE POLICY "Strict owner access on sql_dimension_results"
  ON public.sql_dimension_results
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.sql_assessments sa
      JOIN public.opportunities o ON o.id = sa.opportunity_id
      WHERE sa.id = sql_dimension_results.assessment_id
        AND o.created_by = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.sql_assessments sa
      JOIN public.opportunities o ON o.id = sa.opportunity_id
      WHERE sa.id = sql_dimension_results.assessment_id
        AND o.created_by = auth.uid()
    )
  );

CREATE POLICY "Strict owner access on sql_reasoning_sessions"
  ON public.sql_reasoning_sessions
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.sql_assessments sa
      JOIN public.opportunities o ON o.id = sa.opportunity_id
      WHERE sa.id = sql_reasoning_sessions.assessment_id
        AND o.created_by = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.sql_assessments sa
      JOIN public.opportunities o ON o.id = sa.opportunity_id
      WHERE sa.id = sql_reasoning_sessions.assessment_id
        AND o.created_by = auth.uid()
    )
  );

CREATE POLICY "Strict owner access on sql_recommendations"
  ON public.sql_recommendations
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.sql_assessments sa
      JOIN public.opportunities o ON o.id = sa.opportunity_id
      WHERE sa.id = sql_recommendations.assessment_id
        AND o.created_by = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.sql_assessments sa
      JOIN public.opportunities o ON o.id = sa.opportunity_id
      WHERE sa.id = sql_recommendations.assessment_id
        AND o.created_by = auth.uid()
    )
  );

CREATE POLICY "Strict owner access on sql_opportunity_promotions"
  ON public.sql_opportunity_promotions
  FOR ALL TO authenticated
  USING (created_by = auth.uid())
  WITH CHECK (created_by = auth.uid());

CREATE POLICY "Strict owner access on opportunity_form_records"
  ON public.opportunity_form_records
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.opportunities o
      WHERE o.id = opportunity_form_records.opportunity_id
        AND o.created_by = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.opportunities o
      WHERE o.id = opportunity_form_records.opportunity_id
        AND o.created_by = auth.uid()
    )
  );

CREATE POLICY "Strict owner access on opportunity_sql_handover_details"
  ON public.opportunity_sql_handover_details
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.opportunities o
      WHERE o.id = opportunity_sql_handover_details.opportunity_id
        AND o.created_by = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.opportunities o
      WHERE o.id = opportunity_sql_handover_details.opportunity_id
        AND o.created_by = auth.uid()
    )
  );

CREATE POLICY "Strict owner access on opportunity_qualification_sessions"
  ON public.opportunity_qualification_sessions
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.opportunities o
      WHERE o.id = opportunity_qualification_sessions.opportunity_id
        AND o.created_by = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.opportunities o
      WHERE o.id = opportunity_qualification_sessions.opportunity_id
        AND o.created_by = auth.uid()
    )
  );

CREATE POLICY "Strict owner access on opportunity_qualification_evidence"
  ON public.opportunity_qualification_evidence
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.opportunity_qualification_sessions s
      JOIN public.opportunities o ON o.id = s.opportunity_id
      WHERE s.id = opportunity_qualification_evidence.session_id
        AND o.created_by = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.opportunity_qualification_sessions s
      JOIN public.opportunities o ON o.id = s.opportunity_id
      WHERE s.id = opportunity_qualification_evidence.session_id
        AND o.created_by = auth.uid()
    )
  );

CREATE POLICY "Strict owner access on opportunity_qualification_results"
  ON public.opportunity_qualification_results
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.opportunity_qualification_sessions s
      JOIN public.opportunities o ON o.id = s.opportunity_id
      WHERE s.id = opportunity_qualification_results.session_id
        AND o.created_by = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.opportunity_qualification_sessions s
      JOIN public.opportunities o ON o.id = s.opportunity_id
      WHERE s.id = opportunity_qualification_results.session_id
        AND o.created_by = auth.uid()
    )
  );

CREATE POLICY "Strict owner access on opportunity_promotions"
  ON public.opportunity_promotions
  FOR ALL TO authenticated
  USING (created_by = auth.uid())
  WITH CHECK (created_by = auth.uid());

CREATE POLICY "Strict owner access on opportunity_qualification_history"
  ON public.opportunity_qualification_history
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.opportunities o
      WHERE o.id = opportunity_qualification_history.opportunity_id
        AND o.created_by = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.opportunities o
      WHERE o.id = opportunity_qualification_history.opportunity_id
        AND o.created_by = auth.uid()
    )
  );

CREATE POLICY "Strict owner access on qualification_executive_insights"
  ON public.qualification_executive_insights
  FOR ALL TO authenticated
  USING (created_by = auth.uid())
  WITH CHECK (created_by = auth.uid());

-- Pipeline Assessment Engine Root + Children
CREATE POLICY "Strict owner access on pipeline_opportunities"
  ON public.pipeline_opportunities
  FOR ALL TO authenticated
  USING (created_by = auth.uid())
  WITH CHECK (created_by = auth.uid());

CREATE POLICY "Strict owner access on pipeline_form_records"
  ON public.pipeline_form_records
  FOR ALL TO authenticated
  USING (created_by = auth.uid())
  WITH CHECK (created_by = auth.uid());

CREATE POLICY "Strict owner access on pipeline_opportunity_handover_details"
  ON public.pipeline_opportunity_handover_details
  FOR ALL TO authenticated
  USING (created_by = auth.uid())
  WITH CHECK (created_by = auth.uid());

CREATE POLICY "Strict owner access on pipeline_inheritance"
  ON public.pipeline_inheritance
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.pipeline_opportunities po
      WHERE po.pipeline_id = pipeline_inheritance.pipeline_id
        AND po.created_by = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.pipeline_opportunities po
      WHERE po.pipeline_id = pipeline_inheritance.pipeline_id
        AND po.created_by = auth.uid()
    )
  );

CREATE POLICY "Strict owner access on pipeline_evidence"
  ON public.pipeline_evidence
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.pipeline_opportunities po
      WHERE po.pipeline_id = pipeline_evidence.pipeline_id
        AND po.created_by = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.pipeline_opportunities po
      WHERE po.pipeline_id = pipeline_evidence.pipeline_id
        AND po.created_by = auth.uid()
    )
  );

CREATE POLICY "Strict owner access on pipeline_evidence_relationships"
  ON public.pipeline_evidence_relationships
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.pipeline_opportunities po
      WHERE po.pipeline_id = pipeline_evidence_relationships.pipeline_id
        AND po.created_by = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.pipeline_opportunities po
      WHERE po.pipeline_id = pipeline_evidence_relationships.pipeline_id
        AND po.created_by = auth.uid()
    )
  );

CREATE POLICY "Strict owner access on pipeline_assessments"
  ON public.pipeline_assessments
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.pipeline_opportunities po
      WHERE po.pipeline_id = pipeline_assessments.pipeline_id
        AND po.created_by = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.pipeline_opportunities po
      WHERE po.pipeline_id = pipeline_assessments.pipeline_id
        AND po.created_by = auth.uid()
    )
  );

CREATE POLICY "Strict owner access on pipeline_padf_results"
  ON public.pipeline_padf_results
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.pipeline_opportunities po
      WHERE po.pipeline_id = pipeline_padf_results.pipeline_id
        AND po.created_by = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.pipeline_opportunities po
      WHERE po.pipeline_id = pipeline_padf_results.pipeline_id
        AND po.created_by = auth.uid()
    )
  );

CREATE POLICY "Strict owner access on pipeline_swot_results"
  ON public.pipeline_swot_results
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.pipeline_opportunities po
      WHERE po.pipeline_id = pipeline_swot_results.pipeline_id
        AND po.created_by = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.pipeline_opportunities po
      WHERE po.pipeline_id = pipeline_swot_results.pipeline_id
        AND po.created_by = auth.uid()
    )
  );

CREATE POLICY "Strict owner access on pipeline_risks"
  ON public.pipeline_risks
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.pipeline_opportunities po
      WHERE po.pipeline_id = pipeline_risks.pipeline_id
        AND po.created_by = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.pipeline_opportunities po
      WHERE po.pipeline_id = pipeline_risks.pipeline_id
        AND po.created_by = auth.uid()
    )
  );

CREATE POLICY "Strict owner access on pipeline_strategies"
  ON public.pipeline_strategies
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.pipeline_opportunities po
      WHERE po.pipeline_id = pipeline_strategies.pipeline_id
        AND po.created_by = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.pipeline_opportunities po
      WHERE po.pipeline_id = pipeline_strategies.pipeline_id
        AND po.created_by = auth.uid()
    )
  );

CREATE POLICY "Strict owner access on pipeline_actions"
  ON public.pipeline_actions
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.pipeline_opportunities po
      WHERE po.pipeline_id = pipeline_actions.pipeline_id
        AND po.created_by = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.pipeline_opportunities po
      WHERE po.pipeline_id = pipeline_actions.pipeline_id
        AND po.created_by = auth.uid()
    )
  );

CREATE POLICY "Strict owner access on pipeline_assessment_snapshots"
  ON public.pipeline_assessment_snapshots
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.pipeline_opportunities po
      WHERE po.pipeline_id = pipeline_assessment_snapshots.pipeline_id
        AND po.created_by = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.pipeline_opportunities po
      WHERE po.pipeline_id = pipeline_assessment_snapshots.pipeline_id
        AND po.created_by = auth.uid()
    )
  );

CREATE POLICY "Strict owner access on pipeline_revenue_intelligence_reports"
  ON public.pipeline_revenue_intelligence_reports
  FOR ALL TO authenticated
  USING (user_id = auth.uid()::text)
  WITH CHECK (user_id = auth.uid()::text);
