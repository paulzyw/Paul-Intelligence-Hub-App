-- =========================================================================
-- REVOS BUSINESS CHALLENGE-DRIVEN CONTENT DISCOVERY SYSTEM
-- Migration: 20261103_business_challenges.sql
-- Description:
--   1. Creates `public.business_challenges` table for centralized taxonomy.
--   2. Creates `public.content_business_challenges` junction table referencing `public.posts(id)`.
--   3. Partial unique index ensuring strictly one primary challenge per article.
--   4. Adds triggers for automated `updated_at` maintenance.
--   5. Applies strict Post-May 2026 Supabase Data API grants and RLS policies.
--   6. Seeds the 18 predefined initial Business Challenges idempotently.
--   7. Creates atomic transaction RPC function `set_article_business_challenges`.
-- =========================================================================

-- =========================================================================
-- 1. Table: public.business_challenges
-- =========================================================================
CREATE TABLE IF NOT EXISTS public.business_challenges (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL CHECK (char_length(trim(name)) > 0),
    slug TEXT NOT NULL UNIQUE CHECK (char_length(trim(slug)) > 0),
    description TEXT,
    display_order INTEGER NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_business_challenges_active_order 
ON public.business_challenges (display_order ASC, name ASC) 
WHERE status = 'active';

CREATE INDEX IF NOT EXISTS idx_business_challenges_slug 
ON public.business_challenges (slug);

-- Automated updated_at trigger
CREATE OR REPLACE FUNCTION public.handle_updated_at_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_business_challenges_updated_at ON public.business_challenges;
CREATE TRIGGER trg_business_challenges_updated_at
    BEFORE UPDATE ON public.business_challenges
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at_timestamp();

-- =========================================================================
-- 2. Table: public.content_business_challenges (Junction Table)
-- =========================================================================
CREATE TABLE IF NOT EXISTS public.content_business_challenges (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    content_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
    challenge_id UUID NOT NULL REFERENCES public.business_challenges(id) ON DELETE RESTRICT,
    is_primary BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT unique_content_challenge UNIQUE (content_id, challenge_id)
);

-- Performance Indexes
CREATE INDEX IF NOT EXISTS idx_content_business_challenges_content 
ON public.content_business_challenges (content_id);

CREATE INDEX IF NOT EXISTS idx_content_business_challenges_challenge 
ON public.content_business_challenges (challenge_id);

-- Enforce strictly ONE primary challenge per article
CREATE UNIQUE INDEX IF NOT EXISTS idx_content_business_challenges_one_primary 
ON public.content_business_challenges (content_id) 
WHERE is_primary = TRUE;

-- =========================================================================
-- 3. Post-May 2026 Supabase Data API Grants (AGENTS.md Strict Compliance)
-- =========================================================================
GRANT SELECT ON public.business_challenges TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.business_challenges TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.business_challenges TO service_role;

GRANT SELECT ON public.content_business_challenges TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.content_business_challenges TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.content_business_challenges TO service_role;

-- =========================================================================
-- 4. Row Level Security (RLS)
-- =========================================================================
ALTER TABLE public.business_challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content_business_challenges ENABLE ROW LEVEL SECURITY;

-- Business Challenges RLS:
-- Public can read all active challenges (and authenticated can read all)
DROP POLICY IF EXISTS "Public can view active business challenges" ON public.business_challenges;
CREATE POLICY "Public can view active business challenges" 
ON public.business_challenges FOR SELECT 
TO anon 
USING (status = 'active');

DROP POLICY IF EXISTS "Authenticated can view all business challenges" ON public.business_challenges;
CREATE POLICY "Authenticated can view all business challenges" 
ON public.business_challenges FOR SELECT 
TO authenticated 
USING (true);

DROP POLICY IF EXISTS "Authenticated admins can insert business challenges" ON public.business_challenges;
CREATE POLICY "Authenticated admins can insert business challenges" 
ON public.business_challenges FOR INSERT 
TO authenticated 
WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Authenticated admins can update business challenges" ON public.business_challenges;
CREATE POLICY "Authenticated admins can update business challenges" 
ON public.business_challenges FOR UPDATE 
TO authenticated 
USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Authenticated admins can delete business challenges" ON public.business_challenges;
CREATE POLICY "Authenticated admins can delete business challenges" 
ON public.business_challenges FOR DELETE 
TO authenticated 
USING (auth.role() = 'authenticated');

-- Content Business Challenges RLS:
-- Public can read associations for published posts
DROP POLICY IF EXISTS "Public can view content challenge associations" ON public.content_business_challenges;
CREATE POLICY "Public can view content challenge associations" 
ON public.content_business_challenges FOR SELECT 
TO anon 
USING (
    EXISTS (
        SELECT 1 FROM public.posts p 
        WHERE p.id = content_business_challenges.content_id 
          AND p.status = 'published'
    )
);

DROP POLICY IF EXISTS "Authenticated can view all content challenge associations" ON public.content_business_challenges;
CREATE POLICY "Authenticated can view all content challenge associations" 
ON public.content_business_challenges FOR SELECT 
TO authenticated 
USING (true);

DROP POLICY IF EXISTS "Authenticated admins can insert associations" ON public.content_business_challenges;
CREATE POLICY "Authenticated admins can insert associations" 
ON public.content_business_challenges FOR INSERT 
TO authenticated 
WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Authenticated admins can update associations" ON public.content_business_challenges;
CREATE POLICY "Authenticated admins can update associations" 
ON public.content_business_challenges FOR UPDATE 
TO authenticated 
USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Authenticated admins can delete associations" ON public.content_business_challenges;
CREATE POLICY "Authenticated admins can delete associations" 
ON public.content_business_challenges FOR DELETE 
TO authenticated 
USING (auth.role() = 'authenticated');

-- =========================================================================
-- 5. Atomic RPC Function: set_article_business_challenges
-- =========================================================================
CREATE OR REPLACE FUNCTION public.set_article_business_challenges(
    p_content_id UUID,
    p_challenges JSONB -- Array of objects: [{"challenge_id": "...", "is_primary": true/false}]
)
RETURNS JSONB AS $$
DECLARE
    v_content_type TEXT;
    v_item JSONB;
    v_challenge_id UUID;
    v_is_primary BOOLEAN;
    v_primary_count INTEGER := 0;
    v_challenge_status TEXT;
    v_inserted_count INTEGER := 0;
BEGIN
    -- 1. Validate that content exists in public.posts
    SELECT content_type INTO v_content_type
    FROM public.posts
    WHERE id = p_content_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Article not found with id: %', p_content_id;
    END IF;

    -- 2. Validate that content is an Insight (cannot associate non-insight content)
    IF v_content_type IS DISTINCT FROM 'insight' THEN
        RAISE EXCEPTION 'Only Insight articles can be associated with Business Challenges (current content_type: %)', v_content_type;
    END IF;

    -- 3. If empty challenges array, clear associations and return
    IF p_challenges IS NULL OR jsonb_array_length(p_challenges) = 0 THEN
        DELETE FROM public.content_business_challenges WHERE content_id = p_content_id;
        RETURN jsonb_build_object('success', true, 'count', 0);
    END IF;

    -- 4. Count primary designations and validate active status
    FOR v_item IN SELECT * FROM jsonb_array_elements(p_challenges)
    LOOP
        v_challenge_id := (v_item->>'challenge_id')::UUID;
        v_is_primary := COALESCE((v_item->>'is_primary')::BOOLEAN, false);

        IF v_is_primary THEN
            v_primary_count := v_primary_count + 1;
        END IF;

        -- Validate challenge existence and active status
        SELECT status INTO v_challenge_status
        FROM public.business_challenges
        WHERE id = v_challenge_id;

        IF NOT FOUND THEN
            RAISE EXCEPTION 'Business Challenge ID % does not exist', v_challenge_id;
        END IF;

        -- Only active challenges can be newly linked
        IF v_challenge_status <> 'active' THEN
            -- Check if it was already associated; if not, reject inactive challenge
            IF NOT EXISTS (
                SELECT 1 FROM public.content_business_challenges 
                WHERE content_id = p_content_id AND challenge_id = v_challenge_id
            ) THEN
                RAISE EXCEPTION 'Cannot associate inactive Business Challenge % (%)', v_challenge_id, (SELECT name FROM public.business_challenges WHERE id = v_challenge_id);
            END IF;
        END IF;
    END LOOP;

    -- If more than 1 primary, reject
    IF v_primary_count > 1 THEN
        RAISE EXCEPTION 'An article cannot have more than one primary Business Challenge (found %)', v_primary_count;
    END IF;

    -- If challenges provided but none marked primary, automatically make the first one primary
    IF v_primary_count = 0 AND jsonb_array_length(p_challenges) > 0 THEN
        -- Will designate first element as primary during insertion
    END IF;

    -- 5. Atomically replace associations
    DELETE FROM public.content_business_challenges WHERE content_id = p_content_id;

    DECLARE
        v_first BOOLEAN := true;
    BEGIN
        FOR v_item IN SELECT * FROM jsonb_array_elements(p_challenges)
        LOOP
            v_challenge_id := (v_item->>'challenge_id')::UUID;
            v_is_primary := COALESCE((v_item->>'is_primary')::BOOLEAN, false);

            -- Auto-promote first item to primary if no primary was explicitly set
            IF v_primary_count = 0 AND v_first THEN
                v_is_primary := true;
                v_first := false;
            END IF;

            INSERT INTO public.content_business_challenges (content_id, challenge_id, is_primary)
            VALUES (p_content_id, v_challenge_id, v_is_primary);

            v_inserted_count := v_inserted_count + 1;
        END LOOP;
    END;

    RETURN jsonb_build_object(
        'success', true, 
        'content_id', p_content_id, 
        'count', v_inserted_count
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

-- Grant execution permission per AGENTS.md rule
GRANT EXECUTE ON FUNCTION public.set_article_business_challenges(UUID, JSONB) TO anon, authenticated, service_role;

-- =========================================================================
-- 6. Helper Function: get_business_challenges_with_counts
-- =========================================================================
CREATE OR REPLACE FUNCTION public.get_business_challenges_with_counts()
RETURNS TABLE (
    id UUID,
    name TEXT,
    slug TEXT,
    description TEXT,
    display_order INTEGER,
    status TEXT,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ,
    created_by UUID,
    article_count BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        bc.id,
        bc.name,
        bc.slug,
        bc.description,
        bc.display_order,
        bc.status,
        bc.created_at,
        bc.updated_at,
        bc.created_by,
        COUNT(DISTINCT cbc.content_id) FILTER (
            WHERE p.status = 'published' AND p.content_type = 'insight'
        ) AS article_count
    FROM public.business_challenges bc
    LEFT JOIN public.content_business_challenges cbc ON bc.id = cbc.challenge_id
    LEFT JOIN public.posts p ON cbc.content_id = p.id
    GROUP BY bc.id
    ORDER BY bc.display_order ASC, bc.name ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

GRANT EXECUTE ON FUNCTION public.get_business_challenges_with_counts() TO anon, authenticated, service_role;

-- =========================================================================
-- 7. Idempotent Seed Data (18 Predefined Business Challenges)
-- =========================================================================
INSERT INTO public.business_challenges (name, slug, description, display_order, status)
VALUES
    ('Unclear Go-to-Market Strategy', 'unclear-go-to-market-strategy', 'Absence of clear target buyer definitions, value proposition, and unified revenue execution model.', 10, 'active'),
    ('Poor Market Segmentation and Targeting', 'poor-market-segmentation-and-targeting', 'Misaligned Ideal Customer Profile (ICP) resulting in wasted marketing budget and unqualified pipeline.', 20, 'active'),
    ('Low Lead Quality', 'low-lead-quality', 'Inbound and outbound leads failing to meet buyer qualification criteria and revenue readiness thresholds.', 30, 'active'),
    ('Ineffective Lead Qualification', 'ineffective-lead-qualification', 'Inconsistent qualification frameworks (e.g. BANT, MEDDPICC) causing sales reps to pursue dead-end opportunities.', 40, 'active'),
    ('Low Sales Conversion Rate', 'low-sales-conversion-rate', 'Suboptimal win rates from initial discovery to contract execution across the sales cycle.', 50, 'active'),
    ('Long Sales Cycle', 'long-sales-cycle', 'Protracted deal progression, delayed stakeholder approvals, and excessive sales velocity friction.', 60, 'active'),
    ('Weak Sales Execution', 'weak-sales-execution', 'Gaps in consultative selling, objection handling, value realization demos, and closing rigor.', 70, 'active'),
    ('Poor Pipeline Visibility', 'poor-pipeline-visibility', 'Opaque CRM tracking, lagging stage milestones, and lack of real-time visibility into deal health.', 80, 'active'),
    ('Inaccurate Sales Forecasting', 'inaccurate-sales-forecasting', 'Subjective pipeline commits leading to unpredictable quarter-end revenue variance.', 90, 'active'),
    ('Low Pipeline Conversion', 'low-pipeline-conversion', 'Severe drop-offs between pipeline stages from MQL to SQL and Opportunity Creation to Closed-Won.', 100, 'active'),
    ('Inconsistent Revenue Performance', 'inconsistent-revenue-performance', 'Unstable revenue quarters, roller-coaster pipeline generation, and unrepeatable sales motions.', 110, 'active'),
    ('Poor Sales Productivity', 'poor-sales-productivity', 'Reps spending too much time on manual admin tasks, notes, and CRM updates instead of customer selling.', 120, 'active'),
    ('Weak Sales and Marketing Alignment', 'weak-sales-and-marketing-alignment', 'Siloed messaging, competing KPIs, and finger-pointing over pipeline ownership and attribution.', 130, 'active'),
    ('High Customer Churn', 'high-customer-churn', 'Elevated customer attrition rates driven by poor onboarding, unmet expectations, and lack of customer success intervention.', 140, 'active'),
    ('Low Customer Retention', 'low-customer-retention', 'Failure to establish durable Net Revenue Retention (NRR) and post-sale account engagement.', 150, 'active'),
    ('Limited Account Growth', 'limited-account-growth', 'Inability to expand enterprise accounts through cross-sell, up-sell, and multi-department expansion.', 160, 'active'),
    ('Ineffective Revenue Operations', 'ineffective-revenue-operations', 'Fragmented tech stack, disjointed data models, and lack of unified governance across GTM teams.', 170, 'active'),
    ('Lack of Data-Driven Decision Making', 'lack-of-data-driven-decision-making', 'Executive leadership relying on gut feeling rather than predictive revenue intelligence and telemetry.', 180, 'active')
ON CONFLICT (slug) DO NOTHING;

-- =========================================================================
-- Rollback Strategy Documentation (If Needed):
-- =========================================================================
-- DROP FUNCTION IF EXISTS public.get_business_challenges_with_counts();
-- DROP FUNCTION IF EXISTS public.set_article_business_challenges(UUID, JSONB);
-- DROP TABLE IF EXISTS public.content_business_challenges;
-- DROP TABLE IF EXISTS public.business_challenges;
-- DROP FUNCTION IF EXISTS public.handle_updated_at_timestamp();
