# Project Rules and Guidelines

## Supabase Data API Access (Post-May 2026)

To ensure compatibility with Supabase's updated Data API access policies, any SQL script that creates a new table or function in the `public` schema MUST include explicit `GRANT` statements. This ensures that the `anon`, `authenticated`, and `service_role` roles have the necessary permissions to access these objects via `supabase-js`, PostgREST, or GraphQL.

### ⚠️ IMPORTANT NOTE ON DATABASE COMPATIBILITY
* **Existing Schema & Tables**: There is **absolutely zero impact** on the existing database. No changes, updates, or modifications are required for any already deployed tables or schemas; they retain their current implicit grants and will continue working perfectly.
* **New Deployments Only**: The requirement for explicit `GRANT` SQL queries applies **exclusively to newly deployed database schemas or new tables** created in the public schema on or after October 30.

### Rule for Table Creation
When creating a new table (e.g., `public.my_table`), always append the following grants:

```sql
-- Grant access for Data API
GRANT SELECT ON public.my_table TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.my_table TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.my_table TO service_role;

-- Enable RLS (as per project standard)
ALTER TABLE public.my_table ENABLE ROW LEVEL SECURITY;
```

### Rule for Function Creation
When creating a new function accessible via RPC, append:

```sql
-- Grant execution permission
GRANT EXECUTE ON FUNCTION public.my_function(arg_type) TO anon, authenticated, service_role;
```

---

## Model Selection

- Prefer GA models over preview models.
- As of May 2026, use `gemini-3.1-flash-lite` for high-throughput, low-latency tasks.

---

## Gemini & Backend Architecture

- **Supabase Edge Functions Only**: All Gemini AI reasoning, intelligence generation, and strategic logic MUST be executed via Supabase Edge Functions (e.g., `gtmos-api`).
- **No Express AI Endpoints**: Do not create or use AI reasoning routes in `server.ts`. This bypasses hosting environment restrictions and ensures that the `GEMINI_API_KEY` remains strictly backend-side and invisible to the client.
- **Implementation Pattern**: Always use `supabase.functions.invoke('gtmos-api', { body: { action: '...', payload: { ... } } })` for AI features.

---

## RevOS User Role Hierarchy & Authorization

This role hierarchy establishes the foundation for all role-based access control (RBAC) across the RevOS platform. Maintain consistency with this definition in database schema designs, row-level security (RLS) rules, client navigation structures, and API authorizations.

| Role | Purpose |
| :--- | :--- |
| **Guest** | Public exploration |
| **Free User** | Limited self-service usage |
| **Paid User** | Full professional access |
| **Enterprise User** | Collaborative enterprise access |
| **Workspace Admin** | Workspace governance |
| **Enterprise Executive** | Executive intelligence visibility |
| **RevOS Admin** | Platform operations management |
| **Super Admin** | Full system-level authority |

---

## RevOS Strict Per-User Data Isolation Protocol (Mandatory)

All new features, engines, database tables, Edge Functions, client services, and UI components across **RevOS** (GTMOS, Lead Qualification, Pipeline Assessment, and any future modules) MUST strictly enforce per-user multi-tenant data isolation across all four application layers:

1. **Zero Cross-User Access & Zero Role Bypass**:
   - Every user-created workspace record (projects, campaigns, leads, opportunities, assessments, evidence, strategies, snapshots, reports, drafts, and executive insights) belongs strictly to the authenticated creator (`auth.uid()`).
   - **No Admin/Executive Bypass**: Roles in the RBAC hierarchy above (including `Super Admin`, `RevOS Admin`, `Workspace Admin`, and `Enterprise Executive`) govern platform/feature access only—they MUST NEVER bypass per-user record isolation or read/modify/run AI reasoning on another account's RevOS records.

2. **Database Schema & Row Level Security (RLS)**:
   - **Root Tables**: Every new root RevOS table MUST include an indexed ownership column (`created_by UUID REFERENCES auth.users(id) ON DELETE CASCADE DEFAULT auth.uid()`, or `creator_id` / `user_id` when matching an existing engine schema).
   - **Child Tables**: Child tables MUST enforce ownership through foreign-key `EXISTS (...)` policies joining back to the root table's `auth.uid()` owner.
   - **No Anonymous or Shared Policies**: For all private RevOS tables (overriding the generic `anon` `SELECT` snippet above), explicitly `REVOKE ALL ON TABLE public.<table_name> FROM anon;`, grant `SELECT, INSERT, UPDATE, DELETE` only to `authenticated` and `service_role`, drop any permissive `USING (true)` policies, and define strict `TO authenticated` policies checking `created_by = auth.uid()` in both `USING` and `WITH CHECK`. Never allow `'workspace_default'` or `NULL` ownership fallbacks.

3. **Supabase Edge Functions**:
   - **Mandatory JWT Verification**: Every Edge Function endpoint MUST validate the caller's `Authorization: Bearer <token>` via `supabase.auth.getUser(token)` (returning `401` on missing, anon-key, malformed, or expired tokens; allowing only exact `SUPABASE_SERVICE_ROLE_KEY` for internal server-to-server calls).
   - **Record Ownership Checks**: Before reading, mutating, or calling Gemini on any entity (`pipeline_id`, `opportunity_id`, `assessment_id`, `session_id`, `leadId`, etc.), verify that the record (or its parent) is owned by `user.id` and return `403 Forbidden` on mismatch.
   - **Server-Derived Identity**: Never trust client-supplied `user_id`, `created_by`, or `'workspace_default'` strings—derive effective identity from the verified JWT user and reject conflicting client IDs with `403`.

4. **Frontend Services, Contexts & Browser Storage**:
   - **Query & Write Scoping**: Always resolve the active user via `resolveAuthenticatedRevOSUserId()` (`src/apps/revos/utils/userIsolation.ts`). Return empty results immediately if unauthenticated; filter all `SELECT`/`UPDATE`/`DELETE` queries by the owner column, and stamp ownership (`created_by` / `creator_id` / `user_id`) on every `INSERT`/`UPSERT`.
   - **User-Scoped Storage**: Never read or write RevOS domain caches, draft IDs, deleted-ID lists, or form snapshots under bare `localStorage` keys. Always use `getScopedStorageItem`, `setScopedStorageItem`, and `removeScopedStorageItem` (`revos_u_<userId>__...`).
   - **Account Switch / Sign-Out Cleanup**: Subscribe to `subscribeRevOSUserChange` in stateful modules/hooks to clear in-memory state and reload data whenever the authenticated user changes. Any new RevOS `localStorage` key prefix MUST also be registered in `WORKSPACE_CACHE_PREFIXES` inside `src/apps/revos/utils/userIsolation.ts` so `clearAllRevOSWorkspaceCaches()` scrubs it on sign-out or account switch.

5. **Verification Requirement**:
   - Every new RevOS component, database migration, or Edge Function route MUST include automated test coverage (following `tests/strictUserIsolation.test.ts`) verifying unauthenticated rejection (`401`), cross-user and `super_admin` rejection (`403`), and clean browser cache isolation across account switches.

