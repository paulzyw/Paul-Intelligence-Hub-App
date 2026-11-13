-- ==============================================================================
-- Migration: 20261112_pipeline_assessment_engine.sql
-- Module: RevOS Pipeline Assessment Engine (Stage 1: Database & Persistence Layer)
-- Specifications:
--   - Pipeline Technical Design Specification v1.1
--   - Pipeline Assessment Data Inheritance Framework v1.0 (PADIF)
--   - Pipeline SWOT Intelligence Master Schema v1.0
-- Standards: Post-May 2026 Supabase Data API explicit GRANTs and Row Level Security (RLS)
-- ==============================================================================

-- 1. Table: public.pipeline_opportunities
-- Core opportunity commercial identity, deal value, currency, close date, stage, lifecycle status
CREATE TABLE IF NOT EXISTS public.pipeline_opportunities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pipeline_id TEXT NOT NULL UNIQUE,
  lead_id TEXT,
  opportunity_id TEXT,
  tenant_id UUID,
  customer_id TEXT,
  customer_name TEXT NOT NULL,
  opportunity_name TEXT NOT NULL,
  industry_id TEXT DEFAULT 'IND_01',
  industry_name TEXT DEFAULT 'Enterprise Software & Cloud Platforms',
  revenue_motion_id TEXT DEFAULT 'RM01_Digital_Solution_Selling',
  revenue_motion_name TEXT DEFAULT 'Digital Solution Selling',
  deal_value NUMERIC DEFAULT 0,
  currency TEXT DEFAULT 'USD',
  sales_stage TEXT DEFAULT 'Discovery & Solutioning',
  pipeline_stage TEXT DEFAULT 'Active Assessment',
  forecast_category TEXT DEFAULT 'Pipeline',
  expected_close_date DATE,
  opportunity_owner TEXT DEFAULT 'Senior Enterprise AE',
  lifecycle_status TEXT NOT NULL DEFAULT 'ACTIVE',
  source_system TEXT DEFAULT 'RevOS_Opportunity_Qualification',
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_pipe_opps_pipeline_id ON public.pipeline_opportunities(pipeline_id);
CREATE INDEX IF NOT EXISTS idx_pipe_opps_opp_id ON public.pipeline_opportunities(opportunity_id);
CREATE INDEX IF NOT EXISTS idx_pipe_opps_lead_id ON public.pipeline_opportunities(lead_id);
CREATE INDEX IF NOT EXISTS idx_pipe_opps_industry ON public.pipeline_opportunities(industry_id);
CREATE INDEX IF NOT EXISTS idx_pipe_opps_rev_motion ON public.pipeline_opportunities(revenue_motion_id);
CREATE INDEX IF NOT EXISTS idx_pipe_opps_lifecycle ON public.pipeline_opportunities(lifecycle_status);

GRANT SELECT ON public.pipeline_opportunities TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.pipeline_opportunities TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.pipeline_opportunities TO service_role;
ALTER TABLE public.pipeline_opportunities ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow anon read on pipeline_opportunities" ON public.pipeline_opportunities;
CREATE POLICY "Allow anon read on pipeline_opportunities" 
  ON public.pipeline_opportunities FOR SELECT TO anon USING (true);

DROP POLICY IF EXISTS "Allow authenticated full access on pipeline_opportunities" ON public.pipeline_opportunities;
CREATE POLICY "Allow authenticated full access on pipeline_opportunities" 
  ON public.pipeline_opportunities FOR ALL TO authenticated USING (true);

DROP POLICY IF EXISTS "Allow service_role full access on pipeline_opportunities" ON public.pipeline_opportunities;
CREATE POLICY "Allow service_role full access on pipeline_opportunities" 
  ON public.pipeline_opportunities FOR ALL TO service_role USING (true);


-- 2. Table: public.pipeline_inheritance
-- Immutable baseline record of upstream SQL-QIP intelligence payload and mapping provenance (PADIF v1.0)
CREATE TABLE IF NOT EXISTS public.pipeline_inheritance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  inheritance_id TEXT NOT NULL UNIQUE,
  pipeline_id TEXT NOT NULL REFERENCES public.pipeline_opportunities(pipeline_id) ON DELETE CASCADE,
  opportunity_id TEXT,
  lead_id TEXT,
  source_qualification_id TEXT,
  source_module TEXT NOT NULL DEFAULT 'Opportunity_Qualification_SQL_QIP',
  framework_version TEXT NOT NULL DEFAULT 'PADIF_v1.0',
  qualification_decision TEXT,
  qualification_score NUMERIC DEFAULT 0,
  qualification_confidence NUMERIC DEFAULT 0,
  inherited_payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  validation_status TEXT DEFAULT 'VALIDATED',
  inherited_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  revalidated_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_pipe_inh_pipeline_id ON public.pipeline_inheritance(pipeline_id);
CREATE INDEX IF NOT EXISTS idx_pipe_inh_opp_id ON public.pipeline_inheritance(opportunity_id);

GRANT SELECT ON public.pipeline_inheritance TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.pipeline_inheritance TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.pipeline_inheritance TO service_role;
ALTER TABLE public.pipeline_inheritance ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow anon read on pipeline_inheritance" ON public.pipeline_inheritance;
CREATE POLICY "Allow anon read on pipeline_inheritance" 
  ON public.pipeline_inheritance FOR SELECT TO anon USING (true);

DROP POLICY IF EXISTS "Allow authenticated full access on pipeline_inheritance" ON public.pipeline_inheritance;
CREATE POLICY "Allow authenticated full access on pipeline_inheritance" 
  ON public.pipeline_inheritance FOR ALL TO authenticated USING (true);

DROP POLICY IF EXISTS "Allow service_role full access on pipeline_inheritance" ON public.pipeline_inheritance;
CREATE POLICY "Allow service_role full access on pipeline_inheritance" 
  ON public.pipeline_inheritance FOR ALL TO service_role USING (true);


-- 3. Table: public.pipeline_evidence
-- Opportunity evidence instances (statements, source type, quality, confidence, customer confirmation)
CREATE TABLE IF NOT EXISTS public.pipeline_evidence (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  evidence_instance_id TEXT NOT NULL UNIQUE,
  pipeline_id TEXT NOT NULL REFERENCES public.pipeline_opportunities(pipeline_id) ON DELETE CASCADE,
  evidence_object_id TEXT,
  evidence_type TEXT DEFAULT 'customer_statement',
  evidence_statement TEXT NOT NULL,
  source_type TEXT DEFAULT 'customer_interview',
  source_reference TEXT,
  source_date DATE DEFAULT CURRENT_DATE,
  recorded_by TEXT DEFAULT 'Sales Representative',
  verification_status TEXT DEFAULT 'VERIFIED',
  evidence_quality TEXT DEFAULT 'HIGH',
  evidence_confidence NUMERIC DEFAULT 85,
  customer_confirmed BOOLEAN DEFAULT false,
  freshness_days INTEGER DEFAULT 0,
  notes TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_pipe_ev_pipeline_id ON public.pipeline_evidence(pipeline_id);
CREATE INDEX IF NOT EXISTS idx_pipe_ev_object_id ON public.pipeline_evidence(evidence_object_id);

GRANT SELECT ON public.pipeline_evidence TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.pipeline_evidence TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.pipeline_evidence TO service_role;
ALTER TABLE public.pipeline_evidence ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow anon read on pipeline_evidence" ON public.pipeline_evidence;
CREATE POLICY "Allow anon read on pipeline_evidence" 
  ON public.pipeline_evidence FOR SELECT TO anon USING (true);

DROP POLICY IF EXISTS "Allow authenticated full access on pipeline_evidence" ON public.pipeline_evidence;
CREATE POLICY "Allow authenticated full access on pipeline_evidence" 
  ON public.pipeline_evidence FOR ALL TO authenticated USING (true);

DROP POLICY IF EXISTS "Allow service_role full access on pipeline_evidence" ON public.pipeline_evidence;
CREATE POLICY "Allow service_role full access on pipeline_evidence" 
  ON public.pipeline_evidence FOR ALL TO service_role USING (true);


-- 4. Table: public.pipeline_evidence_relationships
-- Stores mapping instances to PADF dimensions and active SWOT factors
CREATE TABLE IF NOT EXISTS public.pipeline_evidence_relationships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  relationship_id TEXT NOT NULL UNIQUE,
  evidence_instance_id TEXT NOT NULL REFERENCES public.pipeline_evidence(evidence_instance_id) ON DELETE CASCADE,
  pipeline_id TEXT NOT NULL REFERENCES public.pipeline_opportunities(pipeline_id) ON DELETE CASCADE,
  target_factor_id TEXT,
  target_dimension_id TEXT,
  mapping_source TEXT DEFAULT 'Pipeline_evidence_knowledge_base_v1.1',
  mapping_relevance TEXT DEFAULT 'DIRECT',
  runtime_relationship TEXT NOT NULL DEFAULT 'SUPPORTS',
  runtime_polarity TEXT NOT NULL DEFAULT 'POSITIVE',
  runtime_interpretation TEXT,
  evaluation_reference TEXT,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_pipe_ev_rel_inst ON public.pipeline_evidence_relationships(evidence_instance_id);
CREATE INDEX IF NOT EXISTS idx_pipe_ev_rel_factor ON public.pipeline_evidence_relationships(target_factor_id);
CREATE INDEX IF NOT EXISTS idx_pipe_ev_rel_dim ON public.pipeline_evidence_relationships(target_dimension_id);

GRANT SELECT ON public.pipeline_evidence_relationships TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.pipeline_evidence_relationships TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.pipeline_evidence_relationships TO service_role;
ALTER TABLE public.pipeline_evidence_relationships ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow anon read on pipeline_evidence_relationships" ON public.pipeline_evidence_relationships;
CREATE POLICY "Allow anon read on pipeline_evidence_relationships" 
  ON public.pipeline_evidence_relationships FOR SELECT TO anon USING (true);

DROP POLICY IF EXISTS "Allow authenticated full access on pipeline_evidence_relationships" ON public.pipeline_evidence_relationships;
CREATE POLICY "Allow authenticated full access on pipeline_evidence_relationships" 
  ON public.pipeline_evidence_relationships FOR ALL TO authenticated USING (true);

DROP POLICY IF EXISTS "Allow service_role full access on pipeline_evidence_relationships" ON public.pipeline_evidence_relationships;
CREATE POLICY "Allow service_role full access on pipeline_evidence_relationships" 
  ON public.pipeline_evidence_relationships FOR ALL TO service_role USING (true);


-- 5. Table: public.pipeline_assessments
-- Execution ledger, governing version hashes, timestamps, calculation states
CREATE TABLE IF NOT EXISTS public.pipeline_assessments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assessment_id TEXT NOT NULL UNIQUE,
  pipeline_id TEXT NOT NULL REFERENCES public.pipeline_opportunities(pipeline_id) ON DELETE CASCADE,
  assessment_sequence INTEGER NOT NULL DEFAULT 1,
  assessment_status TEXT NOT NULL DEFAULT 'COMPLETED',
  trigger_type TEXT NOT NULL DEFAULT 'INITIAL_ASSESSMENT',
  base_winability NUMERIC NOT NULL DEFAULT 0,
  risk_adjusted_winability NUMERIC NOT NULL DEFAULT 0,
  pipeline_health TEXT DEFAULT 'HEALTHY',
  assessment_confidence NUMERIC DEFAULT 85,
  configuration_version TEXT DEFAULT 'v1.1',
  evidence_kb_version TEXT DEFAULT 'v1.1',
  rules_version TEXT DEFAULT 'v1.1',
  reasoning_prompt_version TEXT DEFAULT 'v1.1',
  model_identifier TEXT DEFAULT 'gemini-3.1-flash-lite',
  raw_reasoning_output JSONB DEFAULT '{}'::jsonb,
  executive_summary JSONB DEFAULT '{}'::jsonb,
  created_by TEXT DEFAULT 'System',
  completed_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_pipe_assess_id ON public.pipeline_assessments(assessment_id);
CREATE INDEX IF NOT EXISTS idx_pipe_assess_pipe_id ON public.pipeline_assessments(pipeline_id);

GRANT SELECT ON public.pipeline_assessments TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.pipeline_assessments TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.pipeline_assessments TO service_role;
ALTER TABLE public.pipeline_assessments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow anon read on pipeline_assessments" ON public.pipeline_assessments;
CREATE POLICY "Allow anon read on pipeline_assessments" 
  ON public.pipeline_assessments FOR SELECT TO anon USING (true);

DROP POLICY IF EXISTS "Allow authenticated full access on pipeline_assessments" ON public.pipeline_assessments;
CREATE POLICY "Allow authenticated full access on pipeline_assessments" 
  ON public.pipeline_assessments FOR ALL TO authenticated USING (true);

DROP POLICY IF EXISTS "Allow service_role full access on pipeline_assessments" ON public.pipeline_assessments;
CREATE POLICY "Allow service_role full access on pipeline_assessments" 
  ON public.pipeline_assessments FOR ALL TO service_role USING (true);


-- 6. Table: public.pipeline_padf_results
-- Exactly 8 universal dimension evaluations per assessment
CREATE TABLE IF NOT EXISTS public.pipeline_padf_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assessment_id TEXT NOT NULL REFERENCES public.pipeline_assessments(assessment_id) ON DELETE CASCADE,
  pipeline_id TEXT NOT NULL REFERENCES public.pipeline_opportunities(pipeline_id) ON DELETE CASCADE,
  dimension_id TEXT NOT NULL,
  dimension_name TEXT NOT NULL,
  dimension_score NUMERIC NOT NULL DEFAULT 0,
  assessment_state TEXT NOT NULL DEFAULT 'MODERATE',
  evidence_coverage TEXT DEFAULT 'PARTIAL',
  key_strengths JSONB DEFAULT '[]'::jsonb,
  key_weaknesses JSONB DEFAULT '[]'::jsonb,
  evidence_references JSONB DEFAULT '[]'::jsonb,
  business_implications TEXT,
  recommended_actions JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_padf_assess_id ON public.pipeline_padf_results(assessment_id);
CREATE INDEX IF NOT EXISTS idx_padf_dim_id ON public.pipeline_padf_results(dimension_id);

GRANT SELECT ON public.pipeline_padf_results TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.pipeline_padf_results TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.pipeline_padf_results TO service_role;
ALTER TABLE public.pipeline_padf_results ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow anon read on pipeline_padf_results" ON public.pipeline_padf_results;
CREATE POLICY "Allow anon read on pipeline_padf_results" 
  ON public.pipeline_padf_results FOR SELECT TO anon USING (true);

DROP POLICY IF EXISTS "Allow authenticated full access on pipeline_padf_results" ON public.pipeline_padf_results;
CREATE POLICY "Allow authenticated full access on pipeline_padf_results" 
  ON public.pipeline_padf_results FOR ALL TO authenticated USING (true);

DROP POLICY IF EXISTS "Allow service_role full access on pipeline_padf_results" ON public.pipeline_padf_results;
CREATE POLICY "Allow service_role full access on pipeline_padf_results" 
  ON public.pipeline_padf_results FOR ALL TO service_role USING (true);


-- 7. Table: public.pipeline_swot_results
-- Active 16-factor evaluation (8 universal + 4 motion + 4 industry)
CREATE TABLE IF NOT EXISTS public.pipeline_swot_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assessment_id TEXT NOT NULL REFERENCES public.pipeline_assessments(assessment_id) ON DELETE CASCADE,
  pipeline_id TEXT NOT NULL REFERENCES public.pipeline_opportunities(pipeline_id) ON DELETE CASCADE,
  factor_id TEXT NOT NULL,
  factor_name TEXT NOT NULL,
  factor_type TEXT NOT NULL,
  factor_layer TEXT NOT NULL,
  strategic_impact INTEGER DEFAULT 3,
  evidence_confidence INTEGER DEFAULT 3,
  relevance INTEGER DEFAULT 3,
  urgency INTEGER DEFAULT 3,
  manageability INTEGER DEFAULT 3,
  winability_influence INTEGER DEFAULT 3,
  priority_level TEXT DEFAULT 'medium',
  assessment_state TEXT NOT NULL DEFAULT 'EVALUATED',
  evaluation_rationale TEXT,
  supporting_evidence_ids JSONB DEFAULT '[]'::jsonb,
  contradicting_evidence_ids JSONB DEFAULT '[]'::jsonb,
  related_padf_dimensions JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_swot_assess_id ON public.pipeline_swot_results(assessment_id);
CREATE INDEX IF NOT EXISTS idx_swot_factor_id ON public.pipeline_swot_results(factor_id);
CREATE INDEX IF NOT EXISTS idx_swot_type ON public.pipeline_swot_results(factor_type);

GRANT SELECT ON public.pipeline_swot_results TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.pipeline_swot_results TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.pipeline_swot_results TO service_role;
ALTER TABLE public.pipeline_swot_results ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow anon read on pipeline_swot_results" ON public.pipeline_swot_results;
CREATE POLICY "Allow anon read on pipeline_swot_results" 
  ON public.pipeline_swot_results FOR SELECT TO anon USING (true);

DROP POLICY IF EXISTS "Allow authenticated full access on pipeline_swot_results" ON public.pipeline_swot_results;
CREATE POLICY "Allow authenticated full access on pipeline_swot_results" 
  ON public.pipeline_swot_results FOR ALL TO authenticated USING (true);

DROP POLICY IF EXISTS "Allow service_role full access on pipeline_swot_results" ON public.pipeline_swot_results;
CREATE POLICY "Allow service_role full access on pipeline_swot_results" 
  ON public.pipeline_swot_results FOR ALL TO service_role USING (true);


-- 8. Table: public.pipeline_risks
-- Formal Risk Intelligence records (triggers, severity, impact, mitigation)
CREATE TABLE IF NOT EXISTS public.pipeline_risks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  risk_instance_id TEXT NOT NULL UNIQUE,
  assessment_id TEXT NOT NULL REFERENCES public.pipeline_assessments(assessment_id) ON DELETE CASCADE,
  pipeline_id TEXT NOT NULL REFERENCES public.pipeline_opportunities(pipeline_id) ON DELETE CASCADE,
  risk_id TEXT NOT NULL,
  risk_category TEXT NOT NULL,
  risk_description TEXT NOT NULL,
  severity TEXT NOT NULL DEFAULT 'MEDIUM',
  likelihood TEXT DEFAULT 'MODERATE',
  impact TEXT DEFAULT 'MODERATE',
  triggering_evidence JSONB DEFAULT '[]'::jsonb,
  risk_status TEXT NOT NULL DEFAULT 'ACTIVE',
  mitigation_strategy TEXT,
  mitigation_actions JSONB DEFAULT '[]'::jsonb,
  owner TEXT DEFAULT 'Opportunity Owner',
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_risks_assess_id ON public.pipeline_risks(assessment_id);
CREATE INDEX IF NOT EXISTS idx_risks_pipeline_id ON public.pipeline_risks(pipeline_id);

GRANT SELECT ON public.pipeline_risks TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.pipeline_risks TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.pipeline_risks TO service_role;
ALTER TABLE public.pipeline_risks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow anon read on pipeline_risks" ON public.pipeline_risks;
CREATE POLICY "Allow anon read on pipeline_risks" 
  ON public.pipeline_risks FOR SELECT TO anon USING (true);

DROP POLICY IF EXISTS "Allow authenticated full access on pipeline_risks" ON public.pipeline_risks;
CREATE POLICY "Allow authenticated full access on pipeline_risks" 
  ON public.pipeline_risks FOR ALL TO authenticated USING (true);

DROP POLICY IF EXISTS "Allow service_role full access on pipeline_risks" ON public.pipeline_risks;
CREATE POLICY "Allow service_role full access on pipeline_risks" 
  ON public.pipeline_risks FOR ALL TO service_role USING (true);


-- 9. Table: public.pipeline_strategies
-- TOWS Strategic Combinations (SO, WO, ST, WT) & Winning Strategy Integrations
CREATE TABLE IF NOT EXISTS public.pipeline_strategies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  strategy_instance_id TEXT NOT NULL UNIQUE,
  assessment_id TEXT NOT NULL REFERENCES public.pipeline_assessments(assessment_id) ON DELETE CASCADE,
  pipeline_id TEXT NOT NULL REFERENCES public.pipeline_opportunities(pipeline_id) ON DELETE CASCADE,
  strategy_id TEXT NOT NULL,
  strategy_type TEXT NOT NULL,
  tows_category TEXT,
  strategic_objective TEXT NOT NULL,
  strategic_rationale TEXT NOT NULL,
  supporting_swot_factor_ids JSONB DEFAULT '[]'::jsonb,
  supporting_evidence_ids JSONB DEFAULT '[]'::jsonb,
  related_risk_ids JSONB DEFAULT '[]'::jsonb,
  priority TEXT NOT NULL DEFAULT 'HIGH',
  expected_impact TEXT DEFAULT 'POSITIVE_DIRECTIONAL',
  feasibility TEXT DEFAULT 'HIGH',
  dependencies JSONB DEFAULT '[]'::jsonb,
  strategy_status TEXT NOT NULL DEFAULT 'PROPOSED',
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_strat_assess_id ON public.pipeline_strategies(assessment_id);
CREATE INDEX IF NOT EXISTS idx_strat_pipeline_id ON public.pipeline_strategies(pipeline_id);

GRANT SELECT ON public.pipeline_strategies TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.pipeline_strategies TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.pipeline_strategies TO service_role;
ALTER TABLE public.pipeline_strategies ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow anon read on pipeline_strategies" ON public.pipeline_strategies;
CREATE POLICY "Allow anon read on pipeline_strategies" 
  ON public.pipeline_strategies FOR SELECT TO anon USING (true);

DROP POLICY IF EXISTS "Allow authenticated full access on pipeline_strategies" ON public.pipeline_strategies;
CREATE POLICY "Allow authenticated full access on pipeline_strategies" 
  ON public.pipeline_strategies FOR ALL TO authenticated USING (true);

DROP POLICY IF EXISTS "Allow service_role full access on pipeline_strategies" ON public.pipeline_strategies;
CREATE POLICY "Allow service_role full access on pipeline_strategies" 
  ON public.pipeline_strategies FOR ALL TO service_role USING (true);


-- 10. Table: public.pipeline_actions
-- Execution management and action assignments connected to strategies/risks/gaps
CREATE TABLE IF NOT EXISTS public.pipeline_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  action_id TEXT NOT NULL UNIQUE,
  strategy_instance_id TEXT REFERENCES public.pipeline_strategies(strategy_instance_id) ON DELETE SET NULL,
  pipeline_id TEXT NOT NULL REFERENCES public.pipeline_opportunities(pipeline_id) ON DELETE CASCADE,
  action_description TEXT NOT NULL,
  strategic_objective TEXT,
  action_owner TEXT DEFAULT 'Account Executive',
  priority TEXT NOT NULL DEFAULT 'HIGH',
  target_date DATE,
  action_status TEXT NOT NULL DEFAULT 'NOT_STARTED',
  completion_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_act_pipe_id ON public.pipeline_actions(pipeline_id);
CREATE INDEX IF NOT EXISTS idx_act_status ON public.pipeline_actions(action_status);

GRANT SELECT ON public.pipeline_actions TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.pipeline_actions TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.pipeline_actions TO service_role;
ALTER TABLE public.pipeline_actions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow anon read on pipeline_actions" ON public.pipeline_actions;
CREATE POLICY "Allow anon read on pipeline_actions" 
  ON public.pipeline_actions FOR SELECT TO anon USING (true);

DROP POLICY IF EXISTS "Allow authenticated full access on pipeline_actions" ON public.pipeline_actions;
CREATE POLICY "Allow authenticated full access on pipeline_actions" 
  ON public.pipeline_actions FOR ALL TO authenticated USING (true);

DROP POLICY IF EXISTS "Allow service_role full access on pipeline_actions" ON public.pipeline_actions;
CREATE POLICY "Allow service_role full access on pipeline_actions" 
  ON public.pipeline_actions FOR ALL TO service_role USING (true);


-- 11. Table: public.pipeline_assessment_snapshots
-- Immutable historical snapshots for longitudinal tracking and auditability
CREATE TABLE IF NOT EXISTS public.pipeline_assessment_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  snapshot_id TEXT NOT NULL UNIQUE,
  assessment_id TEXT NOT NULL REFERENCES public.pipeline_assessments(assessment_id) ON DELETE CASCADE,
  pipeline_id TEXT NOT NULL REFERENCES public.pipeline_opportunities(pipeline_id) ON DELETE CASCADE,
  snapshot_sequence INTEGER NOT NULL,
  snapshot_timestamp TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  full_snapshot_payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_snap_pipe_id ON public.pipeline_assessment_snapshots(pipeline_id);
CREATE INDEX IF NOT EXISTS idx_snap_assess_id ON public.pipeline_assessment_snapshots(assessment_id);

GRANT SELECT ON public.pipeline_assessment_snapshots TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.pipeline_assessment_snapshots TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.pipeline_assessment_snapshots TO service_role;
ALTER TABLE public.pipeline_assessment_snapshots ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow anon read on pipeline_assessment_snapshots" ON public.pipeline_assessment_snapshots;
CREATE POLICY "Allow anon read on pipeline_assessment_snapshots" 
  ON public.pipeline_assessment_snapshots FOR SELECT TO anon USING (true);

DROP POLICY IF EXISTS "Allow authenticated full access on pipeline_assessment_snapshots" ON public.pipeline_assessment_snapshots;
CREATE POLICY "Allow authenticated full access on pipeline_assessment_snapshots" 
  ON public.pipeline_assessment_snapshots FOR ALL TO authenticated USING (true);

DROP POLICY IF EXISTS "Allow service_role full access on pipeline_assessment_snapshots" ON public.pipeline_assessment_snapshots;
CREATE POLICY "Allow service_role full access on pipeline_assessment_snapshots" 
  ON public.pipeline_assessment_snapshots FOR ALL TO service_role USING (true);
