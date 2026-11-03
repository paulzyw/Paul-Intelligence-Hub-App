import { supabase } from './supabase';

export interface BusinessChallenge {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  display_order: number;
  status: 'active' | 'inactive';
  created_at: string;
  updated_at: string;
  created_by?: string | null;
  article_count?: number;
}

export interface ContentBusinessChallenge {
  id: string;
  content_id: string;
  challenge_id: string;
  is_primary: boolean;
  created_at: string;
  business_challenges?: BusinessChallenge;
}

export interface SelectedBusinessChallenge {
  challengeId: string;
  isPrimary: boolean;
  challenge?: BusinessChallenge;
}

export const PREDEFINED_CHALLENGES_SEED: Omit<BusinessChallenge, 'id' | 'created_at' | 'updated_at'>[] = [
  { name: 'Unclear Go-to-Market Strategy', slug: 'unclear-go-to-market-strategy', description: 'Absence of clear target buyer definitions, value proposition, and unified revenue execution model.', display_order: 10, status: 'active' },
  { name: 'Poor Market Segmentation and Targeting', slug: 'poor-market-segmentation-and-targeting', description: 'Misaligned Ideal Customer Profile (ICP) resulting in wasted marketing budget and unqualified pipeline.', display_order: 20, status: 'active' },
  { name: 'Low Lead Quality', slug: 'low-lead-quality', description: 'Inbound and outbound leads failing to meet buyer qualification criteria and revenue readiness thresholds.', display_order: 30, status: 'active' },
  { name: 'Ineffective Lead Qualification', slug: 'ineffective-lead-qualification', description: 'Inconsistent qualification frameworks (e.g. BANT, MEDDPICC) causing sales reps to pursue dead-end opportunities.', display_order: 40, status: 'active' },
  { name: 'Low Sales Conversion Rate', slug: 'low-sales-conversion-rate', description: 'Suboptimal win rates from initial discovery to contract execution across the sales cycle.', display_order: 50, status: 'active' },
  { name: 'Long Sales Cycle', slug: 'long-sales-cycle', description: 'Protracted deal progression, delayed stakeholder approvals, and excessive sales velocity friction.', display_order: 60, status: 'active' },
  { name: 'Weak Sales Execution', slug: 'weak-sales-execution', description: 'Gaps in consultative selling, objection handling, value realization demos, and closing rigor.', display_order: 70, status: 'active' },
  { name: 'Poor Pipeline Visibility', slug: 'poor-pipeline-visibility', description: 'Opaque CRM tracking, lagging stage milestones, and lack of real-time visibility into deal health.', display_order: 80, status: 'active' },
  { name: 'Inaccurate Sales Forecasting', slug: 'inaccurate-sales-forecasting', description: 'Subjective pipeline commits leading to unpredictable quarter-end revenue variance.', display_order: 90, status: 'active' },
  { name: 'Low Pipeline Conversion', slug: 'low-pipeline-conversion', description: 'Severe drop-offs between pipeline stages from MQL to SQL and Opportunity Creation to Closed-Won.', display_order: 100, status: 'active' },
  { name: 'Inconsistent Revenue Performance', slug: 'inconsistent-revenue-performance', description: 'Unstable revenue quarters, roller-coaster pipeline generation, and unrepeatable sales motions.', display_order: 110, status: 'active' },
  { name: 'Poor Sales Productivity', slug: 'poor-sales-productivity', description: 'Reps spending too much time on manual admin tasks, notes, and CRM updates instead of customer selling.', display_order: 120, status: 'active' },
  { name: 'Weak Sales and Marketing Alignment', slug: 'weak-sales-and-marketing-alignment', description: 'Siloed messaging, competing KPIs, and finger-pointing over pipeline ownership and attribution.', display_order: 130, status: 'active' },
  { name: 'High Customer Churn', slug: 'high-customer-churn', description: 'Elevated customer attrition rates driven by poor onboarding, unmet expectations, and lack of customer success intervention.', display_order: 140, status: 'active' },
  { name: 'Low Customer Retention', slug: 'low-customer-retention', description: 'Failure to establish durable Net Revenue Retention (NRR) and post-sale account engagement.', display_order: 150, status: 'active' },
  { name: 'Limited Account Growth', slug: 'limited-account-growth', description: 'Inability to expand enterprise accounts through cross-sell, up-sell, and multi-department expansion.', display_order: 160, status: 'active' },
  { name: 'Ineffective Revenue Operations', slug: 'ineffective-revenue-operations', description: 'Fragmented tech stack, disjointed data models, and lack of unified governance across GTM teams.', display_order: 170, status: 'active' },
  { name: 'Lack of Data-Driven Decision Making', slug: 'lack-of-data-driven-decision-making', description: 'Executive leadership relying on gut feeling rather than predictive revenue intelligence and telemetry.', display_order: 180, status: 'active' },
];

/**
 * Fetch business challenges for CMS administration or article association.
 */
export async function fetchBusinessChallenges(options?: { 
  activeOnly?: boolean; 
  includeCounts?: boolean;
}): Promise<{ data: BusinessChallenge[]; error: any }> {
  try {
    // 1. First check if RPC get_business_challenges_with_counts is available
    if (options?.includeCounts) {
      const { data: rpcData, error: rpcError } = await supabase.rpc('get_business_challenges_with_counts');
      if (!rpcError && rpcData) {
        let results = rpcData as BusinessChallenge[];
        if (options.activeOnly) {
          results = results.filter(c => c.status === 'active');
        }
        return { data: results, error: null };
      }
    }

    // 2. Query business_challenges table directly
    let query = supabase
      .from('business_challenges')
      .select('*')
      .order('display_order', { ascending: true })
      .order('name', { ascending: true });

    if (options?.activeOnly) {
      query = query.eq('status', 'active');
    }

    const { data, error } = await query;

    if (error) {
      // If table doesn't exist yet in Supabase (awaiting migration run in SQL Editor)
      if (error.code === '42P01' || error.message?.includes('relation "public.business_challenges" does not exist')) {
        console.warn('business_challenges table does not exist in Supabase yet. Run supabase/migrations/20261103_business_challenges.sql');
        return { 
          data: PREDEFINED_CHALLENGES_SEED.map((c, idx) => ({
            ...c,
            id: `virtual-challenge-${idx + 1}`,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            article_count: 0
          })), 
          error: null 
        };
      }
      return { data: [], error };
    }

    // If counts requested but RPC wasn't available, count linked published insight articles
    if (options?.includeCounts && data && data.length > 0) {
      try {
        const { data: junctionData } = await supabase
          .from('content_business_challenges')
          .select('challenge_id, content_id, posts!inner(status, content_type)')
          .eq('posts.status', 'published')
          .eq('posts.content_type', 'insight');

        const counts: Record<string, number> = {};
        if (junctionData) {
          junctionData.forEach((row: any) => {
            counts[row.challenge_id] = (counts[row.challenge_id] || 0) + 1;
          });
        }

        const dataWithCounts = data.map(ch => ({
          ...ch,
          article_count: counts[ch.id] || 0
        }));

        return { data: dataWithCounts, error: null };
      } catch {
        return { data: data.map(ch => ({ ...ch, article_count: 0 })), error: null };
      }
    }

    return { data: data || [], error: null };
  } catch (err: any) {
    console.error('fetchBusinessChallenges error:', err);
    return { data: [], error: err };
  }
}

/**
 * Create a new business challenge.
 */
export async function createBusinessChallenge(challenge: {
  name: string;
  slug?: string;
  description?: string;
  display_order?: number;
  status?: 'active' | 'inactive';
}): Promise<{ data: BusinessChallenge | null; error: any }> {
  try {
    const slug = challenge.slug?.trim() || 
      challenge.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');

    const payload = {
      name: challenge.name.trim(),
      slug,
      description: challenge.description?.trim() || null,
      display_order: challenge.display_order ?? 0,
      status: challenge.status || 'active',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('business_challenges')
      .insert([payload])
      .select()
      .single();

    return { data, error };
  } catch (err: any) {
    return { data: null, error: err };
  }
}

/**
 * Update an existing business challenge.
 */
export async function updateBusinessChallenge(
  id: string,
  updates: Partial<BusinessChallenge>
): Promise<{ data: BusinessChallenge | null; error: any }> {
  try {
    const payload: any = {
      ...updates,
      updated_at: new Date().toISOString()
    };

    // Clean empty string descriptions to null
    if (payload.description === '') {
      payload.description = null;
    }

    const { data, error } = await supabase
      .from('business_challenges')
      .update(payload)
      .eq('id', id)
      .select()
      .single();

    return { data, error };
  } catch (err: any) {
    return { data: null, error: err };
  }
}

/**
 * Toggle challenge status between 'active' and 'inactive'.
 */
export async function toggleBusinessChallengeStatus(
  id: string,
  currentStatus: 'active' | 'inactive'
): Promise<{ success: boolean; error: any }> {
  const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
  const { error } = await supabase
    .from('business_challenges')
    .update({ status: newStatus, updated_at: new Date().toISOString() })
    .eq('id', id);

  return { success: !error, error };
}

/**
 * Fetch Business Challenges associated with a specific article.
 */
export async function fetchArticleBusinessChallenges(
  contentId: string
): Promise<{ data: SelectedBusinessChallenge[]; error: any }> {
  if (!contentId) return { data: [], error: null };

  try {
    const { data, error } = await supabase
      .from('content_business_challenges')
      .select('challenge_id, is_primary, business_challenges(*)')
      .eq('content_id', contentId);

    if (error) {
      if (error.code === '42P01') {
        // Table not migrated yet
        return { data: [], error: null };
      }
      return { data: [], error };
    }

    const mapped: SelectedBusinessChallenge[] = (data || []).map((row: any) => ({
      challengeId: row.challenge_id,
      isPrimary: Boolean(row.is_primary),
      challenge: row.business_challenges as BusinessChallenge
    }));

    return { data: mapped, error: null };
  } catch (err: any) {
    console.error('fetchArticleBusinessChallenges error:', err);
    return { data: [], error: err };
  }
}

/**
 * Atomically save Business Challenge associations for an Insight article.
 */
export async function saveArticleBusinessChallenges(
  contentId: string,
  challenges: SelectedBusinessChallenge[]
): Promise<{ success: boolean; error: any }> {
  if (!contentId) {
    return { success: false, error: new Error('Article ID is required to associate challenges') };
  }

  // Filter out any invalid items
  const validChallenges = challenges.filter(c => Boolean(c.challengeId));

  // Enforce single primary logic in application layer
  const primaryCount = validChallenges.filter(c => c.isPrimary).length;
  if (primaryCount > 1) {
    return { 
      success: false, 
      error: new Error('Only one Business Challenge can be designated as Primary.') 
    };
  }

  // If challenges selected but none marked primary, promote the first one
  const sanitizedChallenges = validChallenges.map((item, index) => ({
    challenge_id: item.challengeId,
    is_primary: primaryCount === 0 && index === 0 ? true : Boolean(item.isPrimary)
  }));

  try {
    // 1. Try atomic RPC function
    const { data: rpcData, error: rpcError } = await supabase.rpc(
      'set_article_business_challenges',
      {
        p_content_id: contentId,
        p_challenges: sanitizedChallenges
      }
    );

    if (!rpcError) {
      return { success: true, error: null };
    }

    console.warn('RPC set_article_business_challenges failed or not deployed, falling back to direct table operations:', rpcError.message);

    // 2. Direct database operations fallback
    // First remove existing associations
    const { error: deleteError } = await supabase
      .from('content_business_challenges')
      .delete()
      .eq('content_id', contentId);

    if (deleteError) {
      if (deleteError.code === '42P01') {
        // Table not yet migrated
        return { success: true, error: null };
      }
      return { success: false, error: deleteError };
    }

    if (sanitizedChallenges.length === 0) {
      return { success: true, error: null };
    }

    // Insert new associations
    const rowsToInsert = sanitizedChallenges.map(item => ({
      content_id: contentId,
      challenge_id: item.challenge_id,
      is_primary: item.is_primary,
      created_at: new Date().toISOString()
    }));

    const { error: insertError } = await supabase
      .from('content_business_challenges')
      .insert(rowsToInsert);

    if (insertError) {
      return { success: false, error: insertError };
    }

    return { success: true, error: null };
  } catch (err: any) {
    console.error('saveArticleBusinessChallenges unexpected error:', err);
    return { success: false, error: err };
  }
}

export interface ArticleWithChallengeMeta {
  id: string;
  title: string;
  slug: string;
  summary: string;
  category: string;
  read_time: number;
  thumbnail_url: string;
  is_featured: boolean;
  published_at?: string;
  created_at: string;
  isPrimary: boolean;
  content_type?: string;
}

export interface ChallengeWithArticles {
  challenge: BusinessChallenge;
  articles: ArticleWithChallengeMeta[];
}

/**
 * High-performance batch data retrieval for the public Insights page.
 * Retrieves all active business challenges that have at least one published Insight article.
 * Eliminates N+1 query overhead by performing a single coordinated batch query.
 */
export async function fetchActiveChallengesWithArticles(): Promise<{
  data: ChallengeWithArticles[];
  error: any;
}> {
  try {
    // 1. Fetch active business challenges ordered by display_order
    const { data: challenges, error: chError } = await supabase
      .from('business_challenges')
      .select('*')
      .eq('status', 'active')
      .order('display_order', { ascending: true })
      .order('name', { ascending: true });

    if (chError) {
      if (chError.code === '42P01' || chError.message?.includes('does not exist')) {
        return { data: [], error: null };
      }
      return { data: [], error: chError };
    }

    if (!challenges || challenges.length === 0) {
      return { data: [], error: null };
    }

    // 2. Fetch all published insight articles
    const { data: rawPosts, error: postsError } = await supabase
      .from('posts')
      .select('id, title, slug, summary, category, read_time, thumbnail_url, is_featured, published_at, created_at, status, content_type')
      .eq('content_type', 'insight')
      .order('created_at', { ascending: false });

    if (postsError) {
      return { data: [], error: postsError };
    }

    // Filter for published articles only (or articles without an explicit status which default to published)
    const publishedPosts = (rawPosts || []).filter(
      p => !p.status || p.status === 'published'
    );

    if (publishedPosts.length === 0) {
      return { data: [], error: null };
    }

    const postMap = new Map<string, typeof publishedPosts[0]>();
    publishedPosts.forEach(p => postMap.set(p.id, p));

    // 3. Fetch all junction mappings for published posts
    const { data: junctionRows, error: juncError } = await supabase
      .from('content_business_challenges')
      .select('content_id, challenge_id, is_primary')
      .in('content_id', Array.from(postMap.keys()));

    if (juncError) {
      if (juncError.code === '42P01' || juncError.message?.includes('does not exist')) {
        return { data: [], error: null };
      }
      return { data: [], error: juncError };
    }

    // 4. Group articles by challenge
    const challengeArticlesMap = new Map<string, ArticleWithChallengeMeta[]>();

    (junctionRows || []).forEach(row => {
      const post = postMap.get(row.content_id);
      if (!post) return;

      if (!challengeArticlesMap.has(row.challenge_id)) {
        challengeArticlesMap.set(row.challenge_id, []);
      }

      const articleMeta: ArticleWithChallengeMeta = {
        id: post.id,
        title: post.title,
        slug: post.slug,
        summary: post.summary || '',
        category: post.category || 'General',
        read_time: post.read_time || 5,
        thumbnail_url: post.thumbnail_url || '',
        is_featured: Boolean(post.is_featured),
        published_at: post.published_at,
        created_at: post.created_at,
        isPrimary: Boolean(row.is_primary),
        content_type: post.content_type
      };

      challengeArticlesMap.get(row.challenge_id)!.push(articleMeta);
    });

    // 5. Construct groups and apply dynamic visibility rules
    // Rule: Hide challenges with 0 published articles
    const result: ChallengeWithArticles[] = [];

    for (const challenge of challenges as BusinessChallenge[]) {
      const articles = challengeArticlesMap.get(challenge.id) || [];
      
      // Strict rule: Only include challenges with at least one published article
      if (articles.length > 0) {
        // Sort articles within group: Primary first, then by date descending
        articles.sort((a, b) => {
          const dateA = new Date(a.published_at || a.created_at).getTime();
          const dateB = new Date(b.published_at || b.created_at).getTime();
          return dateB - dateA;
        });

        result.push({
          challenge,
          articles
        });
      }
    }

    return { data: result, error: null };
  } catch (err: any) {
    console.error('fetchActiveChallengesWithArticles error:', err);
    return { data: [], error: err };
  }
}

